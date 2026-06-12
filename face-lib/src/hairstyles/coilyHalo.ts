// coilyHalo — Lloyd pass 1 §6 test fixture (3/3): volume + positive radial.
//
// Verifies the sign-flippable radial term: clumps push OUTWARD from the
// cranium normal, producing a radial halo larger than the cranium itself.
// Per Lloyd: "Edge texture comes from clump RADII variance, not from
// edgeJitter()."
//
// This is the whole reason for the refactor over a 2D hair-shell offset:
// gravity > 0 and radial > 0 are the SAME primitive with different sign on
// different components, not two separate escape modes. Mixture rule's
// payoff.
//
// NOT an aesthetic target. The coily ink/curl/bedhead pedagogy
// (Leo pass 2 §1, hair-theorist HT-1) is downstream of this fixture.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'coilyHalo — TEST FIXTURE for Lloyd pass 1 §6 volume + positive radial. ' +
  'clumpMode: volume, gravity: 0, radial: +0.6. Do not tune.';

const coilyHalo: DeepPartial<FaceParams> = {
  hair: {
    style: 'medium',
    frontShape: 'straight',
    forehead: 0.42,
    volume: 0.05,
    templeRecession: 0,
    sideFall: 0.20,
    crownPeakX: 0,
    napeExtension: 0.20,
    // edgeKind stays 'smooth' on purpose. Per Lloyd §6: the radial halo
    // texture must come from clump radii VARIANCE, not from edgeJitter().
    edgeKind: 'smooth',
    recipe: {
      parting: 'none',
      clumpMode: 'volume',
      clumpVolume: { gravity: 0, radial: 0.6, radius: 0.14 },
      // No leads — coily mass reads as a textured halo, not a leaded flow.
      leads: [],
    },
  },
};

export default coilyHalo;
