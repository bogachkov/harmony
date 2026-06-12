import type { AllowedDeclarePath, DeepPartial, FaceParams } from '../model/params.ts';

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
//
// W3 Q1 — packs may carry a `declares: readonly AllowedDeclarePath[]` manifest
// naming the knob paths the pack ASSERTS as truth past the cascade. The
// AllowedDeclarePath union (in model/params.ts) is type-system-enforced to
// exclude the forbidden demographic-only paths above — a pack declaring
// `head.jaw.gonialAngle` is a TypeScript ERROR at compile time. The manifest is
// applied as a SECOND pack pass at slot 6 (post-hairstyle, pre-expression) in
// composeFace. Default `declares: []` (or undefined) is a no-op late pass —
// every existing pack renders byte-identical. See research/lloyd-cascade-
// architecture.md §Q1 + tasks/nick-q1-cascade-merge-manifest.md.

// Pack — a style preset object plus its optional declarative manifest. The
// substrate pass (slot 2) merges `params` into the cascade as today; the
// late pass (slot 6) re-writes only the paths in `declares`.
export type Pack = DeepPartial<FaceParams> & {
  declares?: readonly AllowedDeclarePath[];
};

export const styles = {
  // The default rendering style: generic stylized-line-art with subtle hand-drawn wobble.
  // declares: [] — no late-pass assertion; substrate pass is the whole pack contribution
  // and the slot-6 late pass is a no-op. Byte-identical regression guard.
  default: { declares: [] } as Pack,

  // Tintin / Hergé rendering: dot eyes, button nose, single confident brow stroke,
  // zero jitter, cream page. Proportion settings deliberately omitted so demographic
  // presets retain their per-character variation.
  // declares: [] — pack pedagogy reaches the render via the slot-2 substrate pass
  // today (no contested-leak cells in tintin's mixture-rule sweep). If a future
  // Pascal pass shows a tintin knob being clobbered by demographics, promote that
  // path into declares here.
  tintin: {
    declares: [],
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
  } satisfies Pack,

  // Ligne-claire (Tintin/Asterix/Spirou tradition) generic: confident uniform lines,
  // zero wobble, flat saturated fills, almond eyes, minimalist features. Same rules:
  // no proportion overrides here.
  // declares: [] — same rationale as tintin; substrate-only pack today.
  ligneClaire: {
    declares: [],
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
  } satisfies Pack,

  // Timm flat-shape (Bruce Timm / DC Animated Universe tradition). Per W1 joint
  // spec (research/stylepack-timmFlat-spec.md). Pedagogy: shape-is-everything +
  // flat-fills are load-bearing. Categorical-jaw-topology dispatch through
  // demographics IS the characterization signal. Hair is large geometric flat-
  // fill silhouette with ZERO interior strokes (recipe.leads = []). Eye is the
  // lid more than the pupil (Sito 2004 p.40) — heavy upper lid (lidLine 0.6),
  // faint underline, no lashes. Per styles.ts header rule: no proportion writes.
  // Colors at pack level are DEFAULTS — per-render skinFill / hairFill override
  // (e.g. for "dark" cells in the 16-cell grid) MUST win over these.
  //
  // W3 Q1 — the contested pedagogy set is now declared via the slot-6 manifest
  // (per Lloyd Q1 design — research/lloyd-cascade-architecture.md §Q1). The
  // substrate pass (slot 2) drops the substrate values; the late pass (slot 6)
  // re-asserts the SAME values on the declared paths AFTER demographic / age /
  // hairstyle have rolled by. Subsumes Nick PR #4's suppressInteriorHairDetail
  // flag — now expressed declaratively as hair.recipe.fillStyle: 'flat' which
  // the renderer reads to gate clump-stroke / cap-tone / sweep blocks.
  timmFlat: {
    declares: [
      // Hair recipe — leads were the original Pascal-diagnosed cascade-leak path
      // (recipe.leads = [] clobbered by hairstyle files). parting is the
      // companion knob (Timm "shape-is-everything" pedagogy: no parting line).
      // fillStyle is the new declarative replacement for the PR #4 primitive
      // flag — declared so demographic/hairstyle layers can't push the renderer
      // back into standard (interior-strand) mode.
      'hair.recipe.leads',
      'hair.recipe.parting',
      'hair.recipe.fillStyle',
      // L1 (W4 audit): inverted hair-shadow cutout — declared so hairstyle
      // files can't drop the cel-shadow on the cap / curtain.
      'hair.recipe.highlightCutout',
      // Mouth — the four-knob vermilion / sulcus / corner / curve set that
      // presentation:'feminine' (lipFullness 0.35) and presentation:'masculine'
      // (labiomentalShow 0.22) reach in and overwrite.
      'mouth.lipFullness',
      'mouth.labiomentalShow',
      'mouth.cornerMarks',
      'mouth.upperCurve',
      // Eyes — Sito p.40 "lid more than the pupil": lidLine 0.6 + underline 0.15
      // + lashes 0. presentation:'feminine' pushes lashes 0.6 — declare to keep
      // the Timm read clean.
      'eyes.lashes',
      'eyes.lidLine',
      'eyes.underlineHint',
      // Brows / nose — discrete style enum picks. Single brow stroke, minimal
      // nose with no bridge / nostrils. Hairstyle files don't touch these but
      // future character presets might; declared as a forward-looking guard
      // (Lloyd §Q1 §Pick listed these as the contested pedagogy set).
      'brows.style',
      'nose.style',
      'nose.bridgeVisible',
      'nose.showNostrils',
      // L2 (W4 audit): per-feature line-weight multipliers. Declared so the
      // upper-lid 2.5× boost survives demographic / hairstyle / expression
      // layers that might shadow style.featureWeights down the cascade.
      'style.featureWeights',
    ],
    style: {
      lineWeight: 3.0,          // medium-heavy contour, animation-clean (heavier than tintin's 2.4)
      jitter: 0,                // zero wobble — cel-clean
      color: '#0a0a0a',         // true black (vs tintin's warm '#1a1410')
      skinFill: '#fdd6b3',      // pale-saturated default — overrideable per render
      hairFill: '#1a1a1a',      // very dark default — overrideable per render
      background: '#e8e4d8',    // Rollo: warm-neutral plate, NOT pure white
      showConstruction: false,
      // L2 (W4 audit, research/timmflat-ceiling-audit.md): per-feature
      // line-weight multipliers. Timm canon — the upper-eyelid line is the
      // construction-confidence tell. 2.5× over the base lineWeight pushes
      // the lid stroke from ~3.0px to ~7.5px before silhouette boosts; the
      // eye reads as the lid, not the pupil (Sito 2004 p.40). Other
      // features stay 1.0 to keep the rest of the canon clean.
      featureWeights: {
        eyeUpperLid: 2.5,
      },
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
        // fillStyle: 'flat' — declarative replacement for Nick PR #4's
        // recipe.suppressInteriorHairDetail boolean (now deleted, W3 Q1).
        // The renderer reads this to gate the clump-stroke field, sweep
        // strokes, cap shadow band, and cap highlight band. With the
        // companion declares entry the assertion survives any demographic /
        // hairstyle / expression cascade layer pushing back to 'standard'.
        // See model/params.ts HairstyleRecipe.fillStyle doc.
        fillStyle: 'flat',
        // L1 (W4 audit, research/timmflat-ceiling-audit.md): inverted
        // cel-shadow over the right ~40% of the hair mass. Light is
        // implicit 3/4-front-left → shadow falls on the right side. Reads
        // as published-flat (Timm canon) rather than TV-flat. Built
        // parametrically against the same topSil / hairline / curtain
        // geometry the cap fill uses; inscribed strictly inside the hair
        // polygon so painter's order does the clipping.
        highlightCutout: { side: 'right', coverage: 0.40, darken: 0.32 },
      },
    },
  } satisfies Pack,
} as const;

export type StyleName = keyof typeof styles;
export const styleNames = Object.keys(styles) as StyleName[];

// stylePreset returns the SUBSTRATE pass: the pack object minus the `declares`
// manifest. This is what feeds the slot-2 substrate merge in composeFace.
// Splitting `declares` off keeps the FaceParams cascade typed cleanly (the
// manifest is metadata, not face state).
export const stylePreset = (name: StyleName): DeepPartial<FaceParams> => {
  const { declares: _declares, ...substrate } = styles[name] as Pack;
  return substrate as DeepPartial<FaceParams>;
};

// stylePackDeclares returns the slot-6 late-pass manifest for a pack. Default
// `[]` for packs that don't ship one explicitly. composeFace consumes this to
// build the late-pass patch via applyDeclares (model/params.ts).
export const stylePackDeclares = (name: StyleName): readonly AllowedDeclarePath[] => {
  const pack = styles[name] as Pack;
  return pack.declares ?? [];
};
