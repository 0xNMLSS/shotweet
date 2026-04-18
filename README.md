# shotweet

shotweet turns Twitter/X post URLs into vertical PNG posters for sharing. Design and API details live in `docs/superpowers/specs/2026-04-18-shotweet-design.md`.

## API (MVP)

- **`POST /api/poster`** — JSON body `{ "url": "<tweet url>" }`. On success returns `{ ok: true, asset: { … } }` with `downloadUrl` pointing at `/posters/<filename>.png`.
- **`GET /posters/<filename>`** — Serves the generated PNG from `tmp/posters/` (`Content-Type: image/png`).

Internal rendering uses `INTERNAL_RENDER_HOST` (default `http://localhost:3000`) so Playwright can load `/render/<id>` before screenshotting `#poster`.

Generated posters include a small footer attribution: **shotweet from xxlemon**, with **xxlemon** linking to the GitHub repository at `https://github.com/0xNMLSS/shotweet` (configurable via `SHOTWEET_BRAND_REPO_URL`; see `.env.example`). A subtle X mark appears at the end of the engagement stats row inside the PNG; the homepage preview is the same image with no extra overlay.

## Local development

1. `npm install`
2. `npm test`
3. `npm run dev`

## Docker

1. `docker compose up --build`
2. Open [http://localhost:3000](http://localhost:3000)

Example request:

```bash
curl -s -X POST http://localhost:3000/api/poster \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://x.com/example/status/123"}'
```

Environment variables are documented in `.env.example`. Compose mounts a named volume at `/app/tmp/posters` so generated PNGs persist across container restarts.
