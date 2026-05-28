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

(Nick fills in on completion.)
