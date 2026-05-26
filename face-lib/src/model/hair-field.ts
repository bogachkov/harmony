// Hair-grow vector field on the cranial ellipsoid surface.
//
// Implements the Choe & Ko "wisp model" idea referenced in research/hair.md:
// a 2D vector field on the cranium where each point has a "grow-direction."
// Hair strokes (clumps) are then sampled FROM the field rather than placed by
// hand. The field has:
//   - A SINK at the crown swirl (hair grows AWAY from the crown).
//   - Optional SADDLE behavior at a parting (hair on each side flows away
//     from the parting line, perpendicular to the parting direction).
//   - A gravity bias that tilts strokes downward, scaled by latitude
//     (stronger near the sides, weaker on top).
//
// This is a generic substrate intended to underlie straight/wavy/clumped hair
// in Western-realistic illustration traditions. Coily hair, braided hair, and
// other textures need *additional* primitives (TBD by broader research pass).
//
// Coordinate convention:
//   u = azimuth angle around the cranium's Y axis (radians). 0 = front,
//       +PI/2 = right side, +/-PI = back, -PI/2 = left side.
//   v = elevation angle from the equator (radians). 0 = equator, +PI/2 = top,
//       -PI/2 = bottom (chin-direction; mostly unused for hair).

import type { Vec2, Vec3 } from '../math/vec3.ts';

export type UV = { u: number; v: number };

export type CranialField = {
  // 3D point on the cranial ellipsoid at this UV.
  surfacePoint: (uv: UV) => Vec3;
  // Outward unit normal at this UV (for offsetting strokes off the surface).
  surfaceNormal: (uv: UV) => Vec3;
  // 2D grow-direction in UV-space at this point: positive du moves around
  // the head (azimuth), positive dv moves up. Returned vector is normalized.
  direction: (uv: UV) => Vec2;
  // The crown swirl (sink). Useful for placing strokes near it / clamping
  // around its neighborhood.
  crown: UV;
};

export type FieldSpec = {
  // Crown swirl position. Default: top of the head, slightly toward the back.
  crown?: UV;
  // Parting line. If present, hair splits along this azimuth.
  parting?: {
    u: number;          // azimuth where the parting runs
    strength: number;   // 0 = no split, 1 = full split
  };
  // Gravity bias on the field. 0 = no gravity, 1 = strong downward pull.
  gravity?: number;
};

// Build a cranial field for an ellipsoid with radii (rx, ry, rz).
export const cranialField = (rx: number, ry: number, rz: number, spec: FieldSpec = {}): CranialField => {
  const crown: UV = spec.crown ?? { u: 0, v: 0.95 * Math.PI / 2 };  // very top, very slightly forward
  const gravity = spec.gravity ?? 0.5;
  const parting = spec.parting;

  const surfacePoint = (uv: UV): Vec3 => {
    // Standard ellipsoid parametrization.
    const cv = Math.cos(uv.v);
    return [
      rx * cv * Math.sin(uv.u),
      ry * Math.sin(uv.v),
      rz * cv * Math.cos(uv.u),
    ];
  };

  const surfaceNormal = (uv: UV): Vec3 => {
    // Unnormalized ellipsoid gradient at (u, v) — for unit normals we'd
    // divide by an extra factor, but normalizing the raw direction is
    // sufficient for offsetting strokes.
    const cv = Math.cos(uv.v);
    const nx = cv * Math.sin(uv.u) / rx;
    const ny = Math.sin(uv.v) / ry;
    const nz = cv * Math.cos(uv.u) / rz;
    const len = Math.hypot(nx, ny, nz) || 1;
    return [nx / len, ny / len, nz / len];
  };

  const direction = (uv: UV): Vec2 => {
    // Component 1: away-from-crown. In UV space the radial direction from
    // crown is just (uv - crown), normalized. Hair grows AWAY from the
    // crown, so the field points OUTWARD.
    const du = uv.u - crown.u;
    // Wrap du into (-PI, PI] so we go the short way around.
    const duWrapped = ((du + Math.PI) % (2 * Math.PI)) - Math.PI;
    const dv = uv.v - crown.v;
    const radialLen = Math.hypot(duWrapped, dv) || 1;
    let fu = duWrapped / radialLen;
    let fv = dv / radialLen;

    // Component 2: parting saddle. If a parting is set, project the field
    // away from the parting line in the u direction.
    if (parting) {
      const distToParting = ((uv.u - parting.u + Math.PI) % (2 * Math.PI)) - Math.PI;
      // Push outward (sign of distToParting) with strength scaled by closeness:
      // strong push near the parting, fading with distance.
      const proximity = Math.exp(-Math.pow(distToParting * 3, 2));
      const sign = distToParting >= 0 ? 1 : -1;
      fu += sign * parting.strength * proximity * 1.2;
    }

    // Component 3: gravity bias — downward (negative dv). Strength scales
    // with latitude: zero at the very top (we want hair to flow OUT from
    // the crown), full at the sides and below.
    const latitudeFactor = Math.cos(uv.v);   // 1 at equator, 0 at poles
    fv -= gravity * latitudeFactor;

    const len = Math.hypot(fu, fv) || 1;
    return [fu / len, fv / len];
  };

  return { surfacePoint, surfaceNormal, direction, crown };
};

// Trace a stroke through the field starting at `startUV`, taking `samples`
// steps of total length `length` in UV space. Returns 3D points on the
// cranial surface (with an optional outward offset). If `stopAt` returns
// true for any sampled point, the stroke terminates there (used to clip
// interior hair strokes at the hairline).
export const clumpStroke = (
  field: CranialField,
  startUV: UV,
  length: number,
  samples: number,
  surfaceOffset = 0,
  stopAt?: (p: Vec3) => boolean,
): Vec3[] => {
  const pts: Vec3[] = [];
  let cur: UV = { u: startUV.u, v: startUV.v };
  const dt = length / samples;
  for (let i = 0; i <= samples; i++) {
    const p = field.surfacePoint(cur);
    let pt: Vec3;
    if (surfaceOffset !== 0) {
      const n = field.surfaceNormal(cur);
      pt = [p[0] + n[0] * surfaceOffset, p[1] + n[1] * surfaceOffset, p[2] + n[2] * surfaceOffset];
    } else {
      pt = p;
    }
    if (stopAt && stopAt(pt)) break;
    pts.push(pt);
    const dir = field.direction(cur);
    cur = { u: cur.u + dir[0] * dt, v: cur.v + dir[1] * dt };
  }
  return pts;
};

// Convert a Cartesian point on the ellipsoid back to UV coordinates.
// Useful for placing stroke starts at e.g. the hairline.
export const xyzToUV = (p: Vec3, rx: number, ry: number, rz: number): UV => {
  const sx = p[0] / rx, sy = p[1] / ry, sz = p[2] / rz;
  const v = Math.asin(Math.max(-1, Math.min(1, sy)));
  const u = Math.atan2(sx, sz);
  return { u, v };
};

// Place N stroke seed points evenly distributed across a latitude band
// (e.g. the top of the head). Useful for spawning interior flow strokes.
export const seedsByLatitude = (vMin: number, vMax: number, uMin: number, uMax: number, count: number): UV[] => {
  const seeds: UV[] = [];
  if (count <= 0) return seeds;
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    seeds.push({ u: uMin + (uMax - uMin) * t, v: vMin + (vMax - vMin) * 0.5 });
  }
  return seeds;
};
