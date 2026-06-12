// longSleek — long, straight, sleek hair. Same field-trace engine but with
// LOW per-stroke randomness so strands are more aligned (less spread, less
// length variation), giving a clean polished look rather than wild flow.
// Reference: Robin (One Piece) straight-curtain default, classic
// straight-long.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'longSleek — long straight hair with low per-stroke randomness, ' +
  'producing a clean polished curtain.';

const longSleek: DeepPartial<FaceParams> = {
  hair: {
    style: 'long',
    frontShape: 'parted',
    forehead: 0.30,
    volume: 0.08,
    templeRecession: 0,
    sideFall: 0.45,
    crownPeakX: 0,
    napeExtension: 0.50,
    edgeKind: 'smooth',
    recipe: {
      parting: 'centre',
      leads: [],
      waviness: 0,
      waveFrequency: 0,
    },
  },
};

export default longSleek;
