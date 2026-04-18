# Shotweet MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-hosted Next.js 14 + Playwright app that turns a public Twitter/X post URL into a vertical PNG poster, with a browser UI and a MultiMediaSaver-compatible JSON API for iPhone Shortcuts.

**Architecture:** A single Next.js process serves the form UI, the internal render page, and the `POST /api/poster` route. One long-lived Playwright browser is reused to scrape tweet data from `x.com`, render an internal React poster page, and screenshot it to `tmp/posters`, which is then exposed as `/posters/<filename>`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Jest + Testing Library, Playwright, Docker Compose.

---

## File Map

### App entrypoints
- Create: `app/layout.tsx` — root layout and metadata.
- Create: `app/globals.css` — Tailwind imports and shared dark theme.
- Create: `app/page.tsx` — homepage shell.
- Create: `app/render/[id]/page.tsx` — internal render target for Playwright screenshots.
- Create: `app/api/poster/route.ts` — JSON API that validates input, scrapes, renders, and responds with poster metadata.

### UI components
- Create: `components/PosterGeneratorForm.tsx` — client-side submit flow and request states.
- Create: `components/TweetPoster.tsx` — top-level poster layout.
- Create: `components/TweetHeader.tsx` — avatar, author, handle, verified badge.
- Create: `components/TweetBody.tsx` — rich text rendering with styled links/mentions/hashtags.
- Create: `components/TweetMedia.tsx` — 1–4 image layouts.
- Create: `components/QuoteCard.tsx` — nested quoted tweet card.
- Create: `components/TweetStats.tsx` — replies/retweets/likes row.
- Create: `components/TweetTime.tsx` — localized timestamp line.
- Create: `components/BrandFooter.tsx` — `shotweet from xxlemon` footer with the exact GitHub link `https://github.com/0xNMLSS/shotweet`.

### Core libraries
- Create: `lib/scraper/types.ts` — shared types for tweet data and API responses.
- Create: `lib/twitter/url.ts` — parse and normalize tweet URLs and ids.
- Create: `lib/twitter/format.ts` — stat-count and timestamp formatting helpers.
- Create: `lib/scraper/extractTweetData.ts` — parse HTML into `TweetData` with jsdom-compatible selectors.
- Create: `lib/scraper/twitter.ts` — Playwright-driven live scrape wrapper.
- Create: `lib/playwright/pool.ts` — singleton browser management.
- Create: `lib/posters/storage.ts` — poster filename creation and public path helpers.
- Create: `lib/posters/cleanup.ts` — TTL cleanup.
- Create: `lib/renderer/cache.ts` — in-memory `TweetData` cache keyed by render id.
- Create: `lib/renderer/screenshot.ts` — Playwright screenshot workflow.

### Test and fixtures
- Create: `tests/app/home-page.test.tsx`
- Create: `tests/components/poster-generator-form.test.tsx`
- Create: `tests/components/tweet-poster.test.tsx`
- Create: `tests/lib/twitter/url.test.ts`
- Create: `tests/lib/twitter/format.test.ts`
- Create: `tests/lib/posters/storage.test.ts`
- Create: `tests/lib/scraper/extract-tweet-data.test.ts`
- Create: `tests/lib/scraper/twitter.test.ts`
- Create: `tests/app/api/poster.route.test.ts`
- Create: `tests/fixtures/twitter/plain.html`
- Create: `tests/fixtures/twitter/quote.html`
- Create: `tests/fixtures/tweets/plain.json`
- Create: `tests/fixtures/tweets/quote.json`

