// Sphere-trace the Loomis head SDF from six camera angles and write PNGs.
//
// Usage:
//   node --experimental-strip-types --no-warnings face-lib/scripts/sdf-render.ts
//
// Output: /tmp/sdf-head/{front,three-quarter-left,profile-left,
//                       three-quarter-right,profile-right,back}.png
//
// Pipeline per pixel:
//   1. Build a primary ray from the camera through that pixel.
//   2. Sphere-trace (Hart 1996) the head SDF: step by f(p) until either
//      f(p) < epsilon (hit) or accumulated distance > far plane (miss).
//   3. On hit, estimate a surface normal via central differences and shade
//      with one directional Lambert light (max(0, n . L)) plus a small
//      ambient term so unlit areas aren't pure black.
//   4. Pack into a grayscale PNG with a flat background.
//
// No shadows, no specular, no AA — just the minimum to confirm the substrate
// reads as a head.

import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

import type { Vec3 } from '../src/math/vec3.ts';
import { add, sub, scale, dot, length, normalize, rotateYX } from '../src/math/vec3.ts';
import { loomisHead, DEFAULT_LOOMIS } from '../src/sdf/head.ts';

// ---------- render config ----------

const IMG_SIZE = 256;
const MAX_STEPS = 128;
const MAX_DIST = 6.0;
const HIT_EPS = 0.0005;
const NORMAL_EPS = 0.001;
const FOV_Y_DEG = 38; // wide enough to fit the whole head plus headroom

// Background gray (matches Loomis' classic gray-paper studies).
const BG_GRAY = 38;
// Two-light rig (key + fill). Both fixed in world space so head orientation
// reads consistently across views. Key from above-front-right; fill from
// the opposite side at lower intensity so back / left views still show
// volume instead of going to pure ambient.
const KEY_DIR: Vec3 = normalize([0.55, 0.65, 0.55]);
const FILL_DIR: Vec3 = normalize([-0.55, 0.35, -0.55]);
const KEY_INT = 0.62;
const FILL_INT = 0.28;
// Ambient lift so unlit pockets aren't pure black.
const AMBIENT = 0.18;

// ---------- camera setup ----------

type View = { name: string; yaw: number; pitch: number };

const VIEWS: View[] = [
  { name: 'front',                yaw: 0,                      pitch: 0 },
  { name: 'three-quarter-left',   yaw: -Math.PI / 4,           pitch: 0 },
  { name: 'profile-left',         yaw: -Math.PI / 2,           pitch: 0 },
  { name: 'three-quarter-right',  yaw:  Math.PI / 4,           pitch: 0 },
  { name: 'profile-right',        yaw:  Math.PI / 2,           pitch: 0 },
  { name: 'back',                 yaw:  Math.PI,               pitch: 0 },
];

// The camera orbits the head at this radius (head sits at origin). Picked
// to give comfortable headroom around the full cranium+jaw silhouette at
// the FOV chosen above. Scaled off the largest cranium semi-axis (depth,
// post-ellipsoid) so the deeper head still fits with the same headroom.
const CAM_RADIUS = 3.5 * Math.max(...DEFAULT_LOOMIS.craniumRadii);
// Aim a hair below the cranium center so the jaw isn't pushed off-frame —
// the head's centroid sits between the cranium ball and the jaw block.
const CAM_TARGET: Vec3 = [0, -0.15, 0];

type Camera = {
  origin: Vec3;
  forward: Vec3; // unit, from camera toward target
  right: Vec3;   // unit, world-X-ish
  up: Vec3;      // unit
  tanHalfFovY: number;
};

const makeCamera = (yaw: number, pitch: number): Camera => {
  // Orbit point: rotate the default forward-Z eye position by (yaw, pitch).
  // Convention in vec3.rotateYX: yaw around +Y first, then pitch around +X.
  const eyeLocal: Vec3 = [0, 0, CAM_RADIUS];
  const eyeRot = rotateYX(eyeLocal, yaw, pitch);
  const origin = add(CAM_TARGET, eyeRot);
  const forward = normalize(sub(CAM_TARGET, origin));
  // World up = +Y. Right = forward x up (right-handed).
  const worldUp: Vec3 = [0, 1, 0];
  const right = normalize(cross(forward, worldUp));
  const up = cross(right, forward);
  return {
    origin,
    forward,
    right,
    up,
    tanHalfFovY: Math.tan((FOV_Y_DEG * Math.PI) / 360),
  };
};

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

// ---------- sphere-trace ----------

type SDF = (p: Vec3) => number;

const trace = (sdf: SDF, ro: Vec3, rd: Vec3): { hit: boolean; p: Vec3; t: number } => {
  let t = 0;
  let p: Vec3 = ro;
  for (let i = 0; i < MAX_STEPS; i++) {
    p = [ro[0] + rd[0] * t, ro[1] + rd[1] * t, ro[2] + rd[2] * t];
    const d = sdf(p);
    if (d < HIT_EPS) return { hit: true, p, t };
    t += d;
    if (t > MAX_DIST) break;
  }
  return { hit: false, p, t };
};

