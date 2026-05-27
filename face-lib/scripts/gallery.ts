// Robust test-case library — per AGENTS.md "variety in test rotation."
//
// Image generation is essentially free with this engine. Six similar faces is a
// confirmation-bias trap, not a test set. This file defines a broad cross-product
// of demographics × hairstyles × skin/hair tones (ethnicity proxies) × expressions,
// and a deterministic sampling function so Fred can render N of them per iteration
// without picking favorites.
//
// Usage:
//   node --experimental-strip-types scripts/gallery.ts             → 16 default samples
//   node --experimental-strip-types scripts/gallery.ts 24          → 24 samples
//   node --experimental-strip-types scripts/gallery.ts 24 /tmp/g   → custom outdir
//   node --experimental-strip-types scripts/gallery.ts --all       → render every case
//   node --experimental-strip-types scripts/gallery.ts --seed 7    → different sample
//
// Extending: append entries to TEST_CASES below. Keep labels descriptive — they
// become the filename prefix in the output dir.

import { writeFileSync, mkdirSync } from 'node:fs';
import { composeFace } from '../src/api.ts';
import type { ComposeArgs, DeepPartial, FaceParams } from '../src/api.ts';
import { svgToPng } from '../src/render/raster.ts';

// ---- Ethnicity proxies (NOT a full ethnicity model — just skin/hair tone overrides;
// the real per-ethnicity facial-proportion work belongs in a Leo research pass
// before it ships as a preset axis). Names here are descriptive labels for the
// gallery; treat them as visual diversity sampling, not as canonical demographics.
const skinTones: Record<string, string> = {
  paleCool:    '#f6dccc',
  paleWarm:    '#f4d8c0',
  tan:         '#e2b896',
  olive:       '#cba078',
  brownLight:  '#a87856',
  brownMid:    '#7a5536',
  brownDeep:   '#4f3220',
};

const hairTones: Record<string, string> = {
  black:       '#181410',
  darkBrown:   '#3a2418',
  brown:       '#5c3a22',
  auburn:      '#6e2e1c',
  blondeDark:  '#8a6532',
  blondeLight: '#c6a060',
  grey:        '#888076',
  white:       '#ddd5cc',
  red:         '#9c3a18',
};

// ---- Hair archetype overrides — beyond what the demographic presets cover.
// Each name corresponds to a knob tuple over the FaceParams.hair surface.
const hairArchetypes: Record<string, DeepPartial<FaceParams>> = {
  // Default (let demographic preset decide).
  preset: {},

  // Long & flowing — wide sideFall, edge textured to break uniformity, big napeExtension.
  longFlowing: {
    hair: {
      style: 'long', frontShape: 'parted', forehead: 0.34, volume: 0.14,
      templeRecession: 0, sideFall: 0.95, crownPeakX: 0,
      napeExtension: 0.85, edgeKind: 'edgeTextured',
    },
  },

  // Spiked — shounen-manga silhouette teeth on the dome edge.
  spiked: {
    hair: {
      style: 'short', frontShape: 'straight', forehead: 0.36, volume: 0.18,
      templeRecession: 0, sideFall: 0, crownPeakX: 0,
      napeExtension: 0, edgeKind: 'spiked',
    },
  },

  // Afro / coily halo — large round envelope, edge-textured boundary.
  // (Leo pass-2 §1: NOT a "more wave on the wavy preset" — distinct primitive.)
  coilyHalo: {
    hair: {
      style: 'medium', frontShape: 'straight', forehead: 0.30, volume: 0.22,
      templeRecession: 0, sideFall: 0.20, crownPeakX: 0,
      napeExtension: 0.15, edgeKind: 'edgeTextured',
    },
  },

  // Slick-back exec — crown shifted toward nape, smooth, moderate recession.
  slickBack: {
    hair: {
      style: 'short', frontShape: 'parted', forehead: 0.50, volume: 0.06,
      templeRecession: 0.40, sideFall: 0, crownPeakX: -0.20,
      napeExtension: 0.10, edgeKind: 'smooth',
    },
  },

  // Bald cap (no hair at all).
  bald: { hair: { style: 'bald' } },

  // Crew cut — very short, mild recession, no flick.
  crewCut: {
    hair: {
      style: 'short', frontShape: 'straight', forehead: 0.42, volume: 0.03,
      templeRecession: 0.15, sideFall: 0, crownPeakX: 0,
      napeExtension: 0, edgeKind: 'smooth',
    },
  },

  // Asymmetric forelock — Tintin-style flick promoted to the silhouette.
  forelock: {
    hair: {
      style: 'short', frontShape: 'parted', forehead: 0.42, volume: 0.12,
      templeRecession: 0.20, sideFall: 0, crownPeakX: 0.25,
      napeExtension: 0, edgeKind: 'flicked',
    },
  },

  // Long ponytail-ish (no rear support in front view, but the mass extension shows).
  longBack: {
    hair: {
      style: 'long', frontShape: 'parted', forehead: 0.38, volume: 0.10,
      templeRecession: 0, sideFall: 0.30, crownPeakX: 0,
      napeExtension: 0.95, edgeKind: 'smooth',
    },
  },
};

