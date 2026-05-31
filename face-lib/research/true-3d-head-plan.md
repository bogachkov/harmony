# True 3D head — representation, plan, honest sizing

*Author: face-lib programmer crew, vector-draw branch.
Scope: research + sized plan, NOT implementation.*

Brief: parametric Loomis head that is actually a 3D math object,
viewable from any angle; features as integral anatomy not decals;
output stays SVG line-art; same representation extends to neck →
torso → limbs. Where I cite without page-verifying I flag it.

---

## 1. Representation — pick

**SDFs, composed by smooth-min / smooth-subtract. Metaballs are a
subset.** A head is `f(p) → distance-to-surface` over all R³. Each
mass (cranium, jaw, brow ridge, nose wedge, eye socket, eyeball,
ears, neck) contributes `f_i(p)`; the head is their composition.
Surface = `{p : f(p) = 0}`. No mesh, no patch stitching, no decals.

### Against alternatives Gary hasn't ruled out

- **B-rep / NURBS** — honest contender. Loses because feature
  attachment is trim-and-stitch surgery (the brow ridge must fuse
  with the cranium, not sit on it); patch-meets-patch is its own
  geometry problem; limb attachment is the same surgery at every
  joint. SDFs compose by addition of functions.
- **Subdivision + parametric morphing** — mesh-parametric in a
  different vocabulary; needs an authored control cage.
- **CSG (hard booleans).** Subsumed by SDFs: hard min IS CSG, smooth
  min is the blend we actually want.
- **Metaballs.** A metaball is a sphere SDF through a falloff. Good
  for soft additions (jowl, SCM mound), but they don't subtract
  cleanly — and we need real subtract for the orbital socket.

### Why SDFs against the four required properties

1. True 3D, not 2D dressed — `f` defined over R³; any camera angle.
2. Features as integral anatomy — socket = `smax(f_cranium,
   -f_socket, k)`; ridge = `smin(f_cranium, f_ridge, k)`. Continuous
   surface manifold, not a decal.
3. Body extension — `f_body = smin(f_head, smin(f_neck, ...))`. Same
   math going down the figure.
4. Line-art extraction — solvable with known algorithms (§5); the
   riskiest piece, but a known research area.

Sources: Hart, *Sphere Tracing*, Visual Computer 12, 1996;
Quílez, distance-function articles (iquilezles.org — community
reference); Bridson, *Fluid Simulation for Computer Graphics* (CRC,
2008) ch.4; Blinn, *A Generalization of Algebraic Surface Drawing*
(ACM TOG 1, 1982); Loomis, *Drawing the Head and Hands* (Viking,
1956) §I.

---

## 2. The Loomis substrate as math

Distances in units of `cranium.diameter`.

### 2.1 Cranium — sphere minus two side cuts

```
f_sphere(p)  = |p − c_head| − r_head
f_planeL(p)  = (p · (−1,0,0)) − sidePlaneOffset
f_planeR(p)  = (p · (+1,0,0)) − sidePlaneOffset
f_cranium(p) = max( f_sphere, max(f_planeL, f_planeR) )
```

`max` is SDF intersection — keep what is inside ALL three half-
spaces. Knobs: `r_head`, `sidePlaneOffset`, `occipitalProjection`
(additive back blob via `smin`), `broughtForward` (forward Y-axis
rotation of cranium center before jaw composition). Planes left
infinite vertically; jaw covers below, hair above.

### 2.2 Jaw — Bridgman mandible

Separate mass attached below the cranium. Topology stays categorical
(per `leo-jaw.md`): each topology is a 3D primitive selection.

- `oval` — truncated ellipsoid with side flatten planes.
- `square` — SDF box with corners chamfered by `gonialAngle`.
- `pointed` — tapered cone-section, narrow chin.
- `pear` — ellipsoid whose widest section sits at `bellyY < gonialY`.
- `jowled` — smin two blobs at the gonial corners onto a box.
- `round` — soft ellipsoid, mental ≈ bigonial.

