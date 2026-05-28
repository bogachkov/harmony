# pascal-w3-close-rescore

Pascal's W3 close pass. Re-score the FULL 16-cell timmFlat grid
against the AGENTS.md anchor + a 4-cell `tintin × demographic`
regression check per Lloyd's mixture-rule caveat. Closes the W3
sprint.

## Brief

W3 has three engine rows landing in this order:

1. **Q2 — demographic-topology** push in `demographics.ts`
   (`tasks/nick-q2-demographic-topology.md`). Targets the 5 cells
   that held W2 at 4 (cells 12, 13, 14, 15, 16).
2. **Q1 — cascade-merge hybrid manifest** with `pack.declares`
   (`tasks/nick-q1-cascade-merge-manifest.md`). Subsumes Nick PR
   #4's `suppressInteriorHairDetail` flag. Architectural lock-in,
   not aimed at moving any specific Pascal cell.
3. **Long-hair primitive rebuild** (`tasks/felix-longhair-primitive-
   rebuild.md`). Targets cells 6, 7, 11 (the ones dropped from W2).
   Owned by Felix, the new graphics-domain senior (David approved
   the hire in commit `9db6566`; AGENTS.md §Felix).

When all three have landed and re-rendered, you close W3 by
scoring the full 16-cell grid plus a regression check on `tintin`.

## Job

**Score all 16 timmFlat cells absolute against the AGENTS.md
anchor table.** Delta-from-Pass-2 is movement signal only, not
folded into the score. Per AGENTS.md, the anchor table is the
calibration; the sniff-tests (dead procedural hair / flat-line /
features-don't-integrate) remain register-sensitive per your Pass 1
calibration audit.

The 16 cells (full grid, none deferred this round):

| # | Cell                                      |
| - | ----------------------------------------- |
| 1 | adult-masc-square shortSwept              |
| 2 | adult-masc-square shortSwept dark         |
| 3 | adult-masc-square spikyShort              |
| 4 | adult-fem-oval bobChinLength              |
| 5 | adult-fem-oval bobChinLength dark         |
| 6 | adult-fem-oval longSleek                  |
| 7 | adult-fem-oval longTail                   |
| 8 | teen-masc-ovalsoft shortPomp              |
| 9 | teen-masc-ovalsoft spikyShort dark        |
|10 | teen-fem-ovalsoft bobChinLength           |
|11 | teen-fem-ovalsoft longSleek dark          |
|12 | child-masc-round shortSwept               |
|13 | child-fem-round bobChinLength dark        |
|14 | elder-masc-jowled shortReceding           |
|15 | elder-masc-jowled shortReceding dark      |
|16 | elder-fem-jowled bobChinLength            |

**Plus a 4-cell `tintin × demographic` regression check** per
Lloyd's mixture-rule caveat (`research/lloyd-cascade-architecture.md`
§Q2 §Mixture-rule check). The Q2 demographic-data push WILL drift
existing `tintin` renders (not byte-identical). Pascal verifies the
drift doesn't push `tintin` below its prior register.

The 4 tintin cells (Nick will have rendered these alongside the
timmFlat grid):

- `tintin × adult-masc-square shortSwept`
- `tintin × child-fem-round bobChinLength`
- `tintin × elder-masc-jowled shortReceding`
- `tintin × adult-fem-oval longSleek`

(Or equivalent variety if Nick picked different cells — check the
handoff. The principle: 4 demographic-spread cells across the
ages × topology axes.)

## Acceptance for W3 close

- **Strict close: Pascal ≥ 5 on all 16 timmFlat cells.** timmFlat
  closes at full demographic depth, the original 16-cell spec
  satisfied. W3 closes clean.
- **Accept-with-known-gaps close: Pascal ≥ 5 on at least 13/16,
  with the remaining gap traced to a single named root cause
  filable to BACKLOG for W4+.** Calibration discipline: don't
  paper over a real gap. If the gap is a known engine limitation
  (e.g., features-as-decals integration debt biting cells 9/12
  even after Q2 lands), file it; let Claudia decide whether to
  promote it to W4 or hold.
- **Anything below 13/16 is NEEDS-WORK** — surface to Bob; Claudia
  re-plans W3 close (extend or accept narrower).

**Tintin regression acceptance:** all 4 tintin cells hold at their
prior register. If any cell reads worse than the equivalent cell
under the pre-W3 baseline, flag for Bob / Lloyd / Claudia to
trigger the `pack.proportionScale` fallback per Lloyd's Q2 §debt-
left.

## What you should NOT do this round

- **Do not re-litigate the calibration audit.** Your Pass 1
  verdict (`research/pascal-w2-timmflat.md` §Calibration) was
  "calibration holds." Pass 2 re-affirmed (no drift detected).
  Don't re-open unless your sniff-tests on the W3 renders fire on
  a ≥ 5 cell — in which case you propose a recalibration per the
  audit discipline.
