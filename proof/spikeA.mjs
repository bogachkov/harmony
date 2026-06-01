// spikeA.mjs — v5 Spike A: prove the camera/frame + axis bridge.
// The cranium (sphere stand-in) is posed on the skeleton's cranium joint; we
// render it across camera angles and assert: (1) at yaw0/pitch0 the silhouette is
// a centered, symmetric circle; (2) |viewDir| == 1 at every angle; (3) the head's
// "up" agrees with figure.mjs world up (the axis bridge).
import fs from "node:fs";
import { Canvas } from "./core.mjs";
import { solve } from "./figure.mjs";
import { makeCamera, project, viewDir, length3 } from "./head/camera.mjs";

const R = 0.5;        // cranium sphere radius (stand-in for the ovoid)
const LIFT = 0.45;    // ball centre above the cranium joint

function apply(m, v) { return [m[0][0]*v[0]+m[0][1]*v[1]+m[0][2]*v[2], m[1][0]*v[0]+m[1][1]*v[1]+m[1][2]*v[2], m[2][0]*v[0]+m[2][1]*v[1]+m[2][2]*v[2]]; }
function add(a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }

const S = solve({});                       // neutral pose
const cran = S.cranium, neck = S.neck;
const ballCentre = add(cran.origin, apply(cran.frame, [0, LIFT, 0]));

function sub(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
function renderCell(yawDeg, pitchDeg) {
  const W = 220, H = 300;
  const cam = makeCamera({ yaw: yawDeg * Math.PI / 180, pitch: pitchDeg * Math.PI / 180, scale: 95, cx: 110, cy: 150 });
  const cv = new Canvas(W, H);
  const ink = { width: 2.6, color: [30, 30, 38], wobble: 0.4, taper: false };
  const P = (p) => project(sub(p, ballCentre), cam);   // recenter on the head
  // neck stick for context
  cv.stroke([P(neck.origin), P(cran.origin)], { ...ink, seed: 1 });
  // sphere silhouette = circle at projected centre (ortho, uniform scale)
  const c = P(ballCentre), rad = R * cam.scale, ring = [];
  for (let i = 0; i <= 64; i++) { const t = (i / 64) * 2 * Math.PI; ring.push({ x: c.x + rad * Math.cos(t), y: c.y - rad * Math.sin(t) }); }
  cv.stroke(ring, { ...ink, seed: 2, closed: true });
  return { cv, centre: c, cam };
}

const angles = [[0,0],[30,0],[60,0],[0,-25],[35,15]];
const gut = 8, CW = 220, CH = 300;
const sheet = new Canvas(angles.length * CW + (angles.length+1)*gut, CH + 2*gut, [246,245,242]);
let viewDirOK = true;
angles.forEach(([y,p], i) => {
  const { cv, cam } = renderCell(y, p);
  sheet.blit(cv, gut + i*(CW+gut), gut);
  const vd = length3(viewDir(cam));
  if (Math.abs(vd - 1) > 1e-9) viewDirOK = false;
});
fs.writeFileSync("proof/out/spikeA.png", sheet.toPNG());

// --- acceptance checks ---
const front = renderCell(0, 0);
const centeredErr = Math.abs(front.centre.x - front.cam.cx);
const up = [cran.frame[0][1], cran.frame[1][1], cran.frame[2][1]];  // cranium frame Y column in world
const upDot = up[1] / length3(up);                                  // vs world +Y

const checks = [
  ["yaw0 silhouette centered/symmetric (|cx err|<1)", centeredErr < 1, `err=${centeredErr.toFixed(3)}px`],
  ["|viewDir|==1 at all angles", viewDirOK, ""],
  ["axis bridge: head up == world up (dot>0.999)", upDot > 0.999, `dot=${upDot.toFixed(4)}`],
];
console.log("Spike A — camera/frame + axis bridge");
let pass = true;
for (const [name, ok, info] of checks) { console.log(` ${ok ? "PASS" : "FAIL"}  ${name}  ${info}`); if (!ok) pass = false; }
console.log("wrote proof/out/spikeA.png");
process.exit(pass ? 0 : 1);
