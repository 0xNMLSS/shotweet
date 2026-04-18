import { extractTweetId } from "@/lib/twitter/url";
import { upgradeAvatarUrl, upgradeMediaUrl } from "@/lib/twitter/media";
import type { TweetData } from "@/lib/scraper/types";

function loadJSDOM() {
  if (typeof globalThis.TextEncoder === "undefined") {
    const { TextEncoder, TextDecoder } = require("node:util") as typeof import("node:util");
    globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
    globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
  }
  return require("jsdom") as typeof import("jsdom");
}

function handleFromStatusHref(href: string | null | undefined): string {
  if (!href) return "";
  try {
    const pathname = href.startsWith("http") ? new URL(href).pathname : href;
    const parts = pathname.split("/").filter(Boolean);
    const statusIdx = parts.indexOf("status");
    if (statusIdx >= 1) return parts[0] ?? "";
    return parts[0] ?? "";
  } catch {
    return "";
  }
}

function absoluteStatusUrl(href: string | null | undefined): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return `https://x.com${href.startsWith("/") ? href : `/${href}`}`;
}

/** First nested tweet card inside this node (excludes the root when it is itself a tweet). */
function firstNestedTweetCard(tweet: Element): Element | null {
  return tweet.querySelector('[data-testid="tweet"]');
}

function parseTweetNode(tweet: Element, url: string): TweetData {
  const innerQuote = firstNestedTweetCard(tweet);

  const parseCompactNumber = (raw: string): number => {
    const match = raw.match(/([\d.,]+)\s*([KMB]?)/i);
    if (!match) return 0;
    const base = Number(match[1]!.replace(/,/g, ""));
    if (Number.isNaN(base)) return 0;
    const suffix = match[2]?.toUpperCase();
    const factor = suffix === "K" ? 1_000 : suffix === "M" ? 1_000_000 : suffix === "B" ? 1_000_000_000 : 1;
    return Math.round(base * factor);
  };

  const readCount = (testId: string, segment: string) => {
    const buttons = Array.from(tweet.querySelectorAll(`[data-testid="${testId}"]`)).filter(
      (node) => !innerQuote || !innerQuote.contains(node),
    );
    for (const button of buttons) {
      const aria = button.getAttribute("aria-label") ?? "";
      const re = new RegExp(`([\\d.,]+\\s*[KMB]?)\\s+${segment}`, "i");
      const m = aria.match(re);
      if (m) return parseCompactNumber(m[1]!);
      const text = button.textContent?.trim() ?? "";
      if (text) {
        const n = parseCompactNumber(text);
        if (n) return n;
      }
    }
    return 0;
  };

  /**
   * View count. X often puts **no** `data-testid="analytics"` (logged-out / new UI); instead the
   * whole engagement row is summarized on a parent `div` aria-label like:
   * `"108 replies, 810 reposts, 5151 likes, 164 bookmarks, 69672 views"` (no role="group").
   * We scan every `[aria-label]` under the tweet and parse `… views` / 次观看.
   */
  const readViews = (): number => {
    const inScope = (node: Element) => !innerQuote || !innerQuote.contains(node);

    const fromAria = (aria: string): number | null => {
      let m = aria.match(/([\d.,]+\s*[KMB]?)\s+views?\b/i);
      if (m) return parseCompactNumber(m[1]!);
      m = aria.match(/([\d.,]+\s*[KMB]?)次观看/);
      if (m) return parseCompactNumber(m[1]!);
      m = aria.match(/观看[：:\s]*([\d.,]+\s*[KMB]?)/);
      if (m) return parseCompactNumber(m[1]!);
      return null;
    };

    for (const el of Array.from(tweet.querySelectorAll('[data-testid="analytics"]')).filter(inScope)) {
      const n = fromAria(el.getAttribute("aria-label") ?? "");
      if (n !== null) return n;
    }

    for (const el of Array.from(tweet.querySelectorAll("[aria-label]")).filter(inScope)) {
      const n = fromAria(el.getAttribute("aria-label") ?? "");
      if (n !== null) return n;
    }

    return 0;
  };

  const statusLink = tweet.querySelector('a[href*="/status/"]');
  const body =
    tweet.querySelector('[data-testid="tweetText"]')?.textContent?.trim() ?? "";

  const mediaImages = Array.from(tweet.querySelectorAll('img[src*="pbs.twimg.com/media"]')).filter(
    (img) => !innerQuote || !innerQuote.contains(img)
  );
  const images = mediaImages.map((img) => ({
    type: "image" as const,
    src: upgradeMediaUrl(img.getAttribute("src") ?? ""),
    alt: img.getAttribute("alt") ?? undefined,
  }));

  const profileImages = Array.from(tweet.querySelectorAll('img[src*="profile_images"]')).filter(
    (img) => !innerQuote || !innerQuote.contains(img)
  );
  const avatar = upgradeAvatarUrl(profileImages[0]?.getAttribute("src") ?? "");

  const verifiedInScope = innerQuote
    ? Array.from(tweet.querySelectorAll('[data-testid="icon-verified"]')).find(
        (node) => !innerQuote.contains(node)
      )
    : tweet.querySelector('[data-testid="icon-verified"]');

  return {
    id: extractTweetId(url),
    url,
    author: {
      name: tweet.querySelector('[data-testid="User-Name"] span')?.textContent?.trim() ?? "",
      handle: handleFromStatusHref(statusLink?.getAttribute("href")),
      avatar,
      verified: Boolean(verifiedInScope),
    },
    body: { text: body, entities: [] },
    media: images,
    stats: {
      replies: readCount("reply", "repl"),
      retweets: readCount("retweet", "repost"),
      likes: readCount("like", "like"),
      views: readViews(),
    },
    createdAt: tweet.querySelector("time")?.getAttribute("datetime") ?? new Date(0).toISOString(),
  };
}

export function extractTweetData(html: string, url: string): TweetData {
  const { JSDOM } = loadJSDOM();
  const dom = new JSDOM(html);
  const { document } = dom.window;
  const allTweets = Array.from(document.querySelectorAll('[data-testid="tweet"]'));
  if (allTweets.length === 0) throw new Error("Tweet not found or inaccessible");

  const mainEl = allTweets[0]!;
  const quotedEl = allTweets.find((el, index) => index > 0 && mainEl.contains(el));

  const main = parseTweetNode(mainEl, url);
  if (quotedEl) {
    const quotedUrl = absoluteStatusUrl(quotedEl.querySelector('a[href*="/status/"]')?.getAttribute("href"));
    main.quoted = parseTweetNode(quotedEl, quotedUrl || url);
  }
  return main;
}
