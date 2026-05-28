# timmFlat Ceiling Audit (W4 Box 1) — Leo + Rollo

**Authors:** Leo (instructor) + Rollo (art director), joint
**Status:** W4 audit — GATES the Felix + Nick build
**Question (from Gary):** Can the engine reach confident-pro (Pascal 6-7) on
timmFlat, or does something architectural cap it?

---

## TL;DR — the verdict

**Capped by decals at the top.** The two flagged levers (`highlightCutout`,
per-feature line-weight) are real, cheap, and worth building — they get
timmFlat **reliably to a strong 6, occasionally brushing 7 on the best cells**.
But they do **not** get the pack to a *dependable* 7 across the 16-cell grid.
The thing standing between a strong-6 and a dependable-7 is **feature
integration** — the features-as-decals model — and that is **architectural, not
a per-feature tuning lever.** It is a Q2 body-architecture job (Lloyd, A-1),
not a W4 task.

So: **build the two levers this week** (they bank a real, gradeable lift and
they are prerequisites the integration model will sit on top of anyway), and
**ship the honest finding that 7-dependable needs A-1.** A negative result on
"can decals reach master-tier" is exactly what Gary asked W4 to find.

---

## What the actual W3 renders show

The shipped grid (`/tmp/nick-q1-shipped/grid/`) is the post-W3 state. The
render source is self-incriminating in the best possible way — the cells label
their own construction model. From `cell-00-young-f-african.svg`:

- `<desc>… features-as-decals projection</desc>` — the renderer names the model.
- Face base is a **single flat `ellipse`** with the comment
  `skin plane: single flat tone, no form turn`. There is **no value step
  anywhere on the skin** — no socket shadow, no brow-ridge plane, no jaw turn.
- `.contour` and `.lid` are both `stroke-width: 2`. **Every line is one
  weight.** The upper lid carries no more authority than the chin contour.
- `.feature-fill { stroke: none }` — flat fills, **no specular knockout** on
  eye, lip, or hair.

So all three of our W1 ceiling-raisers are confirmed *absent in the shipped
build*, and Pascal's §Pass 3 "features applied-to, not emerging-from" reading
is confirmed *at the source level*, not just by eye.

**Where the off-day-pro read breaks down vs confident-pro — by cell:**

- **Eye sits on skin, not in a socket (all 16 cells).** The almond + iris is a
  clean shape, but with a flat skin plane behind it and a same-weight lid line,
  it reads as a sticker on a balloon. This is the single most visible cap.
  Worst on the high-contrast cells where the shape confidence makes the flat
  placement *more* obvious (Leo's W1 prediction: the more graphically confident
  the shape, the more its flatness shows) — e.g. `cell-05-adult-m-european`,
  `cell-13-senior-m-african`.
- **Mouth floats, doesn't wrap (all cells).** Lip shapes are value-separated
  but flat-on; corners don't turn back onto the jaw cylinder. Reads pasted-on
  most on the broad-jaw male cells (`cell-06`, `cell-09`, `cell-11`).
- **Senior cells read too young (`cell-12`–`cell-15`).** Pascal flagged this in
  Pass 2 and it persists: with no crease/fold and no plane change, age lives
  only in hair value and silhouette. A flat skin plane has nowhere to put age.
  This is a *symptom of the same decal cap* — age is a form-and-fold story.
- **Brow is a flat shape, no ridge (all cells).** No plane change at the brow,
  so the upper face has no structure above the eye to anchor the socket.

None of these are "the shape is wrong." Every shape is a competent off-day-pro
shape. They are all *placement / form-turn* failures. That is the decal ceiling
expressing itself feature by feature.

---

## The lever list (priority order, expected Pascal lift)

| # | Lever | Owner | Expected lift | W4-fit | Verdict |
|---|-------|-------|---------------|--------|---------|
| L1 | **`highlightCutout`** — negative-space specular knockout on eye, lower lip, hair mass | Felix (primitive) + Nick (wire) | **5 → 6** (broad), strong cells brush 7 | **YES** | BUILD |
| L2 | **Per-feature line-weight multiplier** — upper-lid 2-3x face contour; secondary edges lighter | Felix (primitive) + Nick (canon table) | **+0.5-1** on top of L1 | **YES** | BUILD |
| L3 | **Mouth-corner darkening accent** | Nick (pack param) | small (+0.25), cheap | maybe, if time | NICE-TO-HAVE |
| L4 | **Brow-as-plane / value step** | — | would help, **but** needs a normal at the brow to be honest | **NO** | borderline-architectural → folds into A-1 |
| A-1 | **Feature-attachment model** (socket / ridge / mandible normals) | Lloyd | **structural — the 6→7-dependable unlock** | **NO** | Q2 FINDING |

