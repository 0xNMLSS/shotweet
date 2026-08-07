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

  it("parses views from combined engagement aria-label on a wrapper div (no analytics testid)", () => {
    const html = `
      <article data-testid="tweet">
        <div data-testid="User-Name"><span>User</span></div>
        <a href="https://x.com/u/status/1">View</a>
        <div data-testid="tweetText">hi</div>
        <img src="https://pbs.twimg.com/profile_images/1/avatar.jpg" alt="" />
        <div aria-label="108 replies, 810 reposts, 5151 likes, 164 bookmarks, 69672 views">
          <a href="#" data-testid="reply" aria-label="108 Replies. Reply"><span>108</span></a>
        </div>
        <time datetime="2026-04-06T09:25:00.000Z">x</time>
      </article>
    `;
    const result = extractTweetData(html, "https://x.com/u/status/1");
    expect(result.stats.views).toBe(69672);
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

  it("parses the new logged-out X layout (article[data-tweet-id] + schema.org)", () => {
    const html = readFixture("new-layout-plain.html");
    const result = extractTweetData(html, "https://x.com/jack/status/20");
    expect(result).toMatchObject({
      id: "20",
      url: "https://x.com/jack/status/20",
      author: {
        name: "jack",
        handle: "jack",
        verified: true,
      },
      body: { text: "just setting up my twttr" },
      stats: {
        replies: 17976,
        retweets: 124816,
        likes: 308658,
      },
      createdAt: "2006-03-21T20:50:14.000Z",
    });
    expect(result.author.avatar).toContain("profile_images");
    expect(result.author.avatar).toContain("400x400");
  });

  it("parses media + views from new-layout schema.org ImageObject / ViewAction", () => {
    const html = readFixture("new-layout-media.html");
    const result = extractTweetData(
      html,
      "https://x.com/derbederdusler/status/1770888775830262034"
    );
    expect(result.id).toBe("1770888775830262034");
    expect(result.author.handle).toBe("derbederdusler");
    expect(result.stats).toMatchObject({
      replies: 23,
      retweets: 140,
      likes: 8053,
      views: 459559,
    });
    expect(result.media).toEqual([
      expect.objectContaining({
        type: "image",
        src: expect.stringContaining("pbs.twimg.com/media/GJN19MHXQAAeNDq"),
      }),
    ]);
    expect(result.media[0]!.src).toMatch(/name=large/);
  });

  it("selects the focal tweet by status id when the page also contains parent/replies", () => {
    const html = `
      <article data-tweet-id="20" itemtype="https://schema.org/SocialMediaPosting">
        <meta itemprop="articleBody" content="parent" />
        <meta itemprop="datePublished" content="2006-03-21T20:50:14.000Z" />
        <div itemprop="author" itemscope itemtype="https://schema.org/Person">
          <meta itemprop="name" content="jack" />
          <meta itemprop="alternateName" content="jack" />
          <meta itemprop="image" content="https://pbs.twimg.com/profile_images/1/a_400x400.jpg" />
        </div>
      </article>
      <article data-tweet-id="99" itemtype="https://schema.org/SocialMediaPosting">
        <meta itemprop="articleBody" content="focal tweet" />
        <meta itemprop="datePublished" content="2024-01-01T00:00:00.000Z" />
        <div itemprop="author" itemscope itemtype="https://schema.org/Person">
          <meta itemprop="name" content="Focal" />
          <meta itemprop="alternateName" content="focal" />
          <meta itemprop="image" content="https://pbs.twimg.com/profile_images/2/b_400x400.jpg" />
        </div>
        <div itemprop="interactionStatistic" itemscope itemtype="https://schema.org/InteractionCounter">
          <meta itemprop="interactionType" content="https://schema.org/LikeAction" />
          <meta itemprop="name" content="Likes" />
          <meta itemprop="userInteractionCount" content="7" />
        </div>
      </article>
    `;
    const result = extractTweetData(html, "https://x.com/focal/status/99");
    expect(result).toMatchObject({
      id: "99",
      author: { handle: "focal", name: "Focal" },
      body: { text: "focal tweet" },
      stats: { likes: 7 },
    });
  });

  it("parses a nested quote card in the new layout (no schema.org on the quote)", () => {
    const html = `
      <article data-tweet-id="111" itemtype="https://schema.org/SocialMediaPosting">
        <meta itemprop="articleBody" content="quoting this" />
        <meta itemprop="datePublished" content="2026-08-06T14:46:08.000Z" />
        <meta itemprop="url" content="https://x.com/hanamiya_nina/status/111" />
        <meta itemprop="isBasedOn" content="https://x.com/i/status/222" />
        <div itemprop="author" itemscope itemtype="https://schema.org/Person">
          <meta itemprop="name" content="花宮初奈" />
          <meta itemprop="alternateName" content="hanamiya_nina" />
          <meta itemprop="image" content="https://pbs.twimg.com/profile_images/1/a_400x400.jpg" />
        </div>
        <div itemprop="interactionStatistic" itemscope itemtype="https://schema.org/InteractionCounter">
          <meta itemprop="interactionType" content="https://schema.org/LikeAction" />
          <meta itemprop="name" content="Likes" />
          <meta itemprop="userInteractionCount" content="10" />
        </div>
        <article data-tweet-id="222">
          <a href="/bang_dream_info">
            <img src="https://pbs.twimg.com/profile_images/2/b_normal.jpg" alt="user avatar" />
          </a>
          <a href="https://x.com/bang_dream_info">バンドリ！ BanG Dream! 公式</a>
          <a href="https://x.com/bang_dream_info">@bang_dream_info</a>
          <a href="/bang_dream_info/status/222">10h</a>
          <div dir="auto">「バンドリ！TVLIVE 2026」出演者発表</div>
          <img src="https://pbs.twimg.com/media/QUOTEIMG?format=webp&name=medium" alt="flyer" />
        </article>
      </article>
    `;
    const result = extractTweetData(html, "https://x.com/hanamiya_nina/status/111");
    expect(result.media).toEqual([]);
    expect(result.quoted).toMatchObject({
      id: "222",
      author: {
        name: "バンドリ！ BanG Dream! 公式",
        handle: "bang_dream_info",
      },
      body: { text: "「バンドリ！TVLIVE 2026」出演者発表" },
      media: [{ type: "image", src: expect.stringContaining("QUOTEIMG") }],
    });
    expect(result.quoted!.author.avatar).toContain("400x400");
  });

  it("parses quote from the real new-layout fixture (hanamiya_nina)", () => {
    const html = readFixture("new-layout-quote.html");
    const result = extractTweetData(
      html,
      "https://x.com/hanamiya_nina/status/2085376885190725922"
    );
    expect(result.author.handle).toBe("hanamiya_nina");
    expect(result.body.text).toContain("出演情報");
    expect(result.media).toEqual([]);
    expect(result.quoted).toMatchObject({
      id: "2085364678113497118",
      author: { handle: "bang_dream_info" },
    });
    expect(result.quoted!.author.name).toMatch(/BanG Dream/);
    expect(result.quoted!.body.text).toContain("バンドリ！TVLIVE 2026");
    expect(result.quoted!.media[0]?.src).toContain("pbs.twimg.com/media");
  });
});
