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

Configured for **Vercel**: import the repository, keep the root at the repository root (the root `vercel.json` builds
`portfolio-frontend`), deploy. SPA rewrites are already set.

## How the 3D world is kept fast

- Trees, bushes, rocks, flowers, fields, road dashes and fence posts are `InstancedMesh`es: the whole countryside is ~70 draw calls.
- Pointer picking runs every other frame against the buildings, yards, billboards and the instanced tree crowns only.
- Camera and car easing are frame-rate independent, so the drive feels the same at 30 and 120 fps.
- Shadow maps drop to 1024 and the pixel ratio to 1.25 on small or low-core devices.
- Night mode uses four point lights and one spotlight instead of one light per lamp and billboard.
