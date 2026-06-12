# Head — Technical Design Spec (v5)

Supersedes v4. v5 folds in the third review round. Central principle unchanged:
**core builds structure + anchors only; feature shapes belong to styles.**
Attaches to the skeleton joints via "a joint owns a form" (`figure.mjs`). Pure
Node, no network. Orthographic camera.

---

## 0. Governing principle

Three layers, no bleed.

**CORE** — structure + anchors + the **outer outline** + occlusion. Renders as
the "burned head": structure present, every feature reduced to an **anchor**. No
feature shapes.
**STYLE** — features + interior creases + line/ink. Free rein (isolated,
swappable).
**REFERENCE STYLE** — a flagged, non-shippable stand-in so we judge a human, not
a wraith.

Scope now: CORE + one or two STYLES (one the plain reference). Prior cycles:
cycle 1 floated features on a ball (decals); cycle 2 rendered the bare
construction as the surface (a wraith) and shipped it.

## 0.5 Owner overrides (LOCKED — do not re-open without the owner)
1. **Core draws the OUTER OUTLINE only.** Interior seams/creases are style's job.
2. **Seating-overlap is a core invariant** so the merged outline never scallops.

---

## 1. CORE

### 1a. Masses (structure)
- **Cranium:** an **ovoid** — occiput bulge (back-low), flattened crown, temple
  cuts. It is a **quadric / superellipsoid-of-revolution, NOT an affine sphere**,
  so its silhouette is computed analytically as the apparent contour
  (`n·viewDir = 0`), not as a projected ellipse. (A plain sphere may ship first as
  a flagged stand-in.)
- **Brow ridge** (owned by the **cranium** joint) carrying the **keystone**
  (glabella dip) and wrapping into the temple — not a smooth bar.
- **Cheekbone** — includes BOTH the **front malar/infra-orbital plane** (the apple
  of the cheek, makes the front read as a face) AND the **zygomatic arch** sweeping
  back to the ear.
- **Nose mass.**
- **Mandible** (lower jaw), with the **chin as a landmark of the mandible**, not a
  separate sibling mass (avoids a double-counted symphysis seam).
- Mandible owned by the **jaw hinge**; all midface masses on the **cranium** joint.
- The **neck / cranium base** is owned upstream in `figure.mjs` and MUST be in the
  back/profile validation render (a head floating off the neck reads wrong behind).

