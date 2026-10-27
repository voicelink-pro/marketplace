import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/modules/accounts/viewer';
import { CompleteOnboardingForm } from '@/modules/finance/components/finance-forms';
import { SandboxNotice } from '@/modules/finance/components/finance-panels';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
export const metadata: Metadata = { title: 'Sandbox provider setup' };
const schema = z.object({ id: z.uuid(), kind: z.enum(['funding', 'payout']), status: z.enum(['pending', 'complete']), app_id: z.uuid().nullable(), expires_at: z.iso.datetime({ offset: true }) });
async function Setup({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireViewer('/sandbox/finance/' + id);
  if (!z.uuid().safeParse(id).success) notFound();
  const client = await createClient();
  const r = await client.rpc('finance_onboarding_session', { p_session: id });
  if (r.error) throw new Error('Provider setup temporarily unavailable.');
  if (!r.data) notFound();
  const session = schema.parse(r.data);
  return <main className="mx-auto max-w-xl px-5 py-12">
    <SandboxNotice />
    <Card>
      <CardHeader>
        <CardTitle>{session.kind === 'funding' ? 'Sandbox payment authorization' : 'Sandbox recipient onboarding'}</CardTitle>
        <CardDescription>This page simulates a provider-hosted setup. Do not enter real payment details or identity documents.</CardDescription>
      </CardHeader>
      <CardContent>{session.status === 'complete' ? <p>Sandbox setup is complete. <Link className="underline" href={session.kind === 'funding' ? '/company/funding' : '/creator/payouts'}>Return to your panel</Link>
      </p> : new Date(session.expires_at) <= new Date() ? <p>This setup session expired. Start again from <Link className="underline" href={session.kind === 'funding' ? '/company/funding' : '/creator/payouts'}>your panel</Link>.</p> : <CompleteOnboardingForm session={id} kind={session.kind} />}</CardContent>
    </Card>
  </main>;
}
export default function Page(props: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<p className="p-8" role="status">Loading sandbox setup…</p>}>
    <Setup {...props} />
  </Suspense>;
}
