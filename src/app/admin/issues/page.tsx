import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { AdminIssuesPanel } from '@/modules/operations/components/operation-panels';
export const metadata: Metadata = { title: 'Issues' };
export default function AdminIssuesPage() {
  return <>
    <PageHeader title="Issues" description="Investigations, support requests and the operational audit." />
    <AdminIssuesPanel />
  </>;
}
