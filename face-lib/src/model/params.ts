// FaceParams: the cascading style sheet for a face.
// Geometry is normalized to cranium.diameter = 1.0 unless noted; the renderer scales to pixels.
// Angles are radians.
//
// Pedagogy-rooted structure per Leo's audit (research/leo-audit.md §3):
// the head is three typed sub-blocks — cranium (the Loomis ball + sliced
// side planes), jaw (the Bridgman mandible, a SEPARATE mass), and face
// (Loomis-thirds proportions + cheekbone/brow-ridge projections). Feature
// anchors are computed as RATIOS of these masses (Loomis 1956), not as
// additive Y-offsets, so proportion changes self-propagate.

export type FaceParams = {
  head: {
    cranium: {
      diameter: number;             // the Loomis sphere — base unit for everything else
      sidePlaneOffset: number;      // distance centerline→side-plane cut (ratio of diameter; 0.5=no cut, ~0.425 classic Loomis)
      occipitalProjection: number;  // back-of-skull bulge (Hampton); 0 = pure sphere
      facialAngle: number;          // Camper's angle, radians; 0 = vertical face
      broughtForward: number;       // forward tilt of cranium over jaw (Loomis); 0 = neutral
    };
    jaw: {
      ramusHeight: number;          // TMJ→gonial corner, ratio of cranium.diameter (Bridgman)
      gonialAngle: number;          // mandible corner: 0=90° square, 1=135° soft (Bridgman 90-130°)
      bigonialWidth: number;        // distance between gonial corners, ratio of cranium.diameter
      mentalWidth: number;          // chin-pad width, ratio of bigonialWidth (Hampton "chin button")
      mentalProtrusion: number;     // chin push-forward in Z, ratio of cranium.diameter
      jowl: number;                 // soft-tissue cushion along jaw (Faigin age); 0..1
    };
    face: {
      malarProjection: number;      // cheekbone forward push (Bridgman); 0..1
      browRidgeProjection: number;  // supraorbital prominence; 0..1
      upperThirdRatio: number;      // hairline→brows (Loomis thirds; default 0.333)
      middleThirdRatio: number;     // brows→nose-base
      lowerThirdRatio: number;      // nose-base→chin
    };
  };
  eyes: {
    spacing: number;        // pupil-to-pupil distance (ratio of cranium.diameter)
    size: number;           // eye width (ratio of cranium.diameter)
    openness: number;       // 0 = closed, 1 = wide open, >1 = surprise
    tilt: number;           // outer-corner tilt; positive = corners up
    yOffset: number;        // shift from default eyeline (ratio of cranium.diameter)
    style: 'almond' | 'dots';
    dotSize: number;        // for 'dots' style: radius as ratio of cranium.diameter
    lidLine: number;        // 0..1: upper-lid arc above the dot
    lashes: number;         // 0..1: eyelash ticks at outer corner
    underlineHint: number;  // 0..1: short under-eye line
  };
  brows: {
    ridgeY: number;         // height above eyeline (ratio of cranium.diameter)
    innerLift: number;      // Faigin inner-end Δy: positive = sad, negative = angry
    outerLift: number;      // Faigin outer-end Δy: positive = surprised
    fullness: number;       // stroke weight
    arch: number;           // mid-stroke curvature
    spacing: number;        // distance from centerline at inner end (ratio of cranium.diameter)
    length: number;         // brow length (ratio of cranium.diameter)
    unibrow: number;        // 0..1, fraction inner ends meet across centerline
    style: 'split' | 'single';
  };
  nose: {
    length: number;         // ratio of cranium.diameter (will later become 'keel')
    width: number;          // base width, ratio of cranium.diameter (will become 'alarWidth')
    bridgeVisible: boolean;
    style: 'detailed' | 'minimal' | 'button';
    showNostrils: boolean;
  };
  mouth: {
    width: number;          // ratio of cranium.diameter
    yOffset: number;        // shift from default mouth line (ratio of cranium.diameter)
    openness: number;
    cornerLift: number;     // smile (+) / frown (-)
    upperCurve: number;
    lipFullness: number;
    cornerMarks: boolean;
  };
  ears: {
    visible: boolean;
    // Per Leo §7: ears need helix/antihelix/lobe/tragus substructure. Loomis attaches the
    // ear so its TOP aligns with the brow and BOTTOM aligns with the nose-base.
    helixLength: number;       // ratio of cranium.diameter (brow→nose-base span typically)
    helixProtrusion: number;   // how far helix bulges from side plane (ratio of cranium.diameter)
    lobeDrop: number;          // 0..1: extension below helix bottom (Bridgman "comma")
    antihelixShow: number;     // 0..1: inner Y-fork strength
    tragusShow: number;        // 0..1: small front-flap tick
    conchaShow: number;        // 0..1: visibility of inner bowl shadow line
    tilt: number;              // backward slope in radians (~0.26 = 15°)
    yOffset: number;           // shift from default attach
  };
  hair: {
    style: 'none' | 'short' | 'medium' | 'long' | 'bald';
    frontShape: 'straight' | 'widows-peak' | 'parted' | 'receding';
    forehead: number;
    volume: number;
  };
  neck: {
    // Per Leo §5: Bridgman cylinder + SCM V + trapezius wedge. SCM origin is the
    // mastoid (behind/below the ear), not the chin corner.
    visible: boolean;
    cylinderRadius: number;        // ratio of cranium.diameter (typical 0.30 = neck slightly narrower than head)
    trapWidthAtBase: number;       // trapezius flare at shoulder, ratio of cranium.diameter
    trapFlareStart: number;        // 0..1 along neck length where trap starts flaring
    length: number;                // visible neck length, ratio of cranium.diameter
    scmShow: number;               // 0..1 visibility of front V notch (Bridgman SCM)
    trapShow: number;              // 0..1 visibility of side/back wedges
    laryngealProminence: number;   // Adam's apple tick size (head-height units; 0 = none)
  };
  facialHair: {
    style: 'none' | 'mustache' | 'handlebar' | 'goatee' | 'vanDyke' | 'chinstrap' | 'sideburns' | 'beard' | 'beardWithMustache' | 'fullRound';
    color: string | null;
    length: number;
    fullness: number;
    coversMouth: boolean;
    mustacheBaseOffset: number;
    mustacheRise: number;
    mustacheWidth: number;
    philtrumWidth: number;
    philtrumDepth: number;
  };
  hat: {
    style: 'none' | 'navalCap' | 'beanie' | 'fedora' | 'bowler' | 'topHat';
    color: string;
    bandColor: string;
    emblem: 'none' | 'anchor';
    emblemColor: string;
    size: number;
    tilt: number;
  };
  style: {
    lineWeight: number;
    constructionWeight: number;
    jitter: number;
    jitterSeed: number;
    color: string;
    constructionColor: string;
    background: string | null;
    skinFill: string | null;
    hairFill: string | null;
    showConstruction: boolean;
    showSidePlanes: boolean;
  };
  camera: {
    yaw: number;
    pitch: number;
    pixelHeight: number;
    margin: number;
  };
};

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export const defaults: FaceParams = {
  head: {
    cranium: {
      diameter: 1.0,                // base unit. Everything else is in diameter-ratios.
      sidePlaneOffset: 0.425,       // Loomis classic — side planes at ~85% of equator radius
      occipitalProjection: 0.05,    // slight back-of-skull bulge
      facialAngle: 0,
      broughtForward: 0,
    },
    jaw: {
      ramusHeight: 0.42,            // TMJ→corner: jaw mass roughly 42% of cranium diameter for adult
      gonialAngle: 0.55,            // moderately soft adult jaw (~115°)
      bigonialWidth: 0.78,          // jaw narrower than cranium (~78% of diameter)
      mentalWidth: 0.38,            // chin pad ~38% of bigonial
      mentalProtrusion: 0,
      jowl: 0,
    },
    face: {
      malarProjection: 0.5,
      browRidgeProjection: 0.3,
      upperThirdRatio: 0.333,       // Loomis thirds — must sum to 1 with middle + lower
      middleThirdRatio: 0.333,
      lowerThirdRatio: 0.334,
    },
  },
  eyes: {
    spacing: 0.34,
    size: 0.16,
    openness: 1.0,
    tilt: 0,
    yOffset: 0,
    style: 'almond',
    dotSize: 0.018,
    lidLine: 0,
    lashes: 0,
    underlineHint: 0,
  },
  brows: {
    ridgeY: 0.06,
    innerLift: 0,
    outerLift: 0,
    fullness: 0.018,
    arch: 0.5,
    spacing: 0.07,
    length: 0.22,
    unibrow: 0,
    style: 'split',
  },
  nose: {
    length: 0.28,
    width: 0.14,
    bridgeVisible: false,
    style: 'detailed',
    showNostrils: true,
  },
  mouth: {
    width: 0.28,
    yOffset: 0,
    openness: 0,
    cornerLift: 0,
    upperCurve: 0,
    lipFullness: 0,
    cornerMarks: false,
  },
  ears: {
    visible: true,
    helixLength: 0.30,         // span from brow to nose-base
    helixProtrusion: 0.045,
    lobeDrop: 0.25,            // lobe hangs ~25% past helix bottom
    antihelixShow: 0.7,
    tragusShow: 0.5,
    conchaShow: 0.3,
    tilt: 0.22,                // ~13° backward slope
    yOffset: 0,
  },
  hair: {
    style: 'short',
    frontShape: 'straight',
    forehead: 0.45,
    volume: 0.05,
  },
  neck: {
    visible: true,
    cylinderRadius: 0.30,
    trapWidthAtBase: 0.55,
    trapFlareStart: 0.45,
    length: 0.30,
    scmShow: 0.35,
    trapShow: 0.5,
    laryngealProminence: 0,
  },
  facialHair: {
    style: 'none',
    color: null,
    length: 0.10,
    fullness: 0.04,
    coversMouth: false,
    mustacheBaseOffset: 0.018,
    mustacheRise: 0.05,
    mustacheWidth: 3.2,
    philtrumWidth: 14,
    philtrumDepth: 0.25,
  },
  hat: {
    style: 'none',
    color: '#181410',
    bandColor: '#ffffff',
    emblem: 'none',
    emblemColor: '#ffffff',
    size: 1.0,
    tilt: 0,
  },
  style: {
    lineWeight: 2,
    constructionWeight: 0.8,
    jitter: 1.8,
    jitterSeed: 1,
    color: '#1a1a1a',
    constructionColor: '#c8c8c8',
    background: '#ffffff',
    skinFill: '#f4d8c0',
    hairFill: '#3a2a1f',
    showConstruction: false,
    showSidePlanes: false,
  },
  camera: {
    yaw: 0,
    pitch: 0,
    pixelHeight: 600,
    margin: 0.08,
  },
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const deepMerge = <T>(base: T, patch: DeepPartial<T> | undefined): T => {
  if (patch === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch as T;
  const out: Record<string, unknown> = { ...base };
  for (const k of Object.keys(patch)) {
    const bv = (base as Record<string, unknown>)[k];
    const pv = (patch as Record<string, unknown>)[k];
    out[k] = isPlainObject(bv) && isPlainObject(pv)
      ? deepMerge(bv, pv as DeepPartial<typeof bv>)
      : pv;
  }
  return out as T;
};

export const mergeParams = (...patches: Array<DeepPartial<FaceParams> | undefined>): FaceParams => {
  let out: FaceParams = defaults;
  for (const p of patches) out = deepMerge(out, p);
  return out;
};
