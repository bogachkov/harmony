# nick-eye-plumbing-and-hull-cleanups

Three small, independent fixes bundled into one PR. Each is a discrete
commit. Total ~35 LOC across the three.

## Brief

Land the three small W1-return follow-ups that gate the rest of W2 work:

1. **Eye-primitive plumbing** (Leo STOP from
   `research/leo-face-integration-audit.md`). `buildEye` almond branch
   silently drops `lidLine` / `lashes` / `underlineHint`. Plumb them
   through, default 0 so existing renders are unchanged. ~25 LOC.

2. **`hullGroup` keying switch to `centreU` quadrant** (Lloyd pass-2
   item 2, `research/lloyd-pass-1.md` Pass 2 §2). One line at
   `scaffold.ts:1414` switching from `sideRoll`-bucket to
   `centreU` quadrant: `hullGroup = centreU < -PI*0.10 ? 'left' :
   centreU > PI*0.10 ? 'right' : 'front'`. Preserves the centre
   parting gap on `longCurtain`. Required before any shipped style
   adopts `clumpMode: 'volume'` — not strictly gating `timmFlat`
   (which is flat-mode), but we land it now while the file is open.

3. **Drop `data-hull-group` debug attr** (Lloyd pass-2 item 3, ~6 LOC).
   The current attr leaks `avgZ` floats into SVG output which Hyrum's-
   laws into a Holly regression problem. Either drop entirely, or
   gate behind `p.style.debug === true` and emit the categorical
   group key, not the float. Lloyd's preference is drop entirely;
   pick whichever is cleaner.

## Concrete changes — item 1 (eye plumbing)

From Leo's audit, verbatim:

- In `scaffold.ts` near `:421`: extend `buildEye(anchor, halfWidth,
  openness, tilt, surfaceZ)` to accept `lidLine, lashes,
  underlineHint`, default 0.
- `lidLine > 0.05` emits a thicker upper-lid stroke;
  `lidLine > 0.4` switches to a parallel-filled poly (the Timm
  "brick on the upper lid").
- Mirror the `lashes` + `underlineHint` blocks from `buildEyeDots`
  at `:343` — they already exist there, copy the logic over.
- At the call sites (around `scaffold.ts:2287-2297`), pass the
  three params into the almond branch. They are already in
  `p.eyes` from `params.ts`.

**Mixture rule.** Defaults of 0 mean all existing `tintin` /
`default` / `ligneClaire` renders are byte-identical (Leo confirms:
"all current presets are 0 on the almond branch"). No existing
hairstyle render should change. Regression check: re-render the
13-hairstyle × 2-presentation sheet pre/post and diff. Should be
zero diff outside the test fixture you ADD for the new lidLine
behaviour.

**One new test fixture.** Render one cell of `eyes.style: 'almond'`
+ `lidLine: 0.6` showing the heavy upper-lid stroke. This is the
load-bearing render for the timmFlat impl that comes next — if it
doesn't look like a Timm upper-lid, timmFlat ships wrong.

## Concrete changes — item 2 (hullGroup centreU)

In `scaffold.ts:1414`, change the `hullGroup` derivation from the
current `sideRoll`-bucket to `centreU` quadrant:

```ts
const hullGroup =
  centreU < -Math.PI * 0.10 ? 'left' :
  centreU >  Math.PI * 0.10 ? 'right' :
  'front';
```

Exact threshold is Lloyd's suggestion; tune if you find a hairstyle
where the parting reads wrong. Confirm `longCurtain` re-renders
WITH a visible centre parting gap (it should — that's the whole
point of the fix). The other two W1 fixtures (`shortBob` flat,
`coilyHalo` radial) should be unchanged by this — `shortBob` is
flat mode so `hullGroup` is unused; `coilyHalo` has all clumps
radiating from a central point and the centreU bucketing should
behave similarly to `sideRoll` there.

## Concrete changes — item 3 (debug attr)

