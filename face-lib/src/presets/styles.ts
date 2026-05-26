import type { DeepPartial, FaceParams } from '../model/params.ts';

// Art-style presets. Applied as the last layer of the parameter cascade — they
// override style/feature settings to produce a recognized rendering style on top
// of the same abstract Loomis scaffold + Faigin expression knobs.

export const styles = {
  // The default rendering style: generic stylized-line-art with subtle hand-drawn wobble.
  // Roughly what the engine produces without a style preset applied.
  default: {} as DeepPartial<FaceParams>,

  // Hergé / Tintin / Asterix tradition. Confident uniform-weight lines, zero wobble,
  // simplified single-stroke features, flat saturated color fills, strong closed silhouette,
  // no shading. The most-shipped comic style in history.
  ligneClaire: {
    style: {
      lineWeight: 2.6,
      jitter: 0,                  // confident "clear line" — no wobble
      color: '#1a1410',           // warm near-black, not pure black
      skinFill: '#f5cea2',        // warm flat skin
      hairFill: '#3a1f10',        // saturated dark brown
      background: '#fff8e8',      // cream page background instead of stark white
    },
    head: {
      sidePlaneInset: 0.10,       // slightly rounder cranium
      chinSharpness: 0.25,        // softer chin
    },
    eyes: {
      size: 0.13,                 // smaller, simpler than default
      openness: 1.0,
    },
    brows: {
      thickness: 0.012,           // thinner so the doubled stroke reads as a single confident line
      arch: 0.5,
    },
    nose: {
      width: 0.12,
      length: 0.24,
    },
    mouth: {
      width: 0.22,
      lipFullness: 0,             // single seam line only — no separate upper/lower lip lines
      cornerMarks: false,         // remove corner ticks (clean line)
      upperCurve: 0,
    },
    ears: {
      size: 0.18,
      protrusion: 0.025,
    },
    hair: {
      style: 'short',
      forehead: 0.40,
      volume: 0.04,
    },
    neck: {
      width: 0.50,
      length: 0.20,
    },
  } satisfies DeepPartial<FaceParams>,
} as const;

export type StyleName = keyof typeof styles;
export const styleNames = Object.keys(styles) as StyleName[];

export const stylePreset = (name: StyleName): DeepPartial<FaceParams> => styles[name];
