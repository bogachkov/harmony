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

(Claudia fills in.)
</content>
</parameter>
