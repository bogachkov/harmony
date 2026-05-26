# Research notes — constructive drawing as a programmatic system

Background reading for extending `face-lib` (heads, today) to the rest of the
visual world (bodies, objects, environments). The unifying frame is
**constructive / volumetric drawing**: build the subject in 3D from primitives
in a perspective space, then project to 2D line art (NPR rendering). Loomis is
this method applied specifically to the human head.

The sections below pair each subject domain with its art-pedagogy framework
and the open-source libraries that map cleanly onto that framework's math.

## 1. Faces / heads — `face-lib`'s current scope

- **Method:** Loomis (sphere + sliced side planes + jaw + landmark grid).
  Faigin / FACS for expression overrides on top.
- **Implementation here:** see `src/model/scaffold.ts`.
  Parameters in `src/model/params.ts` express the construction
  scaffold directly (cranium ellipsoid, side-plane inset, jaw curve, feature
  positions as 3D landmarks on the head surface).
- **Adjacent reading:** Gary Faigin *The Artist's Complete Guide to Facial
  Expression*; Mark Simon *Facial Expressions*. FACS (Ekman & Friesen) is the
  formal cataloging of muscle action units behind each emotion.

## 2. Bodies / figures — next step after faces

- **Method:** **Mannequinization** / *Three-Mass System*. Treat the body as
  three primary masses linked by the spine, with limbs as tapered cylinders
  on spherical hinge joints.
  - **Cranial mass** — head (already covered by `face-lib`).
  - **Thoracic mass** — egg/cylinder for the ribcage.
  - **Pelvic mass** — smaller box / sphere tilting backward.
- **Pedagogy:** Bridgman *Constructive Anatomy*, Hampton *Figure Drawing:
  Design and Invention*, Vilppu *Drawing Manual*, Mattesi *Force*.
- **Useful primitives:** SMPL is the FLAME equivalent for the body (parametric
  mesh model with shape + pose), but it's a learned statistical mesh rather
  than a Hampton-style construction scaffold — same paradigm split we have
  for heads (FLAME vs. our scaffold-first model). For our pipeline the
  scaffold-first path stays consistent.
- **Implementation sketch:** add a `body/` module with a parametric spine
  (centerline curve), three mass parametric solids, limb chains as tapered
  cylinders. Render via the same NPR pipeline.

## 3. Animals — same idea, different proportions

- **Method:** Three-Mass System again — cranial / thoracic / pelvic masses on
  a spine, with species-specific proportion templates.
- **Pedagogy:** Ken Hultgren *The Art of Animal Drawing*; Ellenberger
  *Atlas of Animal Anatomy for Artists*; Aaron Blaise's Disney-derived
  big-cat / wolf / bear breakdowns.
- **Implementation sketch:** share the body engine; species are presets of
  mass proportions + spine curvature + limb counts/lengths + skull templates.

## 4. Vehicles / hard surfaces — Scott Robertson method

- **Method:** Build a rigid 3D bounding volume in explicit 1/2/3-point
  perspective, establish centerlines, mirror across axes using the **X-tool**
  (diagonals across a plane to find the perspective midpoint).
- **Pedagogy:** Scott Robertson & Thomas Bertling *How to Draw*; *How to
  Render*. The industrial-design canon.
- **Useful libraries:**
  - **Three.js** — `Box3`, `Matrix4`, `Vector3`. Bounding boxes, mirror axes,
    primitives. Even if we're not using the renderer, the math core is
    a clean fit.
  - **perspective-transform** (npm) — pure 2D homography (flat shape → 3D
    quad). Good for projecting decals/templates onto faces of a bounding box.
- **Implementation sketch:** a `hardsurface/` module exposing
  `boundingBox(w, h, d)`, perspective grid helpers, `mirror(axis)`,
  `xToolMidpoint(plane)`. Vehicles become preset bounding-box compositions
  (chassis box, wheel cylinders, cabin box, etc.).

## 5. Architecture / buildings — perspective grid construction

- **Method:** Plot horizon + vanishing points, build the floor plan on a
  ground grid, extrude walls vertically, calculate rooftops by finding the
  perspective center of the building footprint via diagonal intersections.
- **Pedagogy:** Ernest Norling *Perspective Made Easy*; Drawabox (Lessons 6
  & 7, box-bounding everyday objects); Scott Robertson covers this in
  practice as well.
- **Useful libraries:**
  - **perspective-grid** (npm) — a tiny canvas helper for 2-point
    perspective grids. `grid.init(tl, tr, br, bl); grid.getCenterAt(col, row)`.
  - **perspective-transform** (npm) — for mapping floor-plan textures into
    the perspective grid.