### 1b. Anchors (typed mounting brackets — NO feature shape)
Frame (origin + 3 axes) + extent + owning joint. Says where/angle/size, never
what it looks like.
- **Eye:** socket frame + extent {socketR, seatDepth}, carrying **canthal tilt**
  and **brow recession depth**. Eye socket does NOT contribute a silhouette proxy
  (it's a recess; core stays featureless there).
- **Nose:** root frame + base frame + bounding plane. **Nose base contributes a
  silhouette proxy** into the union (so profile keeps the nose). No filled outline;
  projection is a style dial.
- **Ears:** stub frame with long-axis (~15° back lean) + flare, back third at hinge
  level, vertical span derived from the **crown→chin head reference** (hinge sets
  depth only, so it doesn't drift on jaw-open). **Ear stub contributes a
  silhouette proxy.**
- **Mouth:** wraps the dental barrel; modiolus corner points + barrel curvature.
  Upper-lip band owned by midface/cranium, lower-lip band by mandible — but the
  anchor is **emitted as a single resolved frame after FK** (not two independently
  posed bands the union would see as a gap when the jaw opens). Lip shape = style.

### 1c. Proportions (ratios only; single reference = crown → chin)
- Ball center at brow line; ball bottom at nose base; jaw hangs below to chin.
- eye line halfway down total head; face in equal thirds (hairline→brow→nose→
  chin); hairline halfway brow→crown.
- cranium width:height stated (~2/3 width via temple cut) so 3/4 doesn't fatten.
- eye spacing one eye-width; face ~five eyes wide.
- ear vertical span = brow→nose base (off the head reference); ear depth = back
  third at hinge.

### 1d. Outline + occlusion (OUTER OUTLINE ONLY)
- Each form's analytic silhouette + jaw cross-sections + **nose-base & ear-stub
  silhouette proxies** projected → **2D-unioned**. Vendor a named union lib (§4).
- **Outer-ring extraction:** take the outer boundary of the union's **largest
  filled component, discarding interior holes** (analytic equivalent of the old
  raster `largestComponent`; seated masses can still project to holes/extra rings
  at some yaws).
- Assert each silhouette polygon is simple **before** union AND assert the union
  **output** ring is simple; snap epsilon tied to the union lib's tolerance; if an
  assert fails, recover by re-sampling that silhouette (fallback path defined, not
  a dead end).
- **Seating-overlap invariant** (override #2).
- **Occlusion:** per-form `frontDepth` = nearest front-facing sheet, defined as
  **min over {curved sheet, cut-plane sheet}** of front-facing depth (so temple
  cuts occlude correctly in profile); null where no coverage. Base tolerance
  scaled per-form by local depth slope, **clamped at a max** (slope → ∞ at edge-on
  must not blow up). At seams prefer "visible against the form it rides on."

### 1e. Cross-contours (Vilppu) — toggleable validation guides only
Centerline + brow wrap, riding the masses. Asaro plane-breaks deferred to style.

### 1f. Validation image
Core + reference style, rendered front/3-4/side **and back/profile** (with neck);
judge "is structure sound" only here.

---

## 2. STYLE
`applyStyle(coreHead, style, seed)`: features on anchors, interior creases, ink.
Ink: simplify → resample → width → wobble; one filled polygon per stroke; wobble
freq scaled by 1/scale; seed = `hash(styleSeed, lineName, segIndex)`. Reference
style flagged non-shippable in the registry.

---

## 3. Modules + contracts
- `head/camera.mjs` — view transform (matrix/frame), not yaw/pitch. **World axis
  convention stated once and shared with `figure.mjs` FK** (X=flex/forward-back,
  Y=twist/up, Z=lateral; bones run -Y). Under ortho, **viewDir = constant world
  -Z, rotated into each form's local frame once per form** (not a per-pixel ray).
- `head/forms.mjs` — Form: `silhouette(cam)->simplePolygon`,
  `frontDepth(x,y,cam)->z|null` (nearest front-facing sheet incl. cut plane),
  `normalAt(p3)` (ellipsoid via inverse-transpose; ovoid = true quadric normal),
  `contains(p3)`. Ovoid silhouette = apparent contour (`n·viewDir=0`); projected-
  ellipse path reserved for true ellipsoids.
- `head/anchors.mjs` — typed records (core↔style contract):
  ```
  Anchor = { name, joint, frame:{o,x,y,z}, extent, silhouetteProxy?:Polygon }
  eye:   extent {socketR, seatDepth}; canthal tilt in frame; no proxy
  nose:  {rootFrame, baseFrame, boundingPlane, baseProxy}
  ear:   frame {longAxis, flare}; extent {stubR}; stubProxy
  mouth: single resolved frame post-FK; {cornerL, cornerR, barrelCurve,
          upperJoint:cranium, lowerJoint:mandible}
  Line = { name, points, sourceForm, joint }
  ```
- `head/proportions.mjs` — §1c.
- `head/outline.mjs` — silhouettes+proxies → named union lib → largest-component
  outer ring (drop holes) → DP simplify + smooth; owner-tag edges (occlusion only);
  output-simple assert + recovery.
- `head/contours.mjs` — §1e.
- `style/style.mjs`, `style/ink.mjs` — §2.
- `head/render.mjs` — orchestrate + automated checks + critic.

## 4. Decisions locked + retirement
- Orthographic final for v1.
- **Union lib:** `polygon-clipping` (Martínez–Rueda, MIT) — **commit source +
  license into the repo**; document its multipolygon/hole output and how we pick
  the largest outer ring.
- **`core.mjs` rewrite scope:** keep `Canvas`/PNG + `project`/`rotateYawPitch`.
  The additive disc-stamp `Canvas.stroke` is replaced by a single-filled-polygon
  stroke — but it has **five callers** (`figure_render`, `battle_render`,
  `voltron_render`, `render2`, `render`). Gate the new stroke behind an option
  (old additive stays default for the stick-figure renderers) OR snapshot+accept
  the visual delta on all five. Do not silently change them.
- **Retire BOTH old head paths** when the union lands: `solid.mjs` (callers
  `render2`, `voltron_render`) and `head.mjs`+`render.mjs`. State the fate of
  `check.mjs` (used by `render2`) and the `voltron` head-attach demo (migrate to
  the new head or drop) — don't leave dangling imports.

## 5. Build order (spikes first; look after each; judge back+profile)
0. **Spike A — camera/frame:** posed cranium stays a centered, symmetric circle
   across yaw=0; `|viewDir|=1`; **assert head and `figure.mjs` agree on world
   axes** (the convention bridge).
0. **Spike B — union robustness:** masses seated with overlap (no exact tangency)
   + concave section stack → single clean outer ring (largest component, holes
   dropped); **concavity check = signed turn test against a max-notch-depth
   tolerance at mass-pair seams only** (must NOT fire on the legitimate jaw-neck /
   under-chin concavities of a real head silhouette).
1. Core masses + anchors → one merged outline (burned head).
2. Reference style over anchors → judge "reads as a human / structure sound."
3. Validation cross-contours, occluded.
4. A second (non-reference) style to prove core/style separation.

## 6. Guardrails (against the two cycles)
- **Decision boundary:** feature shapes inside a STYLE PACK are mine to choose
  (isolated, discardable). CORE gets no solo shape/aesthetic calls.
- Never draw the construction as the final surface (the wraith).
- No additive offsets / magic multipliers — ratios only.
- Don't collapse a categorical shape (jaw type) into one smooth knob.
- Socket is an anchor frame, not a drawn ellipse.
- Judge every render from back/profile before calling structure sound.
- Feature shapes (later): never iterate a shape silently more than once without
  showing a render/reference and getting the call.
