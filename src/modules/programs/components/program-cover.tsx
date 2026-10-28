import { cn } from "@/lib/utils";
import { AppLogo } from "@/modules/catalog/components/app-card";
import type { CreatorProgramSummary } from "../queries";

const SIZES = {
  card: {
    cover: "h-[110px]",
    initial: "text-5xl",
    logo: "-bottom-5 left-4 size-12 rounded-[14px] text-xl",
  },
  hero: {
    cover: "h-[150px]",
    initial: "text-6xl",
    logo: "-bottom-7 left-5 size-[72px] rounded-[18px] text-3xl",
  },
} as const;

/**
 * The listing's own cover with its logo over the bottom-left edge; without a
 * cover, a neutral one with the initial. `children` sit on top (e.g. a badge).
 */
export function ProgramCover({
  program,
  size = "card",
  children,
}: {
  program: Pick<CreatorProgramSummary, "appName" | "logoUrl" | "coverImageUrl">;
  size?: keyof typeof SIZES;
  children?: React.ReactNode;
}) {
  const sizes = SIZES[size];
  return (
    <div className={cn("relative shrink-0 bg-muted", sizes.cover)}>
      {program.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={program.coverImageUrl} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <span aria-hidden className={cn("grid size-full place-items-center font-extrabold text-foreground/10", sizes.initial)}>
          {program.appName.slice(0, 1).toUpperCase()}
        </span>
      )}
      <AppLogo
        app={{ name: program.appName, logoUrl: program.logoUrl }}
        className={cn("absolute border-[3px] border-card", sizes.logo)}
      />
      {children}
    </div>
  );
}
