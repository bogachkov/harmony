import type { FaceParams } from '../model/params.ts';
import type { Projected } from './project.ts';
import { bounds } from './project.ts';

// Deterministic seeded RNG so identical params produce identical SVG.
const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const xmlEscape = (s: string): string =>
  s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] as string));

const pointsToPath = (pts: ReadonlyArray<readonly [number, number]>, closed: boolean): string => {
  if (pts.length === 0) return '';
  const first = pts[0] as readonly [number, number];
  let d = `M ${first[0].toFixed(2)} ${first[1].toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i] as readonly [number, number];
    d += ` L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  }
  if (closed) d += ' Z';
  return d;
};

// Apply a low-frequency perpendicular wobble to a polyline (in pixel coords).
// Produces a "hand-drawn" wandering line rather than per-point noise.
const wobble = (
  pts: Array<readonly [number, number]>,
  amplitude: number,
  rng: () => number,
): Array<readonly [number, number]> => {
  if (amplitude <= 0 || pts.length < 2) return pts;
  // Pick 2-3 random low-frequency phases for the wobble. Each phase rotates a sine envelope.
  const phaseA = rng() * Math.PI * 2;
  const phaseB = rng() * Math.PI * 2;
  const freqA = 1 + rng() * 1.5;   // cycles across the whole line
  const freqB = 2 + rng() * 2.5;
  const ampB = amplitude * 0.4;
  const out: Array<readonly [number, number]> = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i] as readonly [number, number];
    const t = pts.length === 1 ? 0 : i / (pts.length - 1);
    // Tangent for perpendicular direction
    const prev = pts[Math.max(0, i - 1)] as readonly [number, number];
    const next = pts[Math.min(pts.length - 1, i + 1)] as readonly [number, number];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    // Envelope so the wobble fades to zero at the endpoints (line stays connected).
    const env = Math.sin(Math.PI * t);
    const w = env * (amplitude * Math.sin(freqA * Math.PI * t + phaseA) + ampB * Math.sin(freqB * Math.PI * t + phaseB));
    out.push([p[0] + nx * w, p[1] + ny * w]);
  }
  return out;
};

export const renderSvg = (curves: Projected[], p: FaceParams): string => {
  const b = bounds(curves);
  const modelW = b.maxX - b.minX;
  const modelH = b.maxY - b.minY;

  const pxH = p.camera.pixelHeight;
  const margin = pxH * p.camera.margin;
  const drawH = pxH - 2 * margin;
  const scale = drawH / modelH;
  const drawW = modelW * scale;
  const pxW = drawW + 2 * margin;

  // Model → pixel. Note: SVG y grows downward; we flip.
  const tx = (x: number) => margin + (x - b.minX) * scale;
  const ty = (y: number) => margin + (b.maxY - y) * scale;

  // Painter's order: back to front by avgZ ascending.
  const ordered = [...curves].sort((a, c) => a.avgZ - c.avgZ);

  const rng = mulberry32(p.style.jitterSeed);
  const jitter = p.style.jitter;

  // Pre-compute pixel-space paths (with wobble) once per curve, since we paint
  // them twice — once as fills, once as strokes.
  type Prepped = {
    c: Projected;
    pxPath: string;
    fill: string | null;   // null = no fill pass
    isConstruction: boolean;
    sw: number;
  };
  const prepped: Prepped[] = [];
  for (const c of ordered) {
    const isConstruction = c.kind === 'construction';
    const px: Array<readonly [number, number]> = c.points.map(([x, y]) => [tx(x), ty(y)] as const);
    if (px.length === 0) continue;
    const wobbled = isConstruction ? px : wobble(px, jitter, rng);
    const swVar = jitter > 0 ? (rng() - 0.5) * 0.4 : 0;
    // Silhouette gets a slightly heavier stroke than interior features — standard comic-art
    // figure-ground separation. Interior features keep the base weight.
    const isSilhouette = c.role === 'silhouette';
    const weightMul = isSilhouette ? 1.35 : 1;
    const sw = isConstruction
      ? p.style.constructionWeight
      : Math.max(0.5, p.style.lineWeight * weightMul + swVar);
    prepped.push({
      c,
      pxPath: pointsToPath(wobbled, c.closed),
      fill: c.fill ?? null,
      isConstruction,
      sw,
    });
  }

  // Pass 1: fills only (no stroke). Painted in painter's order so later layers cover earlier ones.
  const paths: string[] = [];
  for (const item of prepped) {
    if (!item.fill) continue;
    paths.push(
      `<path d="${item.pxPath}" fill="${xmlEscape(item.fill)}" stroke="none"/>`,
    );
  }
  // Pass 2: strokes for every curve. Skipped for curves marked noStroke (used for
  // hidden-edge fills like the receding-hairline cap, where the colored mass should
  // bleed into the skin without a visible boundary line).
  for (const item of prepped) {
    if (item.c.noStroke) continue;
    const stroke = item.isConstruction ? p.style.constructionColor : p.style.color;
    const dash = item.isConstruction ? ' stroke-dasharray="4 3"' : '';
    paths.push(
      `<path d="${item.pxPath}" fill="none" stroke="${xmlEscape(stroke)}" stroke-width="${item.sw.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`,
    );
  }

  const bg = p.style.background
    ? `<rect width="100%" height="100%" fill="${xmlEscape(p.style.background)}"/>`
    : '';

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pxW.toFixed(0)}" height="${pxH.toFixed(0)}" viewBox="0 0 ${pxW.toFixed(2)} ${pxH.toFixed(2)}">`,
    bg,
    ...paths,
    '</svg>',
  ].join('\n');
};
