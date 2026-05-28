# Leo face-integration audit — eye / mouth / brow under W2 timmFlat

*Q1-W1 Box 4. Audit-only. Probes at `/tmp/leo-probe-styles/` (12
cross-product PNGs across {default, tintin, ligneClaire} × demographics
× expressions) + `/tmp/leo-audit-probe/` (8 gallery samples).*

---

## TL;DR

| Primitive | Verdict        | Rework  | W2 implication |
| --------- | -------------- | ------- | -------------- |
| Eyes      | **STOP**       | small ~25 LOC | timmFlat requires `lidLine` on almond; today it's wired only on dots. Fix BEFORE W2. |
| Brows     | GO-WITH-CAVEATS | knob   | `style:'single'` brick is W2-ready; pack must NOT default `'split'`. Ceiling ~6 without categorical shape enum. |
| Mouth     | GO-WITH-CAVEATS | knob   | Pack must set `lipFullness:0, upperCurve:0, labiomentalShow:0, cornerMarks:false` (all in spec). Hardcoded cupid-bow caps ceiling at ~7. |
| Integration | GO-WITH-CAVEATS | small | Features-as-decals-on-silhouette IS Timm-correct render. Will block packs 3-4 (Caniff / manga / realistic), not pack 2. |

**Net W2:** one ~25 LOC Nick prereq (eye plumbing). Then timmFlat
ships as parameter flips per the W1 spec. No W3 bump.

---

## Eyes — STOP (small, ~25 LOC)

**Probes.** `tintin` (dots): dot + lidLine arc + underline integrate
as a Hergé eye (09/10/12). `default`/`ligneClaire` (almond): thin lens
with center-floating pupil and NO upper-lid stroke (01,02,05,06).
Reads "small lens pasted on skin." Iris-tucked-under-upper-lid rule
(Loomis 1956 §"The Eye" p.46; Faigin 2012) violated; lid weight
that sells Timm/Caniff/manga is absent.

**Code finding.** `buildEye(anchor, halfWidth, openness, tilt,
surfaceZ)` at `scaffold.ts:421` takes no lidLine/lashes/underlineHint.
`buildEyeDots` at `:343` takes all three. Call sites `:2287-2297`
pass them only into the dots branch. **`p.eyes.lidLine` on
`style:'almond'` is silently ignored.**

**Impact on timmFlat.** Spec line 333: `eyes.style:'almond',
lidLine:0.6` (load-bearing). Sito 2004 p.40 quotes Timm: "the eye
is the lid more than the pupil." Without the fix, pack ships with
a thin unweighted almond — opposite of Timm canon.

