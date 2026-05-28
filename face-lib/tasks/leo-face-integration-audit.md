# leo-face-integration-audit

A focused Leo audit on whether the eye / mouth / brow primitives are
strong enough to carry W2's new style pack — or whether one or more
needs Leo-stop-the-line treatment before Nick implements the pack.

This is upstream-of-W2 risk discovery, not a primitive-rework campaign.
Output is a short md (1-3 pages) that answers: GO, GO-WITH-CAVEATS,
or STOP.

## Brief

Pascal's standing finding across multiple prior rounds: faces read as
"stacked primitives on a face frame," not as one integrated drawn
thing. The user has confirmed this is real (recalibration note in
AGENTS.md Pascal section). Hair and jaw have had deep Leo passes;
eye / mouth / brow have not at the same rigor.

The W2 ship — a second style pack landing at Pascal ≥ 5 — depends on
eyes / mouth / brows reading as integrated under at least two style
choices (current `tintin` + whichever pack Leo+Rollo pick this week).
If integration is broken at the primitive level, W2 can't ship by
preset tuning alone.

Your task is to **audit, not fix**. Specifically:

1. **Render a small probe sheet** (5-10 faces) using the existing
   `face-lib/scripts/gallery.ts` library — cross-product across
   demographics × expressions × current style packs (`default`,
   `tintin`, `ligneClaire`). NOT 6 near-clones. Per AGENTS.md
   variety-in-test-rotation rule. Read the renders carefully.
2. **Per primitive (eyes / mouth / brows), answer:**
   - Are the parameter names artist-vocabulary, or geometric? (Per
     your standing audit framework.)
   - Does the construction order mirror the artist's mental decision
     tree? Where does the engine compute features before construction
     vs. after?
   - Are features dependent on the construction grid (ratios of
     masses), or hardcoded? Hardcoded = won't self-adjust under a
     style pack that flips proportions.
   - Does this primitive have a documented pedagogical basis (cite),
     or is it invented?
   - Is the symbolic decision tree captured, or is the code drawing
     motor-execution of each stroke?
3. **Integration question (the load-bearing one):** when these three
   primitives render together with hair on a single face, do they
   read as ONE drawn thing? If not, where is the seam visible?
4. **Verdict per primitive.** One of:
   - **GO** — primitive is solid, will carry W2 pack as-is.
   - **GO-WITH-CAVEATS** — primitive carries W2 if pack avoids
     specific knob X / construction Y. Name the constraint.
   - **STOP** — primitive needs rework before W2. Estimate the size
     of the rework (knob-tweak / primitive-amend / primitive-replace).
     A STOP verdict triggers a follow-up Leo brief in W2 to design
     the fix, and may bump the W2 pack implementation to W3.

## Context

- `face-lib/AGENTS.md` — Leo section, especially the symbolic-vs-
  motor rule and the parameter-name vocabulary table.
- `face-lib/AGENTS.md` Pascal section — the "if features don't
  integrate into a single drawn thing, no score above 4" rule. This
  audit is upstream of Pascal's finding.
- `face-lib/research/leo-audit.md`,
  `face-lib/research/primitives-nose-ears-neck-brows.md` — your
  earlier passes on related primitives. Update / amend where
  appropriate.
- `face-lib/research/leo-jaw.md` — example of the rigor you applied
  to jaw. Same bar for eye / mouth / brow here.
- `face-lib/BACKLOG.md` — "Expression primitive is weak" row from
  Rollo. The expression resuscitation work that ROADMAP names as
  Q1 in-scope likely flows out of this audit's findings.
- `face-lib/src/model/scaffold.ts`, `src/model/params.ts`,
  `src/render/svg.ts` — where the primitives live. Read what you
  need; you're not editing code.

## Acceptance

- One md at `face-lib/research/leo-integration-audit-1.md` (or
  similar naming you choose).
- Probe sheet renders saved or referenced (Bob can re-render if
  you give him the gallery commands).
- Per-primitive verdict (GO / GO-WITH-CAVEATS / STOP) is explicit.
- For each STOP verdict, rough rework estimate is named (small /
  medium / large; LOC ballpark if you can).
- For each GO-WITH-CAVEATS verdict, the constraint on W2 pack
  selection is named so Claudia can fold it into the W2 brief.
- Citations attached to any pedagogy claims.
- BACKLOG candidate items flagged (Claudia promotes or defers).

## Notes

- **Stop-the-line authority applies.** If you discover a primitive
  is fundamentally wrong, you can say STOP. That delays W2; better
  that than building W2 on a broken primitive. Claudia respects
  STOP verdicts (per PROCESS.md decision rights).
- **Don't widen scope.** This is an audit of eye / mouth / brow
  integration ONLY. Not nose, not ears, not jaw (those have been
  audited). If a nose / ear / jaw issue is causing the integration
  failure, flag it; don't re-audit it.
- **Examples-are-not-targets.** Pick probe demographics broadly;
  don't tune your audit lens to "do these eyes look like a specific
  character's eyes." The integration question is structural.
- **Mixture rule reminder.** If you call STOP and recommend a
  rework, default recommendation per AGENTS.md is "expose the new
  approach as a knob; keep the old as a selectable point." Don't
  recommend deletion unless the existing primitive is genuinely
  broken (not just one valid point in a wider space).
- Time budget: this should be 1-2 hours of audit work, not a full
  pedagogy treatise. The decision Claudia needs is binary-ish: can
  W2 ship a pack on these primitives, or not.

## Handoff

(Leo fills in. Expected: "Audit md written. Verdicts: eyes=X,
mouth=Y, brows=Z, integration=W. BACKLOG candidates: A, B. STOP
flags raised: 0 / 1 / 2. W2 implications: <one sentence>.")
