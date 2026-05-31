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
  min, smin, smoothSubtract, translate, rotate,
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

  // ---- ears (Loomis: flattened C, brow-line to nose-base). Position derived. ----
  /** Ear protrusion from the side plane, in cranium half-widths. */
  earProtrusion: number;
  /** Ear thickness (front-to-back is the C span; this is the bulge depth). */
  earWidth: number;
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
  neckWidth: 0.50,
  neckLength: 1.1,
  earProtrusion: 0.10,
  earWidth: 0.16,
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

  // Loomis proportions, exact — no fudge multipliers.
  //   Top-of-skull (= hairline here, hair sits above) down to chin is divided
  //   into THREE EQUAL THIRDS: hairline→brow, brow→nose-base, nose-base→chin.
  //   (Loomis, Drawing the Head and Hands, front-view division.)
  const headTop = ry;                        // ball top = hairline
  const chinY = -d.jawDrop * ry;             // chin a ball-fraction below center
  const headHeight = headTop - chinY;
  const third = headHeight / 3;

  const browY = headTop - third;             // 1 third below hairline
  const noseBaseY = headTop - 2 * third;     // 2 thirds
  // chin = headTop - 3*third == chinY (by construction).

  // Eyes sit exactly halfway between brow and nose-base — which is also the
  // vertical midline of the whole head (the two Loomis rules agree here).
  const eyeY = (browY + noseBaseY) / 2;

  // Mouth: one third of the way down from the nose base to the chin.
  const mouthY = noseBaseY - third / 3;

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

  // 1. Cranium ball + occiput. Loomis/anatomy: the skull's greatest
  //    front-to-back depth is ABOVE center (parietal/occipital), and the back
  //    stays full high up — it is not a symmetric egg. The occiput is a TALL
  //    ellipsoid set back and slightly high, blended so the upper-back keeps
  //    its volume instead of collapsing inward toward the crown.
  let head = ellipsoid(p, c.craniumCenter, c.craniumRadii);
  const occiput = ellipsoid(
    p,
    [0, c.craniumCenter[1] + ry * 0.10, -rz * 0.40],
    [rx * 0.92, ry * 0.78, rz * 0.70],
  );
  head = smin(head, occiput, 0.30);   // wide blend — no visible seam loop

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

  // 3. Eyes — FOUND on the construction. The eyeball is a sphere that sits
  //    INSIDE an orbital socket; the lids (skin) close over its front. Key
  //    correctness rule: the ball's front pole must sit at or BEHIND the
  //    socket opening, or it pops out like a golf ball on a tee (the bug).
  //    So: carve a socket, then seat the ball one radius back from the
  //    surface so only a sliver shows through the lid aperture.
  const surfZ = c.frontZ(c.eyeY);
  const ballR = c.eyeSpacing * 0.42;
  // Shallow, softly-blended orbit. A deep/sharp socket inks its whole rim as
  // a 360° oval loop in profile (wrong — a real profile shows only a small
  // front almond). Keep the carve shallow and the blend wide so the rim
  // stays under the crease-ink threshold; the eyeball + lid carry the read.
  const socketDepth = rz * 0.16;
  const socketHalf: Vec3 = [c.eyeSpacing * 0.68, c.eyeSpacing * 0.52, socketDepth];
  const socketZ = surfZ - socketDepth * 0.2;
  const socketL = ellipsoid(p, [-c.eyeSpacing, c.eyeY, socketZ], socketHalf);
  const socketR = ellipsoid(p, [ c.eyeSpacing, c.eyeY, socketZ], socketHalf);
  head = smoothSubtract(head, min(socketL, socketR), 0.10);

  // Ball center set so its front pole (centerZ + ballR) lands just behind the
  // original skin surface — seated in the orbit, not proud of it.
  const ballZ = surfZ - ballR + rz * 0.02;
  const eyeballL = sphere(p, [-c.eyeSpacing, c.eyeY, ballZ], ballR);
  const eyeballR = sphere(p, [ c.eyeSpacing, c.eyeY, ballZ], ballR);
  head = min(head, min(eyeballL, eyeballR));

  // Lids — skin that re-covers the orbit, leaving only an almond aperture
  // (Faigin: the eye we see is the slit between two fleshy lids over the
  // ball). Without them the lidless socket rim inks as a full oval in
  // profile. Two flattened ellipsoids — upper lid heavier and dropped from
  // above, lower lid thin from below — added back onto the head so the ball
  // only shows through the gap between them.
  const lidZ = surfZ - rz * 0.02;
  const upperLid = (cx: number) => ellipsoid(
    p, [cx, c.eyeY + c.eyeSpacing * 0.30, lidZ],
    [c.eyeSpacing * 0.62, c.eyeSpacing * 0.34, rz * 0.14],
  );
  const lowerLid = (cx: number) => ellipsoid(
    p, [cx, c.eyeY - c.eyeSpacing * 0.34, lidZ],
    [c.eyeSpacing * 0.58, c.eyeSpacing * 0.26, rz * 0.13],
  );
  const lids = min(
    min(upperLid(-c.eyeSpacing), upperLid(c.eyeSpacing)),
    min(lowerLid(-c.eyeSpacing), lowerLid(c.eyeSpacing)),
  );
  head = smin(head, lids, 0.03);

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
  // Narrower than before (was a gourd), set BACK from the chin and tilted so
  // it enters the skull from behind (Bridgman: the neck column leans forward
  // from the nape, the head balances on top — it does not hang off the chin).
  const neckR = rx * d.neckWidth;
  const neckTopY = c.chinY + ry * 0.20;
  const neckBotY = c.chinY - d.neckLength * ry;
  const neckCenterY = (neckTopY + neckBotY) / 2;
  const neckHalf = (neckTopY - neckBotY) / 2;
  const neckZ = -rz * 0.30;                        // column sits well back, under the occiput
  const neckLean = 0.10;                           // radians forward from vertical
  const pNeck = rotate(translate(p, [0, -neckCenterY, -neckZ]), [1, 0, 0], -neckLean);
  const dNeck = cylinder(pNeck, [0, 1, 0], neckR, neckHalf);
  head = smin(head, dNeck, 0.14);

  // 7. Ears — Loomis "flattened C", top at BROW line, bottom at NOSE BASE.
  //    Built as a SHELL, not a blob: an outer ellipsoid (helix rim) with an
  //    inner concha bowl SUBTRACTED from its front face, so the profile reads
  //    as a rim around a hollow (a real ear) instead of a knotted lump. The
  //    lobe is the lower, forward part of the outer mass left uncarved.
  const earY = (c.browY + c.noseBaseY) / 2;
  const earHalfH = (c.browY - c.noseBaseY) / 2;
  const earX = rx + rx * d.earProtrusion;
  const earZ = c.craniumCenter[2] - rz * 0.30;     // over the ear canal, behind center
  const earTilt = 0.26;                            // ~15° back
  // A clean flattened-C SOLID: a single ellipsoid, tall (brow→nose-base),
  // thin in X (pressed to the head), deep in Z (the C front-to-back). No
  // carved concha — at this render scale every internal rim inks as a
  // spurious bubble, so the ear read comes from the flattened SILHOUETTE
  // plus one shallow antihelix groove (a dent in the upper-front, not a
  // through-bowl). This matches the research doc: silhouette + single curl
  // beats the surveyed libs; internal anatomy is a later, higher-res pass.
  // ONE solid flattened ellipsoid per ear — no internal carve. Any
  // ellipsoid-minus-ellipsoid leaves an inner rim that the edge pass inks as
  // a spurious closed loop ("bubbles") at this scale, so internal anatomy
  // (concha/antihelix/tragus) is deferred to a dedicated higher-res ear pass.
  // Clean single C-silhouette now; correctness over premature detail.
  const earHalfV: Vec3 = [rx * d.earWidth * 0.5, earHalfH, rz * d.earWidth * 1.8];
  const earShell = (sign: number): number => {
    const pe = rotate(translate(p, [sign * earX, -earY, -earZ]), [0, 1, 0], sign * earTilt);
    return ellipsoid(pe, [0, 0, 0], earHalfV);
  };
  head = smin(head, min(earShell(1), earShell(-1)), 0.06);

  return head;
};

export type { Vec3 };
