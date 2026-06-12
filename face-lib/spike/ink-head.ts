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
import { DEFAULT_HEAD, construct } from './head.ts';
import { styledHead, hairShellSDF, HAIR_CAP_C, HAIR_CAP_R, onHairSide } from './style3d.ts';

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
const CAM_TARGET: Vec3 = [0, -0.18, 0];   // near eye level: frames the face + scalp
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

// Cheap SDF ambient occlusion: march a few steps along the surface normal and
// measure how much the field undershoots the free-space distance. Concavities
// (eye sockets, under the brow ridge, under nose + jaw) come back occluded.
// This is what makes a recess READ as a recess instead of an outlined bulge.
const ambientOcclusion = (sdf: SDF, p: Vec3, n: Vec3): number => {
  let occ = 0, sca = 1;
  for (let i = 1; i <= 6; i++) {
    const h = 0.022 * i;           // sample out to ~0.13 (head half-width ~0.5)
    const d = sdf([p[0] + n[0] * h, p[1] + n[1] * h, p[2] + n[2] * h]);
    occ += (h - d) * sca;
    sca *= 0.88;
  }
  return Math.max(0, Math.min(1, 1 - 4.5 * occ)); // 1 = open, 0 = deep recess
};

type GBuf = { hit: Uint8Array; depth: Float32Array; nx: Float32Array; ny: Float32Array; nz: Float32Array; ao: Float32Array };
const renderGBuffer = (sdf: SDF, cam: Camera): GBuf => {
  const hit = new Uint8Array(IMG * IMG);
  const depth = new Float32Array(IMG * IMG);
  const nx = new Float32Array(IMG * IMG);
  const ny = new Float32Array(IMG * IMG);
  const nz = new Float32Array(IMG * IMG);
  const ao = new Float32Array(IMG * IMG);
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
        ao[i] = ambientOcclusion(sdf, r.p, n);
      }
    }
  }
  return { hit, depth, nx, ny, nz, ao };
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
// Dilate a boolean mask by a disc of radius R (grow the suppression zone so
// the crease RIM around a hollow is removed too, not just the floor).
const dilate = (src: Uint8Array, R: number): Uint8Array => {
  const out = new Uint8Array(IMG * IMG);
  for (let y = 0; y < IMG; y++) for (let x = 0; x < IMG; x++) {
    if (!src[y * IMG + x]) continue;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      if (dx * dx + dy * dy > R * R) continue;
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < IMG && yy < IMG) out[yy * IMG + xx] = 1;
    }
  }
  return out;
};

const creaseMask = (g: GBuf, suppress: Uint8Array): Uint8Array => {
  const m = new Uint8Array(IMG * IMG);
  const at = (x: number, y: number) => y * IMG + x;
  for (let y = 1; y < IMG - 1; y++) {
    for (let x = 1; x < IMG - 1; x++) {
      const i = at(x, y);
      if (!g.hit[i]) continue;
      // skip the silhouette band — that line is owned by the Moore trace
      if (!g.hit[at(x - 1, y)] || !g.hit[at(x + 1, y)] || !g.hit[at(x, y - 1)] || !g.hit[at(x, y + 1)]) continue;
      // skip recessed regions AND their rim — tone owns those (eye sockets,
      // under-brow). A crease ring around a hollow reads as a convex eyeball;
      // let the shadow carry it instead. Keeps the core style-neutral.
      if (suppress[i]) continue;
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

// Separable box blur of depth, averaged over HIT pixels only (so the
// background never bleeds into the silhouette). Returns the local surface
// depth envelope; depth - blur = how recessed a pixel is.
const blurDepthOverHits = (g: GBuf, R: number): Float32Array => {
  const sH = new Float32Array(IMG * IMG), cH = new Float32Array(IMG * IMG);
  for (let y = 0; y < IMG; y++) {
    for (let x = 0; x < IMG; x++) {
      let s = 0, c = 0;
      for (let dx = -R; dx <= R; dx++) {
        const xx = x + dx;
        if (xx < 0 || xx >= IMG) continue;
        const j = y * IMG + xx;
        if (g.hit[j]) { s += g.depth[j]; c++; }
      }
      sH[y * IMG + x] = s; cH[y * IMG + x] = c;
    }
  }
  const out = new Float32Array(IMG * IMG);
  for (let y = 0; y < IMG; y++) {
    for (let x = 0; x < IMG; x++) {
      let s = 0, c = 0;
      for (let dy = -R; dy <= R; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= IMG) continue;
        s += sH[yy * IMG + x]; c += cH[yy * IMG + x];
      }
      out[y * IMG + x] = c > 0 ? s / c : g.depth[y * IMG + x];
    }
  }
  return out;
};

// ---------------- STYLE LAYER ----------------
// The core is a style-neutral skull; the style draws a NORMAL face onto it,
// every feature anchored to the core's projected landmarks (so it holds across
// the head turn): eyes, brows, nose, mouth, ears, hair.
type Proj = { px: number; py: number; cz: number };
const projectPoint = (cam: Camera, P: Vec3): Proj => {
  const v = sub(P, cam.origin);
  const cz = dot(v, cam.forward);
  const u = (dot(v, cam.right) / cz) / cam.tanHalf;
  const w = (dot(v, cam.up) / cz) / cam.tanHalf;
  return { px: (u + 1) / 2 * IMG - 0.5, py: (1 - w) / 2 * IMG - 0.5, cz };
};

const HEAD_C = construct(DEFAULT_HEAD);
const surfZc = (x: number, y: number): number => {
  const [rx, ry, rz] = HEAD_C.craniumRadii;
  return rz * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2 - (y / ry) ** 2));
};

