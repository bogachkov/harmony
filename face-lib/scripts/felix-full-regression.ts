// Felix W3 full mixture-rule regression: every pack × every hairstyle.
// Used to confirm byte-identical output for every (pack, hairstyle) pair
// that does NOT activate the new long-hair-flat-curtain block.
//
// Output: /tmp/felix-full/<pack>-<hairstyle>.svg + .png

import { writeFileSync, mkdirSync } from 'node:fs';
import type { ComposeArgs, DeepPartial, FaceParams } from '../src/api.ts';
import { composeFace, hairstyleNames, styleNames } from '../src/api.ts';
import { svgToPng } from '../src/render/raster.ts';

const OUTBASE = process.argv[2] ?? '/tmp/felix-full';
mkdirSync(OUTBASE, { recursive: true });

const TIMM_PEDAGOGY: DeepPartial<FaceParams> = {
  mouth: { lipFullness: 0, labiomentalShow: 0, cornerMarks: false, upperCurve: 0 },
  eyes: { lashes: 0, lidLine: 0.6, underlineHint: 0.15 },
  brows: { style: 'single' },
  nose: { style: 'minimal', bridgeVisible: false, showNostrils: false },
};

let n = 0;
for (const pack of styleNames) {
  for (const hs of hairstyleNames) {
    const args: ComposeArgs = {
      style: pack,
      age: 'adult', presentation: 'feminine', hairstyle: hs,
      overrides: pack === 'timmFlat' ? TIMM_PEDAGOGY : undefined,
    };
    const svg = composeFace(args);
    writeFileSync(`${OUTBASE}/${pack}-${hs}.svg`, svg);
    n++;
  }
}
process.stderr.write(`Rendered ${n} cells to ${OUTBASE}\n`);
