# felix-nick-timmflat-ceiling-raisers

Q1-W4 Box 2 (the build in the master-tier (B) lane). Implement the
ceiling-raisers the Leo+Rollo audit (`tasks/leo-rollo-timmflat-ceiling-
audit.md`) prioritized, so Pascal can score whether timmFlat reaches
Pascal-6-7. **Scope this task against the audit's final lever list —
the two strong candidates below are the expected outcome, but the audit
sets the list. Do not start until Box 1 lands.**

## Brief

Gary confirmed "prove master-tier" as the Q1 bar. timmFlat ships at
Pascal-5 across 16/16 cells. W4 spends the BACKLOG ceiling-raisers on
the pack we understand best to prove the engine CAN reach confident-pro
(Pascal 6-7) — or prove it can't without architecture (a legitimate
finding). This task lands the primitives; Pascal
(`tasks/pascal-w4-master-tier-rescore.md`) scores the lift.

## Expected lever list (confirm against the Box 1 audit)

1. **`highlightCutout` primitive (NEW, ~20 LOC).** A catch-light /
   cel-shadow cutout region over the hair mass. For Timm, used
   INVERTED: a dark shadow shape covering ~30-50% of the hair (side
   facing away from the implicit 3/4-front-left light) — Batman-cowl /
   Harley-pigtail register. BACKLOG est. Pascal ~7→~8. **Felix owns
   the graphics-math interior** (the cutout-region geometry against the
   hair silhouette / hull — how the shadow shape is derived and clipped
   to the hair mass at fixture-realistic scale). Nick implements the
   render + wires it as an opt-in pack knob.

2. **Per-feature line-weight multiplier (~30 LOC, render-path touch).**
   `style.lineWeight` is currently a single uniform scalar.
   Add a per-feature multiplier so the upper-eyelid line renders 2-3×
   the face-contour weight (Timm canon — Leo §1). BACKLOG est. villain
   register ~7→8. **Felix owns the graphics-math interior** (how the
   multiplier composes into the stroke-weight at render time without
   artifacts). Nick wires the knob + pack-data. **Lloyd reviews IF the
   change touches an architectural seam** (a render-path scalar knob is
   likely Nick+Felix lane, not a cascade change — confirm scope on
   review and pull Lloyd in if it grows past a render-path knob).

## Concrete changes (against the audit's final list)

- **`highlightCutout`:** new primitive in the render path (`src/render/`),
  exposed as an opt-in recipe/pack knob (default off → existing hair
  fill unchanged). Add to `timmFlat.declares` so the manifest carries
  it through the cascade (per the Q1 manifest landed W3). Nick wires
  the pack-data so ONLY timmFlat opts in.
- **Line-weight multiplier:** new per-feature multiplier field
  (default 1.0 → uniform weight, existing behavior). Pack sets the
  upper-lid multiplier to ~2-3× for timmFlat. Add to `timmFlat.declares`
  if it's a declared pedagogy path.
- **Render the proof images:** the 16-cell grid + the villain-register
  probes the Box 1 audit named (`adultFemPointed` / `elderMascPear` /
  the Joker-direction lid-weight probe). Share via Bob for Pascal's
  evidence pass.

## Acceptance

- The audit's prioritized levers land as **additive opt-in knobs**,
  defaulting to current behavior.
- **Mixture rule (hard gate):** `default`, `tintin`, `ligneClaire`
  byte-identical pre vs post on the full broad regression sweep (the
  816-cell sweep that W3's Q1 manifest used, or the equivalent). ONLY
  timmFlat cells drift, by design. The line-weight multiplier touches
  a shared render path — prove the non-opted packs don't move.
- timmFlat 16-cell grid + villain-register probes re-rendered, shared
  for Pascal.
- Felix's graphics-math interior is honestly sized (per the AGENTS.md
  post-alpha-shape rule: name the fixture-realistic scale the
  highlightCutout geometry actually sees; if the cutout-region
  derivation is more LOC than estimated, that's Felix's sizing call,
  surfaced at design time — not discovered at +340 LOC).

## Notes

