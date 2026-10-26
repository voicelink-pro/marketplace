import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { isLocalPgliteSandboxEnabled } from '@/modules/catalog/local-pglite-sandbox';
import { getAttributionSummary, listCustomerReferrals } from '../queries';

export async function AttributionPanel({appId,customers=false,page=1,basePath='/creator/referrals',company=false}:{appId?:string;customers?:boolean;page?:number;basePath?:string;company?:boolean}) {
  if (isLocalPgliteSandboxEnabled()) return <p className="text-sm text-muted-foreground">Referral tracking requires local Supabase. The in-memory UI demo does not record clicks or customer registrations.</p>;
  const [summary,list]=await Promise.all([getAttributionSummary(appId),customers ? listCustomerReferrals(appId,page) : null]);
  return <div className="flex flex-col gap-5">
    <p className="text-sm text-muted-foreground">Demo attribution · sandbox policy: last valid click within 30 days; an explicitly entered code takes precedence. Clicks count redirects, not unique people.</p>
    <div className="grid gap-4 sm:grid-cols-3">
      {[["Clicks",summary.clicks],["Referred registrations",summary.registrations],["Code-only registrations",summary.code_registrations]].map(([label,value])=><Card key={label}><CardHeader><CardTitle className="text-sm">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold tabular-nums">{value}</CardContent></Card>)}
    </div>
    {company ? <p className="text-sm text-muted-foreground">Registered without referral: {summary.unattributed}. Existing registrations cannot later acquire a referral.</p> : null}
    <Card><CardHeader><CardTitle>Link comparison</CardTitle></CardHeader><CardContent>
      {summary.links.length ? <><Table><TableHeader><TableRow><TableHead>Link</TableHead><TableHead>Clicks</TableHead><TableHead>Registrations</TableHead></TableRow></TableHeader><TableBody>
        {summary.links.map(link=><TableRow key={link.link_id}><TableCell className="max-w-64 break-words whitespace-normal">{link.label}</TableCell><TableCell>{link.clicks}</TableCell><TableCell>{link.registrations}</TableCell></TableRow>)}
      </TableBody></Table><p className="mt-3 text-xs text-muted-foreground">Up to 100 links. Code-only registrations are a separate source and never added to a link.</p></> : <p className="text-sm text-muted-foreground">No referral links or clicks to compare yet.</p>}
    </CardContent></Card>
    {list ? <Card><CardHeader><CardTitle>Referred customers</CardTitle></CardHeader><CardContent>
      {list.rows.length ? <Table><TableHeader><TableRow><TableHead>Customer</TableHead>{appId ? null : <TableHead>App</TableHead>}<TableHead>Source</TableHead><TableHead>Registered (UTC)</TableHead></TableRow></TableHeader><TableBody>
        {list.rows.map(row=><TableRow key={row.id}><TableCell><span title={row.id}>Customer #{row.id.replaceAll('-','').slice(0,12).toUpperCase()}</span></TableCell>{appId ? null : <TableCell className="text-xs">{row.appName}</TableCell>}<TableCell>{row.source==='code' ? 'Code only' : 'Referral link'}</TableCell><TableCell>{new Date(row.registered_at).toISOString().replace('T',' ').slice(0,19)}</TableCell></TableRow>)}
      </TableBody></Table> : <p className="text-sm text-muted-foreground">No referred customers yet. Registrations reported by an app’s backend appear here without personal information.</p>}
      <nav aria-label="Customer pages" className="mt-4 flex gap-4 text-sm">
        {list.page>1 ? <Link href={`${basePath}?page=${list.page-1}`} className="underline">Previous</Link> : null}
        {list.hasNext ? <Link href={`${basePath}?page=${list.page+1}`} className="underline">Next</Link> : null}
      </nav>
    </CardContent></Card> : null}
    <p className="text-sm text-muted-foreground">Payment history and paying-subscriber metrics will become available after payment integrations. Commission calculations belong to a later stage.</p>
  </div>;
}
