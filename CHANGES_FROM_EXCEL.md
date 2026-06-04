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

## Additions (post-rebuild, made in the open per the engine covenant)
- **Focus insights (the analyst's "what to do next").** A transparent, non-AI
  pass over the numbers (`src/lib/insights.js`) surfacing up to 3 prioritised
  observations on the dashboard — value 1 (understanding includes what to do
  next), works with no API key. Tone is governed by value 2 and the anti-soul
  list: it names the single cheapest win, celebrates clean/over-performance, and
  never shames, nags or bosses (watch-items inform, they don't block). Pure and
  unit-checked across scenarios; nothing here touches the engine maths.
- **Projection confidence bands.** Muscle and fat projections now carry an
  uncertainty band instead of a single fake-precise number (value 4: show
  uncertainty, never fake precision). `projectionRel(daysLogged)` /
  `projectionBand(value, daysLogged, minAbs)` in `engine.js`, tuned by
  `CONST.UNCERTAINTY = { REL_BASE: 0.4, REL_FLOOR: 0.12, REL_TAU: 30 }`.
  - *Model:* relative half-width starts at ±40% (between-person response to the
    same plan is large) and decays exponentially toward a ±12% floor as logged
    days calibrate it (≈±0.96kg → ±0.30kg on a 2.4kg projection over 0→120 days).
  - *Honesty:* explicitly a heuristic "typical range", **not** a statistical CI —
    labelled as such in the UI and the Explain disclosures. Shown as a shaded
    band on the dash curves and a ± on the plan figures.

## Recalibrations (post-rebuild, made in the open per the engine covenant)
- **Sex multiplier → 0.85, and un-buried.** Was finding #5 below. The female
  muscle-gain multiplier is now `CONST.SEX_MUSCLE_MULT` in `defaults.js` (was a
  literal `0.75` hardcoded inline in two engine formulas). Set to **0.85**.
  - *Why:* the author's own methodology notes specified 0.85; the formula had
    drifted to 0.75. Aligning to documented intent. It's a crude proxy for lower
    absolute lean-mass gain, not a statement about training response — and the
    user's muscle modifier remains the real override (value 4).
  - *Effect:* female projections show ~13% more modelled muscle gain than before.
  - *Soul:* values 3 (constants visible, not buried), 4 (honest), 6 (no harsher-
    than-intended assumption about who the user is).

## Flagged for your call (kept faithful, but worth a look later)
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
