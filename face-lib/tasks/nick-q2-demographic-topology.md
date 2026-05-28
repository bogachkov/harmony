# nick-q2-demographic-topology

Nick's W3 Wave-1 first row. Implement Lloyd's Q2 design — push the
demographic jaw-topology spread in `demographics.ts` so that child-
round / adult-square / elder-jowled actually diverge at silhouette
level. Closes the 5 short cells (12, 13, 14, 15, 16) that held W2 at
8/13.

## Brief

Pascal Pass 2 (`research/pascal-w2-timmflat.md` §Pass 2) landed
8/13 cells ≥ 5; the 5 short cells all trace to one root cause: the
demographic-topology gap. Adult-square, child-round, and elder-
jowled produce similar broad-bottomed silhouettes at 96px because
the data layer in `src/presets/demographics.ts` doesn't push the
topology builders hard enough — the dispatcher in
`scaffold.ts:330-339` routes to six distinct builders that DO
diverge, but the data feeding them is flat.

Lloyd's W2 design pass (`research/lloyd-cascade-architecture.md`
§Q2) named the fix: edit `demographics.ts` jaw proportions across
child / masculine / elder. Sized at ~50 LOC. Half-day plus tuning.

Per Lloyd's recommended order: **land Q2 before Q1.** Smaller, no
architectural risk, gives Pascal an early signal on whether the
data-layer push closes the topology gap.

## What to change

