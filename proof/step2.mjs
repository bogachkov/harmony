// step2.mjs — step 2 sub-step 3: silhouette PROXIES. Nose-base and ear-stub feed
// the outline union (so the profile keeps the nose and ears); the eye socket does
// NOT (it's a recess). Render the merged outline WITH proxies; self-check proves
// the proxies change the silhouette where expected and that the eye contributes
// nothing.
import fs from "node:fs";
import { Canvas } from "./core.mjs";
import { makeCamera, project } from "./head/camera.mjs";
import { headForms } from "./head/forms.mjs";
import { unionOuter } from "./head/union.mjs";
import { dp, smoothClosed } from "./head/geom.mjs";
import { anchors, silhouetteProxy } from "./head/anchors.mjs";
import { convexHull } from "./head/union.mjs";

const F = headForms();
const ORDER = ["cranium","jaw","neck"];
const A = anchors(F);

function toRing(s){ const r=s.map(q=>[q.x,q.y]); r.push(r[0].slice()); return r; }

// project a head-local 3D MOUNTING VOLUME to its 2D silhouette ring = the convex
// hull of the projected points (a proxy is a small convex solid; its outline is
// the hull, ordered + simple, so the boolean union accepts it).
function projRing(pts3, cam){
  const pj = pts3.map(p=>{ const s=project(p,cam); return {x:s.x,y:s.y}; });
  const hull = convexHull(pj);                 // [[x,y],...] CCW, ordered, simple
  if(hull.length<3) return null;
  const r = hull.map(q=>[q[0],q[1]]); r.push(r[0].slice()); return r;
}

function mergedOutline(cam, withProxies){
  const rings=[];
  for(const k of ORDER){ const s=F[k].silhouette(cam,k==="cranium"?140:96); if(s.length>=3) rings.push(toRing(s)); }
  if(withProxies){
    for(const a of [A.nose, A.earL, A.earR]){
      const px=silhouetteProxy(a); if(px && px.length>=3) rings.push(projRing(px,cam));
    }
  }
  const raw=unionOuter(rings); if(!raw) return null; return smoothClosed(dp(raw,0.8),1);
}

function renderCell(yawDeg,pitchDeg){
  const W=240,H=320;
  const cam=makeCamera({yaw:yawDeg*Math.PI/180,pitch:pitchDeg*Math.PI/180,scale:92,cx:W/2,cy:H/2+25});
  const cv=new Canvas(W,H);
  const o=mergedOutline(cam,true);
  if(o) cv.stroke([...o,o[0]],{width:3.0,color:[22,22,28],wobble:0,seed:1,closed:true,taper:false});
  return cv;
}

const angles=[[0,3,"front"],[30,3,"yaw30"],[60,2,"yaw60"],[90,0,"profile"],[20,-18,"below"]];
const cols=angles.length,CW=240,CH=320,gut=8;
const sheet=new Canvas(cols*CW+(cols+1)*gut,CH+2*gut,[246,245,242]);
angles.forEach(([y,p],i)=>sheet.blit(renderCell(y,p),gut+i*(CW+gut),gut));
fs.writeFileSync("proof/out/step2_substep3.png",sheet.toPNG());

// --- self-checks ---
function area(ring){ let s=0; for(let i=0;i<ring.length-1;i++) s+=ring[i].x*ring[i+1].y-ring[i+1].x*ring[i].y; return Math.abs(s/2); }
// max screen-x of the outline within a vertical band (the nose level)
function rightExtentBand(ring, yLo, yHi){ const b=ring.filter(q=>q.y>=yLo&&q.y<=yHi); return b.length? Math.max(...b.map(q=>q.x)) : -Infinity; }
import { landmarks } from "./head/proportions.mjs";
const Lm = landmarks(F);

const profCam=makeCamera({yaw:90*Math.PI/180,pitch:0,scale:92,cx:110,cy:185});
const profNo=mergedOutline(profCam,false), profYes=mergedOutline(profCam,true);
// nose level in screen-y (project the nose base) and a band around it
const noseScreenY = project(Lm.noseBase, profCam).y;
const band = 30;
const nosePushed = profYes && profNo
  && rightExtentBand(profYes, noseScreenY-band, noseScreenY+band) > rightExtentBand(profNo, noseScreenY-band, noseScreenY+band) + 1.0;

const frontCam=makeCamera({yaw:0,pitch:0,scale:92,cx:110,cy:185});
const frNo=mergedOutline(frontCam,false), frYes=mergedOutline(frontCam,true);
// ears widen the front silhouette: area grows when proxies included
const earsWiden = frYes && frNo && area(frYes) > area(frNo);

// eye emits NO proxy
const eyeNoProxy = silhouetteProxy(A.eyeL)===null && silhouetteProxy(A.eyeR)===null;
// nose + ear DO emit proxies
const proxiesExist = !!silhouetteProxy(A.nose) && !!silhouetteProxy(A.earL) && !!silhouetteProxy(A.earR);

const checks=[
  ["nose proxy pushes profile silhouette forward", nosePushed, profYes&&profNo?`Δright=${(rightExtentBand(profYes,noseScreenY-band,noseScreenY+band)-rightExtentBand(profNo,noseScreenY-band,noseScreenY+band)).toFixed(1)}px`:"null"],
  ["ear proxies widen front silhouette", earsWiden, frYes&&frNo?`Δarea=${(area(frYes)-area(frNo)).toFixed(0)}`:"null"],
  ["eye socket emits NO silhouette proxy", eyeNoProxy, ""],
  ["nose + ear DO emit proxies", proxiesExist, ""],
];
console.log("step2 sub-step 3 — silhouette proxies");
let pass=true; for(const[n,ok,info]of checks){console.log(` ${ok?"PASS":"FAIL"}  ${n}  ${info}`); if(!ok)pass=false;}
console.log("wrote proof/out/step2_substep3.png");
process.exit(pass?0:1);
