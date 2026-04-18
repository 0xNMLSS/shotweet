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

### Changed

- Brand footer is a **single line** of plain text (no link), default English: `shotweet from xxlemon · An app for better screenshots of your tweets.` Optional `SHOTWEET_FOOTER_TAGLINE` replaces the whole line. (Earlier: two-line Chinese tagline; `SHOTWEET_BRAND_REPO_URL` already removed from poster/compose.)
- Poster timestamp and engagement labels are now **English** (`10:34 PM · Apr 18, 2026` style; stats: replies / reposts / likes). Timestamps still use `Asia/Shanghai` for deterministic formatting.
- Poster aspect ratio: enforce a **4:5 floor** (`min-h-[1350px]`) and let content grow naturally above it; very long tweets keep working as long-screenshot PNGs (no truncation). The container is now a flex column so `BrandFooter` stays pinned to the bottom of the canvas regardless of how short the body is. Renderer viewport bumped from 1080×1600 to 1080×1920 to accommodate the new floor without forcing internal scroll.
- Media layout: every tweet image is now stacked vertically at full poster width with its natural aspect ratio (applies to 1/2/3/4 images alike), replacing the per-count X-style mosaic grids. Reads more naturally in a tall mobile-friendly canvas and avoids cropping faces.

### Fixed

- Stats parser: read reply / repost / like counts from `[data-testid="reply|retweet|like"]` aria-labels (previous selector missed `<button>` and tripped on the toolbar group's combined aria-label, producing `0 / 0` or three identical numbers). Also handles compact `1.2K` / `3M` / `1.5B` suffixes.
- Avatar resolution: scraped `_normal.jpg` (48px) profile images are upgraded to `_400x400.jpg` so the 1080-wide poster avatar is sharp.
- Tweet media resolution: `pbs.twimg.com/media/...` URLs are upgraded to `name=large` (or have it appended when missing) for crisp images in the exported PNG.

### Changed

- Asset `type` field renamed from `"poster"` to `"image"` to match MultiMediaSaver, so existing Shortcut branches on `assets[i].type === "image"` keep working.
- Poster X mark moved from a large bottom-right pill to a subtle inline icon at the right edge of the stats row; the previous overlay was visually intrusive. Removed the homepage preview overlay so the black pill does not duplicate the mark already baked into the PNG.
- Design spec: poster brand footer is one plain-text line (see `SHOTWEET_FOOTER_TAGLINE`).
