// SPIKE — construction-first Loomis head.
//
// The thesis being tested: the program should mirror how an artist constructs
// a head on autopilot. Nothing here is a hand-tuned feature coordinate. We
// build the cranium, DERIVE the construction landmarks (brow line, eye line,
// thirds) from it by Loomis proportion, then FIND each feature on those
// landmarks. `eyeLineY` etc. do not exist as free magic numbers — they are
// computed from the construction.
//
// Contrast with src/sdf/head.ts, where eyeLineY: 0.05, eyeSpacing: 0.13, etc.
// were tuned by eye until the front render looked okay (and so it falls apart
// the moment the head turns). This file has no such constants.
//
// World space: +X subject-left, +Y up, +Z forward (toward camera).

import type { Vec3 } from '../src/math/vec3.ts';
import {
  sphere, ellipsoid, cylinder,
  min, smin, smoothSubtract, translate,
} from '../src/sdf/primitives.ts';

// ---- what an artist actually chooses up front ----
// Only proportion knobs. Everything spatial is derived.
export type HeadDial = {
  /** Cranium half-axes (X half-width, Y half-height, Z half-depth). The ball. */
  craniumRadii: Vec3;
  /** How far the jaw drops below the cranium center, in cranium-half-heights. */
  jawDrop: number;
  /** Jaw width as a fraction of cranium width (bigonial / cranial). */
  jawWidth: number;
  /** Chin forward projection, in cranium-half-depths. */
  chinProjection: number;

  // ---- nose shape (Loomis keel/tip/alae). Sizes only — position is derived. ----
  /** Tip ball radius, in cranium half-widths. Bigger = bulbous. */
  noseTipBulge: number;
  /** Ala (nostril wing) radius, in cranium half-widths. */
  noseAlarWidth: number;
  /** Tip forward projection, in cranium half-depths. Bigger = longer nose. */
  noseProjection: number;
  /** Bridge half-width, in cranium half-widths. Bigger = wider bridge. */
  noseBridgeWidth: number;

  // ---- mouth shape. Width/thickness only — position is derived. ----
  /** Mouth width as a multiple of eye spacing. */
  mouthWidth: number;
  /** Lip-slit thickness, in cranium half-heights. */
  mouthThickness: number;

  // ---- neck (Bridgman: cylinder + SCM V + trapezius). Position derived. ----
  /** Neck cylinder radius, in cranium half-widths. */
  neckWidth: number;
  /** Visible neck length below the jaw, in cranium half-heights. */
  neckLength: number;
};

export const DEFAULT_HEAD: HeadDial = {
  craniumRadii: [0.50, 0.55, 0.58],
  jawDrop: 1.15,        // chin sits ~1.15 cranium-half-heights below center
  jawWidth: 0.62,       // jaw clearly narrower than cranium
  chinProjection: 0.45,
  noseTipBulge: 0.13,
  noseAlarWidth: 0.09,
  noseProjection: 0.14,
  noseBridgeWidth: 0.10,
  mouthWidth: 1.1,
  mouthThickness: 0.018,
  neckWidth: 0.62,
  neckLength: 1.1,
};

// ---- the construction: landmarks DERIVED from the cranium ----
// This is the artist's scaffold. Every feature reads its position from here.
export type Construction = {
  craniumRadii: Vec3;
  craniumCenter: Vec3;
  chinY: number;        // bottom of the head
  browY: number;        // brow line  (Loomis: top third boundary)
  eyeY: number;         // eye line   (halfway down the whole head)
  noseBaseY: number;    // nose base  (lower third boundary)
  mouthY: number;       // between nose base and chin
  eyeSpacing: number;   // half-distance between eye centers ("five eyes wide")
  headHeight: number;
  /** Front-facing Z of the cranium surface at a given Y (the form to attach to). */
  frontZ: (y: number) => number;
};

export const construct = (d: HeadDial): Construction => {
  const [rx, ry, rz] = d.craniumRadii;
  const craniumCenter: Vec3 = [0, 0, 0];

  // The head runs from the top of the cranium ball down to the chin.
  const headTop = ry;
  const chinY = -d.jawDrop * ry;
  const headHeight = headTop - chinY;

  // Loomis: the EYE LINE is the halfway point of the whole head height.
  // This is THE derived landmark — not a tuned constant.
  const eyeY = (headTop + chinY) / 2;

  // Lower thirds: brow → nose-base → chin are (roughly) equal. Brow line sits
  // one eye-height above the eye line; nose base one third down toward chin.
  const lowerThird = (eyeY - chinY) / 3;
  const browY = eyeY + lowerThird * 0.55;   // brow just above the eyes
  const noseBaseY = eyeY - lowerThird;
  const mouthY = noseBaseY - (noseBaseY - chinY) * 0.38;

  // "Five eyes wide": the face is five eye-widths; eyes occupy slots 2 and 4.
  // So eye centers sit at ±1 eye-width from center. Eye width = headWidth / 5.
  const eyeWidth = (rx * 2) / 5;
  const eyeSpacing = eyeWidth; // center-to-center half = one eye-width

  // Front surface of the cranium ellipsoid at height y (for attaching features
  // ONTO the form rather than floating them in front of it).
  const frontZ = (y: number): number => {
    const yn = Math.min(Math.abs((y - craniumCenter[1]) / ry), 1);
    return craniumCenter[2] + rz * Math.sqrt(Math.max(0, 1 - yn * yn));
  };

  return {
    craniumRadii: d.craniumRadii,
    craniumCenter,
    chinY, browY, eyeY, noseBaseY, mouthY,
    eyeSpacing, headHeight, frontZ,
  };
};

