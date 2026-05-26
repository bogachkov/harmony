import type { DeepPartial, FaceParams } from '../model/params.ts';

// Art-style presets. Applied as the last layer of the parameter cascade — they
// override style/feature settings to produce a recognized rendering style on top
// of the same abstract Loomis scaffold + Faigin expression knobs.

export const styles = {
  // The default rendering style: generic stylized-line-art with subtle hand-drawn wobble.
  // Roughly what the engine produces without a style preset applied.
  default: {} as DeepPartial<FaceParams>,

  // The actual Tintin face: dot eyes (no eye shape), tiny button nose, single-curve mouth,
  // round head, minimal interior detail. The visual language of Hergé's characters.
  tintin: {
    style: {
      lineWeight: 2.4,
      jitter: 0,
      color: '#1a1410',
      skinFill: '#f6d2a6',
      hairFill: '#3a200f',
      background: '#fff8e8',
    },
    head: {
      width: 0.82,                // rounder, less elongated
      height: 0.92,
      sidePlaneInset: 0.06,       // very round cranium
      jawWidth: 0.58,
      chinDrop: 0.10,
      chinSharpness: 0.10,        // very rounded chin
    },
    eyes: {
      style: 'dots',              // the Tintin signature: just two black dots
      spacing: 0.30,
      dotSize: 0.020,
    },
    brows: {
      thickness: 0.011,
      arch: 0.4,
      length: 0.18,
      yOffset: 0.07,
    },
    nose: {
      style: 'button',            // tiny upturned curve only
      width: 0.08,
      length: 0.18,
      showNostrils: false,
      bridgeVisible: false,
    },
    mouth: {
      width: 0.18,
      lipFullness: 0,
      cornerMarks: false,
      upperCurve: 0,
    },
    ears: {
      visible: true,
      size: 0.16,
      protrusion: 0.022,
    },
    hair: {
      style: 'short',
      forehead: 0.35,
      volume: 0.08,
    },
    neck: {
      width: 0.45,
      length: 0.18,
    },
  } satisfies DeepPartial<FaceParams>,

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
