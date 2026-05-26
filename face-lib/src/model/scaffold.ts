import type { FaceParams } from './params.ts';
import type { Vec3 } from '../math/vec3.ts';
import { ellipsoidPoint } from '../math/vec3.ts';

// A Curve is a 3D polyline. The renderer projects each point and strokes them as one path.
// `role` lets the renderer identify special curves (silhouette, hair) for fills.
export type Curve = {
  kind: 'construction' | 'feature';
  closed: boolean;
  points: Vec3[];
  role?: 'silhouette' | 'hair-top';
  fill?: string | null;
};

export type Scaffold = {
  silhouette: Curve;
  centerline: Curve;
  eyeline: Curve;
  browline: Curve;
  mouthline: Curve;
  sidePlanes: Curve[];
  features: Curve[];
};

const TAU = Math.PI * 2;

// ---- low-level curve helpers ----

const ellipseArcXY = (
  rx: number, ry: number, start: number, end: number, samples: number,
  zOf: (theta: number) => number,
): Vec3[] => {
  const pts: Vec3[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = start + (end - start) * (i / samples);
    pts.push([rx * Math.cos(t), ry * Math.sin(t), zOf(t)]);
  }
  return pts;
};

const cubicBezier = (a: Vec3, c1: Vec3, c2: Vec3, b: Vec3, samples: number, startAt = 1): Vec3[] => {
  const pts: Vec3[] = [];
  for (let i = startAt; i <= samples; i++) {
    const t = i / samples;
    const mt = 1 - t;
    const x = mt * mt * mt * a[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t * t * t * b[0];
    const y = mt * mt * mt * a[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t * t * t * b[1];
    const z = mt * mt * mt * a[2] + 3 * mt * mt * t * c1[2] + 3 * mt * t * t * c2[2] + t * t * t * b[2];
    pts.push([x, y, z]);
  }
  return pts;
};

// Jaw curve from cheekL → chin-pad-left → chin-pad-right → cheekR.
// chinPad makes the bottom of the chin a short flat segment instead of a sharp V.
// sharpness=0 → wide flat chin (rounded), sharpness=1 → nearly a point.
const jawCurve = (cheekL: Vec3, cheekR: Vec3, chinY: number, chinZ: number, sharpness: number, samples: number): Vec3[] => {
  const out: Vec3[] = [];
  const cheekW = Math.abs(cheekL[0]); // assumed symmetric
  // Pad width: at sharpness=0 the pad is ~35% of cheek width; at sharpness=1 it's ~3%.
  const padHalf = cheekW * (0.04 + 0.30 * (1 - sharpness));
  const chinL: Vec3 = [-padHalf, chinY, chinZ];
  const chinR: Vec3 = [padHalf, chinY, chinZ];

  out.push(cheekL);

  // Left side: cheekL → chinL with smooth tangent (curve drops mostly vertically near cheek, then turns in).
  const cL_c1: Vec3 = [cheekL[0] * 0.95, cheekL[1] - (cheekL[1] - chinY) * 0.55, cheekL[2] * 0.7 + chinZ * 0.3];
  const cL_c2: Vec3 = [chinL[0] - padHalf * 0.6, chinY + (cheekL[1] - chinY) * 0.05, chinZ];
  out.push(...cubicBezier(cheekL, cL_c1, cL_c2, chinL, samples));

  // Chin pad bottom: very slight curve (basically flat with a tiny rounding) from chinL to chinR.
  const padSamples = Math.max(2, Math.floor(samples * 0.3));
  for (let i = 1; i <= padSamples; i++) {
    const t = i / padSamples;
    const x = -padHalf + 2 * padHalf * t;
    // Subtle downward bulge at the center of the pad
    const dy = -padHalf * 0.10 * Math.sin(Math.PI * t);
    out.push([x, chinY + dy, chinZ]);
  }

  // Right side: chinR → cheekR (mirror of left).
  const cR_c1: Vec3 = [chinR[0] + padHalf * 0.6, chinY + (cheekR[1] - chinY) * 0.05, chinZ];
  const cR_c2: Vec3 = [cheekR[0] * 0.95, cheekR[1] - (cheekR[1] - chinY) * 0.55, cheekR[2] * 0.7 + chinZ * 0.3];
  out.push(...cubicBezier(chinR, cR_c1, cR_c2, cheekR, samples));

  return out;
};

// ---- features ----

const buildEyeDots = (anchor: Vec3, dotR: number, openness: number, surfaceZ: number): Curve[] => {
  // Tintin-style eye: a single filled pupil dot, no eye-shape outline. Since there's no
  // eyelid to widen, surprise/fear is expressed by SCALING the dot — bigger dot reads as
  // "wider eyes" in the Hergé visual language. Closed/squinted (openness < 0.3) hides the dot.
  if (openness < 0.3) return [];
  // openness=1 → base radius; >1 grows the dot (caps at ~1.8x); <1 shrinks it for squinting.
  const scale = openness < 1 ? 0.6 + 0.4 * openness : Math.min(1.8, 1 + (openness - 1) * 1.5);
  const r = dotR * scale;
  const pupil: Vec3[] = [];
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * TAU;
    pupil.push([anchor[0] + Math.cos(a) * r, anchor[1] + Math.sin(a) * r, surfaceZ + 0.012]);
  }
  return [{ kind: 'feature', closed: true, points: pupil, fill: '#1a1a1a' }];
};

const buildEye = (anchor: Vec3, halfWidth: number, openness: number, tilt: number, surfaceZ: number): Curve[] => {
  const samples = 18;
  const upper: Vec3[] = [];
  const lower: Vec3[] = [];
  const cos = Math.cos(tilt), sin = Math.sin(tilt);
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = -halfWidth + 2 * halfWidth * t;
    // Almond shape with a tighter inner corner: upper lid arches higher near the inner-middle.
    const profile = Math.sin(Math.PI * t);
    const yUp = openness * halfWidth * 0.55 * profile;
    const yDn = -openness * halfWidth * 0.30 * profile;
    const upX = anchor[0] + (x * cos - yUp * sin);
    const upY = anchor[1] + (x * sin + yUp * cos);
    const dnX = anchor[0] + (x * cos - yDn * sin);
    const dnY = anchor[1] + (x * sin + yDn * cos);
    upper.push([upX, upY, surfaceZ + 0.005]);
    lower.push([dnX, dnY, surfaceZ + 0.003]);
  }
  const curves: Curve[] = [
    { kind: 'feature', closed: false, points: upper },
    { kind: 'feature', closed: false, points: lower },
  ];
  if (openness > 0.25) {
    // Just a pupil dot (filled small circle) — no separate iris ring. Avoids the "double-eye" stare.
    const pupilR = halfWidth * 0.16;
    const pupil: Vec3[] = [];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * TAU;
      pupil.push([anchor[0] + Math.cos(a) * pupilR, anchor[1] + Math.sin(a) * pupilR * Math.min(1, openness), surfaceZ + 0.012]);
    }
    curves.push({ kind: 'feature', closed: true, points: pupil, fill: '#1a1a1a' });
  }
  return curves;
};

