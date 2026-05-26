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
- **Implementation here:** see `src/model/scaffold.ts`. Parameters in
  `src/model/params.ts` express the construction scaffold directly (cranium
  ellipsoid, side-plane inset, jaw curve, feature positions as 3D landmarks
  on the head surface).
- **Adjacent reading:** Gary Faigin *The Artist's Complete Guide to Facial
  Expression*; Mark Simon *Facial Expressions*. FACS (Ekman & Friesen) is the
  formal cataloging of muscle action units behind each emotion.
- **Why Faigin works (links to §8 below):** the expression formulas are
  shape-language in action — angular knit brows form an inverted triangle
  (threat), curved raised brows form an arc (openness). Adding shape-language
  primitives later would generalize these patterns.

## 2. Bodies / figures — next step after faces

A two-stage construction: **gesture first, then scaffold**. Skipping the
gesture stage is what makes early-attempt body drawings feel stiff.

### 2a. Gesture — the Bean / Robo-Bean (Mattesi, Vilppu, Stanchfield, Proko)

Capture the pose's weight, twist and center of gravity *before* applying
rigid structure.

- **The Bean** (Walt Stanchfield, Disney): ribcage and pelvis as two
  interlocking organic bean shapes that squash, stretch and twist against
  each other. A single sweeping **line of action** runs through both.
- **The Robo-Bean** (Vilppu, Proko): the same two beans rendered as hard
  3D rectangular boxes so the tilt of chest vs. hips becomes explicit.
- **Pedagogy:** Mattesi *Force: Dynamic Life Drawing for Animators*;
  Vilppu *Drawing Manual*; Proko's figure-drawing course.

Implementation implication: bodies should expose a `gesture` parameter (line
of action as a 3D spline + ribcage/pelvis tilts and twists) that the scaffold
inherits from. The same gesture system later applies to animals (spine
trajectory) and creatures.

### 2b. Scaffold — Three-Mass System / Mannequinization

Once the gesture is set, hang construction on top:

- **Cranial mass** — head (covered by `face-lib`).
- **Thoracic mass** — egg/cylinder for the ribcage.
- **Pelvic mass** — smaller box / sphere tilting backward.
- **Limbs** — tapered cylinders + spherical hinge joints attached to the
  shoulder and hip girdles.
- **Pedagogy:** Bridgman *Constructive Anatomy*, Hampton *Figure Drawing:
  Design and Invention*, Hogarth *Dynamic Anatomy*.

### 2c. Useful libraries

- **SMPL** — parametric mesh model with shape + pose (learned statistical
  mesh, like FLAME is for heads). Same paradigm split: scaffold-first stays
  consistent with our pipeline, SMPL is the alternate paradigm.
- **MediaPipe Pose** (Google, Python/JS) — returns 33 3D skeletal landmarks
  from an image/video. Useful for ingesting *reference* poses into our
  parametric system, not for generation itself.
- **Pinocchio** — *name disambiguation*:
  - **LAAS-CNRS Pinocchio** (C++) — rigid-body dynamics for robotics.
    Powerful but adjacent to character rigging.
  - **Baran & Popović "Pinocchio"** (SIGGRAPH 2007) — the paper/algorithm for
    automatically embedding skeletons into arbitrary character meshes. This
    is the one usually meant when "Pinocchio" comes up in character-rig
    contexts.
- **Inverse-kinematics libs** (e.g. `any-ik` for JS) — once poses need to
  resolve from end-effector constraints.

## 3. Animals — same idea, different proportions

- **Method:** Three-Mass System again — cranial / thoracic / pelvic masses on
  a spine, with species-specific proportion templates. Gesture stage applies
  too: a galloping horse has a very different line of action than a
  stalking cat.
- **Pedagogy:** Ken Hultgren *The Art of Animal Drawing*; Ellenberger
  *Atlas of Animal Anatomy for Artists*; Aaron Blaise's Disney-derived
  big-cat / wolf / bear breakdowns.
