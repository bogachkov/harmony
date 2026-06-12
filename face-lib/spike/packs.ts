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

  // ---- character archetype targets (drive out missing dials) ----

  // Pretty lady: oval face, narrow soft jaw, small refined nose, fuller mouth.
  prettyLady: { craniumRadii: [0.47, 0.57, 0.56], jawDrop: 1.20, jawWidth: 0.55,
    chinProjection: 0.42, noseTipBulge: 0.09, noseAlarWidth: 0.07, noseBridgeWidth: 0.08,
    mouthWidth: 1.05, mouthThickness: 0.03 },

  // Old lady: same soft jaw but longer/sagging, sharper nose, thin mouth.
  // NOTE: real age read needs jowl + nasolabial + lid-droop dials we don't have.
  oldLady: { craniumRadii: [0.48, 0.55, 0.56], jawDrop: 1.30, jawWidth: 0.58,
    chinProjection: 0.38, noseTipBulge: 0.11, noseProjection: 0.17, noseAlarWidth: 0.08,
    mouthWidth: 0.95, mouthThickness: 0.012 },

  // Girl (young): round head, short jaw, small nose, modest mouth.
  girl: { craniumRadii: [0.49, 0.52, 0.55], jawDrop: 1.00, jawWidth: 0.60,
    chinProjection: 0.40, noseTipBulge: 0.08, noseProjection: 0.09, noseAlarWidth: 0.06,
    mouthWidth: 1.0, mouthThickness: 0.02 },
};
