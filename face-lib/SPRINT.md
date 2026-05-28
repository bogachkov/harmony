# Sprint board

Current sprint state. Updated by Claudia (PM) at sprint open / close;
read by every agent on spawn.

When a sprint closes, contents move under ## History and the active
sections reset.

---

## Active sprint — Q1-W2 (extended, re-planned post-Pascal NO-SHIP)

**Goal (revised): land `timmFlat` at quality bar across a 13-cell
demographic grid, with the cascade-leak primitive fix that unblocks
the bob/pomp register and a Lloyd architectural-design pass on the
cascade-merge vs demographic-data fix path.**

Pascal scored 3/16 cells at ≥ 5 on the original 16-cell grid and
called NO-SHIP at the W2 gate. Three failure clusters: cascade-leak
(6 cells — bob/pomp), engine-ceiling long-hair (3 cells —
longSleek/longTail), demographic-topology gap (4 cells + four-corner
fail). Pascal's recommendation: all three concurrent moves. Claudia's
W2 re-plan: **ship 13 cells (drop 6/7/11), land the cascade-leak fix
+ Lloyd architectural design, slip the long-hair primitive and the
cascade-merge implementation to W3.**

Why option B sharpened over A / C / D:

- **A (all three in W2)** — runs W2 long by 2-3 more days on top of
  the 1.5 already consumed. Q1 has four weeks. Burning a full extra
  week on one pack hurts demographic-depth across packs (ROADMAP
  scope-cut: pack count would slip from 4 to 3).
- **C (3-cell ship)** — ROADMAP "demographic depth > pack count"
  reads against. Hard to defend Gary-facing.
- **D (defer pack to W3, architectural foundation in W2)** —
  reasonable but loses momentum. timmFlat IS landing where it gets
  the chance (Pascal: cells 1/2/3 are register-correct). Burning W2
  on architecture-with-no-render-gate risks the architecture going
  unconstrained. The cascade-leak fix in (B) is itself a small
  architectural foundation step: it forces us to discover whether
  the simple override-const extension holds OR whether we need a
  `recipe.suppressLeads: true` primitive promotion — which is Lloyd
  cascade-merge surface area, exposed cheaply.
- **B sharpened** — ships timmFlat × 13 cells at quality this week;
  Lloyd's architectural design lands as a *written design* (not
  implementation) covering both the cascade-merge question AND the
  demographic-topology layer-of-fix question; long-hair primitive
  + cascade-merge implementation + demographic-preset push go to W3.

**Cells dropped from W2 ship grid (explicitly NOT silently — preserved
in the original 16-cell spec as W3 promotion targets):**

- Cell 6: adult-fem-oval × longSleek
- Cell 7: adult-fem-oval × longTail
- Cell 11: teen-fem-ovalsoft × longSleek dark

Pascal scored these 2/2/2 — primitive-level long-hair field-tracer
fights Timm canon. Pack pedagogy can't reach them without a
primitive-level toggle. **Honest framing for Gary if he asks:
timmFlat ships in 13 demographic cells; long-hair Timm register
needs a W3 engine-primitive promotion to reach Wonder Woman / Catwoman
silhouettes. The pack is not the bug; the long-hair primitive is.**

### Revised ship gate (what closes Q1-W2)

Five boxes (the original four plus the cascade-leak fix; long-hair
slides to W3 explicitly; architectural design lands as deliverable
not implementation):

