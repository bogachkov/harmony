# Feature-attachment model — design (piece 2)

**Authors:** Lloyd (architecture) + Felix (graphics-math interior) + Leo (pedagogy)
**Status:** design only. Piece 3 builds this. Not a full spec for every primitive — a load-bearing seam + the first feature (eye in socket) sized honestly.
**Gates:** the cycle's piece 3. Mixture-rule guard non-negotiable: default / tintin / ligneClaire stay byte-identical.

---

## TL;DR

The decals problem is a **missing coordinate**. Every feature builder gets one `surfaceZ = frontZ(x, y)` — a scalar depth on a front-projected sphere — and stamps strokes at that depth. The face has Z but **no normal, no attachment plane, no local form-curl**. That is why eyes float, brows have no ridge, mouths don't wrap the jaw.

Fix: give the head a **light analytic substrate** that exposes a *patch* (origin + tangent frame + recess or ridge tilt) at each feature anchor. Features read the patch instead of a scalar Z. NOT a polygonal skull. NOT an SDF. Five named patches (orbit, brow ridge, mandible front, malar, nasal root) computed in closed-form trig from existing cranium + jaw params.

- **Pick:** Felix option (a), routed through a single shared `Substrate` built once per scaffold. (b) low-poly skull and (c) SDF are honest but wrong-size for input scale and line-art register (§2.1).
- **Sized:** first slice ~330 LOC; full five-patch completion ~600-700 LOC. Not 50. Not 1500.
- **First slice:** eye-in-socket on timmFlat only, behind a new `style.attachmentModel: 'flat' | 'planar'` knob. Brow / mouth / nose stay decals until the seam is proven.
- **Mixture rule holds:** default / tintin / ligneClaire ship `'flat'` → byte-identical. timmFlat opts into `'planar'`.

---

## 1. Pedagogy (Leo)

Every classical construction text says the same thing the engine is failing: **bone planes first, features attached to the plane they sit on, not to the silhouette.**

### 1.1 Sources

- **Loomis, *Drawing the Head and Hands* (1956).** §"The Ball and Plane": head = ball + side plane + jaw block; features located by thirds + eye-line at half-head. §"The Eye" p.46: *the eye sits in a hollow; the brow ridge is a shelf that casts a shadow on the upper lid.* §"The Mouth" p.52: *lips wrap a cylinder, they are not stuck on a plate; the corners turn back into the cheek.* These are the three sentences the engine fails today.
- **Bridgman, *Constructive Anatomy* (1920).** §Skull plates: the orbit is a *recessed cavity*; the supraorbital margin (brow ridge) is its upper lip and projects forward of it. The mandible is a **U-curve in plan view** — the mouth sits on its front face, so the corners pull back even in front view.
- **Vilppu, *Drawing Manual* (1997), §"Head Construction."** Asaro head ~12 planes; for line art we want 3-6. Names the **planar break above the orbit** (the L4 brow-as-plane the W4 audit needed).
- **Faigin, *Facial Expression* (1990), §"Construction."** Philtrum and mentolabial sulcus are tiny attachment forms — what makes a mouth *grow on* a face. `mouth.labiomentalShow` already exists; we just need its endpoints on a curved mandible front, not a flat plate.
- **Hampton, *Figure Drawing* (2009), §Heads.** Three construction blocks (cranium / mid-face mask / mandible) are enough for stylized work. That's our budget.

### 1.2 The five attachment patches we need

Each patch = origin + tangent frame + recess or ridge tilt.

1. **Orbital socket (eye).** Recess into the skull; eye Z sits *behind* surrounding skin Z. Loomis p.46.
2. **Brow ridge (brow + upper-lid shadow direction).** Shelf with a normal tipping forward-and-down — the direction L4 needs to render the brow as a value step instead of a smudge. Bridgman; Vilppu.
3. **Mandible front (mouth).** The lower-third front curves in X; mouth corners pull back in Z. Loomis p.52; Bridgman.
4. **Malar / zygomatic plane (cheek).** Anchor for the highlightCutout piece-1 work. Second-tier.
5. **Nasal root / glabella.** Stops the nose floating between unconnected brows. Second-tier.

First-tier (1-3) lands in piece 3. Second-tier (4-5) is a follow-on slice.

### 1.3 Construction order — the load-bearing call

