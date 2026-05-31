# PLAN — construction-first face engine

Status: written 2026-05-31, grounded on the spike (`spike/`), not on the
older planning docs. Supersedes the SDF-rewrite framing in ROADMAP/SPRINT,
which were written before the spike and in the retired persona/scoring voice.

## The thesis (proven by the spike)

The program mirrors how an artist constructs a head on autopilot: build the
ball, derive the construction landmarks (brow line, eye line, thirds) from it
by Loomis proportion, then FIND each feature on those landmarks. Features are
never placed by hand-tuned coordinates.

Two unknowns were de-risked in `spike/`:

1. **Construction-as-program works.** `spike/head.ts` has no `eyeLineY` /
   `noseRootY` constants. Change one cranium dial and every feature relocates
   correctly with zero feature-code edits (proven: `jawDrop` 1.15→1.6 moved
   eyeY/browY/noseBaseY; wider cranium moved eyeSpacing).
2. **Line-art from SDF works.** `spike/line-render.ts` sphere-traces a
   depth+normal G-buffer and inks silhouette + depth-step + crease edges.
   Output reads as drawn contours, not CGI. This was the riskiest piece.

## What the spike does NOT yet have

- Contours are loose pixel ink, not joined polylines. No stroke character.
- Socket/brow creases ink weakly; nose is thin in profile.
- One head only — no demographics, expression, hair, style, determinism.
- No public API, no tests.

## Build order

**P1 — solidify the substrate.** Clean cranium + jaw + eye/socket + nose +
mouth, all construction-derived, reads from 3 angles. (Spike is ~80% here.)

**P2 — real line extraction.** Trace edge pixels into ordered polylines
(Suzuki–Abe + Douglas–Peucker), feed `render/strokes.ts` (perfect-freehand,
kept from the old engine) so lines have weight and a hand-drawn quality.
This is where quality lives. Highest-risk after the spike.

**P3 — promote spike → `src/`.** Replace the magic-number `src/sdf/head.ts`
with the construction model. Keep `primitives.ts` (sound), the perfect-freehand
stroke pass, and `vec3`.

**P4 — proportion presets as construction dials.** Demographics = different
cranium/jaw dials, not feature swaps. Child = rounder/shorter jaw; etc.

**P5 — determinism + a narrow public API.** `composeHead(dial, seed) → SVG`,
same input = same output. Prerequisite for any LLM/identity work later.

**Deferred (not now):** hair, expression, style packs, bodies/animals/world.
`PLAN`'s world-engine vision stays filed, not on the critical path.

## Keep / kill from the existing engine

- KEEP: `sdf/primitives.ts`, `math/vec3.ts`, `render/strokes.ts` (perfect-freehand).
- REWRITE: `sdf/head.ts` (magic numbers → construction).
- DEFER/IGNORE: the 2D `scaffold.ts` engine, style packs, hair — superseded.

## First concrete step

Land P2 on the spike: ordered polylines + perfect-freehand strokes, one head,
3 angles. If the lines read as drawn-with-weight, promote to `src/`.
