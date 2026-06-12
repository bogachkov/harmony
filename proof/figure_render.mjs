// figure_render.mjs — pose the full stick figure 10 ways across 4 camera angles.
import fs from "node:fs";
import { Canvas, rotateYawPitch, project, deg } from "./core.mjs";
import { solve } from "./figure.mjs";

// 10 poses. Angles are clamped by each joint's limits inside solve().
const POSES = [
  ["stand", {}],
  ["wave R", { shoulderR: { z: -150, x: 20 }, elbowR: { x: 70 }, neck: { y: 15 } }],
  ["T-pose", { shoulderL: { z: 95 }, shoulderR: { z: -95 } }],
  ["reach up", { shoulderL: { z: 165 }, shoulderR: { z: -165 }, elbowL: { x: 20 }, elbowR: { x: 20 } }],
  ["run", { shoulderL: { x: 60 }, elbowL: { x: 80 }, shoulderR: { x: -50 }, elbowR: { x: 60 },
            hipL: { x: -30 }, kneeL: { x: -40 }, hipR: { x: 50 }, kneeR: { x: -70 }, abdomen: { x: 18 } }],
  ["sit", { hipL: { x: 95 }, kneeL: { x: -100 }, hipR: { x: 95 }, kneeR: { x: -100 }, abdomen: { x: 10 } }],
  ["twist", { abdomen: { y: 18 }, chest: { y: 28 }, neck: { y: -40 },
              shoulderL: { z: 70, x: 30 }, shoulderR: { z: -40 } }],
  ["kick", { hipR: { x: 110 }, kneeR: { x: -20 }, shoulderL: { z: 80 }, abdomen: { x: -12 } }],
  ["bow", { abdomen: { x: 50 }, chest: { x: 30 }, neck: { x: -20 },
            shoulderL: { z: 30 }, shoulderR: { z: -30 } }],
  ["lean+arms", { abdomen: { z: 20 }, chest: { z: 12 },
                  shoulderL: { z: 120, x: 20 }, elbowL: { x: 90 }, shoulderR: { z: -60 }, elbowR: { x: 40 },
                  hipR: { z: -20 } }],
];

const ANGLES = [
  { yaw: 0, pitch: 0, label: "front" },
  { yaw: 35, pitch: 5, label: "3/4" },
  { yaw: 80, pitch: 0, label: "side" },
  { yaw: 20, pitch: -26, label: "below" },
];

function renderCell(pose, yawDeg, pitchDeg) {
  const W = 230, H = 320, scale = 42, cx = 115, cy = 175;
  const cv = new Canvas(W, H);
  const S = solve(pose);
  const yaw = deg(yawDeg), pitch = deg(pitchDeg);
  const P = (p3) => { const r = rotateYawPitch(p3, yaw, pitch); return project(r, cx, cy, scale); };
  let seed = 3 + Math.round(yawDeg + pitchDeg * 2);
  const ink = { width: 2.8, color: [30, 30, 38], wobble: 0.4, taper: false };

  // chest triangle: the two shoulders down to the pelvis (torso mass cue).
  const sL = S.shoulderL, sR = S.shoulderR, pel = S.pelvis;
  if (sL && sR && pel) {
    const a = P(sL.origin), b = P(sR.origin), c = P(pel.origin);
    cv.stroke([a, b], { ...ink, seed: seed++ });
    cv.stroke([a, c], { ...ink, seed: seed++ });
    cv.stroke([b, c], { ...ink, seed: seed++ });
  }

  for (const name of Object.keys(S)) {
    const j = S[name];
    if (!j.def) continue;
    if (j.def.bone && j.seg) cv.stroke([P(j.seg[0]), P(j.seg[1])], { ...ink, seed: seed++ });
    if (j.def.len) {
      cv.stroke([P(j.origin), P(j.tip)], { ...ink, seed: seed++ });
      if (j.def.foot) {
        const heel = P(j.tip), toe = P(add(j.tip, apply(j.frame, [0, -0.05, 0.45])));
        cv.stroke([heel, toe], { ...ink, seed: seed++ });
      }
    }
    if (j.def.headR) {
      const c = P(j.tip || j.origin), r = j.def.headR * scale, ring = [];
      for (let i = 0; i <= 48; i++) { const t = (i/48)*2*Math.PI; ring.push({ x: c.x + r*Math.cos(t), y: c.y - r*Math.sin(t) }); }
      cv.stroke(ring, { ...ink, width: 2.4, seed: seed++, closed: true });
    }
    cv.stamp(P(j.origin).x, P(j.origin).y, 2.6, [150, 60, 60], 1); // joint dot
  }
  return cv;
}
function add(a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
function apply(m, v) { return [m[0][0]*v[0]+m[0][1]*v[1]+m[0][2]*v[2], m[1][0]*v[0]+m[1][1]*v[1]+m[1][2]*v[2], m[2][0]*v[0]+m[2][1]*v[1]+m[2][2]*v[2]]; }

const CW = 230, CH = 320, gut = 6;
const cols = ANGLES.length, rows = POSES.length;
const sheet = new Canvas(cols * CW + (cols+1)*gut, rows * CH + (rows+1)*gut, [246, 245, 242]);
POSES.forEach(([pname, pose], r) => {
  ANGLES.forEach((a, c) => {
    sheet.blit(renderCell(pose, a.yaw, a.pitch), gut + c*(CW+gut), gut + r*(CH+gut));
  });
});
fs.writeFileSync("proof/out/figure_grid.png", sheet.toPNG());
fs.writeFileSync("proof/out/figure_grid_small.png", sheet.downscale(2).toPNG());
console.log("wrote proof/out/figure_grid.png (" + rows + " poses x " + cols + " angles)");
