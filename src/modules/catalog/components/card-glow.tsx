"use client";

import { GlowingEffect } from "@/components/ui/glowing-effect";
import { YELLOW_GLOW } from "./glow-styles";
import { useMediaQuery, usePrefersReducedMotion } from "./use-media-query";

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
