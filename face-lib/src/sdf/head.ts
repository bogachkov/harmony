// Loomis-style head SDF — substrate only.
//
// The classic Andrew Loomis construction (Drawing the Head & Hands, 1956)
// builds the cranium as a sphere with the two side panels sliced off, and
// attaches a jaw underneath. This is the minimum thing that "reads as a
// head" without features. No nose, no eyes, no ears. Just the volume.
//
// World-space orientation (right-handed, matches face-lib/src/math/vec3.ts):
//   +X = right (subject's left, viewer's right — model-side right)
//   +Y = up
//   +Z = forward (toward the camera in the default view)
//   origin = roughly the center of the cranium ball
//
// Units are arbitrary; the defaults below produce a head ~1.0 units tall,
// which is convenient for camera-distance math in the renderer.

import type { Vec3 } from '../math/vec3.ts';
import {
  sphere, ellipsoid, plane, taperedBox,
  min, max, smin, smax, smoothSubtract,
} from './primitives.ts';

export type LoomisParams = {
  // ---- cranium ("the ball — really an egg") ----
  /**
   * Half-axes (X, Y, Z) of the cranium ellipsoid. Real skulls are longer
   * front-to-back than wide (dolichocephalic ratio ~1.2), and a hair taller
   * than wide. Loomis draws it as a sphere because pedagogy needs a
   * memorable primitive; the underlying skull is closer to (1.0, 1.05, 1.2)
   * in width units. Here those values are halved into radii.
   */
  craniumRadii: Vec3;
  /**
   * Center of the cranium ellipsoid in world space. The Z value is the
   * "Loomis brought-forward" knob inverted: pushing the cranium *back*
   * (negative Z) leaves more room for a frontal face plane and flattens
   * the forehead's apparent curvature when viewed from the front. A small
   * negative Z (~-0.04..-0.06) gives the forehead a credibly flatter plane
   * without breaking the silhouette.
   */
  craniumCenter: Vec3;
  /**
   * How far the side-plane slices cut into the cranium, measured from
   * world origin along +X / -X. Loomis' classic ratio puts the cut at
   * roughly 7/8 of the head half-width — flat enough to read as a head,
   * not so flat the dome looks pinched.
   */
  sideOffset: number;

  // ---- occipital ("the back bulge") ----
  /**
   * Radius of the additive blob at the back-bottom of the cranium —
   * Hampton's "occipital projection". Real skulls bulge here because the
   * occipital bone wraps around the cerebellum; a pure ellipsoid lacks
   * this signature. A small smin-blob restores it cheaply.
   */
  occipitalRadius: number;
  /** Center of the occipital blob (world space). Sits back & a little low. */
  occipitalCenter: Vec3;
  /** Smooth-min radius between cranium and occipital blob. */
  kOccipital: number;

  // ---- forehead plane ("ball brought forward") ----
  /**
   * Distance from world origin along +Z of an optional flattening plane on
   * the front-upper cranium. Anything in front of this plane gets clipped
   * (intersection), turning the front of the cranium into a flatter slab —
   * the Loomis "face plane" / brow plane. Set to a large number to disable.
   * Combined with a slight backward shift of `craniumCenter` it gives the
   * forehead a credible non-spherical front.
   */
  foreheadPlaneZ: number;
  /**
   * Smooth-max radius for the forehead plane clip. Small but non-zero so
   * the brow ridge doesn't read as a hard CSG seam.
   */
  kForehead: number;

  // ---- jaw ("a single tapered wedge — gonial wide at top, chin point at bottom") ----
  /**
   * Bigonial width: full distance between the gonial angles (jaw corners
   * at the back/top of the mandible). Targeted at ~75-80% of cranial
   * cut-width for an adult.
   */
  bigonialWidth: number;
  /**
   * Mental width: full distance across the chin pad at the bottom of the
   * mandible. Always narrower than bigonial — that ratio is what creates
   * the chin point. Roughly 40-60% of bigonial for an adult male.
   */
  mentalWidth: number;
  /** Vertical extent of the jaw wedge (cranium-bottom to chin tip, roughly). */
  ramusHeight: number;
  /** Front-to-back depth of the jaw at the gonial (upper) level. */
  jawDepth: number;
  /** Front-to-back depth of the chin pad at the mental (lower) level. */
  chinDepth: number;
  /**
   * Chin chamfer — how much to sphere-sweep the jaw wedge. Bigger = softer,
   * more feminine; smaller = blockier, more masculine. Applied uniformly
   * (subtracted from the wedge SDF, which Minkowski-sums it with a sphere).
   */
  gonialAngle: number;
  /** Vertical offset of the jaw center, relative to cranium center. Negative = below. */
  jawYOffset: number;
  /**
   * Z-shift of the jaw forward (positive) or back (negative) relative to
   * the cranium center. A small forward shift gives a slight chin projection.
   */
  jawZOffset: number;
  /**
   * Extra forward push of the chin tip beyond the gonial level. The wedge's
   * upper cross-section sits at jawZOffset; the lower cross-section sits at
   * jawZOffset + mentalProtrusion. Real mental protuberances sit a few %
   * of head height forward of the mandibular body's mid-line.
   */
  mentalProtrusion: number;

  // ---- blending ----
  /**
   * Smooth-min radius between cranium and jaw — the "k_chin" knob.
   * Bigger = a more melted, infant-like transition; smaller = a sharper
   * jaw-line. Roughly 8-12% of the cranium radius works for an adult.
   */
  kChin: number;

  // ---- nose ("Loomis five-plane wedge — dorsum + sides + base + alae") ----
  /**
   * Nose length from nasal root (between the brows) to the tip, in
   * head-height units. Adult ratio is ~1/3 of face height — roughly
   * 0.32-0.36 of total head height. Drives the Y-extent of the dorsum.
   */
  noseLength: number;
  /**
   * How far the nose tip projects forward (in +Z) from the front of the
   * cranium ellipsoid. Adult-male projection is ~10-15% of head depth.
   * The dorsum interpolates from zero projection at the root to this
   * value at the tip.
   */
  tipProjection: number;
  /**
   * Full alar width — distance between the outer edges of the nostril
   * wings at the base. Classic Loomis proportion is "about an eye-width",
   * which lands around 18-22% of head width for an adult.
   */
  alarWidth: number;
  /**
   * Bridge slope. 0 = straight Greek nose. Positive bows the bridge OUT
   * (Roman / aquiline). Negative pushes it inward (concave / scooped /
   * "ski-jump"). Magnitude is a fraction of `tipProjection`.
   */
  bridgeSlope: number;
  /**
   * Y-coordinate of the nasal root (the deepest point of the bridge,
   * between the brows). Should sit just under the forehead plane, on the
   * brow line. Computed in world units relative to the head origin.
   */
  noseRootY: number;
  /**
   * Smooth-min radius for fusing the nose onto the cranium. Tight (~0.02)
   * so the bridge reads as growing OUT of the brow rather than as a
   * separate object stuck on; just non-zero enough to avoid a hard seam.
   */
  kNose: number;

  // ---- eyes ("a sphere in a cavity, with a lid wrapping over the top") ----
  /**
   * Y-coordinate of the eye-line — the horizontal centerline that passes
   * through both eyeball centers. Sits below the brow line (`noseRootY`).
   * Loomis: the eye-line is the vertical halfway point of the head; here
   * the cranium extends from y ≈ -0.50 to +0.52, so y ≈ 0.05-0.10 is
   * roughly mid-cranium and lands the eyes about one socket-height below
   * the brow ridge.
   */
  eyeLineY: number;
  /**
   * Half-spacing between eye centers: each eye sits at x = ±eyeSpacing.
   * Classic adult ratio: pupils are about one eye-width apart (so eye
   * centers ~1.5 eye-widths from midline). With alarWidth ~0.20 = one
   * eye-width, eye centers land near x = ±0.13.
   */
  eyeSpacing: number;
  /**
   * Eyeball sphere radius. Real eyeballs are ~24 mm across on a ~225 mm
   * head height — about 0.10 of head height. In our units (head ~1.05
   * tall) that's ~0.05.
   */
  eyeballRadius: number;
  /**
   * How far the eyeball center sits BEHIND the cranium's front face at
   * the eye-line. Positive value = recessed. With this set near
   * `eyeballRadius` the forward apex of the eyeball lands right at the
   * (un-socketed) front of the cranium, so once the socket is cut the
   * eyeball nests credibly inside the cavity.
   */
  eyeForwardOffset: number;

  /**
   * Socket recess: a smooth-subtracted ellipsoid carved into the front
   * of the cranium, centered slightly inside the front face at each
   * eye-line position. `socketWidth` / `socketHeight` are the X / Y
   * full extents of the cavity opening; `socketDepth` is the full Z
   * extent (front-to-back of the carving sphere).
   */
  socketWidth: number;
  socketHeight: number;
  socketDepth: number;
  /**
   * How far INTO the cranium the socket-ellipsoid's center sits relative
   * to the cranium's front face at the eye-line. Bigger = deeper cavity.
   * Roughly half of `socketDepth` puts the carving sphere centered on
   * the front face so the cut goes halfway in.
   */
  socketInset: number;
  /** Smooth-subtract radius for the socket carving. */
  kSocket: number;

  /**
   * Upper lid: a flattened ellipsoid wrapping over the top-front of the
   * eyeball. `lidWeight` scales the overall lid mass (X/Y/Z radii);
   * `lidDrop` is how far down (in -Y) the lid's center is offset from
   * the eyeball center — bigger drop = lid covers more of the iris.
   */
  lidWeight: number;
  lidDrop: number;
  /**
   * How far forward (in +Z) the lid's center sits relative to the
   * eyeball center. Slightly positive so the lid bulges out in front
   * of the sphere apex — a fleshy hood, not a flat disk.
   */
  lidForward: number;
  /** Smooth-min radius for fusing each upper lid into the cranium. */
  kLid: number;
};

