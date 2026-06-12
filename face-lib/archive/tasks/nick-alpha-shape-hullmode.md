# nick-alpha-shape-hullmode

Add `hullMode: 'convex' | 'alpha'` to `HairstyleRecipe`, implement
alpha-shape merger in `src/render/hull.ts`. Convex stays as a mode
per mixture rule.

## Brief

Lloyd's pass-2 review (`research/lloyd-pass-1.md` Pass 2 §4) pulled
alpha-shape OUT of the "deferred until adoption" deferral and INTO
Q1-W2. The reason: current convex hull renders `coilyHalo` as a
hexagon and `longCurtain` as a nun's wimple — both unshippable in
their current form. Any W3 pack that wants volume mode (Rollo's
TWA / coily gap) lands DOA without alpha-shape.

Implement alpha-shape per Lloyd pass 1 §7:

- Alpha-shape preserves concavities (parting gaps, gaps between
  clumps).
- Alpha auto-tuned from clump spacing — no hand-tuned knob in v1.
- Lloyd's projection: ~80 LOC in `src/render/hull.ts`.

Mixture rule: add `hullMode?: 'convex' | 'alpha'` to
`HairstyleRecipe` (default `'convex'` for the three W1 volume
fixtures that have already opted in; alpha becomes the default for
any NEW volume-mode adoption). Convex stays as a mode, not deleted.

## Concrete changes

### Types

