// solid.mjs — construction forms as depth-testable SOLIDS, a z-buffer to merge
// them, and outline tracing. The artist's forms stay 3D; the merge is a real
// depth buffer, not a hardcoded clip.
import { rotateYawPitch, project } from "./core.mjs";

export const R = 1;
const C = 0.80; // side cut-plane offset (how flat the temples are)

// jaw/face cross-sections (cheek -> chin). wzF = forward depth (chin/face side),
// wzB = back depth (flatter, tucks under the skull). Exported so curves ride the surface.
export const JAW_LEVELS = [
  { y: -0.20, wx: 0.70, wzF: 0.78, wzB: 0.55, zc: 0.02 }, // temple/cheek
  { y: -0.70, wx: 0.74, wzF: 0.74, wzB: 0.50, zc: 0.10 }, // zygomatic (widest)
  { y: -1.05, wx: 0.70, wzF: 0.70, wzB: 0.42, zc: 0.16 }, // jaw angle (gonial corner) - stays wide
  { y: -1.35, wx: 0.55, wzF: 0.66, wzB: 0.34, zc: 0.22 }, // along the jawline
  { y: -1.65, wx: 0.42, wzF: 0.62, wzB: 0.26, zc: 0.27 },
  { y: -1.85, wx: 0.32, wzF: 0.58, wzB: 0.20, zc: 0.30 }, // chin block - keeps width
  { y: -1.98, wx: 0.26, wzF: 0.52, wzB: 0.16, zc: 0.32 }, // chin base (flat-ish, not a point)
];

// neck: a forward-set tapered cylinder so the silhouette doesn't pinch to a tip.
// Filled cross-sections (no hollow tube) and run off the bottom of the frame so
// there is no ragged base edge for the tracer to fray on.
export function neckPoints() {
  const levels = [
    { y: -1.45, r: 0.40, zc: -0.14 },
    { y: -2.20, r: 0.45, zc: -0.06 },
    { y: -3.60, r: 0.52, zc: 0.02 },
  ];
  const lerp = (a, b, t) => a + (b - a) * t;
  const pts = [];
  const steps = 170;
  for (let s = 0; s <= steps; s++) {
    const u = (s / steps) * (levels.length - 1);
    const k = Math.min(levels.length - 2, Math.floor(u)), f = u - k;
    const L = levels[k], N = levels[k + 1];
    const y = lerp(L.y, N.y, f), r = lerp(L.r, N.r, f), zc = lerp(L.zc, N.zc, f);
    for (let ri = 1; ri <= 10; ri++) {            // filled disc -> solid coverage
      const rr = (ri / 10) * r, m = Math.max(8, ri * 6);
      for (let a = 0; a < m; a++) {
        const t = (a / m) * 2 * Math.PI;
        pts.push([rr * Math.cos(t), y, zc + rr * Math.sin(t)]);
      }
    }
  }
  return pts;
}
export function jawSection(y) {
  const L = JAW_LEVELS;
  if (y >= L[0].y) return L[0];
  if (y <= L[L.length - 1].y) return L[L.length - 1];
  for (let i = 0; i < L.length - 1; i++) {
    if (y <= L[i].y && y >= L[i + 1].y) {
      const f = (L[i].y - y) / (L[i].y - L[i + 1].y), lerp = (a, b) => a + (b - a) * f;
      return {
        wx: lerp(L[i].wx, L[i + 1].wx), wzF: lerp(L[i].wzF, L[i + 1].wzF),
        wzB: lerp(L[i].wzB, L[i + 1].wzB), zc: lerp(L[i].zc, L[i + 1].zc),
      };
    }
  }
  return L[0];
}

// circular moving-average smoothing for a closed polyline (cleans scanline stairs)
export function smoothClosed(pts, iters = 2) {
  let p = pts;
  for (let k = 0; k < iters; k++) {
    const out = new Array(p.length);
    for (let i = 0; i < p.length; i++) {
      const a = p[(i - 1 + p.length) % p.length], b = p[i], c = p[(i + 1) % p.length];
      out[i] = { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 };
    }
    p = out;
  }
  return p;
}

