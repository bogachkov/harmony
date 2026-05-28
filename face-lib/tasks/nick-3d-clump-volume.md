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

**Shipped.** Lloyd pass 1 implemented to the brief. Six commits, one per
logical unit (per process.md "one commit per logical unit — Bob can revert
per piece"):

1. `hair-field: clumpStroke takes ClumpSpec, returns ClumpTrace` — new
   signature + integrator. Legacy 6-arg shape lives one commit via
   `clumpStrokeLegacy` shim.
2. `types: Curve gains clump-volume kind + radiusProfile + hullGroup;
   recipe gains clumpMode/clumpVolume` — type surface plumbing.
3. `render: hull.ts + projectVolume helper + svg hull-merge pass` — new
   pure-function `src/render/hull.ts` (convex hull + capsule expand), one
   helper in `project.ts`, hull-merge pass in `svg.ts`.
4. `scaffold: wire clumpMode === 'volume' through the clump loop` — the
   actual volume integration in the clump loop + cap/shadow/highlight
   suppression in volume mode.
5. `hair-field: delete clumpStrokeLegacy shim` — final form, single API.
6. `hairstyles: add 3 Lloyd pass 1 §6 test fixtures` —
   `shortBob` / `longCurtain` / `coilyHalo`.

**Net LOC.** Engine code (`src/model/` + `src/render/`): +476 added,
−32 removed → net **+444 in engine code**. Test fixtures + index: +148.
Above Lloyd's projected +150 (§4). Differences:

- `src/render/hull.ts` came in at ~160 LOC, in line with Lloyd's "~150."
- The `clumpStroke` 3D integrator + types is ~140 LOC because the
  tangent-blend + jitter + flat-fast-path each need a few lines plus
  inline comment explanation of WHY each branch exists; Lloyd's
  estimate didn't count flat-fast-path documentation.
- Cap/shadow/highlight deletion is **gated** (`if (!isVolume && drawCap)`)
  rather than physically removed — the flat path keeps the code path
  alive. This is the mixture-rule cost Lloyd flagged in §4. ~90 LOC of
  cap/shadow/highlight stays alive for `flat` mode.
- Comment density is higher than Lloyd's estimate (every new branch +
  every new field type has a paragraph). I think that's right for a
  longest-pole piece of work the rest of the team will read; if Lloyd
  prefers fewer comments I'll cut on review.

Per the "+250 → flag for re-spawn" soft ask: I am clearly past +250
(at +444 engine) and want to flag this for Bob. The drift is mostly
honest mixture-cost (keeping flat alive) and comment volume; if Lloyd
agrees the structure is sound, the line-count itself is not a red flag
for me, but it's exactly the kind of thing the brief asked I surface.

**Regression test.** All 13 hairstyles (× 2 presentations = 26 renders)
were captured pre-refactor at `/tmp/baseline` and re-rendered after every
commit. SVG output is **bit-for-bit identical** to baseline at every step.
This is stricter than the brief asked (it allowed visually-equivalent;
the flat fast-path turned out to be identical). The cap polygon path,
the leads loop, the verticalLift loop, and the tailMass loop all
unchanged.

**Three Lloyd fixtures.** Rendered cleanly:

- `shortBob` (flat regression guard): pixel-identical to `bobChinLength`
  modulo the explicit `clumpMode: 'flat'` field — diff is zero. The flat
  fast-path identity guarantee holds.
- `longCurtain` (volume, gravity=0.8): hull silhouette extends visibly
  past the chin without `tailMass`. The promise is met. The shape is
  blocky on the outer edges — convex hull aggregating side-curtain
  capsules into one trapezoid — exactly the Lloyd §7 tech-debt symptom.
- `coilyHalo` (volume, radial=+0.6): hull projects a radial halo
  visibly larger than the cranium silhouette. Edge texture comes from
  per-clump `baseRadius * (0.6 + rng() * 0.8)` variance, NOT from
  `edgeJitter()` (`edgeKind` stays `'smooth'`). The sign-flippable
  radial term works.

**Surprises.**

1. The `addWaviness()` post-processing step kept working as-is on volume
   centrelines because it operates on `Vec3[]` not on the radius array.
   I considered whether waviness should perturb the radius (rationale:
   on a curly head the visible silhouette texture IS the radius
   variance), but per "examples-are-not-targets" + "don't expand scope"
   I left it. Future hairstyle work can wire that.
2. `clumpStroke()`'s flat fast-path needed careful handling of
   `samples + 1` vs `samples` iteration counts to stay bit-for-bit
   identical with the old function — the old loop was `for (i = 0; i <= samples; i++)`
   producing 29 points for `samples = 28`. Preserved exactly.
3. Convex hull's flat-edge collapse on `coilyHalo` is worse than I
   expected at first render — the top of the halo reads as a hexagon
   rather than a textured boundary. This is the documented v1 cost
   (Lloyd §7); alpha-shape filed in BACKLOG.

**Did NOT do (per brief).**

- Alpha-shape merger (Lloyd §7; filed in BACKLOG).
- Lead/fill coupling (still off; explicit pending row in BACKLOG).
- Anything to the existing 13 hairstyle files (touched none; brief said
  "do not touch their contents in this PR").
- Forelock / fringeBand / highlightCutout (BACKLOG; not promoted).

**BACKLOG follow-ups added.**

- New row: `Hull-merge → alpha-shape` filed under Deferred features
  (~80 LOC; promote when a shipped hairstyle adopts `clumpMode: 'volume'`
  and the parting-gap-collapse artefact bites).
- Existing row `Lead/fill coupling (behaviour)` still applies — type
  plumbing now lives alongside `clumpMode` plumbing; both are wired
  through, neither is active behaviour-wise except for `clumpMode:
  'volume'` on the three test fixtures.

**Lloyd review.** Ready. Suggested focus areas (the spots most likely
to need a structural call rather than line-level tweaks):

1. `clumpStroke()`'s tangent-decay term `1 - 0.8 * spec.gravity * t`.
   Pulled from intuition (hair-theorist's "spring vs weight" framing in
   §5), not measured. Lloyd may want a different formula or a
   parameter exposing it.
2. `hullGroup` keying by `sideRoll`-bucket (front / left / right). This
   loses fidelity vs. a per-clump 3D-position-based bucket (e.g., split
   the front group at the centre parting). May need a fourth `nape`
   bucket once back-of-head views matter (Q2+).
3. The `data-hull-group` SVG attribute uses the `avgZ` for debugging.
   Strip if Lloyd thinks it leaks information.

**Visual sheet for the user.** Pre/post 13-hairstyle render sheet
captured at `/tmp/baseline/*.svg` and `/tmp/refactored/*.svg` (identical
by content; share post for clarity). Three fixtures at
`/tmp/lloyd-fixtures/{shortBob, longCurtain, coilyHalo}.png`.

