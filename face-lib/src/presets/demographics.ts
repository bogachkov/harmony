import type { DeepPartial, FaceParams } from '../model/params.ts';

// Demographic presets — own PROPORTIONS and jaw TOPOLOGY (Leo §3 + §4).
// Per Leo: jaw topology is a CATEGORICAL choice made before smooth parameters.
// Demographics select topology + tune smooth params within it.

export const ages = {
  adult: {} as DeepPartial<FaceParams>,

  // CHILD: cranium dominates, no gonial corner — round topology (Loomis child).
  child: {
    head: {
      cranium: { diameter: 1.0, sidePlaneOffset: 0.44 },
      jaw: {
        topology: 'round',         // no corner; soft U
        ramusHeight: 0.22,
        gonialAngle: 0.95,
        bigonialWidth: 0.55,
        mentalWidth: 0.55,
        mentalProtrusion: 0,
        jowl: 0,
      },
      face: {
        upperThirdRatio: 0.40,
        middleThirdRatio: 0.35,
        lowerThirdRatio: 0.25,
        malarProjection: 0.3,
        browRidgeProjection: 0.10,
      },
    },
    eyes: { spacing: 0.40, size: 0.22, dotSize: 0.025, lidLine: 0, lashes: 0, underlineHint: 0 },
    brows: { fullness: 0.010, arch: 0.7, ridgeY: 0.04, length: 0.15 },
    nose: { length: 0.14, width: 0.10 },
    mouth: { width: 0.18, yOffset: -0.01, upperCurve: 0.15 },
    ears: { helixProtrusion: 0.050 },
    hair: { frontShape: 'straight', forehead: 0.30, volume: 0.10 },
  } satisfies DeepPartial<FaceParams>,

  teen: {
    head: {
      cranium: { diameter: 1.0 },
      jaw: {
        topology: 'oval',           // adult shape arriving
        ramusHeight: 0.34,
        gonialAngle: 0.70,
        bigonialWidth: 0.65,
        mentalWidth: 0.42,
      },
      face: { upperThirdRatio: 0.36, middleThirdRatio: 0.34, lowerThirdRatio: 0.30 },
    },
    eyes: { size: 0.17, lidLine: 0.4 },
    brows: { ridgeY: 0.06 },
    nose: { length: 0.24 },
    mouth: { upperCurve: 0.1 },
    hair: { frontShape: 'parted', forehead: 0.40, volume: 0.06 },
  } satisfies DeepPartial<FaceParams>,

  // ELDER: platysma failure → jowled topology. Long jaw, sag at gonial. Faigin 1990.
  elder: {
    head: {
      cranium: { diameter: 1.0, sidePlaneOffset: 0.40, occipitalProjection: 0.08 },
      jaw: {
        topology: 'jowled',
        ramusHeight: 0.55,
        gonialAngle: 0.40,
        bigonialWidth: 0.72,
        mentalWidth: 0.38,
        mentalProtrusion: 0.02,
        jowl: 0.55,
      },
      face: {
        upperThirdRatio: 0.28,
        middleThirdRatio: 0.32,
        lowerThirdRatio: 0.40,
        browRidgeProjection: 0.5,
      },
    },
    eyes: { size: 0.13, openness: 0.78, dotSize: 0.015, lidLine: 0.7, underlineHint: 0.7, lashes: 0 },
    brows: { fullness: 0.020, arch: 0.20, ridgeY: 0.04, length: 0.20 },
    nose: { length: 0.36, width: 0.16 },
    mouth: { width: 0.22, cornerLift: -0.005, labiomentalShow: 0.5 },
    hair: { frontShape: 'receding', forehead: 0.60, volume: 0.02 },
  } satisfies DeepPartial<FaceParams>,
} as const;

export const presentations = {
  neutral: {} as DeepPartial<FaceParams>,

  // MASCULINE: SQUARE topology — Bridgman block, cusp at gonial corner. Pascal's "box jaw."
  // labiomentalShow replaces the old upperCurve=-0.15 "firmness" cheat (Leo §5).
  masculine: {
    head: {
      cranium: { diameter: 1.0, sidePlaneOffset: 0.40 },
      jaw: {
        topology: 'square',         // CUSP at gonial — the killer masculine signal
        ramusHeight: 0.46,
        gonialAngle: 0.10,
        bigonialWidth: 0.88,
        mentalWidth: 0.50,
        mentalProtrusion: 0.02,
        jowl: 0.10,
      },
      face: { browRidgeProjection: 0.7, malarProjection: 0.4 },
    },
    brows: { fullness: 0.028, arch: 0.15, ridgeY: 0.04, length: 0.26 },
    eyes: { spacing: 0.32, lidLine: 0.5 },
    nose: { length: 0.32, width: 0.19 },
    // No upperCurve cheat. Firmness comes from labiomental + neutral seam.
    mouth: { width: 0.28, upperCurve: 0, lipFullness: 0, labiomentalShow: 0.3 },
    ears: { helixProtrusion: 0.050 },
    hair: { frontShape: 'receding', forehead: 0.48, volume: 0.04 },
  } satisfies DeepPartial<FaceParams>,

  // FEMININE: OVAL topology — Faigin "oval," no visible gonial corner.
  feminine: {
    head: {
      cranium: { diameter: 1.0, sidePlaneOffset: 0.43 },
      jaw: {
        topology: 'oval',
        ramusHeight: 0.36,
        gonialAngle: 0.95,           // soft turn, no cusp
        bigonialWidth: 0.55,
        mentalWidth: 0.50,
        mentalProtrusion: 0,
        jowl: 0,
      },
      face: {
        upperThirdRatio: 0.34,
        middleThirdRatio: 0.34,
        lowerThirdRatio: 0.32,
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
