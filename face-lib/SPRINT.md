# Sprint board

Current sprint state. Updated by Claudia (PM) at sprint open / close;
read by every agent on spawn.

When a sprint closes, contents move under ## History and the active
sections reset.

---

## Active sprint goal

**Q1-W1 — Hair primitive lands in 3D + 1 new style pack to quality bar.**

Aligned with ROADMAP Q1 ("faces, really really good — 4-10 style packs
at quality bar"). This sprint is the bridge between the architectural
work that just landed (recipe primitive, lead/fill rename, bob-cap fix)
and the style-pack-variety push that fills the rest of Q1.

Two parallel tracks:

- **Track A — engine:** Nick implements the 3D clump-volume refactor per
  Lloyd pass 1 (Tech Lead approved). Lloyd reviews on completion. Holly
  spawns at the end of the sprint for a regression sweep.
- **Track B — style:** Rollo + Leo propose ONE new style pack target
  (research pass; not implementation). Picked from the user's
  candidates: Disney/Pixar feature, manga (shoujo or shounen), Caniff/
  Toth ink comics, Bruce Timm flat shape, Studio Ghibli, Schulz/Peanuts.
  Output is a style-pack-spec md that Nick can implement in Q1-W2.

## In flight

| Agent  | Task | Status | Notes |
| ------ | ---- | ------ | ----- |
| David  | Pass 2 — validate Bob's proposed Q3/Q4 scope revision | RUNNING | Per Gary's "you decide but David in loop." Bob decides; David surfaces concerns. |

## Blocked / pending

| Agent  | Task | Blocked on |
| ------ | ---- | ---------- |
| Bob    | Land David's 6 ROADMAP edits | Gary's answers on the 4 escalated questions (some edits depend on #1) |
| Claudia | First sprint plan against revised ROADMAP | Gary's answers + Bob's edits |
| Nick   | Implement 3D clump-volume primitive | Claudia (will it be IN-Q1 or parallel-infra? Gary's call) |
| Leo + Rollo | Style-pack candidate selection + spec | Claudia |
| Lloyd  | Code review of Nick's 3D implementation | Nick's PR |
| Holly  | Test strategy doc + regression sweep | Sprint close |
| Pascal | Quality score on post-3D-refactor renders | After Nick + Holly |

## Done previous sprints

### Sprint pre-Q1 (the long session that built the foundation)

- Leo passes 3, 4, 5, 6, 7, 8 — pedagogy + audits.
- Lloyd pass 1 — 3D clump-volume architecture (TL approved).
- Rollo pass 1 — catalog review.
- Hair-theorist pass — physics doc.
- Nick tuning pass 1 — three bug fixes (shortPomp topknot, bob scar,
  longTail merge).
- Nick pass 2 — bob HIGH regression fixed; lead/fill rename with
  deprecation alias.
- Recipe primitive (`HairstyleRecipe` + 11 hairstyle files).
- Six-role crew formalized in AGENTS.md.
- Collab artifacts created: SPRINT / BACKLOG / tasks/.
- ROADMAP + PROCESS docs created.
- Nine-role crew (added David CEO, Claudia PM, Holly QA).
- Mixture-not-survival rule encoded as durable principle.
- Forest registry initialized in BACKLOG (filed aesthetics).

## History

(sprints archived here when they close — none yet under the new
roadmap/process framework)