const buildBrow = (
  innerAnchor: Vec3, length: number, innerOffsetY: number, outerOffsetY: number,
  arch: number, thickness: number, surfaceZ: number, isLeft: boolean,
): Curve[] => {
  const samples = 14;
  const dir = isLeft ? -1 : 1;
  const points = (yShift: number): Vec3[] => {
    const pts: Vec3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = innerAnchor[0] + dir * length * t;
      const baseY = innerAnchor[1] + (innerOffsetY * (1 - t) + outerOffsetY * t);
      const archY = arch * length * 0.16 * Math.sin(Math.PI * t);
      pts.push([x, baseY + archY + yShift, surfaceZ]);
    }
    return pts;
  };
  // Two slightly-offset parallel strokes give brows visible thickness in line art.
  return [
    { kind: 'feature', closed: false, points: points(0) },
    { kind: 'feature', closed: false, points: points(-thickness * 4) },
  ];
};

const buildNose = (
  bridgeTop: Vec3, length: number, width: number, surfaceZ: number,
  bridgeVisible: boolean, style: 'detailed' | 'minimal' | 'button', showNostrils: boolean,
): Curve[] => {
  const curves: Curve[] = [];
  const tipY = bridgeTop[1] - length;
  const tipZ = surfaceZ + 0.05;
  const half = width / 2;
  const cx0 = bridgeTop[0];

  // 'button' style: just a tiny upturned curve at the tip — pure Tintin/Hergé. No bridge, no nostrils.
  if (style === 'button') {
    const samples = 10;
    const buttonPts: Vec3[] = [];
    const buttonHalf = Math.max(width * 0.18, 0.012);
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = cx0 - buttonHalf + buttonHalf * 2 * t;
      // Shallow curve open upward — like a small smile shape at the nose tip.
      const y = tipY - Math.sin(Math.PI * t) * buttonHalf * 0.55;
      buttonPts.push([x, y, tipZ]);
    }
    curves.push({ kind: 'feature', closed: false, points: buttonPts });
    return curves;
  }

  // 'minimal' and 'detailed' share the J-hook + (optional) bridge + (optional) nostrils.
  // Bridge: short stroke on the shadow side (left by convention). Longer when bridgeVisible.
  // Skipped entirely for 'minimal' unless bridgeVisible is explicitly true.
  if (style === 'detailed' || bridgeVisible) {
    const bridgeXOffset = -half * 0.55;
    const bridgeStartY = bridgeVisible ? bridgeTop[1] - length * 0.18 : tipY + length * 0.32;
    const bridgeEndY = tipY + length * 0.06;
    curves.push({
      kind: 'feature', closed: false,
      points: [
        [cx0 + bridgeXOffset, bridgeStartY, surfaceZ + 0.02],
        [cx0 + bridgeXOffset * 0.85, bridgeEndY, tipZ - 0.01],
      ],
    });
  }

  // Tip hook: a single "J"-shaped underside curve. Starts on the shadow-side, dips gently under
  // the tip, then lifts at the right end to suggest the opposite nostril wing without closing
  // into a U-shape.
  const tipSamples = 16;
  const hook: Vec3[] = [];
  for (let i = 0; i <= tipSamples; i++) {
    const t = i / tipSamples;
    const x = cx0 + (-half * 0.55 + width * 0.55 * t);
    // Shallow concave underside, with a small lift on the right end only
    const baseDip = width * 0.10 * Math.sin(Math.PI * t);   // dips DOWN (negative direction handled below)
    const rightLift = Math.pow(Math.max(0, t - 0.7) / 0.3, 1.5) * width * 0.08;
    hook.push([x, tipY - baseDip + rightLift, tipZ]);
  }
  curves.push({ kind: 'feature', closed: false, points: hook });

  if (showNostrils) {
    const nostrilY = tipY - width * 0.05;
    const nostrilHalfX = half * 0.32;
    const dashLen = width * 0.11;
    curves.push({
      kind: 'feature', closed: false, points: [
        [cx0 - nostrilHalfX - dashLen * 0.4, nostrilY + dashLen * 0.25, tipZ],
        [cx0 - nostrilHalfX + dashLen * 0.4, nostrilY - dashLen * 0.25, tipZ],
      ],
    });
    curves.push({
      kind: 'feature', closed: false, points: [
        [cx0 + nostrilHalfX - dashLen * 0.4, nostrilY - dashLen * 0.25, tipZ],
        [cx0 + nostrilHalfX + dashLen * 0.4, nostrilY + dashLen * 0.25, tipZ],
      ],
    });
  }

  return curves;
};

