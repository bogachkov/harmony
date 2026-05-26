// FaceParams: the cascading style sheet for a face.
// Everything is normalized to head_height = 1.0 unit unless noted; the renderer scales to pixels.
// Angles are radians.

export type FaceParams = {
  head: {
    width: number;          // x-extent of cranium sphere before side-plane flattening
    height: number;         // y-extent (top of skull to bottom of jaw line on the sphere)
    depth: number;          // z-extent
    sidePlaneInset: number; // fraction of width clipped by side planes (0 = pure sphere, 0.15 ≈ Loomis classic)
    jawWidth: number;       // jaw width at the mouth line (fraction of head.width)
    chinDrop: number;       // how far chin extends below the sphere (in head-height units)
    chinSharpness: number;  // 0 = round chin, 1 = pointed
  };
  eyes: {
    spacing: number;        // pupil-to-pupil distance (fraction of head.width)
    size: number;           // eye width (fraction of head.width)
    openness: number;       // 0 = closed, 1 = wide open, can exceed 1 for surprise
    tilt: number;           // outer-corner tilt; positive = corners up
    yOffset: number;        // shift from default eyeline (head-height units)
    style: 'almond' | 'dots';  // 'dots' = no eye-shape, just a pupil dot (Tintin-style)
    dotSize: number;        // for 'dots' style: radius as fraction of head.width
  };
  brows: {
    yOffset: number;        // height above eyeline (head-height units)
    innerHeight: number;    // additional vertical offset of inner end (positive = inner-up = sad/concerned)
    outerHeight: number;    // additional vertical offset of outer end
    thickness: number;
    arch: number;           // curve amount of the brow stroke
    spacing: number;        // distance from centerline at inner end (fraction of head.width)
    length: number;         // brow length (fraction of head.width)
  };
  nose: {
    length: number;         // nose length from brow-bridge to base (head-height units)
    width: number;          // base width (fraction of head.width)
    bridgeVisible: boolean; // draw bridge construction line
    style: 'detailed' | 'minimal' | 'button';  // 'button' = a single short curve (Tintin)
    showNostrils: boolean;  // toggle nostril dashes
  };
  mouth: {
    width: number;          // fraction of head.width
    yOffset: number;        // shift from default mouth line (head-height units)
    openness: number;       // 0 = closed line, >0 = open
    cornerLift: number;     // smile (+) / frown (-) at the corners (head-height units)
    upperCurve: number;     // additional curvature of upper-lip line
    lipFullness: number;    // 0 = thin line, 1 = full lips with separate upper/lower lines even when closed
    cornerMarks: boolean;   // draw small tick marks at the corners
  };
  ears: {
    visible: boolean;
    size: number;           // ear height (head-height units)
    yOffset: number;        // shift from default attach (eyeline → nose-base span)
    protrusion: number;     // how far the ear sticks out from side plane (head-width units)
  };
  hair: {
    style: 'none' | 'short' | 'medium' | 'long' | 'bald';
    frontShape: 'straight' | 'widows-peak' | 'parted' | 'receding';
    forehead: number;       // visible forehead height (0 = hair starts at brows, 1 = full forehead)
    volume: number;         // hair puffiness above the cranium (head-height units)
  };
  neck: {
    visible: boolean;
    width: number;          // fraction of head.width
    length: number;         // visible neck length (head-height units)
  };
  facialHair: {
    style: 'none' | 'mustache' | 'handlebar' | 'goatee' | 'vanDyke' | 'chinstrap' | 'sideburns' | 'beard' | 'beardWithMustache' | 'fullRound';
    color: string | null;   // null = inherit hairFill
    length: number;         // how far past the chin (head-height units)
    fullness: number;       // how far past the jaw silhouette (head-width units)
    coversMouth: boolean;   // when true, mouth is rendered as a line through the mustache
  };
  hat: {
    style: 'none' | 'navalCap' | 'beanie' | 'fedora' | 'bowler' | 'topHat';
    color: string;
    bandColor: string;      // for naval cap white band, fedora ribbon, etc.
    emblem: 'none' | 'anchor';
    emblemColor: string;
    size: number;           // overall scale multiplier (1.0 = default)
    tilt: number;           // small rotation in radians
  };
  style: {
    lineWeight: number;     // SVG stroke-width in px
    constructionWeight: number; // weight for guide lines (lighter)
    jitter: number;         // 0 = clean, >0 = hand-drawn variation amplitude (px)
    jitterSeed: number;     // deterministic seed for jitter
    color: string;          // primary line color
    constructionColor: string;
    background: string | null;
    skinFill: string | null;   // fill color for the head silhouette (null = no fill)
    hairFill: string | null;   // fill color for the hair (null = outline only)
    showConstruction: boolean;
    showSidePlanes: boolean;
  };
  camera: {
    yaw: number;            // horizontal head rotation (radians); 0 = front
    pitch: number;          // vertical tilt; positive = looking up at the face
    pixelHeight: number;    // rendered SVG height in px (width derived from aspect)
    margin: number;         // fraction of pixelHeight as padding around the head
  };
};

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export const defaults: FaceParams = {
  head: {
    width: 0.78,
    height: 1.0,
    depth: 0.95,
    sidePlaneInset: 0.12,
    jawWidth: 0.62,
    chinDrop: 0.18,
    chinSharpness: 0.4,
  },
  eyes: {
    spacing: 0.34,
    size: 0.16,
    openness: 1.0,
    tilt: 0,
    yOffset: 0,
    style: 'almond',
    dotSize: 0.018,
  },
  brows: {
    yOffset: 0.08,
    innerHeight: 0,
    outerHeight: 0,
    thickness: 0.018,
    arch: 0.5,
    spacing: 0.07,
    length: 0.22,
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
    lipFullness: 0.35,
    cornerMarks: true,
  },
  ears: {
    visible: true,
    size: 0.22,
    yOffset: 0,
    protrusion: 0.03,
  },
  hair: {
    style: 'short',
    frontShape: 'straight',
    forehead: 0.45,
    volume: 0.05,
  },
  neck: {
    visible: true,
    width: 0.55,        // trapezius width at the base (fraction of head.width)
    length: 0.22,
  },
  facialHair: {
    style: 'none',
    color: null,
    length: 0.10,
    fullness: 0.04,
    coversMouth: false,
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
    skinFill: '#f4d8c0',     // warm light skin default; override per-character
    hairFill: '#3a2a1f',     // dark brown default
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
