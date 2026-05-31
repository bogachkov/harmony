// figure_render.mjs — pose the stick figure 10 ways, render each across several
// camera angles. Proves FK joint rotation + limits + free viewpoint.
import fs from "node:fs";
import { Canvas, rotateYawPitch, project, deg } from "./core.mjs";
import { solve } from "./figure.mjs";

// 10 poses: name + per-joint euler degrees (clamped by limits in solve()).
const POSES = [
  ["neutral", {}],
  ["wave R", { armR: { z: -150 }, head: { y: 15 } }],
  ["both up", { armL: { z: 150 }, armR: { z: -150 } }],
  ["T-pose", { armL: { z: 95 }, armR: { z: -95 } }],
  ["run", { armL: { x: 70 }, armR: { x: -70 }, legL: { x: -55 }, legR: { x: 55 }, torso: { x: 18 } }],
  ["sit-ish", { legL: { x: -100 }, legR: { x: -100 }, torso: { x: 20 } }],
  ["star", { armL: { z: 130 }, armR: { z: -130 }, legL: { z: 40 }, legR: { z: -40 } }],
  ["twist", { torso: { y: 45 }, armL: { z: 60 }, armR: { z: -60 }, head: { y: -30 } }],
  ["kick", { legR: { x: 110 }, armL: { z: 80 }, torso: { x: -10 } }],
  ["slump", { torso: { x: 35, z: 15 }, head: { x: 25 }, armL: { z: 30 }, armR: { z: -30 } }],
];

const ANGLES = [
  { yaw: 0, pitch: 0, label: "front" },
  { yaw: 35, pitch: 5, label: "3/4" },
  { yaw: 75, pitch: 0, label: "side" },
  { yaw: 20, pitch: -28, label: "below" },
];

function renderCell(pose, yawDeg, pitchDeg) {
  const W = 230, H = 300, scale = 52, cx = 115, cy = 120;
  const cv = new Canvas(W, H);
  const solved = solve(pose);
  const yaw = deg(yawDeg), pitch = deg(pitchDeg);
  const P = (p3) => { const r = rotateYawPitch(p3, yaw, pitch); return project(r, cx, cy, scale); };
  let seed = 3 + Math.round(yawDeg + pitchDeg * 2);

  for (const name of Object.keys(solved)) {
    const j = solved[name];
    if (!j.def) continue;
    // bone from parent to joint
    if (j.def.bone && j.seg) {
      const a = P(j.seg[0]), b = P(j.seg[1]);
      cv.stroke([a, b], { width: 3.2, color: [30, 30, 38], wobble: 0.5, seed: seed++, taper: false });
    }
    // limb segment (joint -> tip)
    if (j.def.len) {
      const a = P(j.origin), b = P(j.tip);
      cv.stroke([a, b], { width: 3.0, color: [30, 30, 38], wobble: 0.5, seed: seed++, taper: false });
      cv.stamp(b.x, b.y, 3, [30, 30, 38], 1); // hand/foot dot
    }
    // head circle
    if (j.def.headR) {
      const c = P(j.tip), r = j.def.headR * scale, ring = [];
      for (let i = 0; i <= 48; i++) { const t = (i / 48) * 2 * Math.PI; ring.push({ x: c.x + r * Math.cos(t), y: c.y - r * Math.sin(t) }); }
      cv.stroke(ring, { width: 2.6, color: [30, 30, 38], wobble: 0.4, seed: seed++, closed: true, taper: false });
    }
    // joint dot
    cv.stamp(P(j.origin).x, P(j.origin).y, 3, [150, 60, 60], 1);
  }
  return cv;
}

// grid: 10 rows (poses) x 4 cols (angles)
const CW = 230, CH = 300, gut = 6, labelH = 0;
const cols = ANGLES.length, rows = POSES.length;
const sheet = new Canvas(cols * CW + (cols + 1) * gut, rows * CH + (rows + 1) * gut, [246, 245, 242]);
POSES.forEach(([pname, pose], r) => {
  ANGLES.forEach((a, c) => {
    const cell = renderCell(pose, a.yaw, a.pitch);
    sheet.blit(cell, gut + c * (CW + gut), gut + r * (CH + gut));
  });
});
fs.writeFileSync("proof/out/figure_grid.png", sheet.toPNG());
fs.writeFileSync("proof/out/figure_grid_small.png", sheet.downscale(2).toPNG());
console.log("wrote proof/out/figure_grid.png (" + rows + " poses x " + cols + " angles)");