const buildMouth = (
  center: Vec3, width: number, openness: number, cornerLift: number,
  upperCurve: number, lipFullness: number, cornerMarks: boolean, surfaceZ: number,
): Curve[] => {
  const samples = 24;
  const half = width / 2;
  const curves: Curve[] = [];

  // Main mouth-seam line. Even when closed it should have a cupid's bow + slight smile/frown.
  const seam: Vec3[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = -half + width * t;
    // Corner weight: 0 at center, 1 at corners (smooth easing)
    const cw = Math.pow(Math.abs(t - 0.5) * 2, 1.6);
    const cornerY = cornerLift * cw;
    // Cupid's-bow shape: two small dips on either side of center, slight central peak between them.
    const bowPhase = (t - 0.5) * 6; // ~one full wavelength across the central third
    const bow = Math.abs(t - 0.5) < 0.18
      ? -Math.cos(bowPhase) * width * 0.018 - width * 0.012
      : 0;
    const userBend = -upperCurve * width * 0.04 * Math.sin(Math.PI * t);
    const yOpen = openness * width * 0.18 * Math.sin(Math.PI * t);
    seam.push([center[0] + x, center[1] + cornerY + bow + userBend + yOpen, surfaceZ + 0.005]);
  }
  curves.push({ kind: 'feature', closed: false, points: seam });

  // Lower lip line — a faint parallel curve below the seam, only when lips are full enough.
  if (lipFullness > 0.1) {
    const lower: Vec3[] = [];
    const drop = width * (0.05 + 0.15 * lipFullness);
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = -half * 0.85 + width * 0.85 * t;
      // Hangs lower in the middle, lifts to meet corners
      const dip = -drop * Math.sin(Math.PI * t);
      const cornerY = cornerLift * Math.pow(Math.abs(t - 0.5) * 2, 1.6);
      lower.push([center[0] + x, center[1] + dip + cornerY - openness * width * 0.22 * Math.sin(Math.PI * t), surfaceZ + 0.003]);
    }
    curves.push({ kind: 'feature', closed: false, points: lower });
  }

  // Upper lip top line (the bow's upper edge) when lips are full enough.
  if (lipFullness > 0.2) {
    const upperTop: Vec3[] = [];
    const lift = width * (0.04 + 0.10 * lipFullness);
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = -half * 0.78 + width * 0.78 * t;
      // Has a central indent (cupid's bow) and small peaks either side.
      const peaks = Math.abs(t - 0.5) < 0.18
        ? Math.cos((t - 0.5) * 12) * width * 0.022
        : 0;
      const arc = lift * Math.sin(Math.PI * t);
      const cornerY = cornerLift * Math.pow(Math.abs(t - 0.5) * 2, 1.6);
      upperTop.push([center[0] + x, center[1] + arc + peaks + cornerY, surfaceZ + 0.004]);
    }
    curves.push({ kind: 'feature', closed: false, points: upperTop });
  }

  // Corner marks: small tick angled toward the cheek.
  if (cornerMarks) {
    const tickLen = width * 0.05;
    const cornerYL = cornerLift;
    const cornerYR = cornerLift;
    curves.push({
      kind: 'feature', closed: false, points: [
        [center[0] - half, center[1] + cornerYL, surfaceZ + 0.004],
        [center[0] - half - tickLen, center[1] + cornerYL + tickLen * 0.3, surfaceZ + 0.004],
      ],
    });
    curves.push({
      kind: 'feature', closed: false, points: [
        [center[0] + half, center[1] + cornerYR, surfaceZ + 0.004],
        [center[0] + half + tickLen, center[1] + cornerYR + tickLen * 0.3, surfaceZ + 0.004],
      ],
    });
  }

  return curves;
};

const buildEar = (attachX: number, attachY: number, height: number, protrusion: number, surfaceZ: number, isLeft: boolean): Curve[] => {
  // Ear outline: a vertical "C" attached to the side of the head.
  // attachX is the point along the head's side where the ear's INNER edge joins. The outer
  // curve bulges away from the head by `protrusion`; the back of the ear curves slightly inward
  // at top and bottom so it tucks into the cranium silhouette rather than floating.
  const dir = isLeft ? -1 : 1;
  // Top and bottom slightly inward (back toward the head) so the ear "tucks" into the silhouette.
  const tuck = protrusion * 0.25;
  const top: Vec3 = [attachX - dir * tuck, attachY + height / 2, surfaceZ];
  const bottom: Vec3 = [attachX - dir * tuck * 0.6, attachY - height / 2, surfaceZ];
  const outerMid: Vec3 = [attachX + dir * protrusion, attachY + height * 0.05, surfaceZ];

  const samples = 14;
  const outer: Vec3[] = [];
  const c1Top: Vec3 = [attachX + dir * protrusion * 0.5, attachY + height * 0.42, surfaceZ];
  const c2Top: Vec3 = [attachX + dir * protrusion * 1.0, attachY + height * 0.22, surfaceZ];
  outer.push(top);
  outer.push(...cubicBezier(top, c1Top, c2Top, outerMid, samples / 2));
  const c1Bot: Vec3 = [attachX + dir * protrusion * 1.0, attachY - height * 0.18, surfaceZ];
  const c2Bot: Vec3 = [attachX + dir * protrusion * 0.45, attachY - height * 0.40, surfaceZ];
  outer.push(...cubicBezier(outerMid, c1Bot, c2Bot, bottom, samples / 2));

  // Inner detail: a soft curl suggesting the antihelix — sits inside the ear, parallel to outer.
  const innerCurve: Vec3[] = [];
  const innerSamples = 10;
  for (let i = 0; i <= innerSamples; i++) {
    const t = i / innerSamples;
    const curl = Math.sin(Math.PI * t);
    const x = attachX + dir * protrusion * 0.35 * curl;
    const y = attachY + height * 0.28 - height * 0.55 * t;
    innerCurve.push([x, y, surfaceZ]);
  }
  return [
    { kind: 'feature', closed: false, points: outer },
    { kind: 'feature', closed: false, points: innerCurve },
  ];
};

