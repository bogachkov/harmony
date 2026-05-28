# Sprint board

Current sprint state. Updated by Claudia (PM) at sprint open / close;
read by every agent on spawn.

When a sprint closes, contents move under ## History and the active
sections reset.

---

## Active sprint — Q1-W4 (open) — LAST week of Q1

**Goal: PROVE master-tier. Push `timmFlat` from Pascal-5 (off-day-pro)
toward Pascal 6-7 (confident-pro) and answer the one question that
governs all of Q2-Q3: can the engine reach confident-pro on a face at
all — yes or no, and why? The deliverable is EVIDENCE, not a guaranteed
Pascal-7. In parallel, land Holly's first spawn (test-strategy doc,
deferred since W1) so Q2 doesn't open the bodies/clothes/poses surface
with no regression convention.**

W3 closed CLEAN: Pascal Pass 3 scored the full 16-cell `timmFlat` grid
at **16/16 ≥ Pascal-5** (strict close, not ship-with-gap), four-corner
test PASSES, `tintin × 4` regression HOLDS. The three engine rows (Q2
demographic-topology, Q1 cascade-merge manifest, Felix long-hair
primitive) all landed + Lloyd-approved. timmFlat now ships at off-day-pro
across full demographic depth. The next quality ceiling (Pascal 6-7) is
a *separate axis* that wasn't W3's job — it is W4's.

