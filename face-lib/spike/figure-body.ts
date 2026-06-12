// figure-body.ts — FINALE: the Hergé (ligne-claire) head on the posable rig,
// the body dressed in a sweater + jeans. One raymarched SDF world; painted by
// REGION (sweater / jeans / skin / hair / shoes) in flat colours with one cel
// shadow and clean uniform outlines — Tintin-on-a-mannequin.

import { createRequire } from 'node:module';
import type { Vec3 } from '../src/math/vec3.ts';
import { add, sub, scale, dot, length, normalize, rotateYX, lerp } from '../src/math/vec3.ts';
import { smin } from '../src/sdf/primitives.ts';
import { styledHead, hairShellSDF } from './style3d.ts';
import { construct, DEFAULT_HEAD } from './head.ts';

const require = createRequire(import.meta.url);
const { Canvas } = require('../../proof/core.mjs') as any;
const { solve } = require('../../proof/figure.mjs') as any;
const { writeFileSync, mkdirSync } = require('node:fs') as typeof import('node:fs');

const sdCap = (p: Vec3, a: Vec3, b: Vec3, r: number): number => {
  const pa = sub(p, a), ba = sub(b, a);
  const h = Math.max(0, Math.min(1, dot(pa, ba) / Math.max(1e-6, dot(ba, ba))));
  return length(sub(pa, scale(ba, h))) - r;
};

const POSE = { shoulderL: { z: 11 }, shoulderR: { z: -11 } };
const S: Record<string, any> = solve(POSE);
const WAIST: Vec3 = lerp(S.chest.origin, S.pelvis.origin, 0.5);

// ---- clothing/skin region SDFs ----
const sweaterSDF = (p: Vec3): number => {
  let d = sdCap(p, S.chest.origin, WAIST, 0.30);                       // torso (sweater bulk)
  d = Math.min(d, sdCap(p, S.shoulderL.origin, S.shoulderR.origin, 0.20));
  for (const a of ['shoulderL', 'shoulderR', 'elbowL', 'elbowR']) {    // sleeves
    const j = S[a]; d = Math.min(d, sdCap(p, j.origin, j.tip, (a[0] === 's' ? 0.15 : 0.125)));
  }
  return d;
};
const jeansSDF = (p: Vec3): number => {
  let d = sdCap(p, WAIST, S.pelvis.origin, 0.29);                      // hips/seat
  d = Math.min(d, sdCap(p, S.hipL.origin, S.hipR.origin, 0.21));
  for (const a of ['hipL', 'hipR', 'kneeL', 'kneeR']) {               // trouser legs
    const j = S[a]; d = Math.min(d, sdCap(p, j.origin, j.tip, (a[0] === 'h' ? 0.185 : 0.155)));
  }
  return d;
};
const handsSDF = (p: Vec3): number =>
  Math.min(sdCap(p, S.handL.origin, S.handL.tip, 0.09), sdCap(p, S.handR.origin, S.handR.tip, 0.09));
const neckSDF = (p: Vec3): number => sdCap(p, S.neck.seg[0], S.neck.seg[1], 0.10);
const shoesSDF = (p: Vec3): number => {
  let d = 1e9;
  for (const a of ['ankleL', 'ankleR']) {
    const j = S[a]; d = Math.min(d, sdCap(p, j.origin, j.tip, 0.10), sdCap(p, j.tip, add(j.tip, [0, -0.05, 0.34]), 0.10));
  }
  return d;
};

// ---- head (Hergé) seated on the neck, own neck stub cut ----
const C = construct(DEFAULT_HEAD);
const [HRX, HRY, HRZ] = C.craniumRadii;
const surfZ = (x: number, y: number) => HRZ * Math.sqrt(Math.max(0, 1 - (x / HRX) ** 2 - (y / HRY) ** 2));
const Y_CUT = -0.62, HS = 1.0;
const NECK_TOP: Vec3 = S.neck.tip;
const T: Vec3 = [NECK_TOP[0], NECK_TOP[1] - Y_CUT * HS, NECK_TOP[2]];
const toLocal = (p: Vec3): Vec3 => [(p[0] - T[0]) / HS, (p[1] - T[1]) / HS, (p[2] - T[2]) / HS];
const headSDF = (p: Vec3): number => {
  const lp = toLocal(p);
  return Math.max(Math.min(styledHead(lp), hairShellSDF(lp)), -(lp[1] - Y_CUT)) * HS;
};

