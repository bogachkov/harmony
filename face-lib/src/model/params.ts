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

// PartingKind — discrete surface API for the parting topology choice. Per
// Leo pass 5 §4.6 (categorical at the user-facing layer per Loomis 1956 +
// Faigin 2012). The renderer maps this enum to a continuous partingU on the
// scalp where two grain regions meet (hair-theorist HT-2).
//   'none'       — no parting drawn (Asterix bowl, Goku spike).
//   'centre'     — parting at scalp midline.
//   'sideL'      — off-centre, slightly left of midline.
//   'sideR'      — off-centre, slightly right of midline.
//   'deepSideL'  — far-left parting (~3/4 of the way over).
//   'deepSideR'  — far-right parting.
//   'sweptBack'  — no parting; mass flows up + back (pompadour, slick).
export type PartingKind =
  | 'none' | 'centre' | 'sideL' | 'sideR' | 'deepSideL' | 'deepSideR' | 'sweptBack';

// FlowStroke — one ink stroke inside the hair mass. The recipe carries an
// explicit array of these, replacing the hardcoded "parting + 2 flow flicks"
// composition. Each stroke is defined by start/end positions as fractions of
// cranium radius (x: ratio of rx; y: ratio of ry) plus an ink-pen weight.
// Stroke surfaces onto the cranial ellipsoid via the renderer.
export type FlowStroke = {
  startX: number;       // ratio of rx (−1..+1)
  startY: number;       // ratio of ry (−1..+1)
  endX: number;
  endY: number;
  size: number;         // ink size multiplier (× lineWeight in render)
  pressureMid: number;  // 0..1; peak pressure at mid-stroke
};

// HairstyleRecipe — the load-bearing composition of a hairstyle. Per Leo
// pass 5 §4.7: buildHair consumes a recipe rather than hardcoding the
// composition. Each named hairstyle file (src/hairstyles/*.ts) sets BOTH the
// silhouette knobs (templeRecession etc.) AND this recipe.
export type HairstyleRecipe = {
  parting: PartingKind;
  flowStrokes: readonly FlowStroke[];
  // Waviness applied to field-traced strokes (only used by the experimental
  // style='long' renderer for now — adds sinusoidal perpendicular displacement
  // to each stroke, envelope-windowed so endpoints stay fixed). 0 = straight,
  // 0.04-0.07 = wavy, 0.10+ = very curly. waveFrequency = cycles per stroke.
  waviness?: number;
  waveFrequency?: number;
  // Trailing mass — long hair that falls PAST the head silhouette, visible
  // around/behind the head extending toward the shoulders. Distinct from
  // field-traced strokes (which hug the cranium): trailing strokes are
  // free-falling lines starting at the temple-side silhouette and going
  // down + slightly outward. 0 = no tail (current default); 1 = heavy
  // shoulder-length fall.
  tailMass?: number;
  // Future-reserved: forelock?, fringe?, highlight? — wired in later passes
  // when the corresponding primitives land (Leo pass 5 §4.1–4.3).
};

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
      // Per Leo §2: jaw silhouette TYPE is a CATEGORICAL decision (Loomis archetypes,
      // Hergé side-character convention). One cubic-Bezier topology can't grow a gonial
      // cusp — different topologies are different builders.
      topology: 'square' | 'oval' | 'pointed' | 'pear' | 'jowled' | 'round';
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
    // Per Leo §5: a faint sulcus tick between lower lip and chin button (Faigin 2012 fig 5-12).
    // Default 0 = invisible (ligne claire). Masculine/elder presets raise to ~0.3 for "firm mouth"
    // reading without the old upperCurve=-0.15 cheat.
    labiomentalShow: number;
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
    // Hairline shape — boundary primitive, NOT the load-bearing characterization
    // (see research/hair-tooling.md §6 STOP #3 / §8 SS-3). For demographic legibility,
    // tune templeRecession + crownPeakX + sideFall instead. frontShape='receding'
    // is treated as a CONSEQUENCE of templeRecession>0.5 + forehead>0.55, not an
    // independent topology.
    frontShape: 'straight' | 'widows-peak' | 'parted' | 'receding';
    forehead: number;
    volume: number;
    // Mass-silhouette shape knobs (Leo pass 4). Each knob does ONE thing on the
    // envelope; orthogonal, no cross-interactions.
    //   templeRecession: 0..1 — dip Y + tuck X inward at the temple bands (~t=0.15, t=0.85).
    //                            Mature masculine recession; M-shape hairline.
    //   sideFall:         0..1 — let the silhouette drop below templeY at the two extremes
    //                            (t in [0,0.1] and [0.9,1]). Mass extends past the ear
    //                            for bobs / long fem / teen.
    //   crownPeakX:       -0.4..+0.4 — reparameterize θ so the dome apex shifts forward
    //                            (+; Tintin quiff) or back (−; slicked exec). 0 = centred.
    //   napeExtension:    0..1 — extends rear lower envelope toward the neck. Long-fem.
    //                            Effects mainly visible in 3/4 + back views.
    //   edgeKind:         silhouette-edge MODIFIER. 'smooth' = ligne-claire dome.
    //                    'flicked' adds ONE asymmetric outward bump near a temple
    //                    (Hergé forelock — promoted from interior stroke to silhouette).
    //                    'crowSnipped' = small choppy ends (Western kids canon).
    //                    'spiked' / 'edgeTextured' reserved for future schools.
    templeRecession: number;
    sideFall: number;
    crownPeakX: number;
    napeExtension: number;
    edgeKind: 'smooth' | 'spiked' | 'flicked' | 'edgeTextured' | 'crowSnipped';
    // The composition recipe — per Leo pass 5 (research/hairstyles.md §4.7) +
    // hair-theorist HT-2 (research/hair-theory.md §4 — parting is a continuous
    // locus internally; the PartingKind enum is the surface API). Recipe replaces
    // the previously hardcoded "parting + 2 flow flicks" composition in buildHair.
    recipe: HairstyleRecipe;
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
      topology: 'oval',             // default smooth taper (Faigin oval / Calculus)
      ramusHeight: 0.42,
      gonialAngle: 0.55,
      bigonialWidth: 0.78,
      mentalWidth: 0.38,
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
    labiomentalShow: 0,
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
    templeRecession: 0,
    sideFall: 0,
    crownPeakX: 0,
    napeExtension: 0,
    edgeKind: 'smooth',
    // Default recipe = the previously hardcoded buildHair composition: an
    // off-centre-left parting plus two flow flicks (one each side). Preserved
    // here so demographics that don't pick a hairstyle render approximately like
    // pre-recipe behaviour. (Leo pass 5 §5 step 2 gating contract — Y endpoints
    // shift slightly because endY is now a ratio of ry rather than absolute
    // hairline+offset; new values are tuned to land on the hair mass across
    // common demographics.)
    recipe: {
      parting: 'sideL',
      flowStrokes: [
        // Right-side flow — from near parting top, sweeping out + down toward right temple.
        { startX:  0.04, startY: 0.86, endX:  0.42, endY: 0.55, size: 1.8, pressureMid: 0.95 },
        // Left-side flow — heavy side of the parting, shorter.
        { startX: -0.18, startY: 0.70, endX: -0.32, endY: 0.50, size: 1.4, pressureMid: 0.80 },
      ],
    },
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
