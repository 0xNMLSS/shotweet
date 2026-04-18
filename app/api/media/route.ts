import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPosterAsset } from "@/lib/api/buildPoster";

const bodySchema = z.object({
  url: z.string().url(),
});

/**
 * MultiMediaSaver-compatible endpoint for iOS Shortcuts.
 *
 * Request:  `POST /api/media` with JSON `{ "url": "<tweet url>" }`.
 * Response: `{ ok: true, assets: [PosterAsset] }`.
 *
 * The shotweet pipeline always produces exactly one asset (the rendered PNG),
 * but the response is an array for parity with mediasaver consumers that
 * iterate over `assets`.
 */
export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const { url } = bodySchema.parse(json);
    const asset = await buildPosterAsset(url);
    return NextResponse.json({ ok: true, assets: [asset] });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Invalid URL provided"
        : error instanceof Error
          ? error.message
          : "Failed to render poster.";
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
