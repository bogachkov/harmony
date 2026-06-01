// union.mjs — vendored 2D boolean union (polygon-clipping, MIT, in proof/vendor)
// + outer-ring extraction (largest filled component, holes dropped) + a concavity
// metric used by the seating-overlap check. v5 §1d / §3.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const _pc = require("../vendor/polygon-clipping.cjs");
const lib = _pc.default || _pc;

export function circleRing(cx, cy, r, n = 96) {
  const ring = [];
  for (let i = 0; i < n; i++) { const t = (i / n) * 2 * Math.PI; ring.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
  ring.push(ring[0].slice());
  return ring;
}

function ringArea(ring) {
  let s = 0;
  for (let i = 0; i < ring.length - 1; i++) s += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return s / 2;
}

// union a set of closed rings -> the outer ring of the largest filled component
// (interior holes discarded). Returns [{x,y}] CCW, or null.
export function unionOuter(rings) {
  const geoms = rings.map((r) => [r]);          // each ring -> a Polygon
  const res = lib.union(geoms[0], ...geoms.slice(1)); // -> MultiPolygon
  if (!res || !res.length) return null;
  let best = null, bestA = -1;
  for (const poly of res) { const a = Math.abs(ringArea(poly[0])); if (a > bestA) { bestA = a; best = poly; } }
  if (!best) return null;
  let out = best[0].map((p) => ({ x: p[0], y: p[1] }));
  if (ringArea(best[0]) < 0) out.reverse();     // normalize to CCW
  return out;
}

export function convexHull(pts) {
  const p = pts.map((q) => [q.x, q.y]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  const up = [];
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop();
  return lo.concat(up);
}

function distSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy || 1;
  let t = ((px - x1) * dx + (py - y1) * dy) / l; t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// deepest concavity = max distance from a ring point to the convex hull boundary.
// A scallop notch (under-seated masses) pushes this large; deep-seated masses keep
// it small. (In the real head this is restricted to mass-pair seams so legitimate
// jaw-neck/under-chin concavities don't trip it.)
export function maxNotchDepth(ring) {
  const hull = convexHull(ring);
  let maxd = 0;
  for (const q of ring) {
    let m = Infinity;
    for (let i = 0; i < hull.length; i++) { const a = hull[i], b = hull[(i + 1) % hull.length]; m = Math.min(m, distSeg(q.x, q.y, a[0], a[1], b[0], b[1])); }
    if (m > maxd) maxd = m;
  }
  return maxd;
}
