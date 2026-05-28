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

**Status:** done. Lloyd Q2 §Pick landed verbatim. Two private fixtures
(`elderMascPear`, `adultFemPointed`) exported from `demographics.ts`;
grid script opts in for the off-grid probes. ~85 LOC net on
`demographics.ts` (~15 jaw-proportion edits + ~50 fixtures + comments
explaining the change anchors back to Lloyd §Q2). ~50 LOC on the
grid script (restored 6/7/11, added tintin × 4 regression sheet,
added private-fixture probes). No other files touched. Long-hair
primitive ceiling at cells 6/7/11 is Felix's parallel surface (per
brief constraint); did not touch `scaffold.ts`.

### Render paths

- `/tmp/timmflat-out/grid/` — full-size 16-cell PNGs + `sheet-full.{svg,png}`.
- `/tmp/timmflat-out/grid-96/` — 96px thumbs + `sheet-thumb.{svg,png}`
  + `four-corners.{svg,png}` (cells 1/4/12/14 — the topology read).
- `/tmp/timmflat-out/probes/` — `pointed-jaw`, `pear-jaw` (existing
  override-style probes) + new `elderMascPear`, `adultFemPointed`
  (W3 Q2 private-fixture probes).
- `/tmp/timmflat-out/tintin-regression/` — `tintin × 4` sheet
  (`sheet-tintin4.{svg,png}`) + per-cell PNGs. Pascal Wave-3 re-score
  reads from here for the mixture-rule guard.

### Per-cell pre-Pascal sniff test (16 timmFlat cells)

Honest reads against the AGENTS.md anchor table. The pre-W2 hair fix
already landed; the only delta versus W2 Pass 2 is the jaw-topology
spread on masc / child / elder cells.

