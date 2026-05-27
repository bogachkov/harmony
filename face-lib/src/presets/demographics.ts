import type { DeepPartial, FaceParams } from '../model/params.ts';

// Demographic presets — own PROPORTIONS (cranium/jaw masses and Loomis thirds).
// Per Leo's audit (research/leo-audit.md §3, §7): each demographic encodes 2-3
// SEQUENTIAL artistic decisions, not a parallel knob-dump. Comments label the
// decision being expressed by each line.

export const ages = {
  adult: {} as DeepPartial<FaceParams>,

  // CHILD: 1) cranium dominates (relatively bigger ball vs small jaw mass —
  // Loomis 1956 child-proportions); 2) eye-line sits BELOW the half-head
  // midpoint (achieved via Loomis thirds: upper third smaller, lower third
  // larger so the eye-midline falls below the half-head); 3) features are
  // small on the bigger cranium.
  child: {
    head: {
      cranium: { diameter: 1.0, sidePlaneOffset: 0.44 },     // round, classic cranium
      jaw: {
        ramusHeight: 0.22,        // small jaw mass — cranium-to-jaw ratio is the killer signal
        gonialAngle: 0.95,         // very soft (~133°) — no defined corner
        bigonialWidth: 0.55,       // narrow jaw
        mentalWidth: 0.55,         // wide rounded chin pad (= mostly round chin)
        mentalProtrusion: 0,
        jowl: 0,
      },
      face: {
        upperThirdRatio: 0.40,     // bigger forehead → eyes appear lower
        middleThirdRatio: 0.35,
        lowerThirdRatio: 0.25,
        malarProjection: 0.3,
        browRidgeProjection: 0.10, // child barely has a brow ridge
      },
    },
    eyes: { spacing: 0.40, size: 0.22, dotSize: 0.025, lidLine: 0, lashes: 0, underlineHint: 0 },
    brows: { fullness: 0.010, arch: 0.7, ridgeY: 0.04, length: 0.15 },
    nose: { length: 0.14, width: 0.10 },
    mouth: { width: 0.18, yOffset: -0.01, upperCurve: 0.15 },
    ears: { size: 0.25, protrusion: 0.030 },
    hair: { frontShape: 'straight', forehead: 0.30, volume: 0.10 },
  } satisfies DeepPartial<FaceParams>,

  teen: {
    head: {
      cranium: { diameter: 1.0 },
      jaw: { ramusHeight: 0.34, gonialAngle: 0.70, bigonialWidth: 0.65, mentalWidth: 0.42 },
      face: { upperThirdRatio: 0.36, middleThirdRatio: 0.34, lowerThirdRatio: 0.30 },
    },
    eyes: { size: 0.17, lidLine: 0.4 },
    brows: { ridgeY: 0.06 },
    nose: { length: 0.24 },
    mouth: { upperCurve: 0.1 },
    hair: { frontShape: 'parted', forehead: 0.40, volume: 0.06 },
  } satisfies DeepPartial<FaceParams>,

  // ELDER: 1) longer face (jaw drops, soft tissue sags) — increase ramusHeight;
  // 2) cartilage continues to grow (nose/ears bigger); 3) brow ridge more
  // prominent (less surrounding fat); 4) Loomis thirds shift: lower third
  // becomes proportionally bigger (sagging jaw); 5) eyes hooded.
  elder: {
    head: {
      cranium: { diameter: 1.0, sidePlaneOffset: 0.40, occipitalProjection: 0.08 },
      jaw: {
        ramusHeight: 0.55,         // jaw mass drops
        gonialAngle: 0.40,          // somewhat defined (less cushion) — closer to 110°
        bigonialWidth: 0.66,
        mentalWidth: 0.35,
        mentalProtrusion: 0.02,
        jowl: 0.5,                  // visible sag at the gonial corner
      },
      face: {
        upperThirdRatio: 0.28,      // forehead shorter (or rather hairline often higher visually)
        middleThirdRatio: 0.32,
        lowerThirdRatio: 0.40,      // longer lower third — the sag
        browRidgeProjection: 0.5,
      },
    },
    eyes: { size: 0.13, openness: 0.78, dotSize: 0.015, lidLine: 0.7, underlineHint: 0.7, lashes: 0 },
    brows: { fullness: 0.020, arch: 0.20, ridgeY: 0.04, length: 0.20 },
    nose: { length: 0.36, width: 0.16 },
    mouth: { width: 0.22, upperCurve: -0.35, cornerLift: -0.005 },
    hair: { frontShape: 'receding', forehead: 0.60, volume: 0.02 },
  } satisfies DeepPartial<FaceParams>,
} as const;

