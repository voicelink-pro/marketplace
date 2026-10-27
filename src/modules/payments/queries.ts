import 'server-only';
import {z} from 'zod';
import {getViewer} from '@/modules/accounts/viewer';
import {createClient} from '@/lib/supabase/server';
import {logUnexpected} from '@/lib/log';
import {webhookSecret} from './ingress';
export async function getPaymentIntegrations(appId:string){
 const client=await createClient();
 const [integrations,plans,mappings,sources,events]=await Promise.all([
  client.from('payment_integrations').select('*').eq('app_id',appId).order('configured_at'),
  client.from('app_plans').select('id,name,external_plan_key,is_active').eq('app_id',appId),
  client.from('payment_plan_mappings').select('*').eq('app_id',appId),
  client.from('payment_sources').select('*').eq('app_id',appId),
  client.from('payment_events').select('id,integration_id,event_ref,environment,status,kind,error_code,attempts,conflicting_deliveries,received_at,processed_at').eq('app_id',appId).order('received_at',{ascending:false}).limit(50),
 ]);
 for(const r of [integrations,plans,mappings,sources,events])if(r.error){logUnexpected('payments.workspace',{code:r.error.code,message:'Cannot load payment integration workspace.'});throw new Error('Payment integrations are temporarily unavailable.');}
 return {integrations:(integrations.data??[]).map(row=>{let credentialReady=false;try{webhookSecret(row.credential_ref);credentialReady=true;}catch{}return {...row,credentialReady};}),plans:plans.data??[],mappings:mappings.data??[],sources:sources.data??[],events:events.data??[]};
}
export async function getPaymentMetrics(appId?:string,company=false){
 const client=await createClient();const viewer=await getViewer();if(!viewer)throw new Error('Authentication required.');const r=await client.rpc('payment_metrics',{p_app_id:appId,p_creator_id:company?undefined:viewer.userId});
 if(r.error){logUnexpected('payments.metrics',{code:r.error.code,message:'Cannot load payment metrics.'});throw new Error('Payment metrics unavailable.');}
 return z.object({paying_customers:z.number().int().nonnegative(),active_paying_subscribers:z.number().int().nonnegative()}).parse(r.data);
}
export async function getCustomerPaymentTimeline(customer?:string,appId?:string,company=false){
 const client=await createClient();const viewer=await getViewer();if(!viewer)throw new Error('Authentication required.');const r=await client.rpc('payment_customer_timeline',{p_referral:customer,p_app_id:appId,p_creator_id:company?undefined:viewer.userId});
 if(r.error){logUnexpected('payments.timeline',{code:r.error.code,message:'Cannot load payment timeline.'});throw new Error('Payment timeline unavailable.');}
 return z.array(z.object({event_id:z.uuid(),referral_id:z.uuid(),kind:z.string(),state:z.string().nullable(),occurred_at:z.iso.datetime({offset:true}),amount_minor:z.string().nullable(),currency:z.string().nullable()})).parse(r.data);
}
