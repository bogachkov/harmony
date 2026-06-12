// Felix W3 broad regression: test that the predicate fires ONLY where
// expected across (pack, age, presentation, hairstyle) space.
//
// Strategy: hash each rendered SVG and write a manifest. Compare manifests
// between pre and post Felix.

import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { ComposeArgs, DeepPartial, FaceParams } from '../src/api.ts';
import {
  composeFace, hairstyleNames, styleNames, ageNames, presentationNames,
} from '../src/api.ts';

const OUTBASE = process.argv[2] ?? '/tmp/felix-broad';
mkdirSync(OUTBASE, { recursive: true });

const TIMM_PEDAGOGY: DeepPartial<FaceParams> = {
  mouth: { lipFullness: 0, labiomentalShow: 0, cornerMarks: false, upperCurve: 0 },
  eyes: { lashes: 0, lidLine: 0.6, underlineHint: 0.15 },
  brows: { style: 'single' },
  nose: { style: 'minimal', bridgeVisible: false, showNostrils: false },
};

const manifest: string[] = [];
for (const pack of styleNames) {
  for (const age of ageNames) {
    for (const presentation of presentationNames) {
      for (const hs of hairstyleNames) {
        const args: ComposeArgs = {
          style: pack, age, presentation, hairstyle: hs,
          overrides: pack === 'timmFlat' ? TIMM_PEDAGOGY : undefined,
        };
        const svg = composeFace(args);
        const hash = createHash('sha256').update(svg).digest('hex').slice(0, 16);
        manifest.push(`${pack} ${age} ${presentation} ${hs} ${hash}`);
      }
    }
  }
}
writeFileSync(`${OUTBASE}/manifest.txt`, manifest.join('\n') + '\n');
process.stderr.write(`Wrote manifest with ${manifest.length} entries to ${OUTBASE}/manifest.txt\n`);
