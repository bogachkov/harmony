# claudia-q1w1-close-w2-plan

Claudia's second spawn. Close Q1-W1, open Q1-W2.

## Brief

All four W1 ship-gate boxes are checked. Lloyd's review + Leo's
integration audit added real W2 scope items. Bob ran the cycle through
your queue; you re-plan now.

## Returns to fold in

**Nick (boxes 1+2 closed):** 3D clump-volume refactor shipped end-to-end
in seven commits ending `909244c`. All 13 existing hairstyles
byte-identical in `flat` mode. Three test fixtures render in `volume`
mode. Net +444 LOC engine + 148 fixtures. See `tasks/nick-3d-clump-volume.md`
handoff.

**Leo + Rollo (box 3 closed):** `timmFlat` style-pack spec at
`research/stylepack-timmFlat-spec.md`. Pedagogy half (Leo) + asset half
(Rollo) both signed.

**Leo (box 4 closed):** face-integration audit at
`research/leo-face-integration-audit.md`. KEY FINDING:
- **Eyes = STOP**, small (~25 LOC). `buildEye` almond branch silently
  drops `lidLine` / `lashes` / `underlineHint`. timmFlat needs
  `eyes.style:'almond', lidLine: 0.6` — would ship visibly wrong without
  plumbing fix. **W2 Nick prereq before timmFlat impl.**
- Brows / Mouth / Integration = GO-WITH-CAVEATS.
- Cross-cutting: features-as-decals integration debt is real but
  timmFlat dodges it (Timm canon IS decals); pack 3+ will hit hard.
- Six BACKLOG candidates flagged in the audit's last section for your
  promote/defer call.

**Lloyd (code review, post-merge):**
1. Tangent decay magic number — APPROVED-WITH-EDITS, expose as
   parameter. Next-PR work.
2. `hullGroup` `sideRoll` keying — APPROVED-WITH-EDITS, ONE-LINE fix at
   `scaffold.ts:1414` switching to `centreU` quadrant. Required before
   any shipped style adopts volume. Causes longCurtain parting-gap.
3. `data-hull-group` debug attr — **NEEDS-CHANGES** (~6 LOC drop).
   Quick cleanup commit.
4. **Alpha-shape deferral — NEEDS-CHANGES on the deferral itself.**
   Lloyd agrees with Bob: pull alpha-shape into Q1-W2 as
   `hullMode: 'convex' | 'alpha'` parameter (mixture rule keeps convex
   as a mode). Any W2 coily/curly pack lands DOA without this.

Plus: dead code at `hull.ts:71-86` (`theta/cx/cy` with `void` discards)
— flag for follow-up.

## Your task

1. **Close W1 in SPRINT.md.** Archive contents to `## History`.
2. **Open Q1-W2.** Set sprint goal + ship gate + ticket queue.
3. **Draft W2 task files.** At minimum:
   - Nick: eye-primitive plumbing (Leo's STOP — small, must precede
     timmFlat impl).
   - Nick: alpha-shape `hullMode` knob + hull-mode parameter wiring
     (Lloyd item 4 — significant).
   - Nick: timmFlat style-pack implementation (after the two prereqs).
   - Nick (small follow-up): drop debug attr (Lloyd item 3). Could be
     bundled with eye-plumbing as a quick combined commit.
4. **BACKLOG curation.** Promote / defer the six Leo candidates + the
   two Lloyd next-PR items (tangent-decay param, hullGroup centreU fix)
   + dead-code cleanup. You decide priority.
5. **Order Bob's queue.** Spawn order for next 2-3 agents.

## Constraints + reminders

- You don't spawn agents — Bob does, per your queue.
- You don't write engineering code.
- Bob is in autonomous run mode (Gary out). Periodic non-blocking thread
  updates from Bob; no human-in-loop unless something truly requires
  Gary (which it shouldn't this week — your scope changes are within
  Q1 envelope).
- The eye-STOP + alpha-shape + timmFlat-impl are W2 minimum. If you
  add more, name what you're cutting from later weeks.

## Deliverable

- Rewritten `face-lib/SPRINT.md` (W1 → History; W2 active).
- 2-3 new task files in `face-lib/tasks/`.
- Updated `BACKLOG.md` reflecting promotions/deferrals.
- Updated `## Handoff` in this task file with Bob's spawn order.
- Brief return note to Bob (<200 words).

## Context

