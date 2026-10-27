'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/modules/accounts/viewer';
import { formError, formString, zodFormError, type FormState } from '@/lib/forms';
import { logUnexpected } from '@/lib/log';
import { autoSchema, fundingSchema } from './schemas';

const errors: Record<string, string> = {
  earnings_changed: 'Your available amount or provider fee changed. Refresh and confirm the updated withdrawal.',
  payment_method_required: 'Complete the sandbox payment-method setup first.',
  no_withdrawable_funds: 'There are no eligible earnings. Funds must be financed, reconciled and from a closed month; the provider minimum also applies.',
  payout_account_required: 'Complete the sandbox payout-account setup first.',
  bank_retry_unavailable: 'This bank payout cannot be retried. The provider allows up to three attempts.',
  invalid_onboarding: 'This setup session has expired or consent is missing. Start again.',
  provider_evidence_required: 'Provider evidence is required before reconciliation can continue.',
  case_in_progress: 'This case is already being processed.',
};
function rejected(error: { code?: string; message: string }, values?: Record<string, string>): FormState {
  logUnexpected('finance.action', { code: error.code, message: 'Finance command rejected.' });
  return formError(errors[error.message] ?? 'The operation was rejected. Refresh and check your permissions and the current status.', { values });
}
function refresh() {
  for (const path of ['/company/funding', '/creator/payouts', '/creator/earnings', '/creator', '/admin/finance', '/admin/payouts']) revalidatePath(path);
}
export async function startFinanceOnboarding(_state: FormState, data: FormData): Promise<FormState> {
  await requireViewer();
  const parsed = z.object({ kind: z.enum(['funding', 'payout']), app_id: z.union([z.uuid(), z.literal('')]) }).safeParse({ kind: formString(data, 'kind'), app_id: formString(data, 'app_id') });
  if (!parsed.success) return zodFormError(parsed.error);
  const client = await createClient();
  const result = await client.rpc('finance_start_onboarding', { p_kind: parsed.data.kind, p_app_id: parsed.data.app_id || undefined });
  if (result.error) return rejected(result.error);
  refresh();
  redirect('/sandbox/finance/' + result.data);
}
export async function completeFinanceOnboarding(_state: FormState, data: FormData): Promise<FormState> {
  await requireViewer();
  const session = z.uuid().safeParse(formString(data, 'session'));
  if (!session.success) return formError('Invalid setup session.');
  if (data.get('consent') !== 'on') return formError('Confirm the sandbox authorization to continue.');
  const client = await createClient();
  const result = await client.rpc('finance_complete_onboarding', { p_session: session.data, p_consent: true });
  if (result.error) return rejected(result.error);
  refresh();
  revalidatePath('/sandbox/finance/' + session.data);
  return { status: 'success', message: 'Sandbox setup complete. No bank, card or identity documents were collected.' };
}
export async function requestFunding(_state: FormState, data: FormData): Promise<FormState> {
  await requireViewer('/company/funding');
  const values = Object.fromEntries(['app_id', 'request_key', 'amount'].map(key => [key, formString(data, key)]));
  const parsed = fundingSchema.safeParse(values);
  if (!parsed.success) return zodFormError(parsed.error, values);
  const v = parsed.data, client = await createClient();
  const result = await client.rpc('finance_request_funding', { p_app_id: v.app_id, p_amount: v.amount, p_request_key: v.request_key });
  if (result.error) return rejected(result.error, values);
  refresh();
  return { status: 'success', message: 'Sandbox deposit requested. Funds become available only after provider confirmation.' };
}
export async function saveAutoFunding(_state: FormState, data: FormData): Promise<FormState> {
  await requireViewer('/company/funding');
  const values = Object.fromEntries(['app_id', 'threshold', 'amount'].map(key => [key, formString(data, key)]));
  const parsed = autoSchema.safeParse({ ...values, enabled: data.get('enabled') === 'on' });
  if (!parsed.success) return zodFormError(parsed.error, values);
  const v = parsed.data, client = await createClient();
  const result = await client.rpc('finance_save_auto', { p_app_id: v.app_id, p_enabled: v.enabled, p_threshold: v.threshold, p_amount: v.amount });
  if (result.error) return rejected(result.error, values);
  refresh();
  return { status: 'success', message: 'Sandbox automatic top-up settings saved.' };
}
export async function requestPayout(_state: FormState, data: FormData): Promise<FormState> {
  await requireViewer('/creator/payouts');
  const key = z.uuid().safeParse(formString(data, 'request_key'));
  if (!key.success || data.get('confirm') !== 'on') return formError('Confirm the withdrawal amount and provider costs.');
  const client = await createClient();
  const result = await client.rpc('finance_request_payout', { p_request_key: key.data, p_expected_minor: formString(data, 'expected_minor'), p_expected_fee: formString(data, 'expected_fee'), p_currency: 'EUR' });
  if (result.error) return rejected(result.error);
  refresh();
  return { status: 'success', message: 'Withdrawal requested. Eligible earnings are reserved; transfer and bank payout are tracked separately.' };
}
export async function retryBankPayout(_state: FormState, data: FormData): Promise<FormState> {
  await requireViewer('/creator/payouts');
  const id = z.uuid().safeParse(formString(data, 'payout_id'));
  if (!id.success) return formError('Invalid payout.');
  const client = await createClient();
  const result = await client.rpc('finance_retry_bank', { p_payout: id.data });
  if (result.error) return rejected(result.error);
  refresh();
  return { status: 'success', message: 'A new bank attempt was queued using the existing transfer.' };
}
export async function reviewFinanceCase(_state: FormState, data: FormData): Promise<FormState> {
  const viewer = await requireViewer('/admin/finance');
  if (!viewer.isAdmin) return formError('Administrator access required.');
  const parsed = z.object({ job_id: z.uuid(), note: z.string().trim().min(10).max(500) }).safeParse({ job_id: formString(data, 'job_id'), note: formString(data, 'note') });
  if (!parsed.success) return zodFormError(parsed.error);
  const client = await createClient();
  const result = await client.rpc('finance_review_case', { p_job: parsed.data.job_id, p_note: parsed.data.note });
  if (result.error) return rejected(result.error);
  refresh();
  return { status: 'success', message: 'Reconciliation queued and review note recorded. The worker must validate provider evidence.' };
}
