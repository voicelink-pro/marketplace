import 'server-only';
import { z } from 'zod';
import { getViewer } from '@/modules/accounts/viewer';
import { createClient } from '@/lib/supabase/server';
import { logUnexpected } from '@/lib/log';

const count = z.number().int().nonnegative();
const summarySchema=z.object({
  clicks:count, registrations:count, code_registrations:count, unattributed:count,
  links:z.array(z.object({link_id:z.uuid(),label:z.string(),clicks:count,registrations:count})),
});
export async function getAttributionSummary(appId?: string, company=false) {
  const client=await createClient();
  const viewer=await getViewer();if(!viewer)throw new Error('Authentication required.');
  const {data,error}=await client.rpc('attribution_summary',{p_app_id:appId,p_creator_id:company?undefined:viewer.userId});
  if(error) {
    logUnexpected('attribution.summary',{code:error.code,message:'Cannot load referral summary.'});
    throw new Error('Referral statistics are temporarily unavailable.');
  }
  return summarySchema.parse(data);
}
export async function listCustomerReferrals(appId?: string, page=1, company=false) {
  const client=await createClient();
  const safePage=Math.max(1,Math.min(200,Math.floor(page)||1));
  let query=client.from('customer_referrals')
    .select('id,app_id,creator_id,source,registered_at,terms_version_id')
    .neq('source','unattributed').order('registered_at',{ascending:false}).order('id')
    .range((safePage-1)*25,safePage*25);
  if(appId) query=query.eq('app_id',appId);
  if(!company){const viewer=await getViewer();if(!viewer)throw new Error('Authentication required.');query=query.eq('creator_id',viewer.userId);}
  const {data,error}=await query;
  if(error) {
    logUnexpected('attribution.customers',{code:error.code,message:'Cannot load referred customers.'});
    throw new Error('Referred customers are temporarily unavailable.');
  }
  const rows=(data??[]).slice(0,25);
  const ids=[...new Set(rows.map(row=>row.app_id))];
  const names=new Map<string,string>();
  if(ids.length) {
    const apps=await client.from('catalog_listings').select('app_id,name').in('app_id',ids);
    if(apps.error) {
      logUnexpected('attribution.appNames',{code:apps.error.code,message:'Cannot load referred app names.'});
      throw new Error('Referred applications are temporarily unavailable.');
    }
    for(const app of apps.data??[]) if(app.app_id && app.name) names.set(app.app_id,app.name);
  }
  return {rows:rows.map(row=>({...row,appName:names.get(row.app_id)??'Archived program'})),hasNext:(data?.length??0)>25,page:safePage};
}
