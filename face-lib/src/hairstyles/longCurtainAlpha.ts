// longCurtainAlpha — sibling of longCurtain that opts into hullMode: 'alpha'.
//
// Per Lloyd pass 2 §4 (NEEDS-CHANGES on alpha-shape deferral): the convex
// hull v1 renders longCurtain as a nun's wimple — the centre parting gap is
// eaten by the merger. Alpha-shape preserves the gap; this fixture exercises
// the alpha-shape merger on the same volume + gravity primitive as
// longCurtain so the two can be compared side-by-side.
//
// Mixture rule (Nick decision in this PR's handoff): leave longCurtain on
// convex as the regression-history record of the v1 hull behaviour; add this
// sibling so alpha is REACHABLE as a preset. Both are W1-fixture-equivalent
// probes, not aesthetic targets.
//
// NOT an aesthetic target. See longCurtain.ts header — same caveat applies.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'longCurtainAlpha — TEST FIXTURE for Lloyd pass 2 §4 alpha-shape merger. ' +
  'Same as longCurtain but with hullMode: alpha. Do not tune.';

const longCurtainAlpha: DeepPartial<FaceParams> = {
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
      hullMode: 'alpha',
      leads: [
        { startX: -0.20, startY: 0.78, endX: -0.32, endY: -0.20, size: 2.0, pressureMid: 0.95 },
        { startX:  0.20, startY: 0.78, endX:  0.32, endY: -0.20, size: 2.0, pressureMid: 0.95 },
      ],
    },
  },
};

export default longCurtainAlpha;
