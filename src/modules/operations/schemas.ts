import { z } from 'zod';
const date = z.iso.datetime({ offset: true });
export const ticketSchema = z.object({ subject: z.string().trim().min(5).max(160), body: z.string().trim().min(5).max(3000), category: z.enum(['account', 'integration', 'funding', 'payout', 'other']), request_key: z.uuid() });
export const replySchema = z.object({ ticket_id: z.uuid(), body: z.string().trim().min(5).max(3000), request_key: z.uuid(), revision: z.coerce.number().int().positive(), status: z.enum(['', 'open', 'in_progress', 'closed']) });
export const notificationSchema = z.object({ id: z.uuid(), code: z.string(), href: z.enum(['/company/app', '/company/integrations', '/company/funding', '/creator/payouts', '/creator/earnings', '/support']), created_at: date, read_at: date.nullable() });
const ticket = z.object({ id: z.uuid(), subject: z.string(), category: z.string(), status: z.string(), revision: z.number().int(), created_at: date, updated_at: date });
const message = z.object({ id: z.uuid(), ticket_id: z.uuid(), is_admin: z.boolean(), body: z.string(), created_at: date });
export const inboxSchema = z.object({ notifications: z.array(notificationSchema), unread: z.number(), tickets: z.array(ticket), messages: z.array(message) });
export const healthSchema = z.object({ workers: z.array(z.object({ worker: z.string(), last_seen_at: date.nullable(), state: z.enum(['unknown', 'stale', 'error', 'ok']) })), payment_attention: z.number(), commission_attention: z.number(), finance_attention: z.number(), open_tickets: z.number(), live_enabled: z.literal(false) });
export const adminOperationsSchema = z.object({
  health: healthSchema,
  integrations: z.array(z.object({ id: z.uuid(), app_id: z.uuid(), app_name: z.string(), provider: z.string(), environment: z.string(), configured_at: date, verified_at: date.nullable(), last_received_at: date.nullable(), last_processed_at: date.nullable() })),
  events: z.array(z.object({ id: z.uuid(), app_id: z.uuid(), integration_id: z.uuid(), environment: z.string(), status: z.string(), kind: z.string().nullable(), error_code: z.string().nullable(), attempts: z.number(), received_at: date, next_attempt_at: date })),
  commission_jobs: z.array(z.object({ transaction_id: z.uuid(), app_id: z.uuid(), status: z.string(), error_code: z.string().nullable(), attempts: z.number(), updated_at: date })),
  commission_cases: z.array(z.object({ id: z.uuid(), app_id: z.uuid(), transaction_id: z.uuid(), code: z.string(), created_at: date, state: z.string(), note: z.string().nullable() })),
  tickets: z.array(ticket.extend({ user_id: z.uuid(), app_id: z.uuid().nullable() })), messages: z.array(message),
  audit: z.array(z.object({ id: z.string(), actor_id: z.uuid().nullable(), app_id: z.uuid().nullable(), entity_id: z.uuid(), action: z.string(), note: z.string().nullable(), created_at: date })),
});
export type Inbox = z.infer<typeof inboxSchema>;
export type OperationsWorkspace = z.infer<typeof adminOperationsSchema>;
export const notificationLabels: Record<string, string> = {
  app_submitted: 'Your app was submitted for review.', app_approved: 'Your app was approved for the sandbox catalog.', app_rejected: 'Your app needs changes. Review the administrator feedback.',
  payment_event_needs_attention: 'A payment event needs attention. Check the integration mappings and error code.', automatic_topup_failed: 'An automatic top-up failed. Check funding and the program pause.',
  payout_requested: 'Your withdrawal was requested.', payout_transferred: 'Your provider transfer is confirmed. The bank payout is separate.', payout_paid: 'The provider confirmed your bank payout.',
  payout_bank_failed: 'The bank payout failed. Your transfer remains at the provider.', payout_returned: 'A bank payout was returned. Review its status before retrying.', payout_transfer_failed: 'The provider transfer failed. Eligible funds were released.',
  commission_requires_review: 'A commission requires review. The team must check the accounting policy or source event.', support_ticket_created: 'Your support request was received.', support_reply: 'The team replied to your support request.',
};
