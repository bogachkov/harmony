# nick-pass-2

Two small ships, one task. Both independent of Lloyd's architecture
(running in parallel). Per Leo pass 8 §2 + §3.

## Brief

**Ship 1 — Bob cap regression fix (HIGH severity, ship first).**

Per Leo pass 8 §3: three-line widen of the `drawCap` condition at
`scaffold.ts:972`. Currently:
```ts
const drawCap = edgeKind === 'spiked' || edgeKind === 'edgeTextured' || verticalLift > 0;
```
Add a clause so short/medium hair with smooth/flicked/crowSnipped
edges also draws the cap:
```ts
const drawCap =
  edgeKind === 'spiked' || edgeKind === 'edgeTextured' || verticalLift > 0 ||
  ((style === 'short' || style === 'medium') &&
   (edgeKind === 'smooth' || edgeKind === 'flicked' || edgeKind === 'crowSnipped'));
```
This unregresses bobChinLength + shortSwept + shortPompadour + shortReceding.
Verify with renders. Single commit.

**Ship 2 — Lead/fill rename + coupling (mixture-safe).**

Per Leo pass 8 §2: `HairstyleRecipe.flowStrokes` IS the leads; the
~28 clump centres in `buildHair` ARE the fill. Bug is naming + absence
of coupling. Changes:

- In `src/model/params.ts`: rename `flowStrokes` → `leads` (keep
  `flowStrokes` as a deprecated alias for one pass — read both, prefer
  the new name).
- Add per-lead `flowWeight?: number` (default 1.0) field to the
  `FlowStroke` (now `Lead`) type. Used for upcoming fill-bias work but
  optional; no behaviour change yet.
- Add `fillBias?: 'follow-leads' | 'free'` to `HairstyleRecipe`,
  default `'follow-leads'`. With `'free'`, the clump-centre seeds
  remain RNG-only (current behaviour). With `'follow-leads'`, clumps
  seed near leads weighted by flowWeight — but this BEHAVIOUR CHANGE
  is OFF for now; just plumb the parameter and document it. (We don't
  want to silently change all existing renders. Leo's mixture rule.)
- Update every hairstyle file in `src/hairstyles/*.ts` to use `leads:`
  instead of `flowStrokes:`. They render identically.
- Update SPRINT.md "Done this sprint" with the rename note. Update
  BACKLOG.md filed-aesthetics table if any row references flowStrokes.

Total: ~50 LOC. Single commit (rename + plumbing). NO behavior change
intended yet — verify by rendering 4-5 hairstyles and confirming
pixel-equivalence to pre-rename renders.

## Context

- `face-lib/AGENTS.md` — collab artifacts; mixture-not-survival rule.
- `face-lib/SPRINT.md` — current sprint; your row is in flight.
- `face-lib/research/hair-tooling.md` §11 — Leo pass 8 audit. Read
  the bob-regression section and the lead/fill section.
- `face-lib/BACKLOG.md` — bob regression row should be removed after
  Ship 1 lands.

## Acceptance

- Ship 1: bob + shortSwept + shortPompadour + shortReceding all render
  with visible main hair mass. One commit.
- Ship 2: every hairstyle's recipe uses `leads:` not `flowStrokes:`.
  Renders are pixel-equivalent (or near-equivalent — slight stroke RNG
  drift from the rename touching merge order is acceptable if explained).
  One commit.
- Remove the bob regression row from `BACKLOG.md`.
- Brief return note (<150 words) to the Tech Lead: what shipped,
  any surprises, any of the two you couldn't fully land.

## Notes

- Lloyd's 3D refactor is running in parallel. Do NOT touch
  `clumpStroke()` in `hair-field.ts` or the field-tracer logic —
  that's Lloyd's seam. Stay in `params.ts`, `scaffold.ts:972`, and
  `src/hairstyles/*.ts`.
- If the rename touches more files than expected (CLI, llm-tools.ts,
  gallery.ts), update them all. Search the codebase.

## Handoff

Both ships landed cleanly.

**Ship 1 (bob regression):** Widened `drawCap` at `scaffold.ts:977` per brief.
Condition now also fires for `style === 'short' || style === 'medium'` with
`edgeKind` in `smooth | flicked | crowSnipped`. Verified bobChinLength,
shortSwept, shortPompadour, shortReceding — all render with visible fill mass.
No other code touched.

**Ship 2 (lead/fill rename):** `FlowStroke` → `Lead` type (alias preserved for
one pass), `flowStrokes` → `leads` on `HairstyleRecipe` (deprecated optional
`flowStrokes` kept for backward compat — scaffold reads `recipe.leads ??
recipe.flowStrokes ?? []`). `flowWeight?: number` added to `Lead`. `fillBias?:
'follow-leads' | 'free'` plumbed to `HairstyleRecipe`; NOT wired in behaviour
yet per brief. Updated 12 hairstyle files + demographics.ts (3 sites). Renders
are byte-for-byte identical to Ship 1 renders. Bob regression row removed from
BACKLOG.md; deferred-features row updated to "coupling pending Lloyd".
