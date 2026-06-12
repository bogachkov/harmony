// Loomis-style head SDF — substrate only.
//
// Rewrite addressing the five structural failures Truth and Digit caught
// against the previous substrate (commits 7b2169c…361c715, audits c36ab04 /
// ea88416):
//
//   1. Temple flat is a smax against a bounded "press" ellipsoid (large,
//      partially overlapping the side of the head), not an infinite plane
//      intersection. Outside the press's reach the bite has no effect, so
//      the rest of the cranium silhouette stays full-volume; inside the
//      press the bite curvature is gentle (large press = low curvature),
//      so the carved region reads as nearly flat — not a dimple, not a
//      disc, no halo ring around it.
//   2. Jaw is a smin chain of ellipsoids along a mandibular arc (gonial →
//      body → chin → body → gonial), not a tapered box. The arc carries
//      the chin forward of the gonial corners and the front face curves
//      side-to-side instead of being flat.
//   3. Occipital bulge is a real additive blob, big enough and positioned
//      far enough back that its forward surface is well outside the
//      cranium ellipsoid (so the smin actually adds visible material at
//      the back silhouette).
//   4. Centerline composition uses smin (not min) where left/right paired
//      features meet at x=0 — alae, lids — so no hard mirror seam.
//   5. No chamfered-box primitive anywhere on the visible surface. Every
//      contributing surface is an ellipsoid, so the isosurface is
//      naturally curved under shading.
//
// Preserves the eye composition (socket smoothSubtract, eyeball hard min,
// upper lid smin) and the nose composition (sheared bridge ellipsoid +
// tip sphere + alae) from the previous head.ts — those landed.
//
// World-space orientation:
//   +X = subject's left (viewer's right) ; +Y = up ; +Z = forward (toward camera)
//   origin = roughly the center of the cranium ball.

import type { Vec3 } from '../math/vec3.ts';
import {
  sphere, ellipsoid, plane,
  min, smin, smax, smoothSubtract,
} from './primitives.ts';

export type LoomisParams = {
  // ---- cranium ----
  /** Half-axes (X, Y, Z) of the cranium ellipsoid. */
  craniumRadii: Vec3;
  /** Center of the cranium ellipsoid in world space. */
  craniumCenter: Vec3;

  // ---- temple flat (bounded) ----
  /**
   * Center X of the temple "press" ellipsoid. The press sits at
   * (±templePressX, templeY, templeZ) with radii templePressRadii. The
   * fraction of the press that overlaps the cranium creates the flat —
   * a large press with low local curvature reads as a flat patch, not a
   * spherical dimple.
   */
  templePressX: number;
  templeY: number;
  templeZ: number;
  /** Half-axes of the press ellipsoid. Large in Y/Z keeps the bite shallow
   *  in those directions; X mostly determines how deep the bite goes. */
  templePressRadii: Vec3;
  /** Smooth-max k for fusing the press bite into the cranium. */
  kTemple: number;

  // ---- occipital bulge ----
  /** Radius of the additive back-bottom blob. */
  occipitalRadius: number;
  /** Center of the occipital blob (world space). */
  occipitalCenter: Vec3;
  /** Smooth-min radius between cranium and occipital blob. */
  kOccipital: number;

  // ---- forehead plane ----
  /** Distance from origin along +Z of the optional face-plane flattener. */
  foreheadPlaneZ: number;
  /** Smooth-max radius for the forehead plane clip. */
  kForehead: number;

  // ---- mandible (ellipsoid arc) ----
  /**
   * Gonial spread: each gonial-angle ellipsoid sits at x = ±gonialSpread.
   * Roughly 80% of cranium half-width.
   */
  gonialSpread: number;
  /** Y-center of the mandibular arc (negative — below cranium center). */
  jawY: number;
  /** Z of the gonial corners (negative = back, behind cranium center). */
  gonialZ: number;
  /** Z of the chin tip (positive = forward of cranium center). */
  chinZ: number;
  /** Half-axes of each gonial-angle ellipsoid. */
  gonialRadii: Vec3;
  /** Half-axes of each mid-mandibular-body ellipsoid (one per side). */
  bodyRadii: Vec3;
  /** X-position of each mid-body ellipsoid. */
  bodySpread: number;
  /** Z-position of each mid-body ellipsoid (between gonialZ and chinZ). */
  bodyZ: number;
  /** Y-position of each mid-body ellipsoid (typically a hair below jawY). */
  bodyY: number;
  /** Half-axes of the chin ellipsoid. */
  chinRadii: Vec3;
  /** Y-position of the chin ellipsoid (the chin pad's center). */
  chinY: number;
  /** smin radius across the mandibular ellipsoid chain. */
  kMandible: number;
  /** smin radius fusing the mandible into the cranium. */
  kJawToCranium: number;

  // ---- centerline composition ----
  /** smin radius for paired left/right features that meet at x=0. */
  kCenterline: number;

  // ---- nose (Loomis five-plane wedge) ----
  noseLength: number;
  tipProjection: number;
  alarWidth: number;
  bridgeSlope: number;
  noseRootY: number;
  kNose: number;

  // ---- eyes ----
  eyeLineY: number;
  eyeSpacing: number;
  eyeballRadius: number;
  eyeForwardOffset: number;
  socketWidth: number;
  socketHeight: number;
  socketDepth: number;
  socketInset: number;
  kSocket: number;
  lidWeight: number;
  lidDrop: number;
  lidForward: number;
  kLid: number;
};

