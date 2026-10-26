import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/modules/accounts/schemas";
import { managedMediaContentType } from "@/modules/company-app/media";

/** Storage RLS decides whether this is approved public media or a private draft. */
export async function GET(_request: Request, { params }: RouteContext<"/media/apps/[appId]/[asset]">) {
  const { appId, asset } = await params;
  const type = managedMediaContentType(asset);
  if (!uuidSchema.safeParse(appId).success || !type) return new Response(null, { status: 404 });
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("app-media").download(`${appId}/${asset}`);
  if (error || !data) return new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  return new Response(data, { headers: {
    "Content-Type": type,
    "Content-Length": String(data.size),
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
  } });
}
