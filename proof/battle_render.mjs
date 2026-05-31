// battle_render.mjs — give the stick figure a sword and run 10 battle poses.
// Sword is a prop: a blade bone rigidly attached to the right hand's frame, so
// it rotates and reorients with the wrist for free (same FK machinery).
import fs from "node:fs";
import { Canvas, rotateYawPitch, project, deg } from "./core.mjs";
import { solve } from "./figure.mjs";

function apply(m, v) { return [m[0][0]*v[0]+m[0][1]*v[1]+m[0][2]*v[2], m[1][0]*v[0]+m[1][1]*v[1]+m[1][2]*v[2], m[2][0]*v[0]+m[2][1]*v[1]+m[2][2]*v[2]]; }
function add(a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }

// 10 battle poses. Right arm is the sword arm. Angles clamped by joint limits.
const POSES = [
  ["upper strike",   { shoulderR: { z: -175, x: 30 }, elbowR: { x: 25 }, shoulderL: { z: 70 }, elbowL: { x: 60 }, chest: { y: -15 }, hipL: { x: -15 }, kneeL: { x: -25 } }],
  ["forward strike", { shoulderR: { x: -95, z: -20 }, elbowR: { x: 15 }, shoulderL: { z: 50, x: 40 }, elbowL: { x: 80 }, chest: { y: -25 }, abdomen: { x: 15 }, hipR: { x: 45 }, kneeR: { x: -30 }, hipL: { x: -20 } }],
  ["jump strike",    { shoulderR: { z: -180, x: 20 }, elbowR: { x: 30 }, shoulderL: { z: 120 }, hipL: { x: 75 }, kneeL: { x: -110 }, hipR: { x: 40 }, kneeR: { x: -60 }, abdomen: { x: 10 } }],
  ["down parry",     { shoulderR: { x: -40, z: -50 }, elbowR: { x: 20 }, shoulderL: { z: 40 }, abdomen: { x: 20 }, chest: { y: -10 }, hipL: { x: -25 }, kneeL: { x: -30 }, hipR: { x: 30 }, kneeR: { x: -40 } }],
  ["up parry",       { shoulderR: { z: -150, x: -10 }, elbowR: { x: 95 }, shoulderL: { z: 30 }, chest: { x: -10 }, hipL: { x: 20 }, kneeL: { x: -30 } }],
  ["hit + drop",     { abdomen: { x: -30 }, chest: { x: -20, y: 15 }, neck: { x: -25 }, shoulderR: { z: -40, x: 30 }, elbowR: { x: 20 }, shoulderL: { z: 50, x: 40 }, hipR: { x: -20 }, kneeR: { x: -15 }, drop: true }],
  ["raise sword",    { shoulderR: { z: -178, x: 0 }, elbowR: { x: 5 }, shoulderL: { z: 25 }, neck: { x: 12 }, hipL: { x: -10 } }],            // Thundercats HOOO
  ["have the power",  { shoulderR: { z: -180 }, elbowR: { x: 0 }, shoulderL: { z: 130, x: 20 }, elbowL: { x: 70 }, chest: { y: -10 }, hipL: { z: 20 }, hipR: { z: -20 } }], // He-Man
  ["voltron sword",  { shoulderR: { z: -120, x: -30 }, elbowR: { x: 20 }, shoulderL: { z: 100, x: -20 }, elbowL: { x: 30 }, chest: { x: -8 }, hipL: { z: 15 }, hipR: { z: -15 } }], // two-hand overhead-forward
  ["guard stance",   { shoulderR: { x: -30, z: -60 }, elbowR: { x: 70 }, shoulderL: { z: 55, x: 30 }, elbowL: { x: 90 }, abdomen: { y: 10 }, chest: { y: 15 }, hipL: { x: 25, z: 10 }, kneeL: { x: -35 }, hipR: { x: -10, z: -20 }, kneeR: { x: -20 } }],
];

const ANGLES = [
  { yaw: 0, pitch: 0, label: "front" },
  { yaw: 40, pitch: 5, label: "3/4" },
  { yaw: 78, pitch: 0, label: "side" },
];

