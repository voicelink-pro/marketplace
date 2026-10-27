export type MediaTarget = "coverImageUrl" | "logoUrl" | "videoUrl" | "screenshot";

export const MEDIA_TARGET_LABELS: Record<MediaTarget, string> = {
  coverImageUrl: "Tile cover",
  logoUrl: "Logo",
  screenshot: "Screenshot",
  videoUrl: "Product video",
};
