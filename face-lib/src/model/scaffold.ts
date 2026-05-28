import type { FaceParams } from './params.ts';
import type { Vec3 } from '../math/vec3.ts';
import { ellipsoidPoint } from '../math/vec3.ts';
import { darken, lighten } from '../math/color.ts';
import { cranialField, clumpStroke } from './hair-field.ts';

// A Curve is a 3D polyline. The renderer projects each point and strokes them as one path.
// `role` lets the renderer identify special curves (silhouette, hair) for fills.
//
// kind: 'feature-ink' is an inked stroke — the renderer pipes it through perfect-freehand
// to produce a closed outline polygon with tapered tips (variable width per `ink.pressure`),
// and paints it as a FILL in pass 1. Pass 2 (strokes) skips feature-ink curves. This is the
// hair / characterization-stroke path; per Leo's pass-3 hair-tooling research.
export type InkProfile = {
  size: number;          // base diameter in normalized world units (multiplied by lineWeight in svg)
  taperStart: number;    // 0..1 fraction of stroke length tapered at start
  taperEnd: number;      // 0..1 fraction of stroke length tapered at end
  pressureMid?: number;  // peak pressure at mid-stroke (default 0.85)
  color?: string;        // optional fill color override (defaults to style.color)
};

export type Curve = {
  kind: 'construction' | 'feature' | 'feature-ink';
  closed: boolean;
  points: Vec3[];
  role?: 'silhouette' | 'hair-top';
  fill?: string | null;
  noStroke?: boolean;   // skip stroke pass — fill-only render (used for hidden hairlines)
  ink?: InkProfile;     // required when kind === 'feature-ink'
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

// Jaw construction — DISPATCHER per Leo §3 (research/leo-jaw.md).
// Six topologies, each its own builder. The cubic-Bezier-everywhere approach was
// fundamentally C2-smooth and couldn't grow a gonial cusp; Loomis/Bridgman/Hergé all
// treat jaw block type as a categorical choice made before any smooth parameter.

type JawTopology = 'square' | 'oval' | 'pointed' | 'pear' | 'jowled' | 'round';
type JawSpec = {
  cheekL: Vec3; cheekR: Vec3;
  chinY: number; chinZ: number;
  bigonialHalf: number;
  mentalHalf: number;
  gonialAngle: number;          // 0..1, 0=square cusp, 1=fully soft
  jowl: number;                 // 0..1
  topology: JawTopology;
};

// Helper: straight-line interpolation between two Vec3 points (used for cusp-bearing topologies).
const lineSeg = (a: Vec3, b: Vec3, samples: number): Vec3[] => {
  const out: Vec3[] = [];
  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    out.push([
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ]);
  }
  return out;
};

// SQUARE — Haddock / Bruce Timm villain. Two straight obliques per side meeting at a
// CUSP at the gonial corner. Bridgman 1920.
const buildSquareJaw = (s: JawSpec, samples: number): Vec3[] => {
  const seg = Math.max(2, Math.floor(samples / 5));
  // Gonial vertex sits at bigonialHalf; high gonialAngle softens slightly inward.
  const gonialVertexX = s.bigonialHalf * (1 - 0.08 * s.gonialAngle);
  // Gonial Y is below the cheek by a fraction of the ramus span. For our scaffold
  // the cheek IS the gonial corner (it's where the side curve hands off to jawCurve).
  // So the cusp is right at cheekL[1] and we proceed obliquely toward the chin.
  const gonialL: Vec3 = [-gonialVertexX, s.cheekL[1], s.chinZ * 0.6];
  const gonialR: Vec3 = [ gonialVertexX, s.cheekR[1], s.chinZ * 0.6];
  const chinL: Vec3 = [-s.mentalHalf, s.chinY, s.chinZ];
  const chinR: Vec3 = [ s.mentalHalf, s.chinY, s.chinZ];
  return [
    s.cheekL,
    ...lineSeg(s.cheekL, gonialL, 2),    // tiny ramus segment (cheek = gonial here)
    ...lineSeg(gonialL, chinL, seg * 2), // oblique side-of-jaw, sharp cusp at gonialL
    ...lineSeg(chinL, chinR, seg),       // flat chin pad
    ...lineSeg(chinR, gonialR, seg * 2),
    ...lineSeg(gonialR, s.cheekR, 2),
  ];
};

// POINTED — Wronzoff / mooks. Sharp triangular taper to a narrow chin. Cusp at gonial,
// narrow rounded chin pad. Faigin 2012 "pointed" archetype.
const buildPointedJaw = (s: JawSpec, samples: number): Vec3[] => {
  const seg = Math.max(2, Math.floor(samples / 5));
  const gonialVertexX = s.bigonialHalf * (1 - 0.04 * s.gonialAngle);
  // Narrow chin — clamp mental width to at most 18% of bigonial.
  const chinHalf = Math.min(s.mentalHalf, s.bigonialHalf * 0.18);
  const gonialL: Vec3 = [-gonialVertexX, s.cheekL[1], s.chinZ * 0.6];
  const gonialR: Vec3 = [ gonialVertexX, s.cheekR[1], s.chinZ * 0.6];
  const chinL: Vec3 = [-chinHalf, s.chinY, s.chinZ];
  const chinR: Vec3 = [ chinHalf, s.chinY, s.chinZ];
  // Small chin-tip arc rounds the bottom (3 samples) instead of a flat pad.
  const chinArc: Vec3[] = [];
  const arcSamples = 4;
  for (let i = 1; i < arcSamples; i++) {
    const t = i / arcSamples;
    const x = -chinHalf + 2 * chinHalf * t;
    const y = s.chinY - chinHalf * 0.2 * Math.sin(Math.PI * t);
    chinArc.push([x, y, s.chinZ]);
  }
  return [
    s.cheekL,
    ...lineSeg(s.cheekL, gonialL, 2),
    ...lineSeg(gonialL, chinL, seg * 2),
    ...chinArc,
    chinR,
    ...lineSeg(chinR, gonialR, seg * 2),
    ...lineSeg(gonialR, s.cheekR, 2),
  ];
};

// OVAL — Calculus / classic feminine. Smooth single cubic Bezier, no visible gonial corner.
// gonialAngle controls how rounded the soft turn is. Faigin "oval".
const buildOvalJaw = (s: JawSpec, samples: number): Vec3[] => {
  const out: Vec3[] = [];
  const padHalf = s.mentalHalf;
  const chinL: Vec3 = [-padHalf, s.chinY, s.chinZ];
  const chinR: Vec3 = [ padHalf, s.chinY, s.chinZ];
  out.push(s.cheekL);
  const cL_c1: Vec3 = [s.cheekL[0] * 0.95, s.cheekL[1] - (s.cheekL[1] - s.chinY) * 0.55, s.cheekL[2] * 0.7 + s.chinZ * 0.3];
  const cL_c2: Vec3 = [chinL[0] - padHalf * 0.6, s.chinY + (s.cheekL[1] - s.chinY) * 0.05, s.chinZ];
  out.push(...cubicBezier(s.cheekL, cL_c1, cL_c2, chinL, samples));
  const padSamples = Math.max(2, Math.floor(samples * 0.3));
  for (let i = 1; i <= padSamples; i++) {
    const t = i / padSamples;
    const x = -padHalf + 2 * padHalf * t;
    const dy = -padHalf * 0.10 * Math.sin(Math.PI * t);
    out.push([x, s.chinY + dy, s.chinZ]);
  }
  const cR_c1: Vec3 = [chinR[0] + padHalf * 0.6, s.chinY + (s.cheekR[1] - s.chinY) * 0.05, s.chinZ];
  const cR_c2: Vec3 = [s.cheekR[0] * 0.95, s.cheekR[1] - (s.cheekR[1] - s.chinY) * 0.55, s.cheekR[2] * 0.7 + s.chinZ * 0.3];
  out.push(...cubicBezier(chinR, cR_c1, cR_c2, s.cheekR, samples));
  return out;
};

// ROUND — child / juvenile. Oval with bigonialHalf ≈ cheek width and wide round chin pad,
// so there's no narrowing — just a soft U. Loomis 1956 child-proportions diagram.
const buildRoundJaw = (s: JawSpec, samples: number): Vec3[] => {
  const out: Vec3[] = [];
  // Chin pad almost as wide as the cheek — the soft U.
  const padHalf = Math.max(s.mentalHalf, Math.abs(s.cheekL[0]) * 0.75);
  const chinL: Vec3 = [-padHalf, s.chinY, s.chinZ];
  const chinR: Vec3 = [ padHalf, s.chinY, s.chinZ];
  out.push(s.cheekL);
  // Soft U: cubic with control points pulling slightly outward then in.
  const cL_c1: Vec3 = [s.cheekL[0], s.cheekL[1] - (s.cheekL[1] - s.chinY) * 0.6, s.cheekL[2] * 0.5];
  const cL_c2: Vec3 = [chinL[0] - 0.005, s.chinY + (s.cheekL[1] - s.chinY) * 0.1, s.chinZ];
  out.push(...cubicBezier(s.cheekL, cL_c1, cL_c2, chinL, samples));
  // Round chin pad arc (deeper than oval).
  const padSamples = Math.max(4, Math.floor(samples * 0.5));
  for (let i = 1; i <= padSamples; i++) {
    const t = i / padSamples;
    const x = -padHalf + 2 * padHalf * t;
    const dy = -padHalf * 0.15 * Math.sin(Math.PI * t);
    out.push([x, s.chinY + dy, s.chinZ]);
  }
  const cR_c1: Vec3 = [chinR[0] + 0.005, s.chinY + (s.cheekR[1] - s.chinY) * 0.1, s.chinZ];
  const cR_c2: Vec3 = [s.cheekR[0], s.cheekR[1] - (s.cheekR[1] - s.chinY) * 0.6, s.cheekR[2] * 0.5];
  out.push(...cubicBezier(chinR, cR_c1, cR_c2, s.cheekR, samples));
  return out;
};

