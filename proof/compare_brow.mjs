// compare_brow.mjs — render the brow contour two ways, side by side, so the owner
// can SEE the choice: LEFT = flat latitude ring (straight under yaw), RIGHT =
// brow-ridge dip (curves under yaw for the real anatomical reason). 3 angles each.
import fs from "node:fs";
import { Canvas } from "./core.mjs";
import { makeCamera, project, viewDir } from "./head/camera.mjs";
import { headForms } from "./head/forms.mjs";
import { unionOuter, convexHull } from "./head/union.mjs";
import { dp, smoothClosed } from "./head/geom.mjs";
import { anchors, silhouetteProxy } from "./head/anchors.mjs";
import { centerline } from "./head/contours.mjs";
import { landmarks } from "./head/proportions.mjs";

const F=headForms(); const A=anchors(F); const L=landmarks(F);
const ORDER=["cranium","jaw","neck"];
const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const toRing=s=>{const r=s.map(q=>[q.x,q.y]);r.push(r[0].slice());return r;};
const projHull=(p3,cam)=>{const pj=p3.map(p=>{const s=project(p,cam);return{x:s.x,y:s.y};});const h=convexHull(pj);if(h.length<3)return null;const r=h.map(q=>[q[0],q[1]]);r.push(r[0].slice());return r;};
function outline(cam){const rings=[];for(const k of ORDER){const s=F[k].silhouette(cam,k==="cranium"?140:96);if(s.length>=3)rings.push(toRing(s));}for(const a of[A.nose,A.earL,A.earR]){const px=silhouetteProxy(a);if(px){const r=projHull(px,cam);if(r)rings.push(r);}}const raw=unionOuter(rings);return raw?smoothClosed(dp(raw,0.8),1):null;}
function vis(cam){const vd=norm(viewDir(cam));const m=[F.cranium,F.jaw,F.neck];return p=>{let h=null,b=Infinity;for(const mm of m){const e=Math.abs(mm.contains(p)-1);if(e<b){b=e;h=mm;}}return h&&dot(h.normalAt(p),vd)>-0.05;};}
function drawC(cv,cam,pts,v,col){let run=[];const fl=()=>{if(run.length>=2)cv.stroke(run,{width:1.8,color:col,wobble:0,seed:3,taper:false});run=[];};for(const p of pts){if(v(p)){const s=project(p,cam);run.push({x:s.x,y:s.y});}else fl();}fl();}

// flat ring (option A) vs dipped brow ridge (option B)
function browFlat(ov,browY,n=72){const tau=(browY-ov.c[1])/ov.ry;const p=[];for(let i=0;i<=n;i++){p.push(ov._point((i/n)*2*Math.PI,tau));}return p;}
function browDip(ov,browY,n=72,dip=0.18){const tb=(browY-ov.c[1])/ov.ry;const p=[];for(let i=0;i<=n;i++){const a=(i/n)*2*Math.PI;const w=Math.max(0,Math.sin(a));p.push(ov._point(a,tb-dip*w));}return p;}

function cell(yaw,pitch,brow){
  const W=220,H=300;const cam=makeCamera({yaw:yaw*Math.PI/180,pitch:pitch*Math.PI/180,scale:88,cx:W/2,cy:H/2+22});
  const cv=new Canvas(W,H);const o=outline(cam);if(o)cv.stroke([...o,o[0]],{width:3,color:[22,22,28],wobble:0,seed:1,closed:true,taper:false});
  const v=vis(cam);
  drawC(cv,cam,centerline(F),v,[150,150,200]);
  drawC(cv,cam,brow(F.cranium,L.browY),v,[40,150,70]);
  return cv;
}

const angles=[[0,3],[35,3],[65,2]];
const CW=220,CH=300,gut=8,lab=26;
// two rows: top = FLAT, bottom = DIP; 3 angles each
const sheet=new Canvas(3*CW+4*gut, 2*(CH+lab)+3*gut, [246,245,242]);
angles.forEach(([y,p],i)=>{
  sheet.blit(cell(y,p,browFlat), gut+i*(CW+gut), gut+lab);
  sheet.blit(cell(y,p,browDip),  gut+i*(CW+gut), gut+lab+CH+gut+lab);
});
fs.writeFileSync("proof/out/brow_compare.png", sheet.toPNG());
console.log("wrote proof/out/brow_compare.png — TOP row = flat ring, BOTTOM row = brow-ridge dip");
