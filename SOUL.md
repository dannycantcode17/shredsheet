# SOUL.md — what The Shredsheet stands for

Read this before you change anything. It is the constitution of this project.
Code, architecture and features are all negotiable. The soul is not.

## Lineage

The Shredsheet began as an Excel workbook, hand-built by a non-coder before he
had AI tooling: a body-recomposition tracker that linked behaviour to outcome,
with hand-rolled "AI" — auto-generated prompts you pasted into ChatGPT, a blue
star marking every prompt cell. It was rebuilt into this React + Vite app. The
three hidden calc tabs (WORKER / DAILY WORKER / GYM WORKER) became one pure
engine in `src/lib/engine.js`. The copy-a-prompt mechanic became a live in-app
coach. Read `README.md` and `CHANGES_FROM_EXCEL.md` — the engine ledger is a
tradition: **every engine change is documented there, openly, with its reason.**

The win condition for any change: *"this is what it was always trying to be."*
The one failure mode: slicker but soulless.

## The six values (the constitution)

1. **Clarity over guesswork.** The product connects behaviour to outcome —
   calories, steps, sets, weight, muscle, fat — so the user can *see* what works.
   The real output is understanding: the why, the how, and what to do next. A
   feature that doesn't reduce fog doesn't ship.

2. **Smarter, not harder.** Respect the user's effort; maximise return on what
   they already do. No streaks, no guilt, no burnout-bait. Missed a day? *"That's
   fine, just estimate."* The maths itself is merciful — the engine softens
   penalties on days the user trained or ate protectively. Keep that spirit.

3. **Effortless surface, inspectable depths.** Simple by default, fully
   transparent underneath. The original hid its engine tabs but laid them out
   clearly, refused to bury constants in formulas, and told the user "the option
   is there". Everyday users see outcomes; the curious can open the engine.
   Nothing locked — only tidied. No black-box scores without a visible basis.

4. **User in control.** The tool shows; the user decides. Estimates are labelled
   as estimates, never dressed as measurements. The manual-modifier philosophy is
   sacred: the model assumes average, the user knows their body best, and when
   reality disagrees it is the **model that bends** — celebrate overperformance
   and invite recalibration. Warnings warn; they never block. Never silently
   override a user's choice.

5. **The three-person team.** The app is the analyst, the AI is the coach, the
   user is the athlete. The coach's covenant (verbatim from the original):
   *curious, approachable, didactic, encouraging, helpful, empathetic, optimistic,
   fun, motivating; never cringy, judgmental, patronising, superior, fake.
   Straightforward, conversational, concise.* It asks consent before deep-diving
   ("want the lowdown on how we estimate this?"), keeps outputs short, encourages
   back-and-forth, and listens. The AI supports; it never dictates.

6. **Flexibility.** The Shredsheet serves anyone with a goal: any sex, age,
   training history; bulk, cut or recomp; beginner to advanced. The original
   aspired to this but was shaped around one user. Make it a commitment: hunt down
   and kill hardcoded assumptions about who the user is. Defaults are starting
   points, never identities. Cadence fits the user's life, not the reverse.

## The engine covenant

`src/lib/engine.js` and `src/lib/defaults.js` are the heart. Improve, recalibrate,
restructure — but always in the open. **Every change gets an entry in
`CHANGES_FROM_EXCEL.md`** saying what changed, why, and on what evidence. Honest
estimates only. If you add intelligence (projections, adaptive TDEE, confidence
bands), *show the uncertainty* rather than faking precision.

## Data dignity

The user's data is theirs. Export must always work. No lock-in; local-first
unless the user opts into more. The repo is public — **secrets never enter code;
keys live in env vars only.**

## Anti-soul (never build these)

Shame or punishment mechanics. Engagement bait, streak pressure, notification
nagging. Black-box scores. Prescriptive bossiness ("you must eat X"). Estimates
dressed as facts. Paywalling a user's insight into their own data. Cringe.

## Working agreement

- Keep the app deployable at every commit (Cloudflare Pages: `npm run build` → `dist`).
- Execute in verified increments; document engine changes in the ledger.
- Ask the user only when a decision would bend one of the six values. Everything
  else is yours.
