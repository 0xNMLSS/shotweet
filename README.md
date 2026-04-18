# shotweet

shotweet turns Twitter/X post URLs into vertical PNG posters for sharing. Design and API details live in `docs/superpowers/specs/2026-04-18-shotweet-design.md`.

## API (MVP)

Two POST endpoints share the same scrape + render pipeline:

- **`POST /api/media`** — MultiMediaSaver-compatible. JSON body `{ "url": "<tweet url>" }`. Returns `{ ok: true, assets: [ … ] }` (always a single-element array). Use this from iOS Shortcuts, IFTTT, or anything already wired up to MultiMediaSaver's `/api/media`.
- **`POST /api/poster`** — Same body, but returns `{ ok: true, asset: { … } }` (singular) for the in-app web UI.
- **`GET /posters/<filename>`** — Serves the generated PNG from `tmp/posters/` (`Content-Type: image/png`).

Each asset object exposes `id / sourceUrl / downloadUrl / contentType / filename / width / height / provider / type`. `type` is `"image"` (mediasaver-style) and `provider` is `"twitter"`. `downloadUrl` is relative; prepend your host when sharing externally.

Internal rendering uses `INTERNAL_RENDER_HOST` (default `http://localhost:3000`) so Playwright can load `/render/<id>` before screenshotting `#poster`.

Generated posters include a small footer attribution: **shotweet from xxlemon**, with **xxlemon** linking to the GitHub repository at `https://github.com/0xNMLSS/shotweet` (configurable via `SHOTWEET_BRAND_REPO_URL`; see `.env.example`). A subtle X mark appears at the end of the engagement stats row inside the PNG; the homepage preview is the same image with no extra overlay.

## Local development

1. `npm install`
2. `npm test`
3. `npm run dev`

## Docker

1. `docker compose up --build`
2. Open [http://localhost:3000](http://localhost:3000)

Example requests:

```bash
curl -s -X POST http://localhost:3000/api/media \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://x.com/example/status/123"}'

curl -s -X POST http://localhost:3000/api/poster \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://x.com/example/status/123"}'
```

### iOS Shortcuts

Point your existing MultiMediaSaver Shortcut at `<BaseURL>/api/media` and keep the
"Get Dictionary Value → `assets`" step. Each `assets[i].downloadUrl` is a relative
path, so prepend `BaseURL` again before fetching the PNG with "Get contents of URL".

Environment variables are documented in `.env.example`. Compose mounts a named volume at `/app/tmp/posters` so generated PNGs persist across container restarts.
