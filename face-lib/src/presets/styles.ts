import type { DeepPartial, FaceParams } from '../model/params.ts';

// Art-style presets — RENDERING-ONLY layer.
//
// A style preset describes HOW a face is drawn (line weight, jitter, colors, which
// feature-style enum to pick) but NOT WHO they are (proportions, sizes, positions).
// Proportions are owned by demographic presets (age × presentation) and character
// data files. This keeps characters distinguishable: every "Tintin child" must look
// different from "Tintin elder" must look different from "Tintin feminine adult."
//
// What's allowed here:
//   - style.* (line weight, jitter, color, fills, background)
//   - eyes.style, nose.style, brows.style (discrete enum choices)
//   - mouth.lipFullness / cornerMarks (rendering toggles, not proportions)
//   - hair.style 'short'/'medium'/'long' (length category)
//
// What is FORBIDDEN here (will collapse all characters to one face):
//   - head.width / head.height / head.jawWidth / head.chinSharpness / head.chinDrop
//   - eyes.spacing / eyes.size  (these are character/demographic proportions)
//   - nose.width / nose.length
//   - brows.fullness / brows.length
//   - mouth.width
//   - ears.size / ears.protrusion
//   - neck.width / neck.length
//
// These rules were added after a brutal review revealed every Tintin-styled face
// was structurally identical — only hair color/length varied.

export const styles = {
  // The default rendering style: generic stylized-line-art with subtle hand-drawn wobble.
  default: {} as DeepPartial<FaceParams>,

  // Tintin / Hergé rendering: dot eyes, button nose, single confident brow stroke,
  // zero jitter, cream page. Proportion settings deliberately omitted so demographic
  // presets retain their per-character variation.
  tintin: {
    style: {
      lineWeight: 2.4,
      jitter: 0,
      color: '#1a1410',
      skinFill: '#f6d2a6',
      hairFill: '#3a200f',
      background: '#fff8e8',
    },
    eyes: {
      style: 'dots',
      dotSize: 0.020,
    },
    brows: {
      style: 'single',
    },
    nose: {
      style: 'button',
      showNostrils: false,
      bridgeVisible: false,
    },
    mouth: {
      lipFullness: 0,
      cornerMarks: false,
      upperCurve: 0,
    },
    // Ligne claire = minimal interior anatomy. Hergé's front-view ears are a small
    // "C" tucked against the temple — no Y-fork, no tragus, no concha, and the lobe
    // is integrated into the C rather than dangling. lobeDrop=0 → no comma.
    ears: {
      helixProtrusion: 0.030,  // smaller bulge — past silhouette is a tick, not a flare
      antihelixShow: 0,
      tragusShow: 0,
      conchaShow: 0,
      lobeDrop: 0,             // no dangling comma; lobe is the C's terminus
    },
    neck: {
      scmShow: 0,                  // Hergé doesn't draw SCM
      trapShow: 0,                 // Hergé doesn't draw trapezius
      laryngealProminence: 0,
    },
  } satisfies DeepPartial<FaceParams>,

  // Ligne-claire (Tintin/Asterix/Spirou tradition) generic: confident uniform lines,
  // zero wobble, flat saturated fills, almond eyes, minimalist features. Same rules:
  // no proportion overrides here.
  ligneClaire: {
    style: {
      lineWeight: 2.6,
      jitter: 0,
      color: '#1a1410',
      skinFill: '#f5cea2',
      hairFill: '#3a1f10',
      background: '#fff8e8',
    },
    brows: {
      style: 'single',
    },
    nose: {
      style: 'minimal',
    },
    mouth: {
      lipFullness: 0,
      cornerMarks: false,
    },
  } satisfies DeepPartial<FaceParams>,

  // Timm flat-shape (Bruce Timm / DC Animated Universe tradition). Per W1 joint
  // spec (research/stylepack-timmFlat-spec.md). Pedagogy: shape-is-everything +
  // flat-fills are load-bearing. Categorical-jaw-topology dispatch through
  // demographics IS the characterization signal. Hair is large geometric flat-
  // fill silhouette with ZERO interior strokes (recipe.leads = []). Eye is the
  // lid more than the pupil (Sito 2004 p.40) — heavy upper lid (lidLine 0.6),
  // faint underline, no lashes. Per styles.ts header rule: no proportion writes.
  // Colors at pack level are DEFAULTS — per-render skinFill / hairFill override
  // (e.g. for "dark" cells in the 16-cell grid) MUST win over these.
  timmFlat: {
    style: {
      lineWeight: 3.0,          // medium-heavy contour, animation-clean (heavier than tintin's 2.4)
      jitter: 0,                // zero wobble — cel-clean
      color: '#0a0a0a',         // true black (vs tintin's warm '#1a1410')
      skinFill: '#fdd6b3',      // pale-saturated default — overrideable per render
      hairFill: '#1a1a1a',      // very dark default — overrideable per render
      background: '#e8e4d8',    // Rollo: warm-neutral plate, NOT pure white
      showConstruction: false,
    },
    eyes: {
      style: 'almond',          // explicitly almond, NOT dots
      lidLine: 0.6,             // load-bearing heavy upper-lid stroke (Sito 2004 p.40)
      underlineHint: 0.15,      // faint lower-lid hint
      lashes: 0,                // no lash array (decision §1)
    },
    brows: {
      style: 'single',          // single thick stroke
      // fullness / length / arch stay demographic-owned (proportions-forbidden)
    },
    nose: {
      style: 'minimal',         // single contour, no nostril dots, no bridge
      bridgeVisible: false,
      showNostrils: false,
    },
    mouth: {
      lipFullness: 0,           // no vermilion modeling
      cornerMarks: false,
      upperCurve: 0,
      labiomentalShow: 0,       // no Faigin sulcus for Timm
    },
    ears: {
      helixProtrusion: 0.030,   // small flush ear (similar to tintin)
      antihelixShow: 0,
      tragusShow: 0,
      conchaShow: 0,
      lobeDrop: 0,
    },
    neck: {
      scmShow: 0,
      trapShow: 0,
      laryngealProminence: 0,
    },
    hair: {
      edgeKind: 'smooth',       // default — 'spiked' overrideable per character
      recipe: {
        parting: 'none',        // no parting line — silhouette carries identity
        leads: [],              // CRITICAL: NO interior strokes (decision §5)
        // clumpMode defaults to 'flat' from defaults; do not override.
        //
        // suppressInteriorHairDetail — the hard "off switch" for inside-the-
        // hair-mass detail. With this set, the cascade-leak that Pascal
        // diagnosed (W2 close, research/pascal-w2-timmflat.md) cannot
        // reach the render: even if a later cascade layer (presentation,
        // hairstyle file) pushes a non-empty leads array, the renderer
        // short-circuits the leads block + the clump-stroke field + the
        // shadow band + the highlight band. The CAP polygon + silhouette
        // outline + hairline tick remain, so the hair still reads as a
        // proper flat mass — exactly Timm/DC-animated canon (W1 spec §3,
        // §5). Per mixture-not-survival: this is a knob, not a deletion;
        // default packs continue to paint full interior detail. See
        // params.ts HairstyleRecipe doc for the primitive contract.
        suppressInteriorHairDetail: true,
      },
    },
  } satisfies DeepPartial<FaceParams>,
} as const;

export type StyleName = keyof typeof styles;
export const styleNames = Object.keys(styles) as StyleName[];

export const stylePreset = (name: StyleName): DeepPartial<FaceParams> => styles[name];
