# nick-alpha-shape-hullmode

Add `hullMode: 'convex' | 'alpha'` to `HairstyleRecipe`, implement
alpha-shape merger in `src/render/hull.ts`. Convex stays as a mode
per mixture rule.

## Brief

Lloyd's pass-2 review (`research/lloyd-pass-1.md` Pass 2 §4) pulled
alpha-shape OUT of the "deferred until adoption" deferral and INTO
Q1-W2. The reason: current convex hull renders `coilyHalo` as a
hexagon and `longCurtain` as a nun's wimple — both unshippable in
their current form. Any W3 pack that wants volume mode (Rollo's
TWA / coily gap) lands DOA without alpha-shape.

Implement alpha-shape per Lloyd pass 1 §7:

- Alpha-shape preserves concavities (parting gaps, gaps between
  clumps).
- Alpha auto-tuned from clump spacing — no hand-tuned knob in v1.
- Lloyd's projection: ~80 LOC in `src/render/hull.ts`.

Mixture rule: add `hullMode?: 'convex' | 'alpha'` to
`HairstyleRecipe` (default `'convex'` for the three W1 volume
fixtures that have already opted in; alpha becomes the default for
any NEW volume-mode adoption). Convex stays as a mode, not deleted.

## Concrete changes

### Types

In `src/model/scaffold.ts` (or wherever `HairstyleRecipe` lives —
follow Nick pass 2's wiring):

```ts
hullMode?: 'convex' | 'alpha';   // default 'convex' for existing
                                  // volume fixtures; 'alpha' for new
```

### Render pipeline

In `src/render/hull.ts`, add an alpha-shape function alongside the
existing convex-hull function. Pure-function shape, same signature
(input: list of projected capsules → output: hull polygon), so Holly
can write regressions against either independently.

Alpha tuning: derive alpha from the median clump spacing in the
input. The qualitative target (Lloyd §7): "alpha auto-tuned from
clump spacing." Concrete: alpha ≈ median nearest-neighbour distance
× some constant (1.5x is a defensible starting guess; tune by
re-rendering the three W1 fixtures until they look right).

The dispatch from convex to alpha lives in the merge stage (stage E
in Lloyd pass 1 §2 pipeline). Read the recipe's `hullMode` once,
pick the merger function, call.

### Hairstyle defaults

- The three W1 volume fixtures (`shortBob` flat regression guard,
  `longCurtain`, `coilyHalo`): leave `hullMode` undefined; default
  resolves to `'convex'` (preserves their existing renders).
- For each of the three: ALSO add a sibling fixture
  `longCurtainAlpha` / `coilyHaloAlpha` that sets `hullMode:
  'alpha'`, OR flip the existing fixture's `hullMode` to `'alpha'`
  if you and Lloyd agree the alpha render is the canonical
  "honest" render and the convex render is the regression-history
  one. Lloyd's framing in §4 leans toward making alpha the
  eventual default for new adoption; ask Lloyd at review time
  which direction to land.

**Default for the timmFlat pack**: irrelevant — timmFlat is
`clumpMode: 'flat'`, so no hull merger fires. Decoupled from this
PR.

## Acceptance

Hard gates:

1. **`hullMode: 'convex' | 'alpha'` added to `HairstyleRecipe`.**
   Default behaviour when `hullMode` is undefined preserves
   existing renders (the three W1 volume fixtures are unchanged
   when their `hullMode` is undefined).
2. **Alpha-shape implementation in `src/render/hull.ts`.** Pure
   function, same input/output type as the convex-hull function.
   ~80 LOC ballpark per Lloyd §7 — if you land at 200+ flag it
   like the last refactor.
3. **The three W1 fixtures re-render under alpha mode** with the
   following visible improvements:
   - `coilyHalo` no longer reads as a hexagon — the radial halo
     should have a roughly-radial concave boundary, NOT a flat-
     edge polygon top.
   - `longCurtain` no longer reads as a nun's wimple — the centre
     parting gap is preserved (paired with item 2 from
     `tasks/nick-eye-plumbing-and-hull-cleanups.md`, the centreU
     fix), AND the side curtains drape as two distinguishable
     masses rather than one trapezoid silhouette.
   - `shortBob` (flat regression guard) unchanged — flat mode
     bypasses the hull merge entirely.
4. **Lloyd reviews this PR** before merge. This is a significant
   architectural addition (a new merger mode, alpha-tuning
   heuristic, sign-flippable behaviour); not the size of an
   inline TL sign-off. Lloyd's verdict drives merge.
5. **Determinism preserved.** Same seed in convex mode → same
   render as before. Same seed in alpha mode → same render every
   time (alpha tuning is deterministic from input geometry, not
   `rng`-driven).

Soft asks:

- Comment the alpha heuristic (why this constant, what it tunes
  for). Lloyd will want to argue the heuristic at review.
- Render a side-by-side sheet of all three fixtures under both
  modes for Bob to share with Gary.

## Context

- `face-lib/research/lloyd-pass-1.md` §7 — the alpha-shape design
  spec.
- `face-lib/research/lloyd-pass-1.md` Pass 2 §4 — Lloyd's
  NEEDS-CHANGES verdict pulling alpha-shape into W2.
- `face-lib/tasks/nick-3d-clump-volume.md` Handoff §3 — what the
  current convex-hull renders look like and why they're
  unshippable.
- `face-lib/SPRINT.md` Q1-W2 ship gate row 2 — closes when this
  lands.
- `face-lib/AGENTS.md` — mixture rule (`hullMode` is a parameter,
  not a replacement).

## Notes

- **Mixture rule.** Convex hull stays as a selectable mode. Do not
  delete the convex-hull function; future tests + the W1 fixtures
  rely on it.
- **Don't tune to a target image.** `longCurtain` and `coilyHalo`
  are test fixtures, not optimization targets. Alpha-shape should
  render them HONESTLY — not "tuned until longCurtain looks like
  this specific anime character." Per AGENTS.md examples-are-not-
  targets.
- **Bundle decisions with Lloyd.** Items 2 and 3 from the bundled
  PR (`tasks/nick-eye-plumbing-and-hull-cleanups.md`) — the
  `centreU` fix and the debug-attr drop — are landing first in
  the eye-plumbing PR. This PR builds on top of them; assume
  they're in.
- **Tangent-decay exposure** (Lloyd pass-2 item 1, APPROVED-WITH-
  EDITS) is NOT in this PR. Cheap follow-up, but no caller needs
  it yet — deferred.
- **Push back if alpha-shape isn't actually fixing the artefact.**
  If after a few hours of implementation the alpha-shape render
  looks just as broken as the convex-hull one, that's a sign the
  diagnosis is wrong, not that you should keep tuning. Ask Bob
  to commission a Lloyd v1.5 design pass instead of inventing
  your own merger strategy.

## Handoff

(Nick fills in on completion.)