// PEAR — Wagg / dowager. Jaw flares OUTWARD below the cheek to a wider belly position,
// then tapers inward to chin. The widest X is NOT at the gonial corner. Hogarth 1965.
const buildPearJaw = (s: JawSpec, samples: number): Vec3[] => {
  const out: Vec3[] = [];
  // Belly Y between cheek and chin, biased toward the chin (mid-low).
  const bellyY = s.cheekL[1] + (s.chinY - s.cheekL[1]) * 0.55;
  const bellyHalfX = s.bigonialHalf * 1.20 * (1 + 0.3 * s.jowl);
  const bellyL: Vec3 = [-bellyHalfX, bellyY, s.chinZ * 0.7];
  const bellyR: Vec3 = [ bellyHalfX, bellyY, s.chinZ * 0.7];
  const chinL: Vec3 = [-s.mentalHalf, s.chinY, s.chinZ];
  const chinR: Vec3 = [ s.mentalHalf, s.chinY, s.chinZ];
  out.push(s.cheekL);
  // Left side: cheek → belly (flaring outward).
  out.push(...cubicBezier(
    s.cheekL,
    [s.cheekL[0] * 1.05, (s.cheekL[1] + bellyY) / 2, s.cheekL[2] * 0.5 + bellyL[2] * 0.5],
    [bellyL[0] * 0.97, bellyY + 0.005, bellyL[2]],
    bellyL,
    Math.floor(samples / 2),
  ));
  // Left side: belly → chin (tapering inward).
  out.push(...cubicBezier(
    bellyL,
    [bellyL[0] * 0.80, bellyY - (bellyY - s.chinY) * 0.4, bellyL[2] * 0.5 + s.chinZ * 0.5],
    [chinL[0] - s.mentalHalf * 0.3, s.chinY + (bellyY - s.chinY) * 0.05, s.chinZ],
    chinL,
    Math.floor(samples / 2),
  ));
  // Flat chin pad.
  const padSamples = Math.max(2, Math.floor(samples * 0.25));
  for (let i = 1; i <= padSamples; i++) {
    const t = i / padSamples;
    const x = -s.mentalHalf + 2 * s.mentalHalf * t;
    out.push([x, s.chinY, s.chinZ]);
  }
  // Right side: chin → belly → cheek (mirror).
  out.push(...cubicBezier(
    chinR,
    [chinR[0] + s.mentalHalf * 0.3, s.chinY + (bellyY - s.chinY) * 0.05, s.chinZ],
    [bellyR[0] * 0.80, bellyY - (bellyY - s.chinY) * 0.4, bellyR[2] * 0.5 + s.chinZ * 0.5],
    bellyR,
    Math.floor(samples / 2),
  ));
  out.push(...cubicBezier(
    bellyR,
    [bellyR[0] * 0.97, bellyY + 0.005, bellyR[2]],
    [s.cheekR[0] * 1.05, (s.cheekR[1] + bellyY) / 2, s.cheekR[2] * 0.5 + bellyR[2] * 0.5],
    s.cheekR,
    Math.floor(samples / 2),
  ));
  return out;
};

// JOWLED — elder / heavy character. Cheek and bigonial are similar; the silhouette
// BULGES outward AT the gonial Y (the jowl itself), then tapers fast. Faigin 1990 §"Age".
// Distinct from pear: bulge is HIGHER (at gonial) and chin pad is normal width — the signal
// is the gonial sag, not whole-jaw widening.
const buildJowledJaw = (s: JawSpec, samples: number): Vec3[] => {
  const out: Vec3[] = [];
  // Jowl bulge sits just below the cheek (at gonial level).
  const jowlY = s.cheekL[1] - (s.cheekL[1] - s.chinY) * 0.18;
  const jowlHalfX = s.bigonialHalf * (1.08 + 0.18 * s.jowl);
  const jowlL: Vec3 = [-jowlHalfX, jowlY, s.chinZ * 0.6];
  const jowlR: Vec3 = [ jowlHalfX, jowlY, s.chinZ * 0.6];
  const chinL: Vec3 = [-s.mentalHalf, s.chinY, s.chinZ];
  const chinR: Vec3 = [ s.mentalHalf, s.chinY, s.chinZ];
  out.push(s.cheekL);
  // Cheek → jowl bulge (short outward curve).
  out.push(...cubicBezier(
    s.cheekL,
    [s.cheekL[0] * 1.04, (s.cheekL[1] + jowlY) / 2, 0],
    [jowlL[0] * 0.95, jowlY + 0.003, 0],
    jowlL,
    Math.floor(samples / 3),
  ));
  // Jowl → chin (taper inward, mostly straight then easing).
  out.push(...cubicBezier(
    jowlL,
    [jowlL[0] * 0.70, jowlY - (jowlY - s.chinY) * 0.45, 0],
    [chinL[0] - s.mentalHalf * 0.2, s.chinY + (jowlY - s.chinY) * 0.05, s.chinZ],
    chinL,
    Math.floor(samples / 2),
  ));
  // Chin pad with slight downward curve.
  const padSamples = Math.max(2, Math.floor(samples * 0.25));
  for (let i = 1; i <= padSamples; i++) {
    const t = i / padSamples;
    const x = -s.mentalHalf + 2 * s.mentalHalf * t;
    out.push([x, s.chinY - s.mentalHalf * 0.05 * Math.sin(Math.PI * t), s.chinZ]);
  }
  out.push(...cubicBezier(
    chinR,
    [chinR[0] + s.mentalHalf * 0.2, s.chinY + (jowlY - s.chinY) * 0.05, s.chinZ],
    [jowlR[0] * 0.70, jowlY - (jowlY - s.chinY) * 0.45, 0],
    jowlR,
    Math.floor(samples / 2),
  ));
  out.push(...cubicBezier(
    jowlR,
    [jowlR[0] * 0.95, jowlY + 0.003, 0],
    [s.cheekR[0] * 1.04, (s.cheekR[1] + jowlY) / 2, 0],
    s.cheekR,
    Math.floor(samples / 3),
  ));
  return out;
};

// Dispatcher.
const jawCurve = (s: JawSpec, samples: number): Vec3[] => {
  switch (s.topology) {
    case 'square':  return buildSquareJaw(s, samples);
    case 'pointed': return buildPointedJaw(s, samples);
    case 'oval':    return buildOvalJaw(s, samples);
    case 'round':   return buildRoundJaw(s, samples);
    case 'pear':    return buildPearJaw(s, samples);
    case 'jowled':  return buildJowledJaw(s, samples);
  }
};

// ---- features ----