- **Implementation sketch:** a `architecture/` module with
  `groundPlan(footprintPolygon)`, `extrudeWalls(plan, height)`,
  `addRoof(plan, type: 'gable'|'hip'|'flat', pitch)`, and a parametric
  facade system (window grid as a property of each wall).

## 6. Nature / organic environments — flow + interlocking volumes

- **Method:** Trees, rocks, terrain don't fit rigid boxes cleanly. Use
  **gesture lines** + **form intersections** + **contour wrapping**.
  - **Trees:** tapering interlocking cylinders; branches split proportionally
    (Da Vinci's branching rule: child cross-sections sum to parent).
  - **Rocks:** multi-faceted spatial planes (Asaro-head logic for irregular
    geology) to dictate lighting.
- **Pedagogy:** Jack Hamm *Drawing Scenery: Landscapes and Seascapes*; many
  Disney environment-design references.
- **Useful libraries:**
  - **L-systems** for tree branching (50-year-old formula-based generator;
    many JS implementations).
  - **Clipper2** (C++/JS bindings) for polygon boolean ops — merging
    interlocking organic forms cleanly.
- **Implementation sketch:** a `nature/` module — `tree(species, age, season)`
  producing a recursive cylinder tree via L-system + Da Vinci branching;
  `rock(size, faceting)` producing a faceted polyhedron; `grass(density,
  patch)` producing tufted stroke sets.

## 7. Cross-cutting machinery

Every subject above reuses the same pipeline:

1. **Parametric construction** in 3D (the subject-specific scaffold).
2. **Projection** with a shared camera (yaw/pitch + perspective for grids).
3. **NPR rendering** to SVG/PNG with shared style settings (line weight,
   jitter, color).

The cascading parameter system (`mergeParams`) generalizes to all of them:
a story pack defines presets (a specific NPC's body, a specific cave's rocks),
an LLM director picks/composes, the renderer is the same.

### Reusable primitives the engine should expose

- `Vec3`, `Vec2`, `Curve` (3D polyline) — already in `src/math/` and
  `src/model/scaffold.ts`.
- `BoundingBox` — for hard surface + architecture.
- `Cylinder(axis, radiusFn, samples)` — needed for limbs, trees, vehicles.
- `Spline / Bezier` — needed everywhere; partially built (jaw curve etc.).
- `MirrorAxis` — Scott-Robertson X-tool.
- `PerspectiveGrid` — architecture + hard surface.
- A shared `Style` (line weight, jitter, color, dash) applied at render time.

## 8. Pragmatic build order for face-lib → world-lib

The implication of the above is that *face-lib* is one specialized module
in a broader **constructive-drawing engine**. A sensible build order:

1. **Finish face** (current iteration — fix remaining visual issues).
2. **Body** (extends face directly; shares NPR pipeline, adds three-mass
   scaffold and limb chains).
3. **Generic primitives** module (bounding box, cylinder, spline, perspective
   grid, mirror axis).
4. **Architecture** (built on perspective grid + bounding box).
5. **Vehicles** (built on bounding box + cylinder + mirror axis).
6. **Nature** (L-system trees, faceted rocks, grass tufts).
7. **Animals** (body engine + species presets).

After that, the engine + LLM director become genuinely capable of populating
a full scene from a description — a NPC in a house in a forest with a cart
outside — all rendered deterministically as fast NPR line art.

## 9. Library shortlist (open-source, code-only, dependable)

- **Three.js** — math core (Box3, Matrix4, Vector3, BufferGeometry). Use
  the math, render via our own SVG/NPR pipeline.
- **perspective-transform** — pure 2D homography, zero deps.
- **perspective-grid** — 2-point perspective grid helper.
- **Trimesh** (Python) — bounding-box / hull extraction if we ever need
  to import existing 3D meshes (e.g. to derive a mannequin from a scanned
  body).
- **Clipper2** (C++/JS) — polygon boolean ops for organic merging.
- **L-system implementations** — many in JS (`lindenmayer` npm).
- **@resvg/resvg-js** — already used here for SVG → PNG rasterization.
- **IK libraries** (e.g. `any-ik` for JS) — once we want posed bodies.

## 10. Open questions worth deciding before scaling out

- Do we keep the renderer purely SVG, or add a Canvas/WebGL path for
  runtime performance in games?
- Single shared style per scene, or per-object style mixing? (Style
  consistency was a flagged risk in the earlier architecture discussion.)
- LLM tool surface granularity: one tool per subject domain
  (`generate_face`, `generate_tree`, `generate_house`) or one
  `generate_scene` that composes them?
- 3D occlusion strategy: stick with z-sort painter's order, or eventually
  add proper hidden-line removal?

---

*Sources for sections 1-6 are art-pedagogy classics + the references the
user collected (Robertson, Norling, Drawabox, Hultgren, Ellenberger, Blaise,
Hamm). Library suggestions verified as real and active where stated.*
