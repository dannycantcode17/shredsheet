---
name: run-shredsheet
description: Build, validate, run, test, preview or screenshot the Shredsheet app. Use when changing/shipping this React+Vite fitness tracker — how to validate edits in this sandbox (which cannot run vite build), smoke-test the engine, and see it running via the Cloudflare PR preview.
---

# run-shredsheet

Shredsheet is a **Vite + React SPA** (data in `localStorage`) deployed to **Cloudflare Pages**, with one serverless function (`functions/api/coach.js` → `/api/coach`) that proxies the Anthropic API for the AI coach / meal estimates / plan generation.

**This sandbox cannot run `vite build` or `vite dev`** (npm installs of the full project get killed, breaking the build), and **no browser is installed**. So you do **not** launch the GUI here. The real loop is:

1. **Validate** changed files statically (parser + engine smoke) — the driver below.
2. **Push** → Cloudflare builds the **PR preview** → that URL *is* the running app (open it in a real browser / on a phone).

All paths below are relative to the repo root.

## Prerequisites
- Node 22 (present).
- `@babel/parser` for the validator, installed once into a scratch dir (full-project `npm install` gets killed; this single pure-JS package installs fine):
  ```bash
  mkdir -p /tmp/val && (cd /tmp/val && npm i @babel/parser)
  ```

## Validate (primary path — do this before every push)
Parse every changed `.js`/`.jsx`:
```bash
node .claude/skills/run-shredsheet/check.mjs src/App.jsx src/modules/Configurator.jsx src/lib/ai.js functions/api/coach.js
# -> "PARSE OK   <file>" per file; non-zero exit + "PARSE FAIL" on a syntax error
```
CSS isn't JS — the parser will reject `.css`. Check stylesheets with a brace-balance one-liner instead:
```bash
node -e "const s=require('fs').readFileSync('src/index.css','utf8');let o=0;for(const c of s){if(c==='{')o++;if(c==='}')o--;}console.log(o===0?'CSS braces OK':'CSS MISMATCH '+o)"
```
**Engine smoke test — only if you touched `src/lib/engine.js` or `src/lib/defaults.js`** (normally out of scope; keep the numbers identical):
```bash
node .claude/skills/run-shredsheet/smoke-engine.mjs
# -> OK for each check + a sane summary, e.g.:
# plan: target 2118kcal · TDEE 2523 · protein 198g · 61 sets · weightΔ -3kg
```

## See it running (the actual run surface)
There is no in-container GUI. To see/screenshot the app:
```bash
git push -u origin <branch>
```
Cloudflare Pages builds the branch; the `cloudflare-workers-and-pages` bot comments **Preview URL** and **Branch Preview URL** on the PR. Open that URL in a real browser or phone — it's the live app. For the **coach / meal estimate / AI plan** features to work, `ANTHROPIC_API_KEY` must be set in the Cloudflare Pages project (Settings → Environment variables); without it those calls return errors but the rest of the app works.

## Run locally (another machine — NOT this sandbox)
On a machine where `vite` builds (verified working only via Cloudflare here):
```bash
npm install
npm run dev        # http://localhost:5173
# or: npm run build && npm run preview
npm run build:single   # -> dist-single/index.html, a double-clickable single file
```

## Gotchas (hard-won this repo)
- **Never gate on `vite build` in-sandbox** — it gets killed. Validate with `check.mjs`; let Cloudflare do the real build.
- **Onboarding is gated by `localStorage.onboarded`** — first load shows the configurator. To re-enter it after onboarding: in the app, **Settings → ↻ Re-run setup** (non-destructive).
- **Engine is the source of truth and usually out of scope.** `src/lib/engine.js` + `src/lib/defaults.js` hold all the maths; goal strings (`'Cut'`/`'Lean Bulk'`/`'Bulk'`/`'Aggressive Cut'`) are engine keys — change display labels, never the stored values. If you do touch the engine, run `smoke-engine.mjs`.
- **AI is app-side via `/api/coach`** (`src/lib/ai.js` `askCoach`/`estimateMeal`, model `claude-sonnet-4-6`). Plan generation lives in `src/lib/plan.js` (AI + rule-based fallback) — not the engine.
- **Temp pink gag is live**: selecting "Female" on the configurator's sex step turns it bright pink (commit `815ffdc`). Remove with `git revert 815ffdc`.

## Troubleshooting
- `check.mjs` says "Could not load @babel/parser" → run the install in Prerequisites.
- Full-project `npm install` hangs/gets killed → expected in this sandbox; you don't need project deps to validate. Use the parser + smoke test, push, and rely on the Cloudflare preview.
- `check.mjs` "PARSE FAIL … Unexpected token" on a `.css` file → that's correct; use the CSS brace-balance one-liner for stylesheets.
