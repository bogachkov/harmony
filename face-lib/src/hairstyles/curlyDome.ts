// curlyDome — coily/curly halo silhouette. The TEXTURED EDGE
// (edgeKind: 'edgeTextured') carries the characterization; the interior is
// flat (no parting, no flow strokes — Leo pass-3 §3 "Black-illustrated coily
// tradition" rule: interior strands inside the halo read as straight-hair
// imposition; the canon avoids them).
//
// Hair-theorist HT-1: this is a categorically different generator than
// hanging hair — the coil radiates outward (spring > gravity per unit mass).
// The 5-knob silhouette parameterization approximates the halo shape;
// a future `haloSilhouette` primitive (pass-2 §1, pass-theory §7 axis A) will
// be more honest.
//
// Comic refs: generic coily-canon dome (Nelson, Harrison canon as cited in
// hair-pass-2.md §1); short afro silhouette. Used as a CATEGORY reference.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'curlyDome — coily/curly halo. The textured silhouette edge carries the ' +
  'characterization; interior stays flat (per the coily-canon pedagogy).';

const curlyDome: DeepPartial<FaceParams> = {
  hair: {
    style: 'medium',
    frontShape: 'straight',
    // Lower forehead — coily/curly hair sits CLOSE to the forehead because the
    // halo grows OUT (spring > gravity per hair-theorist HT-1) rather than
    // back. The hairline is right above the brows.
    forehead: 0.22,
    // Big volume — the halo radiates outward; the dome itself is significantly
    // larger than the cranium. Pascal round 6 said the prior 0.16 read as a
    // "lumpy beanie." Doubling volume + extending sideFall pushes the dome
    // outward enough to register as halo rather than cap.
    volume: 0.30,
    templeRecession: 0,
    sideFall: 0.30,
    crownPeakX: 0,
    napeExtension: 0.20,
    edgeKind: 'edgeTextured',
    recipe: {
      parting: 'none',
      flowStrokes: [],
    },
  },
};

export default curlyDome;