const buildEyeDots = (
  anchor: Vec3, dotR: number, openness: number, surfaceZ: number,
  lidLine: number, lashes: number, underlineHint: number, isLeft: boolean,
): Curve[] => {
  // Tintin-style eye plus three independent within-style modifiers (lidLine, lashes,
  // underlineHint) so eyes can vary across characters without leaving the dot aesthetic.
  if (openness < 0.3) return [];
  const scale = openness < 1 ? 0.6 + 0.4 * openness : Math.min(1.8, 1 + (openness - 1) * 1.5);
  const r = dotR * scale;
  const curves: Curve[] = [];

  // 1. Pupil dot
  const pupil: Vec3[] = [];
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * TAU;
    pupil.push([anchor[0] + Math.cos(a) * r, anchor[1] + Math.sin(a) * r, surfaceZ + 0.012]);
  }
  curves.push({ kind: 'feature', closed: true, points: pupil, fill: '#1a1410' });

  // 2. Upper lid line — a short arc above the dot, extending past it on both sides.
  if (lidLine > 0.05) {
    const lidHalfW = r * (1.6 + 0.6 * lidLine);
    const lidArc = r * (0.6 + 0.4 * lidLine);     // height of arc above center
    const lidY = anchor[1] + r * 0.5;              // baseline just above the pupil
    const samples = 14;
    const lid: Vec3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = anchor[0] - lidHalfW + 2 * lidHalfW * t;
      const y = lidY + lidArc * Math.sin(Math.PI * t);
      lid.push([x, y, surfaceZ + 0.010]);
    }
    curves.push({ kind: 'feature', closed: false, points: lid });
  }

  // 3. Eyelash hint — 2-3 short outward-angled ticks at the outer corner.
  if (lashes > 0.1) {
    const outerSign = isLeft ? -1 : 1;
    const lashStartX = anchor[0] + outerSign * r * 2.0;
    const lashStartY = anchor[1] + r * 0.9;
    const lashLen = r * (0.9 + 0.6 * lashes);
    const lashCount = 2 + Math.round(lashes * 1.5);   // 2-3 lashes
    for (let i = 0; i < lashCount; i++) {
      const t = i / Math.max(1, lashCount - 1);
      const startX = lashStartX - outerSign * r * 0.5 * t;
      const startY = lashStartY - r * 0.1 * t;
      const tipX = startX + outerSign * lashLen * 0.6;
      const tipY = startY + lashLen * 0.7;
      curves.push({
        kind: 'feature', closed: false,
        points: [
          [startX, startY, surfaceZ + 0.011],
          [tipX, tipY, surfaceZ + 0.011],
        ],
      });
    }
  }

  // 4. Under-eye tick — a short faint line BELOW THE PUPIL DOT, narrower than the dot.
  // Reads as a Hergé-style eye-bag tick (Castafiore, Tournesol). MUST be narrower than
  // the dot or it reads as a separate object (an earring).
  if (underlineHint > 0.1) {
    const ulHalfW = r * (0.6 + 0.3 * underlineHint);   // STAYS NARROWER than the dot's r
    const ulY = anchor[1] - r * (1.6 + 0.3 * underlineHint);
    const samples = 6;
    const ul: Vec3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = anchor[0] - ulHalfW + 2 * ulHalfW * t;
      const y = ulY + r * 0.08 * Math.sin(Math.PI * t);
      ul.push([x, y, surfaceZ + 0.010]);
    }
    curves.push({ kind: 'feature', closed: false, points: ul });
  }

  return curves;
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
  innerAnchor: Vec3, length: number, innerLift: number, outerLift: number,
  arch: number, fullness: number, surfaceZ: number, isLeft: boolean,
  style: 'split' | 'single',
): Curve[] => {
  const samples = 14;
  const dir = isLeft ? -1 : 1;
  const points = (yShift: number): Vec3[] => {
    const pts: Vec3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = innerAnchor[0] + dir * length * t;
      const baseY = innerAnchor[1] + (innerLift * (1 - t) + outerLift * t);
      const archY = arch * length * 0.16 * Math.sin(Math.PI * t);
      pts.push([x, baseY + archY + yShift, surfaceZ]);
    }
    return pts;
  };
  if (style === 'single') {
    // Single confident stroke (Hergé / ligne claire). Render as a closed filled shape with
    // a tapered profile rather than two parallel strokes; the stroke width is controlled
    // by `fullness`.
    const lineWidth = Math.max(0.006, fullness * 1.2);
    const top: Vec3[] = points(lineWidth / 2);
    const bot: Vec3[] = points(-lineWidth / 2);
    // For supporting-character variety, the stroke tapers slightly to outer end.
    // We close the shape so the renderer can fill it as a single confident dark mark.
    const poly: Vec3[] = [...top, ...bot.reverse()];
    return [{ kind: 'feature', closed: true, points: poly, fill: '#1a1410' }];
  }
  // 'split' = two slightly-offset parallel strokes (heavier, sketchier look).
  return [
    { kind: 'feature', closed: false, points: points(0) },
    { kind: 'feature', closed: false, points: points(-fullness * 4) },
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
  upperCurve: number, lipFullness: number, cornerMarks: boolean,
  labiomentalShow: number, surfaceZ: number,
): Curve[] => {
  const samples = 24;
  const half = width / 2;
  const curves: Curve[] = [];

  // Main mouth-seam line.
  const seam: Vec3[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = -half + width * t;
    const cw = Math.pow(Math.abs(t - 0.5) * 2, 1.6);
    const cornerY = cornerLift * cw;
    const bowPhase = (t - 0.5) * 6;
    const bow = Math.abs(t - 0.5) < 0.18
      ? -Math.cos(bowPhase) * width * 0.018 - width * 0.012
      : 0;
    const userBend = -upperCurve * width * 0.04 * Math.sin(Math.PI * t);
    const yOpen = openness * width * 0.18 * Math.sin(Math.PI * t);
    seam.push([center[0] + x, center[1] + cornerY + bow + userBend + yOpen, surfaceZ + 0.005]);
  }
  curves.push({ kind: 'feature', closed: false, points: seam });

  // LOWER LIP shadow — vermilion-skin transition. Per Leo §5 (Faigin 2012 §"The Lower Lip"):
  // the bottom edge of the lower lip BULGES DOWN in the centre and is nearly straight at
  // the corners. Previous code had the dip SIGN INVERTED (curving UP toward the seam),
  // which read as a "shelf" — Pascal's complaint.
  if (lipFullness > 0.1) {
    const lower: Vec3[] = [];
    const drop = width * (0.05 + 0.15 * lipFullness);
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = -half * 0.85 + width * 0.85 * t;
      // CORRECTED: dip is POSITIVE downward — centre hangs lower than corners.
      const dip = drop * Math.sin(Math.PI * t);
      const cornerY = cornerLift * Math.pow(Math.abs(t - 0.5) * 2, 1.6);
      // The lower lip baseline starts ~drop * 0.5 below the seam and dips further at centre.
      lower.push([
        center[0] + x,
        center[1] - drop * 0.5 - dip + cornerY - openness * width * 0.22 * Math.sin(Math.PI * t),
        surfaceZ + 0.003,
      ]);
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

  // LABIOMENTAL SULCUS — Faigin 2012 fig 5-12: a faint sulcus hint between the lower lip mound
  // and the chin button. Drawn as a SHORT slight smile-arc, NEVER a full parallel band.
  // Per Leo §5, this replaces the old `upperCurve = -0.15` "firmness" cheat on masc faces.
  if (labiomentalShow > 0.05) {
    const sulcusY = center[1] - width * (0.18 + 0.06 * labiomentalShow);
    const sulcusHalfW = width * 0.18 * labiomentalShow;
    const sulcusSamples = 8;
    const sulcus: Vec3[] = [];
    for (let i = 0; i <= sulcusSamples; i++) {
      const t = i / sulcusSamples;
      const x = -sulcusHalfW + 2 * sulcusHalfW * t;
      const y = sulcusY + width * 0.012 * Math.sin(Math.PI * t);   // very faint upward arc
      sulcus.push([center[0] + x, y, surfaceZ + 0.002]);
    }
    curves.push({ kind: 'feature', closed: false, points: sulcus });
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

// Per Leo §7 — Bridgman/Loomis ear: helix + antihelix Y-fork + tragus + lobe + tilt.
// Top of helix aligns with brow line, bottom of helix at nose-base line; lobe extends below.
// `skinFill` (when not null) is used to paint the ear blob as opaque skin so the C-arc
// reads as a bulge of the head silhouette rather than a thin line floating beside it.
const buildEar = (
  attachX: number, attachTopY: number, attachBottomY: number,
  protrusion: number, lobeDrop: number, antihelixShow: number,
  tragusShow: number, conchaShow: number, tilt: number,
  surfaceZ: number, isLeft: boolean,
  skinFill: string | null,
): Curve[] => {
  const dir = isLeft ? -1 : 1;
  const height = attachTopY - attachBottomY;
  const midY = (attachTopY + attachBottomY) / 2;
  // Backward tilt: tilt is the angle in radians the ear leans BACK (away from face front).
  // For our front view, "back" is +Z, but visually a backward tilt on a front-view face shows
  // the ear's top pushed slightly toward the rear-of-head (no x shift) AND a slight rotation
  // around the attach. We approximate with a small X shift: top inward, bottom outward.
  const tiltShift = height * Math.sin(tilt) * 0.15;
  const topX = attachX + dir * (-tiltShift);
  const bottomX = attachX + dir * (tiltShift * 0.6);

  // Outer helix curve: from top, sweeping outward by `protrusion`, around to bottom of helix.
  const helixTop: Vec3 = [topX, attachTopY, surfaceZ];
  const helixBottom: Vec3 = [bottomX, attachBottomY, surfaceZ];
  const outerMid: Vec3 = [attachX + dir * protrusion, midY + height * 0.05, surfaceZ];
  const c1Top: Vec3 = [attachX + dir * protrusion * 0.5, attachTopY - height * 0.08, surfaceZ];
  const c2Top: Vec3 = [attachX + dir * protrusion * 1.0, midY + height * 0.22, surfaceZ];
  const c1Bot: Vec3 = [attachX + dir * protrusion * 1.0, midY - height * 0.18, surfaceZ];
  const c2Bot: Vec3 = [attachX + dir * protrusion * 0.45, attachBottomY + height * 0.10, surfaceZ];
  const outer: Vec3[] = [helixTop];
  outer.push(...cubicBezier(helixTop, c1Top, c2Top, outerMid, 8));
  outer.push(...cubicBezier(outerMid, c1Bot, c2Bot, helixBottom, 8));

  // LOBE — Bridgman's "comma". A pendulous arc continuing from the helix bottom, hanging below.
  // 0 = no lobe (flat ear bottom); 1 = long lobe.
  const curves: Curve[] = [];
  if (lobeDrop > 0.02) {
    const lobeBottomY = attachBottomY - height * lobeDrop * 0.5;
    const lobeAttachX = bottomX + dir * 0.005;  // tucks slightly toward the face
    const lobeBottom: Vec3 = [lobeAttachX, lobeBottomY, surfaceZ];
    const lobeC1: Vec3 = [bottomX + dir * 0.025, attachBottomY - height * lobeDrop * 0.15, surfaceZ];
    const lobeC2: Vec3 = [bottomX + dir * 0.020, lobeBottomY + height * lobeDrop * 0.10, surfaceZ];
    outer.push(...cubicBezier(helixBottom, lobeC1, lobeC2, lobeBottom, 8));
    // Bring it back up the inside to the attach point (closing the silhouette internally)
    outer.push([lobeAttachX - dir * 0.005, lobeBottomY + 0.005, surfaceZ]);
  }
  // Ear-blob fill: SAME outer path closed back to start, painted with skin so the bulge
  // visually merges with the head silhouette skin fill (the ear reads as an attached lobe,
  // not a thin line dangling beside the head). noStroke avoids drawing the inner closing
  // line, which would otherwise show as a vertical mark across the temple.
  if (skinFill) {
    curves.push({
      kind: 'feature', closed: true, points: outer,
      fill: skinFill, noStroke: true,
    });
  }
  curves.push({ kind: 'feature', closed: false, points: outer });

  // ANTIHELIX — a Y-fork inside the ear (Bridgman). Single stem rising from mid-ear, branching
  // into two short prongs near the top. Strength scaled by antihelixShow.
  if (antihelixShow > 0.05) {
    const ahHeight = height * (0.35 + 0.20 * antihelixShow);
    const ahTopY = midY + ahHeight * 0.5;
    const ahBottomY = midY - ahHeight * 0.5;
    const ahX = attachX + dir * protrusion * 0.35;
    // Main stem (bottom to fork point)
    const forkY = midY + ahHeight * 0.15;
    const stem: Vec3[] = [
      [ahX, ahBottomY, surfaceZ + 0.005],
      [ahX + dir * 0.005, forkY, surfaceZ + 0.005],
    ];
    curves.push({ kind: 'feature', closed: false, points: stem });
    // Y-branches: two short curves up-and-out from the fork
    const branchLen = ahHeight * 0.35;
    const leftBranch: Vec3[] = [
      [ahX + dir * 0.005, forkY, surfaceZ + 0.005],
      [ahX - dir * 0.005, forkY + branchLen * 0.5, surfaceZ + 0.005],
      [ahX - dir * 0.010, ahTopY, surfaceZ + 0.005],
    ];
    const rightBranch: Vec3[] = [
      [ahX + dir * 0.005, forkY, surfaceZ + 0.005],
      [ahX + dir * 0.015, forkY + branchLen * 0.5, surfaceZ + 0.005],
      [ahX + dir * 0.020, ahTopY - branchLen * 0.10, surfaceZ + 0.005],
    ];
    curves.push({ kind: 'feature', closed: false, points: leftBranch });
    curves.push({ kind: 'feature', closed: false, points: rightBranch });
  }

  // TRAGUS — small flap covering the ear canal at the front. Tiny tick near the inner-front.
  if (tragusShow > 0.05) {
    const tragusY = midY - height * 0.10;
    const tragusInnerX = attachX + dir * 0.008;
    const tragusOuterX = attachX + dir * (0.008 + 0.015 * tragusShow);
    curves.push({
      kind: 'feature', closed: false, points: [
        [tragusInnerX, tragusY + height * 0.04, surfaceZ + 0.006],
        [tragusOuterX, tragusY, surfaceZ + 0.006],
        [tragusInnerX, tragusY - height * 0.04, surfaceZ + 0.006],
      ],
    });
  }

  // CONCHA — inner bowl shadow. A short curve below the antihelix fork suggesting the depth.
  if (conchaShow > 0.05) {
    const conchaY = midY - height * 0.05;
    const conchaSamples = 8;
    const concha: Vec3[] = [];
    for (let i = 0; i <= conchaSamples; i++) {
      const t = i / conchaSamples;
      const cx = attachX + dir * (0.020 + 0.015 * Math.sin(Math.PI * t));
      const cy = conchaY - height * 0.06 * Math.sin(Math.PI * t);
      concha.push([cx, cy, surfaceZ + 0.004]);
    }
    curves.push({ kind: 'feature', closed: false, points: concha });
  }

  return curves;
};

// Hair — per Leo's pass-3 research (`research/hair-tooling.md`).
//
// SYMBOLIC TREE (universal sub-tree, every school):
//   mass  → outer silhouette (closed shape, slight lift above cranium)
//   boundary → hairline (front), implicit (side/back)
//   topology → crown + ONE parting curve, optional
//   interior → ONE characterization stroke (forelock flick for Hergé/parted,
//              hatching set for Caniff, fringe wedge for manga — we do the
//              Tintin/parted variant in this pass)
//
// Three primitives carry the load: mass silhouette (fill polygon),
// parting curve (feature-ink stroke), one characterization stroke (feature-ink).
//
// PROHIBITED (Leo's STOP flags): more than ~3 interior ink strokes; per-strand
// lines; hairline as the load-bearing characterization line; flat-fill wedge as
// the only mass primitive.
const buildHair = (
  rx: number, ry: number, rz: number, sx: number, browY: number, headHeight: number,
  style: FaceParams['hair']['style'], frontShape: FaceParams['hair']['frontShape'],
  forehead: number, volume: number, fillColor: string | null,
  templeRecession: number, sideFall: number, crownPeakX: number,
  napeExtension: number, edgeKind: FaceParams['hair']['edgeKind'],
  recipe: FaceParams['hair']['recipe'],
): Curve[] => {
  if (style === 'none' || style === 'bald') return [];

  const curves: Curve[] = [];
  const lift = volume * headHeight;
  const lengthMul = style === 'long' ? 1 : style === 'medium' ? 0.7 : 0.4;
  const effectiveLift = lift * lengthMul;

  // Where the cranium silhouette meets the side plane (the temple corner).
  const sideTheta = Math.acos(Math.min(1, sx / rx));
  const templeY = ry * Math.sin(sideTheta);

  // ---- MASS SILHOUETTE: closed envelope with 5 additive deformations (Leo §8.2).
  // t goes 0..1 over the dome arc, theta = t·π. The base is a half-ellipse; each
  // knob is an additive Δx / Δy at the right t-band so the knobs are orthogonal.
  const topSamples = 80;
  const topSil: Vec3[] = [];
  const startY = templeY - headHeight * 0.02;
  const recessionMag = templeRecession * headHeight * 0.08;
  const sideFallMag = sideFall * headHeight * 0.35;
  const peakXOffset = crownPeakX * rx;
  // Gaussian-like temple-band influence centered at t=0.18 and t=0.82 (the temples).
  const tempInfluence = (t: number): number => {
    const left = Math.exp(-Math.pow((t - 0.18) / 0.07, 2));
    const right = Math.exp(-Math.pow((t - 0.82) / 0.07, 2));
    return left + right;
  };
  // edgeKind: small periodic modifiers on the outer envelope.
  const edgeJitter = (t: number): number => {
    if (edgeKind === 'crowSnipped') {
      // Choppy ends — high-frequency Y wobble across the front of the dome (t in 0.1..0.9).
      const window = Math.sin(Math.PI * t);          // 0 at edges, 1 mid
      return headHeight * 0.012 * window * Math.sin(t * 38);
    }
    if (edgeKind === 'flicked') {
      // ONE outward bump near the right temple — Hergé forelock at the silhouette edge.
      const bump = Math.exp(-Math.pow((t - 0.22) / 0.05, 2));
      return -headHeight * 0.035 * bump;             // negative-y = OUTWARD (up/forward)
    }
    if (edgeKind === 'spiked') {
      // Shounen silhouette teeth — 6 triangular spikes spanning nearly the
      // full silhouette (first-pass had a smooth dome shoulder either side of
      // the spike band; real shounen hair like Goku/Zoro spikes all the way to
      // the temples). Each tooth is a sharp triangle ~9% headHeight tall.
      // Per Leo pass-3 §4 / pass-5 §4.5; pedagogy: Crilley 2012 vol.1 shounen ch.
      if (t < 0.05 || t > 0.95) return 0;
      const spikes = 6;
      const span = 0.90;
      const local = (t - 0.05) / span * spikes;       // 0..spikes across the top band
      const inSpike = local - Math.floor(local);      // 0..1 within current spike
      // Asymmetric triangle: rises in first 65% of each tooth (the long lean
      // direction), falls in last 35%. Off-centre peak gives a slight
      // direction-of-styling lean.
      const tri = inSpike < 0.65 ? inSpike / 0.65 : (1 - inSpike) / 0.35;
      return -headHeight * 0.090 * tri;               // negative-y = outward (taller now)
    }
    if (edgeKind === 'edgeTextured') {
      // Coily-canon arc bumps — small repeated outward bumps with a higher
      // frequency than crowSnipped and consistent across the whole dome (the
      // entire halo is textured, not just the front). Per Leo pass-2 §1 +
      // hair-theorist HT-1: coily silhouettes are textured ALL the way around;
      // distinguishes the look from a smooth dome with chop on top.
      // Amplitude bumped after first-pass render — 0.022 was visually subtle;
      // 0.045 reads clearly as coily texture rather than wave noise.
      const phase = t * Math.PI;
      const window = Math.max(0.5, Math.sin(phase));
      const bump = 0.7 + 0.3 * Math.cos(t * 24.0);    // bias positive so bumps stack outward
      return -headHeight * 0.045 * window * bump;
    }
    return 0;
  };
  for (let i = 0; i <= topSamples; i++) {
    const t = i / topSamples;
    const theta = t * Math.PI;
    const domeT = Math.sin(theta);
    // 1. Base ellipsoidal half-arc.
    let x = sx * Math.cos(theta);
    let y = startY + (ry - startY) * domeT + effectiveLift * domeT;
    // 2. crownPeakX — shift apex toward forehead (+) or nape (−), proportional to dome height.
    x += peakXOffset * domeT;
    // 3. templeRecession — dip Y down + tuck X inward at the temple bands.
    const tinf = tempInfluence(t);
    y -= recessionMag * tinf;
    x += recessionMag * 0.5 * tinf * (t < 0.5 ? 1 : -1);   // inward (positive at left temple t<0.5)
    // 4. sideFall — drop Y below templeY at t∈[0, 0.06] and t∈[0.94, 1].
    if (t < 0.06) {
      y -= sideFallMag * (1 - t / 0.06);
    } else if (t > 0.94) {
      y -= sideFallMag * ((t - 0.94) / 0.06);
    }
    // 5. edgeKind — discrete edge modifier.
    y += edgeJitter(t);
    // Natural sub-millimeter wobble (independent of knobs; baseline ink-life).
    const naturalWobble = headHeight * 0.003 * Math.sin(t * 11.7);
    y += naturalWobble * domeT;
    topSil.push([x, y, 0]);
  }
  // napeExtension — extends the rear lower envelope toward the neck. In FRONT view
  // (yaw=0, pitch=0) this is barely visible; reserved for future 3/4 + back rendering
  // so the param shape is stable in the meantime.
  void napeExtension;

  // ---- HAIRLINE (boundary): one confident arc; widow's-peak adds a subtle V hint,
  // receding raises the line overall. Per Leo STOP #3, the hairline is a boundary,
  // not the subject — characterization lives in the mass and the parting above.
  const hairlineY = browY + (ry - browY) * Math.max(0.05, Math.min(1, forehead));
  const uPos = hairlineY / ry;
  const ellipseHalfAtY = rx * Math.sqrt(Math.max(0, 1 - uPos * uPos));
  const reachX = Math.min(sx, ellipseHalfAtY) * 0.78;
  const hairSamples = 32;
  const hairline: Vec3[] = [];
  const surfZ = (x: number, y: number): number => {
    const w = x / rx, v = y / ry;
    const k = 1 - w * w - v * v;
    return k > 0 ? rz * Math.sqrt(k) + 0.020 : 0.020;
  };
  const isReceding = frontShape === 'receding';
  const peakHint = frontShape === 'widows-peak' ? headHeight * 0.018 : 0;
  // Per Pascal (round 5): the hairline reads as a constructed clean arc. Real hair
  // doesn't form a perfect curve at the forehead — small irregularities suggest
  // strand boundary against skin. Sub-millimeter Y wobble with two frequencies,
  // amplitude masked by Math.sin(Math.PI * t) so the temples stay clean and the
  // irregularity concentrates over the centre of the hairline.
  for (let i = 0; i <= hairSamples; i++) {
    const t = i / hairSamples;
    const x = -reachX + 2 * reachX * t;
    const baseArc = -headHeight * 0.012 * (1 - Math.sin(Math.PI * t));
    const distFromCenter = Math.abs(t - 0.5);
    const peakDip = peakHint && distFromCenter < 0.08
      ? peakHint * (1 - distFromCenter / 0.08)
      : 0;
    const recess = isReceding ? headHeight * 0.07 : 0;
    const irregularity = headHeight * 0.008 * Math.sin(Math.PI * t) *
      (Math.sin(t * 17.3) * 0.6 + Math.sin(t * 31.7) * 0.4);
    const y = hairlineY + baseArc - peakDip + recess + irregularity;
    hairline.push([x, y, surfZ(x, y)]);
  }

  // Mass cap as a filled closed polygon. noStroke = true; the visible top edge is
  // rendered as a SEPARATE inked stroke (next), so the cap reads as drawn rather
  // than as a flat fill region.
  // Per Leo pass 7 §10: drop the cap polygon for short / medium / long.
  // EXCEPTION: when edgeKind extends the silhouette outward (spiked,
  // edgeTextured), the silhouette OUTLINE draws an empty extended region
  // (spikes / coily bumps) with no fill. Strokes don't reach into those
  // extensions. Keep the fill for those cases so the silhouette is
  // visually filled. No shadow band, no highlight (those were brim hacks).
  const drawCap = edgeKind === 'spiked' || edgeKind === 'edgeTextured';
  if (fillColor && drawCap) {
    const cap: Vec3[] = [...topSil, ...hairline];
    curves.push({
      kind: 'feature', closed: true, points: cap,
      role: 'hair-top', fill: fillColor, noStroke: true,
    });

    // SHADOW REGION — darker tone painted over the LOWER portion of the cap to
    // give the mass real weight. Without this the hair reads as a flat color
    // shape regardless of how good the silhouette is. Pedagogy: Eisner 1985
    // "Modelling"; Toth uses shadow regions as a primary mass cue.
    //
    // The shadow polygon is constructed by taking the hairline as its lower
    // edge and a ~40%-up-the-cap interior contour as its upper edge. The contour
    // is computed by lerping each topSil point toward the matching hairline
    // point (matched by X within the cap span).
    const shadowColor = darken(fillColor, 0.30);
    const shadowUpperEdge: Vec3[] = [];
    // For each hairline point, find the topSil point at roughly the same X and
    // lerp 40% up from hairline toward topSil. (The hairline runs left-to-right
    // and topSil runs right-to-left; the cap polygon order means we walk
    // topSil first then hairline.)
    for (let i = 0; i < hairline.length; i++) {
      const h = hairline[i] as Vec3;
      // Find nearest topSil point by X.
      let bestJ = 0;
      let bestDx = Infinity;
      for (let j = 0; j < topSil.length; j++) {
        const t = topSil[j] as Vec3;
        const dx = Math.abs(t[0] - h[0]);
        if (dx < bestDx) { bestDx = dx; bestJ = j; }
      }
      const top = topSil[bestJ] as Vec3;
      const lerp = 0.40;
      const x = h[0] + (top[0] - h[0]) * lerp;
      const y = h[1] + (top[1] - h[1]) * lerp;
      const z = h[2] + (top[2] - h[2]) * lerp;
      shadowUpperEdge.push([x, y, z]);
    }
    // Polygon: lower edge = hairline (left-to-right), upper edge = the interior
    // contour reversed (right-to-left). Closing makes the bottom band of the
    // cap fill with the shadow color.
    const shadowPoly: Vec3[] = [...hairline, ...[...shadowUpperEdge].reverse()];
    curves.push({
      kind: 'feature', closed: true, points: shadowPoly,
      fill: shadowColor, noStroke: true,
    });

    // HIGHLIGHT BAND — lighter tone painted as a small lens/band on the top-
    // front-quarter of the cap. Comic-art convention: catch-light at the
    // strongest curve closest to the light source. Reads as a specular hint
    // without dropping into per-strand drawing (Leo STOP #2).
    //
    // Implemented as a sliver between two short adjacent arcs near the top of
    // topSil: pick a band of ~6 sample points around t=0.30 (left of crown),
    // and a lower curve offset down toward the cap interior.
    const highlightColor = lighten(fillColor, 0.18);
    const highlightStart = Math.floor(topSil.length * 0.22);
    const highlightEnd = Math.floor(topSil.length * 0.38);
    if (highlightEnd > highlightStart + 2) {
      const upperBand = topSil.slice(highlightStart, highlightEnd);
      const lowerBand: Vec3[] = upperBand.map((p) => {
        // Offset each point inward toward the centre of the cap by a small fraction.
        const inwardY = -headHeight * 0.025;
        const inwardX = -p[0] * 0.10;
        return [p[0] + inwardX, p[1] + inwardY, p[2]];
      });
      const highlightPoly: Vec3[] = [...upperBand, ...lowerBand.reverse()];
      curves.push({
        kind: 'feature', closed: true, points: highlightPoly,
        fill: highlightColor, noStroke: true,
      });
    }
  }

  // Mass silhouette OUTLINE as inked stroke (perfect-freehand): confident, slightly
  // tapered at the temples. This replaces the uniform thin polyline that previously
  // outlined the cap. Per Leo SM-2 (pass 6): SUPPRESS for style='long' — the
  // outline is what makes long-hair renders read as "cap with wisps." The fill
  // stays; the strokes bridge into the fill (no boundary line).
  if (style !== 'long') {
    curves.push({
      kind: 'feature-ink', closed: false, points: topSil,
      role: 'hair-top',
      ink: { size: 1.5, taperStart: 0.10, taperEnd: 0.10, pressureMid: 0.95 },
    });
  }

  // Hairline as a discrete inked stroke (skipped on receding so there's no scar across
  // the bald forehead; skipped on long because the forelock strokes cover the forehead
  // and a hairline arc would draw a stray horizontal line through them).
  if (!isReceding && style !== 'long') {
    curves.push({
      kind: 'feature-ink', closed: false, points: hairline,
      ink: { size: 0.9, taperStart: 0.25, taperEnd: 0.25, pressureMid: 0.70 },
    });
  }

  // ---- TOPOLOGY + INTERIOR: driven by the recipe (Leo pass 5 §4.7).
  // Previously hardcoded "parting curve + 2 flow flicks." Now the recipe field
  // on FaceParams.hair carries a PartingKind enum + an explicit FlowStroke[]
  // array, so different hairstyles (Pompadour, spike, bob, ...) compose
  // different interior arrangements without touching buildHair.
  //
  // Receding hair suppresses ALL interior strokes (parting + flows) — drawing
  // them on a bald scalp reads as scratches (preserved from prior behaviour).
  const drawInteriorStrokes = !isReceding;

  // PartingKind → continuous partingX on the scalp (hair-theorist HT-2:
  // parting is mechanically a continuous locus; the enum is the user surface).
  const partingXForKind = (kind: typeof recipe.parting): number | null => {
    switch (kind) {
      case 'none':       return null;
      case 'sweptBack':  return null;        // mass flows up+back; no parting line
      case 'centre':     return 0;
      case 'sideL':      return -rx * 0.10;
      case 'sideR':      return  rx * 0.10;
      case 'deepSideL':  return -rx * 0.32;
      case 'deepSideR':  return  rx * 0.32;
    }
  };
  const partingX = drawInteriorStrokes ? partingXForKind(recipe.parting) : null;

  // Long hair: skip the explicit parting curve — the stroke clumps create
  // the visible parting naturally (gap between two clump regions).
  if (partingX !== null && style !== 'long') {
    const partingTopY = ry * 0.92;
    const partingBottomY = hairlineY + headHeight * 0.02;
    const partingPts: Vec3[] = [];
    const partSamples = 14;
    for (let i = 0; i <= partSamples; i++) {
      const t = i / partSamples;
      // Slight forward sweep (x moves toward face center as we descend toward forehead).
      const x = partingX * (1 - 0.4 * t);
      const y = partingTopY + (partingBottomY - partingTopY) * t;
      partingPts.push([x, y, surfZ(x, y)]);
    }
    // Parting CHANNEL: a slightly-darker stroke that reads as a visible groove in the
    // hair mass. Pascal feedback (4/10 round): the parting line was there but dark-on-dark
    // and disappeared. Render it at 2× the normal line weight and very confident so it
    // reads as a structural break, not a stray scratch.
    curves.push({
      kind: 'feature-ink', closed: false, points: partingPts,
      ink: { size: 3.0, taperStart: 0.20, taperEnd: 0.35, pressureMid: 1.0, color: '#000000' },
    });
  }

  // ---- INTERIOR characterization: flow strokes from the recipe (Leo pass 5 §4.7).
  // Each FlowStroke is start/end XY in cranium-radius ratios; renderer sweeps along
  // the cranial surface with cubic ease and per-stroke ink weight. Pascal-validated
  // black colour so dark hair doesn't swallow the strokes (round 5 feedback).
  // Suppressed for 'receding' (bald scalp).
  if (drawInteriorStrokes) {
    const flowSamples = 14;
    for (const fs of recipe.flowStrokes) {
      const sx = fs.startX * rx;
      const sy = fs.startY * ry;
      const ex = fs.endX * rx;
      const ey = fs.endY * ry;
      const pts: Vec3[] = [];
      for (let i = 0; i <= flowSamples; i++) {
        const t = i / flowSamples;
        const ease = t * t * (3 - 2 * t);
        const x = sx + (ex - sx) * ease;
        const y = sy + (ey - sy) * t;
        pts.push([x, y, surfZ(x, y)]);
      }
      curves.push({
        kind: 'feature-ink', closed: false, points: pts,
        ink: {
          size: fs.size, taperStart: 0.55, taperEnd: 0.45,
          pressureMid: fs.pressureMid, color: '#000000',
        },
      });
    }
  }

  // ---- EXPERIMENT (user's "stop bucket-filling, draw FLOWING strands"):
  // Long hair built as TWO LAYERS:
  //   1. A "fall" polygon hanging from each temple down past the chin —
  //      provides the dark mass that lets the hair register as actual hair
  //      instead of wisps over a face. Filled with hairFill, no stroke
  //      (otherwise we get a hat-like polygon outline).
  //   2. Dense, varied flow strokes ON TOP, traced through the cranial field —
  //      provide the strand texture and direction, plus escape strokes that
  //      extend past the polygon boundary as wisps.
  //
  // Per user: every parameter randomized via deterministic seeded RNG. Stroke
  // length, thickness, pressure, taper, seed position all vary.
  // Per Leo pass 7 §10: strokes-as-mass extends to short and medium too.
  // The cap-cluster oscillation was structural — the same flat cap polygon
  // underlying all 4 short styles was the bug. Strokes only, all lengths.
  // Length range and gravity vary by style:
  //   short  — clumps 0.18-0.50 long, low gravity (mass hugs scalp)
  //   medium — clumps 0.40-1.10 long, medium gravity (chin-length fall)
  //   long   — clumps 0.45-2.25 long, high gravity (curtain past shoulders)
  if (style !== 'none' && style !== 'bald' && fillColor) {
    // Style-dependent stroke generation parameters.
    const isLong = style === 'long';
    const isMedium = style === 'medium';
    const gravity = isLong ? 1.1 : isMedium ? 0.8 : 0.5;
    // Short strokes still need enough length to extend from the crown DOWN
    // to the hairline — too short and the result is "scribble on the very
    // top of the head" (per the first short-pass iteration).
    const lengthMin = isLong ? 0.45 : isMedium ? 0.40 : 0.45;
    const lengthSpread = isLong ? 1.80 : isMedium ? 0.70 : 0.55;
    // Short hair clumps stay UP TOP — no side-curtain seeds (no hair on sides).
    // Medium gets some side seeds. Long gets full side coverage.
    const sideSeedShare = isLong ? 0.50 : isMedium ? 0.25 : 0.0;
    const field = cranialField(rx, ry, rz, {
      crown: { u: 0, v: 0.85 * Math.PI / 2 },
      gravity,
    });
    // Mulberry32 seeded RNG — deterministic, no per-call drift. Seed should
    // come from style.jitterSeed eventually; hardcoded 1 for the experiment
    // (changing the seed re-shuffles the hair without changing the recipe).
    let rngState = 1 >>> 0;
    const rng = (): number => {
      rngState = (rngState + 0x6d2b79f5) >>> 0;
      let t = rngState;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    // Per-hairstyle waviness: how much each stroke deviates perpendicularly
    // from the field direction. 0 = straight (flat hair), 0.04-0.07 = wavy,
    // 0.10+ = very curly. Sourced from a new optional recipe field (added
    // below); default is straight.
    const waviness = recipe.waviness ?? 0;
    const waveFrequency = recipe.waveFrequency ?? 3.5;  // cycles per stroke
    const addWaviness = (pts: Vec3[], amp: number, freq: number, phase: number): Vec3[] => {
      if (amp === 0 || pts.length < 3) return pts;
      const out: Vec3[] = [];
      for (let i = 0; i < pts.length; i++) {
        const t = pts.length === 1 ? 0 : i / (pts.length - 1);
        const p = pts[i] as Vec3;
        // Tangent (XY component) for perpendicular direction.
        const prev = pts[Math.max(0, i - 1)] as Vec3;
        const next = pts[Math.min(pts.length - 1, i + 1)] as Vec3;
        const tx = next[0] - prev[0];
        const ty = next[1] - prev[1];
        const len = Math.hypot(tx, ty) || 1;
        // Perpendicular in XY (rotate tangent 90°).
        const px = -ty / len;
        const py = tx / len;
        // Envelope: 0 at endpoints, max at middle, so the stroke connects to
        // its origin point cleanly and tapers the wave at the tip.
        const env = Math.sin(Math.PI * t);
        const w = amp * env * Math.sin(freq * Math.PI * t + phase);
        out.push([p[0] + px * w, p[1] + py * w, p[2]]);
      }
      return out;
    };
    // CLUMPING TOPOLOGY (Leo pass 6 §9.5): instead of independent stroke seeds,
    // generate ~28 clump centres on the scalp; each centre spawns 6-20 strokes
    // drawn from a tight gaussian around it, with CORRELATED properties
    // (length, phase, base thickness) so the clump reads as one ringlet/lock
    // rather than as many independent strands. This simultaneously addresses
    // the longCurly chaos (each clump = coherent curl group), edge-of-mass
    // darkening (clumps stack ink at their boundaries), and the missing
    // dominant-lock signal (long-tail clump-size distribution).
    //
    // Per Leo SM-1: total stroke ceiling ~450. Per SM-4: phase is DISCRETE per
    // clump (each stroke belongs to exactly one clump), not derived from
    // continuous position math.
    // Short needs MORE clumps because each stroke is much shorter — fewer
    // pixels covered per stroke means we need more strokes for the same
    // visual density. Leo pass 7 §10 + CC-3.
    const clumpCount = isLong ? 28 : isMedium ? 36 : 50;
    for (let c = 0; c < clumpCount; c++) {
      // ---- Per-clump correlated properties (rolled ONCE per clump).
      let centreU: number;
      let centreV: number;
      const sideRoll = rng();
      const frontShare = 1.0 - sideSeedShare;
      if (sideRoll < frontShare) {
        // Front-of-scalp clumps — start near the CROWN (v close to PI/2).
        centreU = (rng() + rng() - 1) * Math.PI * 0.55;
        centreV = 0.78 * Math.PI / 2 + (rng() - 0.5) * 0.30 * Math.PI / 2;
      } else if (sideRoll < frontShare + sideSeedShare * 0.5) {
        // Right-side clumps (long/medium only).
        centreU = (0.55 + rng() * 0.35) * Math.PI / 2;
        centreV = (0.30 + rng() * 0.55) * Math.PI / 2;
      } else {
        // Left-side clumps.
        centreU = -(0.55 + rng() * 0.35) * Math.PI / 2;
        centreV = (0.30 + rng() * 0.55) * Math.PI / 2;
      }
      const lengthBase = lengthMin + rng() * rng() * lengthSpread;
      // Per-clump thickness — triple-pull rng^3 distribution gives a long tail
      // so ~10% of clumps are visibly heavier "dominant locks."
      const sizeBase = 0.6 + rng() * rng() * rng() * 4.5;
      // Clump phase — SHARED across all strokes in the clump so the clump
      // waves as a unit.
      const clumpPhase = rng() * Math.PI * 2;
      const strokesPerClump = 6 + Math.floor(rng() * 14);
      const clumpSpreadU = 0.06 + rng() * 0.10;
      const clumpSpreadV = 0.05 + rng() * 0.08;

      for (let s = 0; s < strokesPerClump; s++) {
        const offU = (rng() + rng() - 1) * clumpSpreadU * Math.PI;
        const offV = (rng() + rng() - 1) * clumpSpreadV * Math.PI;
        const u = centreU + offU;
        const v = centreV + offV;
        const length = lengthBase * (0.78 + rng() * 0.44);     // ±22% intra-clump
        const size = sizeBase * (0.60 + rng() * rng() * 1.00); // intra-clump variance
        const pressureMid = 0.65 + rng() * 0.30;
        const surfaceOffset = 0.018 + rng() * 0.012;
        // SHORT hair: clip front-region strokes at hairline (otherwise hair
        // covers the forehead, which short hair shouldn't). Side-region strokes
        // and medium/long strokes are NOT clipped — they're expected to fall
        // past the temples (bob, long-side-curtain).
        const stopAt = (isLong || isMedium) ? undefined : (pt: Vec3): boolean => {
          // Only apply hairline clip to strokes seeded near the front (u near 0).
          // Side-seeded strokes (u near ±PI/2) get no clip even on short.
          if (Math.abs(centreU) > Math.PI * 0.40) return false;
          let bestY = hairlineY;
          let bestDist = Infinity;
          for (const h of hairline) {
            const dist = Math.abs(h[0] - pt[0]);
            if (dist < bestDist) { bestDist = dist; bestY = h[1]; }
          }
          return pt[1] < bestY - headHeight * 0.005;
        };
        const rawStroke = clumpStroke(field, { u, v }, length, 28, surfaceOffset, stopAt);
        if (rawStroke.length < 4) continue;
        const ampJitter = waviness * (0.75 + rng() * 0.50);
        const freqJitter = waveFrequency * (0.9 + rng() * 0.2);
        const stroke = addWaviness(rawStroke, ampJitter, freqJitter, clumpPhase);
        curves.push({
          kind: 'feature-ink', closed: false, points: stroke,
          ink: {
            size, taperStart: 0.02 + rng() * 0.06, taperEnd: 0.25 + rng() * 0.40,
            pressureMid, color: fillColor,
          },
        });
      }
    }
  }

  // (Old short-hair stroke-texture overlay + escape-strokes block deleted
  // per Leo pass 7 CC-3. The unified strokes-as-mass loop above now handles
  // all style lengths.)

  return curves;
};

type MustacheShape = {
  baseOffset: number;
  rise: number;
  width: number;        // bell-curve coefficient (smaller = wider hump)
  philtrumWidth: number;
  philtrumDepth: number;
};

const buildFacialHair = (
  jawCurvePts: Vec3[],         // the jaw silhouette as a list of 3D points (cheekL → chin → cheekR)
  cheekL: Vec3, cheekR: Vec3,  // jaw endpoints
  mouthY: number,              // where the mouth sits (for mustache placement)
  style: FaceParams['facialHair']['style'],
  length: number, fullness: number, color: string,
  mustache: MustacheShape,
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
      // Single continuous beard-with-mustache: top edge sits at `mustache.baseOffset` above the
      // mouth at the corners and bulges UP in the middle (a bell curve controlled by
      // `mustache.width`) by `mustache.rise`, with a narrower central dip (controlled by
      // `mustache.philtrumWidth` and `philtrumDepth`) at the philtrum.
      const baseY = mouthY + mustache.baseOffset;
      // 'fullRound' is the same shape with a higher rise by convention.
      const rise = style === 'fullRound' ? mustache.rise * 1.4 : mustache.rise;
      const samples = 28;
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const x = cheekR[0] + (cheekL[0] - cheekR[0]) * t;
        const centerWeight = Math.exp(-Math.pow((t - 0.5) * mustache.width, 2));
        const philtrumDip = Math.exp(-Math.pow((t - 0.5) * mustache.philtrumWidth, 2)) * rise * mustache.philtrumDepth;
        const y = baseY + rise * centerWeight - philtrumDip;
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
    // The mustache is built as a HEAVY ELLIPSE under the nose (covering the philtrum and upper
    // lip) plus, for handlebar, two SEPARATE curling tail shapes at the ends. This avoids the
    // single-horizontal-band shape that read as a "smile."
    const mustacheY = mouthY + 0.045;
    const isHandlebar = style === 'handlebar';
    const bodyHalfW = 0.085;
    const bodyHeightTop = 0.020;
    const bodyHeightBot = 0.030;
    // Body ellipse: thicker in the center, tapering at the corners — but never pinching to
    // zero thickness (otherwise the polygon collapses at the ends and the fill becomes invisible).
    const samples = 24;
    const top: Vec3[] = [];
    const bot: Vec3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = -bodyHalfW + bodyHalfW * 2 * t;
      const dipShape = Math.sin(Math.PI * t);   // 0 at ends, 1 at center
      // Keep 40% baseline thickness at ends; 100% at center.
      const taper = 0.4 + 0.6 * dipShape;
      const yTop = mustacheY + bodyHeightTop * taper;
      const yBot = mustacheY - bodyHeightBot * taper;
      top.push([x, yTop, 0.1]);
      bot.push([x, yBot, 0.1]);
    }
    const stachePoly: Vec3[] = [...top, ...bot.reverse()];
    curves.push({ kind: 'feature', closed: true, points: stachePoly, fill: color });
    curves.push({ kind: 'feature', closed: true, points: stachePoly });

    // Handlebar tails: small curl shapes at each end, going UP and outward.
    if (isHandlebar) {
      const mkCurl = (sign: number): Vec3[] => {
        const startX = sign * bodyHalfW;
        const startY = mustacheY;
        // Curl reaches outward and up; thin teardrop shape.
        const tipX = sign * (bodyHalfW + 0.035);
        const tipY = startY + 0.040;
        const ctrlBackX = sign * (bodyHalfW + 0.015);
        const ctrlBackY = startY + 0.045;
        // Outline: start → outer-back-of-curl (top) → tip → back to start (bottom)
        const pts: Vec3[] = [
          [startX, startY, 0.1],
          [sign * (bodyHalfW + 0.025), startY + 0.020, 0.1],
          [ctrlBackX, ctrlBackY, 0.1],
          [tipX, tipY, 0.1],
          [sign * (bodyHalfW + 0.020), startY + 0.005, 0.1],
        ];
        return pts;
      };
      const leftCurl = mkCurl(-1);
      const rightCurl = mkCurl(1);
      curves.push({ kind: 'feature', closed: true, points: leftCurl, fill: color });
      curves.push({ kind: 'feature', closed: true, points: leftCurl });
      curves.push({ kind: 'feature', closed: true, points: rightCurl, fill: color });
      curves.push({ kind: 'feature', closed: true, points: rightCurl });
    }
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

// Per Leo §5 (Bridgman 1920 §"The Neck"): cylinder + SCM V + trapezius wedge + optional Adam's apple.
// SCM origins are the MASTOID (behind/below ear), not the chin corner — Bridgman is explicit.
const buildNeck = (
  mastoidL: Vec3, mastoidR: Vec3,         // SCM origins behind the ear
  underjawL: Vec3, underjawR: Vec3,       // where cylinder front edge meets jaw underside
  cylinderRadius: number,
  trapWidthAtBase: number,
  trapFlareStart: number,                  // 0..1 along neck length
  neckLength: number,
  scmShow: number,
  trapShow: number,
  laryngealProminence: number,
): Curve[] => {
  const curves: Curve[] = [];
  const topY = underjawL[1];
  const bottomY = topY - neckLength;
  const flareY = topY - trapFlareStart * neckLength;
  const trapHalfW = trapWidthAtBase / 2;

  // CYLINDER outline — two side curves descending from the underjaw, flaring outward starting at flareY.
  // Inside cylinderRadius: width constant for top portion, then ramps to trapHalfW at bottom.
  const samples = 14;
  const sideCurve = (sign: 1 | -1, top: Vec3): Vec3[] => {
    const cylinderEdgeX = sign * cylinderRadius;
    const bottomX = sign * trapHalfW;
    const startTrap: Vec3 = [cylinderEdgeX, flareY, top[2] * 0.5];
    const end: Vec3 = [bottomX, bottomY, top[2] * 0.3];
    // Top segment: from underjaw down to start-of-flare, mostly straight.
    const segA = cubicBezier(
      top,
      [cylinderEdgeX * 0.6 + top[0] * 0.4, top[1] - neckLength * 0.20, top[2]],
      [cylinderEdgeX, top[1] - neckLength * 0.35, top[2] * 0.8],
      startTrap,
      samples / 2, 1,
    );
    // Bottom segment: flare outward to trap width.
    const segB = cubicBezier(
      startTrap,
      [cylinderEdgeX + (bottomX - cylinderEdgeX) * 0.15, flareY - neckLength * 0.15, startTrap[2] * 0.7],
      [cylinderEdgeX + (bottomX - cylinderEdgeX) * 0.50, flareY - neckLength * 0.30, startTrap[2] * 0.4],
      end,
      samples / 2, 1,
    );
    return [top, ...segA, ...segB];
  };
  curves.push({ kind: 'feature', closed: false, points: sideCurve(-1, underjawL) });
  curves.push({ kind: 'feature', closed: false, points: sideCurve(1, underjawR) });

  // SCM V — two short construction-style strokes from each mastoid descending to the sternal
  // notch (point on the front midline below the cylinder top). Bridgman: "the most important
  // construction line of the neck." Rendered subtle by default.
  if (scmShow > 0.05) {
    const sternalY = flareY + (bottomY - flareY) * 0.10;   // notch sits just above clavicle line
    const sternalNotch: Vec3 = [0, sternalY, cylinderRadius * 0.5];
    const scmSamples = 10;
    const scmCurve = (mastoid: Vec3): Vec3[] => {
      const pts: Vec3[] = [];
      for (let i = 0; i <= scmSamples; i++) {
        const t = i / scmSamples;
        // Gentle ease toward the notch
        const x = mastoid[0] + (sternalNotch[0] - mastoid[0]) * t;
        const y = mastoid[1] + (sternalNotch[1] - mastoid[1]) * t;
        const z = mastoid[2] + (sternalNotch[2] - mastoid[2]) * t;
        pts.push([x, y, z]);
      }
      return pts;
    };
    curves.push({ kind: 'feature', closed: false, points: scmCurve(mastoidL) });
    curves.push({ kind: 'feature', closed: false, points: scmCurve(mastoidR) });
  }

  // TRAPEZIUS wedge — diverging from the side cylinder at flareY, descending to acromion
  // (shoulder corner). Two short curves on either side, slightly outside the cylinder outline.
  if (trapShow > 0.05) {
    const acromionL: Vec3 = [-trapHalfW * 1.05, bottomY, 0];
    const acromionR: Vec3 = [trapHalfW * 1.05, bottomY, 0];
    const trapStartL: Vec3 = [-cylinderRadius * 1.02, flareY, 0];
    const trapStartR: Vec3 = [cylinderRadius * 1.02, flareY, 0];
    const trapCurve = (start: Vec3, end: Vec3): Vec3[] => {
      return [start, ...cubicBezier(
        start,
        [start[0] * 1.05, start[1] - neckLength * 0.20, 0],
        [end[0] * 0.85, end[1] + neckLength * 0.10, 0],
        end,
        10, 1,
      )];
    };
    curves.push({ kind: 'feature', closed: false, points: trapCurve(trapStartL, acromionL) });
    curves.push({ kind: 'feature', closed: false, points: trapCurve(trapStartR, acromionR) });
  }

  // Adam's apple tick — small horizontal mark on the front midline, masculine convention.
  if (laryngealProminence > 0.005) {
    const adamY = topY - neckLength * 0.30;
    const adamHalfW = laryngealProminence * 0.5;
    curves.push({
      kind: 'feature', closed: false, points: [
        [-adamHalfW, adamY, cylinderRadius * 0.4],
        [adamHalfW, adamY, cylinderRadius * 0.4],
      ],
    });
  }

  return curves;
};

// ---- main scaffold builder ----

export const buildScaffold = (p: FaceParams): Scaffold => {
  // CRANIUM — Loomis ball. The base unit for everything else is cranium.diameter.
  // It's a SPHERE (not an ellipsoid), per Loomis 1956 §I.
  const diameter = p.head.cranium.diameter;
  const cranR = diameter / 2;
  const rx = cranR, ry = cranR, rz = cranR;
  const sx = p.head.cranium.sidePlaneOffset * diameter;   // distance from centerline to side-plane cut

  // JAW — Bridgman mandible, SEPARATE mass attached below the cranium.
  // ramusHeight is TMJ→gonial-corner; the jaw mass hangs `ramusHeight*diameter` below the sphere bottom.
  const ramusH = p.head.jaw.ramusHeight * diameter;
  const bigonialHalfW = (p.head.jaw.bigonialWidth * diameter) / 2;
  // mentalWidth is the chin pad as a fraction of bigonial — independent of gonialAngle now.
  // (Previously `chinSharpness` collapsed these two anatomically distinct levers.)
  // (mentalHalf is computed at the jawCurve call site below, after chinZ.)
  // gonialAngle 0 = sharp 90° (square jaw), 1 = soft 135° (round). Drives jaw-curve sharpness.
  const gonialAngle = p.head.jaw.gonialAngle;

  // Vertical landmarks — Loomis thirds, as RATIOS of total head height (top-of-cranium → chin).
  const topY = cranR;
  const chinY = -cranR - ramusH;
  const totalH = topY - chinY;
  const upperT = p.head.face.upperThirdRatio;
  const middleT = p.head.face.middleThirdRatio;
  // lowerT is implied (= 1 - upperT - middleT) but we read it for explicit Loomis-thirds intent.
  const browY = topY - upperT * totalH;
  const noseBaseY = browY - middleT * totalH;
  // Eye line is HALF of total head height (Loomis's "eyes at half-head" rule — p.18).
  const eyeY = topY - 0.5 * totalH + p.eyes.yOffset * diameter;
  // Mouth line: 1/3 down from nose-base to chin (Loomis).
  const mouthY = noseBaseY - (noseBaseY - chinY) * 0.333 + p.mouth.yOffset * diameter;

  // Gonial-corner Y — where the jaw begins curving toward the chin. Loomis aligns the
  // gonial corner with the nose-base line (the bottom of the ear is at nose-base).
  const gonialY = noseBaseY;
  // Cheek silhouette half-width at the gonial corner. Square jaws (low gonialAngle) keep this near
  // the bigonial width; soft jaws (high gonialAngle) tuck it in slightly.
  const cheekHalfWidth = bigonialHalfW * (1 - 0.10 * gonialAngle);
  // Legacy variable name kept locally for the silhouette construction below.
  const cheekY = gonialY;

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

  const chinZ = diameter * 0.30 + p.head.jaw.mentalProtrusion * diameter;
  // Mental half-width: chin pad as fraction of bigonial.
  const mentalHalf = bigonialHalfW * p.head.jaw.mentalWidth;
  // Per Leo §3 — jaw dispatcher takes a JawSpec, topology selects the builder.
  const jaw = jawCurve({
    cheekL, cheekR, chinY, chinZ,
    bigonialHalf: bigonialHalfW,
    mentalHalf,
    gonialAngle: p.head.jaw.gonialAngle,
    jowl: p.head.jaw.jowl,
    topology: p.head.jaw.topology,
  }, 18);

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
  features.push(...buildHair(
    rx, ry, rz, sx, browY, totalH,
    p.hair.style, p.hair.frontShape, p.hair.forehead, p.hair.volume, p.style.hairFill,
    p.hair.templeRecession, p.hair.sideFall, p.hair.crownPeakX, p.hair.napeExtension, p.hair.edgeKind,
    p.hair.recipe,
  ));

  // Hat (sits on top of head; opt-in via p.hat.style)
  features.push(...buildHat(rx, ry, sx, totalH, p.hat.style, p.hat.color, p.hat.bandColor, p.hat.emblem, p.hat.emblemColor, p.hat.size, p.hat.tilt));

  // Ears — per Loomis: TOP of helix aligns with brow line, BOTTOM of helix aligns with
  // nose-base line. Lobe extends below. Anchor X is INSIDE the side plane (overlapping
  // the silhouette) so the ear reads as attached.
  if (p.ears.visible) {
    const earTopY = browY + p.ears.yOffset * diameter;
    const earBottomY = noseBaseY + p.ears.yOffset * diameter;
    const protrusion = p.ears.helixProtrusion * diameter;
    const earInset = protrusion * 0.65;     // inset deeper to anchor into silhouette
    const earZ = diameter * 0.10;
    features.push(...buildEar(
      -sx + earInset, earTopY, earBottomY,
      protrusion, p.ears.lobeDrop, p.ears.antihelixShow,
      p.ears.tragusShow, p.ears.conchaShow, p.ears.tilt,
      earZ, true, p.style.skinFill,
    ));
    features.push(...buildEar(
      sx - earInset, earTopY, earBottomY,
      protrusion, p.ears.lobeDrop, p.ears.antihelixShow,
      p.ears.tragusShow, p.ears.conchaShow, p.ears.tilt,
      earZ, false, p.style.skinFill,
    ));
  }

  // Eyes
  const halfEye = (p.eyes.size * diameter) / 2;
  const eyeAnchorX = (p.eyes.spacing * diameter) / 2;
  const eyeSurfaceZ = frontZ(eyeAnchorX, eyeY);
  if (p.eyes.style === 'dots') {
    const dotR = p.eyes.dotSize * diameter;
    features.push(...buildEyeDots(
      [-eyeAnchorX, eyeY, eyeSurfaceZ], dotR, p.eyes.openness, eyeSurfaceZ,
      p.eyes.lidLine, p.eyes.lashes, p.eyes.underlineHint, true,
    ));
    features.push(...buildEyeDots(
      [eyeAnchorX, eyeY, eyeSurfaceZ], dotR, p.eyes.openness, eyeSurfaceZ,
      p.eyes.lidLine, p.eyes.lashes, p.eyes.underlineHint, false,
    ));
  } else {
    features.push(...buildEye([-eyeAnchorX, eyeY, eyeSurfaceZ], halfEye, p.eyes.openness, p.eyes.tilt, eyeSurfaceZ));
    features.push(...buildEye([eyeAnchorX, eyeY, eyeSurfaceZ], halfEye, p.eyes.openness, -p.eyes.tilt, eyeSurfaceZ));
  }

  // Brows
  const browLen = p.brows.length * diameter;
  // Unibrow pulls the inner anchors toward the centerline (0 = normal spacing, 1 = inner ends touch).
  const browInnerX = Math.max(0, p.brows.spacing * diameter * (1 - p.brows.unibrow));
  const innerLiftY = p.brows.innerLift * totalH;
  const outerLiftY = p.brows.outerLift * totalH;
  features.push(...buildBrow(
    [-browInnerX, browY + innerLiftY, frontZ(-browInnerX, browY)],
    browLen, 0, outerLiftY - innerLiftY, p.brows.arch, p.brows.fullness, frontZ(-browInnerX, browY), true,
    p.brows.style,
  ));
  features.push(...buildBrow(
    [browInnerX, browY + innerLiftY, frontZ(browInnerX, browY)],
    browLen, 0, outerLiftY - innerLiftY, p.brows.arch, p.brows.fullness, frontZ(browInnerX, browY), false,
    p.brows.style,
  ));

  // Nose (bridge top sits just below brow line)
  const bridgeTop: Vec3 = [0, browY - totalH * 0.02, frontZ(0, browY)];
  features.push(...buildNose(bridgeTop, p.nose.length * totalH, p.nose.width * diameter, frontZ(0, browY), p.nose.bridgeVisible, p.nose.style, p.nose.showNostrils));

  // Facial hair — emitted BEFORE the mouth so the mustache covers the mouth line when beardWithMustache
  // is requested (painter's order is by avgZ; both sit at similar Z, so emit order is the tiebreaker).
  if (p.facialHair.style !== 'none') {
    const hairColor = p.facialHair.color ?? p.style.hairFill ?? '#1a1a1a';
    features.push(...buildFacialHair(
      jaw, cheekL, cheekR, mouthY,
      p.facialHair.style,
      p.facialHair.length * totalH,
      p.facialHair.fullness * diameter,
      hairColor,
      {
        baseOffset: p.facialHair.mustacheBaseOffset,
        rise: p.facialHair.mustacheRise,
        width: p.facialHair.mustacheWidth,
        philtrumWidth: p.facialHair.philtrumWidth,
        philtrumDepth: p.facialHair.philtrumDepth,
      },
    ));
  }

  // Mouth
  const mouthCenter: Vec3 = [0, mouthY, frontZ(0, mouthY)];
  features.push(...buildMouth(
    mouthCenter, p.mouth.width * diameter, p.mouth.openness, p.mouth.cornerLift * totalH,
    p.mouth.upperCurve, p.mouth.lipFullness, p.mouth.cornerMarks,
    p.mouth.labiomentalShow, frontZ(0, mouthY),
  ));

  // Neck — anchor on the under-jaw between the chin pad and the cheek; widens slightly at the base.
  if (p.neck.visible) {
    // Per Leo §5: SCM origins at the MASTOID (behind the ear), not chin corner.
    // Underjaw anchors are where the neck cylinder front edge meets the jaw underside.
    const mastoidX = sx + diameter * 0.005;    // just inside the side plane, where the ear sits
    const mastoidY = noseBaseY;                 // mastoid roughly aligns with nose-base height (ear-bottom level)
    const mastoidZ = diameter * 0.10;
    const mastoidL: Vec3 = [-mastoidX, mastoidY, mastoidZ];
    const mastoidR: Vec3 = [mastoidX, mastoidY, mastoidZ];
    const underjawX = p.neck.cylinderRadius * diameter;
    const underjawY = chinY + ramusH * 0.30;    // just under the chin
    const underjawL: Vec3 = [-underjawX, underjawY, chinZ * 0.5];
    const underjawR: Vec3 = [underjawX, underjawY, chinZ * 0.5];
    features.push(...buildNeck(
      mastoidL, mastoidR, underjawL, underjawR,
      p.neck.cylinderRadius * diameter,
      p.neck.trapWidthAtBase * diameter,
      p.neck.trapFlareStart,
      p.neck.length * totalH,
      p.neck.scmShow,
      p.neck.trapShow,
      p.neck.laryngealProminence * totalH,
    ));
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
