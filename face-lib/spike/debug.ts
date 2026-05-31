// DEBUG MODE — render the bare core geometry, SHADED (not line-art), so the
// 3D form is visible and we can check the math in isolation. A minimal Loomis
// head: cranium + eye sockets + nose only. Lambert shading shows whether the
// socket actually recesses, whether the nose sits right, etc. — things the
// line extractor hides.
//
// Run: node --experimental-strip-types --no-warnings spike/debug.ts
// Out: /tmp/debug/<name>.png  (a row of angles)

import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import type { Vec3 } from '../src/math/vec3.ts';
import { add, sub, dot, normalize, rotateYX } from '../src/math/vec3.ts';
import { ellipsoid, sphere, smin, smoothSubtract, min } from '../src/sdf/primitives.ts';
import { construct, DEFAULT_HEAD } from './head.ts';

const IMG = 220, STEPS = 160, FAR = 6, EPS = 5e-4, FOV = 34;
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const R = 4.2 * Math.max(...DEFAULT_HEAD.craniumRadii);
const T: Vec3 = [0, 0, 0];
const LIGHT = normalize([0.5, 0.6, 0.8] as Vec3);

// ---- the minimal core: cranium + eye sockets + nose ----
const minimalHead = (p: Vec3): number => {
  const c = construct(DEFAULT_HEAD);
  const [rx, ry, rz] = c.craniumRadii;
  let h = ellipsoid(p, c.craniumCenter, c.craniumRadii);

  // eye sockets — carved recess (the thing under test)
  const surfZ = c.frontZ(c.eyeY);
  const socketY = c.eyeY + c.eyeSpacing * 0.05;
  const dh = rz * 0.20;
  const cz = surfZ - rz * 0.04 - dh;
  const sock = (cx: number) => ellipsoid(p, [cx, socketY, cz], [c.eyeSpacing*0.56, c.eyeSpacing*0.40, dh]);
  h = smoothSubtract(h, min(sock(-c.eyeSpacing), sock(c.eyeSpacing)), 0.05);

  // nose — keel + tip
  const rootZ = c.frontZ(c.browY), baseZ = c.frontZ(c.noseBaseY);
  const noseLen = c.browY - c.noseBaseY;
  const keel = ellipsoid(p, [0,(c.browY+c.noseBaseY)/2,(rootZ+baseZ)/2+rz*0.05],[rx*0.07,noseLen*0.6,rz*0.13]);
  const tip = sphere(p, [0, c.noseBaseY+rx*0.04, baseZ+rz*0.14], rx*0.13);
  h = smin(h, smin(keel, tip, 0.04), 0.04);
  return h;
};

type SDF = (p: Vec3) => number;
const cam = (yaw: number) => {
  const e = rotateYX([0,0,R], yaw, 0); const o = add(T, e);
  const f = normalize(sub(T, o)); const r = normalize(cross(f, [0,1,0]));
  return { o, f, r, u: cross(r, f), th: Math.tan(FOV*Math.PI/360) };
};
const trace = (s: SDF, ro: Vec3, rd: Vec3) => {
  let t=0, p: Vec3=ro;
  for (let i=0;i<STEPS;i++){ p=[ro[0]+rd[0]*t,ro[1]+rd[1]*t,ro[2]+rd[2]*t]; const d=s(p); if(d<EPS)return{hit:1,p}; t+=d; if(t>FAR)break; }
  return { hit:0, p };
};
const nrm = (s: SDF, p: Vec3): Vec3 => { const e=1.5e-3;
  return normalize([s([p[0]+e,p[1],p[2]])-s([p[0]-e,p[1],p[2]]), s([p[0],p[1]+e,p[2]])-s([p[0],p[1]-e,p[2]]), s([p[0],p[1],p[2]+e])-s([p[0],p[1],p[2]-e])]); };

const shadeView = (s: SDF, yaw: number): Uint8Array => {
  const C = cam(yaw); const px = new Uint8Array(IMG*IMG);
  for (let y=0;y<IMG;y++){ const v=1-(2*(y+.5))/IMG; for(let x=0;x<IMG;x++){ const u=(2*(x+.5))/IMG-1;
    const rd = normalize([C.r[0]*u*C.th+C.u[0]*v*C.th+C.f[0], C.r[1]*u*C.th+C.u[1]*v*C.th+C.f[1], C.r[2]*u*C.th+C.u[2]*v*C.th+C.f[2]] as Vec3);
    const hit = trace(s, C.o, rd); let g = 250;
    if (hit.hit){ const n=nrm(s,hit.p); const l=Math.max(0,dot(n,LIGHT)); g=Math.round(40+205*l); }
    px[y*IMG+x]=g;
  } }
  return px;
};

// minimal grayscale PNG
const PNG_SIG = Buffer.from([137,80,78,71,13,10,26,10]);
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
const crc32=(b:Buffer)=>{let c=0xffffffff;for(let i=0;i<b.length;i++)c=(CRC[(c^b[i]!)&0xff]!)^(c>>>8);return(c^0xffffffff)>>>0;};
const chunk=(ty:string,d:Buffer)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length,0);const t=Buffer.from(ty,'ascii');const cr=Buffer.alloc(4);cr.writeUInt32BE(crc32(Buffer.concat([t,d])),0);return Buffer.concat([l,t,d,cr]);};
const pngGray=(px:Uint8Array,w:number,h:number)=>{const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=0;const raw=Buffer.alloc(h*(w+1));for(let y=0;y<h;y++){raw[y*(w+1)]=0;for(let x=0;x<w;x++)raw[y*(w+1)+1+x]=px[y*w+x]!;}return Buffer.concat([PNG_SIG,chunk('IHDR',ih),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);};

// tile angles into one strip
const YAWS = [0, -Math.PI/6, -Math.PI/3, -Math.PI/2];
const main = () => {
  mkdirSync('/tmp/debug', { recursive: true });
  const cols = YAWS.length, W = cols*IMG, Hh = IMG;
  const strip = new Uint8Array(W*Hh).fill(255);
  YAWS.forEach((yaw, ci) => {
    const v = shadeView(minimalHead, yaw);
    for (let y=0;y<IMG;y++) for (let x=0;x<IMG;x++) strip[y*W + ci*IMG + x] = v[y*IMG+x]!;
  });
  writeFileSync('/tmp/debug/core.png', pngGray(strip, W, Hh));
  console.log('debug: /tmp/debug/core.png  (front, 30, 60, profile)');
};
main();
