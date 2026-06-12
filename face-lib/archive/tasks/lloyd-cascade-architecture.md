# lloyd-cascade-architecture

Lloyd's first W2 architectural design pass. Written design ONLY — no
implementation. Output: a written design at
`research/lloyd-cascade-architecture.md` that names the layer-of-fix
for the two failure-class architecture questions Pascal surfaced in
the W2 timmFlat NO-SHIP, and sizes the W3 Nick implementation work
for each.

## Brief

Pascal scored the timmFlat 16-cell grid at 3/16 cells ≥ 5 (NO-SHIP at
the W2 gate, calibration holds). Three failure clusters surfaced. Two
of them are architectural questions Pascal escalated as **the W3
directional surface area**:

> "the cascade-order surprise is now visible in shipping output, not
> just architectural diagrams. This is the moment where 'pack as
> declarative truth' vs. 'pack as overrides asserted at render time'
> becomes a directional call. Lloyd's W3 architectural pass is the
> right venue."

Claudia's W2 re-plan accelerates Lloyd's pass into W2 as a design
deliverable (no implementation), so Nick has a sized brief to
implement against in W3.

## The two architecture questions

### Question 1 — Cascade-merge architecture (the leads + lidLine question)

**The symptom.** Pack-level pedagogy knobs (`recipe.leads = []`,
`mouth.lipFullness`, `eyes.lashes`, `eyes.lidLine`) get clobbered by
demographic layers downstream in the current cascade
(`defaults → STYLE → presentation → age → HAIRSTYLE → expression →
character → overrides`). Nick worked around in
`scripts/timmflat-grid.ts` via a `TIMM_PEDAGOGY` overrides const that
re-asserts the pedagogy at the override layer (line 7 of the cascade).
That covered most knobs, but not `recipe.leads = []` against the
demographic-presentation leads — Pascal's W2 bob/pomp failure cluster
(6 cells, 4/5/8/10/13/16).

**The directional question.** Where should pack pedagogy live in the
cascade? Pascal's framing: pack-as-declarative-truth vs.
pack-as-overrides-asserted-at-render-time. Concrete design options to
weigh (you may add others):

1. **Re-order the cascade** so STYLE wins on overlapping pedagogy
   knobs. Concrete: move STYLE from cascade slot 2 to a slot AFTER
   age/presentation/hairstyle (slot 5 or 6). This makes packs
   override demographics by default, which has the inverse problem
   for OTHER knobs Nick may want to demographic-tune.
2. **Type-level pin on load-bearing knobs.** Mark certain knobs as
   "load-bearing" in the type system; layers downstream of the
   declaring layer cannot overwrite them. New TS mechanism. Heavy.
3. **`recipe.lock` or `recipe.suppressLeads` primitive.** Give the
   pack a hard "off switch" for specific contested knobs (leads,
   lidLine, lashes, lipFullness). Smallest cost; weak generality.
   Nick's fallback authority in `tasks/nick-cascade-leak-fix.md`
   includes promoting `recipe.suppressLeads` if extending the
   override const doesn't catch the artifact — so this option may
   land as an interim hack regardless of your design call.
4. **Pack-as-late-layer with explicit knob whitelist.** Hybrid:
   re-order STYLE to a late slot, but only certain pack-block keys
   "win" against demographics (the pedagogy knobs); the rest stay
   at the declaring-layer slot.
5. **Pack-as-late-layer with a `pack.declares` manifest.** Pack
   ships a list of knob-paths it asserts as declarative truth;
   merge logic honors the manifest.

**Constraints to weigh:**
- **Mixture rule (AGENTS.md).** Whatever you pick, existing
  `default` / `tintin` / `ligneClaire` renders MUST stay byte-
  identical. The forest registry is the regression spine.
- **Reachability of demographic-only knobs.** Some demographic
  knobs are NOT pack-pedagogy (cranium diameter, eye size for
  child vs adult). Whatever wins, demographics must keep winning
  on those. The right framing may be that pack-pedagogy is a
  NARROW set of fields (style, line weight, decoration knobs)
  and demographics own EVERYTHING ELSE.
