// shortReceding — mature recession. Heavy templeRecession + raised forehead;
// no parting (a parting on a balding head reads as a scratch); no flow strokes.
// The defining feature is the M-shape recession in the silhouette itself.
//
// Comic refs: mature Caniff men, elder Hergé characters, Norwood-3 to -5.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'shortReceding — significant temple recession, raised hairline, no interior ' +
  'strokes. The M-shape is the characterization.';

const shortReceding: DeepPartial<FaceParams> = {
  hair: {
    style: 'short',
    frontShape: 'receding',
    forehead: 0.62,
    volume: 0.04,
    templeRecession: 0.85,
    sideFall: 0,
    crownPeakX: -0.05,
    napeExtension: 0,
    edgeKind: 'smooth',
    recipe: {
      parting: 'none',
      flowStrokes: [],
    },
  },
};

export default shortReceding;
