import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,chmod} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
const path='.env.local';
if(!process.argv.includes('--local')) {console.error('Usage: node --env-file=.env.local scripts/configure-payment-backend.mjs --local');process.exit(1);}
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
if(!url || !['localhost','127.0.0.1'].includes(new URL(url).hostname)){console.error('Local server-only Supabase configuration required.');process.exit(1);}
let adminKey=process.env.SUPABASE_SECRET_KEY;
if(!adminKey){
 try{const status=JSON.parse(execFileSync('pnpm',['exec','supabase','status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));
 if(status.API_URL!==url)throw new Error();adminKey=status.SECRET_KEY??status.SERVICE_ROLE_KEY;
 }catch{console.error('Local Supabase status is unavailable or refers to another stack.');process.exit(1);}
}
const client=createClient(url,adminKey,{auth:{persistSession:false,autoRefreshToken:false}});
const token=process.env.PAYMENT_BACKEND_TOKEN||'pmw_'+randomBytes(32).toString('hex');
const result=await client.rpc('set_payment_backend_token',{p_token:token});
if(result.error){console.error('Backend credential provisioning failed.');process.exit(1);}
let contents=await readFile(path,'utf8');
if(/^PAYMENT_BACKEND_TOKEN=/m.test(contents)) contents=contents.replace(/^PAYMENT_BACKEND_TOKEN=.*$/m,'PAYMENT_BACKEND_TOKEN='+token);else contents+='\nPAYMENT_BACKEND_TOKEN='+token+'\n';
if(!/^PAYMENT_WEBHOOK_SECRETS_JSON=/m.test(contents)) contents+='PAYMENT_WEBHOOK_SECRETS_JSON={}\n';
await writeFile(path,contents,{mode:0o600});await chmod(path,0o600);
console.log('Local payment backend configured. Restart Next and start pnpm payments:worker. No secret was printed.');
