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
      verticalLift: 0.50,
      flowStrokes: [
        // Primary sweep: rises from low front-centre upward and back through the
        // lifted mass. The large ΔY (0.55 → 0.98) crosses the crown zone and
        // reads as the leading edge of the sweep.
        { startX:  0.05, startY: 0.55, endX: -0.10, endY: 0.98, size: 2.0, pressureMid: 0.90 },
        // Secondary sweep: offset slightly right of centre, shorter arc that
        // provides directional reinforcement without crowding. Stays within the
        // lifted mass zone.
        { startX:  0.18, startY: 0.60, endX:  0.05, endY: 0.90, size: 1.5, pressureMid: 0.80 },
      ],
    },
  },
};

export default shortPomp;