- **Engine-vs-style separation (ROADMAP).** A pack should be
  applicable across whatever subject the engine renders (humans,
  animals, monsters). Designs that bake pack-specific assumptions
  into engine primitives violate this; designs that route pack
  decisions through a generic declarative layer preserve it.
- **Nick's fallback option C.** If `recipe.suppressLeads` lands in
  Nick PR #4 (W2), your design should opine: is this a real
  primitive worth keeping, or an interim hack you're rolling into
  the cascade fix?

**Deliverable for Q1:**
- Pick one design (or a hybrid). Argue against the others briefly.
- Size the Nick W3 implementation in LOC + days.
- Name the test fixtures Nick must add to verify the change holds.
- Name what `default` / `tintin` / `ligneClaire` regression check
  must look like.

### Question 2 — Demographic-topology gap (the silhouette question)

**The symptom.** Cells 9, 12, 14, 15 + four-corner test failure
(Pascal pushed back on Nick's PASSES). Adult-square / child-round /
elder-jowled produce similar broad-bottomed silhouettes at 96px. The
demographic presets don't push jaw topology hard enough for
silhouette to do the work Pascal's anchor table requires of "a real
pro could plausibly have drawn this on an off day."

**The directional question.** Pascal's framing:

> Does this close at the cascade-merge layer (rewrite the merge to
> honor pack precedence on pedagogy fields) or at the demographic-
> preset-data layer (push the topology proportions harder)?

Both are legitimate. Concrete design options:

1. **Demographic-preset-data fix.** Edit `src/presets/demographics.ts`:
   push `bigonialWidth` / `mentalWidth` / `gonialAngle` apart across
   `child.jaw` (round), `masculine.jaw` (square), `elder.jaw`
   (jowled). Topology enum stays the same. Smallest possible fix.
   May NOT be enough — the topology enum dispatcher in the renderer
   may produce similar silhouettes even with wider parameter spread.
   Read the dispatcher first.
2. **Topology-dispatcher fix.** The topology enum (round / square /
   oval / jowled / pointed / pear) renders through the engine's jaw
   topology dispatcher. If that dispatcher's output for round / square
   / jowled doesn't actually diverge much (similar U-shape with
   slightly different corner radii), the fix lives in the
   dispatcher, not the demographic data. Read `src/render/` for
   where `jaw.topology` is consumed.
3. **Pack-pedagogy push.** timmFlat pack pedagogy declares "demographic
   silhouette must read at 96px," and the cascade-merge layer
   (question 1) routes the pack's request into demographic-knob
   amplification. Conceptually clean but probably overkill for this
   symptom — the demographics themselves are right to declare topology
   parameters; the pack can't know what the demographic SHOULD push to.

**Constraints to weigh:**
- **Pascal's anchor table.** The cells must read as "different
  characters at thumbnail" and "different ages at thumbnail" per
  Rollo's spec lines 506-511. That's a thumbnail-silhouette test,
  not a per-pixel-feature test.
- **Mixture rule.** Whatever changes, `tintin` × 16 demographic-grid
  must NOT regress. Note: `tintin` may already be exercising the
  demographic-topology axis at quality without this gap firing — if
  so, the issue is timmFlat-specific (the Timm flat-fill register
  pushes silhouette to do work that detailed rendering masks).
  That's a register-sensitivity finding (Pascal's calibration audit
  noted: "Timm pedagogy register is the first time the engine has
  tested a tradition where zero jitter is the right answer — sniff
  tests are register-sensitive, not absolute"). Same logic may apply
  to silhouette divergence: Timm strips out the detail that masks
  silhouette under-divergence in other packs.
