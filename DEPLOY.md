# Getting The Shredsheet live (≈15 minutes, free)

You'll create two free accounts: **GitHub** (stores the code) and **Cloudflare**
(builds + hosts it). Cloudflare Pages is the choice here because it's
commercial-safe — so this can grow into a product without moving house.

## 1. Put the code on GitHub
Easiest non-coder route:
1. Install **GitHub Desktop** (desktop.github.com), sign in (free).
2. Unzip `shredsheet.zip`. In GitHub Desktop: File → Add Local Repository → pick
   the `shredsheet` folder → "create a repository" → Publish (keep it Private).

## 2. Deploy on Cloudflare Pages
1. dash.cloudflare.com → sign up (free) → **Workers & Pages** → **Create** →
   **Pages** → **Connect to Git** → pick the `shredsheet` repo.
2. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
3. **Save and Deploy.** ~2 minutes → you get `shredsheet.pages.dev`. Live.

## 3. Switch on the AI coach (server-side key — the safe way)
1. Get an Anthropic API key (console.anthropic.com).
2. Cloudflare Pages → your project → **Settings → Environment variables** →
   add `ANTHROPIC_API_KEY` = your key → Save → **Retry deployment**.
3. The coach now works for everyone, and the key never touches the browser.

(Before you do step 3, you can still try the coach in the live preview by pasting
your key into the app's **Settings** tab — it's stored only in your browser.)

## Updating later
Change code → push in GitHub Desktop → Cloudflare rebuilds automatically.

## Run it on your own machine (optional)
`npm install` then `npm run dev` → opens at localhost:5173.