- [x] **Eye plumbing landed.** (PR #1.) Unchanged from prior gate.
- [x] **`hullMode` knob landed.** (PR #2.) Unchanged from prior gate.
- [~] **`timmFlat` pack lands + renders at quality on the revised
  13-cell grid.** Pack DATA landed (PR #3). Cascade-leak fix (Nick
  re-spawn PR #4) needs to land before re-render. **Acceptance:
  Pascal ≥ 5 on cells 1, 2, 3, 4, 5, 8, 9, 10, 12, 13, 14, 15, 16
  (the 13 retained). Cells 6, 7, 11 deferred to W3 — not scored
  this round.**
- [x] **Pascal calibration audit — calibration holds.** Unchanged.
  Filed at `research/pascal-w2-timmflat.md` §Calibration. The
  Job 1 verdict (NO-SHIP at original 16-cell gate) is what
  triggered this re-plan; the Job 2 verdict (calibration holds)
  is the W1-deferred outcome.
- [x] **Lloyd architectural design pass landed** —
  `research/lloyd-cascade-architecture.md` (178 lines, slight cap
  overrun on two distinct architectural surfaces; defensible).
  **Q1 cascade-merge — hybrid manifest design.** Re-order STYLE
  from cascade slot 2 to a NEW slot 6 (post-hairstyle,
  pre-expression) AND ship per-pack `declares: string[]` manifest
  naming the contested knob paths. Pack applies TWICE — substrate
  pass unchanged at slot 2, declarative pass at slot 6 writes ONLY
  manifest paths. Default `[]` → no-op late pass →
  `default`/`tintin`/`ligneClaire` stay byte-identical. Type-system
  enforces manifest paths can't include demographic-only knobs
  (engine-vs-style separation at compile time). ~65 LOC for Nick W3.
  **Q2 demographic-topology — demographic-preset-data layer fix.**
  Topology dispatcher is fine; leak is in `demographics.ts` data
  spread. Push `bigonialWidth`/`mentalWidth`/`gonialAngle`/`jowl`
  apart across child/masculine/elder. Fold Rollo BACKLOG
  `pointed`/`pear` row in as private fixtures (`elderMascPear`,
  `adultFemPointed`), NOT public enum additions. ~50 LOC. **Lloyd
  recommends to Claudia: Q2 first (smaller, no architectural risk,
  Pascal early signal), Q1 second; mechanically independent.**
  Mixture-rule caveat: `tintin × demographic` WILL drift on Q2 —
  not byte-identical; regression guard via Pascal re-score of
  `tintin × 4` cells alongside the timmFlat re-score. Fallback:
  `pack.proportionScale: number` if `tintin` slides. **Nick PR #4
  interaction:** Lloyd observed Nick chose Option C primitive-flag
  fallback (`recipe.suppressInteriorHairDetail`); manifest design
  subsumes it; delete in same W3 commit that lands the manifest.

What is explicitly NOT in W2's revised gate (slid to W3):

- **Long-hair primitive promotion** (`recipe.strandMode: 'off'` OR
  field-tracer-no-ops-when-flat). Cells 6, 7, 11 in the original
  grid. ~30-50 LOC in field-tracer + Lloyd touch. **W3 first row.**
- **Cascade-merge architectural implementation** (Nick implements
  per Lloyd's design). Whatever scope Lloyd's design lands at.
  **W3 second row.**
- **Demographic-preset push for topology** (cells 9, 12, 14, 15 +
  four-corner). If Lloyd's design routes it to the demographic-
  preset-data layer, Nick implements deltas in `demographics.ts`.
  **W3 third row.**
- **Re-render of the full 16-cell grid + Pascal re-score for cells
  6, 7, 11, 9, 12, 14, 15.** Closes the original 16-cell spec.
  **W3 closeout, after the three W3 rows land.**

What is explicitly NOT in W2's gate (already deferred, unchanged):

- Holly regression sweep + test strategy doc → W3 or later (her
  first spawn should be a test-strategy doc per AGENTS.md, not
  test code). Pushed further: **deferred to W3 close at earliest,
  may slip to W4** given W3 is now Nick-heavy.
- Per-feature line-weight multiplier (Leo+Rollo flagged W3+).
- Categorical `brows.shape` enum (Leo+Rollo flagged W3+).
- Orbital socket recess primitive (Leo cross-cutting — defer to
  first pack pick that requires it; timmFlat dodges).
- `mouth.philtralBow` knob (BACKLOG #2; defer W3+).
- `expressions.ts` resuscitation (BACKLOG; defer W3+).
- `pointed` / `pear` jaw topology dispatch through demographic
  presets (Rollo adjacent-gap #1 — filed; **note: this is now
  in scope for Lloyd's W2 design pass as a possible part of the
  demographic-topology fix story for cells 9/12/14/15**).
- Tangent-decay parameter exposure (Lloyd item 1 — cheap, no
  caller needs it; defer).
- `hull.ts:71-86` dead `theta/cx/cy` cleanup — landed inline
  (`dda5d0b`).

**ROADMAP scope-cut declaration:** The slip of (a) long-hair
primitive promotion, (b) cascade-merge architectural implementation,
and (c) demographic-preset topology push into W3 consumes most of
W3's Nick budget. I am **explicitly cutting the W3 next-pack-spec
slot** (Leo+Rollo write the spec for pack #3) and **sliding it to
W4**. Q1 pack count: default + tintin + ligneClaire + timmFlat = 4
packs minimum at end of Q1 (the ROADMAP N ≥ 4 floor). W3 close = 4
packs at full demographic depth (the original 16-cell grid for
timmFlat closes in W3 once the three W3 rows land + Pascal re-scores
cells 6/7/11/9/12/14/15). W4 = spec + implement pack #5 if there's
budget, otherwise polish + first Holly sweep + Q1 closeout. The
ROADMAP rule (demographic depth > pack count) is preserved: we are
trading W3's pack-spec buffer for W3's depth-completion of pack #2,
which is the right trade per the rule.

## In flight

| Agent | Task | Status | Notes |
| ----- | ---- | ------ | ----- |
| Nick  | `tasks/nick-cascade-leak-fix.md` (PR #4) | running | Cascade-leak fix. Lloyd observed Nick chose the Option C primitive-flag path (`recipe.suppressInteriorHairDetail`) — uncommitted at last check. Lloyd's W3 manifest design subsumes the flag (delete in W3). |

## Done this sprint (W2)

- **Lloyd cascade-architecture design pass** —
  `research/lloyd-cascade-architecture.md` (commit `74792f5`).
  Q1 (cascade-merge): hybrid manifest at NEW slot 6 + per-pack
  `declares: string[]` (~65 LOC W3). Q2 (topology gap):
  demographic-preset-data layer fix (~50 LOC W3). Recommended W3
  order to Claudia: Q2 first, Q1 second; mechanically independent.
  Mixture-rule caveat for Q2 on `tintin` (regression guard via
  Pascal re-score of 4 tintin cells). Subsumes Nick PR #4's
  primitive-flag fallback (delete in W3). **Box 5 closed.**

- **Claudia W2 re-plan** — `tasks/claudia-q1w2-replan-pascal-no-ship.md`.
  Re-planned W2 post Pascal's NO-SHIP. Decision: ship 13-cell timmFlat
  in W2 (drop 6/7/11), land cascade-leak fix + Lloyd architectural
  design pass; slide long-hair primitive + cascade-merge implementation
  + demographic-preset topology push to W3; explicit ROADMAP scope-cut
  on W3's next-pack-spec slot (slides to W4). Spawn order documented
  below.

- **Pascal W2 close pass** — `research/pascal-w2-timmflat.md`. Two
  jobs in one file. Job 1: **3/16 cells at Pascal ≥ 5 — NO-SHIP at
  the original 16-cell W2 gate.** Job 2: **calibration holds.**
  Four-corner test FAILED on Pascal's read; pushed back on Nick's
  PASSES with named diagnosis (cells 1/4 not distinct chars at 96px;
  cells 12/14 not distinct ages; the
  demographic-not-exercising-topology failure mode the spec
  explicitly tested for). Three failure clusters: cascade-leak (6),
  long-hair primitive ceiling (3), demographic-topology gap (4 +
  four-corner). Calibration audit: sniff-tests are register-
  sensitive, not absolute — operating-manual clarification for
  future flat-fill packs, NOT a recalibration. **Escalation flag
  filed for Gary's awareness (no pause): pack as declarative truth
  vs pack as overrides at render time is the directional surface
  for Lloyd's W3 architectural pass.**

- **Nick PR #3** — `tasks/nick-timmflat-pack.md`. `timmFlat` pack
  lands in `src/presets/styles.ts` (+62 LOC); grid script at
  `scripts/timmflat-grid.ts`; full 16-cell sheet rendered at
  `/tmp/timmflat-out/`. Nick's four-corner test PASSES read was
  pushed back by Pascal post-rendering. Cascade-order spec-drift
  surprise filed for architectural fix (now Lloyd W2 design pass
  per this re-plan). PR #3 committed across `4c1caee` (pack data,
  parallel-edit collision into Lloyd-Pass-3 commit — Nick verified
  diff correct) + `236fd8a` (grid script + handoff).

- **Lloyd Pass 3** — code review of Nick PR #2. Verdicts:
  LOC overrun APPROVED-AS-IS, decision-1 default split APPROVED-
  AS-IS, ALPHA_FACTOR=1.5 APPROVED-AS-IS for v1, dead-code at
  `hull.ts:71-86` NEEDS-CHANGES → surgical 11-line drop landed
  inline by Bob as `dda5d0b`.

- **Nick PR #2** — `tasks/nick-alpha-shape-hullmode.md`. Alpha-shape
  + `hullMode` knob landed. 30/30 byte-identical; longCurtain
  wimple + coilyHalo hexagon eliminated. **Box 2 fully closed.**

- **Nick PR #1** — `tasks/nick-eye-plumbing-and-hull-cleanups.md`.
  Three commits: eye plumbing + centreU keying + debug attr drop.
  Catalog dots-mode 30/30 byte-identical; flat-mode 26/30 byte-
  identical post-centreU. Demographic-preset lidLine-on-default/
  ligneClaire side-effect filed for Pascal/Holly to flag if anything
  reads off.

## Blocked / pending (W2)

| Agent  | Task | Blocked on |
| ------ | ---- | ---------- |
| Pascal | Re-score the 13-cell revised grid | Nick PR #4 (cascade-leak fix) landing + re-render |
| Holly  | Test strategy doc + first regression sweep | Slid to W3 close at earliest; W2 is now Nick-heavy |

## Q1-W2 revised spawn order (for Bob)

**Wave 1 (parallel — both spawnable immediately):**

1. **Nick — `tasks/nick-cascade-leak-fix.md`** (NEW, drafted by Claudia
   this re-plan). Extend `TIMM_PEDAGOGY` overrides const in
   `scripts/timmflat-grid.ts` to suppress the per-hairstyle + per-
   demographic-presentation `leads` arrays that survive into the
   bob / pomp renders. Pascal's smallest-fix path. **Fallback authority:**
   if extending the override const doesn't catch the artifact cleanly
   (e.g., the merge semantics deep-merge the arrays instead of
   replacing), Nick is authorized to promote a `recipe.suppressLeads:
   true` primitive knob (smallest possible primitive promotion — ~10
   LOC type + ~5 LOC merge logic). Surface to Bob if reaching for
   anything bigger. ~half-day to one day. Renders the revised 13-cell
   grid on completion.

2. **Lloyd — `tasks/lloyd-cascade-architecture.md`** (NEW, drafted by
   Claudia this re-plan). Architectural design pass — written design
   ONLY, no implementation. Covers (a) the cascade-merge question
   (where do pack-pedagogy knobs win — re-order? type-level pin?
   new lock primitive?), and (b) the demographic-topology gap
   (does the cells 9/12/14/15 + four-corner failure close at the
   cascade-merge layer or at the demographic-preset-data layer —
   pushing jaw topology proportions harder in `demographics.ts`?).
   Output: a written design at `research/lloyd-cascade-architecture.md`
   naming the layer-of-fix for each symptom and sizing W3 implementation
   for Nick. ~half-day to one day. **Parallel-safe with Nick PR #4**
   (different files; Lloyd writes prose, Nick writes code).

**Wave 2 (sequential after Wave 1 lands):**

3. **Pascal — `tasks/pascal-w2-revised-rescore.md`** (NEW, drafted by
   Claudia this re-plan). Re-score the 13-cell revised grid post Nick
   PR #4. **Acceptance: Pascal ≥ 5 on all 13 retained cells (1, 2, 3,
   4, 5, 8, 9, 10, 12, 13, 14, 15, 16).** Cells 6, 7, 11 explicitly
   not scored this round — they are W3 work. Brief is sharp: Pascal
   should NOT re-litigate the calibration (Job 2 holds from
   `research/pascal-w2-timmflat.md`); the audit is closed. Pascal
   should ALSO NOT re-litigate the four-corner test pass/fail (the
   demographic-topology gap is filed; Lloyd's design covers it).
   Pascal's job: verify the cascade-leak fix landed cleanly on the
   bob/pomp cells (4, 5, 8, 10, 13, 16) and re-affirm the calibration-
   holds 3/16 → 5/13 register-correct cells continue to hold at ≥ 5
   on re-render.

**Conditional / not queued:**

4. **Bob technical sign-off on Lloyd's design** — Bob reviews Lloyd's
   written design and either accepts it or surfaces to Claudia for
   re-scope if Lloyd's design implies a structural change Claudia
   needs to triage against ROADMAP. No Pascal/Rollo on a design doc.
5. **Holly — test strategy doc** — first Holly spawn (per AGENTS.md);
   slips to W3 close at earliest. May further slip to W4 if W3 is
   tight. Not queued this sprint.
6. **Rollo — no catalog-level call this sprint.** Next Rollo touch
   is W4 next-pack-spec (per the ROADMAP scope-cut declared above —
   W3's next-pack-spec slot slides to W4).
7. **Leo — no audits queued for W2.** W3 may need Leo for
   orbital-socket / socket-recess primitive if the W4 pack pick
   demands it.
8. **David — monthly directional review** naturally lands around W2
   close or W3 open. Bob surfaces if the timmFlat re-plan + W3 Nick-
   heavy load + W4 pack-spec slip shifts the Q1 trajectory. Per the
   re-plan: it doesn't (4 packs at floor still hit; depth on pack
   #2 actually improves with the W3 closeout).

## History

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
