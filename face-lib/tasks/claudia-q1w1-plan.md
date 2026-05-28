# claudia-q1w1-plan

First Claudia spawn. VP Product + PM. You own the sprint going forward.

## Brief

Plan Q1-W1 against the just-finalized ROADMAP. Bob bootstrapped the
SPRINT.md skeleton during setup; you own SPRINT.md from here. Rewrite
the active sprint goal + ticket queue per your judgment. Bob spawns
per your queue order.

Gary is in autonomous-run mode (no pauses for his input today). Bob
runs the team through cycles; periodic non-blocking thread updates only.
If something genuinely needs Gary, flag it but DON'T block on it —
queue the next ticket that isn't blocked.

## Your task

1. **Read everything.** ROADMAP.md (Q1 goal: faces really really good
   including ALL face primitives; N≥4 style packs at quality bar;
   demographic depth > pack count). PROCESS.md (lifecycle + decision
   rights). AGENTS.md (your role + the crew). BACKLOG.md (known gaps).
   Existing SPRINT.md draft (Bob's bootstrap; rewrite as you see fit).

2. **Rewrite SPRINT.md** with the Q1-W1 sprint goal you propose and a
   prioritized ticket queue. Two natural tracks (track A engine, track B
   style) are in Bob's draft — you can keep, restructure, or replace.

3. **Draft the first 2-3 task files** under `face-lib/tasks/`. Convention
   in `tasks/README.md`. These are what Bob will spawn agents against.
   Most urgent first — be specific about acceptance criteria.

4. **Order the queue.** Tell Bob (in `## Handoff` of this task file)
   the exact spawn order for the next 2-3 agents. Use the agent names
   we have: Nick, Lloyd, Leo, Pascal, Rollo, Holly. Don't queue Holly
   until sprint close (per AGENTS.md). Don't queue Pascal until there's
   substantive output to score.

5. **Set the sprint-close criterion.** What has to be true for you to
   close Q1-W1 and open Q1-W2? Be specific. ("Nick's 3D refactor merged
   AND at least one new style pack candidate proposed by Leo+Rollo" or
   similar.)

## Constraints

- **You don't spawn agents** — Bob does, per your queue.
- **You don't pivot project direction** — Gary's lane.
- **You don't write engineering code** — Nick / Lloyd's lane.
- **You DO own**: sprint contents, ticket priority, task drafts, what
  enters/leaves BACKLOG, when the sprint closes.

## Deliverable

- Rewritten `face-lib/SPRINT.md`.
- 2-3 new task files in `face-lib/tasks/`.
- Updated `## Handoff` here with the spawn order Bob should execute.
- Brief return note to Bob (<200 words).

## Notes

Bob's draft has Track A (Nick implements 3D refactor) and Track B (Leo +
Rollo research one new style pack). You can keep both, restructure,
or replace. Your call.

Q1 hair refactor IS in scope (Gary confirmed: hair is part of face
quality). The 3D refactor design is approved (Lloyd pass 1 in
`research/lloyd-pass-1.md`); Nick is ready to implement when you queue him.

Pascal calibration audit is queued for first sprint close per ROADMAP.

## Handoff

SPRINT.md rewritten. Three task files drafted. Spawn order for Bob:

**Spawn 1 (immediately, longest pole) — Nick.**
Task: `face-lib/tasks/nick-3d-clump-volume.md`.
Implements Lloyd pass 1's 3D clump-volume refactor behind
`clumpMode: 'flat' | 'volume'` flag, default flat. Mixture rule
preserved. Three test cases. Lloyd reviews on completion. This is
the longest piece of work in W1 — spawn first so the loop is
running while research happens in parallel.

**Spawn 2 (in parallel with Nick) — Leo.**
Task: `face-lib/tasks/leo-rollo-stylepack-w1-spec.md`.
Leo writes the pedagogy half of a joint style-pack spec — picks
ONE pack from Gary's candidate list (criteria in the brief), cites
the tradition, names the 3-5 defining decisions, flags any
primitive blockers. Writes file in WIP state, hands off to Rollo.

**Spawn 3 (after Leo finishes pedagogy half) — Rollo.**
Same task file: `face-lib/tasks/leo-rollo-stylepack-w1-spec.md`.
Rollo appends asset-judgment half: NPC slots, demographic grid,
adjacent missing points, mixture-rule check. Same file as Leo,
appended not rewritten. Output is the W2 spec Nick implements.

**Spawn 4 (after Rollo returns; same Leo if context permits, fresh
otherwise) — Leo.**
Task: `face-lib/tasks/leo-face-integration-audit.md`.
Audits eye / mouth / brow integration. Verdict GO / GO-WITH-CAVEATS
/ STOP per primitive. This is upstream-of-W2 risk discovery — needs
to land before W1 closes so Claudia can fold the verdict into the
W2 brief.

**Not queued this sprint:**
- **Lloyd code review** — automatic on Nick's PR landing; Bob
  triggers, no Claudia queue needed.
- **Pascal** — no substantive new output to score this week. Wait
  for W2 close when pack #2 has actually rendered.
- **Holly** — sprint-close role, but W1's regression test IS Nick's
  `flat`-mode promise. Holly's first real spawn is at W2 close (her
  brief should be the test-strategy doc per AGENTS.md
  Holly-first-spawn note).
- **David** — not needed this sprint. Monthly directional review
  (every ~2.5 human days = roughly end of W2 or W3) is the natural
  next David touch.

**Sprint-close trigger.** Claudia re-spawns when all four ship-gate
boxes in SPRINT.md are checked (or when one is provably stuck and
needs re-scoping). Bob renders a representative output sheet after
each landed commit (per the share-every-render rule) and shares
with Gary in the thread.

**Escalations to flag** (non-blocking — keep the queue moving):
- None today. The David roadmap pass already escalated the
  open Gary questions; Claudia's W1 plan respects David's
  recommended edits and doesn't introduce new ones.

Brief return note to Bob is in the spawn-return text, not this file.
</content>
</parameter>