**Mixture-rule rework (don't replace, plumb).** ~25 LOC in
`buildEye`: (a) add `lidLine, lashes, underlineHint` params, default
0 — preserves existing renders (all current presets are 0 on the
almond branch). (b) `lidLine>0.05` emits thicker upper-lid stroke;
`>0.4` switches to parallel-filled poly (the Timm "brick on the
upper lid"). (c) Mirror `lashes`+`underlineHint` blocks from
`buildEyeDots`.

**Verdict — STOP, but small.** Half a day of Nick. Lloyd review
not required. After: GO.

**Defer:** iris-tucked-under-upper-lid Y offset; orbital socket
recess primitive (load-bearing for Caniff/manga/realistic packs —
BACKLOG #5).

---

## Brows — GO-WITH-CAVEATS

**Probes.** `default` (`'split'`): two parallel strokes spaced by
`fullness*4`. Reads as sketchy double-pass (01-04) — motor-imitation
of "I drew it twice," no pedagogical basis. Per mixture rule, KEEP
as reachable point (future sketch-pack) but don't promote.
`tintin/ligneClaire` (`'single'`): closed-fill brick. Maps OK to
Hergé/Caniff/Timm bricks (Sito 2004 pp.39-40).

**Issue.** Brick has uniform top/bottom; `arch` is wired but small
(`arch*length*0.16*sin(πt)` at `buildBrow:470`). Probe 09
(`arch:0.2`, angry) vs 10 (`arch:0.7`, sad) barely distinguishable.
Cannot reach Joker-thin-arched / Harley-diamond / Batman-block as
categorical shapes.

**Constraint on pack.** timmFlat MUST set `'single'` (already in
spec line 333). Default would be visibly wrong.

**Verdict — GO-WITH-CAVEATS.** Pascal ≥5 reachable; ceiling ~6
without categorical brow-shape enum (W1 spec lines 276-285 +
Rollo's villain-register gap #3).

---

## Mouth — GO-WITH-CAVEATS

**Probes.** Main seam (`buildMouth:582-596`) bakes a cupid's-bow
pulse `bow=-cos((t-0.5)*6)*width*0.018 - width*0.012` into the seam
itself regardless of `lipFullness`. Central pulse ≈0.008 absolute at
width=0.28; `cornerLift*totalH` for sad (-0.022) ≈0.013. **Similar
magnitudes — expressions barely register on the seam** (probes
09/10/11 angry/sad/surprised all read similar mouths). Plus
`lipFullness>0.1` adds lower-lip; `>0.2` adds upper-lip; sulcus
adds a fourth. Default-fem renders show 3 stacked horizontals (01,
05) — the "stacked features" complaint.

**Pedagogy.** Faigin 2012 §"The Mouth": mouth is ONE construction;
styles render subsets. Timm: seam only, zero central bow (Sito 2004
p.42 — "one line, sometimes two"). Spec correctly suppresses all
but the seam.

**Constraint on pack.** timmFlat sets `lipFullness:0, upperCurve:0,
labiomentalShow:0, cornerMarks:false` (verified in spec). Mouth IS
just the seam.

**Residual.** Hardcoded cupid-bow inside the seam still fires.
Pascal MAY flag on Joker/Two-Face hard-line renders.

**Verdict — GO-WITH-CAVEATS.** Pascal ≥5; ceiling ~7 without
`mouth.philtralBow` knob (BACKLOG #2).

---

## Integration — GO-WITH-CAVEATS

Features have no *attachment plane* — no orbital socket recess,
no brow ridge plane, no mouth-on-mandible curl. They sit on the
front-projected sphere surface like decals. This IS Pascal's
"stacked primitives" complaint at the substrate.

**Critical:** Timm flat-shape forgives this MORE than any other
tradition. Timm canon IS features-as-decals-on-cel (Sito 2004 p.41:
"I don't draw the skull. I draw the chin, then shapes that sit on
top"). Engine substrate matches Timm's symbolic compression. Compare:
Caniff needs socket shadow + cheekbone plane (STOP). Manga shoujo
needs heavy upper-lid + cheek highlight + iris ring (STOP).
Realistic/Vilppu needs Asaro/Loomis planes (STOP).

Leo+Rollo picked the pack that dodges the debt by accident. **W2:
GO. Packs 3-4 will need socket/ridge/plane primitives (BACKLOG #5).**

---

## BACKLOG candidates for Claudia

1. **`buildEye` plumb lidLine/lashes/underlineHint through almond
   path** — ~25 LOC, Nick. **PROMOTE to W2 pre-Nick** (STOP-flag).
2. `mouth.philtralBow:0..1` knob — ~5 LOC. Defer W3.
3. Categorical `brows.shape:'block'|'arched'|'diamond'|'tapered'`
   — ~40 LOC. Defer W3+ (restated from W1 spec).
4. Per-feature line-weight multiplier — ~30 LOC. Defer W3+ (restated
   from W1 spec).
5. Orbital socket recess primitive (eye) — medium, Leo brief + Nick.
   Defer to first pack that requires it. **NEW.**
6. `expressions.ts` resuscitation pass — uses #2 + amplified
   `cornerLift`. Already in BACKLOG. Defer W3+.

---

## Executive summary

- **Per-primitive: eyes = STOP (small ~25 LOC). brows = GO-WITH-
  CAVEATS (pack must not default `split`; ceiling ~6 without shape
  enum). mouth = GO-WITH-CAVEATS (pack knobs already correct in
  spec; hardcoded cupid-bow caps ceiling ~7).**
- **Cross-cutting integration insight:** features-on-silhouette-
  front-projection IS Timm-correct render — the engine's structural
  seam matches the tradition. Packs 3-4 (Caniff / manga / realistic)
  will hit the orbital-socket / brow-ridge / mouth-attachment debt
  hard; Leo+Rollo accidentally picked the pack that dodges it.
- **W2 brief for Claudia:** ONE ~25 LOC Nick prereq (`buildEye`
  plumbing) lands BEFORE timmFlat implementation. After that, W2
  ships as parameter flips per the W1 spec. No W3 bump needed.

*— Leo, Q1-W1 face-integration audit. Closes ship-gate box 4.*