const bodyAll = (p: Vec3) => Math.min(sweaterSDF(p), jeansSDF(p), handsSDF(p), neckSDF(p), shoesSDF(p));
const scene = (p: Vec3) => smin(bodyAll(p), headSDF(p), 0.07);

// region codes: 0 skin, 1 hair, 2 sweater, 3 jeans, 4 shoes
const classify = (p: Vec3): number => {
  const dh = headSDF(p), ds = sweaterSDF(p), dj = jeansSDF(p), dn = neckSDF(p), dha = handsSDF(p), df = shoesSDF(p);
  const m = Math.min(dh, ds, dj, dn, dha, df);
  if (m === dh) { const lp = toLocal(p); return hairShellSDF(lp) < styledHead(lp) ? 1 : 0; }
  if (m === ds) return 2;
  if (m === dj) return 3;
  if (m === df) return 4;
  return 0; // neck + hands = skin
};

// flat ligne palette: [base, cel-shadow]
const PAL: Record<number, [number[], number[]]> = {
  0: [[247, 220, 198], [226, 192, 168]],   // skin
  1: [[198, 120, 54], [150, 86, 38]],       // ginger hair
  2: [[188, 78, 66], [150, 56, 48]],        // red sweater
  3: [[76, 102, 154], [56, 78, 124]],       // blue jeans
  4: [[74, 54, 42], [54, 38, 30]],          // brown shoes
};
const INK = [28, 26, 34];

// ---- raymarch + paint ----
const IMG = 240, STEPS = 150, MAXD = 26, EPS = 0.001, SS = 2;
const normalAt = (p: Vec3): Vec3 => {
  const e = 0.002;
  return normalize([
    scene([p[0] + e, p[1], p[2]]) - scene([p[0] - e, p[1], p[2]]),
    scene([p[0], p[1] + e, p[2]]) - scene([p[0], p[1] - e, p[2]]),
    scene([p[0], p[1], p[2] + e]) - scene([p[0], p[1], p[2] - e]),
  ]);
};
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const TARGET: Vec3 = [0, -0.65, 0], RADIUS = 9.6, TANH = Math.tan((42 * Math.PI) / 360);

