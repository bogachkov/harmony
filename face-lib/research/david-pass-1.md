# David pass 1 — ROADMAP audit

First David spawn. Reviewing the ROADMAP Bob drafted (commit ad33532)
against Gary's verbatim goals. CEO scope: recommend revisions, flag
Gary-calls, no unilateral pivots. Bob got the bones right — annual
vision and Q1 framing match Gary's words. Three items need Gary's
attention before Claudia plans the first sprint; none disasters, all
framing.

## 1. Q4 vision read

**Gary verbatim:** "have api generate a fully clothed person in
various poses and faces, same for animal, same for monster/etc."

**Bob draft:** generative character API — faces + bodies + poses +
clothes; distinguishable animals; distinguishable monsters/creatures;
multiple aesthetic styles per category; multiple demographic / breed
/ archetype variations; SVG + PNG output; deterministic; CLI + LLM
tool-call surface.

**Verdict:** captures the substance. Two additions beyond Gary's
literal words that Bob should justify or Gary should bless:

- "Multiple aesthetic STYLES per category" for animals + monsters.
  Gary said "various poses and faces" for people; he did NOT
  explicitly extend style-pack variety to animals + monsters. A
  Tintin-style cat vs a Disney-style cat is a reasonable extrapolation
  of the Q1 style-pack work, but it IS an extrapolation. **Flag for
  Gary:** confirm style-pack-per-category for Q3/Q4, or one
  competent style per category.
- SVG/PNG/deterministic/CLI/LLM surface is asserted as given. That's
  accurate to the existing engine — fair as continuity, not new scope.

Two things Gary's "etc" leaves ambiguous, both Gary-decisions:

- Props / objects (weapons, furniture, vehicles). Implied by the
  storyboard arc Gary names as his "why" but not in the literal goal.
  Bob excluded them. I think that's right; flag for Gary's veto.
- Multi-character compositions / scenes. Same situation. Probably
  out of scope for Q4; storyboards are the downstream arc, not this
  year. Worth Gary's explicit nod.

## 2. Q1 goal read

**Gary verbatim:** "get faces to be really really good (not just
engine refinements but a solid 4-10 styles)."

**Bob draft:** 4-10 style packs at quality bar, demographic axis
inside each pack, expression resuscitation, 3D hair refactor IN-scope
as variety-unblocker.