const buildHair = (
  rx: number, ry: number, rz: number, sx: number, browY: number, headHeight: number,
  style: FaceParams['hair']['style'], frontShape: FaceParams['hair']['frontShape'],
  forehead: number, volume: number, fillColor: string | null,
): Curve[] => {
  if (style === 'none' || style === 'bald') return [];

  const curves: Curve[] = [];
  const lift = volume * headHeight;
  const lengthMul = style === 'long' ? 1 : style === 'medium' ? 0.7 : 0.4;
  const effectiveLift = lift * lengthMul;

  // Where the cranium silhouette meets the side plane (the temple corner).
  const sideTheta = Math.acos(Math.min(1, sx / rx));
  const templeY = ry * Math.sin(sideTheta);

  // Hair top silhouette: arcs from JUST BELOW the temple corner, up over the cranium with `lift`,
  // and back down to the other temple corner.
  const topSamples = 48;
  const topSil: Vec3[] = [];
  const startY = templeY - headHeight * 0.02;
  for (let i = 0; i <= topSamples; i++) {
    const t = i / topSamples;
    const theta = t * Math.PI;
    const baseX = sx * Math.cos(theta);
    const domeT = Math.sin(theta);
    const y = startY + (ry - startY) * domeT + effectiveLift * domeT;
    topSil.push([baseX, y, 0]);
  }
  curves.push({ kind: 'feature', closed: false, points: topSil, role: 'hair-top' });

  // Hairline across the forehead. Reach about 70% of the way to the head edge (so it
  // doesn't visually clip into the side silhouette) and arc downward toward the temples
  // so it reads as wrapping around the form, not a flat horizontal cut.
  const hairlineY = browY + (ry - browY) * Math.max(0.05, Math.min(1, forehead));
  const u = hairlineY / ry;
  const ellipseHalfAtY = rx * Math.sqrt(Math.max(0, 1 - u * u));
  const reachX = Math.min(sx, ellipseHalfAtY) * 0.78;
  const hairSamples = 28;
  const hairline: Vec3[] = [];
  // Downward arc magnitude at the temples (so the hairline curves to wrap the head form).
  const templeDrop = headHeight * 0.045;
  for (let i = 0; i <= hairSamples; i++) {
    const t = i / hairSamples;
    const x = -reachX + 2 * reachX * t;
    // Wrap-around: smooth symmetric U. 0 at the middle (t=0.5), -templeDrop at the ends.
    const wrap = -templeDrop * (1 - Math.sin(Math.PI * t));
    let dy = wrap;
    if (frontShape === 'widows-peak') {
      dy -= headHeight * 0.045 * Math.exp(-Math.pow((t - 0.5) * 6, 2));
    } else if (frontShape === 'receding') {
      dy += headHeight * 0.05 * (1 - Math.exp(-Math.pow((t - 0.5) * 5, 2)));
    } else if (frontShape === 'parted') {
      dy -= headHeight * 0.03 * Math.exp(-Math.pow((t - 0.4) * 10, 2));
    }
    const v = hairlineY / ry, w = x / rx;
    const k = 1 - w * w - v * v;
    const z = k > 0 ? rz * Math.sqrt(k) : 0;
    hairline.push([x, hairlineY + dy, z + 0.02]);
  }
  curves.push({ kind: 'feature', closed: false, points: hairline });

  // Closed hair fill region: top silhouette over the top, then back along the hairline.
  // Drawn fill-only (the visible strokes are the topSil + hairline above).
  if (fillColor) {
    const cap: Vec3[] = [...topSil, ...hairline];
    curves.push({
      kind: 'feature', closed: true, points: cap,
      role: 'hair-top', fill: fillColor,
    });
  }

  // Side strands for medium/long.
  if (style === 'medium' || style === 'long') {
    const fallLen = style === 'long' ? headHeight * 0.55 : headHeight * 0.22;
    const mkSide = (sign: number): Vec3[] => {
      const pts: Vec3[] = [];
      const top: Vec3 = [sign * sx * 0.98, templeY * 0.95, 0];
      const mid: Vec3 = [sign * (sx + 0.015), templeY * 0.2, 0];
      const end: Vec3 = [sign * (sx - 0.04), -ry * 0.25 - fallLen, 0];
      const c1: Vec3 = [sign * (sx + 0.03), templeY * 0.55, 0];
      const c2: Vec3 = [sign * (sx + 0.04), templeY * -0.05, 0];
      pts.push(top);
      pts.push(...cubicBezier(top, c1, c2, mid, 10));
      pts.push(...cubicBezier(mid, [sign * (sx + 0.015), -ry * 0.10, 0], [sign * (sx - 0.025), -ry * 0.20 - fallLen * 0.5, 0], end, 10));
      return pts;
    };
    curves.push({ kind: 'feature', closed: false, points: mkSide(-1) });
    curves.push({ kind: 'feature', closed: false, points: mkSide(1) });
  }

  return curves;
};

