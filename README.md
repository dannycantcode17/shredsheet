# The Shredsheet

A smart fat-loss / muscle-gain / recomp tracker with a live AI coach — rebuilt
from the original Excel tool into a real web app.

- **Inputs** → goals, body stats, manual modifiers
- **Gym Plan** → your training split
- **Daily Log / Workout Log** → what you actually did
- **Bodycomp Dash / Gym Dash** → plan vs actual, charts (estimates shown with uncertainty)
- **AI Coach** → reads all your data and coaches you live
- **Engine Room** → open the engine: the live multiplier chain and every constant, nothing hidden

Stack: React + Vite, Recharts, Cloudflare Pages (+ Pages Function for the AI key).
Engine in `src/lib/engine.js`. Start with **`SOUL.md`** (what this project stands
for), then `CHANGES_FROM_EXCEL.md` (the engine ledger) and `DEPLOY.md`.
