import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const args=process.argv.slice(2);
const app=args[args.indexOf('--app-id')+1];
const out=args[args.indexOf('--out')+1];
if(!args.includes('--app-id') || !args.includes('--out') || !/^[a-f0-9-]{36}$/i.test(app??'') || !out) {
  console.error('Usage: node --env-file=.env.local scripts/attribution-key.mjs --app-id UUID --out /private/path/boostlink.env');
  process.exit(1);
}
const env=process.env;
if(!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
  console.error('Missing server-only Supabase credentials. See docs/ATTRIBUTION_INTEGRATION.md.'); process.exit(1);
}
// Reserve the output first so a typo/existing file never rotates a key accidentally.
const {open}=await import('node:fs/promises');
const path=resolve(out);
let file;
try { file=await open(path,'wx',0o600); }
catch { console.error('Output file must not exist and its parent directory must be writable.'); process.exit(1); }
try {
  const client=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await client.rpc('rotate_attribution_api_key',{p_app_id:app});
  if(error || typeof data!=='string') throw new Error('Key rotation failed. Check application ID and permissions.');
  await file.writeFile(`BOOSTLINK_API_URL=${env.NEXT_PUBLIC_SITE_URL??'http://localhost:3000'}\nBOOSTLINK_APP_API_KEY=${data}\n`);
  console.log('Sandbox credential saved with mode 0600 to '+path+'. Previous keys for this app are revoked.');
} catch {
  console.error('Key provisioning failed. No credential was printed. Check configuration and retry with a new output file.'); process.exitCode=1;
} finally { await file.close(); }
