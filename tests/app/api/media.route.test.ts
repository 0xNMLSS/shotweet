/**
 * @jest-environment node
 */

jest.mock("@/lib/scraper/twitter", () => ({
  scrapeTweet: jest.fn(),
}));

jest.mock("@/lib/renderer/screenshot", () => ({
  renderPosterImage: jest.fn(),
}));

import { POST } from "@/app/api/media/route";
import { renderPosterImage } from "@/lib/renderer/screenshot";
import { scrapeTweet } from "@/lib/scraper/twitter";
import type { TweetData } from "@/lib/scraper/types";

const mockedScrapeTweet = jest.mocked(scrapeTweet);
const mockedRenderPosterImage = jest.mocked(renderPosterImage);

const sampleTweet: TweetData = {
  id: "1913240824012345678",
  url: "https://x.com/sama/status/1913240824012345678",
  author: {
    name: "Sam",
    handle: "sama",
    avatar: "https://pbs.twimg.com/profile_images/1.jpg",
    verified: true,
  },
  body: { text: "Hello", entities: [] },
  media: [],
  stats: { replies: 1, retweets: 2, likes: 3 },
  createdAt: "2025-04-18T12:00:00.000Z",
};

describe("POST /api/media (MultiMediaSaver-compatible)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns assets array with a single PNG poster asset", async () => {
    mockedScrapeTweet.mockResolvedValue(sampleTweet);
    mockedRenderPosterImage.mockResolvedValue({
      filename: "1713542400000-a1b2c3d4.png",
      width: 1080,
      height: 2000,
    });

    const req = new Request("http://localhost/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://x.com/sama/status/1913240824012345678" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      assets: Array<{
        id: string;
        sourceUrl: string;
        downloadUrl: string;
        contentType: string;
        filename: string;
        provider: string;
        type: string;
        width: number;
        height: number;
      }>;
    };

    expect(json.ok).toBe(true);
    expect(Array.isArray(json.assets)).toBe(true);
    expect(json.assets).toHaveLength(1);
    expect(json.assets[0]).toMatchObject({
      sourceUrl: sampleTweet.url,
      downloadUrl: "/posters/1713542400000-a1b2c3d4.png",
      contentType: "image/png",
      filename: "1713542400000-a1b2c3d4.png",
      provider: "twitter",
      type: "image",
      width: 1080,
      height: 2000,
    });
    expect(json.assets[0]!.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("returns 400 with mediasaver-style message when url is invalid", async () => {
    const req = new Request("http://localhost/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "not-a-url" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { ok: boolean; message: string };
    expect(json).toEqual({ ok: false, message: "Invalid URL provided" });
    expect(mockedScrapeTweet).not.toHaveBeenCalled();
  });

  it("returns ok:false when scrapeTweet fails", async () => {
    mockedScrapeTweet.mockRejectedValue(new Error("Tweet not found"));

    const req = new Request("http://localhost/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://x.com/sama/status/1913240824012345678" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = (await res.json()) as { ok: boolean; message: string };
    expect(json).toEqual({ ok: false, message: "Tweet not found" });
    expect(mockedRenderPosterImage).not.toHaveBeenCalled();
  });
});