`f_head = smin(f_cranium, f_jaw, k_chin)`. Small k = visible Loomis
seam (construction render); large k = continuous form. Knobs
preserved verbatim from current `params.ts`: `bigonialWidth`,
`ramusHeight`, `gonialAngle`, `mentalWidth`, `mentalProtrusion`,
`jowl`.

### 2.3 Construction planes — real planes intersecting the surface

Eye-line / brow-line / hair-line / nose-line / mouth-line as
horizontal planes `{p : p.y = Y_landmark}`. The landmark grid is
extracted by intersecting each plane with the head SDF — gives a
real 3D curve drawable in any view. Currently the engine draws these
as flat horizontal lines in a front projection: that's 2D pretending.

### 2.4 Centerline

Sagittal plane `{p : p.x = 0}` intersected with the head SDF gives
the front-midline curve (glabella → nose-tip → philtrum → chin) —
the artist's first line.

### 2.5 Demographics on the substrate

Each demographic shift is a proportional change to the substrate,
not a feature swap. Child = `topology='round'`, low `bigonialWidth`,
low `ramusHeight`, high `mentalWidth`. Masc = `topology='square'`,
low `gonialAngle`, high `browRidgeProjection`. Fem = `topology='oval'`,
soft `gonialAngle`. Elder = `topology='jowled'`, high `jowl`. These
already exist in `presets/demographics.ts`; Loomis-thirds knobs
derive `eyeY / browY / noseBaseY / mouthY` from cranium + jaw, as
today.

---

## 3. Features as integral anatomy

These are parts of one math surface, not separate models.

**Eyes — socket recess + eyeball inside.**
`f_head_eye = smax(f_head, −ellipsoid(socket), k); f = min(f_head_eye,
sphere(eyeball))`. Smooth-subtract makes the lid wrap the ball; no
separate upper-lid primitive. Lid descent over iris = socket Y-extent
vs ball radius. Corner tuck falls out of ellipsoid shape. Knobs:
`spacing`, `size` (= ball radius), `openness` (= socket Y), `tilt`,
`socketDepth`, `lidThickness`.

**Brow — ridge as additive capsule, hair as surface UV strip.**
`f_ridge = capsule(browL_start, browL_end, r_ridge); f_head =
smin(f_head, f_ridge, k_ridge)`. Brow hair is a UV strip along the
capsule's parameter range; `brow.fullness > 0` adds hatch in that
strip during contour pass — no separate geometry. Knobs: length,
projection (= forward Z), `innerLift` / `outerLift` (translate
endpoints in Y), `unibrow`, hair density.

**Nose — 5-plane Loomis wedge.**
`f_nose = smin(f_keel, smin(f_alaR, smin(f_alaL, f_septum)), k); f_head
= smin(f_head, f_nose, k_attach)`. `f_keel = capsule(glabella, tip,
r_keel)`; `f_alaR/L = ellipsoid(ala_center, ala_radii)`; `f_septum =
capsule(tip, philtrum_top, r_septum)`. Attached at nasal root on the
brow-line. Five-plane structure (dorsum / two sides / base / two
alae) emerges from union as tangent regions meeting at edges — edges
become contour lines (§5). Knobs: keel length, alar width, tip
projection, septum + bridge radii.

**Mouth — slit on the mandible cylinder.**
The jaw SDF has U-curvature on its front face. `f_slit = thin capsule
(−w/2, mouthY, jawZ) → (+w/2, mouthY, jawZ)` with the capsule bending
back in Z at endpoints; `f_head = smax(f_head, −f_slit, k_lip)`.
Corner curl falls out of jaw Z-curvature for free — the "lips wrap a
cylinder" rule from `attachment-model.md` §1. `lipFullness > 0` adds
upper/lower-lip ellipsoid blobs via `smin`. Knobs: width, corner-Y,
mound sizes, philtrum depth (extra subtract above slit center),
`labiomentalShow` (Faigin sulcus hint).

