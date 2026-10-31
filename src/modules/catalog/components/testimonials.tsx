import { APP_TESTIMONIALS } from "../testimonials-data";
import { TestimonialBoard } from "./testimonial-board";

/** The hero's key phrase color: yellow letters. */
const KEY_PHRASE = "text-primary";

/**
 * Founders' testimonials on the apps home page: the heading and subtitle in the
 * middle of a stage of draggable quote cards (from lg), or above a swipeable row
 * of them (below lg). No CTA of its own.
 */
export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-heading" className="mx-auto w-full max-w-6xl">
      <TestimonialBoard items={APP_TESTIMONIALS}>
        <h2
          id="testimonials-heading"
          className="text-[34px] leading-[1.04] font-extrabold tracking-[-0.045em] text-balance sm:text-[44px] lg:text-[52px]"
        >
          Loved by <span className={KEY_PHRASE}>apps</span> that pay only for results
        </h2>
        <p className="max-w-[500px] text-base text-pretty text-muted-foreground sm:text-[17px]">Hear from founders who grow with creators and pay only when customers pay.</p>
      </TestimonialBoard>
    </section>
  );
}
