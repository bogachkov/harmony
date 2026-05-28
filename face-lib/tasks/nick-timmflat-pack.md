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

(Nick fills in on completion.)
