// forms.mjs — head masses as analytic solids (HEAD_TECH_PLAN v5 §1a, §3).
// A Form exposes: silhouette(cam)->ordered simple polygon (the APPARENT CONTOUR,
// n·viewDir=0 — NOT a convex hull of sampled points), frontDepth, normalAt,
// contains. Sub-step 1: the axis-aligned Ellipsoid.
//
// Math (why this is analytic, not sampled-blob):
//   An axis-aligned ellipsoid is M·(unit sphere) + c, with M = diag(rx,ry,rz).
//   Surface point p = c + M u, |u|=1. Outward normal n ∝ M^{-1} u (inverse-
//   transpose of M; for diagonal M that's diag(1/rx,1/ry,1/rz)).
//   Silhouette condition n·v = 0  ⇔  (M^{-1}u)·v = 0  ⇔  u·(M^{-1}v) = 0.
//   So the contour is exactly the great circle of u perpendicular to w = M^{-1}v.
//   We parametrize that great circle and map it through M: every emitted point
//   lies ON the true silhouette curve, in order → an exact, simple polygon.

import { viewDir as camViewDir, project as camProject } from "./camera.mjs";

function norm(v){const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];}
function add(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}

export class Ellipsoid {
  // center c=[x,y,z], radii r=[rx,ry,rz], all in head-local space.
  constructor(c, r) { this.c = c; this.r = r; }

  // exact surface normal at a surface point p (inverse-transpose of M).
  normalAt(p) {
    const u = [(p[0]-this.c[0])/this.r[0], (p[1]-this.c[1])/this.r[1], (p[2]-this.c[2])/this.r[2]];
    // n ∝ M^{-1} u = u ./ r  (diagonal M => M^{-T}=M^{-1})
    return norm([u[0]/this.r[0], u[1]/this.r[1], u[2]/this.r[2]]);
  }

  // <1 inside, =1 on surface, >1 outside.
  contains(p) {
    const dx=(p[0]-this.c[0])/this.r[0], dy=(p[1]-this.c[1])/this.r[1], dz=(p[2]-this.c[2])/this.r[2];
    return dx*dx+dy*dy+dz*dz;
  }

  // The apparent contour as an ordered polygon of {x,y} screen points.
  // v = viewDir in the ellipsoid's (head-local) space.
  silhouette(cam, n = 96) {
    const v = norm(camViewDir(cam));
    const w = norm([v[0]/this.r[0], v[1]/this.r[1], v[2]/this.r[2]]); // M^{-1} v, normalized
    // two orthonormal vectors a,b spanning the plane ⊥ w (the great-circle plane).
    let seed = Math.abs(w[0]) < 0.9 ? [1,0,0] : [0,1,0];
    const a = norm(cross(w, seed));
    const b = norm(cross(w, a));
    const poly = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * 2 * Math.PI;
      const u = [a[0]*Math.cos(t)+b[0]*Math.sin(t), a[1]*Math.cos(t)+b[1]*Math.sin(t), a[2]*Math.cos(t)+b[2]*Math.sin(t)];
      const p = add(this.c, [this.r[0]*u[0], this.r[1]*u[1], this.r[2]*u[2]]); // c + M u
      const s = camProject(p, cam);
      poly.push({ x: s.x, y: s.y });
    }
    return poly; // ordered, closed implicitly; exact contour points
  }

  // nearest front-facing surface depth at screen (sx,sy), or null if the ray
  // misses. Real ellipsoid-ray intersection in view space (no fakery).
  frontDepth(sx, sy, cam) {
    // view-space: o = ((sx-cx)/scale, -(sy-cy)/scale, BIG) looking down -Z is not
    // how camProject works; camProject = rotateYawPitch then ortho. So build the
    // world ray from the camera basis.
    const { invBasis } = camBasis(cam);
    const ox = (sx - cam.cx) / cam.scale, oy = -(sy - cam.cy) / cam.scale;
    // world point on the image plane + ray dir = viewDir (toward viewer => -depth axis)
    const Xw = invBasis.X, Yw = invBasis.Y, Vw = invBasis.Z;
    const base = [ox*Xw[0]+oy*Yw[0], ox*Xw[1]+oy*Yw[1], ox*Xw[2]+oy*Yw[2]];
    const dir = Vw; // unit
    // solve |M^{-1}((base + d*dir) - c)|^2 = 1
    const e = [(base[0]-this.c[0])/this.r[0], (base[1]-this.c[1])/this.r[1], (base[2]-this.c[2])/this.r[2]];
    const f = [dir[0]/this.r[0], dir[1]/this.r[1], dir[2]/this.r[2]];
    const A = dot(f,f), B = 2*dot(e,f), C = dot(e,e)-1;
    const disc = B*B - 4*A*C;
    if (disc < 0) return null;
    const sq = Math.sqrt(disc);
    const d = Math.max((-B+sq)/(2*A), (-B-sq)/(2*A)); // nearer the viewer = larger depth
    const p = [base[0]+d*dir[0], base[1]+d*dir[1], base[2]+d*dir[2]];
    return camProject(p, cam).depth;
  }
}

