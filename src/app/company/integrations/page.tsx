import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {PageHeader} from '@/components/layout/page-header';
import {Card,CardHeader,CardTitle,CardContent} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Table,TableHeader,TableHead,TableBody,TableRow,TableCell} from '@/components/ui/table';
import {primaryOrganization,requireViewer} from '@/modules/accounts/viewer';
import {getCompanyWorkspaceApp} from '@/modules/company-app/queries';
import {getPaymentIntegrations} from '@/modules/payments/queries';
import {IntegrationForm} from '@/modules/payments/components/integration-forms';
import {getPublicEnv} from '@/lib/env';
import {isLocalPgliteSandboxEnabled} from '@/modules/catalog/local-pglite-sandbox';
export const metadata:Metadata={title:'Integrations'};
const fixes:Record<string,string>={duplicate_adjustment:'This adjustment state was already recorded or superseded; no duplicate economic effect.',adjustment_order_ambiguous:'Conflicting terminal adjustment states share a provider timestamp. Paid value is withheld pending a newer authoritative event.',duplicate_transaction:'Another notification already recorded this purchase. No duplicate purchase or timeline entry was created.',subscription_order_ambiguous:'Conflicting subscription states share the same provider timestamp. Active status is withheld until a newer authoritative subscription event resolves it.',waiting_source:'Choose the authoritative integration for this store.',waiting_customer_mapping:'Register the customer through E5, then map the provider customer ID.',waiting_plan_mapping:'Map the provider price/product ID to this app’s plan.',waiting_transaction:'Wait for the purchase or map the charge/payment-intent reference to its invoice/transaction.',adapter_error:'Inspect the provider event format and supported event types; repair the adapter or send a corrected event with a new ID.',transaction_conflict:'The same transaction has conflicting identity, amount or currency. Investigate before retrying.',secondary_source:'Another integration is authoritative for this store; this event has no purchase effect.',live_processing_disabled:'Live processing is intentionally blocked in this stage.'};
export default async function CompanyIntegrationsPage(){
 const viewer=await requireViewer('/company/integrations'),org=primaryOrganization(viewer);if(!org)redirect('/onboarding/company');
 if(isLocalPgliteSandboxEnabled())return <><PageHeader title="Integrations"/><p>Payment integration testing requires local Supabase.</p></>;
 const app=await getCompanyWorkspaceApp(org.id,org.name);if(!app)return <><PageHeader title="Integrations"/><p>Create your app first.</p></>;
 const data=await getPaymentIntegrations(app.id),owner=org.role==='owner';
 const integrations=data.integrations.map(i=>({value:i.id,label:`${i.provider} · ${i.environment}`}));
 const integrationField={name:'integration_id',label:'Integration',options:integrations};
 const stores=['stripe','app_store','play_store','generic'].map(value=>({value,label:value}));
 const origin=getPublicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/,'');
 return <><PageHeader title="Integrations" description="Configure event delivery, map identities and repair the durable payment queue."/>
  <div className="flex max-w-5xl flex-col gap-6">
   <Card><CardHeader><CardTitle>Setup and verification</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
    <p>Configured means credentials and mappings still need testing. Verified pipeline means an authenticated, mapped sandbox event was actually processed. It does not certify live readiness. Generic API signatures authenticate the sender’s assertion; they do not independently prove a sale.</p>
    <ol className="list-decimal space-y-2 pl-5"><li>Create a provider/environment configuration below. An operator installs its webhook secret in the server’s credential registry; never put it into your app’s frontend.</li><li>Choose one authoritative integration per store. Stripe and RevenueCat must not both count the same Stripe sales.</li><li>Register each app customer via the E5 API, map the provider customer ID, and map each price/product to a subscription plan.</li><li>Send a real sandbox event to the displayed webhook URL. Stripe uses its signing header; RevenueCat uses the configured Bearer authorization; Generic uses a timestamped HMAC.</li><li>Run the asynchronous payment worker. Repair waiting mappings, queue a retry, then check the last processed event.</li></ol>
    <p>Detailed operator and provider instructions: <code>docs/PAYMENT_INTEGRATIONS.md</code>. Payment processing does not fund commissions or calculate earnings. Live events are stored separately and blocked.</p>
   </CardContent></Card>
   {owner?<Card><CardHeader><CardTitle>Configure provider</CardTitle></CardHeader><CardContent><IntegrationForm kind="configure" label="Save configuration" hidden={{app_id:app.id}} fields={[{name:'provider',label:'Provider',options:['stripe','revenuecat','generic'].map(value=>({value,label:value}))},{name:'environment',label:'Environment',options:[{value:'sandbox',label:'Sandbox'},{value:'live',label:'Live — processing blocked'}]},{name:'account',label:'Provider account / RevenueCat app ID'},{name:'credential_ref',label:'Server credential reference',hint:'Reference name only, for example STRIPE_TEST. An operator stores the secret on the server.'}]}/></CardContent></Card>:null}
   {data.integrations.map(i=><Card key={i.id}><CardHeader><CardTitle className="flex flex-wrap items-center gap-2">{i.provider} · {i.environment}<Badge variant={i.verified_at?'default':'secondary'}>{i.environment==='live'?'Live blocked':!i.credentialReady?'Credentials missing':i.verified_at?'Verified sandbox pipeline':'Configured'}</Badge></CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
    <p className="break-all">Webhook: <code>{origin}/api/webhooks/{i.provider}/{i.id}</code></p><p>Provider account: {i.provider_account_id}. Credential reference: {i.credential_ref}.</p>
    <p>Last received: {i.last_received_at??'No event received'}. Last successfully processed: {i.last_processed_at??'No event processed'}.</p>
    {owner?<IntegrationForm kind="check" label="Check processed event" hidden={{integration_id:i.id}}/>:null}
   </CardContent></Card>)}
   {owner&&integrations.length?<div className="grid items-start gap-6 md:grid-cols-2">
    <Card><CardHeader><CardTitle>Store authority</CardTitle></CardHeader><CardContent><IntegrationForm kind="source" label="Set authoritative source" fields={[integrationField,{name:'store',label:'Store',options:stores}]}/></CardContent></Card>
    <Card><CardHeader><CardTitle>Plan mapping</CardTitle></CardHeader><CardContent><IntegrationForm kind="plan" label="Map plan" fields={[integrationField,{name:'external_plan',label:'Provider price / product ID'},{name:'plan_id',label:'App subscription plan',options:data.plans.map(p=>({value:p.id,label:p.name+(p.is_active?'':' (archived)')}))}]}/></CardContent></Card>
    <Card><CardHeader><CardTitle>Customer mapping</CardTitle></CardHeader><CardContent><IntegrationForm kind="customer" label="Map customer" fields={[integrationField,{name:'provider_customer',label:'Provider customer / RevenueCat app-user ID'},{name:'customer_id',label:'Opaque customer ID from your app',hint:'Already registered through E5. Never enter email, name or phone.'}]}/></CardContent></Card>
    <Card><CardHeader><CardTitle>Transaction reference</CardTitle></CardHeader><CardContent><IntegrationForm kind="reference" label="Map reference" fields={[integrationField,{name:'reference',label:'Charge / payment-intent / refund reference'},{name:'transaction',label:'Canonical invoice / purchase transaction ID',hint:'Use when a refund refers to a different provider object than the original purchase.'}]}/></CardContent></Card>
   </div>:null}
   <Card><CardHeader><CardTitle>Current mappings</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
    {data.sources.length?data.sources.map(s=><p key={s.environment+s.store}>{s.environment} · {s.store}: {data.integrations.find(i=>i.id===s.integration_id)?.provider}</p>):<p>No store authority selected.</p>}
    {data.mappings.length?data.mappings.map(m=><p key={m.integration_id+m.external_plan_id}>{m.external_plan_id} → {data.plans.find(p=>p.id===m.plan_id)?.name??'Archived plan'}</p>):<p>No plans mapped.</p>}
   </CardContent></Card>
   <Card><CardHeader><CardTitle>Latest events and repair queue</CardTitle></CardHeader><CardContent>
    {data.events.length?<Table><TableHeader><TableRow><TableHead>Provider event</TableHead><TableHead>Status</TableHead><TableHead>Problem / repair</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{data.events.map(e=><TableRow key={e.id}><TableCell className="max-w-48 break-all whitespace-normal">{e.event_ref}<span className="block text-xs text-muted-foreground">{e.environment} · attempts {e.attempts}</span></TableCell><TableCell>{e.status}</TableCell><TableCell className="max-w-80 whitespace-normal">{e.error_code?(fixes[e.error_code]??e.error_code):'—'}{e.conflicting_deliveries>0?<p>Conflicting deliveries: {e.conflicting_deliveries}. Original payload preserved.</p>:null}</TableCell><TableCell>{owner&&['failed','waiting'].includes(e.status)?<IntegrationForm kind="retry" label="Queue retry" hidden={{event_id:e.id}}/>:null}</TableCell></TableRow>)}</TableBody></Table>:<p className="text-sm text-muted-foreground">No webhook events received. Sending a test request does not verify processing until it reaches this queue and completes.</p>}
   </CardContent></Card>
  </div>
 </>;
}