// Central-difference normal. Standard tetrahedron sampling would be cheaper
// (4 samples instead of 6) but central diff is the readable / honest version.
const estimateNormal = (sdf: SDF, p: Vec3): Vec3 => {
  const e = NORMAL_EPS;
  const dx = sdf([p[0] + e, p[1], p[2]]) - sdf([p[0] - e, p[1], p[2]]);
  const dy = sdf([p[0], p[1] + e, p[2]]) - sdf([p[0], p[1] - e, p[2]]);
  const dz = sdf([p[0], p[1], p[2] + e]) - sdf([p[0], p[1], p[2] - e]);
  const n: Vec3 = [dx, dy, dz];
  const l = length(n);
  return l === 0 ? [0, 1, 0] : [n[0] / l, n[1] / l, n[2] / l];
};

// ---------- per-pixel shade ----------

const shade = (sdf: SDF, cam: Camera, u: number, v: number): number => {
  // u, v in [-1, 1] with y-up image convention.
  const aspect = 1; // square image
  const rdLocal: Vec3 = [
    u * cam.tanHalfFovY * aspect,
    v * cam.tanHalfFovY,
    1,
  ];
  // Transform local ray dir into world: rd = u*right + v*up + 1*forward.
  const rdWorld: Vec3 = normalize([
    cam.right[0] * rdLocal[0] + cam.up[0] * rdLocal[1] + cam.forward[0] * rdLocal[2],
    cam.right[1] * rdLocal[0] + cam.up[1] * rdLocal[1] + cam.forward[1] * rdLocal[2],
    cam.right[2] * rdLocal[0] + cam.up[2] * rdLocal[1] + cam.forward[2] * rdLocal[2],
  ]);
  const { hit, p } = trace(sdf, cam.origin, rdWorld);
  if (!hit) return BG_GRAY / 255;
  const n = estimateNormal(sdf, p);
  const key = Math.max(0, dot(n, KEY_DIR)) * KEY_INT;
  const fill = Math.max(0, dot(n, FILL_DIR)) * FILL_INT;
  return AMBIENT + key + fill;
};

// ---------- PNG encoder (8-bit grayscale, no alpha) ----------
//
// Minimal hand-rolled PNG writer — only deps are node:zlib (for IDAT
// deflate) and a small CRC32 table. Avoids pulling pngjs / sharp just to
// emit a few render outputs. Spec: https://www.w3.org/TR/PNG/

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (buf: Buffer): number => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i] ?? 0;
    const idx = (c ^ byte) & 0xff;
    c = (CRC_TABLE[idx] ?? 0) ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type: string, data: Buffer): Buffer => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
};

const encodePngGray = (pixels: Uint8Array, width: number, height: number): Buffer => {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 0;   // color type 0 = grayscale
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter method
  ihdr[12] = 0;  // interlace
  // IDAT: prepend filter byte (0 = None) per scanline.
  const raw = Buffer.alloc(height * (width + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width + 1)] = 0;
    for (let x = 0; x < width; x++) {
      raw[y * (width + 1) + 1 + x] = pixels[y * width + x] ?? 0;
    }
  }
  const idat = deflateSync(raw);
  return Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

// ---------- render one view ----------

const renderView = (sdf: SDF, view: View): Buffer => {
  const cam = makeCamera(view.yaw, view.pitch);
  const pixels = new Uint8Array(IMG_SIZE * IMG_SIZE);
  for (let py = 0; py < IMG_SIZE; py++) {
    // v ranges +1 (top) to -1 (bottom): standard "y up in NDC" mapping.
    const v = 1 - (2 * (py + 0.5)) / IMG_SIZE;
    for (let px = 0; px < IMG_SIZE; px++) {
      const u = (2 * (px + 0.5)) / IMG_SIZE - 1;
      const g = shade(sdf, cam, u, v);
      const byte = Math.round(255 * Math.max(0, Math.min(1, g)));
      pixels[py * IMG_SIZE + px] = byte;
    }
  }
  return encodePngGray(pixels, IMG_SIZE, IMG_SIZE);
};

// ---------- entry point ----------

const main = () => {
  const outDir = '/tmp/sdf-head';
  mkdirSync(outDir, { recursive: true });
  const sdf: SDF = (p) => loomisHead(p);

  const t0 = Date.now();
  for (const view of VIEWS) {
    const tv = Date.now();
    const png = renderView(sdf, view);
    const path = `${outDir}/${view.name}.png`;
    writeFileSync(path, png);
    console.log(`${view.name.padEnd(22)} -> ${path}  (${Date.now() - tv}ms)`);
  }
  console.log(`\n6 views in ${Date.now() - t0}ms at ${IMG_SIZE}x${IMG_SIZE}.`);
};

main();
