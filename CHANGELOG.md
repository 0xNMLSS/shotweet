# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- `POST /api/media` MultiMediaSaver-compatible endpoint: same path, request body, and `{ ok, assets[] }` envelope as MultiMediaSaver's `/api/media`, so iPhone Shortcuts wired for that project work against shotweet without changes. Returns a single-element `assets` array containing the rendered poster PNG.
- Docker Compose image with Playwright Chromium and a persistent `tmp/posters` volume.
- `POST /api/poster` JSON API (tweet URL → PNG metadata), Playwright `renderPosterImage` screenshot to `tmp/posters/`, and `GET /posters/[filename]` for PNG download/preview.
- Next.js 14 (App Router) app shell with Tailwind CSS, ESLint (`next/core-web-vitals`), Jest + Testing Library (`jest --runInBand`), and a smoke-tested homepage (title, tweet URL field, Generate button).
- Shared `TweetData` types and Twitter URL / count / timestamp formatting helpers (tests included).
- Poster file paths, Playwright browser singleton, and TTL cleanup for `tmp/posters/`.
- HTML fixture–driven `extractTweetData` for main and quoted tweets (JSDOM), plus JSON fixtures for component tests.
- Playwright-based `scrapeTweet` that loads the tweet page and parses HTML via `extractTweetData` (unit-tested with mocked browser).
- Poster layout components (`TweetPoster`, header/body/media/quote/stats/time, brand footer) and internal `/render/[id]` route backed by `lib/renderer/cache` for in-process `TweetData` by render id.
- `POST /api/poster` (MultiMediaSaver-style JSON) and `GET /posters/[filename]` for PNG download; Playwright screenshot pipeline writes under `tmp/posters/`.
- Client-side homepage flow: paste URL, generate, preview poster, download PNG.
- Exported PNG posters include a subtle X mark at the right end of the stats row (same asset as the web preview `<img>`, no duplicate overlay).
- `stats.views` on `TweetData`: parsed from `aria-label` text (English *views* / Chinese *次观看*), including **combined** engagement summaries on wrapper `div`s (logged-out X often omits `data-testid="analytics"`). Shown on the poster as **views** next to likes.

### Changed

- Poster insets tightened from `px-16 py-14` to `px-10 py-12` (40px sides), and **media bleeds edge-to-edge** via `-mx-10` on the `TweetMedia` wrapper. Dark side bands shrink from ~5.9% → ~3.7% per side, and images now hit the full 1080-wide canvas with no surrounding border / rounded corners (which looked like stray strokes once flush with the edge). Text/header/quote/stats keep the inset for comfortable reading.
- Poster screenshots now render at **3× device-pixel-ratio** by default (configurable via `POSTER_PIXEL_RATIO`, clamped `[1, 3]`). A 1080×1350 CSS poster ships as a 3240×4050 PNG so body text and avatars stay sharp on @2x/@3x phones. The `width`/`height` returned by `/api/poster` and `/api/media` reflect the **physical PNG size**, so existing consumers see truthful dimensions. File size grows ~6-9× over 1×; lower the env to `2` (≈3-5MB) or `1` (original) when bandwidth matters.
- Brand footer is a **single line** of plain text (no link), default English: `shotweet from xxlemon · An app for better screenshots of your tweets.` Optional `SHOTWEET_FOOTER_TAGLINE` replaces the whole line. (Earlier: two-line Chinese tagline; `SHOTWEET_BRAND_REPO_URL` already removed from poster/compose.)
- Poster timestamp and engagement labels are now **English** (`10:34 PM · Apr 18, 2026` style; stats: replies / reposts / likes). Timestamps still use `Asia/Shanghai` for deterministic formatting.
- Poster aspect ratio: enforce a **4:5 floor** (`min-h-[1350px]`) and let content grow naturally above it; very long tweets keep working as long-screenshot PNGs (no truncation). The container is now a flex column so `BrandFooter` stays pinned to the bottom of the canvas regardless of how short the body is. Renderer viewport bumped from 1080×1600 to 1080×1920 to accommodate the new floor without forcing internal scroll.
- Media layout: every tweet image is now stacked vertically at full poster width with its natural aspect ratio (applies to 1/2/3/4 images alike), replacing the per-count X-style mosaic grids. Reads more naturally in a tall mobile-friendly canvas and avoids cropping faces.

### Fixed

- Views stuck at `0` when X only exposes the count inside a comma-separated engagement `aria-label` (e.g. `…, 69672 views`) on a wrapper without `role="group"` or `data-testid="analytics"` — parser now scans all `[aria-label]` nodes for `… views` / 次观看.
- Stats parser: read reply / repost / like counts from `[data-testid="reply|retweet|like"]` aria-labels (previous selector missed `<button>` and tripped on the toolbar group's combined aria-label, producing `0 / 0` or three identical numbers). Also handles compact `1.2K` / `3M` / `1.5B` suffixes.
- Avatar resolution: scraped `_normal.jpg` (48px) profile images are upgraded to `_400x400.jpg` so the 1080-wide poster avatar is sharp.
- Tweet media resolution: `pbs.twimg.com/media/...` URLs are upgraded to `name=large` (or have it appended when missing) for crisp images in the exported PNG.

### Changed

- Asset `type` field renamed from `"poster"` to `"image"` to match MultiMediaSaver, so existing Shortcut branches on `assets[i].type === "image"` keep working.
- Poster X mark moved from a large bottom-right pill to a subtle inline icon at the right edge of the stats row; the previous overlay was visually intrusive. Removed the homepage preview overlay so the black pill does not duplicate the mark already baked into the PNG.
- Design spec: poster brand footer is one plain-text line (see `SHOTWEET_FOOTER_TAGLINE`).
