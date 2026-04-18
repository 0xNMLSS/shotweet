import fs from "node:fs/promises";
import path from "node:path";
import { getBrowser } from "@/lib/playwright/pool";
import { createPosterFilename, getPosterAbsolutePath } from "@/lib/posters/storage";

const INTERNAL_RENDER_HOST = process.env.INTERNAL_RENDER_HOST ?? "http://localhost:3000";

const DEFAULT_PIXEL_RATIO = 3;
const MIN_PIXEL_RATIO = 1;
const MAX_PIXEL_RATIO = 3;

/**
 * Resolve the screenshot device-pixel-ratio from `POSTER_PIXEL_RATIO`.
 * Clamped to [1, 3]; falls back to 3 (Retina-class) when unset/invalid.
 * 3x makes body text and the avatar render crisply on @2x/@3x phone screens
 * at the cost of ~6-8x file size compared to 1x.
 */
export function resolvePixelRatio(raw = process.env.POSTER_PIXEL_RATIO): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return DEFAULT_PIXEL_RATIO;
  return Math.min(MAX_PIXEL_RATIO, Math.max(MIN_PIXEL_RATIO, parsed));
}

export async function renderPosterImage(renderId: string): Promise<{
  filename: string;
  width: number;
  height: number;
}> {
  const seed = renderId.slice(0, 8);
  const filename = createPosterFilename(seed);
  const absolutePath = getPosterAbsolutePath(filename);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });

  const pixelRatio = resolvePixelRatio();
  const browser = await getBrowser();
  const context = await browser.newContext({
    // Viewport >= the 4:5 minimum poster height so the page lays out without
    // forcing an internal scroll for short tweets. Tall posters are captured
    // via element screenshot which sees the full layout regardless of viewport.
    viewport: { width: 1080, height: 1920 },
    // Retina-style rasterization: layout stays in 1080 CSS px but Chromium
    // paints each pixel `deviceScaleFactor`-times denser, so the resulting
    // PNG carries enough detail for sharp text on phone screens.
    deviceScaleFactor: pixelRatio,
  });

  try {
    const page = await context.newPage();
    const host = INTERNAL_RENDER_HOST.replace(/\/$/, "");
    await page.goto(`${host}/render/${renderId}`, { waitUntil: "networkidle" });
    const poster = page.locator("#poster");
    const box = await poster.boundingBox();
    if (!box) {
      throw new Error("Failed to locate #poster for screenshot");
    }
    await poster.screenshot({ path: absolutePath, type: "png" });
    // boundingBox() reports CSS pixels; the PNG file is `pixelRatio`-times
    // larger on each axis, so report the physical PNG size to API consumers.
    return {
      filename,
      width: Math.round(box.width * pixelRatio),
      height: Math.round(box.height * pixelRatio),
    };
  } finally {
    await context.close();
  }
}