- **Implementation:** share the body engine; species are presets of mass
  proportions + spine curvature + limb counts/lengths + skull templates.

## 4. Monsters & creatures — kit-bashing real biology

- **Method: Form Follows Function / Phylogenetic Stealing.** Monsters are
  designed by combining the locomotion mechanics of real animals scaled or
  recombined. A dragon = large-lizard Three-Mass System + bat shoulder
  girdle + wings as massively elongated finger bones with webbing.
- **Pedagogy:** Terryl Whitlatch (creature designer, *Star Wars: Episode I*)
  *The Science of Creature Design*.
- **Implementation:** creatures are *composable* — a creature spec is a
  recipe of body-part templates (cranial mass = wolf, thoracic = lizard,
  limbs = bat-wing). Same parameter vocabulary as animals/bodies, just
  composed differently. This is the procedural-monster paradigm a roguelike
  needs.
- **Useful libraries:**
  - **libigl** (C++/Python, Alec Jacobson) — robust mesh-processing core.
    Strong at mesh deformation, blending, and parameterization. Useful when
    fusing creature parts (e.g. blending the geometry where a wolf head
    attaches to a humanoid torso). Zero-setup, header-only.

## 5. Vehicles / hard surfaces — Scott Robertson method

- **Method:** Build a rigid 3D bounding volume in explicit 1/2/3-point
  perspective, establish centerlines, mirror across axes using the **X-tool**
  (diagonals across a plane to find the perspective midpoint).
- **Pedagogy:** Scott Robertson & Thomas Bertling *How to Draw*; *How to
  Render*. The industrial-design canon.
- **Useful libraries:**
  - **Three.js** — math core (`Box3`, `Matrix4`, `Vector3`,
    `BufferGeometry`). Use the math, render via our own SVG/NPR pipeline.
  - **perspective-transform** (npm) — pure 2D homography (flat shape → 3D
    quad), zero deps. Good for projecting decals/templates onto faces of
    a bounding box.
- **Implementation sketch:** a `hardsurface/` module exposing
  `boundingBox(w, h, d)`, perspective grid helpers, `mirror(axis)`,
  `xToolMidpoint(plane)`. Vehicles become preset bounding-box compositions
  (chassis box, wheel cylinders, cabin box, etc.).

## 6. Everyday objects — Box-In / Primitive Subtraction

- **Method:** Treat the object as trapped inside a bounding crate, then
  add/subtract primitives. Coffee mug = box → diagonals to find top-plane
  center → ellipse → extrude downward into cylinder → handle as a small
  extruded plane from the side.
- **Pedagogy:** Drawabox curriculum (Lessons 3–5) on seeing everyday
  furniture, plants and tools as spatial intersection puzzles.
- **Useful libraries:**
  - **Three-CSG** (JavaScript) — Constructive Solid Geometry for Three.js.
    `subtract()`, `union()`, `intersect()` over standard primitives. The
    practical fit for our pipeline.
  - **OpenCascade** / **CadQuery** (Python wrapper) — full open-source B-Rep
    modeling kernel. Powerful (fillets, sweeps, real CAD ops) but
    *heavyweight* — overkill for stylized line-art generation; better
    reserved for cases where engineering-grade geometry matters.
- **Implementation sketch:** an `objects/` module with `box(w,h,d)`,
  `cylinder(...)`, `subtract(a,b)`, `extrudePlane(...)`, plus presets per
  household object class.

## 7. Architecture / buildings — perspective grid construction

- **Method:** Plot horizon + vanishing points, build the floor plan on a
  ground grid, extrude walls vertically, calculate rooftops by finding the
  perspective center of the building footprint via diagonal intersections.
- **Pedagogy:** Ernest Norling *Perspective Made Easy*; Drawabox (Lessons 6
  & 7); Scott Robertson covers this in practice as well.
