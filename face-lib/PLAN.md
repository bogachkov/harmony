# PLAN — extending face-lib into a full constructive-drawing engine

This is the **implementation plan** for taking `face-lib` (faces) → a
multi-subject parametric line-art engine that can render bodies, animals,
monsters, buildings, locations and items as one coherent set. It complements
`RESEARCH.md` (pedagogy) with concrete code-level decisions: existing
libraries reviewed at source level, decisions of import / emulate /
learn-from per library, and a sketch of each engine module's parameter shape.

The discipline is the one laid out in `RESEARCH.md §0`: every primitive goes
through *need → pedagogy → existing approaches (read source) → code*.
Skipping the source-review step is the bug we are explicitly correcting.

Engine idiom across all subjects:

- A `Params` tree per subject with sub-objects per construction stage.
- `mergeParams(...)` cascades partial overrides (defaults → presets → user).
- `scaffold(params)` is a pure function that builds a 3D primitive graph.
- `project()` + `svg()` render that graph as NPR line art.
- Subjects compose by sharing primitive types, a global frame (Y-up, meters),
  and one `SceneStyle`.

---

## 1. Bodies / figures

**Pedagogy.** Two-stage Bridgman / Hampton / Vilppu construction: line-of-
action and "Bean" (Stanchfield) gesture first, then the three-mass scaffold
(cranial / thoracic / pelvic) with tapered cylinder limbs and spherical
joints. Sources: Bridgman *Constructive Anatomy*; Hampton *Figure Drawing:
Design and Invention*; Mattesi *Force*.

**Existing implementations (source-read).**

- **SMPL-X** (`vchoutas/smplx`, Python). 10,475-vertex parametric mesh, 54
  joints including face/hands. License: research-only, non-commercial; model
  checkpoint not redistributable. Disqualified for an MPL-2.0 product.
- **DavidBoja/SMPL-Anthropometry** (Python, MIT, ~300★, actively
  maintained). Exposes `MeasureBody(model_type)` with
  `from_body_model(gender, shape)` / `from_verts(verts)` and a `measure(...)`
  method producing 16 anthropometric measurements (chest, waist, hip, bicep,
  thigh, shoulder breadth, arm length, leg height, overall height, in cm).
  Depends on proprietary `SMPL_*.pkl` files.
- **MediaPipe Pose Landmarker** (Apache-2.0). Returns 33 landmarks per pose
  with `(x, y, z, visibility, presence)`. Useful as a *reference-pose ingest*
  path, not for generation. Apache-2.0 is MPL-2.0-compatible (file-level).
- **three-ik / fullik** (JS, MIT). Lightweight IK chain solvers. Useful later
  if posing becomes constraint-driven.

**Decisions.**

- **SMPL / SMPL-X — learn-from only** (license incompatible; mesh density is
  the wrong paradigm for line-art anyway).
- **SMPL-Anthropometry — emulate.** Adopt the *measurement names list* (16
  standard anthropometric points) as our shape-parameter vocabulary so
  `body.shape` reads as a human-meaningful slider set rather than 10
  opaque "betas".
- **MediaPipe Pose — import** as an optional ingest adapter — its
  33-landmark schema becomes our canonical `Pose` type for parsing reference
  imagery.
- **three-ik — defer** until poses need end-effector constraints.

**Proposed module: `body-lib`.**

```ts
type BodyParams = {
  gesture: {
    spine: Curve3;        // line of action: 3D Catmull-Rom through pelvis → ribcage → head root
    ribcageTilt: Vec3;    // pitch/yaw/roll of thoracic mass
    pelvicTilt: Vec3;     // pitch/yaw/roll of pelvic mass
    weightShift: number;  // -1..1, lateral COG bias
  };
  proportions: {          // SMPL-Anthropometry vocab, normalized to head_height = 1
    height: number;       // in head-heights (7.5 realistic adult, 8 idealized, 5 chibi)
    shoulderBreadth: number;
    chestCirc: number; waistCirc: number; hipCirc: number;
    armLength: number; legHeight: number;
    bicepCirc: number; thighCirc: number;
  };
  masses: {
    cranial: FaceParams;             // delegates entirely to face-lib
    thoracic: { width; height; depth; taper };
    pelvic:   { width; height; depth; taper };
  };
  limbs: {
    armPose: [Vec3, Vec3, Vec3];     // shoulder/elbow/wrist as joint angles
    legPose: [Vec3, Vec3, Vec3];
    handStyle: 'mitten' | 'sausage' | 'detailed';
  };
  style: SceneStyle;
  camera: CameraParams;
};
```

Primitives to lift into `core/`: `Curve3`, `Ellipsoid`, `Box`,
`TaperedCylinder`, `Joint`. The `cranial` slot literally embeds existing
`FaceParams`, so faces become a sub-cascade of bodies.