// ---------------------------------------------------------------------------
// Sub-step 2: OVOID — a true non-affine egg (occiput bulge back-low, flattened
// crown), NOT an affine sphere. Modeled as a surface of revolution about the
// vertical (y) axis with a radius profile r(y) AND a spine that shifts backward
// with height zc(y) (the occiput). Because it is non-affine, the apparent
// contour is NOT a fixed great circle; we solve n·viewDir=0 EXACTLY per height.
//
// Surface: S(α,τ) = ( r(τ)cosα , ry·τ , zc(τ) + r(τ)sinα ),  τ∈(-1,1).
// Normal ∝ (-cosα, zc'·sinα + r', -sinα)  (derived from S_α × S_y, /r).
// Silhouette condition n·v=0  ⇒  A cosα + B sinα = C  with
//   A=-vx,  B=(zc'·vy - vz),  C=-r'·vy   → closed-form α solutions per height.
// Every emitted point therefore lies ON the true contour. Shape coefficients
// (radii + profile knobs) are config, not in-formula geometry fudge.
export class Ovoid {
  constructor(c, {
    rxz = 0.86,        // horizontal radius (width/depth) of the cranium ball
    ry = 1.0,          // vertical half-height
    crownExp = 0.42,   // <0.5 flattens the dome (crown); 0.5 = sphere
    taper = 0.10,      // >0 narrows the top vs bottom (egg)
    occ = 0.16,        // occiput: backward (-z) bulge magnitude
    occCenter = -0.35, // height (τ) where the occiput bulge peaks (lower-back)
    occWidth = 0.45,   // spread of the occiput bulge
  } = {}) {
    this.c = c;
    Object.assign(this, { rxz, ry, crownExp, taper, occ, occCenter, occWidth });
  }

  // radius profile r(τ) and its τ-derivative.
  _r(tau) {
    const base = Math.pow(Math.max(1e-9, 1 - tau*tau), this.crownExp);
    return this.rxz * base * (1 - this.taper*tau);
  }
  _dr_dtau(tau) {
    const s = Math.max(1e-9, 1 - tau*tau);
    const base = Math.pow(s, this.crownExp);
    const dbase = this.crownExp * Math.pow(s, this.crownExp - 1) * (-2*tau);
    const taperF = (1 - this.taper*tau);
    return this.rxz * (dbase*taperF + base*(-this.taper));
  }
  // spine back-shift zc(τ) (occiput) and its τ-derivative — a smooth Gaussian lobe.
  _zc(tau) {
    const z = (tau - this.occCenter) / this.occWidth;
    return -this.occ * Math.exp(-z*z);
  }
  _dzc_dtau(tau) {
    const z = (tau - this.occCenter) / this.occWidth;
    return -this.occ * Math.exp(-z*z) * (-2*z / this.occWidth);
  }

