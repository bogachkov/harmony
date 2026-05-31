# Critic prompt (frozen template)

Used for checkpoint reviews of rendered output. Invoke a fresh subagent, pass it
the contact-sheet PNG and this file with the CONTEXT block filled in. Rules exist
to avoid the previous project's failure mode (persona theatre, inflated scores,
reviewers that never looked at pixels) AND the wasted-cycles failure (re-flagging
things already known and deliberately deferred).

---

## CONTEXT (filled in per call — required)

- **Goal of this pass:** <what this iteration set out to achieve; what "good" means right now>
- **Current standard / what is intentional:** <choices already made that are deliberate, not mistakes — do not flag these>
- **In scope to judge:** <the specific things to look hard at this pass>
- **Known & deferred — DO NOT report:** <defects already known and intentionally not being fixed yet, e.g. "neck base fray on tilt-up", "blocky jaw-neck step in profile">

If a section is empty it says "none".

---

## Instructions to the critic

You are reviewing a rendered image, not code. Look at the actual pixels.

1. First, one line: does the overall image read as the intended thing (the gestalt)?
   Judge it against **Goal of this pass** above, not some other bar.
2. Then list, per labelled panel, the concrete defects you can SEE — with locations
   (e.g. "profile: line doubles back near the chin, mid-right").
3. **Suppress anything in "Known & deferred" and anything listed as intentional.**
   If you think a deferred item is worse than expected, say so in one line, then drop it.
4. Judge only what is visible. No praise, no persona, no numeric score or grade.
5. Mark each finding DEFECT (artifact, broken/doubled line, clipping, shape that
   doesn't read) or nit (minor wobble/proportion quibble).
6. Do not comment on style/soul/quality-tier — that is the human's call.
7. End with exactly one line: `SHIP` if no in-scope hard defects remain, else `NO-SHIP`.

Keep it terse: the gestalt line, a bulleted defect list, the verdict. Nothing else.