type P2 = { x: number; y: number };
const dist2 = (a: P2, b: P2) => Math.hypot(b.x - a.x, b.y - a.y);
// Arc polyline from a to b, bulging perpendicular by `bulge` px at the middle.
const arc = (a: P2, b: P2, bulge: number, n = 20): P2[] => {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len, out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, s = Math.sin(Math.PI * t) * bulge;
    out.push({ x: a.x + dx * t + nx * s, y: a.y + dy * t + ny * s });
  }
  return out;
};
const fillBetween = (cv: any, top: P2[], bot: P2[], col: number[]) => {
  for (let i = 0; i < top.length; i++)
    for (let y = top[i].y; y <= bot[i].y; y += 1) cv.stamp(top[i].x, y, 1.0, col, 1);
};

// A normal eye: almond between two lid arcs, iris tucked under the upper lid,
// pupil, catchlight, a faint crease above.
const drawEye = (cv: any, cL: P2, cR: P2, seed: number) => {
  const w = dist2(cL, cR), h = w * 0.34;
  const cx = (cL.x + cR.x) / 2, cy = (cL.y + cR.y) / 2;
  const upper = arc(cL, cR, -h), lower = arc(cL, cR, h * 0.62);
  fillBetween(cv, upper, lower, [250, 250, 252]);
  const irisR = h * 0.62, iy = cy + h * 0.02;
  cv.stamp(cx, iy, irisR, [78, 56, 40], 1);
  cv.stamp(cx, iy, irisR * 0.46, [14, 10, 12], 1);
  cv.stamp(cx - irisR * 0.3, iy - irisR * 0.32, irisR * 0.2, [255, 255, 255], 1);
  cv.stroke(upper, { width: 2.8, color: [30, 26, 30], wobble: 0.5, seed, taper: true });
  cv.stroke(lower, { width: 1.5, color: [70, 60, 62], wobble: 0.5, seed: seed + 1, taper: true });
  const crease = arc({ x: cL.x + w * 0.1, y: cL.y - h * 0.2 }, { x: cR.x - w * 0.1, y: cR.y - h * 0.2 }, -h * 0.9);
  cv.stroke(crease, { width: 1.1, color: [150, 135, 135], wobble: 0.4, seed: seed + 2, taper: true });
};

const drawBrow = (cv: any, bL: P2, bR: P2, seed: number) => {
  const a = arc(bL, bR, -dist2(bL, bR) * 0.16);
  cv.stroke(a, { width: 4.2, color: [70, 50, 42], wobble: 0.7, seed, taper: true });
};

