import {notFound} from 'next/navigation';
import {z} from 'zod';
import {createClient} from '@/lib/supabase/server';
import {requireViewer} from '@/modules/accounts/viewer';
import {PageHeader} from '@/components/layout/page-header';
import {PaymentResults} from '@/modules/payments/components/payment-results';
export default async function CustomerTimeline({params}:PageProps<'/creator/referrals/[id]'>){
 const viewer=await requireViewer('/creator/referrals');const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();
 const client=await createClient();const row=await client.from('customer_referrals').select('id,app_id').eq('id',id).eq('creator_id',viewer.userId).single();if(row.error||!row.data)notFound();
 return <><PageHeader title={'Customer #'+id.replaceAll('-','').slice(0,12).toUpperCase()} description="Payment and subscription history without customer personal information."/><PaymentResults customer={id} appId={row.data.app_id}/></>;
}
