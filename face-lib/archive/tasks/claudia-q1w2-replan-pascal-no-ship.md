# claudia-q1w2-replan-pascal-no-ship

Claudia's third spawn. Pascal scored NO-SHIP on the W2 timmFlat
16-cell grid. Sprint does not close as-is. Re-plan the rest of W2.

## Brief

Pascal's W2-close pass landed at `research/pascal-w2-timmflat.md`.
Headline:

- **3 / 16 cells at Pascal ≥ 5** (cells 1, 2, 3 — adult-masc-square
  × short hair). 13 cells below 5.
- **Four-corner test FAILED** on Pascal's read. Pushes back on
  Nick's PASSES with named diagnosis: cells 1/4 not clearly
  different characters at 96px; cells 12/14 not clearly different
  ages. This is the demographic-not-exercising-topology failure
  mode Rollo's spec lines 506-511 explicitly tested for.
- **Calibration audit holds** (W1-deferred outcome: the legitimate
  "calibration holds" branch, not "drift detected"). Sniff-tests
  are register-sensitive, not absolute — operating-manual
  clarification for future flat-fill packs, NOT a recalibration.

Three failure clusters Pascal named:

1. **Cascade-order leak** (6 cells: 4, 5, 8, 10, 13, 16).
   `recipe.leads = []` in the pack didn't suppress hairstyle-level
   `leads` arrays carried by `bobChinLength` / `shortPomp`.
   Nick's `TIMM_PEDAGOGY` override layer in `scripts/timmflat-grid.ts`
   caught most of the pedagogy contract but not the per-hairstyle
   leads. Smallest fix per Pascal: extend `TIMM_PEDAGOGY` to also
   clear hairstyle-level leads. If the bang-strand artifact has a
   non-leads source (eg the bang-mass itself has hard-coded
   internal detail), this becomes a primitive promotion.

2. **Engine ceiling on long-hair register** (3 cells: 6, 7, 11).
   `style: 'long'` field-tracer's multi-strand layer fights Timm
   canon ("long hair = one flat shape"). Primitive-level. Pascal's
   reco: a primitive-level `recipe.strandMode: 'off'` knob OR
   field-tracer no-ops when `clumpMode: 'flat'` AND no leads
   configured. ~30-50 LOC in the field-tracer. Can't be
   override-worked-around (strand layer is below the override
   cascade).

3. **Demographic data not exercising topology** (4 cells: 9, 12,
   14, 15 — plus the implicit cell 1 / cell 4 four-corner
   failure). Demographic presets don't push jaw topology hard
   enough; adult-square / child-round / elder-jowled produce
   similar broad-bottomed silhouettes. Fix lives in
   `src/presets/demographics.ts`, not the timmFlat pack. Pascal
   framed this as Lloyd's architectural call: cascade-merge-layer
   fix vs demographic-preset-data fix.

Pascal's recommendation: **all three concurrent moves needed; none
sufficient alone.** Pack pedagogy IS landing where it gets the
chance (cells 1/2/3 are register-correct). The pack is not the bug.
The bugs are in cascade plumbing + long-hair primitive + demographic
preset data.

Pascal's escalation flag (no pause): *"the cascade-order surprise is
now visible in shipping output, not just architectural diagrams.
This is the moment where 'pack as declarative truth' vs 'pack as
overrides asserted at render time' becomes a directional call.
Lloyd's W3 architectural pass is the right venue; Gary should be
aware the call is coming."*

## Your task

You own the W2 re-plan. The scope choices are real and they affect
the W3 picture:

1. **Decide W2's revised close condition.** Options Pascal laid out:
   - (A) **Land all three fixes within W2.** Nick re-spawn (cascade
     leak) + primitive-level strand toggle + demographic-preset
     fix. Plus a re-render + Pascal re-score. That's 2-3 more days
     of work; W2 was budgeted at 2-3 focused days total and PR #1/#2
     already consumed ~1.5 of those. W2 will run long but ships
     timmFlat at quality.
   - (B) **Land subset, ship 13-cell grid.** Defer cells 6/7/11
     (longSleek/longTail engine-ceiling). Fix cascade-leak + at
     least one of demographic-topology / four-corner. Honest framing:
     "timmFlat ships in 13 cells; long-hair register is a W3
     primitive promotion." Updates the W2 ship gate.
   - (C) **Land subset, ship 3-cell honest.** Just the
     adult-masc-square × short-hair cluster. Most aggressive scope
     cut. Hard to defend per ROADMAP "demographic depth > pack
     count."
   - (D) **Other.** Push timmFlat ship to W3 entirely; spend W2
     remainder on architectural foundation (cascade-merge fix +
     demographic-data fix); then re-ship timmFlat W3 from a fixed
     foundation.

   You decide. The ROADMAP scope-cut rule attaches: if you push
   anything to W3+, name what you're cutting from later weeks.

2. **Spawn order for Bob.** Whichever option you pick, who runs in
   what order? Some constraints to consider:
   - Nick re-spawn on cascade-leak (item 1) is the cheapest — extends
     the existing override const, no new primitives. ~half-day.
   - Primitive-level strand toggle (item 2) requires Nick engine
     work in the field-tracer + a Lloyd touch since it's primitive-
     surface architecture. ~half-day to day, depending on Lloyd's
     ask.
   - Demographic-preset / cascade-merge fix (item 3) is the W3-class
     architectural call — Lloyd writes the design, Nick implements.
     1-2 days if it lands in W2; same in W3.

3. **BACKLOG updates.** Promote anything you pull into W2; defer
   anything you push out; document the cascade-merge architectural
   call (already filed under "Architectural calls (open)" in
   BACKLOG, but you may want to scope tighter or split it).

4. **Update SPRINT.md.** Revised ship gate, revised in-flight,
   revised spawn order, revised history-section closure when W2
   eventually closes.

5. **Brief Bob.** Spawn order + which agents to queue.

## Constraints + reminders

