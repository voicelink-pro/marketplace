'use server';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {createClient} from '@/lib/supabase/server';
import {requireViewer} from '@/modules/accounts/viewer';
import {formError,formString,type FormState,zodFormError} from '@/lib/forms';
import {logUnexpected} from '@/lib/log';
import {providerSchema} from './adapters';
const ref=z.string().regex(/^[A-Za-z0-9_$:.\/-]{1,200}$/);
const fields={integration_id:z.uuid()};
const schemas={
 configure:z.object({app_id:z.uuid(),provider:providerSchema,environment:z.enum(['sandbox','live']),account:ref,credential_ref:z.string().regex(/^[A-Z][A-Z0-9_]{2,79}$/)}),
 source:z.object({...fields,store:z.enum(['stripe','app_store','play_store','generic'])}),
 plan:z.object({...fields,external_plan:ref,plan_id:z.uuid()}),
 customer:z.object({...fields,provider_customer:ref,customer_id:z.string().regex(/^[A-Za-z0-9_-]{1,128}$/)}),
 reference:z.object({...fields,reference:ref,transaction:ref}),
 retry:z.object({event_id:z.uuid()}),
 check:z.object(fields),
};
const errorMessages:Record<string,string>={customer_not_registered:'Register this app customer through the E5 API before mapping it.',mapping_is_immutable:'This identifier is already mapped. Existing customer mappings cannot be reassigned.',source_locked_after_purchase:'This store already has processed purchases. Its source cannot be changed automatically.',account_locked_after_events:'This account already received events. An operator must review a migration before replacing it.',event_not_retryable:'This event is complete, blocked, or currently being processed.',invalid_plan:'Choose a subscription plan belonging to this app.'};
async function mutate(kind:keyof typeof schemas,formData:FormData):Promise<FormState>{
 await requireViewer('/company/integrations');
 const values:Record<string,string>={};for(const key of Object.keys(schemas[kind].shape))values[key]=formString(formData,key);
 const parsed=schemas[kind].safeParse(values);if(!parsed.success)return zodFormError(parsed.error,values);
 const client=await createClient();let error:{code?:string;message:string}|null=null;
 switch(kind){
  case 'configure':{const v=schemas.configure.parse(values);({error}=await client.rpc('configure_payment_integration',{p_app_id:v.app_id,p_provider:v.provider,p_environment:v.environment,p_account:v.account,p_credential_ref:v.credential_ref}));break;}
  case 'source':{const v=schemas.source.parse(values);({error}=await client.rpc('set_payment_source',{p_integration:v.integration_id,p_store:v.store}));break;}
  case 'plan':{const v=schemas.plan.parse(values);({error}=await client.rpc('map_payment_plan',{p_integration:v.integration_id,p_external_id:v.external_plan,p_plan_id:v.plan_id}));break;}
  case 'customer':{const v=schemas.customer.parse(values);({error}=await client.rpc('map_payment_customer',{p_integration:v.integration_id,p_provider_customer:v.provider_customer,p_customer_id:v.customer_id}));break;}
  case 'reference':{const v=schemas.reference.parse(values);({error}=await client.rpc('map_payment_transaction_reference',{p_integration:v.integration_id,p_reference:v.reference,p_transaction:v.transaction}));break;}
  case 'retry':{const v=schemas.retry.parse(values);({error}=await client.rpc('retry_payment_event',{p_event:v.event_id}));break;}
  case 'check':{
   const v=schemas.check.parse(values);const result=await client.from('payment_integrations').select('verified_at,last_processed_at,environment').eq('id',v.integration_id).single();
   if(result.error)return formError('Integration is not accessible.');
   if(!result.data.verified_at||!result.data.last_processed_at)return formError('Not verified yet. Send an authenticated sandbox purchase, map customer and plan, then run the payment worker.');
   return {status:'success',message:'Sandbox pipeline processed a real received event at '+result.data.last_processed_at+'. This does not certify live readiness or independent truth of Generic sales.'};
  }
 }
 if(error){logUnexpected('payments.configure',{code:error.code,message:'Payment integration action rejected.'});return formError(errorMessages[error.message]??'The operation was rejected. Check ownership, identifiers and integration settings.',{values});}
 revalidatePath('/company/integrations');return {status:'success',message:kind==='retry'?'Queued for retry. The worker will process it asynchronously.':'Saved. Configuration alone does not verify the integration.'};
}
export async function configureIntegration(_state:FormState,data:FormData){return mutate('configure',data);}
export async function setSource(_state:FormState,data:FormData){return mutate('source',data);}
export async function mapPlan(_state:FormState,data:FormData){return mutate('plan',data);}
export async function mapCustomer(_state:FormState,data:FormData){return mutate('customer',data);}
export async function mapReference(_state:FormState,data:FormData){return mutate('reference',data);}
export async function retryEvent(_state:FormState,data:FormData){return mutate('retry',data);}
export async function checkIntegration(_state:FormState,data:FormData){return mutate('check',data);}
