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
  sphere, ellipsoid, box, plane,
  max, smin, smax,
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

  // ---- jaw ("the block below — tapered to a chin") ----
  /**
   * Bigonial width: full distance between the gonial angles (jaw corners
   * at the back/top of the mandible). Targeted at ~75-80% of cranial
   * cut-width for an adult.
   */
  bigonialWidth: number;
  /**
   * Mental width: full distance across the chin pad at the bottom of the
   * mandible. Always narrower than bigonial — that ratio is what creates
   * the chin point. Roughly 55-70% of bigonial for an adult male.
   */
  mentalWidth: number;
  /** Vertical extent of the jaw block (cranium-bottom to chin tip, roughly). */
  ramusHeight: number;
  /** Front-to-back depth of the jaw block at the gonial (upper) level. */
  jawDepth: number;
  /** Front-to-back depth of the chin pad at the mental (lower) level. */
  chinDepth: number;
  /**
   * Chin chamfer / "gonial rounding" — how much to round the corners of the
   * jaw boxes. Bigger = softer, more feminine; smaller = blockier, more
   * masculine.
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
   * Smooth-min radius between the gonial-level (upper) jaw box and the
   * mental-level (lower) chin box. Bigger = more tapered/melted; smaller =
   * a more visible "two-block" seam.
   */
  kTaper: number;

  // ---- blending ----
  /**
   * Smooth-min radius between cranium and jaw — the "k_chin" knob.
   * Bigger = a more melted, infant-like transition; smaller = a sharper
   * jaw-line. Roughly 8-12% of the cranium radius works for an adult.
   */
  kChin: number;
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

  // Jaw: ~78% of cranium cut width at gonial, ~55% at chin → clear taper.
  // Positioned forward enough that the chin projects past the cranium's
  // mid-line — otherwise the jaw reads as tucked under the cranium.
  bigonialWidth: 0.66,    // ~0.78 * (2 * sideOffset) — adult gonial spread
  mentalWidth: 0.32,      // ~0.48 * bigonial — narrow chin pad for a clear taper
  ramusHeight: 0.42,      // ~35% of total head height
  jawDepth: 0.72,         // a hair deeper than cranium width, less than cranium depth
  chinDepth: 0.46,        // chin pad is shorter front-to-back than the ramus
  gonialAngle: 0.09,      // chamfer radius — rounds the jaw box corners
  jawYOffset: -0.46,      // sits below the cranium center
  jawZOffset: 0.10,       // forward shift so chin clears the face plane
  kTaper: 0.20,           // smooth loft between gonial and mental cross-sections

  kChin: 0.10,            // ~20% of cranium half-width — softens cranium→gonial shoulder
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
 *   2. Jaw = two stacked rounded boxes — a wider upper box at the gonial
 *      level (`bigonialWidth`) and a narrower lower box at the mental
 *      level (`mentalWidth`), `smin`'d together with radius `kTaper`. The
 *      smooth blend interpolates the cross-section from gonial to mental
 *      width, producing the characteristic tapered mandible that comes to
 *      a chin point instead of a flat box bottom. Bridgman 1920 §"The
 *      Lower Jaw" treats the mental protuberance as a distinct plane
 *      below the side-of-jaw; two stacked SDFs is the SDF-native version
 *      of that decomposition.
 *   3. Head = cranium `smin` jaw, with blend radius `kChin`. The smooth-min
 *      adds material along the transition, which is what a real
 *      sternocleidomastoid / masseter mass would do under the skin.
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

  // ---- jaw: stacked tapered boxes (gonial wide → mental narrow) ----
  // Both boxes are rounded; the chamfer radius `gonialAngle` rounds corners
  // (sphere-swept = Minkowski with a sphere). The two boxes share the same
  // ramus-height span but are placed at the same center; the upper sets the
  // gonial silhouette, the lower sets the chin point. `smin`'ing them
  // creates a smooth taper: the chin pad is narrower in X (mental width)
  // and shallower in Z (chin depth) than the gonial-level box.
  const r = P.gonialAngle;
  const jawCenter: Vec3 = [0, P.jawYOffset, P.jawZOffset];

  // The two boxes overlap in Y across the whole ramus, with their centers
  // separated vertically by a fraction of the ramus height. This overlap
  // is what lets `smin` *loft* between cross-sections: in the overlap band
  // the smin blends between the wider gonial profile and the narrower
  // mental profile, producing a continuous taper instead of two visibly
  // stacked blocks. Each box covers ~75% of the ramus height.
  const boxHalfH = (P.ramusHeight * 0.75) / 2;
  const ySeparation = P.ramusHeight * 0.25;   // centers split by 25% of ramus

  // Upper (gonial) box: full bigonial width, full jaw depth, centered above
  // jawCenter so its top edge sits at the top of the ramus block.
  const upperCenter: Vec3 = [
    jawCenter[0],
    jawCenter[1] + ySeparation / 2,
    jawCenter[2],
  ];
  const upperHalfDims: Vec3 = [
    Math.max(P.bigonialWidth / 2 - r, 0),
    Math.max(boxHalfH - r, 0),
    Math.max(P.jawDepth / 2 - r, 0),
  ];
  const dUpperJaw = box(p, upperCenter, upperHalfDims) - r;

  // Lower (mental / chin pad) box: narrow mental width, shallower depth,
  // centered below jawCenter. Shifted slightly forward so a profile view
  // shows the chin projecting in front of the mandibular body's mid-line
  // (the real mental protuberance sits a few % of head height forward).
  const chinForwardShift = 0.03;
  const lowerCenter: Vec3 = [
    jawCenter[0],
    jawCenter[1] - ySeparation / 2,
    jawCenter[2] + chinForwardShift,
  ];
  const lowerHalfDims: Vec3 = [
    Math.max(P.mentalWidth / 2 - r, 0),
    Math.max(boxHalfH - r, 0),
    Math.max(P.chinDepth / 2 - r, 0),
  ];
  const dLowerJaw = box(p, lowerCenter, lowerHalfDims) - r;

  // Taper the two together. The smin acts like a "loft" between two
  // cross-sections, producing a trapezoidal silhouette in front view
  // (bigonial above, mental below) and a chin point at the bottom.
  const dJaw = smin(dUpperJaw, dLowerJaw, P.kTaper);

  // ---- union ----
  // Smooth-min the cranium and jaw together. The blend lives in the gonial /
  // mandibular-angle region, which is exactly where a real head transitions
  // from cranial vault to mandible via the masseter mass.
  return smin(dCranium, dJaw, P.kChin);
};

// Re-export for callers who only want this module.
export type { Vec3 };
