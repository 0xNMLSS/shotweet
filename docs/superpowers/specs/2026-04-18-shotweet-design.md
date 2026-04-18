# shotweet · Design Spec

- **Date:** 2026-04-18
- **Status:** Draft for review
- **Author:** brainstorm with user

## 1. Goal

A self-hosted web app and JSON API that converts a Twitter/X post URL into a vertical PNG poster suitable for sharing on platforms such as Xiaohongshu, WeChat Moments, Instagram Stories, etc. Designed to be callable both from a browser UI and from iPhone Shortcuts, mirroring the API conventions of the existing MultiMediaSaver project so workflows can be reused.

## 2. Non-Goals (MVP)

- No authentication, accounts, or user history.
- No persistent database. Generated PNGs live in `tmp/posters/` and are cleaned up automatically.
- No rich editor (no font/color/layout customization in v1).
- No support for threads, long-form X Premium articles, polls, replies-with-context, GIF/video posters, or retweet redirection. These are deferred to v2+.
- No public deployment to serverless platforms (Vercel/Cloudflare). Self-hosted Docker only.

## 3. Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | Matches MultiMediaSaver; single process serves UI + API |
| Language | TypeScript | Same as MultiMediaSaver |
| Styling | Tailwind CSS | Same as MultiMediaSaver |
| Browser engine | Playwright + headless Chromium | Same as MultiMediaSaver; one dependency drives both scraping and screenshotting |
| Image output | PNG via `page.screenshot({ type: 'png', fullPage: true })` | No extra image library required |
| Container | Docker Compose | Mirrors MultiMediaSaver setup |

No additional renderers (Satori, Sharp, Resvg, Skia) are introduced. Rust was evaluated and rejected: scraping dominates request time, so renderer-side optimizations have low ROI.

## 4. Supported Tweet Types (MVP)

| # | Type | In MVP |
|---|---|---|
| 1 | Plain text tweet | Yes |
| 2 | Tweet with 1–4 images | Yes |
| 3 | Quote tweet (renders nested card, one level) | Yes |
| 4 | Video / GIF | No (v2) |
| 5 | Long-form / X Premium long article | No (v2) |
| 6 | Thread | No (v2) |
| 7 | Reply with parent context | No (v2) |
| 8 | Poll | No (v2) |
| 9 | Retweet | No (v2) — pass-through to original out of scope |

