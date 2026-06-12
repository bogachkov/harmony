// voltron_render.mjs — skeleton + construction forms, attached uniformly.
// THE RULE (same for every body part, now and later): a joint owns a 3D form
// defined in the joint's LOCAL space; FK maps that form into world via the
// joint's posed frame. cranium rides the neck; jaw is a hinge child of the
// cranium and opens independently. Both use the identical attach mechanism.
import fs from "node:fs";
import { Canvas, rotateYawPitch, project, deg } from "./core.mjs";
import { solve, byName } from "./figure.mjs";
import { craniumPoints, jawPoints, buildZ, traceMoore, largestComponent, smoothClosed, dp } from "./solid.mjs";

function apply(m, v) { return [m[0][0]*v[0]+m[0][1]*v[1]+m[0][2]*v[2], m[1][0]*v[0]+m[1][1]*v[1]+m[1][2]*v[2], m[2][0]*v[0]+m[2][1]*v[1]+m[2][2]*v[2]]; }
function add(a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }

const FORM_SCALE = 0.5;   // construction units -> figure units

// form point-clouds in their own LOCAL space, keyed by the form name a joint declares.
// cranium centre is lifted so the ball sits above its joint; jaw hangs from its hinge.
const FORMS = {
  cranium: () => craniumPoints().map((p) => [p[0]*FORM_SCALE, p[1]*FORM_SCALE + 0.30, p[2]*FORM_SCALE]),
  jaw:     () => jawPoints().map((p) => [p[0]*FORM_SCALE, (p[1]+0.6)*FORM_SCALE, p[2]*FORM_SCALE]),
};

// Generic: gather every joint that owns a form, mapped into world via its frame.
function worldForms(S) {
  const clouds = [];
  for (const name of Object.keys(S)) {
    const j = S[name];
    const def = byName[name];
    if (!def || !def.form || !FORMS[def.form]) continue;
    const local = FORMS[def.form]();
    clouds.push(local.map((p) => add(j.origin, apply(j.frame, p))));
  }
  return clouds;
}

function renderCell(pose, yawDeg, pitchDeg) {
  const W = 300, H = 360, scale = 40, cx = 150, cy = 215;
  const cv = new Canvas(W, H);
  const S = solve(pose);
  const yaw = deg(yawDeg), pitch = deg(pitchDeg);
  const P = (p3) => { const r = rotateYawPitch(p3, yaw, pitch); return project(r, cx, cy, scale); };
  let seed = 9 + Math.round(yawDeg + pitchDeg * 2);
  const ink = { width: 2.6, color: [30, 30, 38], wobble: 0.4, taper: false };

  // body sticks (skip joints that own a head form; the construction replaces them)
  const sL = S.shoulderL, sR = S.shoulderR, pel = S.pelvis;
  cv.stroke([P(sL.origin), P(sR.origin)], { ...ink, seed: seed++ });
  cv.stroke([P(sL.origin), P(pel.origin)], { ...ink, seed: seed++ });
  cv.stroke([P(sR.origin), P(pel.origin)], { ...ink, seed: seed++ });
  for (const name of Object.keys(S)) {
    const j = S[name], def = byName[name];
    if (!def || def.form) continue;                  // form-owning joints drawn separately
    if (def.bone && j.seg && name !== "neck") cv.stroke([P(j.seg[0]), P(j.seg[1])], { ...ink, seed: seed++ });
    if (def.len) {
      cv.stroke([P(j.origin), P(j.tip)], { ...ink, seed: seed++ });
      if (def.foot) cv.stroke([P(j.tip), P(add(j.tip, apply(j.frame, [0, -0.05, 0.45])))], { ...ink, seed: seed++ });
    }
  }

  // construction forms (cranium + jaw), merged into one outline via z-buffer.
  const z = buildZ(W, H, cx, cy, scale, yaw, pitch, worldForms(S), 1.6);
  const raw = traceMoore(largestComponent(z, W, H), W, H);
  if (raw) {
    const simp = dp(smoothClosed(raw, 3), 1.0);
    cv.stroke([...simp, simp[0]], { width: 2.8, color: [22, 22, 28], wobble: 0.5, seed: seed++, closed: true, taper: false });
  }
  return cv;
}

// poses chosen to show: head turns on neck, AND jaw opens independently.
const POSES = [
  ["mouth closed", {}],
  ["mouth open", { jaw: { x: 30 } }],
  ["look + shout", { neck: { y: -45 }, chest: { y: 18 }, jaw: { x: 30 } }],
  ["bow, jaw shut", { neck: { x: 35 }, chest: { x: 25 }, abdomen: { x: 18 } }],
  ["tilt + yell", { neck: { x: -18, y: 20 }, jaw: { x: 32 } }],
];
const ANGLES = [
  { yaw: 0, pitch: 3, label: "front" },
  { yaw: 40, pitch: 3, label: "3/4" },
  { yaw: 78, pitch: 2, label: "side" },
];

const CW = 300, CH = 360, gut = 6;
const cols = ANGLES.length, rows = POSES.length;
const sheet = new Canvas(cols * CW + (cols+1)*gut, rows * CH + (rows+1)*gut, [248, 247, 244]);
POSES.forEach(([pname, pose], r) => {
  ANGLES.forEach((a, c) => sheet.blit(renderCell(pose, a.yaw, a.pitch), gut + c*(CW+gut), gut + r*(CH+gut)));
});
fs.writeFileSync("proof/out/voltron_grid.png", sheet.toPNG());
fs.writeFileSync("proof/out/voltron_grid_small.png", sheet.downscale(2).toPNG());
console.log("wrote proof/out/voltron_grid.png (" + rows + " poses x " + cols + " angles)");