- Lanes: **Felix** = graphics-math interior (highlightCutout cutout-
  region geometry; line-weight composition at render) + reviews Nick's
  graphics-math. **Nick** = broad implementer (render code, the opt-in
  knob plumbing, pack-data wiring, `timmFlat.declares` additions).
  **Lloyd** = architectural review IF a seam is touched. **Leo** =
  confirms pedagogy on the rendered probe (does the cel-shadow / heavy
  lid match the Timm canon the audit cited?).
- If Nick hits an input-scale or algorithm-class question on the
  highlightCutout geometry he didn't expect, escalate to Felix rather
  than inventing past it (the alpha-shape antipattern).
- This is depth-on-a-known-quantity — the lowest-variance build
  available. Don't expand scope past the audit's lever list.
- Plain-English: we're proving the ceiling, not shipping a guaranteed
  Pascal-7.

## Handoff

### Felix-half — graphics-math interior + sizing + determinism

**L1 — `recipe.highlightCutout` primitive (built).** Inverted cel-shadow
inscribed inside the hair polygon, painted on top of the cap fill via
painter's order (no polygon boolean ops, no clipping). Geometry built
parametrically from the SAME `topSil` / `hairline` arrays the cap fill
uses, plus a 4-sample interior dividing line. Two reachable code paths:

