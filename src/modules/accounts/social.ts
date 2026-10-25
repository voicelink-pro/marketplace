export const SOCIAL_PLATFORMS = [
  "instagram",
  "tiktok",
  "youtube",
  "x",
  "facebook",
  "linkedin",
  "twitch",
  "snapchat",
  "pinterest",
  "threads",
  "other",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  twitch: "Twitch",
  snapchat: "Snapchat",
  pinterest: "Pinterest",
  threads: "Threads",
  other: "Website",
};

export const MAX_SOCIAL_LINKS = 10;
const MAX_URL_LENGTH = 2048;

const PLATFORM_DOMAINS: ReadonlyArray<[SocialPlatform, readonly string[]]> = [
  ["instagram", ["instagram.com"]],
  ["tiktok", ["tiktok.com"]],
  ["youtube", ["youtube.com", "youtu.be"]],
  ["x", ["x.com", "twitter.com"]],
  ["facebook", ["facebook.com", "fb.com"]],
  ["linkedin", ["linkedin.com"]],
  ["twitch", ["twitch.tv"]],
  ["snapchat", ["snapchat.com"]],
  ["pinterest", ["pinterest.com"]],
  ["threads", ["threads.net", "threads.com"]],
];

// Mirrors creator_social_links_url_check in the database.
const DB_URL_PATTERN = /^https:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(:[0-9]{1,5})?([/?#]\S*)?$/;

export type SocialUrlResult =
  | { ok: true; url: string; platform: SocialPlatform }
  | { ok: false; reason: "invalid_url" | "profile_path_required" };

function detectPlatform(hostname: string): SocialPlatform {
  for (const [platform, domains] of PLATFORM_DOMAINS) {
    if (domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
      return platform;
    }
  }
  return "other";
}

/**
 * Normalizes a creator's social profile URL. Ownership is not verified here;
 * the result only tells us the URL is well-formed and which platform it is.
 */
export function parseSocialProfileUrl(input: string): SocialUrlResult {
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_URL_LENGTH) {
    return { ok: false, reason: "invalid_url" };
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  if (url.protocol === "http:") {
    url.protocol = "https:";
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    return { ok: false, reason: "invalid_url" };
  }

  url.hash = "";
  const platform = detectPlatform(url.hostname);
  if (platform !== "other" && (url.pathname === "/" || url.pathname === "")) {
    return { ok: false, reason: "profile_path_required" };
  }

  const normalized = url.pathname === "/" && !url.search ? url.origin : url.toString();
  if (normalized.length > MAX_URL_LENGTH || !DB_URL_PATTERN.test(normalized)) {
    return { ok: false, reason: "invalid_url" };
  }
  return { ok: true, url: normalized, platform };
}
