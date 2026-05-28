// shortPompadour — swept-back volume up front, crown apex pulled forward.
// No parting (parting:'sweptBack'); one upward flow stroke from forehead to
// crown suggesting the back-sweep direction.
//
// Comic refs: Franky (One Piece) — used here as a CATEGORY reference per the
// meta-Haddock rule, not as an optimization target. 50s greaser, Johnny Bravo.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'shortPompadour — swept-back short hair, dome apex pulled forward, no parting. ' +
  'A single upward flow stroke suggests the back-sweep.';

const shortPompadour: DeepPartial<FaceParams> = {
  hair: {
    style: 'short',
    frontShape: 'straight',
    forehead: 0.42,
    volume: 0.14,
    templeRecession: 0.10,
    sideFall: 0,
    crownPeakX: 0.30,
    napeExtension: 0,
    edgeKind: 'smooth',
    recipe: {
      parting: 'sweptBack',
      leads: [
        // ONE upward stroke from mid-front-hairline rising toward the crown apex.
        { startX: 0.08, startY: 0.55, endX: 0.20, endY: 0.85, size: 1.6, pressureMid: 0.85 },
      ],
    },
  },
};

export default shortPompadour;
