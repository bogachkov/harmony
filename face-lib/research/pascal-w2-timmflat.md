# pascal-w2-timmflat — W2 sprint-close scoring + W1-deferred calibration audit

*Pascal's W2-close spawn. Two jobs in one file: 16-cell timmFlat grid
scoring (absolute, anchor-table-calibrated) and the W1-deferred
calibration audit. Q1-W2 ship-gate rows 3 + 4 close on this verdict.*

---

## Anchor-table refresher (so future Pascals can audit calibration)

Per `face-lib/AGENTS.md` "The anchor (READ THIS BEFORE SCORING)": Pascal
scores **absolute against published-comic-art quality**, NOT delta from
last round. The anchor table: 9-10 = masters at their best; 7-8 = working
pro's daily output, ready for print; 5-6 = a real pro could plausibly
have drawn this on an off day, recognizable, line has life; 3-4 = reads
as a face with structural intent but clearly procedural (dead line,
wrong hair, computed proportions); 1-2 = obviously generated, broken
primitives; 0 = doesn't read.

The load-bearing constraints AGENTS.md attaches to the table: **"If hair
is dead, no score above 4."** And: **"If features don't integrate into a
single drawn-feeling whole, calibrate HARDER, not softer."** Both are
load-bearing for the timmFlat grid because the longSleek/longTail/bob
cells either have visibly broken hair or features that read as stacked
primitives rather than an integrated drawing.

Important: I am scoring the *Timm flat-shape register*. The register
itself is reductive — flat fills, geometric silhouette, no rendering
gradient, no Caniff brush-swell. A cell at "Pascal 5" in this register
is not "looks like a Tintin page"; it is "a real animation pro could
plausibly have drawn this clean-line flat-fill construction on an off
day." The register doesn't get a free pass on integration or line-life
— it just sets a different ceiling on the *kind* of marks present.

---

## Job 1 — Per-cell scoring table

Rendered grid: `/tmp/timmflat-out/grid/sheet-full.png`,
`/tmp/timmflat-out/grid-96/sheet-thumb.png`.

| # | Cell                                       | Pascal | One-line read                                                                                                                                  |
| - | ------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | adult-masc-square shortSwept               | 5      | Cleanest cell. Square jaw + cusp, brow brick, almond + heavy lid all land; minor strand-hint at the bang underside but the mass reads as flat. |
| 2 | adult-masc-square shortSwept dark          | 5      | Equivalent to cell 1 in construction; dark-skin swap is clean and doesn't introduce new artifacts.                                             |
| 3 | adult-masc-square spikyShort               | 5      | Spiky-edge top reads as one closed mass with intentional terminations (Toth-correct); slight side-flyaway but the silhouette holds.            |
| 4 | adult-fem-oval bobChinLength               | 3      | Bob shows interior strand striping at the bangs + stray side-strands — `recipe.leads=[]` did not fully land. Pedagogy-leak visible.            |
| 5 | adult-fem-oval bobChinLength dark          | 3      | Same as cell 4 + dark skin. The strand artifact is the dominant read, not the silhouette.                                                      |
| 6 | adult-fem-oval longSleek                   | 2      | Multi-strand field-tracer radiating from the crown, vertical strands hanging past the chin onto the neck. Dead-procedural-hair fires hard.     |
| 7 | adult-fem-oval longTail                    | 2      | Same hair-primitive failure as cell 6, mass reaching the chest. Hair fights Timm canon ("one flat shape") at the engine-primitive level.       |
| 8 | teen-masc-ovalsoft shortPomp               | 3      | Pomp top is a tangly chaotic squiggle — the swept-mass construction didn't land; face below it is otherwise clean.                             |
| 9 | teen-masc-ovalsoft spikyShort dark         | 4      | Spike-cluster less confident than cell 3 (extra side-fringe, busier crown); face holds.                                                        |
|10 | teen-fem-ovalsoft bobChinLength            | 3      | Same bob-stripe artifact as cell 4; "teen" demographic differentiation from cell 4 is whisper-thin.                                            |
|11 | teen-fem-ovalsoft longSleek dark           | 2      | Same dead-strand-field as cell 6; dark-skin swap can't rescue a broken hair primitive.                                                         |
|12 | child-masc-round shortSwept                | 4      | "Round" cranium barely reads as more rounded than the adult-square cells; ear protrusion + smaller frame are doing all the child work.         |
|13 | child-fem-round bobChinLength dark         | 3      | Bob-stripe artifact + child face that is also under-differentiated from cell 10 (teen-fem) at thumbnail.                                       |
|14 | elder-masc-jowled shortReceding            | 4      | Receding hairline carries "elder"; jowled jaw is more of a chamfered chin than a forward-protruding jowl mass. Topology read is soft.          |
|15 | elder-masc-jowled shortReceding dark       | 4      | Same as cell 14 + dark; equivalent diagnosis.                                                                                                  |
|16 | elder-fem-jowled bobChinLength             | 3      | Bob-stripe artifact + the elder-fem face has no demographic age-tells (no sag, no cartilage cue); the bob is doing all the demographic work.   |

