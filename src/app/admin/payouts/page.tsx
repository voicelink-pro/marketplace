import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { AdminFinancePanel } from '@/modules/finance/components/finance-panels';
export const metadata: Metadata = { title: 'Payouts' };
export default function AdminPayoutsPage() {
  return <>
    <PageHeader title="Payouts" description="Creator transfers, bank payouts and reconciliation issues." />
    <AdminFinancePanel payoutsOnly />
  </>;
}
