// longTail — long hair that falls BEHIND/AROUND the head extending past
// the shoulders. Distinct from longSleek (strokes hug cranium only); this
// recipe activates the trailing-mass renderer via tailMass=0.85, producing
// strokes that start at the side silhouette and continue downward past
// the chin into the area visually OUTSIDE the head silhouette.
//
// Reference: long-hair pencil drawings where the bulk of the hair mass
// is BEHIND/AROUND the head, framing the face from outside.
//
// Filed per the mixture rule (AGENTS.md): the tail-mass parameter is a
// reachable point in the parameter space; longTail is just a preset that
// sets the right knob combination.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'longTail — long hair with trailing mass extending behind/around the head ' +
  'past the shoulders. tailMass=0.85 activates the off-cranium trailing strokes.';

const longTail: DeepPartial<FaceParams> = {
  hair: {
    style: 'long',
    frontShape: 'parted',
    forehead: 0.30,
    volume: 0.08,
    templeRecession: 0,
    sideFall: 0.50,
    crownPeakX: 0,
    napeExtension: 0.55,
    edgeKind: 'smooth',
    recipe: {
      parting: 'centre',
      flowStrokes: [],
      waviness: 0,
      waveFrequency: 0,
      tailMass: 0.85,
    },
  },
};

export default longTail;
