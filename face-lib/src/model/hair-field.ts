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

// 3D clump-volume types (Lloyd pass 1 §1). A clump is no longer just a
// surface-bound polyline — it carries a per-point radius so its projection
// has area (not zero-width), and its centreline can leave the cranial surface
// (gravity past the chin, radial halo beyond the cranium for coily hair).
//
// ClumpSample = one point along a clump centreline + the radius at that point.
// ClumpTrace  = the centreline (root → tip), one sample per integrator step.
// ClumpSpec   = the inputs to the integrator (rootUV, length, gravity, radial,
//               radius profile, jitter, stopAt).
//
// The integrator turns a ClumpSpec into a ClumpTrace. The TRACE stage of the
// pipeline (Lloyd §2). When clumpMode === 'flat' (gravity=0 && radial=0 &&
// radius0=0) the integrator falls back to the UV-space stepping used by the
// pre-refactor surface-bound clumpStroke — bit-for-bit identical output up to
// the surfaceOffset semantics.
export type ClumpSample = { p: Vec3; r: number };
export type ClumpTrace = ClumpSample[];

export type ClumpSpec = {
  rootUV: UV;                  // scalp anchor (same as today's startUV)
  length: number;              // arc length along the centreline
  samples: number;             // number of integrator steps
  gravity: number;             // 0..1; 0 = follows field, 1 = full vertical fall
  radial: number;              // [-1..+1]; positive = coily halo (outward),
                               //  0 = field-only, negative = inward fall
  radius0: number;             // root radius (world units; 0 in flat mode)
  radius1: number;             // tip radius (taper toward); 0 in flat mode
  jitter?: { amp: number; freq: number; phase: number };
  // Surface offset along the outward normal at the ROOT, applied to every
  // sample. Preserves the existing "lift strokes slightly off the cranium"
  // behaviour in flat mode. Volume mode usually sets this to 0 (the radius
  // takes over visual coverage).
  surfaceOffset?: number;
  // Stop integration when this returns true (used for hairline clipping).
  // Receives the world-space sample point.
  stopAt?: (p: Vec3) => boolean;
};

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