- **Useful libraries:**
  - **perspective-grid** (npm) — a tiny canvas helper for 2-point
    perspective grids. `grid.init(tl, tr, br, bl); grid.getCenterAt(col, row)`.
  - **perspective-transform** (npm) — for mapping floor-plan textures into
    the perspective grid.
- **Implementation sketch:** an `architecture/` module with
  `groundPlan(footprintPolygon)`, `extrudeWalls(plan, height)`,
  `addRoof(plan, type: 'gable'|'hip'|'flat', pitch)`, and a parametric
  facade system (window grid as a property of each wall).

## 8. Nature / organic environments — flow + interlocking volumes

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
    many JS implementations, e.g. `lindenmayer` on npm).
  - **Clipper2** (C++/JS bindings) for polygon boolean ops — merging
    interlocking organic forms cleanly.
- **Implementation sketch:** a `nature/` module — `tree(species, age, season)`
  producing a recursive cylinder tree via L-system + Da Vinci branching;
  `rock(size, faceting)` producing a faceted polyhedron; `grass(density,
  patch)` producing tufted stroke sets.

## 9. Cross-cutting: shape language

This is the only entry that *isn't* constructive drawing in the strict
volumetric sense. It's worth including because it's the connective tissue
between subject geometry and *emotional read*.

- **Shape language theory** (Molly Bang, *Picture This: How Pictures Work*):
  geometric shapes carry universal psychological associations.
  - **Circles / spheres:** safety, warmth, approachability, continuity.
  - **Squares / cubes:** stability, weight, structure, stubbornness.
  - **Triangles / cones:** danger, dynamic motion, direction, threat.
- **Where it shows up in our pipeline:**
  - **Faces:** Faigin's expression formulas are shape language applied to
    the brow ridge and mouth — angular knit brows form an inverted triangle
    (threat read); arched brows form a circle segment (openness).
  - **Creature design:** circle-dominated silhouettes read as friendly;
    triangle-dominated silhouettes read as villainous. This is *deliberate*
    in Disney/Pixar villain design.
  - **Architecture:** square-dominant buildings read as institutional;
    triangle-dominant (Gothic spires) read as transcendent/threatening.
- **Useful libraries** (mostly data-driven, somewhat tangential):
  - **D3.js** — programmatic SVG generation from data; useful if mapping
    *abstract* quantities to shape choices procedurally.
  - **NetworkX** (Python) — for abstract relationship graphs before they
    become drawings.
- **Implementation hook:** expose a `silhouetteBias` parameter on creature/
  character generation (`'round' | 'square' | 'angular'`) that pulls
  proportion sliders in the corresponding direction. Gives the LLM director
  a high-level handle on emotional read.

## 10. Cross-cutting: shared machinery

Every subject above reuses the same pipeline:

1. **Parametric construction** in 3D (the subject-specific scaffold).
2. **Projection** with a shared camera (yaw/pitch + perspective for grids).
3. **NPR rendering** to SVG/PNG with shared style settings.

The cascading parameter system (`mergeParams`) generalizes to all of them.

### Reusable primitives the engine should expose

- `Vec3`, `Vec2`, `Curve` (3D polyline) — already in `src/math/` and
  `src/model/scaffold.ts`.
- `BoundingBox` — hard surface + architecture + everyday objects.
- `Cylinder(axis, radiusFn, samples)` — limbs, trees, vehicles, mugs.
- `Spline / Bezier` — universal; partially built.
- `MirrorAxis` — Scott-Robertson X-tool.
- `PerspectiveGrid` — architecture + hard surface.
- `Gesture(spineSpline, tilts)` — bodies + creatures + animals.
- `CSG` (union/subtract/intersect) — everyday objects + creature kit-bashing.

### `SceneStyle` — one shared style for all assets in a scene

A flagged risk earlier: if every asset author picks its own line weight and
jitter, a scene won't read as one drawing. Solution: a single `SceneStyle`
object (line weight, jitter amplitude + seed, color, dash pattern) that
*all* assets in a scene inherit and only override in narrow cases. The LLM
director sets the `SceneStyle` once per panel/scene; individual asset calls
inherit it unless explicitly told otherwise.

