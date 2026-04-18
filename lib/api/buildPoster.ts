import { randomUUID } from "node:crypto";
import { getPosterPublicUrl } from "@/lib/posters/storage";
import { setRenderTweet } from "@/lib/renderer/cache";
import { renderPosterImage } from "@/lib/renderer/screenshot";
import { scrapeTweet } from "@/lib/scraper/twitter";

export type PosterAsset = {
  id: string;
  sourceUrl: string;
  downloadUrl: string;
  contentType: "image/png";
  filename: string;
  width: number;
  height: number;
  provider: "twitter";
  /**
   * `image` mirrors the MultiMediaSaver `/api/media` contract so existing
   * iOS Shortcuts can branch on `type === "image"`. The asset is still a
   * generated poster PNG.
   */
  type: "image";
};

/**
 * Scrape `url`, render the poster, and return the asset payload shared by
 * `/api/poster` and the MultiMediaSaver-compatible `/api/media`.
 */
export async function buildPosterAsset(url: string): Promise<PosterAsset> {
  const tweet = await scrapeTweet(url);
  const renderId = randomUUID();
  setRenderTweet(renderId, tweet);
  const { filename, width, height } = await renderPosterImage(renderId);
  return {
    id: renderId,
    sourceUrl: tweet.url,
    downloadUrl: getPosterPublicUrl(filename),
    contentType: "image/png",
    filename,
    width,
    height,
    provider: "twitter",
    type: "image",
  };
}