In `src/render/svg.ts` (where the hull `<path>` elements get the
`data-hull-group="<avgZ>"` attribute), drop it. If you'd rather
gate behind a debug flag, gate behind `p.style.debug === true` and
emit `data-hull-group-id="${groupKey}"` (the categorical, NOT the
`avgZ` float). Lloyd's stated preference is drop.

## Context

- `face-lib/research/leo-face-integration-audit.md` — item 1
  motivation. Eye section.
- `face-lib/research/lloyd-pass-1.md` Pass 2 — items 2 and 3
  motivation. Lloyd's pass-2 review verdicts (`§2`, `§3`).
- `face-lib/research/stylepack-timmFlat-spec.md` lines 326-331 —
  the eye-knob settings the timmFlat pack will use. This is what
  item 1 is for.
- `face-lib/SPRINT.md` Q1-W2 ship gate row 1 — closes when this
  lands.

## Acceptance

- Item 1: `buildEye` almond branch honors `lidLine` /
  `lashes` / `underlineHint`. Defaults of 0 give byte-identical
  output to pre-refactor (re-render the 13-style × 2-presentation
  sheet to verify). One new fixture render proves
  `lidLine: 0.6` works.
- Item 2: `hullGroup` keyed by `centreU` quadrant. `longCurtain`
  re-renders with a visible centre parting gap. `shortBob` /
  `coilyHalo` re-render with no visible change.
- Item 3: `data-hull-group` attr is gone (or gated and emits the
  categorical key, not the float).
