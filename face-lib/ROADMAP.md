# Roadmap

The longer view. Updated by the CEO (David) and CTO/owner (Gary) at the
annual review; reviewed at each quarterly checkpoint by Tech Lead (Bob)
and VP Product (Claudia) for whether the active quarter is tracking.

## Time conventions

Per Gary's framing: AI time is a calibration metaphor, not a contract.
Human-time mappings are useful for cadence but expect ±50%; the metric
is "goal met," not "calendar met."

- **AI year** ≈ 1 human month
- **AI quarter** ≈ 1 human week
- **AI month** ≈ ~2.5 human days
- **AI sprint** ≈ 1 AI week (sub-quarter; multiple per quarter)

Reviews:
- **Quarterly checkpoint** (≈ end of each human week) — Gary + Bob + Claudia
  + David review goal-state, course-correct, set next quarter.
- **Monthly directional review** (≈ every 2.5 human days within a
  quarter) — Claudia + David + Bob review sprint trajectory.
- **Sprint close** (each AI week) — Claudia closes the sprint, archives
  SPRINT.md to history, opens the next.

## Annual goal (current AI year)

**Generative character API:** by Q4 the engine produces fully-clothed
humans (faces + bodies + poses + clothes), distinguishable animals, and
distinguishable monsters/creatures — each in multiple aesthetic styles,
each in multiple demographic / breed / archetype variations. Output is
emit-to-SVG (and downstream PNG) with deterministic seeds, exposed via
the existing CLI + LLM tool-call surface.

This is the substrate for the longer arc (LLM-driven games, comics,
storyboards) that Gary names as his personal "why."

### Out of scope for this AI year (Gary confirmed)

- Props / objects (held items, furniture, etc.)
- Scenes / backgrounds
- Multi-character compositions (group shots, interactions)

These are real future scope, but not in this year's program.

## Quality bar (what "good" means here)

A render meets quality bar iff it would survive use as the named asset:

- **Pascal anchor (comic-art absolute):** ≥5 on the 0-10 anchor table in
  AGENTS.md — "a real human pro could plausibly have drawn this on an
  off day. Recognizable as a person, line has life, but with visible
  weaknesses an editor would flag." Pascal 5 is the floor; Pascal 7 is
  the working-pro target.
- **Rollo asset judgment:** "I would ship this as an NPC portrait /
  side-character / indie comic supporting role." Rollo's lane is softer
  than Pascal's but more product-grounded.
- **Gary's eye:** the final arbiter. Both Pascal and Rollo can be wrong
  in the same direction; Gary catches that.

A render does NOT need to satisfy all three to count as forest-tile
(per mixture-not-survival rule); but to count toward "Q1 quality
deliverable," it should satisfy at least Pascal ≥5 AND Rollo "would
ship."

## Quarterly breakdown

### Q1 (current) — Faces, really really good

**Goal (Gary verbatim):** "get faces to be really really good (not just
engine refinements but a solid 4-10 styles)" — clarified by Gary: "Q1
must certainly include all aspects of face looking high quality
including obviously hair."

So Q1 covers ALL face primitives: hair, eyes, mouth, brows, integration
across them. Hair is explicitly named; the others fall in as needed for
"high quality" reading.

**Concrete deliverable:** N style packs at quality bar, with
**demographic depth > pack count** when they trade off. Gary's call: 4
deep packs beats 10 shallow ones. N ≥ 4 is the ship floor.

"Demographic depth" = each pack renders cleanly across age (child / teen
/ adult / elder) × jaw topology (square / oval / round / pointed / pear
/ jowled) × hair (current 12-13 styles, expanding) × skin/hair tone.

A "style pack" is a coherent set of rendering choices — eye style, line
weight, color palette, default proportions, characteristic hair bias —
that produces an instantly recognizable aesthetic. Current state: 3
packs exist in code (`default`, `tintin`, `ligneClaire`); only `tintin`
has been substantially exercised.

**Scope INSIDE Q1:**

- The 3D hair refactor (Lloyd pass 1 design approved; Nick implementing).
  Hair is part of face quality per Gary, so this counts.
- N≥4 style packs at quality bar.
- Eye / mouth / brow primitive work AS NEEDED for face quality (per
  Gary's "all aspects of face"). NOT a separate primitive-rework
  campaign; specifically the integration + finishing that makes a
  rendered face read as a whole drawn thing rather than parts stacked
  on a frame.
- Expression primitive resuscitation (Pascal flagged it weak; covered
  under "all aspects of face").
- Forest registry stays healthy (mixture rule).
- Last sprint of Q1 includes Lloyd's body-architecture design pass
  (Q2 prep — gives Q2 a running start).

**Scope OUT of Q1 (explicitly deferred):**

- Bodies, clothes, poses → Q2.
- Animals → Q3.
- Monsters → Q4.
- API hardening → Q4 lane.
- Hat / accessory / glasses primitives → deferred unless a style pack
  REQUIRES one to render its aesthetic at all.

**Pascal calibration audit at first sprint close.** Pascal historically
drifted (4/10 lateral × 3 rounds with different artifacts). Sprint-close
audit checks that Pascal is scoring against the anchor table, not against
last-round delta.

### Q2 — Bodies, clothes, poses

The "clothed person." Takes the face engine as a head and gives it a
torso, limbs, a clothing layer, and parametric pose. Style packs from
Q1 must extend to the body (a Tintin-style body, a Disney-style body, etc.).

### Q3 — Animals

Distinguishable mammal / bird / fish / etc. archetypes. New cranium
topology dispatcher (the face engine's jaw dispatcher work generalizes).

**Open question (Gary deferred):** style-pack-per-category for animals
— i.e., do we ship 4-10 styles × animals, or do animals render in the
existing human style packs? Gary: "I am open on that. Engine vs style
separation is important though." Decided at Q3 quarterly checkpoint.

### Q4 — Monsters / creatures + API hardening

Asymmetry, multiple appendages, non-human proportions. Plus the API
surface gets hardened for use as a character generator in real apps.

**Open question (Gary deferred):** same as Q3 — style-pack-per-monster
or rendered in human packs. Same Q4 checkpoint decision.

## Cross-quarter principles

- **Mixture-not-survival** holds across all quarters (see AGENTS.md).
  Each new primitive is an expansion of the parameter surface, not a
  replacement of prior work.
- **The forest rule** holds: "competent ugly" outputs are valid forest
  tiles; the goal is coverage, not single-output perfection.
- **Examples are not targets** holds: any character or reference Gary
  shares is a CATEGORY pointer, not a Haddock to chase.
- **Engine-vs-style separation** (added per Gary's Q2-answer): style
  packs must be applicable across whatever subject the engine renders.
  A "Tintin style" should be a coherent choice on humans, animals,
  monsters alike. Architecturally: do not bake humanoid assumptions into
  style packs, and do not bake style assumptions into engine primitives.
</parameter>
