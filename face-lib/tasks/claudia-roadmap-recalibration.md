# claudia-roadmap-recalibration

Q1-W4 roadmap recalibration. Gary asked Bob to run a roadmap recalibration
meeting from first principles after what we learned this session
(Pascal anchor drifted 2-3, Gary's eye is ground truth, real use case
is his indie-game tooling, killer feature is character-identity
persistence in the LLM loop). Bob synthesized this as Claudia given
the team's prior written output. ROADMAP.md is the deliverable; this
file is the handoff record.

## Brief

Rewrite ROADMAP.md from scratch. Explicitly drop the prior
Q1/Q2/Q3/Q4 = faces/bodies/people/animals annual structure if it
doesn't serve Gary's real need. Synthesize:

- `face-lib/BOB.md` (real use case, success tiers, Pascal recalibration,
  the LLM loop framing).
- `face-lib/AGENTS.md` top calibration block (sprints are units
  conversion, Pascal anchor rewritten, Gary's eye is ground truth).
- `face-lib/SPRINT.md` (Q1-W4 in flight: Felix+Nick ceiling-raisers,
  Holly test-strategy doc).
- `face-lib/BACKLOG.md` (real items, tech debt, the features-as-decals
  architectural debt).
- `face-lib/research/test-strategy.md` (Holly's doc, just landed).
- `face-lib/research/timmflat-ceiling-audit.md` (the W4 audit that
  named the decal ceiling as architectural, confirmed the two cheap
  levers buy strong-6-old / honest-4-new but not dependable 7).

## What changed in the roadmap

1. **Annual goal reframed.** Was "faces + bodies + poses + clothes +
   animals as substrate coverage by Q4." Now "tool Gary uses for
   indie-game and story asset work, quality in the user-amateur band,
   character identity persistence in an LLM loop, callable surface that
   is a real product."
2. **Quarters dropped as a planning shape.** Replaced with three
   tracks named by the question they answer (A: clear the face
   ceiling; B: make the LLM loop real; C: pack as story contract).
   Sprint-sized, not month-sized — per AGENTS.md top, sprints are
   units conversion, not calendar.
3. **Pascal-5 floor cut as the quality bar.** The recalibrated bar is
   Gary's eye + Pascal-4 on the new anchor table (a real amateur
   sketch). The prior 16/16-strict close was honest off-day-pro by the
   old ruler, which is procedural by the new one.
4. **The LLM loop promoted from Q3 ship-gate footnote to a primary
   engine goal.** Identity persistence is now Track B and named the
   killer feature.
5. **Bodies, animals, multi-character, props, monsters all off the
   planning horizon.** Filed, not refused.
6. **Pack count target dropped (was 4 packs at demographic depth).**
   Replaced with "2 well-exercised packs that prove the story-contract
   abstraction." Track C exists to find the second pack; not promised.
7. **W4 in-flight work (Felix + Nick ceiling-raisers) KEPT.** They are
   real lift and prerequisites for the attachment-model architectural
   work (A2 in the new plan). Not theater.

## Acceptance

- ROADMAP.md replaced. Done.
- Prior roadmap archived inside the new file under "Archived" with the
  explicit reason for replacement. Done.
- Task handoff filed (this doc). Done.
- Short return note for Bob in his return-to-Gary path (separate from
  this file — Bob carries it back to Gary in conversation, not as a
  committed doc).
- No edits to SPRINT.md or BACKLOG.md. Gary may want to act on the
  roadmap before those rebase. Honored.

## Notes

- Bob did not spawn subagents for this meeting. Synthesized from prior
  written output of Leo / Rollo / Lloyd / Felix / Holly / Pascal as
  named in the task brief. Their written passes ARE their input.
- The W4 ceiling audit (`research/timmflat-ceiling-audit.md`) is
  load-bearing for the new ROADMAP — it confirmed that decals cap
  timmFlat at a strong-6-old, and that the cap is architectural
  (the feature-attachment model). That finding is what made Track A2
  the natural next gate instead of "more packs."
- The new plan does NOT pretend to have answers it doesn't. Open
  questions are listed at the bottom of the ROADMAP and flagged for
  Gary.

## Handoff

Bob takes the new ROADMAP to Gary in the next session and pairs it
with the short return note (separate, conversational, < 300 words).

Next sprint, IF Gary accepts the recalibration:

1. Felix + Nick finish the ceiling-raisers (already in flight, in
   `tasks/felix-nick-timmflat-ceiling-raisers.md`).
2. Pascal re-scores against the recalibrated anchor; Bob looks at the
   images first and shares them to Gary before the score.
3. Leo + Felix + Lloyd open the feature-attachment design pass (A2).
   New task file: `tasks/leo-felix-lloyd-attachment-design.md` when
   Gary approves.
4. Holly's `--gate` regression scaffold lands once clump-hair
   determinism is confirmed (Holly's doc named this as the
   precondition).
5. Open question to Gary at next-track gate: when A3 ships, Track B
   (LLM identity loop) or Track C (second pack) first? Bob's
   recommendation: Track B.

SPRINT.md does NOT get rebased here. Claudia rebases it on the next
sprint open, against whichever ROADMAP shape Gary signs off on.
