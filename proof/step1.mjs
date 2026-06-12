// step1.mjs — sub-step 4: the real MANDIBLE. Union cranium + jaw ramus lobes +
// chin block + neck (all validated analytic solids). The gonial jaw-angle and
// under-chin concavity must EMERGE from the boolean seams — no per-ring magic
// forward-offsets (the prior cycle's failure mode). Judge the PROFILE: does it
// read as a jaw with a real under-chin notch, not a smooth blob or a tail?
import fs from "node:fs";
import { Canvas } from "./core.mjs";
import { makeCamera } from "./head/camera.mjs";
import { headForms } from "./head/forms.mjs";
import { unionOuter } from "./head/union.mjs";
import { dp, smoothClosed } from "./head/geom.mjs";

const F = headForms();
const ORDER = ["cranium","jaw","neck"];

function toRing(sil) { const r = sil.map((q) => [q.x, q.y]); r.push(r[0].slice()); return r; }

function mergedOutline(cam) {
  const rings = [];
  for (const k of ORDER) {
    const sil = F[k].silhouette(cam, k === "cranium" ? 140 : 96);
    if (sil.length >= 3) rings.push(toRing(sil));
  }
  const raw = unionOuter(rings);
  if (!raw) return null;
  // light cleanup of the boolean seam: drop near-duplicate vertices then a gentle
  // smoothing pass so the merged ring is one clean curve (spec allows DP+smooth).
  return smoothClosed(dp(raw, 0.8), 1);
}

function renderCell(yawDeg, pitchDeg) {
  const W = 220, H = 300;
  const cam = makeCamera({ yaw: yawDeg*Math.PI/180, pitch: pitchDeg*Math.PI/180, scale: 92, cx: W/2, cy: H/2+25 });
  const cv = new Canvas(W, H);
  const o = mergedOutline(cam);
  if (o) cv.stroke([...o, o[0]], { width: 3.0, color: [22,22,28], wobble: 0.0, seed: 1, closed: true, taper: false });
  return cv;
}

const angles = [[0,0,"front"],[30,0,"yaw30"],[60,0,"yaw60"],[90,0,"profile"],[20,-18,"below"]];
const cols=angles.length, CW=220, CH=300, gut=8;
const sheet = new Canvas(cols*CW+(cols+1)*gut, CH+2*gut, [246,245,242]);
angles.forEach(([y,p], i) => sheet.blit(renderCell(y,p), gut+i*(CW+gut), gut));
fs.writeFileSync("proof/out/step1_substep4.png", sheet.toPNG());

// --- self-checks ---
function concavity(ring) {
  let minCross=Infinity, concaveCount=0; const n=ring.length;
  for(let i=0;i<n;i++){const p=ring[(i-1+n)%n],q=ring[i],r=ring[(i+1)%n];
    const ax=q.x-p.x,ay=q.y-p.y,bx=r.x-q.x,by=r.y-q.y;const cz=ax*by-ay*bx;
    const len=Math.hypot(ax,ay)*Math.hypot(bx,by);if(len<1e-9)continue;
    const nm=cz/len;if(nm<-1e-3)concaveCount++;if(nm<minCross)minCross=nm;}
  return {concaveCount,minCross};
}
// profile must read as a jaw: a single closed ring with an under-chin/jaw-neck
// concavity, and the front (chin) must project forward of the cranium front.
const profCam = makeCamera({ yaw:90*Math.PI/180, pitch:0, scale:92, cx:110, cy:175 });
const prof = mergedOutline(profCam);
const pc = prof ? concavity(prof) : {concaveCount:0,minCross:0};
// front view: jaw should widen the lower outline below the cranium, not pinch to a point.
const frontCam = makeCamera({ yaw:0, pitch:0, scale:92, cx:110, cy:175 });
const fr = mergedOutline(frontCam);
const fc = fr ? concavity(fr) : {concaveCount:0,minCross:0};
// width at chin level vs a single-point tail: measure min outline width in lower third
function widthAtY(ring, yLo, yHi){let lo=Infinity,hi=-Infinity;for(const q of ring){if(q.y>=yLo&&q.y<=yHi){lo=Math.min(lo,q.x);hi=Math.max(hi,q.x);}}return hi-lo;}
const ys = fr? fr.map(q=>q.y):[0]; const ymax=Math.max(...ys), ymin=Math.min(...ys);
const chinW = fr? widthAtY(fr, ymax-(ymax-ymin)*0.18, ymax-(ymax-ymin)*0.05):0;

const checks = [
  ["profile is one closed ring", !!prof && prof.length>20, prof?`pts=${prof.length}`:"null"],
  ["profile has under-jaw/neck concavity", pc.concaveCount>=1 && pc.minCross<-0.2, `concave=${pc.concaveCount} min=${pc.minCross.toFixed(2)}`],
  ["front: jaw doesn't pinch to a point (chin width > 12px)", chinW>12, `chinW=${chinW.toFixed(1)}px`],
  ["front has jaw-to-neck concavity", fc.concaveCount>=2, `concave=${fc.concaveCount}`],
];
console.log("sub-step 4 — real mandible (union of analytic jaw masses)");
let pass=true; for(const[n,ok,info]of checks){console.log(` ${ok?"PASS":"FAIL"}  ${n}  ${info}`); if(!ok)pass=false;}
console.log("wrote proof/out/step1_substep4.png");
process.exit(pass?0:1);
