import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { HomeAudience } from "../audience";
import { APP_TESTIMONIALS, CREATOR_TESTIMONIALS } from "../testimonials-data";

const CONTENT = {
  creators: { heading: "What creators say", items: CREATOR_TESTIMONIALS },
  apps: { heading: "What apps say", items: APP_TESTIMONIALS },
} satisfies Record<HomeAudience, unknown>;

/** Three quote cards for the selected side; one column on phones. */
export function Testimonials({ audience }: { audience: HomeAudience }) {
  const content = CONTENT[audience];
  return (
    <section aria-labelledby="testimonials-heading" className="flex flex-col gap-4 sm:gap-6">
      <h2 id="testimonials-heading" className="text-2xl leading-tight font-extrabold tracking-[-0.04em] sm:text-3xl">
        {content.heading}
      </h2>
      <ul className="grid gap-4 md:grid-cols-3">
        {content.items.map((item) => (
          <li key={item.name} className="flex">
            <figure className="flex w-full flex-col justify-between gap-6 rounded-[20px] border bg-card p-6">
              <blockquote className="text-base text-pretty">“{item.quote}”</blockquote>
              <figcaption className="flex items-center gap-3">
                <Avatar className="size-10">
                  {item.avatarUrl ? <AvatarImage src={item.avatarUrl} alt="" /> : null}
                  <AvatarFallback className="bg-muted font-bold">{item.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-bold">{item.name}</span>
                  <span className="truncate text-sm text-muted-foreground">{item.role}</span>
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
