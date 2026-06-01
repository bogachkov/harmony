// step3.mjs — step 3 sub-step 1: the VERTICAL CENTERLINE wrap riding the real
// surface, occluded by the facing test. Draw the merged head outline + the
// centerline; the back half of the wrap must hide. Self-check proves the curve
// points are ON the surface (not a flat plane) and that occlusion splits it.
import fs from "node:fs";
import { Canvas } from "./core.mjs";
import { makeCamera, project, viewDir } from "./head/camera.mjs";
import { headForms } from "./head/forms.mjs";
import { unionOuter, convexHull } from "./head/union.mjs";
import { dp, smoothClosed } from "./head/geom.mjs";
import { anchors, silhouetteProxy } from "./head/anchors.mjs";
import { centerline, centerlineCranium, browWrap } from "./head/contours.mjs";
import { landmarks } from "./head/proportions.mjs";

const F = headForms();
const ORDER=["cranium","jaw","neck"];
const A=anchors(F);
const L = landmarks(F);

function norm(v){const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function toRing(s){const r=s.map(q=>[q.x,q.y]);r.push(r[0].slice());return r;}
function projHullRing(pts3,cam){const pj=pts3.map(p=>{const s=project(p,cam);return{x:s.x,y:s.y};});const h=convexHull(pj);if(h.length<3)return null;const r=h.map(q=>[q[0],q[1]]);r.push(r[0].slice());return r;}
function mergedOutline(cam){
  const rings=[];for(const k of ORDER){const s=F[k].silhouette(cam,k==="cranium"?140:96);if(s.length>=3)rings.push(toRing(s));}
  for(const a of [A.nose,A.earL,A.earR]){const px=silhouetteProxy(a);if(px){const r=projHullRing(px,cam);if(r)rings.push(r);}}
  const raw=unionOuter(rings);if(!raw)return null;return smoothClosed(dp(raw,0.8),1);
}

// visibility = the surface the point lies on faces the camera (facing test).
function visibleFn(cam){
  const vd=norm(viewDir(cam)); const masses=[F.cranium,F.jaw,F.neck];
  return (p)=>{ let home=null,best=Infinity; for(const m of masses){const e=Math.abs(m.contains(p)-1);if(e<best){best=e;home=m;}} if(!home)return false; return dot(home.normalAt(p),vd)>-0.05; };
}

// draw a 3D polyline split into visible runs (occluded segments dropped).
function drawContour(cv,cam,pts3,vis,col){
  let run=[];
  const flush=()=>{ if(run.length>=2) cv.stroke(run,{width:1.6,color:col,wobble:0.3,seed:3,taper:false}); run=[]; };
  for(const p of pts3){ if(vis(p)){ const s=project(p,cam); run.push({x:s.x,y:s.y}); } else flush(); }
  flush();
}

function renderCell(yawDeg,pitchDeg){
  const W=240,H=320;
  const cam=makeCamera({yaw:yawDeg*Math.PI/180,pitch:pitchDeg*Math.PI/180,scale:92,cx:W/2,cy:H/2+25});
  const cv=new Canvas(W,H);
  const o=mergedOutline(cam); if(o)cv.stroke([...o,o[0]],{width:3.0,color:[22,22,28],wobble:0.4,seed:1,closed:true,taper:false});
  const vis=visibleFn(cam);
  drawContour(cv,cam,centerline(F),vis,[120,120,200]);   // the centerline wrap
  drawContour(cv,cam,browWrap(F.cranium, L.browY),vis,[90,170,110]); // the brow wrap
  return cv;
}

const angles=[[0,3,"front"],[30,3,"3/4"],[60,2,"yaw60"],[90,0,"profile"],[20,-15,"tilt"],[200,3,"back"]];
const cols=3,rows=2,CW=240,CH=320,gut=8;
const sheet=new Canvas(cols*CW+(cols+1)*gut,rows*CH+(rows+1)*gut,[246,245,242]);
angles.forEach(([y,p],i)=>sheet.blit(renderCell(y,p),gut+(i%cols)*(CW+gut),gut+((i/cols)|0)*(CH+gut)));
fs.writeFileSync("proof/out/step3_substep2.png",sheet.toPNG());

// --- self-checks ---
// 1. centerline points lie ON the surface (contains ≈ 1 for cranium meridian).
const cl=centerlineCranium(F.cranium);
const onSurface = cl.every(p=>Math.abs(F.cranium.contains(p)-1)<1e-6);
// 2. it's NOT a flat plane: the z-coordinate varies (real curved meridian) and
// the occiput shaping makes it non-trivial.
const zs=cl.map(p=>p[2]); const zVar=Math.max(...zs)-Math.min(...zs);
// 3. occlusion splits it: front view keeps most points, back view hides the face
// meridian (it faces away).
const visF=visibleFn(makeCamera({yaw:0,pitch:0,scale:92,cx:120,cy:185}));
const visB=visibleFn(makeCamera({yaw:180*Math.PI/180,pitch:0,scale:92,cx:120,cy:185}));
const full=centerline(F);
const frontVis=full.filter(visF).length, backVis=full.filter(visB).length;
// brow wrap checks: on the cranium surface, a full ring (x AND z vary => it wraps
// around the head), occlusion shows the front arc and hides the back arc.
const bw=browWrap(F.cranium, L.browY);
const browOnSurface = bw.every(p=>Math.abs(F.cranium.contains(p)-1)<1e-6);
const bxs=bw.map(p=>p[0]), bzs=bw.map(p=>p[2]);
const browWraps = (Math.max(...bxs)-Math.min(...bxs))>0.5 && (Math.max(...bzs)-Math.min(...bzs))>0.5; // rings around
// a horizontal ring shows ~half from any side; correctness = front and back views
// show DIFFERENT halves (the visible-from-front set is largely hidden from back).
const browFrontSet=new Set(bw.map((p,i)=>visF(p)?i:-1).filter(i=>i>=0));
const browBackSet =new Set(bw.map((p,i)=>visB(p)?i:-1).filter(i=>i>=0));
let browOverlap=0; for(const i of browFrontSet) if(browBackSet.has(i)) browOverlap++;
const browFront=browFrontSet.size, browBack=browBackSet.size;
// curvature: at yaw35, the visible (front-facing) brow arc should BOW — measure
// sagitta (max deviation of its screen-y from the straight chord between its ends).
const camYaw=makeCamera({yaw:35*Math.PI/180,pitch:0,scale:92,cx:120,cy:185});
const visY=visibleFn(camYaw);
const arc=bw.filter(visY).map(p=>{const s=project(p,camYaw);return{x:s.x,y:s.y};});
let browSag=0;
if(arc.length>=3){const a=arc[0],b=arc[arc.length-1];const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
  for(const q of arc){const t=((q.x-a.x)*dx+(q.y-a.y)*dy)/(len*len);const px=a.x+t*dx,py=a.y+t*dy;browSag=Math.max(browSag,Math.hypot(q.x-px,q.y-py));}}
const checks=[
  ["centerline rides the cranium surface (contains≈1)", onSurface, `maxErr ok`],
  ["centerline is a CURVE not a flat plane (z varies)", zVar>0.3, `zVar=${zVar.toFixed(2)}`],
  ["centerline occlusion: front shows, back hides", frontVis>full.length*0.4 && backVis<full.length*0.25, `front=${frontVis} back=${backVis}/${full.length}`],
  ["brow wrap rides the surface (contains≈1)", browOnSurface, ``],
  ["brow wrap RINGS the head (x and z both vary)", browWraps, `dx=${(Math.max(...bxs)-Math.min(...bxs)).toFixed(2)} dz=${(Math.max(...bzs)-Math.min(...bzs)).toFixed(2)}`],
  ["brow wrap occlusion: front & back views show DIFFERENT halves", browFront>bw.length*0.3 && browBack>bw.length*0.3 && browOverlap<bw.length*0.15, `front=${browFront} back=${browBack} overlap=${browOverlap}`],
  ["brow wrap CURVES under yaw (front-facing arc bows, not flat)", browSag>5, `sagitta=${browSag.toFixed(1)}px at yaw35`],
];
console.log("step3 sub-step 2 — horizontal brow wrap");
let pass=true; for(const[n,ok,info]of checks){console.log(` ${ok?"PASS":"FAIL"}  ${n}  ${info}`); if(!ok)pass=false;}
console.log("wrote proof/out/step3_substep2.png");
process.exit(pass?0:1);