const buildFacialHair = (
  jawCurvePts: Vec3[],         // the jaw silhouette as a list of 3D points (cheekL → chin → cheekR)
  cheekL: Vec3, cheekR: Vec3,  // jaw endpoints
  mouthY: number,              // where the mouth sits (for mustache placement)
  style: FaceParams['facialHair']['style'],
  length: number, fullness: number, color: string,
): Curve[] => {
  if (style === 'none') return [];

  const curves: Curve[] = [];

  // FULL BEARD / BEARD-WITH-MUSTACHE / FULL-ROUND: closed polygon hugging the outside of the jaw.
  if (style === 'beard' || style === 'beardWithMustache' || style === 'fullRound') {
    // Build offset curve outside the jaw line. For each jaw point, push outward perpendicular to
    // the local jaw direction by `fullness`, scaled by proximity to chin (so it hugs the jaw at
    // the cheeks and only puffs out near the chin), and downward by `length`.
    // fullRound: more uniform outward push (Haddock-style rounded beard).
    // beard/beardWithMustache: outward push tapered near cheeks (cleaner silhouette).
    const isRound = style === 'fullRound';
    const beardOuter: Vec3[] = [];
    for (let i = 0; i < jawCurvePts.length; i++) {
      const p = jawCurvePts[i] as Vec3;
      const prev = jawCurvePts[Math.max(0, i - 1)] as Vec3;
      const next = jawCurvePts[Math.min(jawCurvePts.length - 1, i + 1)] as Vec3;
      const dx = next[0] - prev[0];
      const dy = next[1] - prev[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = dy / len;
      const ny = -dx / len;
      const raw = 1 - Math.abs(i / (jawCurvePts.length - 1) - 0.5) * 2;
      const tFromCenter = Math.pow(raw, isRound ? 0.4 : 0.7);
      const outwardScale = isRound ? Math.max(0.5, tFromCenter) : tFromCenter;
      beardOuter.push([
        p[0] + nx * fullness * outwardScale,
        p[1] + ny * fullness * outwardScale - length * tFromCenter,
        p[2],
      ]);
    }

    // The top edge of the beard polygon. For 'beardWithMustache'/'fullRound' (covers mouth) draw straight
    // across just above mouthY through the mustache region. For 'beard' (no mustache) follow the
    // jaw line back so the mouth stays exposed.
    const topEdge: Vec3[] = [];
    if (style === 'beardWithMustache' || style === 'fullRound') {
      // Single continuous beard-with-mustache: top edge sits just above the mouth at the corners
      // and bulges UP in the middle to form the mustache curl (so beard + mustache read as one shape).
      const baseY = mouthY + 0.018;
      const mustacheRise = style === 'fullRound' ? 0.07 : 0.05;
      const samples = 28;
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const x = cheekR[0] + (cheekL[0] - cheekR[0]) * t;
        // Bell curve at the center for the mustache rise; corners stay low.
        const centerWeight = Math.exp(-Math.pow((t - 0.5) * 3.2, 2));
        // Slight dip at the philtrum (very center) gives a Haddock-style double-curl mustache.
        const philtrumDip = Math.exp(-Math.pow((t - 0.5) * 14, 2)) * mustacheRise * 0.25;
        const y = baseY + mustacheRise * centerWeight - philtrumDip;
        topEdge.push([x, y, cheekL[2]]);
      }
    } else {
      // 'beard' style: top edge tracks the jaw line itself (right back to left).
      for (let i = jawCurvePts.length - 1; i >= 0; i--) {
        topEdge.push(jawCurvePts[i] as Vec3);
      }
    }

    // Polygon: beardOuter (left to right) then topEdge (right back to left). Closed.
    const polygon: Vec3[] = [...beardOuter, ...topEdge];
    curves.push({ kind: 'feature', closed: true, points: polygon, fill: color });
    // Also stroke the outline so the beard has a visible edge.
    curves.push({ kind: 'feature', closed: true, points: polygon });
  }

  // MUSTACHE shapes — variants share a base shape with different curl/length parameters.
  // Note: beardWithMustache and fullRound integrate the mustache into the beard's top edge already,
  // so they're intentionally excluded from this separate draw.
  const wantsMustache = style === 'mustache' || style === 'handlebar' || style === 'vanDyke';
  if (wantsMustache) {
    const mustacheY = mouthY + 0.06;
    const isHandlebar = style === 'handlebar';
    const halfW = isHandlebar
      ? Math.max(0.14, fullness * 5 + 0.10)
      : Math.max(0.10, fullness * 4 + 0.06);
    const samples = 20;
    const top: Vec3[] = [];
    const bot: Vec3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = -halfW + halfW * 2 * t;
      const dipShape = Math.sin(Math.PI * t);
      // Handlebar: ends curl UP; mustache base: flat ends.
      const endCurl = isHandlebar ? Math.pow(Math.abs(t - 0.5) * 2, 2.2) * 0.045 : 0;
      const yTop = mustacheY + 0.018 * dipShape + endCurl;
      const yBot = mustacheY - 0.012 - 0.028 * dipShape + endCurl;
      top.push([x, yTop, 0.1]);
      bot.push([x, yBot, 0.1]);
    }
    const stachePoly: Vec3[] = [...top, ...bot.reverse()];
    curves.push({ kind: 'feature', closed: true, points: stachePoly, fill: color });
    curves.push({ kind: 'feature', closed: true, points: stachePoly });
  }

  // CHINSTRAP: thin beard following just the lower jaw (no mustache, no chin extension).
  if (style === 'chinstrap') {
    const strapInner = jawCurvePts;
    const strapOuter: Vec3[] = [];
    const strapInnerOffset: Vec3[] = [];
    const offset = Math.max(0.020, fullness * 0.7);
    for (let i = 0; i < strapInner.length; i++) {
      const p = strapInner[i] as Vec3;
      const prev = strapInner[Math.max(0, i - 1)] as Vec3;
      const next = strapInner[Math.min(strapInner.length - 1, i + 1)] as Vec3;
      const dx = next[0] - prev[0];
      const dy = next[1] - prev[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = dy / len;
      const ny = -dx / len;
      strapOuter.push([p[0] + nx * offset, p[1] + ny * offset, p[2]]);
      strapInnerOffset.push([p[0] - nx * 0.005, p[1] - ny * 0.005, p[2]]);  // slight inward bleed
    }
    const poly: Vec3[] = [...strapOuter, ...strapInnerOffset.reverse()];
    curves.push({ kind: 'feature', closed: true, points: poly, fill: color });
    curves.push({ kind: 'feature', closed: true, points: poly });
  }

  // SIDEBURNS: two short strips down from the temple area along the upper jaw on each side.
  if (style === 'sideburns') {
    const burnLen = length * 1.4 + 0.06;
    const burnW = fullness + 0.012;
    const mkBurn = (cheek: Vec3, sign: number): Vec3[] => {
      return [
        [cheek[0] + sign * 0.01, cheek[1] + 0.06, cheek[2]],
        [cheek[0] + sign * (0.01 + burnW), cheek[1] + 0.06, cheek[2]],
        [cheek[0] + sign * (0.01 + burnW * 0.8), cheek[1] - burnLen, cheek[2]],
        [cheek[0] + sign * 0.005, cheek[1] - burnLen * 0.9, cheek[2]],
      ];
    };
    const left = mkBurn(cheekL, -1);
    const right = mkBurn(cheekR, 1);
    curves.push({ kind: 'feature', closed: true, points: left, fill: color });
    curves.push({ kind: 'feature', closed: true, points: left });
    curves.push({ kind: 'feature', closed: true, points: right, fill: color });
    curves.push({ kind: 'feature', closed: true, points: right });
  }

  // GOATEE / VANDYKE: a smaller patch on the chin (vanDyke also adds the mustache, handled above).
  if (style === 'goatee' || style === 'vanDyke') {
    const chinPt = jawCurvePts[Math.floor(jawCurvePts.length / 2)] as Vec3;
    const w = fullness * 4 + 0.06;
    const h = length + 0.06;
    const samples = 14;
    const poly: Vec3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = chinPt[0] - w + w * 2 * t;
      const y = chinPt[1] - h * Math.sin(Math.PI * t);
      poly.push([x, y, chinPt[2]]);
    }
    // Close along the top with a slight arc
    for (let i = samples; i >= 0; i--) {
      const t = i / samples;
      const x = chinPt[0] - w * 0.8 + w * 1.6 * t;
      const y = chinPt[1] + 0.02 * Math.sin(Math.PI * t);
      poly.push([x, y, chinPt[2]]);
    }
    curves.push({ kind: 'feature', closed: true, points: poly, fill: color });
    curves.push({ kind: 'feature', closed: true, points: poly });
  }

  return curves;
};

