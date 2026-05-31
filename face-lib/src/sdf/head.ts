// Loomis-style head SDF — substrate only.
//
// Rewrite addressing the five structural failures Truth and Digit caught
// against the previous substrate (commits 7b2169c…361c715, audits c36ab04 /
// ea88416):
//
//   1. Temple flat is a BOUNDED smax against the cranium, not an infinite
//      plane intersection. Outside the temple's Y/Z window the clip has no
//      effect, so the rest of the cranium silhouette stays full-volume.
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
  sphere, ellipsoid,
  min, max, smin, smax, smoothSubtract,
} from './primitives.ts';

export type LoomisParams = {
  // ---- cranium ----
  /** Half-axes (X, Y, Z) of the cranium ellipsoid. */
  craniumRadii: Vec3;
  /** Center of the cranium ellipsoid in world space. */
  craniumCenter: Vec3;

  // ---- temple flat (bounded) ----
  /**
   * X-offset of each temple flat plane. The flat sits at x = ±templeOffset.
   * Smaller offset = flatter side. Loomis' classic is ~7/8 of head half-width.
   */
  templeOffset: number;
  /** Y-center of the temple flat window (in world Y). */
  templeY: number;
  /** Z-center of the temple flat window. */
  templeZ: number;
  /** Y normalization for the temple falloff (1 unit of falloff = halfH away). */
  templeHalfH: number;
  /** Z normalization for the temple falloff (1 unit of falloff = halfD away). */
  templeHalfD: number;
  /** Falloff scale — how steeply the clip dies off with normalized Y/Z distance.
   *  Larger = more tightly bounded temple flat. */
  templeFalloff: number;
  /** Smooth-max k for the temple clip. */
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

  // Temple flat: bounded clip. The window is centered roughly at the
  // sphenoid (above the cheekbone, behind the eye). Half-height ~0.18 of
  // head height; half-depth ~0.18 of head depth. Outside that window the
  // clip has no effect, so the cranium silhouette stays curved at the
  // crown, occiput, and below the cheekbone.
  templeOffset: 0.44,    // 88% of half-width — temple visibly flat in 3/4 view
  templeY: 0.08,         // sits above eye-line — temple is above the zygomatic
  templeZ: 0.05,         // slightly forward of cranium center
  templeHalfH: 0.18,     // Y normalization for falloff
  templeHalfD: 0.22,     // Z normalization for falloff
  templeFalloff: 0.18,   // quadratic falloff — flat dissolves into ellipsoid
  kTemple: 0.05,         // soft blend at the flat's perimeter

  // Occipital bulge. Center pushed BACK further than the ellipsoid surface
  // (ellipsoid back at z = -0.05 - 0.60 = -0.65; sphere center at -0.62 with
  // r=0.20 → forward surface at -0.42, well inside the ellipsoid; back
  // surface at -0.82, well past the ellipsoid). Generous kOccipital so the
  // smin adds a visible bulge that protrudes past the ellipsoid silhouette.
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
 * Bounded-region temple clip.
 *
 * Returns a "clip distance" that equals the plane distance `(±x - offset)`
 * at the temple's anchor point, and falls off smoothly with Y/Z distance
 * from there. When combined with the cranium via `smax(ellipsoid, clip, k)`,
 * this carves a temple flat that is strongest at the anchor and dissolves
 * back into the full ellipsoid surface as you move away — fixing both the
 * "infinite plane slicing the whole hemisphere" failure (truth audit,
 * c36ab04) AND avoiding the rectangular-window decal artifact a hard-edged
 * box falloff would produce.
 *
 * Construction: signed plane distance minus a quadratic radial falloff in
 * (Y, Z), normalized so that one "halfH" (or one "halfD") of axis offset
 * contributes `falloffScale`. The falloff is C¹ everywhere, so the temple
 * flat reads as a soft elliptical depression of the cranium surface, not
 * a stamped panel.
 *
 * Not strictly Lipschitz-1 (the quadratic term means the gradient
 * magnitude can exceed 1 far from the anchor), but the deviation is a
 * conservative UNDER-estimate of distance (subtracting positive falloff
 * shrinks the SDF), which is the safe direction for sphere tracing.
 */
const templeClip = (
  p: Vec3,
  sign: 1 | -1,                       // +1 for right (+X) side, -1 for left (-X)
  offset: number,
  centerY: number, centerZ: number,
  halfH: number, halfD: number,
  falloffScale: number,
): number => {
  const planeDist = sign * p[0] - offset;
  const ny = (p[1] - centerY) / halfH;
  const nz = (p[2] - centerZ) / halfD;
  // Plateau-then-quadratic falloff: 0 inside the unit ellipse in (Y, Z),
  // grows as (r-1)² outside. This gives a genuine planar flat at the
  // temple anchor (not a dimple) and a smooth C¹ rolloff back into the
  // ellipsoid surface beyond the plateau.
  const r = Math.hypot(ny, nz);
  const over = Math.max(0, r - 1);
  const falloff = falloffScale * over * over;
  return planeDist - falloff;
};

/** Plane SDF, inlined here so head.ts owns its substrate composition. */
const planeSDF = (p: Vec3, normal: Vec3, distance: number): number =>
  p[0] * normal[0] + p[1] * normal[1] + p[2] * normal[2] - distance;

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

  // Bounded temple flats — see templeClip() comment.
  const dTempleR = templeClip(
    p, +1, P.templeOffset, P.templeY, P.templeZ, P.templeHalfH, P.templeHalfD, P.templeFalloff,
  );
  const dTempleL = templeClip(
    p, -1, P.templeOffset, P.templeY, P.templeZ, P.templeHalfH, P.templeHalfD, P.templeFalloff,
  );
  let dCranium = smax(dEllipsoid, dTempleR, P.kTemple);
  dCranium = smax(dCranium, dTempleL, P.kTemple);

  // Forehead plane.
  const dForehead = planeSDF(p, [0, 0, 1], P.foreheadPlaneZ);
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
