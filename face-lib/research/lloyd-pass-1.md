# Lloyd pass 1 — 3D clump-volume architecture

*First Lloyd spawn. Designs the refactor seam at `clumpStroke()` per Leo
pass 8 §1 + §11.5. Mixture-not-survival rule applies: add a mode, do
not rewrite the primitive.*

## 0. Opinion — where I diverge from Leo

Two amendments before Nick implements:

1. **`clumpStroke()` stays one function returning 3D data.** Leo's
   "split into trace + project" inverts the layering — the projector
   already exists in `project.ts` and consumes `Vec3[]`. Keep that
   boundary; projection happens where it always did.
2. **Volume rides on `Curve`, not on `clumpStroke()`'s caller.** A
   `Curve` paired with `radiusProfile?: number[]` carries volume
   through projection transparently. Hull merge runs over `Projected`.

The render boundary `Curve → Projected → SVG` is the only abstraction
with multiple consumers. Don't move it.

## 1. Type design

```ts
// hair-field.ts
export type ClumpSample = { p: Vec3; r: number };   // point + radius
export type ClumpTrace = ClumpSample[];

export type ClumpSpec = {
  rootUV: UV;            // scalp anchor (same as today's startUV)
  length: number;        // world-space arc length (replaces UV-length)
  samples: number;
  gravity: number;       // 0..1; 0 = follows field, 1 = full vertical fall
  radial: number;        // [-1..+1]; positive = coily halo, 0 = field, negative = inward fall
  radius0: number;       // root radius
  radius1: number;       // tip radius (taper)
  jitter: { amp: number; freq: number; phase: number };
  stopAt?: (s: ClumpSample) => boolean;
};

// scaffold.ts — Curve extension (additive, all optional)
export type Curve = {
  kind: 'construction' | 'feature' | 'feature-ink' | 'clump-volume';
  closed: boolean;
  points: Vec3[];
  radiusProfile?: number[];   // per-point world-space radius; same length as points
  hullGroup?: string;         // string id; same id = same projected-hull merge
  // … existing fields unchanged …
};
```

`HairstyleRecipe` gains **one** knob (mixture rule):

```ts
clumpMode?: 'flat' | 'volume';   // default 'flat'; ligne-claire stays flat
clumpVolume?: { gravity: number; radial: number; radius: number };
```

`flowStrokes` / `tailMass` / `verticalLift` / all five silhouette knobs
**stay**. Nick's parallel pass 2 (`flowStrokes → leads`) lands first;
this design assumes the rename has merged.

## 2. Pipeline (5 stages, named)

```
recipe + scalp params
  └─▶ (A) SEED      — pick N clump roots on the scalp UV map
                      (existing logic at scaffold.ts:1267-1298 — UNCHANGED)
  └─▶ (B) TRACE     — for each root, integrate clump centreline in 3D world
                      space: dx = field.direction + gravity·(0,-1,0) + radial·n̂
                      (where n̂ = outward surface normal). Sample radius along
                      the centreline from radius0→radius1 with jitter.
                      Replaces today's surface-bound clumpStroke().
  └─▶ (C) EXPAND    — each ClumpTrace becomes a Curve with kind:'clump-volume',
                      points = centreline, radiusProfile = radii. NO hull
                      computed yet; that's the projector's job.
  └─▶ (D) PROJECT   — projectCurve walks the Vec3[] same as today; project.ts
                      gains one helper: projectVolume(curve) returns a 2D
                      capsule-chain (line + per-point disc) per centreline.
  └─▶ (E) MERGE     — group projected capsules by hullGroup; compute 2D
                      convex-hull (or alpha-shape, see §7) of the union.
                      Emit ONE filled Projected per group. The hull IS the
                      silhouette of that hair region; renders in pass 1.
  └─▶ (F) RENDER    — perfect-freehand strokes for the centrelines (existing
                      feature-ink path); fills for the merged hulls.
                      svg.ts changes: ~10 lines to handle the new kind.
```