// Nose: soft underside + alae + two nostril marks + a faint bridge line.
const drawNose = (cv: any, glab: P2, tip: P2, alaL: P2, alaR: P2, seed: number) => {
  const w = dist2(alaL, alaR);
  cv.stroke(arc(alaL, alaR, w * 0.30), { width: 1.6, color: [140, 115, 108], wobble: 0.5, seed, taper: true });
  cv.stroke(arc(alaL, { x: tip.x - w * 0.12, y: tip.y }, -w * 0.12), { width: 1.3, color: [150, 122, 115], wobble: 0.4, seed: seed + 1, taper: true });
  cv.stroke(arc({ x: tip.x + w * 0.12, y: tip.y }, alaR, -w * 0.12), { width: 1.3, color: [150, 122, 115], wobble: 0.4, seed: seed + 2, taper: true });
  cv.stamp((alaL.x + tip.x) / 2 - w * 0.04, tip.y + w * 0.06, w * 0.05, [60, 45, 45], 0.8);
  cv.stamp((alaR.x + tip.x) / 2 + w * 0.04, tip.y + w * 0.06, w * 0.05, [60, 45, 45], 0.8);
  cv.stroke([glab, { x: tip.x - w * 0.16, y: tip.y - w * 0.1 }], { width: 1.1, color: [170, 150, 145], wobble: 0.4, seed: seed + 3, taper: true });
};

// Lips: cupid-bow upper, fuller lower, dark seam between.
const drawMouth = (cv: any, mL: P2, mR: P2, seed: number) => {
  const w = dist2(mL, mR), cx = (mL.x + mR.x) / 2, cy = (mL.y + mR.y) / 2;
  const peakL = { x: cx - w * 0.12, y: cy - w * 0.02 }, peakR = { x: cx + w * 0.12, y: cy - w * 0.02 };
  cv.stroke(arc(mL, mR, w * 0.03), { width: 2.4, color: [120, 70, 66], wobble: 0.5, seed, taper: true });
  cv.stroke(arc(mL, peakL, -w * 0.03).concat(arc(peakL, peakR, w * 0.02), arc(peakR, mR, -w * 0.03)),
    { width: 1.4, color: [150, 95, 92], wobble: 0.4, seed: seed + 1, taper: true });
  cv.stroke(arc(mL, mR, w * 0.13), { width: 1.6, color: [150, 95, 92], wobble: 0.4, seed: seed + 2, taper: true });
};

const drawEar = (cv: any, top: P2, bot: P2, sign: number, seed: number) => {
  const d = dist2(top, bot);
  cv.stroke(arc(top, bot, sign * d * 0.5), { width: 2.4, color: [60, 45, 45], wobble: 0.6, seed, taper: true });
  cv.stroke(arc({ x: top.x + sign * d * 0.05, y: top.y + d * 0.18 }, { x: bot.x + sign * d * 0.04, y: bot.y - d * 0.2 }, sign * d * 0.22),
    { width: 1.4, color: [110, 85, 82], wobble: 0.5, seed: seed + 1, taper: true });
};

// Hair: a dark cap over the scalp. Robust across views — reconstruct each hit
// pixel's WORLD position from the depth buffer and mark it hair if it is above
// the front hairline OR on the back of the skull (so the back of the head is
// covered too). The hairline is a constant world-Y, so it projects as a natural
// curve that follows the head from any angle.
const drawHair = (cv: any, cam: Camera, g: GBuf, ss: number) => {
  const [rx, , rz] = HEAD_C.craniumRadii;
  const hairY = HEAD_C.browY + HEAD_C.eyeSpacing * 0.30;   // front hairline height
  const backZ = -rz * 0.08;                                // behind this = back of skull
  const lowY = HEAD_C.noseBaseY;                           // do not run onto the neck
  const peak = rx * 0.18;                                  // slight widow's peak at centre
  const hair = [38, 33, 42];
  for (let y = 0; y < IMG; y++) for (let x = 0; x < IMG; x++) {
    const i = y * IMG + x;
    if (!g.hit[i]) continue;
    const u = (2 * (x + 0.5)) / IMG - 1, v = 1 - (2 * (y + 0.5)) / IMG;
    const rd = normalize([
      cam.right[0] * u * cam.tanHalf + cam.up[0] * v * cam.tanHalf + cam.forward[0],
      cam.right[1] * u * cam.tanHalf + cam.up[1] * v * cam.tanHalf + cam.forward[1],
      cam.right[2] * u * cam.tanHalf + cam.up[2] * v * cam.tanHalf + cam.forward[2],
    ]);
    const wx = cam.origin[0] + rd[0] * g.depth[i];
    const wy = cam.origin[1] + rd[1] * g.depth[i];
    const wz = cam.origin[2] + rd[2] * g.depth[i];
    const line = hairY - peak * Math.max(0, 1 - (wx / (rx * 0.6)) ** 2); // dip at centre
    if (wy > lowY && (wy > line || wz < backZ))
      cv.stamp((x + 0.5) * ss, (y + 0.5) * ss, ss * 0.72, hair, 1);
  }
};

