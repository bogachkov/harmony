import type { FaceParams } from '../model/params.ts';
import type { Projected } from './project.ts';
import { bounds } from './project.ts';
import { inkStrokePath } from './strokes.ts';
import { mergeCapsulesToHull, mergeCapsulesToAlpha, type Capsule2D } from './hull.ts';

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
    inkPath: string;       // populated for feature-ink curves; rendered as fill in pass 1
    inkColor: string;
    fill: string | null;   // null = no fill pass
    isConstruction: boolean;
    isInk: boolean;
    sw: number;
  };
  const prepped: Prepped[] = [];
  for (const c of ordered) {
    const isConstruction = c.kind === 'construction';
    const isInk = c.kind === 'feature-ink';
    const px: Array<readonly [number, number]> = c.points.map(([x, y]) => [tx(x), ty(y)] as const);
    if (px.length === 0) continue;
    const wobbled = (isConstruction || isInk) ? px : wobble(px, jitter, rng);
    const swVar = jitter > 0 ? (rng() - 0.5) * 0.4 : 0;
    // Silhouette gets a slightly heavier stroke than interior features — standard comic-art
    // figure-ground separation. Interior features keep the base weight.
    const isSilhouette = c.role === 'silhouette';
    const silhouetteBoost = isSilhouette ? 1.35 : 1;
    // Per-feature multiplier (audit L2). Baked onto curves by the scaffold
    // builders from p.style.featureWeights. Defaults to 1.0 — undefined on
    // every non-opted pack so the stroke width is byte-identical.
    const featureMul = c.weightMul ?? 1;
    const sw = isConstruction
      ? p.style.constructionWeight
      : Math.max(0.5, p.style.lineWeight * silhouetteBoost * featureMul + swVar);
    // Ink size is anchored to the same line weight, but scaled per InkProfile.size so
    // hair partings (size ~1.4×) read as confident comic ink rather than scaffold weight.
    let inkPath = '';
    let inkColor = p.style.color;
    if (isInk && c.ink) {
      const sizePx = Math.max(1, p.style.lineWeight * c.ink.size);
      inkPath = inkStrokePath(wobbled, c.ink, sizePx);
      inkColor = c.ink.color ?? p.style.color;
    }
    prepped.push({
      c,
      pxPath: pointsToPath(wobbled, c.closed),
      inkPath,
      inkColor,
      fill: c.fill ?? null,
      isConstruction,
      isInk,
      sw,
    });
  }

  // Pass 1: fills only (no stroke). Painted in painter's order so later layers cover earlier ones.
  const paths: string[] = [];

  // HULL-MERGE PASS — group clump-volume curves by hullGroup and emit ONE
  // filled hull polygon per group. Drawn FIRST (before other fills) so the
  // centreline strokes paint on top of the silhouette mass. Per Lloyd pass 1
  // §2 stage E.
  const hullGroups = new Map<string, { caps: Capsule2D[]; fill: string; avgZ: number }>();
  for (const item of prepped) {
    const c = item.c;
    if (c.kind !== 'clump-volume' || !c.capsules || c.capsules.length === 0) continue;
    const groupKey = c.hullGroup ?? '__default';
    const fill = item.fill ?? p.style.hairFill ?? p.style.color;
    const entry = hullGroups.get(groupKey);
    if (entry) {
      for (const cap of c.capsules) entry.caps.push(cap);
      // Use the back-most member's avgZ so the merged silhouette sits behind
      // its own strokes in painter order.
      if (c.avgZ < entry.avgZ) entry.avgZ = c.avgZ;
    } else {
      hullGroups.set(groupKey, { caps: [...c.capsules], fill, avgZ: c.avgZ });
    }
  }
  // Lloyd pass-2 item 3: no debug attr on hull paths. The earlier
  // data-hull-group="<avgZ>" leaked floats into SVG output (Hyrum's-law
  // bait + harder regression promise for Holly). If a debug overlay is
  // wanted later, gate behind p.style.debug and emit the categorical
  // group key, not the float.
  //
  // Lloyd pass-2 item 4: dispatch convex vs alpha by recipe.hullMode. Read
  // once at the merge stage (Stage E of Lloyd pass 1 §2), select merger,
  // call. Per mixture rule, hullMode is a parameter, not a replacement —
  // both mergers remain reachable. Default 'convex' preserves W1 fixtures'
  // existing renders; 'alpha' is the eventual default for new adoption.
  const hullMode = p.hair.recipe?.hullMode ?? 'convex';
  const merger = hullMode === 'alpha' ? mergeCapsulesToAlpha : mergeCapsulesToHull;
  for (const { caps, fill } of hullGroups.values()) {
    const hull = merger(caps);
    if (hull.length < 3) continue;
    const pxHull: Array<readonly [number, number]> = hull.map(([x, y]) => [tx(x), ty(y)] as const);
    paths.push(
      `<path d="${pointsToPath(pxHull, true)}" fill="${xmlEscape(fill)}" stroke="none"/>`,
    );
  }

  for (const item of prepped) {
    // clump-volume curves contribute to the hull-merge pass above; their
    // centrelines do not render directly (the scaffold also pushes a
    // companion feature-ink curve for the inked centreline).
    if (item.c.kind === 'clump-volume') continue;
    if (item.isInk) {
      // Inked stroke — render the perfect-freehand outline polygon as a fill. No separate
      // stroke pass for inked strokes (they're already the right shape).
      if (item.inkPath) {
        paths.push(`<path d="${item.inkPath}" fill="${xmlEscape(item.inkColor)}" stroke="none"/>`);
      }
      continue;
    }
    if (!item.fill) continue;
    paths.push(
      `<path d="${item.pxPath}" fill="${xmlEscape(item.fill)}" stroke="none"/>`,
    );
  }
  // Pass 2: strokes for every curve. Skipped for curves marked noStroke (used for
  // hidden-edge fills like the receding-hairline cap, where the colored mass should
  // bleed into the skin without a visible boundary line) or feature-ink curves
  // (which are already rendered as a fill outline polygon in pass 1).
  for (const item of prepped) {
    if (item.c.noStroke || item.isInk) continue;
    // Clump-volume centrelines render via the companion feature-ink curve
    // pushed by scaffold; skip them here.
    if (item.c.kind === 'clump-volume') continue;
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
