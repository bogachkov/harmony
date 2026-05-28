# nick-3d-clump-volume

Implement Lloyd pass 1's 3D clump-volume refactor. Behind a flag.
Mixture rule applies: existing hairstyles must render visually
equivalent in `clumpMode: 'flat'` (the default).

## Brief

Implement the design in `face-lib/research/lloyd-pass-1.md` end to
end. Single PR is fine if you can keep it under ~400 LOC net; split
into two if it grows past that (Curve + ClumpSpec types first, then
hull merge + render integration).

Concrete changes (verbatim from Lloyd pass 1; deviations require
asking Bob to commission a Lloyd re-spawn, not unilateral):

- **Types.** Add `ClumpSample`, `ClumpTrace`, `ClumpSpec` to
  `hair-field.ts`. Extend `Curve` in `scaffold.ts` with optional
  `radiusProfile?: number[]` and `hullGroup?: string`, plus new
  `kind: 'clump-volume'`. Extend `HairstyleRecipe` with optional
  `clumpMode?: 'flat' | 'volume'` (default `'flat'`) and optional
  `clumpVolume?: { gravity, radial, radius }`.
- **`clumpStroke()` new signature.** `clumpStroke(field, ClumpSpec):
  ClumpTrace`. Single function. The 6-positional-arg version dies.
  Callers build `ClumpSpec` literals. A one-commit shim
  `clumpStrokeLegacy(field, startUV, length, samples, surfaceOffset,
  stopAt): Vec3[]` is permitted to bound the diff; delete it in a
  follow-up commit before the PR merges.
- **Pipeline.** SEED (unchanged) → TRACE (new 3D integrator in
  `hair-field.ts`) → EXPAND (centreline + radii becomes a Curve) →
  PROJECT (one helper `projectVolume(curve)` added to `project.ts`
  returning a 2D capsule chain) → MERGE (new file
  `src/render/hull.ts`, ~150 LOC, convex-hull union per `hullGroup`)
  → RENDER (perfect-freehand centrelines + filled hulls; ~10 lines
  added to `svg.ts`).
- **Flat fast-path.** When `clumpMode === 'flat'` (or `gravity=0 &&
  radial=0 && radius0=0`), the integrator falls back to today's
  UV-space stepping at the top branch. Cap polygon path at
  `scaffold.ts:959-1045` stays unchanged in flat mode. Hull merger
  is a no-op in flat mode. Deletion plan at Lloyd pass 1 §4 — follow
  the verdicts there ("KEEP", "REFACTOR", "DELETE when volume").
- **Hairstyle files.** All 13 in `src/hairstyles/*.ts` default to
  flat (do NOT set `clumpMode`). Do not touch their contents in this
  PR.

## Context

- `face-lib/research/lloyd-pass-1.md` — full architecture spec.
  Read this first.
- `face-lib/research/leo-3d-and-lead-fill.md` — Leo pass 8 §1 + §11.5
  framed the need. Lloyd diverged from Leo on the seam (one function,
  not two); Lloyd's framing wins, but the underlying motivation
  (gravity / radial / radius as parameters that escape the surface)
  is Leo's.
- `face-lib/research/hair-theory.md` — physics of how clumps actually
  hang in 3D. HT-4 (regional bedhead) is NOT in scope for this PR;
  flag if you find yourself reaching for it.
- BACKLOG row "Lead/fill coupling (behaviour)" — pending this PR.
  The plumbing landed in Nick pass 2; the actual coupling of leads
  → fill seeds is to be wired AFTER the hull merge ships, in a
  follow-up. Do not wire in this PR.
- Pre-existing Nick pass 2 renamed `flowStrokes → leads` with a
  deprecation alias — assume that landed.

## Acceptance

Hard gates (all must be true for Bob to merge):

1. **Three test cases from Lloyd pass 1 §6 render cleanly.** Commit
   the test fixtures alongside the PR:
   - `shortBob` (flat, regression guard): pixel-diff against the
     pre-refactor render under perceptual threshold. If it diffs,
     the flat path is broken; revert and find the leak. Visually-
     equivalent is the bar, not bit-for-bit (signature rename is
     the only deviation).
   - `longCurtain` (volume, gravity=0.8, radial=0): side-curtain
     strokes drape past the chin. Hull silhouette extends below
     `templeY` without `tailMass` cheat. Should reach the coverage
     of a `tailMass=0.6` render with ~60% fewer strokes.
   - `coilyHalo` (volume, gravity=0, radial=+0.6): hull projects
     a radial halo larger than the cranium. Edge texture comes from
     radius variance, not from `edgeJitter()`.
2. **All 13 existing hairstyles** in `src/hairstyles/` render visually
   equivalent to pre-refactor in flat mode. Render a 13-hairstyle ×
   {feminine, masculine} sheet before and after, share both.
3. **Lloyd reviews the PR** before merge. If Lloyd flags structural
   problems, fix and re-render; do not merge with open architectural
   pushback.
4. **Determinism preserved.** `rng` consumption order in flat mode
   matches pre-refactor (Lloyd pass-1 §5 promise). Same seed = same
   render.

Soft asks (do these if you can, but don't block on them):

- LOC honesty: Lloyd projects net +150. If you land at +250 or more,
  call it out in the PR description so Bob can decide whether to
  commission a Lloyd re-spawn before merge.
- `src/render/hull.ts` should be obviously testable as a pure
  function (input: list of projected capsules → output: hull
  polygon). Holly will want to write regressions against it next
  sprint.

## Notes

- **Push back if the brief is wrong.** Lloyd pass 1 §7 admits the
  convex-hull merge is brittle (will eat parting gaps within ~2
  sprints, alpha-shape is the honest fix). If during implementation
  you find a render where convex-hull immediately breaks the result
  on a flat hairstyle, that's a sign to stop and ask Bob to commission
  Lloyd for a v1.5 design — not to invent your own merge strategy.
- **Mixture rule.** Per AGENTS.md: new behaviour is a parameter,
  not a replacement. `clumpMode` is the parameter. If you find
  yourself wanting to delete the flat path, stop and re-read the
  rule. The flat path stays alive.
- **Examples-are-not-targets.** `longCurtain` and `coilyHalo` are
  test fixtures, not optimization targets. Don't tune the integrator
  until "longCurtain looks like a specific anime character." It's
  testing the volume primitive, full stop.
- Lloyd pass 1 §7 names alpha-shape as the followup. Don't do
  alpha-shape in this PR. Mention it in BACKLOG when you're done.

## Handoff

(Nick fills in. Expected: "PR merged. 13-hairstyle regression sheet
attached. Three Lloyd test cases attached. Lloyd review thread
linked. Net LOC: X. Known issues: Y. BACKLOG follow-ups added: Z.")