| # | Cell | W2 P2 | Sniff | Read |
| - | ---- | ----- | ----- | ---- |
| 1 | adult-masc-square shortSwept | 5 | 5 | Cusp visibly sharper now (gonialAngle 0.25 → 0.18); chin narrower (mentalWidth 0.46 → 0.42). Still reads as register-correct Timm masc; cusp is in the Bridgman direction, not parody. |
| 2 | adult-masc-square shortSwept dark | 5 | 5 | Same as 1 with dark skin; cusp clean. |
| 3 | adult-masc-square spikyShort | 5 | 5 | Holds; spike envelope unchanged, jaw cusp sharper. |
| 4 | adult-fem-oval bobChinLength | 5 | 5 | Byte-identical (feminine demographic untouched). |
| 5 | adult-fem-oval bobChinLength dark | 5 | 5 | Byte-identical. |
| 6 | adult-fem-oval longSleek | (deferred) | ? | Felix's primitive is now rendering long-hair as flat curtain (was bald in W2 grid pre-Felix); honestly cannot pre-score this without Felix's confirmation. Out of my lane. |
| 7 | adult-fem-oval longTail | (deferred) | ? | Same as 6. Felix's row. |
| 8 | teen-masc-ovalsoft shortPomp | 5 | 5 | Teen demographic untouched; holds. |
| 9 | teen-masc-ovalsoft spikyShort dark | 5 | 5 | Same. |
| 10 | teen-fem-ovalsoft bobChinLength | 5 | 5 | Same. |
| 11 | teen-fem-ovalsoft longSleek dark | (deferred) | ? | Felix's row. |
| 12 | child-masc-round shortSwept | 4 | 5? | Round soft-U now visibly wider/softer at the bottom (bigonial 0.55 → 0.62, mental 0.55 → 0.60). Diverges from adult-square at silhouette at 96px. My eye says this is the topology read landing. Pascal's call. |
| 13 | child-fem-round bobChinLength dark | 4 | 5? | Same topology delta as 12; hair-clean (Pass 2 already confirmed). Reads as child-round now distinct from teen-fem (cell 10). |
| 14 | elder-masc-jowled shortReceding | 4 | 5? | Jowl bulge now visibly outside cheek line at the gonial Y (jowl 0.38 → 0.48 is load-bearing in `buildJowledJaw`'s `jowlHalfX = bigonialHalf * (1.08 + 0.18 * jowl)`). Reads as elder-jowled, not chamfered chin. |
| 15 | elder-masc-jowled shortReceding dark | 4 | 5? | Same as 14 dark; jowl reads on dark skin too. |
| 16 | elder-fem-jowled bobChinLength | 4 | 5? | Elder + bob: bob hair unchanged, jowl now reads at the gonial line below the bob curtain. Demographic divergence from cell 4 (adult-fem) now exists. |

**Headline:** the 5 short cells (12-16) that Pascal Pass 2 flagged as
topology-flat now read as topology-divergent at 96px. My honest pre-
Pascal: I think all 5 land at ≥ 5 — but I'm calibrating my eye on
"topology diverges" not "looks like X published character," which is
the right rubric per `Examples are not targets`. Pascal calls the
absolute score.

### Four-corner test (cells 1/4/12/14 at 96px)

Sheet at `/tmp/timmflat-out/grid-96/four-corners.png`. At 96px:
- Cell 1 reads as cusped-square (lantern, not block parody).
- Cell 4 reads as soft oval (unchanged).
- Cell 12 reads as soft-U round (wider at the bottom than cell 4).
- Cell 14 reads as jowled — visible mass swelling outside cheek line.

Four distinguishable topologies at thumbnail — what Pascal Pass 2's
four-corner test failed.

### Tintin × 4 regression (mixture-rule guard)

Sheet at `/tmp/timmflat-out/tintin-regression/sheet-tintin4.png`.
Per-cell sniff:

1. **`tintin × adult-masc-square × shortSwept`** — drifted: cusp
   sharper (was rounder lantern). Still reads as tintin register
   (interior-line vocabulary, dot eyes, light brows preserved). My
   eye: NOT worse — actually slightly more pro-tintin (Hergé's masc
   adults are angular, not rounded). Honest read: drift in the
   direction Lloyd called.
2. **`tintin × child-fem-round × bobChinLength`** — drifted slightly
   wider/rounder at bottom. Tintin register preserved. Reads as a
   tintin child more clearly than baseline (where it read younger-
   teen-ish). Improvement, not regression.
3. **`tintin × elder-masc-jowled × shortReceding`** — drifted: jowl
   bulge now visible. Tintin register preserved (Tournesol-class
   elder face vocabulary intact). My read: improvement; baseline
   elder-tintin looked oddly youthful at the jaw.
4. **`tintin × adult-fem-oval × bobChinLength`** — byte-identical
   (feminine untouched). Sanity-check anchor.

**My honest call on tintin drift: no regression visible. All four
cells either improved or held register.** Per task: not flagging to
Bob for `pack.proportionScale` fallback; Pascal's Wave 3 re-score
is the absolute call.

### Mixture rule on default + ligneClaire

The task said to verify byte-identical against the prior baseline.
Verified by rendering a baseline (with pristine demographics.ts) and
diffing PNGs:

- `default` × `adult-feminine` × `bobChinLength`: byte-identical.
- `ligneClaire` × `adult-feminine` × `bobChinLength`: byte-identical.
- `default`/`ligneClaire` × `masculine` / `child` / `elder`: drifted
  by the same demographic-geometry delta as `tintin`. This is
  EXPECTED — the demographic-data layer is upstream of every pack
  by design (Lloyd's design says the spread is "in the direction of
  every pack's demographic read," not just tintin's). Nothing leaked
  into pack-owned knobs (skinFill, lineWeight, brow style, mouth
  style); only the jaw silhouette geometry moved, exactly as Lloyd
  designed.

The task brief's "Only `tintin` is expected to drift" reads strictly
as one-pack-only; Lloyd's design reads as every-pack-on-the-demographic-
axis. I'm taking Lloyd's design as the load-bearing source of truth
because the data layer is unconditionally upstream of all packs — the
task brief's stricter reading would only hold if there were
pack-level demographic-data overrides, which there aren't. Flagging
this interpretation to Bob explicitly: if the strict reading was
intended, surface to Lloyd for a touch-up on the brief, NOT a
hotfix on my end.

### Private off-grid probe reads

- `elderMascPear` (`probes/elderMascPear.png`): clean Hogarth pear,
  wide belly at the gonial-Y, taper to chin. Penguin / dowager
  register. Renders as expected — buildPearJaw is exercised cleanly.
- `adultFemPointed` (`probes/adultFemPointed.png`): clean Sito wedge,
  narrow chin (clamped to 18% bigonial by buildPointedJaw). Witch /
  antagonist register. Renders clean.

### Knob next-to-tune (if Pascal flags)

If Pascal Wave 3 calls the short cells short of 5 still:
- **child** — bump `bigonialWidth` further (0.62 → 0.65 or 0.68);
  the soft-U could be pushed wider without losing child identity.
- **elder** — bump `jowl` further (0.48 → 0.55) or widen `bigonial`
  further (0.74 → 0.78). `jowl` is the load-bearing lever.
- **masc** — `gonialAngle` could go lower (0.18 → 0.12) for a
  sharper Bridgman block; risks parody territory per Lloyd's
  warning. Wouldn't push without a Pascal-explicit call.

Per AGENTS.md "examples are not targets," I stopped tuning at
"topology diverges visibly at 96px" rather than "looks like Robin"
or "looks like Alfred." Pascal scores the register.

### Files touched

- `src/presets/demographics.ts` — jaw deltas + private fixtures.
- `scripts/timmflat-grid.ts` — restored 6/7/11, added two fixture
  probes, added tintin × 4 regression sheet, updated head comment.
- Zero touches to `scaffold.ts` (Felix's lane) or any pack file.
- Zero touches to api.ts (the fixtures are intentionally NOT in
  the public `ages` / `presentations` enum — preserves Lloyd's
  "avoid combinatorial pack-expansion" call).

### Open for Lloyd review

- Type / data layer (Lloyd's review surface per PROCESS.md decision-
  rights and task brief constraint). I followed Lloyd's §Q2 §Pick
  numerically; my own additions were the fixture comment scaffolding
  + the grid-script opt-in shape (export-named-partials → layered
  via overrides).

— Nick
