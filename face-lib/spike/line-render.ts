// SPIKE — line-art extraction from an SDF. The risky bet.
//
// Question: can we turn a 3D SDF head into LINES that read as drawn, not as
// CGI edge-detection? This is a screen-space first pass (the cheap one from
// the true-3d-head-plan §5 "option A"):
//
//   1. Sphere-trace the SDF into depth + normal + hit buffers.
//   2. Silhouette = where hit/depth is discontinuous (object edge).
//   3. Creases  = where the normal turns sharply between neighbours (the
//      brow ridge, the nose bridge, the socket rim, the jaw line).
//   4. Emit those edge pixels as SVG dots/strokes so we can SEE the lines
//      a contour-trace pass would later join up.
//
// Output is an SVG per view (lines on white) + a PNG-ish nothing else. If the
// edges trace the construction (brow, nose, socket, jaw, silhouette) and hold
// when the head turns, the architecture is proven.

import { mkdirSync, writeFileSync } from 'node:fs';

import type { Vec3 } from '../src/math/vec3.ts';
import { add, sub, scale, dot, length, normalize, rotateYX } from '../src/math/vec3.ts';
import { spikeHead, DEFAULT_HEAD } from './head.ts';

const IMG = 256;
const MAX_STEPS = 160;
const MAX_DIST = 6.0;
const HIT_EPS = 0.0004;
const N_EPS = 0.0015;
const FOV_Y_DEG = 36;

type View = { name: string; yaw: number; pitch: number };
const VIEWS: View[] = [
  { name: 'front',     yaw: 0,             pitch: 0 },
  { name: 'tq-left',   yaw: -Math.PI / 4,  pitch: 0 },
  { name: 'profile',   yaw: -Math.PI / 2,  pitch: 0 },
];

const CAM_RADIUS = 4.4 * Math.max(...DEFAULT_HEAD.craniumRadii);
const CAM_TARGET: Vec3 = [0, -0.45, 0];

type SDF = (p: Vec3) => number;

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

type Camera = { origin: Vec3; forward: Vec3; right: Vec3; up: Vec3; tanHalf: number };
const makeCamera = (yaw: number, pitch: number): Camera => {
  const eyeRot = rotateYX([0, 0, CAM_RADIUS], yaw, pitch);
  const origin = add(CAM_TARGET, eyeRot);
  const forward = normalize(sub(CAM_TARGET, origin));
  const right = normalize(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  return { origin, forward, right, up, tanHalf: Math.tan((FOV_Y_DEG * Math.PI) / 360) };
};

const trace = (sdf: SDF, ro: Vec3, rd: Vec3): { hit: boolean; p: Vec3; t: number } => {
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
  const n: Vec3 = [
    sdf([p[0] + e, p[1], p[2]]) - sdf([p[0] - e, p[1], p[2]]),
    sdf([p[0], p[1] + e, p[2]]) - sdf([p[0], p[1] - e, p[2]]),
    sdf([p[0], p[1], p[2] + e]) - sdf([p[0], p[1], p[2] - e]),
  ];
  return normalize(n);
};

// Per-view G-buffer.
type GBuf = {
  hit: Uint8Array;     // 1 = hit
  depth: Float32Array; // ray t
  nx: Float32Array; ny: Float32Array; nz: Float32Array;
};

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
        hit[i] = 1;
        depth[i] = r.t;
        const n = normalAt(sdf, r.p);
        nx[i] = n[0]; ny[i] = n[1]; nz[i] = n[2];
      }
    }
  }
  return { hit, depth, nx, ny, nz };
};

// Edge extraction: returns per-pixel "ink" strength 0..1.
const extractEdges = (g: GBuf): Float32Array => {
  const ink = new Float32Array(IMG * IMG);
  const at = (x: number, y: number) => y * IMG + x;
  for (let y = 1; y < IMG - 1; y++) {
    for (let x = 1; x < IMG - 1; x++) {
      const i = at(x, y);
      if (!g.hit[i]) continue;
      // Silhouette: any 4-neighbour is a miss, or a big depth jump.
      let silhouette = false;
      let maxDepthJump = 0;
      const nbrs = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)];
      for (const j of nbrs) {
        if (!g.hit[j]) { silhouette = true; continue; }
        maxDepthJump = Math.max(maxDepthJump, Math.abs(g.depth[i]! - g.depth[j]!));
      }
      // Crease: normal angle vs right + down neighbour (if both hit).
      let crease = 0;
      const ni: Vec3 = [g.nx[i]!, g.ny[i]!, g.nz[i]!];
      for (const j of [at(x + 1, y), at(x, y + 1)]) {
        if (!g.hit[j]) continue;
        const nj: Vec3 = [g.nx[j]!, g.ny[j]!, g.nz[j]!];
        const c = Math.max(-1, Math.min(1, dot(ni, nj)));
        const ang = Math.acos(c); // radians
        crease = Math.max(crease, ang);
      }
      let v = 0;
      if (silhouette) v = 1;
      else if (maxDepthJump > 0.06) v = 1;                 // depth-step contour
      else if (crease > 0.55) v = Math.min(1, crease / 1.0); // ~31°+ creases ink
      ink[i] = v;
    }
  }
  return ink;
};

// Emit ink pixels as small SVG rects — enough to SEE the line structure.
const inkToSvg = (ink: Float32Array): string => {
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${IMG}" height="${IMG}" viewBox="0 0 ${IMG} ${IMG}">`);
  parts.push(`<rect width="${IMG}" height="${IMG}" fill="#fff"/>`);
  for (let y = 0; y < IMG; y++) {
    for (let x = 0; x < IMG; x++) {
      const v = ink[y * IMG + x]!;
      if (v <= 0) continue;
      const a = Math.min(1, v).toFixed(2);
      parts.push(`<rect x="${x}" y="${y}" width="1.2" height="1.2" fill="#111" opacity="${a}"/>`);
    }
  }
  parts.push(`</svg>`);
  return parts.join('');
};

const main = () => {
  const outDir = '/tmp/spike-lines';
  mkdirSync(outDir, { recursive: true });
  const sdf: SDF = (p) => spikeHead(p);
  const t0 = Date.now();
  for (const view of VIEWS) {
    const tv = Date.now();
    const cam = makeCamera(view.yaw, view.pitch);
    const g = renderGBuffer(sdf, cam);
    const ink = extractEdges(g);
    writeFileSync(`${outDir}/${view.name}.svg`, inkToSvg(ink));
    let inked = 0;
    for (let i = 0; i < ink.length; i++) if (ink[i]! > 0) inked++;
    console.log(`${view.name.padEnd(10)} -> ${outDir}/${view.name}.svg  (${inked} ink px, ${Date.now() - tv}ms)`);
  }
  console.log(`\n${VIEWS.length} views in ${Date.now() - t0}ms.`);
};

main();