**Engine builds bone planes FIRST, then dispatches features that read their patch.** This is the artist's mental order — Loomis draws the ball and side plane, then jaw, then locates the eye-line, *then* draws the eye into the socket he just built. Inverting it ("features lazily computing their own attachment") is what produced decals on a balloon.

Concretely: `buildScaffold` computes a `Substrate` up-front; `buildEye`/`buildBrow`/`buildMouth` take a patch instead of a scalar `surfaceZ`. Patch undefined → degrade to current scalar-Z behavior. That's the mixture-rule escape hatch.

---

## 2. Graphics-math interior (Felix)

### 2.1 The three options, sized

**(a) Per-feature attachment patches, layered on the decal model.** One `Substrate` struct per scaffold; each named patch is a closed-form analytic function of cranium + jaw params. Features read the patch and stay 2.5D curves. **~330-660 LOC depending on slice.** Closed-form trig, no iteration, no hull, no field. Input is *one face* — there is no scale to optimize.

**(b) Low-poly skull substrate (~30-80 triangles, Asaro-style); features query nearest-triangle normal.** ~700-1000 LOC: mesh builder + nearest-triangle lookup + per-feature wiring + projection pipeline learning to ignore mesh triangles. **Wrong-size:** the mesh is invisible — we render line art. Asaro is for shaded renderings; we want direction hints, not geometry we never look at.

**(c) SDF / level-set of head form, features modulate iso-surface.** ~1100-1500 LOC: SDF library + smooth-min/subtract ops + gradient sampling + still need 2D projection. **Wrong class:** smooth-min α tunes against feature scale; gradient at the socket lip is discontinuous. SDFs win when topology is *discovered*. Loomis already named our topology.

### 2.2 The pick

**(a).** Five reasons:

1. **Input scale is one face.** Not 4500 capsules. No scale to optimize against.
2. **Output is 2D line art.** Substrate exists to direct features; anything not directional hint is waste.
3. **Topology is named, not discovered.** Loomis enumerates the patches.
4. **Math is closed-form.** Socket = ellipsoidal recess at known (x, eyeY); ridge = normal tilt above orbit; mandible front = `jawCurve` + per-point normal.
5. **Mixture rule needs an escape hatch.** (a) makes patch an optional input. (b) and (c) make it all-or-nothing.

### 2.3 The Substrate type (Felix sketches; Lloyd owns where it lives, §3)

```
type Patch = {
  origin: Vec3;
  tangentU: Vec3;            // in-plane axis #1 (unit)
  tangentV: Vec3;            // in-plane axis #2 (unit, perpendicular)
  recess: number;            // signed depth; negative = into skull
  ridgeTilt?: Vec3;          // surface-normal direction for shelf patches
};

type Substrate = {
  orbit:         { left: Patch; right: Patch };  // recess; tangentU = eye-line
  browRidge:     { left: Patch; right: Patch };  // ridgeTilt; tangentU = brow direction
  mandibleFront: Patch;                          // origin at mouth center; tangentV bends in Z encoding the wrap
  malar:         { left: Patch; right: Patch };  // second-tier
  nasalRoot:     Patch;                          // second-tier
};
```

### 2.4 Where the geometry comes from

- **`orbit`**: origin `(±eyeAnchorX, eyeY, frontZ(...))`. tangentU along eyeline (with `head.face.facialAngle` inward tilt). `recess = -k * cranR * orbitDepth`, `orbitDepth ∈ [0,1]`, default 0, timmFlat 0.04.
- **`browRidge`**: origin at brow mid. tangentU along brow. `ridgeTilt` tips forward-and-down by `head.face.browRidgeProjection * 0.3` (param exists today, currently unused — this is the L4 unlock).
- **`mandibleFront`**: origin `(0, mouthY, frontZ(0,mouthY))`. tangentU = +X. tangentV bends in Z at the corners to encode the U-curve wrap.
- **`malar`**, **`nasalRoot`**: second-tier; stubbed for first slice.

All five derive from existing FaceParams. No new top-level params for the substrate itself — just a `style.attachmentModel` flag plus the one `orbitDepth` scalar (see §3.3).

### 2.5 Sized estimate (Felix owns — remember alpha-shape)

