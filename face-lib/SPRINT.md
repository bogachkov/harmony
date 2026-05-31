# Sprint board

Current sprint state. Updated by Claudia (PM) at sprint open / close;
read by every agent on spawn.

When a sprint closes, contents move under ## History and the active
sections reset.

---

## Active cycle — face credibility + character identity

**Goal:** make the engine produce faces Gary doesn't reach for the
eraser on, AND make characters persistent across renders. Held for
the cycle after: the LLM-callable surface spec, the demo story.
Build the substance now; expose it next.

Per ROADMAP (recalibrated W4): Track A1+A2+A3 + Track B2 in one
cycle. Drop Q1/W4 labels — they were units-conversion, not calendar.

### Acceptance (four pieces)

- [ ] **1. Drawing fixes land.** Hair shadow cutout (`highlightCutout`
  used inverted) + per-feature line weight multiplier. Additive, opt-in:
  default/tintin/ligneClaire stay byte-identical, only timmFlat opts in.
  The W4 audit (`research/timmflat-ceiling-audit.md`) said these are
  real lift AND prerequisites for the attachment-model work below — not
  throwaway. Felix's graphics-math interior; Nick wires pack data.
  **Bob shows Gary the renders for the eye-check before declaring done.**

- [ ] **2. Feature-attachment model designed.** Eyes / brows / mouth
  attached to a form that turns under them, not stickers on a balloon.
  Lloyd designs the architectural seam + writes the load-bearing code
  himself (no more design-only Lloyd). Felix designs the graphics-math
  interior — orbital socket / brow ridge / mouth-on-mandible math.
  Leo writes the pedagogy input from Loomis / Bridgman / Vilppu. Output
  is a written design in `research/` PLUS a sized estimate (Felix's
  call — he owns the input-scale sizing; remember the alpha-shape miss).
  Not a full implementation yet — that's piece 3.

- [ ] **3. Attachment model built on timmFlat.** Lloyd writes the
  load-bearing core (the attachment plumbing in the cascade / render
  path); Nick implements the broad surface (per-feature plug-in to the
  new model); Felix implements the geometry interior. Mixture rule:
  existing packs untouched. **Gary's eye is the gate.** If he stops
  reaching for the eraser on timmFlat output, piece 3 is done. Pascal
  scores in the new recalibrated voice (Haddock-mode, 10 = master, the
  current output is ~2-3) but Gary's read is ground truth.

- [ ] **4. Character-identity layer.** A *character* is a named, stored
  set of params (`protagonist_alice` etc) — not just a seed. Same name
  = same face every render. Optional per-call overrides for expression
  / framing / pose-when-poses-exist. Deterministic. Persisted to disk
  in a simple readable format. Lloyd designs + writes the persistence
  surface; Nick wires it into composeFace. No LLM API yet — that's
  the next cycle. Just the substance.

### Held for next cycle (not now)

- Spec the LLM-callable surface as a real product (Track B1).
- Skateboard demo story across a few beats (Track B3).
- Pack #2 as a story contract (Track C).
- Bodies / clothes / poses (Track post-A).

### Cross-cutting

- **Holly:** confirm determinism in the clump-hair code (her test-strategy
  doc flagged suspected unseeded randomness — fix it before piece 4
  leans on "same seed = same character"). Lands the `--gate` regression
  script behind the determinism fix.
- **Pascal:** recalibrated. New anchor (10 = Hergé/Toth/Timm; current
  output ~2-3). Haddock-voice mandate per AGENTS.md. Stops being the
  final word — Gary's eye is.
- **Bob:** the rule from BOB.md — look at renders before relaying any
  Pascal score. The team built a scoring machine that inflated; the
  check against that is me, not Pascal.

### Team for this cycle

- **Lloyd** — designs attachment model AND writes the load-bearing
  cascade/render code AND designs+writes identity-layer persistence.
  Hands on. Pieces 2 + 3 + 4 core.
- **Felix** — graphics-math interior of attachment model. Piece 2 +
  piece 3 geometry. Honest input-scale sizing.
- **Leo** — pedagogy input on attachment (Loomis / Bridgman / Vilppu).
  Piece 2.
- **Nick** — broad implementation: pack data wiring on piece 1, the
  per-feature plug-in surface for piece 3, the composeFace wiring on
  piece 4. Not load-bearing core (that's Lloyd's now).
- **Holly** — determinism fix + regression scaffold. Cross-cutting.
- **Pascal** — scores in the new voice. Reference signal, not gate.
- **Gary** — the actual eye that closes piece 1 and piece 3.
- **Bob** — spawn order; shows Gary renders; honest read first.
- **Claudia** — opening this cycle in this file IS the planning;
  no separate plan doc this round. Less ceremony.

### Spawn order

**Wave 1 (in parallel — different files, different lanes):**
- Felix + Nick — re-spawn the ceiling-raisers (piece 1). Prior spawn
  was lost in session compression. `tasks/felix-nick-timmflat-ceiling-raisers.md`
  still applies as the brief.
- Lloyd + Felix + Leo — attachment-model design (piece 2). Single
  joint spawn producing `research/attachment-model.md`.

**Wave 2 (after both Wave 1 pieces land):**
- Lloyd + Nick + Felix — attachment-model implementation on timmFlat
  (piece 3). Lloyd writes the core, Nick the surface, Felix the geometry.

**Wave 3 (after piece 3 + Holly's determinism fix):**
- Lloyd + Nick — character-identity layer (piece 4).

**Bob renders + shows Gary** between every wave. Gary's eye gates
piece 1 and piece 3. Pascal scores but doesn't gate.

## In flight

| Agent | Task | Status | Notes |
| ----- | ---- | ------ | ----- |
| Felix + Nick | Piece 1 — L1 cutout + L2 line-weight | **Code landed, awaiting Gary eye-check** | `tasks/felix-nick-timmflat-ceiling-raisers.md`. 816-cell mixture-rule sweep byte-identical on default / tintin / ligneClaire. timmFlat 16-cell grid re-rendered at `/tmp/timmflat-w4/`. Felix sizing note in handoff: ~100 LOC for the cutout vs ~20 LOC audit estimate, honestly surfaced. Holly's determinism flag: RNG is seeded (deterministic) but the seed is hardcoded to 1 rather than reading `style.jitterSeed` — separate Holly work, NOT a piece-1 bug. |

## Done this cycle

(none yet)



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
