import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

export const providerSchema = z.enum(['stripe', 'revenuecat', 'generic']);
export type PaymentProvider = z.infer<typeof providerSchema>;
const ref = z.string().min(1).max(200).regex(/^[A-Za-z0-9_$:.\/-]+$/);
const minor = z.string().regex(/^\d{1,16}$/);
export const paymentEventSchema = z.strictObject({
  event_id: ref,
  environment: z.enum(['sandbox', 'live']),
  kind: z.enum(['purchase', 'renewal', 'subscription', 'refund', 'dispute', 'ignored']),
  occurred_at: z.iso.datetime(),
  store: z.enum(['stripe', 'app_store', 'play_store', 'generic']),
  customer_id: ref.optional(), subscription_id: ref.optional(), product_id: ref.optional(),
  transaction_id: ref.optional(), adjustment_id: ref.optional(), aliases: z.array(ref).max(10).default([]),
  amount_minor: minor.optional(), currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  period_end: z.iso.datetime().optional(), is_trial: z.boolean().default(false),
  state: z.enum(['active', 'trialing', 'past_due', 'canceled', 'expired', 'paused', 'unknown']).optional(),
  auto_renew: z.boolean().optional(),
  adjustment_state: z.enum(['pending', 'succeeded', 'failed', 'reversed', 'open', 'won', 'lost']).optional(),
});
export type PaymentEvent = z.infer<typeof paymentEventSchema>;
type ObjectValue = Record<string, unknown>;
function obj(value: unknown): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_payload');
  return value as ObjectValue;
}
function str(value: unknown): string { return ref.parse(value); }
function id(value: unknown): string { return str(typeof value === 'object' && value ? obj(value).id : value); }
function timestamp(value: unknown, millis = false): string {
  const text = z.string().regex(/^\d{1,16}$/).parse(value);
  const time = BigInt(text) * (millis ? 1n : 1000n);
  if (time > 8640000000000000n) throw new Error('invalid_timestamp');
  return new Date(Number(time)).toISOString();
}
/** Preserve numeric lexemes before JSON.parse: provider decimal prices never pass through a float. */
export function parseExactJson(raw: string): ObjectValue {
  return obj(JSON.parse(raw.replace(/"(?:\\.|[^"\\])*"|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match, number: string | undefined) => number === undefined ? match : JSON.stringify(number))));
}
const currencyDigits: Record<string, number> = { EUR: 2, USD: 2, GBP: 2, PLN: 2, CAD: 2, AUD: 2, CHF: 2, JPY: 0, KRW: 0, KWD: 3, BHD: 3 };
export function decimalToMinor(value: unknown, currency: string): string {
  const digits = currencyDigits[currency];
  if (digits === undefined || typeof value !== 'string' || !/^-?\d+(\.\d+)?$/.test(value)) throw new Error('unsupported_money');
  const [whole, fraction = ''] = value.replace(/^-/, '').split('.');
  if (fraction.slice(digits).replaceAll('0', '')) throw new Error('inexact_money');
  return minor.parse((BigInt(whole!) * 10n ** BigInt(digits) + BigInt(fraction.slice(0, digits).padEnd(digits, '0') || '0')).toString());
}
function equal(a: string, b: string): boolean {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function verifyWebhook(provider: PaymentProvider, raw: string, headers: Headers, secret: string, now = Date.now()): void {
  if (secret.length < 32) throw new Error('credential_not_configured');
  if (provider === 'revenuecat') {
    if (!equal(headers.get('authorization') ?? '', 'Bearer ' + secret)) throw new Error('invalid_signature');
    return;
  }
  const signature = headers.get(provider === 'stripe' ? 'stripe-signature' : 'boostlink-signature') ?? '';
  const parts = signature.split(',').map(v => v.split('='));
  const times = parts.filter(([k]) => k === 't');
  if (times.length !== 1 || !/^\d{10}$/.test(times[0]?.[1] ?? '')) throw new Error('invalid_signature');
  const time = times[0]![1]!;
  if (Math.abs(now / 1000 - Number(time)) > 300) throw new Error('expired_signature');
  const expected = createHmac('sha256', secret).update(time + '.' + raw).digest('hex');
  if (!parts.some(([k, v]) => k === 'v1' && /^[a-f0-9]{64}$/.test(v ?? '') && equal(v!, expected))) throw new Error('invalid_signature');
}
export function paymentEnvelope(provider: PaymentProvider, raw: string, account: string) {
  const root = parseExactJson(raw);
  const event = provider === 'revenuecat' ? obj(root.event) : root;
  const eventId = str(event.id ?? event.event_id);
  let environment: 'sandbox' | 'live';
  if (provider === 'stripe') {
    if (typeof root.livemode !== 'boolean') throw new Error('invalid_environment');
    environment = root.livemode ? 'live' : 'sandbox';
    if (root.account !== undefined && root.account !== account) throw new Error('wrong_provider_account');
  } else if (provider === 'revenuecat') {
    if (event.app_id !== account) throw new Error('wrong_provider_account');
    if (!['SANDBOX', 'PRODUCTION'].includes(String(event.environment))) throw new Error('invalid_environment');
    environment = event.environment === 'SANDBOX' ? 'sandbox' : 'live';
  } else {
    if (event.account_id !== account) throw new Error('wrong_provider_account');
    environment = z.enum(['sandbox', 'live']).parse(event.environment);
  }
  return { eventId, environment };
}
export function normalizePaymentEvent(provider: PaymentProvider, raw: string, account: string): PaymentEvent {
  const envelope = paymentEnvelope(provider, raw, account);
  const root = parseExactJson(raw);
  if (provider === 'generic') {
    const { account_id: _account, id: _id, ...body } = root;
    void _account; void _id;
    return paymentEventSchema.parse({ ...body, event_id: envelope.eventId });
  }
  if (provider === 'revenuecat') {
    const e = obj(root.event), type = str(e.type);
    const stores: Record<string, PaymentEvent['store']> = { APP_STORE: 'app_store', MAC_APP_STORE: 'app_store', PLAY_STORE: 'play_store', STRIPE: 'stripe', TEST_STORE: 'generic' };
    const base = { event_id: envelope.eventId, environment: envelope.environment, occurred_at: timestamp(e.event_timestamp_ms, true), store: stores[String(e.store)] ?? 'generic' };
    if (type === 'TEST' || !['INITIAL_PURCHASE', 'RENEWAL', 'CANCELLATION', 'UNCANCELLATION', 'EXPIRATION', 'SUBSCRIPTION_PAUSED', 'BILLING_ISSUE', 'PRODUCT_CHANGE', 'SUBSCRIPTION_EXTENDED', 'REFUND_REVERSED'].includes(type)) {
      return paymentEventSchema.parse({ ...base, kind: 'ignored' });
    }
    if (!stores[String(e.store)] || e.store === 'TEST_STORE') throw new Error('unsupported_store');
    const identity = { customer_id: str(e.app_user_id), subscription_id: str(e.original_transaction_id), product_id: str(e.product_id) };
    const period = e.expiration_at_ms ? timestamp(e.expiration_at_ms, true) : undefined;
    if (type === 'INITIAL_PURCHASE' || type === 'RENEWAL') {
      return paymentEventSchema.parse({ ...base, ...identity, kind: type === 'RENEWAL' ? 'renewal' : 'purchase', transaction_id: str(e.transaction_id),
        amount_minor: decimalToMinor(e.price_in_purchased_currency, str(e.currency).toUpperCase()), currency: str(e.currency).toUpperCase(),
        period_end: period, is_trial: e.period_type === 'TRIAL', state: e.period_type === 'TRIAL' ? 'trialing' : 'active', auto_renew: true });
    }
    if ((type === 'CANCELLATION' && e.cancel_reason === 'CUSTOMER_SUPPORT') || type === 'REFUND_REVERSED') {
      return paymentEventSchema.parse({ ...base, ...identity, kind: 'refund', transaction_id: str(e.transaction_id), adjustment_id: 'refund:' + str(e.transaction_id),
        amount_minor: decimalToMinor(e.price_in_purchased_currency, str(e.currency).toUpperCase()), currency: str(e.currency).toUpperCase(), adjustment_state: type === 'REFUND_REVERSED' ? 'reversed' : 'succeeded' });
    }
    const state = type === 'EXPIRATION' ? 'expired' : type === 'SUBSCRIPTION_PAUSED' ? 'paused' : type === 'BILLING_ISSUE' ? 'past_due' : 'active';
    return paymentEventSchema.parse({ ...base, ...identity, kind: 'subscription', state, period_end: period,
      auto_renew: type === 'CANCELLATION' ? false : type === 'UNCANCELLATION' ? true : undefined });
  }
  const type = str(root.type), e = obj(obj(root.data).object);
  const base = { event_id: envelope.eventId, environment: envelope.environment, occurred_at: timestamp(root.created), store: 'stripe' };
  if (type === 'invoice.paid' || type === 'invoice.payment_succeeded') {
    const lines = obj(e.lines).data;
    if (!Array.isArray(lines) || lines.length !== 1 || obj(e.lines).has_more === true) throw new Error('unsupported_invoice_lines');
    const line = obj(lines[0]);
    const parent = e.parent ? obj(e.parent) : {};
    const subscription = e.subscription ?? (parent.subscription_details ? obj(parent.subscription_details).subscription : undefined);
    const pricing = line.pricing ? obj(line.pricing) : {};
    const price = line.price ?? (pricing.price_details ? obj(pricing.price_details).price : undefined);
    const aliases = [e.id, e.charge, e.payment_intent].filter(v => typeof v === 'string');
    return paymentEventSchema.parse({ ...base, kind: e.billing_reason === 'subscription_cycle' ? 'renewal' : 'purchase',
      customer_id: id(e.customer), subscription_id: id(subscription), product_id: id(price), transaction_id: id(e.id), aliases,
      amount_minor: minor.parse(e.amount_paid), currency: str(e.currency).toUpperCase(), period_end: timestamp(obj(line.period).end),
      state: 'active', auto_renew: undefined });
  }
  if (type.startsWith('customer.subscription.')) {
    const state = ['active', 'trialing', 'past_due', 'canceled', 'paused'].includes(String(e.status)) ? e.status : 'unknown';
    return paymentEventSchema.parse({ ...base, kind: 'subscription', customer_id: id(e.customer), subscription_id: id(e.id),
      state: type === 'customer.subscription.deleted' ? 'canceled' : state, auto_renew: e.cancel_at_period_end === true ? false : true });
  }
  if (type === 'refund.created' || type === 'refund.updated' || type === 'refund.failed') {
    return paymentEventSchema.parse({ ...base, kind: 'refund', transaction_id: id(e.payment_intent ?? e.charge), adjustment_id: id(e.id),
      amount_minor: minor.parse(e.amount), currency: str(e.currency).toUpperCase(), adjustment_state: e.status === 'succeeded' ? 'succeeded' : e.status === 'failed' || e.status === 'canceled' ? 'failed' : 'pending' });
  }
  if (type.startsWith('charge.dispute.')) {
    return paymentEventSchema.parse({ ...base, kind: 'dispute', transaction_id: id(e.payment_intent ?? e.charge), adjustment_id: id(e.id),
      amount_minor: minor.parse(e.amount), currency: str(e.currency).toUpperCase(), adjustment_state: e.status === 'won' ? 'won' : e.status === 'lost' ? 'lost' : 'open' });
  }
  return paymentEventSchema.parse({ ...base, kind: 'ignored' });
}
