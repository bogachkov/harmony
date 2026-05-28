# lloyd-3d-architecture

First Lloyd spawn in the project. You are Lloyd, the senior programmer
specialist. Architecture pass before Nick implements the 3D refactor.

## Brief

Design the architecture for the 3D clump-volume hair primitive per
Leo pass 8 §1. Output: a written design doc Nick can implement against.

The shape Leo prescribed:
- Each clump = a swept tube. Centreline polyline rooted on scalp, with
  per-point radius profile. Gravity term + sign-flippable radial term
  (positive = halo / coily; zero = gravity-only fall).
- Refactor seam: `clumpStroke()` in `src/model/hair-field.ts`. UV→XYZ
  becomes the STARTING point of the centreline, not a constraint on
  the whole curve. The clump continues in 3D world space from there.
- Existing 2D-surface machinery in `src/model/scaffold.ts:813-1045`
  (`topSil`, cap polygon, shadow region, highlight band, edge jitter)
  collapses to a projected-hull merge — strands are 3D, projection +
  hull computation at render time.
- Net LOC: +200 (new tube math + projection) − 232 (deleted surface
  machinery) + 150 (projected-hull merge) ≈ +118 net. Verify.

## Your task

Write a design doc, not code. Specifically:

1. **Type design.** What new types are needed? Existing types
   (`FaceParams`, `HairstyleRecipe`, `Curve`, `Lead`) — what changes?
   What stays?

2. **Pipeline.** Sketch the new render pipeline:
   `recipe + scalp params → seed clump origins → trace 3D centrelines
   (gravity + radial + interactions) → expand to tubes → project to
   2D → merge to silhouette hull → render via existing perfect-freehand
   path.` Identify each step's inputs/outputs.

3. **The seam.** `clumpStroke()` is the cleanest seam Leo named. What's
   its new signature? Does it become two functions (3D-trace then
   project)? Or stay one and return 3D?

4. **Deletion plan.** Which functions / blocks in `scaffold.ts:813-1045`
   get deleted, which get kept, which get refactored? Nick's worry: the
   short-hair texture overlay + escape strokes + clump loop interact
   with the cap. The 3D primitive needs to subsume their visual function.

5. **Mixture preservation.** Leo emphasized `clumpMode: 'flat'` for
   ligne-claire (current behaviour, no 3D volume). Nick will worry
   the refactor breaks the existing tintin renders. Tell him exactly
   how the `flat` mode preserves them — bit-for-bit, or just visually
   equivalent?

6. **Test plan.** Three concrete render-cases Nick should verify
   before declaring the refactor done. Pick them to cover the
   breadth — one ligne-claire short, one long flowing, one coily/halo.

7. **Tech debt warning.** Identify ONE thing about this design that's
   technically right but will be a pain to maintain. Be honest.

## Context

- `face-lib/AGENTS.md` — read your role, the mixture-not-survival rule,
  the collab artifacts.
- `face-lib/research/hair-tooling.md` §11 — Leo pass 8 audit (your
  starting point). Read all of §11.
- `face-lib/research/hair-theory.md` — hair physics. Especially the
  gravity + curl-recoil sections.
- `face-lib/src/model/hair-field.ts` — the cranialField + clumpStroke
  code as it is today.
- `face-lib/src/model/scaffold.ts:813-1045` — the surface machinery
  that gets deleted.
- `face-lib/src/render/strokes.ts` + `src/render/svg.ts` — the
  perfect-freehand path that 3D primitives will project into.
- `face-lib/SPRINT.md` — current sprint state.

## Acceptance

- Write `face-lib/research/lloyd-pass-1.md` (you can pick the filename
  if you prefer something more specific). Hard cap: 200 lines.
- End with a 5-bullet executive summary covering: type changes,
  pipeline steps, the seam's new shape, the mixture-preserving mode,
  one tech-debt warning.
- Update `## Handoff` here when complete.
- Brief return note (<200 words) to the Tech Lead.

## Notes

- You're the FIRST Lloyd spawn. The role exists in AGENTS.md but
  nobody's been Lloyd yet. Be opinionated.
- DO NOT write implementation code. Nick implements after your design
  lands. Tech Lead reviews before Nick spawns.
- If you conclude "Leo's recommended architecture has a flaw" — say so,
  with the alternative. Better to fix in design than in implementation.

## Handoff

(Lloyd fills in.)
