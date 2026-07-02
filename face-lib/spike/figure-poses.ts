// figure-poses.ts — the dressed Hergé character comes ALIVE: a pose sheet.
// Same one-world raymarched SDF + region-paint as figure-body.ts (the finale),
// with three upgrades the finale's neutral stance never exercised:
//   1. the whole scene is rebuilt per POSE from the rig solve (figure.mjs);
//   2. the head rides the cranium FRAME, not just its position — it leans and
//      turns with the neck. The rig's limits are authored with anatomical
//      forward = -Z (hip flexion +x swings the thigh toward -Z, knees flex via
//      -x), so the head and toes mount toward -Z and the cameras sit on the
//      -Z side. Neutral renders identically to the finale, mirrored;
//   3. a flat contact-shadow ellipse under each planted foot (and prop)
//      grounds the figure — the finale floated.
// Poses: wave / walk / run / sit (the seated pose gets a stool prop).
//
// Run: node face-lib/spike/figure-poses.ts [--draft] [pose ...]

import { createRequire } from 'node:module';
import type { Vec3 } from '../src/math/vec3.ts';
import { add, sub, scale, dot, length, normalize, rotateYX } from '../src/math/vec3.ts';
import { smin } from '../src/sdf/primitives.ts';
import { styledHead, hairShellSDF } from './style3d.ts';
import { construct, DEFAULT_HEAD } from './head.ts';

const require = createRequire(import.meta.url);
const { Canvas } = require('../../proof/core.mjs') as any;
const { solve } = require('../../proof/figure.mjs') as any;
const { writeFileSync, mkdirSync } = require('node:fs') as typeof import('node:fs');

type Mat3 = number[][];
const apply = (m: Mat3, v: Vec3): Vec3 => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
];
const applyT = (m: Mat3, v: Vec3): Vec3 => [
  m[0][0] * v[0] + m[1][0] * v[1] + m[2][0] * v[2],
  m[0][1] * v[0] + m[1][1] * v[1] + m[2][1] * v[2],
  m[0][2] * v[0] + m[1][2] * v[1] + m[2][2] * v[2],
];
// head model bakes the face at local +Z; rig-forward is -Z. flip = Ry(pi).
const flip = (v: Vec3): Vec3 => [-v[0], v[1], -v[2]];

const sdCap = (p: Vec3, a: Vec3, b: Vec3, r: number): number => {
  const pa = sub(p, a), ba = sub(b, a);
  const h = Math.max(0, Math.min(1, dot(pa, ba) / Math.max(1e-6, dot(ba, ba))));
  return length(sub(pa, scale(ba, h))) - r;
};
const sdRoundBox = (p: Vec3, c: Vec3, b: Vec3, r: number): number => {
  const q: Vec3 = [Math.abs(p[0] - c[0]) - b[0], Math.abs(p[1] - c[1]) - b[1], Math.abs(p[2] - c[2]) - b[2]];
  const outside = length([Math.max(q[0], 0), Math.max(q[1], 0), Math.max(q[2], 0)]);
  return outside + Math.min(Math.max(q[0], Math.max(q[1], q[2])), 0) - r;
};

