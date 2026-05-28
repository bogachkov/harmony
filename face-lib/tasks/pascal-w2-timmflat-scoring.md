# pascal-w2-timmflat-scoring

Pascal's W2-close spawn. Two jobs in one task: score the timmFlat
16-cell grid AND run the W1-deferred calibration audit.

## Brief

Q1-W2 ship gate row 3 (timmFlat lands at quality bar across the
16-cell grid) and row 4 (Pascal calibration audit, deferred from W1
since no substantive new output existed to score) both close on
your verdict. This is the W2 sprint-close spawn.

The pack is `timmFlat` in `src/presets/styles.ts`. The rendered
16-cell grid lives at `/tmp/timmflat-out/`. Nick's grid script lives
at `face-lib/scripts/timmflat-grid.ts` — read it before scoring,
it's load-bearing for your verdict (see "spec-drift note" below).

## Two jobs

### Job 1 — Score the 16-cell grid (absolute, anchor-table-calibrated)

Per AGENTS.md, your scoring is **absolute against the anchor table**,
not delta-from-previous-render. Score each of the 16 cells against
the anchor table on your standard rubric. Output a per-cell table:

| # | Cell | Pascal | One-line read |

Plus an overall pack verdict on the standard ship/no-ship/needs-work
scale + the four-corner-test agreement-or-disagreement (Nick's call
was PASSES — agree or push back).

**Threshold:** Q1-W2 ship gate requires Pascal ≥ 5 + Rollo
"would-ship" on all 16 cells. If a cell scores below 5, name
specifically what's failing (procedural-hair sniff, stacked-features,
flat-line collapse, demographic-data not exercising topology, etc.).
That diagnosis is what Bob feeds back into Nick re-spawn OR Claudia
sprint re-plan.

### Job 2 — Calibration audit (W1-deferred)

The AGENTS.md anchor-table calibration self-check. From the W1 plan
deferral: "If Pascal scores above 5 on output that fails the
dead-procedural-hair / flat-line / features-don't-integrate sniff,
the calibration itself is the bug." Run the audit against your own
Job 1 scores: are you scoring consistently with the anchor table, or
has drift crept in?

Concretely:
- Cross-reference the 16-cell grid scores against your anchor table.
- If anything in the grid scores ≥ 5 but visibly fails the
  dead-hair / stacked / flat-line tests, your calibration is the
  bug — describe the drift direction + a recalibration proposal.
- If your grid scores track the anchor table cleanly, write a short
  "calibration holds" note. Either is a legitimate outcome.

## Spec-drift note from Nick (architectural, read before scoring)

Nick discovered during PR #3 that pack-level pedagogy knobs
(`recipe.leads = []`, `mouth.lipFullness`, `eyes.lashes`,
`eyes.lidLine`) get **clobbered by demographic layers downstream**
in the current cascade order. The `timmFlat` pack in
`src/presets/styles.ts` is the right declarative-truth statement of
Timm canon, but doesn't fully reach the renderer through the
preset → demographic → hairstyle → overrides cascade.

Nick worked around this in `face-lib/scripts/timmflat-grid.ts` by
encoding the pack's pedagogy as a `TIMM_PEDAGOGY` overrides const
that asserts the pedagogy knobs at the override layer (which DOES
win). The grid you're scoring therefore renders with the pedagogy
that the pack declared, just via the wrong cascade slot.

This matters for your verdict in two ways:
1. **Score what's rendered**, not what the pack file says. The
   renders honor the pedagogy (via overrides) so your scores reflect
   the pack-as-intended.
2. **Flag if the cascade-order issue is visible in the renders**.
   If anything looks like the pedagogy DIDN'T land (eg the pack's
   `recipe.leads = []` is supposed to mean no interior strokes but
   you see strand striping in flat shapes), tell Bob — that's the
   override-layer not catching everything Leo+Rollo specified.

The cascade-order fix itself is filed for Claudia + Lloyd (W3-class
architectural call, not your verdict to make).

## What renders to look at

- Full sheet (16 cells): `/tmp/timmflat-out/grid/sheet-full.png`
- Thumb sheet (96px): `/tmp/timmflat-out/grid-96/sheet-thumb.png`
- Four-corner test (96px): `/tmp/timmflat-out/grid-96/four-corners.png`
- Individual cells: `/tmp/timmflat-out/grid/{01..16}-*.png` and
  `/tmp/timmflat-out/grid-96/{01..16}-*.png`
- Off-grid probes (Joker / Penguin topologies via ad-hoc overrides):
  `/tmp/timmflat-out/probes/{pointed-jaw,pear-jaw}.png`. Soft probe,
  not part of the ship-gate scoring.

## Context

- `face-lib/AGENTS.md` — your role, the anchor table reference, the
  mixture rule (which `timmFlat` honors as a sibling pack).
- `face-lib/SPRINT.md` Q1-W2 ship gate rows 3 + 4 — close on your
  verdict.
- `face-lib/research/stylepack-timmFlat-spec.md` — Leo pedagogy half
  + Rollo asset half. The 16-cell grid you're scoring is from
  Rollo's must-ship list (lines 463-481).
- `face-lib/research/leo-face-integration-audit.md` — pre-pack
  audit. The eye-STOP / brow / mouth / integration verdicts predict
  what should and shouldn't land at Pascal ≥ 5 in the timmFlat
  render register.
- `face-lib/tasks/nick-timmflat-pack.md` — Nick's brief + handoff.
  His pre-Pascal flags (cells 6/7/11 fighting Timm canon at the
  engine ceiling; cascade-order surprise) are context, not
  instruction — score honestly.

## Acceptance

1. **16-cell scoring table** appended to a new
   `face-lib/research/pascal-w2-timmflat.md` (create the file).
2. **Four-corner test verdict** — agree with Nick's PASSES, or
   push back with named-failures.
3. **Calibration audit** — either "calibration holds" with reasoning
   or "drift detected" with direction + recalibration proposal.
4. **Sprint-close recommendation** — does W2 close on this grid, or
   does anything block? If a re-spawn of Nick is needed (pack-level
   value tune, not primitive promotion), name the cells + the
   specific knob changes.

## Notes

- **Examples are not targets.** Don't penalize cells for not looking
  like a specific Bruce Timm character. Score the register, not the
  match-to-image.
- **Mixture rule check.** The timmFlat pack is a SIBLING of
  default/tintin/ligneClaire. Existing packs were verified
  byte-identical pre/post PR #3 by Nick. If you find yourself
  scoring across packs to compare, note it but stay focused on the
  timmFlat verdict.
- **AGENTS.md "share every render."** Your scoring output goes into
  your research doc; Bob shares the sheet with Gary either way.
  Score honestly — if the pack ships at 5-6 range, say so; if it's
  hitting 7-8 say that; don't pad either direction.

## Handoff

(Pascal fills in on completion.)