// Presentation presets — stylized convention encoding the artist's 2-3 sequential
// decisions for masculine/feminine reading. Per Leo's audit, the killer signals
// are gonialAngle (mandible corner sharpness) and bigonialWidth (jaw width); the
// cranium ball itself reads similar.
export const presentations = {
  neutral: {} as DeepPartial<FaceParams>,

  // MASCULINE: 1) square jaw (low gonialAngle, near 90°);
  // 2) wide bigonial (near cranium width);
  // 3) prominent brow ridge — Hampton ch.5.
  masculine: {
    head: {
      cranium: { diameter: 1.0, sidePlaneOffset: 0.40 },
      jaw: {
        ramusHeight: 0.46,
        gonialAngle: 0.10,         // SHARP corner ~95° — the killer masculine signal
        bigonialWidth: 0.88,        // wide jaw, near cranium width
        mentalWidth: 0.45,          // moderately wide chin
        mentalProtrusion: 0.02,
        jowl: 0.1,
      },
      face: {
        browRidgeProjection: 0.7,   // pronounced brow ridge
        malarProjection: 0.4,
      },
    },
    brows: { fullness: 0.028, arch: 0.15, ridgeY: 0.04, length: 0.26 },
    eyes: { spacing: 0.32, lidLine: 0.5 },
    nose: { length: 0.32, width: 0.19 },
    mouth: { width: 0.28, upperCurve: -0.15, lipFullness: 0 },
    ears: { size: 0.24, protrusion: 0.034 },
    hair: { frontShape: 'receding', forehead: 0.48, volume: 0.04 },
  } satisfies DeepPartial<FaceParams>,

  // FEMININE: 1) narrow tapered jaw (high gonialAngle ~130°, narrow bigonial);
  // 2) softer chin (wider mentalWidth — more round, less pointed);
  // 3) higher arched brow ridge;
  // 4) eye-line sits a hair higher (smaller lowerThird).
  feminine: {
    head: {
      cranium: { diameter: 1.0, sidePlaneOffset: 0.43 },
      jaw: {
        ramusHeight: 0.36,
        gonialAngle: 0.90,         // SOFT corner ~130° — the killer feminine signal
        bigonialWidth: 0.52,        // narrow jaw
        mentalWidth: 0.50,          // softer, rounder chin pad
        mentalProtrusion: 0,
        jowl: 0,
      },
      face: {
        upperThirdRatio: 0.34,
        middleThirdRatio: 0.34,
        lowerThirdRatio: 0.32,      // slightly shorter lower third
        browRidgeProjection: 0.15,
        malarProjection: 0.6,
      },
    },
    eyes: { size: 0.22, openness: 1.10, spacing: 0.36, dotSize: 0.024, lidLine: 0.6, lashes: 0.8 },
    brows: { fullness: 0.010, arch: 0.95, ridgeY: 0.09, length: 0.19 },
    nose: { length: 0.22, width: 0.09 },
    mouth: { width: 0.26, upperCurve: 0.45, lipFullness: 0.5, cornerLift: 0.005 },
    hair: { frontShape: 'widows-peak', forehead: 0.30, volume: 0.10 },
  } satisfies DeepPartial<FaceParams>,
} as const;

export type AgeName = keyof typeof ages;
export type PresentationName = keyof typeof presentations;
export const ageNames = Object.keys(ages) as AgeName[];
export const presentationNames = Object.keys(presentations) as PresentationName[];

export const agePreset = (name: AgeName): DeepPartial<FaceParams> => ages[name];
export const presentationPreset = (name: PresentationName): DeepPartial<FaceParams> => presentations[name];
