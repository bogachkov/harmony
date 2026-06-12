// Hairstyles live here as DATA, never engine code. Each hairstyle is a
// `DeepPartial<FaceParams>` — and per pass-5 STOP HS-3, it MUST ONLY touch
// the `hair` block (and at most `style.hairFill` for color-locked archetypes,
// which we avoid per HS-1: hairstyle is silhouette + composition, NOT color).
//
// The recipe field (FaceParams.hair.recipe) carries the load-bearing
// composition: parting kind + the explicit list of FlowStrokes that fill the
// mass. Different hairstyles compose different interior arrangements; that
// is what makes them DIFFERENT hairstyles rather than just different
// silhouette knobs on the same composition.
//
// Naming convention (HS-2): camelCase descriptive (`sideForelock`,
// `spikyShort`). NEVER proper-noun (`sanji`, `goku`). The meta-Haddock
// rule (AGENTS.md "Examples are not targets") prohibits naming a
// hairstyle after the character that inspired it.
//
// Cascade slot: defaults → style → presentation → age → HAIRSTYLE → expression
//             → character → overrides
// Hairstyle is applied AFTER demographic so it wins on hair-specific
// conflicts (per Leo pass-5 §2 rationale: "a hairstyle is a chosen
// identity that must survive demographic"). The cascade position itself
// is owned by api.ts; this directory just emits the data.

export {};
