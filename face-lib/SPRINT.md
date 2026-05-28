# Sprint board

Current sprint state. Updated by Claudia (PM) at sprint open / close;
read by every agent on spawn.

When a sprint closes, contents move under ## History and the active
sections reset.

---

## Active sprint — Q1-W1

**Goal: lay the two rails Q1 runs on.**

1. **Rail A — engine:** 3D clump-volume refactor lands behind a flag
   (`clumpMode: 'flat' | 'volume'`, default `'flat'`) without regressing
   any of the 13 existing hairstyles. Volume mode is exercised on at
   least Lloyd's three test fixtures, not yet wired into a shipped
   hairstyle.
2. **Rail B — style:** one new style pack target chosen and SPEC'd
   (not implemented). The spec is what Nick consumes in Q1-W2.

This is W1 of probably 3-5 sprints inside Q1. Q1 ships iff **N ≥ 4
style packs land at quality bar with demographic depth** (per ROADMAP
/ David pass-1 edit #1). The refactor is necessary-not-sufficient;
shipping a clean refactor without a new pack is not a Q1 win, so we
start the pack pipeline THIS week even though no pack lands this week.

Side rail: a Leo audit on **eye/mouth/brow integration** under the
current `tintin` pack — Pascal's standing finding is that features
read as "stacked on a face frame, not one drawn thing." We need to
know whether W2's pack #2 implementation needs primitive fixes before
it can hit Pascal ≥ 5. Better to find out now than mid-W2.

### Ship gate (what closes Q1-W1)

All four of these must be true:

- [ ] `clumpMode: 'flat'` is the default and renders all 13 existing
  hairstyles visually equivalent to pre-refactor (per Lloyd pass-1 §5).
  Lloyd has reviewed the PR.
- [ ] `clumpMode: 'volume'` produces a clean render of Lloyd's three
  test cases (`shortBob` flat regression guard, `longCurtain` volume,
  `coilyHalo` radial). Test fixtures committed.
- [ ] One style-pack spec md exists in `face-lib/research/` —
  authored jointly by Leo (pedagogy: what makes this pack a real art
  tradition with cited sources) and Rollo (asset judgment: NPC slots
  it fills, demographic axis it must cross, mixture-rule preservation
  of existing packs). Pack chosen from Gary's candidate list.
- [ ] Leo's integration audit md exists, identifying whether
  eye/mouth/brow primitives need work before W2 pack implementation,
  or whether the current primitives can carry pack #2 as-is. Either
  answer is acceptable; the unknown is the blocker.

What is explicitly NOT in W1's gate:

- New style pack IMPLEMENTATION (W2).
- Pascal calibration audit (deferred to first close where Pascal has
  substantive new output to score — likely Q1-W2 close).
- Holly regression sweep + test-strategy doc (sprint-close only when
  there is something meaningful to regress; W1's `flat`-mode promise
  IS the regression test for this week. Holly runs after W2 lands a
  new pack and the volume mode has cooked in a real hairstyle).
- Forelock / fringeBand / highlightCutout primitives (BACKLOG; promote
  only when a style-pack spec REQUIRES them — Leo+Rollo's W1 pass may
  flag this).
- `longSleek` vs `longFlowing` redundancy bug (BACKLOG; not a
  ship-blocker for W1).

## In flight

| Agent  | Task | Status | Notes |
| ------ | ---- | ------ | ----- |
| Lloyd  | `lloyd-pass-2-review.md` — code review of Nick's 3D implementation | RUNNING | Bob-triggered post Nick PR. Four concerns to verdict. Last in-flight task before Claudia re-spawns. |

**Done this sprint (W1):**
- Leo W1 stylepack pedagogy half (timmFlat picked + spec'd) — closes half of box 3.
- Rollo W1 stylepack asset half (NPC slots + demographic grid + mixture check) — closes box 3 fully.
- **Nick 3D clump-volume refactor (7 commits ending 909244c) — closes boxes 1+2.** All 13 existing styles bit-for-bit identical in flat mode. Volume mode renders three fixtures (`shortBob` byte-identical, `longCurtain` gravity, `coilyHalo` radial). Net +444 LOC engine + 148 fixtures. Convex-hull artefact more dramatic than Lloyd §7 predicted — Bob raising with Lloyd review whether alpha-shape moves earlier than "deferred until adoption."
- **Leo face-integration audit (`research/leo-face-integration-audit.md`) — closes box 4.** Eyes = STOP, small (~25 LOC eye-primitive plumbing prereq before timmFlat impl — `buildEye` almond branch silently drops `lidLine`/`lashes`/`underlineHint`). Brows / Mouth / Integration = GO-WITH-CAVEATS for W2. Cross-cutting: Pascal's "features-as-decals" complaint is structurally real (no orbital socket, no brow ridge plane, no mouth-on-mandible attachment); timmFlat dodges it because Timm canon literally IS decals — pack 3+ (Caniff/manga/realistic) will hit it hard and need a socket-recess primitive pass. Six BACKLOG candidates flagged. Probe sheet at `/tmp/leo-probe-styles/`.

**All four W1 ship-gate boxes now closed.** Claudia re-spawns after Lloyd's review returns (his verdicts may affect W2 scope, e.g., alpha-shape timing).

## Blocked / pending

| Agent  | Task | Blocked on |
| ------ | ---- | ---------- |
| Lloyd  | Code review of Nick's 3D PR | Nick's implementation landing |
| Holly  | Test strategy doc + first regression sweep | Q1-W2 close (after a pack actually lands) |
| Pascal | Quality / calibration audit | Q1-W2 close (no substantive new output yet this week) |
| Nick   | Implement W2 style pack | Leo+Rollo spec + Leo integration audit landing, then Claudia W2 brief |
| Claudia | Q1-W2 planning | This sprint closing |

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
- Collab artifacts created: SPRINT / BACKLOG / tasks/.
- ROADMAP + PROCESS docs created.
- Nine-role crew formalized (added David CEO, Claudia PM, Holly QA).
- David pass 1 + pass 2 (roadmap audit + scope revision).
- Mixture-not-survival rule encoded.
- Forest registry initialized.

## History

(sprints archived here when they close — none yet under the new
roadmap/process framework)
