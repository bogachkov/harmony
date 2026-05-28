# Sprint board

The current sprint. Updated by the Tech Lead each commit. Subagents read
this on spawn to know what's in flight.

When this sprint ends, archive the contents under `## History` at the
bottom and reset the active sections.

---

## Active sprint goal

**Move hair from "2D-on-cranium-surface with hacks" → "3D-aware primitive
with lead/fill composition."**

Subsumes:
- Pascal's cap-cluster oscillation (4/10 lateral × 3 rounds).
- The masc swept-volume reference (user's "guy w great hair" image).
- The user's "hair in 3D space" architectural note.
- The user's lead/fill two-layer mental model (lead strokes define soul +
  fill follows the flow).

Sprint unit per the user: ≈ 1 week of human work ≈ 1-2 hours of LLM-team
work with appropriate parallelism.

## In flight

| Agent  | Task | Status | Notes |
| ------ | ---- | ------ | ----- |
| Leo    | Pass 7 cap-cluster oscillation audit | RUNNING | Will be extended on return with 3D-abstraction + lead/fill questions rather than spawning a fresh audit. |

## Blocked / pending

| Agent  | Task | Blocked on |
| ------ | ---- | ---------- |
| Lloyd  | Architecture review of 3D hair refactor | Leo's 3D-abstraction answer |
| Nick   | Implement 3D-aware hair primitive | Lloyd's design |

## Done this sprint

- Tech Lead — formalized six-role crew in `AGENTS.md`. Tech Lead +
  Leo + Pascal + Rollo + Nick + Lloyd.
- Nick v1 — `verticalLift` recipe parameter + `shortPomp` preset. Cap
  fill enabled for lifted zone. Bezier math fixed. (Known regression:
  centerline convergence too tight; queued for Nick.)
- Rollo pass 1 — catalog review. `research/rollo-pass-1.md`. Flagged
  two bugs (bobChinLength center-parting trails into forehead;
  longTail falls merge with face outline at print scale). Flagged two
  largest gaps: tight-coily / TWA entry, short-disheveled entry.
- Nick tuning pass 1 — three bug fixes shipped (commits 0e2e0ab,
  872aa45, 9173655). shortPomp topknot fixed; bobChinLength forehead
  scar fixed; longTail face-merge fixed. `tasks/nick-tuning-pass-1.md`.

## History

(previous sprints archived here when this one closes)
