// bobChinLength — chin-length bob with centre parting. Significant sideFall
// puts mass past the ears; ONE long side-curtain sweep on each side replaces
// the parting-+-2-flow-flicks recipe.
//
// Comic refs: Bianca Castafiore short variant, classic flapper bob,
// Robin (One Piece) — used as CATEGORY references.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'bobChinLength — chin-length bob, mass extends past the ears (sideFall), ' +
  'centre parting, side-curtain flow on each side.';

const bobChinLength: DeepPartial<FaceParams> = {
  hair: {
    style: 'medium',
    frontShape: 'parted',
    forehead: 0.33,
    volume: 0.10,
    templeRecession: 0,
    sideFall: 0.55,
    crownPeakX: 0,
    napeExtension: 0.35,
    edgeKind: 'smooth',
    recipe: {
      parting: 'centre',
      flowStrokes: [
        // LEFT side-curtain — short downward stroke ALONG the side of the bob,
        // starting outside the parting and falling roughly vertically. (Earlier
        // attempt went diagonally crown→far-temple, which read as crossed
        // rays across the face.)
        { startX: -0.25, startY: 0.60, endX: -0.30, endY: 0.10, size: 1.6, pressureMid: 0.90 },
        // RIGHT side-curtain — mirror.
        { startX:  0.25, startY: 0.60, endX:  0.30, endY: 0.10, size: 1.6, pressureMid: 0.90 },
      ],
    },
  },
};

export default bobChinLength;
