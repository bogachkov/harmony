# Head — Technical Design Spec (v4)

Supersedes v3.1. v4 folds in the second review round (eng/graphics/art) on top of
the owner overrides. Central principle unchanged: **core builds structure +
anchors only; feature shapes belong to styles.**

Attaches to the skeleton joints via "a joint owns a form" (`figure.mjs`). Pure
Node, no network. Orthographic camera.

---

## 0. Governing principle (read first)

Three layers, no bleed between them.

**CORE — structure + anchors only.** The skull and its construction: masses that
decide form and how it turns, the orbital sockets, the proportions, the merged
**outer outline**, and occlusion. Core renders as the "burned head": structure
present, every outward feature reduced to an **anchor** (a socket recess, a nose
root + base, an ear stub, a mouth band). No feature shapes. The instant core
decides an eye is a dot/almond or an ear is pointy, it has stolen a style
decision.

**STYLE — features + line + interior creases.** A style reads core's anchors,
draws the actual features in its vocabulary, draws any interior creases/seams,
and inks all lines. Free rein here (isolated, swappable). Parent/child style
inheritance is later.

**REFERENCE STYLE — a flagged stand-in** so we can judge a human, not a wraith.
Plain eyes/nose/ears over the anchors; marked in code as non-shippable.

**Scope now: CORE + one or two STYLES (one the plain reference).**

Two prior cycles, opposite failures: cycle 1 floated features on a smooth ball
(decals, no structure); cycle 2 built real sockets but **rendered the bare
construction as the final surface** (a skinless wraith) and shipped that anchor
stage as the face.

---

## 0.5 Owner overrides (LOCKED — do not re-open without the owner)

1. **Core draws the OUTER OUTLINE only.** Interior seams/creases — mass-pair
   intersections, plane-break lines — are NOT computed in core; they are style's
   job. (Too early; baking creases into core would confuse styles. Cheap to add
   later. At style level this returns — expected.)
2. **Seating-overlap is a core invariant.** Child masses sink into their neighbor
   with margin so the merged outline never scallops. Spike B enforces a concavity
   check.

---

## 1. CORE — what it builds

### 1a. Masses (structure that decides form)
- **Cranium:** an **ovoid** (egg), not a true sphere — it bulges at the occiput
  (back-low) and flattens at the crown; sides cut flat at the temples. (If we ship
  a plain sphere first, it's an explicit stand-in, flagged, because it reads as an
  egg from behind and throws the profile silhouette off.)
- **Brow ridge** carrying the central **keystone** (glabella dip between the
  brows) and the wrap into the **temple** — not a smooth bar.
- **Cheekbone** + the **zygomatic arch** sweeping back to the ear (separates the
  cranium side-plane above from the jaw mass below; without it the side of the
  head is a featureless ball in 3/4 and profile).
- **Nose mass**, **chin**, **mandible** (lower jaw).
- Mandible is owned by the **jaw hinge**; all midface masses stay on the
  **cranium** joint.

### 1b. Anchors (typed mounting brackets — NO feature shape)
Each anchor is a **frame** (origin + 3 axes, so "up/roll" is unambiguous) +
**extent** (size/radii or a bounding plane) + **owning joint**. A frame says
*where, what angle, what size* a feature mounts; never what it looks like.
- **Eye:** socket frame + extent, carrying **canthal tilt** (the socket axis is
  canted — bone fact) and **brow-overhang/recession depth** (how far back and
  under the brow the seat sits). Not lid/iris shape.
- **Nose:** **root (bridge) anchor + base anchor + bounding plane** only.
  Projection length/width is a style dial — core does NOT supply a filled nose
  outline (that edges into shape).
- **Ears:** stub frame with **long-axis** (top leans back ~15°) and **flare**
  angle off the skull, placed in the **back third** at the jaw-hinge level,
  spanning brow line → nose base.
- **Mouth:** the band that wraps the **dental barrel** (so lips curve in 3/4),
  giving **corner points (modiolus)** + the barrel curvature. **Split: upper-lip
  band owned by the midface/cranium, lower-lip band owned by the mandible** (or an
  open mouth drags the upper lip — cycle-1 regression). Lip thickness/curve =
  style.

### 1c. Proportions (Loomis ratios → landmarks; ratios only, no magic offsets)
Derived as ratios of the masses so one cranium dial moves every anchor for free.
Reconciled, single reference = top-of-cranium → chin:
- **Ball center at the brow line; ball bottom at the nose base; jaw (wedge) hangs
  below** to the chin. (Resolves the v3 "2/3 ball vs eyeline-half" ambiguity.)
- eye line halfway down total head; face in equal thirds (hairline→brow→nose→
  chin); hairline halfway brow→crown.
- **cranium width:height stated** (ball flattened on the sides to ~2/3 width via
  the temple cut) so 3/4 doesn't fatten.
- eye spacing = one eye-width between eyes; face ~five eyes wide.
- ear height = brow→nose base; ear depth = back third of the ball at hinge level.

### 1d. Outline + occlusion (OUTER OUTLINE ONLY — override #1)
- Each form's silhouette computed analytically, projected, then **2D-unioned**
  into one ordered outer ring (jaw sections enter as polygons — no rails). Vendor
  a union lib (commit source); snap vertices; assert each silhouette polygon is
  simple before union.