Stage E is the only new file: `src/render/hull.ts` (~150 LOC). Stages
B/C live in `hair-field.ts`. Stage D is one helper added to
`project.ts`.

## 3. The seam — `clumpStroke()`'s new signature

```ts
export const clumpStroke = (
  field: CranialField,
  spec: ClumpSpec,
): ClumpTrace
```

That's it. **One function, one return type.** The 6-positional-arg
version dies. Callers in `scaffold.ts:1335` (clump loop) and the
flow-strokes path build a `ClumpSpec` literal. For `clumpMode: 'flat'`,
spec.gravity=0, spec.radial=0, spec.radius0=spec.radius1=0 — and the
integrator falls back to today's UV-space stepping (single branch at
the top of the integrator). Same output, bit-for-bit on flat presets.

A thin shim `clumpStrokeLegacy(field, startUV, length, samples,
surfaceOffset, stopAt): Vec3[]` lives for ONE COMMIT to ease the
diff. Delete it in the follow-up.

## 4. Deletion plan — scaffold.ts:813-1045

| Lines | What | Verdict |
|---|---|---|
| 813-822 | `templeY`, `topSil` array setup | **KEEP** — drives the optional outline stroke (pass 7 §10.4) and the hairline. |
| 823-916 | `topSil` dome generation (5 silhouette knobs) | **REFACTOR, not delete.** Five knobs survive as `outlineSilhouette()` returning an OPTIONAL curve. Becomes pass-1 outline only; no fill. (~60 LOC, down from 94.) |
| 917-957 | hairline polyline | **KEEP** — clip predicate for short hair still needs it. |
| 959-1045 | cap fill polygon + shadow region + highlight band + `drawCap` boolean | **DELETE** when `clumpMode === 'volume'`. Hull merge subsumes all three. (~85 LOC out.) For `clumpMode === 'flat'`: **KEEP AS-IS** — bob renders today rely on the cap. |
| 1264-1339 | clump loop + escape texture overlay | **REFACTOR** — same loop, `clumpStroke()` returns ClumpTrace, push as `kind:'clump-volume'` with hullGroup keyed by side (front / left / right / nape). The 14-escape-stroke primitive (CC-3) does NOT come back. |

LOC honesty check: +200 new (ClumpSpec integrator, hull merger,
projectVolume) − 85 deleted (cap/shadow/highlight when volume) +
~35 changed (clump loop adapts to ClumpSpec). **Net +150**, not Leo's
+118. The difference is `flat` mode keeping the cap path alive; that
is the mixture cost and worth it.

## 5. `clumpMode: 'flat'` — preserves existing renders

**Visually equivalent, not bit-for-bit** (signature rename is the only
deviation). Guarantee: (1) `flat` skips stages D-volume and E; hull
merger is a no-op. (2) Integrator fast-path when `gravity=0 && radial=0
&& radius0=0` uses today's UV-stepping math exactly. (3) Cap polygon
path (959-1045) runs unchanged. (4) All `src/hairstyles/*.ts` default
to flat (undefined → `'flat'`); Nick's pass 2 leaves them untouched.
Determinism: `rng` consumption order unchanged in flat mode.

## 6. Three test cases for Nick

1. **`shortBob` (flat) — regression guard.** Render before/after.
   Pixel-diff under perceptual threshold. If it changes, flat path is
   broken; revert and find the leak. *Tests the mixture promise.*
2. **`longCurtain` (volume, gravity=0.8, radial=0).** Side-curtain
   strokes draped past the chin; the hull-merge silhouette extends
   below `templeY` without a `tailMass` cheat. Compare to
   `tailMass=0.6` render — should reach the same coverage with ~60%
   fewer strokes. *Tests the "obviates escape primitives" claim.*
3. **`coilyHalo` (volume, gravity=0, radial=+0.6).** Hull projects as
   a radial halo larger than the cranium with no `edgeTextured`
   silhouette modifier active. Edge texture comes from clump RADII
   variance, not from `edgeJitter()`. *Tests the sign-flippable radial
   term — the whole reason for the refactor over hair-shell offset.*