/** Defaults that approximate an adult male head. Tuned visually, not measured. */
export const DEFAULT_LOOMIS: LoomisParams = {
  // Cranium: longer front-to-back than wide (dolichocephalic). Width is
  // taken as the reference unit (head-width = 1.0), so half-radii are 0.5*.
  // Slightly back-shifted center makes room for a flatter forehead.
  craniumRadii: [0.50, 0.525, 0.60],   // (1.0, 1.05, 1.2) head-width units
  craniumCenter: [0, 0, -0.05],        // tiny push back — "ball brought forward" effect
  sideOffset: 0.42,                    // ~0.84 * width — Loomis' "ball with flat sides"

  // Occipital bulge: a small additive sphere at the back-bottom. Hampton 2009.
  // Positioned just behind the cranium ellipsoid's back surface so the smin
  // adds a visible bulge instead of being subsumed by the ellipsoid interior.
  occipitalRadius: 0.18,
  occipitalCenter: [0, -0.10, -0.55],
  kOccipital: 0.16,

  // Forehead plane: a gentle bias that flattens the front-upper cranium.
  // Pushed out far enough to barely touch the natural front apex (the
  // ellipsoid front reaches z = -0.05 + 0.60 = 0.55), with a generous
  // smax blend so the flattening reads as a softer brow plane rather than
  // a hard CSG slice. Tighter clipping (lower foreheadPlaneZ) starts to
  // look like the front of the head has been chopped off.
  foreheadPlaneZ: 0.54,
  kForehead: 0.18,

  // Jaw: single tapered wedge — bigonial wide at the top, chin point at the
  // bottom. Positioned forward enough that the chin projects past the
  // cranium's mid-line — otherwise the jaw reads as tucked under the cranium.
  // Mental width was 0.30 (~45% of bigonial) which read as a wedge tip; bumped
  // to ~64% so the chin reads as a real pad with a visible (but not flat) taper.
  bigonialWidth: 0.66,    // ~0.78 * (2 * sideOffset) — adult gonial spread
  mentalWidth: 0.42,      // ~64% of bigonial — defined chin pad, not a wedge tip
  ramusHeight: 0.42,      // ~35% of total head height
  jawDepth: 0.72,         // a hair deeper than cranium width, less than cranium depth
  chinDepth: 0.44,        // chin pad is shorter front-to-back than the ramus
  gonialAngle: 0.07,      // chamfer radius — rounds the jaw wedge corners
  jawYOffset: -0.46,      // sits below the cranium center
  jawZOffset: 0.10,       // forward shift so chin clears the face plane
  mentalProtrusion: 0.04, // chin tip pushed forward of the gonial level

  kChin: 0.10,            // ~20% of cranium half-width — softens cranium→gonial shoulder

  // Nose: Loomis five-plane wedge. Length ~1/3 of face height puts the tip
  // roughly halfway down the head. Tip projection is conservative — Roman
  // noses go further but read as a caricature on a generic adult substrate.
  // Alar width ~20% of head width. Bridge slope 0 = straight (Greek). The
  // root sits on the brow line, which is roughly 0.18-0.22 above the
  // cranium center for these defaults.
  // Length & projection bumped from 0.34 / 0.12 — at those values the nose
  // read as a button. 0.40 / 0.16 sits in the adult-male range without
  // running away into caricature.
  noseLength: 0.40,       // ~38% of face height — adult-male dorsum length
  tipProjection: 0.16,    // ~13% of head depth past the cranium front
  alarWidth: 0.20,        // ~eye-width
  bridgeSlope: 0.0,       // straight bridge
  noseRootY: 0.18,        // brow line, just under foreheadPlaneZ apex
  kNose: 0.045,           // tight blend at the bridge — not a separate blob

  // Eyes. The eye-line sits below the brow at y ≈ 0.05, which is roughly
  // one socket-height down from noseRootY = 0.18. Spacing puts pupils about
  // one eye-width apart (~0.13 from midline given alarWidth=0.20).
  //
  // The eyeball radius (0.05) is ~10% of head-width / head-height, matching
  // the real-world ratio (~24 mm eye on ~225 mm head).
  //
  // Socket dimensions sized just wider than the eyeball so the carving cuts
  // a credible cavity without exposing the eyeball's full equator. Depth is
  // greater than width so the cut is deepest at the centerline and shallows
  // at the corners — same logic as the real orbital rim.
  //
  // Lid is a flattened ellipsoid centered slightly above and forward of the
  // eyeball, drooping down (lidDrop) to cover the top portion of the sphere
  // and protruding forward (lidForward) to read as a fleshy hood in profile.
  eyeLineY: 0.05,
  eyeSpacing: 0.13,
  eyeballRadius: 0.05,
  eyeForwardOffset: 0.04, // eyeball center sits ~0.04 behind front face of cranium

  socketWidth: 0.16,      // X-extent of orbital opening
  socketHeight: 0.12,     // Y-extent — taller-than-wide eye-shape
  socketDepth: 0.14,      // Z-extent of the carving sphere
  socketInset: 0.05,      // how far in from front face the carving sphere sits
  kSocket: 0.04,          // smooth-subtract — soft orbital rim, no hard CSG line

  lidWeight: 0.07,        // overall lid mass scaling — moderate fleshy hood
  lidDrop: 0.018,         // lid center sits 0.018 below eyeball center
  lidForward: 0.012,      // lid center pushed forward of eyeball center — fleshy bulge
  kLid: 0.03,             // tight smin — lid reads as continuous with cranium
};

