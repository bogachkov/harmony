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

// ---- eyeball / lid mound: fills the core's deep orbit so the style's skin
// covers it as a normal eye area instead of a sunken wraith hollow. The drawn
// eye (iris, lids) then sits on this mound. Front pole ~ at the skin (gentle
// convex lid), not a bulging frog-eye.
const eyeballSDF = (p: Vec3, sign: number): number => {
  const ex = sign * C.eyeSpacing;
  const ey = C.eyeY + C.eyeSpacing * 0.04;
  const ez = surfZ(C.eyeSpacing, ey);
  const r = C.eyeSpacing * 0.64;
  return sphere(p, [ex, ey, ez - r * 0.88], r);   // front pole ~ ez + 0.12r
};

// ---- hair as a 3D "hat" shell: an inflated cap over the scalp, its front
// carved to a hairline, with clump lumps so the silhouette is broken (a smooth
// offset reads as a helmet). Rendered through the same G-buffer as the head, so
// the hair volume foreshortens/occludes correctly. Strand strokes go on top.
const CAP_R: Vec3 = [RX * 1.16, RY * 1.20, RZ * 1.30];
const CAP_C: Vec3 = [0, RY * 0.10, -RZ * 0.14];
const HAIR_CLUMPS: number[][] = (() => {
  const out: number[][] = [];
  const N = 22;
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N;
    const theta = Math.acos(1 - 1.55 * u);          // from the crown down
    const phi = i * 2.399963;                        // golden-angle spread
    const cx = CAP_C[0] + Math.sin(theta) * Math.cos(phi) * CAP_R[0] * 0.96;
    const cy = CAP_C[1] + Math.cos(theta) * CAP_R[1] * 0.96;
    const cz = CAP_C[2] + Math.sin(theta) * Math.sin(phi) * CAP_R[2] * 0.96;
    if (cz > RZ * 0.28 && cy < 0.14) continue;        // skip the face region
    out.push([cx, cy, cz, RX * (0.12 + 0.06 * ((i * 0.618) % 1))]);
  }
  return out;
})();

// Hairline as a tilted plane: hair lives BEHIND/ABOVE it, face in front. Normal
// points forward-and-down; distance set so it passes through the forehead
// hairline (~y 0.22, front of the skull).
const NHAT: Vec3 = [0, -0.371, 0.928];
const DHAIR = 0.36;

// Exposed so the ink pass can place flow strokes on the hair surface.
export const HAIR_CAP_C = CAP_C;
export const HAIR_CAP_R = CAP_R;
// Is world point P on the hair side of the hairline (vs the face)?
export const onHairSide = (p: Vec3): boolean =>
  p[0] * NHAT[0] + p[1] * NHAT[1] + p[2] * NHAT[2] < DHAIR;
export const hairShellSDF = (p: Vec3): number => {
  // Clean hair MASS (volume + silhouette). Texture/locks come from flow strokes
  // in the ink pass, not from all-over 3D bumps (those read as measles).
  let hair = ellipsoid(p, CAP_C, CAP_R);
  // carve everything in front of / below the hairline plane
  const faceHalf = -(p[0] * NHAT[0] + p[1] * NHAT[1] + p[2] * NHAT[2] - DHAIR);
  hair = smoothSubtract(hair, faceHalf, 0.05);
  // keep the ears clear: the big cap otherwise drapes over them and the ear
  // pokes through as a skin blob. Carve a ball around each ear (and just below),
  // leaving hair above and behind.
  const eY = (C.browY + C.noseBaseY) / 2;
  const earClear = (sx: number) => sphere(p, [sx * RX * 0.95, eY - 0.05, -RZ * 0.02], 0.25);
  hair = smoothSubtract(hair, min(earClear(-1), earClear(1)), 0.04);
  return hair;
};

// Core skull + the style's 3D form features.
export const styledHead = (p: Vec3, dial: Partial<HeadDial> = {}): number => {
  let h = skull(p, dial);
  h = smin(h, min(eyeballSDF(p, -1), eyeballSDF(p, 1)), 0.06); // fill the sockets first
  h = smin(h, noseSDF(p), 0.04);
  h = smin(h, min(earSDF(p, -1), earSDF(p, 1)), 0.02);
  return h;
};
