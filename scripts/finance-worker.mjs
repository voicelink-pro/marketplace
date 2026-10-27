import { reportWorkerHealth } from './worker-health.mjs';
import { createClient } from '@supabase/supabase-js';
import { sandboxProvider } from '../src/modules/finance/provider.mjs';
const backend = process.env.PAYMENT_BACKEND_TOKEN;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!backend || !url || !key) throw new Error('Finance worker configuration missing.');
const appIndex = process.argv.indexOf('--app');
const appId = appIndex < 0 ? undefined : process.argv[appIndex + 1];
if (appIndex >= 0 && !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(appId ?? '')) throw new Error('Invalid --app.');
const client = createClient(url, key, { accessToken: async () => null, auth: { persistSession: false, autoRefreshToken: false } });
const provider = sandboxProvider(client, backend);
async function rpc(name, args = {}) {
  const r = await client.rpc(name, { p_backend: backend, p_app_id: appId, ...args });
  if (r.error) throw new Error('Finance queue unavailable.');
  return r.data;
}
let running = true;
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { running = false; });
try {
  do {
    await rpc('finance_reconcile');
    await rpc('finance_schedule_auto');
    for (let i = 0; i < 100 && running; i++) {
      const job = await rpc('finance_claim');
      if (!job) break;
      // A crash or transport failure keeps the lease/reservations. Another worker
      // looks up the same provider object after expiry, using exactly the same key.
      console.log('Sandbox finance: ' + await provider.execute(job));
    }
    await reportWorkerHealth(client, backend, 'finance', appId, true);
    if (process.argv.includes('--once')) break;
    if (running) await new Promise(resolve => setTimeout(resolve, 2000));
  } while (running);
} catch {
  await reportWorkerHealth(client, backend, 'finance', appId, false);
  console.error('Finance worker failed; pending leases will be reconciled. No credentials or payloads logged.');
  process.exitCode = 1;
}