function renderCell(pose, yawDeg, pitchDeg) {
  const W = 250, H = 330, scale = 40, cx = 125, cy = 175;
  const cv = new Canvas(W, H);
  const S = solve(pose);
  const yaw = deg(yawDeg), pitch = deg(pitchDeg);
  const P = (p3) => { const r = rotateYawPitch(p3, yaw, pitch); return project(r, cx, cy, scale); };
  let seed = 5 + Math.round(yawDeg + pitchDeg * 2);
  const ink = { width: 2.8, color: [30, 30, 38], wobble: 0.4, taper: false };

  // torso triangle
  const sL = S.shoulderL, sR = S.shoulderR, pel = S.pelvis;
  if (sL && sR && pel) {
    cv.stroke([P(sL.origin), P(sR.origin)], { ...ink, seed: seed++ });
    cv.stroke([P(sL.origin), P(pel.origin)], { ...ink, seed: seed++ });
    cv.stroke([P(sR.origin), P(pel.origin)], { ...ink, seed: seed++ });
  }
  for (const name of Object.keys(S)) {
    const j = S[name];
    if (!j.def) continue;
    if (j.def.bone && j.seg) cv.stroke([P(j.seg[0]), P(j.seg[1])], { ...ink, seed: seed++ });
    if (j.def.len) {
      cv.stroke([P(j.origin), P(j.tip)], { ...ink, seed: seed++ });
      if (j.def.foot) cv.stroke([P(j.tip), P(add(j.tip, apply(j.frame, [0, -0.05, 0.45])))], { ...ink, seed: seed++ });
    }
    if (j.def.headR) {
      const c = P(j.tip || j.origin), r = j.def.headR * scale, ring = [];
      for (let i = 0; i <= 48; i++) { const t = (i/48)*2*Math.PI; ring.push({ x: c.x + r*Math.cos(t), y: c.y - r*Math.sin(t) }); }
      cv.stroke(ring, { ...ink, width: 2.4, seed: seed++, closed: true });
    }
  }

  // --- the sword ---
  const hand = S.handR;
  if (hand) {
    const grip = hand.tip;                       // hilt sits in the hand
    const f = hand.frame;
    const dropped = pose.drop;
    // when dropped, lay the blade along the ground in front of the feet
    const bladeDir = dropped ? [0.1, -1.2, 0.5] : [0, -2.4, 0];   // blade runs along hand -Y (forward of fingers)
    const guardDir = dropped ? [0.9, 0, 0] : [0.42, 0, 0];
    const tip = add(grip, apply(f, bladeDir));
    const pommel = add(grip, apply(f, [0, 0.32, 0]));
    const gA = add(grip, apply(f, [guardDir[0], guardDir[1], guardDir[2]]));
    const gB = add(grip, apply(f, [-guardDir[0], -guardDir[1], -guardDir[2]]));
    const swordInk = { width: 3.0, color: dropped ? [120,120,128] : [40, 40, 50], wobble: 0.25, taper: false };
    cv.stroke([P(pommel), P(tip)], { ...swordInk, seed: seed++ });   // blade + grip
    cv.stroke([P(gA), P(gB)], { ...swordInk, seed: seed++ });        // crossguard
    cv.stamp(P(tip).x, P(tip).y, 2.2, swordInk.color, 1);           // point
  }
  return cv;
}

const CW = 250, CH = 330, gut = 6;
const cols = ANGLES.length, rows = POSES.length;
const sheet = new Canvas(cols * CW + (cols+1)*gut, rows * CH + (rows+1)*gut, [248, 247, 244]);
POSES.forEach(([pname, pose], r) => {
  ANGLES.forEach((a, c) => sheet.blit(renderCell(pose, a.yaw, a.pitch), gut + c*(CW+gut), gut + r*(CH+gut)));
});
fs.writeFileSync("proof/out/battle_grid.png", sheet.toPNG());
fs.writeFileSync("proof/out/battle_grid_small.png", sheet.downscale(2).toPNG());
console.log("wrote proof/out/battle_grid.png (" + rows + " poses x " + cols + " angles)");
