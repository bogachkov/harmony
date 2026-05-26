import type { DeepPartial, FaceParams } from '../model/params.ts';

// Faigin-inspired expression overrides. Each preset patches the default parameter set.
// Names match Ekman's six basic emotions plus neutral.

export const expressions = {
  neutral: {} as DeepPartial<FaceParams>,

  happy: {
    brows: { outerHeight: 0.005, arch: 0.6 },
    eyes: { openness: 0.85 },
    mouth: { cornerLift: 0.03, width: 0.32, upperCurve: 0.2 },
  } satisfies DeepPartial<FaceParams>,

  // Inner brows pull down and together → outer brows up. Eyes narrow. Mouth tightens, corners pull slightly down.
  angry: {
    brows: { innerHeight: -0.022, outerHeight: 0.006, arch: 0.2 },
    eyes: { openness: 0.7, tilt: -0.05 },
    mouth: { cornerLift: -0.012, width: 0.24, upperCurve: -0.3 },
    nose: { width: 0.16 },
  } satisfies DeepPartial<FaceParams>,

  // Inner brows pull up (classic grief lift), outers drop. Eyes droop. Mouth corners down.
  sad: {
    brows: { innerHeight: 0.018, outerHeight: -0.006, arch: 0.7 },
    eyes: { openness: 0.6, tilt: -0.04 },
    mouth: { cornerLift: -0.022, width: 0.24 },
  } satisfies DeepPartial<FaceParams>,

  surprised: {
    brows: { yOffset: 0.13, arch: 0.9, innerHeight: 0.008, outerHeight: 0.012 },
    eyes: { openness: 1.35 },
    mouth: { openness: 0.6, width: 0.18 },
  } satisfies DeepPartial<FaceParams>,

  // Brows up and pulled together; eyes very wide; mouth corners stretched back.
  fearful: {
    brows: { yOffset: 0.11, innerHeight: 0.012, outerHeight: 0.006, arch: 0.4 },
    eyes: { openness: 1.25 },
    mouth: { width: 0.34, openness: 0.25, cornerLift: -0.005 },
  } satisfies DeepPartial<FaceParams>,

  // Upper lip raises; nose wrinkles (we widen it slightly); brows knit.
  disgust: {
    brows: { innerHeight: -0.018, outerHeight: 0.002, arch: 0.3 },
    eyes: { openness: 0.65 },
    nose: { width: 0.17 },
    mouth: { upperCurve: 0.9, cornerLift: -0.005, width: 0.26 },
  } satisfies DeepPartial<FaceParams>,
} as const;

export type ExpressionName = keyof typeof expressions;
export const expressionNames = Object.keys(expressions) as ExpressionName[];

export const expressionPreset = (name: ExpressionName): DeepPartial<FaceParams> => expressions[name];