In `src/model/scaffold.ts` (or wherever `HairstyleRecipe` lives —
follow Nick pass 2's wiring):

```ts
hullMode?: 'convex' | 'alpha';   // default 'convex' for existing
                                  // volume fixtures; 'alpha' for new
```

### Render pipeline

In `src/render/hull.ts`, add an alpha-shape function alongside the
existing convex-hull function. Pure-function shape, same signature
(input: list of projected capsules → output: hull polygon), so Holly
can write regressions against either independently.

Alpha tuning: derive alpha from the median clump spacing in the
input. The qualitative target (Lloyd §7): "alpha auto-tuned from
clump spacing." Concrete: alpha ≈ median nearest-neighbour distance
× some constant (1.5x is a defensible starting guess; tune by
re-rendering the three W1 fixtures until they look right).

The dispatch from convex to alpha lives in the merge stage (stage E
in Lloyd pass 1 §2 pipeline). Read the recipe's `hullMode` once,
pick the merger function, call.

### Hairstyle defaults

- The three W1 volume fixtures (`shortBob` flat regression guard,
  `longCurtain`, `coilyHalo`): leave `hullMode` undefined; default
  resolves to `'convex'` (preserves their existing renders).
- For each of the three: ALSO add a sibling fixture
  `longCurtainAlpha` / `coilyHaloAlpha` that sets `hullMode:
  'alpha'`, OR flip the existing fixture's `hullMode` to `'alpha'`
  if you and Lloyd agree the alpha render is the canonical
  "honest" render and the convex render is the regression-history
  one. Lloyd's framing in §4 leans toward making alpha the
  eventual default for new adoption; ask Lloyd at review time
  which direction to land.

**Default for the timmFlat pack**: irrelevant — timmFlat is
`clumpMode: 'flat'`, so no hull merger fires. Decoupled from this
PR.

## Acceptance

Hard gates:

1. **`hullMode: 'convex' | 'alpha'` added to `HairstyleRecipe`.**
   Default behaviour when `hullMode` is undefined preserves
   existing renders (the three W1 volume fixtures are unchanged
   when their `hullMode` is undefined).
2. **Alpha-shape implementation in `src/render/hull.ts`.** Pure
   function, same input/output type as the convex-hull function.
   ~80 LOC ballpark per Lloyd §7 — if you land at 200+ flag it
   like the last refactor.
3. **The three W1 fixtures re-render under alpha mode** with the
   following visible improvements:
   - `coilyHalo` no longer reads as a hexagon — the radial halo
     should have a roughly-radial concave boundary, NOT a flat-
     edge polygon top.
   - `longCurtain` no longer reads as a nun's wimple — the centre
     parting gap is preserved (paired with item 2 from
     `tasks/nick-eye-plumbing-and-hull-cleanups.md`, the centreU
     fix), AND the side curtains drape as two distinguishable
     masses rather than one trapezoid silhouette.
   - `shortBob` (flat regression guard) unchanged — flat mode
     bypasses the hull merge entirely.
4. **Lloyd reviews this PR** before merge. This is a significant
   architectural addition (a new merger mode, alpha-tuning
   heuristic, sign-flippable behaviour); not the size of an
   inline TL sign-off. Lloyd's verdict drives merge.
5. **Determinism preserved.** Same seed in convex mode → same
   render as before. Same seed in alpha mode → same render every
   time (alpha tuning is deterministic from input geometry, not
   `rng`-driven).

Soft asks:

- Comment the alpha heuristic (why this constant, what it tunes
  for). Lloyd will want to argue the heuristic at review.
- Render a side-by-side sheet of all three fixtures under both
  modes for Bob to share with Gary.

## Context

- `face-lib/research/lloyd-pass-1.md` §7 — the alpha-shape design
  spec.
- `face-lib/research/lloyd-pass-1.md` Pass 2 §4 — Lloyd's
  NEEDS-CHANGES verdict pulling alpha-shape into W2.
- `face-lib/tasks/nick-3d-clump-volume.md` Handoff §3 — what the
  current convex-hull renders look like and why they're
  unshippable.
- `face-lib/SPRINT.md` Q1-W2 ship gate row 2 — closes when this
  lands.
- `face-lib/AGENTS.md` — mixture rule (`hullMode` is a parameter,
  not a replacement).

## Notes

- **Mixture rule.** Convex hull stays as a selectable mode. Do not
  delete the convex-hull function; future tests + the W1 fixtures
  rely on it.
- **Don't tune to a target image.** `longCurtain` and `coilyHalo`
  are test fixtures, not optimization targets. Alpha-shape should
  render them HONESTLY — not "tuned until longCurtain looks like
  this specific anime character." Per AGENTS.md examples-are-not-
  targets.
- **Bundle decisions with Lloyd.** Items 2 and 3 from the bundled
  PR (`tasks/nick-eye-plumbing-and-hull-cleanups.md`) — the
  `centreU` fix and the debug-attr drop — are landing first in
  the eye-plumbing PR. This PR builds on top of them; assume
  they're in.
- **Tangent-decay exposure** (Lloyd pass-2 item 1, APPROVED-WITH-
  EDITS) is NOT in this PR. Cheap follow-up, but no caller needs
  it yet — deferred.
- **Push back if alpha-shape isn't actually fixing the artefact.**
  If after a few hours of implementation the alpha-shape render
  looks just as broken as the convex-hull one, that's a sign the
  diagnosis is wrong, not that you should keep tuning. Ask Bob
  to commission a Lloyd v1.5 design pass instead of inventing
  your own merger strategy.

## Handoff

**Landed on `vector-draw`** — two commits:

- `f8f20d1` — `render: alpha-shape merger + hullMode dispatch (Lloyd pass 2 §4)`
  - `face-lib/src/render/hull.ts`: +362 lines (~217 non-comment). Bowyer-
    Watson Delaunay → alpha-complex filter → boundary stitch → largest
    polygon by perimeter. Grid pre-dedup at `span/150` caps point density
    so the longCurtain `left` hullGroup (4508 capsules → 72k outline verts
    raw) completes in ~400ms instead of hanging. `mergeCapsulesToAlpha`
    mirrors `mergeCapsulesToHull`'s signature for drop-in dispatch + Holly
    regression independence. `convexHull2D` / `mergeCapsulesToHull`
    untouched per mixture rule. Falls back to convex on degenerate input
    (empty / collinear / disconnected α-complex).
  - `face-lib/src/model/params.ts`: +12 lines. `hullMode?: 'convex' |
    'alpha'` on `HairstyleRecipe`; default `undefined → 'convex'` keeps W1
    fixture renders unchanged.
  - `face-lib/src/render/svg.ts`: +9 lines. Dispatch reads
    `p.hair.recipe.hullMode` once at stage E, selects merger, calls.

- `18dbb68` — `hairstyles: add longCurtainAlpha + coilyHaloAlpha
  alpha-shape sibling fixtures`
  - `face-lib/src/hairstyles/longCurtainAlpha.ts` (+46) and `coilyHaloAlpha.ts`
    (+44). Same volume primitives as their convex siblings; only
    `recipe.hullMode = 'alpha'`. No `shortBobAlpha` — flat mode bypasses
    the hull merger.
  - `face-lib/src/hairstyles/index.ts`: +12 lines. Registered alongside
    the existing fixtures, outside the HS-8 catalog budget per the same
    convention used for `shortBob`/`longCurtain`/`coilyHalo`.

**LOC tally (vs Lloyd's ~80 projection):**
- Engine: ~250 LOC total (`hull.ts` +362 with comments, +217 non-comment;
  `params.ts` +12; `svg.ts` +9).
- Fixtures: ~90 LOC (44 + 46).
- **Grand total: ~340 LOC**, vs Lloyd's ~80 projection. Flagging this per
  the brief's "if you blow past 200, flag like the last refactor (which came
  in at +444 vs projected +150)". Comment density is ~40% in hull.ts —
  Lloyd asked for the heuristic to be commented + the implementation is
  doing a lot more than `convexHull2D` did (Bowyer-Watson + alpha-complex
  + boundary stitch). Non-comment-only count would be ~217 LOC for the
  alpha-shape work alone, still ~2.7× over projection. The overrun is
  honest: Lloyd's §7 said "alpha-shape with α auto-tuned from clump
  spacing — ~80 LOC" assuming a simpler boundary extraction; the
  Delaunay-based implementation we landed is more robust against the
  dense capsule clouds (4500+ per hullGroup) the actual fixtures produce.
  Worth scrutinizing at review — happy to defend or refactor.

**Decision-point #1: defaults for the three W1 fixtures.**

Went with: **leave the W1 fixtures undefined (defaults to 'convex'); add
sibling `*Alpha` fixtures.** Reasoning:

- The W1 fixtures (`shortBob` / `longCurtain` / `coilyHalo`) were Lloyd's
  diagnostic probes for the convex-hull implementation — they exist as
  regression-history records of what the v1 merger produces (hexagon,
  wimple, trapezoid). Flipping them silently to alpha loses the
  byte-identical regression-history reference and makes it harder for
  Holly to diff against PR #1's renders next sprint.
- Mixture-not-survival: both modes need to remain reachable. Sibling
  files keep both as named, addressable preset entries.
- The brief framed this as "OR flip if you and Lloyd agree alpha is the
  canonical 'honest' render" — without Lloyd in the loop I defaulted to
  the more conservative split. **Lloyd: if you want me to flip the
  originals to alpha and delete the siblings, that's one rename. Easy
  follow-up commit.**
- `shortBob` has NO Alpha sibling: flat mode bypasses the hull merger
  entirely, so an alpha-mode shortBob would be visually identical to
  itself. Per the brief's "shortBob (flat regression guard) unchanged".

**Decision-point #2: the alpha tuning constant.**

`ALPHA_FACTOR = 1.5` (Lloyd's "defensible starting guess" in §7). See the
defining comment in `hull.ts` for the calibration trail. Summary:

- 1.0×: fragments coilyHalo into per-clump islands (the inter-clump
  edges fail the α-disc test). Too tight.
- 1.5×: coilyHalo reads as a roughly-radial halo with edge texture from
  radii variance; longCurtain centre parting preserved.
- 2.5×+: alpha-shape collapses toward convex. Parting gap starts
  filling in around 3.5× (wimple comes back).

Tuned by re-rendering the three fixtures. Held at Lloyd's number because
it lands cleanly. Side-effect of the grid pre-dedup: it cleans up the NN
distribution (otherwise dominated by intra-cluster near-zero distances
from overlapping capsule outlines), so the auto-tune produces stable
alpha values across input densities.

**Subtleties for Lloyd to scrutinize:**

1. **Grid pre-dedup at `span/150` resolution before NN measurement and
   triangulation.** Necessary to keep Bowyer-Watson tractable on the
   real-data point clouds (longCurtain `left` hullGroup is 4508 capsules
   → 72k outline verts raw; after pre-dedup ~2k points; alpha-shape
   completes in ~400ms). The dedup also stabilizes the NN distribution
   so the auto-tune doesn't mismeasure α from intra-cluster noise.
   `span/150` is ≈ 1.3% of head height which is sub-pixel at our render
   resolution, so the silhouette fidelity loss is invisible. But it's a
   PERFORMANCE/CORRECTNESS coupling — if a future caller passes a tiny
   point cloud (<100 points) the pre-dedup still operates; should still
   be correct (it's idempotent on already-coarse data) but worth a
   second eye.

2. **Returns the largest connected polygon by perimeter.** The α-complex
   can have multiple connected components (a stray clump becomes its
   own island). Single-fill renderer can't draw holes / multi-shapes,
   so I take the largest. Per the brief this is fine — but it means
   "alpha-shape regenerates the wimple-region but loses one outlier
   clump" is a real possibility and we won't see it until it bites.
   Convex-mode falls back if the boundary is degenerate (<3 edges, or
   the largest polygon has <3 verts) — fail-safe, not silent corruption.

3. **`hullMode` lives on `HairstyleRecipe`, not on `Curve`.** Single
   recipe-level decision, read once in `svg.ts` at stage E. This means
   different hullGroups in the same hairstyle can't disagree on merger.
   Felt right (you wouldn't have alpha on 'front' but convex on 'left'
   in any real recipe) but flag if you'd rather it be per-Curve.

4. **Renderer falls back to convex on degenerate alpha-shape input.**
   If `medianNearestNeighbour` returns 0 (all points coincident) or the
   α-complex is empty/disconnected with <3 boundary edges, we call
   `convexHull2D` as fallback. The fallback is silent — no warning. If
   Holly wants regression visibility, the right hook is an optional
   debug callback; not in this PR.

5. **Default for `timmFlat` and other future shipped styles**: per the
   brief, irrelevant for `timmFlat` (it runs `clumpMode: 'flat'` — no
   merger fires). For future volume-mode shipped styles (W3 TWA/coily):
   they should set `hullMode: 'alpha'` explicitly to opt in. The
   default remains `'convex'` so a forgotten `hullMode` line doesn't
   silently change a shipped render's silhouette.

**Catalog regression check (the mixture-rule guard):**

- 30 hairstyles × 2 presentations = 30 SVGs in the original 15-hairstyle
  catalog. **30/30 byte-identical** vs the pre-change baseline. The
  default `hullMode = undefined → 'convex'` path is the same code as
  before (literally the same `mergeCapsulesToHull` function, gated by
  the same `if (recipe.hullMode === 'alpha')` dispatch). Deterministic
  alpha output verified — same input twice produced identical SVG.

**Render sheet (PNG paths for Bob to share with Gary):**

Side-by-side comparison of all three fixtures × {masc, fem} × {convex,
alpha} at `/tmp/nick-w2-pr2/comparison/`:

- `feminine-shortBob-convex.png` / `feminine-shortBob-alpha.png` —
  identical (flat-mode → no merger).
- `masculine-shortBob-convex.png` / `masculine-shortBob-alpha.png` —
  identical.
- `feminine-longCurtain-convex.png` — nun's wimple (convex artefact).
- `feminine-longCurtain-alpha.png` — two distinct side curtains, centre
  parting preserved, nape gap visible. The artefact is GONE.
- `masculine-longCurtain-convex.png` / `masculine-longCurtain-alpha.png` —
  same comparison, masculine demographic.
- `feminine-coilyHalo-convex.png` — flat-edge hexagon (convex artefact).
- `feminine-coilyHalo-alpha.png` — radial halo with edge texture from
  clump radii variance. The hexagon is GONE.
- `masculine-coilyHalo-convex.png` / `masculine-coilyHalo-alpha.png` —
  same comparison, masculine demographic.

Also: full alpha-fixture renders at `/tmp/nick-w2-pr2/fixtures/*-alpha.png`,
full catalog regression renders at `/tmp/nick-w2-pr2/post-impl/`,
full 103-image gallery at `/tmp/nick-w2-pr2/gallery-check/`.

**Push-back-if-not-fixing-it check:** alpha-shape unambiguously fixes
both flagged artefacts (hexagon halo + nun's wimple) on the first tuning
pass with Lloyd's recommended ALPHA_FACTOR. Did not have to keep tuning;
diagnosis was right; landing.

## Lloyd review (Pass 3 — research/lloyd-pass-1.md)

- **1. LOC overrun (~340 vs ~80)** — **APPROVED-AS-IS.** §7 number
  was naive about input scale (4500-capsule hullGroups → 72k raw verts
  was not modelled). Grid pre-dedup + Bowyer-Watson + α-complex +
  boundary stitch are each necessary at this workload; honest LOC bill
  was always ~200, not 80. Comment density at ~40% is correct.
- **2. Decision #1 (W1 defaults stay convex; sibling alpha fixtures)**
  — **APPROVED-AS-IS.** Conservative split preserves the regression-
  history baseline; mixture rule satisfied via siblings. Any W3
  volume-mode pack sets `hullMode: 'alpha'` explicitly per Nick's §5.
- **3. `ALPHA_FACTOR = 1.5` internal vs parameter** — **APPROVED-AS-IS
  for v1**, flagged to Claudia. Grid pre-dedup stabilises the NN
  distribution so the constant works across input densities. Expose
  as `recipe.hullAlpha?: number` overriding the auto-tune when a W3
  pack asks for it; not now.
- **4. Dead-code cleanup (Pass 2 §1 leftover at hull.ts:71-73,86)** —
  **NEEDS-CHANGES.** Surgical: delete the `theta/cx/cy/void` lines
  plus trim the "computed both via theta and phi" sentence. ~5 LOC
  out, no behaviour change, no re-review needed.

Net: PR ships. One trivial cleanup commit follows (Nick or Bob inline,
either is fine — this is the kind of one-line sweep PROCESS.md lists
as Bob's exception).
