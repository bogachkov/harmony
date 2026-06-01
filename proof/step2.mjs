// step2.mjs — step 2 sub-step 4: the REFERENCE STYLE over the anchors. Draw the
// core merged outline (with proxies) + plain reference features, so we can judge
// "does the core STRUCTURE read as a human?" across angles incl. back/profile.
// The reference style is flagged non-shippable; it validates structure only.
import fs from "node:fs";
import { Canvas } from "./core.mjs";
import { makeCamera, project, viewDir } from "./head/camera.mjs";
import { headForms } from "./head/forms.mjs";
import { unionOuter, convexHull } from "./head/union.mjs";
import { dp, smoothClosed } from "./head/geom.mjs";
import { anchors, silhouetteProxy } from "./head/anchors.mjs";
import { referenceStyle, applyStyle } from "./style/style.mjs";

const F = headForms();
const ORDER = ["cranium","jaw","neck"];
const A = anchors(F);

function norm(v){const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function toRing(s){ const r=s.map(q=>[q.x,q.y]); r.push(r[0].slice()); return r; }
function projRing(pts3,cam){ const pj=pts3.map(p=>{const s=project(p,cam);return{x:s.x,y:s.y};}); const h=convexHull(pj); if(h.length<3) return null; const r=h.map(q=>[q[0],q[1]]); r.push(r[0].slice()); return r; }

function mergedOutline(cam){
  const rings=[];
  for(const k of ORDER){ const s=F[k].silhouette(cam,k==="cranium"?140:96); if(s.length>=3) rings.push(toRing(s)); }
  for(const a of [A.nose,A.earL,A.earR]){ const px=silhouetteProxy(a); if(px){ const r=projRing(px,cam); if(r) rings.push(r); } }
  const raw=unionOuter(rings); if(!raw) return null; return smoothClosed(dp(raw,0.8),1);
}

// visibility = is this head-local point on the camera-facing surface? Test the
// point's OUTWARD direction (from head center) against the view: a feature is
// visible only if its surface faces the camera. Uses the anchor's frame outward
// (z) where available via the local point's radial dir. Tight threshold so side/
// back anchors don't leak (the loose -0.1 let ears show from behind).
// REAL depth occlusion: a feature point is visible only if it sits at (or in
// front of) the nearest head surface along its view ray — using the analytic
// frontDepth of the masses, not a radial-dot guess. This correctly hides the
// far-side eye in profile and keeps near features.
// A feature is visible if the SURFACE IT SITS ON faces the camera — facing test
// (surfaceNormal · viewDir > threshold), the proper occlusion the spec calls for.
// This is robust at grazing/silhouette angles where the raw depth compare wrongly
// culled near features (blank profile). Threshold slightly below 0 includes the
// grazing edge (so the near eye/nose show in profile); clearly back-facing points
// are hidden. The point's "home" mass = the one whose surface it lies on.
function visibleFn(cam){
  const vd=norm(viewDir(cam));
  const masses=[F.cranium,F.jaw,F.neck];
  return (pLocal)=>{
    // home mass = the one this point is closest to lying ON (contains ≈ 1)
    let home=null, bestErr=Infinity;
    for(const m of masses){ const e=Math.abs(m.contains(pLocal)-1); if(e<bestErr){ bestErr=e; home=m; } }
    if(!home) return false;
    const n=home.normalAt(pLocal);
    return dot(n, vd) > -0.15;                        // surface faces (or grazes) camera
  };
}

function renderCell(yawDeg,pitchDeg){
  const W=240,H=320;
  const cam=makeCamera({yaw:yawDeg*Math.PI/180,pitch:pitchDeg*Math.PI/180,scale:92,cx:W/2,cy:H/2+25});
  const cv=new Canvas(W,H);
  const o=mergedOutline(cam);
  if(o) cv.stroke([...o,o[0]],{width:3.0,color:[22,22,28],wobble:0.4,seed:1,closed:true,taper:false});
  // reference style over anchors
  const P=(pLocal)=>{ const s=project(pLocal,cam); return {x:s.x,y:s.y}; };
  const vis=visibleFn(cam);
  applyStyle(referenceStyle, A, {
    P, vis,
    stroke:(pts,opts)=>cv.stroke(pts,{width:opts.width,color:[40,40,48],wobble:0.4,seed:2,taper:false}),
    stamp:(x,y,r)=>cv.stamp(x,y,r,[40,40,48],1),
  });
  return cv;
}

// include back + profile so we judge from all sides (anti-wraith rule)
const angles=[[0,3,"front"],[30,3,"3/4"],[90,0,"profile"],[20,-18,"below"],[160,4,"back3/4"],[200,3,"back"]];
const cols=3,rows=2,CW=240,CH=320,gut=8;
const sheet=new Canvas(cols*CW+(cols+1)*gut,rows*CH+(rows+1)*gut,[246,245,242]);
angles.forEach(([y,p],i)=>sheet.blit(renderCell(y,p),gut+(i%cols)*(CW+gut),gut+((i/cols)|0)*(CH+gut)));
fs.writeFileSync("proof/out/step2_substep4.png",sheet.toPNG());
fs.writeFileSync("proof/out/step2_substep4_small.png",sheet.downscale(2).toPNG());

// --- self-checks ---
const styleIsRef = referenceStyle.name==="reference" && referenceStyle.shippable===false;
// style must read ONLY anchors: applyStyle takes (style, A, ctx) — A is anchors.
// verify drawing happens for front (features visible) but NOT for the pure-back
// view (all face anchors on the hidden hemisphere => no face strokes).
let frontDrew=0, backFaceDrew=0, backEarDrew=0, profileDrew=0;
const countCtx=(yaw, styleObj)=>{ let n=0; const cam=makeCamera({yaw:yaw*Math.PI/180,pitch:0,scale:92,cx:120,cy:185});
  const vis=visibleFn(cam);
  applyStyle(styleObj,A,{P:(p)=>{const s=project(p,cam);return{x:s.x,y:s.y};},vis,stroke:()=>{n++;},stamp:()=>{n++;}}); return n; };
// face-only style (no ear drawer) so we can assert no FACE features on the back
const faceOnly = { ...referenceStyle, ear: undefined };
const earOnly  = { ...referenceStyle, eye:undefined, nose:undefined, mouth:undefined, brow:undefined };
frontDrew=countCtx(0, referenceStyle);
backFaceDrew=countCtx(180, faceOnly);
backEarDrew=countCtx(180, earOnly);
profileDrew=countCtx(90, referenceStyle);
const checks=[
  ["reference style flagged non-shippable", styleIsRef, `name=${referenceStyle.name} ship=${referenceStyle.shippable}`],
  ["features drawn on the front view", frontDrew>=6, `strokes=${frontDrew}`],
  ["NO face features (eye/nose/mouth/brow) on the pure-back view", backFaceDrew===0, `faceStrokes=${backFaceDrew}`],
  ["ears DO show from the back (they stick out laterally)", backEarDrew>=1, `earStrokes=${backEarDrew}`],
  ["profile shows SOME near features (not blank)", profileDrew>=2, `strokes=${profileDrew}`],
];
console.log("step2 sub-step 4 — reference style over anchors");
let pass=true; for(const[n,ok,info]of checks){console.log(` ${ok?"PASS":"FAIL"}  ${n}  ${info}`); if(!ok)pass=false;}
console.log("wrote proof/out/step2_substep4.png");
process.exit(pass?0:1);
