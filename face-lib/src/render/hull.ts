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
// honest fix, landed in this file as `alphaShape2D` / `mergeCapsulesToAlpha`
// (Lloyd pass 2 §4 pulled it into Q1-W2). Convex stays as a selectable mode
// per the mixture-not-survival rule — do not delete this function.
export const mergeCapsulesToHull = (capsules: Capsule2D[], segsPerCapsule = 12): Vec2[] => {
  if (capsules.length === 0) return [];
  const all: Vec2[] = [];
  for (const c of capsules) {
    const poly = expandCapsule(c, segsPerCapsule);
    for (const p of poly) all.push(p);
  }
  return convexHull2D(all);
};

// ---------------------------------------------------------------------------
// Alpha-shape (Lloyd pass 1 §7 / pass 2 §4)
// ---------------------------------------------------------------------------
//
// The alpha-shape of a finite point set S is the boundary of the α-complex —
// the subset of the Delaunay triangulation whose Delaunay triangles have
// circumradius ≤ α. Edelsbrunner-Kirkpatrick-Seidel 1983.
//
// Intuition: imagine rolling a disc of radius α over the point cloud from the
// outside; the disc carves out concavities the convex hull would gloss over.
// α → ∞ recovers the convex hull. α → 0 picks every point as its own island.
//
// The reason this is the right merger for the hull-merge stage (vs convex):
// the convex hull of `coilyHalo`'s clumps is a hexagon; the alpha-shape with
// α ≈ inter-clump spacing carves a roughly-radial concave halo. The convex
// hull of `longCurtain`'s side clumps with the centre parting between them
// reads as one trapezoid (nun's wimple); the alpha-shape preserves the gap.
//
// Implementation plan:
//   1. Build Delaunay triangulation via incremental Bowyer-Watson.
//   2. Filter triangles by circumradius ≤ α.
//   3. Extract boundary edges (edges appearing in exactly one α-triangle).
//   4. Stitch boundary edges into one or more closed polygons; return the
//      largest (longest perimeter) connected component as the hull polygon.
//      We render single fills, so multi-component output collapses into the
//      dominant silhouette (small islands from a stray clump get dropped).
//
// The auto-tune: α := medianNearestNeighbour(points) × ALPHA_FACTOR. See
// ALPHA_FACTOR's defining comment for why this constant.

// ALPHA_FACTOR — multiplier on the median nearest-neighbour spacing to set α.
//
// Calibration: tuned by re-rendering the three W1 fixtures (shortBob is flat
// → no hull merge → not relevant; longCurtain and coilyHalo are the real
// probes) until the concavity reads honestly without over-fragmenting.
//
//   - At 1.0× median NN: alpha-shape fragments into per-clump islands. The
//     coilyHalo halo turns into 14 small lobes instead of one ringed mass.
//     Too tight: α ≈ spacing means inter-clump edges fail the circumcircle
//     test and get dropped.
//   - At 1.5× (Lloyd's "defensible starting guess" in §7): coilyHalo reads
//     as a roughly-radial halo with edge texture from clump radii variance.
//     longCurtain's centre parting gap is preserved (the hullGroup 'left' /
//     'right' / 'front' split now matters — each side gets its own α-shape).
//   - At 2.5×+: alpha-shape collapses toward convex hull. Parting gaps
//     start filling in. The wimple comes back at ≈3.5×.
//
// 1.5× is Lloyd's number and it holds up on the fixtures. The geometry is
// also self-consistent: when capsule expansion contributes ~16 verts around
// each capsule body, the median NN distance is dominated by INTRA-capsule
// vertex spacing (small, ~capsule-radius / 4), not INTER-capsule spacing.
// Empirically that intra spacing × 1.5 lands at "≈ capsule-radius worth of
// edge tolerance" which is exactly what we want — capsule outlines glue
// to themselves and to adjacent capsules within one capsule-radius, but
// gaps between clump groups (centreU 'left' vs 'front' for longCurtain)
// stay separate because each group has its OWN merger call.
//
// If Lloyd wants this exposed as a knob later (e.g. for the W3 coily pack
// to dial alpha tighter for a more textured halo edge), it's one parameter
// added to the recipe surface, not an architectural change. Keeping it
// internal for v1 per the brief's "alpha auto-tuned from clump spacing —
// no hand-tuned knob in v1."
const ALPHA_FACTOR = 1.5;

