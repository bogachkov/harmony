// step1.mjs — sub-step 2: OVOID (true non-affine egg: occiput bulge, flattened
// crown), drawn by its ANALYTIC apparent contour (n·viewDir=0 solved per height).
// No point cloud, no convex hull, no stored geometry — contour derived from the
// equation each frame. Acceptance: contour points satisfy n·v=0; the profile is
// an egg (occiput pushes the back out at low-mid height; crown flatter than a
// sphere); silhouette changes correctly across yaw (occiput swings to the back).
import fs from "node:fs";
import { Canvas } from "./core.mjs";
import { makeCamera, viewDir } from "./head/camera.mjs";
import { Ovoid } from "./head/forms.mjs";

const cranium = new Ovoid([0,0,0], {
  rxz: 0.86, ry: 1.0, crownExp: 0.37, taper: 0.05, occ: 0.15, occCenter: -0.30, occWidth: 0.50,
});

function renderCell(yawDeg, pitchDeg) {
  const W = 220, H = 280;
  const cam = makeCamera({ yaw: yawDeg*Math.PI/180, pitch: pitchDeg*Math.PI/180, scale: 95, cx: W/2, cy: H/2 });
  const cv = new Canvas(W, H);
  const sil = cranium.silhouette(cam, 140);
  cv.stroke([...sil, sil[0]], { width: 3.0, color: [22,22,28], wobble: 0.0, seed: 1, closed: true, taper: false });
  return cv;
}

// front, 3/4, near-profile, profile (occiput should show at the back), pitch-up
const angles = [[0,0,"front"],[35,0,"yaw35"],[70,0,"yaw70"],[90,0,"profile"],[35,18,"yaw+pitch"]];
const cols=angles.length, CW=220, CH=280, gut=8;
const sheet = new Canvas(cols*CW+(cols+1)*gut, CH+2*gut, [246,245,242]);
angles.forEach(([y,p], i) => sheet.blit(renderCell(y,p), gut+i*(CW+gut), gut));
fs.writeFileSync("proof/out/step1_substep2.png", sheet.toPNG());

// --- self-checks (method + shape, not just looks) ---
// 1. every contour point satisfies n·viewDir=0 (the analytic guarantee)
const cam = makeCamera({ yaw:0.6, pitch:0.15, scale:95, cx:110, cy:140 });
const v = viewDir(cam), vn = Math.hypot(...v);
let maxdot = 0;
for (let i=0;i<=80;i++){ const tau=-0.99+1.98*i/80;
  const rp=cranium._dr_dtau(tau)/cranium.ry, zcp=cranium._dzc_dtau(tau)/cranium.ry;
  const roots=cranium._solveAlpha(-v[0], zcp*v[1]-v[2], -rp*v[1]);
  for(const a of roots){const n=cranium._normal(a,tau);maxdot=Math.max(maxdot,Math.abs(n[0]*v[0]+n[1]*v[1]+n[2]*v[2])/vn);}
}
// 2. egg, not sphere: crown radius is flatter than a sphere's at the same height.
//    At tau=0.7, a sphere of rxz would give r=rxz*sqrt(1-0.49)=0.714*rxz; crownExp<0.5
//    makes it LARGER (flatter dome). Confirm r(0.7) > sphere value.
const sphereR07 = cranium.rxz*Math.sqrt(1-0.49);
const eggR07 = cranium._r(0.7);
// 3. occiput actually bulges backward at low-mid height (zc<0) and ~0 at crown.
const occLow = cranium._zc(-0.35), occTop = cranium._zc(0.9);
// 4. profile silhouette is asymmetric front/back (occiput) — bounding box not centered in z-equivalent.
const profCam = makeCamera({ yaw:90*Math.PI/180, pitch:0, scale:95, cx:110, cy:140 });
const ps = cranium.silhouette(profCam, 140);
const pxs = ps.map(q=>q.x); const pmid=(Math.max(...pxs)+Math.min(...pxs))/2;
const profAsym = Math.abs(pmid-110); // occiput should push the silhouette off-center

const checks = [
  ["contour satisfies n·viewDir=0 (<1e-9)", maxdot<1e-9, `max=${maxdot.toExponential(2)}`],
  ["crown flatter than sphere (egg)", eggR07>sphereR07+0.02, `egg=${eggR07.toFixed(3)} sphere=${sphereR07.toFixed(3)}`],
  ["occiput bulges back low (<0), ~0 at crown", occLow<-0.05 && Math.abs(occTop)<0.03, `low=${occLow.toFixed(3)} top=${occTop.toFixed(3)}`],
  ["profile silhouette asymmetric (occiput shows)", profAsym>3, `offset=${profAsym.toFixed(2)}px`],
];
console.log("sub-step 2 — analytic ovoid contour");
let pass=true; for(const[n,ok,info]of checks){console.log(` ${ok?"PASS":"FAIL"}  ${n}  ${info}`); if(!ok)pass=false;}
console.log("wrote proof/out/step1_substep2.png");
process.exit(pass?0:1);
