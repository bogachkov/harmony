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
    hair: {
      frontShape: 'straight', forehead: 0.30, volume: 0.12,
      templeRecession: 0, sideFall: 0.15, crownPeakX: 0,
      napeExtension: 0.10, edgeKind: 'crowSnipped',
      // Child recipe: no parting, no flow strokes. The crow-snipped silhouette
      // edge is the entire characterization (Loomis 1956 plate 30; Vashti
      // Harrison kid canon). Interior strokes on a child read as un-childlike.
      recipe: { parting: 'none', flowStrokes: [] },
    },
  } satisfies DeepPartial<FaceParams>,

  teen: {
    head: {
      cranium: { diameter: 1.0 },
      jaw: {
        topology: 'oval',           // adult shape arriving, still slightly soft
        ramusHeight: 0.34,
        gonialAngle: 0.78,           // softer than adult, not as sharp as child
        bigonialWidth: 0.62,
        mentalWidth: 0.42,
      },
      face: { upperThirdRatio: 0.36, middleThirdRatio: 0.34, lowerThirdRatio: 0.30 },
    },
    // Teens have visibly LARGER eyes than adults (adolescent eye proportion). Per Leo
    // §8.3 the demographic axis must be legible at thumbnail — bump eye size hard so
    // teen-feminine doesn't collapse into adult-feminine.
    eyes: { size: 0.22, openness: 1.10, dotSize: 0.024, lidLine: 0.4 },
    brows: { ridgeY: 0.06, fullness: 0.014 },
    nose: { length: 0.22 },
    mouth: { upperCurve: 0.15 },
    hair: {
      frontShape: 'parted', forehead: 0.34, volume: 0.13,
      // Teen hair is LONGER + bouncier than adult fem's bob — visibly more mass past
      // the temples + slight forward flick at the fringe.
      templeRecession: 0, sideFall: 0.75, crownPeakX: 0.08,
      napeExtension: 0.55, edgeKind: 'flicked',
    },
  } satisfies DeepPartial<FaceParams>,

  // ELDER: platysma failure → jowled topology. Pulled back: was too extreme on
  // lowerThirdRatio (0.40 = chin-monster) and jowl (0.55). Aging is signaled
  // by the gestalt — jowl + thirds shift + underline + lid line — not by
  // any one parameter pinned to its max.
  elder: {
    head: {
      cranium: { diameter: 1.0, sidePlaneOffset: 0.40, occipitalProjection: 0.06 },
      jaw: {
        topology: 'jowled',
        ramusHeight: 0.48,
        gonialAngle: 0.55,            // softer corner — age = sag, not block
        bigonialWidth: 0.70,
        mentalWidth: 0.42,
        mentalProtrusion: 0.015,
        jowl: 0.38,                    // visible cushion but not pouch
      },
      face: {
        upperThirdRatio: 0.30,
        middleThirdRatio: 0.33,
        lowerThirdRatio: 0.37,         // long but not grotesque
        browRidgeProjection: 0.40,
      },
    },
    eyes: { size: 0.14, openness: 0.82, dotSize: 0.016, lidLine: 0.6, underlineHint: 0.55, lashes: 0 },
    brows: { fullness: 0.022, arch: 0.25, ridgeY: 0.05, length: 0.21 },
    nose: { length: 0.32, width: 0.16 },
    mouth: { width: 0.23, cornerLift: -0.003, labiomentalShow: 0.4 },
    // Elder hair — only the AGE-SPECIFIC knobs (recession, forehead, volume,
    // crownPeakX-shifted-back, frontShape='receding'). Other knobs (sideFall,
    // edgeKind) come from presentation. Per Leo §8.4: age signals hair retreat
    // toward the crown — front recedes, peak shifts slightly back. edgeKind
    // overrides 'flicked' or 'crowSnipped' back to 'smooth' (no characterization
    // flicks on elderly hair).
    hair: {
      frontShape: 'receding', forehead: 0.58, volume: 0.04,
      templeRecession: 0.55, crownPeakX: -0.07, edgeKind: 'smooth',
      // Default elder recipe: shortReceding-like (no parting, no interior).
      // Per hair-tooling §6 STOP #3 + pass-5 STOP HS-4: no interior strokes on
      // a receding scalp (they read as scratches). Pascal feedback (round 6):
      // the cascade default wasn't using the hairstyle primitive — every
      // default-demographic face fell back to a parted-with-flicks recipe.
      recipe: {
        parting: 'none',
        flowStrokes: [],
      },
    },
  } satisfies DeepPartial<FaceParams>,
} as const;

