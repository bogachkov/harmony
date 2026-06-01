// step3.mjs — step 3 sub-step 4: the FULL validation image. Head outline +
// reference features + cross-contour guides together, across angles. Judge that
// the contours genuinely convey 3D AND align with the proportion landmarks: the
// brow wrap passes through the eye/brow region, the centerline runs through nose
// and mouth. This is the §1f validation render.
import fs from "node:fs";
import { Canvas } from "./core.mjs";
import { makeCamera, project, viewDir } from "./head/camera.mjs";
import { headForms } from "./head/forms.mjs";
import { unionOuter, convexHull } from "./head/union.mjs";
import { dp, smoothClosed } from "./head/geom.mjs";
import { anchors, silhouetteProxy } from "./head/anchors.mjs";
import { validationGuides, centerline, browWrap } from "./head/contours.mjs";
import { landmarks } from "./head/proportions.mjs";
import { referenceStyle, applyStyle } from "./style/style.mjs";

const F=headForms(); const A=anchors(F); const L=landmarks(F);
const ORDER=["cranium","jaw","neck"];
const norm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const toRing=s=>{const r=s.map(q=>[q.x,q.y]);r.push(r[0].slice());return r;};
const projHull=(p3,cam)=>{const pj=p3.map(p=>{const s=project(p,cam);return{x:s.x,y:s.y};});const h=convexHull(pj);if(h.length<3)return null;const r=h.map(q=>[q[0],q[1]]);r.push(r[0].slice());return r;};
function mergedOutline(cam){const rings=[];for(const k of ORDER){const s=F[k].silhouette(cam,k==="cranium"?140:96);if(s.length>=3)rings.push(toRing(s));}for(const a of[A.nose,A.earL,A.earR]){const px=silhouetteProxy(a);if(px){const r=projHull(px,cam);if(r)rings.push(r);}}const raw=unionOuter(rings);return raw?smoothClosed(dp(raw,0.8),1):null;}
function visibleFn(cam){const vd=norm(viewDir(cam));const m=[F.cranium,F.jaw,F.neck];return p=>{let h=null,b=Infinity;for(const mm of m){const e=Math.abs(mm.contains(p)-1);if(e<b){b=e;h=mm;}}return h&&dot(h.normalAt(p),vd)>-0.05;};}
function drawContour(cv,cam,pts,vis,col){let run=[];const fl=()=>{if(run.length>=2)cv.stroke(run,{width:1.5,color:col,wobble:0.3,seed:3,taper:false});run=[];};for(const p of pts){if(vis(p)){const s=project(p,cam);run.push({x:s.x,y:s.y});}else fl();}fl();}

function renderCell(yawDeg,pitchDeg,showGuides){
  const W=240,H=320;
  const cam=makeCamera({yaw:yawDeg*Math.PI/180,pitch:pitchDeg*Math.PI/180,scale:92,cx:W/2,cy:H/2+25});
  const cv=new Canvas(W,H);
  const o=mergedOutline(cam); if(o)cv.stroke([...o,o[0]],{width:3.0,color:[22,22,28],wobble:0.4,seed:1,closed:true,taper:false});
  const vis=visibleFn(cam);
  // reference features
  const P=p=>{const s=project(p,cam);return{x:s.x,y:s.y};};
  applyStyle(referenceStyle,A,{P,vis,stroke:(pts,opts)=>cv.stroke(pts,{width:opts.width,color:[40,40,48],wobble:0.4,seed:2,taper:false}),stamp:(x,y,r)=>cv.stamp(x,y,r,[40,40,48],1)});
  // cross-contour guides on top (faint)
  if(showGuides) for(const g of validationGuides(F,L.browY)) drawContour(cv,cam,g.pts,vis,g.color);
  return cv;
}