**Scope: large.** Highest-payoff next module.

---

## 2. Animals

**Pedagogy.** Same three-mass system, species-templated. Sources: Hultgren
*The Art of Animal Drawing*; Ellenberger *Atlas of Animal Anatomy for
Artists*.

**Existing implementations.** SMAL / SMALR (`silviazuffi/smalr`) and
`silviazuffi/smalst` are all dependent on the SMAL template mesh + chumpy +
opendr / unmaintained Python deps; effectively unrunnable today; treat as
paper-with-code. License lineage is research-only.

**Decisions.** All SMAL-family — **learn-from**. The portable insight is the
species-template-as-shape-prior pattern: per-species mean proportions + low-
rank deformation. Translate that into per-species *proportion presets*, not
learned shape spaces.

**Proposed module: `animal-lib`** (built on `body-lib`).

```ts
type AnimalParams = BodyParams & {
  species: 'wolf' | 'horse' | 'cat' | 'bird' | 'lizard' | 'fish';
  spine: {
    digitigrade: boolean;    // changes leg kinematics
    quadruped: boolean;      // 4-limb scaffold instead of 2
    tail: Curve3 | null;
  };
  skull: SpeciesSkullPreset; // muzzle length, ear shape, eye placement
};
```

Implementation: ship `presets/species/*.ts` files — each a
`DeepPartial<AnimalParams>` setting proportions, skull preset, default
gesture. The body engine becomes the engine; animals are configuration.

**Scope: medium**, after body lands.

---

## 3. Monsters / creatures

**Pedagogy.** Whitlatch *The Science of Creature Design* — form-follows-
function: monsters are real-biology kit-bashes. Dragon = large-lizard
three-mass + bat shoulder girdle + elongated finger-wing.

**Existing implementations.**

- **libigl** (MPL-2.0/GPL dual, C++/Python). Mesh deformation, blending,
  parameterization. Real fit for fusing parts at the *mesh* level. License
  is MPL-2.0-compatible, but using it would require shipping a wasm build
  and rewriting our pipeline around triangle meshes. **Learn-from.**
- **MakeHuman** community plugins for monster proportions — AGPL,
  incompatible. **Skip.**

**Decision.** Build native; the right primitive isn't mesh-CSG but
**scaffold composition**. `body-lib` already has slot-typed sub-params
(`masses.cranial`, `masses.thoracic`, `limbs.*`) — a creature is exactly a
`mergeParams` of slots taken from different species.

**Proposed module: `creature-lib`.**

```ts
type CreatureRecipe = {
  base: SpeciesPreset;                         // baseline skeleton
  parts: {                                     // override slots from other species
    cranial?: SpeciesPreset['skull'];
    forelimbs?: SpeciesPreset['limbs'];
    hindlimbs?: SpeciesPreset['limbs'];
    extras?: ('wings' | 'tentacles' | 'extraEyes' | 'horns' | 'tail')[];
  };
  silhouetteBias: 'round' | 'square' | 'angular';   // shape-language hook (RESEARCH.md §9)
  scaleBias: number;
};
```

`silhouetteBias` is a top-level multiplier that pulls every proportion knob
toward its shape-language pole (round → fuller chest, rounder chin; angular
→ sharper jaw, longer fingers). This is the "monster as composition of
real-biology parts + emotional shape bias" architecture.

**Scope: small** if `body-lib`/`animal-lib` are well-factored, otherwise
medium.

---

## 4. Buildings / architecture

**Pedagogy.** Perspective-grid construction: horizon + 1/2/3 VPs, footprint
on ground plane, vertical extrusion, roof by X-tool diagonals. Sources:
Norling *Perspective Made Easy*; Robertson *How to Draw*.

**Existing implementations (source-read).**

- **`jlouthan/perspective-transform`** (MIT, JS, zero deps). Single factory
  `PerspT(srcCorners, dstCorners) → { transform(x,y), transformInverse,
  srcPts, dstPts, coeffs, coeffsInv }`. 8-coeff homography solver. Last
  release Oct 2015 — stable but unmaintained; small enough to vendor
  (~200 LoC).
- **`dmnsgn/perspective-grid`** (MIT, JS, zero deps, TS types). Modern
  `PerspectiveGrid` class with `init`, `getQuadAt`, `getCenterAt`, plus
  `Point`, `LineEquation`, `Segment`, `MathHelper`. Drawing layer is tied
  to canvas2d, but the math helpers are headless-usable.
- **CityJSON ecosystem** — visualization/geoprocessing over a 3D city JSON
  spec, not a parametric generator. Useful as a building-schema reference
  only. EUPL-1.2 license. **Learn-from.**
- **CityEngine CGA grammars** (proprietary). The shape-grammar vocabulary
  (extrude/split/repeat/component-split) is canonical. **Learn-from**, then
  re-implement a minimal subset.