## 5. Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  shotweet (Next.js 14)                   │
│                                                          │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────┐    │
│  │  Web UI     │    │  /api/poster │    │  Static  │    │
│  │  (paste URL)│───▶│  (JSON API)  │───▶│  /posters│    │
│  └─────────────┘    └──────┬───────┘    └──────────┘    │
│                            │                            │
│                            ▼                            │
│              ┌─────────────────────────┐                │
│              │   Playwright pool       │                │
│              │   • scrape x.com        │                │
│              │   • render /render/[id] │                │
│              │   • screenshot → PNG    │                │
│              └─────────────────────────┘                │
└──────────────────────────────────────────────────────────┘
```

The Playwright instance is reused across requests via a small browser pool (one long-lived `Browser`, per-request `BrowserContext`).

## 6. API Contract

The shape mirrors MultiMediaSaver `/api/media` so iPhone Shortcuts built for MultiMediaSaver can be adapted with minimal changes.

### 6.1 `POST /api/poster`

Request:

```json
{ "url": "https://x.com/sama/status/1234567890" }
```

Success response (HTTP 200):

```json
{
  "ok": true,
  "asset": {
    "id": "0a7c8c2d-4f2f-4c12-8d0f-7f4b4f4a2f16",
    "sourceUrl": "https://x.com/sama/status/1234567890",
    "downloadUrl": "/posters/1776507035-abcd1234.png",
    "contentType": "image/png",
    "filename": "1776507035-abcd1234.png",
    "width": 1080,
    "height": 2418,
    "provider": "twitter",
    "type": "poster"
  }
}
```

Error response (HTTP 4xx/5xx):

```json
{
  "ok": false,
  "message": "Tweet not found or inaccessible. Possible reasons: ..."
}
```

`downloadUrl` is relative; clients prepend the host when sharing externally. This matches the MultiMediaSaver convention exactly.

### 6.2 `GET /posters/<filename>`

Returns the PNG binary with `Content-Type: image/png`. Used by the Web UI preview (`<img src>`) and by Shortcuts that follow the returned `downloadUrl`.

### 6.3 Errors

Mapped from scraper failures to human-readable messages, e.g.:

- `Tweet not found or inaccessible (deleted, private, or wrong URL).`
- `Twitter rate-limited the scraper. Retry in a few seconds.`
- `Unsupported tweet type: <video|poll|thread> not yet supported in MVP.`
- `Failed to render poster: <internal reason>.`

## 7. Rendering Pipeline

### 7.1 Scraping (`lib/scraper/twitter.ts`)

1. Acquire a `BrowserContext` from the pool.
2. `page.goto('https://x.com/<user>/status/<id>')`.
3. Block irrelevant resources via `route.abort()` for `*.mp4`, analytics, notification polling, etc., to reduce network time.
4. Wait for `[data-testid="tweet"]`.
5. Extract a `TweetData` object via `page.evaluate()`:

   ```ts
   type TweetData = {
     id: string;
     url: string;
     author: { name: string; handle: string; avatar: string; verified: boolean };
     body: { text: string; entities: TweetEntity[] };
     media: { type: 'image'; src: string; alt?: string }[];
     stats: { replies: number; retweets: number; likes: number };
     createdAt: string;
     quoted?: TweetData;
   };
   ```

6. Map known failure modes (404, login-wall, rate-limit) to typed errors.

### 7.2 Rendering (`app/render/[id]/page.tsx`)

- Receives the serialized `TweetData` (passed via internal cache keyed by `id`, not URL params, to avoid URL-length issues).
- Renders `<TweetPoster data={...} />` using the locked visual style:
  - Background `#0a0a0f` with two extremely subtle radial gradients (blue top-right, purple bottom-left).
  - Width fixed at **1080px**, height auto.
  - Header: 40px circular avatar, bold name, blue verified check, `@handle` in muted gray.
  - Body: 15px / line-height 1.55 / color `#e7e9ea`. Entities (mentions, hashtags, URLs) styled in `#1d9bf0`.
  - Media layout follows X's own grid:
    - 1 image: full-width, rounded-12.
    - 2 images: side-by-side.
    - 3 images: large left, two stacked right.
    - 4 images: 2×2 grid.
  - Quoted tweet: nested card with `1px solid #2f3336`, body text reduced to 13px, no nested stats.
  - Timestamp line: `下午 H:MM · YYYY年M月D日`.
  - Stats row above a top border: `<n> 评论 · <n> 转发 · <n> 赞`.
  - Brand footer (muted gray, 10px): copy **shotweet from xxlemon**, where **xxlemon** links to the public GitHub repository: `https://github.com/0xNMLSS/shotweet`.
- Fonts: PingFang SC on macOS during dev; Noto Sans SC + Noto Color Emoji installed in the Docker image for production parity.
- The page exposes a `<div id="poster">` container that the screenshotter targets.

### 7.3 Screenshot (`lib/renderer/screenshot.ts`)

1. Reuse the same Playwright `Browser`.
2. `page.goto('http://localhost:3000/render/<id>')` on the in-process Next.js server.
3. `await page.waitForLoadState('networkidle')` to ensure media loaded.
4. `await page.locator('#poster').screenshot({ type: 'png' })`.
5. Write to `tmp/posters/<unix>-<rand>.png`.
6. Trigger cleanup of files older than 1 hour (configurable via env).

### 7.4 Browser Pool (`lib/playwright/pool.ts`)

- One long-lived `Browser` per Node process.
- Per-request `BrowserContext` for isolation, disposed on request end.
- Re-launch on crash; warm-up on server start.

### 7.5 Edge Cases

| Case | Behavior |
|---|---|
| Tweet deleted/private | `ok: false` with explanatory message |
| Login wall hit | `ok: false`, suggest retry; log for ops |
| Media `<img>` fails to load | Render gray placeholder at expected aspect ratio, do not fail request |
| Quoted tweet fetch fails | Render main tweet only, omit quote silently |
| CJK + emoji mixed | Covered by font fallback chain (PingFang SC / Noto Sans SC / Noto Color Emoji) |
| Extremely long text | Height grows; no truncation in MVP |

