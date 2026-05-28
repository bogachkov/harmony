// 2D convex hull + capsule expansion for the 3D clump-volume pipeline.
//
// Stage E of Lloyd pass 1 §2: given a set of projected clump centrelines with
// per-point radii (the output of project.projectVolume), produce the merged
// silhouette polygon that the renderer fills as the hair mass.
//
// Pipeline:
//
//   Curve(kind='clump-volume') with radiusProfile
//     ─▶ project.projectVolume  ─▶ Capsule[] (2D segments + per-endpoint radii)
//     ─▶ hull.expandCapsule    ─▶ Vec2[] (capsule outline, ~16 verts per cap)
//     ─▶ hull.convexHull2D     ─▶ Vec2[] (merged silhouette polygon)
//
// The hull is the v1 merger per Lloyd §7's tech-debt note: collapses
// concavities. Alpha-shape is the honest fix; deferred to a follow-up sprint
// when it bites.

import type { Vec2 } from '../math/vec3.ts';

// One 2D capsule = line segment a→b with radii ra at a and rb at b. Capsules
// approximate the projected clump-volume by walking the centreline pairwise
// and stamping a circle (radius interpolated) at each step. Capsule.expand
// turns this into a polygon we can union via convex hull.
export type Capsule2D = {
  a: Vec2;
  b: Vec2;
  ra: number;
  rb: number;
};

// Sample the outline of a 2D capsule (line segment a→b, end-radii ra/rb) as a
// closed polygon. Returns roughly `segs` total vertices.
//
// Geometry: capsule = rectangle(perpendicular by lerped radius) capped by
// half-circles at each end. For a hull union the rectangle + endpoint
// half-circles is plenty; we don't need a smooth tube.
export const expandCapsule = (cap: Capsule2D, segs = 12): Vec2[] => {
  const [ax, ay] = cap.a;
  const [bx, by] = cap.b;
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);

  // Degenerate (zero-length capsule) — emit a circle at point a with the
  // larger of the two radii.
  if (len < 1e-9) {
    const r = Math.max(cap.ra, cap.rb);
    if (r <= 0) return [];
    const pts: Vec2[] = [];
    for (let i = 0; i < segs; i++) {
      const t = (i / segs) * Math.PI * 2;
      pts.push([ax + Math.cos(t) * r, ay + Math.sin(t) * r]);
    }
    return pts;
  }

  // Unit tangent + perpendicular.
  const tx = dx / len;
  const ty = dy / len;
  const nx = -ty;
  const ny = tx;

  // Half-segments for each endpoint arc. We bias to even counts so the
  // capsule body has clean left/right sides.
  const halfSegs = Math.max(2, Math.floor(segs / 2));

  const out: Vec2[] = [];
  // Endpoint A: half-circle on the "back" side (opposite of b), swept from
  // perpendicular (+n) around the back to perpendicular (-n).
  for (let i = 0; i <= halfSegs; i++) {
    const theta = Math.PI / 2 + (i / halfSegs) * Math.PI;
    const cx = Math.cos(theta);
    const cy = Math.sin(theta);
    // Local frame: x = tangent (toward b), y = +n. Half-circle on back side:
    // arc goes (n) → (-t) → (-n). Coordinates in world: tx*cx*(-?)...
    // Simpler: parameterise angle relative to tangent.
    // arc starts at +n (theta=0), goes through -t (theta=PI/2), ends at -n (theta=PI).
    // Map: outward direction d = cos(theta)*(-tangent) + sin(theta)*n_or_minusn.
    // We'll sweep cleanly using a direct angle from +n through -t back to -n:
    const phi = (i / halfSegs) * Math.PI;
    const ox = nx * Math.cos(phi) + (-tx) * Math.sin(phi);
    const oy = ny * Math.cos(phi) + (-ty) * Math.sin(phi);
    out.push([ax + ox * cap.ra, ay + oy * cap.ra]);
    // Note: we computed both via theta and phi just for clarity above; phi is
    // the one we actually use.
    void cx; void cy;
  }
  // Endpoint B: half-circle on the "front" side (opposite of a). Sweep from
  // (-n) through (+t) back to (+n).
  for (let i = 0; i <= halfSegs; i++) {
    const phi = (i / halfSegs) * Math.PI;
    const ox = -nx * Math.cos(phi) + tx * Math.sin(phi);
    const oy = -ny * Math.cos(phi) + ty * Math.sin(phi);
    out.push([bx + ox * cap.rb, by + oy * cap.rb]);
  }
  return out;
};

// 2D convex hull via Andrew's monotone-chain. O(n log n). Returns the hull
// vertices in counter-clockwise order, no repeated start/end vertex.
//
// Input: any point cloud (possibly with duplicates). Output: convex hull
// polygon. If input has fewer than 3 unique points, returns the unique
// points as-is (so 1 or 2 inputs degrade gracefully).
//
// Reference: Andrew 1979, "Another Efficient Algorithm for Convex Hulls in
// Two Dimensions." Standard textbook implementation.
export const convexHull2D = (points: Vec2[]): Vec2[] => {
  if (points.length === 0) return [];
  // Sort by x (then y) and dedupe near-coincident points.
  const sorted = points
    .slice()
    .sort((p, q) => (p[0] === q[0] ? p[1] - q[1] : p[0] - q[0]));
  // De-dup adjacent (post-sort) points within an epsilon.
  const eps = 1e-9;
  const uniq: Vec2[] = [];
  for (const p of sorted) {
    const last = uniq[uniq.length - 1];
    if (!last || Math.abs(last[0] - p[0]) > eps || Math.abs(last[1] - p[1]) > eps) {
      uniq.push(p);
    }
  }
  if (uniq.length < 3) return uniq;

  // Cross product (p,q,r): >0 => CCW turn (left turn).
  const cross = (o: Vec2, a: Vec2, b: Vec2): number =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  // Lower hull.
  const lower: Vec2[] = [];
  for (const p of uniq) {
    while (lower.length >= 2 && cross(lower[lower.length - 2] as Vec2, lower[lower.length - 1] as Vec2, p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  // Upper hull.
  const upper: Vec2[] = [];
  for (let i = uniq.length - 1; i >= 0; i--) {
    const p = uniq[i] as Vec2;
    while (upper.length >= 2 && cross(upper[upper.length - 2] as Vec2, upper[upper.length - 1] as Vec2, p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  // Concatenate, dropping the duplicate endpoints.
  lower.pop();
  upper.pop();
  return lower.concat(upper);
};

// Merge a list of capsules into a single convex-hull silhouette polygon.
// Convenience over (expandCapsule × N) → (convexHull2D).
//
// Per Lloyd §7: convex hull is the v1 merger. It collapses concavities (a
// parting gap between two clump groups will disappear). Alpha-shape is the
// deferred fix; do not implement here.
export const mergeCapsulesToHull = (capsules: Capsule2D[], segsPerCapsule = 12): Vec2[] => {
  if (capsules.length === 0) return [];
  const all: Vec2[] = [];
  for (const c of capsules) {
    const poly = expandCapsule(c, segsPerCapsule);
    for (const p of poly) all.push(p);
  }
  return convexHull2D(all);
};