/**
 * Loomis head SDF.
 *
 * Construction:
 *   1. Cranium = ellipsoid ∩ (left side plane) ∩ (right side plane) ∩
 *      (forehead plane, smoothed). Intersection of SDFs is `max` / `smax`.
 *      The side planes have outward normals pointing along ±X; the
 *      forehead plane has +Z outward and clips the front of the dome into
 *      a flatter slab (the Loomis "face plane"). Then `smin` an occipital
 *      sphere at the back-bottom to restore the cranial bulge a pure
 *      ellipsoid lacks (Hampton 2009 ch.5).
 *   2. Jaw = a single tapered wedge (`taperedBox`) whose cross-section
 *      lerps linearly from (`bigonialWidth`, `jawDepth`) at the top to
 *      (`mentalWidth`, `chinDepth`) at the bottom, sphere-swept by
 *      `gonialAngle` for rounded corners. The chin point falls out of the
 *      math — no stacked blocks, no visible step in the front silhouette.
 *      Bridgman 1920 §"The Lower Jaw" treats the mental protuberance as a
 *      distinct plane below the side-of-jaw; the wedge captures the same
 *      decomposition as a single primitive instead of two stacked SDFs.
 *      The wedge's lower cross-section is also shifted forward by
 *      `mentalProtrusion`, so a profile view shows the chin projecting in
 *      front of the mandibular body's mid-line.
 *   3. Nose = a tapered-wedge dorsum (root → tip, narrow & projecting
 *      forward), plus two alar spheres at the base for the nostril wings,
 *      smin'd together into a single nose SDF and then smin'd onto the
 *      cranium with a tight `kNose` blend. The dorsum's Z-axis follows a
 *      curve controlled by `bridgeSlope` (0 = straight, +ve = Roman).
 *      Loomis 1956 ch.1 ("The Five Planes of the Nose") models this as
 *      two side planes meeting at a dorsal ridge, a base plane tilting up
 *      under the tip, and two ala bulges — the wedge-plus-spheres
 *      composition is the SDF-native version of those five planes.
 *   4. Eye sockets = two ellipsoids smooth-SUBTRACTED from the cranium
 *      (carved before the nose is added so the bridge doesn't tangle with
 *      the orbital cut). Each socket centered slightly inside the front
 *      face of the cranium at (±eyeSpacing, eyeLineY).
 *   5. Eyeballs = two spheres positioned inside the sockets so the
 *      forward edge nests near the orbital opening. Unioned with HARD
 *      min — the eyeball is a separate surface visible through the
 *      cavity, not part of the skin shell.
 *   6. Upper lids = two flattened ellipsoids smin'd onto the cranium,
 *      centered above-and-forward of each eyeball so the lid bulges out
 *      in front of the sphere apex (Loomis' "fleshy hood"), covering the
 *      top portion of the eyeball.
 *   7. Head = (((cranium−sockets) `smin` jaw) `smin` nose) `smin` lids,
 *      then min'd with the eyeballs. Blend radii kChin, kNose, kLid.
 *      The cranium-jaw smin adds material along the gonial / mandibular-
 *      angle region. The nose smin is much tighter — the nose should
 *      read as growing OUT of the cranium, not as a separate object
 *      stuck on. The lid smin is tight too (lid is flesh continuous
 *      with cranium); the eyeball union is hard (eyeball is a discrete
 *      object inside the orbit, not skin).
 */
