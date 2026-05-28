# david-roadmap-review-1

First David spawn in the project. David is CEO; this is his first
operational task: validate the ROADMAP that Bob drafted as bootstrap,
before Claudia plans the first sprint against it.

## Brief

Review `face-lib/ROADMAP.md` (just drafted by Bob — commit ad33532).
Decide whether it correctly captures the annual + quarterly goals Gary
named, surface alignment concerns, recommend revisions if needed.

Gary's stated goals verbatim:

- **Annual / Q4 end-state:** "have api generate a fully clothed person
  in various poses and faces, same for animal, same for monster/etc"
- **Q1 (current):** "get faces to be really really good (not just engine
  refinements but a solid 4-10 styles)"

Bob's interpretation in ROADMAP.md:
- Q4 = generative character API (faces, bodies, poses, clothes, animals,
  monsters; SVG output; deterministic; CLI + LLM tool surface).
- Q1 = 4-10 style packs at quality bar, with 3D hair refactor counted as
  IN-scope (because it unblocks variety, not because it's engine work
  for its own sake).
- Q2 = bodies + clothes + poses; Q3 = animals; Q4 = monsters + API hardening.

Time conventions per Gary: AI year ≈ human month; AI quarter ≈ human
week; AI month ≈ ~2.5 human days; AI sprint ≈ 1 AI week.

## Your task

1. **Q4 vision check.** Does Bob's interpretation of "fully clothed
   person + animals + monsters" capture Gary's actual intent? Anything
   missing (props, scenes, multi-character compositions)? Anything that
   Bob over-scoped that should be cut?

2. **Q1 goal check.** "4-10 style packs at quality bar" — is that the
   right operationalization of "faces really really good"? Or does
   Gary's phrasing imply something else (e.g., demographic variety
   matters more than style-pack variety; or both axes; or something
   else entirely)? Read Gary's words again in context.

3. **Sequencing check.** Bob has Q2 = bodies/clothes/poses, Q3 = animals,
   Q4 = monsters. Is that dependency-correct? Could animals come before
   bodies? Should monsters share a quarter with something else? Surface
   any sequencing concern.

4. **Scope discipline.** What's listed as "OUT of Q1" — is anything
   missing from the explicit deferral list? (Expression primitive,
   hat/accessory primitives are mentioned. Eyes/mouth refinement? Body
   primitive that Q2 would need to start designing now?)

5. **Time-mapping reality check.** AI quarter = human week is Gary's
   metaphor. Honestly: is that achievable given the parallelism we
   have? Or is Q1 actually 2 human weeks and we should say so up front?

6. **Cross-quarter principle alignment.** The roadmap restates mixture-
   not-survival, forest, examples-not-targets as cross-quarter
   principles. Right framing? Anything missing?

## Authority boundary

David can recommend revisions to the ROADMAP, but cannot unilaterally
change project direction. If you spot something that requires a real
pivot (e.g., "Q4 vision is too ambitious, recommend cutting monsters"),
flag it explicitly as a Gary-decision rather than making the call.

## Deliverable

Write `face-lib/research/david-pass-1.md` (200 lines hard cap).
Sections:
1. Q4 vision read — does Bob's draft capture Gary's intent?
2. Q1 goal read — same question for the current quarter.
3. Sequencing concerns (or "none").
4. Scope discipline notes.
5. Time-mapping honesty check.
6. Recommended ROADMAP revisions (specific edits, or "no revisions").

End with a 4-bullet executive summary for Gary + Bob.

Update `## Handoff` here on completion.

## Context

- `face-lib/AGENTS.md` — read your role definition + the rest of the
  crew + the mixture-not-survival rule. You are David, CEO. Operational
  strategy, NOT pivot authority.
- `face-lib/ROADMAP.md` — the draft you are reviewing.
- `face-lib/PROCESS.md` — the lifecycle + decision rights you operate
  within.
- `face-lib/SPRINT.md` — current state.
- `face-lib/BACKLOG.md` — what's deferred today.

## Handoff

David pass 1 complete. Deliverable: `face-lib/research/david-pass-1.md`
(199 lines, under cap). Bob's ROADMAP is structurally sound — not
rubber-stamped, but no pivots recommended.

**Six ROADMAP edits recommended (all within David authority, Bob can
land without re-spawning David):**

1. Q1 success metric: "Q1 ships iff N style packs land at quality bar,
   N ≥ 4. The 3D hair refactor is necessary-not-sufficient."
2. Time-mapping honesty: human-time mappings are calibration metaphors,
   not contracts; expect ±50%; metric is goal-met, not calendar-met.
3. Q1 scope-out additions: eye/mouth primitive rework (deferred unless
   a style pack requires it); API hardening (Q4 lane).
4. Q1→Q2 transition prep: last sprint of Q1 includes Lloyd body-
   architecture design pass.
5. Quality bar restated in ROADMAP itself — currently only in
   AGENTS.md; a fresh spawn reading only ROADMAP wouldn't know what
   "quality bar" means.
6. Pascal calibration audit at first sprint close.

**Four items flagged for Gary (David did NOT decide these):**

- Style-pack-per-category for animals + monsters in Q3/Q4 — confirm
  or scope down.
- Props/objects + multi-character compositions — implicitly out;
  confirm.
- Is 3D hair refactor IN-Q1 vs. parallel-infra given Gary's "not just
  engine refinements" line.
- Count (4-10 packs) vs. depth (demographic coverage per pack) when
  there's a tradeoff.

Next: Bob to share pass 1 with Gary, land the six edits Gary signs
off on, then Claudia can plan Q1-W1 against the revised ROADMAP.
