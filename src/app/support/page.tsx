import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { SupportPanel } from '@/modules/operations/components/operation-panels';
export const metadata: Metadata = { title: 'Support', robots: { index: false, follow: false } };
export default function Page() {
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
    <Link className="text-sm underline" href="/dashboard">Back to your workspace</Link>
    <PageHeader title="Support" description="Report an issue and follow replies from the BoostLink team." />
    <Suspense fallback={<p role="status">Loading your support requests…</p>}>
      <SupportPanel />
    </Suspense>
  </main>;
}
