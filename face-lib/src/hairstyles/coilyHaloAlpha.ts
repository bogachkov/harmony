// coilyHaloAlpha — sibling of coilyHalo that opts into hullMode: 'alpha'.
//
// Per Lloyd pass 2 §4 (NEEDS-CHANGES on alpha-shape deferral): the convex
// hull v1 renders coilyHalo as a hexagon — the flat-edge polygon top
// completely loses the radial halo silhouette the radial term produces.
// Alpha-shape carves the concavity back in; this fixture exercises the
// alpha-shape merger on the same volume + radial primitive as coilyHalo so
// the two can be compared side-by-side.
//
// Mixture rule (Nick decision in this PR's handoff): leave coilyHalo on
// convex as the regression-history record of the v1 hexagon artefact; add
// this sibling so alpha is REACHABLE as a preset. Both are W1-fixture-
// equivalent probes, not aesthetic targets.
//
// NOT an aesthetic target. See coilyHalo.ts header — same caveat applies.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'coilyHaloAlpha — TEST FIXTURE for Lloyd pass 2 §4 alpha-shape merger. ' +
  'Same as coilyHalo but with hullMode: alpha. Do not tune.';

const coilyHaloAlpha: DeepPartial<FaceParams> = {
  hair: {
    style: 'medium',
    frontShape: 'straight',
    forehead: 0.42,
    volume: 0.05,
    templeRecession: 0,
    sideFall: 0.20,
    crownPeakX: 0,
    napeExtension: 0.20,
    edgeKind: 'smooth',
    recipe: {
      parting: 'none',
      clumpMode: 'volume',
      clumpVolume: { gravity: 0, radial: 0.6, radius: 0.14 },
      hullMode: 'alpha',
      leads: [],
    },
  },
};

export default coilyHaloAlpha;