// HAIR FLOW STROKES: lead lines flowing from the crown whorl down the scalp,
// plus clumped filler. Each strand is a 3D polyline on the hair-cap surface,
// projected per view and clipped to the VISIBLE hair (front-facing + hair side),
// so it tracks the head. Texture comes from these strokes, not 3D bumps.
const drawHairStrokes = (cv: any, cam: Camera, ss: number) => {
  const [cx, cy, cz] = HAIR_CAP_C, [rx, ry, rz] = HAIR_CAP_R;
  const dirOf = (th: number, ph: number): Vec3 =>
    [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
  const surf = (th: number, ph: number): Vec3 => {
    const d = dirOf(th, ph);
    return [cx + d[0] * rx * 1.012, cy + d[1] * ry * 1.012, cz + d[2] * rz * 1.012];
  };
  const nrmOf = (th: number, ph: number): Vec3 => {
    const d = dirOf(th, ph);
    return normalize([d[0] / rx, d[1] / ry, d[2] / rz]);
  };
  const rnd = (s: number) => { const x = Math.sin(s * 127.1) * 43758.5; return x - Math.floor(x); };

  // one LOCK: a tapered ribbon (thick at the root, point at the tip) following
  // the scalp flow, clipped to visible hair. The lock IS the hair — the mass is
  // built by overlapping these, not by a shaded fill. Optional bright highlight
  // down the spine (the lit crest of the lock).
  const lock = (ph0: number, th0: number, th1: number, drift: number, waveA: number, width: number, col: number[], seed: number, hi: boolean) => {
    const N = 18;
    let seg: P2[] = [];
    const flush = () => {
      if (seg.length > 1) {
        cv.stroke(seg, { width, color: col, wobble: 0.9, seed, taper: true });
        if (hi) cv.stroke(seg, { width: width * 0.26, color: [158, 134, 140], wobble: 0.5, seed: seed + 9, taper: true });
      }
      seg = [];
    };
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const th = th0 + (th1 - th0) * t;
      const ph = ph0 + drift * t + waveA * Math.sin(1.4 * Math.PI * t + seed);
      const P = surf(th, ph);
      const toCam = normalize(sub(cam.origin, P));
      if (onHairSide(P) && dot(nrmOf(th, ph), toCam) > 0.1) { const q = projectPoint(cam, P); seg.push({ x: q.px * ss, y: q.py * ss }); }
      else flush();
    }
    flush();
  };

  const dark = [32, 25, 31], mid = [58, 45, 53];
  // crown PART — locks fan away from a part meridian toward the front-top
  const phPart = Math.PI * 0.5;
  // dominant LEAD locks: a few wide ones that set the main flow and shape
  for (let i = 0; i < 7; i++) {
    lock(phPart + (i - 3) * 0.52, 0.15, 1.5, (i - 3) * 0.12, 0.05, 16, mid, 100 + i, true);
  }
  // CLUMPS — tight fans of locks that build the mass; varied width/tone/length
  const CLUMPS = 13;
  for (let c = 0; c < CLUMPS; c++) {
    const phC = (c / CLUMPS) * Math.PI * 2 + (rnd(c + 9) - 0.5) * 0.2;
    const m = 4 + Math.floor(rnd(c + 3) * 4);
    for (let k = 0; k < m; k++) {
      const ph = phC + (rnd(c * 13 + k) - 0.5) * 0.42;
      const th0 = 0.14 + rnd(c * 7 + k) * 0.22;
      const th1 = th0 + 0.85 + rnd(c * 5 + k) * 0.7;
      const width = 7 + rnd(c * 11 + k) * 9;
      const drift = (rnd(c + k) - 0.5) * 0.45;
      const tone = rnd(c * 3 + k) > 0.55 ? mid : dark;
      lock(ph, th0, th1, drift, 0.05, width, tone, 500 + c * 20 + k, rnd(c * 17 + k) > 0.72);
    }
  }
};

// ---------------- ligne-claire (Hergé/Tintin) feature marks ----------------
// Iconic + minimal: uniform crisp lines, dot eyes, a tiny nose hook, flat hair
// drawn with a few clean flow lines (flat clumpMode). No wobble, no taper.
type Style = 'natural' | 'ligne';
const INK_L = [24, 22, 30];
const cleanArc = (cv: any, a: P2, b: P2, bulge: number, width: number) =>
  cv.stroke(arc(a, b, bulge), { width, color: INK_L, wobble: 0, taper: false });

