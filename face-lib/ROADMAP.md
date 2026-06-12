# Roadmap

Rewritten Q1-W4 from first principles. The prior ROADMAP (faces → bodies →
people → animals across four "quarters") is archived at the bottom and is
no longer the plan. Gary asked us to recalibrate against what we actually
learned this session. This is that recalibration.

Owners: Gary (direction), Claudia (sprint translation), Bob (coordination,
honest read).

---

## What this project actually is

A tool Gary will use to make visual assets for indie games and stories.
Specifically: an SVG character engine he can call from his own code or
from an LLM, where the same seed gives the same character, the same
character renders consistently across panels, and small knob changes
produce small predictable visual changes.

Not a parametric-art research project. Not "faces + bodies + poses +
clothes + animals" as a checklist of substrates. A tool that earns its
place in Gary's workflow against the alternative he'd otherwise use
(off-the-shelf pixel-art asset packs, or commissioning art he doesn't
have time to wait for).

**Quality target, named honestly:**
- Beating Dicebear is the proof point. They exist; Gary thinks we can do
  better. That is the floor.
- Chrono Trigger / Suikoden character-portrait register is the reachable
  bar. 16-bit confident, expressive, stylized, consistent.
- Hergé / Toth-tier is the aspiration. We won't get there. Chase anyway.

**Where the engine actually is today:** Pascal-2-3 by Gary's eye, not
Pascal-5. The prior scoring anchor was drifted ~2-3 points high; we
recalibrated W4. The W3 16/16 close was honest off-day-pro by the *old*
ruler, which now reads as procedural with a few wins. Confident
amateur-sketch register is *above* us, not behind us.

The W4 ceiling audit (`research/timmflat-ceiling-audit.md`) put a name
on the cap: features sit on the face as decals, not attached to a
surface that turns. Two cheap levers (hair shadow cutout, per-feature
line weight) get us to a strong 6 by the current ruler — about a
real-Pascal-4 by Gary's recalibrated eye, an honest amateur sketch.
Past that needs a feature-attachment model, which is real work.

## What success looks like (Gary's three tiers, retained verbatim)

- **Minor:** had fun, learned, proud of what we did. Partially true already.
- **Bigger:** Gary actually uses it for his own work. **This is what we're building for.**
- **Huge:** OSS traction or SaaS via LLM tool-calls. Upside, not the plan.

Every decision routes through "does this help Gary get from idea to
asset faster, with the look he controls." If it doesn't, it's not on the
roadmap.

## What the engine has to be for Gary to actually use it

Five things, in honest priority order:

1. **Quality in the user-amateur-with-good-eye band.** Currently NOT
   there. Output is procedural; Gary's 60-second sketch beats it on every
   fundamental. This is the cap that makes the rest moot — a tool he
   won't use isn't a tool. Specifically the misses are line weight,
   slight asymmetry, proportions, and feature attachment.

2. **Character identity persistence across renders.** Same character in
   panel 17 looks like the same character from panel 3. This is the
   killer feature — the thing diffusion models can't do by construction
   and we can. It is NOT currently a first-class goal of the engine; it
   is implicit in determinism + presets but has never been built as a
   real surface. It needs to be.

3. **A clean, narrow knob surface an LLM can reason about.** Partially
   real (determinism + presets exist). What does NOT exist: a documented,
   stable callable surface that an LLM can drive without manual surgery.
   The "LLM tool-call session" was buried in the old Q3 ship gate as a
   side note. It is one of the two things that make this project unique.

4. **Style packs as visual contracts for a story.** Pick a pack at story
   start; everything in that story renders in that register. Currently
   we have four pack files but only treat them as visual variants — not
   as story contracts. This is a small reframing with real implications
   (cross-pack consistency rules, what a pack *guarantees*).

5. **Speed.** A render is seconds, not minutes. Currently true; protect it.

## What's cut from the old roadmap, and why

- **Q2 = bodies + clothes + poses.** Cut as a quarter-shaped commitment.
  Bodies are real future scope, but speccing four full-stack style packs
  with bodies before we're past Pascal-3 faces is building the second
  story before the first wall stands. Bodies move to "after we clear the
  face ceiling and prove the identity loop." No date.

- **Q3 = "people done well" with the LLM session as a ship-gate footnote.**
  Cut as a holding pen for the LLM work. The LLM-callable surface is
  promoted to a first-class engine goal (item 3 above) — it's not a
  validation step at the end, it's part of what the engine *is*.

- **Q4 = animals.** Cut entirely from the planning horizon. Animals were
  the "architectural-generalization test." Generalizing an engine that
  doesn't yet pass its own quality bar is theater. Revisit only if the
  tier-2 success (Gary uses it) lands and animals are something he wants
  for actual work.