export const loomisHead = (p: Vec3, params: Partial<LoomisParams> = {}): number => {
  const P: LoomisParams = { ...DEFAULT_LOOMIS, ...params };

  // ---- cranium: ellipsoid + side cuts + forehead clip + occipital blob ----
  // Ellipsoid (longer Z than X/Y) replaces the classic sphere — real
  // crania are dolichocephalic. Centered slightly behind the origin so the
  // forehead plane (below) can carve a credibly flat face plane without
  // the back-of-head also collapsing inward.
  const dEllipsoid = ellipsoid(p, P.craniumCenter, P.craniumRadii);
  // Two side planes clip the temporal flats (Loomis "ball with flat sides").
  const dRight = plane(p, [1, 0, 0], P.sideOffset);   // x - sideOffset
  const dLeft = plane(p, [-1, 0, 0], P.sideOffset);   // -x - sideOffset
  let dCranium = max(max(dEllipsoid, dRight), dLeft);
  // Forehead plane: outward normal = +Z, clipping anything in front of
  // foreheadPlaneZ. Intersected via smax so the brow apex reads as a soft
  // brow ridge, not a hard CSG seam. With craniumCenter at small -Z, the
  // ellipsoid's front apex protrudes slightly past foreheadPlaneZ — the
  // smax shaves that apex into a flatter face plane.
  const dForehead = plane(p, [0, 0, 1], P.foreheadPlaneZ);
  dCranium = smax(dCranium, dForehead, P.kForehead);
  // Occipital projection: an additive sphere at the back-bottom of the
  // cranium, smin'd in. Hampton 2009 ch.5.
  const dOcciput = sphere(p, P.occipitalCenter, P.occipitalRadius);
  dCranium = smin(dCranium, dOcciput, P.kOccipital);

  // ---- eye sockets: smooth-subtract two ellipsoids from the cranium ----
  // Composition order matters. The sockets MUST be carved before the nose
  // is smin'd in, otherwise the nose wedge near the bridge could intersect
  // the socket ellipsoid and the subtract operation eats the nose. We also
  // want the socket cut to live on the *cranium* surface so the orbital
  // rim reads as a recess in bone, not as a separate dent in some other
  // primitive.
  //
  // Each socket is an ellipsoid centered slightly inside the cranium front
  // face at (±eyeSpacing, eyeLineY, frontZ - socketInset). The ellipsoid's
  // X/Y/Z half-extents come straight from socketWidth/Height/Depth halved.
  // smoothSubtract(cranium, socket, kSocket) carves a soft-rimmed cavity.
  //
  // Front-Z of the cranium at the eye-line, accounting for both the
  // ellipsoid taper and the forehead-plane clip. Same construction as the
  // nose's rootZ calculation but evaluated at eyeLineY.
  const ryE = P.craniumRadii[1];
  const rzE = P.craniumRadii[2];
  const yRelE = P.eyeLineY - P.craniumCenter[1];
  const yNormE = Math.min(Math.abs(yRelE) / ryE, 1);
  const ellipsoidFrontZAtEye =
    P.craniumCenter[2] + rzE * Math.sqrt(Math.max(0, 1 - yNormE * yNormE));
  const eyeFrontZ = Math.min(ellipsoidFrontZAtEye, P.foreheadPlaneZ);

  const socketHalf: Vec3 = [P.socketWidth / 2, P.socketHeight / 2, P.socketDepth / 2];
  const socketZ = eyeFrontZ - P.socketInset;
  const dSocketL = ellipsoid(p, [-P.eyeSpacing, P.eyeLineY, socketZ], socketHalf);
  const dSocketR = ellipsoid(p, [ P.eyeSpacing, P.eyeLineY, socketZ], socketHalf);
  // Fuse the two socket SDFs first (hard union — they're disjoint, and
  // unioning them lets us do one smoothSubtract instead of two sequential
  // ones, avoiding compounded blend artifacts at the bridge area where the
  // two sockets' soft rims overlap).
  const dSockets = min(dSocketL, dSocketR);
  dCranium = smoothSubtract(dCranium, dSockets, P.kSocket);

  // ---- jaw: single tapered wedge (gonial wide → mental narrow) ----
  // One primitive instead of two stacked boxes. The wedge's cross-section
  // lerps linearly in Y from (bigonialWidth, jawDepth) at the top to
  // (mentalWidth, chinDepth) at the bottom — the chin point falls out of
  // the math, no visible step in the front silhouette. Sphere-swept by
  // `gonialAngle` (subtract r from the SDF, Minkowski sum with a sphere)
  // for rounded jaw corners.
  //
  // The wedge's per-cross-section center also lerps in Z: top sits at
  // jawZOffset, bottom sits at jawZOffset + mentalProtrusion. We implement
  // that by shearing the input point — subtract a Y-dependent Z offset
  // before evaluating the wedge. This keeps the wedge axis-aligned in its
  // own local frame, so the taperedBox SDF stays exact.
  const r = P.gonialAngle;
  const halfH = P.ramusHeight / 2;
  // Local point for the wedge: translate to jaw center, then shear Z by a
  // factor that runs from 0 at the top to -mentalProtrusion at the bottom,
  // so the world-space wedge has its lower cross-section pushed forward by
  // +mentalProtrusion. (Subtract on input = add on output.)
  const py = p[1] - P.jawYOffset;
  const tWedge = Math.max(0, Math.min(1, (halfH - py) / (2 * halfH))); // 0 at top, 1 at bottom
  const pJaw: Vec3 = [
    p[0],
    p[1],
    p[2] - tWedge * P.mentalProtrusion,
  ];
  const jawCenter: Vec3 = [0, P.jawYOffset, P.jawZOffset];
  const dJaw = taperedBox(
    pJaw,
    jawCenter,
    halfH - r,
    { x: Math.max(P.bigonialWidth / 2 - r, 0), z: Math.max(P.jawDepth / 2 - r, 0) },
    { x: Math.max(P.mentalWidth / 2 - r, 0),   z: Math.max(P.chinDepth / 2 - r, 0) },
  ) - r;

  // Smooth-min the cranium and jaw together. The blend lives in the gonial /
  // mandibular-angle region, which is exactly where a real head transitions
  // from cranial vault to mandible via the masseter mass.
  let d = smin(dCranium, dJaw, P.kChin);

  // ---- nose: Loomis five-plane wedge attached at the nasal root ----
  // Composition (four primitives, all smin'd):
  //   - Bridge: a tall thin ellipsoid running root → tip. Naturally
  //     tapers to points at top and bottom (so the buried top point
  //     melts into the brow with no hard edge), and the elliptical
  //     cross-section reads as a soft dorsal ridge — not a flat box face.
  //   - Tip: a small sphere at the front-bottom of the bridge for the
  //     nasal tip / cartilage bulb. Adds projection past the bridge end.
  //   - Alae (x2): two spheres flanking the tip for the nostril wings.
  // The bridge ellipsoid's Y-axis is straight, but the bridge follows the
  // forward Z lean by *shearing the query point* — at root (top), shear
  // = 0; at tip (bottom), shear = -tipProjection. `bridgeSlope` adds a
  // quadratic bow (positive = Roman, negative = scoop) on top of the
  // linear lean.
  // The whole nose-volume is then smin'd onto the cranium with a tight
  // `kNose` so the bridge reads as growing OUT of the brow, not stuck on.

  // Nasal root Z: front face of the cranium at the brow line. The cranium
  // is smax'd against the forehead plane, so the actual front surface is
  // min(ellipsoid_front, foreheadPlaneZ) (softened by kForehead, but for
  // attachment math the hard min is close enough).
  const ry = P.craniumRadii[1];
  const rz = P.craniumRadii[2];
  const yRel = P.noseRootY - P.craniumCenter[1];
  const yNorm = Math.min(Math.abs(yRel) / ry, 1);
  const ellipsoidFrontZ = P.craniumCenter[2] + rz * Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
  const rootZ = Math.min(ellipsoidFrontZ, P.foreheadPlaneZ);

  // Y-dependent forward lean. tNose: 0 at root, 1 at tip. Unclamped on the
  // upper side so the lean goes *negative* above the root — pulling the
  // dorsum's buried top back into the cranium as we move above the brow.
  // (Clamped on the lower side at 1 so the lean doesn't keep extending
  // forward below the tip.) projAtY is how much the dorsum centerline
  // sits forward of rootZ at this height.
  const tNose = Math.min(1, (P.noseRootY - p[1]) / P.noseLength);
  // Only apply the bow term where tNose is in [0,1] — outside that, the
  // bow goes to zero, leaving just the (possibly negative) linear lean.
  const tBow = Math.max(0, Math.min(1, tNose));
  const projAtY = tNose * P.tipProjection
    + 4 * tBow * (1 - tBow) * P.bridgeSlope * P.tipProjection;

  // Bridge ellipsoid: a relatively SHALLOW ellipsoid laid along Y, with
  // its center pushed *back* into the cranium so only a thin shell pokes
  // out front. The pokethrough is shaped by the ellipsoid taper: zero at
  // top/bottom apices, max at the middle. By shearing the input Z by
  // projAtY (forward lean increasing root → tip), the ellipsoid bends
  // along the dorsum curve while staying axis-aligned in local frame.
  //
  // Geometry in the local (sheared) frame:
  //   - Ellipsoid Z half-extent: bridgeZHalf (small — just enough to
  //     project a credible nose ridge).
  //   - Ellipsoid CENTER is shifted back by `bridgeBackShift` from the
  //     sheared centerline (the centerline = rootZ + projAtY = where the
  //     nose-front "should" sit at this Y). Net result: visible-front of
  //     ellipsoid at the bridge midline sits at centerline +
  //     (bridgeZHalf - bridgeBackShift), and the back face sits well
  //     behind the cranium surface.
  //   - At Y = brow line, the ellipsoid taper means the X & Z cross-
  //     sections are smaller than at the middle — naturally easing into
  //     the brow.
  const bridgeYHalf = P.noseLength / 2 + 0.04;
  const bridgeCenterY = P.noseRootY - P.noseLength / 2;
  const bridgeXHalf = P.alarWidth * 0.20;
  const bridgeZHalf = 0.10;        // total Z half-extent in local frame
  const bridgeBackShift = 0.08;    // how far the ellipsoid center sits behind the centerline
  // Shift query Z: ellipsoid center sits at (rootZ + projAtY - bridgeBackShift).
  const pBridge: Vec3 = [
    p[0],
    p[1],
    p[2] - (rootZ + projAtY) + bridgeBackShift,
  ];
  const dBridge = ellipsoid(pBridge, [0, bridgeCenterY, 0], [bridgeXHalf, bridgeYHalf, bridgeZHalf]);

  // Tip sphere: at the bottom-front of the bridge. Pulled slightly UP
  // and BACK so it overlaps the bridge's bottom apex instead of sticking
  // out as a separate ball. Provides a credible nasal bulb in profile.
  const tipR = P.alarWidth * 0.16;
  const tipY = P.noseRootY - P.noseLength + tipR * 0.7;
  const tipZWorld = rootZ + P.tipProjection;
  const dTip = sphere(p, [0, tipY, tipZWorld - tipR * 0.4], tipR);

  // Alar spheres: nostril wings, flanking the tip. X positions land the
  // outer edges of the spheres on the `alarWidth` target. They sit a hair
  // behind and below the tip so the tip stays the most-projected point.
  const aR = P.alarWidth * 0.18;
  const alaY = P.noseRootY - P.noseLength + aR * 0.5;
  const alaZ = tipZWorld - aR * 0.7;
  const dAlaL = sphere(p, [-(P.alarWidth / 2 - aR), alaY, alaZ], aR);
  const dAlaR = sphere(p, [ (P.alarWidth / 2 - aR), alaY, alaZ], aR);

  // Fuse the nose parts. Generous smin so the bridge / tip / alae read as
  // one continuous nose volume instead of three glued spheres.
  let dNose = smin(dBridge, dTip, 0.06);
  dNose = smin(dNose, dAlaL, 0.06);
  dNose = smin(dNose, dAlaR, 0.06);

  // Attach the nose to the head with a tight-but-not-zero smin. Too large
  // and the bridge melts into the forehead (wax look); too small and the
  // seam reads as a sharp CSG line where the dorsum's back edge cuts into
  // the brow. kNose ~0.025 is the sweet spot for these dimensions.
  d = smin(d, dNose, P.kNose);

  // ---- upper lids: flattened ellipsoid hoods over the eyeballs ----
  // The lid is a fleshy shell wrapping the top-front of each eyeball,
  // smin'd onto the cranium so it reads as continuous skin rather than a
  // glued-on disk. It must be added AFTER the nose so the nose-lid join
  // near the bridge doesn't interfere with the dorsum's tight kNose smin.
  //
  // Geometry per lid: a flattened ellipsoid (wider in X, thinner in Y &
  // Z) centered slightly above-and-forward of the eyeball center. The
  // ellipsoid's wide X-extent lets it span the socket from inner-corner
  // to outer-corner. lidDrop pulls it down so the lid covers the top
  // portion of the eyeball; lidForward pushes its center past the
  // eyeball center so the lid bulges in front of the sphere apex.
  //
  // Eyeball center Z: behind the cranium's (now-socketed) front face by
  // eyeForwardOffset. We use the un-socketed front-Z as the reference so
  // the eyeball position is independent of how deep the socket is cut.
  const eyeballZ = eyeFrontZ - P.eyeForwardOffset;
  // Lid center: sits just above the eyeball's top apex, pulled down by
  // `lidDrop` so the lid's lower edge hangs across the eyeball above the
  // iris line. Increasing lidDrop = more lid coverage (sleepier eye).
  const lidY = P.eyeLineY + P.eyeballRadius - P.lidDrop;
  const lidZ = eyeballZ + P.lidForward;
  const lidHalf: Vec3 = [
    P.lidWeight * 1.6,  // wider than tall — almond-shaped lid
    P.lidWeight * 0.55, // shallow Y — lid is a thin shell, not a brow ridge
    P.lidWeight * 0.85,
  ];
  const dLidL = ellipsoid(p, [-P.eyeSpacing, lidY, lidZ], lidHalf);
  const dLidR = ellipsoid(p, [ P.eyeSpacing, lidY, lidZ], lidHalf);
  const dLids = min(dLidL, dLidR);
  d = smin(d, dLids, P.kLid);

  // ---- eyeballs: two spheres unioned hard with the head ----
  // The eyeballs are SEPARATE surfaces visible through the socket cavity.
  // Hard min (not smin) so the eyeball reads as a discrete shape sitting
  // inside the orbit — smin would melt eyeball into skin and produce the
  // classic wax-look. The render's central-difference normal will pick up
  // the spherical curvature cleanly.
  const dEyeL = sphere(p, [-P.eyeSpacing, P.eyeLineY, eyeballZ], P.eyeballRadius);
  const dEyeR = sphere(p, [ P.eyeSpacing, P.eyeLineY, eyeballZ], P.eyeballRadius);
  const dEyes = min(dEyeL, dEyeR);
  d = min(d, dEyes);

  return d;
};

// Re-export for callers who only want this module.
export type { Vec3 };
