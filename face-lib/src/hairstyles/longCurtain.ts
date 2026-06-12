// longCurtain — Lloyd pass 1 §6 test fixture (2/3): volume + gravity.
//
// Verifies the 3D integrator's gravity term: clumps fall PAST the cranium
// silhouette, projecting hull mass below templeY without using the tailMass
// 2D-fall hack. The whole reason this is a test fixture rather than a
// shipped hairstyle: it exercises the primitive in isolation.
//
// Lloyd's promise (pass 1 §6):
//   "Side-curtain strokes draped past the chin; the hull-merge silhouette
//    extends below templeY without a tailMass cheat. Compare to tailMass=0.6
//    — should reach the same coverage with ~60% fewer strokes."
//
// NOT an aesthetic target. If this looks ugly, that's fine — the integrator
// is working. Polishing the look is the next sprint's pack-work, behind a
// shipped hairstyle that opts into clumpMode='volume'.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'longCurtain — TEST FIXTURE for Lloyd pass 1 §6 volume + gravity. ' +
  'clumpMode: volume, gravity: 0.8, radial: 0. Do not tune.';

const longCurtain: DeepPartial<FaceParams> = {
  hair: {
    style: 'long',
    frontShape: 'parted',
    forehead: 0.30,
    volume: 0.08,
    templeRecession: 0,
    sideFall: 0.20,
    crownPeakX: 0,
    napeExtension: 0.30,
    edgeKind: 'smooth',
    recipe: {
      parting: 'centre',
      clumpMode: 'volume',
      clumpVolume: { gravity: 0.8, radial: 0, radius: 0.12 },
      // No tailMass — the whole point is that the volume primitive
      // obviates the 2D-fall hack.
      leads: [
        // Centre parting + two side-curtain leads to anchor the look.
        { startX: -0.20, startY: 0.78, endX: -0.32, endY: -0.20, size: 2.0, pressureMid: 0.95 },
        { startX:  0.20, startY: 0.78, endX:  0.32, endY: -0.20, size: 2.0, pressureMid: 0.95 },
      ],
    },
  },
};

export default longCurtain;
