import { describe, expect, it } from 'vitest';
import { ticketSchema, replySchema } from './schemas';
import { evaluateOperationsHealth } from '../../../scripts/worker-health.mjs';
const id = '00000000-0000-4000-8000-000000000001';
describe('operations form contracts and actionable health', () => {
  it('requires explicit stable keys and bounds support content', () => {
    expect(ticketSchema.safeParse({ subject: 'Help', body: 'Details', category: 'account', request_key: id }).success).toBe(false);
    expect(ticketSchema.safeParse({ subject: 'A valid request', body: 'Please investigate', category: 'other' }).success).toBe(false);
    expect(ticketSchema.parse({ subject: ' Account access ', body: ' Please investigate ', category: 'account', request_key: id }).subject).toBe('Account access');
  });
  it('requires revision and a valid status when replying', () => {
    expect(replySchema.safeParse({ ticket_id: id, body: 'A support reply', request_key: id, revision: 0, status: 'closed' }).success).toBe(false);
  });
  it('marks missing workers and backlog as attention without treating open tickets as a crash', () => {
    const base = { workers: [{ worker: 'finance', state: 'ok' }], payment_attention: 0, commission_attention: 0, finance_attention: 0, open_tickets: 10 };
    expect(evaluateOperationsHealth(base).status).toBe('ok');
    expect(evaluateOperationsHealth({ ...base, workers: [{ worker: 'finance', state: 'unknown' }] }).status).toBe('attention');
    expect(evaluateOperationsHealth({ ...base, payment_attention: 1 }).queues).toEqual(['payment_attention']);
  });
});