const drawEyeLigne = (cv: any, cL: P2, cR: P2) => {
  const w = dist2(cL, cR), cx = (cL.x + cR.x) / 2, cy = (cL.y + cR.y) / 2;
  cleanArc(cv, cL, cR, -w * 0.16, 3);                 // clean upper lid
  cv.stamp(cx, cy + w * 0.06, w * 0.16, INK_L, 1);    // the eye dot
};

const drawHairLigne = (cv: any, cam: Camera, ss: number) => {
  const [cx, cy, cz] = HAIR_CAP_C, [rx, ry, rz] = HAIR_CAP_R;
  const surf = (th: number, ph: number): Vec3 => {
    const d: Vec3 = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
    return [cx + d[0] * rx * 1.01, cy + d[1] * ry * 1.01, cz + d[2] * rz * 1.01];
  };
  const nrmOf = (th: number, ph: number): Vec3 => {
    const d: Vec3 = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
    return normalize([d[0] / rx, d[1] / ry, d[2] / rz]);
  };
  for (let i = 0; i < 9; i++) {                       // a few clean flow lines
    const ph = (i / 9) * Math.PI * 2;
    let seg: P2[] = [];
    const flush = () => { if (seg.length > 1) cv.stroke(seg, { width: 2.4, color: INK_L, wobble: 0, taper: false }); seg = []; };
    for (let s = 0; s <= 20; s++) {
      const th = 0.16 + (1.42 - 0.16) * (s / 20);
      const P = surf(th, ph);
      if (onHairSide(P) && dot(nrmOf(th, ph), normalize(sub(cam.origin, P))) > 0.12) {
        const q = projectPoint(cam, P); seg.push({ x: q.px * ss, y: q.py * ss });
      } else flush();
    }
    flush();
  }
};

// Compose a full face from the projected anchors.
const drawFace = (cv: any, cam: Camera, g: GBuf, ss: number, style: Style = 'natural') => {
  const pc = (P: Vec3): P2 => { const q = projectPoint(cam, P); return { x: q.px * ss, y: q.py * ss }; };
  const es = HEAD_C.eyeSpacing;
  if (style === 'ligne') drawHairLigne(cv, cam, ss); else drawHairStrokes(cv, cam, ss);
  for (const sign of [-1, 1]) {
    const ex = sign * es, ez = surfZc(es, HEAD_C.eyeY);
    const eye3D: Vec3 = [ex, HEAD_C.eyeY + es * 0.04, ez];
    const nrm = normalize(sub(eye3D, HEAD_C.craniumCenter));
    if (-(nrm[0] * cam.forward[0] + nrm[1] * cam.forward[1] + nrm[2] * cam.forward[2]) < 0.12) continue;
    const inner: Vec3 = [ex - sign * es * 0.42, eye3D[1], ez], outer: Vec3 = [ex + sign * es * 0.42, eye3D[1], ez];
    const cL = pc(sign < 0 ? outer : inner), cR = pc(sign < 0 ? inner : outer);
    const browY = HEAD_C.eyeY + es * 0.62;
    const bL = pc([ex - sign * es * 0.5, browY, surfZc(es, browY)]), bR = pc([ex + sign * es * 0.5, browY, surfZc(es, browY)]);
    if (style === 'ligne') { drawEyeLigne(cv, cL, cR); cleanArc(cv, bL, bR, -dist2(bL, bR) * 0.14, 2.6); }
    else { drawEye(cv, cL, cR, 300 + sign); drawBrow(cv, bL, bR, 320 + sign); }
  }
  // Mouth (+ ligne nose hook): front-facing surface marks only.
  const faceFront = -cam.forward[2];
  if (faceFront > 0.3) {
    const mw = es * 0.85;
    const mL = pc([-mw, HEAD_C.mouthY, surfZc(mw, HEAD_C.mouthY)]), mR = pc([mw, HEAD_C.mouthY, surfZc(mw, HEAD_C.mouthY)]);
    if (style === 'ligne') {
      cleanArc(cv, mL, mR, mw * 6 * 0.012 * SS, 2.6);   // simple mouth line, slight smile
      const nz = surfZc(0, HEAD_C.noseBaseY) + HEAD_C.craniumRadii[2] * 0.1;
      cleanArc(cv, pc([es * 0.04, HEAD_C.noseBaseY + es * 0.18, nz]), pc([es * 0.16, HEAD_C.noseBaseY - es * 0.02, nz]), es * 4, 2.6); // tiny nose hook
    } else {
      drawMouth(cv, mL, mR, 380);
    }
  }
};

