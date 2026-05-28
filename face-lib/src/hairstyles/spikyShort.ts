// spikyShort — silhouette IS the characterization. No parting, no flow
// strokes; the spiked edge (silhouette teeth) carries everything.
//
// Comic refs: shounen short-spike default (Zoro / Goku / Calvin) — used as a
// CATEGORY reference per the meta-Haddock rule.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'spikyShort — short spiky hair where the silhouette teeth (edgeKind: spiked) ' +
  'carry the characterization. No interior strokes.';

const spikyShort: DeepPartial<FaceParams> = {
  hair: {
    style: 'short',
    frontShape: 'straight',
    forehead: 0.38,
    volume: 0.18,
    templeRecession: 0,
    sideFall: 0,
    crownPeakX: 0.05,
    napeExtension: 0,
    edgeKind: 'spiked',
    recipe: {
      parting: 'none',
      leads: [],
    },
  },
};

export default spikyShort;
