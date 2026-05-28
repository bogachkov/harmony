// Render the W2-revised 13-cell timmFlat ship grid + four-corner thumbnail
// test + two off-grid probes (pointed-jaw / pear-jaw).
//
// Cells 6, 7, 11 are EXPLICITLY DROPPED per Claudia's W2 re-plan
// (SPRINT.md Q1-W2 extended) — long-hair primitive ceiling, deferred to W3.
// The cell numbering is preserved (1..16 minus 6/7/11) so cross-references
// with the original 16-cell spec, Pascal's W2 close pass, and the W3 promotion
// list keep stable indices.
//
// Outputs:
//   /tmp/timmflat-out/grid/<NN>-<label>.png        — full-size grid (13 PNGs)
//   /tmp/timmflat-out/grid/sheet-full.svg          — composite sheet (full size)
//   /tmp/timmflat-out/grid-96/<NN>-<label>.png     — 96×96 thumbnails (13 PNGs)
//   /tmp/timmflat-out/grid-96/sheet-thumb.svg      — composite 96px sheet
//   /tmp/timmflat-out/grid-96/four-corners.png     — cells 1/4/12/14 at 96×96
//   /tmp/timmflat-out/probes/pointed-jaw.png       — off-grid Joker register
//   /tmp/timmflat-out/probes/pear-jaw.png          — off-grid Penguin register

import { writeFileSync, mkdirSync } from 'node:fs';
import type { ComposeArgs, DeepPartial, FaceParams } from '../src/api.ts';
import { composeFace } from '../src/api.ts';
import { svgToPng } from '../src/render/raster.ts';

// Output base (override with single positional arg). Subdirs grid/, grid-96/,
// probes/ are created beneath it.
const OUTBASE = process.argv[2] ?? '/tmp/timmflat-out';
const outdirFull = `${OUTBASE}/grid`;
const outdirThumb = `${OUTBASE}/grid-96`;
const outdirProbe = `${OUTBASE}/probes`;
mkdirSync(outdirFull, { recursive: true });
mkdirSync(outdirThumb, { recursive: true });
mkdirSync(outdirProbe, { recursive: true });

// --- Skin-tone override per spec/Rollo addendum ---
// Default skin: pack-level '#fdd6b3' (already in timmFlat).
// Dark skin: '#6e3f24' (warm dark brown — Static Shock / John Stewart register).
const DARK_SKIN = '#6e3f24';

// --- The "Timm pedagogy contract" enforced at the overrides layer ---
// Cascade order is: defaults → STYLE → presentation → age → HAIRSTYLE → expression → character → overrides.
// Several timmFlat pack knobs get clobbered by later cascade layers:
//   - mouth.lipFullness = 0 (decision §3: no vermilion modeling) — presentation:
//     'feminine' sets lipFullness 0.35, overriding the pack.
//   - mouth.labiomentalShow = 0 (decision §3: no Faigin sulcus) — presentation:
//     'masculine' sets labiomentalShow 0.22.
//   - eyes.lashes = 0 (decision §1: no lash array) — presentation: 'feminine'
//     sets lashes 0.6.
//
// W2 PR #4 (this commit): hair.recipe.leads is NO LONGER part of the override
// because the interior-strand artifact that Pascal called out wasn't actually
// driven by leads — the experimental clump-stroke field (~28-50 per-clump
// strand groups, scaffold.ts:1281+) ran regardless of leads and that's where
// the bang-strand striping came from. Fix landed as a new primitive flag
// `recipe.suppressInteriorHairDetail` set at the timmFlat pack level (see
// src/presets/styles.ts + src/model/params.ts), which short-circuits the
// leads block AND the clump-stroke field AND the cap shadow/highlight tonal
// bands at the renderer. So the override no longer needs to defensively
// clear leads — the pack's declarative truth now reaches the render
// regardless of what intermediate cascade layers push.
//
// The remaining overrides re-apply the pack's mouth/eyes/brows/nose contract
// because those knobs ARE single scalar/enum values that the cascade
// correctly replaces — the only reason they need re-asserting is that
// later layers (presentation, age) push their own values on those same
// knobs and a pack-as-overrides at line 7 of the cascade wins cleanly.
// This mirrors Rollo's per-render skinFill override mechanism.
const TIMM_PEDAGOGY: DeepPartial<FaceParams> = {
  mouth: { lipFullness: 0, labiomentalShow: 0, cornerMarks: false, upperCurve: 0 },
  eyes: { lashes: 0, lidLine: 0.6, underlineHint: 0.15 },
  brows: { style: 'single' },
  nose: { style: 'minimal', bridgeVisible: false, showNostrils: false },
};
// Backwards-compat alias so the rest of the file reads naturally. The name
// no longer reflects what's actually being overridden (the leads suppression
// moved to the pack primitive flag); kept as an alias to avoid touching
// every cell-args site in the same PR.
const TIMM_NO_LEADS = TIMM_PEDAGOGY;

