// SDF head -> JOINED hand-drawn strokes (not loose pixel ink).
//
// The "much better than current" step. line-render.ts proved the SDF gives us
// silhouette + crease + depth-step EDGES for free off the G-buffer. The missing
// piece was line QUALITY: those were emitted as a confetti of 1px rects. Here we
//   1. raymarch the SDF into a depth+normal+hit G-buffer (as before),
//   2. trace the SILHOUETTE as a clean closed contour via marching squares on
//      the hit mask (ordered vertices, not pixels),
//   3. trace interior CREASE / depth-step lines into ordered polylines by
//      walking the thin edge mask,
//   4. Douglas-Peucker simplify every polyline,
//   5. ink them with proof/core.mjs's hand-drawn stroke (wobble + taper) and
//      write a PNG contact sheet (front / three-quarter / profile).
//
// World space matches head.ts: +X subject-left, +Y up, +Z toward camera.

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

import type { Vec3 } from '../src/math/vec3.ts';
import { add, sub, dot, normalize, rotateYX } from '../src/math/vec3.ts';
import { spikeHead, DEFAULT_HEAD } from './head.ts';

// proof/core.mjs is a self-contained rasterizer + hand-drawn stroke + PNG writer.
const require = createRequire(import.meta.url);
const core = require('../../proof/core.mjs') as typeof import('../../proof/core.mjs');
const { Canvas } = core as any;
const { writeFileSync } = require('node:fs') as typeof import('node:fs');

// ---------------- raymarch G-buffer (from line-render.ts) ----------------
const IMG = 256;
const MAX_STEPS = 160;
const MAX_DIST = 6.0;
const HIT_EPS = 0.0004;
const N_EPS = 0.0015;
const FOV_Y_DEG = 36;

type SDF = (p: Vec3) => number;
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