### Reprioritization vs the BACKLOG

The BACKLOG estimated L1 and L2 at "~7→8." **We are downgrading the framing,
not the levers.** Those estimates assumed a base already at 7; the shipped pack
is a solid 5. From a 5 base:

- **L1 `highlightCutout` is the bigger mover** and stays #1. It is *the*
  flat-graphic "pro illustrator" tell — a knocked-out specular implies a light
  source and a glossy plane with zero gradient, which is exactly the timmFlat
  register (flat fills + decisive shape). It earns the most Pascal per byte and
  it reads at thumbnail (confirmed against grid-96 use-case). Eye + lower lip
  are the highest-value placements; hair mass third.
- **L2 line-weight is the construction-confidence tell** and stays #2, but it
  is a *multiplier on L1's gains*, not an independent +1. A heavy upper-lid line
  makes the eye read deliberate — but on a flat skin plane it still sits on, not
  in. L2 raises the floor of confidence; it does not break the decal ceiling.
- **L3 mouth-corner** demoted to nice-to-have. Genuinely cheap (a pack param,
  no new primitive), so if Felix finishes L1+L2 with room, Nick can land it.
- **L4 brow-as-plane** is the honest casualty. We flagged it W1 as "borderline
  architectural — may need the socket model." The renders confirm it: a brow
  plane-step without a brow-ridge normal is faking a form turn the model
  doesn't have, and it will read as a smudge, not a ridge. **Do not build L4 as
  a fake. It is the first thing A-1 should pay off.**

---

## The honest architectural call

**Decals cap timmFlat at a strong 6.** Here is the reasoning chain, stated
plainly so Gary can route it:

1. Pascal scores timmFlat on **shape/silhouette confidence** today, and the
   shapes are good — that is why it is a clean 5 across 16 cells.
2. The 6→7 axis is a **different axis: integration** — does the feature *belong
   to* the form. Pascal §Pass 3 says this explicitly; Leo's W1 integration
   audit *predicted this exact ceiling for packs 3+* and named the mechanism
   (flat fills have no gradient to hide the placement seam, so the decal problem
   is maximally visible precisely in shape-led packs like timmFlat).
3. L1 + L2 move *confidence*, which buys most of the 5→6 gap and lets the best
   cells touch 7. They **cannot move integration**, because a highlight cutout
   and a heavy lid line are still painted **on a flat skin plane with no socket,
   no ridge, no jaw turn.** A glossier sticker is still a sticker.
4. Therefore **dependable 7 across the grid requires A-1** (the
   feature-attachment model: each feature anchored to a surface patch with a
   normal, so the renderer knows how the form turns under it). That is an
   integration *layer under all packs*, not a timmFlat param.

This is not pessimism about the levers — it is precision about what they buy.
**Build them; they are real and they are prerequisites** (the attachment model
renders highlights and lid-weight *better* once it knows the form, so L1/L2 are
not throwaway). But do not promise Gary a 7-ceiling out of W4. W4 buys a
**bankable strong-6 and a de-risked Q2 plan.**

---

## W4-fittable scope (the build)

**Felix + Nick build, in priority order:**

1. **L1 — `highlightCutout` primitive** (Felix) + wiring on eye / lower-lip /
   hair (Nick). Negative-space specular. Highest mover. Build first.
2. **L2 — per-feature line-weight multiplier** (Felix primitive: weight as a
   per-feature param; Nick: the Timm canon table — upper-lid 2-3x contour,
   secondary edges lighter). Build second.
3. **L3 — mouth-corner darkening** (Nick, pack param only) **only if L1+L2 land
   with room.** Do not let it displace L1/L2.

**Explicitly NOT in W4 scope:** L4 brow-as-plane (becomes a fake without A-1)
and A-1 itself (Q2, Lloyd). Building L4 as a fake would *lower* scores by
introducing a form-turn the model can't honor.

**Acceptance for the build:** L1+L2 should move the grid from 16/16 ≥ 5 to
**16/16 ≥ 6** with the strongest cells (high-contrast adult/young) scoring 7.
If that lands, the W4 thesis holds: levers buy 6, A-1 buys dependable-7.

---

## Routing

- **Felix + Nick:** build L1, L2 (L3 if room). Gated, proceed.
- **Lloyd (Q2):** A-1 feature-attachment model is the 6→7-dependable unlock and
  the prerequisite for L4. This audit is the third independent confirmation
  (Leo W1, Pascal Pass 3, this render-level read) — treat as load-bearing for
  Q2 planning.
- **Gary:** the master-tier (6-7) bar is reachable **as a dependable grid-wide
  property only after A-1.** W4 banks a strong-6. That is the honest ceiling of
  the decal model, which is exactly the finding W4 was chartered to produce.
