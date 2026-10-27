import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { requireViewer } from '@/modules/accounts/viewer';
import { AttributionPanel } from '@/modules/attribution/components/attribution-panel';
export const metadata: Metadata={title:'Referrals'};
export default async function CreatorReferralsPage({searchParams}:PageProps<'/creator/referrals'>) {
  await requireViewer('/creator/referrals');
  const search=await searchParams;
  const page=typeof search.page==='string' ? Number(search.page) : 1;
  return <><PageHeader title="Referrals" description="Actual clicks and referred registrations, without customer personal information."/><AttributionPanel customers page={page}/></>;
}
