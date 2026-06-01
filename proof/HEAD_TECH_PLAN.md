# Head — Technical Design Spec (v3)

Supersedes v2. v3 adds the central principle we settled in conversation: **core
builds structure + anchors only; features belong to styles.** Everything below
serves that line.

Attaches to the existing skeleton joints via "a joint owns a form"
(`figure.mjs`). Pure Node, no network assumed. Orthographic camera.

---

## 0. The governing principle (read first)

There are three layers, and they must not bleed into each other.

**CORE — structure + anchors only.** The skull and its construction: the masses
that decide form and how it turns (cranium ball, brow ridge, cheekbone, nose
*anchor*, chin, mandible, ear *stub*), the orbital *sockets* (hollows), the
planes, the proportions, the merged outline, and occlusion. Core renders as the
"burned head": structure present, every outward feature reduced to an **anchor**
(a socket hollow, a nose root + the outline of where it sits, an ear stub, a
marker point where an eye will go). **No feature shapes.** The moment core
decides an eye is a dot/almond/circle, or an ear is pointy/round/Dragon-Ball, it
has stolen a decision that belongs to style.

Rule: *the less cartilage and skin core shapes, the better.* Core supplies
**where** and **how the surface turns**, never **what the feature looks like**.

**STYLE — features + line.** A style reads core's anchors and draws the actual
features in its own vocabulary (eye shape, ear shape, nose tip, lips), plus the
hand-line treatment. Different styles draw the same anchored head completely
differently. Parent/child style inheritance is a LATER concern — not now.

**REFERENCE STYLE — a stand-in to validate the structure.** We cannot judge
whether the bones are sound by staring at the wraith; we need to see a human. So
we build one plain reference style (plain eyes/nose/ears) laid over the anchors,
explicitly marked as a stand-in, kept separate from real styles. It exists to
test the structure, not to be the look.

**Scope now: CORE + one or two STYLES (one of them the plain reference).**

Why this matters (the two prior cycles, opposite failures):
- Cycle 1: features floated on a smooth balloon — *no structure*. Decals.
- Cycle 2: real 3D sockets/ridges/seated balls, but it **rendered the
  construction itself as the final surface** — a skinless wraith. It shipped the
  anchor-stage as the finished face. The wraith substrate was actually correct;
  the bug was drawing the bone instead of letting a style lay features on it.

---

## 0.5 Owner overrides (LOCKED — do not re-open without the owner)

Decided by the project owner after the v3 review. Future review rounds must not
re-litigate these; revisit only if the owner reopens.

1. **Core draws the OUTER OUTLINE only.** Interior seams/creases — where masses
   meet, mass-pair surface intersections, plane-break lines — are NOT computed in
   core. They are the STYLE's job. (Reviewers pushed to compute surface-pair
   intersection creases in core; owner's call: too early, and baking creases into
   core would confuse styles. May prove wrong; cheap to add later. At style level
   this question returns — expected.)
2. **Seating-overlap is a core invariant.** Child masses must sink into their
   neighbor with margin so the merged outline never scallops (the notch between
   two barely-touching bumps). Spike B enforces a concavity check.

---

## 1. CORE — what it builds

### 1a. Masses (structure that decides form)
- Cranium `Sphere{center,radius,cuts}` (side temple cuts).
- Brow ridge, cheekbone, nose anchor, chin, mandible (lower jaw) — as simple
  analytic masses (ellipsoids/wedges). These are *structure*, not features: they
  break the silhouette and set where the surface turns. Without them the head is
  an egg from every angle.
- Mandible is its own mass owned by the **jaw hinge** (only the lower jaw moves);
  midface masses stay on the **cranium** joint.

### 1b. Anchors (where features will attach — NO shape)
- **Eye:** an orbital socket (a recess) + a marker for the eyeball seat. Core
  draws, at most, the socket hollow's existence — not a lid, not an iris.
- **Nose:** the root/bridge anchor + the outline of the volume it occupies.
- **Ears:** stub attachment points (position + the small plane they sit on).
- **Mouth:** the anchor band on the mandible where lips will wrap.
Each anchor is a typed attachment surface: a point/plane + a normal + which
joint owns it. (This is the missing coordinate from cycle 1: features need a
normal and an attachment plane, not just a front-Z.)

### 1c. Proportions (Loomis ratios → landmark positions)
Derived as ratios of the masses so changing one cranium dial moves every anchor
for free — **no additive Y-offsets, no magic multipliers** (the documented
cycle-1 anti-pattern: `eyeY=(ry+chinY)/2`, `cheekY=-ry*0.35`).
- head = ball (top ~2/3) + jaw (bottom third); side-cut oval centered at brow,
  radius ≈ half ball radius.
- eye line halfway down total head; face in equal thirds (hairline→brow→nose→
  chin); hairline halfway brow→crown; nose base halfway brow→chin.
- eye spacing = one eye-width between eyes; face ~five eyes wide.
- ears behind the centerline, spanning brow line → nose base.