// top row: full head WITH guides (front/3-4/profile); bottom: WITHOUT guides (the
// clean validation faces) at the same angles + a below.
const angles=[[0,3],[33,3],[90,0]];
const W=240,H=320,gut=8,cols=3;
const sheet=new Canvas(cols*W+(cols+1)*gut, 2*H+3*gut, [246,245,242]);
angles.forEach(([y,p],i)=>{
  sheet.blit(renderCell(y,p,true), gut+i*(W+gut), gut);
  sheet.blit(renderCell(y,p,false), gut+i*(W+gut), 2*gut+H);
});
fs.writeFileSync("proof/out/step3_substep4.png",sheet.toPNG());
fs.writeFileSync("proof/out/step3_substep4_small.png",sheet.downscale(2).toPNG());

// --- self-checks: contours ALIGN with the proportion landmarks ---
// 1. the brow wrap passes through the eye/brow height: at front, the brow wrap's
// front-center screen-y is near the eye landmark screen-y band.
const camF=makeCamera({yaw:0,pitch:0,scale:92,cx:120,cy:185});
const bw=browWrap(F.cranium,L.browY);
const bwFrontY = (()=>{ // the front-most (min |x|) visible brow point
  const vis=visibleFn(camF); let best=null,bx=Infinity;
  for(const p of bw){ if(!vis(p))continue; const s=project(p,camF); if(Math.abs(s.x-120)<bx){bx=Math.abs(s.x-120);best=s;} }
  return best?best.y:null; })();
const eyeY=project(L.eyeL,camF).y, browLmY=project(L.brow,camF).y;
const browAligns = bwFrontY!==null && bwFrontY < eyeY+25 && bwFrontY > browLmY-25;  // near brow/eye band
// 2. the centerline passes through the nose+mouth (x≈0 vertical): at front, the
// centerline screen-x stays near the nose/mouth landmark screen-x (the midline).
const cl=centerline(F);
const noseX=project(L.noseBase,camF).x, mouthX=project(L.mouthC,camF).x;
const clXs=cl.map(p=>project(p,camF).x);
const clMidX=clXs.reduce((a,b)=>a+b,0)/clXs.length;
const centerlineMidline = Math.abs(clMidX-noseX)<8 && Math.abs(clMidX-mouthX)<8;
// 3. guides convey 3D: at 3/4 both contours have non-trivial curvature (bow),
// i.e. they are not flat — reuse the sagitta idea for the centerline.
const cam34=makeCamera({yaw:33*Math.PI/180,pitch:0,scale:92,cx:120,cy:185});
const vis34=visibleFn(cam34);
const clArc=cl.filter(vis34).map(p=>project(p,cam34));
let clSag=0; if(clArc.length>=3){const a=clArc[0],b=clArc[clArc.length-1];const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;for(const q of clArc){const t=((q.x-a.x)*dx+(q.y-a.y)*dy)/(len*len);const px=a.x+t*dx,py=a.y+t*dy;clSag=Math.max(clSag,Math.hypot(q.x-px,q.y-py));}}
const conveys3D = clSag>4;

const checks=[
  ["brow wrap aligns with the eye/brow landmark band", browAligns, `browWrapY=${bwFrontY?bwFrontY.toFixed(0):"null"} eyeY=${eyeY.toFixed(0)} browLmY=${browLmY.toFixed(0)}`],
  ["centerline runs through the nose/mouth midline", centerlineMidline, `clMidX=${clMidX.toFixed(1)} noseX=${noseX.toFixed(1)} mouthX=${mouthX.toFixed(1)}`],
  ["contours convey 3D at 3/4 (centerline bows, not flat)", conveys3D, `clSagitta=${clSag.toFixed(1)}px`],
];
console.log("step3 sub-step 4 — full validation image");
let pass=true; for(const[n,ok,info]of checks){console.log(` ${ok?"PASS":"FAIL"}  ${n}  ${info}`); if(!ok)pass=false;}
console.log("wrote proof/out/step3_substep4.png");
process.exit(pass?0:1);
