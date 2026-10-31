/** The apps home page's pricing section (`#pricing`). A placeholder for now: only its heading. `/` has `CreatorPricing`. */
export function HomePricing() {
  return (
    // Below lg the header carries the audience row, so the anchor needs more room.
    <section id="pricing" aria-labelledby="pricing-heading" className="scroll-mt-36 lg:scroll-mt-24">
      <h2 id="pricing-heading" className="text-2xl leading-tight font-extrabold tracking-[-0.04em] sm:text-3xl">
        Pricing
      </h2>
    </section>
  );
}