- **"4 packs at depth > count, demographic-grid coverage" as the Q1 ship
  shape.** Cut. We have four packs in code; only one (timmFlat) is
  meaningfully exercised. The bar shifts from "more packs" to "make the
  one pack we understand actually good, then learn what the pack abstraction
  has to become to be a story contract." If we land at two solid packs
  Gary trusts, that beats four packs at the current ceiling.

- **The Pascal-5 floor as the Q1 quality bar.** Cut. Pascal-5 by the old
  ruler is Pascal-2-3 by Gary's eye. The recalibrated bar is "Gary looks
  at the output and doesn't immediately reach for the eraser." Pascal
  the agent still scores; the floor moves to a recalibrated 4 on the new
  anchor table (a real amateur sketch — Gary's 60-second mark).

- **Monsters / creatures.** Already cut at the prior annual review.
  Stays cut.

The bias of the old roadmap was *substrate coverage* (faces, then
bodies, then animals — broaden the engine). The bias of this one is
*tool credibility* (make the thing good enough Gary uses it, then expand
on demand). Different shapes.

## The plan (sprint-sized, not month-sized)

Per AGENTS.md top: sprints are units conversion, not calendar. "A sprint
week" is roughly an hour of Gary's real time; "a quarter" is a day.
Calling these "Q2" or "Q3" implies a calendar contract we don't have.
Instead, name them by the question they answer. Order is intended; sizes
are honest estimates.

### Track A — clear the face ceiling

The single biggest constraint. Until the engine produces faces Gary
respects, the LLM loop and the identity layer are vaporware features on
top of a broken core.

- **A1. Land the two cheap levers W4 is already building.** Hair shadow
  cutout (`highlightCutout` used inverted) + per-feature line-weight
  multiplier. The W4 ceiling audit confirms these get timmFlat from a
  strong-5-old / 3-new to a strong-6-old / honest-4-new. They are also
  prerequisites for the attachment work — not throwaway. Felix + Nick
  are mid-flight; let them finish.
- **A2. Decide on the feature-attachment model.** The audit (A-1 in the
  doc) names this as the architectural unlock from "decal on a balloon"
  to "feature attached to a form that turns." Lloyd designs the seam;
  Felix designs the geometry interior; Leo gates the pedagogy (orbital
  socket / brow ridge / mouth-on-mandible). This is the work that earns
  Pascal-real-5+ (confident amateur on the new scale).
- **A3. Land it on timmFlat first**, because it's the pack we understand.
  Re-score against Gary's eye, not against the anchor table. If Gary
  reaches for the eraser less, it worked.

A3 is the gate. If A3 produces output Gary genuinely uses for asset work,
the engine has cleared the credibility bar and we move to Track B and C.
If it doesn't, A1-A3 repeats with a sharper audit. Do not move on with
broken faces.

### Track B — make the LLM loop real

This runs *after* A3, not before. There's no point exposing a tool
surface to an LLM if the renders it returns are unusable.

- **B1. Spec the callable surface as a real product, not a side effect of
  determinism.** What does an LLM call look like? `composeCharacter({
  style, demographic, hair, expression, seed })` is the rough shape, but
  what's the stable contract? What's optional, what's required, what's
  the error model when an LLM passes garbage? Claudia + Lloyd own this.
- **B2. Build the character-identity layer.** A *character* is a named,
  stored set of params — not just a seed. The LLM (or Gary directly)
  creates `protagonist_alice` once; every later call referencing
  `protagonist_alice` produces the same face, with overrides for
  expression / pose / framing layered on top. This is the killer
  feature. It is not a primitive; it is the persistence + composition
  rules around the existing primitives.
- **B3. Demo the loop.** Gary drives a small story session: a couple of
  characters, a handful of beats, in one pack. The LLM calls the engine;
  the engine returns consistent assets. The output is shareable. If this
  works, the tier-2 success ("Gary uses it") is reachable.

### Track C — pack #2 as a story contract

After A and B prove out. The point of a second well-exercised pack is to
force the *pack abstraction* to mean something: what does a pack
*guarantee* when a story picks it? Same character renders consistently
*within* a pack; same character switched to another pack still reads as
the same character. That cross-pack identity rule is the constraint that
makes packs into story contracts instead of skins. We don't know yet
which second pack earns this — Leo + Rollo pick once A3 lands.

### Off the planning horizon (filed, not refused)

- Bodies, clothes, poses. Real work, real future, but not until the head
  is credible and the identity layer is real. The Q1-W4 ceiling audit
  already names "the body-architecture pass that Lloyd was going to do
  for Q2-open" — that pass is the *same architectural work* as A2 above,
  arrived at by a different path. Body comes after A2 lands and the
  attachment model exists to extend.
- Animals. Off the horizon. Maybe never; maybe after tier 2 hits and
  Gary wants them.
- Multi-character compositions, scenes, props. Same.
- Pack #3, #4 expansion. Same.

## What to do about the W4 work in flight

Felix + Nick are mid-flight on the two ceiling-raisers (Track A1).
**Keep them.** Two reasons:

1. The W4 audit already confirmed they're real lift (5→strong-6 by the
   old scale; honest-amateur by the new one), and they are not theater.