  // surface point at (alpha, tau)
  _point(alpha, tau) {
    const r = this._r(tau), zc = this._zc(tau);
    return [ r*Math.cos(alpha), this.ry*tau, zc + r*Math.sin(alpha) ];
  }

  // exact outward normal at (alpha, tau): ∝ (-cosα, zc'·sinα + r', -sinα),
  // where r',zc' are d/dy = (1/ry) d/dτ.
  _normal(alpha, tau) {
    const rp = this._dr_dtau(tau) / this.ry;
    const zcp = this._dzc_dtau(tau) / this.ry;
    return norm([ -Math.cos(alpha), zcp*Math.sin(alpha) + rp, -Math.sin(alpha) ]);
  }
  normalAt(p) {
    const tau = (p[1]-this.c[1])/this.ry;
    const r = this._r(tau), zc = this._zc(tau);
    const alpha = Math.atan2((p[2]-this.c[2]) - zc, (p[0]-this.c[0]));
    return this._normal(alpha, tau);
  }

  // Solve A cosα + B sinα = C → up to two α in [0,2π). Returns [] if |C|>R.
  _solveAlpha(A, B, C) {
    const R = Math.hypot(A, B);
    if (R < 1e-12 || Math.abs(C) > R + 1e-12) return [];
    const phi = Math.atan2(B, A);              // A cosα+B sinα = R cos(α-phi)
    const d = Math.acos(Math.max(-1, Math.min(1, C / R)));
    return [phi + d, phi - d];
  }

  // height range where the silhouette exists = where A cosα+B sinα=C has roots,
  // i.e. |C| <= sqrt(A²+B²). Returns [tauLo, tauHi], the true turning points
  // (where the two α roots merge), found by bisection so the contour closes at
  // the real top/bottom instead of a fixed grid leaving a flat chord.
  _tauRange(v) {
    const hasRoots = (t) => {
      const rp = this._dr_dtau(t)/this.ry, zcp = this._dzc_dtau(t)/this.ry;
      const A=-v[0], B=(zcp*v[1]-v[2]), C=-rp*v[1];
      return (A*A+B*B) - C*C;                  // >=0 => roots exist
    };
    const bisect = (inT, outT) => { // inT has roots, outT doesn't
      for (let k=0;k<50;k++){ const m=(inT+outT)/2; if (hasRoots(m)>=0) inT=m; else outT=m; }
      return inT;
    };
    // assume mid has roots; march out to each pole to find the edges.
    let hi = 0.999, lo = -0.999;
    if (hasRoots(0) < 0) return null;
    if (hasRoots(hi) < 0) hi = bisect(0, 0.999);
    if (hasRoots(lo) < 0) lo = bisect(0, -0.999);
    return [lo, hi];
  }

  // Apparent contour, traced by branch continuity between the true turning
  // points. Two silhouette points per height; up the right rail, down the left.
  silhouette(cam, n = 140) {
    const v = norm(camViewDir(cam));
    const rng = this._tauRange(v);
    if (!rng) return [];
    const [lo, hi] = rng;
    const steps = Math.max(60, n >> 1);
    const upper = [], lower = [];
    for (let i = 0; i <= steps; i++) {
      const t = lo + (hi - lo) * (i / steps);
      const rp = this._dr_dtau(t) / this.ry;
      const zcp = this._dzc_dtau(t) / this.ry;
      const roots = this._solveAlpha(-v[0], zcp*v[1] - v[2], -rp*v[1]);
      if (roots.length < 2) {                   // at the very turning point: one merged pt
        if (roots.length === 1) { const s=camProject(add(this.c,this._point(roots[0],t)),cam); upper.push({x:s.x,y:s.y}); }
        continue;
      }
      const pts = roots.map((a) => { const s = camProject(add(this.c, this._point(a, t)), cam); return { x: s.x, y: s.y }; });
      pts.sort((p, q) => p.x - q.x);
      lower.push(pts[0]);                        // left rail
      upper.push(pts[1]);                        // right rail
    }
    if (upper.length + lower.length < 4) return [];
    return upper.concat(lower.reverse());        // closed loop, meets at turning points
  }

