# The Shredsheet

A smart fat-loss / muscle-gain / recomp tracker with a live AI coach — rebuilt
from the original Excel tool into a real web app.

- **Inputs** → goals, body stats, manual modifiers
- **Gym Plan** → your training split
- **Daily Log / Workout Log** → what you actually did
- **Bodycomp Dash / Gym Dash** → plan vs actual, charts
- **AI Coach** → reads all your data and coaches you live

Stack: React + Vite, Recharts, Cloudflare Pages (+ Pages Function for the AI key).
Engine in `src/lib/engine.js`. See `CHANGES_FROM_EXCEL.md` and `DEPLOY.md`.