const mergeOverrides = (
  ...parts: Array<DeepPartial<FaceParams> | undefined>
): DeepPartial<FaceParams> => {
  // Shallow-merge the top-level blocks we use here. composeFace's mergeParams
  // does a deeper merge internally; this is only for stacking our own per-render
  // override objects before handing them to composeFace as the SINGLE overrides
  // argument.
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

const darkSkin: DeepPartial<FaceParams> = { style: { skinFill: DARK_SKIN } };

// --- The W2-revised 13-cell ship grid ---
// Cells 6, 7, 11 from the original 16-cell spec are DROPPED here per
// Claudia's re-plan (SPRINT.md Q1-W2 extended): long-hair primitive ceiling
// can't be reached without W3 primitive promotion (recipe.strandMode: 'off'
// or field-tracer-no-ops-when-flat). Pascal scored those three at 2/2/2 on
// the W2 close pass — not the pack's fault, the primitive's. Numbering is
// preserved (1,2,3,4,5,8,9,10,12,13,14,15,16) so this script's output stays
// row-compatible with `research/pascal-w2-timmflat.md` per-cell scores.
type Cell = { n: number; label: string; args: ComposeArgs };
const cells: Cell[] = [
  { n: 1,  label: 'adult-masc-square-shortSwept',
    args: { style: 'timmFlat', age: 'adult', presentation: 'masculine', hairstyle: 'shortSwept',
            overrides: TIMM_NO_LEADS } },
  { n: 2,  label: 'adult-masc-square-shortSwept-dark',
    args: { style: 'timmFlat', age: 'adult', presentation: 'masculine', hairstyle: 'shortSwept',
            overrides: mergeOverrides(TIMM_NO_LEADS, darkSkin) } },
  { n: 3,  label: 'adult-masc-square-spikyShort',
    args: { style: 'timmFlat', age: 'adult', presentation: 'masculine', hairstyle: 'spikyShort',
            overrides: TIMM_NO_LEADS } },
  { n: 4,  label: 'adult-fem-oval-bobChinLength',
    args: { style: 'timmFlat', age: 'adult', presentation: 'feminine', hairstyle: 'bobChinLength',
            overrides: TIMM_NO_LEADS } },
  { n: 5,  label: 'adult-fem-oval-bobChinLength-dark',
    args: { style: 'timmFlat', age: 'adult', presentation: 'feminine', hairstyle: 'bobChinLength',
            overrides: mergeOverrides(TIMM_NO_LEADS, darkSkin) } },
  // n: 6  — adult-fem-oval-longSleek — DROPPED (W3 promotion, long-hair primitive ceiling).
  // n: 7  — adult-fem-oval-longTail  — DROPPED (W3 promotion, long-hair primitive ceiling).
  { n: 8,  label: 'teen-masc-ovalsoft-shortPomp',
    args: { style: 'timmFlat', age: 'teen', presentation: 'masculine', hairstyle: 'shortPomp',
            overrides: TIMM_NO_LEADS } },
  { n: 9,  label: 'teen-masc-ovalsoft-spikyShort-dark',
    args: { style: 'timmFlat', age: 'teen', presentation: 'masculine', hairstyle: 'spikyShort',
            overrides: mergeOverrides(TIMM_NO_LEADS, darkSkin) } },
  { n: 10, label: 'teen-fem-ovalsoft-bobChinLength',
    args: { style: 'timmFlat', age: 'teen', presentation: 'feminine', hairstyle: 'bobChinLength',
            overrides: TIMM_NO_LEADS } },
  // n: 11 — teen-fem-ovalsoft-longSleek-dark — DROPPED (W3 promotion).
  { n: 12, label: 'child-masc-round-shortSwept',
    args: { style: 'timmFlat', age: 'child', presentation: 'masculine', hairstyle: 'shortSwept',
            overrides: TIMM_NO_LEADS } },
  { n: 13, label: 'child-fem-round-bobChinLength-dark',
    args: { style: 'timmFlat', age: 'child', presentation: 'feminine', hairstyle: 'bobChinLength',
            overrides: mergeOverrides(TIMM_NO_LEADS, darkSkin) } },
  { n: 14, label: 'elder-masc-jowled-shortReceding',
    args: { style: 'timmFlat', age: 'elder', presentation: 'masculine', hairstyle: 'shortReceding',
            overrides: TIMM_NO_LEADS } },
  { n: 15, label: 'elder-masc-jowled-shortReceding-dark',
    args: { style: 'timmFlat', age: 'elder', presentation: 'masculine', hairstyle: 'shortReceding',
            overrides: mergeOverrides(TIMM_NO_LEADS, darkSkin) } },
  { n: 16, label: 'elder-fem-jowled-bobChinLength',
    args: { style: 'timmFlat', age: 'elder', presentation: 'feminine', hairstyle: 'bobChinLength',
            overrides: TIMM_NO_LEADS } },
];

// --- Render every cell at full size + 96×96 thumb ---
type RenderedCell = { n: number; label: string; svg: string };
const renders: RenderedCell[] = [];
for (const c of cells) {
  const svg = composeFace(c.args);
  renders.push({ n: c.n, label: c.label, svg });
  const fileFull = `${outdirFull}/${String(c.n).padStart(2, '0')}-${c.label}.png`;
  writeFileSync(fileFull, svgToPng(svg));
  // 96×96 thumb
  const png96 = svgToPng(svg, { height: 96 });
  writeFileSync(`${outdirThumb}/${String(c.n).padStart(2, '0')}-${c.label}.png`, png96);
}
process.stderr.write(`Rendered ${renders.length} cells to ${outdirFull} (full) and ${outdirThumb} (96px).\n`);

// --- Composite sheet (full size, 4x4 grid) ---
// Take each SVG, parse its viewBox dims, and wrap into a single SVG with positioning.
// Each cell has a slot of fixed dimensions; we use a regex to extract viewBox.
type Vb = { w: number; h: number };
const parseVb = (svg: string): Vb => {
  const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!m) return { w: 360, h: 600 };
  return { w: Number(m[1]), h: Number(m[2]) };
};