// Trace a clump through the cranial field. NEW SIGNATURE per Lloyd pass 1 §3.
// Returns a ClumpTrace = centreline samples + per-point radius. The integrator
// has TWO branches at the top:
//
//   FLAT  — when gravity=0 && radial=0 && radius0=0: UV-space stepping. Bit-
//           for-bit identical to the pre-refactor clumpStroke. Radius set to
//           0 on every sample (renderer treats as zero-width line as before).
//   VOLUME — when gravity > 0 OR radial != 0 OR radius0 > 0: 3D world-space
//           integration. Step direction = field.direction (in UV) → projected
//           to world tangent, plus gravity·(0,-1,0) plus radial·n̂. Once the
//           centreline leaves the surface (gravity > 0) the field is sampled
//           at the ROOT only for the field direction; subsequent steps blend
//           the cached field-tangent with gravity and radial.
//
// The radius profile interpolates linearly from radius0 (root) to radius1
// (tip) along arc length. Optional sinusoidal jitter perturbs the radius.
export const clumpStroke = (
  field: CranialField,
  spec: ClumpSpec,
): ClumpTrace => {
  const samples = spec.samples;
  const stopAt = spec.stopAt;
  const offset = spec.surfaceOffset ?? 0;

  // FLAT FAST PATH — preserves pre-refactor UV-stepping math exactly.
  // (Also covers the common case where a caller wants the surface-bound
  // polyline behaviour without computing radii.)
  const isFlat = spec.gravity === 0 && spec.radial === 0 && spec.radius0 === 0 && spec.radius1 === 0;
  if (isFlat) {
    const trace: ClumpTrace = [];
    let cur: UV = { u: spec.rootUV.u, v: spec.rootUV.v };
    const dt = spec.length / samples;
    for (let i = 0; i <= samples; i++) {
      const p = field.surfacePoint(cur);
      let pt: Vec3;
      if (offset !== 0) {
        const n = field.surfaceNormal(cur);
        pt = [p[0] + n[0] * offset, p[1] + n[1] * offset, p[2] + n[2] * offset];
      } else {
        pt = p;
      }
      if (stopAt && stopAt(pt)) break;
      trace.push({ p: pt, r: 0 });
      const dir = field.direction(cur);
      cur = { u: cur.u + dir[0] * dt, v: cur.v + dir[1] * dt };
    }
    return trace;
  }

  // VOLUME PATH — 3D world-space integration. The centreline can leave the
  // cranial surface (gravity past the chin) or push beyond it (radial halo).
  // Step direction blends:
  //   • the field tangent at the root (captured once and decayed)
  //   • gravity   (0,-1,0)
  //   • radial    outward unit normal at the root (not recomputed off-surface)
  //
  // We sample the field direction at the root to give the clump its initial
  // bias. Once we leave the surface, the field becomes meaningless; we keep
  // the cached tangent as inertia while gravity / radial dominate. This
  // matches the hair-theorist physics doc and Lloyd §2 stage B.
  const trace: ClumpTrace = [];
  const root = field.surfacePoint(spec.rootUV);
  const rootN = field.surfaceNormal(spec.rootUV);
  const fieldDir2 = field.direction(spec.rootUV);

  // Convert the 2D UV direction at the root into a 3D world-space tangent by
  // a finite-difference on the surface. (du, dv) → surface(root+ε·dir) − root.
  const eps = 0.01;
  const ahead = field.surfacePoint({
    u: spec.rootUV.u + fieldDir2[0] * eps,
    v: spec.rootUV.v + fieldDir2[1] * eps,
  });
  const tangentRaw: Vec3 = [ahead[0] - root[0], ahead[1] - root[1], ahead[2] - root[2]];
  const tLen = Math.hypot(tangentRaw[0], tangentRaw[1], tangentRaw[2]) || 1;
  const tangent: Vec3 = [tangentRaw[0] / tLen, tangentRaw[1] / tLen, tangentRaw[2] / tLen];

  const dt = spec.length / samples;
  // Root position with optional surface offset.
  let cur: Vec3 = offset !== 0
    ? [root[0] + rootN[0] * offset, root[1] + rootN[1] * offset, root[2] + rootN[2] * offset]
    : [root[0], root[1], root[2]];

  // Tangent decay: starts at 1.0 (field-driven), decays to (1-gravity) so
  // gravity dominates further down the strand. radial bias is constant along
  // the strand (an outward push from root normal).
  for (let i = 0; i <= samples; i++) {
    if (stopAt && stopAt(cur)) break;
    // Radius interpolation along arc length, with optional jitter.
    const t = samples === 0 ? 0 : i / samples;
    let r = spec.radius0 + (spec.radius1 - spec.radius0) * t;
    if (spec.jitter && spec.jitter.amp !== 0) {
      const j = spec.jitter;
      r += j.amp * r * Math.sin(j.freq * Math.PI * t + j.phase);
    }
    trace.push({ p: [cur[0], cur[1], cur[2]], r });

    if (i === samples) break;
    // Step direction: blend tangent inertia + gravity + radial.
    // Tangent contribution decays as gravity rises (so longer strokes fall
    // straighter down).
    const tangentWeight = 1 - 0.8 * spec.gravity * t;
    let dx = tangent[0] * tangentWeight + rootN[0] * spec.radial;
    let dy = tangent[1] * tangentWeight - spec.gravity + rootN[1] * spec.radial;
    let dz = tangent[2] * tangentWeight + rootN[2] * spec.radial;
    const dLen = Math.hypot(dx, dy, dz) || 1;
    dx /= dLen; dy /= dLen; dz /= dLen;
    cur = [cur[0] + dx * dt, cur[1] + dy * dt, cur[2] + dz * dt];
  }
  return trace;
};

// One-commit shim to ease the diff. Returns just the centreline as Vec3[].
// Callers that pre-date the ClumpSpec API use this to keep behaviour
// identical while the rest of the codebase migrates. Deletion plan: Lloyd
// pass 1 §3, "delete in the follow-up commit before PR merges."
//
// @deprecated — pass a ClumpSpec to clumpStroke directly.
export const clumpStrokeLegacy = (
  field: CranialField,
  startUV: UV,
  length: number,
  samples: number,
  surfaceOffset = 0,
  stopAt?: (p: Vec3) => boolean,
): Vec3[] => {
  const trace = clumpStroke(field, {
    rootUV: startUV,
    length,
    samples,
    gravity: 0,
    radial: 0,
    radius0: 0,
    radius1: 0,
    surfaceOffset,
    stopAt,
  });
  return trace.map((s) => s.p);
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
