import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { primaryOrganization, requireViewer } from '@/modules/accounts/viewer';
import { getCompanyWorkspaceApp } from '@/modules/company-app/queries';
import { CommissionPanel } from '@/modules/commissions/components/commission-panel';
import { CompanyFinancePanel } from '@/modules/finance/components/finance-panels';
export const metadata: Metadata = { title: 'Funding & statements' };
export default async function CompanyFundingPage() {
  const viewer = await requireViewer('/company/funding');
  const org = primaryOrganization(viewer);
  if (!org) redirect('/onboarding/company');
  const app = await getCompanyWorkspaceApp(org.id, org.name);
  return <>
    <PageHeader title="Funding & statements" description="Finance your program, manage automatic top-ups and review monthly statements." />{app ? <div className="space-y-8">
      <CompanyFinancePanel appId={app.id} canManage={org.role === 'owner'} />
      <CommissionPanel appId={app.id} company />
    </div> : <p>Create an app to manage funding and statements.</p>}</>;
}