### Tooling and deploy
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `jest.config.js`
- Create: `jest.setup.js`
- Create: `.dockerignore`
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.env.example`
- Modify: `README.md`
- Modify: `CHANGELOG.md`

## Task 1: Bootstrap Next.js, test tooling, and the static homepage shell

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `jest.config.js`, `jest.setup.js`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Test: `tests/app/home-page.test.tsx`

- [ ] **Step 1: Create project tooling files**

```json
{
  "name": "shotweet",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "jsdom": "^25.0.1",
    "next": "^14.2.0",
    "playwright": "^1.53.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.10.2",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.1",
    "eslint-config-next": "^14.2.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.16",
    "ts-jest": "^29.2.5",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: `added ... packages` and a generated `package-lock.json`.

- [ ] **Step 3: Write a failing homepage smoke test**

```tsx
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the title, url input, and generate button", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: /shotweet/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/https:\/\/x\.com\//i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the smoke test and verify it fails**

Run: `npm test -- tests/app/home-page.test.tsx`

Expected: FAIL with module/file-not-found errors for `app/page.tsx`.

- [ ] **Step 5: Implement the minimal app shell**

```tsx
// app/page.tsx
export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">shotweet</h1>
        <p className="text-lg text-zinc-400">
          Turn Twitter/X post URLs into vertical PNG posters.
        </p>
        <input
          aria-label="Tweet URL"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
          placeholder="https://x.com/username/status/1234567890"
          type="url"
        />
        <button className="rounded-xl bg-sky-500 px-5 py-3 font-semibold text-zinc-950">
          Generate
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Run the smoke test, lint, and build**

Run: `npm test -- tests/app/home-page.test.tsx && npm run lint && npm run build`

Expected: test PASS, lint clean, and Next.js build succeeds.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs postcss.config.mjs tailwind.config.ts jest.config.js jest.setup.js app/layout.tsx app/page.tsx app/globals.css tests/app/home-page.test.tsx
git commit -m "chore: bootstrap next app shell"
```

## Task 2: Define shared tweet types and formatting helpers

**Files:**
- Create: `lib/scraper/types.ts`, `lib/twitter/url.ts`, `lib/twitter/format.ts`
- Test: `tests/lib/twitter/url.test.ts`, `tests/lib/twitter/format.test.ts`

- [ ] **Step 1: Write failing tests for URL parsing**

```ts
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
```

- [ ] **Step 2: Write failing tests for count and timestamp formatting**

```ts
import { formatCount, formatTweetTimestamp } from "@/lib/twitter/format";

describe("twitter format helpers", () => {
  it("formats compact counts like the X UI", () => {
    expect(formatCount(2432)).toBe("2,432");
    expect(formatCount(18700)).toBe("18.7K");
    expect(formatCount(92000)).toBe("92K");
  });

  it("formats ISO timestamps into zh-CN display text", () => {
    expect(formatTweetTimestamp("2026-04-18T14:34:00.000Z")).toBe("下午 10:34 · 2026年4月18日");
  });
});
```

- [ ] **Step 3: Run helper tests and verify they fail**

Run: `npm test -- tests/lib/twitter/url.test.ts tests/lib/twitter/format.test.ts`

Expected: FAIL because helper files do not exist.

- [ ] **Step 4: Implement the shared types and helpers**

```ts
// lib/scraper/types.ts
export type TweetEntity =
  | { type: "mention"; text: string; href: string }
  | { type: "hashtag"; text: string; href: string }
  | { type: "url"; text: string; href: string };

export type TweetData = {
  id: string;
  url: string;
  author: { name: string; handle: string; avatar: string; verified: boolean };
  body: { text: string; entities: TweetEntity[] };
  media: { type: "image"; src: string; alt?: string }[];
  stats: { replies: number; retweets: number; likes: number };
  createdAt: string;
  quoted?: TweetData;
};
```

```ts
// lib/twitter/url.ts
export function extractTweetId(input: string): string {
  const url = new URL(input);
  const parts = url.pathname.split("/").filter(Boolean);
  const statusIndex = parts.indexOf("status");
  if (statusIndex === -1 || !parts[statusIndex + 1]) throw new Error("Invalid tweet URL");
  return parts[statusIndex + 1];
}

export function normalizeTweetUrl(input: string): string {
  const url = new URL(input);
  url.hostname = "x.com";
  return url.toString();
}
```

```ts
// lib/twitter/format.ts
export function formatCount(value: number): string {
  if (value < 10000) return value.toLocaleString("en-US");
  const compact = value >= 100000 ? (value / 1000).toFixed(0) : (value / 1000).toFixed(1);
  return `${compact.replace(/\.0$/, "")}K`;
}

export function formatTweetTimestamp(iso: string): string {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat("zh-CN", { hour: "numeric", minute: "2-digit", hour12: true }).format(date);
  const day = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "numeric", day: "numeric" }).format(date);
  return `${time} · ${day}`;
}
```

- [ ] **Step 5: Re-run helper tests**

Run: `npm test -- tests/lib/twitter/url.test.ts tests/lib/twitter/format.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/scraper/types.ts lib/twitter/url.ts lib/twitter/format.ts tests/lib/twitter/url.test.ts tests/lib/twitter/format.test.ts
git commit -m "feat: add tweet url and formatting helpers"
```

## Task 3: Add poster storage helpers and Playwright browser lifecycle

**Files:**
- Create: `lib/posters/storage.ts`, `lib/posters/cleanup.ts`, `lib/playwright/pool.ts`
- Test: `tests/lib/posters/storage.test.ts`

- [ ] **Step 1: Write failing tests for poster file naming and public URLs**

```ts
import { createPosterFilename, getPosterAbsolutePath, getPosterPublicUrl } from "@/lib/posters/storage";