## 11. Composability — what story packs depend on

For an LLM-driven game, the value isn't any single asset — it's that
assets *combine* believably. That requires three conventions:

- **Stable parameter vocabulary:** the same parameter names mean the same
  things across asset types. `style.lineWeight` works the same on faces,
  trees and mugs.
- **Common spatial frame:** everything authored in Y-up, X-right, meters
  (or normalized units), so a person stands convincingly next to a tree
  next to a house without ad-hoc rescaling.
- **Deterministic identity:** the same (asset, parameters, seed) tuple
  always produces the same SVG — enabling caching, consistent NPCs, and
  the "Maya is the same character in every panel" invariant.

## 12. Pragmatic build order for face-lib → world-lib

`face-lib` is one specialized module in a broader **constructive-drawing
engine**. A sensible build order:

1. **Finish face** (current iteration — fix remaining visual issues).
2. **Body** (extends face directly; shares NPR pipeline, adds gesture stage
   then three-mass scaffold and limb chains).
3. **Generic primitives** module (bounding box, cylinder, spline, perspective
   grid, mirror axis, CSG ops).
4. **Everyday objects** (built on primitives + CSG).
5. **Architecture** (built on perspective grid + bounding box).
6. **Vehicles** (built on bounding box + cylinder + mirror axis).
7. **Nature** (L-system trees, faceted rocks, grass tufts).
8. **Animals** (body engine + species presets).
9. **Creatures** (animals + composition + shape-language bias).
10. **Scene composer** (places assets together with a shared `SceneStyle`).

After that, the engine + LLM director become genuinely capable of populating
a full scene from a description — a NPC in a house in a forest with a cart
outside — all rendered deterministically as fast NPR line art.

## 13. Library shortlist (open-source, code-only, dependable)

- **Three.js** — math core (Box3, Matrix4, Vector3, BufferGeometry).
- **Three-CSG** — CSG ops on Three.js primitives for everyday objects.
- **perspective-transform** — pure 2D homography, zero deps.
- **perspective-grid** — 2-point perspective grid helper.
- **L-system libs** — many in JS (`lindenmayer` npm) for trees.
- **Clipper2** (C++/JS) — polygon boolean ops for organic merging.
- **libigl** — mesh deformation/blending for creature kit-bashing.
- **MediaPipe Pose** — reference-pose ingestion (not generation).
- **Baran & Popović Pinocchio** — automatic skeleton embedding in meshes
  (the one to look up, not the LAAS-CNRS robotics library).
- **@resvg/resvg-js** — already used here for SVG → PNG rasterization.
- **OpenCascade / CadQuery** — heavyweight CAD-grade modeling; defer unless
  engineering-grade geometry becomes a requirement.

## 14. Open questions worth deciding before scaling out

- Do we keep the renderer purely SVG, or add a Canvas/WebGL path for
  runtime performance in games?
- Single shared `SceneStyle` per scene (recommended) — but how far do
  per-asset overrides go before it stops feeling like one drawing?
- LLM tool surface granularity: one tool per subject domain
  (`generate_face`, `generate_tree`, `generate_house`) or one
  `generate_scene` that composes them?
- 3D occlusion strategy: stick with z-sort painter's order, or eventually
  add proper hidden-line removal? Required for clean 3/4-view rendering
  (current `face-lib` shows double-silhouette artifacts when yawed).
- Asset versioning: do parameters guarantee stability across engine
  versions, so existing story packs keep rendering identically?

---

*Sources for sections 1-9: art-pedagogy classics (Loomis, Bridgman, Hampton,
Vilppu, Mattesi, Stanchfield, Hultgren, Ellenberger, Hamm, Whitlatch,
Robertson, Norling, Bang) plus the libraries the user collected and
verified. Where I'm less certain (Pinocchio disambiguation,
weight-vs-popularity of Drawabox lessons), the text says so.*
