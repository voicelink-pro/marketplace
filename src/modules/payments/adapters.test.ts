import {readFileSync} from 'node:fs';
import {createHmac} from 'node:crypto';
import {describe,it,expect,vi} from 'vitest';
import {decimalToMinor,normalizePaymentEvent,parseExactJson,verifyWebhook} from './adapters';
import {handlePaymentWebhook} from './ingress';
const fixture=(name:string)=>readFileSync(new URL(`../../../tests/fixtures/payments/${name}.json`,import.meta.url),'utf8');
const secret='fixture-only-signing-secret-not-a-provider-credential';
function signature(raw:string,time=Math.floor(Date.now()/1000)){return `t=${time},v1=${createHmac('sha256',secret).update(time+'.'+raw).digest('hex')}`;}
describe('E6 official-shaped sandbox adapter fixtures (not provider sandbox tests)',()=>{
 it.each([
  ['customer.subscription.deleted','canceled',false,false],
  ['customer.subscription.updated','canceled',false,false],
  ['customer.subscription.updated','active',true,false],
  ['customer.subscription.updated','active',false,true],
 ] as const)('maps renewal eligibility for %s / %s / cancel at period end %s', (type,status,cancelAtPeriodEnd,expected)=>{
  const raw=JSON.stringify({id:'evt_cancel_regression',type,created:1793131200,livemode:false,data:{object:{id:'sub_cancel_regression',customer:'cus_cancel_regression',status,cancel_at_period_end:cancelAtPeriodEnd}}});
  expect(normalizePaymentEvent('stripe',raw,'acct_fixture').auto_renew).toBe(expected);
 });
 it('keeps exact money lexemes and rejects inexact/unsupported amounts',()=>{
  expect(parseExactJson('{"amount":9007199254740993,"price":14.99}')).toEqual({amount:'9007199254740993',price:'14.99'});
  expect(decimalToMinor('14.99','EUR')).toBe('1499');expect(decimalToMinor('12','JPY')).toBe('12');expect(decimalToMinor('-1.234','KWD')).toBe('1234');
  expect(()=>decimalToMinor('1.999','EUR')).toThrow();expect(()=>decimalToMinor('1','XYZ')).toThrow();
 });
 it('verifies raw Stripe and Generic HMAC, rejects tampering/replay and validates RC bearer',()=>{
  const raw=fixture('stripe-invoice-paid');
  expect(()=>verifyWebhook('stripe',raw,new Headers({'stripe-signature':signature(raw)}),secret)).not.toThrow();
  expect(()=>verifyWebhook('generic',raw,new Headers({'boostlink-signature':signature(raw)}),secret)).not.toThrow();
  expect(()=>verifyWebhook('stripe',raw+' ',new Headers({'stripe-signature':signature(raw)}),secret)).toThrow();
  expect(()=>verifyWebhook('stripe',raw,new Headers({'stripe-signature':signature(raw,Math.floor(Date.now()/1000)-301)}),secret)).toThrow();
  expect(()=>verifyWebhook('revenuecat',raw,new Headers({authorization:'Bearer '+secret}),secret)).not.toThrow();
  expect(()=>verifyWebhook('revenuecat',raw,new Headers({authorization:'Bearer wrong'}),secret)).toThrow();
 });
 it('normalizes modern Stripe invoice identity without conflating customer/subscription/transaction',()=>{
  const e=normalizePaymentEvent('stripe',fixture('stripe-invoice-paid'),'acct_fixture');
  expect(e).toMatchObject({kind:'purchase',customer_id:'cus_fixture_1',subscription_id:'sub_fixture_1',transaction_id:'in_fixture_1',product_id:'price_fixture_monthly',amount_minor:'1499',environment:'sandbox'});
  const raw=JSON.parse(fixture('stripe-invoice-paid'));raw.type='invoice.payment_succeeded';raw.id='evt_another_notification';
  expect(normalizePaymentEvent('stripe',JSON.stringify(raw),'acct_fixture').transaction_id).toBe(e.transaction_id);
  raw.data.object.lines.data.push(raw.data.object.lines.data[0]);expect(()=>normalizePaymentEvent('stripe',JSON.stringify(raw),'acct_fixture')).toThrow('unsupported_invoice_lines');
 });
 it('normalizes RC decimal purchases and separates cancellation from refunds',()=>{
  const raw=fixture('revenuecat-initial');expect(normalizePaymentEvent('revenuecat',raw,'app_fixture_rc')).toMatchObject({amount_minor:'1499',store:'app_store',kind:'purchase'});
  const anonymous=JSON.parse(raw);anonymous.event.app_user_id='$RCAnonymousID:opaque123';expect(normalizePaymentEvent('revenuecat',JSON.stringify(anonymous),'app_fixture_rc').customer_id).toBe('$RCAnonymousID:opaque123');
  const e=JSON.parse(raw);e.event.type='CANCELLATION';e.event.cancel_reason='UNSUBSCRIBE';
  expect(normalizePaymentEvent('revenuecat',JSON.stringify(e),'app_fixture_rc')).toMatchObject({kind:'subscription',state:'active',auto_renew:false});
  e.event.cancel_reason='CUSTOMER_SUPPORT';e.event.price_in_purchased_currency=-14.99;
  expect(normalizePaymentEvent('revenuecat',JSON.stringify(e),'app_fixture_rc')).toMatchObject({kind:'refund',amount_minor:'1499',adjustment_state:'succeeded'});
  e.event.type='REFUND_REVERSED';expect(normalizePaymentEvent('revenuecat',JSON.stringify(e),'app_fixture_rc').adjustment_state).toBe('reversed');
 });
 it('handles zero/trial, expiry, Stripe refunds and dispute state without treating cancellation as cash',()=>{
  const rc=JSON.parse(fixture('revenuecat-initial'));rc.event.period_type='TRIAL';rc.event.price_in_purchased_currency=0;
  expect(normalizePaymentEvent('revenuecat',JSON.stringify(rc),'app_fixture_rc')).toMatchObject({is_trial:true,amount_minor:'0'});
  rc.event.type='EXPIRATION';expect(normalizePaymentEvent('revenuecat',JSON.stringify(rc),'app_fixture_rc')).toMatchObject({kind:'subscription',state:'expired'});
  const stripe=(type:string,object:unknown)=>JSON.stringify({id:'evt_adjustment',type,created:1793052000,livemode:false,data:{object}});
  expect(normalizePaymentEvent('stripe',stripe('refund.created',{id:'re_1',payment_intent:'pi_1',amount:1499,currency:'eur',status:'succeeded'}),'acct_x')).toMatchObject({kind:'refund',transaction_id:'pi_1',adjustment_id:'re_1'});
  expect(normalizePaymentEvent('stripe',stripe('charge.dispute.closed',{id:'dp_1',charge:'ch_1',amount:1499,currency:'eur',status:'won'}),'acct_x')).toMatchObject({kind:'dispute',adjustment_state:'won'});
 });
 it('persists before 200, refuses false signatures/accounts/environment and never verifies dashboard TEST',async()=>{
  const raw=fixture('revenuecat-initial');const config={id:'a1000000-0000-4000-8000-000000000001',provider:'revenuecat' as const,provider_account_id:'app_fixture_rc',environment:'sandbox' as const,credential_ref:'RC_TEST'};
  const persist=vi.fn().mockResolvedValue({data:{id:config.id,duplicate:false,conflict:false},error:null});
  const req=(body=raw,auth=secret)=>new Request('https://boostlink.test/api/webhooks/revenuecat/'+config.id,{method:'POST',headers:{authorization:'Bearer '+auth,'content-type':'application/json'},body});
  expect((await handlePaymentWebhook(req(),'revenuecat',config,secret,persist)).status).toBe(200);expect(persist).toHaveBeenCalledOnce();
  expect((await handlePaymentWebhook(req(raw,'wrong'),'revenuecat',config,secret,persist)).status).toBe(401);
  expect((await handlePaymentWebhook(req(),'revenuecat',{...config,environment:'live'},secret,persist)).status).toBe(400);
  const rc=JSON.parse(raw);rc.event.app_id='other_app';expect((await handlePaymentWebhook(req(JSON.stringify(rc)),'revenuecat',config,secret,persist)).status).toBe(400);
  rc.event.app_id='app_fixture_rc';rc.event.type='TEST';expect(normalizePaymentEvent('revenuecat',JSON.stringify(rc),'app_fixture_rc').kind).toBe('ignored');
  persist.mockResolvedValue({data:null,error:{message:'unavailable'}});expect((await handlePaymentWebhook(req(),'revenuecat',config,secret,persist)).status).toBe(503);
 });
 it('accepts Generic declarations as authenticated assertions, with strict integer minor units',()=>{
  expect(normalizePaymentEvent('generic',fixture('generic-renewal'),'generic_fixture_account')).toMatchObject({kind:'renewal',amount_minor:'1499'});
  const e=JSON.parse(fixture('generic-renewal'));e.amount_minor='14.99';expect(()=>normalizePaymentEvent('generic',JSON.stringify(e),'generic_fixture_account')).toThrow();
 });
});