type Camera = { origin: Vec3; forward: Vec3; right: Vec3; up: Vec3; tanHalf: number };
const CAM_RADIUS = 4.4 * Math.max(...DEFAULT_HEAD.craniumRadii);
const CAM_TARGET: Vec3 = [0, -0.45, 0];
const makeCamera = (yaw: number, pitch: number): Camera => {
  const eyeRot = rotateYX([0, 0, CAM_RADIUS], yaw, pitch);
  const origin = add(CAM_TARGET, eyeRot);
  const forward = normalize(sub(CAM_TARGET, origin));
  const right = normalize(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  return { origin, forward, right, up, tanHalf: Math.tan((FOV_Y_DEG * Math.PI) / 360) };
};

const trace = (sdf: SDF, ro: Vec3, rd: Vec3) => {
  let t = 0;
  let p: Vec3 = ro;
  for (let i = 0; i < MAX_STEPS; i++) {
    p = [ro[0] + rd[0] * t, ro[1] + rd[1] * t, ro[2] + rd[2] * t];
    const d = sdf(p);
    if (d < HIT_EPS) return { hit: true, p, t };
    t += d;
    if (t > MAX_DIST) break;
  }
  return { hit: false, p, t };
};
const normalAt = (sdf: SDF, p: Vec3): Vec3 => {
  const e = N_EPS;
  return normalize([
    sdf([p[0] + e, p[1], p[2]]) - sdf([p[0] - e, p[1], p[2]]),
    sdf([p[0], p[1] + e, p[2]]) - sdf([p[0], p[1] - e, p[2]]),
    sdf([p[0], p[1], p[2] + e]) - sdf([p[0], p[1], p[2] - e]),
  ]);
};

type GBuf = { hit: Uint8Array; depth: Float32Array; nx: Float32Array; ny: Float32Array; nz: Float32Array };
const renderGBuffer = (sdf: SDF, cam: Camera): GBuf => {
  const hit = new Uint8Array(IMG * IMG);
  const depth = new Float32Array(IMG * IMG);
  const nx = new Float32Array(IMG * IMG);
  const ny = new Float32Array(IMG * IMG);
  const nz = new Float32Array(IMG * IMG);
  for (let py = 0; py < IMG; py++) {
    const v = 1 - (2 * (py + 0.5)) / IMG;
    for (let px = 0; px < IMG; px++) {
      const u = (2 * (px + 0.5)) / IMG - 1;
      const rd = normalize([
        cam.right[0] * u * cam.tanHalf + cam.up[0] * v * cam.tanHalf + cam.forward[0],
        cam.right[1] * u * cam.tanHalf + cam.up[1] * v * cam.tanHalf + cam.forward[1],
        cam.right[2] * u * cam.tanHalf + cam.up[2] * v * cam.tanHalf + cam.forward[2],
      ]);
      const r = trace(sdf, cam.origin, rd);
      const i = py * IMG + px;
      if (r.hit) {
        hit[i] = 1; depth[i] = r.t;
        const n = normalAt(sdf, r.p);
        nx[i] = n[0]; ny[i] = n[1]; nz[i] = n[2];
      }
    }
  }
  return { hit, depth, nx, ny, nz };
};

// ---------------- silhouette via Moore boundary following ----------------
// One guaranteed-closed outer loop around the hit region — robust at the
// head/neck junction where marching-squares + stitch split into arcs.
type Pt = { x: number; y: number };

const mooreTrace = (mask: Uint8Array, w: number, h: number): Pt[] => {
  const isHit = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && !!mask[y * w + x];
  let start: [number, number] | null = null;
  for (let y = 0; y < h && !start; y++)
    for (let x = 0; x < w && !start; x++) if (isHit(x, y)) start = [x, y];
  if (!start) return [];
  // 8 directions clockwise from W: indexes used for backtracking.
  const d8 = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
  const contour: Pt[] = [];
  let p = start, b = 7; // entered from the west
  let safety = 0, steps = 0;
  do {
    contour.push({ x: p[0] + 0.5, y: p[1] + 0.5 });
    let found = false;
    for (let k = 0; k < 8; k++) {
      const dir = (b + 1 + k) % 8;
      const nx = p[0] + d8[dir][0], ny = p[1] + d8[dir][1];
      if (isHit(nx, ny)) { b = (dir + 4) % 8; p = [nx, ny]; found = true; break; }
    }
    if (!found) break; // isolated pixel
    steps++;
  } while (!(p[0] === start[0] && p[1] === start[1] && steps > 2) && ++safety < w * h * 4);
  return contour;
};

// ---------------- interior crease / depth-step lines ----------------
// Build a thin edge mask of interior contours, then walk it into polylines.
const creaseMask = (g: GBuf): Uint8Array => {
  const m = new Uint8Array(IMG * IMG);
  const at = (x: number, y: number) => y * IMG + x;
  for (let y = 1; y < IMG - 1; y++) {
    for (let x = 1; x < IMG - 1; x++) {
      const i = at(x, y);
      if (!g.hit[i]) continue;
      // skip the silhouette band — that line is owned by marching squares
      if (!g.hit[at(x - 1, y)] || !g.hit[at(x + 1, y)] || !g.hit[at(x, y - 1)] || !g.hit[at(x, y + 1)]) continue;
      let depthJump = 0, crease = 0;
      const ni: Vec3 = [g.nx[i], g.ny[i], g.nz[i]];
      for (const j of [at(x + 1, y), at(x, y + 1), at(x - 1, y), at(x, y - 1)]) {
        depthJump = Math.max(depthJump, Math.abs(g.depth[i] - g.depth[j]));
        const c = Math.max(-1, Math.min(1, dot(ni, [g.nx[j], g.ny[j], g.nz[j]])));
        crease = Math.max(crease, Math.acos(c));
      }
      if (depthJump > 0.06 || crease > 0.55) m[i] = 1;
    }
  }
  return thin(m);
};

// Cheap morphological thinning: drop a pixel if it has >4 set neighbours and
// removing it doesn't break local connectivity (keeps ridge lines ~1px).
const thin = (m: Uint8Array): Uint8Array => {
  const out = m.slice();
  const at = (x: number, y: number) => y * IMG + x;
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 1; y < IMG - 1; y++) {
      for (let x = 1; x < IMG - 1; x++) {
        if (!out[at(x, y)]) continue;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
          if ((dx || dy) && out[at(x + dx, y + dy)]) n++;
        if (n > 4) out[at(x, y)] = 0;
      }
    }
  }
  return out;
};

