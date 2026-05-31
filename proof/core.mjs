// core.mjs — self-contained 3D math, occlusion, hand-line inking, PNG output.
// No external dependencies: rasterizer + PNG writer (built-in zlib) are local.
import zlib from "node:zlib";

// ---------- 3D math ----------
export const deg = (d) => (d * Math.PI) / 180;

export function rotateYawPitch(p, yaw, pitch) {
  // yaw about Y (turn left/right), then pitch about X (nod up/down).
  const [x, y, z] = p;
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  let x1 = cy * x + sy * z;
  let z1 = -sy * x + cy * z;
  let y1 = y;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const y2 = cp * y1 - sp * z1;
  const z2 = sp * y1 + cp * z1;
  return [x1, y2, z2];
}

// Orthographic projection. Viewer looks down -Z from +Z; depth = z (bigger = nearer).
export function project(p, cx, cy, scale) {
  return { x: cx + p[0] * scale, y: cy - p[1] * scale, z: p[2] };
}

// Is a point visible, i.e. NOT hidden behind the cranium sphere (center origin, radius R)?
// One depth test handles both great-circle self-occlusion and curves passing behind the skull.
export function visibleAgainstSphere(p, R, tol = 0.03) {
  const s2 = p[0] * p[0] + p[1] * p[1];
  if (s2 >= R * R) return true;            // projects outside the silhouette -> sphere can't hide it
  const front = Math.sqrt(R * R - s2);     // depth of the sphere's near surface at this screen pos
  return p[2] >= front - tol * R;          // in front of (or on) the near surface -> visible
}

// ---------- seeded RNG + 1D wobble noise ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function wobbleFn(seed, amp) {
  const r = mulberry32(seed);
  const a = [], f = [], ph = [];
  for (let i = 0; i < 3; i++) {
    a.push((0.6 + 0.4 * r()) / (i + 1));
    f.push((0.05 + 0.10 * r()) * (i + 1));
    ph.push(r() * Math.PI * 2);
  }
  const norm = a.reduce((s, v) => s + v, 0);
  return (t) => {
    let v = 0;
    for (let i = 0; i < 3; i++) v += a[i] * Math.sin(f[i] * t + ph[i]);
    return (v / norm) * amp;
  };
}

// ---------- canvas (RGBA, white background) + PNG ----------
export class Canvas {
  constructor(w, h, bg = [255, 255, 255]) {
    this.w = w; this.h = h;
    this.buf = Buffer.alloc(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      this.buf[i * 4] = bg[0]; this.buf[i * 4 + 1] = bg[1];
      this.buf[i * 4 + 2] = bg[2]; this.buf[i * 4 + 3] = 255;
    }
  }
  stamp(x, y, r, col, alpha) {
    const x0 = Math.max(0, Math.floor(x - r - 1)), x1 = Math.min(this.w - 1, Math.ceil(x + r + 1));
    const y0 = Math.max(0, Math.floor(y - r - 1)), y1 = Math.min(this.h - 1, Math.ceil(y + r + 1));
    for (let yy = y0; yy <= y1; yy++) {
      for (let xx = x0; xx <= x1; xx++) {
        const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - y);
        let cov = r - d + 0.5;            // ~1px anti-aliased edge
        if (cov <= 0) continue;
        if (cov > 1) cov = 1;
        cov *= alpha;
        const i = (yy * this.w + xx) * 4;
        this.buf[i] = col[0] * cov + this.buf[i] * (1 - cov);
        this.buf[i + 1] = col[1] * cov + this.buf[i + 1] * (1 - cov);
        this.buf[i + 2] = col[2] * cov + this.buf[i + 2] * (1 - cov);
      }
    }
  }
  // Ink a 2D polyline as a hand-drawn stroke: resample, wobble, taper, stamp.
  stroke(pts, { width = 3, color = [30, 30, 35], wobble = 1.3, seed = 1, alpha = 1, closed = false, taper = true } = {}) {
    if (pts.length < 2) return;
    const wob = wobbleFn(seed, wobble);
    // cumulative length
    const seg = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      seg.push(d); total += d;
    }
    if (total < 0.5) return;
    const step = 1.1;
    // walk the polyline at fixed steps
    let acc = 0, si = 0, sofar = 0;
    const out = [];
    while (sofar <= total) {
      while (si < seg.length && acc + seg[si] < sofar) { acc += seg[si]; si++; }
      const a = pts[Math.min(si, pts.length - 1)], b = pts[Math.min(si + 1, pts.length - 1)];
      const segLen = seg[si] || 1;
      const f = Math.max(0, Math.min(1, (sofar - acc) / segLen));
      let x = a.x + (b.x - a.x) * f, y = a.y + (b.y - a.y) * f;
      // tangent + perpendicular for wobble
      let tx = b.x - a.x, ty = b.y - a.y;
      const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const px = -ty, py = tx;
      const off = wob(sofar);
      x += px * off; y += py * off;
      out.push({ x, y, s: sofar });
      sofar += step;
    }
    for (const pt of out) {
      let hw = width / 2;
      if (taper && !closed) {
        const frac = pt.s / total;
        hw *= 0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, Math.max(0, frac)));
        if (hw < width * 0.18) hw = width * 0.18;
      }
      this.stamp(pt.x, pt.y, hw, color, alpha);
    }
  }
  toPNG() {
    const w = this.w, h = this.h;
    const raw = Buffer.alloc(h * (w * 4 + 1));
    for (let y = 0; y < h; y++) {
      raw[y * (w * 4 + 1)] = 0;
      this.buf.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, y * w * 4 + w * 4);
    }
    const idat = zlib.deflateSync(raw, { level: 9 });
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0)),
    ]);
  }
  blit(src, ox, oy) {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const di = ((oy + y) * this.w + (ox + x)) * 4, si = (y * src.w + x) * 4;
        if (oy + y < 0 || oy + y >= this.h || ox + x < 0 || ox + x >= this.w) continue;
        this.buf[di] = src.buf[si]; this.buf[di + 1] = src.buf[si + 1];
        this.buf[di + 2] = src.buf[si + 2]; this.buf[di + 3] = 255;
      }
    }
  }
}

const CRC = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
