# Head — Technical Implementation Plan (v2, post-review)

Scope: the foundation head (exact masses → clean merged outline → planes/
contours) and the style-application engine that inks it. Attaches to the
existing skeleton joints via "a joint owns a form" (`figure.mjs`).

Environment: pure Node, no network assumed. We own Canvas + PNG + seeded RNG +
stroke rasterizer (`core.mjs`). Orthographic camera.

> v2 folds in the engineering / graphics / art peer reviews. Changes from v1 are
> marked **[rev]**.

---

## Biggest change from v1 (art review)

**The head is NOT a bald ball + wedge with planes painted on.** A sphere's
outline is a circle from every angle, so a bald head stays an egg. The masses
that make it read — and that must exist in the FOUNDATION, contributing to the
silhouette before any styling — are: **brow ridge, cheekbone, nose, chin.**
"Features last" was wrong; these four are foundation, not features. The first
honest "does it read as a head" look only happens after they exist. **[rev]**

## Second change (art review): the jaw rig is anatomically wrong

Only the **lower jaw (mandible): chin + jaw edge back to the ear** moves on the
hinge. The **midface — cheeks, nose, brow, upper lip — stays fixed to the
cranium.** So the face mass splits: an **upper-midface mass owned by the cranium
joint**, and a **lower-jaw mass owned by the jaw hinge.** Open-mouth must not
drag the nose. **[rev]**

---

## Modules

- `head/camera.mjs` — Camera as a **view transform (matrix/frame), not yaw/
  pitch**. Every form point goes `world = jointFrame · localPoint`, then
  `camera.project(world) -> {x,y,depth}`. `viewDir()` is the camera -Z inverse-
  rotated into the space the silhouette math runs in, kept unit-length. This lets
  the head ride the posed skeleton, not just be viewed alone. **[rev]**
- `head/forms.mjs` — analytic primitives in local space. Interface **[rev]**:
  `silhouette(cam) -> Polygon`, `frontDepth(x,y,cam) -> z|null`,
  `normalAt(p3) -> n`, `contains(p3) -> bool`.
  - `Sphere{center,radius,cuts:[{normal,offset}]}`. Silhouette = projected circle;
    for each cut compute the projected rim ellipse AND `sign(dot(cutNormal,
    viewDir))`: replace circle-arc with ellipse-arc only when the cut faces the
    camera (3 cases: toward / away / edge-on). Same facing test feeds frontDepth. **[rev]**
  - Mass primitives for **brow, cheekbone, nose, chin** (small ellipsoids/wedges),
    each a Form contributing to the union. **[rev]**
  - Lower-jaw `Loft` (mandible only).
- `head/proportions.mjs` — Loomis ratios → landmark points. Corrected/extended:
  - head height = **ball (top 2/3) + jaw third (bottom)**; side-plane oval
    centered at the **brow line**, radius ≈ **half the ball radius**. **[rev]**
  - eye line = halfway down total head; face in equal thirds; hairline halfway
    brow→crown; nose base halfway brow→chin.
  - **eye spacing = one eye-width between the eyes**; face ~five eyes wide. **[rev]**
  - **ear** = behind the vertical centerline, spanning brow line → nose base. **[rev]**
- `head/outline.mjs` — project every form's silhouette AND **[rev] project each
  lower-jaw cross-section as its own polygon**, then **2D-union them all** into one
  ordered outer ring (this folds the jaw-rail problem into the union — no rails to
  cross). Simplify (Douglas–Peucker) + light smooth.
- `head/planes.mjs` — Asaro facets, but only the **four load-bearing breaks first**:
  the **cheekbone/temporal front-to-side turn** (most important; must align with
  the cheekbone mass), the **brow shelf**, the **nose side plane**, the
  **chin/under-jaw break**. Each edge tagged **crease (always draw)** vs
  **smooth-transition (draw only near the contour, view-gated)**. **[rev]**
- `head/contours.mjs` — Vilppu wraps. Essential two: **centerline** (must dip/rise
  over brow, nose, chin — not a flat sphere arc) and **brow/eye-line wrap**; nose
  and mouth wraps secondary. Visibility via per-point frontDepth. **[rev]**
