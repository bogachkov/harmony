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
