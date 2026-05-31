// Render every pack × {front, tq-left, profile} to /tmp/grid/<pack>-<view>.svg
// Pass a 4th+ arg containing 'styled' to overlay the default style marks.
import { mkdirSync, writeFileSync } from 'node:fs';
import type { Vec3, Vec2 } from '../src/math/vec3.ts';
import { add, sub, dot, normalize, rotateYX } from '../src/math/vec3.ts';
import { spikeHead, DEFAULT_HEAD } from './head.ts';
import { PACKS } from './packs.ts';
import { plainLineMarks, type Projector } from './style.ts';

const IMG = 256, STEPS = 160, FAR = 6, EPS = 4e-4, NE = 15e-4, FOV = 36;
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const R = 4.4 * Math.max(...DEFAULT_HEAD.craniumRadii);
const T: Vec3 = [0, -0.45, 0];
const VIEWS: [string, number][] = [['front', 0], ['tq', -Math.PI/4], ['profile', -Math.PI/2]];

const cam = (yaw: number) => {
  const e = rotateYX([0,0,R], yaw, 0); const o = add(T, e);
  const f = normalize(sub(T, o)); const r = normalize(cross(f, [0,1,0]));
  return { o, f, r, u: cross(r, f), th: Math.tan(FOV*Math.PI/360) };
};
const trace = (s: (p:Vec3)=>number, ro: Vec3, rd: Vec3) => {
  let t = 0, p: Vec3 = ro;
  for (let i=0;i<STEPS;i++){ p=[ro[0]+rd[0]*t,ro[1]+rd[1]*t,ro[2]+rd[2]*t]; const d=s(p); if(d<EPS)return{hit:1,p}; t+=d; if(t>FAR)break; }
  return { hit: 0, p };
};
const nrm = (s: (p:Vec3)=>number, p: Vec3): Vec3 => {
  const e = NE;
  return normalize([s([p[0]+e,p[1],p[2]])-s([p[0]-e,p[1],p[2]]), s([p[0],p[1]+e,p[2]])-s([p[0],p[1]-e,p[2]]), s([p[0],p[1],p[2]+e])-s([p[0],p[1],p[2]-e])]);
};
// Project a world point to screen px + occlusion test against the head SDF.
const makeProjector = (C: ReturnType<typeof cam>, s: (p:Vec3)=>number): Projector => (w: Vec3) => {
  const rel = sub(w, C.o);
  const zc = dot(rel, C.f);                    // depth along view axis
  const xc = dot(rel, C.r), yc = dot(rel, C.u);
  const sx = (xc / (zc * C.th));               // NDC x (aspect 1)
  const sy = (yc / (zc * C.th));               // NDC y
  const px = (sx * 0.5 + 0.5) * IMG;
  const py = (0.5 - sy * 0.5) * IMG;
  // Visibility = is this anchor on the camera-facing side of the head?
  // (A strict depth-trace fails because feature anchors sit slightly INSIDE
  // the inflated surface — brow ridge / mound push the skin forward of the
  // bare-cranium anchor. We don't want occlusion against bumps; we want
  // "front-facing". Use the surface normal at the anchor: outward dir from the
  // head center to the anchor; visible if it faces the camera.)
  const outward = normalize(w);                // head centered near origin
  const visible = dot(outward, sub(C.o, w)) > 0; // anchor's face toward camera
  return { s: [px, py] as Vec2, visible };
};

const render = (dial: Partial<typeof DEFAULT_HEAD>, yaw: number, styled = false): string => {
  const C = cam(yaw); const s = (p: Vec3) => spikeHead(p, dial);
  const hit = new Uint8Array(IMG*IMG), nx = new Float32Array(IMG*IMG), ny = new Float32Array(IMG*IMG), nz = new Float32Array(IMG*IMG);
  const fr = new Float32Array(IMG*IMG); // facing ratio = |n . viewDir|, 0 at grazing
  for (let y=0;y<IMG;y++){ const v=1-(2*(y+.5))/IMG; for(let x=0;x<IMG;x++){ const u=(2*(x+.5))/IMG-1;
    const rd = normalize([C.r[0]*u*C.th+C.u[0]*v*C.th+C.f[0], C.r[1]*u*C.th+C.u[1]*v*C.th+C.f[1], C.r[2]*u*C.th+C.u[2]*v*C.th+C.f[2]] as Vec3);
    const h = trace(s, C.o, rd); const i=y*IMG+x; if(h.hit){ hit[i]=1; const n=nrm(s,h.p); nx[i]=n[0]; ny[i]=n[1]; nz[i]=n[2];
      fr[i] = Math.abs(n[0]*rd[0]+n[1]*rd[1]+n[2]*rd[2]); } }
  }
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${IMG}" height="${IMG}"><rect width="${IMG}" height="${IMG}" fill="#fff"/>`];
  const at = (x:number,y:number)=>y*IMG+x;
  for (let y=1;y<IMG-1;y++) for (let x=1;x<IMG-1;x++){ const i=at(x,y); if(!hit[i])continue;
    let sil=false, cr=0; for(const j of[at(x-1,y),at(x+1,y),at(x,y-1),at(x,y+1)]) if(!hit[j])sil=true;
    const ni:Vec3=[nx[i]!,ny[i]!,nz[i]!];
    for(const j of[at(x+1,y),at(x,y+1)]){ if(!hit[j])continue; cr=Math.max(cr, Math.acos(Math.max(-1,Math.min(1,dot(ni,[nx[j]!,ny[j]!,nz[j]!]))))); }
    // (3) interior contour: a LOCAL MINIMUM of the facing ratio along a curved
    // surface marks where the form rolls away from view — the line an artist
    // draws on a smooth surface (lid fold, brow roll, cheek turn, eyeball
    // edge). Detect by: this pixel is near grazing AND is a local min vs its
    // x/y neighbours (so we get a thin line, not a shaded band).
    let contour = 0;
    const GRAZE = 0.18;   // tighter: only strong convex rolls ink, not soft
                          // concave socket rims (those inked a full eye loop in 3/4)
    if (fr[i]! < GRAZE) {
      const fl=fr[at(x-1,y)]!, frr=fr[at(x+1,y)]!, fu=fr[at(x,y-1)]!, fd=fr[at(x,y+1)]!;
      const isMin = (hit[at(x-1,y)]&&hit[at(x+1,y)]&&fr[i]!<=fl&&fr[i]!<=frr)
                 || (hit[at(x,y-1)]&&hit[at(x,y+1)]&&fr[i]!<=fu&&fr[i]!<=fd);
      if (isMin) contour = 1 - fr[i]!/GRAZE;
    }
    const val = sil ? 1 : Math.max(cr>0.45?Math.min(1,cr):0, contour*0.9);
    if(val>0.15) parts.push(`<rect x="${x}" y="${y}" width="1.2" height="1.2" fill="#111" opacity="${val.toFixed(2)}"/>`);
  }
  if (styled) {
    const project = makeProjector(C, s);
    for (const m of plainLineMarks(dial, project)) parts.push(m);
  }
  parts.push('</svg>'); return parts.join('');
};

const args = process.argv.slice(2);
const styled = args.includes('--styled');
const packs = args.filter(a => a !== '--styled');
const names = packs.length ? packs : Object.keys(PACKS);
mkdirSync('/tmp/grid', { recursive: true });
for (const name of names) {
  const dial = PACKS[name] ?? {};
  for (const [vn, yaw] of VIEWS) writeFileSync(`/tmp/grid/${name}-${vn}.svg`, render(dial, yaw, styled));
  console.log('rendered', name);
}
