# Sprint board

Current sprint state. Updated by Claudia (PM) at sprint open / close;
read by every agent on spawn.

When a sprint closes, contents move under ## History and the active
sections reset.

---

## Active sprint — Q1-W3 (open)

**Goal: close the full 16-cell `timmFlat` grid at quality bar by
landing Lloyd's Q2 (demographic-topology) + Q1 (cascade-merge
manifest) designs + the long-hair primitive rebuild that owns cells
6/7/11. End of W3 = pack #2 at full demographic depth, ROADMAP
"depth > count" satisfied.**

W2 closed at 8/13 cells ≥ Pascal 5 (the cascade-leak fix landed
clean on all 6 primary fix targets; 5 cells held at 4 are exactly
the demographic-topology gap Lloyd's Q2 design already owns). W3
closes the remaining work via three engine touches + a re-render +
Pascal re-score across the full 16-cell grid.

### Acceptance (what closes Q1-W3)

Five boxes:

- [ ] **Q2 — demographic-topology push lands.** Lloyd's design at
  `research/lloyd-cascade-architecture.md` §Q2. Edit `demographics.ts`
  jaw proportion spread (`bigonialWidth`/`mentalWidth`/`gonialAngle`/
  `jowl` across child/masculine/elder) + add two private fixtures
  (`elderMascPear`, `adultFemPointed`) folding Rollo's BACKLOG
  `pointed`/`pear` row in as private demographic-data only. ~50 LOC.
  **Mixture-rule guard:** `tintin × demographic` will drift (not
  byte-identical); Pascal re-scores 4 representative `tintin` cells
  alongside the timmFlat re-score. Fallback `pack.proportionScale`
  knob only if `tintin` slides.

- [ ] **Q1 — cascade-merge hybrid manifest lands.** Lloyd's design
  §Q1. Re-order STYLE to a NEW slot 6 (post-hairstyle, pre-expression)
  AND ship per-pack `declares: string[]` manifest. Default `[]` →
  byte-identical on `default`/`tintin`/`ligneClaire`. Type-system
  enforces engine-vs-style separation (demographic-only knob paths
  inadmissible). `timmFlat.declares` covers the contested set
  (leads / parting / lipFullness / lashes / lidLine / etc).
  **Subsumes Nick PR #4's `recipe.suppressInteriorHairDetail` flag —
  delete in the same commit.** ~65 LOC.

- [ ] **Long-hair primitive rebuild lands.** Closes cells 6/7/11
  (longSleek/longTail at Timm flat-shape register). Field-tracer
  no-ops when `clumpMode: 'flat'` AND no leads configured — or a
  `recipe.strandMode: 'off'` knob, whichever the implementer's
  design picks. Per mixture rule: default preserves current strand
  behavior. ~30-50 LOC in `src/render/field-tracer.ts`.
  **Owner conditional on David's call** — see §Spawn order. If
  David lands the new graphics-domain role, this row goes to the
  new role; otherwise Nick.

- [ ] **Full 16-cell re-render + Pascal re-score.** All 16 cells
  scored absolute against the AGENTS.md anchor. **Acceptance:
  Pascal ≥ 5 on 16/16 (strict)** OR Pascal ≥ 5 on 13/16 with the
  remaining gap traced to a single named root cause that's filed
  to BACKLOG for W4+. timmFlat at full demographic depth closes
  the original 16-cell spec.

- [ ] **`tintin × 4` regression re-score.** Lloyd's mixture-rule
  caveat: the Q2 demographic-data push WILL drift `tintin` (not
  byte-identical). Pascal re-scores 4 representative `tintin × demographic`
  cells alongside the timmFlat re-score. If `tintin` slides below
  its prior register, fall back to `pack.proportionScale` per Lloyd's
  Q2 §debt-left. Same Pascal spawn closes both this and box 4.

### What is explicitly NOT in W3 (deferred to W4 or later)

- **Next-pack-spec (pack #5 by Leo + Rollo)** — slid from W3 to W4
  per the ROADMAP scope-cut Claudia declared in W2. Q1 pack count:
  default + tintin + ligneClaire + timmFlat = 4 packs at ROADMAP
  N ≥ 4 floor. W4 = spec + implement pack #5 if budget allows,
  otherwise polish + first Holly sweep + Q1 closeout.
- **Holly test-strategy doc** — first Holly spawn (per AGENTS.md);
  slips to W4 if W3 stays tight. Not queued this sprint.
- **`pack.proportionScale` knob** — only lands if W3 Q2 regresses
  `tintin` (per Lloyd's design §debt-left). Mechanism deferred until
  the regression fires.
- **Late-pass for expression/character presets** — same manifest
  mechanism extends naturally; flag to Claudia for W4 pack-spec.
- **Per-feature line-weight multiplier**, **categorical `brows.shape`
  enum**, **orbital socket recess primitive**, **`mouth.philtralBow`
  knob**, **`expressions.ts` resuscitation** — all stay on BACKLOG.

## In flight

| Agent | Task | Status | Notes |
| ----- | ---- | ------ | ----- |
| (queue empty — Bob spawns Wave 1 once David's hire call lands or after a brief wait) | — | — | See §Spawn order below |

## Done this sprint (W3)

*(empty — sprint just opened)*

## Blocked / pending (W3)

| Agent  | Task | Blocked on |
| ------ | ---- | ---------- |
| Engineer (Nick or new role) | Long-hair primitive rebuild | David's graphics-specialist hire decision (`tasks/david-team-rescope-graphics-specialist.md`) — non-blocking, can start after Q2 + Q1 land regardless |
| Holly  | Test-strategy doc + first regression sweep | Slid to W4 unless W3 finishes tight |
| Pascal | W3 close re-score (16-cell timmFlat + 4-cell tintin) | All three engine rows landing + re-render |

## Q1-W3 spawn order (for Bob)

Per Lloyd's W2 design-pass recommendation: **Q2 first** (smaller, no
architectural risk, Pascal gets early signal), **Q1 second**
(architecture lands after the topology data is good), **long-hair
primitive third** (engine-primitive depth work, conditional owner per
David's hire call).

**Wave 1 (sequential — same engineer, same file region):**

1. **Engineer — `tasks/nick-q2-demographic-topology.md`** (NEW,
   drafted by Claudia). Implement Lloyd's Q2 design: jaw proportion
   spread in `demographics.ts` + two private fixtures
   (`elderMascPear`, `adultFemPointed`). Mixture-rule regression
   guard: tintin × 4 cells. ~50 LOC, half-day plus tuning.
   **Owner: Nick** unless David's hire decision lands first AND David
   assigns Q2 to the new role (unlikely — Lloyd's design called Q2
   data-layer work, not graphics-math; Nick remains the natural fit).

2. **Engineer — `tasks/nick-q1-cascade-merge-manifest.md`** (NEW,
   drafted by Claudia). Implement Lloyd's Q1 design: `pack.declares`
   field + allowed-path type union + second pack pass in
   `mergeParams` + `timmFlat.declares` + delete Nick PR #4's
   `suppressInteriorHairDetail` flag. ~65 LOC, half to one day.
   **Owner: Nick.** Architecture-shaped work but Lloyd's design is
   the architecture; Nick implements straight per the design. Lloyd
   reviews on completion.

**Wave 2 (parallelizable with Wave 1's tail — same engineer can carry,
or a different one can pick up if David's hire lands):**

3. **Engineer — `tasks/longhair-primitive-rebuild.md`** (NEW,
   drafted by Claudia). Field-tracer rebuild: no-op multi-strand
   layer when `clumpMode: 'flat'` AND no leads configured, OR add
   `recipe.strandMode: 'off'` knob (engineer's call per smallest-fix
   discipline). Closes cells 6/7/11. ~30-50 LOC in
   `src/render/field-tracer.ts`. **Owner: conditional on David.**
   - **If David approves the graphics-domain hire:** this row goes
     to the new role (the acute W3 trigger Bob cited in
     `tasks/david-team-rescope-graphics-specialist.md`). The task
     file is written role-agnostic; Bob hands the brief to whoever
     David scopes.
   - **If David declines or counter-proposes:** this row stays
     Nick's. Lloyd reviews on completion (primitive-surface change).

**Wave 3 (sequential after Wave 2 lands):**

4. **Pascal — `tasks/pascal-w3-close-rescore.md`** (NEW, drafted by
   Claudia). Re-score the full 16-cell timmFlat grid (all 16, not
   just the previously-deferred 6/7/11) against the AGENTS.md anchor
   table. Plus the 4-cell `tintin × demographic` regression check
   per Lloyd's mixture-rule caveat. Acceptance: Pascal ≥ 5 on 16/16
   (strict) OR 13/16 with a named single-root-cause filed for W4+.
   No re-litigation of calibration (audit closed Pass 1) or
   four-corner test (the demographic-topology gap is now the engine
   work being scored, not a separate gate).

**Conditional / not queued:**

5. **Lloyd code review** on Nick's Q1 + Q2 PRs. Bob-triggered post-
   merge, not Claudia-queued. Lloyd's design pass already named the
   exact regression checks each PR should pass; review is
   confirmatory.
6. **Holly** — test-strategy doc first spawn. Slips to W4 unless
   W3 finishes tight.
7. **Rollo** — next touch is W4 pack #5 spec (per ROADMAP scope-cut).
   No W3 queue.
8. **Leo** — no audits queued for W3. W4 pack #5 pick may demand
   an orbital-socket primitive Leo brief; deferred until pack pick.
9. **David** — monthly directional review naturally lands around
   W3 close or W4 open. Bob surfaces if the W3 trajectory shifts.

## History

### Q1-W2 (closed — accept-with-known-gaps per Pascal Pass 2; W3 closes the gap)

**Closure summary:** Pascal Pass 2 landed 8/13 retained cells at
≥ 5 (cells 1, 2, 3, 4, 5, 8, 9, 10), with 5 cells held at 4
(cells 12, 13, 14, 15, 16). All 5 short cells trace to a single
root cause: the demographic-topology gap (child-round / elder-
jowled / adult-square don't diverge at silhouette). That gap is
already owned by Lloyd's W3 Q2 design (~50 LOC in
`demographics.ts`). Gary's call after the close report: accept
Pascal's ship-with-known-gaps recommendation, close W2, open W3.

**Goal (revised post Pascal NO-SHIP): land `timmFlat` at quality
bar across a 13-cell demographic grid, with the cascade-leak
primitive fix that unblocks the bob/pomp register and a Lloyd
architectural-design pass on the cascade-merge vs demographic-data
fix path.**

Pascal originally scored 3/16 cells at ≥ 5 on the original 16-cell
grid and called NO-SHIP at the W2 gate. Three failure clusters:
cascade-leak (6 cells — bob/pomp), engine-ceiling long-hair (3
cells — longSleek/longTail), demographic-topology gap (4 cells +
four-corner fail). Claudia's W2 re-plan: land 13 cells (drop 6/7/11),
land the cascade-leak fix + Lloyd architectural design, slide the
long-hair primitive and the cascade-merge implementation to W3.

**Cells dropped from W2 grid (preserved as W3 promotion targets):**

- Cell 6: adult-fem-oval × longSleek
- Cell 7: adult-fem-oval × longTail
- Cell 11: teen-fem-ovalsoft × longSleek dark

Pascal scored these 2/2/2 — primitive-level long-hair field-tracer
fights Timm canon ("long hair = one flat shape") at the engine-
primitive level. W3 closes them via the long-hair primitive rebuild
row.

**Revised acceptance (what closed Q1-W2):**

- [x] **Eye plumbing landed.** (PR #1.) Unchanged from prior gate.
- [x] **`hullMode` knob landed.** (PR #2.) Unchanged from prior gate.
- [~] **`timmFlat` pack lands + renders at quality on the revised
  13-cell grid.** **Partial accept:** Pascal Pass 2 landed 8/13 cells
  at ≥ 5 (cells 1, 2, 3, 4, 5, 8, 9, 10). Cells 12, 13, 14, 15, 16
  held at Pascal 4 — all 5 trace to the demographic-topology gap,
  owned by W3 Q2 design row. Cells 6, 7, 11 deferred to W3 long-hair
  primitive row. Pack DATA landed (PR #3). Cascade-leak fix (PR #4)
  landed clean on all 6 primary fix targets. **Box closes partial
  on the explicit understanding that W3 finishes the full 16-cell
  grid.**
- [x] **Pascal calibration audit — calibration holds.** Filed at
  `research/pascal-w2-timmflat.md` §Calibration. The Job 1 verdict
  (NO-SHIP at original 16-cell gate) triggered the re-plan; the
  Job 2 verdict (calibration holds) is the W1-deferred outcome.
- [x] **Lloyd architectural design pass landed** —
  `research/lloyd-cascade-architecture.md`. Q1 cascade-merge hybrid
  manifest at slot 6 + per-pack `declares` (~65 LOC W3). Q2
  demographic-topology demographic-preset-data push (~50 LOC W3).
  Recommended order: Q2 first, Q1 second. Both within Lloyd TL
  authority — no Gary escalation.

**Done this sprint (W2):**

- **Pascal W2 Pass 2 re-score** — `research/pascal-w2-timmflat.md`
  §Pass 2 + `tasks/pascal-w2-revised-rescore.md`. 8/13 cells ≥ 5;
  all 6 primary cascade-leak fix targets confirmed clean; 5 short
  cells all the demographic-topology gap (Lloyd Q2 owns). No
  calibration drift, no mixture-rule alarm. Recommendation:
  accept-with-known-gaps; W3 Q2 closes the full grid. Pascal's
  diagnosis confirmation: Pass 1 cascade-leak symptom framing was
  correct; mechanism guess (recipe.leads survival) was upstream of
  the true root cause (unconditional clump-stroke + sweep-stroke +
  cap-tone blocks in `scaffold.ts`).

- **Nick PR #4 — cascade-leak fix** — `tasks/nick-cascade-leak-fix.md`.
  Two commits on vector-draw: `8a9b5f0` WIP checkpoint, `f0c1a5e`
  final handoff + 13-cell grid re-render. Nick chose **Option C
  primitive-flag promotion**: `recipe.suppressInteriorHairDetail`
  (params.ts type field + scaffold.ts 4 gates + styles.ts pack-
  level setting). Lloyd's W3 manifest design subsumes the flag
  (two-line delete in W3 commit that lands the manifest). Nick's
  honest pre-Pascal read: six primary fix targets (4, 5, 8, 10,
  13, 16) all read clean at the bang line. 50/50 byte-identical
  regression on existing packs.

- **Lloyd cascade-architecture design pass** —
  `research/lloyd-cascade-architecture.md` (commit `74792f5`).
  Q1 (cascade-merge): hybrid manifest at NEW slot 6 + per-pack
  `declares: string[]` (~65 LOC W3). Q2 (topology gap):
  demographic-preset-data layer fix (~50 LOC W3). Recommended W3
  order to Claudia: Q2 first, Q1 second; mechanically independent.
  Mixture-rule caveat for Q2 on `tintin` (regression guard via
  Pascal re-score of 4 tintin cells). Subsumes Nick PR #4's
  primitive-flag fallback (delete in W3).

- **Claudia W2 re-plan** — `tasks/claudia-q1w2-replan-pascal-no-ship.md`.
  Re-planned W2 post Pascal's NO-SHIP. Decision: land 13-cell
  timmFlat in W2 (drop 6/7/11), land cascade-leak fix + Lloyd
  architectural design pass; slide long-hair primitive + cascade-
  merge implementation + demographic-preset topology push to W3;
  explicit ROADMAP scope-cut on W3's next-pack-spec slot (slides
  to W4).

- **Pascal W2 close pass** — `research/pascal-w2-timmflat.md`. Two
  jobs in one file. Job 1: **3/16 cells at Pascal ≥ 5 — NO-SHIP at
  the original 16-cell W2 gate.** Job 2: **calibration holds.**
  Four-corner test FAILED on Pascal's read. Three failure clusters:
  cascade-leak (6), long-hair primitive ceiling (3), demographic-
  topology gap (4 + four-corner). Calibration audit: sniff-tests
  are register-sensitive, not absolute. Escalation flag filed for
  Gary's awareness (no pause): pack-as-declarative-truth vs pack-as-
  overrides at render time. Lloyd's W3 manifest design landed that
  call.

- **Nick PR #3** — `tasks/nick-timmflat-pack.md`. `timmFlat` pack
  lands in `src/presets/styles.ts` (+62 LOC); grid script at
  `scripts/timmflat-grid.ts`; full 16-cell sheet rendered at
  `/tmp/timmflat-out/`. Cascade-order spec-drift surprise filed
  for architectural fix (now Lloyd W2 design pass). PR #3 committed
  across `4c1caee` (pack data, parallel-edit collision into Lloyd-
  Pass-3 commit) + `236fd8a` (grid script + handoff).

- **Lloyd Pass 3** — code review of Nick PR #2. Verdicts:
  LOC overrun APPROVED-AS-IS, decision-1 default split APPROVED-
  AS-IS, ALPHA_FACTOR=1.5 APPROVED-AS-IS for v1, dead-code at
  `hull.ts:71-86` NEEDS-CHANGES → surgical 11-line drop landed
  inline by Bob as `dda5d0b`.

- **Nick PR #2** — `tasks/nick-alpha-shape-hullmode.md`. Alpha-shape
  + `hullMode` knob landed. 30/30 byte-identical; longCurtain
  wimple + coilyHalo hexagon eliminated.

- **Nick PR #1** — `tasks/nick-eye-plumbing-and-hull-cleanups.md`.
  Three commits: eye plumbing + centreU keying + debug attr drop.
  Catalog dots-mode 30/30 byte-identical; flat-mode 26/30 byte-
  identical post-centreU. Demographic-preset lidLine-on-default/
  ligneClaire side-effect filed for Pascal/Holly to flag if anything
  reads off.

**ROADMAP scope-cut declaration (held):** The W3 next-pack-spec
slot stays slid to W4. Q1 pack count: default + tintin + ligneClaire
+ timmFlat = 4 packs at the ROADMAP N ≥ 4 floor. W3 close = pack #2
at full demographic depth. W4 = spec + implement pack #5 if budget
allows, otherwise polish + first Holly sweep + Q1 closeout. The
ROADMAP rule (demographic depth > pack count) is preserved.

**W2 → W3 carry-overs:**

- Long-hair primitive rebuild (cells 6/7/11). **W3 row.**
- Cascade-merge hybrid manifest implementation per Lloyd Q1 design.
  **W3 row.**
- Demographic-preset topology push per Lloyd Q2 design. **W3 row.**
- Re-render of full 16-cell grid + Pascal re-score. **W3 closeout.**
- Tintin × 4-cell regression re-score (mixture-rule guard). **W3 closeout.**

### Q1-W1 (closed — all four ship-gate boxes met)

**Goal: lay the two rails Q1 runs on.**

1. **Rail A — engine:** 3D clump-volume refactor lands behind a flag
   (`clumpMode: 'flat' | 'volume'`, default `'flat'`) without
   regressing any of the 13 existing hairstyles. Volume mode
   exercised on Lloyd's three test fixtures.
2. **Rail B — style:** one new style pack target chosen and SPEC'd
   (not implemented). The spec is what Nick consumes in Q1-W2.

**Side rail:** Leo audit on eye/mouth/brow integration under the
current `tintin` pack — to know whether W2 pack #2 implementation
needs primitive fixes before it can hit Pascal ≥ 5.

**Closed:**

- **Box 1 + Box 2 (Nick 3D clump-volume refactor, 7 commits ending
  `909244c`).** All 13 existing hairstyles bit-for-bit identical in
  flat mode (stricter than Lloyd's visually-equivalent §5 promise).
  Volume mode renders cleanly for the three fixtures (`shortBob`
  byte-identical, `longCurtain` gravity, `coilyHalo` radial). Net
  +444 LOC engine + 148 fixtures. Convex-hull artefact more
  dramatic than Lloyd §7 predicted; Lloyd review pulled alpha-shape
  into W2 instead of "deferred until adoption."
- **Box 3 (Leo + Rollo joint timmFlat spec at
  `research/stylepack-timmFlat-spec.md`).** Pedagogy half (Leo) +
  asset half (Rollo) both signed. Implementable in W2 without any
  BACKLOG primitive promotion.
- **Box 4 (Leo face-integration audit at
  `research/leo-face-integration-audit.md`).** Eyes = STOP, small
  (~25 LOC eye-primitive plumbing prereq before timmFlat impl).
  Brows / Mouth / Integration = GO-WITH-CAVEATS for W2.
  Cross-cutting: features-as-decals integration debt is real;
  timmFlat dodges it because Timm canon literally IS decals; pack
  3+ will hit it hard and need a socket-recess primitive pass.
  Six BACKLOG candidates flagged.
- **Lloyd pass 2 review.** Four verdicts: tangent-decay APPROVED-
  WITH-EDITS (next-PR); `hullGroup` keying APPROVED-WITH-EDITS
  (one-line at `scaffold.ts:1414`); `data-hull-group` debug attr
  NEEDS-CHANGES (drop); alpha-shape deferral NEEDS-CHANGES (pull
  into W2). Plus dead-code flag at `hull.ts:71-86`.

**Carry-overs into W2:**
- Eye primitive plumbing (Leo STOP).
- `hullMode` alpha-shape + Lloyd items 2 & 3 bundle.
- timmFlat implementation against the W1 spec.
- Pascal calibration audit (deferred from W1, no output to score).

**Deferred / filed to BACKLOG (W1 close):**
- Tangent-decay parameter exposure (Lloyd item 1 next-PR).
- Six Leo BACKLOG candidates triaged (eye plumbing PROMOTED to W2;
  the other five DEFERRED to W3+ or later — see BACKLOG.md).
- `hull.ts:71-86` dead-code cleanup (low priority refactor row).
- `pointed` / `pear` jaw topology dispatch through demographic
  presets (Rollo adjacent-gap #1 — filed as backlog row).
- Per-feature line-weight multiplier (filed as backlog row).
- Categorical `brows.shape` enum (filed as backlog row).

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
