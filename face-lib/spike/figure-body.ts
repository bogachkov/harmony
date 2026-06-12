// figure-body.ts — MEGA: attach the SDF head to the posable stick figure
// (proof/figure.mjs) and expand its sticks into rough human-proportion volumes.
// Everything becomes ONE SDF world (capsule limbs + the head), raymarched and
// shaded together. Framework, not finished anatomy — just the head on a body.

import { createRequire } from 'node:module';
import type { Vec3 } from '../src/math/vec3.ts';
import { add, sub, scale, dot, length, normalize, rotateYX } from '../src/math/vec3.ts';
import { smin } from '../src/sdf/primitives.ts';
import { styledHead, hairShellSDF } from './style3d.ts';

const require = createRequire(import.meta.url);
const { Canvas } = require('../../proof/core.mjs') as any;
const { solve } = require('../../proof/figure.mjs') as any;
const { writeFileSync, mkdirSync } = require('node:fs') as typeof import('node:fs');

// ---- capsule (rounded cylinder) between two joints ----
const sdCapsule = (p: Vec3, a: Vec3, b: Vec3, r: number): number => {
  const pa = sub(p, a), ba = sub(b, a);
  const h = Math.max(0, Math.min(1, dot(pa, ba) / Math.max(1e-6, dot(ba, ba))));
  return length(sub(pa, scale(ba, h))) - r;
};

// ---- pose + solved skeleton ----
const POSE = { shoulderL: { z: 9 }, shoulderR: { z: -9 } };  // small gap arm<->torso
const S: Record<string, any> = solve(POSE);

// per-limb radii (body units). Trunk thick, neck thin, hands/feet small.
const RAD: Record<string, number> = {
  neck: 0.10,
  shoulderL: 0.13, shoulderR: 0.13, elbowL: 0.11, elbowR: 0.11, handL: 0.085, handR: 0.085,
  hipL: 0.17, hipR: 0.17, kneeL: 0.145, kneeR: 0.145, ankleL: 0.095, ankleR: 0.095,
};

const bodySDF = (p: Vec3): number => {
  let d = 1e9;
  for (const name of Object.keys(S)) {
    const j = S[name];
    if (!j.def) continue;
    if (name === 'abdomen' || name === 'chest' || name === 'cranium' || name === 'jaw') continue; // trunk done below; head separate
    const r = RAD[name] ?? 0.12;
    if (j.def.len) d = smin(d, sdCapsule(p, j.origin, j.tip, r), 0.06);
    else if (j.def.bone && j.seg) d = smin(d, sdCapsule(p, j.seg[0], j.seg[1], r), 0.06);
  }
  // trunk mass: a tapered torso + shoulder yoke + pelvis block
  d = smin(d, sdCapsule(p, S.chest.origin, S.pelvis.origin, 0.27), 0.12);
  d = smin(d, sdCapsule(p, S.shoulderL.origin, S.shoulderR.origin, 0.17), 0.14);
  d = smin(d, sdCapsule(p, S.hipL.origin, S.hipR.origin, 0.19), 0.14);
  // feet: a short toe capsule forward of each ankle
  for (const a of ['ankleL', 'ankleR']) {
    const j = S[a]; const toe = add(j.tip, [0, -0.04, 0.32]);
    d = smin(d, sdCapsule(p, j.tip, toe, 0.08), 0.05);
  }
  return d;
};

// ---- head: scale the SDF head and seat its chin on the neck top; cut off the
// head model's own neck stub (the body has a neck). ----
const Y_CUT = -0.62;          // head-space: keep above the chin
const HS = 1.0;               // head scale into body units
const NECK_TOP: Vec3 = S.neck.tip;
const T: Vec3 = [NECK_TOP[0], NECK_TOP[1] - Y_CUT * HS, NECK_TOP[2]];
const headSDF = (p: Vec3): number => {
  const lp: Vec3 = [(p[0] - T[0]) / HS, (p[1] - T[1]) / HS, (p[2] - T[2]) / HS];
  const h = Math.min(styledHead(lp), hairShellSDF(lp));
  return Math.max(h, -(lp[1] - Y_CUT)) * HS;   // drop everything below the chin
};

