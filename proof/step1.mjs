// step1.mjs — sub-step 1: ONE ellipsoid, drawn by its ANALYTIC apparent contour
// (n·viewDir=0), rotating across angles. No point cloud, no convex hull.
// Acceptance: silhouette comes straight from forms.mjs Ellipsoid.silhouette();
// at yaw0 it is a centered ellipse; it turns correctly through angles.
import fs from "node:fs";
import { Canvas } from "./core.mjs";
import { makeCamera } from "./head/camera.mjs";
import { Ellipsoid } from "./head/forms.mjs";

// a clearly non-spherical ellipsoid so "turning" is visible: taller than wide,
// deeper than wide (rx<ry, rz between) — head-local units.
const cranium = new Ellipsoid([0,0,0], [0.82, 1.0, 0.92]);

function renderCell(yawDeg, pitchDeg) {
  const W = 220, H = 280;
  const cam = makeCamera({ yaw: yawDeg*Math.PI/180, pitch: pitchDeg*Math.PI/180, scale: 95, cx: W/2, cy: H/2 });
  const cv = new Canvas(W, H);
  const sil = cranium.silhouette(cam, 120);          // ANALYTIC contour
  cv.stroke([...sil, sil[0]], { width: 3.0, color: [22,22,28], wobble: 0.0, seed: 1, closed: true, taper: false });
  return cv;
}

const angles = [[0,0,"front"],[35,0,"yaw35"],[70,0,"yaw70"],[0,-25,"pitch-up"],[35,18,"yaw+pitch"]];
const cols = angles.length, CW=220, CH=280, gut=8;
const sheet = new Canvas(cols*CW+(cols+1)*gut, CH+2*gut, [246,245,242]);
angles.forEach(([y,p], i) => sheet.blit(renderCell(y,p), gut+i*(CW+gut), gut));
fs.writeFileSync("proof/out/step1_substep1.png", sheet.toPNG());

// --- self-check assertions (method, not just looks) ---
const camFront = makeCamera({ yaw:0, pitch:0, scale:95, cx:110, cy:140 });
const s = cranium.silhouette(camFront, 120);
// 1. centered at yaw0: mean x ≈ cx
const meanx = s.reduce((a,q)=>a+q.x,0)/s.length;
// 2. it's an ellipse with the right aspect: width/height ratio ≈ rx/ry
const xs=s.map(q=>q.x), ys=s.map(q=>q.y);
const w = Math.max(...xs)-Math.min(...xs), h = Math.max(...ys)-Math.min(...ys);
const aspect = w/h, want = 0.82/1.0;
// 3. simple polygon: the contour must wind monotonically once around its centroid
// (total signed angle ≈ ±2π and every step same sign => no self-intersection).
const cxp=meanx, cyp=ys.reduce((a,b)=>a+b,0)/ys.length;
let totalTurn=0, sameSign=true, sign=0;
for (let i=0;i<s.length;i++){
  const p=s[i], q=s[(i+1)%s.length];
  let dA=Math.atan2(q.y-cyp,q.x-cxp)-Math.atan2(p.y-cyp,p.x-cxp);
  if(dA>Math.PI)dA-=2*Math.PI; if(dA<-Math.PI)dA+=2*Math.PI; // wrap to (-π,π]
  totalTurn+=dA;
  const st=Math.sign(dA);
  if(st!==0){ if(sign===0)sign=st; else if(st!==sign)sameSign=false; }
}
const windsOnce = Math.abs(Math.abs(totalTurn)-2*Math.PI) < 1e-6;
const checks = [
  ["yaw0 centered (|mean x - cx|<1px)", Math.abs(meanx-110)<1, `meanx=${meanx.toFixed(2)}`],
  ["aspect matches rx/ry (±0.05)", Math.abs(aspect-want)<0.05, `aspect=${aspect.toFixed(3)} want=${want.toFixed(3)}`],
  ["contour has full point count (analytic sampling)", s.length===120, `n=${s.length}`],
  ["simple polygon (winds once, monotone)", windsOnce && sameSign, `turn=${(totalTurn/Math.PI).toFixed(3)}π sameSign=${sameSign}`],
];
console.log("sub-step 1 — analytic ellipsoid contour");
let pass=true; for(const[n,ok,info]of checks){console.log(` ${ok?"PASS":"FAIL"}  ${n}  ${info}`); if(!ok)pass=false;}
console.log("wrote proof/out/step1_substep1.png");
process.exit(pass?0:1);
