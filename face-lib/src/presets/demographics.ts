import type { DeepPartial, FaceParams } from '../model/params.ts';

// Age presets — alter cranium/feature proportions only.
// Note: framed as measurable proportions (cranium ratio, jaw width, feature size) not racial categories,
// per the architecture discussion.

export const ages = {
  adult: {} as DeepPartial<FaceParams>,

  child: {
    head: { width: 0.82, height: 0.95, depth: 0.95, jawWidth: 0.58, chinDrop: 0.10, chinSharpness: 0.15 },
    eyes: { spacing: 0.32, size: 0.20, yOffset: -0.04 },        // larger eyes, set lower on the bigger cranium
    brows: { thickness: 0.014, arch: 0.6 },
    nose: { length: 0.18, width: 0.13 },
    mouth: { width: 0.22, yOffset: -0.01 },
  } satisfies DeepPartial<FaceParams>,

  teen: {
    head: { jawWidth: 0.60, chinDrop: 0.16 },
    nose: { length: 0.26 },
  } satisfies DeepPartial<FaceParams>,

  elder: {
    head: { width: 0.74, height: 1.05, jawWidth: 0.64, chinDrop: 0.22, chinSharpness: 0.6 },
    eyes: { size: 0.14, openness: 0.85 },
    brows: { thickness: 0.022, arch: 0.3 },
    nose: { length: 0.32, width: 0.16 },
    mouth: { width: 0.24, upperCurve: -0.2 },
  } satisfies DeepPartial<FaceParams>,
} as const;

// Presentation presets — bundle of conventional stylized proportions. Not biology; pure rendering shorthand.
export const presentations = {
  neutral: {} as DeepPartial<FaceParams>,

  masculine: {
    head: { jawWidth: 0.68, chinSharpness: 0.55, sidePlaneInset: 0.14 },
    brows: { thickness: 0.024, arch: 0.3, yOffset: 0.07 },
    nose: { width: 0.16 },
    mouth: { width: 0.26 },
  } satisfies DeepPartial<FaceParams>,

  feminine: {
    head: { jawWidth: 0.55, chinSharpness: 0.3 },
    eyes: { size: 0.18 },
    brows: { thickness: 0.014, arch: 0.7 },
    nose: { width: 0.12, length: 0.25 },
    mouth: { width: 0.30, upperCurve: 0.3 },
  } satisfies DeepPartial<FaceParams>,
} as const;

export type AgeName = keyof typeof ages;
export type PresentationName = keyof typeof presentations;
export const ageNames = Object.keys(ages) as AgeName[];
export const presentationNames = Object.keys(presentations) as PresentationName[];

export const agePreset = (name: AgeName): DeepPartial<FaceParams> => ages[name];
export const presentationPreset = (name: PresentationName): DeepPartial<FaceParams> => presentations[name];