const stripWrapper = (svg: string): string => {
  // Drop the outer <svg ...> ... </svg> shell — keep only inner content for embedding.
  const open = svg.match(/<svg[^>]*>/);
  if (!open) return svg;
  const inner = svg.slice(open[0].length, svg.lastIndexOf('</svg>'));
  return inner;
};

// Composite sheet (full): 4 columns × 4 rows. Each slot sized to max cell viewBox.
const vbs = renders.map((r) => parseVb(r.svg));
const slotW = Math.max(...vbs.map((v) => v.w));
const slotH = Math.max(...vbs.map((v) => v.h));
const cols = 4;
const rows = 4;
const pad = 12;
const labelStripH = 24;
const sheetW = cols * slotW + (cols + 1) * pad;
const sheetH = rows * (slotH + labelStripH) + (rows + 1) * pad;
const sheetParts: string[] = [];
sheetParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${sheetH}" viewBox="0 0 ${sheetW} ${sheetH}">`);
sheetParts.push(`<rect width="100%" height="100%" fill="#cfcabb"/>`); // neutral plate
for (let i = 0; i < renders.length; i++) {
  const r = renders[i]!;
  const v = vbs[i]!;
  const col = i % cols;
  const row = Math.floor(i / cols);
  const x = pad + col * (slotW + pad) + (slotW - v.w) / 2;
  const y = pad + row * (slotH + labelStripH + pad);
  sheetParts.push(`<g transform="translate(${x} ${y})">${stripWrapper(r.svg)}</g>`);
  // Label
  const labelY = y + slotH + 18;
  const labelX = pad + col * (slotW + pad) + slotW / 2;
  const safeLabel = `${r.n}. ${r.label}`.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  sheetParts.push(`<text x="${labelX}" y="${labelY}" font-family="sans-serif" font-size="14" fill="#1a1a1a" text-anchor="middle">${safeLabel}</text>`);
}
sheetParts.push(`</svg>`);
const sheetSvg = sheetParts.join('\n');
writeFileSync(`${outdirFull}/sheet-full.svg`, sheetSvg);
writeFileSync(`${outdirFull}/sheet-full.png`, svgToPng(sheetSvg));
process.stderr.write(`Wrote composite sheet: ${outdirFull}/sheet-full.{svg,png}\n`);