export const DEFAULT_LOOMIS: LoomisParams = {
  // Cranium: longer front-to-back than wide. Width = 1.0, half-radius 0.50.
  craniumRadii: [0.50, 0.525, 0.60],
  craniumCenter: [0, 0, -0.05],

  // Temple flat. Press ellipsoid centered well outside the cranium (at
  // x=±0.83); its near surface at x≈±0.43 sits a hair inside the natural
  // cranium surface (~±0.49 at this Y/Z), so the smax bite carves a
  // shallow depression. Bite curvature follows the press, and because
  // the press is large compared to the bite depth (~0.05) the carved
  // region reads as nearly flat — Loomis' "ball with flat sides" without
  // an infinite slicing plane. Press Y/Z radii sized so the bite spans
  // roughly the temple/sphenoid area (above the cheekbone, behind the
  // eye); outside that region the press SDF is positive and -press is
  // negative, so smax falls back to the unmodified ellipsoid.
  templePressX: 0.83,
  templeY: 0.10,
  templeZ: 0.03,
  templePressRadii: [0.40, 0.30, 0.35],
  kTemple: 0.06,         // soft brow-temple corner

  // Occipital bulge. Cranium ellipsoid back surface sits at z ≈ -0.65;
  // occipital sphere at center z=-0.55 with r=0.22 has its back surface
  // at z=-0.77, so smin adds visible material 0.12 past the ellipsoid
  // silhouette. kOccipital wide so the bulge fuses without a hard rim.
  occipitalRadius: 0.22,
  occipitalCenter: [0, -0.05, -0.55],
  kOccipital: 0.18,

  // Forehead plane: gentle face-plane bias.
  foreheadPlaneZ: 0.55,
  kForehead: 0.18,

  // Mandible: 5 ellipsoids in an arc. Bodies span between gonial corners
  // and chin tip. Chin Z = 0.32 puts the chin clearly forward of the
  // cranium front (which sits near z ≈ 0.55 at brow, ≈ 0.35 at jaw line).
  gonialSpread: 0.30,        // gonial-angle X (each side)
  jawY: -0.32,               // gonial Y — top of the mandible arc
  gonialZ: -0.08,            // gonial Z — back of mandible arc
  chinZ: 0.32,               // chin tip Z — forward of cranium front at jaw line
  gonialRadii: [0.14, 0.16, 0.16],
  bodyRadii: [0.13, 0.14, 0.18],
  bodySpread: 0.20,
  bodyZ: 0.13,
  bodyY: -0.40,
  chinRadii: [0.13, 0.14, 0.13],
  chinY: -0.42,
  kMandible: 0.14,           // wide smin along the arc — no inter-ellipsoid seams
  kJawToCranium: 0.18,       // very wide smin — dissolves the cranium/jaw boundary

  // Centerline composition.
  kCenterline: 0.03,         // soft smin for paired features at x=0

  // Nose.
  noseLength: 0.40,
  tipProjection: 0.16,
  alarWidth: 0.20,
  bridgeSlope: 0.0,
  noseRootY: 0.18,
  kNose: 0.045,

  // Eyes (preserved from previous substrate — this composition landed).
  eyeLineY: 0.05,
  eyeSpacing: 0.13,
  eyeballRadius: 0.05,
  eyeForwardOffset: 0.04,
  socketWidth: 0.16,
  socketHeight: 0.12,
  socketDepth: 0.14,
  socketInset: 0.05,
  kSocket: 0.04,
  lidWeight: 0.07,
  lidDrop: 0.018,
  lidForward: 0.012,
  kLid: 0.03,
};