- `face-lib/AGENTS.md`, `face-lib/PROCESS.md`, `face-lib/ROADMAP.md`.
- `face-lib/BACKLOG.md` (current).
- All four return docs:
  - `research/lloyd-pass-1.md` (with Pass 2 review appended)
  - `research/leo-face-integration-audit.md`
  - `research/stylepack-timmFlat-spec.md`
  - `tasks/nick-3d-clump-volume.md` (Nick's handoff)
- Existing `SPRINT.md` showing all four boxes closed.

## Handoff

W1 closed; W2 open. All four returns folded in.

### W1 → History

SPRINT.md rewritten. W1's four ship-gate boxes archived under
`## History` with full closure-context (Nick refactor commits +
LOC drift; Leo+Rollo timmFlat spec halves both signed; Leo
integration audit eye-STOP + six BACKLOG candidates; Lloyd pass 2
four verdicts + dead-code flag). W1 carry-overs to W2 enumerated.

### Q1-W2 goal

**Land pack #2 (`timmFlat`) at quality bar across its 16-cell
demographic grid, with the two prereq primitive fixes that gate it.**

Ship-gate (4 boxes):
1. Eye-primitive plumbing landed.
2. `hullMode: 'convex' | 'alpha'` knob landed + bundled Lloyd
   items 2 (centreU keying) + 3 (debug attr drop).
3. `timmFlat` pack lands + 16-cell grid renders pass.
4. Pascal calibration audit on the 16-cell grid (W1-deferred).

**Opinion on scope:** all three Nick prereqs fit W2 because timmFlat
itself is parameter flips. Eye plumbing + hull cleanups bundle into
~35 LOC one-PR (half day). Alpha-shape is ~80 LOC + Lloyd review
(half day to one day). timmFlat is preset data + 16-cell render
sheet (one to two days). That's 2-3 focused days. Comfortable, not
tight. I am NOT pushing alpha-shape OR timmFlat to W3 — Lloyd's
"unshippable artefact" argument on convex-hull is right, and W2 is
the right time to land alpha while the architecture is fresh in
Nick's head.

### Spawn order for Bob

1. **Nick** — `tasks/nick-eye-plumbing-and-hull-cleanups.md`.
   Three small commits in one PR (~35 LOC): eye plumbing + centreU
   fix + drop debug attr. No Lloyd review needed. Half day.
2. **Nick** — `tasks/nick-alpha-shape-hullmode.md`. Alpha-shape
   merger + `hullMode` knob on `HairstyleRecipe`. Convex stays as
   a mode per mixture rule. Lloyd reviews on completion. Spawn
   after #1 lands (same `hull.ts` file; serialize to avoid
   merge churn).
3. **Nick** — `tasks/nick-timmflat-pack.md`. Pack parameter delta
   per W1 spec + 16-cell grid render sheet. Spawn after #1 lands
   (eye-plumbing PR is a hard prereq for `lidLine: 0.6`). Can
   start in parallel with #2 if Nick has bandwidth (file overlap
   zero — pack lives in `styles.ts`, alpha-shape lives in
   `hull.ts`). Default: serial after #2.

Conditional spawns (after #3 lands):
4. **Lloyd** code review of #2 — Bob-triggered, no Claudia
   queue needed.
5. **Pascal** — 16-cell grid + W1-deferred calibration audit.
   Closes the sprint.

Not queued this sprint:
- Holly — sprint-close role; first spawn is the test-strategy
  doc (per AGENTS.md), not test code. May slip to W3.
- Rollo / Leo — no audits or specs queued; W3 may need Leo if
  the next pack pick demands the orbital-socket primitive.
- David — monthly directional review naturally lands ~W2 close
  or W3 open.

### BACKLOG curation

Updated. Six Leo BACKLOG candidates triaged:
- #1 eye plumbing → **PROMOTED to W2** (Nick PR #1).
- #2 `mouth.philtralBow` → DEFERRED W3+ (filed).
- #3 categorical `brows.shape` → DEFERRED W3+ (filed).
- #4 per-feature line-weight multiplier → DEFERRED W3+ (filed,
  flagged as Pascal-ceiling raiser).
- #5 orbital socket recess primitive → DEFERRED to first pack
  that requires it (filed, NEW row).
- #6 `expressions.ts` resuscitation → DEFERRED W3+ (filed,
  consolidated with prior expression row).

Two Lloyd next-PR items:
- Tangent-decay parameter exposure → filed under deferred-features
  (cheap follow-up; defer until a caller wants it).
- `hullGroup` centreU keying → **PROMOTED to W2** (bundled in
  Nick PR #1).

Dead-code cleanup:
- `hull.ts:71-86` → filed under regressions/bugs as low-priority
  cleanup (bundle with whatever Nick PR next touches `hull.ts`).

Plus Rollo's adjacent-gap surface items filed:
- `pointed` / `pear` jaw topology demographic dispatch → filed.
- TWA × timmFlat promote-together → filed.
- Swept-back-long hair × Timm → filed.

### Escalations

None. W2 scope is within the Q1 envelope; no human-in-loop
needed unless Pascal scores collapse and a re-plan is required.

### Risk callouts (non-blocking)

- **Pascal calibration is the W2 wild card.** If Pascal scores the
  16-cell grid below 5 across the board, the issue could be: (a)
  pack-level value tuning (fixable in Nick re-spawn), (b) the
  features-as-decals integration debt biting earlier than Leo's
  audit predicted (would need an orbital-socket promotion to W3),
  or (c) Pascal mis-calibration (the historical drift). Plan
  contingency: if (a), Nick patches and re-renders; if (b), I
  re-plan W3 around socket primitive; if (c), the calibration
  audit IS Pascal's spawn and we trust the AGENTS.md anchor.
- **Render-sheet cadence.** Bob: render `tintin` × 13 + `timmFlat`
  × 16 after each Nick PR lands. Don't let the share-every-render
  rule erode through the subagent layer.
</content>
</parameter>
