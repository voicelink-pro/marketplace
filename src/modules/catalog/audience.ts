/** Who a home page speaks to: `/` for creators, `/for-apps` for apps. Sign-up and log-in take it as `?for=apps`; no param means creators. */
export type HomeAudience = "creators" | "apps";

export const HOME_AUDIENCE_PARAM = "for";

export function parseHomeAudience(value: string | string[] | undefined): HomeAudience | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first === "creators" || first === "apps" ? first : undefined;
}
