// SDF primitives, operators, and a small 3D math kit.
//
// Conventions:
//   - All points / vectors are plain readonly [x, y, z] tuples (Vec3).
//   - Distances are signed: f(p) < 0 inside the surface, f(p) > 0 outside,
//     f(p) == 0 on the surface. Magnitude is (approximately) the Euclidean
//     distance to the nearest surface point. "Bound" SDFs (box, cylinder)
//     are exact on the outside and a conservative under-estimate inside —
//     fine for sphere-tracing in either direction.
//   - All functions are pure. No globals, no mutation.

import type { Vec3 } from '../math/vec3.ts';
import { sub, dot, length, normalize, scale } from '../math/vec3.ts';

// ---------- small helpers ----------

const clamp = (x: number, lo: number, hi: number): number =>
  x < lo ? lo : x > hi ? hi : x;

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

const max3 = (a: number, b: number, c: number): number =>
  a > b ? (a > c ? a : c) : b > c ? b : c;

// ---------- primitives ----------
// Each primitive evaluates an SDF at world-space point `p`. To place a primitive
// somewhere other than the origin, callers can either pass an explicit center
// (where supported) or pre-translate `p` via `translate(p, -center)`.

/** Signed distance to a sphere of `radius` centered at `center`. */
export const sphere = (p: Vec3, center: Vec3, radius: number): number =>
  length(sub(p, center)) - radius;

/**
 * Signed distance to an axis-aligned box centered at `center` with
 * half-extents `halfDims`. Exact outside, conservative inside.
 */
export const box = (p: Vec3, center: Vec3, halfDims: Vec3): number => {
  const d: Vec3 = [
    Math.abs(p[0] - center[0]) - halfDims[0],
    Math.abs(p[1] - center[1]) - halfDims[1],
    Math.abs(p[2] - center[2]) - halfDims[2],
  ];
  const outside = Math.hypot(Math.max(d[0], 0), Math.max(d[1], 0), Math.max(d[2], 0));
  const inside = Math.min(max3(d[0], d[1], d[2]), 0);
  return outside + inside;
};

/**
 * Signed distance to a plane with unit `normal` and signed offset `distance`
 * (so the plane is {x : dot(x, normal) == distance}). Positive side is +normal.
 */
export const plane = (p: Vec3, normal: Vec3, distance: number): number =>
  dot(p, normal) - distance;

/**
 * Signed distance to an axis-aligned ellipsoid with semi-axes `radii`,
 * centered at `center`. This is the standard Inigo Quilez approximation:
 *
 *   k0 = |p/r|, k1 = |p/r^2|, d = k0 * (k0 - 1) / k1
 *
 * It's not a true Euclidean distance (no closed form exists for the
 * ellipsoid) but it's a Lipschitz-1 bound suitable for sphere-tracing.
 */
export const ellipsoid = (p: Vec3, center: Vec3, radii: Vec3): number => {
  const q: Vec3 = [p[0] - center[0], p[1] - center[1], p[2] - center[2]];
  const k0 = Math.hypot(q[0] / radii[0], q[1] / radii[1], q[2] / radii[2]);
  const k1 = Math.hypot(
    q[0] / (radii[0] * radii[0]),
    q[1] / (radii[1] * radii[1]),
    q[2] / (radii[2] * radii[2]),
  );
  if (k1 === 0) return -Math.min(radii[0], radii[1], radii[2]);
  return (k0 * (k0 - 1)) / k1;
};

/**
 * Signed distance to a Y-axis-aligned tapered box (frustum-of-box / "wedge")
 * centered at `center`. Cross-section is a rectangle of half-extents
 * (halfX, halfZ) that linearly interpolates from `topHalf` at +halfY to
 * `bottomHalf` at -halfY. Used for the mandible: a single primitive that
 * narrows from bigonial width at the top to mental width at the bottom,
 * with the chin point falling out of the math instead of being stacked.
 *
 * Implementation: at the query point's Y, find the local cross-section
 * half-extents by lerp; then evaluate the standard 2D box distance in (X,Z)
 * and combine with the axial (Y) distance using the same outside/inside
 * split as `box`. Treating the tapered side walls as locally vertical is
 * a Lipschitz over-estimate (the true distance to a slanted face is a hair
 * smaller), but it's a conservative under-estimate of how far you can step,
 * which is exactly what sphere-tracing needs. The taper is gentle enough
 * here (<25% over the box height) that the over-estimate is invisible.
 */
