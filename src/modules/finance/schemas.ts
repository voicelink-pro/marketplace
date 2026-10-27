import { z } from 'zod';

// The test adapter supports EUR only. Parsing stays decimal-string -> bigint.
export const euroAmount = z.string().trim().regex(/^\d{1,10}(?:[.,]\d{1,2})?$/, 'Enter a EUR amount with up to two decimal places.')
  .transform(value => {
    const [whole, fraction = ''] = value.replace(',', '.').split('.');
    return (BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, '0'))).toString();
  });
export const fundingSchema = z.object({ app_id: z.uuid(), request_key: z.uuid(), amount: euroAmount.refine(value => BigInt(value) > 0n, 'Enter a positive amount.') });
export const autoSchema = z.object({ app_id: z.uuid(), enabled: z.boolean(), threshold: euroAmount, amount: euroAmount })
  .refine(value => !value.enabled || BigInt(value.amount) > BigInt(value.threshold), { path: ['amount'], message: 'The top-up must exceed the threshold.' });
const money = z.string().regex(/^\d+$/);
const datetime = z.iso.datetime({ offset: true });
export const financeWorkspaceSchema = z.object({
  provider: z.literal('sandbox-test'), live_enabled: z.literal(false),
  accounts: z.array(z.object({ app_id: z.uuid(), currency: z.string(), auto_enabled: z.boolean(), threshold_minor: money, topup_minor: money, method_ready: z.boolean(), consent_at: datetime.nullable(), paused: z.boolean(), available_minor: money, reserved_minor: money, arrears_minor: money })),
  funding: z.array(z.object({ id: z.uuid(), app_id: z.uuid(), currency: z.string(), amount_minor: money, kind: z.string(), status: z.string(), created_at: datetime })),
  payouts: z.array(z.object({ id: z.uuid(), creator_id: z.uuid(), currency: z.string(), amount_minor: money, fee_minor: money, status: z.string(), bank_attempt: z.number(), created_at: datetime, transfer_reference: z.string().nullable(), bank_reference: z.string().nullable() })),
  events: z.array(z.object({ id: money, funding_id: z.uuid().nullable(), payout_id: z.uuid().nullable(), code: z.string(), created_at: datetime })),
  notices: z.array(z.object({ id: z.uuid(), app_id: z.uuid(), code: z.string(), created_at: datetime })),
  cases: z.array(z.object({ job_id: z.uuid(), code: z.string(), created_at: datetime, resolved_at: datetime.nullable(), kind: z.string(), status: z.string(), attempts: z.number(), funding_id: z.uuid().nullable(), payout_id: z.uuid().nullable(), expected_amount_minor: money, expected_currency: z.string(), provider_state: z.string().nullable(), provider_amount_minor: money.nullable(), provider_currency: z.string().nullable(), provider_ref: z.string().nullable(), ledger_status: z.string() })),
  available: z.array(z.object({ currency: z.string(), available_minor: money })),
  jobs: z.array(z.object({ id: z.uuid(), kind: z.string(), status: z.string(), attempts: z.number(), funding_id: z.uuid().nullable(), payout_id: z.uuid().nullable(), lease_until: datetime.nullable(), next_at: datetime })),
  audit: z.array(z.object({ id: money, actor: z.uuid().nullable(), action: z.string(), entity_id: z.uuid(), note: z.string().nullable(), created_at: datetime })),
  payout_account: z.object({ enabled: z.boolean(), currency: z.string(), minimum_minor: money, fee_minor: money }).nullable(),
  onboarding: z.array(z.object({ id: z.uuid(), kind: z.enum(['funding', 'payout']), app_id: z.uuid().nullable(), status: z.string(), expires_at: datetime })),
});
export type FinanceWorkspace = z.infer<typeof financeWorkspaceSchema>;
