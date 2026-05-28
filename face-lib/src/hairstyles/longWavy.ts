// longWavy — long flowing hair with sinusoidal per-stroke waviness.
// Same engine as longFlowing (field-traced strokes), with each stroke's path
// modulated perpendicular to its tangent so the strands wave instead of
// running straight. Different from coily — coily RADIATES outward via halo
// silhouette; wavy STILL FALLS with gravity but the strands carry curl.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'longWavy — long hair with wavy per-stroke modulation. Same field-trace ' +
  'engine as longFlowing.';

const longWavy: DeepPartial<FaceParams> = {
  hair: {
    style: 'long',
    frontShape: 'parted',
    forehead: 0.32,
    volume: 0.12,
    templeRecession: 0,
    sideFall: 0.55,
    crownPeakX: 0,
    napeExtension: 0.50,
    edgeKind: 'smooth',
    recipe: {
      parting: 'centre',
      leads: [],
      waviness: 0.030,
      waveFrequency: 2.2,
    },
  },
};

export default longWavy;
