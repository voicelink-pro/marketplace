import type { Metadata } from 'next';
import { EarningsTabs } from '@/components/layout/earnings-tabs';
import { PageHeader } from '@/components/layout/page-header';
import { CreatorFinancePanel } from '@/modules/finance/components/finance-panels';
export const metadata: Metadata = { title: 'Payouts' };
export default function CreatorPayoutsPage() {
  return <>
    <PageHeader title="Payouts" description="Withdraw available earnings and track provider transfers and bank payouts." />
    <EarningsTabs />
    <CreatorFinancePanel />
  </>;
}
