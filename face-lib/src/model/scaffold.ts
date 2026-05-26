import type { FaceParams } from './params.ts';
import type { Vec3 } from '../math/vec3.ts';
import { ellipsoidPoint } from '../math/vec3.ts';

// A Curve is a 3D polyline. The renderer projects each point and strokes them as one path.
export type Curve = {
  kind: 'construction' | 'feature';
  closed: boolean;
  points: Vec3[];
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
    const irisR = halfWidth * 0.42;
    const iris: Vec3[] = [];
    const pupil: Vec3[] = [];
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * TAU;
      iris.push([anchor[0] + Math.cos(a) * irisR, anchor[1] + Math.sin(a) * irisR * Math.min(1, openness), surfaceZ + 0.01]);
      pupil.push([anchor[0] + Math.cos(a) * irisR * 0.45, anchor[1] + Math.sin(a) * irisR * 0.45 * Math.min(1, openness), surfaceZ + 0.012]);
    }
    curves.push({ kind: 'feature', closed: true, points: iris });
    curves.push({ kind: 'feature', closed: true, points: pupil });
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
  bridgeTop: Vec3, length: number, width: number, surfaceZ: number, bridgeVisible: boolean,
): Curve[] => {
  const curves: Curve[] = [];
  const tipY = bridgeTop[1] - length;
  const tipZ = surfaceZ + 0.06;
  const half = width / 2;

  // Optional bridge (one-sided line for shadow side, kept dashed-light by emitting as a normal feature).
  if (bridgeVisible) {
    const bridgeShift = -width * 0.20;
    curves.push({
      kind: 'feature', closed: false,
      points: [
        [bridgeTop[0] + bridgeShift, bridgeTop[1] - length * 0.10, surfaceZ + 0.02],
        [bridgeTop[0] + bridgeShift * 0.6, tipY + length * 0.05, surfaceZ + 0.04],
      ],
    });
  }

  // Nose tip: a small rounded "U" with a slight bulge.
  const tipBulgeSamples = 14;
  const tip: Vec3[] = [];
  for (let i = 0; i <= tipBulgeSamples; i++) {
    const t = i / tipBulgeSamples;
    const x = -half * 0.55 + width * 0.55 * t;
    // Down then back up — the underside of the tip
    const y = tipY - Math.sin(Math.PI * t) * width * 0.30;
    tip.push([bridgeTop[0] + x, y, tipZ]);
  }
  curves.push({ kind: 'feature', closed: false, points: tip });

  // Left nostril wing: short curve hooking up from the tip's left edge to suggest the alar groove.
  const leftWing: Vec3[] = [];
  const wingSamples = 8;
  const leftWingStart: Vec3 = [bridgeTop[0] - half * 0.55, tipY, tipZ];
  const leftWingEnd: Vec3 = [bridgeTop[0] - half * 0.85, tipY + width * 0.15, tipZ - 0.01];
  for (let i = 0; i <= wingSamples; i++) {
    const t = i / wingSamples;
    const x = leftWingStart[0] + (leftWingEnd[0] - leftWingStart[0]) * t;
    const y = leftWingStart[1] + (leftWingEnd[1] - leftWingStart[1]) * t + Math.sin(Math.PI * t) * width * 0.08;
    leftWing.push([x, y, tipZ]);
  }
  curves.push({ kind: 'feature', closed: false, points: leftWing });

  // Right nostril wing (mirror).
  const rightWing: Vec3[] = [];
  for (let i = 0; i <= wingSamples; i++) {
    const t = i / wingSamples;
    const x = bridgeTop[0] + half * 0.55 + ((bridgeTop[0] + half * 0.85) - (bridgeTop[0] + half * 0.55)) * t;
    const y = tipY + width * 0.15 * t + Math.sin(Math.PI * t) * width * 0.08;
    rightWing.push([x, y, tipZ]);
  }
  curves.push({ kind: 'feature', closed: false, points: rightWing });

  // Nostril holes: tiny curved dashes under the tip.
  const nostrilHalfX = half * 0.35;
  const nostrilY = tipY - width * 0.05;
  const mkNostril = (cx: number): Vec3[] => {
    const pts: Vec3[] = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const x = cx + (-width * 0.10 + width * 0.20 * t);
      const y = nostrilY - Math.sin(Math.PI * t) * width * 0.06;
      pts.push([x, y, tipZ]);
    }
    return pts;
  };
  curves.push({ kind: 'feature', closed: false, points: mkNostril(bridgeTop[0] - nostrilHalfX) });
  curves.push({ kind: 'feature', closed: false, points: mkNostril(bridgeTop[0] + nostrilHalfX) });

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
  // The outer curve bulges away from the head by `protrusion`; the inner curve hugs the side plane.
  const dir = isLeft ? -1 : 1;
  const top: Vec3 = [attachX, attachY + height / 2, surfaceZ];
  const bottom: Vec3 = [attachX, attachY - height / 2, surfaceZ];
  const outerMid: Vec3 = [attachX + dir * protrusion, attachY, surfaceZ - 0.02];

  // Outer C: top → outerMid → bottom
  const samples = 14;
  const outer: Vec3[] = [];
  const c1Top: Vec3 = [attachX + dir * protrusion * 0.4, attachY + height * 0.42, surfaceZ - 0.01];
  const c2Top: Vec3 = [attachX + dir * protrusion * 1.0, attachY + height * 0.20, surfaceZ - 0.02];
  outer.push(top);
  outer.push(...cubicBezier(top, c1Top, c2Top, outerMid, samples / 2));
  const c1Bot: Vec3 = [attachX + dir * protrusion * 1.0, attachY - height * 0.20, surfaceZ - 0.02];
  const c2Bot: Vec3 = [attachX + dir * protrusion * 0.4, attachY - height * 0.42, surfaceZ - 0.01];
  outer.push(...cubicBezier(outerMid, c1Bot, c2Bot, bottom, samples / 2));

  // Inner detail: a small curve inside the ear suggesting the antihelix.
  const innerCurve: Vec3[] = [];
  const innerSamples = 8;
  for (let i = 0; i <= innerSamples; i++) {
    const t = i / innerSamples;
    const x = attachX + dir * protrusion * 0.45 * Math.sin(Math.PI * t * 0.85);
    const y = attachY + height * 0.30 - height * 0.45 * t;
    innerCurve.push([x, y, surfaceZ - 0.015]);
  }
  return [
    { kind: 'feature', closed: false, points: outer },
    { kind: 'feature', closed: false, points: innerCurve },
  ];
};

