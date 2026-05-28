# holly-test-strategy-doc

Q1-W4 Box 4 — Holly's FIRST spawn. Test-strategy doc, deferred since
W1. MUST land before Q2 triples the primitive surface (torso / limbs /
clothing layer / pose). Runs fully PARALLEL to the master-tier (B) lane
— zero code overlap.

## Brief

Per AGENTS.md: "Q1 Holly is mostly a placeholder role until the testing
discipline is real. First Holly spawn should be a brief on 'what does QA
look like for a parametric art engine' — likely produces a test-strategy
doc before any actual test code is asked of her."

David's W4 direction (Gary-confirmed) made this the gating slice of (C):
"Q2 triples the primitive surface. Entering that with no articulated
regression convention is how the cascade-leak class of bug comes back.
Holly's doc is 'what does tests passed mean for a parametric art engine'
— a design artifact, not test code. It must land before Q2, and W4 is
the slot."

**This is a DESIGN artifact, not test code.** You define the convention;
Q2 opens against it.

## Context

- `face-lib/AGENTS.md` — your mandate (reproducible, regression-
  resistant, gallery covers the parameter surface honestly) + Pascal's
  lens (output quality) + Rollo's lens (asset judgment) — you are
  distinct from both.
- `face-lib/research/pascal-w2-timmflat.md` — how Pascal scores a fuzzy
  output (absolute anchor table). Your "tests passed" convention is the
  REPRODUCIBILITY/REGRESSION complement to Pascal's quality lens, not a
  duplicate of it.
- The regression patterns the team already uses ad-hoc, which your doc
  should formalize:
  - **Byte-identical sweeps** — W3's Q1 manifest proved
    `default`/`tintin`/`ligneClaire` byte-identical across an 816-cell
    sweep (`default × all hairstyles × all demographics`). This is the
    current mixture-rule keystone. When is byte-identical the right
    bar, and when is it too strict (e.g. a designed drift)?
  - **Visual-diff thresholds** — for cells that are SUPPOSED to drift
    (timmFlat opting into a new knob), byte-identical is wrong; you
    need a visual-diff convention. What threshold, what tooling, who
    eyeballs the diff?
  - **The forest-registry mixture rule** (`face-lib/BACKLOG.md` filed-
    aesthetics) — each filed aesthetic is supposed to stay REACHABLE.
    How does a regression test assert "this aesthetic is still
    reachable" so a future knob can't silently delete it?
  - **Gallery coverage** — AGENTS.md "variety in test rotation"
    (sample 12-20 cases across demographics × hairstyles × ethnicities
    × expressions, not 6 near-clones). How does the gallery prove it
    covers the parameter surface honestly rather than confirmation-bias
    near-clones?

## Concrete deliverable

`face-lib/research/holly-test-strategy.md`:

1. **What "tests passed" MEANS for a parametric art engine.** The
   core definition. Distinguish: (a) byte-identical regression (the
   mixture-rule guard), (b) visual-diff-within-threshold (designed
   drift), (c) reachability assertions (forest registry), (d) gallery
   coverage honesty. Name when each applies.
2. **The regression convention.** A concrete, adoptable convention for
   how a PR proves it didn't regress prior aesthetics — building on the
   816-cell byte-identical sweep pattern but generalized. Name the
   minimal test scaffolding Q2 should open against (what scripts /
   fixtures, where they live — `face-lib/scripts/` already has
   `felix-broad-regression.ts`).
3. **Visual-diff threshold proposal.** For the designed-drift case
   (W4's line-weight multiplier touches a shared render path — a real
   live example): what's the threshold convention, what tooling, and
   the human-eyeball escalation path when a diff exceeds it.
4. **The Q2 readiness gap.** Q2 triples the surface (bodies / clothes
   / poses). What does the testing discipline need BEFORE that lands so
   the cascade-leak class of bug (a pedagogy contract silently clobbered
   in the cascade) can't recur on the bigger surface? Name it concretely
   — this is the doc's reason for existing.

## Acceptance

- The "tests passed" definition is written and concrete enough that a
  future Holly (or Nick) can apply it without re-deriving it.
- The regression convention names the minimal scaffolding Q2 opens
  against (not a full test suite — the convention + the seed).
- A visual-diff threshold proposal exists, grounded in the W4
  line-weight-multiplier shared-path case as the worked example.
- The Q2-readiness gap is named.

## Notes

- DESIGN, not code. No test suite asked of you this spawn — the doc is
  the deliverable. (Thin regression-coverage CODE is W4 fill that slips
  to Q2-open if the (B) lane overruns — Gary-confirmed the (C) minimum
  is THIS doc.)
- You are NOT Pascal (quality) or Rollo (asset). Your lens is
  reproducibility + regression-resistance + honest coverage. Where your
  convention intersects Pascal's scoring (e.g. "is a visual diff a
  regression or a designed improvement?"), name the handoff to Pascal —
  don't absorb his lens.
- Zero code overlap with the (B) lane — Bob spawns you at W4-open and
  you run to completion alongside it.

## Handoff

(Holly fills in on completion. Name the minimal scaffolding Q2 should
open against so Claudia can queue it into Q2-open.)
