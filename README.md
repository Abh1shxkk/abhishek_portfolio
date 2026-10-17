# Abhishek Chauhan — Portfolio

A portfolio built as a 3D drive through a low-poly countryside: scroll to drive the car along the road, and each district
(journey, toolbox, points of interest, end of the road) shows its card on paper, highway-sign style.

**React 19 + TypeScript + Vite + Three.js + Tailwind CSS.** Fully static, deployed on Vercel.

## Getting started

```bash
cd portfolio-frontend
npm install
npm run dev
```

Open http://localhost:3000 (if another app already uses port 3000, run `npx vite --port 4321 --host 127.0.0.1`).

Copy `portfolio-frontend/.env.example` to `portfolio-frontend/.env.local` and set `GEMINI_API_KEY` to enable the chat.
Without a key the chat shows an "off air" message instead of failing.

### How the chat keeps the key secret

The browser never sees the Gemini key. The chat widget posts the conversation to
[`server/chatHandler.ts`](portfolio-frontend/server/chatHandler.ts), a serverless function that holds the key, calls
Gemini and returns the reply.
`npm run dev` serves the same function locally. The function also rejects other websites' origins, caps message size
and history, and rate-limits each IP to 20 messages per 10 minutes.

In production the key is a Cloudflare Pages secret (`npm run deploy:secret`), or on Vercel an environment variable. Never put it in `vite.config.ts` `define`
or a `VITE_` variable: those are compiled into the public JavaScript. If you use a custom domain, add it to
`ALLOWED_ORIGINS` (comma-separated hostnames).

## Useful URL parameters

- `?theme=light|dark|system` – pick a theme for this visit (saved to localStorage)
- `?nogl=1` – skip the 3D world (layout checks, very old devices)

## Editing content

Everything the site shows (profile, experience, education, projects, journey stops, skills) lives in
[`portfolio-frontend/data/portfolio.ts`](portfolio-frontend/data/portfolio.ts). The résumé is generated from the same file:

```bash
npm run build:resume      # writes public/resume.html
# then print it to PDF with Chrome (Windows path shown):
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --no-pdf-header-footer `
  --print-to-pdf="public/AbhishekChauhan-Resume.pdf" "file:///$PWD/public/resume.html"
```

Project screenshots go in `public/projects/` and are referenced by `image_url`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build:resume` | Regenerate `public/resume.html` from the portfolio data |

## Deployment

Live at **https://abhishekdev.online**, on **Cloudflare Pages**.

**Automatic:** every push to GitHub deploys through [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): `main` goes to production, any other branch gets a preview URL. It needs a `CLOUDFLARE_API_TOKEN` secret (Cloudflare Pages: Edit) and a `CLOUDFLARE_ACCOUNT_ID` variable in the GitHub repo settings.

**Manual** (Wrangler CLI, installed as a dev dependency), from `portfolio-frontend`:

```bash
npx wrangler login          # once: opens the browser to authorise your Cloudflare account
npm run deploy              # build, then upload dist/ and functions/ to the "abhishek-portfolio" project
npm run deploy:secret       # once (or when rotating): stores GEMINI_API_KEY as an encrypted secret
```

The first `npm run deploy` creates the project; the site is served at `https://abhishek-portfolio.pages.dev`.
Deep links such as `/projects/13` work without a redirects file, because Pages falls back to `index.html` for a
single-page app. To test the production runtime locally, put `GEMINI_API_KEY=...` in `portfolio-frontend/.dev.vars`
(git-ignored) and run `npm run build && npx wrangler pages dev dist`.

The chat backend lives in [`server/chatHandler.ts`](portfolio-frontend/server/chatHandler.ts) and only uses
web-standard `fetch`, `Request` and `Response`. Thin adapters run it on each platform:

| Where | File |
|---|---|
| Cloudflare Pages | [`portfolio-frontend/functions/api/chat.ts`](portfolio-frontend/functions/api/chat.ts) |
| Vercel (still works: import the repo with the root at the repository root) | [`api/chat.ts`](api/chat.ts) |
| `npm run dev` | the `devApi` plugin in [`vite.config.ts`](portfolio-frontend/vite.config.ts) |

## How the 3D world is kept fast

- Trees, bushes, rocks, flowers, fields, road dashes and fence posts are `InstancedMesh`es: the whole countryside is ~70 draw calls.
- Pointer picking runs every other frame against the buildings, yards, billboards and the instanced tree crowns only.
- Camera and car easing are frame-rate independent, so the drive feels the same at 30 and 120 fps.
- Shadow maps drop to 1024 and the pixel ratio to 1.25 on small or low-core devices.
- Night mode uses four point lights and one spotlight instead of one light per lamp and billboard.
