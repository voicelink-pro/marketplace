// Reproducible local HTTP acceptance with disposable fixtures and its own server.
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const backend = 'pmw_e9_pilot_fixture_backend_000000000000000000000000000000000000';
const webhook = 'fixture_e9_pilot_webhook_000000000000000000000000000000000000';
const base = 'http://127.0.0.1:3109';
function run(args, env) { return new Promise((resolve, reject) => { const child = spawn('pnpm', args, { env, stdio: 'inherit' });child.once('error', reject);child.once('close', code => code === 0 ? resolve() : reject(new Error('Pilot acceptance command failed.'))); }); }
let server;
try {
  const status = JSON.parse(execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  if (!['127.0.0.1', 'localhost'].includes(new URL(status.API_URL).hostname)) throw new Error('Local Supabase required.');
  const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: status.API_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY ?? status.ANON_KEY, NEXT_PUBLIC_SITE_URL: base, PAYMENT_BACKEND_TOKEN: backend, PAYMENT_WEBHOOK_SECRETS_JSON: JSON.stringify({ E9_PILOT_GENERIC: webhook }), E9_HTTP_BASE_URL: base, E8_HTTP_BASE_URL: base, E9_RECOVERY_DRILL: '1' };
  delete env.SUPABASE_SECRET_KEY;delete env.LOCAL_PGLITE_SANDBOX;
  await run(['build'], env);
  server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', '3109'], { env, stdio: ['ignore', 'inherit', 'inherit'] });
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null) throw new Error('Pilot test port is unavailable.');
    try { const r = await fetch(base + '/login', { signal: AbortSignal.timeout(1000) });if (r.ok) { ready = true;break; } } catch { /* Wait for this server's startup. */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('Pilot server did not start.');
  await run(['test:integration'], { ...env, SUPABASE_SECRET_KEY: status.SECRET_KEY ?? status.SERVICE_ROLE_KEY });
} catch {
  console.error('Local pilot acceptance failed. No live payment adapter was enabled.');process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) { const closed = new Promise(resolve => server.once('close', resolve));server.kill('SIGTERM');await closed; }
}
