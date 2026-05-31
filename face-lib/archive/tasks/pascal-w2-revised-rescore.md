# pascal-w2-revised-rescore

Pascal's W2 re-score on the revised 13-cell timmFlat grid post Nick's
cascade-leak fix (PR #4). Closes the revised W2 ship gate box 3.

## Brief

Q1-W2 was re-planned post your NO-SHIP verdict. Claudia's W2 re-plan
(`tasks/claudia-q1w2-replan-pascal-no-ship.md`) decided:

- **Ship in W2:** a 13-cell timmFlat grid (drop cells 6, 7, 11 — the
  long-hair primitive ceiling, sliding to W3 promotion).
- **Land in W2:** Nick's cascade-leak fix (PR #4, smallest of the
  three failure clusters per your sprint-close reco) and Lloyd's
  architectural design pass (covering both the cascade-merge question
  and the demographic-topology gap; design only, no implementation).
- **Slide to W3:** long-hair primitive promotion (your cells 6/7/11),
  cascade-merge implementation (per Lloyd's design), demographic-
  preset push (per Lloyd's design).

Your re-score closes box 3 of the revised gate. Lloyd's design closes
box 5 (separately). Nick's PR #4 is the prerequisite for your re-score.

## What's changed since your W2 close pass

- Nick re-spawned on the cascade-leak (see
  `tasks/nick-cascade-leak-fix.md`). His brief gave him fallback
  authority to promote a `recipe.suppressLeads: true` primitive knob
  if extending the `TIMM_PEDAGOGY` override const didn't catch the
  artifact. His handoff (when you read this) will name which path he
  took and why. **Read his handoff before re-scoring.**
- Render outputs: same `/tmp/timmflat-out/` paths, re-rendered. The
  revised sheet drops cells 6, 7, 11.

## Job

**Score the 13 retained cells absolute against the AGENTS.md anchor
table.** Per AGENTS.md, your scoring is delta-from-previous-render
agnostic — anchor table only. Output a per-cell table for the 13 cells:

| # | Cell | Pascal | One-line read |

The 13 retained cells:

| # | Cell                                      |
| - | ----------------------------------------- |
| 1 | adult-masc-square shortSwept              |
| 2 | adult-masc-square shortSwept dark         |
| 3 | adult-masc-square spikyShort              |
| 4 | adult-fem-oval bobChinLength              |
| 5 | adult-fem-oval bobChinLength dark         |
| 8 | teen-masc-ovalsoft shortPomp              |
| 9 | teen-masc-ovalsoft spikyShort dark        |
|10 | teen-fem-ovalsoft bobChinLength           |
|12 | child-masc-round shortSwept               |
|13 | child-fem-round bobChinLength dark        |
|14 | elder-masc-jowled shortReceding           |
|15 | elder-masc-jowled shortReceding dark      |
|16 | elder-fem-jowled bobChinLength            |

**Acceptance for the revised W2 ship gate:**
- All 13 cells at Pascal ≥ 5 → **SHIP**, W2 box 3 closes.
- Any cell below 5 → name what's failing and which failure cluster
  (cascade-leak still showing despite Nick's fix → Nick re-spawn
  again; demographic-topology gap reading worse than at original W2
  close → flag to Claudia; new failure mode → flag to Bob).

## What you should NOT do this round

- **Do not re-litigate the calibration audit.** Your Job 2 verdict
  in `research/pascal-w2-timmflat.md` was "calibration holds." The
  W1-deferred outcome closed. Don't re-open.
- **Do not re-litigate the four-corner test.** Your pushback on
  Nick's PASSES was correct; the demographic-topology gap is filed
  for Lloyd's W2 design + W3 Nick implementation. The four-corner
  test on the revised grid (cells 1, 4, 12, 14) will likely STILL
  FAIL on the demographic-topology axis — that's expected and
  acknowledged. **Do not block the W2 close on the four-corner
  test this round.** Note your read for the record, but the gate
  is per-cell Pascal ≥ 5, not the four-corner test.
- **Do not score cells 6, 7, 11.** They are dropped from the W2
  grid pending the long-hair primitive promotion (BACKLOG row,
  W3 first Nick row). Scoring them again before the primitive
  lands wastes a spawn.
- **Do not score off-grid probes.** The pointed-jaw / pear-jaw
  probes you already covered in `research/pascal-w2-timmflat.md`.
  No new probe scoring needed.

## What to flag

- **If cells 4, 5, 8, 10, 13, 16 still show interior strand striping**
  (the original cascade-leak symptom), Nick's fix didn't land
  cleanly. Surface to Bob — could be a Nick-re-re-spawn (try Option
  B or C of his brief) or a Claudia re-plan call. Don't fix in
  place — Pascal's lane.
- **If cells 1, 2, 3 regressed from your Pascal-5 reading**, that's
  a serious finding — Nick's fix shouldn't have touched the
  register-correct cells. Surface to Bob immediately.
- **If cells 9, 12, 14, 15 read worse than at original W2 close
  (sub-4),** the demographic-topology gap is getting WORSE rather
  than holding at 4 — that's an unexpected interaction. Surface to
  Lloyd (still doing design work; this is data for his pass).
- **If anything passes Pascal ≥ 5 but fires the dead-procedural-hair
  / flat-line / features-don't-integrate sniff** — the calibration
  audit you filed said it holds; if a re-score finds drift, that's
  the legitimate "drift detected" branch of the audit and you
  should propose a recalibration. (Unlikely given Nick's fix is
  targeted, but the audit discipline remains live.)

## Acceptance

1. **13-cell scoring table** appended to a new section in
   `research/pascal-w2-timmflat.md` titled `## Job 3 — W2 re-score
   on revised 13-cell grid`.
2. **Overall ship verdict** — SHIP / NEEDS-WORK / NO-SHIP on the
   revised W2 gate.
3. **Flagged regressions or surprises** — see "What to flag" above.
4. **No new calibration audit needed** — Job 2 closed.

## Constraints + reminders

- **Examples are not targets.** Per AGENTS.md. Score the register,
  not the match-to-Bruce-Timm-character.
- **Mixture rule check.** timmFlat is a sibling of default / tintin
  / ligneClaire. If you scored across packs, note it but stay
  focused on timmFlat. Nick's PR #4 must preserve byte-identical on
  the other three packs; if you see a render change on default /
  tintin / ligneClaire when scrolling through outputs, that's a
  serious mixture-rule violation — flag to Bob.
- **AGENTS.md "share every render."** Bob shares the re-rendered
  13-cell sheet with Gary either way. Score honestly.

## Context

- `face-lib/research/pascal-w2-timmflat.md` — your prior W2 close
  pass. **Append, don't rewrite.**
- `face-lib/SPRINT.md` — Q1-W2 revised ship gate (box 3 closes on
  your re-score).
- `face-lib/tasks/claudia-q1w2-replan-pascal-no-ship.md` — Claudia's
  re-plan; explains why the grid shrank from 16 to 13.
- `face-lib/tasks/nick-cascade-leak-fix.md` — Nick's PR #4 brief +
  handoff. **Read his handoff first — it names which fix path he
  took.**
- `face-lib/AGENTS.md` — your role, anchor table.
- Render paths: `/tmp/timmflat-out/grid/sheet-full.png`,
  `/tmp/timmflat-out/grid-96/sheet-thumb.png`,
  `/tmp/timmflat-out/grid-96/four-corners.png`. Cells 6/7/11 are
  either omitted or clearly marked as deferred.

## Handoff

### Verdict — NEEDS-WORK / SHIP-WITH-KNOWN-GAPS

**8 / 13 cells at Pascal ≥ 5.** Box 3 strict-13/13 does NOT close.
But the right call is probably **ship-with-known-gaps**, not a third
W2 Nick spawn — the 5 short cells are exactly the demographic-topology
gap Lloyd's W3 Q2 row already owns (~50 LOC in demographic preset data).

### Per-cell summary

- **Pascal ≥ 5 (8 cells):** 1, 2, 3, 4, 5, 8, 9, 10.
- **Pascal 4 (5 cells):** 12, 13, 14, 15, 16. All demographic-topology gap.

### Six primary fix targets — all confirmed clean

Cells 4, 5, 8, 10, 13, 16 all show clean flat-fill hair with no
interior strand striping at the bang line. Nick's PR #4 fully landed
the symptom Pascal Pass 1 named. Cells 4, 5, 8, 10 land at ≥ 5
(scoring honestly against the anchor). Cells 13 and 16 land at 4
because the demographic-topology gap dominates the read once the
hair is clean — child-fem barely differentiated from teen-fem,
elder-fem has no age tells.

### Four-corner test — still fails per the demographic-topology gap

Per brief, this was acknowledged in advance as expected-to-fail
without blocking. Noted; not a gate.

### What I'm flagging

- **No regression on the previously register-correct cells (1, 2, 3).**
  Hold at 5; the gated clump-stroke removal actually cleaned up the
  trace-of-strand at the bang underside, marginal cleanup not a bump.
- **No calibration drift.** No ≥ 5 cell fires any of the three
  sniff-tests. Pass 1 calibration holds.
- **No mixture-rule violation observed.** I did not directly inspect
  `default` / `tintin` / `ligneClaire` renders this pass; trusting
  Nick's 50/50 byte-identical regression sweep on the diff math.
- **Incidental cleanup bump:** cell 9 (teen-masc spikyShort dark)
  moved from Pass 1 = 4 to Pass 2 = 5. The gated clump-stroke
  removal incidentally tidied a side-fringe artifact I'd called out;
  honest +1.
- **Diagnosis confirmation for Pass 1:** my "cascade-leak" symptom
  framing was right; my mechanism guess (`recipe.leads` surviving
  cascade) was upstream of the true root cause (unconditional
  clump-stroke + sweep-stroke + cap-tone blocks). Nick's handoff is
  the authoritative diagnosis.

### Recommendation to Claudia

**Path 1 (recommended): ship W2 with known gaps; W3 Q2 row closes
the full 13/13.** Honest framing for Gary: cascade-leak fix landed
clean (8 cells register-correct including all 6 primary fix
targets); 5 cells held at Pascal 4 are the demographic-topology
gap, W3 Q2 row closes them at ~50 LOC in the demographic preset
data per Lloyd's landed design.

**Path 2: pull Lloyd's W3 Q2 row forward into a W2 extension.**
~50 LOC Nick work + a Pascal re-score of 5 cells + tintin
regression re-score per Lloyd's mixture-rule caveat. Half-day
to a day. Saves the gate-name, not the work.

Full per-cell table + diagnosis + recommendation at
`research/pascal-w2-timmflat.md` §Pass 2.

*— Pascal, Q1-W2 revised re-score, Pass 2.*