describe("poster storage helpers", () => {
  it("creates png filenames with timestamp prefixes", () => {
    const filename = createPosterFilename("abcd1234");
    expect(filename).toMatch(/^\d{13}-abcd1234\.png$/);
  });

  it("maps filenames to public poster urls", () => {
    expect(getPosterPublicUrl("1713542400000-abcd1234.png")).toBe("/posters/1713542400000-abcd1234.png");
  });

  it("maps filenames to tmp poster paths", () => {
    expect(getPosterAbsolutePath("1713542400000-abcd1234.png")).toContain("/tmp/posters/1713542400000-abcd1234.png");
  });
});
```

- [ ] **Step 2: Run the storage tests and verify they fail**

Run: `npm test -- tests/lib/posters/storage.test.ts`

Expected: FAIL because storage helpers do not exist.

- [ ] **Step 3: Implement storage helpers and cleanup**

```ts
// lib/posters/storage.ts
import path from "node:path";

const POSTERS_DIR = path.join(process.cwd(), "tmp", "posters");

export function createPosterFilename(seed: string): string {
  return `${Date.now()}-${seed}.png`;
}

export function getPosterAbsolutePath(filename: string): string {
  return path.join(POSTERS_DIR, filename);
}

export function getPosterPublicUrl(filename: string): string {
  return `/posters/${filename}`;
}
```

```ts
// lib/playwright/pool.ts
import { chromium, Browser } from "playwright";

let browserPromise: Promise<Browser> | null = null;

export function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
  }
  return browserPromise;
}

export async function resetBrowser(): Promise<void> {
  if (!browserPromise) return;
  const browser = await browserPromise;
  await browser.close();
  browserPromise = null;
}
```

- [ ] **Step 4: Re-run the storage tests**

Run: `npm test -- tests/lib/posters/storage.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/posters/storage.ts lib/posters/cleanup.ts lib/playwright/pool.ts tests/lib/posters/storage.test.ts
git commit -m "feat: add poster storage and browser pool primitives"
```

## Task 4: Parse tweet HTML into `TweetData`

**Files:**
- Create: `lib/scraper/extractTweetData.ts`
- Create: `tests/fixtures/twitter/plain.html`, `tests/fixtures/twitter/quote.html`
- Create: `tests/fixtures/tweets/plain.json`, `tests/fixtures/tweets/quote.json`
- Test: `tests/lib/scraper/extract-tweet-data.test.ts`

- [ ] **Step 1: Add two real-ish fixture HTML files and expected JSON outputs**

```ts
// tests/lib/scraper/extract-tweet-data.test.ts
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
      stats: { replies: 2432, retweets: 18700, likes: 92000 }
    });
  });

  it("parses a quote tweet one level deep", () => {
    const html = readFixture("quote.html");
    const result = extractTweetData(html, "https://x.com/sama/status/1913240824012345680");
    expect(result.quoted?.author.handle).toBe("jack");
    expect(result.quoted?.body.text).toContain("hello world");
  });
});
```

- [ ] **Step 2: Run the extractor tests and verify they fail**

Run: `npm test -- tests/lib/scraper/extract-tweet-data.test.ts`

Expected: FAIL because `extractTweetData` and fixtures do not exist.

- [ ] **Step 3: Implement the parser with explicit unsupported-type guards**

```ts
// lib/scraper/extractTweetData.ts
import { JSDOM } from "jsdom";
import { extractTweetId } from "@/lib/twitter/url";
import type { TweetData } from "@/lib/scraper/types";

