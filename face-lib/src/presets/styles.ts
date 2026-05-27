import type { DeepPartial, FaceParams } from '../model/params.ts';

// Art-style presets — RENDERING-ONLY layer.
//
// A style preset describes HOW a face is drawn (line weight, jitter, colors, which
// feature-style enum to pick) but NOT WHO they are (proportions, sizes, positions).
// Proportions are owned by demographic presets (age × presentation) and character
// data files. This keeps characters distinguishable: every "Tintin child" must look
// different from "Tintin elder" must look different from "Tintin feminine adult."
//
// What's allowed here:
//   - style.* (line weight, jitter, color, fills, background)
//   - eyes.style, nose.style, brows.style (discrete enum choices)
//   - mouth.lipFullness / cornerMarks (rendering toggles, not proportions)
//   - hair.style 'short'/'medium'/'long' (length category)
//
// What is FORBIDDEN here (will collapse all characters to one face):
//   - head.width / head.height / head.jawWidth / head.chinSharpness / head.chinDrop
//   - eyes.spacing / eyes.size  (these are character/demographic proportions)
//   - nose.width / nose.length
//   - brows.fullness / brows.length
//   - mouth.width
//   - ears.size / ears.protrusion
//   - neck.width / neck.length
//
// These rules were added after a brutal review revealed every Tintin-styled face
// was structurally identical — only hair color/length varied.

export const styles = {
  // The default rendering style: generic stylized-line-art with subtle hand-drawn wobble.
  default: {} as DeepPartial<FaceParams>,

  // Tintin / Hergé rendering: dot eyes, button nose, single confident brow stroke,
  // zero jitter, cream page. Proportion settings deliberately omitted so demographic
  // presets retain their per-character variation.
  tintin: {
    style: {
      lineWeight: 2.4,
      jitter: 0,
      color: '#1a1410',
      skinFill: '#f6d2a6',
      hairFill: '#3a200f',
      background: '#fff8e8',
    },
    eyes: {
      style: 'dots',
      dotSize: 0.020,
    },
    brows: {
      style: 'single',
    },
    nose: {
      style: 'button',
      showNostrils: false,
      bridgeVisible: false,
    },
    mouth: {
      lipFullness: 0,
      cornerMarks: false,
      upperCurve: 0,
    },
    // Ligne claire = minimal interior anatomy. Hergé's front-view ears are a small
    // "C" tucked against the temple — no Y-fork, no tragus, no concha, and the lobe
    // is integrated into the C rather than dangling. lobeDrop=0 → no comma.
    ears: {
      helixProtrusion: 0.030,  // smaller bulge — past silhouette is a tick, not a flare
      antihelixShow: 0,
      tragusShow: 0,
      conchaShow: 0,
      lobeDrop: 0,             // no dangling comma; lobe is the C's terminus
    },
    neck: {
      scmShow: 0,                  // Hergé doesn't draw SCM
      trapShow: 0,                 // Hergé doesn't draw trapezius
      laryngealProminence: 0,
    },
  } satisfies DeepPartial<FaceParams>,

  // Ligne-claire (Tintin/Asterix/Spirou tradition) generic: confident uniform lines,
  // zero wobble, flat saturated fills, almond eyes, minimalist features. Same rules:
  // no proportion overrides here.
  ligneClaire: {
    style: {
      lineWeight: 2.6,
      jitter: 0,
      color: '#1a1410',
      skinFill: '#f5cea2',
      hairFill: '#3a1f10',
      background: '#fff8e8',
    },
    brows: {
      style: 'single',
    },
    nose: {
      style: 'minimal',
    },
    mouth: {
      lipFullness: 0,
      cornerMarks: false,
    },
  } satisfies DeepPartial<FaceParams>,
} as const;

export type StyleName = keyof typeof styles;
export const styleNames = Object.keys(styles) as StyleName[];

export const stylePreset = (name: StyleName): DeepPartial<FaceParams> => styles[name];
