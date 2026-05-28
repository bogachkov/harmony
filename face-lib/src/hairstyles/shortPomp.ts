// shortPomp — swept-back masculine volume with visible vertical lift above the cranium.
// The mass sits taller than the head silhouette top, and the stroke field sweeps
// backward (forehead → nape direction) rather than radially outward from the crown.
//
// Category reference (per meta-Haddock rule): 50s greaser / pomaded masc short hair
// (think Brylcreem advertising illustration, golden-age comic masc archetypes).
// This is NOT an optimization target for any specific character — it is the general
// "verticalLift > 0 + sweptBack" axis made reachable as a preset.
//
// Parameter choices:
//   verticalLift: 0.50 — visible rise above the cranium top; reads as styled mass
//                        without tipping into "hat" territory (>0.8 does that).
//   crownPeakX:  +0.20 — slight forward apex so the silhouette reads as weight-front,
//                        consistent with how swept-back volume sits in the comic canon.
//   volume:       0.12 — moderate base volume; verticalLift adds the extra height.
//   templeRecession: 0.12 — clean masculine temple taper.
//   parting: 'sweptBack' — no parting line; mass flows as a unit.
//   flowStrokes: two strokes in the lifted zone — one forward sweep rising through
//                the mass, one following behind it. Both start LOW (near forehead)
//                and arc UP-AND-BACK so they carry directional flow, not just radial
//                scatter from the crown.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'shortPomp — masculine swept-back hair with vertical volume lift above the cranium. ' +
  'Mass rises visibly above head silhouette top; strokes carry backward sweep direction.';

const shortPomp: DeepPartial<FaceParams> = {
  hair: {
    style: 'short',
    frontShape: 'straight',
    forehead: 0.40,
    volume: 0.12,
    templeRecession: 0.12,
    sideFall: 0,
    crownPeakX: 0.20,
    napeExtension: 0,
    edgeKind: 'smooth',
    recipe: {
      parting: 'sweptBack',
      verticalLift: 0.45,
      flowStrokes: [
        // Primary sweep: rises from mid-front-hairline upward and back through the
        // lifted mass. Large ΔY crosses the crown zone; endX slightly negative
        // (nape side) carries the swept-back read.
        { startX:  0.08, startY: 0.55, endX: -0.08, endY: 0.95, size: 1.8, pressureMid: 0.88 },
        // Secondary sweep: offset right of centre, a little shorter.
        { startX:  0.22, startY: 0.58, endX:  0.06, endY: 0.88, size: 1.4, pressureMid: 0.78 },
      ],
    },
  },
};

export default shortPomp;
