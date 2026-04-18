import fs from "node:fs/promises";
import path from "node:path";
import { getBrowser } from "@/lib/playwright/pool";
import { createPosterFilename, getPosterAbsolutePath } from "@/lib/posters/storage";

const INTERNAL_RENDER_HOST = process.env.INTERNAL_RENDER_HOST ?? "http://localhost:3000";

export async function renderPosterImage(renderId: string): Promise<{
  filename: string;
  width: number;
  height: number;
}> {
  const seed = renderId.slice(0, 8);
  const filename = createPosterFilename(seed);
  const absolutePath = getPosterAbsolutePath(filename);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });

  const browser = await getBrowser();
  const context = await browser.newContext({
    // Viewport >= the 4:5 minimum poster height so the page lays out without
    // forcing an internal scroll for short tweets. Tall posters are captured
    // via element screenshot which sees the full layout regardless of viewport.
    viewport: { width: 1080, height: 1920 },
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
    return {
      filename,
      width: Math.round(box.width),
      height: Math.round(box.height),
    };
  } finally {
    await context.close();
  }
}