// --- Composite sheet (96px thumb, 4x4) ---
// Build a thumb sheet where each cell is rendered to 96px height directly,
// keeping the original aspect ratio. We use the original SVG viewBox; the
// per-cell PNG is 96 tall but variable wide.
const thumbH = 96;
const thumbSlotW = Math.max(...vbs.map((v) => Math.round((v.w / v.h) * thumbH)));
const thumbSheetW = cols * thumbSlotW + (cols + 1) * pad;
const thumbLabelStripH = 16;
const thumbSheetH = rows * (thumbH + thumbLabelStripH) + (rows + 1) * pad;
const thumbParts: string[] = [];
thumbParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${thumbSheetW}" height="${thumbSheetH}" viewBox="0 0 ${thumbSheetW} ${thumbSheetH}">`);
thumbParts.push(`<rect width="100%" height="100%" fill="#cfcabb"/>`);
for (let i = 0; i < renders.length; i++) {
  const r = renders[i]!;
  const v = vbs[i]!;
  const col = i % cols;
  const row = Math.floor(i / cols);
  const renderedW = (v.w / v.h) * thumbH;
  const x = pad + col * (thumbSlotW + pad) + (thumbSlotW - renderedW) / 2;
  const y = pad + row * (thumbH + thumbLabelStripH + pad);
  // Scale the original-content from its native viewBox into thumbH height.
  const scale = thumbH / v.h;
  thumbParts.push(`<g transform="translate(${x} ${y}) scale(${scale})">${stripWrapper(r.svg)}</g>`);
  const labelY = y + thumbH + 12;
  const labelX = pad + col * (thumbSlotW + pad) + thumbSlotW / 2;
  thumbParts.push(`<text x="${labelX}" y="${labelY}" font-family="sans-serif" font-size="10" fill="#1a1a1a" text-anchor="middle">cell ${r.n}</text>`);
}
thumbParts.push(`</svg>`);
const thumbSheet = thumbParts.join('\n');
writeFileSync(`${outdirThumb}/sheet-thumb.svg`, thumbSheet);
writeFileSync(`${outdirThumb}/sheet-thumb.png`, svgToPng(thumbSheet));
process.stderr.write(`Wrote thumb sheet: ${outdirThumb}/sheet-thumb.{svg,png}\n`);