export const taperedBox = (
  p: Vec3,
  center: Vec3,
  halfY: number,
  topHalf: { x: number; z: number },
  bottomHalf: { x: number; z: number },
): number => {
  const qy = p[1] - center[1];
  // t = 0 at bottom, 1 at top
  const t = clamp((qy + halfY) / (2 * halfY), 0, 1);
  const hx = mix(bottomHalf.x, topHalf.x, t);
  const hz = mix(bottomHalf.z, topHalf.z, t);
  const dx = Math.abs(p[0] - center[0]) - hx;
  const dz = Math.abs(p[2] - center[2]) - hz;
  const dy = Math.abs(qy) - halfY;
  // 2D box distance in (x,z) plane.
  const outsideXZ = Math.hypot(Math.max(dx, 0), Math.max(dz, 0));
  const insideXZ = Math.min(Math.max(dx, dz), 0);
  const dXZ = outsideXZ + insideXZ;
  // Combine with axial (Y) distance, same outside/inside split as `box`.
  const outside = Math.hypot(Math.max(dXZ, 0), Math.max(dy, 0));
  const inside = Math.min(Math.max(dXZ, dy), 0);
  return outside + inside;
};

/**
 * Signed distance to a finite cylinder with the given axis direction (unit),
 * radius, and half-height. Centered at the origin; pre-translate `p` if you
 * want it elsewhere. Standard split: radial distance and axial distance,
 * combined like a 2D box's outside/inside split.
 */
export const cylinder = (p: Vec3, axis: Vec3, radius: number, height: number): number => {
  const a = normalize(axis);
  const along = dot(p, a);
  // Radial component = p projected off the axis.
  const radial: Vec3 = [p[0] - a[0] * along, p[1] - a[1] * along, p[2] - a[2] * along];
  const dRadial = length(radial) - radius;
  const dAxial = Math.abs(along) - height;
  const outside = Math.hypot(Math.max(dRadial, 0), Math.max(dAxial, 0));
  const inside = Math.min(Math.max(dRadial, dAxial), 0);
  return outside + inside;
};

// ---------- boolean operators ----------

/** Hard union of two SDFs (sharp seam). */
export const min = (a: number, b: number): number => (a < b ? a : b);

/** Hard intersection of two SDFs (sharp seam). */
export const max = (a: number, b: number): number => (a > b ? a : b);

/** Subtraction: a minus b (carve b out of a). */
export const subtract = (a: number, b: number): number => max(a, -b);

/**
 * Smooth union ("smin"). Polynomial blend; `k` is the blend radius in world
 * units — bigger k = smoother, more material added near the seam. Reduces
 * to `min(a, b)` as k -> 0. Reference: Inigo Quilez, "smooth min" article.
 */
export const smin = (a: number, b: number, k: number): number => {
  if (k <= 0) return min(a, b);
  const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1);
  return mix(b, a, h) - k * h * (1 - h);
};

/** Smooth intersection. Mirror of `smin`. */
export const smax = (a: number, b: number, k: number): number => {
  if (k <= 0) return max(a, b);
  const h = clamp(0.5 - (0.5 * (b - a)) / k, 0, 1);
  return mix(b, a, h) + k * h * (1 - h);
};

/** Smooth subtraction: smooth `a` minus `b`. */
export const smoothSubtract = (a: number, b: number, k: number): number =>
  smax(a, -b, k);

// ---------- 3D math helpers ----------
// These operate on points (rather than SDFs). To "transform" an SDF, you
// transform the *input point* by the inverse of the transform you want to
// apply to the shape. E.g. to translate a sphere by +offset, evaluate
// the sphere SDF at translate(p, -offset).

/** Translate a point by `offset`. */
export const translate = (p: Vec3, offset: Vec3): Vec3 => [
  p[0] + offset[0],
  p[1] + offset[1],
  p[2] + offset[2],
];

/**
 * Rotate a point by `angle` radians around the unit `axis` (right-handed,
 * so positive angle = counter-clockwise looking down the axis toward origin).
 * Implemented via Rodrigues' rotation formula:
 *
 *   p' = p cos(t) + (k x p) sin(t) + k (k . p) (1 - cos(t))
 *
 * The axis is normalized defensively; passing a non-unit axis is fine.
 */
export const rotate = (p: Vec3, axis: Vec3, angle: number): Vec3 => {
  const k = normalize(axis);
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const kDotP = dot(k, p);
  // k x p
  const cross: Vec3 = [
    k[1] * p[2] - k[2] * p[1],
    k[2] * p[0] - k[0] * p[2],
    k[0] * p[1] - k[1] * p[0],
  ];
  const term1 = scale(p, c);
  const term2 = scale(cross, s);
  const term3 = scale(k, kDotP * (1 - c));
  return [
    term1[0] + term2[0] + term3[0],
    term1[1] + term2[1] + term3[1],
    term1[2] + term2[2] + term3[2],
  ];
};
