// longWitch — long, chaotic, wild hair. Extreme waviness + high frequency.
// The "ugly witch" / madwoman / Medusa archetype the user specifically
// asked the engine to be able to render.
//
// Same long-hair engine; just pushed the per-stroke variation parameters
// past the "elegant" range into "wild." Distinct from longCurly which has
// coherent tight curls — longWitch has unhinged spread.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'longWitch (experimental) — wild chaotic long hair. Extreme waviness, ' +
  'no centre parting, strokes spread in all directions.';

const longWitch: DeepPartial<FaceParams> = {
  hair: {
    style: 'long',
    frontShape: 'straight',
    forehead: 0.28,
    volume: 0.18,
    templeRecession: 0,
    sideFall: 0.70,
    crownPeakX: 0,
    napeExtension: 0.60,
    edgeKind: 'crowSnipped',
    recipe: {
      parting: 'none',
      leads: [],
      waviness: 0.085,
      waveFrequency: 4.5,
    },
  },
};

export default longWitch;