const buildHat = (
  rx: number, ry: number, sx: number, headHeight: number,
  style: FaceParams['hat']['style'],
  color: string, bandColor: string,
  emblem: FaceParams['hat']['emblem'], emblemColor: string,
  size: number, tilt: number,
): Curve[] => {
  if (style === 'none') return [];

  const curves: Curve[] = [];
  // Where the head silhouette meets the side plane (temple corner).
  const sideTheta = Math.acos(Math.min(1, sx / rx));
  const templeY = ry * Math.sin(sideTheta);

  // NAVAL CAP — peaked-style: white headband + dark crown + optional anchor emblem.
  if (style === 'navalCap') {
    const capW = sx * 1.10 * size;            // slightly wider than the cranium
    const bandH = headHeight * 0.07 * size;
    const crownH = headHeight * 0.16 * size;
    const baseY = templeY + headHeight * 0.03;  // sit just above the temple corner

    // Headband: a slightly bulged rectangle wrapping the lower brim.
    const bandSamples = 16;
    const bandTop: Vec3[] = [];
    const bandBot: Vec3[] = [];
    for (let i = 0; i <= bandSamples; i++) {
      const t = i / bandSamples;
      const x = -capW + capW * 2 * t;
      // Bulge slightly downward in the middle (the front of the cap).
      const yBot = baseY - 0.005 * Math.sin(Math.PI * t);
      const yTop = baseY + bandH;
      bandBot.push([x, yBot, 0]);
      bandTop.push([x, yTop, 0]);
    }
    const bandPoly: Vec3[] = [...bandBot, ...bandTop.reverse()];
    curves.push({ kind: 'feature', closed: true, points: bandPoly, fill: bandColor });
    curves.push({ kind: 'feature', closed: true, points: bandPoly });

    // Crown: a dome above the band, slightly wider than the band.
    const crownW = capW * 1.05;
    const crownTop: Vec3[] = [];
    const crownSamples = 28;
    for (let i = 0; i <= crownSamples; i++) {
      const t = i / crownSamples;
      const theta = t * Math.PI;
      const x = crownW * Math.cos(theta);
      const y = (baseY + bandH) + crownH * Math.sin(theta) * 0.95;
      crownTop.push([x, y, 0]);
    }
    // Close along the band's top edge
    const crownPoly: Vec3[] = [
      [crownW, baseY + bandH, 0],
      ...crownTop,
      [-crownW, baseY + bandH, 0],
    ];
    curves.push({ kind: 'feature', closed: true, points: crownPoly, fill: color });
    curves.push({ kind: 'feature', closed: true, points: crownPoly });

    // Anchor emblem on the front of the crown.
    if (emblem === 'anchor') {
      const aCx = 0;
      const aCy = baseY + bandH + crownH * 0.45;
      const aSize = headHeight * 0.07 * size;
      // Anchor: vertical stem + crossbar + bottom arc
      const stem: Vec3[] = [
        [aCx, aCy + aSize * 0.45, 0.01],
        [aCx, aCy - aSize * 0.50, 0.01],
      ];
      const crossbar: Vec3[] = [
        [aCx - aSize * 0.35, aCy + aSize * 0.25, 0.01],
        [aCx + aSize * 0.35, aCy + aSize * 0.25, 0.01],
      ];
      // Bottom arc (U-shape that hooks up on both ends)
      const arcPts: Vec3[] = [];
      const arcSamples = 14;
      for (let i = 0; i <= arcSamples; i++) {
        const t = i / arcSamples;
        const x = aCx - aSize * 0.55 + aSize * 1.10 * t;
        const y = aCy - aSize * 0.40 - aSize * 0.18 * Math.sin(Math.PI * t);
        arcPts.push([x, y, 0.01]);
      }
      // Render as strokes (single-pixel-ish lines) in the emblem color
      for (const pts of [stem, crossbar, arcPts]) {
        curves.push({ kind: 'feature', closed: false, points: pts, fill: emblemColor });
      }
    }
  }

  // BEANIE — fitted dome cap, single color, no band.
  if (style === 'beanie') {
    const capW = sx * 1.05 * size;
    const baseY = templeY + headHeight * 0.04;
    const crownH = headHeight * 0.16 * size;
    const crownSamples = 28;
    const top: Vec3[] = [];
    for (let i = 0; i <= crownSamples; i++) {
      const t = i / crownSamples;
      const theta = t * Math.PI;
      top.push([capW * Math.cos(theta), baseY + crownH * Math.sin(theta), 0]);
    }
    const poly: Vec3[] = [[capW, baseY, 0], ...top, [-capW, baseY, 0]];
    curves.push({ kind: 'feature', closed: true, points: poly, fill: color });
    curves.push({ kind: 'feature', closed: true, points: poly });
  }

  // FEDORA — flat brim + crown.
  if (style === 'fedora') {
    const brimW = sx * 1.65 * size;
    const brimH = headHeight * 0.025 * size;
    const crownW = sx * 0.95 * size;
    const crownH = headHeight * 0.18 * size;
    const baseY = templeY + headHeight * 0.02;
    // Brim ellipse
    const brimTop: Vec3[] = [];
    const brimBot: Vec3[] = [];
    const samples = 28;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = -brimW + brimW * 2 * t;
      brimTop.push([x, baseY + brimH, 0]);
      brimBot.push([x, baseY - brimH, 0]);
    }
    const brimPoly: Vec3[] = [...brimTop, ...brimBot.reverse()];
    curves.push({ kind: 'feature', closed: true, points: brimPoly, fill: color });
    curves.push({ kind: 'feature', closed: true, points: brimPoly });
    // Crown
    const cTop: Vec3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = -crownW + crownW * 2 * t;
      cTop.push([x, baseY + brimH + crownH, 0]);
    }
    const crownPoly: Vec3[] = [
      [crownW, baseY + brimH, 0],
      ...cTop.reverse(),
      [-crownW, baseY + brimH, 0],
    ];
    curves.push({ kind: 'feature', closed: true, points: crownPoly, fill: color });
    curves.push({ kind: 'feature', closed: true, points: crownPoly });
    // Band ribbon
    const bandY = baseY + brimH + headHeight * 0.025;
    const bandPoly: Vec3[] = [
      [-crownW * 0.95, bandY, 0.005],
      [crownW * 0.95, bandY, 0.005],
      [crownW * 0.95, bandY + headHeight * 0.015, 0.005],
      [-crownW * 0.95, bandY + headHeight * 0.015, 0.005],
    ];
    curves.push({ kind: 'feature', closed: true, points: bandPoly, fill: bandColor });
  }

  // BOWLER — domed crown + small curled brim.
  if (style === 'bowler') {
    const brimW = sx * 1.30 * size;
    const baseY = templeY + headHeight * 0.02;
    const crownH = headHeight * 0.15 * size;
    const crownW = sx * 1.0 * size;
    // Brim (thin ellipse)
    const brimTop: Vec3[] = [];
    const brimBot: Vec3[] = [];
    const bh = headHeight * 0.015;
    const samples = 24;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = -brimW + brimW * 2 * t;
      brimTop.push([x, baseY + bh, 0]);
      brimBot.push([x, baseY - bh, 0]);
    }
    const brimPoly: Vec3[] = [...brimTop, ...brimBot.reverse()];
    curves.push({ kind: 'feature', closed: true, points: brimPoly, fill: color });
    curves.push({ kind: 'feature', closed: true, points: brimPoly });
    // Domed crown
    const cTop: Vec3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const theta = t * Math.PI;
      cTop.push([crownW * Math.cos(theta), baseY + bh + crownH * Math.sin(theta), 0]);
    }
    const crownPoly: Vec3[] = [[crownW, baseY + bh, 0], ...cTop, [-crownW, baseY + bh, 0]];
    curves.push({ kind: 'feature', closed: true, points: crownPoly, fill: color });
    curves.push({ kind: 'feature', closed: true, points: crownPoly });
  }

  // TOP HAT — tall cylinder + brim.
  if (style === 'topHat') {
    const brimW = sx * 1.35 * size;
    const baseY = templeY + headHeight * 0.02;
    const crownH = headHeight * 0.30 * size;
    const crownW = sx * 1.0 * size;
    const bh = headHeight * 0.018;
    const samples = 24;
    const brimTop: Vec3[] = [];
    const brimBot: Vec3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = -brimW + brimW * 2 * t;
      brimTop.push([x, baseY + bh, 0]);
      brimBot.push([x, baseY - bh, 0]);
    }
    const brimPoly: Vec3[] = [...brimTop, ...brimBot.reverse()];
    curves.push({ kind: 'feature', closed: true, points: brimPoly, fill: color });
    curves.push({ kind: 'feature', closed: true, points: brimPoly });
    const crownPoly: Vec3[] = [
      [-crownW, baseY + bh, 0],
      [crownW, baseY + bh, 0],
      [crownW * 1.02, baseY + bh + crownH, 0],
      [-crownW * 1.02, baseY + bh + crownH, 0],
    ];
    curves.push({ kind: 'feature', closed: true, points: crownPoly, fill: color });
    curves.push({ kind: 'feature', closed: true, points: crownPoly });
  }

  void tilt;  // tilt rotation not yet implemented; param reserved
  return curves;
};