export function extractTweetData(html: string, url: string): TweetData {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const tweet = document.querySelector('[data-testid="tweet"]');
  if (!tweet) throw new Error("Tweet not found or inaccessible");

  const readCount = (segment: string) => {
    const label = Array.from(tweet.querySelectorAll("a, span"))
      .map((node) => node.getAttribute("aria-label") ?? node.textContent ?? "")
      .find((text) => text.toLowerCase().includes(segment));
    const raw = label?.match(/[\d,.]+/)?.[0]?.replace(/,/g, "") ?? "0";
    return Number(raw);
  };

  const body = tweet.querySelector('[data-testid="tweetText"]')?.textContent?.trim() ?? "";
  const images = Array.from(tweet.querySelectorAll('img[src*="pbs.twimg.com/media"]')).map((img) => ({
    type: "image" as const,
    src: img.getAttribute("src") ?? "",
    alt: img.getAttribute("alt") ?? undefined
  }));

  return {
    id: extractTweetId(url),
    url,
    author: {
      name: tweet.querySelector('[data-testid="User-Name"] span')?.textContent?.trim() ?? "",
      handle: tweet.querySelector('a[href*="/status/"]')?.getAttribute("href")?.split("/")[1] ?? "",
      avatar: tweet.querySelector('img[src*="profile_images"]')?.getAttribute("src") ?? "",
      verified: Boolean(tweet.querySelector('[data-testid="icon-verified"]'))
    },
    body: { text: body, entities: [] },
    media: images,
    stats: {
      replies: readCount("repl"),
      retweets: readCount("repost"),
      likes: readCount("like")
    },
    createdAt: tweet.querySelector("time")?.getAttribute("datetime") ?? new Date(0).toISOString()
  };
}
```

- [ ] **Step 4: Re-run the extractor tests**

Run: `npm test -- tests/lib/scraper/extract-tweet-data.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/scraper/extractTweetData.ts tests/lib/scraper/extract-tweet-data.test.ts tests/fixtures/twitter/plain.html tests/fixtures/twitter/quote.html tests/fixtures/tweets/plain.json tests/fixtures/tweets/quote.json
git commit -m "feat: add tweet html extraction fixtures"
```

## Task 5: Wrap the parser in a live Playwright scraper

**Files:**
- Create: `lib/scraper/twitter.ts`
- Test: `tests/lib/scraper/twitter.test.ts`

- [ ] **Step 1: Add a failing API-facing scraper contract test**

```ts
import { scrapeTweet } from "@/lib/scraper/twitter";

jest.mock("@/lib/playwright/pool", () => ({
  getBrowser: jest.fn()
}));

describe("scrapeTweet", () => {
  it("normalizes the input url and returns TweetData", async () => {
    await expect(scrapeTweet("https://twitter.com/sama/status/1913240824012345678")).resolves.toMatchObject({
      id: "1913240824012345678",
      author: { handle: "sama" }
    });
  });
});
```

- [ ] **Step 2: Run the scraper contract test and verify it fails**

Run: `npm test -- tests/lib/scraper/twitter.test.ts`

Expected: FAIL because `scrapeTweet` does not exist.

- [ ] **Step 3: Implement the live scraper**

```ts
// lib/scraper/twitter.ts
import { getBrowser } from "@/lib/playwright/pool";
import { extractTweetData } from "@/lib/scraper/extractTweetData";
import { normalizeTweetUrl } from "@/lib/twitter/url";

export async function scrapeTweet(inputUrl: string) {
  const url = normalizeTweetUrl(inputUrl);
  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route("**/*", (route) => {
    const requestUrl = route.request().url();
    if (requestUrl.includes("video.twimg.com") || requestUrl.includes("/notifications")) {
      return route.abort();
    }
    return route.continue();
  });

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="tweet"]', { timeout: 15000 });
  const html = await page.content();
  await context.close();

  return extractTweetData(html, url);
}
```

- [ ] **Step 4: Re-run the scraper test with the mocked browser**

Run: `npm test -- tests/lib/scraper/twitter.test.ts`

Expected: PASS with mocked browser interactions.

- [ ] **Step 5: Commit**

```bash
git add lib/scraper/twitter.ts tests/lib/scraper/twitter.test.ts
git commit -m "feat: add live playwright tweet scraper"
```

## Task 6: Build the poster components and internal render page

**Files:**
- Create: `components/TweetPoster.tsx`, `components/TweetHeader.tsx`, `components/TweetBody.tsx`, `components/TweetMedia.tsx`, `components/QuoteCard.tsx`, `components/TweetStats.tsx`, `components/TweetTime.tsx`, `components/BrandFooter.tsx`
- Create: `app/render/[id]/page.tsx`
- Test: `tests/components/tweet-poster.test.tsx`

- [ ] **Step 1: Write failing component tests for plain and quote posters**

```tsx
import { render, screen } from "@testing-library/react";
import TweetPoster from "@/components/TweetPoster";
import plainTweet from "@/tests/fixtures/tweets/plain.json";
import quoteTweet from "@/tests/fixtures/tweets/quote.json";

