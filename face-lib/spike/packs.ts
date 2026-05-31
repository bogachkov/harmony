// Style packs — named bundles of dial values to test a specific set of shapes.
// A pack is just a Partial<HeadDial>; the engine has no idea packs exist.

import type { HeadDial } from './head.ts';

export const PACKS: Record<string, Partial<HeadDial>> = {
  // The spike default — neutral proportions.
  default: {},

  // Big bulbous nose, wide mouth — caricature/“character” test.
  bigNose: { noseTipBulge: 0.20, noseAlarWidth: 0.13, noseProjection: 0.22, mouthWidth: 1.3 },

  // Thin sharp nose, narrow mouth, long jaw — severe/aristocratic test.
  severe: { noseTipBulge: 0.08, noseAlarWidth: 0.06, noseBridgeWidth: 0.07, jawDrop: 1.35, mouthWidth: 0.85 },

  // Round head, small features, short jaw — child test.
  child: { craniumRadii: [0.50, 0.50, 0.55], jawDrop: 0.95, jawWidth: 0.70, noseTipBulge: 0.10, noseProjection: 0.10 },
};
