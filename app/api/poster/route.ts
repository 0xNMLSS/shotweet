import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPosterPublicUrl } from "@/lib/posters/storage";
import { setRenderTweet } from "@/lib/renderer/cache";
import { renderPosterImage } from "@/lib/renderer/screenshot";
import { scrapeTweet } from "@/lib/scraper/twitter";

const bodySchema = z.object({
  url: z.string().url(),
});

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const { url } = bodySchema.parse(json);
    const tweet = await scrapeTweet(url);
    const renderId = randomUUID();
    setRenderTweet(renderId, tweet);
    const { filename, width, height } = await renderPosterImage(renderId);
    return NextResponse.json({
      ok: true,
      asset: {
        id: renderId,
        sourceUrl: tweet.url,
        downloadUrl: getPosterPublicUrl(filename),
        contentType: "image/png",
        filename,
        width,
        height,
        provider: "twitter",
        type: "poster",
      },
    });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Invalid request body."
        : error instanceof Error
          ? error.message
          : "Failed to render poster.";
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
