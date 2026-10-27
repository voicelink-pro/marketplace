// Node 24+ strips the adapter's TypeScript; no privileged Supabase key is used.
import { reportWorkerHealth } from './worker-health.mjs';
import { createClient } from '@supabase/supabase-js';
import { normalizePaymentEvent, providerSchema } from '../src/modules/payments/adapters.ts';
const token=process.env.PAYMENT_BACKEND_TOKEN;
if(!token || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  console.error('Payment worker configuration is missing. See docs/PAYMENT_INTEGRATIONS.md.');process.exit(1);
}
const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{accessToken:async()=>null,auth:{persistSession:false,autoRefreshToken:false}});
const integrationIndex=process.argv.indexOf('--integration');
const integrationId=integrationIndex<0?undefined:process.argv[integrationIndex+1];
if(integrationIndex>=0&&!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(integrationId??''))throw new Error('Invalid --integration.');
let running=true;
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>{running=false;});
do {
 const claimed=await client.rpc('claim_payment_events',{p_backend:token,p_limit:20,p_integration:integrationId});
 if(claimed.error) {await reportWorkerHealth(client,token,'payments',integrationId,false);console.error('Payment queue unavailable.');process.exitCode=1;break;}
 let iterationOk=true;
 for(const job of claimed.data??[]) {
  let normalized=null,failure=null;
  try {normalized=normalizePaymentEvent(providerSchema.parse(job.provider),job.raw,job.account);}
  catch {failure='adapter_error';}
  const result=await client.rpc('apply_payment_event',{p_backend:token,p_event:job.id,p_lease:job.lease,p_normalized:normalized,p_failure:failure});
  if(result.error) {iterationOk=false;console.error('Payment event lease could not be completed.');}
  else console.log('Payment event result: '+result.data); // fixed result codes only, no payload/IDs/secrets
 }
 await reportWorkerHealth(client,token,'payments',integrationId,iterationOk);
 if(process.argv.includes('--once')) break;
 if(running && (claimed.data?.length??0)===0) await new Promise(resolve=>setTimeout(resolve,2000));
} while(running);
