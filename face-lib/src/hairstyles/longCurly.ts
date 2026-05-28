// longCurly — long, tight curls. Same field-trace engine as longFlowing,
// with HIGH waviness amplitude AND HIGH frequency so each stroke carries
// multiple tight curl cycles instead of gentle waves.
//
// Reference category (not optimization target per the meta-Haddock rule):
// the big curly hair archetype — the user's "big curly Jewish hair," ringlet
// hair, Hermione Granger, etc. Distinct from `curlyDome` which is the
// AFRO-canon halo-radiation primitive (no interior strands; the texture
// lives on the silhouette edge). longCurly suggests curly strands FALLING
// past the shoulders — different geometric regime.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'longCurly — long curly hair, tight per-stroke curl cycles, strands fall ' +
  'past the shoulders (distinct from curlyDome which is a coily halo).';

const longCurly: DeepPartial<FaceParams> = {
  hair: {
    style: 'long',
    frontShape: 'parted',
    forehead: 0.34,
    volume: 0.16,
    templeRecession: 0,
    sideFall: 0.65,
    crownPeakX: 0,
    napeExtension: 0.55,
    edgeKind: 'smooth',
    recipe: {
      parting: 'centre',
      flowStrokes: [],
      waviness: 0.075,
      waveFrequency: 5.0,
    },
  },
};

export default longCurly;
