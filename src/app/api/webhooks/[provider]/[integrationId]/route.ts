import {z} from 'zod';
import {createPublicClient} from '@/lib/supabase/public';
import {logUnexpected} from '@/lib/log';
import {providerSchema} from '@/modules/payments/adapters';
import {handlePaymentWebhook,integrationIngressSchema,webhookSecret} from '@/modules/payments/ingress';
import {noStoreHeaders} from '@/modules/attribution/http';
export async function POST(request:Request,context:RouteContext<'/api/webhooks/[provider]/[integrationId]'>){
 const params=await context.params;
 const provider=providerSchema.safeParse(params.provider),id=z.uuid().safeParse(params.integrationId);
 if(!provider.success||!id.success)return Response.json({error:'not_found'},{status:404,headers:noStoreHeaders});
 try{
  const backend=process.env.PAYMENT_BACKEND_TOKEN;if(!backend)throw new Error('payment_backend_unconfigured');
  const client=await createPublicClient();
  const config=await client.rpc('payment_integration_for_ingest',{p_backend:backend,p_integration:id.data});
  if(config.error)throw new Error('payment_configuration_unavailable');
  if(!config.data)return Response.json({error:'not_found'},{status:404,headers:noStoreHeaders});
  const integration=integrationIngressSchema.parse(config.data);
  return await handlePaymentWebhook(request,provider.data,integration,webhookSecret(integration.credential_ref),
   async(eventId,environment,raw)=>await client.rpc('ingest_payment_event',{p_backend:backend,p_integration:id.data,p_event_ref:eventId,p_environment:environment,p_raw:raw}));
 }catch{
  logUnexpected('payments.ingress',{code:'ingress_unavailable',message:'Payment webhook configuration unavailable.'});
  return Response.json({error:'receipt_unavailable'},{status:503,headers:noStoreHeaders});
 }
}