// Median nearest-neighbour distance — input to the alpha-tune. O(n²) brute
// force; for the ~hundreds-of-points-per-hullGroup workload this is fine
// (alpha-shape extraction dominates). If we ever hit thousands of points
// per group, swap this for a kd-tree.
const medianNearestNeighbour = (points: Vec2[]): number => {
  const n = points.length;
  if (n < 2) return 0;
  const dists: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = points[i] as Vec2;
    let best = Infinity;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const q = points[j] as Vec2;
      const dx = p[0] - q[0];
      const dy = p[1] - q[1];
      const d2 = dx * dx + dy * dy;
      if (d2 < best) best = d2;
    }
    if (isFinite(best)) dists.push(Math.sqrt(best));
  }
  if (dists.length === 0) return 0;
  dists.sort((a, b) => a - b);
  const mid = dists.length >> 1;
  return dists.length % 2 ? (dists[mid] as number)
    : ((dists[mid - 1] as number) + (dists[mid] as number)) / 2;
};

// Triangle in the Delaunay triangulation. Indices into the point array.
// `super` is true for triangles touching the super-triangle (filtered out
// at the end of Bowyer-Watson before any α-test).
type Tri = { a: number; b: number; c: number };

// Circumcircle (cx, cy, r²) of triangle p0/p1/p2. Returns null when the
// triangle is degenerate (collinear). Standard formula via determinants.
const circumcircle = (p0: Vec2, p1: Vec2, p2: Vec2): { cx: number; cy: number; r2: number } | null => {
  const ax = p0[0]; const ay = p0[1];
  const bx = p1[0]; const by = p1[1];
  const cx = p2[0]; const cy = p2[1];
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-12) return null;
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  const dx = ux - ax;
  const dy = uy - ay;
  return { cx: ux, cy: uy, r2: dx * dx + dy * dy };
};

// Bowyer-Watson incremental Delaunay triangulation. Returns the triangle
// list (indices into the input point array; super-triangle vertices excluded).
//
// Standard textbook implementation: start with one giant super-triangle
// containing all points, insert points one at a time, for each insertion
// find the triangles whose circumcircle contains the new point, delete
// them, and re-triangulate the resulting hole as a fan from the new point.
//
// Complexity: O(n log n) expected, O(n²) worst case. Adequate for the
// hundreds-of-points-per-hullGroup workload.
const delaunayTriangulate = (points: Vec2[]): Tri[] => {
  const n = points.length;
  if (n < 3) return [];

  // Super-triangle big enough to contain all input points (with generous margin).
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;
  const dMax = Math.max(dx, dy) * 20;  // 20× margin — circumcircles must enclose any internal point
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const pts: Vec2[] = points.slice();
  // Super-triangle vertices (appended; indices n, n+1, n+2).
  pts.push([midX - dMax, midY - dMax]);
  pts.push([midX + dMax, midY - dMax]);
  pts.push([midX,        midY + dMax]);

  // Initial triangulation = super-triangle.
  let triangles: Tri[] = [{ a: n, b: n + 1, c: n + 2 }];

  // Insert each input point one at a time.
  for (let i = 0; i < n; i++) {
    const p = pts[i] as Vec2;
    // Find all triangles whose circumcircle contains p. Collect their edges
    // (each edge with multiplicity); edges that appear once form the cavity
    // boundary, edges that appear twice are internal and discarded.
    const bad: Tri[] = [];
    const keep: Tri[] = [];
    for (const t of triangles) {
      const cc = circumcircle(pts[t.a] as Vec2, pts[t.b] as Vec2, pts[t.c] as Vec2);
      if (!cc) { keep.push(t); continue; }
      const ddx = p[0] - cc.cx;
      const ddy = p[1] - cc.cy;
      if (ddx * ddx + ddy * ddy < cc.r2 - 1e-12) bad.push(t);
      else keep.push(t);
    }
    // Build polygonal hole from bad-triangle edges.
    const edgeCount = new Map<string, { a: number; b: number; count: number }>();
    const addEdge = (a: number, b: number): void => {
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      const e = edgeCount.get(key);
      if (e) e.count++;
      else edgeCount.set(key, { a, b, count: 1 });
    };
    for (const t of bad) {
      addEdge(t.a, t.b);
      addEdge(t.b, t.c);
      addEdge(t.c, t.a);
    }
    // Edges with count 1 are the hole boundary; fan triangulate from p (index i).
    triangles = keep;
    for (const e of edgeCount.values()) {
      if (e.count === 1) triangles.push({ a: e.a, b: e.b, c: i });
    }
  }

  // Drop any triangle touching the super-triangle vertices.
  return triangles.filter((t) => t.a < n && t.b < n && t.c < n);
};

