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

(Claudia fills in on completion.)