// ---- poses (angles in degrees, clamped by the rig's anatomical limits) ----
// x: flexion (+ = toward -Z / rig-forward), y: twist, z: abduction (+ = +X).
const POSES: Record<string, { pose: Record<string, any>; yaw: number; pitch: number; stool?: boolean; airborne?: boolean }> = {
  wave: {
    yaw: Math.PI, pitch: 0.02,
    pose: {
      // upper arm out to the side, y-twist turns the elbow hinge into the
      // frontal plane so the flexed forearm points up beside the head
      shoulderR: { z: -95, y: 90 }, elbowR: { x: 105 }, handR: { x: 25 },
      shoulderL: { z: 9 }, elbowL: { x: 8 },
      neck: { z: -7 }, cranium: { z: -5 },
      hipL: { z: 5 }, hipR: { z: -5 },
    },
  },
  walk: {
    yaw: Math.PI + Math.PI / 5, pitch: 0.03,
    pose: {
      abdomen: { x: 4 }, chest: { x: 3 }, neck: { x: -6 },
      hipL: { x: 27 }, kneeL: { x: -6 }, ankleL: { x: -12 },
      hipR: { x: -18 }, kneeR: { x: -48 }, ankleR: { x: 16 },
      shoulderR: { x: 24, z: -8 }, elbowR: { x: 20 },
      shoulderL: { x: -20, z: 8 }, elbowL: { x: 30 },
    },
  },
  run: {
    yaw: Math.PI / 2, pitch: 0.03, airborne: true,
    pose: {
      abdomen: { x: 14 }, chest: { x: 10 }, neck: { x: -22 },
      hipL: { x: 68 }, kneeL: { x: -80 }, ankleL: { x: -8 },
      hipR: { x: -26 }, kneeR: { x: -95 }, ankleR: { x: 18 },
      shoulderR: { x: 48, z: -6 }, elbowR: { x: 100 },
      shoulderL: { x: -46, z: 6 }, elbowL: { x: 95 },
    },
  },
  sit: {
    yaw: Math.PI + Math.PI / 5, pitch: 0.03, stool: true,
    pose: {
      abdomen: { x: 7 }, chest: { x: 4 }, neck: { x: -8 },
      hipL: { x: 85, z: 6 }, kneeL: { x: -78 }, ankleL: { x: -8 },
      hipR: { x: 85, z: -6 }, kneeR: { x: -78 }, ankleR: { x: -8 },
      shoulderR: { x: 20 }, elbowR: { x: 18 },
      shoulderL: { x: 20 }, elbowL: { x: 18 },
    },
  },
};

// region codes: 0 skin, 1 hair, 2 sweater, 3 jeans, 4 shoes, 5 stool
const PAL: Record<number, [number[], number[]]> = {
  0: [[247, 220, 198], [226, 192, 168]],   // skin
  1: [[198, 120, 54], [150, 86, 38]],       // ginger hair
  2: [[188, 78, 66], [150, 56, 48]],        // red sweater
  3: [[76, 102, 154], [56, 78, 124]],       // blue jeans
  4: [[74, 54, 42], [54, 38, 30]],          // brown shoes
  5: [[168, 162, 152], [138, 132, 122]],    // stool
};
const INK = [28, 26, 34];
const SHADOW = [226, 222, 213];             // flat contact shadow on the paper
const SHOE_R = 0.10, TOE: Vec3 = [0, -0.05, -0.34];

