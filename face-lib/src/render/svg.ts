import type { FaceParams } from '../model/params.ts';
import type { Projected } from './project.ts';
import { bounds } from './project.ts';

// Deterministic jitter so identical params produce identical SVG.
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

  // Painter's order: back to front by avgZ ascending (more negative Z is further away after rotation).
  const ordered = [...curves].sort((a, c) => a.avgZ - c.avgZ);

  // Optional jitter
  const rng = mulberry32(p.style.jitterSeed);
  const jitter = p.style.jitter;
  const jx = () => (jitter > 0 ? (rng() - 0.5) * 2 * jitter : 0);
  const jy = () => (jitter > 0 ? (rng() - 0.5) * 2 * jitter : 0);

  const paths: string[] = [];
  for (const c of ordered) {
    const isConstruction = c.kind === 'construction';
    const px: Array<readonly [number, number]> = c.points.map(([x, y]) => [tx(x) + jx(), ty(y) + jy()] as const);
    if (px.length === 0) continue;
    const d = pointsToPath(px, c.closed);
    const stroke = isConstruction ? p.style.constructionColor : p.style.color;
    const sw = isConstruction ? p.style.constructionWeight : p.style.lineWeight;
    const dash = isConstruction ? ' stroke-dasharray="4 3"' : '';
    paths.push(
      `<path d="${d}" fill="none" stroke="${xmlEscape(stroke)}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`,
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