2. They are *prerequisites* for the attachment model (A2). A highlight
   cutout and a heavier lid line render more honestly once the form has
   a normal under them. Building them now doesn't waste motion against A2.

Pascal's re-score (Box 3 of W4) is still worth running, but the framing
shifts: it is no longer "did we prove master-tier yes/no" — that question
got answered by the audit (no, decals cap at strong-6). It becomes "did
the levers land cleanly and what is the recalibrated Gary-eye read on
the output." Pascal scores; Gary's eye is the ground truth.

Holly's test-strategy doc landed clean (`research/test-strategy.md`).
It is good work — concrete, useful, names the determinism precondition.
The reachability fixtures + minimal gate matrix become the regression
contract Track B will build against. Hold the CI hook decision until
B1 lands (the callable surface) so the gate matrix knows what to gate.

## Recommended next sprint

**Goal:** finish A1, decide A2.

1. Let Felix + Nick land the ceiling-raisers and Pascal re-score against
   the recalibrated anchor.
2. **Gary looks at the output first**, before Pascal's number is relayed.
   Bob renders independently and shares. The honest read is "is this
   closer to your eye, or still procedural."
3. Leo + Felix + Lloyd do a tight design pass on the feature-attachment
   model (A2). Not a full implementation — the design + a sized estimate
   + an honest call on whether the team can land it in one sprint or
   needs two. Cite Loomis / Bridgman / Vilppu for the pedagogy; cite
   Bridson / SDF literature for the geometry if relevant.
4. Holly's regression scaffold (the `--gate` script) lands behind a
   determinism-confirm pass. Small, real, unblocks Track B.
5. Open question for Gary: when A3 ships, do we go to Track B (LLM loop)
   or Track C (second pack) first? Bob carries the recommendation
   (Track B — the identity layer is the killer feature and a second
   pack with no identity rules is just two skins).

That's the sprint. No pack #5. No body design pass. No animals. The
discipline of this roadmap is doing the thing in front of us well before
we plan the thing after it.

## Cross-track principles (kept from the prior ROADMAP)

- **Mixture, not survival.** Each new primitive expands the parameter
  surface; old working aesthetics stay reachable. The forest registry in
  BACKLOG enforces this and Holly's reachability fixtures guard it.
- **Examples are not targets.** When Gary names a character to illustrate
  a class, build the general primitive, not the specific likeness.
- **Engine-vs-style separation.** Style packs do not bake in
  humanoid-only assumptions; engine primitives do not bake in style.
- **Determinism is non-negotiable.** Seed in, image out, same every
  time. Per Holly's doc, this is also a precondition for the regression
  gate. Confirm and fix clump-hair determinism before B1.

## What I (Claudia) don't know and want surfaced

- Whether Gary's tier-2-success workflow (he actually uses the engine
  for game/story work) needs anything specific I haven't named — color
  layers, animation states, multi-pose model sheets. The current scope
  assumes still portraits. If he needs more, that reshapes Track B.
- Whether the LLM driving the loop is Gary's existing tooling or
  something we ship. The engine's callable surface is the same either
  way, but "we ship the LLM bridge" is a different scope than "Gary
  wires his own."
- Whether two packs is genuinely enough for him to start using the
  tool, or whether he hits a wall at one pack and needs three before
  the workflow clicks. Track C exists in part to find this out.

---

## Archived: the prior roadmap (annual goals as written before recalibration)

Kept here for record. Superseded by the tracks above.

> Annual goal: by Q4 the engine produces fully-clothed humans (faces +
> bodies + poses + clothes), distinguishable animals, and distinguishable
> monsters/creatures — each in multiple aesthetic styles, each in
> multiple demographic / breed / archetype variations. Output via CLI +
> LLM tool-call surface.
>
> Q1 = faces really really good. Q2 = bodies, clothes, poses. Q3 =
> people done well + LLM tool-call ship gate. Q4 = animals. Monsters
> dropped at annual review.

Why it was replaced: the substrate-coverage framing (faces → bodies →
animals) routed around the actual constraint (engine quality below the
threshold Gary will use). The LLM tool-call surface — the unique value
of the engine vs. diffusion — was buried as a Q3 footnote. And Pascal-5
as the floor turned out to be Pascal-2-3 against Gary's eye. The new
plan reorders around tool credibility, not substrate breadth.