// Stitch a list of undirected edges (a, b) into closed polygons. Each edge
// must be used exactly once. Returns one polygon (as Vec2[]) per connected
// chain; broken / non-manifold cases return what stitched cleanly and the
// rest is dropped.
const stitchEdgesToPolygons = (edges: Array<{ a: number; b: number }>, points: Vec2[]): Vec2[][] => {
  // Build adjacency: vertex idx → list of neighbours via still-unused edges.
  const adj = new Map<number, number[]>();
  for (const e of edges) {
    const ax = adj.get(e.a) ?? [];
    const bx = adj.get(e.b) ?? [];
    ax.push(e.b);
    bx.push(e.a);
    adj.set(e.a, ax);
    adj.set(e.b, bx);
  }
  const polys: Vec2[][] = [];
  // Walk: pick any vertex with unused neighbours, walk neighbour → neighbour
  // popping each step, until we close a loop or dead-end.
  const pop = (from: number, to: number): void => {
    const a = adj.get(from);
    if (a) {
      const idx = a.indexOf(to);
      if (idx >= 0) a.splice(idx, 1);
      if (a.length === 0) adj.delete(from);
    }
    const b = adj.get(to);
    if (b) {
      const idx = b.indexOf(from);
      if (idx >= 0) b.splice(idx, 1);
      if (b.length === 0) adj.delete(to);
    }
  };
  while (adj.size > 0) {
    const start = adj.keys().next().value as number;
    const poly: number[] = [start];
    let cur = start;
    while (true) {
      const nbrs = adj.get(cur);
      if (!nbrs || nbrs.length === 0) break;
      const next = nbrs[0] as number;
      pop(cur, next);
      if (next === start) {
        // Closed polygon.
        break;
      }
      poly.push(next);
      cur = next;
    }
    if (poly.length >= 3) polys.push(poly.map((i) => points[i] as Vec2));
  }
  return polys;
};

// Approximate polygon perimeter (used to pick the largest connected boundary
// component — see alphaShape2D's return).
const polyPerimeter = (poly: Vec2[]): number => {
  let len = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i] as Vec2;
    const q = poly[(i + 1) % poly.length] as Vec2;
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    len += Math.hypot(dx, dy);
  }
  return len;
};

// Grid-snap dedup. Snaps each input point to a grid of `cell` resolution and
// drops near-duplicates. Without this, capsule-outline expansion produces
// dense vertex clusters (overlapping capsules → many near-coincident verts)
// that quadratic-Bowyer-Watson chokes on. Cell size is set to a small
// fraction of the median spacing so we keep enough resolution to capture
// the silhouette but cap point density at O(area / cell²).
const gridDedup = (points: Vec2[], cell: number): Vec2[] => {
  if (cell <= 0 || points.length === 0) return points;
  const seen = new Map<string, Vec2>();
  for (const p of points) {
    const i = Math.round(p[0] / cell);
    const j = Math.round(p[1] / cell);
    const key = `${i}|${j}`;
    if (!seen.has(key)) seen.set(key, [i * cell, j * cell]);
  }
  return Array.from(seen.values());
};