## 8. Web UI

Single-page (`app/page.tsx`), dark theme aligned with the poster style.

States:

1. `idle` — title, subtitle, URL input, **Generate** button.
2. `loading` — spinner with two-step copy: "Loading tweet..." → "Rendering poster...".
3. `success` — `<img src={downloadUrl}>` preview, **Download PNG** button, link to generate another.
4. `error` — inline red message containing the API's `message` field, with a **Try again** button.

No customization controls in MVP.

## 9. Repository Layout

```
shotweet/
├─ app/
│  ├─ page.tsx                      # Web UI
│  ├─ layout.tsx                    # root layout, fonts
│  ├─ render/[id]/page.tsx          # Internal render page (target of screenshot)
│  └─ api/
│     └─ poster/route.ts            # POST /api/poster
├─ components/
│  ├─ TweetPoster.tsx               # Top-level poster
│  ├─ TweetHeader.tsx               # avatar + name + handle + verified
│  ├─ TweetBody.tsx                 # rich text with entities
│  ├─ TweetMedia.tsx                # 1-4 image grid
│  ├─ TweetStats.tsx                # replies / retweets / likes row
│  ├─ TweetTime.tsx                 # localized timestamp
│  ├─ QuoteCard.tsx                 # nested quoted tweet
│  └─ BrandFooter.tsx
├─ lib/
│  ├─ scraper/twitter.ts            # Playwright scrape
│  ├─ scraper/types.ts              # TweetData and entity types
│  ├─ renderer/screenshot.ts        # Playwright screenshot
│  ├─ renderer/cache.ts             # in-process TweetData cache by id
│  ├─ playwright/pool.ts            # browser instance reuse
│  └─ posters/cleanup.ts            # tmp file TTL cleanup
├─ tmp/posters/                     # PNG output (Docker volume)
├─ public/fonts/                    # Noto Sans SC, Noto Color Emoji (or system-installed in Dockerfile)
├─ Dockerfile
├─ docker-compose.yml
├─ next.config.mjs
├─ package.json
├─ tsconfig.json
├─ tailwind.config.ts
├─ README.md
└─ CHANGELOG.md
```

## 10. Deployment

- **Docker Compose** matching MultiMediaSaver style:
  - Single service `shotweet`, port `3000:3000`.
  - Named volume mounted at `/app/tmp/posters` so output persists across container restarts.
  - Image base: `node:20-bookworm-slim` plus `npx playwright install --with-deps chromium` and Noto fonts.
- Configurable env vars:
  - `POSTER_TTL_SECONDS` (default 3600) — cleanup age
  - `MAX_CONCURRENT_RENDERS` (default 2) — protects single-instance Chromium
  - `INTERNAL_RENDER_HOST` (default `http://localhost:3000`) — for the screenshot self-call
  - `SHOTWEET_BRAND_REPO_URL` (default `https://github.com/0xNMLSS/shotweet`) — URL used for the **xxlemon** link in the poster footer

## 11. Testing Strategy (high-level)

- Unit: scraper DOM parsing against fixture HTML snapshots.
- Unit: poster components render under jsdom with sample `TweetData`.
- Integration: end-to-end on a known public tweet URL behind an env flag (skipped in CI by default to avoid X rate-limiting).
- Visual regression: store known-good PNG of the fixture-rendered poster and compare on PRs.

## 12. Performance Targets (MVP)

- Cold-start request (first after boot): <8s.
- Warm request: <3s for plain text, <5s with 4 images.
- Concurrent render limit enforced to keep one Chromium instance stable.

## 13. Open Items Deferred to v1.1+

1. Aspect ratio presets (3:4, 9:16, 4:5) chosen via API param.
2. Light theme variant.
3. In-memory LRU cache keyed by tweet id for repeat requests.
4. Optional `?theme=` and `?hideStats=` query knobs on `/api/poster`.
5. Optional Syndication-endpoint fast path (then Playwright as fallback).