**Ears — flattened C composed SDF.** Bridgman's "question mark with a
comma." `f_ear = smin(f_helix, smin(f_antihelix, smin(f_tragus,
f_lobe))) − f_concha; f_head = smin(f_head, R_tilt(f_ear),
k_attach)`. Helix = swept ellipsoid along the helix 3D path;
antihelix = capsule chain inside; concha = subtracted bowl
ellipsoid; tragus = small blob at canal front; lobe = blob below
helix bottom. Top-of-ear at brow-line, bottom at nose-base (Loomis);
tilt ~15° back via rotating `p` before evaluating `f_ear`. Knobs:
helix length, protrusion (= capsule radius), lobe drop,
`antihelixShow` / `tragusShow` (= radii, 0 hides), `conchaShow`,
`tilt`.

**Neck — cylinder + SCM mounds + trapezius wedge.** `f_neck =
capsule(jawBase, neckBase, r_cyl)`; `f_scmL/R = capsule(mastoid,
sternalNotch, r_scm)`; `f_trapL/R = wedge SDF occiput → acromion`;
`f_body = smin(f_head, smin(f_neck, smin(f_scmL, smin(f_scmR,
smin(f_trapL, f_trapR)))), k_neck)`. SCM origins at the mastoid
(behind/below ear), not the chin corner (Bridgman; `leo-audit.md`
§5). V-notch emerges naturally from the SCM capsules converging on
the sternal notch.

---

## 4. Body extension — sketch (proof, not design)

```
f_torso    = ellipsoid(ribcage) ∪ ellipsoid(pelvis)
f_shoulder = blob at acromion (deltoid)
f_arm      = capsule(shoulder, elbow) ∪ capsule(elbow, wrist)
f_leg      = capsule(hip, knee) ∪ capsule(knee, ankle)
f_figure   = smin(f_body, smin(f_torso, smin(f_shoulder_L, f_shoulder_R,
                 smin(f_arm_L, f_arm_R, smin(f_leg_L, f_leg_R)))))