// Compute the alpha-shape boundary polygon of a 2D point cloud.
//
// alpha: the radius threshold for the alpha-complex. If undefined / ≤ 0,
// auto-tunes from the median nearest-neighbour spacing × ALPHA_FACTOR. The
// auto-tune is the production path; callers that want a hand-tuned alpha
// (e.g. for future per-recipe overrides) pass it explicitly.
//
// Returns the LARGEST connected boundary polygon (by perimeter). If the
// alpha-complex is disconnected (multiple islands from a stray clump), small
// islands are dropped — the renderer fills a single hair-mass per group,
// not a multi-shape. If the alpha-complex is empty (alpha too small for the
// input density), returns []; the caller may fall back to convexHull2D.
export const alphaShape2D = (points: Vec2[], alpha?: number): Vec2[] => {
  if (points.length < 3) return points.slice();
  // Pre-dedup at a coarse grid relative to the bounding box span. Capsule-
  // outline expansion produces enormous point clouds (the longCurtain
  // 'left' hullGroup has ~4500 capsules → ~72k outline verts) that would
  // otherwise blow up Bowyer-Watson's O(n²)-per-insertion cost. The coarse
  // pre-dedup caps point density at O(POINTS_PER_AXIS²) regardless of
  // input, keeping triangulation tractable while preserving silhouette
  // fidelity (span/150 resolution ≈ ~1.3% of head height ≈ sub-pixel at
  // the typical 640px render — well below the smallest visible feature).
  //
  // The coarse pre-dedup also produces a CLEAN NN distribution for the
  // alpha-tune: the raw cloud's median NN is dominated by intra-cluster
  // near-zero distances from overlapping capsule outlines, not the
  // semantic inter-cluster spacing the auto-tune wants to measure. After
  // grid-dedup, the median NN ≈ grid-cell-size for any region the cloud
  // fully covers, which is exactly the "local capsule body" scale.
  const POINTS_PER_AXIS = 150;
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const coarseCell = span / POINTS_PER_AXIS;
  const deduped = gridDedup(points, coarseCell);
  const rawAlpha = alpha && alpha > 0 ? alpha : medianNearestNeighbour(deduped) * ALPHA_FACTOR;
  if (rawAlpha <= 0) return convexHull2D(points);
  const a = rawAlpha;
  const a2 = a * a;
  const tris = delaunayTriangulate(deduped);
  if (tris.length === 0) return convexHull2D(points);
  // Filter to alpha-triangles: circumradius ≤ alpha. Indices reference the
  // post-dedup `deduped` array; downstream stitching uses the same array.
  const alphaTris: Tri[] = [];
  for (const t of tris) {
    const cc = circumcircle(deduped[t.a] as Vec2, deduped[t.b] as Vec2, deduped[t.c] as Vec2);
    if (!cc) continue;
    if (cc.r2 <= a2) alphaTris.push(t);
  }
  if (alphaTris.length === 0) return convexHull2D(points);
  // Boundary edges: appear in exactly one alpha-triangle.
  const edgeCount = new Map<string, { a: number; b: number; count: number }>();
  const addEdge = (i: number, j: number): void => {
    const key = i < j ? `${i}|${j}` : `${j}|${i}`;
    const e = edgeCount.get(key);
    if (e) e.count++;
    else edgeCount.set(key, { a: i, b: j, count: 1 });
  };
  for (const t of alphaTris) {
    addEdge(t.a, t.b);
    addEdge(t.b, t.c);
    addEdge(t.c, t.a);
  }
  const boundary: Array<{ a: number; b: number }> = [];
  for (const e of edgeCount.values()) {
    if (e.count === 1) boundary.push({ a: e.a, b: e.b });
  }
  if (boundary.length < 3) return convexHull2D(points);
  const polys = stitchEdgesToPolygons(boundary, deduped);
  if (polys.length === 0) return convexHull2D(points);
  // Pick the largest by perimeter — single-fill renderer can't draw holes
  // or multiple islands without geometry changes downstream. The dominant
  // silhouette is the load-bearing one; stray small islands disappear.
  let best = polys[0] as Vec2[];
  let bestLen = polyPerimeter(best);
  for (let i = 1; i < polys.length; i++) {
    const p = polys[i] as Vec2[];
    const len = polyPerimeter(p);
    if (len > bestLen) { best = p; bestLen = len; }
  }
  return best;
};

// Merge a list of capsules into a single alpha-shape silhouette polygon.
// Mirrors mergeCapsulesToHull's signature — same input/output type, drop-in
// swap at the merge stage so Holly can regression-test either independently.
export const mergeCapsulesToAlpha = (capsules: Capsule2D[], segsPerCapsule = 12): Vec2[] => {
  if (capsules.length === 0) return [];
  const all: Vec2[] = [];
  for (const c of capsules) {
    const poly = expandCapsule(c, segsPerCapsule);
    for (const p of poly) all.push(p);
  }
  return alphaShape2D(all);
};