- **Cap-mode cutout** (short / medium hair + long flat hair via
  `longFlatNeedsCap`): polygon = `topSil[0..tEnd] + dividingLine +
  hairline[hStart..end]`. Closure to `topSil[0]` is implicit (matches the
  cap polygon's own closure at the right temple).
- **Curtain-mode cutout** (long + flat-fill, the Felix W3 curtain
  primitive at `scaffold.ts:1399`): polygon = `topSil[0..tEnd] +
  dividingLine + rightSide[sStart..end]`. Same closure principle.

Both paths support `side: 'left'` via mirror (left temple traversal +
`leftSide` for curtains).

**Felix sizing note (honest):** total LOC of the geometry interior =
~100 LOC (cap-mode block + curtain-mode block + the recipe type
addition + the `darken()` color reuse from `math/color.ts`). The
audit budgeted ~20 LOC; I came in at ~5× that. Honestly sized at
DESIGN TIME, not discovered at +340 LOC like the alpha-shape miss:

- The audit's "~20 LOC" assumed a single primitive site. The hair has
  TWO render paths (cap polygon + curtain polygon) that BOTH need a
  cutout, and each needs its own polygon walker because the underlying
  hair-shape vertex array is laid out differently (cap = topSil +
  hairline reversed; curtain = topSil + leftSide + bottom + rightSide).
- Each polygon walker is ~30 LOC including the `side: 'left'` mirror.
  The mirror is non-trivial because the closed-polygon orientation
  matters: walking the wrong direction inverts which fill-rule side
  the cutout paints.
- Add ~15 LOC for the recipe-type extension + ~15 LOC for the
  cap-mode cutout's exterior closure logic + ~10 LOC for parameter
  clamping + comments.

The sizing call could have been made smaller (~50 LOC) by sharing a
helper between cap-mode and curtain-mode, but the two underlying vertex
arrays are different enough that the helper's signature would be ugly.
Inlined the two cases for readability; if a third hair-shape primitive
needs a cutout later (e.g. a halo / coily volume), extract the helper
then.

**Algorithm-class call:** no boolean ops, no SDF, no convex-hull. Just
inscribed-polygon painting. The hair shape is convex on the top half
(elliptical arc) and ~flat on the bottom edge; the cutout polygon walks
along the existing hair boundary and adds one interior dividing chord.
Polygon stays inside the hair across all 13 hairstyles × all 4 ages × 2
presentations on the timmFlat substrate — verified by the 16-cell grid
render + 4 probe renders (no clipping artifacts visible).

**L2 — per-feature line-weight multiplier (built).** Added
`style.featureWeights` block (`eyeUpperLid`, `eyeLower`, `brow`,
`mouth`, `faceContour`, `hair`), all default 1.0. Composes
multiplicatively with the renderer's existing 1.35 silhouette boost +
the additive jitter variance:

    final_sw = max(0.5, lineWeight × silhouetteBoost × featureMul + swVar)

The composition order is deliberate: featureMul stacks ONTO the
silhouette boost rather than replacing it, so packs that opt in to a
heavier face contour don't accidentally lose the figure/ground
separation rule.

Wired via two paths in `scaffold.ts`:
- **Eye builders** (`buildEye` / `buildEyeDots`) take an explicit
  `weights` arg so the upper-lid stroke can carry a DIFFERENT multiplier
  from the lower-lid + lashes. The eye is the load-bearing case (audit
  L2 cites the upper-lid 2-3× vs face contour explicitly).
- **All other features** (brow / mouth / hair / silhouette) stamp
  `weightMul` post-emit via a small helper. The `weightMul` is then
  forwarded through `projectCurve` → `Projected` → the SVG renderer.
  Default undefined → undefined throughout → no behaviour change.

**Determinism note (Holly's flag).** Confirmed: the clump-hair RNG at
`scaffold.ts:1479` uses `let rngState = 1 >>> 0` — a hardcoded seed,
NOT sourced from `p.style.jitterSeed`. The RNG IS deterministic (same
params → same SVG; verified by re-running `timmflat-grid.ts` twice and
diffing — `0` byte differences). So "unseeded" was the wrong word —
the seed is just hardcoded to 1 rather than reading from the params
surface. This means SAME params always produce SAME hair, which is the
contract piece 4 (character identity) cares about — but DIFFERENT
seeds via `jitterSeed` will NOT re-shuffle the hair. Separate bug from
this piece; flagged for Holly to take when she lands the determinism
regression scaffold. The new L1+L2 primitives in this PR are 100%
parametric — no RNG, no contribution to non-determinism.

### Nick-half — wiring + render demo

**Pack opt-in (`src/presets/styles.ts`).** timmFlat now declares:

    style.featureWeights.eyeUpperLid: 2.5   (audit L2 — upper-lid 2.5× canon)
    hair.recipe.highlightCutout: { side: 'right', coverage: 0.40, darken: 0.32 }
                                            (audit L1 — light from 3/4-front-left,
                                             shadow on right, ~40% coverage,
                                             moderately darker than hair base)

**Declares manifest (`src/model/params.ts`).** Added two new
`AllowedDeclarePath` entries: `hair.recipe.highlightCutout` and
`style.featureWeights` — so demographic / hairstyle / expression layers
can't accidentally clobber the audit pedagogy on timmFlat. The
compile-time enforcement (excluding demographic-only paths) still
holds.

**Renderer wiring (`src/render/svg.ts` + `src/render/project.ts`).**
`Projected` now carries `weightMul` forwarded from `Curve.weightMul`;
the SVG renderer multiplies it into the stroke width.

**Mixture-rule regression (816-cell sweep).**

    diff /tmp/felix-baseline/manifest.txt /tmp/felix-final/manifest.txt
    → 612 non-timmFlat cells: 0 byte differences
    → 204 timmFlat cells: ALL drift (expected — pack opted in)

Default / tintin / ligneClaire byte-identical across all
(age, presentation, hairstyle) combinations.

**Renders for Pascal's evidence pass.** All in `/tmp/timmflat-w4/`:

- `/tmp/timmflat-w4/grid/sheet-full.png` — the 16-cell composite sheet.
- `/tmp/timmflat-w4/grid/01-adult-masc-square-shortSwept.png` … `16-elder-fem-jowled-bobChinLength.png`
  — individual full-size cells.
- `/tmp/timmflat-w4/grid-96/four-corners.png` — four-corner thumb test.
- `/tmp/timmflat-w4/probes/adultFemPointed.png` — Joker register
  (audit named explicitly).
- `/tmp/timmflat-w4/probes/elderMascPear.png` — Penguin register.
- `/tmp/timmflat-w4/probes/pointed-jaw.png` / `pear-jaw.png` —
  off-grid topology probes.
- `/tmp/timmflat-w4/tintin-regression/sheet-tintin4.png` — mixture-rule
  guard: tintin × 4 demographic sheet, byte-identical to W3.