- **Rollo BACKLOG row.** `pointed` / `pear` jaw topology dispatch
  through demographic presets is filed (adjacent-gap #1). Your
  design could fold this into the same demographic-preset push if
  the topology dispatcher is fine and the data is the issue.

**Deliverable for Q2:**
- Name the layer-of-fix (demographic-preset-data vs topology-dispatcher
  vs pack-pedagogy-push).
- Size the Nick W3 implementation in LOC + days.
- Name what test fixtures Nick must add.
- Note whether this fix should fold in Rollo's filed BACKLOG row on
  `pointed` / `pear` dispatch.

## Out of scope for this design pass

- **The long-hair primitive ceiling (cells 6, 7, 11).** Pascal flagged
  this as the third failure cluster, scope is primitive-level
  (`recipe.strandMode: 'off'` knob OR field-tracer no-op when
  `clumpMode: 'flat'`). Filed in BACKLOG as a W3 row. NOT part of
  this design pass — it's a Nick implementation row, not an
  architecture question. If you find yourself reaching for it, stop;
  surface to Bob.
- **Nick's interim fix in PR #4.** Nick is running in parallel with
  this design pass (`tasks/nick-cascade-leak-fix.md`). His option
  space includes promoting `recipe.suppressLeads: true` as a knob.
  Your design should opine on whether that interim knob survives
  your design (becomes part of the cascade-fix vocabulary) or gets
  refactored away by it. But you do NOT need to design around Nick's
  PR #4 outcome before it lands — write the design assuming the
  cascade-leak is still open; the post-Nick-PR-#4 reality is a
  follow-up Bob can fold in.

## Acceptance

1. **Written design** at `research/lloyd-cascade-architecture.md`.
   Two sections (Question 1, Question 2) plus a short Q3 "interaction
   between the two fixes" section if they couple.
2. **Each section** names: the chosen design, the discarded
   alternatives (one-line each), the Nick W3 implementation sizing
   (LOC + days), the test fixtures Nick must add, the regression
   check (mixture rule).
3. **Top-of-doc TL;DR** — Bob and Claudia read the TL;DR to feed
   into W3 sprint planning. Three sentences max per question.
4. **No implementation.** No code edits. The deliverable is prose.

## Constraints + reminders

- **Design only.** Per Lloyd's lane in AGENTS.md: "for any significant
  refactor, Lloyd designs first — then Nick implements to Lloyd's
  design." This task IS the design pass. Nick implements per your
  design in W3.
- **Mixture rule is load-bearing.** Whatever you pick, byte-identical
  regression check on existing packs must hold.
- **Engine-vs-style separation.** Per ROADMAP — packs should be
  applicable across whatever subject the engine renders. Design that
  bakes "human-face" assumptions into the cascade is a violation.
- **Push back on the brief if it's wrong.** If you read this and
  think "actually the right design is to not change anything; Nick's
  `recipe.suppressLeads` is the right long-term primitive and the
  cascade architecture is fine" — say so. That's a legitimate
  Lloyd verdict (mixture rule even: "add the knob, default
  preserves prior behavior, packs declare"). The design just needs
  to be written down with reasoning.

## Context

- `face-lib/research/pascal-w2-timmflat.md` — Pascal's W2 verdict +
  per-cell scores + sprint-close recommendation. **Read first.**
- `face-lib/SPRINT.md` — Q1-W2 revised ship gate. Box 5 (this
  design pass) is the new fifth box.
- `face-lib/BACKLOG.md` "Architectural calls (open)" — the two
  questions are filed as architectural calls; your design closes the
  open status.
- `face-lib/tasks/nick-cascade-leak-fix.md` — Nick's W2 re-spawn
  brief (parallel; he's allowed `recipe.suppressLeads` fallback).
- `face-lib/src/presets/demographics.ts` — where the demographic
  leads + topology proportions live.
- `face-lib/src/presets/styles.ts` — where the `timmFlat` pack lives.
- `face-lib/src/api.ts` — `composeFace` + `mergeParams`. The
  cascade-order + merge semantics live here.
- `face-lib/src/model/params.ts` — types. Where a `recipe.lock` or
  similar mechanism would land if you go that direction.
- `face-lib/AGENTS.md` — mixture rule, engine-vs-style separation,
  your lane discipline.
- `face-lib/ROADMAP.md` — Q-quarterly framing for "what depth means"
  in the ROADMAP "demographic depth > pack count" rule.

## Handoff

**Lloyd — design pass complete. Filed at
`research/lloyd-cascade-architecture.md` (177 lines, slightly over
the 150 cap; the brief covers two distinct architectural questions
+ sizing — defensible).**

### Q1 verdict — cascade-merge

Picked **option 4 hybrid**: re-order STYLE from cascade slot 2 to a
NEW slot 6 (post-hairstyle, pre-expression) AND add per-pack
`declares: string[]` manifest naming the knob paths the pack
asserts as declarative truth. The pack applies TWICE — first pass
at slot 2 (substrate, unchanged), second pass at slot 6 (writes
ONLY manifest-listed paths). Default `declares: []` → second pass
no-op → existing packs byte-identical.

`timmFlat.declares` covers the contested set: `hair.recipe.leads`,
`hair.recipe.parting`, four `mouth.*` keys, three `eyes.*` keys,
`brows.style`, three `nose.*` keys.

Manifest paths type-constrained at compile time to a string-union
of pack-allowed keys per `styles.ts:13-26`'s header rule.
Demographic-only knobs (`head.jaw.*`, `head.face.*`, etc.)
inadmissible — engine-vs-style separation enforced by the type
system.

**W3 sizing:** ~65 LOC net across `model/params.ts`,
`presets/styles.ts`, `api.ts`, `scripts/timmflat-grid.ts`. Half to
one day for Nick.

### Q2 verdict — demographic-topology gap

Fix at **demographic-preset-data layer**, NOT the topology
dispatcher. Builders in `scaffold.ts:119-339` DO diverge per
topology (verified by read). The `bigonialWidth`/`mentalWidth`/
`gonialAngle`/`jowl` spread in `demographics.ts` is too compressed
to read at 96px through the Timm flat-fill register (which strips
the interior line-density that masks under-spread in `tintin`).

Concrete preset edits (illustrative; Nick tunes against Timm
renders): child.jaw bigonial 0.55→0.62, mental 0.55→0.60;
masculine.jaw bigonial 0.82→0.86, mental 0.46→0.42, gonialAngle
0.25→0.18; elder.jaw bigonial 0.70→0.74, jowl 0.38→0.48 (jowl is
the load-bearing knob — what `buildJowledJaw:282` amplifies on).

Folds in Rollo's BACKLOG `pointed`/`pear` row as two PRIVATE
demographic-data fixtures (`elderMascPear`, `adultFemPointed`),
NOT public enum additions (avoids combinatorial pack expansion).

**W3 sizing:** ~50 LOC net in `presets/demographics.ts` +
`scripts/timmflat-grid.ts`. Half day plus tuning.

**Mixture-rule caveat:** existing `tintin` × demographic renders
WILL drift on Q2 (not byte-identical). Acceptable per Lloyd
judgment because prior values were calibrated against interior-
line-density masking. Regression guard: Pascal re-scores `tintin`
× 4 representative cells alongside the timmFlat re-score. If
`tintin` regresses, fall back to `pack.proportionScale?: number`
(default 1.0) — mechanism deferred until regression fires.

### Coupling (Q3)

Mechanically independent. **Land Q2 first** (smaller, no
architectural risk, gives Pascal early re-score signal); Q1
second (architectural, benefits from confirmed register read
before cascade restructure). One touch-point: Q1's allowed-path
string-union MUST exclude `head.jaw.*` + `head.face.*` —
engine-vs-style separation at the type system.

### Nick W2 PR #4 interaction

If `recipe.suppressLeads: true` lands in PR #4, it ships timmFlat
in W2 but becomes redundant under this design. Delete in the same
Nick W3 commit that lands the manifest — default `false` means
zero caller impact. Two-line cleanup.

### Decision rights

Neither Q1 nor Q2 design is Q1-envelope-changing (no breaking
type change, no deprecated alias guard touched, no schema break).
Lloyd TL authority per AGENTS.md. **No Gary escalation required.**
Surfacing for Gary's awareness per Pascal's W2 flag: "pack as
declarative truth vs overrides at render time" is now answered —
hybrid via the manifest mechanism.
