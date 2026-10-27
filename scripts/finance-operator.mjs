// Explicit sandbox fault injection. Never reads app-sale credentials or prints secrets.
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf('--' + name); return i < 0 ? undefined : args[i + 1]; };
const required = name => { const value = flag(name); if (!value || value.startsWith('--')) throw new Error('Missing --' + name); return value; };
async function main() {
  if (!args.includes('--fixture')) throw new Error('Explicit --fixture required. Live finance is disabled.');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Supabase environment missing.');
  let key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    if (!['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw new Error('Operator credentials required.');
    let status;
    try { status = JSON.parse(execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); }
    catch { throw new Error('Local operator credentials unavailable.'); }
    if (status.API_URL !== url) throw new Error('Wrong local stack.');
    key = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;
  }
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  let result;
  if (args[0] === 'scenario') result = await client.rpc('finance_test_scenario', { p_job: required('job'), p_scenario: required('scenario') });
  else if (args[0] === 'resolve') result = await client.rpc('finance_test_resolve', { p_job: required('job'), p_state: required('state') });
  else if (args[0] === 'return') result = await client.rpc('finance_test_return', { p_payout: required('payout') });
  else throw new Error('Commands: scenario, resolve, return. See docs/FUNDING_AND_PAYOUTS.md.');
  if (result.error) throw new Error(result.error.message.match(/^[a-z_]+$/)?.[0] ?? 'Sandbox operator request rejected.');
  console.log('Sandbox provider fixture updated. No real funds moved.');
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Sandbox operation failed.'); process.exitCode = 1; });