// --- The four-corner test composite ---
// Cells 1, 4, 12, 14 at 96×96 height. Look up by cell.n rather than by
// zero-indexed position because the W2 re-plan dropped cells 6/7/11 from
// the grid array — the array is now length 13, but cell numbering is
// preserved (skip-indexed).
const fourIdx = [1, 4, 12, 14].map((n) => renders.findIndex((r) => r.n === n));
const fourCols = 4;
const fcSlotW = Math.max(...fourIdx.map((i) => Math.round((vbs[i]!.w / vbs[i]!.h) * thumbH)));
const fcLabelStripH = 22;
const fcSheetW = fourCols * fcSlotW + (fourCols + 1) * pad;
const fcSheetH = thumbH + fcLabelStripH + 2 * pad;
const fcParts: string[] = [];
fcParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${fcSheetW}" height="${fcSheetH}" viewBox="0 0 ${fcSheetW} ${fcSheetH}">`);
fcParts.push(`<rect width="100%" height="100%" fill="#cfcabb"/>`);
fourIdx.forEach((idx, slot) => {
  const r = renders[idx]!;
  const v = vbs[idx]!;
  const renderedW = (v.w / v.h) * thumbH;
  const x = pad + slot * (fcSlotW + pad) + (fcSlotW - renderedW) / 2;
  const y = pad;
  const scale = thumbH / v.h;
  fcParts.push(`<g transform="translate(${x} ${y}) scale(${scale})">${stripWrapper(r.svg)}</g>`);
  const labelY = y + thumbH + 14;
  const labelX = pad + slot * (fcSlotW + pad) + fcSlotW / 2;
  const tag = ['cell 1 (adult-masc-square)', 'cell 4 (adult-fem-oval)', 'cell 12 (child-round)', 'cell 14 (elder-jowled)'][slot]!;
  fcParts.push(`<text x="${labelX}" y="${labelY}" font-family="sans-serif" font-size="10" fill="#1a1a1a" text-anchor="middle">${tag}</text>`);
});
fcParts.push(`</svg>`);
const fcSheet = fcParts.join('\n');
writeFileSync(`${outdirThumb}/four-corners.svg`, fcSheet);
writeFileSync(`${outdirThumb}/four-corners.png`, svgToPng(fcSheet));
process.stderr.write(`Wrote four-corner test: ${outdirThumb}/four-corners.{svg,png}\n`);

// --- Off-grid probes: pointed-jaw (Joker register) + pear-jaw (Penguin register) ---
// These topologies don't dispatch through any demographic preset today, per task line 165.
// Apply via overrides. Per task: "Demonstrating the pack reaches them helps validate
// the underlying primitive support. NOT a ship gate; soft probe."
//
// pointed: extreme taper. From topology enum in params.ts.
// pear: wide-then-narrow. Penguin register.

const pointedProbe: ComposeArgs = {
  style: 'timmFlat',
  age: 'adult',
  presentation: 'masculine',
  hairstyle: 'shortSwept',
  overrides: mergeOverrides(TIMM_NO_LEADS, {
    head: {
      jaw: {
        topology: 'pointed',
        // Lean into the wedge — Sito p.41 "for the Joker I draw a wedge."
        // We borrow proportions from the masc-adult preset and just swap topology +
        // narrow mentalWidth so the cusp shows.
        mentalWidth: 0.20,
        mentalProtrusion: 0.02,
      },
    },
  }),
};
const pearProbe: ComposeArgs = {
  style: 'timmFlat',
  age: 'adult',
  presentation: 'masculine',
  hairstyle: 'shortSwept',
  overrides: mergeOverrides(TIMM_NO_LEADS, {
    head: {
      jaw: {
        topology: 'pear',
        // Pear = wide at the gonial, heavy at the bottom. Bump bigonial + jowl
        // to lean the pear topology forward (Penguin register).
        bigonialWidth: 0.92,
        jowl: 0.50,
        ramusHeight: 0.40,
      },
    },
  }),
};

const pointedSvg = composeFace(pointedProbe);
writeFileSync(`${outdirProbe}/pointed-jaw.svg`, pointedSvg);
writeFileSync(`${outdirProbe}/pointed-jaw.png`, svgToPng(pointedSvg));
const pearSvg = composeFace(pearProbe);
writeFileSync(`${outdirProbe}/pear-jaw.svg`, pearSvg);
writeFileSync(`${outdirProbe}/pear-jaw.png`, svgToPng(pearSvg));
process.stderr.write(`Wrote off-grid probes: ${outdirProbe}/{pointed-jaw,pear-jaw}.{svg,png}\n`);

process.stderr.write('Done.\n');