  contains(p) {
    const tau = (p[1]-this.c[1])/this.ry;
    if (Math.abs(tau) >= 1) return 2;           // outside vertical extent
    const r = this._r(tau), zc = this._zc(tau);
    const dx = p[0]-this.c[0], dz = (p[2]-this.c[2]) - zc;
    return (dx*dx + dz*dz) / (r*r);             // <1 inside, =1 surface
  }

  // nearest front-facing surface depth along the view ray through (sx,sy):
  // bisection on contains()-1 sign change (root of the analytic implicit, not a hull).
  frontDepth(sx, sy, cam) {
    const { invBasis } = camBasis(cam);
    const ox = (sx-cam.cx)/cam.scale, oy = -(sy-cam.cy)/cam.scale;
    const Xw=invBasis.X, Yw=invBasis.Y, dir=invBasis.Z;
    const base = [ox*Xw[0]+oy*Yw[0], ox*Xw[1]+oy*Yw[1], ox*Xw[2]+oy*Yw[2]];
    const g = (d) => this.contains([base[0]+d*dir[0], base[1]+d*dir[1], base[2]+d*dir[2]]) - 1;
    // scan outward-to-inward for a sign change (front surface = larger d)
    let lo=null, hi=null, prevD=3, prevG=g(3);
    for (let d=3; d>=-3; d-=0.05) { const gd=g(d); if (prevG>0 && gd<=0){ lo=d; hi=prevD; break; } prevD=d; prevG=gd; }
    if (lo===null) return null;
    for (let k=0;k<40;k++){ const m=(lo+hi)/2; if (g(m)<=0) hi=m; else lo=m; }
    const d=(lo+hi)/2, p=[base[0]+d*dir[0], base[1]+d*dir[1], base[2]+d*dir[2]];
    return camProject(p, cam).depth;
  }
}

// ---------------------------------------------------------------------------
// Sub-step 4: the MANDIBLE, built from real overlapping analytic masses so the
// jaw-angle (gonial corner) and under-chin concavity EMERGE from boolean union
// seams — not from per-cross-section magic forward-offsets (the prior cycle's
// failure). Every piece is a validated analytic Ellipsoid/Ovoid; positions are
// Loomis landmarks (config), not in-formula fudge.
//
// headForms() returns the named analytic solids of a bald head in head-local
// space (cranium ball at origin, radius ~1). Mandible = ramus lobe + chin block;
// chin is a landmark of that mandible group, not a separate sibling.
export function headForms() {
  return {
    cranium: new Ovoid([0,0,0], { rxz:0.86, ry:1.0, crownExp:0.37, taper:0.05, occ:0.15, occCenter:-0.30, occWidth:0.50 }),
    // Mandible as ONE jaw mass: a wide lower-face block seated deep into the
    // cranium (overlap invariant) so it merges smoothly instead of bulging as a
    // separate blister. Wider than deep; projects forward for the chin.
    jaw:     new Ellipsoid([0, -0.78, 0.30], [0.70, 0.62, 0.50]),
    // neck: below and set BACK, deeply overlapping the jaw so the only seam that
    // survives is the under-jaw / jaw-to-neck concavity (not extra lumps).
    neck:    new Ellipsoid([0, -1.45, -0.14], [0.40, 0.62, 0.40]),
  };
}

// camera world basis (columns of the inverse of rotateYawPitch).
function camBasis(cam) {
  const inv = (p) => {
    const cp=Math.cos(-cam.pitch), sp=Math.sin(-cam.pitch);
    const y1=cp*p[1]-sp*p[2], z1=sp*p[1]+cp*p[2], x1=p[0];
    const cy=Math.cos(-cam.yaw), sy=Math.sin(-cam.yaw);
    return [cy*x1+sy*z1, y1, -sy*x1+cy*z1];
  };
  return { invBasis: { X: inv([1,0,0]), Y: inv([0,1,0]), Z: inv([0,0,1]) } };
}