type Sample = { label: string; args: ComposeArgs };

const styleSkin = (skin: string, hair: string): DeepPartial<FaceParams> => ({
  style: { skinFill: skin, hairFill: hair },
});

// ---- Test case library. Each entry is a concrete composition Fred should be
// able to render. Order is intentional — Fred can sample the first N (cheap test)
// or shuffle for variety. Adding cases here is cheaper than building a new test
// harness — append, never delete.
const TEST_CASES: Sample[] = [
  // === Tier 1: the six original demographics, neutral expression ===
  { label: 'adult-masc',      args: { style: 'tintin', age: 'adult', presentation: 'masculine' } },
  { label: 'adult-fem',       args: { style: 'tintin', age: 'adult', presentation: 'feminine' } },
  { label: 'elder-masc',      args: { style: 'tintin', age: 'elder', presentation: 'masculine' } },
  { label: 'elder-fem',       args: { style: 'tintin', age: 'elder', presentation: 'feminine' } },
  { label: 'child-neutral',   args: { style: 'tintin', age: 'child', presentation: 'neutral' } },
  { label: 'teen-fem',        args: { style: 'tintin', age: 'teen',  presentation: 'feminine' } },

  // === Tier 2: each demographic × Ekman expressions ===
  ...(['happy','sad','angry','surprised','fearful','disgust'] as const).flatMap((exp) => [
    { label: `adult-masc-${exp}`, args: { style: 'tintin', age: 'adult', presentation: 'masculine', expression: exp } },
    { label: `adult-fem-${exp}`,  args: { style: 'tintin', age: 'adult', presentation: 'feminine',  expression: exp } },
  ] satisfies Sample[]),

  // === Tier 3: skin × hair tone variations (ethnicity proxy) ===
  { label: 'fem-tan-brown',          args: { style: 'tintin', age: 'adult', presentation: 'feminine',  overrides: styleSkin(skinTones.tan,        hairTones.brown) } },
  { label: 'fem-olive-black',        args: { style: 'tintin', age: 'adult', presentation: 'feminine',  overrides: styleSkin(skinTones.olive,      hairTones.black) } },
  { label: 'fem-brownMid-black',     args: { style: 'tintin', age: 'adult', presentation: 'feminine',  overrides: styleSkin(skinTones.brownMid,   hairTones.black) } },
  { label: 'fem-brownDeep-black',    args: { style: 'tintin', age: 'adult', presentation: 'feminine',  overrides: styleSkin(skinTones.brownDeep,  hairTones.black) } },
  { label: 'fem-paleCool-blondeLt',  args: { style: 'tintin', age: 'adult', presentation: 'feminine',  overrides: styleSkin(skinTones.paleCool,   hairTones.blondeLight) } },
  { label: 'fem-paleWarm-red',       args: { style: 'tintin', age: 'adult', presentation: 'feminine',  overrides: styleSkin(skinTones.paleWarm,   hairTones.red) } },
  { label: 'masc-brownLight-black',  args: { style: 'tintin', age: 'adult', presentation: 'masculine', overrides: styleSkin(skinTones.brownLight, hairTones.black) } },
  { label: 'masc-brownDeep-black',   args: { style: 'tintin', age: 'adult', presentation: 'masculine', overrides: styleSkin(skinTones.brownDeep,  hairTones.black) } },
  { label: 'masc-olive-darkBrown',   args: { style: 'tintin', age: 'adult', presentation: 'masculine', overrides: styleSkin(skinTones.olive,      hairTones.darkBrown) } },
  { label: 'elder-masc-grey',        args: { style: 'tintin', age: 'elder', presentation: 'masculine', overrides: styleSkin(skinTones.paleWarm,   hairTones.grey) } },
  { label: 'elder-fem-white',        args: { style: 'tintin', age: 'elder', presentation: 'feminine',  overrides: styleSkin(skinTones.paleWarm,   hairTones.white) } },
  { label: 'elder-fem-grey',         args: { style: 'tintin', age: 'elder', presentation: 'feminine',  overrides: styleSkin(skinTones.brownLight, hairTones.grey) } },

  // === Tier 4: hairstyle archetypes beyond the demographic-preset defaults ===
  ...(Object.entries(hairArchetypes)).filter(([k]) => k !== 'preset').flatMap(([name, hairOv]) => [
    { label: `fem-hair-${name}`,  args: { style: 'tintin', age: 'adult', presentation: 'feminine',  overrides: hairOv } },
    { label: `masc-hair-${name}`, args: { style: 'tintin', age: 'adult', presentation: 'masculine', overrides: hairOv } },
  ] satisfies Sample[]),

  // === Tier 5: cross-product spot checks (intentional uniformity-trap probes) ===
  { label: 'child-happy-brownMid',  args: { style: 'tintin', age: 'child', presentation: 'neutral',   expression: 'happy',     overrides: styleSkin(skinTones.brownMid, hairTones.black) } },
  { label: 'teen-surprised-olive',  args: { style: 'tintin', age: 'teen',  presentation: 'feminine',  expression: 'surprised', overrides: styleSkin(skinTones.olive,    hairTones.darkBrown) } },
  { label: 'elder-sad-brownDeep',   args: { style: 'tintin', age: 'elder', presentation: 'masculine', expression: 'sad',       overrides: styleSkin(skinTones.brownDeep, hairTones.white) } },
  { label: 'adult-angry-paleWarm',  args: { style: 'tintin', age: 'adult', presentation: 'masculine', expression: 'angry',     overrides: styleSkin(skinTones.paleWarm,  hairTones.red) } },
  { label: 'fem-longFlowing-tan',   args: { style: 'tintin', age: 'adult', presentation: 'feminine',  overrides: { ...styleSkin(skinTones.tan, hairTones.auburn), ...hairArchetypes.longFlowing } } },
  { label: 'masc-coily-brownDeep',  args: { style: 'tintin', age: 'adult', presentation: 'masculine', overrides: { ...styleSkin(skinTones.brownDeep, hairTones.black), ...hairArchetypes.coilyHalo } } },
];