### 1d. Outline + occlusion (OUTER OUTLINE ONLY — override #1)
- Each form's silhouette computed analytically, projected, then **2D-unioned**
  into one ordered outer ring (jaw cross-sections enter the union as polygons —
  no rails). Vendor a proven union lib (commit its source); snap vertices,
  assert each silhouette polygon is simple before union.
- **No interior crease / surface-pair-intersection computation in core** (override
  #1 — that's style's job). The union keeps the outer ring only.
- **Seating-overlap invariant** (override #2): child masses overlap their parent
  so the merged ring has no scallop notches.
- Occlusion of anchor/guide lines via per-form `frontDepth` (nearest front-facing
  sheet) with a shared tolerance; at seams, prefer "visible against the form it
  rides on" (so the guide must carry its owning form).

### 1e. Cross-contours (Vilppu) — validation guides only
- Centerline + brow wrap (must ride the real masses — dip over brow/nose/chin),
  rendered as **toggleable validation guides**, not shipped lines.
- **Asaro plane-break lines are deferred to style** (override #1 — they are
  interior creases). Core does not draw them.

### 1f. Core render target (the validation image)
Core alone renders the "burned head": outline + masses + anchors + chosen
contours, from several angles. We judge **"is the structure sound"** here — and
only with a reference style applied (1b shows holes; a human needs the stand-in).

---

## 2. STYLE — what it adds

`applyStyle(coreHead, style, seed)`:
- reads anchors, draws features in the style's vocabulary (eye/ear/nose/lip
  shapes) onto the typed attachment surfaces;
- inks all lines (variable width, geometry-driven weight, taper, smooth seeded
  wobble). Pipeline order: simplify → resample → width → wobble; render each
  stroke as ONE filled polygon (no additive disc stamps); wobble frequency scaled
  by 1/scale; seed from content identity, never draw-order/camera.
- A **named line/anchor contract** (centerline, browWrap, eyeAnchorL/R, noseAnchor,
  earStubL/R, cheekEdge, chinBreak…) is the fixed interface between core and style.

The **reference style** is the plainest possible such style, flagged as a stand-in.

---

## 3. Modules

- `head/camera.mjs` — view transform (matrix/frame), not yaw/pitch; head rides
  the posed skeleton. project + unit `viewDir`. **One coordinate space for
  projection, depth, and viewDir; normals + viewDir resolved into form-local
  space per form before any dot test.**
- `head/forms.mjs` — Form interface: `silhouette(cam)->simplePolygon`,
  `frontDepth(x,y,cam)`, `normalAt(p3)`, `contains(p3)`. Sphere (+cuts, with
  facing test: toward/away/edge-on), ellipsoid masses (specify projected-ellipse
  silhouette), mandible loft.
- `head/anchors.mjs` — typed attachment surfaces (point/plane + normal + owning
  joint) for eye/nose/ear/mouth. Core's only "feature" output.
- `head/proportions.mjs` — Loomis ratios → landmarks (§1c).
- `head/outline.mjs` — silhouettes + jaw sections → vendored 2D union → ordered
  outer ring → DP simplify + light smooth. Owner-tag each ring edge with its
  source form (for occlusion only). No crease extraction (override #1).
- `head/planes.mjs`, `head/contours.mjs` — §1e.
- `style/style.mjs`, `style/ink.mjs` — §2. Reference style lives here, flagged.
- `head/render.mjs` — orchestrate + automated checks + critic.

## 4. Decisions locked
- Orthographic is final for v1 (optional depth-scale fake-perspective knob later).
- Hand-line: our stroke rasterizer upgraded to single-polygon fill (not runtime-
  branching on perfect-freehand).
- Retire the z-buffer splat/trace path (`solid.mjs` head bits) in the same change
  that lands the union; confirm no caller (`figure_render`, `battle_render`,
  `voltron_render`) still imports the old head before cutting.

## 5. Build order (spikes first; look after each; judge from several angles)
0. Spike A — camera/frame: posed cranium stays a centered, symmetric circle.
0. Spike B — union robustness: masses seated with overlap (no exact tangency) +
   concave section stack → clean outer ring; concavity check fails on scallop notches.
1. Core masses + anchors → one merged outline (the burned head). First "reads as a
   skull-structure" look.
2. Reference style over the anchors → judge "reads as a human / is the structure
   sound." Iterate STRUCTURE here, not feature shapes.
3. Plane breaks + cross-contours, occluded.
4. A second (non-reference) style to prove core/style separation holds.

## 6. Guardrails (against the two cycles' failures)
- **Decision boundary:** feature-shape decisions inside a STYLE PACK are mine to
  make freely — style is isolated and swappable, so a bad call is contained and
  discarded, not structural. CORE is where I must not make solo shape/aesthetic
  calls; keep it structure + anchors.
- Core never decides feature shape. If I'm choosing what an eye/ear looks like in
  core, stop.
- Never draw the construction as the final surface (the wraith). Bone guides;
  style's skin is drawn.
- No additive offsets / magic multipliers for placement — ratios only.
- Don't collapse a categorical shape (jaw type) into one smooth knob.
- Judge every render from back/profile too before calling structure sound.
- Feature shapes (later, in styles): never iterate a shape silently more than once
  without showing a render/reference and getting the call.
