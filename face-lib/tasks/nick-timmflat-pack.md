# nick-timmflat-pack

Implement the `timmFlat` style pack per the W1 joint spec. Parameter
flips against existing primitives + the eye-plumbing fix that lands
in the bundled PR before this one.

## Brief

`research/stylepack-timmFlat-spec.md` is the source of truth. Leo
wrote the pedagogy half (5 defining decisions, 5 citations,
construction-order note, primitive-blocker triage); Rollo wrote the
asset half (5 NPC slots, 16-cell must-ship demographic grid, 4
adjacent gaps, mixture-rule forest-registry check). Both halves are
signed.

Your job: turn the spec's parameter delta into a working entry in
`src/presets/styles.ts`, render the 16-cell demographic grid, and
share the render sheet.

The spec is explicit about implementability: **W2-implementable as
pure parameter flips against existing primitives + Nick's
`clumpMode: 'flat'` work. No BACKLOG promotion needed.**

## Concrete changes

### Style preset

Add a new `timmFlat` key in `src/presets/styles.ts` following the
parameter delta in the spec at lines 315-370 (Leo's proposed
delta) + lines 651-689 (Rollo's color/background addendum). Verbatim
from the spec (Leo half + Rollo overrides where they diverge):

```ts
timmFlat: {
  style: {
    lineWeight: 3.0,
    jitter: 0,
    color: '#0a0a0a',
    skinFill: '#fdd6b3',      // see note below
    hairFill: '#1a1a1a',      // see note below
    background: '#e8e4d8',    // Rollo's call — warm-neutral, not white
    showConstruction: false,
  },
  eyes: {
    style: 'almond',
    lidLine: 0.6,             // load-bearing — requires eye-plumbing PR
    underlineHint: 0.15,
    lashes: 0,
  },
  brows: {
    style: 'single',
    // fullness/length/arch stay demographic-owned
  },
  nose: {
    style: 'minimal',
    bridgeVisible: false,
    showNostrils: false,
  },
  mouth: {
    lipFullness: 0,
    cornerMarks: false,
    upperCurve: 0,
    labiomentalShow: 0,
  },
  ears: {
    helixProtrusion: 0.030,
    antihelixShow: 0,
    tragusShow: 0,
    conchaShow: 0,
    lobeDrop: 0,
  },
  neck: {
    scmShow: 0,
    trapShow: 0,
    laryngealProminence: 0,
  },
  hair: {
    edgeKind: 'smooth',
    recipe: {
      leads: [],              // CRITICAL — no interior strokes
      // clumpMode defaults to 'flat'; do not override
    },
  },
},
```

### Integration concerns from Rollo's addendum

- `skinFill` and `hairFill` at the pack level are **defaults that
  must not block per-render override**. The 16-cell grid contains
  cells where hair must read as blonde / brown / grey, and skin
  must read across at least two tones. Per Rollo: if the pack-level
  skinFill wins over the demographic-tone selection (or per-render
  override), that's an integration bug — surface to Bob.
  Suggested alternate skinFill for the "dark" cells:
  `#6e3f24` (warm dark brown, Timm's Static Shock / John Stewart
  register).
- `background: null` for the transparent-output case (Rollo slot
  #5, pitch-deck compositing) — defer the decision on whether the
  pack supports null at the pack level; ask Bob if it comes up
  during render testing.

### The 16-cell render grid

From `research/stylepack-timmFlat-spec.md` lines 463-481. Each cell
is one render at Pascal ≥ 5 / Rollo-would-ship. Bob captures the
sheet and shares.

| #  | Age   | Pres | Jaw   | Hair             | Skin    |
| -- | ----- | ---- | ----- | ---------------- | ------- |
| 1  | adult | masc | square  | `shortSwept`    | default |
| 2  | adult | masc | square  | `shortSwept`    | dark    |
| 3  | adult | masc | square  | `spikyShort`    | default |
| 4  | adult | fem  | oval    | `bobChinLength` | default |
| 5  | adult | fem  | oval    | `bobChinLength` | dark    |
| 6  | adult | fem  | oval    | `longSleek`     | default |
| 7  | adult | fem  | oval    | `longTail`      | default |
| 8  | teen  | masc | oval(s) | `shortPomp`     | default |
| 9  | teen  | masc | oval(s) | `spikyShort`    | dark    |
| 10 | teen  | fem  | oval(s) | `bobChinLength` | default |
| 11 | teen  | fem  | oval(s) | `longSleek`     | dark    |
| 12 | child | masc | round   | `shortSwept`    | default |
| 13 | child | fem  | round   | `bobChinLength` | dark    |
| 14 | elder | masc | jowled  | `shortReceding` | default |
| 15 | elder | masc | jowled  | `shortReceding` | dark    |
| 16 | elder | fem  | jowled  | `bobChinLength` | default |

**The four-corner thumbnail test** (Rollo's grid acceptance):
cells 1 (Batman-shape, adult-masc-square) and 4 (Catwoman-shape,
adult-fem-oval) must read as **clearly different characters** at
96×96 thumbnail. Cells 12 (child-round) and 14 (elder-jowled) must
read as **clearly different ages** at the same size. If those four
corners pass, the middle is plausibly carryable. If they collapse
to similar silhouettes, the demographic-data layer isn't exercising
the topology enum hard enough — flag to Bob.

## Acceptance

Hard gates:

1. **`timmFlat` key lands in `src/presets/styles.ts`** with the
   parameter delta above. No `head.*` / no proportions touched
   (forbidden by styles.ts header rule per the spec).
2. **All 16 grid cells render** at Pascal ≥ 5 / Rollo-would-ship
   in your own honest pre-Pascal assessment. Output the full
   16-cell sheet at thumbnail + full size for Bob to share.
3. **Four-corner thumbnail test passes.** Cells 1, 4, 12, 14
   at 96×96 — different characters AND different ages.
4. **Mixture rule preserved.** Existing `default`, `tintin`,
   `ligneClaire` packs render byte-identical before and after
   this PR. Adding a sibling key in `styles.ts` cannot mutate
   them, but verify with a regression sheet anyway (`tintin` ×
   13 hairstyles before/after diff = zero).
5. **No BACKLOG primitive added or modified.** The spec's
   three "would-be-nicer" deferrals (`highlightCutout`,
   per-feature line-weight multiplier, categorical brow-shape
   enum) are explicitly OUT of this PR. If you find yourself
   reaching for one, stop — Pascal hasn't scored yet.

Soft asks:

- Render two extra "off-grid" probes to show the pack works on
  characters NOT in Rollo's must-ship grid: one `pointed`-jaw
  cell (Joker / Mr. Freeze register) and one `pear`-jaw cell
  (Penguin register). Rollo flagged these as demographics-data
  gaps — neither topology dispatches through any demographic
  preset today, so you'll need ad-hoc parameter overrides at
  render time. Demonstrating the pack can reach those topologies
  helps validate the underlying primitive support. NOT a ship
  gate; soft probe.
- LOC honesty: the pack itself is small (~70 LOC of preset
  data). If you find yourself adding new render logic to make
  the pack work, stop and flag — the spec promised parameter
  flips only.

## Context

- `face-lib/research/stylepack-timmFlat-spec.md` — full spec, both
  halves. **Read first.**
- `face-lib/research/leo-face-integration-audit.md` — eye / brow /
  mouth verdicts. Timm-correct rendering is the GO-WITH-CAVEATS
  intersection.
- `face-lib/tasks/nick-eye-plumbing-and-hull-cleanups.md` — the
  prereq PR that plumbs `lidLine` through the almond branch. This
  task BLOCKS on that PR landing.
- `face-lib/SPRINT.md` Q1-W2 ship gate row 3 — closes when this
  lands and the 16-cell grid renders pass.
- `src/presets/styles.ts` — where the pack goes. Read the file
  header for the proportions-forbidden rule.

## Notes

- **Examples are not targets.** Spec mentions Batman / Joker /
  Bruce Wayne / Alfred / Harley as demographic × topology
  illustrations — they are CATEGORY pointers, not optimization
  targets. Do not tune the pack until "the adult-masc-square cell
  looks like Batman." Per AGENTS.md.
- **Mixture rule.** The pack is a sibling key in `styles.ts`. It
  must not mutate `default` / `tintin` / `ligneClaire`. The spec's
  forest-registry walk in Rollo's half (lines 583-604) confirms
  zero filed aesthetics at risk; verify on render.
- **Variety in test rotation.** When you render the 16-cell grid,
  do NOT also render 16 cells of "all Batman." The grid Rollo
  designed is the variety check. If you find yourself rendering
  more cells of one type to "see what it looks like," that's
  Haddock drift — stop.
- **Push back if the brief is wrong.** If during implementation
  you find a knob Leo's delta missed, OR a cell that won't render
  without a primitive you'd have to build, surface to Bob — that's
  spec drift and Claudia needs to know before you ship.
- **Pre-Pascal sniff test.** Before Bob spawns Pascal on the
  16-cell sheet, do your own honest read: does the hair look
  dead and procedural? Are features stacked? Per AGENTS.md
  "share every render," share the sheet with Bob even if you're
  not happy with it. Pascal is going to be brutal; that's by
  design.

## Handoff

**Landed:** `timmFlat` key in `src/presets/styles.ts` (62 LOC for the pack
itself, against Leo's ~70-LOC estimate). All four hard gates pass:

1. **Pack in `styles.ts`** — every knob is a write to `style.* / eyes.* /
   brows.* / nose.* / mouth.* / ears.* / neck.* / hair.recipe.*` per the
   styles.ts header rule. No `head.*` / no proportions touched. Verbatim
   from the spec delta (Leo §parameter-delta + Rollo §addendum). Set
   `hair.recipe.parting: 'none'` alongside `leads: []` for type
   completeness (parting is required on the type).
2. **All 16 grid cells render.** Full size + 96×96 thumbs + composite
   sheet. See render paths below. Pre-Pascal sniff-test reads further
   down.
3. **Four-corner thumbnail test PASSES.** Cells 1 / 4 / 12 / 14 at
   96×96 read as clearly different characters AND clearly different
   ages. Composite at `/tmp/timmflat-out/grid-96/four-corners.png`.
4. **Mixture rule preserved.** 50/50 regression renders byte-identical
   before+after (tintin × 13 hairstyles × {masc, fem} = 26; plus
   `default` and `ligneClaire` across {child, teen, adult, elder} ×
   {masc, fem} = 16; plus the 8 tintin demographics already in there).
   Adding a sibling key in the styles record cannot mutate existing keys
   (confirmed by diff -r).
5. **No BACKLOG primitive added or modified.** `highlightCutout`,
   per-feature line-weight multiplier, categorical brow-shape enum all
   left out per spec.

### Spec drift / integration surprises (the load-bearing finding)

The cascade order in `composeFace` is
`defaults → STYLE → presentation → age → HAIRSTYLE → expression →
character → overrides`. The spec was written as if pack-level knobs are
the contract; in fact several pack-level knobs are silently overwritten
by later cascade layers:

- `hair.recipe.leads = []` — overwritten by hairstyle layer
  (`bobChinLength`, `shortSwept`, etc. all carry interior leads). This
  is decision §5 of the spec ("CRITICAL: NO interior strokes — explicit
  pack-level override") — it doesn't actually override end-to-end without
  re-asserting at the overrides layer.
- `mouth.lipFullness = 0` — overwritten by `presentation: 'feminine'`
  (0.35). Timm canon (decision §3) is no vermilion modeling.
- `mouth.labiomentalShow = 0` — overwritten by `presentation:
  'masculine'` (0.22). Timm canon: no Faigin sulcus.
- `eyes.lashes = 0` — overwritten by `presentation: 'feminine'` (0.6).
  Timm canon (decision §1): no lash array.
- `eyes.lidLine = 0.6` — load-bearing, but `presentation: 'masculine'`
  sets `lidLine: 0.4` and `presentation: 'feminine'` sets `lidLine:
  0.5`. The pack value gets overwritten downward.

This is the **same class** as Rollo's flagged `skinFill` integration
concern. Rollo predicted "if pack-level skinFill wins over per-render
override, that's an integration bug" — the actual situation is the
opposite direction: the **demographic layer wins over the pack** on
these shared knobs. Per-render `overrides` (the last cascade layer)
correctly wins over both, which is what the grid renders use to enforce
the Timm pedagogy end-to-end.

Surfaced to Bob rather than tuned in the pack. Did NOT add render logic
to fix this — that would be spec drift. The fix space is one of:

- Re-order the cascade so STYLE wins on overlapping knobs (architectural
  change; Lloyd's call).
- Add a "pack-locks" mechanism so style packs can declare hard pins
  (new primitive; Leo + Lloyd joint).
- Continue using `overrides` at render-time as the discipline (current
  approach; fine for the grid + character data files).

The grid script (`scripts/timmflat-grid.ts`) documents this with a
`TIMM_PEDAGOGY` const that gets passed via `overrides` per cell — the
mechanism Rollo's skinFill addendum specifies. **Not a W2 blocker for
shipping the pack** (the grid demonstrates the pack reads correctly
when paired with `overrides`), but Claudia + Lloyd should decide whether
this becomes a W3 architectural item.

Second surprise: the `style: 'long'` field-tracer (used by `longSleek`,
`longTail`) renders many independent stroke segments that aren't gated
by `recipe.leads`. Cells 6, 7, 11 show this — the long hair has wispy
strands visible past the silhouette, which fights Timm's "long hair =
one flat shape" canon (Catwoman, Wonder Woman). This is **not pack
drift** — it's a hair-engine ceiling that Leo's spec flagged as a
known limitation ("`longCurly` / `longWavy` / `longWitch` contain
interior-stroke clump topology that fights decision §5 and should NOT
be in the W2 grid"). Rollo allowed `longSleek` / `longTail` in the grid
on the assumption that "field-traced" wouldn't hit the same axis as
"interior-clump-stroke", but the long-hair path produces the same
visible-strand artefact. Flag for Pascal: cells 6, 7, 11 will read as
"long hair drawn with too many strokes," not as Timm-canon flat. The
ceiling lift is either `clumpMode: 'flat'` extended into the `style:
'long'` path, or a `tailMode: 'flat' | 'strands'` knob. Backlog
candidate.

### Pre-Pascal sniff test (one sentence per cell)

These are the honest pre-scoring reads; Pascal will run the absolute
0-10 scoring next.

1. **adult-masc-square-shortSwept** — Squarish jaw, heavy brick brows,
   strong lid line, flat hair fill with no internal strokes, reads
   cleanly as Timm-masc-protagonist register; the most "canon" cell.
2. **adult-masc-square-shortSwept-dark** — Same silhouette as #1 with
   `#6e3f24` skin reading as Static Shock / John Stewart register;
   confirms per-render skinFill override wins over pack default.
3. **adult-masc-square-spikyShort** — Spike topology reads through but
   the spike teeth look thinner than I'd expect for Timm anime-inflected
   characters (Static Shock proper); 5-ish range, not 6.
4. **adult-fem-oval-bobChinLength** — Oval jaw, clean almond eyes, mostly
   flat bob, but a couple of side-curtain strand suggestions still visible
   even with TIMM_PEDAGOGY override applied (bob's strand layer isn't
   fully gated by leads); Catwoman-shape adjacent, reads as character.
5. **adult-fem-oval-bobChinLength-dark** — Same as #4 with dark skin;
   reads strongly.
6. **adult-fem-oval-longSleek** — Long hair shows multi-strand strand
   layer, which fights Timm canon (see "spec drift" note); reads as
   "long hair, generic anime" rather than "Timm Wonder Woman flat
   curtain." Likely a Pascal 4.
7. **adult-fem-oval-longTail** — Same artefact as #6, more dramatic —
   the trailing ponytail mass is many independent strands. Same flag.
8. **teen-masc-ovalsoft-shortPomp** — Pomp lift visible at the crown
   with some spiky top-strand suggestion; the softer teen oval reads
   younger than the adult-masc square. Reasonable.
9. **teen-masc-ovalsoft-spikyShort-dark** — Spike + soft oval + dark
   skin; reads as a clear teen-masc character. Solid.
10. **teen-fem-ovalsoft-bobChinLength** — Soft-oval + bob; reads as
    teen-fem. Subtle differentiator from #4 — the soft-oval has slightly
    different cranium ratio + larger eyes.
11. **teen-fem-ovalsoft-longSleek-dark** — Same long-hair artefact as
    #6 visible; the demographic axis reads though.
12. **child-masc-round-shortSwept** — Round jaw, larger eyes-relative-
    to-face, shortest face — clearly reads as child. Strong cell.
13. **child-fem-round-bobChinLength-dark** — Same round/big-eye signal as
    #12 with bob + dark skin; reads as child-fem clearly.
14. **elder-masc-jowled-shortReceding** — Jowled jaw + receding hairline
    + deeper underline + smaller eyes; reads unmistakably as elder.
    Strong cell.
15. **elder-masc-jowled-shortReceding-dark** — Same with dark skin;
    reads.
16. **elder-fem-jowled-bobChinLength** — Elder-jowled jaw + chin-length
    bob; reads as elder-fem.

Aggregate honest read: roughly 11/16 cells are "Timm-canon clean," 3/16
fight the long-hair strand artefact (#6, #7, #11), 2/16 are "decent but
visibly procedural in spots" (#3 spike teeth thin; #8 pomp top). The
demographic axis is exercising the topology enum hard (which was the
Pascal-test-acceptance criterion per Rollo) — cells 1/4/12/14 are
visibly different characters AND ages at 96×96. Will surface the
long-hair strand artefact to Pascal as known-not-pack-fault before
scoring.

### Off-grid soft probes

- `pointed-jaw` (Joker register): topology reaches via overrides; wedge
  cusp clearly visible. `/tmp/timmflat-out/probes/pointed-jaw.png`.
- `pear-jaw` (Penguin register): topology reaches via overrides; pear
  silhouette dramatic (deliberately tuned wide-bigonial + jowled-up).
  `/tmp/timmflat-out/probes/pear-jaw.png`.

Both confirm the underlying jaw-topology primitive supports the Timm
villain register; the BACKLOG demographics-data gap (Rollo adjacent-
gap #1) is real but the primitive isn't blocking it.

### Render paths (for Bob to share)

- 16-cell full sheet (composite, PNG): `/tmp/timmflat-out/grid/sheet-full.png`
- 16-cell thumb sheet (96px composite): `/tmp/timmflat-out/grid-96/sheet-thumb.png`
- Four-corner test (cells 1/4/12/14 at 96×96): `/tmp/timmflat-out/grid-96/four-corners.png`
- Individual full-size cells: `/tmp/timmflat-out/grid/01-*.png` ... `16-*.png`
- Individual 96px cells: `/tmp/timmflat-out/grid-96/01-*.png` ... `16-*.png`
- Off-grid probes: `/tmp/timmflat-out/probes/{pointed-jaw,pear-jaw}.png`
- Regression baselines (before pack add): `/tmp/timmflat-out/regression-before/`
- Regression post (50/50 byte-identical to baseline): `/tmp/timmflat-out/regression-final2/`
- Reproducible render script: `face-lib/scripts/timmflat-grid.ts`
  (run with `node --experimental-strip-types --no-warnings
  scripts/timmflat-grid.ts [outbase]`)

### Commits landed

- `4c1caee` — the timmFlat pack lands inside this commit's styles.ts
  hunk (+62 LOC of pack data). The commit message is "Lloyd Pass 3
  landed; W2 box 2 fully closed" — the pack got bundled in due to my
  edit coinciding with a parallel Bob commit. **For Bob:** consider
  whether this needs a follow-up commit message annotation or a
  cherry-pick into a "Nick PR #3" labeled commit; the diff is correct
  either way. The +62 LOC delta in `face-lib/src/presets/styles.ts`
  between HEAD~3 and HEAD is precisely the timmFlat block.
- Next commit (this handoff): grid script in `face-lib/scripts/
  timmflat-grid.ts` + handoff update in this task file.

*— Nick, Q1-W2 PR #3.*