const buildHair = (
  rx: number, ry: number, rz: number, sx: number, browY: number, headHeight: number,
  style: FaceParams['hair']['style'], frontShape: FaceParams['hair']['frontShape'],
  forehead: number, volume: number,
): Curve[] => {
  if (style === 'none' || style === 'bald') return [];

  const curves: Curve[] = [];
  const lift = volume * headHeight;
  const lengthMul = style === 'long' ? 1 : style === 'medium' ? 0.7 : 0.4;
  const effectiveLift = lift * lengthMul;

  // Where the cranium silhouette meets the side plane (the temple corner).
  const sideTheta = Math.acos(Math.min(1, sx / rx));
  // Temple corner Y (where the head curve transitions to the straight side plane).
  const templeY = ry * Math.sin(sideTheta);

  // Hair top silhouette: arcs from JUST BELOW the temple corner, up over the cranium with `lift`,
  // and back down to the other temple corner. So it's bounded by the cranium silhouette on the sides.
  const topSamples = 48;
  const topSil: Vec3[] = [];
  // Start a touch below the temple corner so the hair line meets the side of the head cleanly.
  const startY = templeY - headHeight * 0.02;
  for (let i = 0; i <= topSamples; i++) {
    const t = i / topSamples;
    // Parametrize: t=0 right temple, t=1 left temple. Use a half-ellipse from right to left.
    // x: cosine sweep across the head; y: sine sweep providing the dome.
    const theta = t * Math.PI;
    const baseX = sx * Math.cos(theta);
    // Y: starts and ends at startY, peaks at ry + lift in the middle
    const domeT = Math.sin(theta);
    const y = startY + (ry - startY) * domeT + effectiveLift * domeT;
    topSil.push([baseX, y, 0]);
  }
  curves.push({ kind: 'feature', closed: false, points: topSil });

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

const buildNeck = (jawL: Vec3, jawR: Vec3, neckWidth: number, neckLength: number): Curve[] => {
  const widthAt = neckWidth / 2;
  // Two short curves descending from each jaw side, slightly angled outward then in.
  const left: Vec3 = [-widthAt, jawL[1] - neckLength, 0];
  const right: Vec3 = [widthAt, jawR[1] - neckLength, 0];
  const leftCurve = [jawL, [jawL[0] * 0.8, jawL[1] - neckLength * 0.3, jawL[2] * 0.5], left] as Vec3[];
  const rightCurve = [jawR, [jawR[0] * 0.8, jawR[1] - neckLength * 0.3, jawR[2] * 0.5], right] as Vec3[];
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

  const silhouette: Curve = { kind: 'feature', closed: true, points: silhouettePoints };

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
  features.push(...buildHair(rx, ry, rz, sx, browY, p.head.height, p.hair.style, p.hair.frontShape, p.hair.forehead, p.hair.volume));

  // Ears
  if (p.ears.visible) {
    const earY = ((eyeY + noseBaseY) / 2) + p.ears.yOffset * p.head.height;
    const earH = p.ears.size * p.head.height;
    features.push(...buildEar(-sx, earY, earH, p.ears.protrusion, 0, true));
    features.push(...buildEar(sx, earY, earH, p.ears.protrusion, 0, false));
  }

  // Eyes
  const halfEye = (p.eyes.size * p.head.width) / 2;
  const eyeAnchorX = (p.eyes.spacing * p.head.width) / 2;
  const eyeSurfaceZ = frontZ(eyeAnchorX, eyeY);
  features.push(...buildEye([-eyeAnchorX, eyeY, eyeSurfaceZ], halfEye, p.eyes.openness, p.eyes.tilt, eyeSurfaceZ));
  features.push(...buildEye([eyeAnchorX, eyeY, eyeSurfaceZ], halfEye, p.eyes.openness, -p.eyes.tilt, eyeSurfaceZ));

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
  features.push(...buildNose(bridgeTop, p.nose.length * p.head.height, p.nose.width * p.head.width, frontZ(0, browY), p.nose.bridgeVisible));

  // Mouth
  const mouthCenter: Vec3 = [0, mouthY, frontZ(0, mouthY)];
  features.push(...buildMouth(
    mouthCenter, p.mouth.width * p.head.width, p.mouth.openness, p.mouth.cornerLift * p.head.height,
    p.mouth.upperCurve, p.mouth.lipFullness, p.mouth.cornerMarks, frontZ(0, mouthY),
  ));

  // Neck
  if (p.neck.visible) {
    // Anchor to the jaw at points slightly inside the cheek width
    const jawL_anchor: Vec3 = [cheekL[0] * 0.55, chinY + (cheekY - chinY) * 0.25, chinZ * 0.5];
    const jawR_anchor: Vec3 = [cheekR[0] * 0.55, chinY + (cheekY - chinY) * 0.25, chinZ * 0.5];
    features.push(...buildNeck(jawL_anchor, jawR_anchor, p.neck.width * p.head.width, p.neck.length * p.head.height));
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