| Piece | LOC |
| --- | --- |
| `substrate.ts` builder (5 patches stubbed, orbit fully implemented) | ~120 |
| `Patch`/`Substrate` types + scaffold wiring | ~80 |
| `buildEye` patch branch | ~80 |
| `params.ts` + `styles.ts` knob + declare | ~30 |
| Fixture + regression | ~50 |
| **First slice total** | **~360** |
| `buildBrow` ridge-tilt branch (second slice) | ~80 |
| `buildMouth` mandible-front Z-corner-pull (second slice) | ~100 |
| Second-tier patches (malar + nasal-root + their wiring) | ~150 |
| **Full completion total** | **~690** |

Honest range: **first slice ~330-400 LOC; full ~600-700 LOC.** Felix flag: `buildMouth`'s corner-pull-back interacts with existing `cornerLift` / `upperCurve` — Z-shifts move projected XY through the camera. Expect one tuning pass. If `buildMouth` lands >120 LOC, that's the alpha-shape pattern; escalate.

---

## 3. Architectural seam (Lloyd)

### 3.1 Where it plugs in

One new file, three modified.

1. **`src/model/substrate.ts`** (new). Exports `buildSubstrate(p, geom): Substrate` + `Patch` + `Substrate` types. `SubstrateGeom` is the head measurements `buildScaffold` already computes (`cranR`, `browY`, `eyeY`, `mouthY`, ...) passed in, not recomputed — one source of truth on Loomis-thirds.
2. **`scaffold.ts:buildScaffold`**. After `frontZ` is defined (~line 2422 today), call `buildSubstrate(...)` and pass patches into the feature builders. No change to feature emission order. No change to `Scaffold` return shape.
3. **`scaffold.ts:buildEye` (+ later `buildBrow`/`buildMouth`)**. New optional `patch?: Patch`. Undefined → current behavior, exact. Defined AND `attachmentModel === 'planar'` → transform local stroke coords through patch tangent frame, apply recess to Z.
4. **`params.ts`**. Add `style.attachmentModel: 'flat' | 'planar'` (default `'flat'`). Add `'style.attachmentModel'` to `AllowedDeclarePath`.
5. **`presets/styles.ts:timmFlat`**. Set `style.attachmentModel: 'planar'`. Add the declare.

Path-naming call: **`style.attachmentModel`** (not `recipe.attachmentModel`). It sits next to `style.lineWeight` / `style.jitter` — pack-level rendering pedagogy. Adding a new top-level `params.attachment.*` block for one knob today was considered and rejected.

### 3.2 What does NOT change

- `Curve` / `Scaffold` shape unchanged. Renderer, projection, hull, all untouched.
- `composeFace` untouched. Slot-2 substrate + slot-6 late-pass already cover this knob class.
- `buildEyeDots` untouched in first slice.
- No new `Curve` kind. The substrate is never rendered.

### 3.3 API surface added (the whole delta)

```typescript
// params.ts
style: { …existing…; attachmentModel: 'flat' | 'planar'; };
export type AllowedDeclarePath = | …existing… | 'style.attachmentModel';

// scaffold.ts (re-exported)
export type Patch = { … };
export type Substrate = { … };

// substrate.ts (new)
export const buildSubstrate = (p: FaceParams, geom: SubstrateGeom): Substrate;
```

### 3.4 Mixture-rule guarantee

- Default `style.attachmentModel: 'flat'` everywhere.
- `buildSubstrate` always called (cheap trig) but output ONLY used when pack sets `'planar'`.
- Builders branch: `'flat'` or patch undefined → current code path verbatim; `'planar'` and patch defined → new path.
- **Regression target:** default / tintin / ligneClaire renders SHA-identical pre vs post piece-3. Holly's scaffold is the gate.
- Same pattern that shipped `clumpMode: 'flat' | 'volume'` in W1. Proven.

### 3.5 Interaction with the cascade-merge manifest

Clean. `'style.attachmentModel'` becomes the 15th admissible declare path; timmFlat's declares gains one entry; other packs unchanged. Future demographic / age / hairstyle layers can't clobber the pack's attachment pick — that's exactly what declares exists for.

### 3.6 Out of scope

No SDF, no mesh, no hull, no field integration. No camera changes. No new pack. No body. Substrate is head-only and never rendered.

---

## 4. Phased implementation

### 4.1 Smallest demonstration that proves the design

**Eyes attached to an orbital socket patch on timmFlat only.** Brow / mouth / nose stay decals in piece 3. Three reasons:

1. **Risk concentration.** Patch + tangent-frame + recess is one code path. Eye-only proves the *seam*. Brow and mouth then become applications of a proven seam, not co-discoveries.
2. **Most visible decal-cap symptom.** The W4 audit named the socket recess three times. If a patched eye doesn't read different from a decal eye, the whole design is wrong; we want to know that as fast as possible.
3. **Alpha-shape lesson.** Felix flag: `buildMouth` Z-corner-pull interacts non-trivially with existing knobs. Don't co-discover the seam AND the tuning at once. Land the seam first.

**Acceptance (Gary's eye is the gate):**

- timmFlat eye reads as *in a socket* — Gary stops reaching for the eraser on the eyes specifically.
- default / tintin / ligneClaire: SHA-identical renders before/after.
- `substrate.ts` exists with all 5 patches scaffolded; only `orbit.{left,right}` *used* this slice. Rest spec'd for follow-on.

### 4.2 Follow-on (not piece 3)

Once eye-in-socket lands: brow ridge (the L4 unlock the W4 audit deferred), mandible-front mouth wrap, malar plane as anchor for piece-1's highlightCutout work. Next cycle's piece — only if first slice passed Gary's eye.

### 4.3 What piece 3 cannot do

It can't prove dependable Pascal-7 across the grid. That's the cycle after — needs all five patches landed plus piece-1 ceiling-raisers wired. Piece 3 proves the *seam works* on one feature on one pack. That's the gate. Don't promise Gary more.

---

## 5. Sized estimate (Felix owns, Lloyd cosigns)

See §2.5 table. **First slice: ~330 LOC. Full completion: ~600-700 LOC.** Felix flag re-stated: if `buildMouth` lands at >120 LOC in the second slice, escalate. The alpha-shape miss was 80 LOC sized at 340 actual. We are explicitly NOT in that regime — input is one face — but the discipline of a named ceiling applies.

---

## 6. What piece 3 builds first (one-pager)

**Goal:** the eye on timmFlat reads as sitting in an orbital socket, not as a decal on a balloon. Gary stops reaching for the eraser on the eyes specifically. Other packs render byte-identical.

**Touch list (in order, ~330 LOC):**

1. **`src/model/params.ts`** — `style.attachmentModel: 'flat' | 'planar'` default `'flat'`; add `'style.attachmentModel'` to `AllowedDeclarePath`. ~20 LOC. **Lloyd.**
2. **`src/model/substrate.ts`** (new) — `Patch`, `Substrate`, `SubstrateGeom` types + `buildSubstrate` with all 5 patches scaffolded; orbit fully implemented, others return placeholder origins so types compile. ~120 LOC. **Felix writes geometry; Lloyd reviews type seam.**
3. **`src/model/scaffold.ts:buildScaffold`** — import & call `buildSubstrate` after `frontZ` is defined; pass `substrate.orbit.{left,right}` into `buildEye`. ~50 LOC. **Lloyd writes (load-bearing seam — Lloyd's hands per recalibrated mandate).**
4. **`src/model/scaffold.ts:buildEye`** — optional `patch?: Patch`; when present AND `style.attachmentModel === 'planar'`, transform local stroke coords through `patch.tangentU` / `tangentV` and apply `patch.recess` to Z; preserve scalar-Z path when patch missing or `'flat'`. ~80 LOC. **Felix writes; Lloyd reviews branch structure.**
5. **`src/presets/styles.ts:timmFlat`** — set `attachmentModel: 'planar'`; add the declare. ~10 LOC. **Nick wires.**
6. **Fixture + regression.** Render a 4-cell timmFlat sub-grid before/after. Default / tintin / ligneClaire SHA-identical. timmFlat eye visibly different. ~50 LOC. **Holly + Bob (Bob renders and shows Gary).**

**Acceptance:** Gary looks. "Eyes are in there now" → pass. "Still floats" → design wrong, re-plan. Pascal scores but doesn't gate. Gary's eye does.

**Out of scope for first slice:** brow ridge, mandible-front mouth, malar, nasal-root, any change to default/tintin/ligneClaire renders, any change to projection / hull / clump / strand work, any change to composeFace's slot order.

---

*— Lloyd + Felix + Leo, joint design, vector-draw branch, cycle piece 2.*
