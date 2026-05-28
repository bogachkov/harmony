# lloyd-pass-2-review

Lloyd's second spawn. Code review of Nick's implementation of Lloyd
pass 1 design. Triggered by Bob (VP Eng) per Claudia's plan, no Claudia
queue needed.

## Brief

Nick shipped Lloyd pass 1 end-to-end across seven commits ending at
`909244c`. Boxes 1+2 of Q1-W1 ship gate closed:

- `clumpMode: 'flat'` is the default; all 13 existing hairstyles render
  **bit-for-bit identical** to pre-refactor (stricter than your
  pass 1 §5 promise of visually-equivalent).
- `clumpMode: 'volume'` produces clean renders of all three fixtures
  you specified (`shortBob`, `longCurtain`, `coilyHalo`).

Net +444 LOC engine code + 148 fixtures, above your projected +150
(documented drift in `tasks/nick-3d-clump-volume.md` handoff).

## Three items Nick explicitly flagged for your review

1. **Tangent-decay formula `1 − 0.8·gravity·t` is from intuition, not
   measurement.** Is this defensible? Or does it need to be derived from
   actual hair-strand-mechanics first principles? (hair-theory.md §4
   has the wave-decay math; check whether Nick's term matches.)

2. **`hullGroup` keying by `sideRoll`-bucket loses fidelity vs.
   3D-position-based bucketing.** Concretely: when two clumps land in
   the same hull group but in different 3D regions, the convex hull
   merges them as one silhouette even though they should read as two.
   Is this an acceptable v1 simplification, or does it need to be fixed
   before any shipping hairstyle adopts volume mode?

3. **`data-hull-group` debug attr in SVG output.** Nick left a debug
   attribute on the hull `<path>` elements showing the group's avgZ.
   Is this acceptable for a shipped engine? Or should it be gated
   behind a debug flag / dropped entirely?

## Plus a fourth concern Bob surfaced from the renders

Renders show the convex-hull-collapses-concavities limitation more
dramatically than your §7 tech-debt note suggested. `coilyHalo`
renders as a hexagonal halo; `longCurtain` reads as a cloaked figure.
The architecture is right (gravity + radial both producing the
expected geometry) but the v1 hull's output is far from publishable.

You filed alpha-shape as the fix per §7 + Nick added the BACKLOG row.
Question: is "deferred until a shipped hairstyle adopts volume mode"
still the right deferral, given how strong the artefact is? Or should
alpha-shape move earlier in Q1 (W2 or W3) so that any volume-mode
adoption isn't blocked on ugly silhouettes?

## On completion

- Append `## Pass 2 — Nick implementation review` to
  `face-lib/research/lloyd-pass-1.md` (100 line cap).
- End with a 3-bullet verdict per concern: APPROVED-AS-IS /
  APPROVED-WITH-EDITS / NEEDS-CHANGES.
- Update `## Handoff` here.
- Brief return note to Bob (<200 words).

## Context

- `face-lib/AGENTS.md` — your role + decision rights + mixture rule.
- `face-lib/research/lloyd-pass-1.md` — your original design.
- `face-lib/tasks/nick-3d-clump-volume.md` — Nick's brief + handoff.
- `face-lib/SPRINT.md` — W1 ship-gate state.
- Code paths: `src/render/hull.ts`, `src/render/project.ts`,
  `src/render/svg.ts`, `src/model/hair-field.ts`, `src/model/scaffold.ts`,
  `src/hairstyles/{shortBob,longCurtain,coilyHalo}.ts`.

You do NOT need to render anything; Nick's renders are at
`/tmp/lloyd-fixtures/` and `/tmp/final-sheet/`.

## Handoff

**Reviewed.** Verdicts appended to `research/lloyd-pass-1.md` under
`## Pass 2 — Nick implementation review` (83 lines, under cap).

Summary of the four verdicts:

1. **Tangent-decay `1 − 0.8·gravity·t`** — APPROVED-WITH-EDITS.
   Defensible directionally; not derivable. Expose the `0.8` magic
   constant as `spec.tangentDecay?: number` (default 0.8) so a future
   curl-mechanics pass can tune per regime. Not a ship blocker.
2. **`hullGroup` keyed by `sideRoll`** — APPROVED-WITH-EDITS,
   escalated. Use `centreU` quadrant instead of `sideRoll` (one-line
   fix in `scaffold.ts:1414`). Required before any shipped style
   adopts `clumpMode: 'volume'`. Visible in the parting-gap collapse
   on `longCurtain`.
3. **`data-hull-group` debug attr** — NEEDS-CHANGES. Drop the
   `avgZ` float leakage; if a debug overlay is wanted, gate behind
   `p.style.debug` and emit the categorical group key, not the
   float. ~6 lines.
4. **Convex-hull artefact + alpha-shape deferral** — NEEDS-CHANGES
   on the deferral (not on hull.ts itself, which is fine code).
   Renders are unshippable; pull alpha-shape into **Q1-W2** as
   `hullMode: 'convex' | 'alpha'` parameter. Convex stays as a mode
   per mixture rule. Doing this AFTER a W2 pack lands wastes the
   refactor.

**Also flagged in passing (not the four-item review surface):**
hull.ts:71-86 has a dead `theta/cx/cy` derivation block left in
during dev; the `void cx; void cy;` discard is a code smell.
Clean in follow-up, not a blocker.

**Status for Bob:** PR can merge with item 3 fix (drop debug attr,
trivial). Items 1 and 2 are next-PR work. Item 4 is a sprint-plan
decision for Claudia + Bob.
</content>
</parameter>
