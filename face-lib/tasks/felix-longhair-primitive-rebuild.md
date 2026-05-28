# felix-longhair-primitive-rebuild

Felix's first spawn (W3 Wave-1 parallel to Nick Q2). Rebuild the
long-hair primitive so the field-tracer's multi-strand layer no-ops
when the pack pedagogy demands a single flat shape. Closes cells 6,
7, and 11 of the timmFlat grid — the cells dropped from W2 because
they hit a primitive-level ceiling no cascade fix can reach.

**Welcome to the team.** Per `face-lib/AGENTS.md` §Felix, your
lane is the graphics-math interior of primitives — algorithm class,
input-scale sizing, the math itself. This is your first owned piece
of work; David scoped it specifically as the right calibration task
because it's a real deep-graphics task with a fixture and a quality
bar. Read AGENTS.md §Felix + PROCESS.md decision-rights table on
spawn — your lane vs Lloyd / Nick / Leo / Pascal is named there.

## Brief

Pascal Pass 1 (`research/pascal-w2-timmflat.md` §Job 1) scored cells
6/7/11 at 2/2/2. Diagnosis (Pascal + Nick concurring): the `style:
'long'` field-tracer's multi-strand mode is incompatible with Timm
canon ("long hair = one flat shape"). The strand layer renders
below the override cascade, so no pack-level override can reach it.
Lloyd's W2 cascade-merge manifest (Q1) doesn't address this — wrong
layer; this is primitive-level, not cascade-level.

The fix is a **primitive-level rebuild** in `src/render/field-
tracer.ts`. Per Pascal's reco + your own graphics-math judgment:

- **Smallest path: field-tracer no-ops when `clumpMode: 'flat'` AND
  no leads configured.** Reads the pack-pedagogy intent off the
  recipe surface; no new knob needed.
- **Alternative: add `recipe.strandMode: 'off'` knob** if the no-op
  predicate proves leaky (e.g., some hairstyle wants flat clumps
  PLUS strand layer — unlikely but worth checking against the
  existing 13-hairstyle catalog).

**Your call.** Per Felix-lane authority on graphics-math interior:
this is exactly the kind of decision your lane owns. Per smallest-
fix discipline: try the no-op predicate first; reach for the knob
only if the predicate proves wrong against the existing catalog.

Sized ~30-50 LOC per Lloyd's W2 estimate. Surface to Bob if your
own input-scale sizing comes out materially different — that's
exactly the kind of estimate-vs-reality calibration AGENTS.md §Felix
calls out as your lane (cf. the alpha-shape ~80 → ~340 LOC overrun
that motivated your role).

## Why this work, why this row, why you

- **Why this work:** Pascal Pass 2 closed W2 at 8/13 cells ≥ 5 with
  cells 6/7/11 explicitly out of scope. ROADMAP "depth > count"
  says we finish demographic depth on pack #2 before W4 picks pack
  #5. Without closing cells 6/7/11, timmFlat lands as a 13-cell
  pack with a known long-hair gap.
- **Why this row in W3:** Lloyd's Q2 (demographic data) + Q1
  (cascade manifest) close the OTHER 5 short cells (the topology
  gap). Cells 6/7/11 are the engine-primitive gap, separate
  architectural surface, separate fix path. All three close
  together in W3 = full 16-cell grid.
- **Why you:** AGENTS.md §Felix onboarding note names this row as
  your first spawn. Bob's recommendation to David framed this as
  the acute trigger; David approved the hire on the strength of
  that framing. You own this primitive going forward — the field-
  tracer is in your lane, the orbital-socket recess primitive
  (BACKLOG, W4-ish) is in your lane, future SDF / level-set /
  hull-merger work is in your lane.

## What to investigate before writing code

Per Felix-lane discipline (algorithm class + input-scale sizing
BEFORE design lands):

1. **Read `src/render/field-tracer.ts`.** Identify the multi-strand
   entry point for `style: 'long'`. Trace the path that produces
   the radial-from-crown + vertical-strands-past-chin artifact
   Pascal scored at 2.
2. **Read the existing long-hair hairstyle files:** `longSleek.ts`,
   `longTail.ts`, `longCurtain.ts`, `longCurly.ts`, `longWavy.ts`,
   `longFlowing.ts`, `longWitch.ts`. Which carry `leads`? Which
   set `clumpMode: 'volume'` vs default flat? Build a quick matrix
   so you can verify the predicate `clumpMode === 'flat' AND
   leads.length === 0` doesn't fire on any existing hairstyle the
   user already relies on.
