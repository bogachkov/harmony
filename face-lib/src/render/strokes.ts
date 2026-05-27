// Ink-stroke renderer — wraps perfect-freehand to turn a pixel-space polyline + an
// `InkProfile` into a closed SVG fill polygon with tapered tips. Used for hair primitives
// (parting curve, characterization strokes) per Leo's pass-3 research.
//
// Why fill instead of stroke: perfect-freehand emits a closed *outline polygon* (the contour
// of the variable-width ink line). Rendering it as a fill in our pass-1 painter is correct
// and avoids double-painting; we explicitly skip these in pass 2 (strokes).

import { getStroke } from 'perfect-freehand';
import type { InkProfile } from '../model/scaffold.ts';

type Point = readonly [number, number];

// Generate a pressure profile: low at endpoints, peak at mid-stroke (the natural ink-pen feel).
// `taperStart` / `taperEnd` are 0..1 fractions of total length where pressure ramps up/down.
const pressureAt = (t: number, taperStart: number, taperEnd: number, mid: number): number => {
  const startRamp = taperStart > 0 ? Math.min(1, t / taperStart) : 1;
  const endRamp = taperEnd > 0 ? Math.min(1, (1 - t) / taperEnd) : 1;
  // Smoothstep at both tips so the ink doesn't have hard onset/offset.
  const ease = (x: number): number => x * x * (3 - 2 * x);
  return Math.max(0.05, mid * ease(startRamp) * ease(endRamp));
};

// Convert a closed polygon (perfect-freehand output) to SVG `d` path data.
// Output points form a closed loop; we move-to first, line-to remaining, close.
export const polygonToPath = (poly: ReadonlyArray<Point>): string => {
  if (poly.length === 0) return '';
  const first = poly[0] as Point;
  let d = `M ${first[0].toFixed(2)} ${first[1].toFixed(2)}`;
  for (let i = 1; i < poly.length; i++) {
    const p = poly[i] as Point;
    d += ` L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  }
  d += ' Z';
  return d;
};

// Build the perfect-freehand input array `[x, y, pressure]` from a polyline and ink profile.
const toInputPoints = (pts: ReadonlyArray<Point>, ink: InkProfile): Array<[number, number, number]> => {
  const mid = ink.pressureMid ?? 0.85;
  const n = pts.length;
  if (n === 0) return [];
  if (n === 1) {
    const p = pts[0] as Point;
    return [[p[0], p[1], mid]];
  }
  const out: Array<[number, number, number]> = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const p = pts[i] as Point;
    out.push([p[0], p[1], pressureAt(t, ink.taperStart, ink.taperEnd, mid)]);
  }
  return out;
};

// Render an inked stroke as a closed SVG path-d string. `sizePx` is the rendered base diameter
// in pixels (caller multiplies ink.size by lineWeight scaling at projection time).
export const inkStrokePath = (pts: ReadonlyArray<Point>, ink: InkProfile, sizePx: number): string => {
  if (pts.length < 2) return '';
  const input = toInputPoints(pts, ink);
  const totalLen = strokeLength(pts);
  // perfect-freehand `taper` is in pixels — distance from each endpoint over which the line
  // tapers to a point. We map our 0..1 fractions to pixels via the polyline length.
  const taperStartPx = ink.taperStart * totalLen;
  const taperEndPx = ink.taperEnd * totalLen;
  const outline = getStroke(input, {
    size: sizePx,
    thinning: 0.55,
    smoothing: 0.5,
    streamline: 0.5,
    start: { taper: taperStartPx, cap: false, easing: (x: number) => x * x },
    end:   { taper: taperEndPx,   cap: false, easing: (x: number) => x * x },
    last: true,
  });
  return polygonToPath(outline as ReadonlyArray<Point>);
};

const strokeLength = (pts: ReadonlyArray<Point>): number => {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1] as Point;
    const b = pts[i] as Point;
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return total;
};
