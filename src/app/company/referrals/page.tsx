import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { primaryOrganization, requireViewer } from '@/modules/accounts/viewer';
import { getCompanyWorkspaceApp } from '@/modules/company-app/queries';
import { AttributionPanel } from '@/modules/attribution/components/attribution-panel';
export const metadata: Metadata={title:'Referrals'};
export default async function CompanyReferralsPage({searchParams}:PageProps<'/company/referrals'>) {
  const viewer=await requireViewer('/company/referrals');
  const org=primaryOrganization(viewer);
  if(!org) redirect('/onboarding/company');
  const app=await getCompanyWorkspaceApp(org.id,org.name);
  const search=await searchParams;
  const page=typeof search.page==='string' ? Number(search.page) : 1;
  return <><PageHeader title="Referrals" description="Your app’s actual clicks and registrations."/>{app ? <AttributionPanel company appId={app.id} customers page={page} basePath="/company/referrals"/> : <p>Create your app to see its referral results.</p>}</>;
}
