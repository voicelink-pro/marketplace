import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { AdminFinancePanel } from '@/modules/finance/components/finance-panels';
export const metadata: Metadata = { title: 'Finance' };
export default function AdminFinancePage() {
  return <>
    <PageHeader title="Finance" description="Company funding, reservations and provider reconciliation." />
    <AdminFinancePanel />
  </>;
}
