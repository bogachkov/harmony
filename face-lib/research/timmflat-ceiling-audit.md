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

Studied the shipped 16-cell grid (`/tmp/nick-q1-shipped/grid/` full +
`/grid-96/` thumbs + `four-corners.png`). These are the post-all-W3 PNGs.
The faces are genuinely clean: symmetric, confident closed contour, zero
jitter, flat fills, demographically distinguishable jaw silhouettes
(four-corner now passes — cell 1 square, 4 oval, 12 round, 14 jowled all
read distinct at 96px). That is an honest Pascal-5. What's *missing* — and
it's missing identically on all 16 cells — is what would push it to 6-7:

- **Hair is a single flat tone — no shadow cutout, anywhere.** Look at cell
  6 (long sleek), cell 1 (short swept cap), cell 4 (bob): each is one
  uniform black mass. The Timm signature two-tone (base + one dark cel-shadow
  over ~30-50% of the mass) is simply absent. This is the single most visible
  "TV-flat vs published-flat" gap. **`highlightCutout` (used inverted, as a
  shadow cutout) is the lever** — confirmed by eye, exactly as W1 spec §3 and
  Pascal Pass-3 anticipated.
- **The line is one weight everywhere.** The upper-lid stroke, the face
  contour, the brow bar, and the mouth dash are all the same thickness. The
  eye therefore has no hierarchy — in Timm canon the upper lid is 2-3x the
  contour and the eye reads as "the lid more than the pupil." Here the lid is
  a thin almond outline with a dot pupil and a small under-tick; it reads
  *drawn-by-a-tool*, not *inked-with-intent*. **Per-feature line-weight is
  the lever.** Most visible on the clean adult cells (1, 4) where everything
  else is right and the flat eye is the only thing holding it at 5.
- **The eye sits ON the skin, not IN a socket (all 16).** Flat skin plane
  behind a flat almond, no shadow, no lid-crease depth. It is the textbook
  features-as-decal. A heavier lid line (L2) makes it read *more deliberate*
  but it still sits on the surface — L2 cannot put it in a socket.
- **The mouth is a single flat dash, flat-on.** It doesn't wrap the jaw; the
  corners don't turn back. On the broad-jaw cells (1, 14) the dash floats in
  the lower third. A corner-darkening accent helps a little; it does not
  wrap the form.
- **The brow is a flat floating bar, no ridge.** Same-weight, no plane change
  above the eye, nothing for the socket to hang off.
- **Elder cells (14-16) read only ~15 years old-er than adult.** The jowl
  silhouette (Q2 work) now lands, but with a flat skin plane there is nowhere
  to put a crease, a fold, or an orbital hollow — age beyond silhouette has no
  surface to live on. This is the *same decal cap* showing up as an age-read
  ceiling.

None of this is "the shape is wrong." Every shape is a competent off-day-pro
shape. The misses are (a) two absent flat-graphic tells — hair-shadow and
lid-weight — and (b) form-turn / attachment, which is the decal ceiling.
(a) is buildable this week; (b) is architectural.

---

## The lever list (priority order, expected Pascal lift)

| # | Lever | Owner | Expected lift | W4-fit | Verdict |
|---|-------|-------|---------------|--------|---------|
| L1 | **`highlightCutout`** — used INVERTED as a hair shadow-cutout (one dark cel-shadow over ~30-50% of the mass, light side 3/4-front-left); plus specular knockout on eye + lower lip | Felix (primitive) + Nick (wire) | **5 → 6** (broad), strong cells brush 7 | **YES** | BUILD |
| L2 | **Per-feature line-weight multiplier** — upper-lid 2-3x face contour; secondary edges lighter | Felix (primitive) + Nick (canon table) | **+0.5-1** on top of L1 | **YES** | BUILD |
| L3 | **Mouth-corner darkening accent** | Nick (pack param) | small (+0.25), cheap | maybe, if time | NICE-TO-HAVE |
| L4 | **Brow-as-plane / value step** | — | would help, **but** needs a normal at the brow to be honest | **NO** | borderline-architectural → folds into A-1 |
| A-1 | **Feature-attachment model** (socket / ridge / mandible normals) | Lloyd | **structural — the 6→7-dependable unlock** | **NO** | Q2 FINDING |

### Reprioritization vs the BACKLOG

The BACKLOG estimated L1 and L2 at "~7→8." **We are downgrading the framing,
not the levers.** Those estimates assumed a base already at 7; the shipped pack
is a solid 5. From a 5 base:

- **L1 `highlightCutout` is the bigger mover** and stays #1. In the renders the
  hair is a single flat tone on all 16 cells — the missing two-tone (base + one
  dark cel-shadow) is *the* most visible "TV-flat vs published-flat" gap, so the
  **inverted hair shadow-cutout is the highest-value placement**, not the
  specular. A knocked-out specular on eye + lower lip is the secondary use — it
  implies a light source and a glossy plane with zero gradient, exactly the
  timmFlat register (flat fills + decisive shape). It earns the most Pascal per
  byte and it reads at thumbnail (confirmed against the grid-96 use-case).
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