3. **Read the BACKLOG filed-aesthetics rows** for long-hair —
   chaotic/stringy/witch (longWitch), shoulder-falling sleek
   (longSleek), big curly mass (longCurly), gentle wave (longWavy),
   falling-past-shoulders (longTail), 3D clump volume gravity
   (longCurtain), 3D clump volume radial (coilyHalo). All of these
   stay reachable post your change. The mixture rule is load-
   bearing.
4. **Sanity-check input-scale** — what's the strand-count cardinality
   the field-tracer generates today on `longSleek` × `tintin`? Is
   the multi-strand layer the dominant artifact, or is there a
   parallel sweep-stroke / clump-stroke field also firing (per
   Nick's PR #4 diagnosis on the bob/pomp cells)? Nick gated 4
   blocks in `scaffold.ts` via `suppressInteriorHairDetail`; you
   may find the field-tracer is a separate file but with parallel
   structure. Note your finding in the handoff — it's load-bearing
   data for future graphics-math work.

This investigation IS the deliverable's first half. Write it up
honestly even if it leads you to a different conclusion than the
brief — Felix-lane authority says graphics-math STOP if the design
direction is wrong.

## What to land

**Approach 1 (the predicate, smallest fix):**

1. Locate the multi-strand entry point. Add the guard: if
   `clumpMode === 'flat'` AND `recipe.leads.length === 0` (or
   `!recipe.leads`), early-return without emitting strand strokes.
2. Verify the silhouette + cap polygon + parting tick still render
   via other paths (those are not strand-layer responsibilities).
3. Verify the predicate is `false` for every existing long-hair
   hairstyle that wants strands. Your investigation matrix above
   tells you which.

**Approach 2 (the knob, only if predicate proves leaky):**

1. Add `recipe.strandMode?: 'on' | 'off'` to `HairstyleRecipe` in
   `src/model/params.ts`. Default behavior matches `'on'` (preserves
   all existing renders per mixture rule).
2. Set `timmFlat.declares` (or `timmFlat.recipe.strandMode = 'off'`,
   coordinate with the Q1 manifest landing — if Q1 has landed,
   include the path in `timmFlat.declares`; if Q1 is still in
   flight, leave a TODO comment for Nick's Q1 PR to fold in).
3. Field-tracer reads the value and early-returns when `'off'`.

Either approach: re-render cells 6, 7, 11 to confirm the strand
artifact is gone and the silhouette reads as the single flat shape
Timm canon demands.

## Mixture rule

**Critical** — every existing long-hair hairstyle must remain
reachable on `default` / `tintin` / `ligneClaire`:

- `longCurtain` (3D-volume gravity, `clumpMode: 'volume'`)
- `coilyHalo` (radial halo, `clumpMode: 'volume'`)
- `longCurly` (waviness 0.075 + freq 5.0)
- `longWavy` (waviness 0.030 + freq 2.2)
- `longSleek` (existing register on non-timmFlat packs)
- `longTail` (tailMass 0.85)
- `longFlowing` (low-priority but filed)
- `longWitch` (edgeKind crowSnipped + extreme waviness — Rollo's
  "competent ugly, defend this slot" filed-aesthetic)

Verify byte-identical regression on those packs × long-hair
hairstyles. Approach 1 should naturally pass this — the predicate
fires only when BOTH conditions hold, and none of the existing
hairstyles satisfy both. Approach 2 with `'on'` default passes
trivially.

## Acceptance

1. **Cells 6, 7, 11 render without the multi-strand artifact.**
   Pascal scored these 2/2/2 originally; your honest pre-Pascal
   sniff read should land all three at "single flat shape, no
   radial-from-crown strands, no vertical strands past chin."
   Pascal makes the final score.
2. **Existing long-hair hairstyles byte-identical** on `default`,
   `tintin`, `ligneClaire`. Run the regression sweep against the
   prior baseline (`/tmp/timmflat-out/regression-pr4/` per Nick PR
   #4, or the post-Q2 baseline if Q2 has shipped — coordinate with
   Bob on which baseline is current).
3. **timmFlat cells 1-5, 8-10, 12-16 unchanged.** This change is
   scoped to the long-hair primitive — the short-hair / bob / pomp
   cells should not regress. If they do, the predicate fired too
   broadly; tighten the gate.
4. **Investigation writeup** in the handoff section. Algorithm
   class, input-scale sizing, parallel-fields finding (whether
   the field-tracer is the sole artifact source or there are
   adjacent `scaffold.ts`-style unconditional blocks). This is
   graphics-math interior documentation; future Felix passes (and
   anyone touching the field-tracer) will read it.
5. **LOC budget:** Lloyd's estimate was ~30-50 LOC. Your own sizing
   may differ — surface honestly if it does. If your approach
   exceeds ~80 LOC, surface to Bob before continuing.
6. **Pre-Pascal sniff test** for cells 6, 7, 11 (one sentence each).
   Honest read — share with Bob even if you're not happy with the
   result.

## Constraints

- **Examples are not targets.** Don't tune until cell 6 looks like
  Catwoman. Tune until the strand-radial-from-crown artifact is
  gone and the silhouette reads as one closed shape. Pascal scores
  the register, not the match-to-character.
- **Variety in test rotation.** Render ALL 16 timmFlat cells, plus
  the long-hair sweep across `default` / `tintin` / `ligneClaire`.
  Don't render just cells 6/7/11 to verify your fix — that's
  Haddock drift on the variety axis.
- **Felix-lane STOP.** If your investigation reveals the field-
  tracer rebuild needs a non-trivial algorithm-class change (e.g.,
  the strand integration is using a method that won't be
  predicate-able without restructuring), surface to Bob. Per
  AGENTS.md §Felix: "the algorithm class is wrong for our input
  scale" is a stop-the-line. This is the move that didn't happen
  on the alpha-shape pass; you're empowered to make it here.
- **Co-design with Lloyd if architectural surface is touched.** If
  you find the fix requires `model/params.ts` type changes (the
  knob approach), Lloyd reviews the type addition — that's his
  architectural lane. The predicate inside the field-tracer is
  pure graphics-math interior, your lane.
- **Co-design with Leo if pedagogy shifts.** Unlikely — Leo's
  symbolic spec for Timm long hair is "one flat shape with
  parting" (the spec at `research/stylepack-timmFlat-spec.md`).
  Your math is rendering that. If the math forces a pedagogy
  shift (it shouldn't), surface to Bob to get Leo back in.
- **Don't touch Q1 or Q2.** Those are Nick's W3 rows. Your work
  is scoped to the long-hair primitive in the field-tracer.
- **Don't touch other hair primitives** (curlyDome / coilyHalo /
  shortPomp / etc). Stay in the long-hair path of the field-
  tracer.

## Context

- `face-lib/AGENTS.md` §Felix — your role definition. Onboarding
  note names this row as your first spawn. **Read first.**
- `face-lib/PROCESS.md` decision-rights table + Lloyd-vs-Felix +
  Felix-vs-Leo escalation lanes. Read on spawn.
- `face-lib/research/pascal-w2-timmflat.md` §Job 1 (cells 6/7/11
  scoring) + §sprint-close recommendation (Pascal's exact
  prescription).
- `face-lib/research/lloyd-cascade-architecture.md` — Lloyd's W2
  design pass. Q1/Q2 don't own this work; the long-hair primitive
  is acknowledged out-of-scope for cascade-merge. Context only.
- `face-lib/src/render/field-tracer.ts` — the file you're editing.
- `face-lib/src/model/params.ts` — `HairstyleRecipe` definition.
  Only touched if you take Approach 2 (the knob).
- `face-lib/src/presets/styles.ts` — `timmFlat` pack. Only touched
  if you take Approach 2 AND coordinate with whether Q1 manifest
  has shipped.
- `face-lib/src/hairstyles/` — read the long-hair files
  (longSleek/longTail/longCurtain/longCurly/longWavy/longFlowing/
  longWitch) to verify the mixture-rule guard.
- `face-lib/research/hair-theory.md` (if it exists) — physics doc
  context per Felix-lane required-behavior.
- `face-lib/BACKLOG.md` — filed-aesthetics rows for the long-hair
  styles you must preserve as reachable.
- `face-lib/SPRINT.md` — W3 acceptance row this closes (long-hair
  primitive box).
- `face-lib/tasks/nick-cascade-leak-fix.md` — Nick PR #4 with the
  parallel `scaffold.ts` artifact-source diagnosis (worth reading
  for context on the parallel-fields finding the investigation
  may surface).
- `face-lib/tasks/david-team-rescope-graphics-specialist.md` —
  David's pass-3 handoff scoping your role.

## Handoff

(Felix fills in on completion. Required:
- Investigation writeup — algorithm class, input-scale sizing,
  parallel-fields finding.
- Which approach taken (predicate vs knob) and why.
- Per-cell pre-Pascal sniff reads for cells 6/7/11.
- Regression sweep status on the long-hair styles across `default` /
  `tintin` / `ligneClaire`.
- Render paths.
- Any graphics-math tech debt surfaced.)
