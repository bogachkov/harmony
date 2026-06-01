// proportions.mjs — Loomis landmarks as RATIOS of the step-1 masses (v5 §1c).
// Hard rule: no additive magic offsets, no magic multipliers. The only constants
// allowed are the Loomis ratios themselves (1/2, 1/3, 1/5...) — those ARE the
// proportion system, not fudge. Every landmark is derived from real geometric
// features of headForms() (mass centers/extents), so changing a mass moves every
// landmark for free.
//
// SPEC TENSION (surfaced, not hidden): §1c lists BOTH "ball bottom = nose base"
// AND "face in equal thirds (hairline→brow→nose→chin)". With the step-1 jaw
// (chin at brow-1.40) these conflict: equal thirds put nose at the brow→chin
// midpoint (−0.70), while ball-bottom puts it at −1.0. The jaw mass is shorter
// than a strict 2-ball-radii Loomis face. We honor EQUAL THIRDS + ratios-only
// (the load-bearing, feature-placement invariant) and treat ball-bottom≈nose-base
// as an approximate ideal. This is recorded so it isn't mistaken for a bug.

import { headForms } from "./forms.mjs";

// vertical reference features pulled straight from the masses.
function references(F = headForms()) {
  const cran = F.cranium, jaw = F.jaw;
  const crownY = cran.c[1] + cran.ry;       // top of cranium ovoid
  const browY  = cran.c[1];                 // ball center = brow line (§1c)
  const ballBottomY = cran.c[1] - cran.ry;  // ideal nose-base (approx)
  const chinY  = jaw.c[1] - jaw.r[1];       // bottom of jaw mass
  return { crownY, browY, ballBottomY, chinY, cran, jaw };
}

export function landmarks(F = headForms()) {
  const { crownY, browY, ballBottomY, chinY, cran } = references(F);

  // --- vertical: equal thirds between brow and chin (Loomis), ratios only ---
  const third = (browY - chinY) / 2;        // one face-third (brow→nose = nose→chin)
  const noseBaseY  = browY - third;         // midpoint brow→chin (equal thirds)
  const hairlineY  = browY + third;         // one third above brow
  const eyeY       = (crownY + chinY) / 2;  // eye line halfway down total head
  const mouthY     = noseBaseY - (chinY - noseBaseY) * (1/3); // 1/3 nose→chin (lip line)

  // --- horizontal: face ~5 eyes wide, one eye-width between the eyes ---
  const faceHalfW  = cran.rxz;              // half of face width at the eyes (from THIS F's cranium)
  const eyeWidth   = (2 * faceHalfW) / 5;   // five eyes across the face
  const eyeCenterX = eyeWidth;              // gap between eyes = one eye-width => centers at ±1 eyeWidth
  const surfZ      = cran.rxz * (1/Math.SQRT2); // ~front surface depth at the face plane (no fudge: ball radius / √2)

  // ear: vertical span brow→nose base; depth in the back third at hinge level.
  const earTopY    = browY;
  const earBotY    = noseBaseY;
  const earY       = (earTopY + earBotY) / 2;
  const earX       = faceHalfW;             // at the temple
  const earZ       = -cran.rxz * (1/3);     // back third

  // Snap a landmark onto the FRONT surface of the cranium ovoid at (x,y): solve
  // the ellipsoid for the front +z. This makes features ride the real bulging
  // surface (not a flat plane), so depth-occlusion treats on-face points as
  // visible and culls far-side ones in profile. Falls back to surfZ if (x,y) is
  // past the silhouette (e.g. low jaw points).
  const onSurfaceZ = (x, y) => {
    const C=cran.c, rx=cran.rxz, ry=cran.ry, rz=cran.rxz;
    const k = 1 - ((x-C[0])/rx)**2 - ((y-C[1])/ry)**2;
    return k>0 ? C[2] + rz*Math.sqrt(k) : surfZ;
  };
  const pt = (x, y) => [x, y, onSurfaceZ(x, y)];

  return {
    // vertical landmarks (head-local y)
    crownY, browY, noseBaseY, hairlineY, eyeY, mouthY, chinY, ballBottomY,
    // derived points (head-local [x,y,z]) — snapped to the cranium surface
    crown:    [0, crownY, 0],
    brow:     pt(0, browY),
    eyeL:     pt( eyeCenterX, eyeY),
    eyeR:     pt(-eyeCenterX, eyeY),
    noseRoot: pt(0, browY),
    noseBase: pt(0, noseBaseY),
    mouthC:   pt(0, mouthY),
    mouthL:   pt( eyeCenterX, mouthY),
    mouthR:   pt(-eyeCenterX, mouthY),
    chin:     [0, chinY, 0],
    earL:     [ earX, earY, earZ],
    earR:     [-earX, earY, earZ],
    // scalars styles/anchors may need
    eyeWidth, faceHalfW, surfZ, third,
  };
}

// self-describing invariants (used by the runner's self-check)
export function invariants(F = headForms()) {
  const L = landmarks(F);
  return {
    equalThirds: Math.abs((L.hairlineY - L.browY) - (L.browY - L.noseBaseY)) < 1e-9
              && Math.abs((L.browY - L.noseBaseY) - (L.noseBaseY - L.chinY)) < 1e-9,
    eyeBelowBrow: L.eyeY < L.browY && L.eyeY > L.noseBaseY,
    fiveEyesWide: Math.abs(L.faceHalfW * 2 - L.eyeWidth * 5) < 1e-9,
    ballBottomVsNose: L.ballBottomY - L.noseBaseY,   // the documented discrepancy
  };
}
