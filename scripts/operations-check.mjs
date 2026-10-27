import { createClient } from '@supabase/supabase-js';
import { evaluateOperationsHealth } from './worker-health.mjs';
const backend = process.env.PAYMENT_BACKEND_TOKEN, url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!backend || !url || !key) throw new Error('Operations check configuration missing.');
const client = createClient(url, key, { accessToken: async () => null, auth: { persistSession: false, autoRefreshToken: false } });
try {
  const r = await client.rpc('ops_health', { p_backend: backend });
  if (r.error || !r.data) throw new Error('Operations health unavailable.');
  const result = evaluateOperationsHealth(r.data);
  console.log(JSON.stringify(result));
  process.exitCode = result.status === 'ok' ? 0 : 2;
} catch {
  console.error('Operations check failed.');process.exitCode = 1;
}