- Three independent commits in one PR (per `PROCESS.md` "one commit
  per logical unit"). Total LOC ~35.
- No Lloyd review required (size + simplicity). Bob can sign off
  inline.

## Notes

- Mixture rule (per AGENTS.md): new behaviour added as parameters,
  default values preserve existing renders. The eye-plumbing PR is
  the textbook example.
- Don't expand scope. `mouth.philtralBow`, `brows.shape` enum,
  orbital-socket recess are all Leo BACKLOG candidates DEFERRED out
  of W2. If you find yourself reaching for them, stop.
- The eye-plumbing fix is on the critical path for `timmFlat`. The
  hull cleanups are on the critical path for the alpha-shape PR
  (item 2) and for Holly's future regression test discipline
  (item 3). Land all three together.

## Handoff

Three commits landed on `vector-draw` (pushed):

- `25dc884` — eye plumbing. `buildEye` gains `lidLine / lashes /
  underlineHint / isLeft`, all defaulted so the existing pure-anchor
  signature stays a valid call. `lidLine > 0.05` emits a parallel
  companion stroke above the upper lid; `lidLine > 0.4` switches to a
  filled "brick" closed poly (the Timm slab from Sito 2004 p.40).
  `lashes` mirrors the `buildEyeDots:379` block (outer-corner ticks),
  scaled to `halfWidth`. `underlineHint` mirrors `:404` (narrow
  under-eye tick). Call sites at `:2287-2297` pass the three
  `p.eyes.*` knobs into the almond branch.
- `ce19a47` — `hullGroup` keying. One-line swap at the volume-curve
  push: `centreU` quadrant instead of `sideRoll` bucket. Thresholds
  per Lloyd: `±π·0.10`. The same hull-merge boundary, just keyed on
  projected angular position so two front clumps in different 3D
  regions no longer merge into one silhouette.
- `b1ee33a` — `data-hull-group` debug attr dropped from `svg.ts`
  hull-merge output. Lloyd's stated preference (drop entirely). Comment
  left flagging the gate-behind-`p.style.debug` path if a debug overlay
  is wanted later.

LOC: 79+ / 3- on scaffold.ts buildEye (item 1), 10+ / 5- on scaffold.ts
hullGroup line (item 2), 7+ / 2- on svg.ts (item 3). Total ~35 net new
LOC as briefed.

### Render verification

Render artifacts: `/tmp/nick-w2-pr1/`.

- **Mixture rule — flat-mode shipped catalog.** Rendered every
  registered hairstyle (16: 12 shipping + 3 Lloyd fixtures + ... actually
  15: 12 shipping + 3 Lloyd) × 2 presentations under `style:'tintin'`
  pre-PR. Diffed against post-item1, post-item2, post-item3.
  - Item 1: all 30 SVGs **byte-identical** (the dots branch is
    untouched; tintin uses dots). Mixture promise honored.
  - Item 2: 26/30 byte-identical (all flat-mode catalog renders); the
    4 changed are the volume-mode Lloyd fixtures (`longCurtain` and
    `coilyHalo`, both demographics). Expected — those are the only
    paths that touch the keying line.
  - Item 3: same 4 volume-mode renders changed, only `data-hull-group`
    attr removed; coords, fills, and ordering identical. Pixel-
    identical visual output (the attr was inside an SVG comment-
    free `<path>` element with no rendering effect).
- **Item 2 visual sanity.** `feminine-longCurtain` baseline reads as a
  nun's wimple (one merged hull bulging beyond the chin); post-item2
  has a clear centre vertical parting gap and left/right hair masses.
  `coilyHalo` keeps its hexagon-halo character; the small top-centre
  dip is the alpha-shape-vs-convex distinction Lloyd flagged for PR #2.
- **Item 1 visual fixture.** Six renders at
  `/tmp/nick-w2-pr1/eye-fixture/*.png` against `style:'default'`,
  `presentation:'masculine'`:
  1. `01-almond-base` — masculine preset default (`lidLine:0.4`,
     no explicit override). Thin upper-lid companion stroke visible
     above each eye.
  2. `02-almond-lidLine-0.2` — companion stroke closer to the lid.
  3. `03-almond-lidLine-0.6` — **the load-bearing timmFlat fixture.**
     The upper-lid switches to the filled "brick" slab. Visually
     unambiguous Timm/Sito upper-lid weight.
  4. `04-almond-lidLine-0.6-lashes-0.7` — outer-corner lash ticks
     fire on top of the brick.
  5. `05-almond-underlineHint-0.6` — Hergé under-eye tick on the
     almond.
  6. `06-almond-all-three` — full stack. Demonstrates `lidLine` /
     `lashes` / `underlineHint` are independent and composable on the
     almond branch (matches their behavior on the dots branch).

### Notes / minor

- Leo's audit phrase "all current presets are 0 on the almond branch"
  turned out to be empirically not quite right — the demographic
  presets (`masculine.eyes.lidLine: 0.4`, `feminine.eyes.lidLine: 0.5
  + lashes: 0.6`, `elder.eyes.lidLine: 0.6 + underlineHint: 0.55`,
  `teen.eyes.lidLine: 0.4`) DO set non-zero values, they were just
  being silently ignored on the almond branch. Effect on
  shipped-catalog renders: zero (every shipped style uses `tintin` →
  dots branch). Effect on `style:'default'` / `'ligneClaire'` renders
  with demographic presets: those now honor the demographic-set knobs,
  which is exactly the Leo-STOP fix. Worth a sentence in the W2 retro
  in case Pascal/Holly later flag a default-style render as "changed".
- `buildEye` signature added `isLeft: boolean = true` to mirror the
  outer-corner sign convention from `buildEyeDots`. Default of `true`
  means no existing caller breaks; new call sites pass `true` / `false`
  for left / right anchors, matching the dots branch convention.
- Did not touch the volume/hull path itself (alpha-shape work) — that's
  PR #2's lane.
- Pre-existing TypeScript noise in `npx tsc --noEmit` (missing
  `@types/node`, a couple of unrelated overlap errors at
  `scaffold.ts:1281`) — none in or downstream of my edits. Not my row.

### What this unblocks

- `timmFlat` impl (W2 row 3): `eyes.style:'almond', lidLine:0.6` is now
  load-bearing rather than silent. Pack can ship.
- `hullMode: 'convex'|'alpha'` PR #2: centreU keying + the dropped
  debug attr clear the file for the alpha-shape work to merge cleanly.
