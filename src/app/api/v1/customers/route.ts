import { createPublicClient } from "@/lib/supabase/public";
import { logUnexpected } from "@/lib/log";
import { handleCustomerRegistration, noStoreHeaders } from "@/modules/attribution/http";

export async function POST(request: Request) {
  try {
    return await handleCustomerRegistration(request,async args => {
      const client=await createPublicClient();
      return client.rpc('register_referred_customer',args);
    });
  } catch {
    logUnexpected('attribution.register',{code:'registration_failed',message:'Customer registration unavailable.'});
    return Response.json({error:'registration_unavailable'},{status:503,headers:noStoreHeaders});
  }
}