/**
 * Loomis head SDF.
 *
 * Construction order:
 *   1. Cranium ellipsoid, with BOUNDED temple flats smax'd into each side
 *      and a forehead-plane smax for the brow flattening. Occipital sphere
 *      smin'd at the back to give the back-of-head a visible silhouette
 *      shape (not a featureless egg).
 *   2. Eye sockets: smooth-subtract two ellipsoids from the cranium (before
 *      the nose attaches, so the bridge doesn't tangle with the cut).
 *   3. Mandible: five-ellipsoid arc (L gonial, L body, chin, R body, R
 *      gonial), smin'd into a single mandibular volume, then smin'd to
 *      the cranium with a wide blend so there's no horizontal seam at the
 *      jawline.
 *   4. Nose: sheared bridge ellipsoid + tip sphere + alar spheres
 *      (centerline-smin'd, not hard-min'd), attached via a tight kNose.
 *   5. Upper lids: paired flattened ellipsoids, centerline-smin'd, then
 *      smin'd onto the head as fleshy hoods.
 *   6. Eyeballs: paired spheres, hard-unioned (eyeballs are discrete
 *      objects visible through the orbit, not skin).
 */
export const loomisHead = (p: Vec3, params: Partial<LoomisParams> = {}): number => {
  const P: LoomisParams = { ...DEFAULT_LOOMIS, ...params };

  // ---- 1. Cranium ----
  const dEllipsoid = ellipsoid(p, P.craniumCenter, P.craniumRadii);

  // Temple flats: two big "press" ellipsoids centered well outside the
  // cranium, partially overlapping the temple region. Where the press
  // overlaps the cranium surface, the smax bite carves a shallow
  // depression that follows the press's surface curvature. Because the
  // press radii are large compared to the bite depth, the surface inside
  // the bite reads as nearly flat (low local curvature) — Loomis' "ball
  // with flat sides" without resorting to an infinite plane that slices
  // the whole hemisphere (the failure mode truth caught in c36ab04).
  // Negating the press SDF turns it into a "this point is outside the
  // bite region" function for smax purposes.
  const dPressR = ellipsoid(
    p, [ P.templePressX, P.templeY, P.templeZ], P.templePressRadii,
  );
  const dPressL = ellipsoid(
    p, [-P.templePressX, P.templeY, P.templeZ], P.templePressRadii,
  );
  let dCranium = smax(dEllipsoid, -dPressR, P.kTemple);
  dCranium = smax(dCranium, -dPressL, P.kTemple);

  // Forehead plane.
  const dForehead = plane(p, [0, 0, 1], P.foreheadPlaneZ);
  dCranium = smax(dCranium, dForehead, P.kForehead);

  // Occipital bulge — additive, wide smin so it actually protrudes past
  // the ellipsoid silhouette at the back.
  const dOcciput = sphere(p, P.occipitalCenter, P.occipitalRadius);
  dCranium = smin(dCranium, dOcciput, P.kOccipital);

  // ---- 2. Eye sockets (carve before adding the nose) ----
  // Front-Z of the cranium at the eye-line (used for both sockets and the
  // nose attachment math).
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
  const dSockets = min(dSocketL, dSocketR);
  dCranium = smoothSubtract(dCranium, dSockets, P.kSocket);

  // ---- 3. Mandible: five-ellipsoid arc ----
  // L gonial → L body → chin → R body → R gonial. All smin'd with a wide k
  // so the surface across the arc is smooth (no visible bead boundaries).
  // The L/R paired ellipsoids are placed symmetrically — the chin sits at
  // x=0 and joins both sides smoothly. No mirror seam because the chin
  // ellipsoid spans across the centerline by itself.
  const dGonialL = ellipsoid(p, [-P.gonialSpread, P.jawY, P.gonialZ], P.gonialRadii);
  const dGonialR = ellipsoid(p, [ P.gonialSpread, P.jawY, P.gonialZ], P.gonialRadii);
  const dBodyL   = ellipsoid(p, [-P.bodySpread, P.bodyY, P.bodyZ], P.bodyRadii);
  const dBodyR   = ellipsoid(p, [ P.bodySpread, P.bodyY, P.bodyZ], P.bodyRadii);
  const dChin    = ellipsoid(p, [0, P.chinY, P.chinZ], P.chinRadii);

  let dMandible = smin(dGonialL, dBodyL, P.kMandible);
  dMandible = smin(dMandible, dChin, P.kMandible);
  dMandible = smin(dMandible, dBodyR, P.kMandible);
  dMandible = smin(dMandible, dGonialR, P.kMandible);

  // Fuse mandible into cranium with a very wide smin — wide enough that
  // the gonial/cranium boundary dissolves into the masseter region with
  // no visible horizontal seam.
  let d = smin(dCranium, dMandible, P.kJawToCranium);

  // ---- 4. Nose (sheared bridge ellipsoid + tip + alae) ----
  const ry = P.craniumRadii[1];
  const rz = P.craniumRadii[2];
  const yRel = P.noseRootY - P.craniumCenter[1];
  const yNorm = Math.min(Math.abs(yRel) / ry, 1);
  const ellipsoidFrontZ = P.craniumCenter[2] + rz * Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
  const rootZ = Math.min(ellipsoidFrontZ, P.foreheadPlaneZ);

  const tNose = Math.min(1, (P.noseRootY - p[1]) / P.noseLength);
  const tBow = Math.max(0, Math.min(1, tNose));
  const projAtY = tNose * P.tipProjection
    + 4 * tBow * (1 - tBow) * P.bridgeSlope * P.tipProjection;

  const bridgeYHalf = P.noseLength / 2 + 0.04;
  const bridgeCenterY = P.noseRootY - P.noseLength / 2;
  const bridgeXHalf = P.alarWidth * 0.20;
  const bridgeZHalf = 0.10;
  const bridgeBackShift = 0.08;
  const pBridge: Vec3 = [
    p[0],
    p[1],
    p[2] - (rootZ + projAtY) + bridgeBackShift,
  ];
  const dBridge = ellipsoid(pBridge, [0, bridgeCenterY, 0], [bridgeXHalf, bridgeYHalf, bridgeZHalf]);

  const tipR = P.alarWidth * 0.16;
  const tipY = P.noseRootY - P.noseLength + tipR * 0.7;
  const tipZWorld = rootZ + P.tipProjection;
  const dTip = sphere(p, [0, tipY, tipZWorld - tipR * 0.4], tipR);

  const aR = P.alarWidth * 0.18;
  const alaY = P.noseRootY - P.noseLength + aR * 0.5;
  const alaZ = tipZWorld - aR * 0.7;
  const dAlaL = sphere(p, [-(P.alarWidth / 2 - aR), alaY, alaZ], aR);
  const dAlaR = sphere(p, [ (P.alarWidth / 2 - aR), alaY, alaZ], aR);

  // Fuse nose parts. Alae are centerline-smin'd (not hard-min'd) so the
  // tip + alae triplet reads as one ball of cartilage, not three glued spheres.
  let dNose = smin(dBridge, dTip, 0.06);
  const dAlae = smin(dAlaL, dAlaR, P.kCenterline);
  dNose = smin(dNose, dAlae, 0.06);

  d = smin(d, dNose, P.kNose);

  // ---- 5. Upper lids ----
  const eyeballZ = eyeFrontZ - P.eyeForwardOffset;
  const lidY = P.eyeLineY + P.eyeballRadius - P.lidDrop;
  const lidZ = eyeballZ + P.lidForward;
  const lidHalf: Vec3 = [
    P.lidWeight * 1.6,
    P.lidWeight * 0.55,
    P.lidWeight * 0.85,
  ];
  const dLidL = ellipsoid(p, [-P.eyeSpacing, lidY, lidZ], lidHalf);
  const dLidR = ellipsoid(p, [ P.eyeSpacing, lidY, lidZ], lidHalf);
  // Centerline smin — keeps the inter-eye region from showing a seam if
  // the lids ever creep close to x=0 (also a defensive measure for future
  // brow ridge work).
  const dLids = smin(dLidL, dLidR, P.kCenterline);
  d = smin(d, dLids, P.kLid);

  // ---- 6. Eyeballs (hard union — discrete objects inside the orbit) ----
  const dEyeL = sphere(p, [-P.eyeSpacing, P.eyeLineY, eyeballZ], P.eyeballRadius);
  const dEyeR = sphere(p, [ P.eyeSpacing, P.eyeLineY, eyeballZ], P.eyeballRadius);
  const dEyes = min(dEyeL, dEyeR);
  d = min(d, dEyes);

  return d;
};

export type { Vec3 };