- `style/ink.mjs` — paths + seed + knobs → hand-drawn strokes. Order **[rev]**:
  simplify → resample → variable width (geometry-driven) → smooth wobble, then
  render the stroke as **one filled polygon (single coverage pass), not additive
  disc stamps** (kills double-darkening). Wobble frequency scaled by `1/scale`
  (resolution-independent). Seed from **content identity** `hash(styleSeed,
  lineName, segIndex)`, never draw-order or camera. **[rev]**
- `style/style.mjs` — Style = knob set (lineWeight, wobble, taper, which named
  contours/plane-edges to draw, weight rules). `applyStyle(headLines, style,
  seed)`. Requires a **stable named-line contract** from contours/planes. **[rev]**
- `head/render.mjs` — orchestrate camera → union outline + masses + selected
  contours/plane-edges → ink → PNG, plus automated checks + critic.

## Merge library (R1)

**Vendor** a proven 2D boolean-union lib (e.g. `polygon-clipping`, pure JS) by
committing its source into the repo — works offline, no network install, no
re-solving a finicky problem. Mitigate degeneracies (tangent jaw rails, near-
collinear circle intersections): **snap silhouette vertices to a fine grid** and
perturb tangent contacts by epsilon into clean overlap. Postcondition: every
silhouette polygon is simple (non-self-intersecting) before union — assert it. **[rev]**

## Occlusion (graphics)

Hidden if any form's `frontDepth` at the screen point is nearer, using a **single
shared depth tolerance** across all forms. At the ball↔jaw / mass seams, prefer
"visible against the form it rides on" over a raw global max, so wrap-lines don't
wink out exactly on the cheekbone transition. **[rev]**

## Plane-edge / contour extraction (graphics)

Don't draw the full static facet graph (faceted-rock look). Draw silhouette
edges (`dot(normal,viewDir)` sign change) + creases above a dihedral threshold,
and gate smooth transitions by view. Suggestive contours optional later. **[rev]**

## Decisions to lock before coding **[rev]**

- Hand-line: **commit to our disc-stamp stroke OR vendor perfect-freehand** — do
  not branch on runtime availability. (Default: our stroke, upgraded to single-
  polygon fill.)
- Define the **named line set** (centerline, browWrap, cheekEdge, browShelf,
  noseSide, chinBreak…) as a fixed contract before writing the style engine.
- Extract reusable geometry (`JAW_LEVELS`/`jawSection`/`dp`/`smoothClosed`) into a
  shared module; **retire the z-buffer splat/trace path in the same change** that
  lands the union, so two outline systems never coexist.

## Build order (spikes first, look after each)

0. **Spike A — camera/frame:** render a posed cranium (on the skeleton frame) as a
   plain circle that stays a centered circle across yaw=0 and stays symmetric —
   proves the frame transform + viewDir. **[rev]**
0. **Spike B — union robustness:** union a tangent circle + a concave cross-section
   stack with the vendored lib; confirm clean outer ring, no self-intersection. **[rev]**
1. Sphere + lower-jaw + **brow/cheekbone/nose/chin masses** → one clean merged
   outline. First "does it read" look here (not before the masses). **[rev]**
2. Loomis landmarks shown on it (with corrected ratios, ear, eye spacing).
3. Four load-bearing Asaro breaks + centerline & brow wraps, occluded.
4. Style engine inks outline + contours; scale-independent wobble; one-pass strokes.
5. A couple archetype dial-sets to prove the engine generalizes.

## Top remaining risks

- **R1** union degeneracy — mitigated by vendor + snap + epsilon; Spike B clears it.
- **R2** folded into the union (no rails) — should be gone; Spike B confirms.
- **R3** "reads as a head" — addressed by promoting the four masses to foundation;
  judged only at step 1, never before.
- Camera-frame correctness — Spike A clears it.
- Style/outline ordering (R5) — fixed: simplify before wobble, single-pass fill.
