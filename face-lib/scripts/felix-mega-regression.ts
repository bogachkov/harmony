// Felix W3 mega-regression: every pack × age × presentation × hairstyle.
// Used to verify the new long-hair-flat-curtain primitive fires ONLY where
// expected and nowhere else.
//
// Expected differs: timmFlat × {longSleek, longTail, longCurly, longWavy,
//                                longWitch} × every (age, presentation).
// Expected identical: everything else (52 packs × non-timmFlat OR non-long).

import { writeFileSync, mkdirSync } from 'node:fs';
import type { ComposeArgs, DeepPartial, FaceParams } from '../src/api.ts';
import {
  composeFace, hairstyleNames, styleNames, ageNames, presentationNames,
} from '../src/api.ts';

const OUTBASE = process.argv[2] ?? '/tmp/felix-mega';
mkdirSync(OUTBASE, { recursive: true });

const TIMM_PEDAGOGY: DeepPartial<FaceParams> = {
  mouth: { lipFullness: 0, labiomentalShow: 0, cornerMarks: false, upperCurve: 0 },
  eyes: { lashes: 0, lidLine: 0.6, underlineHint: 0.15 },
  brows: { style: 'single' },
  nose: { style: 'minimal', bridgeVisible: false, showNostrils: false },
};

let n = 0;
for (const pack of styleNames) {
  for (const age of ageNames) {
    for (const presentation of presentationNames) {
      for (const hs of hairstyleNames) {
        const args: ComposeArgs = {
          style: pack, age, presentation, hairstyle: hs,
          overrides: pack === 'timmFlat' ? TIMM_PEDAGOGY : undefined,
        };
        const svg = composeFace(args);
        writeFileSync(`${OUTBASE}/${pack}-${age}-${presentation}-${hs}.svg`, svg);
        n++;
      }
    }
  }
}
process.stderr.write(`Rendered ${n} cells to ${OUTBASE}\n`);