// ---- the head SDF, assembled FROM the construction ----
export const spikeHead = (p: Vec3, dial: Partial<HeadDial> = {}): number => {
  const d: HeadDial = { ...DEFAULT_HEAD, ...dial };
  const c = construct(d);
  const [rx, ry, rz] = c.craniumRadii;

  // 1. Cranium ball.
  let head = ellipsoid(p, c.craniumCenter, c.craniumRadii);

  // 2. Jaw — a single tapered mass hung off the ball, chin found at the
  //    derived chinY and pushed forward by chinProjection. One ellipsoid for
  //    the chin pad + two for the gonial corners, smin'd into a mandible.
  const jawHalfW = rx * d.jawWidth;
  const chinZ = rz * d.chinProjection;
  const chin = ellipsoid(p, [0, c.chinY + ry * 0.12, chinZ], [jawHalfW * 0.62, ry * 0.30, rz * 0.42]);
  const gonialY = (c.chinY + c.eyeY) / 2;
  const gonialL = ellipsoid(p, [-jawHalfW, gonialY, -rz * 0.10], [rx * 0.20, ry * 0.42, rz * 0.40]);
  const gonialR = ellipsoid(p, [ jawHalfW, gonialY, -rz * 0.10], [rx * 0.20, ry * 0.42, rz * 0.40]);
  let jaw = smin(chin, gonialL, 0.16);
  jaw = smin(jaw, gonialR, 0.16);
  head = smin(head, jaw, 0.20);

  // 3. Eyes — FOUND on the construction. Socket carved at the eye line,
  //    eyeSpacing out from center, sunk onto the front surface at that height.
  const eyeZ = c.frontZ(c.eyeY) - rz * 0.05;     // recess into the form (shallower → rim inks)
  const socketHalf: Vec3 = [c.eyeSpacing * 0.70, c.eyeSpacing * 0.52, rz * 0.30];
  const socketL = ellipsoid(p, [-c.eyeSpacing, c.eyeY, eyeZ], socketHalf);
  const socketR = ellipsoid(p, [ c.eyeSpacing, c.eyeY, eyeZ], socketHalf);
  head = smoothSubtract(head, min(socketL, socketR), 0.05);

  const ballR = c.eyeSpacing * 0.40;
  const ballZ = c.frontZ(c.eyeY) - ballR * 0.6;
  const eyeballL = sphere(p, [-c.eyeSpacing, c.eyeY, ballZ], ballR);
  const eyeballR = sphere(p, [ c.eyeSpacing, c.eyeY, ballZ], ballR);
  head = min(head, min(eyeballL, eyeballR));

  // 4. Nose — root found on the brow line at center, base at the derived
  //    nose-base landmark. Bridge + tip grow forward off the front surface.
  const rootZ = c.frontZ(c.browY);
  const baseZ = c.frontZ(c.noseBaseY);
  const noseLen = c.browY - c.noseBaseY;
  const bridge = ellipsoid(
    p,
    [0, (c.browY + c.noseBaseY) / 2, (rootZ + baseZ) / 2 + rz * 0.04],
    [rx * d.noseBridgeWidth, noseLen * 0.62, rz * 0.12],
  );
  const tipR = rx * d.noseTipBulge;
  const tipZ = baseZ + rz * d.noseProjection;    // project the tip forward
  const tip = sphere(p, [0, c.noseBaseY + tipR * 0.4, tipZ], tipR);
  // alae give the profile a nostril break instead of a single nub
  const alaR = rx * d.noseAlarWidth;
  const alaX = rx * (d.noseAlarWidth + 0.02);
  const alaL = sphere(p, [-alaX, c.noseBaseY + alaR * 0.3, baseZ + rz * 0.04], alaR);
  const alaR2 = sphere(p, [ alaX, c.noseBaseY + alaR * 0.3, baseZ + rz * 0.04], alaR);
  let nose = smin(bridge, tip, 0.05);
  nose = smin(nose, smin(alaL, alaR2, 0.03), 0.04);
  head = smin(head, nose, 0.04);

  // 5. Mouth — a slit FOUND at the derived mouth line, carved into the form
  //    so a real crease inks. Width derived from eye spacing (mouth ≈ inner
  //    eye-corner span). Curls back at the corners by sitting on the round jaw.
  const mouthW = c.eyeSpacing * d.mouthWidth;
  const mouthZ = c.frontZ(c.mouthY) + rz * 0.02;
  const mouthCut = ellipsoid(p, [0, c.mouthY, mouthZ], [mouthW * 0.5, ry * d.mouthThickness, rz * 0.10]);
  head = smoothSubtract(head, mouthCut, 0.02);

  // 6. Neck — Bridgman cylinder the head sits ON. It rises from below the
  //    frame up THROUGH the jaw line; the wide smin onto the mandible makes
  //    the jaw flow into the neck instead of tapering to a floating point
  //    (the fix for the "fishman chin"). Tilted slightly forward so the
  //    throat sits under the chin, not behind it. SCM/trapezius detail and
  //    the front V are deferred — this is the load-bearing cylinder only.
  const neckR = rx * d.neckWidth;
  const neckTopY = c.chinY + ry * 0.30;          // overlaps up into the jaw
  const neckBotY = c.chinY - d.neckLength * ry;
  const neckCenterY = (neckTopY + neckBotY) / 2;
  const neckHalf = (neckTopY - neckBotY) / 2;
  const neckTilt = rz * 0.12;                     // throat forward of nape
  const pNeck = translate(p, [0, -neckCenterY, -(-neckTilt)]);
  const dNeck = cylinder(pNeck, [0, 1, 0], neckR, neckHalf);
  head = smin(head, dNeck, 0.16);

  return head;
};

export type { Vec3 };
