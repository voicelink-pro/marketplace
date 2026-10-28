/**
 * Horizontal snap scroller of ScrollRow, in a plain module so server
 * components can use it too (creator Home's Get started scrolls on phones only).
 * `relative`: absolutely positioned descendants (sr-only text) must be clipped
 * by the scroller, not widen the page.
 */
export const scrollerClassName =
  "relative flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
