// voltron_render.mjs — weld the construction head onto the skeleton's neck joint.
// The head's 3D forms (cranium + jaw) live in head-local space; we map them into
// the posed neck joint's world frame, then the camera rotates the whole figure.
// Body draws as sticks; head draws as a merged construction outline. One figure.
import fs from "node:fs";
import { Canvas, rotateYawPitch, project, deg } from "./core.mjs";
import { solve } from "./figure.mjs";
import { craniumPoints, jawPoints, buildZ, traceMoore, largestComponent, smoothClosed, dp } from "./solid.mjs";

function apply(m, v) { return [m[0][0]*v[0]+m[0][1]*v[1]+m[0][2]*v[2], m[1][0]*v[0]+m[1][1]*v[1]+m[1][2]*v[2], m[2][0]*v[0]+m[2][1]*v[1]+m[2][2]*v[2]]; }
function add(a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }

const HEAD_SCALE = 0.5;   // cranium R=1 -> ~0.5 figure units (matches headR 0.42)
const HEAD_LIFT = 0.55;   // raise cranium centre above the neck joint

// Map a head-local point into world space via the neck joint's posed frame.
function headToWorld(p, neck) {
  const local = [p[0] * HEAD_SCALE, p[1] * HEAD_SCALE + HEAD_LIFT, p[2] * HEAD_SCALE];
  return add(neck.origin, apply(neck.frame, local));
}

function renderCell(pose, yawDeg, pitchDeg, label) {
  const W = 300, H = 360, scale = 40, cx = 150, cy = 215;
  const cv = new Canvas(W, H);
  const S = solve(pose);
  const yaw = deg(yawDeg), pitch = deg(pitchDeg);
  const P = (p3) => { const r = rotateYawPitch(p3, yaw, pitch); return project(r, cx, cy, scale); };
  let seed = 9 + Math.round(yawDeg + pitchDeg * 2);
  const ink = { width: 2.6, color: [30, 30, 38], wobble: 0.4, taper: false };

  // --- body sticks (skip the figure's own head circle; the construction head replaces it) ---
  const sL = S.shoulderL, sR = S.shoulderR, pel = S.pelvis;
  cv.stroke([P(sL.origin), P(sR.origin)], { ...ink, seed: seed++ });
  cv.stroke([P(sL.origin), P(pel.origin)], { ...ink, seed: seed++ });
  cv.stroke([P(sR.origin), P(pel.origin)], { ...ink, seed: seed++ });
  for (const name of Object.keys(S)) {
    const j = S[name];
    if (!j.def || name === "head") continue;
    if (j.def.bone && j.seg && name !== "head") cv.stroke([P(j.seg[0]), P(j.seg[1])], { ...ink, seed: seed++ });
    if (j.def.len) {
      cv.stroke([P(j.origin), P(j.tip)], { ...ink, seed: seed++ });
      if (j.def.foot) cv.stroke([P(j.tip), P(add(j.tip, apply(j.frame, [0, -0.05, 0.45])))], { ...ink, seed: seed++ });
    }
  }

  // --- construction head, welded to the neck frame, merged outline via z-buffer ---
  const neck = S.neck;
  const headWorld = (cloud) => cloud.map((p) => headToWorld(p, neck));
  const z = buildZ(W, H, cx, cy, scale, yaw, pitch, [headWorld(craniumPoints()), headWorld(jawPoints())], 1.6);
  const main = largestComponent(z, W, H);
  const raw = traceMoore(main, W, H);
  if (raw) {
    const simp = dp(smoothClosed(raw, 3), 1.0);
    cv.stroke([...simp, simp[0]], { width: 2.8, color: [22, 22, 28], wobble: 0.5, seed: seed++, closed: true, taper: false });
  }
  return cv;
}

// a few poses that show the head turning WITH the body
const POSES = [
  ["stand", {}],
  ["look away", { neck: { y: -55 }, chest: { y: 20 } }],
  ["bow head", { neck: { x: 35 }, chest: { x: 25 }, abdomen: { x: 20 } }],
  ["he-man", { shoulderR: { z: -180 }, shoulderL: { z: 130, x: 20 }, elbowL: { x: 70 }, neck: { x: -10 }, chest: { y: -8 } }],
  ["twist look", { abdomen: { y: 15 }, chest: { y: 30 }, neck: { y: 45 } }],
];
const ANGLES = [
  { yaw: 0, pitch: 3, label: "front" },
  { yaw: 38, pitch: 3, label: "3/4" },
  { yaw: 75, pitch: 2, label: "side" },
];

const CW = 300, CH = 360, gut = 6;
const cols = ANGLES.length, rows = POSES.length;
const sheet = new Canvas(cols * CW + (cols+1)*gut, rows * CH + (rows+1)*gut, [248, 247, 244]);
POSES.forEach(([pname, pose], r) => {
  ANGLES.forEach((a, c) => sheet.blit(renderCell(pose, a.yaw, a.pitch, pname), gut + c*(CW+gut), gut + r*(CH+gut)));
});
fs.writeFileSync("proof/out/voltron_grid.png", sheet.toPNG());
fs.writeFileSync("proof/out/voltron_grid_small.png", sheet.downscale(2).toPNG());
console.log("wrote proof/out/voltron_grid.png (" + rows + " poses x " + cols + " angles)");