export const buildScene = (name: string) => {
  const P = POSES[name];
  const S: Record<string, any> = solve(P.pose);
  const WAIST: Vec3 = [
    (S.chest.origin[0] + S.pelvis.origin[0]) / 2,
    (S.chest.origin[1] + S.pelvis.origin[1]) / 2,
    (S.chest.origin[2] + S.pelvis.origin[2]) / 2,
  ];

  const sweaterSDF = (p: Vec3): number => {
    let d = sdCap(p, S.chest.origin, WAIST, 0.30);
    d = Math.min(d, sdCap(p, S.shoulderL.origin, S.shoulderR.origin, 0.20));
    for (const a of ['shoulderL', 'shoulderR', 'elbowL', 'elbowR']) {
      const j = S[a]; d = Math.min(d, sdCap(p, j.origin, j.tip, (a[0] === 's' ? 0.15 : 0.125)));
    }
    return d;
  };
  const jeansSDF = (p: Vec3): number => {
    let d = sdCap(p, WAIST, S.pelvis.origin, 0.29);
    d = Math.min(d, sdCap(p, S.hipL.origin, S.hipR.origin, 0.21));
    for (const a of ['hipL', 'hipR', 'kneeL', 'kneeR']) {
      const j = S[a]; d = Math.min(d, sdCap(p, j.origin, j.tip, (a[0] === 'h' ? 0.185 : 0.155)));
    }
    return d;
  };
  const handsSDF = (p: Vec3): number =>
    Math.min(sdCap(p, S.handL.origin, S.handL.tip, 0.09), sdCap(p, S.handR.origin, S.handR.tip, 0.09));
  const neckSDF = (p: Vec3): number => sdCap(p, S.neck.seg[0], S.neck.seg[1], 0.10);
  const toes: Record<string, Vec3> = {};
  const shoesSDF = (p: Vec3): number => {
    let d = 1e9;
    for (const a of ['ankleL', 'ankleR']) {
      const j = S[a];
      const toe = toes[a] ?? (toes[a] = add(j.tip, apply(j.frame, TOE)));
      d = Math.min(d, sdCap(p, j.origin, j.tip, SHOE_R), sdCap(p, j.tip, toe, SHOE_R));
    }
    return d;
  };
  shoesSDF([0, 0, 0]); // populate toes

  // ground = under the lowest shoe point; airborne poses hover a little
  const feet = (['ankleL', 'ankleR'] as const).map((a) => {
    const j = S[a]; const toe = toes[a]!;
    return { bottom: Math.min(j.tip[1], toe[1]) - SHOE_R, cx: (j.tip[0] + toe[0]) / 2, cz: (j.tip[2] + toe[2]) / 2 };
  });
  const groundY = Math.min(...feet.map((f) => f.bottom)) - (P.airborne ? 0.14 : 0);

  // stool prop for the seated pose: seat top just under the pelvis, legs to ground
  const seatTop = S.pelvis.origin[1] - 0.31;
  const stoolC: Vec3 = [0, (seatTop + groundY) / 2, 0.06];
  const stoolB: Vec3 = [0.42, (seatTop - groundY) / 2, 0.36];
  const stoolSDF = (p: Vec3): number => (P.stool ? sdRoundBox(p, stoolC, stoolB, 0.04) : 1e9);

  // ---- head (Hergé) riding the cranium frame, own neck stub cut ----
  const C = construct(DEFAULT_HEAD);
  const [HRX, HRY, HRZ] = C.craniumRadii;
  const surfZ = (x: number, y: number) => HRZ * Math.sqrt(Math.max(0, 1 - (x / HRX) ** 2 - (y / HRY) ** 2));
  const Y_CUT = -0.62, HS = 1.0;
  const R: Mat3 = S.cranium.frame;
  const NECK_TOP: Vec3 = S.neck.tip;
  const T: Vec3 = sub(NECK_TOP, scale(apply(R, flip([0, Y_CUT, 0])), HS));
  const toLocal = (p: Vec3): Vec3 => flip(applyT(R, scale(sub(p, T), 1 / HS)));
  const world = (l: Vec3): Vec3 => add(T, scale(apply(R, flip(l)), HS));
  const headSDF = (p: Vec3): number => {
    const lp = toLocal(p);
    return Math.max(Math.min(styledHead(lp), hairShellSDF(lp)), -(lp[1] - Y_CUT)) * HS;
  };
  const headFwd: Vec3 = apply(R, [0, 0, -1]);

  const bodyAll = (p: Vec3) => Math.min(sweaterSDF(p), jeansSDF(p), handsSDF(p), neckSDF(p), shoesSDF(p), stoolSDF(p));
  const scene = (p: Vec3) => smin(bodyAll(p), headSDF(p), 0.07);

  const classify = (p: Vec3): number => {
    const dh = headSDF(p), ds = sweaterSDF(p), dj = jeansSDF(p), dn = neckSDF(p), dha = handsSDF(p), df = shoesSDF(p), dst = stoolSDF(p);
    const m = Math.min(dh, ds, dj, dn, dha, df, dst);
    if (m === dh) { const lp = toLocal(p); return hairShellSDF(lp) < styledHead(lp) ? 1 : 0; }
    if (m === ds) return 2;
    if (m === dj) return 3;
    if (m === df) return 4;
    if (m === dst) return 5;
    return 0; // neck + hands = skin
  };

  // planted feet + prop cast the flat contact shadow
  const pads: { cx: number; cz: number; rx: number; rz: number }[] = [];
  for (const f of feet) if (P.airborne || f.bottom < groundY + 0.22) pads.push({ cx: f.cx, cz: f.cz, rx: 0.40, rz: 0.55 });
  if (P.stool) pads.push({ cx: stoolC[0], cz: stoolC[2], rx: 0.62, rz: 0.55 });
  const inShadow = (x: number, z: number): boolean =>
    pads.some((s) => ((x - s.cx) / s.rx) ** 2 + ((z - s.cz) / s.rz) ** 2 < 1);

  return { scene, classify, world, T, C, surfZ, headFwd, groundY, inShadow, yaw: P.yaw, pitch: P.pitch };
};

