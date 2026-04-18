import fs from "node:fs";
import path from "node:path";
import { extractTweetData } from "@/lib/scraper/extractTweetData";

function readFixture(name: string) {
  return fs.readFileSync(path.join(process.cwd(), "tests", "fixtures", "twitter", name), "utf8");
}

describe("extractTweetData", () => {
  it("parses a plain tweet with one image", () => {
    const html = readFixture("plain.html");
    const result = extractTweetData(html, "https://x.com/sama/status/1913240824012345678");
    expect(result).toMatchObject({
      id: "1913240824012345678",
      author: { handle: "sama" },
      media: [{ type: "image" }],
      stats: { replies: 2432, retweets: 18700, likes: 92000, views: 50000 },
    });
  });

  it("parses a quote tweet one level deep", () => {
    const html = readFixture("quote.html");
    const result = extractTweetData(html, "https://x.com/sama/status/1913240824012345680");
    expect(result.quoted?.author.handle).toBe("jack");
    expect(result.quoted?.body.text).toContain("hello world");
  });

  it("reads counts from <button> aria-labels (real X toolbar markup)", () => {
    const html = `
      <article data-testid="tweet">
        <div data-testid="User-Name"><span>Liyuu</span></div>
        <a href="https://x.com/Liyu0109/status/2041084860052406782">View</a>
        <div data-testid="tweetText">hi</div>
        <img src="https://pbs.twimg.com/profile_images/1/avatar.jpg" alt="" />
        <div role="group" aria-label="92 replies, 34 reposts, 1234 likes, 27000 views">
          <a href="#" data-testid="reply" aria-label="92 Replies. Reply">
            <span>92</span>
          </a>
          <button data-testid="retweet" aria-label="34 reposts. Repost">
            <span>34</span>
          </button>
          <button data-testid="like" aria-label="1,234 Likes. Like">
            <span>1.2K</span>
          </button>
        </div>
        <time datetime="2026-04-06T09:25:00.000Z">Apr 6, 2026</time>
      </article>
    `;
    const result = extractTweetData(html, "https://x.com/Liyu0109/status/2041084860052406782");
    expect(result.stats).toEqual({ replies: 92, retweets: 34, likes: 1234, views: 27000 });
  });

  it("parses views from Chinese 次观看 aria-label", () => {
    const html = `
      <article data-testid="tweet">
        <div data-testid="User-Name"><span>User</span></div>
        <a href="https://x.com/u/status/1">View</a>
        <div data-testid="tweetText">hi</div>
        <img src="https://pbs.twimg.com/profile_images/1/avatar.jpg" alt="" />
        <a href="#" data-testid="analytics" aria-label="9487次观看"><span>9.5K</span></a>
        <time datetime="2026-04-06T09:25:00.000Z">x</time>
      </article>
    `;
    const result = extractTweetData(html, "https://x.com/u/status/1");
    expect(result.stats.views).toBe(9487);
  });

  it("parses compact K/M counts from button text when aria-label is missing", () => {
    const html = `
      <article data-testid="tweet">
        <div data-testid="User-Name"><span>Foo</span></div>
        <a href="https://x.com/foo/status/1913240824012345678">View</a>
        <div data-testid="tweetText">hi</div>
        <img src="https://pbs.twimg.com/profile_images/1/avatar.jpg" alt="" />
        <button data-testid="reply"><span>1.2K</span></button>
        <button data-testid="retweet"><span>3M</span></button>
        <button data-testid="like"><span>500</span></button>
        <time datetime="2026-04-06T09:25:00.000Z">x</time>
      </article>
    `;
    const result = extractTweetData(html, "https://x.com/foo/status/1913240824012345678");
    expect(result.stats).toEqual({ replies: 1200, retweets: 3_000_000, likes: 500, views: 0 });
  });
});