**Decisions.**

- **Vendor `perspective-transform`** (~200 LoC, MIT).
- **Import geometry helpers from `perspective-grid`** (`LineEquation.intersect`,
  `MathHelper.convergencePoint`); reimplement the drawing layer headlessly.
- **Learn-from CGA** for our facade DSL.

**Proposed module: `arch-lib`.**

```ts
type BuildingParams = {
  footprint: Vec2[];               // ground polygon, meters, Y-up world
  storyHeight: number;
  stories: number;
  roof: { kind: 'flat' | 'gable' | 'hip' | 'shed'; pitch: number; overhang: number };
  facades: {                       // per-wall override; cascades from a 'default'
    default: FacadeRule;
    overrides?: Record<number, FacadeRule>;
  };
  style: SceneStyle;
  camera: CameraParams;
};
type FacadeRule = {                // minimal CGA-style split grammar
  windowGrid: { cols: number; rowsPerStory: number };
  windowShape: 'rect' | 'arched' | 'round';
  door?: { wallIndex: number; col: number };
};
```

Primitives in `core/`: `Polygon2`, `Extrusion`, `PerspectiveGrid`,
`Homography`. Scaffold output: list of 3D quads with per-quad facade-grid
pin. Renderer projects quads, then `Homography` maps the facade grid into
each projected quad for per-window strokes.

**Scope: medium.**

---

## 5. Locations / environments

**Pedagogy.** Hamm *Drawing Scenery*; Disney environment-design school:
gesture-driven trees (Da Vinci branching rule), faceted rocks (Asaro-head
logic), flow + interlocking volumes. No single canonical text — curriculum
spread across Hamm + Disney + Drawabox lessons 6-7.

**Existing implementations.**

- **`nylki/lindenmayer`** (MIT, JS, ~200★, maintained). Supports parametric
  (object-array axioms) and context-sensitive (`A<B>C`) L-systems. Most
  mature JS L-system lib by some margin.
- **`IceCreamYou/THREE.Terrain`** (MIT, JS). Diamond-Square, Perlin, Worley
  heightmap generators + `ScatterMeshes()` for vegetation. Output is Three.js
  meshes, not directly usable in our SVG pipeline.
- **`simondevyoutube/ProceduralTerrain`** — tutorial code; useful as
  reference for quadtree LOD if we ever stream terrain. **Learn-from.**

**Decisions.**

- **Import `lindenmayer`**. Drop-in MIT dep. We own the turtle interpreter
  that consumes its output strings into our 3D primitive graph.
- **Learn-from `THREE.Terrain`**. Lift the Diamond-Square + value-noise
  generators against our own `HeightField` primitive (~150 LoC). Wrong output
  modality to import wholesale.

**Proposed module: `env-lib`.**

```ts
type TreeParams = {
  species: 'oak' | 'pine' | 'birch' | 'palm' | 'generic';
  age: number;             // 0..1
  lsystem: { axiom: string; productions: Record<string,string>; iterations: number };
  branching: { angle: number; daVinciExponent: number };   // 2.0 = exact Da Vinci
  foliage: 'none' | 'cluster' | 'silhouette';
  gesture: Curve3;         // overall trunk line of action
};
type TerrainParams = {
  algorithm: 'diamond-square' | 'perlin' | 'worley';
  size: { x: number; z: number };
  resolution: number;
  maxHeight: number;
  seed: number;
  facets: number;          // 0 = smooth, >0 = polygon-faceted for line-art
};
type RockParams = { size: Vec3; facets: number; seed: number };
```

Renderer detail: line-art terrain needs *contour curves* (selected
isolines at fixed elevations), not a shaded mesh — keep faceting low and
emit silhouette + a sparse set of crest curves.

**Scope: medium**, dominated by the terrain renderer.

---

## 6. Items / everyday objects

**Pedagogy.** Drawabox lessons 3-5 "Box-In / Primitive Subtraction": object
lives inside a bounding crate; add/subtract primitives; find ellipses by
perspective-center diagonals. The curriculum itself is the source.

**Existing implementations (source-read).**

- **`gkjohnson/three-bvh-csg`** (MIT, JS, ~900★, active). `Brush extends
  THREE.Mesh`, `Evaluator`, `Operation`, `OperationGroup`; ops `ADDITION`,
  `SUBTRACTION`, `REVERSE_SUBTRACTION`, `DIFFERENCE`, `INTERSECTION`. Author
  flags "experimental" with triangle-splitting / numerical-precision caveats.
- **CadQuery** (Apache-2.0, Python, OpenCascade kernel). Engineering-grade
  B-Rep. Heavy: OpenCascade is multi-MB native dep. Overkill for stylized
  line art.
- **`manifoldco/manifold`** (Apache-2.0, C++/JS via wasm). Modern manifold-
  mesh CSG library — more numerically robust than `three-bvh-csg`.

