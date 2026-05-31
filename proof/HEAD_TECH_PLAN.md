# Head — Technical Implementation Plan (for peer review)

Scope: the foundation head (exact masses → clean outline → planes/contours) and
the style-application engine that inks it. Features (eyes/nose/mouth) are out of
scope here. Everything attaches to the existing skeleton joints (cranium joint,
jaw hinge) via the generic "a joint owns a form" rule already in `figure.mjs`.

Environment constraints: pure Node, no network assumed (node_modules absent in
fresh clones; npm install untested here). We already own a Canvas + PNG writer +
seeded RNG + stroke rasterizer in `core.mjs`. Camera is orthographic for now.

---

## Modules (new, under proof/head/ and proof/style/)

- `head/camera.mjs` — Camera {yaw,pitch,scale,cx,cy}. `project(p3)->{x,y,depth}`,
  `viewDir()`. Orthographic. (Reuses rotateYawPitch/project from core.)
- `head/forms.mjs` — analytic primitives, each in head-local space:
  - `Sphere{center,radius,cuts:[{axis,offset}]}` with `silhouette(cam)->Polygon`
    and `frontDepth(x,y,cam)` (occlusion test).
  - `Loft{sections:[{y,profile}]}` (the jaw/face wedge) with `silhouette(cam)`
    via per-section tangent points, and `frontDepth`.
- `head/proportions.mjs` — Loomis ratios → named landmark points in head-local
  space (crown, hairline, brow/eyeLine, noseBase, chin, cheekbone, earTop,
  sidePlane). Drives form sizes so one set of numbers positions everything.
- `head/outline.mjs` — gather each form's projected silhouette polygon, run a 2D
  boolean UNION, return one ordered outer ring; simplify (Douglas–Peucker) +
  light smooth. Replaces the z-buffer for the head.
- `head/planes.mjs` — Asaro facets: named flat faces defined by landmark
  vertices, each with a normal. Produces plane-break edge segments (the ones
  that face the camera / sit on a front↔side transition).
- `head/contours.mjs` — Vilppu wrap curves (centerline, brow, nose, mouth) as 3D
  curves sampled on the form surface; visibility via `frontDepth` occlusion.
- `style/ink.mjs` — given ordered vector paths + seed + knobs, output hand-drawn
  strokes: variable width (geometry-driven weight), tapered ends, smooth seeded
  wobble along arclength. Built on our stroke rasterizer (or perfect-freehand if
  available).
- `style/style.mjs` — a Style = knob set (lineWeight, wobble, taper, which
  contours/plane-edges to draw, line-weight rules). THE style-application engine:
  `applyStyle(headLines, style, seed) -> inked drawing`.
- `head/render.mjs` — orchestrate: camera → outline + selected contours + plane
  edges → ink via style → composite to PNG, plus the automated checks + critic.

## Core data structures

- Camera: `{yaw,pitch,scale,cx,cy}`.
- Landmark map: `name -> [x,y,z]` (head-local).
- Form: object with `silhouette(cam) -> [{x,y}]` and `frontDepth(x,y,cam) -> z|null`.
- Path: `[{x,y, w?}]` ordered; `w` optional per-point weight 0..1.
- Style: plain object of knobs.

## Key algorithms / decisions

1. **Sphere silhouette (ortho):** a circle at the projected center, radius =
   sphere radius. Side cuts add projected rim ellipses that clip the circle.
   Flatten to ~128-pt polygon.
2. **Loft (wedge) silhouette:** at each cross-section (center Cₛ, radius rₛ along
   axis a), the two limb points are `Cₛ ± rₛ · normalize(viewDir × a)`. Connect
   consecutive sections into two rails + end caps → polygon.
3. **Union:** flatten all silhouettes to polygons, boolean-union into one outer
   ring. DECISION/RISK: use npm `polygon-clipping` (Martínez) if installable, else
   vendor/implement a minimal Greiner–Hormann/Martínez union (~200 lines).
4. **Occlusion of contour/plane lines:** for each 3D point, hidden if any form's
   `frontDepth` at its screen position is nearer than the point. Analytic per
   form (sphere: `sqrt(r²−s²)`; loft: section interpolation). No grid.
5. **Determinism:** mulberry32 seeded per stroke; wobble = smooth 1-D value noise
   along arclength (not per-point random).
6. **Hand-line:** reuse our disc-stamp variable-width stroke; weight driven by
   geometry (heavier in shadow/overlap, taper at ends). perfect-freehand only if
   we confirm it installs.

## Build order (render + look after each)

1. Camera + sphere silhouette → clean circle that rotates.
2. Loft silhouette + union → clean merged skull+jaw outline (kills z-buffer).
3. Loomis landmarks placed and shown on it.
4. Asaro plane edges + Vilppu contours, occluded.
5. Style engine inks outline + contours.
6. A couple archetype dial-sets to prove the engine generalizes.

## Top risks (please weigh in)

- **R1 (eng):** 2D boolean union robustness on degenerate/near-tangent cases;
  dependency availability offline. Biggest engineering risk.
- **R2 (graphics):** loft silhouette rails can pinch/cross where sections are
  sparse or the profile is concave (we saw this pinch in the proof). Needs a
  robust rails→polygon step.
- **R3 (art):** will ball + wedge + Asaro planes actually READ as a head from
  several angles, or do nose/brow need to be real masses before it reads? Risk of
  a clean but lifeless ovoid.
- **R4:** ortho vs perspective — staying ortho; acceptable for cartoon heads?
- **R5:** keeping the merged outline crisp while the style layer adds wobble —
  ordering of simplify vs ink.
