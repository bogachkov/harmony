// STYLE LAYER — 3D form features (nose, ears).
//
// Per the architecture: features with real volume must be GEOMETRY, not flat
// 2D marks, or they won't foreshorten/occlude when the head pivots. The style
// adds these SDF shapes onto the core skull at its anchor landmarks; the
// renderer's G-buffer then gives their silhouette + crease lines for free,
// correct from every angle. Surface-only marks (eyes, brows, lips, hair strands)
// stay as 2D paint elsewhere.
//
// Anatomy from research/primitives-nose-ears-neck-brows.md:
//   nose  = Loomis 5-plane wedge: dorsum (keel), side planes, base, two alae.
//   ear   = flattened "C": helix rim + concha bowl + lobe ("question mark + comma").

import type { Vec3 } from '../src/math/vec3.ts';
import { sphere, ellipsoid, min, smin, smoothSubtract, rotate } from '../src/sdf/primitives.ts';
import { construct, DEFAULT_HEAD, type HeadDial } from './head.ts';
import { skull } from './skull.ts';

const C = construct(DEFAULT_HEAD);
const [RX, RY, RZ] = C.craniumRadii;
const surfZ = (x: number, y: number) =>
  RZ * Math.sqrt(Math.max(0, 1 - (x / RX) ** 2 - (y / RY) ** 2));

// ---- nose: a wedge sitting on the maxilla, dorsum flowing into one tip bulb ----
const noseSDF = (p: Vec3): number => {
  const rootY = C.eyeY, baseY = C.noseBaseY;      // bridge starts at the eyes, not the brow
  const midY = (rootY + baseY) / 2;
  // dorsum/keel — a ridge from nasal root to tip, projecting forward
  const dorsum = ellipsoid(p, [0, midY, surfZ(0, midY) + RZ * 0.05],
    [RX * 0.09, (rootY - baseY) / 2 * 1.05, RZ * 0.11]);
  // tip + two alae fused into ONE ball of the nose (no lumpy cascade)
  const tipZ = surfZ(0, baseY) + RZ * 0.14;
  const tip = sphere(p, [0, baseY + RX * 0.03, tipZ], RX * 0.085);
  const ala = (sx: number) => sphere(p, [sx, baseY + RX * 0.01, tipZ - RZ * 0.03], RX * 0.07);
  const bulb = smin(tip, smin(ala(-RX * 0.10), ala(RX * 0.10), 0.03), 0.04);
  let nose = smin(dorsum, bulb, 0.04);
  // nostrils — two small carves under the alae
  const nostril = (sx: number) => sphere(p, [sx, baseY - RX * 0.01, tipZ - RZ * 0.05], RX * 0.03);
  nose = smoothSubtract(nose, min(nostril(-RX * 0.085), nostril(RX * 0.085)), 0.015);
  return nose;
};

// ---- ear: flattened C-shell that PROTRUDES past the head silhouette, tilted
// back ~17°, helix rim + concha bowl + lobe. Centred just outside the cranium
// edge so its outer half pokes out (visible head-on) and inner half blends in.
const earSDF = (p: Vec3, sign: number): number => {
  const earY = (C.browY + C.noseBaseY) / 2;
  const earX = sign * RX * 1.0;           // centre at the cranium edge so it protrudes
  const earZ = -RZ * 0.05;                // near the widest part so it bulges the FRONT outline
  const half = (C.browY - C.noseBaseY) / 2 * 1.1;
  // plate: protrudes outward in X, tall in Y, spans front-back in Z (the C)
  const plate = ellipsoid(p, [earX, earY, earZ], [RX * 0.19, half, RZ * 0.22]);
  // concha bowl carved from the outer face -> leaves the helix rim (a modest
  // bite so it does not eat the whole plate)
  const concha = ellipsoid(p, [earX + sign * RX * 0.10, earY + half * 0.05, earZ + RZ * 0.02],
    [RX * 0.09, half * 0.5, RZ * 0.13]);
  let ear = smoothSubtract(plate, concha, 0.03);
  // lobe at the bottom (the comma)
  const lobe = sphere(p, [earX, earY - half * 0.88, earZ], RX * 0.06);
  return smin(ear, lobe, 0.03);
};

// Core skull + the style's 3D form features.
export const styledHead = (p: Vec3, dial: Partial<HeadDial> = {}): number => {
  let h = skull(p, dial);
  h = smin(h, noseSDF(p), 0.04);
  h = smin(h, min(earSDF(p, -1), earSDF(p, 1)), 0.02);
  return h;
};
