import type { Vec3, Vec2 } from '../math/vec3.ts';
import { rotateYX } from '../math/vec3.ts';
import type { FaceParams } from '../model/params.ts';
import type { Curve } from '../model/scaffold.ts';
import type { Capsule2D } from './hull.ts';

export type Projected = {
  kind: Curve['kind'];
  closed: boolean;
  points: Vec2[];
  // Average Z after rotation, used for trivial painter-ordering (back-to-front).
  avgZ: number;
  role?: Curve['role'];
  fill?: Curve['fill'];
  noStroke?: Curve['noStroke'];
  ink?: Curve['ink'];
  // Capsule chain — populated for kind === 'clump-volume'. Each entry is one
  // segment of the centreline expanded by its end radii. The renderer feeds
  // these into hull.mergeCapsulesToHull grouped by hullGroup.
  capsules?: Capsule2D[];
  // Hull-merge group key (mirrors Curve.hullGroup). svg.ts groups by this.
  hullGroup?: Curve['hullGroup'];
  // Per-feature line-weight multiplier (audit L2). Forwarded verbatim from
  // the source curve; the SVG renderer multiplies it into the stroke width.
  weightMul?: Curve['weightMul'];
};

// Orthographic projection. Rotate around camera yaw (Y) and pitch (X), then drop Z.
// Returns NORMALIZED coordinates in head-height units (caller converts to px via viewport).
export const projectCurve = (curve: Curve, p: FaceParams): Projected => {
  let sumZ = 0;
  const pts: Vec2[] = curve.points.map((pt: Vec3) => {
    const r = rotateYX(pt, p.camera.yaw, p.camera.pitch);
    sumZ += r[2];
    return [r[0], r[1]];
  });
  const out: Projected = {
    kind: curve.kind,
    closed: curve.closed,
    points: pts,
    avgZ: curve.points.length ? sumZ / curve.points.length : 0,
    role: curve.role,
    fill: curve.fill,
    noStroke: curve.noStroke,
    ink: curve.ink,
    weightMul: curve.weightMul,
  };
  // VOLUME path: build the 2D capsule chain from the 3D centreline +
  // radiusProfile. One capsule per consecutive pair of centreline points;
  // capsule end-radii come straight from the (unscaled) per-point radii.
  // Per Lloyd pass 1 §2 stage D.
  if (curve.kind === 'clump-volume' && curve.radiusProfile && pts.length >= 2) {
    const caps: Capsule2D[] = [];
    const radii = curve.radiusProfile;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i] as Vec2;
      const b = pts[i + 1] as Vec2;
      const ra = radii[i] ?? 0;
      const rb = radii[i + 1] ?? 0;
      if (ra <= 0 && rb <= 0) continue;
      caps.push({ a, b, ra, rb });
    }
    out.capsules = caps;
    out.hullGroup = curve.hullGroup;
  }
  return out;
};

// Compute the model-space bounding box of all projected points so we can fit-to-viewport.
export const bounds = (curves: Projected[]): { minX: number; minY: number; maxX: number; maxY: number } => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const c of curves) {
    for (const [x, y] of c.points) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (!isFinite(minX)) return { minX: -0.5, minY: -0.5, maxX: 0.5, maxY: 0.5 };
  return { minX, minY, maxX, maxY };
};
