// longFlowing — EXPERIMENTAL. First attempt at hair rendered as a FOREST OF
// FLOWING STROKES rather than as a closed-polygon "cap." Sets style='long'
// which triggers the field-traced stroke generator in buildHair. Stroke
// endpoints define where the hair ends (no clean polygon boundary), each
// stroke tapers via perfect-freehand so the lower edge of the mass is a
// wisp-cloud rather than a hard line.
//
// User direction: "stop bucket-filling Leo's shapes; the point of drawing
// hair is to draw flowing hair — a collection of multiple strands suggested
// by clumps, not a flat fill of a bounded region."
//
// Knowingly first-iteration. Will likely need tuning.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'longFlowing (experimental) — long hair as field-traced flowing ink strokes.';

const longFlowing: DeepPartial<FaceParams> = {
  hair: {
    style: 'long',
    frontShape: 'parted',
    forehead: 0.32,
    volume: 0.10,
    templeRecession: 0,
    sideFall: 0.45,
    crownPeakX: 0,
    napeExtension: 0.40,
    edgeKind: 'smooth',
    recipe: {
      parting: 'centre',
      flowStrokes: [],
      // longFlowing differs from longSleek by subtle wave + amplitude — not
      // perfect waves, just enough breathing for the strokes to feel less
      // like an architectural curtain. Without this they're pixel-identical.
      waviness: 0.012,
      waveFrequency: 1.6,
    },
  },
};

export default longFlowing;
