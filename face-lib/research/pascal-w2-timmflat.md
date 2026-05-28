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
