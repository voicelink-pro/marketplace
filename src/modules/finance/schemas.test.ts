import { describe, expect, it } from 'vitest';
import { euroAmount, autoSchema, fundingSchema } from './schemas';
const app_id = '00000000-0000-4000-8000-000000000001';
describe('finance amounts and authorization inputs', () => {
  it('converts decimal strings without floating point', () => {
    expect(euroAmount.parse('9999999999.99')).toBe('999999999999');
    expect(euroAmount.parse('0,01')).toBe('1');
    expect(euroAmount.parse('12.1')).toBe('1210');
  });
  it.each(['1e3', '-1', '0.001', 'Infinity', 'NaN', '1,000.00', '10000000000'])('rejects ambiguous or out of range amount %s', value => {
    expect(euroAmount.safeParse(value).success).toBe(false);
  });
  it('requires positive funding and an explicit idempotency key', () => {
    expect(fundingSchema.safeParse({ app_id, amount: '0', request_key: app_id }).success).toBe(false);
    expect(fundingSchema.safeParse({ app_id, amount: '1' }).success).toBe(false);
  });
  it('prevents automatic top-up amounts that never cross the threshold', () => {
    expect(autoSchema.safeParse({ app_id, enabled: true, threshold: '10', amount: '10' }).success).toBe(false);
    expect(autoSchema.parse({ app_id, enabled: true, threshold: '10', amount: '20' }).amount).toBe('2000');
  });
});
