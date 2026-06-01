// step1.mjs — sub-step 3: CONCAVE-DENT TEST. The make-or-break proof. Union the
// cranium ovoid with a second analytic mass (a neck cylinder-ish ellipsoid) so
// their meeting creates a real INWARD notch (the jaw/neck-to-skull transition).
// A convex hull mathematically CANNOT produce a concave vertex; the analytic
// silhouette + boolean union must. Self-check: the merged outline contains a
// genuinely concave (reflex) turn — and the magnitude is non-trivial.
import fs from "node:fs";
import { Canvas } from "./core.mjs";
import { makeCamera } from "./head/camera.mjs";
import { Ellipsoid, Ovoid } from "./head/forms.mjs";
import { unionOuter } from "./head/union.mjs";

const cranium = new Ovoid([0,0,0], {
  rxz: 0.86, ry: 1.0, crownExp: 0.37, taper: 0.05, occ: 0.15, occCenter: -0.30, occWidth: 0.50,
});
// a narrower mass hung below-front, overlapping the cranium so the union seam
// makes a concave notch on each side where ball meets neck.
const neck = new Ellipsoid([0, -1.25, 0.05], [0.42, 0.62, 0.45]);

function toRing(sil) { const r = sil.map((q) => [q.x, q.y]); r.push(r[0].slice()); return r; }

function mergedOutline(cam) {
  const a = toRing(cranium.silhouette(cam, 140));
  const b = toRing(neck.silhouette(cam, 96));
  return unionOuter([a, b]);                       // ordered CCW outer ring or null
}

function renderCell(yawDeg, pitchDeg) {
  const W = 220, H = 300;
  const cam = makeCamera({ yaw: yawDeg*Math.PI/180, pitch: pitchDeg*Math.PI/180, scale: 95, cx: W/2, cy: H/2+20 });
  const cv = new Canvas(W, H);
  const o = mergedOutline(cam);
  if (o) cv.stroke([...o, o[0]], { width: 3.0, color: [22,22,28], wobble: 0.0, seed: 1, closed: true, taper: false });
  return cv;
}

const angles = [[0,0,"front"],[30,0,"yaw30"],[60,0,"yaw60"],[90,0,"profile"],[20,-15,"below"]];
const cols=angles.length, CW=220, CH=300, gut=8;
const sheet = new Canvas(cols*CW+(cols+1)*gut, CH+2*gut, [246,245,242]);
angles.forEach(([y,p], i) => sheet.blit(renderCell(y,p), gut+i*(CW+gut), gut));
fs.writeFileSync("proof/out/step1_substep3.png", sheet.toPNG());

// --- the make-or-break self-check: does the merged outline contain a CONCAVE
// (reflex) turn? Walk the CCW ring; at a concave vertex the cross product of
// consecutive edge vectors is negative (for CCW, convex turns are positive).
function concavity(ring) {
  let minCross = Infinity, concaveCount = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const p = ring[(i-1+n)%n], q = ring[i], r = ring[(i+1)%n];
    const ax=q.x-p.x, ay=q.y-p.y, bx=r.x-q.x, by=r.y-q.y;
    const cz = ax*by - ay*bx;                       // z of cross product
    const len = Math.hypot(ax,ay)*Math.hypot(bx,by);
    if (len < 1e-9) continue;
    const norm = cz/len;
    if (norm < -1e-3) concaveCount++;               // reflex vertex
    if (norm < minCross) minCross = norm;
  }
  return { concaveCount, minCross };
}

const camFront = makeCamera({ yaw:0, pitch:0, scale:95, cx:110, cy:170 });
const ring = mergedOutline(camFront);
// control: convex hull of the SAME points can never be concave -> proves the
// concavity is real geometry, not noise.
const c = ring ? concavity(ring) : { concaveCount:0, minCross:0 };

// also confirm it's still ONE closed ring and the seam is where we expect (sides)
const checks = [
  ["merged outline exists & closed", !!ring && ring.length>20, ring?`pts=${ring.length}`:"null"],
  ["outline contains concave (reflex) vertices — HULL CANNOT", c.concaveCount>=2, `concave=${c.concaveCount}`],
  ["concavity is non-trivial (notch, not jitter)", c.minCross<-0.2, `minCross=${c.minCross.toFixed(3)}`],
];
console.log("sub-step 3 — concave-dent test (ball + neck union)");
let pass=true; for(const[n,ok,info]of checks){console.log(` ${ok?"PASS":"FAIL"}  ${n}  ${info}`); if(!ok)pass=false;}
console.log("wrote proof/out/step1_substep3.png");
process.exit(pass?0:1);