// ---------------- render one view to a Canvas ----------------
const SS = 3; // supersample factor for ink
const renderView = (sdf: SDF, yaw: number, pitch: number, style: Style = 'natural') => {
  const cam = makeCamera(yaw, pitch);
  const g = renderGBuffer(sdf, cam);
  const cv = new Canvas(IMG * SS, IMG * SS);
  const ligne = style === 'ligne';
  const ink = (poly: Pt[], width: number, seed: number, closed = false) => {
    const s = simplify(poly, ligne ? 1.2 : 0.8).map((p) => ({ x: p.x * SS, y: p.y * SS }));
    if (s.length < 2) return;
    cv.stroke(s, ligne
      ? { width: closed ? 4.5 : 3, color: [24, 22, 30], wobble: 0, seed, closed, taper: false }
      : { width, color: [25, 25, 30], wobble: 1.1, seed, closed, taper: !closed });
  };
  // Tone first (under the strokes): darken the RECESSES so hollows read as
  // hollows. Screen-space depth cavity — how much further a pixel is than its
  // neighbourhood — fills the whole socket (deepest = darkest), unlike
  // normal-AO which leaves the socket floor bright (a donut that reads convex).
  // The core shades the SOCKET; it does not draw the eye.
  // Cavity map: how much further each pixel is than its facing neighbourhood,
  // gated so the grazing silhouette fringe (surface turning away, depth rising
  // for free) does not count as a recess. Drives BOTH tone and crease removal.
  const blur = blurDepthOverHits(g, 16);
  const cavity = new Float32Array(IMG * IMG);
  for (let i = 0; i < IMG * IMG; i++) {
    if (!g.hit[i]) continue;
    const facing = -(g.nx[i] * cam.forward[0] + g.ny[i] * cam.forward[1] + g.nz[i] * cam.forward[2]);
    if (facing < 0.35) continue;
    const c = (g.depth[i] - blur[i]) * Math.min(1, (facing - 0.35) / 0.4);
    if (c > 0) cavity[i] = c;
  }
  // SKIN: fill the whole head with a flesh ground, shaded by lambert (form) and
  // darkened in the cavities. This is what makes it read as a FACE instead of
  // lines floating on white — and it covers the wraith core's hollows. Features
  // draw on top.
  // Each hit pixel is HAIR or SKIN: reconstruct its world position and test the
  // bare-head SDF — if the hit sits off the face (positive), it is on the hair
  // shell. Hair gets a dark shaded fill, skin a flesh fill.
  const Lx = -0.3, Ly = 0.5, Lz = 0.82, Ln = Math.hypot(Lx, Ly, Lz);
  const skin = [240, 211, 190], hairCol = [70, 55, 63];
  for (let y = 0; y < IMG; y++) for (let x = 0; x < IMG; x++) {
    const i = y * IMG + x;
    if (!g.hit[i]) continue;
    const lam = Math.max(0, (g.nx[i] * Lx + g.ny[i] * Ly + g.nz[i] * Lz) / Ln);
    const u = (2 * (x + 0.5)) / IMG - 1, vv = 1 - (2 * (y + 0.5)) / IMG;
    const rd = normalize([
      cam.right[0] * u * cam.tanHalf + cam.up[0] * vv * cam.tanHalf + cam.forward[0],
      cam.right[1] * u * cam.tanHalf + cam.up[1] * vv * cam.tanHalf + cam.forward[1],
      cam.right[2] * u * cam.tanHalf + cam.up[2] * vv * cam.tanHalf + cam.forward[2],
    ]);
    const wp: Vec3 = [cam.origin[0] + rd[0] * g.depth[i], cam.origin[1] + rd[1] * g.depth[i], cam.origin[2] + rd[2] * g.depth[i]];
    const isHair = hairShellSDF(wp) < styledHead(wp);
    if (ligne) {
      // FLAT fills with a single hard cel shadow (ligne claire)
      const hairFlat = [196, 120, 56], hairSh = [150, 86, 40];   // Tintin auburn
      const skinFlat = [247, 220, 198], skinSh = [226, 192, 168];
      const shadow = cavity[i] > 0.02 || lam < 0.32;
      const c = isHair ? (shadow ? hairSh : hairFlat) : (shadow ? skinSh : skinFlat);
      cv.stamp((x + 0.5) * SS, (y + 0.5) * SS, SS * 0.72, c, 1);
    } else if (isHair) {                          // HAIR — light the big WIG form
      const sh = 0.5 + 0.55 * lam;
      cv.stamp((x + 0.5) * SS, (y + 0.5) * SS, SS * 0.72, [hairCol[0] * sh, hairCol[1] * sh, hairCol[2] * sh], 1);
    } else {                                      // SKIN
      let sh = 0.76 + 0.24 * lam;
      sh *= 1 - Math.min(0.38, cavity[i] * 9);
      cv.stamp((x + 0.5) * SS, (y + 0.5) * SS, SS * 0.72, [skin[0] * sh, skin[1] * sh, skin[2] * sh], 1);
    }
  }
  // silhouette (heaviest) — one closed outer loop
  ink(mooreTrace(g.hit, IMG, IMG), 5.5, 100, true);
  // interior creases / depth-steps (lighter) — recessed regions + their rim
  // removed so no socket/brow ring; only true form-breaks survive (nose, jaw).
  const recessed = new Uint8Array(IMG * IMG);
  for (let i = 0; i < recessed.length; i++) if (cavity[i] > 0.006) recessed[i] = 1;
  traceThin(creaseMask(g, dilate(recessed, 5))).forEach((p, i) => ink(p, 3.2, 200 + i, false));

  drawFace(cv, cam, g, SS, style);
  return cv.downscale(2);
};