const buildNeck = (anchorL: Vec3, anchorR: Vec3, baseHalfWidth: number, neckLength: number): Curve[] => {
  // Two curves descending from jaw anchors, smoothly easing outward toward the trapezius.
  // anchor positions sit on the under-jaw; the curve drops mostly straight then bows out.
  const bottomY = anchorL[1] - neckLength;
  const bottomL: Vec3 = [-baseHalfWidth, bottomY, anchorL[2]];
  const bottomR: Vec3 = [baseHalfWidth, bottomY, anchorR[2]];
  const samples = 14;

  // For the left side, start straight down and ease outward in the last third.
  const leftCurve: Vec3[] = [anchorL, ...cubicBezier(
    anchorL,
    [anchorL[0] + (anchorL[0] - 0) * 0.02, anchorL[1] - neckLength * 0.45, anchorL[2]],
    [bottomL[0] - (bottomL[0] - anchorL[0]) * 0.25, anchorL[1] - neckLength * 0.80, anchorL[2]],
    bottomL,
    samples, 1,
  )];
  const rightCurve: Vec3[] = [anchorR, ...cubicBezier(
    anchorR,
    [anchorR[0] - (anchorR[0] - 0) * 0.02, anchorR[1] - neckLength * 0.45, anchorR[2]],
    [bottomR[0] - (bottomR[0] - anchorR[0]) * 0.25, anchorR[1] - neckLength * 0.80, anchorR[2]],
    bottomR,
    samples, 1,
  )];

  return [
    { kind: 'feature', closed: false, points: leftCurve },
    { kind: 'feature', closed: false, points: rightCurve },
  ];
};

// ---- main scaffold builder ----