**Verdict:** the 4-10 number is Gary's; demographic-axis-inside-pack
is a reasonable read of "really really good" (a pack that only renders
one demographic isn't really good). Two tensions:

- **"Not just engine refinements" vs. 3D hair refactor in-scope.**
  Gary's phrasing explicitly de-prioritizes engine work. Bob's
  rationale — "refactor unblocks variety, not engine work for its own
  sake" — is defensible, but it's Bob's framing, not Gary's words.
  **Flag for Gary:** is the 3D hair refactor in-Q1, or parallel-infra
  not counted? My recommend: keep in-scope but make the yardstick
  explicit — Q1 ships iff N style packs land at quality bar; refactor
  is necessary-not-sufficient.

- **Demographic variety vs. style variety — which dominates?** Gary
  names styles. Rollo pass 1 names demographics (tight-coily gap is
  the largest). Both matter. Bob's "demographic INSIDE each pack"
  framing makes them orthogonal, which is correct but doubles the
  work. **Flag for Gary:** is "4 packs × strong demographic" better
  than "8 packs × thin demographic"? Default read says depth; Gary's
  exact words ("4-10 styles") emphasize count.

## 3. Sequencing concerns

Bob: Q2 bodies/clothes/poses → Q3 animals → Q4 monsters + API.

Q2 carries the bulk of new infrastructure (skeletal pose, clothing
layer, body topology). Q3 + Q4 ride on that infra with new topology
dispatchers. Defensible.

Counter-arguments — not strong enough to recommend a pivot:

- **Animals don't need a human skeleton.** Q3 could start before Q2
  finishes; the cranium topology dispatcher is independent of human-
  body work. Parallelism opportunity Gary could opt into.
- **Monsters + API hardening as Q4 risks under-fill.** A lot to do
  if monsters is itself hard (asymmetry, multi-appendage). API
  hardening could slip to Q5 or swap with a softer monster scope.
  Flagging that "monsters + API hardening" deserves a real scoping
  pass when Q4 opens.

Verdict: sequence is OK as drafted; the above is Gary-information,
not Gary-decision.

## 4. Scope discipline notes

Bob's "out of Q1": bodies, clothes, poses, animals, monsters,
hats/accessories/glasses. Reasonable.

Gaps in the explicit deferral list:

- **Eye and mouth primitive refinement.** Pascal flagged expression
  as weak (already in-scope to resuscitate). But the underlying eye +
  mouth primitives have not had a Leo audit at the rigor of jaw or
  hair. If a style pack reveals an eye-primitive weakness, do we fix
  in Q1 or defer? Recommend ROADMAP make explicit: eye/mouth rework
  IN-Q1 only if a style pack requires it (same rule as accessories).
- **Body-primitive design prep.** Q2 starts in 1 human week. Lloyd
  should design the body topology pipeline late-Q1 so Q2 opens with
  implementation. Bob doesn't note this. Recommend a "Q1→Q2 transition
  prep" line.
- **Pascal calibration check.** Pascal's prior failure (7.5/10 on
  2/10 reality) is in AGENTS.md but not surfaced in ROADMAP as a Q1
  risk. The quality-bar judgment depends on Pascal being calibrated
  honestly. One-liner in Q1: "Pascal calibration audited at first
  sprint close."

## 5. Time-mapping honesty check

AI quarter = 1 human week. Q1 work as drafted:

- 3D hair refactor (Lloyd designed, Nick implementing; Holly regression).
- 3-7 new style packs at quality bar (each needs Rollo+Leo spec, Nick
  implementation, Pascal/Rollo review, mixture-rule preservation).
- Expression primitive resuscitation.
- Forest registry maintenance.

Honest read: the low end (3 packs) is plausibly 1 human week if
parallelism holds and no style pack triggers a Leo-stop. The high end
(7 packs) is 1.5-2 human weeks realistic. The 3D refactor alone could
eat a sprint if Nick hits surprises.

**Recommend ROADMAP say so:** rather than pretend Q1 = 1 human week
flat, name a range. "Q1 ≈ 1-2 human weeks calibration; metric is
goal-met, not calendar-met." Gary's metaphor is a calibration knob,
not a contract — the ROADMAP can say that out loud. Not a pivot. A
framing honesty edit.

## 6. Recommended ROADMAP revisions

Specific edits in priority order. None are pivots; all within David
authority modulo the Gary-flags noted above.

1. **Q1 success metric.** Add: "Q1 ships if N style packs land at
   quality bar, where N ≥ 4. The 3D hair refactor is necessary-not-
   sufficient; landing the refactor without landing style packs is
   not a Q1 win."

2. **Time-mapping honesty.** Edit "Time conventions" to add: "These
   are calibration metaphors, not contracts. Quarter close is goal-
   met, not calendar-met. Expect ±50% on the human-time mapping."

3. **Q1 scope-out additions.** Add: "Eye/mouth primitive rework
   (deferred unless a style pack requires it)." Add: "API hardening
   (Q4 lane)."

4. **Q1→Q2 transition prep.** "Last sprint of Q1 includes a Lloyd
   body-architecture design pass so Q2 opens with implementation."

5. **Quality bar restated in ROADMAP.** Right now ROADMAP says "really
   really good" with no bar definition; a fresh spawn reading only
   ROADMAP wouldn't know what "quality bar" means. Three-line
   restatement of the Tintin supporting-side-character standard.

6. **Pascal calibration audit.** Add to Q1: "Pascal calibration
   audited at first sprint close — re-anchor against AGENTS.md table
   if drift detected."

