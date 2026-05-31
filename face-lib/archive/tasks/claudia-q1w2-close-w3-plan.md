# claudia-q1w2-close-w3-plan

Claudia's fourth spawn. Formal W2 close + W3 open. Pascal's revised
re-score gave 8/13 cells at ≥ 5 and recommended ship-with-known-gaps;
Gary's instruction is to close W2 and start W3.

## Brief

Pascal's Pass 2 verdict (`research/pascal-w2-timmflat.md` §Pass 2):

- **8 / 13 retained cells at Pascal ≥ 5** (cells 1, 2, 3, 4, 5, 8,
  9, 10). 5 cells at 4 (cells 12, 13, 14, 15, 16).
- **All 5 short cells trace to the same root cause:** the
  demographic-topology gap (child-round / elder-jowled / four-corner
  pairs don't push jaw shape hard enough apart at silhouette).
- **Cascade-leak fix (Nick PR #4) landed clean.** All 6 primary fix
  targets show no interior strand artifact.
- **Lloyd's W3 Q2 design (~50 LOC demographic-preset-data fix)
  already owns the 5 short cells.**
- Pascal's recommendation: ship-with-known-gaps; W3 closes the full
  16-cell grid. Strict 13/13 doesn't close, but the right answer is
  "accept with named gap" rather than another W2 iteration.

Gary's call after the close report: accept Pascal's recommendation,
close W2, start W3.

## Your task

1. **Formally close Q1-W2 in SPRINT.md.** Archive contents to
   `## History`. Mark the timmFlat box `[~]` (partial accept) with
   8/13 + the W3 row that finishes it. Other 4 boxes are full
   `[x]`. The history entry should be honest about what landed and
   what was deferred.

2. **Open Q1-W3.** Set the W3 goal + ship gate + ticket queue. Per
   your prior W2 re-plan + Lloyd's design pass, W3 already has a
   queue:
   - **Lloyd's Q2 design** — push demographic jaw topology
     proportions in `demographics.ts` (~50 LOC). Closes the 5 short
     cells from W2 + the four-corner test. Mixture-rule caveat per
     Lloyd: `tintin × demographic` will drift; regression guard via
     Pascal re-score of `tintin × 4 cells` alongside the timmFlat
     re-score.
   - **Lloyd's Q1 design** — cascade-merge hybrid manifest at slot
     6 + per-pack `declares: string[]` (~65 LOC). Subsumes Nick's
     primitive flag `recipe.suppressInteriorHairDetail` (two-line
     delete in the same commit).
   - **Long-hair primitive rebuild** — closes cells 6/7/11
     (~30-50 LOC in the field-tracer). This is THE acute trigger
     for the new graphics-domain role being scoped in parallel (see
     `tasks/david-team-rescope-graphics-specialist.md`); if David
     approves the hire, this work likely lands with the new role
     rather than Nick.
   - **Re-render full 16-cell grid + Pascal re-score** — closes the
     timmFlat pack at full depth.

3. **Order Bob's queue for W3.** Per Lloyd's W2 design-pass
   recommendation: Q2 first (smaller, no architectural risk, Pascal
   gets early signal), then Q1, then long-hair. Or sequence
   differently if you have a reason.

4. **BACKLOG curation.** Promote any W2 carry-overs; defer anything
   pushed; confirm the cascade-order architectural row stays open
   until the W3 manifest lands.

5. **Drop the "ship" jargon where you can.** Gary flagged it today
   as not-doing-useful-work. Use plainer English ("close" /
   "accept" / "lock-in" / "land") in SPRINT.md and the new W3 task
   files. Not a hard rule; light cleanup.

## Constraints

- W3 spawn order may shift depending on David's call on the new
  hire (running in parallel — `tasks/david-team-rescope-graphics-specialist.md`).
  If David approves the role, the long-hair primitive likely moves
  to the new role; if David doesn't approve, it stays Nick's.
  **Plan for both scenarios** — your W3 spawn order should be
  written so it works either way.
- ROADMAP scope-cut you already declared in W2 holds: the W4
  next-pack-spec slot stays slipped to W4. Q1 pack count target
  N≥4: default + tintin + ligneClaire + timmFlat = 4. timmFlat
  at full demographic depth closes in W3.
- Mixture rule holds. Anything you defer stays reachable in
  BACKLOG.

## Deliverable

- Updated `face-lib/SPRINT.md` — W2 → History (honest closure
  notes), W3 active with goal + ship gate + queue.
- Updated `face-lib/BACKLOG.md` — promotions/deferrals.
- 1-3 new task files in `face-lib/tasks/` for the W3 spawns.
- Updated `## Handoff` in this task file with W3 queue.
- Brief return note (<200 words) to Bob.

## Context

- `face-lib/AGENTS.md`, `face-lib/PROCESS.md`, `face-lib/ROADMAP.md`.
- `face-lib/SPRINT.md` — current state.
- `face-lib/BACKLOG.md` — current state with the cascade-order
  architectural row + the long-hair primitive row + the cells 6/7/11
  re-render row.
- `face-lib/research/pascal-w2-timmflat.md` (with Pass 2 appended)
  — Pascal's full reasoning.
- `face-lib/research/lloyd-cascade-architecture.md` — Lloyd's W3
  design pass. Sized + recommended order.
- `face-lib/tasks/nick-cascade-leak-fix.md` — Nick's PR #4 handoff.
- `face-lib/tasks/claudia-q1w2-replan-pascal-no-ship.md` — your
  prior W2 re-plan.

## Handoff

W2 closed (accept-with-known-gaps per Pascal Pass 2). W3 open with
the three engine rows Lloyd's design pass already sized.

### W2 → History

SPRINT.md rewritten. W2 archived under `## History` with honest
closure notes: 8/13 retained cells at Pascal ≥ 5; box 3 marked
`[~]` (partial accept) because the 5 short cells trace to one root
cause (demographic-topology gap) that Lloyd's W3 Q2 design already
owns. Other 4 W2 boxes are full `[x]`. Pascal Pass 2 + Nick PR #4
+ Lloyd design + Claudia re-plan all rolled into the Done-this-
sprint section.

### Q1-W3 goal

**Close the full 16-cell `timmFlat` grid at quality bar by landing
Lloyd's Q2 (demographic-topology) + Q1 (cascade-merge manifest)
designs + the long-hair primitive rebuild that owns cells 6/7/11.
End of W3 = pack #2 at full demographic depth.**

Five acceptance boxes (per SPRINT.md):
1. Q2 demographic-topology push (~50 LOC `demographics.ts`).
2. Q1 cascade-merge hybrid manifest (~65 LOC, subsumes Nick PR #4
   `suppressInteriorHairDetail` flag).
3. Long-hair primitive rebuild (~30-50 LOC field-tracer).
4. Full 16-cell re-render + Pascal re-score (strict 16/16 or
   accept-with-named-gap at 13/16 with single-root-cause filed).
5. `tintin × 4` regression re-score (mixture-rule guard per Lloyd
   Q2 caveat — same Pascal spawn as box 4).

### Spawn order for Bob

**Felix landed mid-plan.** David approved the graphics-domain hire
in parallel commit `9db6566` while this plan was being written —
the long-hair primitive's conditional owner is now resolved:
**Felix.** This is Felix's first spawn per AGENTS.md §Onboarding-
note. Wave structure adjusts: the long-hair row runs PARALLEL to
Nick Q2 (zero file overlap — field-tracer vs demographics.ts), not
serial after Q1.

Per Lloyd's W2 design-pass recommendation: **Q2 first, Q1 second.**
Long-hair runs alongside. Pascal closes W3.

**Wave 1 (parallel — two engineers, zero file overlap):**

1. **Nick** — `tasks/nick-q2-demographic-topology.md`. Lloyd Q2
   design. `demographics.ts` jaw proportion spread + two private
   fixtures (`elderMascPear`, `adultFemPointed`) + grid-script
   opt-in. Mixture-rule regression on `tintin × 4`. ~50 LOC.
   Lloyd reviews on completion.
2. **Felix — `tasks/felix-longhair-primitive-rebuild.md`. First
   spawn.** Field-tracer rebuild — closes cells 6/7/11. ~30-50 LOC.
   Felix owns the graphics-math interior decision (predicate vs
   knob); Lloyd reviews any architectural surface touched (e.g., a
   `recipe.strandMode` type addition); otherwise self-review.

**Wave 2 (sequential after Q2 lands):**

3. **Nick** — `tasks/nick-q1-cascade-merge-manifest.md`. Lloyd Q1
   design. `pack.declares` field + type union + slot 6 re-order +
   `timmFlat.declares` + delete Nick PR #4
   `suppressInteriorHairDetail` flag. ~65 LOC. Lloyd reviews
   (architectural surface change — Lloyd's lane per PROCESS.md
   decision-rights).

**Wave 3 (sequential after Wave 1 + Wave 2 land):**

4. **Pascal** — `tasks/pascal-w3-close-rescore.md`. Full 16-cell
   grid re-score against AGENTS.md anchor + 4-cell `tintin`
   regression check. Closes the sprint.

**Conditional / not queued:**
- **Lloyd code review** on Nick Q1 + Q2 PRs — Bob-triggered post-
  merge, not Claudia-queued. Felix only reviews Nick's PRs if they
  touch graphics-math interior (neither Q1 nor Q2 do).
- **Holly test-strategy doc** — slips to W4 unless W3 finishes
  tight.
- **Rollo** — W4 pack #5 spec.
- **Leo** — W4 if pack pick demands orbital-socket primitive
  (which is now in Felix's lane per AGENTS.md §Felix when it
  lands).
- **David** — monthly review naturally lands W3 close or W4 open.

### Note on the David-parallel scenario planning

The conditional language in the task brief assumed David's call
might land after Claudia's plan. David's pass-3 landed in commit
`9db6566` before Claudia's commit; long-hair owner is therefore
**Felix** unconditionally, and the task file
(`tasks/felix-longhair-primitive-rebuild.md`) is written Felix-
specifically with onboarding context. The Q1 envelope is unchanged
(per David's handoff). The only structural shift: long-hair runs
parallel to Q2 instead of serial after Q1, because Felix and Nick
work in zero-overlap files.

### BACKLOG curation

- **Promoted to W3 rows** (now active task files): long-hair
  primitive (was "filed W3 first row"), cells 6/7/11 re-render
  (now folded into the W3 Pascal close re-score), cascade-merge
  architectural implementation (now Nick Q1 task), demographic-
  topology silhouette divergence (now Nick Q2 task).
- **New deferred rows:** `pack.proportionScale` knob (Lloyd Q2
  §debt-left — lands only if W3 Q2 regresses tintin); late-pass
  for expression / character preset layers (Lloyd Q1 §debt-left
  — flag for W4 pack-spec).
- **Architectural calls (open) section trimmed:** cascade-order
  row stays open until Nick Q1 ships (then closes). Long-hair +
  demographic-topology rows marked MOVED-TO-W3 with task pointers.
- **Existing `pointed` / `pear` jaw-topology row updated** — Lloyd
  Q2 folds it in as private fixtures (partial close); a future
  `villain` / `character` / archetype public axis remains deferred.

### Jargon cleanup

Per Gary's flag today: "ship" doesn't do useful work. Light
cleanup, not a hard rule:

- SPRINT.md W3 sprint goal uses "land" / "close" / "accept" /
  "lock-in" rather than "ship". W2 history section retains "ship"
  in original phrasing where it was already historical (e.g.,
  "ship-gate" in W1 history) — not rewriting history.
- BACKLOG.md "ship floor" phrases in ROADMAP-derived sections
  retained (ROADMAP itself uses "ship", and David owns ROADMAP).
- New W3 task files (`nick-q2-demographic-topology`, `nick-q1-
  cascade-merge-manifest`, `felix-longhair-primitive-rebuild`,
  `pascal-w3-close-rescore`) use plainer English throughout.
- Pascal's `pascal-w3-close-rescore.md` calls the close verdicts
  "CLEAN-CLOSE / ACCEPT-WITH-NAMED-GAP / NEEDS-WORK" rather than
  "SHIP / NEEDS-WORK / NO-SHIP" — same semantics, plainer
  vocabulary.

### Artifacts updated

- **`face-lib/SPRINT.md`** — rewritten. W2 → History (8/13
  partial-accept close, box 3 `[~]`, other 4 `[x]`, full Done-
  this-sprint section preserved). W3 active section with goal,
  5-box acceptance, in-flight/blocked/done sections, Q1-W3 spawn
  order. ROADMAP scope-cut declaration carried forward (W4 next-
  pack-spec slot).
- **`face-lib/BACKLOG.md`** — promotions / deferrals / open-
  architectural-call updates per above.
- **`face-lib/tasks/nick-q2-demographic-topology.md`** — NEW. Q2
  implementation brief.
- **`face-lib/tasks/nick-q1-cascade-merge-manifest.md`** — NEW.
  Q1 implementation brief.
- **`face-lib/tasks/felix-longhair-primitive-rebuild.md`** — NEW.
  Felix's first-spawn brief; written for Felix-specifically after
  David's hire decision landed mid-plan.
- **`face-lib/tasks/pascal-w3-close-rescore.md`** — NEW. W3 close
  Pascal pass.
- **This task file** — Handoff section above.

### Escalations / what to surface to Gary

**Nothing requires Gary input.** Gary already approved closing W2
+ starting W3 (per task brief headline). The W3 plan is within Q1
envelope: 4 packs at floor still hit; W4 next-pack-spec slip
declared in W2 still holds; ROADMAP "depth > count" preserved.
David's parallel hire call is the only Gary-touching item — and
Gary's framing on that ("you definitely do need to clear that w
me and w david but i personally approve if he does") puts it in
David's hands.

### Risk callouts (non-blocking)

- **Q2 LOC overrun.** Lloyd sized at ~50 LOC. If Nick finds the
  tuning iteration needs more demographic spread than Lloyd
  anticipated AND the `pack.proportionScale` fallback fires, that's
  a Claudia re-scope call. Mitigation: Nick brief explicitly
  references Lloyd's fallback design, and tells Nick to surface
  rather than expand silently.
- **Q1 mixture-rule violation.** If `default` / `tintin` /
  `ligneClaire` aren't byte-identical post Q1, the late-pass is
  firing when it shouldn't. Mitigation: Nick brief calls out the
  regression sweep as load-bearing acceptance; Lloyd reviews.
- **Long-hair primitive scope creep.** If the predicate approach
  proves leaky AND the knob approach feels like it needs more
  surface area than `strandMode: 'on' | 'off'`, that's Claudia
  re-scope material. Mitigation: task brief explicitly tells the
  engineer to surface rather than expand.
- **Felix's first-spawn calibration.** Felix is new this sprint;
  the long-hair primitive rebuild is his first owned piece of
  work. Lloyd's W2 estimate (~30-50 LOC) may be off — AGENTS.md
  §Felix calls this out as exactly the kind of input-scale sizing
  Felix's lane exists to catch. Mitigation: Felix's brief
  explicitly tells him to surface honest sizing in his
  investigation writeup before writing code; Bob reviews; Claudia
  re-scopes if the rebuild turns out materially larger than ~80 LOC.
- **Pascal recalibration in W3 close.** If Pascal scores any ≥ 5
  cell that fires the sniff-tests, the audit branch is "drift
  detected" — Pascal proposes recalibration. Mitigation: Pascal's
  W3 brief carries the audit discipline; this is a Pascal-lane
  call, not a Claudia re-plan.