export const buildScaffold = (p: FaceParams): Scaffold => {
  const rx = p.head.width / 2;
  const ry = p.head.height / 2;
  const rz = p.head.depth / 2;
  const sx = rx * (1 - p.head.sidePlaneInset);
  const chinY = -ry - p.head.chinDrop;
  const cheekY = -ry * 0.35;
  const cheekHalfWidth = sx * (0.80 + 0.15 * (1 - p.head.chinSharpness));

  const eyeY = (ry + chinY) / 2 + p.eyes.yOffset * p.head.height;
  const browY = eyeY + p.brows.yOffset * p.head.height;
  const noseBaseY = eyeY - p.nose.length * p.head.height;
  const mouthY = noseBaseY + (chinY - noseBaseY) * 0.40 + p.mouth.yOffset * p.head.height;

  const frontZ = (x: number, y: number): number => {
    const u = x / rx, v = y / ry;
    const k = 1 - u * u - v * v;
    return k > 0 ? rz * Math.sqrt(k) : 0;
  };

  // ---- silhouette
  const sideThetaTop = Math.acos(Math.min(1, sx / rx));
  const leftTempleTop: Vec3 = [-sx, ry * Math.sin(Math.PI - sideThetaTop), 0];
  const rightTempleTop: Vec3 = [sx, ry * Math.sin(sideThetaTop), 0];

  const topArc = ellipseArcXY(
    rx, ry, sideThetaTop, Math.PI - sideThetaTop, 32,
    (theta) => frontZ(rx * Math.cos(theta), ry * Math.sin(theta)),
  );

  const cheekL: Vec3 = [-cheekHalfWidth, cheekY, frontZ(-cheekHalfWidth, cheekY)];
  const cheekR: Vec3 = [cheekHalfWidth, cheekY, frontZ(cheekHalfWidth, cheekY)];
  // Side: smooth curve from temple to cheek via a single cubic Bezier. Y is monotonic.
  // Control points pull the line slightly outward at the cheekbone, then in toward the cheek.
  const sideCurve = (templeTop: Vec3, cheek: Vec3, sign: number): Vec3[] => {
    const midY1 = templeTop[1] + (cheek[1] - templeTop[1]) * 0.35;
    const midY2 = templeTop[1] + (cheek[1] - templeTop[1]) * 0.75;
    const c1: Vec3 = [sign * sx * 1.015, midY1, 0];
    const c2: Vec3 = [sign * cheekHalfWidth * 1.05, midY2, 0];
    return [templeTop, ...cubicBezier(templeTop, c1, c2, cheek, 12)];
  };
  const sideL: Vec3[] = sideCurve(leftTempleTop, cheekL, -1);
  const sideR: Vec3[] = sideCurve(rightTempleTop, cheekR, 1);

  const chinZ = p.head.depth * 0.30;
  const jaw = jawCurve(cheekL, cheekR, chinY, chinZ, p.head.chinSharpness, 18);

  const silhouettePoints: Vec3[] = [];
  silhouettePoints.push(...topArc);
  silhouettePoints.push(...sideL.slice(1));
  silhouettePoints.push(...jaw.slice(1));
  silhouettePoints.push(...sideR.slice(0, -1).reverse());

  const silhouette: Curve = {
    kind: 'feature', closed: true, points: silhouettePoints,
    role: 'silhouette', fill: p.style.skinFill,
  };

  // ---- construction guides
  const centerline: Curve = {
    kind: 'construction', closed: false,
    points: [[0, ry, frontZ(0, ry)], [0, chinY, chinZ]],
  };
  const lineAt = (y: number, halfReach: number): Curve => {
    const samples = 16;
    const pts: Vec3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = -halfReach + 2 * halfReach * t;
      pts.push([x, y, frontZ(x, y) + 0.001]);
    }
    return { kind: 'construction', closed: false, points: pts };
  };
  const eyeline = lineAt(eyeY, rx * 0.95);
  const browline = lineAt(browY, rx * 0.85);
  const mouthline = lineAt(mouthY, rx * 0.7);

  const sidePlaneL: Curve = { kind: 'construction', closed: false, points: sideL };
  const sidePlaneR: Curve = { kind: 'construction', closed: false, points: sideR };

  // ---- features
  const features: Curve[] = [];

  // Hair (drawn first so other features can overlap it slightly via Z-order — painter actually sorts later)
  features.push(...buildHair(rx, ry, rz, sx, browY, p.head.height, p.hair.style, p.hair.frontShape, p.hair.forehead, p.hair.volume, p.style.hairFill));

  // Hat (sits on top of head; opt-in via p.hat.style)
  features.push(...buildHat(rx, ry, sx, p.head.height, p.hat.style, p.hat.color, p.hat.bandColor, p.hat.emblem, p.hat.emblemColor, p.hat.size, p.hat.tilt));

  // Ears — anchored so their inner edge is INSIDE the head silhouette (overlap by ~30% of width)
  // so they read as attached, not floating next to the head.
  if (p.ears.visible) {
    // Ear sits between eyeline and nose-base (classic Loomis placement).
    const earY = ((eyeY + noseBaseY) / 2) + p.ears.yOffset * p.head.height;
    const earH = p.ears.size * p.head.height;
    // The head's side at this Y. For our model the side plane is at ±sx; use that as the join point
    // but shift the ear's anchor INWARD by ~25% of the ear's protrusion so the inner curve overlaps the head.
    const earInset = p.ears.protrusion * 0.25;
    const earZ = p.head.depth * 0.10;
    features.push(...buildEar(-sx + earInset, earY, earH, p.ears.protrusion, earZ, true));
    features.push(...buildEar(sx - earInset, earY, earH, p.ears.protrusion, earZ, false));
  }

  // Eyes
  const halfEye = (p.eyes.size * p.head.width) / 2;
  const eyeAnchorX = (p.eyes.spacing * p.head.width) / 2;
  const eyeSurfaceZ = frontZ(eyeAnchorX, eyeY);
  if (p.eyes.style === 'dots') {
    const dotR = p.eyes.dotSize * p.head.width;
    features.push(...buildEyeDots([-eyeAnchorX, eyeY, eyeSurfaceZ], dotR, p.eyes.openness, eyeSurfaceZ));
    features.push(...buildEyeDots([eyeAnchorX, eyeY, eyeSurfaceZ], dotR, p.eyes.openness, eyeSurfaceZ));
  } else {
    features.push(...buildEye([-eyeAnchorX, eyeY, eyeSurfaceZ], halfEye, p.eyes.openness, p.eyes.tilt, eyeSurfaceZ));
    features.push(...buildEye([eyeAnchorX, eyeY, eyeSurfaceZ], halfEye, p.eyes.openness, -p.eyes.tilt, eyeSurfaceZ));
  }

  // Brows
  const browLen = p.brows.length * p.head.width;
  const browInnerX = p.brows.spacing * p.head.width;
  const innerOffset = p.brows.innerHeight * p.head.height;
  const outerOffset = p.brows.outerHeight * p.head.height;
  features.push(...buildBrow(
    [-browInnerX, browY + innerOffset, frontZ(-browInnerX, browY)],
    browLen, 0, outerOffset - innerOffset, p.brows.arch, p.brows.thickness, frontZ(-browInnerX, browY), true,
  ));
  features.push(...buildBrow(
    [browInnerX, browY + innerOffset, frontZ(browInnerX, browY)],
    browLen, 0, outerOffset - innerOffset, p.brows.arch, p.brows.thickness, frontZ(browInnerX, browY), false,
  ));

  // Nose (bridge top sits just below brow line)
  const bridgeTop: Vec3 = [0, browY - p.head.height * 0.02, frontZ(0, browY)];
  features.push(...buildNose(bridgeTop, p.nose.length * p.head.height, p.nose.width * p.head.width, frontZ(0, browY), p.nose.bridgeVisible, p.nose.style, p.nose.showNostrils));

  // Facial hair — emitted BEFORE the mouth so the mustache covers the mouth line when beardWithMustache
  // is requested (painter's order is by avgZ; both sit at similar Z, so emit order is the tiebreaker).
  if (p.facialHair.style !== 'none') {
    const hairColor = p.facialHair.color ?? p.style.hairFill ?? '#1a1a1a';
    features.push(...buildFacialHair(
      jaw, cheekL, cheekR, mouthY,
      p.facialHair.style,
      p.facialHair.length * p.head.height,
      p.facialHair.fullness * p.head.width,
      hairColor,
    ));
  }

  // Mouth
  const mouthCenter: Vec3 = [0, mouthY, frontZ(0, mouthY)];
  features.push(...buildMouth(
    mouthCenter, p.mouth.width * p.head.width, p.mouth.openness, p.mouth.cornerLift * p.head.height,
    p.mouth.upperCurve, p.mouth.lipFullness, p.mouth.cornerMarks, frontZ(0, mouthY),
  ));

  // Neck — anchor on the under-jaw between the chin pad and the cheek; widens slightly at the base.
  if (p.neck.visible) {
    const jawAnchorX = p.head.width * 0.28;
    // Anchor Y: just above the chin (so the neck appears to emerge from under the jaw, not from the chin tip).
    const jawAnchorY = chinY + p.head.chinDrop * 0.4;
    const jawAnchorZ = chinZ * 0.5;
    const anchorL: Vec3 = [-jawAnchorX, jawAnchorY, jawAnchorZ];
    const anchorR: Vec3 = [jawAnchorX, jawAnchorY, jawAnchorZ];
    const baseHalfWidth = (p.neck.width * p.head.width) / 2;
    features.push(...buildNeck(anchorL, anchorR, baseHalfWidth, p.neck.length * p.head.height));
  }

  return {
    silhouette,
    centerline,
    eyeline,
    browline,
    mouthline,
    sidePlanes: [sidePlaneL, sidePlaneR],
    features,
  };
};

export const allCurves = (s: Scaffold, showConstruction: boolean, showSidePlanes: boolean): Curve[] => {
  const out: Curve[] = [s.silhouette, ...s.features];
  if (showConstruction) out.push(s.centerline, s.eyeline, s.browline, s.mouthline);
  if (showSidePlanes) out.push(...s.sidePlanes);
  return out;
};

export { ellipsoidPoint };
