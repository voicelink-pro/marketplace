import {Card,CardHeader,CardTitle,CardContent} from '@/components/ui/card';
import {Table,TableHeader,TableHead,TableBody,TableRow,TableCell} from '@/components/ui/table';
import {formatMinorCurrency} from '@/lib/money';
import {getPaymentMetrics,getCustomerPaymentTimeline} from '../queries';
export async function PaymentResults({appId,customer,company=false}:{appId?:string;customer?:string;company?:boolean}){
 const [metrics,timeline]=await Promise.all([getPaymentMetrics(appId,company),getCustomerPaymentTimeline(customer,appId,company)]);
 return <section aria-label="Payment results" className="flex flex-col gap-4">
  {!customer?<div className="grid gap-4 sm:grid-cols-2">{[['Paying customers',metrics.paying_customers],['Active paying subscribers',metrics.active_paying_subscribers]].map(([label,value])=><Card key={label}><CardHeader><CardTitle className="text-sm">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold tabular-nums">{value}</CardContent></Card>)}</div>:null}
  <p className="text-sm text-muted-foreground">Sandbox results for referred customers. Trials and zero payments do not qualify. Fully refunded payments and lost disputes do not count as paid value. Scheduled cancellation keeps paid access until the paid period ends. Live processing is disabled.</p>
  <Card><CardHeader><CardTitle>Customer payment timeline</CardTitle></CardHeader><CardContent>
   {timeline.length?<Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Event</TableHead><TableHead>Status</TableHead><TableHead>Amount</TableHead><TableHead>Occurred (UTC)</TableHead></TableRow></TableHeader><TableBody>{timeline.map(e=><TableRow key={e.event_id}><TableCell>Customer #{e.referral_id.replaceAll('-','').slice(0,12).toUpperCase()}</TableCell><TableCell>{e.kind}</TableCell><TableCell>{e.state??'—'}</TableCell><TableCell>{e.amount_minor!==null&&e.currency?formatMinorCurrency(e.amount_minor,e.currency):'—'}</TableCell><TableCell>{e.occurred_at.replace('T',' ').slice(0,19)}</TableCell></TableRow>)}</TableBody></Table>:<p className="text-sm text-muted-foreground">No processed payment events yet. Missing customer or plan mappings remain in the integration queue for repair and retry.</p>}
   <p className="mt-3 text-xs text-muted-foreground">Latest 50 events. Amounts are not commissions. No commission calculation or financial balance is created in stage 6.</p>
  </CardContent></Card>
 </section>;
}
