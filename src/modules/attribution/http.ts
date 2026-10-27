import { z } from "zod";

const tokenSchema = z.string().regex(/^blc_[a-f0-9]{64}$/);
export const registrationSchema = z.strictObject({
  customer_id: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
  click_tokens: z.array(tokenSchema).max(10).refine(v => new Set(v).size === v.length).default([]),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,12}-[A-Z0-9]{4,10}$/).optional(),
});
export const noStoreHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

/** Only the approved target is accepted. Incoming redirect parameters are never used. */
export function buildAttributionRedirect(destination: string, kind: string, token: string | null): string {
  if (destination.length > 2048 || /[\s\\\x00-\x1f\x7f]/.test(destination)) throw new Error("unsafe_redirect");
  const url = new URL(destination);
  if (url.protocol !== "https:" || url.username || url.password || !url.hostname || url.hostname === "localhost") {
    throw new Error("unsafe_redirect");
  }
  if (kind === "website") {
    if (!tokenSchema.safeParse(token).success) throw new Error("invalid_click_token");
    url.searchParams.set("bl_ref", token!);
  } else if (kind !== "ios_store" && kind !== "android_store") {
    throw new Error("unsafe_redirect");
  }
  return url.toString();
}

type Register = (args: {p_api_key: string; p_customer_id: string; p_click_tokens: string[]; p_code?: string}) => Promise<{
  data: unknown; error: {message: string; code?: string} | null;
}>;
const knownErrors = new Set([
  "invalid_api_key", "invalid_registration", "program_unavailable", "unsupported_attribution_policy",
  "invalid_referral_code", "invalid_click_token", "expired_click_token", "program_paused_funding",
]);
function json(body: unknown, status: number) {
  return Response.json(body, {status, headers: noStoreHeaders});
}

/** Bounded body read also works for chunked requests without Content-Length. */
async function readBody(request: Request): Promise<string> {
  if (Number(request.headers.get("content-length") ?? 0) > 8192) throw new Error("body_too_large");
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 8192) { await reader.cancel(); throw new Error("body_too_large"); }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size);
  let offset=0;
  for (const chunk of chunks) { body.set(chunk,offset); offset+=chunk.length; }
  return new TextDecoder("utf-8", {fatal:true}).decode(body);
}

export async function handleCustomerRegistration(request: Request, register: Register): Promise<Response> {
  // This endpoint is server-to-server. No CORS and no browser-origin requests.
  if (request.headers.has("origin")) return json({error:"server_to_server_only"},403);
  const auth = request.headers.get("authorization") ?? "";
  if (!/^Bearer blk_demo_[a-f0-9]{64}$/.test(auth)) return json({error:"invalid_api_key"},401);
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return json({error:"json_required"},415);
  }
  let raw: unknown;
  try { raw=JSON.parse(await readBody(request)); }
  catch (error) { return json({error:error instanceof Error && error.message==='body_too_large' ? 'body_too_large' : 'invalid_json'}, error instanceof Error && error.message==='body_too_large' ? 413 : 400); }
  const parsed=registrationSchema.safeParse(raw);
  if (!parsed.success) return json({error:"invalid_registration"},400);
  const {data,error}=await register({
    p_api_key:auth.slice(7), p_customer_id:parsed.data.customer_id,
    p_click_tokens:parsed.data.click_tokens, p_code:parsed.data.code,
  });
  if (error) {
    const message=knownErrors.has(error.message) ? error.message : "registration_unavailable";
    return json({error:message},message==='program_paused_funding' ? 409 : message==='invalid_api_key' ? 401 : message==='registration_unavailable' ? 503 : 400);
  }
  const result=z.object({id:z.uuid(),created:z.boolean(),source:z.enum(['link','code','unattributed'])}).safeParse(data);
  if (data && typeof data==='object' && 'error' in data && data.error==='rate_limited') {
    const response=json({error:'rate_limited'},429); response.headers.set('Retry-After','60'); return response;
  }
  if (!result.success) return json({error:'registration_unavailable'},503);
  return json(result.data,result.data.created ? 201 : 200);
}
