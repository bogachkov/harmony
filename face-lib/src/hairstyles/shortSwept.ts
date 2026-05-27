// shortSwept — short hair, off-centre parting, one silhouette-edge flick.
// The "everyday parted short" cut. Comic refs: Hergé's Tintin (the canonical
// example), Steve Rogers civvies, any working-pro side-character male default.
//
// Composition: parted (sideL), two flow strokes following the part, edge
// 'flicked' so the silhouette itself carries the forelock asymmetry rather
// than relying solely on interior strokes.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'shortSwept — short parted hair with a small forelock flick on the silhouette ' +
  'edge (the canonical Hergé / Tintin side-character default).';

const shortSwept: DeepPartial<FaceParams> = {
  hair: {
    style: 'short',
    frontShape: 'parted',
    forehead: 0.46,
    volume: 0.07,
    templeRecession: 0.30,
    sideFall: 0,
    crownPeakX: 0.10,
    napeExtension: 0,
    edgeKind: 'flicked',
    recipe: {
      parting: 'sideL',
      flowStrokes: [
        { startX:  0.04, startY: 0.86, endX:  0.42, endY: 0.55, size: 1.8, pressureMid: 0.95 },
        { startX: -0.18, startY: 0.70, endX: -0.32, endY: 0.50, size: 1.4, pressureMid: 0.80 },
      ],
    },
  },
};

export default shortSwept;
