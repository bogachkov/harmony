# nick-tuning-pass-1

## Brief

Three small tuning fixes. Single agent, single commit per fix.

1. **shortPomp centerline convergence** — strokes bunch at apex creating
   topknot/starburst rather than swept-back read. In `src/model/scaffold.ts`
   inside the verticalLift block, find the `peakOnX = startX * (0.15 + liftRng() * 0.20)`
   line. Widen the multiplier so strokes don't all converge so tightly to
   centerline. Try `0.40 + liftRng() * 0.30` (range 0.40-0.70). Verify
   visually.

2. **bobChinLength center-parting trails into forehead** — center-parting
   ink stroke extends down past the hairline as a thin line reading as a
   scar. Find the parting curve generation for `parting: 'centre'` in
   buildHair and clip its bottom at the hairline (or apply stronger
   taperEnd so the bottom fades to nothing). Per Rollo.

3. **longTail strokes merge with face outline at print size** — trailing
   strokes drift inward toward the cheek near the bottom of their fall,
   visually merging with the face silhouette. Find the trail-mass block
   in scaffold.ts (search "TRAILING MASS"). The `endX = startX + sign *
   outward` line drifts INWARD when outward is small but startTRaw is
   high. Either ensure `endX` stays OUTSIDE the silhouette boundary at
   the corresponding y, or eliminate the inward drift entirely for the
   lower 40% of the stroke length. Per Rollo.

## Context

- `BACKLOG.md` known-regressions table — all three are listed there.
- `research/rollo-pass-1.md` — Rollo's exec summary names #2 and #3 as
  "two rendering bugs for Fred."
- Nick's own report (commit bff4f82) self-flagged #1.

## Acceptance

- Render fresh demo for each fix at `/tmp/nick-fix-{1,2,3}.png`. Read
  each to verify. The renders should NOT show the named artifact.
- One commit per fix with a clear message (so reverts are possible
  per fix).
- Update `BACKLOG.md` to remove the regression rows that landed.
- Brief handoff note (3-5 sentences total) in `## Handoff` below.

## Notes

- Tech-lead call: these are tuning, not architecture, so they're
  parameter / constant changes plus possibly a small clipping condition.
  Total < 30 LOC across the three.
- The 3D-hair refactor is still being designed (Leo running). These
  fixes should NOT preempt anything Leo recommends; they're targeted
  parameter tweaks to existing primitives.

## Handoff

(Nick fills this in on completion)
