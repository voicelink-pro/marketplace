// Operator tool; all mutations are explicitly sandbox fixtures. Never prints credentials.
import{execFileSync}from'node:child_process';import{createClient}from'@supabase/supabase-js';
const args=process.argv.slice(2),command=args[0];const flag=name=>{const i=args.indexOf('--'+name);return i<0?undefined:args[i+1]};
const required=name=>{const v=flag(name);if(!v||v.startsWith('--'))throw Error('Missing --'+name);return v};
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,pub=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,backend=process.env.PAYMENT_BACKEND_TOKEN;
if(!url||!pub)throw Error('Supabase environment missing');
const options={auth:{persistSession:false,autoRefreshToken:false}},client=createClient(url,pub,{...options,accessToken:async()=>null});
async function rpc(c,name,params){const r=await c.rpc(name,params);if(r.error)throw Error(r.error.message.match(/^[a-z_]+$/)?.[0]??'Operator request failed');return r.data}
async function operator(){let key=process.env.SUPABASE_SECRET_KEY;if(!key){if(!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw Error('Provide operator environment securely');let s;try{s=JSON.parse(execFileSync('pnpm',['exec','supabase','status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}))}catch{throw Error('Local operator credentials unavailable')};if(s.API_URL!==url)throw Error('Wrong local stack');key=s.SECRET_KEY??s.SERVICE_ROLE_KEY}return createClient(url,key,options)}
try{
 if(!args.includes('--fixture'))throw Error('Explicit --fixture required; live accounting is disabled');
 switch(command){
 case'policy':{const fee=Number(required('fee-bps'));if(!Number.isInteger(fee)||fee<0||fee>10000)throw Error('Invalid fee');await rpc(await operator(),'configure_commission_sandbox',{p_fee_bps:fee,p_effective_at:required('effective-at')});break}
 case'basis':await rpc(client,'declare_commission_basis',{p_backend:backend,p_transaction:required('transaction'),p_basis_minor:required('amount-minor')});break;
 case'basis-all':{if(!args.includes('--paid-including-tax'))throw Error('Explicit --paid-including-tax fixture assumption required');const app=required('app');let count=0;for(;;){const inputs=await rpc(client,'commission_sandbox_inputs',{p_backend:backend,p_app_id:app});if(!inputs.length)break;for(const t of inputs){await rpc(client,'declare_commission_basis',{p_backend:backend,p_transaction:t.id,p_basis_minor:t.amount_minor});count++}}console.log('Sandbox bases declared: '+count);break}
 case'fund':await rpc(await operator(),'fund_commission_sandbox',{p_app_id:required('app'),p_currency:required('currency'),p_amount_minor:required('amount-minor'),p_reference:required('reference')});break;
 case'close':console.log(await rpc(client,'close_commission_month',{p_backend:backend,p_app_id:required('app'),p_month:required('month')}));break;
 case'simulate-payout':await rpc(await operator(),'simulate_commission_payout',{p_earning:required('earning'),p_paid:args.includes('--paid')});break;
 default:throw Error('Commands: policy, basis, basis-all, fund, close, simulate-payout. See docs/COMMISSION_ACCOUNTING.md')
 }
 console.log('Sandbox operation completed. No real funds moved.');
}catch(e){console.error(e instanceof Error?e.message:'Sandbox operation failed');process.exitCode=1}
