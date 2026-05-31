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

  // ---- cheekbone (malar plane). Forward push only — position derived. ----
  /** Cheekbone forward projection, in cranium half-depths. 0 = flat face. */
  malarProjection: number;

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
  malarProjection: 0.10,
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

  // 3b. The eye — REBUILT minimal + stable. The prior version unioned an
  //     eyeball SPHERE into the head (min), so the sphere's silhouette inked
  //     as a hard circle wherever it neared the surface — blank ovals head-on,
  //     a bulging ball in 3/4 (the amphibian regression). It was also 5
  //     fighting primitives that flipped look whenever anything nearby moved.
  //
  //     New rule: the eye is ONE shallow almond hollow carved into the skin,
  //     with the eyeball a SEPARATE dome that only ever fills that hollow and
  //     NEVER breaches the surrounding skin. Two soft shapes, no hard union
  //     circle. The almond rim + the lid are the only lines that ink.
  const socketY = c.eyeY + c.eyeSpacing * 0.05;

  // (i) Orbital socket — a REAL recessed volume (per the architecture: the
  //     core must hold a true 3D socket so features attach correctly from any
  //     angle; this is bone, not a painted-on mark). Wide subtract blend so
  //     the recess is a smooth bowl whose FRONT opening reads, not a hard 360°
  //     rim that inks as a floating loop in 3/4. The almond shape (wide X,
  //     thin Y) gives the eye its slant; depth gives the under-brow shadow.
  const socketHalf: Vec3 = [c.eyeSpacing * 0.52, c.eyeSpacing * 0.30, rz * 0.16];
  const socket = (cx: number) => ellipsoid(p, [cx, socketY, surfZ - rz * 0.02], socketHalf);
  head = smoothSubtract(head, min(socket(-c.eyeSpacing), socket(c.eyeSpacing)), 0.07);

  // (ii) Eyeball — a real sphere seated DEEP in the socket. Seated so its
  //      front pole sits well behind the surrounding skin so it cannot breach
  //      the (angled) cheek in 3/4. It exists as 3D so a style can later find
  //      the iris position from any angle; here it only fills the hollow.
  const ballR = c.eyeSpacing * 0.44;
  const ballCZ = surfZ - rz * 0.20;                  // deep — front pole behind skin
  const eyeball = (cx: number) => sphere(p, [cx, socketY, ballCZ], ballR);
  head = smin(head, min(eyeball(-c.eyeSpacing), eyeball(c.eyeSpacing)), 0.04);

  // (iii) upper-lid line — a thin crease just under the brow, the single mark
  //       that makes the eye read as a lidded eye not a hole. Carved shallow.
  const lid = (cx: number) => ellipsoid(
    p, [cx, socketY + c.eyeSpacing * 0.22, surfZ + rz * 0.03],
    [c.eyeSpacing * 0.46, c.eyeSpacing * 0.07, rz * 0.08],
  );
  head = smoothSubtract(head, min(lid(-c.eyeSpacing), lid(c.eyeSpacing)), 0.015);

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

  // 4b. Cheekbones (malar plane) — Bridgman: the cheekbone is a forward-
  //     pushing plane at the level of the LOWER eye socket, between the nose
  //     and the ear. Without it the midface is a smooth balloon. A gentle
  //     forward bump on each side, wide and soft (a plane, not a knob), set
  //     just below the eye and out toward the cheek. Wide smin so it adds a
  //     plane break, not a lump.
  const malarY = socketY - ballR * 0.9;            // lower-eye-socket level
  const malarZ = c.frontZ(malarY) + rz * d.malarProjection;
  const malarX = c.eyeSpacing * 1.35;              // out toward the cheek
  const malar = (cx: number) => ellipsoid(
    p, [cx, malarY, malarZ],
    [rx * 0.30, ry * 0.22, rz * 0.20],
  );
  head = smin(head, min(malar(-malarX), malar(malarX)), 0.14);

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
  let dNeck = cylinder(pNeck, [0, 1, 0], neckR, neckHalf);

  // SCM muscles (Bridgman): two cords running from behind the ear (mastoid)
  // forward-and-DOWN to the front-center base (sternal notch), forming the
  // neck's front V. Each is a long thin ellipsoid added to the front of the
  // cylinder; they converge low and center so the V-notch falls out between
  // them. Soft contour line, not a hard ridge.
  const scmTopY = neckTopY - ry * 0.05;
  const scmBotY = neckBotY + neckHalf * 0.6;
  const scmCY = (scmTopY + scmBotY) / 2;
  const scmZ = neckZ + neckR * 0.7;                // front of the cylinder
  const scm = (cx: number) => ellipsoid(
    p, [cx, scmCY, scmZ],
    [neckR * 0.28, (scmTopY - scmBotY) / 2, neckR * 0.5],
  );
  const scmX = neckR * 0.42;
  dNeck = smin(dNeck, min(scm(-scmX), scm(scmX)), 0.10);
  head = smin(head, dNeck, 0.14);

  // 7. Ears — Loomis "flattened C", top at BROW line, bottom at NOSE BASE.
  //    Outer ellipsoid (helix rim) with a SHALLOW, WIDE-BLEND concha dent in
  //    the front face. Earlier sharp concha subtracts inked a hard inner
  //    rim-loop (bubbles); now the interior-contour extractor (grazing-angle
  //    line family) draws the soft bowl as a curve instead — so a gentle dish
  //    reads as the concha without a spurious hard loop. The lower-front mass
  //    left undented is the lobe.
  const earY = (c.browY + c.noseBaseY) / 2;
  const earHalfH = (c.browY - c.noseBaseY) / 2;
  const earX = rx + rx * d.earProtrusion;
  const earZ = c.craniumCenter[2] - rz * 0.30;     // over the ear canal, behind center
  const earTilt = 0.26;                            // ~15° back
  const earHalfV: Vec3 = [rx * d.earWidth * 0.5, earHalfH, rz * d.earWidth * 1.8];
  // concha: shallow bowl in the outer (away-from-head) face, upper-mid, NOT
  // through the shell. Wide subtract blend so the dish is smooth (contour
  // extractor draws it) rather than a hard rim (silhouette/crease draws it).
  const conchaHalf: Vec3 = [rx * d.earWidth * 0.34, earHalfH * 0.50, rz * d.earWidth * 1.0];
  const conchaOff: Vec3 = [rx * d.earWidth * 0.32, earHalfH * 0.12, 0];
  const earShell = (sign: number): number => {
    const pe = rotate(translate(p, [sign * earX, -earY, -earZ]), [0, 1, 0], sign * earTilt);
    const outer = ellipsoid(pe, [0, 0, 0], earHalfV);
    const concha = ellipsoid(pe, conchaOff, conchaHalf);
    return smoothSubtract(outer, concha, 0.06);    // wide blend → soft dish, no hard rim
  };
  head = smin(head, min(earShell(1), earShell(-1)), 0.06);

  return head;
};

export type { Vec3 };