// ---- raymarch + paint ----
const DRAFT = process.argv.includes('--draft');
const IMG = DRAFT ? 130 : 240, STEPS = 150, MAXD = 26, EPS = 0.001, SS = 2;
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const TARGET: Vec3 = [0, -0.5, 0], RADIUS = 10.6, TANH = Math.tan((42 * Math.PI) / 360);

const renderPose = (name: string): any => {
  const W = buildScene(name);
  const { scene, classify } = W;
  const normalAt = (p: Vec3): Vec3 => {
    const e = 0.002;
    return normalize([
      scene([p[0] + e, p[1], p[2]]) - scene([p[0] - e, p[1], p[2]]),
      scene([p[0], p[1] + e, p[2]]) - scene([p[0], p[1] - e, p[2]]),
      scene([p[0], p[1], p[2] + e]) - scene([p[0], p[1], p[2] - e]),
    ]);
  };
  const eye = add(TARGET, rotateYX([0, 0, RADIUS], W.yaw, W.pitch));
  const fwd = normalize(sub(TARGET, eye));
  const right = normalize(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);
  const cv = new Canvas(IMG * SS, IMG * SS, [250, 249, 246]);
  const L = normalize([-0.35, 0.6, 0.75]);
  const hit = new Uint8Array(IMG * IMG), reg = new Int8Array(IMG * IMG);
  for (let py = 0; py < IMG; py++) {
    const v = 1 - (2 * (py + 0.5)) / IMG;
    for (let px = 0; px < IMG; px++) {
      const u = (2 * (px + 0.5)) / IMG - 1;
      const rd = normalize([right[0] * u * TANH + up[0] * v * TANH + fwd[0], right[1] * u * TANH + up[1] * v * TANH + fwd[1], right[2] * u * TANH + up[2] * v * TANH + fwd[2]]);
      let t = 0, did = false; let pos: Vec3 = eye;
      for (let i = 0; i < STEPS; i++) { pos = [eye[0] + rd[0] * t, eye[1] + rd[1] * t, eye[2] + rd[2] * t]; const d = scene(pos); if (d < EPS) { did = true; break; } t += d; if (t > MAXD) break; }
      const i = py * IMG + px;
      if (!did) {
        // ground contact shadow (flat, no outline) where the figure ray missed
        if (rd[1] < -1e-4) {
          const tg = (W.groundY - eye[1]) / rd[1];
          if (tg > 0 && W.inShadow(eye[0] + rd[0] * tg, eye[2] + rd[2] * tg))
            cv.stamp((px + 0.5) * SS, (py + 0.5) * SS, SS * 0.72, SHADOW, 1);
        }
        continue;
      }
      hit[i] = 1;
      const r = classify(pos); reg[i] = r;
      const lam = Math.max(0, dot(normalAt(pos), L));
      const [bc, sc] = PAL[r]; const c = lam < 0.42 ? sc : bc;
      cv.stamp((px + 0.5) * SS, (py + 0.5) * SS, SS * 0.72, c, 1);
    }
  }
  // clean outline at silhouette + region boundaries
  for (let py = 0; py < IMG; py++) for (let px = 0; px < IMG; px++) {
    const i = py * IMG + px; if (!hit[i]) continue;
    const edge = (px > 0 && (!hit[i - 1] || reg[i - 1] !== reg[i])) || (px < IMG - 1 && (!hit[i + 1] || reg[i + 1] !== reg[i]))
      || (py > 0 && (!hit[i - IMG] || reg[i - IMG] !== reg[i])) || (py < IMG - 1 && (!hit[i + IMG] || reg[i + IMG] !== reg[i]));
    if (edge) cv.stamp((px + 0.5) * SS, (py + 0.5) * SS, SS * 0.8, INK, 1);
  }
  // Hergé head marks (dot eyes, brow ticks, mouth) projected onto the head
  const proj = (Wp: Vec3) => { const rel = sub(Wp, eye); const cz = dot(rel, fwd); const cu = dot(rel, right) / cz / TANH; const cvv = dot(rel, up) / cz / TANH; return { x: ((cu + 1) / 2 * IMG) * SS, y: ((1 - cvv) / 2 * IMG) * SS }; };
  const { C, surfZ, world } = W;
  const eyeY = C.eyeY + C.eyeSpacing * 0.04;
  for (const s of [-1, 1]) {
    const Wp = world([s * C.eyeSpacing, eyeY, surfZ(C.eyeSpacing, eyeY)]);
    const nrm = normalize(sub(Wp, W.T)); if (-dot(nrm, fwd) < 0.05) continue;  // far eye hidden
    const q = proj(Wp);
    cv.stamp(q.x, q.y, DRAFT ? 2.0 : 3.4, INK, 1);
    const bl = proj(world([s * C.eyeSpacing - s * C.eyeSpacing * 0.4, eyeY + C.eyeSpacing * 0.6, surfZ(C.eyeSpacing, eyeY)]));
    const br = proj(world([s * C.eyeSpacing + s * C.eyeSpacing * 0.4, eyeY + C.eyeSpacing * 0.6, surfZ(C.eyeSpacing, eyeY)]));
    cv.stroke([{ x: bl.x, y: bl.y }, { x: br.x, y: br.y }], { width: 2.2, color: INK, wobble: 0, taper: false });
  }
  if (dot(W.headFwd, scale(fwd, -1)) > 0.35) {                              // mouth (front-ish only)
    const mw = C.eyeSpacing * 0.8;
    const ml = proj(world([-mw, C.mouthY, surfZ(mw, C.mouthY)])), mr = proj(world([mw, C.mouthY, surfZ(mw, C.mouthY)]));
    cv.stroke([{ x: ml.x, y: ml.y }, { x: (ml.x + mr.x) / 2, y: (ml.y + mr.y) / 2 + 3 }, { x: mr.x, y: mr.y }], { width: 2.2, color: INK, wobble: 0, taper: false });
  }
  return cv.downscale(2);
};

const main = () => {
  const outDir = '/home/user/harmony/proof/out';
  mkdirSync(outDir, { recursive: true });
  const names = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const order = names.length ? names : Object.keys(POSES);
  const tiles = order.map((n) => { const t0 = Date.now(); const cv = renderPose(n); console.log(`${n.padEnd(6)} ${Date.now() - t0}ms`); return cv; });
  const tw = tiles[0].w, th = tiles[0].h, pad = 12;
  const sheet = new Canvas(tw * tiles.length + pad * (tiles.length + 1), th + pad * 2, [250, 249, 246]);
  tiles.forEach((t: any, i: number) => sheet.blit(t, pad + i * (tw + pad), pad));
  const out = `${outDir}/figure_poses${DRAFT ? '_draft' : ''}.png`;
  writeFileSync(out, sheet.toPNG());
  console.log(`wrote ${out}`);
};
if (!process.env.POSE_PROBE) main();