describe("TweetPoster", () => {
  it("renders author, body, stats, and brand footer", () => {
    render(<TweetPoster data={plainTweet} />);
    expect(screen.getByText(/sam altman/i)).toBeInTheDocument();
    expect(screen.getByText(/92k/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /xxlemon/i })).toHaveAttribute(
      "href",
      "https://github.com/0xNMLSS/shotweet"
    );
  });

  it("renders a nested quote card when quoted data exists", () => {
    render(<TweetPoster data={quoteTweet} />);
    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the component tests and verify they fail**

Run: `npm test -- tests/components/tweet-poster.test.tsx`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement the D2 visual components and render page**

```tsx
// components/BrandFooter.tsx (one plain-text line; optional SHOTWEET_FOOTER_TAGLINE)
export default function BrandFooter({ className }: { className?: string }) {
  const line = process.env.SHOTWEET_FOOTER_TAGLINE?.trim() || "shotweet from xxlemon · …";
  return (
    <div className={clsx("mt-4 border-t border-zinc-800 pt-3", className)}>
      <p className="text-[12px] font-medium text-zinc-300">{line}</p>
    </div>
  );
}
```

```tsx
// components/TweetPoster.tsx
import type { TweetData } from "@/lib/scraper/types";
import TweetHeader from "@/components/TweetHeader";
import TweetBody from "@/components/TweetBody";
import TweetMedia from "@/components/TweetMedia";
import QuoteCard from "@/components/QuoteCard";
import TweetTime from "@/components/TweetTime";
import TweetStats from "@/components/TweetStats";
import BrandFooter from "@/components/BrandFooter";

export default function TweetPoster({ data }: { data: TweetData }) {
  return (
    <div
      id="poster"
      className="w-[1080px] bg-[radial-gradient(circle_at_top_right,rgba(29,155,240,0.06),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(168,107,255,0.05),transparent_40%),#0a0a0f] px-16 py-14 text-zinc-100"
    >
      <TweetHeader author={data.author} />
      <TweetBody body={data.body} />
      <TweetMedia media={data.media} />
      {data.quoted ? <QuoteCard data={data.quoted} /> : null}
      <TweetTime createdAt={data.createdAt} />
      <TweetStats stats={data.stats} />
      <BrandFooter />
    </div>
  );
}
```

```tsx
// app/render/[id]/page.tsx
import { notFound } from "next/navigation";
import TweetPoster from "@/components/TweetPoster";
import { getRenderTweet } from "@/lib/renderer/cache";

export default function RenderPosterPage({ params }: { params: { id: string } }) {
  const tweet = getRenderTweet(params.id);
  if (!tweet) notFound();
  return <TweetPoster data={tweet} />;
}
```

- [ ] **Step 4: Re-run the component tests**

Run: `npm test -- tests/components/tweet-poster.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/TweetPoster.tsx components/TweetHeader.tsx components/TweetBody.tsx components/TweetMedia.tsx components/QuoteCard.tsx components/TweetStats.tsx components/TweetTime.tsx components/BrandFooter.tsx app/render/[id]/page.tsx tests/components/tweet-poster.test.tsx
git commit -m "feat: add poster render components"
```

## Task 7: Add screenshot rendering, in-memory cache, and the `/api/poster` route

**Files:**
- Create: `lib/renderer/cache.ts`, `lib/renderer/screenshot.ts`, `app/api/poster/route.ts`
- Test: `tests/app/api/poster.route.test.ts`

- [ ] **Step 1: Write failing API route tests for success and invalid input**

```ts
import { POST } from "@/app/api/poster/route";

jest.mock("@/lib/scraper/twitter", () => ({
  scrapeTweet: jest.fn().mockResolvedValue({
    id: "1913240824012345678",
    url: "https://x.com/sama/status/1913240824012345678",
    author: { name: "Sam Altman", handle: "sama", avatar: "https://example.com/a.jpg", verified: true },
    body: { text: "hello", entities: [] },
    media: [],
    stats: { replies: 2432, retweets: 18700, likes: 92000 },
    createdAt: "2026-04-18T14:34:00.000Z"
  })
}));

jest.mock("@/lib/renderer/screenshot", () => ({
  renderPosterImage: jest.fn().mockResolvedValue({
    filename: "1713542400000-abcd1234.png",
    width: 1080,
    height: 2418
  })
}));

describe("POST /api/poster", () => {
  it("returns poster metadata for a valid tweet url", async () => {
    const request = new Request("http://localhost/api/poster", {
      method: "POST",
      body: JSON.stringify({ url: "https://x.com/sama/status/1913240824012345678" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(payload.ok).toBe(true);
    expect(payload.asset.downloadUrl).toBe("/posters/1713542400000-abcd1234.png");
    expect(payload.asset.type).toBe("poster");
  });

  it("rejects malformed input", async () => {
    const request = new Request("http://localhost/api/poster", {
      method: "POST",
      body: JSON.stringify({ url: "not-a-url" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run the route tests and verify they fail**

Run: `npm test -- tests/app/api/poster.route.test.ts`

Expected: FAIL because the route and renderer do not exist.

- [ ] **Step 3: Implement cache, screenshot service, and route**

```ts
// lib/renderer/cache.ts
import type { TweetData } from "@/lib/scraper/types";

const cache = new Map<string, TweetData>();

export function setRenderTweet(id: string, data: TweetData) {
  cache.set(id, data);
}

export function getRenderTweet(id: string) {
  return cache.get(id);
}
```

```ts
// lib/renderer/screenshot.ts
import fs from "node:fs/promises";
import { getBrowser } from "@/lib/playwright/pool";
import { createPosterFilename, getPosterAbsolutePath } from "@/lib/posters/storage";

export async function renderPosterImage(renderId: string) {
  const host = process.env.INTERNAL_RENDER_HOST ?? "http://localhost:3000";
  const browser = await getBrowser();
  const context = await browser.newContext({ viewport: { width: 1080, height: 1600 } });
  const page = await context.newPage();
  await page.goto(`${host}/render/${renderId}`, { waitUntil: "networkidle" });

  const filename = createPosterFilename(renderId.slice(0, 8));
  const absolutePath = getPosterAbsolutePath(filename);
  await fs.mkdir(absolutePath.replace(/\/[^/]+$/, ""), { recursive: true });
  await page.locator("#poster").screenshot({ path: absolutePath, type: "png" });

  const box = await page.locator("#poster").boundingBox();
  await context.close();

  return {
    filename,
    width: Math.round(box?.width ?? 1080),
    height: Math.round(box?.height ?? 0)
  };
}
```

```ts
// app/api/poster/route.ts
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { scrapeTweet } from "@/lib/scraper/twitter";
import { setRenderTweet } from "@/lib/renderer/cache";
import { renderPosterImage } from "@/lib/renderer/screenshot";
import { getPosterPublicUrl } from "@/lib/posters/storage";

const schema = z.object({ url: z.string().url() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid tweet URL" }, { status: 400 });
  }

  try {
    const tweet = await scrapeTweet(parsed.data.url);
    const renderId = crypto.randomUUID();
    setRenderTweet(renderId, tweet);
    const image = await renderPosterImage(renderId);

    return NextResponse.json({
      ok: true,
      asset: {
        id: renderId,
        sourceUrl: tweet.url,
        downloadUrl: getPosterPublicUrl(image.filename),
        contentType: "image/png",
        filename: image.filename,
        width: image.width,
        height: image.height,
        provider: "twitter",
        type: "poster"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Failed to render poster" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Re-run the route tests**

Run: `npm test -- tests/app/api/poster.route.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/renderer/cache.ts lib/renderer/screenshot.ts app/api/poster/route.ts tests/app/api/poster.route.test.ts
git commit -m "feat: add poster api route"
```

## Task 8: Turn the homepage shell into the full generator flow

**Files:**
- Create: `components/PosterGeneratorForm.tsx`
- Modify: `app/page.tsx`
- Test: `tests/components/poster-generator-form.test.tsx`

- [ ] **Step 1: Write a failing interaction test**

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PosterGeneratorForm from "@/components/PosterGeneratorForm";

describe("PosterGeneratorForm", () => {
  it("submits the url, shows loading text, and renders the generated image", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        asset: { downloadUrl: "/posters/1713542400000-abcd1234.png", filename: "1713542400000-abcd1234.png" }
      })
    }) as jest.Mock;

    render(<PosterGeneratorForm />);
    fireEvent.change(screen.getByLabelText(/tweet url/i), {
      target: { value: "https://x.com/sama/status/1913240824012345678" }
    });
    fireEvent.click(screen.getByRole("button", { name: /generate/i }));

    expect(screen.getByText(/loading tweet/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByAltText(/generated poster/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run the interaction test and verify it fails**

Run: `npm test -- tests/components/poster-generator-form.test.tsx`

Expected: FAIL because `PosterGeneratorForm` does not exist.

- [ ] **Step 3: Implement the client form**

```tsx
"use client";

import { useState } from "react";

export default function PosterGeneratorForm() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("Loading tweet...");

    const response = await fetch("/api/poster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      setStatus("error");
      setMessage(payload.message ?? "Failed to generate poster");
      return;
    }

    setDownloadUrl(payload.asset.downloadUrl);
    setStatus("success");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <input
        aria-label="Tweet URL"
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100"
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://x.com/username/status/1234567890"
        type="url"
        value={url}
      />
      <button className="rounded-xl bg-sky-500 px-5 py-3 font-semibold text-zinc-950" type="submit">
        Generate
      </button>
      {status === "loading" ? <p className="text-zinc-400">{message}</p> : null}
      {status === "error" ? <p className="text-red-400">{message}</p> : null}
      {status === "success" ? (
        <div className="space-y-3">
          <img alt="Generated poster" className="w-full rounded-2xl border border-zinc-800" src={downloadUrl} />
          <a className="inline-flex rounded-xl border border-zinc-700 px-4 py-2 text-sm" href={downloadUrl}>
            Download PNG
          </a>
        </div>
      ) : null}
    </form>
  );
}
```

- [ ] **Step 4: Re-run the interaction test, lint, and build**

Run: `npm test -- tests/components/poster-generator-form.test.tsx && npm run lint && npm run build`

Expected: PASS and clean build.

- [ ] **Step 5: Commit**

```bash
git add components/PosterGeneratorForm.tsx app/page.tsx tests/components/poster-generator-form.test.tsx
git commit -m "feat: add homepage poster generator flow"
```

## Task 9: Dockerize, document, and verify the full flow

**Files:**
- Create: `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.env.example`
- Modify: `README.md`, `CHANGELOG.md`

- [ ] **Step 1: Add container files**

```dockerfile
FROM node:20-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
RUN npx playwright install --with-deps chromium

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
```

```yaml
services:
  shotweet:
    build: .
    ports:
      - "3000:3000"
    environment:
      POSTER_TTL_SECONDS: "3600"
      MAX_CONCURRENT_RENDERS: "2"
      INTERNAL_RENDER_HOST: "http://localhost:3000"
    volumes:
      - posters:/app/tmp/posters

volumes:
  posters:
```

- [ ] **Step 2: Update the docs**

```md
## Local development

1. `npm install`
2. `npm test`
3. `npm run dev`

## Docker

1. `docker compose up --build`
2. Open `http://localhost:3000`
3. POST to `/api/poster` with `{ "url": "https://x.com/..." }`
```

```md
## [Unreleased]

### Added

- Initial Shotweet MVP with a homepage generator, `POST /api/poster`, Playwright-based scraping and screenshot rendering, and Docker Compose support.
```

- [ ] **Step 3: Run the full verification suite**

Run: `npm test && npm run lint && npm run build && docker compose config`

Expected: all local checks PASS and `docker compose config` prints a valid merged config.

- [ ] **Step 4: Boot the app with Docker and smoke-test the homepage**

Run: `docker compose up --build -d`

Expected: container becomes healthy enough to serve `http://localhost:3000`, and visiting the homepage shows the URL input and Generate button.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore .env.example README.md CHANGELOG.md
git commit -m "chore: add docker workflow and docs"
```
