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
  sphere, box, plane,
  max, smin,
} from './primitives.ts';

export type LoomisParams = {
  // ---- cranium ("the ball") ----
  /** Sphere radius of the cranium. */
  radius: number;
  /**
   * How far the side-plane slices cut into the sphere, measured from the
   * cranium center along +X / -X. Loomis' classic ratio puts the cut at
   * roughly 7/8 of the radius — flat enough to read as a head, not so flat
   * the dome looks pinched.
   */
  sideOffset: number;

  // ---- jaw ("the block below") ----
  /** Bigonial width: distance between the gonial angles (jaw corners), full width. */
  bigonialWidth: number;
  /** Vertical extent of the jaw block (cranium-bottom to chin tip, roughly). */
  ramusHeight: number;
  /** Front-to-back depth of the jaw block. */
  jawDepth: number;
  /**
   * Chin chamfer / "gonial rounding" — how much to round the corners of the
   * jaw box. Bigger = softer, more feminine; smaller = blockier, more masculine.
   */
  gonialAngle: number;
  /** Vertical offset of the jaw block center, relative to cranium center. Negative = below. */
  jawYOffset: number;
  /**
   * Z-shift of the jaw forward (positive) or back (negative) relative to
   * the cranium center. A small forward shift gives a slight chin projection.
   */
  jawZOffset: number;

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
  radius: 0.50,
  sideOffset: 0.42,         // ~0.84 * radius — Loomis' "ball with flat sides"

  bigonialWidth: 0.62,      // a touch wider than the cut-cranium width
  ramusHeight: 0.36,
  jawDepth: 0.62,
  gonialAngle: 0.12,        // chamfer radius — rounds the jaw box corners
  jawYOffset: -0.42,        // sits below the cranium center
  jawZOffset: 0.02,         // a hair forward (chin projection)

  kChin: 0.10,              // ~20% of radius for a believable adult blend
};

/**
 * Loomis head SDF.
 *
 * Construction:
 *   1. Cranium = sphere ∩ (left side plane) ∩ (right side plane).
 *      Intersection of SDFs is `max`. The side planes have outward normals
 *      pointing along ±X; `plane(p, n, d)` returns dot(p,n) - d, which is
 *      negative on the "kept" inside side, so taking the max with the
 *      sphere clips both flanks.
 *   2. Jaw = an axis-aligned box, optionally rounded by `gonialAngle`. A
 *      rounded box SDF subtracts the chamfer radius after the box eval,
 *      which produces a sphere-swept box (Minkowski sum with a sphere).
 *   3. Head = cranium `smin` jaw, with blend radius `kChin`. The smooth-min
 *      adds material along the transition, which is what a real
 *      sternocleidomastoid / masseter mass would do under the skin.
 */
export const loomisHead = (p: Vec3, params: Partial<LoomisParams> = {}): number => {
  const P: LoomisParams = { ...DEFAULT_LOOMIS, ...params };

  // ---- cranium ----
  // Sphere at origin, then intersect with two half-spaces: x <= +sideOffset
  // and x >= -sideOffset. As SDFs that's plane(+X, +sideOffset) and
  // plane(-X, +sideOffset) — both have negative values on the "inside" side.
  const dSphere = sphere(p, [0, 0, 0], P.radius);
  const dRight = plane(p, [1, 0, 0], P.sideOffset);   // x - sideOffset
  const dLeft = plane(p, [-1, 0, 0], P.sideOffset);   // -x - sideOffset
  const dCranium = max(max(dSphere, dRight), dLeft);

  // ---- jaw ----
  // Rounded box: shrink the half-extents by the chamfer radius, then re-expand
  // outward by subtracting that radius from the resulting distance. The
  // resulting volume has the same outer extent as the original box but with
  // rounded edges & corners of curvature `gonialAngle`.
  const r = P.gonialAngle;
  const halfDims: Vec3 = [
    Math.max(P.bigonialWidth / 2 - r, 0),
    Math.max(P.ramusHeight / 2 - r, 0),
    Math.max(P.jawDepth / 2 - r, 0),
  ];
  const jawCenter: Vec3 = [0, P.jawYOffset, P.jawZOffset];
  const dJawBox = box(p, jawCenter, halfDims);
  const dJaw = dJawBox - r;

  // ---- union ----
  // Smooth-min the cranium and jaw together. The blend lives in the gonial /
  // mandibular-angle region, which is exactly where a real head transitions
  // from cranial vault to mandible via the masseter mass.
  return smin(dCranium, dJaw, P.kChin);
};

// Re-export for callers who only want this module.
export type { Vec3 };