Lloyd's design lists the specific deltas (`research/lloyd-cascade-
architecture.md` §Q2 §Pick):

- `child.jaw`: `bigonialWidth 0.55 → 0.62`, `mentalWidth 0.55 → 0.60`.
  Preserves no-cusp identity, widens the envelope.
- `masculine.jaw`: `bigonialWidth 0.82 → 0.86`, `mentalWidth 0.46 →
  0.42`, `gonialAngle 0.25 → 0.18`. Sharper cusp, Bridgman direction.
- `elder.jaw`: `bigonialWidth 0.70 → 0.74`, `jowl 0.38 → 0.48`.
  `jowl` is what `buildJowledJaw` amplifies on — load-bearing change.

Plus the private demographic-data fixtures folding in Rollo's BACKLOG
`pointed` / `pear` row:

- `elderMascPear` (private fixture, NOT a new age/presentation —
  avoids combinatorial pack-expansion).
- `adultFemPointed` (private fixture, same).

These are off-grid probes the grid script opts into. They are NOT
new public enum additions to `ages` / `presentations`.

Lloyd's exact words: "Fold Rollo's BACKLOG `pointed`/`pear` row as
two private demographic-data fixtures (NOT new ages/presentations,
avoids combinatorial pack-expansion). Grid script opts in for off-
grid probes."

These numbers are starting points. Tune against re-rendered timmFlat
cells 12, 13, 14, 15, 16 until the four-corner silhouettes diverge
visibly at 96px. Don't over-tune — the goal is "child reads child,
elder reads elder, adult-square reads adult-square at thumbnail."
Pascal calls the final score; you call when your own eye says the
topology is diverging.

## Mixture-rule guard

**This change WILL drift existing `tintin × demographic` renders.**
Lloyd was explicit: not byte-identical. Acceptable per Lloyd's
judgment — prior values were calibrated against `tintin`'s interior-
line-density masking the topology weakness; new spread is in the
direction of every pack's demographic read.

**Regression guard:** when you re-render, also re-render 4
representative `tintin × demographic` cells (e.g., `tintin × adult-
masc-square shortSwept`, `tintin × child-fem-round bobChinLength`,
`tintin × elder-masc-jowled shortReceding`, `tintin × adult-fem-
oval longSleek`). Pascal will re-score these alongside the timmFlat
grid (`tasks/pascal-w3-close-rescore.md`).

If your eye says any of the 4 `tintin` cells reads worse than its
prior `tintin` register — flag to Bob, don't push the numbers
further. Pascal may call us back with the fallback: a
`pack.proportionScale?: number` knob (Lloyd Q2 §debt-left). Don't
build that fallback preemptively; only if Pascal's regression check
fires.

## Concrete acceptance

1. **`demographics.ts` edited** with the three jaw-proportion deltas
   above. Each delta should have a one-line comment naming the
   reasoning (`// W3 Q2 — widen bigonial envelope for round-vs-
   square divergence`).
2. **Two private fixtures landed** (`elderMascPear`,
   `adultFemPointed`) — naming/location follows whatever pattern
   exists for private demographic fixtures in the file (or if there
   isn't one, drop them at the bottom of `demographics.ts` with a
   comment marking them as private off-grid probes).
3. **Grid script opt-in** for the two private fixtures. Off-grid
   probe sheet rendered. Existing on-grid renders use the public
   `ages` × `presentations` matrix only — don't touch the on-grid
   layout.
4. **Re-render timmFlat × 16-cell grid.** ALL 16 cells, not just
   the 5 short ones. Variety rule per AGENTS.md.
5. **Re-render `tintin × 4` regression cells.** Specific cells named
   above (or pick equivalent variety per AGENTS.md). Save next to
   the timmFlat output.
6. **Honest pre-Pascal sniff test.** Same discipline as PR #3 / PR
   #4 — read each re-rendered cell, share with Bob even if you're
   not happy. Bob will spawn Pascal on your output.
7. **Mixture rule on `default` + `ligneClaire`.** Verify byte-
   identical against the prior baseline. Only `tintin` is expected
   to drift; if `default` or `ligneClaire` move, something else
   leaked — flag to Bob.

## Constraints

- **Examples are not targets.** Don't tune until cell 14 "looks like
  Alfred." Tune until child / adult / elder topologies are visibly
  different at silhouette. Pascal scores the register, not match-
  to-character.
- **Variety in test rotation.** Render ALL 16 timmFlat cells, not
  just the 5 short ones. Don't render just `tintin × 4` for the
  regression check — render the same 4 demographic combos against
  timmFlat AND against tintin to compare.
- **Push back on the brief if it's wrong.** If you find a delta
  Lloyd named that doesn't actually move the topology builder in
  the expected direction (e.g., the `mentalWidth` change does
  nothing because some other parameter dominates), surface to Bob.
  Don't silently invent your own deltas — that's PM territory.
- **Don't touch Q1 (cascade-merge manifest) in this PR.** That's
  the next Wave-1 row. Keep this PR scoped to demographic-data
  edits + two private fixtures + grid-script opt-in.
- **Don't touch the long-hair primitive.** That's Wave 2, conditional
  owner.
- **Lane discipline:** Lloyd's design is the architecture. You
  implement to it. If you find the design wrong, surface to Bob —
  Lloyd is reachable and Bob can re-spawn him for a touch-up rather
  than you re-deriving the architecture in this PR.

## Context

- `face-lib/research/lloyd-cascade-architecture.md` §Q2 — Lloyd's
  full design with the proportion deltas, the private-fixture call,
  the mixture-rule caveat, and the sizing. **Read first.**
- `face-lib/research/pascal-w2-timmflat.md` §Pass 2 — Pascal's W2
  Pass 2 read on the 5 short cells. **The cells you're trying to
  move from 4 to ≥ 5: 12 (child-masc-round shortSwept), 13 (child-
  fem-round bobChinLength dark), 14 (elder-masc-jowled
  shortReceding), 15 (elder-masc-jowled shortReceding dark), 16
  (elder-fem-jowled bobChinLength).**
- `face-lib/src/presets/demographics.ts` — the file you're editing.
- `face-lib/src/model/scaffold.ts` lines 330-339 — the topology
  dispatcher Lloyd cites. Read to understand which builder each
  topology value routes to.
- `face-lib/scripts/timmflat-grid.ts` — grid script. Add opt-in for
  the two private fixtures.
- `face-lib/BACKLOG.md` — the deferred `pointed` / `pear` jaw
  topology row now references this task.
- `face-lib/SPRINT.md` — W3 acceptance row this closes (Q2 box).
- `face-lib/tasks/nick-cascade-leak-fix.md` — PR #4 handoff; the
  `suppressInteriorHairDetail` flag stays in place for now (Q1 row
  removes it after this PR lands).

## Handoff

(Nick fills in on completion. At minimum: per-cell pre-Pascal
sniff-test reads for the 16 timmFlat cells + 4 tintin regression
cells, render paths under `/tmp/timmflat-out/grid/` and
`/tmp/timmflat-out/probes/`, mixture-rule verification on
`default` / `ligneClaire`, any `tintin` drift you notice.)
