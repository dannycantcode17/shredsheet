// ============================================================
// THE SHREDSHEET — INSIGHTS (the analyst's "what to do next")
// Value 1: the real output is understanding — the why, the how, and what to do
// next. This is a transparent, non-AI pass over the numbers, so it works with
// no API key. Value 2 (smarter, not harder) and the anti-soul list govern the
// TONE: it surfaces the single cheapest win, celebrates overperformance, and
// never shames, nags or bosses. Warnings inform; they never block.
// Each insight is { tone: 'good'|'note'|'watch', title, text }.
// ============================================================
import { cleanliness } from './engine.js'

const r0 = (x) => Math.round(x)
const pctClean = (c) => `${Math.round(c * 100)}%`

export function deriveInsights({ planRes, daily, flags = {} }) {
  const w = daily.whole
  const logged = w.daysLogged || 0
  const out = []

  // Nothing logged yet — invite a gentle start, no pressure.
  if (logged === 0) {
    return [{
      tone: 'note', title: 'Start anywhere',
      text: 'No days logged yet. Pop in even a rough day or two and the curves come alive — estimates are completely fine, precision can wait.',
    }]
  }

  const cut = planRes.priority === 'Fat Loss'
  const candidates = []

  // Protein — the cheapest lever for keeping muscle. Only if it's being tracked.
  if (flags.protein && logged >= 3 && w.avgProtein > 0) {
    const ratio = w.avgProtein / (planRes.proteinTarget || 1)
    if (ratio < 0.8) candidates.push({ priority: 2, tone: 'note', title: 'Protein is your cheapest win',
      text: `You're averaging ~${r0(w.avgProtein)}g protein against a ~${r0(planRes.proteinTarget)}g target. It's the lowest-effort lever for holding onto muscle — worth nudging up on the days it's easy.` })
  }

  // Energy balance vs the plan's direction — framed as a check-in, never a telling-off.
  if (flags.calories && logged >= 4) {
    const delta = w.avgDeficit            // + surplus, − deficit
    if (cut && delta > 50) candidates.push({ priority: 1, tone: 'watch', title: 'The balance is tipping the wrong way',
      text: `You're aiming to lean down but averaging a slight surplus (${r0(delta)} kcal/day). No drama — the fat curve just won't move much until that tips negative. Even a small trim does it.` })
    else if (!cut && delta < -50) candidates.push({ priority: 1, tone: 'watch', title: 'You may be under-fuelling the build',
      text: `You're chasing muscle but running a small deficit (${r0(Math.abs(delta))} kcal/day under maintenance). Muscle gain leans on a surplus — a touch more food where it fits would feed it.` })
    else if (cut && delta < planRes.dailyDelta - 250) candidates.push({ priority: 3, tone: 'note', title: 'Steeper deficit than planned',
      text: `You're cutting harder than the plan asked for. If energy and your lifts feel good, brilliant — if they're flagging, easing up a little protects your muscle.` })
  }

  // Recomposition quality — only meaningful with muscle estimation on.
  if (flags.muscle && logged >= 7) {
    const clean = cleanliness(daily.cumWeight, daily.cumFat, daily.cumMuscle)
    if (clean < 0.4) candidates.push({ priority: 1, tone: 'watch', title: 'A lot of the change is heading the wrong way',
      text: `Right now only ${pctClean(clean)} of your body change is the "good" kind. Usually it's the calorie balance or training volume — the Engine Room shows exactly which. No panic, just worth a look.` })
    else if (clean >= 0.75) candidates.push({ priority: 5, tone: 'good', title: "Clean progress — keep at it",
      text: `Your recomposition's tracking clean (${pctClean(clean)} of the change is the right kind). Whatever you're doing is working — stay the course.` })
  }

  // The model bends to the user (value 4). When the scale disagrees with what
  // the logged intake predicts, invite recalibration — direction only, no faked
  // target number, fully reversible. Needs calorie + weight data and a real gap.
  if (flags.muscle && logged >= 14 && w.avgCalories > 0) {
    const predWeight = (w.avgDeficit * logged) / 7700 + daily.cumMuscle // expected kg change
    const gap = daily.cumWeight - predWeight
    const rel = Math.abs(predWeight) > 0.5 ? Math.abs(gap) / Math.abs(predWeight) : (Math.abs(gap) > 0 ? 1 : 0)
    if (Math.abs(gap) >= 1.2 && rel >= 0.3) {
      const faster = gap < 0 // actual weight below the prediction = moving faster than intake implies
      candidates.push({ priority: 2, tone: 'note', title: 'Your scale and the model disagree',
        text: `Your weight's moving ${faster ? 'faster' : 'slower'} than your logged intake predicts (about ${Math.abs(gap).toFixed(1)}kg ${faster ? 'further than' : 'short of'} the model). Bodies vary and you know yours best — if this holds, nudging your metabolism modifier ${faster ? 'up' : 'down'} a few % in Inputs will line the model up with your reality.` })
    }
  }

  // Training volume vs the plan — respect effort; consistency beats heroics.
  if (planRes.plannedSets > 0 && logged >= 7) {
    const ratio = w.setsPerWeek / planRes.plannedSets
    if (ratio < 0.6) candidates.push({ priority: 4, tone: 'note', title: 'Training volume is running light',
      text: `Your logged sets/week are below your plan. Volume drives muscle more than anything — but consistency beats heroics, so just close the gap where it fits your week, no guilt.` })
  }

  // Sparse logging — reassure, don't nag.
  if (planRes.days >= 14 && logged > 0 && logged / planRes.days < 0.4) {
    candidates.push({ priority: 6, tone: 'note', title: 'Log lightly, log often',
      text: `You've logged ${logged} of ${planRes.days} days. That's plenty to learn from — and a rough estimate on a busy day beats a blank, so don't sweat the gaps.` })
  }

  candidates.sort((a, b) => a.priority - b.priority)
  for (const c of candidates) out.push({ tone: c.tone, title: c.title, text: c.text })

  // Always leave them with something — if nothing flagged, acknowledge it honestly.
  if (!out.length) out.push({ tone: 'good', title: "You're on track",
    text: "Nothing's shouting for attention — your numbers are pointing the right way and your logging's solid. The boring middle is where it's won. Keep going." })

  return out.slice(0, 3)
}