// Walk a thin mask into ordered polylines: start at endpoints (1 neighbour),
// follow the chain; mop up any leftover loops.
const traceThin = (m: Uint8Array): Pt[][] => {
  const at = (x: number, y: number) => y * IMG + x;
  const nbrs = (x: number, y: number) => {
    const out: [number, number][] = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < IMG && yy < IMG && m[at(xx, yy)]) out.push([xx, yy]);
    }
    return out;
  };
  const visited = new Uint8Array(IMG * IMG);
  const polys: Pt[][] = [];
  const walk = (sx: number, sy: number) => {
    const poly: Pt[] = [];
    let x = sx, y = sy;
    while (true) {
      visited[at(x, y)] = 1;
      poly.push({ x: x + 0.5, y: y + 0.5 });
      const next = nbrs(x, y).find(([nx, ny]) => !visited[at(nx, ny)]);
      if (!next) break;
      x = next[0]; y = next[1];
    }
    if (poly.length > 3) polys.push(poly);
  };
  // endpoints first (cleaner chains)
  for (let y = 1; y < IMG - 1; y++) for (let x = 1; x < IMG - 1; x++)
    if (m[at(x, y)] && !visited[at(x, y)] && nbrs(x, y).length === 1) walk(x, y);
  // remaining (loops / interior starts)
  for (let y = 1; y < IMG - 1; y++) for (let x = 1; x < IMG - 1; x++)
    if (m[at(x, y)] && !visited[at(x, y)]) walk(x, y);
  return polys;
};

// ---------------- Douglas-Peucker simplify ----------------
const simplify = (pts: Pt[], eps: number): Pt[] => {
  if (pts.length < 3) return pts;
  let maxD = 0, idx = 0;
  const a = pts[0], b = pts[pts.length - 1];
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs((pts[i].x - a.x) * dy - (pts[i].y - a.y) * dx) / len;
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > eps) {
    const left = simplify(pts.slice(0, idx + 1), eps);
    const right = simplify(pts.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [a, b];
};

// ---------------- render one view to a Canvas ----------------
const SS = 3; // supersample factor for ink
const renderView = (sdf: SDF, yaw: number, pitch: number) => {
  const g = renderGBuffer(sdf, makeCamera(yaw, pitch));
  const cv = new Canvas(IMG * SS, IMG * SS);
  const ink = (poly: Pt[], width: number, seed: number, closed = false) => {
    const s = simplify(poly, 0.8).map((p) => ({ x: p.x * SS, y: p.y * SS }));
    if (s.length < 2) return;
    cv.stroke(s, { width, color: [25, 25, 30], wobble: 1.1, seed, closed, taper: !closed });
  };
  // silhouette (heaviest) — one closed outer loop
  ink(mooreTrace(g.hit, IMG, IMG), 5.5, 100, true);
  // interior creases / depth-steps (lighter)
  traceThin(creaseMask(g)).forEach((p, i) => ink(p, 3.2, 200 + i, false));
  return cv.downscale(2);
};

// ---------------- contact sheet ----------------
const main = () => {
  const outDir = '/home/user/harmony/proof/out';
  mkdirSync(outDir, { recursive: true });
  const sdf: SDF = (p) => spikeHead(p);
  const views: [string, number, number][] = [
    ['front', 0, 0],
    ['tq', -Math.PI / 4, 0],
    ['profile', -Math.PI / 2, 0],
  ];
  const tiles = views.map(([name, yaw, pitch]) => {
    const t0 = Date.now();
    const cv = renderView(sdf, yaw, pitch);
    console.log(`${name.padEnd(8)} ${Date.now() - t0}ms`);
    return cv;
  });
  const tw = tiles[0].w, th = tiles[0].h, pad = 12;
  const sheet = new Canvas(tw * 3 + pad * 4, th + pad * 2);
  tiles.forEach((t, i) => sheet.blit(t, pad + i * (tw + pad), pad));
  writeFileSync(`${outDir}/sdf_ink.png`, sheet.toPNG());
  console.log(`wrote ${outDir}/sdf_ink.png`);
};
main();