**Tally:** 4 cells at Pascal ≥ 5 (cells 1, 2, 3, 5… wait — cell 5 is 3).
Re-counting cleanly: **≥ 5 = cells 1, 2, 3 (3 cells)**. **< 5 = cells 4,
5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 (13 cells)**. Of the 13 sub-5
cells: 6 are failing the bob-stripe pedagogy-leak (cells 4, 5, 10, 13,
16 — also implicates the bangs in 8); 3 are failing the longSleek/longTail
dead-procedural-hair test (cells 6, 7, 11); the remaining 4 (cells 9, 12,
14, 15) are failing the demographic-data-not-exercising-topology test
(child-round and elder-jowled aren't distinguished from adult-square in
the silhouette).

---

## Four-corner test verdict — push back on Nick's PASSES

Reference: `/tmp/timmflat-out/grid-96/four-corners.png`. Spec criterion
(`stylepack-timmFlat-spec.md` lines 502-511): cells 1/4 must read as
**clearly different characters** at 96px; cells 12/14 must read as
**clearly different ages**. If those four corners pass, the middle is
plausibly carryable; if they collapse, "the demographic-data layer isn't
exercising the topology enum hard enough."

**Verdict: FAILS, on both axes.**

- **Cell 1 vs cell 4 (different characters?)** — At 96px the head
  silhouettes are nearly identical. The "square" of cell 1 and the
  "oval" of cell 4 produce face outlines whose outer edges read as the
  same broad-bottomed rounded shape at thumbnail. The only character
  differentiators are: hair shape (and cell 4's bob is corrupted by the
  strand artifact) and presence of the heavy brow brick (also similar
  in both). Eyes, mouth, nose, skin-contour — identical register. This
  is the failure mode Rollo predicted at spec lines 506-511 verbatim:
  topology enum isn't being exercised hard enough by the demographics.

- **Cell 12 vs cell 14 (different ages?)** — Hair carries the age
  difference (full shortSwept vs. receding shortReceding). Strip the
  hair and the two faces have substantially similar jaw silhouettes
  and identical feature constructions. The "round" of child and the
  "jowled" of elder don't visibly diverge at the silhouette level —
  the child face is barely rounder, the elder face barely more
  rectangular. At 96px this reads more as "two adults with different
  hairlines" than "child vs elder."

Both pairs collapse toward similar silhouettes when isolated from the
hair. This is the demographic-data-doesn't-exercise-topology gap, and
it's the failure mode the spec explicitly tested for. **Disagree with
Nick — the four-corner test does not pass.**

(Note: I'm not penalizing Nick. The pack-level pedagogy contract he
implemented via TIMM_PEDAGOGY overrides is correct and visible in cells
1/2/3 — those land at register. The four-corner failure is a
demographic-layer-not-exercising-topology issue, not a pack-style-pack
issue. See sprint-close recommendation for where I think the fix lives.)

---

## Pack-level verdict — NEEDS WORK (does not ship at Q1-W2 quality bar)

- Cells at Pascal ≥ 5: **3 / 16** (cells 1, 2, 3).
- Cells at Pascal < 5: **13 / 16**.
- Ship-gate requires: Pascal ≥ 5 + Rollo-would-ship **on all 16 cells**.
- Result: **NO-SHIP at the W2 gate.**

What's failing, by category:

1. **Cascade-order leak (cells 4, 5, 8, 10, 13, 16 — six cells).** The
   pack's `recipe.leads = []` pedagogy didn't fully land in the bob /
   pomp cells. Visible as interior strand striping in the bangs and
   stray flyaway strands by the cheeks. This is the cascade-order
   surprise Nick flagged at `face-lib/scripts/timmflat-grid.ts` lines
   34-52 — the `TIMM_PEDAGOGY` override layer catches most of the
   pedagogy contract but **not** the per-hairstyle `leads` arrays that
   hairstyles like `bobChinLength` carry. The override layer sees an
   empty `leads = []` and merges it with whatever the hairstyle-layer
   wrote earlier in the cascade — the empty array does not erase the
   hairstyle's leads (depends on merge semantics; if the merge is
   "non-empty source wins" or "deep merge of arrays," the hairstyle's
   leads survive). **This is the override layer not catching everything
   Leo+Rollo specified, exactly as the task brief asked me to flag.**

