'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { formError, formString, zodFormError, type FormState } from '@/lib/forms';
import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/modules/accounts/viewer';
import { logUnexpected } from '@/lib/log';
import { replySchema, ticketSchema } from './schemas';
const errors: Record<string, string> = { stale_ticket: 'This conversation changed. Refresh before replying.', ticket_rate_limit: 'You can open up to ten requests per day. Reply to an existing request instead.', reply_rate_limit: 'Too many replies. Please try again later.', event_not_retryable: 'This event cannot be retried in its current state.', idempotency_conflict: 'This request key was already used for different content. Refresh and try again.' };
function rejected(error: { code?: string; message: string }, values?: Record<string, string>): FormState {
  logUnexpected('operations.action', { code: error.code, message: 'Operations command rejected.' });
  return formError(errors[error.message] ?? 'The request was rejected. Check your permissions and refresh the current status.', { values });
}
function refresh() { for (const path of ['/support', '/notifications', '/admin/issues', '/admin/integrations']) revalidatePath(path); }
export async function createSupportTicket(_state: FormState, data: FormData): Promise<FormState> {
  await requireViewer('/support');
  const values = Object.fromEntries(['subject', 'body', 'category', 'request_key'].map(key => [key, formString(data, key)]));
  const parsed = ticketSchema.safeParse(values);
  if (!parsed.success) return zodFormError(parsed.error, values);
  const v = parsed.data, client = await createClient();
  const r = await client.rpc('ops_create_ticket', { p_subject: v.subject, p_body: v.body, p_category: v.category, p_request_key: v.request_key });
  if (r.error) return rejected(r.error, values);
  refresh();return { status: 'success', message: 'Support request received. Replies will appear here and in your notifications.' };
}
export async function replySupportTicket(_state: FormState, data: FormData): Promise<FormState> {
  await requireViewer('/support');
  const values = Object.fromEntries(['ticket_id', 'body', 'request_key', 'revision', 'status'].map(key => [key, formString(data, key)]));
  const parsed = replySchema.safeParse(values);
  if (!parsed.success) return zodFormError(parsed.error, values);
  const v = parsed.data, client = await createClient();
  const r = await client.rpc('ops_reply_ticket', { p_ticket: v.ticket_id, p_body: v.body, p_request_key: v.request_key, p_expected_revision: v.revision, p_status: v.status || undefined });
  if (r.error) return rejected(r.error, values);
  refresh();return { status: 'success', message: 'Reply saved.' };
}
export async function markNotificationRead(_state: FormState, data: FormData): Promise<FormState> {
  await requireViewer('/notifications');const id = z.uuid().safeParse(formString(data, 'id'));
  if (!id.success) return formError('Invalid notification.');
  const client = await createClient();const r = await client.rpc('ops_mark_notification', { p_id: id.data });
  if (r.error) return rejected(r.error);
  refresh();return { status: 'success', message: 'Marked as read.' };
}
export async function retryOperationalEvent(_state: FormState, data: FormData): Promise<FormState> {
  const viewer = await requireViewer('/admin/integrations');if (!viewer.isAdmin) return formError('Administrator access required.');
  const parsed = z.object({ id: z.uuid(), reason: z.string().trim().min(10).max(500) }).safeParse({ id: formString(data, 'id'), reason: formString(data, 'reason') });
  if (!parsed.success) return zodFormError(parsed.error);
  const client = await createClient();const r = await client.rpc('ops_admin_retry_event', { p_event: parsed.data.id, p_reason: parsed.data.reason });
  if (r.error) return rejected(r.error);
  refresh();return { status: 'success', message: 'Sandbox event queued. The reason was recorded in the audit.' };
}
export async function reviewOperationalCommission(_state: FormState, data: FormData): Promise<FormState> {
  const viewer = await requireViewer('/admin/issues');if (!viewer.isAdmin) return formError('Administrator access required.');
  const parsed = z.object({ id: z.uuid(), state: z.enum(['in_review', 'awaiting_policy']), note: z.string().trim().min(10).max(1000) }).safeParse({ id: formString(data, 'id'), state: formString(data, 'state'), note: formString(data, 'note') });
  if (!parsed.success) return zodFormError(parsed.error);
  const client = await createClient();const r = await client.rpc('ops_review_commission', { p_case: parsed.data.id, p_state: parsed.data.state, p_note: parsed.data.note });
  if (r.error) return rejected(r.error);
  refresh();return { status: 'success', message: 'Review recorded. Financial entries and liability were not changed.' };
}
