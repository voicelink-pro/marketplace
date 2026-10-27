"use client";

import { Globe } from "lucide-react";
import { type KeyboardEvent, useId, useRef, useState } from "react";
import { fieldErrorsFor } from "@/components/forms/form-feedback";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/forms";
import { cn } from "@/lib/utils";
import { PLATFORM_PATHS } from "@/modules/catalog/components/platform-logos";

type Platform = "instagram" | "tiktok" | "youtube" | "x" | "other";

/** What's shown before the handle; the saved link is `https://` + prefix + handle. */
const PLATFORMS: { value: Platform; label: string; prefix?: string }[] = [
  { value: "instagram", label: "Instagram", prefix: "instagram.com/" },
  { value: "tiktok", label: "TikTok", prefix: "tiktok.com/@" },
  { value: "youtube", label: "YouTube", prefix: "youtube.com/@" },
  { value: "x", label: "X", prefix: "x.com/" },
  { value: "other", label: "Other" },
];

/** Something like "tiktok.com/@name" or "https://…": already a link, not a handle. */
const LOOKS_LIKE_LINK = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}\//i;

/** The value submitted as `url`; the server parses and validates it as before. */
function profileUrl(platform: Platform, handle: string, link: string): string {
  if (platform === "other") return link.trim();
  const clean = handle.trim().replace(/^@+/, "");
  if (!clean) return "";
  if (LOOKS_LIKE_LINK.test(clean)) return clean;
  return `https://${PLATFORMS.find((option) => option.value === platform)!.prefix}${clean}`;
}

/** TikTok and X glyphs: near-black on light backgrounds, white on dark (as in PlatformLogos). */
const INK_GLYPH = "fill-[#111111] dark:fill-white";

/** The platform's mark in its brand colours, on the shared Simple Icons paths. */
function PlatformMark({ platform }: { platform: Platform }) {
  const gradient = useId();
  const box = { viewBox: "0 0 24 24", "aria-hidden": true, className: "size-4.5 shrink-0" } as const;
  switch (platform) {
    case "instagram":
      return (
        <svg {...box}>
          <defs>
            <radialGradient id={gradient} cx="0.3" cy="1.07" r="1.3">
              <stop offset="0.1" stopColor="#FFDD55" />
              <stop offset="0.5" stopColor="#FF543E" />
              <stop offset="1" stopColor="#C837AB" />
            </radialGradient>
          </defs>
          <path d={PLATFORM_PATHS.instagram} fill={`url(#${gradient})`} />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...box} overflow="visible">
          <path d={PLATFORM_PATHS.tiktok} fill="#25F4EE" transform="translate(-0.7 -0.7)" />
          <path d={PLATFORM_PATHS.tiktok} fill="#FE2C55" transform="translate(0.7 0.7)" />
          <path d={PLATFORM_PATHS.tiktok} className={INK_GLYPH} />
        </svg>
      );
    case "youtube":
      return (
        <svg {...box}>
          <path d="M9.545 15.568V8.432L15.818 12z" fill="#FFFFFF" />
          <path d={PLATFORM_PATHS.youtube} fill="#FF0000" />
        </svg>
      );
    case "x":
      return (
        <svg {...box}>
          <path d={PLATFORM_PATHS.x} className={INK_GLYPH} />
        </svg>
      );
    default:
      return <Globe aria-hidden className="size-4.5 shrink-0 text-muted-foreground" />;
  }
}

/**
 * First social profile: pick a platform, type the handle after its prefix
 * ("Other" takes a full link). Submits the assembled https link as `url`.
 */
export function SocialProfileField({ state }: { state: FormState }) {
  const [platform, setPlatform] = useState<Platform>("instagram");
  // Kept per kind of input, so switching platforms never loses what was typed.
  const [handle, setHandle] = useState("");
  const [link, setLink] = useState("");
  const handleRef = useRef<HTMLInputElement>(null);
  const chips = useRef<(HTMLButtonElement | null)[]>([]);
  const invalid = Boolean(state.status === "error" && state.fieldErrors?.url);
  const option = PLATFORMS.find((candidate) => candidate.value === platform)!;
  // The server only knows links; for an empty handle, ask for the handle instead.
  const errors =
    invalid && option.prefix && !handle.trim().replace(/^@+/, "")
      ? [{ message: `Enter your ${option.label} handle.` }]
      : fieldErrorsFor(state, "url");

  // Radio group keys: arrows move and select, Home/End jump to the ends.
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let target: number;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") target = (index + 1) % PLATFORMS.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") target = (index - 1 + PLATFORMS.length) % PLATFORMS.length;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = PLATFORMS.length - 1;
    else return;
    event.preventDefault();
    chips.current[target]?.focus();
    setPlatform(PLATFORMS[target].value);
  }

  return (
    <>
      <input type="hidden" name="url" value={profileUrl(platform, handle, link)} />
      {/* Buttons, not native radios: React's form reset after an error would snap radios back to the first choice. */}
      <div className="flex flex-col gap-3">
        <span id="platform-label" className="text-sm font-medium">
          Platform
        </span>
        <div role="radiogroup" aria-labelledby="platform-label" className="flex flex-wrap gap-2">
          {PLATFORMS.map(({ value, label }, index) => {
            const checked = platform === value;
            return (
              <button
                key={value}
                ref={(node) => {
                  chips.current[index] = node;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                onClick={() => setPlatform(value)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold outline-none transition-colors duration-200 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
                  checked ? "border-primary bg-primary/10" : "bg-background hover:border-foreground/30",
                )}
              >
                <PlatformMark platform={value} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <Field data-invalid={invalid}>
        {option.prefix ? (
          <>
            <FieldLabel htmlFor="profile-handle">Your {option.label} handle</FieldLabel>
            {/* One bordered box: the fixed prefix, then the handle. Clicking the prefix focuses the input. */}
            <div
              onClick={() => handleRef.current?.focus()}
              className={cn(
                "flex h-10 w-full min-w-0 cursor-text items-center rounded-lg border border-input bg-card transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
                invalid && "border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40",
              )}
            >
              <span id="profile-prefix" className="shrink-0 pl-3 text-base text-muted-foreground select-none md:text-sm">
                {option.prefix}
              </span>
              <input
                ref={handleRef}
                id="profile-handle"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                required
                placeholder="yourname"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                aria-describedby="profile-prefix profile-hint"
                aria-invalid={invalid}
                className="h-full w-full min-w-0 bg-transparent pr-3 text-base outline-none placeholder:text-muted-foreground md:text-sm"
              />
            </div>
          </>
        ) : (
          <>
            <FieldLabel htmlFor="profile-link">Link to your profile</FieldLabel>
            <Input
              id="profile-link"
              inputMode="url"
              autoComplete="url"
              required
              placeholder="https://yoursite.com"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              aria-describedby="profile-hint"
              aria-invalid={invalid}
            />
          </>
        )}
        <FieldDescription id="profile-hint">
          You can add more profiles later. We show the link as provided and don’t verify ownership yet.
        </FieldDescription>
        {errors ? <FieldError data-field-error="url" errors={errors} /> : null}
      </Field>
    </>
  );
}