// --- surface point clouds (dense enough that the projected shell fills the silhouette) ---
export function craniumPoints() {
  const pts = [];
  const nLat = 120, nLong = 220;
  for (let i = 0; i <= nLat; i++) {
    const th = (i / nLat) * Math.PI;
    const y = R * Math.cos(th), r = R * Math.sin(th);
    for (let j = 0; j < nLong; j++) {
      const ph = (j / nLong) * 2 * Math.PI;
      const x = r * Math.cos(ph), z = r * Math.sin(ph);
      if (Math.abs(x) > C) continue;        // sliced flat at the temples
      pts.push([x, y, z]);
    }
  }
  // the two flat side discs (the ear planes), so the cut faces have depth too
  const rho = Math.sqrt(R * R - C * C);
  for (const sx of [+C, -C]) {
    for (let ri = 1; ri <= 26; ri++) {
      const rr = (ri / 26) * rho;
      const m = Math.max(8, Math.round(ri * 5));
      for (let a = 0; a < m; a++) {
        const t = (a / m) * 2 * Math.PI;
        pts.push([sx, rr * Math.cos(t), rr * Math.sin(t)]);
      }
    }
  }
  return pts;
}

// jaw/face as a lofted solid: stacked closed cross-sections from cheek to chin.
export function jawPoints() {
  const levels = JAW_LEVELS;
  const pts = [];
  const steps = 160;
  for (let s = 0; s <= steps; s++) {
    const y = JAW_LEVELS[0].y + (s / steps) * (JAW_LEVELS[JAW_LEVELS.length - 1].y - JAW_LEVELS[0].y);
    const { wx, wzF, wzB, zc } = jawSection(y);
    const m = 96;
    for (let a = 0; a < m; a++) {
      const t = (a / m) * 2 * Math.PI;
      const cz = Math.cos(t);                       // front (cz>0) bulges, back (cz<0) flattens
      pts.push([wx * Math.sin(t), y, zc + (cz >= 0 ? wzF : wzB) * cz]);
    }
  }
  return pts;
}

// --- z-buffer: splat all solids, keep nearest depth (max z). ---
export function buildZ(W, H, cx, cy, scale, yaw, pitch, solids, splatR = 1.7) {
  const z = new Float32Array(W * H).fill(-Infinity);
  const splat = (px, py, d) => {
    const x0 = Math.max(0, Math.floor(px - splatR)), x1 = Math.min(W - 1, Math.ceil(px + splatR));
    const y0 = Math.max(0, Math.floor(py - splatR)), y1 = Math.min(H - 1, Math.ceil(py + splatR));
    for (let yy = y0; yy <= y1; yy++)
      for (let xx = x0; xx <= x1; xx++) {
        if ((xx + 0.5 - px) ** 2 + (yy + 0.5 - py) ** 2 > splatR * splatR) continue;
        const i = yy * W + xx;
        if (d > z[i]) z[i] = d;
      }
  };
  for (const cloud of solids)
    for (const p of cloud) {
      const r = rotateYawPitch(p, yaw, pitch);
      const pr = project(r, cx, cy, scale);
      if (pr.x < -2 || pr.y < -2 || pr.x > W + 2 || pr.y > H + 2) continue;
      splat(pr.x, pr.y, r[2]);
    }
  return z;
}

// keep only the largest connected blob of coverage (drops stray splat specks
// that would otherwise capture the boundary tracer).
export function largestComponent(z, W, H) {
  const covered = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) covered[i] = z[i] > -Infinity ? 1 : 0;
  const label = new Int32Array(W * H).fill(0);
  let best = null, bestSize = 0, cur = 0;
  const stack = [];
  for (let s = 0; s < W * H; s++) {
    if (!covered[s] || label[s]) continue;
    cur++; let size = 0; stack.length = 0; stack.push(s); label[s] = cur;
    const cells = [];
    while (stack.length) {
      const p = stack.pop(); cells.push(p); size++;
      const x = p % W, y = (p / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = ny * W + nx;
        if (covered[q] && !label[q]) { label[q] = cur; stack.push(q); }
      }
    }
    if (size > bestSize) { bestSize = size; best = cur; }
  }
  const mask = new Uint8Array(W * H);
  if (best !== null) for (let i = 0; i < W * H; i++) if (label[i] === best) mask[i] = 1;
  return mask;
}

