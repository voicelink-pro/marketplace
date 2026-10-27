import { reportWorkerHealth } from './worker-health.mjs';
import{createClient}from'@supabase/supabase-js';
const token=process.env.PAYMENT_BACKEND_TOKEN;
if(!token||!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY){console.error('Commission worker configuration missing.');process.exit(1)}
const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{accessToken:async()=>null,auth:{persistSession:false,autoRefreshToken:false}});
const appIndex=process.argv.indexOf('--app');const appId=appIndex<0?undefined:process.argv[appIndex+1];if(appIndex>=0&&!/^[0-9a-f-]{36}$/i.test(appId??''))throw Error('Invalid --app');
let running=true;for(const s of['SIGINT','SIGTERM'])process.on(s,()=>{running=false});
do{const r=await c.rpc('process_commission_jobs',{p_backend:token,p_limit:50,p_app_id:appId});if(r.error){await reportWorkerHealth(c,token,'commissions',appId,false);console.error('Commission queue unavailable.');process.exitCode=1;break}for(const row of r.data??[])console.log('Commission result: '+row.status+(row.error_code?' / '+row.error_code:''));await reportWorkerHealth(c,token,'commissions',appId,true);if(process.argv.includes('--once'))break;if(running)await new Promise(resolve=>setTimeout(resolve,2000))}while(running);
