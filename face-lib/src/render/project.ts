import type { Vec3, Vec2 } from '../math/vec3.ts';
import { rotateYX } from '../math/vec3.ts';
import type { FaceParams } from '../model/params.ts';
import type { Curve } from '../model/scaffold.ts';

export type Projected = {
  kind: Curve['kind'];
  closed: boolean;
  points: Vec2[];
  // Average Z after rotation, used for trivial painter-ordering (back-to-front).
  avgZ: number;
  role?: Curve['role'];
  fill?: Curve['fill'];
  noStroke?: Curve['noStroke'];
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
  return {
    kind: curve.kind,
    closed: curve.closed,
    points: pts,
    avgZ: curve.points.length ? sumZ / curve.points.length : 0,
    role: curve.role,
    fill: curve.fill,
    noStroke: curve.noStroke,
  };
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