## 7. Tech debt — one warning, honest

**2D hull merge is the brittle joint.** Convex hull collapses
concavities (a forelock that drapes around an ear; two clumps with a
visible gap between them). Alpha-shape preserves them but needs a
`hullAlpha` knob whose right value depends on stroke density.
Specifying convex hull for v1 because it ships; expect to revisit
within two sprints when curly/long renders show "merged silhouette ate
my parting gap" artefacts. Honest fix is alpha-shape with alpha
auto-tuned from clump spacing — ~80 LOC, deferrable until it bites.

---

## Executive summary (Tech Lead, 5 bullets)

- **Types:** `ClumpSpec` + `ClumpTrace` in `hair-field.ts`; `Curve`
  gains optional `radiusProfile` and `hullGroup` + new `kind:
  'clump-volume'`; `HairstyleRecipe` gains `clumpMode: 'flat' |
  'volume'` defaulting to `'flat'`. No breaking changes to existing
  hairstyle files.

- **Pipeline:** SEED (unchanged) → TRACE (new 3D integrator with
  gravity + radial terms) → EXPAND (centreline + per-point radii) →
  PROJECT (existing projector + one capsule helper) → MERGE (new
  `src/render/hull.ts`, convex-hull union per `hullGroup`) → RENDER
  (existing perfect-freehand). One new file, one helper in
  `project.ts`, ~10 lines in `svg.ts`.

- **Seam:** `clumpStroke(field, ClumpSpec): ClumpTrace`. Single
  function, one return type. Diverges from Leo's "split into trace +
  project" — I keep projection at the existing render boundary.

- **Mixture preservation:** `clumpMode: 'flat'` is the fast path:
  zero gravity, zero radial, zero radius → identical UV-stepping
  math, cap polygon path 959-1045 untouched. All existing hairstyles
  default to flat. Visually equivalent (not bit-for-bit; signature
  rename is the only deviation).

- **Tech debt:** Convex-hull merge collapses gaps and concavities.
  Will need alpha-shape within two sprints when curly/long renders
  expose merged-silhouette-eats-parting-gap. Deferrable; specifying
  convex hull for v1 to keep the diff bounded. Net LOC +150, not
  Leo's +118 — `flat` mode keeps the cap polygon alive and that's
  the mixture cost.

---

## Pass 2 — Nick implementation review

Structurally sound. Five seams (TRACE / EXPAND / PROJECT / MERGE /
RENDER) all landed where pass 1 placed them; the `clumpStroke(field,
ClumpSpec): ClumpTrace` signature is exactly what I specified; flat
fast-path is identity-preserving (bit-for-bit, exceeding my §5
visually-equivalent promise). LOC drift to +444 is honest: comment
density + the `void cx; void cy` dead-theta block in `expandCapsule`
(hull.ts:71-86) — Nick left both a `theta` derivation and the `phi`
derivation in the source. Clean that up in a follow-up, not a blocker.

The seam I most expected to leak — `flat` mode's `rng` consumption
order — did not leak. Good engineering.

### 1. Tangent-decay formula `1 − 0.8·gravity·t`

**APPROVED-WITH-EDITS.** The formula is defensible directionally (long
strokes fall straighter as gravity rises) and matches hair-theory §2 +
§5 qualitatively. It is NOT derivable from first principles without
also modelling shaft stiffness, which is out of scope for v1. The
`0.8` is a magic constant pulled from intuition; expose it as
`spec.tangentDecay?: number` (default 0.8) so a future curl-mechanics
pass can tune per regime (straight/wave/curl have different decay
rates per HT §5). Document the qualitative basis inline. Do NOT
block on a measurement pass — that's hair-theorist work for Q2.

### 2. `hullGroup` keyed by `sideRoll` bucket

