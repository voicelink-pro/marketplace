const MAX_LENGTH = 512;
const PLACEHOLDER_ORIGIN = "http://same-site.invalid";

/**
 * Returns a same-site path that is safe to redirect to after sign-in, or the
 * fallback when the value could send the user to another origin.
 */
export function safeRedirectPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_LENGTH) {
    return fallback;
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (/[\u0000-\u001f\u007f]/.test(decoded)) {
    return fallback;
  }

  const url = new URL(value, PLACEHOLDER_ORIGIN);
  if (url.origin !== PLACEHOLDER_ORIGIN) {
    return fallback;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