- **No interior crease / surface-pair computation in core** (override #1).
- **Seating-overlap invariant** (override #2): masses overlap so no scallop.
- Occlusion of anchor/guide lines via per-form `frontDepth` (defined as the
  **nearest front-facing sheet**; null where no coverage). Tolerance precedence:
  a single base tolerance, **scaled per-form by that form's local depth slope**;
  at seams prefer "visible against the form it rides on" (so each guide carries
  its owning form/joint).

### 1e. Cross-contours (Vilppu) — validation guides only
- Centerline + brow wrap, riding the real masses, as **toggleable validation
  guides**, not shipped lines. Asaro plane-break lines are deferred to style
  (override #1).

### 1f. Core render target (the validation image)
Core + reference style renders the head from front/3-4/side **and back/profile**;
we judge "is the structure sound" only here, never on the bare wraith.

---

## 2. STYLE — what it adds
`applyStyle(coreHead, style, seed)`: draws features on the typed anchors, draws
interior creases, inks all lines. Ink pipeline: simplify → resample → width →
wobble; each stroke is ONE filled polygon (no additive disc stamps); wobble
frequency scaled by 1/scale; seed from content identity `hash(styleSeed, lineName,
segIndex)`, never draw-order/camera. The reference style is the plainest such
style, flagged non-shippable in code (a registry flag, not just prose).

---

## 3. Modules + key contracts

- `head/camera.mjs` — view transform (matrix/frame), not yaw/pitch. One space for
  projection + depth + viewDir. `viewDir` unit-length. Normals + viewDir resolved
  into form-local space per form before any dot test.
- `head/forms.mjs` — Form interface: `silhouette(cam)->simplePolygon`,
  `frontDepth(x,y,cam)->z|null` (nearest front-facing sheet), `normalAt(p3)->n`,
  `contains(p3)->bool`.
  - **Ellipsoid silhouette = the projected ellipse** (affine image of the unit
    sphere's view-circle); **normals via inverse-transpose** of the form's scale
    (non-uniform scale ≠ rotated unit normal — gets every facing/occlusion test
    wrong otherwise).
  - Sphere/ovoid with cuts: facing test (toward/away/edge-on) gates the temple
    chord, which IS part of the outer silhouette in profile.
- `head/anchors.mjs` — typed records (the core↔style contract, no trailing "…"):
  ```
  Anchor = { name, joint, frame:{o:[x,y,z], x:[..],y:[..],z:[..]}, extent }
  eye:   extent {socketR, seatDepth}, frame carries canthal tilt
  nose:  {rootFrame, baseFrame, boundingPlane}            // no outline
  ear:   frame carries longAxis + flare; extent {stubR}
  mouth: {upperBand(joint=cranium), lowerBand(joint=mandible),
          cornerL, cornerR, barrelCurve}
  ```
  `Line = { name, points:[{x,y}], sourceForm, joint }` is the other contract item.
- `head/proportions.mjs` — §1c.
- `head/outline.mjs` — silhouettes + jaw sections → vendored 2D union → outer ring
  → DP simplify + light smooth. Owner-tag ring edges with source form (occlusion
  only). No crease extraction.
- `head/contours.mjs` — §1e validation guides.
- `style/style.mjs`, `style/ink.mjs` — §2; reference style here, flagged.
- `head/render.mjs` — orchestrate + automated checks + critic.

## 4. Decisions locked + retirement
- Orthographic final for v1 (optional depth-scale fake-perspective knob later).
- **`core.mjs` rewrite scope:** keep `Canvas`/PNG + `project`/`rotateYawPitch` as
  shared utilities; **`Canvas.stroke`'s additive disc-stamp is replaced** by the
  single-filled-polygon stroke (additive stamps double-darken). State which other
  callers depend on the old `stroke` before changing it.
- **Retire BOTH old head paths** when the union lands: `solid.mjs`
  (imported today by `render2.mjs` AND `voltron_render.mjs` — migrate or delete
  those callers, do not assume they're clean) and `head.mjs`+`render.mjs` (the
  second stale Loomis path). No two outline systems coexist.

## 5. Build order (spikes first; look after each; judge back+profile too)
0. Spike A — camera/frame: posed cranium stays a centered, symmetric circle
   across yaw=0; `|viewDir|=1`.
0. Spike B — union robustness: masses seated with overlap (no exact tangency) +
   concave section stack → clean outer ring; concavity check fails on scallop
   notches.
1. Core masses + anchors → one merged outline (burned head).
2. Reference style over anchors → judge "reads as a human / structure sound."
   Iterate STRUCTURE here, not feature shapes.
3. Validation cross-contours, occluded.
4. A second (non-reference) style to prove core/style separation holds.

## 6. Guardrails (against the two cycles)
- **Decision boundary:** feature shapes inside a STYLE PACK are mine to choose
  (isolated, discardable). CORE gets no solo shape/aesthetic calls — structure +
  anchors only.
- Never draw the construction as the final surface (the wraith).
- No additive offsets / magic multipliers — ratios only.
- Don't collapse a categorical shape (jaw type) into one smooth knob.
- Socket is an anchor frame, not a drawn ellipse — core must not imply eye shape.
- Judge every render from back/profile before calling structure sound.
- Feature shapes (later): never iterate a shape silently more than once without
  showing a render/reference and getting the call.