**APPROVED-WITH-EDITS, escalated.** `sideRoll`-bucketing reuses an
existing per-clump scalar to key the hull and is fine AS LONG AS the
clump-seed regions remain `frontShare`-disjoint. The bug case Nick
flagged (two front clumps in different 3D regions merged into one
silhouette) is real and visible in `longCurtain`: the centre parting
gap eats. Fix is one line — derive the key from `(centreU, centreV)`
quadrant once the centre is rolled, NOT from `sideRoll`:
`hullGroup = centreU < -PI*0.10 ? 'left' : centreU > PI*0.10 ? 'right' : 'front'`.
That preserves the parting gap and costs nothing. Nape comes when Q2
back-views land. Make this change before any shipped hairstyle adopts
`clumpMode: 'volume'`.

### 3. `data-hull-group` debug attr

**NEEDS-CHANGES.** Ship-blocker, low effort. Two problems: (a) it
leaks internal `avgZ` numerics into the SVG output, and consumers
WILL come to depend on it (Hyrum's law); (b) it makes the
"identical SVG content" regression promise harder for Holly to
defend next sprint because the attribute carries floating-point
noise. Drop it. If debug overlay is wanted, gate behind
`p.style.debug === true` and emit `data-hull-group-id="${groupKey}"`
(the categorical, not the float). ~6 lines.

### 4. Convex-hull artefact — alpha-shape deferral

**NEEDS-CHANGES on the deferral, not on the hull code.** Renders are
worse than I predicted. `coilyHalo` is a hexagon; `longCurtain` reads
as a nun's wimple, not hair. Both are unshippable in their current
form. My §7 said "deferred until adoption"; I was wrong about how
bad the v1 looked. Pull alpha-shape into **Q1-W2**, NOT "deferred
until a shipped style adopts volume." Concrete argument: any W2 pack
that wants volume mode (a coily or curly pack — both on Rollo's
gap list) lands DOA without alpha-shape. Doing alpha-shape first
unblocks pack work; doing it second means W2 ships a pack that
either avoids volume mode (wastes the refactor) or ships with
hexagon-halo artefacts (Pascal floor 2/10).

Per mixture-not-survival: keep convex hull as a MODE, not delete it.
Add `hullMode?: 'convex' | 'alpha'` to `HairstyleRecipe` (default
`'convex'` for v1 hairstyles that have already opted in; alpha
becomes default when stable). Alpha-shape lands as a parameter, not
a replacement — exactly the rule that applied to `clumpMode`.

### Verdicts

- **1. Tangent decay** — APPROVED-WITH-EDITS (expose `0.8` as a
  parameter; defensible directionally, not measurement-derived).
- **2. `hullGroup` keying** — APPROVED-WITH-EDITS, escalated (key on
  `centreU` quadrant, not `sideRoll` bucket; one-line fix before any
  shipped style adopts volume).
- **3. `data-hull-group` attr** — NEEDS-CHANGES (drop or gate behind
  debug flag; replace `avgZ` float with categorical group key if
  kept).
- **4. Alpha-shape deferral** — NEEDS-CHANGES (pull into Q1-W2 as
  `hullMode: 'convex' | 'alpha'` parameter; convex stays as a mode
  per mixture rule; current artefacts are unshippable).

---

## Pass 3 — Nick alpha-shape implementation review

Both artefacts I flagged in Pass 2 §4 are gone. `coilyHalo` reads as a
roughly-radial concave halo with edge texture; `longCurtain` reads as
two side curtains with the centre parting preserved. The fix works on
the first tuning pass. Dispatch is clean (`hullMode` read once at
stage E in `svg.ts`, merger selected, called). Mixture rule honoured —
both functions live, both modes reachable.

### 1. LOC overrun — ~340 vs my ~80 projection

**APPROVED-AS-IS.** My §7 number was naive about input scale, not Nick
over-engineering. I sized "~80 LOC" against a lightweight boundary-
extraction (probably gift-wrap on the union of capsule outlines)
assuming a hundreds-of-points cloud. Real fixtures produce 4500-capsule
hullGroups → 72k raw outline verts. At that scale you need three things
my §7 didn't account for: (a) a grid pre-dedup to cap point density
(without it Bowyer-Watson chokes — Nick measured ~400ms post-dedup,
hanging without); (b) a robust Delaunay (Bowyer-Watson is the cleanest
textbook choice); (c) edge-stitching + largest-component selection
because the α-complex can fragment. Each is necessary; none is gold-
plating. Nick's ~217 non-comment LOC for that pipeline is reasonable.
The honest LOC bill on alpha-shape extraction at this input scale was
always ~200, not 80. My miss, not Nick's overrun. **Comment density at
~40% is correct** for this file — I asked for the α-heuristic to be
defended in-source and the calibration trail for `ALPHA_FACTOR` is
exactly the kind of context the next reader needs.

### 2. Decision #1 — defaults for the W1 fixtures

**APPROVED-AS-IS.** Nick's conservative call holds. My Pass 2 §4
framing of "alpha as the eventual default for new adoption" still
stands — alpha IS the canonical merger going forward. But the W1
fixtures earned their place as regression-history records of the v1
convex artefact (hexagon, wimple, trapezoid); flipping them silently
costs Holly the byte-identical baseline she'll diff against next
sprint. Sibling `*Alpha` fixtures keep BOTH modes addressable as
named presets, which is the load-bearing mixture-rule outcome. Any
W3 volume-mode pack should set `hullMode: 'alpha'` explicitly per
Nick's §5 — that puts the default-for-new-adoption decision at the
recipe site where it belongs, not in a global default flip.

### 3. `ALPHA_FACTOR = 1.5` — internal constant vs recipe parameter

**APPROVED-AS-IS for v1; flagged for Claudia.** 1.5 holds up because
of an interaction Nick spotted that I missed: the grid pre-dedup
stabilises the NN distribution so the auto-tune measures the
capsule-body scale, not intra-cluster noise. That's the property that
makes a single constant work across input densities, and it's worth
keeping the heuristic internal until a caller needs to dial it. The
analogy to my Pass 2 §1 tangent-decay exposure does NOT yet hold:
tangent-decay had a plausible per-regime caller (straight vs wave vs
curl); `ALPHA_FACTOR` does not have a caller asking for it. When a W3
pack wants a tighter halo edge or a looser drape, expose then. **Note
for Claudia:** if exposure lands, it's `recipe.hullAlpha?: number`
overriding the auto-tune — one parameter, not an architecture change.
Not a W2 ask; W3-when-bitten.

### 4. Dead-code cleanup status

**NEEDS-CHANGES — surgical.** `hull.ts:70-86` still carries the
`theta/cx/cy` derivation with `void cx; void cy;` discards I flagged
in Pass 2. This PR touched `hull.ts` heavily for alpha-shape but did
not sweep the existing dead block. Smallest fix is deleting lines
71-73 + 86 (the four `theta`/`cx`/`cy`/`void` lines) and trimming the
"computed both via theta and phi" sentence in the comment. ~5 LOC out,
no behaviour change, no further review needed.

### Cross-cutting

- **Determinism preserved** per Nick's check (30/30 byte-identical
  catalog; alpha output stable across runs). Good.
- **Convex fallback on degenerate alpha is silent.** Nick flagged
  this; I agree it's fine for v1. Holly may want a debug hook when
  she writes the regression suite — defer to her brief.
- **`hullMode` lives on recipe, not on Curve.** Right call. Per-curve
  granularity would be a YAGNI knob.

### Verdicts

- **1. LOC overrun** — APPROVED-AS-IS (my §7 projection was naive
  about input scale; Nick's implementation is honest to the workload).
- **2. Decision #1 defaults** — APPROVED-AS-IS (conservative split
  preserves regression history; mixture rule satisfied via siblings).
- **3. `ALPHA_FACTOR = 1.5`** — APPROVED-AS-IS for v1; flag to
  Claudia that exposure becomes `recipe.hullAlpha?: number` when a
  W3 pack asks for it (not now).
- **4. Dead-code cleanup** — NEEDS-CHANGES (delete `hull.ts:71-73,86`;
  ~5 LOC; trivial follow-up commit).
