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
        // LEFT side-curtain — vertical stroke ALONG the side of the bob,
        // starting near the parting top and falling well past the temple to
        // suggest hair MASS rather than a thin tick. Pascal round 6: prior
        // curtains were too short/thin to register.
        { startX: -0.22, startY: 0.72, endX: -0.32, endY: -0.10, size: 2.4, pressureMid: 1.0 },
        // RIGHT side-curtain — mirror.
        { startX:  0.22, startY: 0.72, endX:  0.32, endY: -0.10, size: 2.4, pressureMid: 1.0 },
      ],
    },
  },
};

export default bobChinLength;
