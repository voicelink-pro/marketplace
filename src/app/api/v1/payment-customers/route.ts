import {z} from 'zod';
import {createPublicClient} from '@/lib/supabase/public';
import {noStoreHeaders} from '@/modules/attribution/http';
import {boundedPaymentBody} from '@/modules/payments/ingress';
import {logUnexpected} from '@/lib/log';
const schema=z.strictObject({integration_id:z.uuid(),provider_customer_id:z.string().regex(/^[A-Za-z0-9_$:.\/-]{1,200}$/),customer_id:z.string().regex(/^[A-Za-z0-9_-]{1,128}$/)});
export async function POST(request:Request){
 const json=(body:unknown,status:number)=>Response.json(body,{status,headers:noStoreHeaders});
 if(request.headers.has('origin'))return json({error:'server_to_server_only'},403);
 const auth=request.headers.get('authorization')??'';
 if(!/^Bearer blk_demo_[a-f0-9]{64}$/.test(auth))return json({error:'invalid_api_key'},401);
 try{
  const parsed=schema.safeParse(JSON.parse(await boundedPaymentBody(request)));if(!parsed.success)return json({error:'invalid_mapping'},400);
  const client=await createPublicClient();
  const r=await client.rpc('map_payment_customer',{p_integration:parsed.data.integration_id,p_provider_customer:parsed.data.provider_customer_id,p_customer_id:parsed.data.customer_id,p_app_api_key:auth.slice(7)});
  if(r.error)return json({error:'mapping_rejected'},400);
  return json({mapped:true},200);
 }catch{
  logUnexpected('payments.customerMapping',{code:'mapping_failed',message:'Payment customer mapping unavailable.'});
  return json({error:'mapping_rejected'},400);
 }
}