export const presentations = {
  neutral: {} as DeepPartial<FaceParams>,

  // MASCULINE: SQUARE topology — Bridgman block. Pulled back from extreme:
  // a working comic-art masculine reads as "structured jaw + decent brow,"
  // not "action-figure cusp." Avoid the parody-square.
  masculine: {
    head: {
      cranium: { diameter: 1.0, sidePlaneOffset: 0.41 },
      jaw: {
        topology: 'square',
        ramusHeight: 0.44,
        gonialAngle: 0.25,            // visible corner, not knife-cusp
        bigonialWidth: 0.82,          // wide but not Bridgman-textbook
        mentalWidth: 0.46,
        mentalProtrusion: 0.015,
        jowl: 0.08,
      },
      face: { browRidgeProjection: 0.55, malarProjection: 0.42 },
    },
    brows: { fullness: 0.024, arch: 0.25, ridgeY: 0.05, length: 0.24 },
    eyes: { spacing: 0.33, lidLine: 0.4 },
    nose: { length: 0.30, width: 0.17 },
    mouth: { width: 0.27, upperCurve: 0, lipFullness: 0, labiomentalShow: 0.22 },
    ears: { helixProtrusion: 0.048 },
    // Per Leo §8.4 masculine-adult: forward-shifted crown, slight temple
    // recession, no side-fall — reads as "structured, short, parted."
    // Recipe = shortSwept-like (the prior hardcoded default). Pascal feedback
    // (round 6): demographic defaults now explicitly carry a hairstyle recipe
    // so renders without `--hairstyle` still pick up the primitive's variety.
    hair: {
      frontShape: 'parted', forehead: 0.46, volume: 0.07,
      templeRecession: 0.30, sideFall: 0, crownPeakX: 0.10,
      napeExtension: 0, edgeKind: 'flicked',
      recipe: {
        parting: 'sideL',
        flowStrokes: [
          { startX:  0.04, startY: 0.86, endX:  0.42, endY: 0.55, size: 1.8, pressureMid: 0.95 },
          { startX: -0.18, startY: 0.70, endX: -0.32, endY: 0.50, size: 1.4, pressureMid: 0.80 },
        ],
      },
    },
  } satisfies DeepPartial<FaceParams>,

  // FEMININE: OVAL topology. Pulled back HARD per user feedback ("one scary
  // looking ugly lady"). Previously: bigonial 0.55 + gonialAngle 0.95 +
  // ramusHeight 0.36 + small mentalWidth → pointed witch-chin. Now: a soft
  // oval that's recognizably feminine without being a caricature.
  feminine: {
    head: {
      cranium: { diameter: 1.0, sidePlaneOffset: 0.43 },
      jaw: {
        topology: 'oval',
        ramusHeight: 0.40,            // taller — less stubby chin
        gonialAngle: 0.80,            // soft turn, but not full-circle
        bigonialWidth: 0.68,          // narrower than masculine, wider than before
        mentalWidth: 0.46,            // moderate chin pad — NOT a point
        mentalProtrusion: 0,
        jowl: 0,
      },
      face: {
        upperThirdRatio: 0.335,
        middleThirdRatio: 0.335,
        lowerThirdRatio: 0.33,
        browRidgeProjection: 0.20,
        malarProjection: 0.50,
      },
    },
    eyes: { size: 0.19, openness: 1.05, spacing: 0.35, dotSize: 0.022, lidLine: 0.5, lashes: 0.6 },
    brows: { fullness: 0.012, arch: 0.75, ridgeY: 0.08, length: 0.20 },
    nose: { length: 0.24, width: 0.11 },
    mouth: { width: 0.25, upperCurve: 0.30, lipFullness: 0.35, cornerLift: 0.003 },
    // Per Leo §8.4 feminine-adult: chin-length bob (Hergé/Tintin supporting-fem
    // default). Mass falls past the temple; no temple recession; smooth edge.
    // Recipe = bobChinLength-like: centre parting + two short vertical side-curtain
    // strokes. Pascal feedback (round 6): default fem was inheriting the masculine
    // sideSwept recipe → fem-adult and masc-adult had visually-identical hair.
    hair: {
      frontShape: 'parted', forehead: 0.33, volume: 0.10,
      templeRecession: 0, sideFall: 0.45, crownPeakX: 0,
      napeExtension: 0.30, edgeKind: 'smooth',
      recipe: {
        parting: 'centre',
        flowStrokes: [
          { startX: -0.25, startY: 0.60, endX: -0.30, endY: 0.10, size: 1.6, pressureMid: 0.90 },
          { startX:  0.25, startY: 0.60, endX:  0.30, endY: 0.10, size: 1.6, pressureMid: 0.90 },
        ],
      },
    },
  } satisfies DeepPartial<FaceParams>,
} as const;

export type AgeName = keyof typeof ages;
export type PresentationName = keyof typeof presentations;
export const ageNames = Object.keys(ages) as AgeName[];
export const presentationNames = Object.keys(presentations) as PresentationName[];

export const agePreset = (name: AgeName): DeepPartial<FaceParams> => ages[name];
export const presentationPreset = (name: PresentationName): DeepPartial<FaceParams> => presentations[name];