**The decision chain behind this goal (do not re-litigate):**
- David's W4 directional review (`tasks/david-q1-w3close-directional-
  review.md`, commit `634af04`): trajectory ON TRACK, met at the floor
  (Pascal-5, not the Pascal-7 aspiration). W4 direction **(B) polish
  timmFlat toward master-tier primary + (C) Holly hardening; (A) pack
  #5 deferred to Q2-open, NOT cut.** He escalated the quality-bar
  judgment to Gary.
- **Gary's answer: "Prove master-tier."** Gary confirmed master-tier
  IS the Q1 bar. This flips (B) from David's 60/40 lean to a
  **must-have**. W4's primary job is to prove the engine CAN reach
  Pascal 6-7 on timmFlat — not just that it makes off-day-pro packs.

**A NEGATIVE RESULT IS A LEGITIMATE, VALUABLE W4 OUTCOME.** If the
engine can't get past ~6 without an architectural change, that finding
de-risks Q2/Q3 (the clothed-character ceiling will be no higher than
the face ceiling — better to learn it now, on the one pack we've fully
exercised, than in Q3 when it's expensive). W4 acceptance is framed as
"we know whether the engine reaches confident-pro and why," NOT
"timmFlat is Pascal-7 or W4 failed."

### Acceptance (what closes Q1-W4)

Four boxes. Box 1 + Box 4 are the two HARD commitments (must-have);
Box 2 is the secondary (must land at minimum the DOC); Box 3 is fill.

- [ ] **(B) Master-tier audit + spec lands.** Leo + Rollo name what
  "confident-pro timmFlat" actually needs to clear Pascal-5 → 6-7,
  grounded in the BACKLOG ceiling-raisers
  (`research/stylepack-timmFlat-spec.md` §3 + `pascal-w2-timmflat.md`
  §Pass 3 ceiling note). Output: a short audit/spec in `research/`
  naming the levers in priority order + their expected Pascal lift,
  and an explicit honest read on whether the named levers can plausibly
  reach 6-7 OR whether the ceiling is architectural (decals-on-sphere
  integration debt — `BACKLOG.md` features-as-decals row). **Task:
  `tasks/leo-rollo-timmflat-ceiling-audit.md`.**

- [ ] **(B) Ceiling-raiser primitives land.** Implement the levers the
  audit (Box 1) prioritizes — expected: `highlightCutout` primitive
  (new, ~20 LOC, BACKLOG est. Pascal ~7→8) + per-feature line-weight
  multiplier (touches the render/line-weight path, ~30 LOC, BACKLOG
  est. villain register ~7→8). Felix owns the graphics-math interior
  (highlightCutout is a new primitive; line-weight multiplier touches
  the render path); Nick wires the pack-data (`timmFlat.declares` +
  the new knob defaults); Leo confirms pedagogy. **Mixture rule:
  additive only — `default`/`tintin`/`ligneClaire` stay byte-identical;
  ONLY timmFlat opts in.** **Task:
  `tasks/felix-nick-timmflat-ceiling-raisers.md`.** Final lever list
  is set by Box 1; this task is scoped on completion of the audit (the
  two named above are the strong candidates — confirm against the
  audit before implementing).

- [ ] **(B) Pascal re-scores the lift — the EVIDENCE.** Re-score the
  16-cell timmFlat grid (+ the off-grid villain-register probes:
  `adultFemPointed` / `elderMascPear` / a Joker-direction lid-weight
  probe) against the AGENTS.md anchor table, absolute. **Acceptance:
  a CLEAR yes/no on "did the engine reach Pascal-6+ on any cell, and
  how many," with the why.** Both outcomes close the box: ≥6 on a
  meaningful share = "ceiling reached, master-tier is on the engine's
  surface"; capped at 5 = "current ceiling is 5, here is the named
  root cause (likely the features-as-decals integration debt), filed
  for Q2." Mixture-rule guard: re-confirm `tintin × 4` holds (the
  line-weight multiplier touches a shared render path — verify it
  doesn't drift non-opted packs). **Task:
  `tasks/pascal-w4-master-tier-rescore.md`.**

- [ ] **(C) Holly's first spawn — test-strategy doc lands.** Deferred
  since W1; MUST land before Q2 triples the primitive surface (torso /
  limbs / clothing layer / pose). A DESIGN artifact, not test code:
  "what does 'tests passed' mean for a parametric art engine" —
  regression convention (byte-identical sweeps vs. visual-diff
  thresholds), what the gallery must cover honestly, how the
  forest-registry mixture rule gets a regression guard, and what
  minimal test scaffolding Q2 should open against. Runs **parallel**
  to the (B) lane (zero code overlap). **Task:
  `tasks/holly-test-strategy-doc.md`.**

### Fill (only if W4 has room after the four boxes; first to slip)

- **Thin regression-coverage pass** (Holly, after her doc) — a minimal
  regression scaffold so Q2 opens against a clean board. **Slips to
  Q2-open if (B) overruns** (David's call, Gary-confirmed: the (C)
  minimum is the DOC; regression coverage can slip).
- **BACKLOG triage pass** — clear W1-W3 deferral sediment so Q2 opens
  clean. Slips to Q2-open if no room.

### What is explicitly NOT in W4

- **(A) Pack #5 — DEFERRED to Q2-open, NOT cut.** Per David
  (Gary-confirmed): spec it **full-stack with body conventions** at
  Q2-open rather than re-opening a face-only pack in Q2 (the ROADMAP
  handoff rule: each pack carries its own body/clothes/pose
  conventions). Filed in BACKLOG as "pack #5: spec at Q2-open,
  full-stack." This is a mixture deferral, not a deletion.
- **Lloyd's Q1-closeout body-architecture design pass** — ROADMAP
  names it for the last Q1 sprint. Claudia's call per David's lean:
  **rides Q2-open, not W4**, so W4 stays focused on proving the
  ceiling. If Box 1 surfaces that the ceiling IS architectural (the
  decals-on-sphere debt), that finding feeds directly into Lloyd's
  Q2-open body-architecture pass — the right sequence.
- **Orbital-socket recess primitive / brow-shape enum / philtralBow /
  expressions resuscitation** — stay on BACKLOG unless Box 1's audit
  names one as the load-bearing ceiling-raiser (in which case Claudia
  re-scopes Box 2). Default expectation: highlightCutout + line-weight
  multiplier are the two W4 promotions.

## In flight

| Agent | Task | Status | Notes |
| ----- | ---- | ------ | ----- |
| — | — | — | W4 not yet spawned; Bob spawns per the Q1-W4 spawn order below. |

## Done this sprint (W4)

(none yet)

## Blocked / pending (W4)

| Agent  | Task | Blocked on |
| ------ | ---- | ---------- |
| Felix + Nick | Ceiling-raiser primitives (Box 2) | Box 1 audit naming the lever list + priority |
| Pascal | Master-tier re-score (Box 3) | Box 2 ceiling-raisers landing + re-render |
| Holly  | Test-strategy doc (Box 4) | Nothing — runs parallel from W4-open (zero code overlap) |

## Q1-W4 spawn order (for Bob)

Two lanes run in parallel from W4-open; the (B) lane is serial within
itself (audit → implement → score).

**Wave 1 (parallel — two independent lanes, zero file overlap):**

1. **(B-lane head) Leo + Rollo — `tasks/leo-rollo-timmflat-ceiling-
   audit.md`.** Name what confident-pro timmFlat needs: the
   ceiling-raisers in priority order, expected Pascal lift each, and
   the honest call on whether the named levers reach 6-7 OR the ceiling
   is architectural. This gates Box 2's lever list. Leo leads
   (pedagogy of the Timm villain/hero register split + the lid-weight
   canon); Rollo confirms the asset-side lift. **Short — an audit, not
   a build.**

2. **(C-lane, fully parallel) Holly — `tasks/holly-test-strategy-
   doc.md`.** Holly's first spawn. Design artifact. Zero code overlap
   with the (B) lane — can run start-to-finish alongside Wave 1+2+3.
   Bob spawns at W4-open and lets it run.

**Wave 2 (serial after Wave 1 audit lands):**

3. **(B-lane) Felix + Nick — `tasks/felix-nick-timmflat-ceiling-
   raisers.md`.** Implement the levers Box 1 prioritized. Felix owns
   the graphics-math interior (new `highlightCutout` primitive; the
   line-weight-multiplier render-path touch) + reviews Nick's
   graphics-math; Nick wires the pack-data + knob defaults + the
   `timmFlat.declares` additions; Leo confirms pedagogy on the
   rendered probe. Lloyd reviews if the line-weight multiplier touches
   an architectural seam (likely a small render-path knob, not a
   cascade change — Lloyd confirms scope on review). **Mixture-rule
   regression guard built in: non-timmFlat packs byte-identical.**

**Wave 3 (serial after Wave 2 lands + re-render):**

4. **(B-lane) Pascal — `tasks/pascal-w4-master-tier-rescore.md`.**
   Re-score the 16-cell grid + villain-register probes, absolute. The
   yes/no/why evidence is the W4 headline deliverable. Re-confirm
   `tintin × 4` holds (shared render-path guard). Calibration audit
   NOT re-litigated (closed Pass 1).

**Conditional / not queued:**

5. **Lloyd review** on the ceiling-raiser PR — Bob-triggered if Wave 2
   touches an architectural seam (the line-weight multiplier render
   path). Felix reviews the graphics-math interior in-lane.
6. **Holly thin-regression pass** — only if W4 has room after the four
   boxes; else slips to Q2-open (Gary-confirmed: the (C) minimum is
   the doc).
7. **Leo / Rollo pack #5 full-stack spec** — Q2-open, NOT W4.
8. **Lloyd body-architecture design pass** — Q2-open per Claudia's
   call (David's lean), unless Box 1 surfaces the ceiling is
   architectural, in which case Box 1's finding is the input to it.

## History

### Q1-W3 (closed — CLEAN-CLOSE, 16/16 strict per Pascal Pass 3)

**Closure summary:** Pascal Pass 3 (`research/pascal-w2-timmflat.md`
§Pass 3) scored the full 16-cell `timmFlat` grid at **16 / 16 cells at
Pascal ≥ 5 — strict close threshold met** (NOT ship-with-named-gap).
Four-corner test **PASSES** (cells 1/4/12/14 read as four
distinguishable topologies at 96px — the W2-diagnosed
demographic-topology gap mechanically closed). `tintin × 4` regression
**HOLDS** (3 cells drift in Lloyd's designed direction — sharper /
clearer demographic read; 1 byte-identical; no cell worse than its
prior register; `pack.proportionScale` fallback NOT triggered). No
sniff-test fires on any ≥ 5 cell; calibration holds, no recalibration.

**Honest note for the record (Pascal's framing, carried forward to
W4):** timmFlat ships at **Pascal-5 across full demographic depth** —
"a real pro could plausibly have drawn this on an off day," pro daily
output, NOT master register. The next ceiling (Pascal 6→7,
pro-daily → confident-pro) is a separate axis that was not W3's job.
This is the exact ceiling note David escalated and Gary answered with
"prove master-tier" — W4's primary job.

**Goal (met):** close the full 16-cell `timmFlat` grid at quality bar
by landing Lloyd's Q2 (demographic-topology) + Q1 (cascade-merge
manifest) designs + the long-hair primitive rebuild owning cells
6/7/11. End of W3 = pack #2 at full demographic depth, ROADMAP
"depth > count" satisfied. **All five acceptance boxes closed `[x]`.**

**Acceptance (all met):**

- [x] **Q2 — demographic-topology push landed.** Nick implemented
  Lloyd Q2 §Pick verbatim in `demographics.ts` (jaw proportion spread
  across child/masculine/elder: `bigonialWidth` / `mentalWidth` /
  `gonialAngle` / `jowl`) + two private off-grid fixtures
  (`elderMascPear`, `adultFemPointed`) folding Rollo's BACKLOG
  `pointed`/`pear` row in as private demographic-data (NOT public
  axis additions). Four-corner test at 96px now reads four
  distinguishable topologies. Commit `9e03a7f`. Handoff in
  `tasks/nick-q2-demographic-topology.md`. Lloyd-reviewed.

- [x] **Q1 — cascade-merge hybrid manifest landed.** Nick implemented
  Lloyd Q1 §Pick: STYLE re-ordered to NEW slot 6 (post-hairstyle,
  pre-expression) + per-pack `declares: readonly AllowedDeclarePath[]`
  manifest. `AllowedDeclarePath` string-literal-union in
  `model/params.ts` excludes demographic paths AT COMPILE TIME
  (verified: 11/11 forbidden paths produce TS errors). `timmFlat.
  declares` covers 14 paths. Default `[]` on `default`/`tintin`/
  `ligneClaire` → 816-cell broad regression byte-identical. Nick PR
  #4's `recipe.suppressInteriorHairDetail` flag DELETED, replaced by
  declarative `recipe.fillStyle: 'standard' | 'flat'`. Commit
  `a884a54`. Handoff in `tasks/nick-q1-cascade-merge-manifest.md`.
  Lloyd-reviewed.

- [x] **Long-hair primitive rebuild landed.** Felix's first spawn
  (per AGENTS.md §Onboarding-note). Flat-curtain primitive closes
  cells 6/7/11 (longSleek/longTail at Timm flat-shape register) —
  single closed silhouette, flat fill, no strand field. Default
  preserves current strand behavior (mixture rule). Commit `835148f`.
  Handoff in `tasks/felix-longhair-primitive-rebuild.md`. Honest
  day-one calibration surface noted — Felix's first owned piece of
  work, landed at quality. Lloyd reviewed architectural surface;
  Felix self-reviewed graphics-math.

- [x] **Full 16-cell re-render + Pascal re-score.** Pascal Pass 3:
  **16/16 cells at Pascal ≥ 5 (strict).** Cells 6/7/11 first-time ≥ 5
  (Felix's primitive); cells 12-16 promoted 4 → 5 (Q2's jaw-proportion
  spread); cells 1-5, 8-10 held at 5 through the Q1 manifest rewrite
  (no regression from the `suppressInteriorHairDetail` →
  `fillStyle: 'flat'` migration). Four-corner test PASSES.

- [x] **`tintin × 4` regression re-score.** HOLDS on all 4 cells.
  Mixture-rule guard satisfied; `pack.proportionScale` fallback NOT
  triggered (stays in BACKLOG).

**Done this sprint (W3):**

- **Pascal — W3 close re-score, Pass 3** (`research/pascal-w2-timmflat.md`
  §Pass 3 + `tasks/pascal-w3-close-rescore.md`). 16/16 ≥ 5 strict;
  four-corner PASSES; tintin × 4 HOLDS; no sniff-test fires;
  calibration holds. Movement signal: demographic-topology axis
  (cells 12-16, 4→5) + long-hair primitive axis (cells 6/7/11,
  2→≥5) both strict progress; cascade-leak axis held through the Q1
  refactor. Honest Gary-framing recorded: 16/16 at Pascal-5 is honest
  off-day-pro shipping, not master-tier — the ceiling note that
  became W4's primary job.

- **Nick — Q1 cascade-merge hybrid manifest** (`tasks/nick-q1-cascade-
  merge-manifest.md`, commit `a884a54`). `AllowedDeclarePath` union +
  `applyDeclares` helper + slot-6 late pass + `Pack` type + 14-path
  `timmFlat.declares` + `suppressInteriorHairDetail` → `fillStyle`
  migration. 816-cell broad regression byte-identical on non-timmFlat;
  declares-disallowed-path fixture confirms compile-time engine/style
  separation. Lloyd-reviewed (architectural surface).

- **Nick — Q2 demographic-topology push** (`tasks/nick-q2-demographic-
  topology.md`, commit `9e03a7f`). Jaw spread in `demographics.ts` +
  two private fixtures. Four-corner test fixed. No tintin regression
  visible; default/ligneClaire × untouched-demographic byte-identical.
  Lloyd-reviewed (data layer).

- **Felix — long-hair primitive rebuild** (`tasks/felix-longhair-
  primitive-rebuild.md`, commit `835148f`). Flat-curtain primitive,
  cells 6/7/11. First Felix spawn; calibrated the new graphics-domain
  lane into the team. Mixture-rule default preserves strand behavior.

- **Claudia — W3 close + W4 plan** (this artifact +
  `tasks/claudia-q1w3-close-w4-plan.md`). Closed W3 to History;
  opened W4 against David's direction + Gary's "prove master-tier"
  confirmation.

**W3 → W4 carry-overs:**
- Master-tier push on timmFlat (Pascal-5 → 6-7). **W4 primary (B),
  must-have per Gary.**
- Holly test-strategy doc (deferred since W1). **W4 secondary (C),
  minimum-must-land.**
- Pack #5 spec. **DEFERRED to Q2-open, full-stack with body
  conventions (NOT cut).**
- Lloyd body-architecture design pass. **Q2-open (Claudia's call).**

### Q1-W2 (closed — accept-with-known-gaps per Pascal Pass 2; W3 closed the gap)

**Closure summary:** Pascal Pass 2 landed 8/13 retained cells at
≥ 5 (cells 1, 2, 3, 4, 5, 8, 9, 10), with 5 cells held at 4
(cells 12, 13, 14, 15, 16). All 5 short cells traced to a single
root cause: the demographic-topology gap (child-round / elder-
jowled / adult-square don't diverge at silhouette). That gap was
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
primitive level. W3 closed them via the long-hair primitive rebuild
row (Felix).

**Revised acceptance (what closed Q1-W2):**

- [x] **Eye plumbing landed.** (PR #1.) Unchanged from prior gate.
- [x] **`hullMode` knob landed.** (PR #2.) Unchanged from prior gate.
- [~] **`timmFlat` pack lands + renders at quality on the revised
  13-cell grid.** **Partial accept:** Pascal Pass 2 landed 8/13 cells
  at ≥ 5 (cells 1, 2, 3, 4, 5, 8, 9, 10). Cells 12, 13, 14, 15, 16
  held at Pascal 4 — all 5 trace to the demographic-topology gap,
  owned by W3 Q2 design row. Cells 6, 7, 11 deferred to W3 long-hair
  primitive row. Pack DATA landed (PR #3). Cascade-leak fix (PR #4)
  landed clean on all 6 primary fix targets. **Box closed partial
  on the explicit understanding that W3 finishes the full 16-cell
  grid — W3 delivered 16/16.**
- [x] **Pascal calibration audit — calibration holds.** Filed at
  `research/pascal-w2-timmflat.md` §Calibration.
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
  cells all the demographic-topology gap (Lloyd Q2 owns).
- **Nick PR #4 — cascade-leak fix** — `tasks/nick-cascade-leak-fix.md`.
  `recipe.suppressInteriorHairDetail` (subsumed by W3 manifest).
- **Lloyd cascade-architecture design pass** —
  `research/lloyd-cascade-architecture.md` (commit `74792f5`).
- **Claudia W2 re-plan** — `tasks/claudia-q1w2-replan-pascal-no-ship.md`.
- **Pascal W2 close pass** — `research/pascal-w2-timmflat.md`. Job 1:
  3/16 ≥ 5, NO-SHIP at original 16-cell gate. Job 2: calibration holds.
- **Nick PR #3** — `tasks/nick-timmflat-pack.md`. `timmFlat` pack data.
- **Lloyd Pass 3** — code review of Nick PR #2.
- **Nick PR #2** — `tasks/nick-alpha-shape-hullmode.md`. Alpha-shape +
  `hullMode` knob.
- **Nick PR #1** — `tasks/nick-eye-plumbing-and-hull-cleanups.md`.

**ROADMAP scope-cut declaration (held through W3):** The next-pack-spec
slot stayed slid; W3 closed pack #2 at full demographic depth. W4 spends
on master-tier proof + Holly doc; pack #5 deferred to Q2-open full-stack.

### Q1-W1 (closed — all four ship-gate boxes met)

**Goal: lay the two rails Q1 runs on.**

1. **Rail A — engine:** 3D clump-volume refactor lands behind a flag
   (`clumpMode: 'flat' | 'volume'`, default `'flat'`) without
   regressing any of the 13 existing hairstyles. Volume mode
   exercised on Lloyd's three test fixtures.
2. **Rail B — style:** one new style pack target chosen and SPEC'd
   (not implemented). The spec is what Nick consumes in Q1-W2.

**Side rail:** Leo audit on eye/mouth/brow integration under the
current `tintin` pack.

**Closed:**

- **Box 1 + Box 2 (Nick 3D clump-volume refactor, 7 commits ending
  `909244c`).** All 13 existing hairstyles bit-for-bit identical in
  flat mode. Volume mode renders cleanly for the three fixtures. Net
  +444 LOC engine + 148 fixtures. Lloyd review pulled alpha-shape
  into W2.
- **Box 3 (Leo + Rollo joint timmFlat spec at
  `research/stylepack-timmFlat-spec.md`).** Both halves signed.
- **Box 4 (Leo face-integration audit at
  `research/leo-face-integration-audit.md`).** Eyes = STOP (eye-
  primitive plumbing prereq). Cross-cutting: features-as-decals
  integration debt is real; timmFlat dodges it; pack 3+ will hit it
  hard and need a socket-recess primitive pass. Six BACKLOG
  candidates flagged.
- **Lloyd pass 2 review.** Four verdicts.

**Carry-overs into W2:** eye plumbing; `hullMode` alpha-shape bundle;
timmFlat implementation; Pascal calibration audit.

**Deferred / filed to BACKLOG (W1 close):** tangent-decay exposure;
six Leo candidates triaged; `hull.ts:71-86` dead-code; `pointed`/`pear`
jaw dispatch; per-feature line-weight multiplier; categorical
`brows.shape` enum.

### Sprint pre-Q1 (the long session that built the foundation)

- Leo passes 3-8 — pedagogy + audits.
- Lloyd pass 1 — 3D clump-volume architecture (TL approved).
- Rollo pass 1 — catalog review.
- Hair-theorist pass — physics doc.
- Nick tuning passes 1 + 2.
- Recipe primitive (`HairstyleRecipe` + 11 hairstyle files).
- Collab artifacts created: SPRINT / BACKLOG / tasks/.
- ROADMAP + PROCESS docs created.
- Nine-role crew formalized (David CEO, Claudia PM, Holly QA).
- David pass 1 + pass 2 (roadmap audit + scope revision).
- Mixture-not-survival rule encoded.
- Forest registry initialized.
