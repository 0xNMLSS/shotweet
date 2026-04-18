/**
 * @jest-environment node
 */

jest.mock("@/lib/scraper/twitter", () => ({
  scrapeTweet: jest.fn(),
}));

jest.mock("@/lib/renderer/screenshot", () => ({
  renderPosterImage: jest.fn(),
}));

import { POST } from "@/app/api/poster/route";
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

describe("POST /api/poster", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns ok and asset payload when scrape and render succeed", async () => {
    mockedScrapeTweet.mockResolvedValue(sampleTweet);
    mockedRenderPosterImage.mockResolvedValue({
      filename: "1713542400000-a1b2c3d4.png",
      width: 1080,
      height: 2000,
    });

    const req = new Request("http://localhost/api/poster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://x.com/sama/status/1913240824012345678" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      asset: {
        id: string;
        sourceUrl: string;
        downloadUrl: string;
        contentType: string;
        filename: string;
        width: number;
        height: number;
        provider: string;
        type: string;
      };
    };

    expect(json.ok).toBe(true);
    expect(json.asset).toMatchObject({
      sourceUrl: sampleTweet.url,
      downloadUrl: "/posters/1713542400000-a1b2c3d4.png",
      contentType: "image/png",
      filename: "1713542400000-a1b2c3d4.png",
      width: 1080,
      height: 2000,
      provider: "twitter",
      type: "poster",
    });
    expect(json.asset.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(mockedScrapeTweet).toHaveBeenCalledWith("https://x.com/sama/status/1913240824012345678");
    expect(mockedRenderPosterImage).toHaveBeenCalledTimes(1);
    const renderId = mockedRenderPosterImage.mock.calls[0]?.[0];
    expect(renderId).toBe(json.asset.id);
  });

  it("returns ok false when scrapeTweet throws", async () => {
    mockedScrapeTweet.mockRejectedValue(new Error("Tweet not found"));

    const req = new Request("http://localhost/api/poster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://x.com/sama/status/1913240824012345678" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = (await res.json()) as { ok: boolean; message: string };
    expect(json.ok).toBe(false);
    expect(json.message).toBe("Tweet not found");
    expect(mockedRenderPosterImage).not.toHaveBeenCalled();
  });

  it("returns ok false when renderPosterImage throws", async () => {
    mockedScrapeTweet.mockResolvedValue(sampleTweet);
    mockedRenderPosterImage.mockRejectedValue(new Error("screenshot failed"));

    const req = new Request("http://localhost/api/poster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://x.com/sama/status/1913240824012345678" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = (await res.json()) as { ok: boolean; message: string };
    expect(json.ok).toBe(false);
    expect(json.message).toBe("screenshot failed");
  });

  it("returns 400 when body url is invalid", async () => {
    const req = new Request("http://localhost/api/poster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "not-a-url" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { ok: boolean; message: string };
    expect(json.ok).toBe(false);
    expect(json.message).toBe("Invalid request body.");
    expect(mockedScrapeTweet).not.toHaveBeenCalled();
  });
});