// ---- Deterministic Fisher-Yates with a seeded RNG so identical args produce identical sample.
const seededRng = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const sample = (cases: Sample[], n: number, seed: number): Sample[] => {
  if (n >= cases.length) return [...cases];
  const rng = seededRng(seed);
  const idx = cases.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j] as number, idx[i] as number];
  }
  return idx.slice(0, n).map((i) => cases[i] as Sample);
};

const parseArgs = (argv: string[]): { count: number; outdir: string; all: boolean; seed: number } => {
  let count = 16;
  let outdir = '/tmp/gallery';
  let all = false;
  let seed = 1;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] as string;
    if (a === '--all') all = true;
    else if (a === '--seed') seed = Number(argv[++i] ?? '1');
    else if (/^\d+$/.test(a)) count = Number(a);
    else outdir = a;
  }
  return { count, outdir, all, seed };
};

const main = (): void => {
  const { count, outdir, all, seed } = parseArgs(process.argv.slice(2));
  mkdirSync(outdir, { recursive: true });
  const picks = all ? TEST_CASES : sample(TEST_CASES, count, seed);
  process.stderr.write(`Library: ${TEST_CASES.length} cases. Rendering ${picks.length} (seed=${seed}).\n`);
  for (let i = 0; i < picks.length; i++) {
    const { label, args } = picks[i] as Sample;
    const svg = composeFace(args);
    const png = svgToPng(svg);
    const file = `${outdir}/${String(i + 1).padStart(2, '0')}-${label}.png`;
    writeFileSync(file, png);
    process.stderr.write(`  ${file}\n`);
  }
  process.stderr.write(`Done. ${picks.length} images in ${outdir}/.\n`);
};

main();