2. **Engine ceiling on long-hair register (cells 6, 7, 11 — three
   cells).** The `style: 'long'` field-tracer's multi-strand mode is
   incompatible with Timm canon ("long hair = one flat shape"). The
   renders show strand-radial-from-crown + vertical-strands-past-chin
   — exactly Nick's prediction. Leo's spec triaged this as
   `clumpMode: 'flat'` being the correct default and noted these
   hairstyles should still work; the renders show that the long-hair
   variant's strand layer is still active even with the pack's
   contract. Whether you call this "engine ceiling" (Nick's frame) or
   "pack didn't fully suppress strands" (my frame), the FIX is the
   same: a stronger primitive-level toggle for "this pack wants the
   single-silhouette mode of `longSleek` / `longTail`, not the
   multi-strand mode." Nick may need a `recipe.strandMode: 'off'`
   knob — or simpler: the field-tracer should be no-op when
   `clumpMode: 'flat'` AND no leads are configured. Concur with Nick
   that this is genuinely an engine-primitive issue, not a pack
   tuning. But it's a primitive-level issue that has to be fixed for
   the pack to ship at quality, so it blocks W2 close.

3. **Demographic data not exercising topology (cells 9, 12, 14, 15 —
   four cells).** The pack pedagogy reduces interior detail and pushes
   silhouette to do the work, BUT the demographic presets don't push
   the jaw topology hard enough for silhouette to actually
   distinguish. Adult-square, child-round, elder-jowled all produce
   similar broad-bottomed face outlines. This is what Rollo flagged
   at spec lines 504-511 ("if the four corners collapse to similar
   silhouettes, the demographic-data layer isn't exercising the
   topology enum hard enough"). **This is the demographic-preset-data
   gap, not the pack** — meaning the fix lives in
   `src/presets/demographics.ts` (or wherever the demographic presets
   set jaw topology proportions), not in the timmFlat pack.

4. **Top-2 remaining gaps in priority order:**
   - **#1 (highest):** the cascade-order leak (item 1 above). This is
     a six-cell impact AND a known architectural issue. Nick's
     workaround layer didn't fully catch the hairstyle-layer leads.
     The fix is either (a) extend `TIMM_PEDAGOGY` to also clear the
     specific hairstyle-level leads it wants suppressed, or (b) fix
     the actual cascade so pack-level `recipe.leads = []` wins
     against hairstyle-level leads. (b) is Lloyd's call.
   - **#2:** the long-hair-strand engine ceiling (item 2). Three-cell
     impact, requires a primitive-level toggle.

**Movement signal vs. last round:** N/A — this is the first scoring of
the timmFlat pack. No prior round to compare against.

---

## Off-grid soft probes — read

References: `/tmp/timmflat-out/probes/pointed-jaw.png`,
`/tmp/timmflat-out/probes/pear-jaw.png`.

- **pointed-jaw (Joker register):** The wedge cusp at the chin reads
  honestly — narrow `mentalWidth: 0.20` cleanly produces the chin-cusp
  silhouette. NOT a dramatic Joker-extreme wedge yet (the cranium
  doesn't widen above the wedge as Sito describes Timm doing); reads
  more "lantern jaw" than "Joker wedge." But the topology dispatcher
  IS reachable, which is the whole point of the probe.

- **pear-jaw (Penguin register):** The wide bigonial + jowl + low ramus
  produces a pear silhouette that is visibly distinct from the
  must-ship grid. Cranium-to-jaw ratio inverts correctly. Reads as
  a Penguin-class topology even if the rendered proportions aren't
  fully production-grade (chin is still flat, no Penguin under-bite
  protrusion).

**Probe verdict:** Both topologies are demonstrably reachable through
the pack via overrides. This confirms the spec's adjacency-gap claim
(spec lines 530-543) that `pointed` / `pear` are wired in the enum and
need only a demographic-or-archetype axis to dispatch them. Not part of
the ship-gate verdict; just confirming the topology substrate is sound.

---

## Calibration audit (W1-deferred)

Cross-referencing Job 1 scores against the AGENTS.md anchor table.

**Self-check question per the W1 plan:** "If Pascal scores above 5 on
output that fails the dead-procedural-hair / flat-line /
features-don't-integrate sniff, the calibration itself is the bug."
Run that audit against my Job 1 scores.

**Walking each ≥ 5 cell against the three sniff-tests:**

- **Cell 1 (Pascal 5).** Dead-hair test: the flat black mass IS the
  correct Timm register — flat fills are pedagogy, not procedural-
  collapse. The minor strand-hint at the bang underside is the
  only sniff that fires, and it's at the edge of detection — not a
  primitive-broken signal. Line-life test: the contour is even and
  jitter-free, which the timmFlat register *demands* by spec (Leo
  decision §2: "ZERO jitter, animation-clean"). In any other pack
  this would be a flat-line-collapse fail; in timmFlat the
  jitter-zero IS the pedagogy. Integration test: brow + lid + nose +
  mouth read as one drawing (not stacked primitives) because they
  share the same heavy contour weight. **5 stands.**

- **Cell 2 (Pascal 5).** Identical construction to cell 1; the dark-
  skin fill is internally consistent. Same three-sniff verdict.
  **5 stands.**

- **Cell 3 (Pascal 5).** Hair: spike-cluster reads as one closed
  shape with deliberate terminations — Toth-correct, register-
  consistent. Side-flyaway is the only artifact and it's a minor
  edge defect, not a primitive break. Line + integration: same as
  cell 1. **5 stands.**

**Sniff-test on the ≥ 5 cells: clean.** None of cells 1, 2, 3 fires
the "calibration bug" signal — they earn their 5s through the Timm
register honestly.

**Sniff-test on the borderline cells (3 ≤ Pascal ≤ 4):** these
deserve attention too because under-scoring would also be drift.

- **Cells 9, 12, 14, 15 (Pascal 4).** Should any of these have been a
  5? They all have working faces but their demographic differentiation
  is whisper-thin at thumbnail; the topology enum isn't actually being
  exercised. AGENTS.md is clear: "5-6 = a real human pro could
  plausibly have drawn this on an off day. Recognizable as a person,
  line has life, but with visible weaknesses an editor would flag." A
  pro drawing "an elderly man" would push the jowl + hairline + skin-
  sag harder than these cells do; an editor would correctly flag that
  the elder cell could be drawn 15 years younger and read the same.
  That's the "visible weakness an editor would flag" sliding past
  acceptable into "too procedural" — 4 is the correct call. **Calls
  hold.**

- **Cells 4, 5, 8, 10, 13, 16 (Pascal 3).** The bob-stripe artifact is
  a visible primitive leak. Per anchor table: 3-4 = "Clearly procedural
  — line is dead, hair is wrong, proportions feel computed." The hair
  IS wrong (interior striping in what should be a flat shape). 3 is
  the correct anchor. **Calls hold.**

- **Cells 6, 7, 11 (Pascal 2).** Dead procedural hair, dominant artifact,
  features lost in the strand-field. Anchor: 1-2 = "Pieces don't
  integrate. Multiple primitives visibly broken." The hair primitive is
  visibly broken AND features no longer integrate as one drawing
  because strands cross the face plane. 2 is the correct anchor.
  **Calls hold.**

**Verdict: calibration holds.**

Two-sentence why: the ≥ 5 cells (1, 2, 3) all pass the three sniff-tests
in the Timm register — flat fill is pedagogy not procedural-collapse,
zero-jitter is pedagogy not flat-line-collapse, and the features
integrate via shared contour weight. The < 5 cells map cleanly onto the
3-4 / 1-2 anchor bands by failure mode (broken hair primitive → 2;
clearly-procedural hair-leak → 3; structural intent but topology not
exercised → 4), which is what the table prescribes.

**W1-deferred outcome: calibration holds.** This is one of the two
legitimate outcomes the W1 plan called out — the other being "drift
detected," which would have required a recalibration proposal. The
anchor table as written produces honest scores in this register;
nothing to recalibrate.

(One forward note for the next Pascal spawn: the Timm pedagogy
register is the first time the engine has tested a tradition where
"zero jitter" is the right answer — every prior pack at any quality
would have triggered the flat-line-collapse sniff. If we add a second
flat-fill pack later (shounen, Disney, etc.) and they share this
register, the calibration should remain "the sniff-tests are register-
sensitive, not absolute." That's not a recalibration; it's an
operating-manual clarification.)

---

## Sprint-close recommendation — does Q1-W2 close on this grid?

**No. Q1-W2 does not close on this grid as currently rendered.**

Of the three failure categories:

1. **Cascade-order leak (6 cells)** — This is the architectural
   surprise Nick flagged. His workaround caught most of the pedagogy
   contract, but the per-hairstyle `leads` arrays survived the
   override merge. **Smallest fix: Nick re-spawn to extend
   `TIMM_PEDAGOGY` in the grid script with the specific hairstyle-
   level overrides for `bobChinLength` (and `shortPomp`) needed to
   suppress the interior strand striping at the bang line.** If that
   works in the override layer, Nick re-renders, I re-score these six
   cells, and they likely land at Pascal 4-5. If the bang-strand
   artifact is coming from a different code path (e.g., the bang-mass
   itself has hard-coded internal detail), this becomes a Claudia
   sprint-re-plan call — promote a `pack.suppressInteriorHairDetail`
   primitive flag.

2. **Engine ceiling on long hair (cells 6, 7, 11)** — Three-cell
   impact, primitive-level issue. **This blocks pack-shipping at
   quality and the fix is NOT a pack-level value tune** — the
   field-tracer's multi-strand layer fundamentally fights the
   flat-shape register. **Smallest fix: Claudia sprint-re-plan to
   promote a primitive-level "flat-clump mode disables strand layer"
   coupling, or a `recipe.strandMode: 'off'` knob.** Nick's grid
   script can't override-around this because the strand layer is
   below the override cascade. Maybe ~30-50 LOC in the field-tracer.
   Concur with Nick that this is the engine ceiling. If the call is
   "ship the pack without longSleek / longTail and revisit the
   long-hair primitive in Q1-W3," that's also legitimate — but it
   shrinks the grid from 16 to 13 cells (cells 6, 7, 11 removed) and
   the W2 ship-gate as currently written ("Pascal ≥ 5 on all 16
   cells") still doesn't close.

3. **Demographic-data not exercising topology (cells 9, 12, 14, 15)** —
   Four-cell impact (plus the implicit cell 1 / cell 4 four-corner
   failure). **This is the cascade-order architectural call Nick
   flagged and the spec line 510-511 predicted.** The demographic
   presets are not pushing the jaw topology hard enough to
   distinguish round / square / oval / jowled at silhouette level.
   The fix lives in the demographic presets, not the timmFlat pack.
   **This is a Lloyd architectural call into Q1-W3:** does the
   cascade-order issue (pack-level pedagogy clobbered by demographic
   layers) get fixed at the cascade-merge layer (rewrite the merge
   to honor pack precedence on pedagogy fields) or at the
   demographic-preset-data layer (push the topology proportions
   harder)? Both are legitimate; I have no authority to make that
   call. **What I can say: the demographic-not-exercising-topology
   gap is visible in the renders and it does block W2 close.**

**Combined recommendation:**

Smallest path to close: **(a) Nick re-spawn for the cascade-leak fix
on cells 4/5/8/10/13/16, plus (b) Claudia sprint-re-plan promoting a
primitive-level flat-clump-disables-strand-layer toggle for cells
6/7/11, plus (c) Lloyd architectural call on whether the
demographic-data topology gap (cells 9/12/14/15 + four-corner test
failure) closes at the cascade-merge layer or the demographic-preset-
data layer.** All three are needed; none is sufficient alone.

If Claudia wants to ship-with-known-gaps and revisit in Q1-W3, the
honest framing for Gary is: *the pack ships in the 3-4 working cells
(adult-masc-square × short hair) and is known-broken in the 13
non-working cells.* That's not "shallow shipping" of a 16-cell grid;
that's shipping 3 cells with 13 marked-as-broken. The ROADMAP rule
"demographic depth > pack count" reads against this — it's better to
re-spawn the work to make the depth real than ship 3 cells called 16.

**My honest read:** the timmFlat pedagogy contract IS landing where it
gets a chance to (cells 1, 2, 3 are register-correct). The pack is not
the bug. The bugs are in the cascade plumbing + the long-hair
primitive + the demographic preset data. Worth fixing all three
because timmFlat is a high-leverage pack (Rollo's five-slot asset
case stands), but worth fixing them, not papering over.

**One escalation-flag to Gary** (per AGENTS.md "if something genuinely
needs Gary input"): the cascade-order surprise is now visible in
shipping output, not just in the architectural diagrams. This is the
moment where "pack as declarative truth" vs. "pack as overrides
asserted at render time" becomes a directional call. Lloyd's W3
architectural pass is the right venue; Gary should be aware the call
is coming. I'm not pausing work — just flagging the surface area.

---

*— Pascal, Q1-W2 sprint-close pass for the timmFlat style pack.
   Job 1 verdict: NO-SHIP at the W2 gate (3 / 16 cells at Pascal ≥ 5).
   Job 2 verdict: calibration holds.
   Sprint-close recommendation: Nick re-spawn + Claudia re-plan + Lloyd architectural call, all three.*

---

## Pass 2 — W2 revised 13-cell re-score

*Post Nick PR #4 (`recipe.suppressInteriorHairDetail` knob promotion).
Cells 6, 7, 11 out of scope this pass (W3 long-hair primitive promotion).
Calibration audit closed in Pass 1 — not re-litigated. Anchor table absolute.*

### Per-cell scoring table (13 retained)

| # | Cell                                       | Pascal | One-line read                                                                                                                                       |
| - | ------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | adult-masc-square shortSwept               | 5      | Holds; the prior trace-of-strand at the bang underside is gone, contour is uniformly clean flat fill. Register-correct Timm-masc-protagonist.       |
| 2 | adult-masc-square shortSwept dark          | 5      | Holds; dark-skin swap clean, cap reads even cleaner on dark fill without the prior incidental clump-stroke spill.                                   |
| 3 | adult-masc-square spikyShort               | 5      | Holds; spike envelope is silhouette-only now (no interior noise), 6 confident terminations. Strict cleanup vs Pass 1, score band same.              |
| 4 | adult-fem-oval bobChinLength               | 5      | **PRIMARY FIX CONFIRMED.** Bang line clean, no interior striping, parting tick reads as a confident structural pen-stroke. Bob is now Timm-register.|
| 5 | adult-fem-oval bobChinLength dark          | 5      | **PRIMARY FIX CONFIRMED.** Equivalent to cell 4 with dark-skin swap; clean and internally consistent.                                               |
| 8 | teen-masc-ovalsoft shortPomp               | 5      | **PRIMARY FIX CONFIRMED.** Pomp lift is now one closed flat mass — no sweep-stroke texture; reads as styled volume the way Timm canon wants.        |
| 9 | teen-masc-ovalsoft spikyShort dark         | 5      | Incidental cleanup bump from Pass 1 (was 4). Spike cluster confident, side-fringe tidier than before, face holds. Honest +1 vs prior.               |
|10 | teen-fem-ovalsoft bobChinLength            | 5      | **PRIMARY FIX CONFIRMED.** Clean teen bob; differentiation from cell 4 still whisper-thin (teen vs adult is hair-shape only) but the bob is register.|
|12 | child-masc-round shortSwept                | 4      | Demographic-topology gap unchanged: round cranium barely diverges from adult-square at silhouette; ears + frame doing all child work. Per anchor 3-4.|
|13 | child-fem-round bobChinLength dark         | 4      | **PRIMARY FIX (HAIR) CONFIRMED**, but child-fem demographic differentiation from cell 10 (teen-fem) remains whisper-thin. Hair clean; topology gap.  |
|14 | elder-masc-jowled shortReceding            | 4      | Hair-strand cleanup landed (scalp now uniformly clean); jowled jaw still reads as chamfered chin, not forward-protruding mass. Topology gap holds.   |
|15 | elder-masc-jowled shortReceding dark       | 4      | Same as cell 14 with dark skin; same topology-gap diagnosis. Score holds.                                                                            |
|16 | elder-fem-jowled bobChinLength             | 4      | **PRIMARY FIX (HAIR) CONFIRMED**; elder-fem face still has no age tells (no sag, no cartilage cue). Bob does all the demographic work. Topology gap. |

**Tally:** Cells at Pascal ≥ 5 (8): **1, 2, 3, 4, 5, 8, 9, 10.**
Cells at Pascal 4 (5): **12, 13, 14, 15, 16.**
**Final: 8 / 13 cells at Pascal ≥ 5.**

### Diagnosis confirmation

All six primary-fix-target cells (4, 5, 8, 10, 13, 16) read clean at
the bang line / side-curtain. Pass 1 symptom diagnosis ("interior
strand striping reading as procedural") was correct; the *mechanism*
I miscalled (it wasn't `recipe.leads` cascade-surviving — it was the
unconditional clump-stroke + sweep-stroke + cap-tone blocks in
`scaffold.ts`, no pack off-switch). See Nick PR #4 handoff for the
authoritative root-cause. Net: primitive-flag promotion was the
correct landing.

Cells 12, 14, 15 read unchanged — incidental gated-block cleanup
didn't move the demographic-topology read. Cells 13 and 16 land at 4
once the hair artifact stops dominating: the demographic-topology gap
is the dominant signal. **The Pass 1 diagnosis ("demographic data not
exercising topology") holds verbatim and routes correctly to Lloyd's
W3 Q2 demographic-preset-data fix.**

### Four-corner test — STILL FAILS, not a gate this round

Cells 1 vs 4 at 96px still read as the same broad-bottomed silhouette;
12 vs 14 still read as "two adults with different hairlines." Same
demographic-topology gap; W3 Q2 owns it. Per brief: noting for record
only.

### Pack-level verdict — NEEDS WORK (8/13 short by 5 cells)

All 5 short cells are the demographic-topology gap → Lloyd's W3 Q2
design (`research/lloyd-cascade-architecture.md`, ~50 LOC). **NOT a
Nick re-spawn need for W2** — the cascade-leak fix landed; the
remaining shortfall is W3-owned.

**Sprint-close call: strict 13/13 does NOT close, but the right
answer is ship-with-known-gaps.** Two paths:

1. **Ship W2 with known gaps; W3 closes the full grid (recommended).**
   timmFlat at register on 8/13 (all 6 primary fix targets); 5 cells
   at 4 are the demographic-topology gap, W3 Q2 closes them. Honest
   "depth > pack count" trade — W2 ships its scope, W3 ships its.
2. **Pull W3 Q2 forward into a W2 extension.** ~50 LOC Nick + Pascal
   re-score of 5 cells + tintin regression re-score per Lloyd's
   mixture-rule caveat. Saves the gate-name, not the work.

Recommend path 1 to Claudia. The brief itself flagged the
demographic-topology gap was anticipated to persist; the fix is
already W3-owned by landed design.

### No calibration drift, no mixture-rule alarm

No ≥ 5 cell fires any of the three sniff-tests. Pass 1 calibration
holds. I did not directly inspect `default` / `tintin` / `ligneClaire`
renders; trusting Nick's 50/50 byte-identical regression sweep.

### Movement signal vs Pass 1

- **Cascade-leak axis: strict progress.** Cells 4, 5, 8, 10 moved
  3 → 5 (the bob/pomp register lands). Cell 9 incidental +1 (4 → 5).
  Cell 13 moved 3 → 4 (hair clean but demographic gap dominates).
  Cell 16 held at 3 → 4 same reason. Cells 1, 2, 3 hold at 5 — no
  regression on the register-correct cells.
- **Demographic-topology axis: no change.** Cells 12, 14, 15 hold at
  4; cells 13 and 16 join the cluster post-hair-fix. Clean five-cell
  category for W3 Q2 to target.

*— Pascal, Q1-W2 revised re-score, Pass 2.
   Verdict: 8 / 13 cells at Pascal ≥ 5; box 3 strict-13/13 does NOT
   close; recommend ship-with-known-gaps + W3 Q2 row owns the
   demographic-topology gap (per Lloyd's landed design).*

---

## Pass 3 — W3 close (full 16-cell + tintin × 4)

*W3 sprint-close pass. All three W3 engine rows landed: Nick Q2
demographic-topology push (`9e03a7f`), Felix long-hair primitive
rebuild (`835148f`), Nick Q1 cascade-merge manifest (`a884a54`).
Renders: `/tmp/nick-q1-shipped/grid/`, `/grid-96/`, `/tintin-regression/`.
Scoring absolute per AGENTS.md anchor table, not delta. Calibration
audit closed in Pass 1 — not re-litigated.*

### Per-cell scoring table — full 16

| # | Cell                                       | Pascal | One-line read                                                                                                                                       |
| - | ------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | adult-masc-square shortSwept               | 5      | Holds; cusped-square jaw clean, flat hair cap reads as one closed mass with subtle hairline notch. Register-correct masc-protagonist.               |
| 2 | adult-masc-square shortSwept dark          | 5      | Holds; dark-skin swap clean, cap silhouette unchanged. Integration via shared contour weight intact.                                                |
| 3 | adult-masc-square spikyShort               | 5      | Holds; 5-spike envelope reads as deliberate Toth-direction terminations atop closed cap, no interior leak. Confident.                               |
| 4 | adult-fem-oval bobChinLength               | 5      | Q1 parting→none at slot 6 drops the prior parting tick; bob now reads as a clean uniform flat helmet. Cleaner Timm read (concur with Nick). Holds.  |
| 5 | adult-fem-oval bobChinLength dark          | 5      | Holds; equivalent to cell 4 with dark-skin swap. Clean.                                                                                              |
| 6 | adult-fem-oval longSleek                   | 5      | **FIRST-TIME ≥ 5.** Felix's flat-curtain primitive lands — single closed silhouette, flat fill, no strand field, even contour. Timm-register.       |
| 7 | adult-fem-oval longTail                    | 5      | **FIRST-TIME ≥ 5.** Same primitive; curtain + tail mass below chin reads as one shape. Integration via shared contour holds.                        |
| 8 | teen-masc-ovalsoft shortPomp               | 5      | Holds; pomp lift as one closed mass, no sweep texture. Teen frame slightly slimmer than adult-square — modest demographic differentiation now.      |
| 9 | teen-masc-ovalsoft spikyShort dark         | 5      | Holds; spike cluster confident, side-fringe tidy, face integrates.                                                                                  |
|10 | teen-fem-ovalsoft bobChinLength            | 5      | Holds; clean teen bob; teen-vs-adult differentiation now via softer chin not just hair-shape. Modest improvement, score band same.                  |
|11 | teen-fem-ovalsoft longSleek dark           | 5      | **FIRST-TIME ≥ 5.** Felix's primitive on dark-skin teen-fem; curtain clean, single silhouette, features integrate.                                  |
|12 | child-masc-round shortSwept                | 5      | **PROMOTED 4 → 5.** Q2 jaw-proportion spread lands: cranium visibly wider, ears more protruding, shorter face. Child topology now distinct.         |
|13 | child-fem-round bobChinLength dark         | 5      | **PROMOTED 4 → 5.** Round cranium reads, child face proportions distinct from cell 10 (teen-fem). Bob clean.                                        |
|14 | elder-masc-jowled shortReceding            | 5      | **PROMOTED 4 → 5.** Real jowl bulge now visible outside the cheek line, tapering to chin. Forward-protruding jowl mass — topology read lands.      |
|15 | elder-masc-jowled shortReceding dark       | 5      | **PROMOTED 4 → 5.** Equivalent to cell 14 with dark-skin swap; same jowl topology landing.                                                          |
|16 | elder-fem-jowled bobChinLength             | 5      | **PROMOTED 4 → 5.** Jowl spread now does the demographic work even with the bob — silhouette reads elder-fem distinct from cell 4 (adult-fem-oval). |

**Tally: 16 / 16 cells at Pascal ≥ 5. Strict close threshold met.**

### Four-corner re-verdict — PASSES

`/tmp/nick-q1-shipped/grid-96/four-corners.png` + individual 96px
cells. At thumbnail: cell 1 reads cusped-square, cell 4 soft-oval
with flat helmet cap, cell 12 round soft-U (visibly wider lower
cranium than cell 4), cell 14 jowled with clear gonial swell + receded
hairline. **Four distinguishable topologies at 96px.** The W2-diagnosed
demographic-topology gap mechanically closed via Q2; my Pass 2
push-back is resolved. Diagnostic closing — note positively.

### Tintin × 4 regression read

`/tmp/nick-q1-shipped/tintin-regression/sheet-tintin4.png` + individual
PNGs vs `/tmp/tintin-baseline/`. Per-cell read:

| # | Cell                                       | Read                                                                                                                       |
| - | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| 1 | tintin × adult-masc-square shortSwept      | Holds. Cusp slightly sharper (designed direction); tintin vocab — heavy brows, dot eyes, low ink density — preserved.      |
| 2 | tintin × child-fem-round bobChinLength     | Holds. Child rounder than baseline (designed direction); bob + lash + lip register intact.                                 |
| 3 | tintin × elder-masc-jowled shortReceding   | Holds. Jowl now visible (was oddly youthful pre-Q2); tintin line-density, dot eyes, hairline preserved.                    |
| 4 | tintin × adult-fem-oval bobChinLength      | Byte-identical to baseline (untouched demographic). Holds.                                                                  |

**Tintin regression verdict: HOLDS** on all 4 cells. Three cells drift
in Lloyd's designed direction (sharper / clearer demographic read);
one is byte-identical. No cell reads worse than its prior register.
**`pack.proportionScale` fallback NOT triggered** — Lloyd Q2 §debt-left
stays in BACKLOG.

### Sniff-test sweep

Walked the three sniff-tests against every ≥ 5 cell. Dead-hair test:
flat black masses are pedagogy not procedural-collapse on every cell
(including the new Felix long-hair primitive — single closed shape,
no strand field). Flat-line test: contour jitter is uniformly zero,
which IS the Timm register per Leo decision §2. Integration test:
every cell reads as one drawing via shared contour weight. **No
≥ 5 cell fires a sniff-test. Calibration holds; no recalibration.**

### Off-grid probe one-liners

- `adultFemPointed.png` — wedge-cusp chin lands cleanly on the adult-fem
  base; visibly distinct from the must-ship grid. Joker-direction
  topology reachable.
- `elderMascPear.png` — pear silhouette visible; wide bigonial + low
  ramus + bald crown reads as Penguin-class. Reachable.

Both new fixtures (per Nick Q2 design) are reachable adjacent points,
not gate-cells. Noting for record.

### Movement signal vs Pass 2 (NOT folded into score)

- **Demographic-topology axis: strict progress.** Cells 12, 13, 14, 15,
  16 moved 4 → 5 via Q2's jaw-proportion spread in `demographics.ts`.
  Five-cell category closed.
- **Long-hair primitive axis: strict progress.** Cells 6, 7, 11 moved
  2 (Pass 1) → first-time ≥ 5 via Felix's flat-curtain primitive
  rebuild. Three-cell category closed.
- **Cascade-leak axis: held.** Cells 1-5, 8-10 hold at 5 through Q1
  manifest rewrite. No regression from the `suppressInteriorHairDetail`
  → declarative `fillStyle: 'flat'` migration. Q1 architectural
  refactor preserved register.
- **Cell 4 parting axis: lateral / improvement.** Q1 cascade now
  rolls hairstyle `parting` to `'none'` at slot 6 on 8 timmFlat
  cells. Concur with Nick — cleaner Timm read; the prior structural
  parting tick was reading as a thin pedagogy hint, not a load-bearing
  cue. Bob cells (4, 5, 10, 13, 16) all read cleaner.

### Pack-level verdict — CLEAN-CLOSE (16/16)

- **16/16 cells at Pascal ≥ 5.**
- **Four-corner test PASSES.**
- **Tintin × 4 regression HOLDS.**
- **No sniff-test fires; no calibration drift.**

**W3 close verdict: CLEAN-CLOSE.** The full 16-cell timmFlat grid
closes at register, the mixture-rule tintin guard holds, and the
demographic-topology + long-hair gaps from W2 mechanically closed
via the three landed engine rows. Sprint-close gate satisfied at the
strict threshold (not "ship-with-named-gap").

**Honest framing for Gary:** the timmFlat pack now ships at Pascal-5
across full demographic depth (16 / 16). Pascal-5 is "a real pro
could plausibly have drawn this on an off day" — pro daily output,
not master register. The pack ships its scope; the next quality
ceiling (Pascal 6→7, pro-daily → confident-pro) is a separate axis
that wasn't W3's job.

*— Pascal, Q1-W3 sprint-close pass, Pass 3.
   Verdict: 16 / 16 cells at Pascal ≥ 5 + tintin × 4 holds + four-corner
   passes = CLEAN-CLOSE. W3 sprint-close gate satisfied.*
