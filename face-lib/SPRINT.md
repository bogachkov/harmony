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
| Lloyd  | 3D clump-volume refactor architecture | RUNNING | Per Leo pass 8 §1 — design before Nick implements |

## Blocked / pending

| Agent  | Task | Blocked on |
| ------ | ---- | ---------- |
| Nick   | Implement 3D clump-volume primitive | Lloyd's architecture |

## Done this sprint

- Nick pass 2 — Bob-cap regression fix + lead/fill rename. `tasks/nick-pass-2.md`.
  Ship 1: widened `drawCap` at `scaffold.ts:972` so short/medium smooth/flicked/
  crowSnipped styles draw the cap polygon. Fixes bobChinLength, shortSwept,
  shortPompadour, shortReceding (all verified rendering with visible mass).
  Ship 2: `HairstyleRecipe.flowStrokes` → `leads`; `Lead` type (née `FlowStroke`)
  gains optional `flowWeight`; `fillBias` plumbed to recipe (behaviour OFF pending
  Lloyd). All hairstyle files + demographics.ts updated. Pixel-equivalent renders
  confirmed.
- Lloyd pass 1 — 3D clump-volume refactor architecture.
  `research/lloyd-pass-1.md` (198 lines). Types: `ClumpSpec` +
  `ClumpTrace`; `Curve` gains `radiusProfile` / `hullGroup` /
  `kind:'clump-volume'`; `HairstyleRecipe` gains
  `clumpMode:'flat'|'volume'` (default 'flat'). Refactor seam:
  `clumpStroke(field, ClumpSpec): ClumpTrace` — one function, one
  return type. New file `src/render/hull.ts` (~150 LOC).
  Two divergences from Leo (§0). Net +150 LOC (not Leo's +118 —
  `flat` mode keeps cap polygon alive). Three test cases for Nick.
  One tech-debt warning (convex hull collapses concavities).
  Awaiting Tech Lead review before Nick spawns to implement.
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
- Leo pass 8 — 3D abstraction + lead/fill + bob diagnosis audit.
  Decisions: 3D clump-volume abstraction (~+200 net LOC, refactor
  seam at `clumpStroke()`); lead/fill IS the right two-layer model
  and is already half-built (`flowStrokes` are leads, clump centres
  are fill — needs rename + coupling, ~50 LOC, mixture-safe);
  bob-regression is a 3-line widen of `drawCap` condition at
  `scaffold.ts:972`. Full audit in `research/hair-tooling.md` §11.

## History

(previous sprints archived here when this one closes)
