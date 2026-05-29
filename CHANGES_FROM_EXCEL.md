# The Shredsheet — what changed in the rebuild

A faithful port of the original Excel engine, with the weak bits fixed. Every
deviation from the spreadsheet is listed here so nothing is silent.

## Bugs fixed
1. **Rolling 7-day volume (`DAILY WORKER!C45`)** — the original contained a live
   `=AVERAGE(#REF!)` error. Now computed as a proper trailing 7-day average of
   daily training volume. (engine.js → computeDaily, `volRolling7`)
2. **Unlogged-day weight leak** — ported logic now treats a blank weight as
   "no reading" (null), so cumulative fat/scale change can't vacuum up your
   whole bodyweight on empty days. (Caught in testing; see engine `weight:` guard.)
3. **Divide-by-zero guards** — protein/volume ratios and bodyweight ratios fall
   back safely instead of returning Infinity/NaN.

## Caps & limits removed
4. **186-day period cap** — the sheet warned "max 186 days". Gone. Any period length.

## Faithfully preserved (so your model still behaves like your model)
- Mifflin–St Jeor BMR, TDEE build-up (steps + cardio + weights + BMR).
- Muscle engine: base 0.15 kg/week × (volume × newbie-decay × bulk/cut × protein
  × sex × manual modifier), with the 2-of-N risk-penalty and the volume/protein
  suppression divisors.
- Newbie-gains decay: flat for 45 days, then exponential toward 1.0.
- 1RM = weight × (1 + (reps − RIR) / 30); RIR, tempo and compound modifiers.
- Shred-cleanliness: the full 27-branch sign table, ported exactly.
- Calorie target logic incl. bulk-aggressiveness and the muscle/fat surplus split.

## Flagged for your call (kept faithful, but worth a look later)
5. **Sex multiplier** — the *formula* used 0.75 for female; the methodology notes
   said 0.85. I kept **0.75** to match the actual engine. Easy to flip in defaults.js.
6. **Planned weekly sets** — the sheet sums every set across the whole split and
   calls it "per week". Preserved as-is; we can make it sessions/week aware later.
7. **Surplus→fat partition** (bulk days only) — simplified to a clean version of
   the original nested formula. Only affects bulk days; documented in engine.js.

## Architecture changes
- The 3 hidden calc tabs (WORKER / DAILY WORKER / GYM WORKER) → one pure-function
  engine (`src/lib/engine.js`), unit-tested and readable.
- The "copy a prompt into ChatGPT" mechanic → a **live in-app AI coach** that
  already holds your full data context. Key stays server-side (Cloudflare
  Function), with a bring-your-own-key fallback for local preview.
- Data persists in your browser (localStorage) with JSON export/import, behind a
  tiny storage API so a real database can replace it when this becomes a product.
