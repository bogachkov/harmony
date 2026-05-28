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
