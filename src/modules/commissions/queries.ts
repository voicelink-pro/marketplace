import 'server-only';
import{z}from'zod';import{createClient}from'@/lib/supabase/server';import{getViewer}from'@/modules/accounts/viewer';import{logUnexpected}from'@/lib/log';
const money=z.string().regex(/^-?\d+$/),date=z.iso.datetime({offset:true});
const schema=z.object({
 totals:z.array(z.object({currency:z.string(),accrued_this_month:money,accrued:money,awaiting_funding:money,available:money,held:money,in_payout:money,paid:money})),
 earnings:z.array(z.object({id:z.uuid(),app_id:z.uuid(),referral_id:z.uuid(),plan_name:z.string(),billing_interval:z.string(),currency:z.string(),occurred_at:date,commission_bps:z.number(),platform_fee_bps:z.number(),sale_minor:money,commission_basis_minor:money,gross_minor:money,platform_fee_minor:money,creator_minor:money,net_gross:money,net_creator:money,net_fee:money,bucket:z.string(),effective_month:z.string(),funded:z.boolean()})),
 statements:z.array(z.object({id:z.uuid(),app_id:z.uuid(),creator_id:z.uuid(),month:z.string(),currency:z.string(),sale_minor:money,basis_minor:money,gross_minor:money,creator_minor:money,fee_minor:money,created_at:date})),
 corrections:z.array(z.object({id:z.uuid(),transaction_id:z.uuid(),kind:z.string(),original_month:z.string(),source_month:z.string(),effective_month:z.string(),currency:z.string(),gross_delta:money,creator_delta:money,fee_delta:money})),
 cases:z.array(z.object({id:z.uuid(),transaction_id:z.uuid(),code:z.string(),created_at:date})),
 jobs:z.array(z.object({transaction_id:z.uuid(),status:z.string(),error_code:z.string().nullable()})),
});
export async function getCommissionWorkspace({appId,company=false,customer}:{appId?:string;company?:boolean;customer?:string}={}){
 const viewer=await getViewer();if(!viewer)throw new Error('Authentication required.');const client=await createClient();
 const r=await client.rpc('commission_workspace',{p_app_id:appId,p_creator_id:company?undefined:viewer.userId,p_referral_id:customer});
 if(r.error){logUnexpected('commissions.workspace',{code:r.error.code,message:'Cannot load commission workspace.'});throw new Error('Commission results temporarily unavailable.');}
 return schema.parse(r.data);
}
