// shortBob — Lloyd pass 1 §6 test fixture (1/3): flat regression guard.
//
// Used by the 3D refactor to verify that clumpMode: 'flat' produces the same
// visual mass that pre-refactor code did. Renders short-medium bob silhouette
// with explicit clumpMode: 'flat'. If the volume integrator's flat fast-path
// regresses, this fixture diffs against its baseline render.
//
// NOT an aesthetic target — per task brief "examples-are-not-targets":
//   "longCurtain and coilyHalo are test fixtures, not optimization targets."
//   (shortBob is the same.)
//
// If you find yourself tuning this file to look prettier, stop. The job is
// the integrator's flat fast-path identity guarantee — not a fourteenth
// shipped bob style.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'shortBob — TEST FIXTURE for Lloyd pass 1 §6 flat regression guard. ' +
  'Explicit clumpMode: flat. Do not tune.';

const shortBob: DeepPartial<FaceParams> = {
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
      clumpMode: 'flat',
      leads: [
        { startX: -0.22, startY: 0.72, endX: -0.32, endY: -0.10, size: 2.4, pressureMid: 1.0 },
        { startX:  0.22, startY: 0.72, endX:  0.32, endY: -0.10, size: 2.4, pressureMid: 1.0 },
      ],
    },
  },
};

export default shortBob;