const renderView = (yaw: number, pitch: number): any => {
  const eye = add(TARGET, rotateYX([0, 0, RADIUS], yaw, pitch));
  const fwd = normalize(sub(TARGET, eye));
  const right = normalize(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);
  const cv = new Canvas(IMG * SS, IMG * SS);
  const L = normalize([-0.35, 0.6, 0.75]);
  const hit = new Uint8Array(IMG * IMG), reg = new Int8Array(IMG * IMG);
  // pass 1: fill flat colours + cel shadow
  for (let py = 0; py < IMG; py++) {
    const v = 1 - (2 * (py + 0.5)) / IMG;
    for (let px = 0; px < IMG; px++) {
      const u = (2 * (px + 0.5)) / IMG - 1;
      const rd = normalize([right[0] * u * TANH + up[0] * v * TANH + fwd[0], right[1] * u * TANH + up[1] * v * TANH + fwd[1], right[2] * u * TANH + up[2] * v * TANH + fwd[2]]);
      let t = 0, did = false; let pos: Vec3 = eye;
      for (let i = 0; i < STEPS; i++) { pos = [eye[0] + rd[0] * t, eye[1] + rd[1] * t, eye[2] + rd[2] * t]; const d = scene(pos); if (d < EPS) { did = true; break; } t += d; if (t > MAXD) break; }
      if (!did) continue;
      const i = py * IMG + px; hit[i] = 1;
      const r = classify(pos); reg[i] = r;
      const lam = Math.max(0, dot(normalAt(pos), L));
      const [bc, sc] = PAL[r]; const c = lam < 0.42 ? sc : bc;
      cv.stamp((px + 0.5) * SS, (py + 0.5) * SS, SS * 0.72, c, 1);
    }
  }
  // pass 2: clean outline at silhouette + region boundaries
  for (let py = 0; py < IMG; py++) for (let px = 0; px < IMG; px++) {
    const i = py * IMG + px; if (!hit[i]) continue;
    const edge = (px > 0 && (!hit[i - 1] || reg[i - 1] !== reg[i])) || (px < IMG - 1 && (!hit[i + 1] || reg[i + 1] !== reg[i]))
      || (py > 0 && (!hit[i - IMG] || reg[i - IMG] !== reg[i])) || (py < IMG - 1 && (!hit[i + IMG] || reg[i + IMG] !== reg[i]));
    if (edge) cv.stamp((px + 0.5) * SS, (py + 0.5) * SS, SS * 0.8, INK, 1);
  }
  // pass 3: Hergé head marks (dot eyes, brow ticks, mouth) projected onto the head
  const proj = (W: Vec3) => { const rel = sub(W, eye); const cz = dot(rel, fwd); const cu = dot(rel, right) / cz / TANH; const cvv = dot(rel, up) / cz / TANH; return { x: ((cu + 1) / 2 * IMG) * SS, y: ((1 - cvv) / 2 * IMG) * SS, cz }; };
  const world = (lx: number, ly: number, lz: number): Vec3 => [T[0] + HS * lx, T[1] + HS * ly, T[2] + HS * lz];
  const eyeY = C.eyeY + C.eyeSpacing * 0.04;
  const eyePts: { x: number; y: number }[] = [];
  for (const s of [-1, 1]) {
    const W = world(s * C.eyeSpacing, eyeY, surfZ(C.eyeSpacing, eyeY));
    const nrm = normalize(sub(W, T)); if (-dot(nrm, fwd) < 0.2) continue;  // far eye hidden
    const q = proj(W); eyePts.push(q);
    cv.stamp(q.x, q.y, 3.4, INK, 1);                                       // the eye dot
    const bl = proj(world(s * C.eyeSpacing - s * C.eyeSpacing * 0.4, eyeY + C.eyeSpacing * 0.6, surfZ(C.eyeSpacing, eyeY)));
    const br = proj(world(s * C.eyeSpacing + s * C.eyeSpacing * 0.4, eyeY + C.eyeSpacing * 0.6, surfZ(C.eyeSpacing, eyeY)));
    cv.stroke([{ x: bl.x, y: bl.y }, { x: br.x, y: br.y }], { width: 2.2, color: INK, wobble: 0, taper: false });  // brow tick
  }
  if (-fwd[2] > 0.35) {                                                    // mouth (front-ish only)
    const mw = C.eyeSpacing * 0.8;
    const ml = proj(world(-mw, C.mouthY, surfZ(mw, C.mouthY))), mr = proj(world(mw, C.mouthY, surfZ(mw, C.mouthY)));
    cv.stroke([{ x: ml.x, y: ml.y }, { x: (ml.x + mr.x) / 2, y: (ml.y + mr.y) / 2 + 3 }, { x: mr.x, y: mr.y }], { width: 2.2, color: INK, wobble: 0, taper: false });
  }
  return cv.downscale(2);
};

const main = () => {
  const outDir = '/home/user/harmony/proof/out';
  mkdirSync(outDir, { recursive: true });
  const views: [string, number, number][] = [['front', 0, 0.02], ['tq', -Math.PI / 5, 0.04], ['side', -Math.PI / 2, 0.02]];
  const tiles = views.map(([name, yaw, pitch]) => { const t0 = Date.now(); const cv = renderView(yaw, pitch); console.log(`${name.padEnd(6)} ${Date.now() - t0}ms`); return cv; });
  const tw = tiles[0].w, th = tiles[0].h, pad = 12;
  const sheet = new Canvas(tw * tiles.length + pad * (tiles.length + 1), th + pad * 2, [250, 249, 246]);
  tiles.forEach((t: any, i: number) => sheet.blit(t, pad + i * (tw + pad), pad));
  writeFileSync(`${outDir}/figure_dressed.png`, sheet.toPNG());
  console.log(`wrote ${outDir}/figure_dressed.png`);
};
main();