// Moore-neighbour boundary trace (clockwise). Follows concavities (jaw-neck
// notch, under-chin) that the per-row scan could only step across.
export function traceMoore(mask, W, H) {
  const at = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !!mask[y * W + x];
  let start = null;
  for (let y = 0; y < H && !start; y++)
    for (let x = 0; x < W; x++) if (at(x, y)) { start = [x, y]; break; }
  if (!start) return null;
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const contour = [];
  let p = start, back = 4, steps = 0, max = W * H * 8; // entered from the West
  do {
    contour.push({ x: p[0] + 0.5, y: p[1] + 0.5 });
    let found = false;
    for (let k = 0; k < 8; k++) {
      const d = (back + 1 + k) % 8, nx = p[0] + dirs[d][0], ny = p[1] + dirs[d][1];
      if (at(nx, ny)) { back = (d + 4) % 8; p = [nx, ny]; found = true; break; }
    }
    if (!found) break;
  } while (!(p[0] === start[0] && p[1] === start[1]) && ++steps < max);
  return contour.length > 2 ? contour : null;
}

// Outline via per-row extremes: robust for a row-convex silhouette (no ears yet).
// Right edge top->bottom, then left edge bottom->top => one closed loop.
export function outlineScan(mask, W, H) {
  const rows = [];
  for (let y = 0; y < H; y++) {
    let lo = -1, hi = -1;
    for (let x = 0; x < W; x++) if (mask[y * W + x]) { if (lo < 0) lo = x; hi = x; }
    if (lo >= 0) rows.push({ y, lo, hi });
  }
  if (rows.length < 2) return null;
  const right = rows.map((r) => ({ x: r.hi + 0.5, y: r.y }));
  const left = rows.map((r) => ({ x: r.lo - 0.5, y: r.y })).reverse();
  return right.concat(left);
}

// --- trace the outer boundary of a binary mask (Moore tracing). ---
export function traceOutline(mask, W, H) {
  const cov = (x, y) => x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x];
  let sx = -1, sy = -1;
  for (let y = 0; y < H && sy < 0; y++)
    for (let x = 0; x < W; x++) if (cov(x, y)) { sx = x; sy = y; break; }
  if (sx < 0) return null;
  const dirs = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]];
  const out = [];
  let cx = sx, cy = sy, prev = 0, count = 0, max = W * H * 4;
  do {
    out.push({ x: cx, y: cy });
    let found = false;
    const start = (prev + 6) % 8;
    for (let k = 0; k < 8; k++) {
      const d = (start + k) % 8, nx = cx + dirs[d][0], ny = cy + dirs[d][1];
      if (cov(nx, ny)) { cx = nx; cy = ny; prev = d; found = true; break; }
    }
    if (!found) break;
    count++;
  } while ((cx !== sx || cy !== sy) && count < max);
  return out;
}

export function dp(points, eps) {
  if (points.length < 3) return points;
  const d2 = (p, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1;
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + t * dx, py = a.y + t * dy;
    return (p.x - px) ** 2 + (p.y - py) ** 2;
  };
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let idx = -1, dmax = eps * eps;
    for (let i = a + 1; i < b; i++) {
      const dd = d2(points[i], points[a], points[b]);
      if (dd > dmax) { dmax = dd; idx = i; }
    }
    if (idx >= 0) { keep[idx] = true; stack.push([a, idx], [idx, b]); }
  }
  return points.filter((_, i) => keep[i]);
}
