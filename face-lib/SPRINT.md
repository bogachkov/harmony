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

(nothing — sprint just opened)

## Blocked / pending

| Agent  | Task | Blocked on |
| ------ | ---- | ---------- |
| Nick   | Implement 3D clump-volume primitive per Lloyd pass 1 | Awaiting spawn (Claudia first on the queue this sprint) |
| Leo + Rollo | Style-pack candidate selection + spec | Awaiting spawn (Claudia second on the queue) |
| Lloyd  | Code review of Nick's 3D implementation | Nick's PR |
| Holly  | First-ever Holly spawn — test strategy doc + regression sweep | After Nick's 3D refactor lands |
| Pascal | Quality score on post-3D-refactor render set | After Nick + Holly |

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
