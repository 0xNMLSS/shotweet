import { extractTweetId, normalizeTweetUrl } from "@/lib/twitter/url";

describe("twitter url helpers", () => {
  it("extracts the tweet id from x.com and twitter.com urls", () => {
    expect(extractTweetId("https://x.com/sama/status/1913240824012345678")).toBe("1913240824012345678");
    expect(extractTweetId("https://twitter.com/sama/status/1913240824012345678")).toBe("1913240824012345678");
  });

  it("normalizes twitter.com to x.com", () => {
    expect(normalizeTweetUrl("https://twitter.com/sama/status/1913240824012345678")).toBe(
      "https://x.com/sama/status/1913240824012345678"
    );
  });
});