- **Do not re-litigate the four-corner test as a separate gate.**
  The four-corner test was the W2 diagnostic that pointed at the
  demographic-topology gap. W3 Q2 IS the engine work that addresses
  it. If the four corners now diverge cleanly, that's the diagnostic
  closing — note it positively. If they still collapse despite Q2,
  the topology data push didn't go far enough — surface to Claudia
  (the `pack.proportionScale` fallback may need to land).
- **Do not score off-grid probes** unless something has materially
  changed about them (e.g., Q2's `elderMascPear` / `adultFemPointed`
  private fixtures appear in the probe sheet — those are NEW
  fixtures Nick added per Lloyd's Q2 design and worth a one-line
  read each, but not part of the W3 close gate).
- **Do not score the `default` or `ligneClaire` packs.** Q1
  manifest preserves them byte-identical (default `declares: []`
  → no-op late pass). If they drift, that's a Q1 implementation
  bug — Bob surfaces. Your lane is timmFlat + the tintin
  regression check.

## What to flag

- **Regression on cells 1-5, 8-10 (the W2 Pass 2 ≥ 5 set).** Those
  cells were register-correct in Pass 2; W3's three landings should
  not move them down. If any drops below 5, the manifest deletion
  of `suppressInteriorHairDetail` (Q1) didn't fully cover the
  pedagogy, OR the long-hair primitive rebuild touched something
  it shouldn't have. Surface to Bob.
- **Tintin cells reading worse than prior baseline.** Trigger for
  `pack.proportionScale` fallback per Lloyd Q2 §debt-left. Don't
  score it as "still 5" if it actually reads worse — calibration
  discipline.
- **Long-hair cells (6, 7, 11) still showing the strand artifact.**
  The primitive rebuild didn't fully land. Surface to Bob; engineer
  may need a re-spawn.
- **`default` or `ligneClaire` drift if you incidentally see it.**
  Not in your gate, but the mixture rule is load-bearing —
  byte-identical means byte-identical.
- **Anything that earns Pascal ≥ 5 but fires the sniff-tests.**
  Calibration audit branch: propose recalibration.

## Render paths

Nick (and possibly the new graphics-domain role for the long-hair
row) will have re-rendered:

- 16-cell full composite: `/tmp/timmflat-out/grid/sheet-full.png`
- 16-cell thumb composite (96px): `/tmp/timmflat-out/grid-96/sheet-thumb.png`
- Four-corner test (cells 1/4/12/14 at 96px): `/tmp/timmflat-out/grid-96/four-corners.png`
- Individual cells: `/tmp/timmflat-out/grid/{01-16}-*.png` and `/tmp/timmflat-out/grid-96/{01-16}-*.png`
- Off-grid probes (`elderMascPear`, `adultFemPointed`): `/tmp/timmflat-out/probes/*.png`
- Tintin regression 4-cell sheet: `/tmp/timmflat-out/tintin-regression/sheet.png` (or equivalent — check handoffs)

Cross-check Bob's hand-off note for the actual paths if Nick changed
them.

## Acceptance summary

1. **16-cell scoring table** appended to
   `research/pascal-w2-timmflat.md` as a new section titled
   `## Pass 3 — W3 close re-score on full 16-cell grid`. Include
   the cells 6/7/11 reads (now first-time-scored post-primitive-
   rebuild).
2. **4-cell tintin regression read** appended in the same Pass 3
   section. Per-cell one-line read; overall verdict (HOLDS /
   REGRESSED / IMPROVED).
3. **Overall W3 close verdict** — CLEAN-CLOSE (16/16) /
   ACCEPT-WITH-NAMED-GAP (13-15/16 with the gap traced to single
   root cause) / NEEDS-WORK (< 13/16).
4. **Flagged regressions / surprises** per "What to flag" above.
5. **No new calibration audit needed** unless a sniff-test fires
   on a ≥ 5 cell.

## Constraints + reminders

- **Examples are not targets.** Score the register, not the match-
  to-Bruce-Timm-character. Per AGENTS.md.
- **Variety in test rotation.** You're scoring the full 16-cell
  grid plus 4 tintin cells plus a quick read on the 2 off-grid
  probe fixtures. That's the full W3 variety surface.
- **AGENTS.md "share every render."** Bob shares the re-rendered
  sheets with Gary either way. Score honestly.

## Context

- `face-lib/research/pascal-w2-timmflat.md` — your prior W2 close
  + Pass 2 re-score. **Append, don't rewrite.**
- `face-lib/research/lloyd-cascade-architecture.md` §Q2 §Mixture-
  rule check — the tintin regression caveat that triggers the
  4-cell check.
- `face-lib/SPRINT.md` — Q1-W3 acceptance rows this closes.
- `face-lib/tasks/nick-q2-demographic-topology.md` — Q2
  implementation handoff.
- `face-lib/tasks/nick-q1-cascade-merge-manifest.md` — Q1
  implementation handoff.
- `face-lib/tasks/felix-longhair-primitive-rebuild.md` — long-hair
  primitive rebuild handoff (Felix's first spawn).
- `face-lib/AGENTS.md` — your role, anchor table.

## Handoff

(Pascal fills in on completion.)