// ---------------- diagnostic: plain shaded matte (SEE the geometry) ----------------
// No lines, no cavity tone — just lambert from the G-buffer normals + light AO.
// This is for reading the FORM (brow shelf, socket recession) decoupled from
// all the ink extraction, so geometry bugs don't hide behind shading choices.
const renderForm = (sdf: SDF, yaw: number, pitch: number) => {
  const cam = makeCamera(yaw, pitch);
  const g = renderGBuffer(sdf, cam);
  const cv = new Canvas(IMG * SS, IMG * SS);
  const L: Vec3 = normalize([-0.35, 0.55, 0.78]); // lamp: above, front, subject-left
  for (let y = 0; y < IMG; y++) for (let x = 0; x < IMG; x++) {
    const i = y * IMG + x;
    if (!g.hit[i]) continue;
    const lam = Math.max(0, g.nx[i] * L[0] + g.ny[i] * L[1] + g.nz[i] * L[2]);
    const ao = g.ao[i];
    const shade = (0.22 + 0.78 * lam) * (0.55 + 0.45 * ao); // 0..1
    const v = Math.round(235 * shade + 18);
    cv.stamp((x + 0.5) * SS, (y + 0.5) * SS, SS * 0.72, [v, v, v], 1);
  }
  return cv.downscale(2);
};

// ---------------- contact sheet ----------------
const main = () => {
  const outDir = '/home/user/harmony/proof/out';
  mkdirSync(outDir, { recursive: true });
  const sdf: SDF = (p) => Math.min(styledHead(p), hairShellSDF(p));
  const views: [string, number, number][] = [
    ['front', 0, 0.16],
    ['tq', -Math.PI / 4, 0.16],
    ['profile', -Math.PI / 2, 0.12],
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

  // SECOND STYLE: Hergé / ligne claire — same core, swapped style layer.
  const ltiles = views.map(([, yaw, pitch]) => renderView(sdf, yaw, pitch, 'ligne'));
  const lsheet = new Canvas(tw * 3 + pad * 4, th + pad * 2);
  ltiles.forEach((t, i) => lsheet.blit(t, pad + i * (tw + pad), pad));
  writeFileSync(`${outDir}/sdf_ligne.png`, lsheet.toPNG());
  console.log(`wrote ${outDir}/sdf_ligne.png`);

  // form diagnostic sheet
  const ftiles = views.map(([, yaw, pitch]) => renderForm(sdf, yaw, pitch));
  const fsheet = new Canvas(tw * 3 + pad * 4, th + pad * 2, [255, 255, 255]);
  ftiles.forEach((t, i) => fsheet.blit(t, pad + i * (tw + pad), pad));
  writeFileSync(`${outDir}/sdf_form.png`, fsheet.toPNG());
  console.log(`wrote ${outDir}/sdf_form.png`);
};
main();