- Same as last spawn: you don't write code; Bob spawns agents per
  your queue; Bob is in autonomous run mode (Gary out — for
  context, it's been a long day; this is Q1-W2 close-or-extend).
- Pascal's escalation flag is a *flag for Gary's awareness*, not a
  pause-for-Gary-input. Pascal explicitly said "not pausing." You
  also do not need to pause for Gary unless your re-plan changes
  the Q1 envelope (it shouldn't — all three fixes are within Q1
  scope, the question is which weeks they land in).
- "Mixture not survival" still applies. Anything you defer needs
  to stay reachable in BACKLOG; anything you fix needs to preserve
  the existing packs (Nick's PR #3 already verified byte-identical
  on `default`/`tintin`/`ligneClaire`).
- Don't quietly drop the cascade-order architectural call. Pascal's
  read is that this is the W3 directional surface — make sure the
  W3 plan (when it lands) names it.

## Deliverable

- Updated `face-lib/SPRINT.md` (revised W2 ship gate + spawn order
  + history-context if W2 close needs a partial entry).
- Updated `face-lib/BACKLOG.md` (promotions/deferrals).
- 1-3 new task files in `face-lib/tasks/` for whatever you spawn
  next.
- Updated `## Handoff` in this task file with Bob's spawn order.
- Brief return note to Bob (<200 words): the decision, why, what
  you cut from later weeks (if anything), what to surface to Gary
  (if anything).

## Context

- `face-lib/AGENTS.md`, `face-lib/PROCESS.md`, `face-lib/ROADMAP.md`.
- `face-lib/SPRINT.md` (current — W2 ship gate annotated post-Pascal).
- `face-lib/BACKLOG.md` (with the cascade-order architectural row
  Bob already filed).
- `face-lib/research/pascal-w2-timmflat.md` — Pascal's full reasoning
  + per-cell table + the W1-deferred calibration audit.
- `face-lib/research/stylepack-timmFlat-spec.md` — original pack spec
  (Leo + Rollo halves).
- `face-lib/research/leo-face-integration-audit.md` — pre-pack
  integration audit (eye-STOP / brow / mouth / integration verdicts).
- `face-lib/tasks/nick-timmflat-pack.md` (Nick's PR #3 handoff with
  the pre-Pascal flags).
- `face-lib/tasks/pascal-w2-timmflat-scoring.md` (your brief that
  triggered this verdict + Pascal's appended handoff verdicts).
- The render outputs: `/tmp/timmflat-out/grid/`, `/tmp/timmflat-out/grid-96/`,
  `/tmp/timmflat-out/probes/`.

## Handoff

W2 re-plan complete. Pascal's NO-SHIP verdict folded; the three
failure clusters routed into a sharpened Option B (13-cell ship in
W2, long-hair primitive + cascade-merge implementation + demographic-
preset push slid to W3).

### Decision

**Option B sharpened.** Ship `timmFlat` in W2 across a revised
13-cell grid (cells 1, 2, 3, 4, 5, 8, 9, 10, 12, 13, 14, 15, 16).
Drop cells 6, 7, 11 (long-hair primitive ceiling) to W3. Land Nick's
cascade-leak fix (smallest of the three failure clusters, per
Pascal's reco) and Lloyd's architectural design pass (covering both
the cascade-merge question and the demographic-topology gap; design
only, no implementation). The cascade-merge implementation,
demographic-preset push, and long-hair primitive promotion all slide
to W3.

### Why not A / C / D

- **A (all three in W2)** runs W2 long another 2-3 days on top of
  the 1.5 already consumed. Q1 has 4 weeks; burning a full extra
  week on one pack would slip pack count from 4 to 3.
- **C (3-cell ship)** ROADMAP "demographic depth > pack count" reads
  against. Hard to defend Gary-facing.
- **D (defer pack entirely, architectural foundation in W2)** loses
  W2 momentum. timmFlat IS landing where it gets the chance (Pascal:
  cells 1/2/3 are register-correct). Burning W2 on architecture-
  with-no-render-gate risks the architecture going unconstrained.
  Cascade-leak fix in (B) is itself a small architectural foundation
  step — Nick's fallback option (`recipe.suppressLeads`) IS the
  cheapest possible primitive promotion and gives Lloyd's design
  pass concrete data to opine on.

### ROADMAP scope-cut declaration

I am explicitly cutting **W3's next-pack-spec slot** (Leo + Rollo
write the spec for pack #3) and sliding it to **W4**. Q1 pack count:
default + tintin + ligneClaire + timmFlat = 4 packs at the ROADMAP
N ≥ 4 floor. W3 close = 4 packs at full demographic depth (the
original 16-cell timmFlat grid closes in W3 once long-hair primitive
+ cascade-merge + demographic-preset push land + Pascal re-scores
cells 6/7/11/9/12/14/15). W4 = spec + implement pack #5 if there's
budget, otherwise polish + first Holly sweep + Q1 closeout. The
ROADMAP rule (demographic depth > pack count) is preserved: we are
trading W3's pack-spec buffer for W3's depth-completion of pack #2,
which is the right trade per the rule.

### Spawn order for Bob

**Wave 1 (parallel — both spawnable immediately):**

1. **Nick** — `tasks/nick-cascade-leak-fix.md` (NEW, drafted). Extend
   `TIMM_PEDAGOGY` const + diagnose merge semantics + fallback
   authority to promote `recipe.suppressLeads: true` if needed.
   Re-render the revised 13-cell grid. ~half-day to one day.
2. **Lloyd** — `tasks/lloyd-cascade-architecture.md` (NEW, drafted).
   Written architectural design pass — cascade-merge question +
   demographic-topology gap. No implementation. Output:
   `research/lloyd-cascade-architecture.md`. ~half-day to one day.
   Parallel-safe with Nick (different files; Lloyd writes prose,
   Nick writes code).

**Wave 2 (sequential after Wave 1 lands):**

3. **Pascal** — `tasks/pascal-w2-revised-rescore.md` (NEW, drafted).
   Re-score 13 retained cells. Acceptance: Pascal ≥ 5 on all 13.
   Brief is sharp: do NOT re-litigate calibration audit (closed) or
   four-corner test (filed for Lloyd design + W3 implementation).

**Conditional / not queued:**

- **Bob technical sign-off on Lloyd's design** — Bob reviews, accepts
  or surfaces to Claudia for re-scope.
- **Holly** — first spawn (test strategy doc per AGENTS.md) slips
  to W3 close at earliest; may further slip to W4.
- **Rollo** — next touch is W4 next-pack-spec (per the ROADMAP
  scope-cut).
- **Leo** — no W2 audits queued; W3 may need Leo for orbital-socket
  primitive depending on W4 pack pick.
- **David** — monthly directional review naturally lands around W2
  close or W3 open. Bob surfaces if the re-plan shifts the Q1
  trajectory. Per my analysis: it doesn't.

### Artifacts updated

- **`face-lib/SPRINT.md`** — rewritten with revised goal + revised
  ship gate (5 boxes now) + revised spawn order + W3 slip declaration
  + ROADMAP scope-cut. Done section updated with Pascal close pass +
  this re-plan as new rows.
- **`face-lib/BACKLOG.md`** — Architectural-calls-open section
  expanded: cascade-order row scoped tighter (now design-in-W2 with
  the two sub-questions named); two new rows for long-hair primitive
  promotion + demographic-topology silhouette divergence (both W3).
  Deferred-features got two new rows: `recipe.strandMode: 'off'` knob
  + timmFlat cells 6/7/11 re-render-and-score.
- **`face-lib/tasks/nick-cascade-leak-fix.md`** — NEW. Nick's W2
  re-spawn brief with diagnosis-first + three options + fallback
  authority to promote `recipe.suppressLeads`.
- **`face-lib/tasks/lloyd-cascade-architecture.md`** — NEW. Lloyd's
  design-only architectural pass covering both architecture questions.
- **`face-lib/tasks/pascal-w2-revised-rescore.md`** — NEW. Pascal's
  re-score brief — sharp scope, do not re-litigate calibration or
  four-corner test.

### Escalations / what to surface to Gary

**Nothing requires Gary input.** Pascal's escalation flag is awareness
only ("pack as declarative truth vs pack as overrides asserted at
render time" — Lloyd's W2 design pass IS the venue for that
directional call). Per AGENTS.md: scope changes are within the Q1
envelope (4 packs at floor still hit). Per ROADMAP: depth > count
rule preserved. Bob should periodically update Gary on the W2 re-plan
in-thread but no pause-for-input.

### Risk callouts (non-blocking)

- **Nick's PR #4 risk.** If extending `TIMM_PEDAGOGY` doesn't catch
  the leak AND `recipe.suppressLeads` fallback doesn't catch it
  either (e.g., the bang-strand artifact has a non-leads source —
  hard-coded interior detail in the bang-mass primitive), Nick
  surfaces and we promote a `pack.suppressInteriorHairDetail`
  primitive flag. That's a Claudia re-scope call, not a Gary
  escalation. Mitigation: Nick's brief gives him explicit fallback
  authority + clear stop conditions.
- **Lloyd's design risk.** If Lloyd's design lands with a much
  bigger scope than expected (e.g., cascade re-order is structural
  enough to constitute a major architecture decision per AGENTS.md
  Bob+Gary lane), Bob surfaces to me for re-scope. Mitigation:
  Lloyd's brief explicitly notes "push back on the brief if it's
  wrong" — including the legitimate verdict "no architectural
  change needed; the `recipe.suppressLeads` knob IS the answer."
- **Pascal's revised gate.** If Nick's fix lands cells 4/5/8/10/13/16
  at Pascal 3-4 instead of ≥ 5 (the cascade-leak fix doesn't fully
  un-corrupt those silhouettes), W2 ships at < 13 cells. Mitigation:
  Pascal's revised brief tells him to flag rather than collapse. We
  re-plan from there.