## Items that escalate to Gary

David flagging, not deciding:

- Style-pack-per-category for animals + monsters in Q3/Q4 — confirm
  or scope down.
- Props/objects and multi-character compositions — implicitly out;
  confirm.
- 3D hair refactor counted IN-Q1 vs. parallel infra — Gary's "not
  just engine refinements" makes this his call.
- Style-pack count vs. demographic depth trade-off — "4-10 styles"
  is Gary's verbatim; demographic-inside-pack expansion is Bob's.

## Executive summary for Gary + Bob

- Bob's ROADMAP is structurally right: Q4 vision and Q1 framing match
  Gary's verbatim goals; sequencing is defensible; cross-quarter
  principles (mixture, forest, examples-not-targets) carried correctly.
  This is not a rubber-stamp — it's a clean draft.
- Three items need Gary's nod, not David's: (1) is style-pack-per-
  category in-scope for animals + monsters, (2) is the 3D hair
  refactor IN Q1 or parallel infra given "not just engine refinements",
  (3) on tradeoff, does count (4-10 packs) or depth (demographic
  coverage within each pack) win?
- Time-mapping needs honesty: Q1 as drafted is 1-2 human weeks, not
  flat 1 week. Recommend ROADMAP say "metric is goal-met, not
  calendar-met" rather than pretend the metaphor is a contract.
- Six small ROADMAP edits recommended (Q1 success metric, time
  honesty, scope-outs, Q2 prep, quality-bar restated, Pascal
  calibration audit). All within David authority; none pivots. Bob
  can land these without re-spawning David.

## Pass 2 — scope revision validation

### 1. Is Bob's monsters-vs-animals pushback sound?

Partly. The architectural claim is real — animals exercise the cranium
topology dispatcher as a generalization test; monsters (asymmetry +
multi-appendage as parametric choices) are arguably an easier extension.
Defensible AS tech. BUT Gary said "I can sacrifice monsters" — he named
monsters as the cuttable. Bob is reframing Gary's product preference as
architecturally backwards. Bob's "engine reveals its own generality" is
tech-aesthetic; Gary asked for shippable categories, not engine
self-revelation. Honest read: Bob's tech argument is correct AS tech
and likely wrong AS a product call. Gary's storyboard "why" also needs
animals more than monsters (downstream demand) — so product and tech
converge on the same cut by coincidence. Land the revision on Gary's
product logic, not engine-generalization logic.

### 2. Does Q3 = "people done well" have enough teeth?

No. "Cross-style consistency, full-character coherence, LLM-tool-call
surface tested" is a category list, not a gate. Recommend Q3 ships iff
(a) all Q1 style packs extend across Q2 body/clothes/pose at Pascal ≥5
/ Rollo-ship, AND (b) a real LLM-tool-call session produces N coherent
character requests end-to-end. Without concrete gate, "people done
well" becomes "people slightly better" and the team coasts.

### 3. Is monsters-as-stretch the right framing?

Tighten it. "Stretch if capacity" is mushy and invites Q4 scope creep
that under-delivers on animals. Better: monsters explicitly out of this
AI year, revisited at next annual. Gary offered the sacrifice — take
it cleanly.

### 4. What the revision missed

- **Q2 unchanged is suspicious.** If Q3 is the "people done well" gate,
  Q2 bodies/clothes IS the Q3 substrate — needs explicit per-style-pack
  handoff requirement, not generic body grafted on faces.
- **Style-pack-per-animal open question** gets sharper, not softer,
  now that animals carry Q4. Flag for Gary at next checkpoint.
- **API hardening** was Q4 lane. Where does it go now? Don't let it
  vanish.

### Summary

- Support with edits: tighten Q3 gate to concrete (style-pack × body/
  pose × LLM-tool-call coherence) criteria, not category list.
- Support with edits: drop monsters fully ("out of year"), not stretch.
- Push back on framing: land on Gary's product logic (monsters named
  cuttable), not Bob's engine-generalization argument.
