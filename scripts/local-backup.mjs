// Local-only recovery drill. Source database is read-only; restore targets a fresh, random database.
import { spawn, execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { createInterface } from 'node:readline';
import { pipeline } from 'node:stream/promises';
const args = process.argv.slice(2), command = args[0];
const flag = name => { const i = args.indexOf('--' + name); return i < 0 ? undefined : args[i + 1]; };
const container = 'supabase_db_marketplace-roch';
const schemas = ['public', 'private', 'auth', 'storage', 'supabase_migrations'];
function psql(db, sql) {
  return execFileSync('docker', ['exec', '-i', container, 'psql', '-X', '-q', '-U', 'postgres', '-d', db, '-At', '-v', 'ON_ERROR_STOP=1'], { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 }).trim();
}
const inventoryFunction = `create function pg_temp.backup_inventory() returns jsonb language plpgsql as $$
declare t record; n text; digest text; result jsonb:='[]';
begin
 for t in select schemaname,tablename from pg_tables where schemaname in('public','private','auth','storage','supabase_migrations') order by schemaname,tablename loop
  execute format('select count(*)::text,md5(coalesce(string_agg(md5(to_jsonb(r)::text),'''' order by md5(to_jsonb(r)::text)),'''')) from %I.%I r',t.schemaname,t.tablename) into n,digest;
  result:=result||jsonb_build_array(jsonb_build_object('schema',t.schemaname,'table',t.tablename,'rows',n,'digest',digest));
 end loop;return result;
end; $$;`;
async function sha(path) { const hash = createHash('sha256');for await (const chunk of createReadStream(path)) hash.update(chunk);return hash.digest('hex'); }
async function writeProcess(executableArgs, file) {
  const output = createWriteStream(file, { flags: 'wx', mode: 0o600 });
  const child = spawn('docker', executableArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
  // Diagnostic output may include sensitive database values; never echo it.
  child.stderr.resume();
  const completed = new Promise((resolve, reject) => { child.once('error', reject);child.once('close', code => code === 0 ? resolve() : reject(new Error('Backup subprocess failed.'))); });
  await Promise.all([pipeline(child.stdout, output), completed]);
}
function snapshotSession() {
  const child = spawn('docker', ['exec', '-i', container, 'psql', '-X', '-q', '-U', 'postgres', '-d', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1'], { stdio: ['pipe', 'pipe', 'pipe'] });
  child.stderr.resume();
  const lines = createInterface({ input: child.stdout });
  const buffered = [], readers = [];
  let failure;
  lines.on('line', line => { if (!line.trim()) return;const next = readers.shift();if (next) next.resolve(line);else buffered.push(line); });
  child.on('error', () => { failure = new Error('Snapshot session unavailable.');for (const r of readers.splice(0)) r.reject(failure); });
  child.on('close', code => { if (code !== 0) { failure = new Error('Snapshot session failed.');for (const r of readers.splice(0)) r.reject(failure); } });
  return {
    child,
    read: () => buffered.length ? Promise.resolve(buffered.shift()) : failure ? Promise.reject(failure) : new Promise((resolve, reject) => readers.push({ resolve, reject })),
    send: sql => child.stdin.write(sql + '\n'),
    close: () => child.stdin.end('rollback;\n'),
  };
}
async function backup(file) {
  const snapshot = snapshotSession();
  try {
    snapshot.send(inventoryFunction);
    snapshot.send('begin isolation level repeatable read read only; select pg_export_snapshot();');
    const id = await snapshot.read();
    if (!/^[0-9A-F-]+$/i.test(id)) throw new Error('Invalid snapshot identifier.');
    snapshot.send('select pg_temp.backup_inventory();');
    const tables = JSON.parse(await snapshot.read());
    await writeProcess(['exec', container, 'pg_dump', '-U', 'postgres', '-d', 'postgres', '--format=custom', '--no-owner', '--snapshot=' + id, ...schemas.flatMap(schema => ['--schema', schema])], file);
    const storage = file + '.storage.tar';
    await writeProcess(['exec', 'supabase_storage_marketplace-roch', 'tar', '-C', '/mnt', '-cf', '-', '.'], storage);
    const manifest = { version: 1, created_at: new Date().toISOString(), source: container, schemas, database_sha256: await sha(file), storage_file: basename(storage), storage_sha256: await sha(storage), tables, scope: 'Local database, Auth data and Storage bytes. Runtime secrets and external providers are separate.' };
    await writeFile(file + '.manifest.json', JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ status: 'pass', operation: 'backup', tables: tables.length, files: ['database', 'storage', 'manifest'], contains_sensitive_data: true }));
  } finally { snapshot.close(); }
}
async function verify(file) {
  const manifest = JSON.parse(await readFile(file + '.manifest.json', 'utf8'));
  if (manifest.version !== 1 || manifest.source !== container || JSON.stringify(manifest.schemas) !== JSON.stringify(schemas) || basename(manifest.storage_file) !== manifest.storage_file) throw new Error('Unsupported backup manifest.');
  const storage = join(dirname(file), manifest.storage_file);
  if (await sha(file) !== manifest.database_sha256 || await sha(storage) !== manifest.storage_sha256) throw new Error('Backup checksum mismatch.');
  const target = 'boostlink_restore_' + randomUUID().replaceAll('-', '');
  let created = false;
  const started = Date.now();
  try {
    psql('postgres', `create database ${target} template template0;`);created = true;
    psql(target, 'drop schema if exists public;create schema extensions;create extension pgcrypto with schema extensions;create extension "uuid-ossp" with schema extensions;');
    // Managed Supabase roles own their own default privileges. A local restore
    // must not impersonate them. Keep explicit object grants/RLS; exclude only
    // DEFAULT ACL entries, matching the provider's documented restore caveat.
    const tocReader = spawn('docker', ['exec', '-i', container, 'pg_restore', '--list'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let toc = '';tocReader.stdout.on('data', chunk => { toc += chunk; });tocReader.stderr.resume();
    const tocDone = new Promise((resolve, reject) => { tocReader.once('error', reject);tocReader.once('close', code => code === 0 ? resolve() : reject(new Error('Archive inventory failed.'))); });
    await Promise.all([pipeline(createReadStream(file), tocReader.stdin), tocDone]);
    const listFile = '/tmp/' + target + '.list';
    execFileSync('docker', ['exec', '-i', container, 'tee', listFile], { input: toc.split('\n').filter(line => !line.includes(' DEFAULT ACL ')).join('\n'), stdio: ['pipe', 'ignore', 'pipe'] });
    const child = spawn('docker', ['exec', '-i', container, 'pg_restore', '-U', 'postgres', '-d', target, '--use-list=' + listFile, '--no-owner', '--exit-on-error', '--single-transaction'], { stdio: ['pipe', 'ignore', 'pipe'] });
    let diagnostics = '';
    child.stderr.on('data', chunk => { diagnostics += chunk; });
    const completed = new Promise((resolve, reject) => { child.once('error', reject);child.once('close', code => code === 0 ? resolve() : reject(new Error('RESTORE_DATABASE: ' + (diagnostics.split('\n').find(line => line.includes('ERROR:')) ?? 'unknown').replace(/"[^"]*"/g, '[object]').slice(0, 200)))); });
    try { await Promise.all([pipeline(createReadStream(file), child.stdin), completed]); }
    finally { execFileSync('docker', ['exec', container, 'rm', '-f', listFile], { stdio: ['ignore', 'ignore', 'pipe'] }); }
    const restored = JSON.parse(psql(target, inventoryFunction + 'select pg_temp.backup_inventory();'));
    if (JSON.stringify(restored) !== JSON.stringify(manifest.tables)) throw new Error('Restored row counts or table fingerprints differ.');
    const invariant = psql(target, `select not exists(select 1 from public.commission_journals where not private.commission_entries_balanced(entries));`);
    if (invariant !== 't') throw new Error('Restored accounting invariant failed.');
    const isolated = psql(target, `begin;set local role authenticated;select set_config('request.jwt.claims','{"sub":"${randomUUID()}","role":"authenticated"}',true);select count(*) from public.organizations;rollback;`).split('\n').at(-1);
    if (isolated !== '0') throw new Error('Restored RLS isolation failed.');
    // Extraction targets a new scratch directory inside the storage container,
    // never /mnt. Checksums and a successful unpack verify the local file archive.
    const scratch = '/tmp/' + target;
    execFileSync('docker', ['exec', 'supabase_storage_marketplace-roch', 'mkdir', scratch], { stdio: ['ignore', 'ignore', 'pipe'] });
    try {
      const unpack = spawn('docker', ['exec', '-i', 'supabase_storage_marketplace-roch', 'tar', '-xf', '-', '-C', scratch], { stdio: ['pipe', 'ignore', 'pipe'] });unpack.stderr.resume();
      const done = new Promise((resolve, reject) => { unpack.once('error', reject);unpack.once('close', code => code === 0 ? resolve() : reject(new Error('Storage restore failed.'))); });
      await Promise.all([pipeline(createReadStream(storage), unpack.stdin), done]);
    } finally { execFileSync('docker', ['exec', 'supabase_storage_marketplace-roch', 'rm', '-rf', scratch], { stdio: ['ignore', 'ignore', 'pipe'] }); }
    console.log(JSON.stringify({ status: 'pass', operation: 'restore_drill', tables: restored.length, exact_table_fingerprints: true, balanced_journals: true, foreign_user_rls: true, storage_unpacked_to_scratch: true, managed_default_privileges_excluded: true, duration_seconds: Math.ceil((Date.now() - started) / 1000), source_database_unchanged: true }));
  } finally { if (created) psql('postgres', `drop database ${target} with (force);`); }
}
try {
  if (!args.includes('--local')) throw new Error('Explicit --local is required. This tool does not support remote projects.');
  const file = flag(command === 'backup' ? 'output' : 'file');
  if (!file || !isAbsolute(file)) throw new Error('Provide an absolute --output or --file path.');
  if (command === 'backup') await backup(file);
  else if (command === 'verify') await verify(file);
  else throw new Error('Commands: backup --local --output <absolute path>, verify --local --file <absolute path>.');
} catch (error) {
  if (error instanceof Error && error.message.startsWith('RESTORE_DATABASE:')) console.error(error.message);
  // Database dumps and pg_restore diagnostics can contain secrets or PII.
  console.error('Local backup/recovery failed. Source data was not reset. Check prerequisites and the recovery runbook.');process.exitCode = 1;
}
