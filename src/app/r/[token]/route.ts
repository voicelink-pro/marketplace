import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import { logUnexpected } from "@/lib/log";
import { buildAttributionRedirect, noStoreHeaders } from "@/modules/attribution/http";

export async function GET(request: Request, context: RouteContext<"/r/[token]">) {
  const {token}=await context.params;
  if (new URL(request.url).search || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(token) || token.length>48) {
    return new Response("Invalid referral link.",{status:400,headers:noStoreHeaders});
  }
  if (request.headers.get('purpose')==='prefetch' || request.headers.has('next-router-prefetch')) {
    return new Response(null,{status:204,headers:noStoreHeaders});
  }
  try {
    const client=await createPublicClient();
    const {data,error}=await client.rpc('record_referral_click',{p_link_token:token});
    if(error) {
      if(error.message==='click_rate_limited') return new Response('Too many referral requests.',{status:429,headers:{...noStoreHeaders,'Retry-After':'60'}});
      return new Response('Referral link unavailable.',{status:404,headers:noStoreHeaders});
    }
    const click=z.object({destination:z.string(),destination_kind:z.string(),token:z.string().nullable()}).parse(data);
    const target=buildAttributionRedirect(click.destination,click.destination_kind,click.token);
    return new Response(null,{status:302,headers:{...noStoreHeaders,Location:target}});
  } catch {
    logUnexpected('attribution.redirect',{code:'redirect_failed',message:'Referral redirect unavailable.'});
    return new Response('Referral link unavailable.',{status:503,headers:noStoreHeaders});
  }
}

// HEAD probes must never generate clicks or receipts.
export async function HEAD() { return new Response(null,{status:405,headers:{...noStoreHeaders,Allow:'GET'}}); }