**Decisions.**

- **Import `three-bvh-csg`** for v1. MIT, active, JS-native. Accept the
  experimental caveat — we mostly need clean unions of axis-aligned
  primitives.
- **Earmark `manifold` as candidate-swap** if precision bites.
- **Skip CadQuery.**

**Proposed module: `item-lib`.**

```ts
type ItemParams = {
  boundingBox: { w: number; h: number; d: number };
  ops: Array<                       // declarative box-in op stack
    | { kind: 'box'; size: Vec3; pos: Vec3; rot: Vec3 }
    | { kind: 'cylinder'; axis: 'x'|'y'|'z'; radius: number; length: number; pos: Vec3 }
    | { kind: 'ellipsoid'; radii: Vec3; pos: Vec3 }
    | { kind: 'subtract'; from: number; tool: number }
    | { kind: 'union';    a: number; b: number }
  >;
  edgeStyle: 'all' | 'silhouette+creases';   // line-art mode
  style: SceneStyle; camera: CameraParams;
};
```

The op stack resolves to a `Brush` tree via `three-bvh-csg`; the renderer
extracts silhouette + crease edges (dihedral-angle threshold). Presets ship
as `presets/items/mug.ts`, `chair.ts`, `lamp.ts`.

**Scope: small** for primitives + presets, **medium** if we add a robust
crease-extraction renderer.

---

## Build-order recommendation

1. **`core/` primitives** (extract from face-lib): `Vec3`, `Curve3`, `Box`,
   `Cylinder`, `Ellipsoid`, `Polygon2`, `Homography`, `PerspectiveGrid`,
   `SceneStyle`, `CameraParams`, `Gesture`. **Small-medium.** Prerequisite.
2. **`body-lib`. Large.** Highest payoff; faces become a sub-cascade.
3. **`item-lib`. Small.** Validates CSG path early; cheap win.
4. **`arch-lib`. Medium.** Validates the perspective-grid / homography path.
5. **`env-lib`** (trees first, terrain second). **Medium.** Imports
   `lindenmayer`; reimplements terrain.
6. **`animal-lib`. Medium.** Reuses `body-lib`; payload is species presets.
7. **`creature-lib`. Small** if 1-6 went well, medium otherwise.
8. **`scene-lib`** (composer). **Medium.** Places assets in one world,
   enforces shared `SceneStyle`.

---

## Open architectural questions (decide before building bigger modules)

- **Shared `Gesture` primitive — needed now or later?** Bodies, animals,
  creatures *and* trees all want a line-of-action. If it's not in `core/`
  from day one, four modules will each invent an incompatible spine type.
  **Recommend: design in core before `body-lib` starts.**
- **3D occlusion strategy.** `RESEARCH.md §14` already flags the
  double-silhouette artifact when a face is yawed. Bodies (one limb in front
  of another) and architecture (building wing hiding another) will explode
  the same problem. Painter's z-sort suffices for solo subjects;
  multi-mass subjects need at least per-primitive depth sorting with
  backface culling, ideally true hidden-line removal.
  **Decide before `body-lib`** — retrofitting HLR later is expensive.
- **Mesh vs. scaffold for CSG.** `three-bvh-csg` needs triangle meshes; the
  rest of the engine is parametric scaffolds. Either every primitive carries
  a `toMesh()` for CSG paths only, or we build a separate scaffold-CSG that
  handles the easy boolean cases. **Recommend the former** — accept that
  the mesh path is a second internal representation.
- **`SceneStyle` ownership.** Currently `style` is per-subject (face-lib).
  With multiple subjects per scene, every call site repeats style. **Recommend
  extracting** `style` and `camera` into a `SceneContext` passed alongside
  the subject params.
- **LLM tool granularity.** One `generate_subject` tool with a discriminated-
  union param, or one tool per subject? **Lean: one tool per subject** for
  discoverability; share a `SceneContext` argument across them.
- **License hygiene.** SMPL family is research-only — *never* link or vendor.
  `lindenmayer`, `perspective-transform`, `perspective-grid`, `three-bvh-csg`,
  `THREE.Terrain` are all MIT and clean to combine with MPL-2.0. `libigl`
  is MPL-2.0/GPL dual — MPL path is fine. MediaPipe is Apache-2.0 — fine.

---

## What to do first when picking this up

The smallest concrete next step that unlocks the rest is **extract `core/`
primitives out of face-lib**. Right now, `Vec3`, `Curve`, the cubic-Bezier
helper, the perspective math etc. all live inside face-lib. Pulling them
into a `core/` module with stable types is what lets `body-lib` start
without copying code. Plan one full day for that refactor before touching
the body module.

The Gesture primitive should be designed simultaneously, since the same
spline type is needed by bodies, animals, creatures and trees.
