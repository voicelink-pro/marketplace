import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { AdminIntegrationsPanel } from '@/modules/operations/components/operation-panels';
export const metadata: Metadata = { title: 'Integrations' };
export default function AdminIntegrationsPage() {
  return <>
    <PageHeader title="Integrations" description="Provider integration health, worker liveness and payment queues." />
    <AdminIntegrationsPanel />
  </>;
}
