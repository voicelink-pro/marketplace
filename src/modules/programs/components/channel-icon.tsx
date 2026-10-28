import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isBrandPlatform, PlatformTile } from "./home/illustrations";

const SIZES = {
  sm: { tile: "size-5.5 rounded-md", icon: "size-3.5" },
  md: { tile: "size-6 rounded-[7px]", icon: "size-3.5" },
} as const;

/** The platform's brand tile for TikTok, Instagram, YouTube and X; a neutral link tile otherwise. */
export function ChannelIcon({
  channel,
  size = "sm",
  className,
}: {
  channel: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const sizes = SIZES[size];
  if (channel && isBrandPlatform(channel)) return <PlatformTile platform={channel} className={cn(sizes.tile, className)} />;
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center bg-muted text-muted-foreground", sizes.tile, className)}
    >
      <Link2 className={sizes.icon} />
    </span>
  );
}
