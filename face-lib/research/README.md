# research/ — raw findings, saved before they're acted on

This folder holds research-pass outputs *as they came back* from the
research process (search + source-code review of existing libraries +
pedagogy lookup). Each file is the verbatim findings for one
need → pedagogy → existing-approaches investigation.

The discipline (see `RESEARCH.md §0`):

1. **Need** identified.
2. **Research pass** — pedagogy + existing-implementation source review.
   The output of that pass is written here, raw, before any code changes.
3. **Decisions** (import / emulate / learn-from) recorded in the file.
4. **Refactor** the code to match the findings, citing this file from the
   commit message.

Files here are also the artifact a future maintainer (or LLM) needs to
re-derive the design choice without re-running the research. Don't delete
them when the corresponding refactor lands — they're the record.

## Contents

- `hair.md` — pedagogy for hair, library survey (DiceBear variants, faces.js,
  avataaars, SketchHairSalon, Live2D, Picrew), recommended primitive set
  (`cranialField`, `hairlineCurve`, `massSilhouette`, `clumpStroke`,
  `fringeClumps`, `interiorSeparators`, `highlightBand`), and art-pack
  override strategy. Refactor of `buildHair` is pending.
- `primitives-nose-ears-neck-brows.md` — pedagogy and library survey
  (DiceBear avataaars/lorelei/personas/notionists, faces.js) for the four
  primitives that currently have magic-number-y implementations.
  Pedagogy-rooted parameter renames are proposed but not yet applied
  (e.g. nose: `keel`/`alarWidth`/`tipPlane`/`basePlane`/`septumShow`; brows:
  `ridgeY`/`innerLift`/`outerLift`/`tilt`/`fullness`/`unibrow`).

## Sibling docs

- `../RESEARCH.md` — distilled cross-cutting pedagogy + architecture
  principles. Includes the discipline (§0) and the multi-subject overview.
- `../PLAN.md` — implementation plan for extending the engine to body,
  animals, monsters, buildings, locations, items.
