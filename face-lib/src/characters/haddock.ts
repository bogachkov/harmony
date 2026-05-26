// Captain Archibald Haddock — Hergé, Tintin universe.
//
// Identifiable by:
//   - Black naval cap with anchor emblem  → engine HAS hat primitive (vetoed
//     for current scope; this preset doesn't enable it).
//   - Blue turtleneck                     → no clothing system yet.
//   - Full black beard with bushy mustache and a central philtrum dip
//   - Dark hair
//   - Slightly ruddy / mature features (wider face, prominent nose)
//
// Reference: Hergé, "The Adventures of Tintin" (any volume from "The Crab
// with the Golden Claws" 1941 onward).
//
// This file is DATA only. If something cannot be expressed here, the right
// fix is to add a general primitive to the engine — not to add Haddock-shaped
// special-cases to existing primitives.

import type { DeepPartial, FaceParams } from '../model/params.ts';

export const description =
  'Captain Haddock — full black beard with mustache, dot eyes (Hergé style), ' +
  'minimal nose with visible bridge, dark hair. Note: no naval cap (out of ' +
  'scope) and no turtleneck (clothing system not yet implemented), so this ' +
  'is partial Haddock — recognizable as a bearded Hergé sea captain but not ' +
  'definitively him without the cap.';

export const references = [
  'https://en.wikipedia.org/wiki/Captain_Haddock',
  'Hergé, "The Adventures of Tintin" series',
];

// Best composed via composeFace({ style: 'tintin', character: 'haddock', ... }).
// The tintin style preset already supplies dot eyes, cream background, etc.;
// this character file layers Haddock-specific overrides on top.
const haddock: DeepPartial<FaceParams> = {
  head: {
    width: 0.84,
    height: 0.95,
  },
  hair: {
    style: 'short',
    forehead: 0.42,
  },
  eyes: {
    dotSize: 0.020,
  },
  brows: {
    fullness: 0.024,
    arch: 0.20,
    length: 0.21,
  },
  nose: {
    style: 'minimal',
    width: 0.16,
    length: 0.26,
    bridgeVisible: true,
    showNostrils: false,
  },
  facialHair: {
    style: 'beardWithMustache',
    color: '#1a1410',
    length: 0.16,
    fullness: 0.08,
    // Haddock-specific mustache shape values. These OVERRIDE engine defaults;
    // each is a named, pedagogy-rooted parameter (provisional names — may be
    // refined when hair / facial-hair research is integrated).
    mustacheRise: 0.05,
    mustacheWidth: 3.2,
    philtrumWidth: 14,
    philtrumDepth: 0.25,
  },
  style: {
    hairFill: '#1a1410',
  },
};

export default haddock;
