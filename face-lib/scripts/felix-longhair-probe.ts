// Felix W3 probe: render the long-hair cells that Pascal scored 6/7/11 at 2/2/2
// on Pass 1, plus a full long-hair × pack regression matrix to verify the
// mixture rule before/after Felix's primitive rebuild.
//
// Layout (per-cell PNGs + composite sheets):
//   /tmp/felix-out/timmflat-6-7-11/<NN>-<label>.png   — the three target cells
//   /tmp/felix-out/longhair-matrix/<pack>-<style>.png  — pack × longstyle matrix
//   /tmp/felix-out/longhair-matrix/sheet.png           — composite
//
// Packs probed: default, tintin, ligneClaire, timmFlat.
// Long hairstyles probed: longSleek, longTail, longCurtain, longCurly, longWavy, longWitch, coilyHalo.

import { writeFileSync, mkdirSync } from 'node:fs';
import type { ComposeArgs, DeepPartial, FaceParams } from '../src/api.ts';
import { composeFace } from '../src/api.ts';
import { svgToPng } from '../src/render/raster.ts';

const OUTBASE = process.argv[2] ?? '/tmp/felix-out';
const outA = `${OUTBASE}/timmflat-6-7-11`;
const outB = `${OUTBASE}/longhair-matrix`;
mkdirSync(outA, { recursive: true });
mkdirSync(outB, { recursive: true });

const DARK_SKIN = '#6e3f24';
const darkSkin: DeepPartial<FaceParams> = { style: { skinFill: DARK_SKIN } };
const TIMM_PEDAGOGY: DeepPartial<FaceParams> = {
  mouth: { lipFullness: 0, labiomentalShow: 0, cornerMarks: false, upperCurve: 0 },
  eyes: { lashes: 0, lidLine: 0.6, underlineHint: 0.15 },
  brows: { style: 'single' },
  nose: { style: 'minimal', bridgeVisible: false, showNostrils: false },
};
const merge = (...parts: Array<DeepPartial<FaceParams> | undefined>): DeepPartial<FaceParams> => {
  const out: Record<string, unknown> = {};
  for (const p of parts) {
    if (!p) continue;
    for (const k of Object.keys(p)) {
      const cur = out[k];
      const nxt = (p as Record<string, unknown>)[k];
      out[k] =
        typeof cur === 'object' && cur !== null && !Array.isArray(cur) &&
        typeof nxt === 'object' && nxt !== null && !Array.isArray(nxt)
          ? { ...(cur as object), ...(nxt as object) }
          : nxt;
    }
  }
  return out as DeepPartial<FaceParams>;
};

// --- The three target cells (timmFlat + long hair) ---
type Cell = { n: number; label: string; args: ComposeArgs };
const targets: Cell[] = [
  { n: 6,  label: 'adult-fem-oval-longSleek',
    args: { style: 'timmFlat', age: 'adult', presentation: 'feminine', hairstyle: 'longSleek',
            overrides: TIMM_PEDAGOGY } },
  { n: 7,  label: 'adult-fem-oval-longTail',
    args: { style: 'timmFlat', age: 'adult', presentation: 'feminine', hairstyle: 'longTail',
            overrides: TIMM_PEDAGOGY } },
  { n: 11, label: 'teen-fem-ovalsoft-longSleek-dark',
    args: { style: 'timmFlat', age: 'teen', presentation: 'feminine', hairstyle: 'longSleek',
            overrides: merge(TIMM_PEDAGOGY, darkSkin) } },
];
for (const c of targets) {
  const svg = composeFace(c.args);
  writeFileSync(`${outA}/${String(c.n).padStart(2,'0')}-${c.label}.svg`, svg);
  writeFileSync(`${outA}/${String(c.n).padStart(2,'0')}-${c.label}.png`, svgToPng(svg));
}
process.stderr.write(`Rendered ${targets.length} target cells (6/7/11) to ${outA}\n`);

// --- The mixture-rule matrix ---
const packs = ['default', 'tintin', 'ligneClaire', 'timmFlat'] as const;
const longStyles = ['longSleek', 'longTail', 'longCurtain', 'longCurly', 'longWavy', 'longWitch', 'coilyHalo'] as const;

type Rendered = { pack: string; style: string; svg: string };
const rendered: Rendered[] = [];
for (const pack of packs) {
  for (const hs of longStyles) {
    const args: ComposeArgs = {
      style: pack === 'default' ? undefined : pack as never,
      age: 'adult', presentation: 'feminine', hairstyle: hs,
      overrides: pack === 'timmFlat' ? TIMM_PEDAGOGY : undefined,
    };
    const svg = composeFace(args);
    rendered.push({ pack, style: hs, svg });
    writeFileSync(`${outB}/${pack}-${hs}.svg`, svg);
    writeFileSync(`${outB}/${pack}-${hs}.png`, svgToPng(svg));
  }
}
process.stderr.write(`Rendered ${rendered.length} matrix cells to ${outB}\n`);

// --- Composite ---
const parseVb = (svg: string): { w: number; h: number } => {
  const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!m) return { w: 360, h: 600 };
  return { w: Number(m[1]), h: Number(m[2]) };
};
const stripWrapper = (svg: string): string => {
  const open = svg.match(/<svg[^>]*>/);
  if (!open) return svg;
  return svg.slice(open[0].length, svg.lastIndexOf('</svg>'));
};
const vbs = rendered.map((r) => parseVb(r.svg));
const slotW = Math.max(...vbs.map((v) => v.w));
const slotH = Math.max(...vbs.map((v) => v.h));
const cols = longStyles.length;
const rows = packs.length;
const pad = 12;
const labelStripH = 20;
const sheetW = cols * slotW + (cols + 1) * pad;
const sheetH = rows * (slotH + labelStripH) + (rows + 1) * pad;
const parts: string[] = [];
parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${sheetH}" viewBox="0 0 ${sheetW} ${sheetH}">`);
parts.push(`<rect width="100%" height="100%" fill="#cfcabb"/>`);
for (let i = 0; i < rendered.length; i++) {
  const r = rendered[i]!;
  const v = vbs[i]!;
  const col = i % cols;
  const row = Math.floor(i / cols);
  const x = pad + col * (slotW + pad) + (slotW - v.w) / 2;
  const y = pad + row * (slotH + labelStripH + pad);
  parts.push(`<g transform="translate(${x} ${y})">${stripWrapper(r.svg)}</g>`);
  const labelY = y + slotH + 16;
  const labelX = pad + col * (slotW + pad) + slotW / 2;
  const safe = `${r.pack}/${r.style}`.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  parts.push(`<text x="${labelX}" y="${labelY}" font-family="sans-serif" font-size="12" fill="#1a1a1a" text-anchor="middle">${safe}</text>`);
}
parts.push(`</svg>`);
const sheet = parts.join('\n');
writeFileSync(`${outB}/sheet.svg`, sheet);
writeFileSync(`${outB}/sheet.png`, svgToPng(sheet));
process.stderr.write(`Wrote matrix sheet: ${outB}/sheet.png\n`);
