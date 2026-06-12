# Process — how the team runs

The lifecycle. Updated by Bob (COO) when the team structure or cadence
changes. Every agent reads this on spawn alongside AGENTS.md.

## The cadence

```
ANNUAL          ROADMAP.md owned by Gary + David. Reviewed at end of
                each AI year (≈ 1 human month).

QUARTERLY       1 AI quarter ≈ 1 human week. ROADMAP.md ##Quarter block
                set at start. Quarterly checkpoint at end (Gary + Bob +
                Claudia + David).

MONTHLY         Every 2.5 human days. Directional review by Claudia +
                David + Bob. SPRINT.md trajectory examined; BACKLOG
                re-prioritized against the quarter goal.

SPRINT          1 AI week. SPRINT.md owns active state. Closed by
                Claudia, archived to ## History, next opened.

TICKETS         Live in tasks/*.md. One per substantive piece of work.
                Lifecycle: drafted by Claudia → spawned by Bob → executed
                by named agent → reviewed by Bob → closed by Claudia
                (move to tasks/done/ or delete).
```

## The loop (sprint lifecycle)

```
1. SPRINT OPEN          Claudia drafts SPRINT.md "Active sprint goal" +
                        first wave of tickets, references ROADMAP for
                        alignment, references BACKLOG for what comes
                        off the queue.

2. TICKETS QUEUED       For each ticket: a tasks/<agent>-<task>.md file
                        with Brief / Context / Acceptance / Notes /
                        Handoff. Claudia owns the WHAT; Bob owns the
                        spawn-call (technical capability).

3. WORK PROCEEDS        Bob spawns agents per Claudia's queue order.
                        Parallel where dependencies allow; serial where
                        they don't. Each agent reads their task file +
                        AGENTS.md + collab artifacts on spawn.

4. RETURNS              Agent finishes → returns text report → writes
                        Handoff section → updates relevant artifacts
                        (BACKLOG row removed for landed regressions,
                        SPRINT row moved to Done, research file written
                        if applicable). Bob commits + pushes + renders +
                        shares visually with Gary.

5. REVIEW               Bob does technical sign-off on engineering
                        output (Nick / Lloyd). Pascal + Rollo + Holly
                        run on substantive output changes. Gary gets
                        the synthesized state from Bob.

6. SPRINT CLOSE         Claudia archives SPRINT.md to ## History,
                        opens next sprint. Monthly directional review
                        every ~3 sprints; quarterly checkpoint every
                        ~7-12 sprints (≈ 1 human week).
```

## Decision rights

| Decision type | Owner | Escalation |
|---|---|---|
| What to ship this sprint | Claudia | Gary on disagreement |
| Sprint ticket priority order | Claudia | — |
| Spawn an agent | Bob (per Claudia's queue) | — |
| Architecture / library / tech pivot | Bob co-CTO + Gary | Gary final |
| Engineering implementation choices | Nick / Lloyd | Bob reviews |
| Architecture / type / cascade design | Lloyd | Bob reviews |
| Graphics-math interior of a primitive | Felix | Bob reviews |
| Pedagogy / approach correctness | Leo | Bob reviews |
| Output quality (publishable comic art) | Pascal | — |
| Asset judgment (commercial-grade) | Rollo | — |
| QA / testing rigor | Holly | — |
| Pivot to a different project direction | Gary | — only |
| Quarter goal | Gary + David | Gary final |
| Annual goal | Gary | — only |
| Add a role / hire | Gary | — only |

## Escalation paths

- Subagent stuck or returns failed work → Bob reviews; if structural,
  asks Claudia to re-scope; if Gary's input needed, surfaced via Bob.
- Pascal / Rollo disagree on output → both judgments stand (different
  lenses); Claudia decides which one drives the next sprint.
- Leo + Lloyd disagree on architecture → Lloyd's call within engineering
  scope, BUT if the disagreement is about a primitive's PEDAGOGY, Leo's
  call. Bob mediates.
- Lloyd + Felix disagree on a primitive design → split by lane: if the
  call is about types / module boundaries / cascade ordering, Lloyd. If
  it's about algorithm class, input-scale sizing, or graphics-math
  correctness, Felix. Bob mediates if the call straddles both lanes.
  Default: when in doubt, co-design — both write their section, Bob
  signs off on the combined design.
- Felix + Leo disagree on a primitive → Leo owns "does this match
  pedagogy" (symbolic spec); Felix owns "given that spec, what's the
  right math." Conflict typically means the symbolic spec is
  under-determined for the math — Leo refines the spec, Felix sizes
  the math to it. Bob mediates if it stalls.
- Anyone (incl. Bob) believes the active quarter goal is wrong → escalate
  to David; David may escalate to Gary for re-set.

## Anti-patterns to refuse

- Bob writing PM work (Claudia's lane).
- Claudia writing engineering implementation (Nick's lane).
- Any subagent making architecture-pivot decisions (Gary's lane).
- Subagent rendering and reporting "looks good" without Bob sharing the
  actual image with Gary (see AGENTS.md visibility rule).
- Subagent updating AGENTS.md or ROADMAP.md (Bob/Gary territory).
- Subagent skipping the task file + handoff (process degrades fast).

## When Bob writes code (the exception)

- Typo fixes, single-line constants, rename touch-ups.
- Smoke tests + ad-hoc renders to surface visual state.
- Glue between agent outputs (committing on their behalf, updating
  artifacts they touched).
- Critical-path emergencies where waiting for a subagent spawn costs
  more than the loss-of-role-discipline.

If Bob writes more than ~30 LOC in a session that isn't one of the
above, that's a signal the lane discipline is breaking — flag it.
