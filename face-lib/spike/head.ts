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

  // ---- brow ridge (Loomis supraorbital shelf). Forward projection only. ----
  /** Brow-ridge forward projection past the brow-line surface, in half-depths. */
  browRidge: number;

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
  browRidge: 0.06,
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

  // 3. Brow ridge + eye-in-hollow — Loomis p.46: "the eye sits in a hollow;
  //    the brow ridge is a shelf that casts a shadow on the upper lid."
  //    Construction ORDER matters: build the bony shelf, THEN recess the eye
  //    under it. The previous version skipped the ridge and made the eye an
  //    additive lid-puff — so the eyeball was the most FORWARD thing on the
  //    face (the frog/amphibian read). Correct: the ridge projects forward
  //    over a hollow; the eye is the most RECESSED thing, in shadow under it.
  const surfZ = c.frontZ(c.eyeY);

  // 3a. Brow ridge — a bar across the brow line projecting forward + down,
  //     a real supraorbital shelf the eye tucks beneath. Bridgman: the
  //     supraorbital margin projects forward of the orbit.
  const browRidgeZ = c.frontZ(c.browY) + rz * d.browRidge;
  const ridge = ellipsoid(
    p, [0, c.browY - c.eyeSpacing * 0.10, browRidgeZ],
    [rx * 0.62, c.eyeSpacing * 0.34, rz * 0.14],
  );
  head = smin(head, ridge, 0.05);

  // 3b. Orbital hollow — a socket recessed INTO the skull beneath the ridge.
  //     Carved, not added. Its opening faces forward-and-slightly-up (toward
  //     the shelf), so the eye lives in shadow under the brow.
  const socketY = c.eyeY + c.eyeSpacing * 0.05;
  const socket = (cx: number) => ellipsoid(
    p, [cx, socketY, surfZ - rz * 0.04],
    [c.eyeSpacing * 0.66, c.eyeSpacing * 0.50, rz * 0.22],
  );
  head = smoothSubtract(head, min(socket(-c.eyeSpacing), socket(c.eyeSpacing)), 0.06);

  // 3c. Eyeball — seated DEEP in the hollow (center pushed well back) so its
  //     front pole sits behind the surrounding skin, never proud of it.
  const ballR = c.eyeSpacing * 0.40;
  const ballZ = surfZ - rz * 0.10 - ballR;
  const ballCZ = ballZ + ballR * 0.85;
  const ball = (cx: number) => sphere(p, [cx, socketY, ballCZ], ballR);
  head = min(head, min(ball(-c.eyeSpacing), ball(c.eyeSpacing)));

  // 3d. Lids — Loomis: "the eye we see is the slit between two fleshy lids
  //     over the ball; the upper lid is heavier." Built as ONE shape, not two
  //     lid-blobs (two blobs ink two rims = a bowtie). Method: add a smooth
  //     fleshy eye-mound covering the ball, then carve a SINGLE almond
  //     aperture through it — one carve = one clean rim = one almond. The
  //     almond is offset slightly up so more upper lid shows below the brow
  //     (heavier upper lid). The ball already sits behind, filling the gap.
  const moundZ = ballCZ + ballR * 0.45;
  const mound = (cx: number) => ellipsoid(
    p, [cx, socketY, moundZ],
    [c.eyeSpacing * 0.56, ballR * 0.95, rz * 0.11],
  );
  head = smin(head, min(mound(-c.eyeSpacing), mound(c.eyeSpacing)), 0.03);
  // almond aperture: wide in X, thin in Y, offset up so upper lid is heavier
  const aperture = (cx: number) => ellipsoid(
    p, [cx, socketY + ballR * 0.10, moundZ + rz * 0.05],
    [c.eyeSpacing * 0.46, ballR * 0.40, rz * 0.12],
  );
  head = smoothSubtract(head, min(aperture(-c.eyeSpacing), aperture(c.eyeSpacing)), 0.015);

  // 4. Nose — Loomis 5-plane wedge. Root at the brow (nasal root) between the
  //    eyes; the KEEL (bridge ridge) runs root->tip and is the line that
  //    reads as "nose". Previous version used wide blends (0.05) that melted
  //    the keel into a soft lump. Fix: a NARROW keel held with TIGHT blends so
  //    the bridge/side-plane break survives as a contour line, tip as a clear
  //    ball, alae as distinct nostril wings.
  const rootZ = c.frontZ(c.browY);
  const baseZ = c.frontZ(c.noseBaseY);
  const noseLen = c.browY - c.noseBaseY;
  // keel: tall and NARROW (a ridge, not a slab), projecting gently forward
  const keel = ellipsoid(
    p,
    [0, (c.browY + c.noseBaseY) / 2, (rootZ + baseZ) / 2 + rz * 0.05],
    [rx * d.noseBridgeWidth * 0.7, noseLen * 0.60, rz * 0.13],
  );
  const tipR = rx * d.noseTipBulge;
  const tipZ = baseZ + rz * d.noseProjection;
  const tip = sphere(p, [0, c.noseBaseY + tipR * 0.4, tipZ], tipR);
  const alaR = rx * d.noseAlarWidth;
  const alaX = rx * (d.noseAlarWidth + 0.02);
  const alaL = sphere(p, [-alaX, c.noseBaseY + alaR * 0.3, baseZ + rz * 0.04], alaR);
  const alaR2 = sphere(p, [ alaX, c.noseBaseY + alaR * 0.3, baseZ + rz * 0.04], alaR);
  // tight blends keep the plane breaks; alae a touch looser so they fuse to tip
  let nose = smin(keel, tip, 0.03);
  nose = smin(nose, smin(alaL, alaR2, 0.025), 0.03);
  head = smin(head, nose, 0.03);

  // 5. Mouth — Loomis p.52: "lips wrap a cylinder; the corners turn back into
  //    the cheek." The root it rides is the curved front of the lower jaw.
  //    So the slit is NOT a flat cut at one Z — it is BENT around that curve:
  //    at the center the cut sits at the face front, and toward the corners
  //    it pulls BACK in Z (following the jaw cylinder). Implemented by
  //    pre-bending the sample point's Z as a function of x before evaluating
  //    the slit, so the carved groove arcs back at the corners even head-on.
  const mouthW = c.eyeSpacing * d.mouthWidth;
  const mouthHalf = mouthW * 0.5;
  const mouthZ = c.frontZ(c.mouthY) + rz * 0.02;
  const cornerPull = rz * 0.16;                    // how far corners wrap back
  const xn = Math.min(Math.abs(p[0]) / mouthHalf, 1.4);
  const pBent: Vec3 = [p[0], p[1], p[2] + xn * xn * cornerPull];
  const mouthCut = ellipsoid(pBent, [0, c.mouthY, mouthZ], [mouthHalf, ry * d.mouthThickness, rz * 0.10]);
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
