// step2.mjs — step 2 sub-step 2: typed ANCHORS (frames+extent+joint, NO shapes).
// Render each anchor as a small axis-tripod (x=red, y=green, z/outward=blue) on
// the head so we can verify orientation: eyes canted (canthal tilt), ears leaning
// back, nose root/base, mouth, brow. Self-check: every frame is orthonormal, the
// canthal tilt is mirror-symmetric, ears lean opposite, joints/extents/proxy flags
// match §1b, and NO feature-shape data leaks into an anchor.
import fs from "node:fs";
import { Canvas } from "./core.mjs";
import { makeCamera, project } from "./head/camera.mjs";
import { headForms } from "./head/forms.mjs";
import { unionOuter } from "./head/union.mjs";
import { dp, smoothClosed } from "./head/geom.mjs";
import { anchors, frameOrtho } from "./head/anchors.mjs";

const F = headForms();
const ORDER = ["cranium","jaw","neck"];
const A = anchors(F);

function toRing(s){ const r=s.map(q=>[q.x,q.y]); r.push(r[0].slice()); return r; }
function mergedOutline(cam){
  const rings=[]; for(const k of ORDER){ const s=F[k].silhouette(cam,k==="cranium"?140:96); if(s.length>=3) rings.push(toRing(s)); }
  const raw=unionOuter(rings); if(!raw) return null; return smoothClosed(dp(raw,0.8),1);
}
function add(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
function scl(v,s){return [v[0]*s,v[1]*s,v[2]*s];}

// draw a frame as 3 short axis segments from its origin
function drawFrame(cv, cam, fr, len){
  const o=project(fr.o,cam);
  const ax=[["x",[200,60,60]],["y",[60,160,60]],["z",[60,90,210]]];
  for(const[k,col]of ax){
    const tip=project(add(fr.o, scl(fr[k], len)),cam);
    cv.stroke([{x:o.x,y:o.y},{x:tip.x,y:tip.y}],{width:1.6,color:col,wobble:0,seed:1,taper:false});
  }
  cv.stamp(o.x,o.y,2.0,[30,30,30],1);
}

function renderCell(yawDeg,pitchDeg){
  const W=240,H=320;
  const cam=makeCamera({yaw:yawDeg*Math.PI/180,pitch:pitchDeg*Math.PI/180,scale:92,cx:W/2,cy:H/2+25});
  const cv=new Canvas(W,H);
  const o=mergedOutline(cam);
  if(o) cv.stroke([...o,o[0]],{width:3.0,color:[22,22,28],wobble:0,seed:1,closed:true,taper:false});
  const len=0.16;
  for(const a of [A.eyeL,A.eyeR,A.earL,A.earR,A.brow,A.mouth]) drawFrame(cv,cam,a.frame,len);
  drawFrame(cv,cam,A.nose.rootFrame,len); drawFrame(cv,cam,A.nose.baseFrame,len);
  return cv;
}

const angles=[[0,3,"front"],[30,3,"yaw30"],[60,2,"yaw60"],[90,0,"profile"],[20,-18,"below"]];
const cols=angles.length,CW=240,CH=320,gut=8;
const sheet=new Canvas(cols*CW+(cols+1)*gut,CH+2*gut,[246,245,242]);
angles.forEach(([y,p],i)=>sheet.blit(renderCell(y,p),gut+i*(CW+gut),gut));
fs.writeFileSync("proof/out/step2_substep2.png",sheet.toPNG());

// --- self-checks (§1b conformance, no shape leakage) ---
const allFrames=[A.eyeL.frame,A.eyeR.frame,A.nose.rootFrame,A.nose.baseFrame,A.earL.frame,A.earR.frame,A.mouth.frame,A.brow.frame];
const ortho = allFrames.every(frameOrtho);
// canthal tilt mirror-symmetric: eyeL.x and eyeR.x reflect across the x=0 plane
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const eyesMirror = Math.abs(A.eyeL.frame.x[1] + A.eyeR.frame.x[1]) < 1e-9   // y-components opposite (tilt mirrored)
                 && Math.abs(A.eyeL.frame.x[1]) > 1e-3;                      // tilt actually present
const earsLeanOpposite = Math.abs(A.earL.frame.x[1] + A.earR.frame.x[1]) < 1e-9 && Math.abs(A.earL.frame.x[1])>1e-3;
// §1b spec fields present
const specFields =
  A.eyeL.proxy===false && typeof A.eyeL.extent.socketR==="number" && typeof A.eyeL.extent.seatDepth==="number"
  && A.nose.proxy==="base" && !!A.nose.rootFrame && !!A.nose.baseFrame && !!A.nose.boundingPlane
  && A.earL.proxy==="stub" && typeof A.earL.extent.flare==="number"
  && A.mouth.upperJoint==="cranium" && A.mouth.lowerJoint==="jaw" && !!A.mouth.frame;
// NO feature-shape leakage: anchors must not carry any drawing/shape arrays/paths
const noShape = [A.eyeL,A.eyeR,A.nose,A.earL,A.earR,A.mouth,A.brow].every(a=>{
  const keys=Object.keys(a); return !keys.some(k=>/shape|path|points|outline|curve|verts/i.test(k));
});
const checks=[
  ["all anchor frames orthonormal", ortho, ""],
  ["eyes carry mirror-symmetric canthal tilt", eyesMirror, `eyeL.x.y=${A.eyeL.frame.x[1].toFixed(3)}`],
  ["ears lean opposite (back-lean per side)", earsLeanOpposite, `earL.x.y=${A.earL.frame.x[1].toFixed(3)}`],
  ["§1b fields present (extents/joints/proxy flags)", specFields, ""],
  ["NO feature-shape data leaks into anchors", noShape, ""],
];
console.log("step2 sub-step 2 — typed anchors");
let pass=true; for(const[n,ok,info]of checks){console.log(` ${ok?"PASS":"FAIL"}  ${n}  ${info}`); if(!ok)pass=false;}
console.log("wrote proof/out/step2_substep2.png");
process.exit(pass?0:1);
