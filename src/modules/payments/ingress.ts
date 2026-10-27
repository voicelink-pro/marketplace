import { z } from 'zod';
import { paymentEnvelope, providerSchema, verifyWebhook, type PaymentProvider } from './adapters';
import { noStoreHeaders } from '@/modules/attribution/http';

export const integrationIngressSchema=z.object({id:z.uuid(),environment:z.enum(['sandbox','live']),provider:providerSchema,provider_account_id:z.string(),credential_ref:z.string()});
export type IngressIntegration=z.infer<typeof integrationIngressSchema>;
export async function boundedPaymentBody(request:Request) {
 if(Number(request.headers.get('content-length')??0)>131072)throw new Error('body_too_large');
 const reader=request.body?.getReader();if(!reader)throw new Error('empty_body');
 const chunks:Uint8Array[]=[];let size=0;
 try {for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>131072){await reader.cancel();throw new Error('body_too_large');}chunks.push(part.value);}}finally{reader.releaseLock();}
 const raw=new Uint8Array(size);let offset=0;for(const chunk of chunks){raw.set(chunk,offset);offset+=chunk.length;}
 return new TextDecoder('utf-8',{fatal:true}).decode(raw);
}
export function webhookSecret(reference:string):string {
 const registry=z.record(z.string(),z.string().min(32)).parse(JSON.parse(process.env.PAYMENT_WEBHOOK_SECRETS_JSON??'{}'));
 const secret=registry[reference];if(!secret)throw new Error('credential_not_configured');
 if(Object.values(registry).filter(value=>value===secret).length!==1)throw new Error('credential_reused');return secret;
}
export async function handlePaymentWebhook(request:Request,provider:PaymentProvider,integration:IngressIntegration,secret:string,
 persist:(eventId:string,environment:string,raw:string)=>Promise<{data:unknown;error:unknown}>) {
 const json=(body:unknown,status:number)=>Response.json(body,{status,headers:noStoreHeaders});
 if(provider!==integration.provider)return json({error:'wrong_provider'},400);
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')return json({error:'json_required'},415);
 let raw:string;
 try{raw=await boundedPaymentBody(request);}catch{return json({error:'invalid_body'},413);}
 try{verifyWebhook(provider,raw,request.headers,secret);}catch{return json({error:'invalid_signature'},401);}
 let envelope;
 try{envelope=paymentEnvelope(provider,raw,integration.provider_account_id);}catch{return json({error:'invalid_envelope'},400);}
 if(envelope.environment!==integration.environment)return json({error:'wrong_environment'},400);
 const {data,error}=await persist(envelope.eventId,envelope.environment,raw);
 if(error)return json({error:'receipt_unavailable'},503);
 const receipt=z.object({id:z.uuid(),duplicate:z.boolean(),conflict:z.boolean()}).safeParse(data);
 if(!receipt.success){if(data&&typeof data==='object'&&'error'in data&&data.error==='rate_limited')return json({error:'rate_limited'},429);return json({error:'receipt_unavailable'},503);}
 if(receipt.data.conflict)return json({error:'event_payload_conflict'},409);
 // Acknowledge only after durable persistence. Worker failures never lose the original webhook.
 return json({received:true,id:receipt.data.id,duplicate:receipt.data.duplicate},200);
}
