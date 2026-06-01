// step2.mjs — step 2 sub-step 1: Loomis proportion landmarks as RATIOS of the
// masses (v5 §1c). Render the merged head outline + the landmark points/lines so
// we can SEE the thirds, eye line, and ear span sit correctly. Self-check proves
// the ratios hold and that NO additive magic offset placed any landmark.
import fs from "node:fs";
import { Canvas } from "./core.mjs";
import { makeCamera, project } from "./head/camera.mjs";
import { headForms } from "./head/forms.mjs";
import { unionOuter } from "./head/union.mjs";
import { dp, smoothClosed } from "./head/geom.mjs";
import { landmarks, invariants } from "./head/proportions.mjs";

const F = headForms();
const ORDER = ["cranium","jaw","neck"];
const L = landmarks(F);

function toRing(sil){ const r=sil.map(q=>[q.x,q.y]); r.push(r[0].slice()); return r; }
function mergedOutline(cam){
  const rings=[];
  for(const k of ORDER){ const s=F[k].silhouette(cam, k==="cranium"?140:96); if(s.length>=3) rings.push(toRing(s)); }
  const raw=unionOuter(rings); if(!raw) return null;
  return smoothClosed(dp(raw,0.8),1);
}

// a horizontal guide line at head-local height y, drawn across the face width.
function hline(y, halfW, z){ const seg=[]; for(let i=0;i<=20;i++){ const x=-halfW+(i/20)*2*halfW; seg.push([x,y,z]); } return seg; }

function renderCell(yawDeg,pitchDeg){
  const W=240,H=320;
  const cam=makeCamera({yaw:yawDeg*Math.PI/180,pitch:pitchDeg*Math.PI/180,scale:92,cx:W/2,cy:H/2+25});
  const cv=new Canvas(W,H);
  const o=mergedOutline(cam);
  if(o) cv.stroke([...o,o[0]],{width:3.0,color:[22,22,28],wobble:0,seed:1,closed:true,taper:false});
  // proportion guide lines (faint) — the Loomis thirds + eye line
  const guides=[
    {y:L.hairlineY,c:[170,170,180]}, {y:L.browY,c:[120,120,200]},
    {y:L.eyeY,c:[90,170,90]}, {y:L.noseBaseY,c:[200,140,90]},
    {y:L.mouthY,c:[190,120,150]}, {y:L.chinY,c:[170,170,180]},
  ];
  for(const g of guides){
    const seg=hline(g.y, L.faceHalfW, L.surfZ).map(p=>{const s=project(p,cam);return {x:s.x,y:s.y};});
    cv.stroke(seg,{width:1.2,color:g.c,wobble:0,seed:2,taper:false});
  }
  // landmark dots
  const dots=[L.eyeL,L.eyeR,L.noseRoot,L.noseBase,L.mouthC,L.earL,L.earR,L.brow];
  for(const d of dots){ const s=project(d,cam); cv.stamp(s.x,s.y,2.6,[150,60,60],1); }
  return cv;
}

const angles=[[0,3,"front"],[30,3,"yaw30"],[60,2,"yaw60"],[90,0,"profile"],[20,-18,"below"]];
const cols=angles.length,CW=240,CH=320,gut=8;
const sheet=new Canvas(cols*CW+(cols+1)*gut,CH+2*gut,[246,245,242]);
angles.forEach(([y,p],i)=>sheet.blit(renderCell(y,p),gut+i*(CW+gut),gut));
fs.writeFileSync("proof/out/step2_substep1.png",sheet.toPNG());

// --- self-checks: ratios hold, no additive-offset placement ---
const inv=invariants(F);
// verify landmarks DERIVE from masses, not constants: move the jaw down (longer
// face) and confirm chin + the equal-thirds landmarks follow it, staying equal.
const F2=headForms(); F2.jaw.c[1]-=0.3;            // drop the jaw mass
const L2=landmarks(F2);
const chinFollowed = L2.chinY < L.chinY - 0.25;    // chin tracked the jaw down
const thirdsGrew   = (L2.browY-L2.noseBaseY) > (L.browY-L.noseBaseY) + 0.05; // face third grew
const stillEqual   = Math.abs((L2.hairlineY-L2.browY)-(L2.browY-L2.noseBaseY)) < 1e-9
                  && Math.abs((L2.browY-L2.noseBaseY)-(L2.noseBaseY-L2.chinY)) < 1e-9;
const movedProportionally = chinFollowed && thirdsGrew && stillEqual;
const checks=[
  ["equal thirds (hairline-brow = brow-nose = nose-chin)", inv.equalThirds, ""],
  ["eye line below brow, above nose base", inv.eyeBelowBrow, `eyeY=${L.eyeY.toFixed(3)}`],
  ["face five eyes wide", inv.fiveEyesWide, `faceW=${(L.faceHalfW*2).toFixed(3)} 5*eye=${(L.eyeWidth*5).toFixed(3)}`],
  ["landmarks derive from masses (scale ry => thirds rescale, still equal)", movedProportionally, ""],
];
console.log("step2 sub-step 1 — proportion landmarks (ratios only)");
console.log(` note: ball-bottom vs nose-base discrepancy = ${inv.ballBottomVsNose.toFixed(3)} (documented spec tension)`);
let pass=true; for(const[n,ok,info]of checks){console.log(` ${ok?"PASS":"FAIL"}  ${n}  ${info}`); if(!ok)pass=false;}
console.log("wrote proof/out/step2_substep1.png");
process.exit(pass?0:1);
