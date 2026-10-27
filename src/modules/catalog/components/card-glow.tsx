"use client";

import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useMediaQuery, usePrefersReducedMotion } from "./use-media-query";

/** Brand-yellow conic glow; overrides the component's inline multicolor gradient. */
const YELLOW_GLOW =
  "[--gradient:repeating-conic-gradient(from_236.84deg_at_50%_50%,var(--primary)_0%,color-mix(in_oklch,var(--primary)_30%,transparent)_10%,var(--primary)_20%)]!";

/**
 * Border glow that follows the pointer around an offer card. Only for a
 * fine pointer that can hover, and never with reduced motion.
 */
export function CardGlow() {
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)", false);
  const reducedMotion = usePrefersReducedMotion();
  if (!finePointer || reducedMotion) return null;

  return (
    <GlowingEffect
      disabled={false}
      spread={40}
      proximity={64}
      inactiveZone={0.01}
      borderWidth={2}
      className={YELLOW_GLOW}
    />
  );
}
