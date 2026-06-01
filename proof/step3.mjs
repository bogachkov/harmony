// step3.mjs — step 3 sub-step 3: the cross-contours as TOGGLEABLE validation
// guides. Prove: (a) each guide can be switched on/off independently; (b) both
// guides track the form correctly across a full angle sweep, sitting ON the
// surface (occluded, not floating, not flat). Render shows 4 toggle states +
// a tracking sweep.
import fs from "node:fs";
import { Canvas } from "./core.mjs";
import { makeCamera, project, viewDir } from "./head/camera.mjs";
import { headForms } from "./head/forms.mjs";
import { unionOuter, convexHull } from "./head/union.mjs";
import { dp, smoothClosed } from "./head/geom.mjs";
import { anchors, silhouetteProxy } from "./head/anchors.mjs";
import { validationGuides, centerline, browWrap } from "./head/contours.mjs";
import { landmarks } from "./head/proportions.mjs";

const F=headForms(); const A=anchors(F); const L=landmarks(F);
const ORDER=["cranium","jaw","neck"];
const norm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const toRing=s=>{const r=s.map(q=>[q.x,q.y]);r.push(r[0].slice());return r;};
const projHull=(p3,cam)=>{const pj=p3.map(p=>{const s=project(p,cam);return{x:s.x,y:s.y};});const h=convexHull(pj);if(h.length<3)return null;const r=h.map(q=>[q[0],q[1]]);r.push(r[0].slice());return r;};
function mergedOutline(cam){const rings=[];for(const k of ORDER){const s=F[k].silhouette(cam,k==="cranium"?140:96);if(s.length>=3)rings.push(toRing(s));}for(const a of[A.nose,A.earL,A.earR]){const px=silhouetteProxy(a);if(px){const r=projHull(px,cam);if(r)rings.push(r);}}const raw=unionOuter(rings);return raw?smoothClosed(dp(raw,0.8),1):null;}
function visibleFn(cam){const vd=norm(viewDir(cam));const m=[F.cranium,F.jaw,F.neck];return p=>{let h=null,b=Infinity;for(const mm of m){const e=Math.abs(mm.contains(p)-1);if(e<b){b=e;h=mm;}}return h&&dot(h.normalAt(p),vd)>-0.05;};}
function drawContour(cv,cam,pts,vis,col){let run=[];const fl=()=>{if(run.length>=2)cv.stroke(run,{width:1.7,color:col,wobble:0.3,seed:3,taper:false});run=[];};for(const p of pts){if(vis(p)){const s=project(p,cam);run.push({x:s.x,y:s.y});}else fl();}fl();}

function renderCell(yawDeg,pitchDeg,opts,label){
  const W=210,H=290;
  const cam=makeCamera({yaw:yawDeg*Math.PI/180,pitch:pitchDeg*Math.PI/180,scale:80,cx:W/2,cy:H/2+20});
  const cv=new Canvas(W,H);
  const o=mergedOutline(cam); if(o)cv.stroke([...o,o[0]],{width:2.8,color:[22,22,28],wobble:0.4,seed:1,closed:true,taper:false});
  const vis=visibleFn(cam);
  for(const g of validationGuides(F,L.browY,opts)) drawContour(cv,cam,g.pts,vis,g.color);
  return cv;
}

// Row 1: TOGGLE states at a fixed 3/4 angle — both / centerline-only / brow-only / none.
// Row 2: TRACKING sweep with both guides on, across yaw.
const W=210,H=290,gut=8;
const toggles=[
  [{centerline:true,brow:true},"both"],
  [{centerline:true,brow:false},"centerline only"],
  [{centerline:false,brow:true},"brow only"],
  [{centerline:false,brow:false},"none"],
];
const sweep=[0,25,50,75];
const cols=4;
const sheet=new Canvas(cols*W+(cols+1)*gut, 2*H+3*gut, [246,245,242]);
toggles.forEach(([opts,lab],i)=>sheet.blit(renderCell(33,3,opts,lab),gut+i*(W+gut),gut));
sweep.forEach((y,i)=>sheet.blit(renderCell(y,3,{centerline:true,brow:true}),gut+i*(W+gut),2*gut+H));
fs.writeFileSync("proof/out/step3_substep3.png",sheet.toPNG());

// --- self-checks ---
// 1. toggle works: guide count matches opts.
const gBoth=validationGuides(F,L.browY,{centerline:true,brow:true}).length;
const gCL  =validationGuides(F,L.browY,{centerline:true,brow:false}).map(g=>g.name);
const gBrow=validationGuides(F,L.browY,{centerline:false,brow:true}).map(g=>g.name);
const gNone=validationGuides(F,L.browY,{centerline:false,brow:false}).length;
const toggleWorks = gBoth===2 && gCL.length===1 && gCL[0]==="centerline" && gBrow.length===1 && gBrow[0]==="brow" && gNone===0;
// 2. both guides ride the surface across a sweep (every point contains≈1 on its home mass).
const masses=[F.cranium,F.jaw,F.neck];
const onSurfaceAll = [...centerline(F), ...browWrap(F.cranium,L.browY)].every(p=>{
  let best=Infinity; for(const m of masses) best=Math.min(best,Math.abs(m.contains(p)-1)); return best<1e-6; });
// 3. tracking: across the sweep, the visible centerline stays mostly visible up to
// profile then drops, and is never empty in the front half (it tracks, not vanishes).
let tracks=true;
for(const y of [0,25,50,75]){ const v=visibleFn(makeCamera({yaw:y*Math.PI/180,pitch:0,scale:80,cx:105,cy:165}));
  const n=centerline(F).filter(v).length; if(y<=50 && n<10) tracks=false; }
const checks=[
  ["toggle on/off works per guide (both/cl-only/brow-only/none)", toggleWorks, `both=${gBoth} cl=${gCL.join(",")} brow=${gBrow.join(",")} none=${gNone}`],
  ["both guides ride the surface across the sweep (contains≈1)", onSurfaceAll, ``],
  ["centerline TRACKS the form across yaw (visible in front half, not vanishing)", tracks, ``],
];
console.log("step3 sub-step 3 — toggleable validation guides");
let pass=true; for(const[n,ok,info]of checks){console.log(` ${ok?"PASS":"FAIL"}  ${n}  ${info}`); if(!ok)pass=false;}
console.log("wrote proof/out/step3_substep3.png");
process.exit(pass?0:1);
