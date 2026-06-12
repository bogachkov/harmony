// SKULL — head construction, rebuilt from scratch, FORM-FIRST.
//
// The previous spike (head.ts) rotted: its eye-socket subtract was a no-op
// (front pole sat BEHIND the skin, so it carved nothing the skin didn't hide),
// the brow was a forward visor bar, and the nose was a cluster of fighting
// balls. Comments described intent the math never delivered. This is a clean
// build whose rule is: every recess is positioned relative to the ACTUAL
// surface so it provably bites, and every block is checked on the matte render
// before the next is added.
//
// Core stays style-neutral: it builds bone (recessed orbits, a brow that is the
// orbit's upper rim, a neutral nose/ear/jaw). It does NOT draw eyes, lids, or
// any feature "look" — those are the style layer's marks into these anchors.
//
// World: +X subject-left, +Y up, +Z toward camera. Reuses the Loomis landmark
// math from head.ts (construct), which was the one sound part.

import type { Vec3 } from '../src/math/vec3.ts';
import {
  sphere, ellipsoid, cylinder,
  min, smin, smoothSubtract, translate, rotate,
} from '../src/sdf/primitives.ts';
import { construct, DEFAULT_HEAD, type HeadDial } from './head.ts';

export const skull = (p: Vec3, dial: Partial<HeadDial> = {}): number => {
  const d = { ...DEFAULT_HEAD, ...dial };
  const c = construct(d);
  const [rx, ry, rz] = c.craniumRadii;

  // Front Z of the cranium ellipsoid at (x,y) — the true skin position, so
  // recesses can be placed RELATIVE to it and provably bite. This is the
  // anchor the old file lacked (it used the centreline frontZ everywhere).
  const surfZ = (x: number, y: number): number => {
    const k = Math.max(0, 1 - (x / rx) ** 2 - (y / ry) ** 2);
    return rz * Math.sqrt(k);
  };

  // 1. Cranium (brain case) + occiput so the back of the skull reads.
  let head = ellipsoid(p, [0, 0, 0], [rx, ry, rz]);
  const occiput = ellipsoid(p, [0, ry * 0.18, -rz * 0.30], [rx * 0.92, ry * 0.85, rz * 0.85]);
  head = smin(head, occiput, 0.30);

  // 2. Jaw — chin pad + two gonial corners fused into a mandible, then onto the
  //    skull. (Carried from the old build; this part read correctly.)
  const jawHalfW = rx * d.jawWidth;
  const chinZ = surfZ(0, c.chinY) * 0.5 + rz * d.chinProjection;
  const chin = ellipsoid(p, [0, c.chinY + ry * 0.12, chinZ], [jawHalfW * 0.62, ry * 0.30, rz * 0.42]);
  const gonialY = (c.chinY + c.eyeY) / 2;
  const gonialL = ellipsoid(p, [-jawHalfW, gonialY, -rz * 0.10], [rx * 0.20, ry * 0.42, rz * 0.40]);
  const gonialR = ellipsoid(p, [jawHalfW, gonialY, -rz * 0.10], [rx * 0.20, ry * 0.42, rz * 0.40]);
  let jaw = smin(chin, gonialL, 0.16);
  jaw = smin(jaw, gonialR, 0.16);
  head = smin(head, jaw, 0.20);

  // 3. Orbits — REAL recesses. Each socket ellipsoid is centred just BEHIND the
  //    actual skin at the eye, by a fraction of its own depth, so its front pole
  //    pokes well IN FRONT of the skin and carves a true hollow. This is the fix
  //    for the old no-op: position is relative to surfZ(eyeX, eyeY), not the
  //    centreline. The hollow's upper rim becomes the brow — no stuck-on bar.
  const eyeX = c.eyeSpacing;
  const eyeY = c.eyeY + c.eyeSpacing * 0.04;
  const socketR: Vec3 = [c.eyeSpacing * 0.66, c.eyeSpacing * 0.56, rz * 0.36];
  const socketCZ = surfZ(eyeX, eyeY) - socketR[2] * 0.40; // front pole = skin + 0.60*depth
  const socket = (sx: number) => ellipsoid(p, [sx, eyeY, socketCZ], socketR);
  head = smoothSubtract(head, min(socket(-eyeX), socket(eyeX)), 0.05);

  // 3b. Brow ridge — only a SUBTLE fullness on the bone bridging forehead and
  //     orbit rim. Barely proud, wide blend, so it is part of the plane, not a
  //     visor. Sits just above the orbit's upper edge.
  const browY = eyeY + socketR[1] * 0.85;
  const ridge = ellipsoid(
    p, [0, browY, surfZ(0, browY) + rz * 0.02],
    [rx * 0.46, c.eyeSpacing * 0.16, rz * 0.08],
  );
  head = smin(head, ridge, 0.20);

  // 4. Nose — ONE neutral Loomis wedge (dorsum + tip), no ala balls. A
  //    style-neutral anchor: it just marks the nose plane for the style to fill.
  const rootY = c.browY, baseY = c.noseBaseY;
  const dorsum = ellipsoid(
    p, [0, (rootY + baseY) / 2, surfZ(0, (rootY + baseY) / 2) + rz * 0.05],
    [rx * d.noseBridgeWidth * 0.9, (rootY - baseY) / 2 * 1.05, rz * 0.12],
  );
  const tip = sphere(p, [0, baseY + rx * d.noseTipBulge * 0.3, surfZ(0, baseY) + rz * d.noseProjection], rx * d.noseTipBulge);
  const nose = smin(dorsum, tip, 0.05);
  head = smin(head, nose, 0.05);

  // 5. Mouth — a faint groove anchor (style draws the lips). Subtle so it never
  //    reads as a drawn mouth on its own.
  const mouthW = c.eyeSpacing * d.mouthWidth;
  const mouthCut = ellipsoid(p, [0, c.mouthY, surfZ(0, c.mouthY) + rz * 0.02], [mouthW * 0.5, ry * d.mouthThickness, rz * 0.08]);
  head = smoothSubtract(head, mouthCut, 0.02);

  // 6. Ears — flattened C on the side plane, brow-line to nose-base (Loomis),
  //    neutral anchor.
  const earY = (c.browY + c.noseBaseY) / 2;
  const ear = (sx: number) => ellipsoid(
    p, [sx, earY, -rz * 0.12],
    [rx * d.earWidth * 0.5, (c.browY - c.noseBaseY) / 2 * 1.1, rz * 0.26],
  );
  head = smin(head, min(ear(-rx * 0.98), ear(rx * 0.98)), 0.05);

  // 7. Neck — Bridgman cylinder the head balances on, set back and leaning
  //    forward from the nape. (Carried; read correctly.)
  const neckR = rx * d.neckWidth;
  const neckTopY = c.chinY + ry * 0.20;
  const neckBotY = c.chinY - d.neckLength * ry;
  const neckCenterY = (neckTopY + neckBotY) / 2;
  const neckHalf = (neckTopY - neckBotY) / 2;
  const neckZ = -rz * 0.30;
  const pNeck = rotate(translate(p, [0, -neckCenterY, -neckZ]), [1, 0, 0], -0.10);
  const neck = cylinder(pNeck, [0, 1, 0], neckR, neckHalf);
  head = smin(head, neck, 0.18);

  return head;
};