```

Skeleton = tree of joint positions (parameters); each limb is a
swept SDF. Same math as the head. Implicit skinning of articulated
figures is a known technique — Vaillant et al., *Implicit Skinning*,
ACM TOG 32, 2013 (citation flagged unverified). Confirms the head
representation doesn't paint us into a corner.

---

## 5. Line-art SVG extraction

The hard part. SDF → SVG line-art that still reads as hand-drawn.

**What to extract:** (1) silhouette edges where `normal · viewDir
≈ 0` (normal = `∇f / |∇f|`, finite differences); (2) feature edges /
creases (normal-angle discontinuities at brow ridge, nose bridge, lip
seam); (3) suggestive contours (DeCarlo et al., *Suggestive Contours
for Conveying Shape*, ACM TOG 22(3), 2003) — the lines you draw on a
smooth surface (cheek-into-jaw at 3/4 view), critical for the 3D
read; (4) apparent ridges optional v2 (Judd et al., ACM TOG 26(3),
2007); (5) construction lines from plane intersections (§2.3);
(6) cel-shadow regions, `dot(normal, lightDir) = 0` boundary — same
algorithm as silhouette with a different "view" vector — drives
timmFlat hair shadow cutout + brow shadow.

**Algorithm:** ship **(A) screen-space passes** first. Sphere-trace
the SDF (Hart 1996) at ~256², producing depth + normal buffers.
Silhouette = depth/normal discontinuity. Creases = normal-angle
discontinuity above threshold. Suggestive contours = zero crossings
of radial curvature (DeCarlo, from depth-buffer second derivatives).
Trace contours (Suzuki & Abe, CVGIP 30, 1985). Resample to ~30-80
points per polyline (Douglas-Peucker, Cartographica 10, 1973).
Consider **(B) object-space silhouette** for v2 polish (analytic 3D
contour per primitive + occlusion check; smoother but a lot of code).

**Hand-drawn look:** traced polylines still feed perfect-freehand
(current `render/strokes.ts`); quality lives in the stroke pass, not
the geometry source. Risk: thousand-segment polylines preserve
pixel-step artifacts and read mechanical. Mitigate with RDP resample
to the same scale as today's 2D builders.

---

## 6. Honest size

Realistic case, LOC:

| Piece | LOC |
|---|---|
| `sdf/primitives.ts` (sphere, box, capsule, ellipsoid, cone, smin/smax/sub, rotate, translate, sweep) | ~400 |
| `sdf/substrate.ts` (cranium + 6 jaw topologies + landmark planes) | ~500 |
| `sdf/features.ts` (eye socket + ball, brow ridge, nose, mouth, ears, neck) | ~700 |
| `sdf/body.ts` (torso + shoulders + arms + legs stubs) | ~250 |
| `render/raymarch.ts` (sphere-trace + normal + depth buffer) | ~250 |
| `render/contours.ts` (silhouette + crease + suggestive + plane intersect) | ~600 |
| `render/contourTrace.ts` (Suzuki-Abe + RDP) | ~250 |
| `render/svgOut.ts` (perfect-freehand glue) | ~150 |
| `params.ts` extension + `api.ts` adapt | ~250 |
| Preset / hairstyle / style integration | ~300 |
| Tests + fixtures + regression sweep | ~400 |
| **Realistic total** | **~4100** |

For comparison: today's `scaffold.ts` alone is 2874 LOC carrying 14
builders. We're not adding 4000 on nothing — we're replacing
geometry while keeping the stroke / SVG / style-pack tail.

- **Optimistic ~3000.** SDF library lands clean, contour pipeline
  works first try at our render scale, a TS port of suggestive
  contours exists.
- **Unexpected ~6000-7000.** Most likely cause: §5 reading as
  "edge-pass CGI" not hand-drawn. Fix is its own research project —
  probably a hybrid silhouette extractor (option B from §5.2)
  layered onto option A.

### Time

Three to five focused agent-weeks realistic. Two optimistic. Six to
eight pessimistic. ~30-40% of effort is line-extraction correctness.

### Riskiest piece

**Suggestive-contour extraction reading as hand-drawn across the
camera-angle × demographics × packs grid.** Silhouettes well-trodden;
creases + construction lines are arithmetic. Suggestive contours
make the 3D read — but they're notoriously noisy near silhouette
boundaries (DeCarlo discusses) and prone to scribble fragmentation
when radial curvature crosses zero in many small patches. Fix =
view-dependent thresholding = a tuning knob = days of "look at it
across yaw 0-90° × five demographics × four packs." Slop lives
there.

Second-most-risky: per-feature smooth-min radii. Too tight = wax-
look brow-cranium seam; too loose = ridge melts. Right value may
differ per pack. Multi-day tuning pass.

---

## 7. Keep vs rewrite

| Component | Verdict |
|---|---|
| `scaffold.ts` feature builders (~2500 LOC) | **Rewrite.** Emit SDFs not 2D curves; param shape + pedagogy preserved. |
| `params.ts` parameter surface | **Mostly keep, extend.** `head.cranium/jaw/face` survives. +5-10 knobs (socket depth, ridge smoothness, per-joint k_blend). Existing values still mean what they mean — pedagogy-rooted. |
| `presets/demographics.ts` | **Mostly keep.** Child still sets `topology='round'`, etc. ~10-20% touch-up. |
| `presets/expressions.ts` (55 LOC) | **Keep.** Faigin knobs still apply. |
| `presets/styles.ts` (4 packs) | **Knob surface ports; render path rebuilds.** Pack intent (line weights, fill style, feature suppression) survives. Pack-internal wiring ~50% rewrite. |
| `hairstyles/*.ts` (13 styles) | **Port.** Hair sits on cranium SDF surface, same as current front-projected-sphere assumption. ~1 day each + 2 days rebuilding long-hair curtain logic. |
| `hair-field.ts` (284 LOC cranial flow) | **Port with small changes.** UV-on-sphere → nearest-point on cranium SDF. Same math, better grounded. |
| `render/strokes.ts` (perfect-freehand) | **Keep verbatim.** |
| `render/svg.ts` | **Keep most.** |
| `render/project.ts` | **Replace.** Front-projection → ray-march producing depth + normal buffer. |
| `render/hull.ts` (531 LOC clump merging) | **Keep for hair.** Clump-volume capsules are already 3D; compose into a hair SDF on top of the head SDF. |
| `buildScaffold` assembly (~300 LOC) | **Replace.** "Build head SDF" not "build 2D curves." |
| `api.ts` composeFace | **Keep cascade-merge plumbing; rewire call site.** Slot-2 / slot-6 / declares logic survives. |
| Cascade-merge manifest | **Preserve.** Metadata over the param surface; param surface mostly preserved. |

---

## 8. Unknowns — items to prototype before committing

Each is the kind of thing that turns a 4000-LOC estimate into 6500.

1. **Suggestive contours readable as hand-drawn at our stylization
   level.** DeCarlo's paper is shaded renderings; our output is line
   art over a smoothed SDF. Contours might be too noisy or too
   sparse. *Prototype:* ~200 LOC SDF + sphere-trace + DeCarlo +
   perfect-freehand. One head, three angles. Look.
2. **Smooth-min radii vs feature visibility.** Brow ridge must fuse
   AND be visible; right value may differ per pack. *Prototype:* per-
   feature `k` sweep × four packs.
3. **Ear SDF complexity.** Tragus is mm-scale on a cm ear; smooth-min
   may erase it. *Prototype:* ear-only render; verify all five named
   substructures appear as visible contours.
4. **3/4-view eye correctness.** Lid asymmetry + corner tuck + iris
   occlusion from SDF math at off-axis angles. *Prototype:* eye at
   0°/30°/60° yaw vs Loomis pages.
5. **Performance.** ~256² ray-march × 10-12 primitives + normals +
   curvatures + contour trace. Guess ~200-500 ms / head TS-on-Node.
   *Prototype:* 12-head fixture grid wall-time.
6. **Hair-on-SDF integration.** Current hair assumes front-projected
   sphere. *Prototype:* short Tintin on the new substrate vs current.
7. **`broughtForward` / `facialAngle` interpretation.** Rotations
   before jaw composition; worry: smooth-min seam migrates visibly
   when cranium tilts. *Prototype:* sweep 0 → 0.3, watch the seam.
8. **Whether B-rep would have been smaller** — path not taken. SDF
   wins on body extension + composition; eats complexity in line-
   extraction tail. If a clean TS B-rep + contour-from-NURBS library
   exists, totals might be comparable. Haven't surveyed. Flagged as
   risk; not prototyping.

---

## What's 2D pretending in the current engine, named honestly

- `frontZ(x, y)` in `scaffold.ts:2609` is a Z value on a front-
  projected sphere. Every feature builder receives `surfaceZ` (a
  scalar depth) and draws strokes whose XY is computed in 2D — 2D
  math in 3D vocabulary.
- "Side planes" are rendered by reusing the silhouette curves
  (`sideL`, `sideR`) — not a plane-meets-sphere intersection
  (`leo-audit.md` §8 already flagged).
- "Loomis ball with side cuts" is an ellipsoid clipped in X — a
  clip, not a plane intersection.
- The hair system is the one piece with real 3D math (`hair-field.ts`
  does spherical-coordinate flow integration) — proof the team can
  write 3D, and proof the rest of the engine isn't.

New design fixes all four. Cross-refs in this repo:
`leo-audit.md`, `leo-jaw.md`, `leo-face-integration-audit.md`,
`attachment-model.md`, `primitives-nose-ears-neck-brows.md`,
`hair-theory.md`. External citations listed inline at first use.
