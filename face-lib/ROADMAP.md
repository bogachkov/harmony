# Roadmap

The longer view. Updated by the CEO (David) and CTO/owner (Gary) at the
annual review; reviewed at each quarterly checkpoint by Tech Lead (Bob)
and VP Product (Claudia) for whether the active quarter is tracking.

## Time conventions

Per Gary's framing (metaphor — calibrate as we go):

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

## Quarterly breakdown

### Q1 (current) — Faces, really really good

**Goal:** the engine produces face renders that are good enough to use as
characters in a real product (game asset, indie comic, app illustration).
"Really really good" measured by Rollo (commercial-asset judgment) and
Pascal (comic-art quality) — and ultimately Gary's eye.

**Concrete deliverable:** 4-10 style packs that each produce coherent,
varied, publishable face output across the demographic axis (age × jaw
topology × hair texture × skin tone).

A "style pack" is a coherent set of rendering choices — eye style, line
weight, color palette, default proportions, characteristic hair bias —
that produces an instantly recognizable aesthetic. Current state: 3 packs
exist in code (`default`, `tintin`, `ligneClaire`); only `tintin` has
been substantially exercised.

**Scope INSIDE Q1:**
- The 3D hair refactor (Lloyd pass 1 design approved; Nick implementing).
  Counts as Q1 because it unblocks variety, not as "engine refinement
  for its own sake."
- 3-7 NEW style packs at quality bar (or 1-4 new + substantial polish
  of the existing 3).
- Expression primitive resuscitation (Pascal flagged it weak — expressions
  barely change the face).
- Forest registry stays healthy (mixture rule; competent-ugly variants
  preserved).

**Scope OUT of Q1 (explicitly deferred):**
- Bodies, clothes, poses → Q2.
- Animals → Q3.
- Monsters → Q4.
- Hat / accessory / glasses primitives → deferred unless a style pack
  REQUIRES one to render its aesthetic at all.

### Q2 — Bodies, clothes, poses

The "clothed person." Takes the face engine as a head and gives it a
torso, limbs, a clothing layer, and parametric pose. Style packs from
Q1 must extend to the body (a Tintin-style body, a Disney-style body, etc.).

### Q3 — Animals

Distinguishable mammal / bird / fish / etc. archetypes. New cranium
topology dispatcher (the face engine's jaw dispatcher work generalizes).

### Q4 — Monsters / creatures + API hardening

Asymmetry, multiple appendages, non-human proportions. Plus the API
surface gets hardened for use as a character generator in real apps.

## Cross-quarter principles

- **Mixture-not-survival** holds across all quarters (see AGENTS.md). Each
  new primitive is an expansion of the parameter surface, not a
  replacement of prior work.
- **The forest rule** holds: "competent ugly" outputs are valid forest
  tiles; the goal is coverage, not single-output perfection.
- **Examples are not targets** holds: any character or reference Gary
  shares is a CATEGORY pointer, not a Haddock to chase.