const scene = (p: Vec3): number => smin(bodySDF(p), headSDF(p), 0.08);

// ---- raymarch + lambert matte render ----
const IMG = 240, STEPS = 140, MAXD = 24, EPS = 0.001;
const normalAt = (p: Vec3): Vec3 => {
  const e = 0.002;
  return normalize([
    scene([p[0] + e, p[1], p[2]]) - scene([p[0] - e, p[1], p[2]]),
    scene([p[0], p[1] + e, p[2]]) - scene([p[0], p[1] - e, p[2]]),
    scene([p[0], p[1], p[2] + e]) - scene([p[0], p[1], p[2] - e]),
  ]);
};

const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const TARGET: Vec3 = [0, -0.65, 0];   // figure mid-height
const RADIUS = 9.6, TANH = Math.tan((42 * Math.PI) / 360);

const renderView = (yaw: number, pitch: number): any => {
  const eye = add(TARGET, rotateYX([0, 0, RADIUS], yaw, pitch));
  const fwd = normalize(sub(TARGET, eye));
  const right = normalize(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);
  const SS = 2, W = IMG * SS;
  const cv = new Canvas(W, W);
  const L = normalize([-0.35, 0.6, 0.75]);
  for (let py = 0; py < IMG; py++) {
    const v = 1 - (2 * (py + 0.5)) / IMG;
    for (let px = 0; px < IMG; px++) {
      const u = (2 * (px + 0.5)) / IMG - 1;
      const rd = normalize([
        right[0] * u * TANH + up[0] * v * TANH + fwd[0],
        right[1] * u * TANH + up[1] * v * TANH + fwd[1],
        right[2] * u * TANH + up[2] * v * TANH + fwd[2],
      ]);
      let t = 0, hit = false; let pos: Vec3 = eye;
      for (let i = 0; i < STEPS; i++) {
        pos = [eye[0] + rd[0] * t, eye[1] + rd[1] * t, eye[2] + rd[2] * t];
        const d = scene(pos);
        if (d < EPS) { hit = true; break; }
        t += d; if (t > MAXD) break;
      }
      if (!hit) continue;
      const n = normalAt(pos);
      const lam = Math.max(0, dot(n, L));
      const sh = 0.32 + 0.68 * lam;
      const isHead = headSDF(pos) < bodySDF(pos);
      const base = isHead ? [232, 200, 180] : [210, 198, 188];   // head warmer than the framework
      cv.stamp((px + 0.5) * SS, (py + 0.5) * SS, SS * 0.72, [base[0] * sh, base[1] * sh, base[2] * sh], 1);
    }
  }
  return cv.downscale(2);
};

const main = () => {
  const outDir = '/home/user/harmony/proof/out';
  mkdirSync(outDir, { recursive: true });
  const views: [string, number, number][] = [
    ['front', 0, 0.02], ['tq', -Math.PI / 5, 0.04], ['side', -Math.PI / 2, 0.02],
  ];
  const tiles = views.map(([name, yaw, pitch]) => {
    const t0 = Date.now(); const cv = renderView(yaw, pitch);
    console.log(`${name.padEnd(6)} ${Date.now() - t0}ms`); return cv;
  });
  const tw = tiles[0].w, th = tiles[0].h, pad = 12;
  const sheet = new Canvas(tw * tiles.length + pad * (tiles.length + 1), th + pad * 2, [250, 249, 246]);
  tiles.forEach((t: any, i: number) => sheet.blit(t, pad + i * (tw + pad), pad));
  writeFileSync(`${outDir}/figure_body.png`, sheet.toPNG());
  console.log(`wrote ${outDir}/figure_body.png`);
};
main();
