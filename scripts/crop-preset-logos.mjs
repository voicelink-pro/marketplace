// Crops each demo preset's logo mark into public/demo/presets/logo-<slug>.png (128x128 app icon).
// Run: node scripts/crop-preset-logos.mjs
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const dir = fileURLToPath(new URL('../public/demo/presets/', import.meta.url));
const SIZE = 128;
// The square is this much larger than the mark, so the icon has a margin.
const MARGIN = 1.4;

// In 500x500 preset pixels: `mark` = the logo mark's bounds; `clip` = what the
// square may include (stops before the wordmark, the dashboard and stray decoration).
const PRESETS = {
  boxora: { mark: [125, 8, 180, 62], clip: [0, 0, 193, 73] },
  crewpass: { mark: [108, 18, 165, 85], clip: [0, 0, 174, 85] },
  draftly: { mark: [42, 24, 85, 71], clip: [0, 0, 97, 95] },
  lumio: { mark: [144, 18, 205, 80], clip: [0, 0, 209, 97] },
  mellow: { mark: [89, 19, 177, 97], clip: [44, 0, 188, 100] },
  monetra: { mark: [44, 30, 101, 79], clip: [0, 0, 128, 98] },
  orbitly: { mark: [64, 25, 136, 83], clip: [60, 20, 147, 92] },
  payvio: { mark: [48, 20, 93, 71], clip: [0, 0, 104, 92] },
  pipely: { mark: [132, 17, 188, 79], clip: [0, 0, 197, 97] },
  stacklane: { mark: [121, 17, 156, 80], clip: [0, 0, 168, 97] },
};

/** Median color of the region's border pixels: the background around the mark. */
function borderColor({ data, info }) {
  const channels = [[], [], []];
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (x > 0 && y > 0 && x < info.width - 1 && y < info.height - 1) continue;
      const i = (y * info.width + x) * info.channels;
      for (let c = 0; c < 3; c++) channels[c].push(data[i + c]);
    }
  }
  const [r, g, b] = channels.map((values) => values.sort((a, z) => a - z)[values.length >> 1]);
  return { r, g, b, alpha: 1 };
}

for (const [slug, { mark, clip }] of Object.entries(PRESETS)) {
  const [mx0, my0, mx1, my1] = mark;
  const side = Math.round(Math.max(mx1 - mx0, my1 - my0) * MARGIN);
  const square = { x: Math.round((mx0 + mx1 - side) / 2), y: Math.round((my0 + my1 - side) / 2) };
  // The part of the square inside `clip`; the rest is padded with the background color.
  const left = Math.max(square.x, clip[0]);
  const top = Math.max(square.y, clip[1]);
  const right = Math.min(square.x + side, clip[2]);
  const bottom = Math.min(square.y + side, clip[3]);
  const region = sharp(`${dir}${slug}.png`).removeAlpha().extract({ left, top, width: right - left, height: bottom - top });
  const raw = await region.clone().raw().toBuffer({ resolveWithObject: true });
  await region
    .extend({
      left: left - square.x,
      top: top - square.y,
      right: square.x + side - right,
      bottom: square.y + side - bottom,
      background: borderColor(raw),
    })
    .resize(SIZE, SIZE, { kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toFile(`${dir}logo-${slug}.png`);
  console.log(`logo-${slug}.png  ${side}px square, padded ${left - square.x}/${top - square.y}/${square.x + side - right}/${square.y + side - bottom}`);
}
