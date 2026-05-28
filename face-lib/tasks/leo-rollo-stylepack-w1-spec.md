# leo-rollo-stylepack-w1-spec

Joint pass. Pick ONE new style pack to spec this week. Leo writes the
pedagogy half, Rollo writes the asset-judgment half. Output is a single
md in `face-lib/research/` that Nick consumes in Q1-W2.

This is a research+design pass. **Not implementation.** No code, no
parameter values plugged into `presets/styles.ts`. The output is the
spec Nick implements next week.

## Brief

Step 1 — **pick** (joint). Choose ONE style pack from Gary's candidate
list:

- Disney/Pixar feature (current-era 3D-style flattened to 2D)
- Manga — shoujo (CLAMP / Takahashi big-eye)
- Manga — shounen (Toriyama / Kishimoto angular)
- Caniff / Toth ink comics (heavy black, brush ink)
- Bruce Timm flat-shape (BTAS / Justice League animated)
- Studio Ghibli (Miyazaki / Yonebayashi)
- Schulz / Peanuts (extreme reduction, two-dot eye)

The pick criteria (in order):

1. **Maximally orthogonal to `tintin` / `ligneClaire`.** We already
   have ligne claire. Picking another ligne-claire-adjacent pack is
   a waste of W1. The pack we pick should make Pascal say "this is a
   DIFFERENT drawing tradition," not "this is a tintin tweak."
2. **Reachable with current primitives + the W1 3D-volume mode.**
   If a pack requires forelockMass + fringeBand + highlightCutout
   (all in BACKLOG) just to read at all, it's a poor W1 pick —
   we'd block on three primitive builds. Pick a pack where the
   primitives we HAVE plus volume mode get us most of the way; flag
   the 1-2 missing primitives that would unlock the rest.
3. **Demographic axis is real.** A pack that only renders one
   ethnicity / age / presentation isn't a Q1 candidate. The pack
   must read clearly across at least: age (child / adult / elder)
   × jaw topology (square / oval / round) × hair (3-4 styles from
   the current 13). If the pack can't, say so and pick another.
4. **Variety vs. existing forest.** Per BACKLOG forest registry:
   does this pack open NEW aesthetic territory or duplicate a
   reachable point? `tintin` covers ligne claire; what does this
   pack add that no existing knob reaches?

Step 2 — **Leo's pedagogy half** (Leo). For the chosen pack:

- Cite the tradition. Names, sources (Loomis-style: which textbook
  / which artist / which era). No asserted pedagogy without a
  source — that's Fred's failure mode, not Leo's.
- What are the **3-5 defining decisions** an artist makes when they
  draw in this style? (line weight, eye construction, mouth
  construction, brow vocabulary, fill convention, etc.) These map
  to the `style.*` / `eyes.style` / `brows.style` / `nose.style` /
  `mouth.*` knobs in `src/presets/styles.ts` — read the file's
  header comment for the proportions-are-forbidden rule.
- What does this pack do with construction order? Same artist's
  decision tree, or different sequence? (e.g., shounen draws hair
  silhouette before the cranial mass; Disney draws the cranial
  mass first.)
- Is there a primitive the engine doesn't have yet that this pack
  needs to read AT ALL? Name it. Differentiate "would be nicer with"
  (defer) from "doesn't read as the tradition without" (blocker).

Step 3 — **Rollo's asset-judgment half** (Rollo). For the same pack:

- Name 3-5 specific NPC slots it fills that the existing packs
  don't. ("Indie roguelike merchant NPC," not "fantasy character.")
- Name the demographic axis as a concrete grid: which age × jaw
  × hair × skin-tone combinations does this pack have to render at
  Pascal ≥ 5 / Rollo-would-ship before we call it shipped?
- Identify 2-3 ADJACENT MISSING points within this pack's parameter
  space — coverage gaps Nick should know about before W2 starts.
- Mixture-rule check: does adopting this pack as a preset risk
  shifting the default render away from current `tintin` output?
  If yes, flag.

Step 4 — **joint spec output**. Single md at
`face-lib/research/stylepack-<name>-spec.md` with:

- The pick + why (1 paragraph from each of you, signed).
- Leo's pedagogy section (citations, decisions, construction order,
  primitive gaps).
- Rollo's asset section (NPC slots, demographic grid, adjacent
  gaps).
- A **proposed parameter delta** vs. `default`: which `style.*` /
  `eyes.style` / `brows.style` / `nose.style` / `mouth.*` knobs the
  pack flips, with proposed VALUES where you can name them, or
  "Nick decides during implementation" where you can't. Respect the
  proportions-forbidden rule in `src/presets/styles.ts`.
- A **scope flag**: is the spec implementable in W2 with current
  primitives + volume mode, or does it block on a BACKLOG promotion?

## Context

- `face-lib/ROADMAP.md` — Q1 ship floor: N≥4 packs at quality bar
  with demographic depth. This is pack #2 (counting `tintin` as the
  one currently-exercised pack; `default` and `ligneClaire` exist
  but haven't been driven).
- `face-lib/src/presets/styles.ts` — current pack file. Read the
  header comment carefully — it lists what's allowed and forbidden
  at the style layer. Proportions are forbidden here (they belong
  to demographic + character data); style packs touch line weight,
  jitter, color, fills, and discrete enum choices.
- `face-lib/research/rollo-pass-1.md` — Rollo's prior catalog
  review. Top gaps: short-disheveled, tight-coily / TWA,
  swept-back-long. The pack you pick should ideally hit at least
  one of these as a side benefit; if it doesn't, flag.
- `face-lib/BACKLOG.md` — deferred primitives (`forelockMass`,
  `fringeBand`, `highlightCutout`) and the filed-aesthetic forest
  registry. The pack must not delete any forest tile.
- `face-lib/AGENTS.md` — Leo's mandate (pedagogy, citations,
  stop-the-line authority) and Rollo's mandate (variety, NPC slots,
  forest preservation). Stay in your respective lanes; this is a
  JOINT pass but not a merged role.
- `face-lib/research/leo-audit.md`, `leo-jaw.md`,
  `primitives-nose-ears-neck-brows.md`, `hairstyles.md` — prior
  Leo deliverables on existing primitives. Helps gauge which
  primitives are "implementable as parameter flips" vs. "need new
  primitive."

## Acceptance

- One md at `face-lib/research/stylepack-<name>-spec.md` exists,
  with all four sections above filled in.
- Both Leo and Rollo signed their respective halves explicitly
  (clear authorship — Leo doesn't write Rollo's asset slots, Rollo
  doesn't cite pedagogy).
- The pack is implementable by Nick in W2 with EITHER current
  primitives only, OR current primitives + a single BACKLOG
  promotion that Claudia can approve. Two or more BACKLOG
  promotions required = wrong pick for W1; restart.
- The demographic grid is concrete, not gestural ("works across
  ages and ethnicities" is not concrete; "child-oval, adult-square,
  elder-round across the 4 listed hairstyles, default and dark skin
  tones" is concrete).
- The mixture-rule check is explicit — no silent default-render
  drift.

## Notes

- **Examples-are-not-targets** applies to whichever pack you pick.
  If you pick "shounen," the spec must produce a primitive that
  renders MANY shounen-tradition characters — not a primitive tuned
  to Goku or Naruto. If the spec reads "ah this works for the
  character X test render," you have started Haddocking. Stop.
- **Variety in test rotation** applies to the proposed demographic
  grid — don't list six near-clone test cases, list a real cross-
  product.
- This is one md, not two. The joint pass IS the point. Leo can't
  spec the style pack alone (asset judgment isn't his lane); Rollo
  can't alone (pedagogy isn't his). Bob spawns Leo first (pedagogy
  is upstream of asset judgment for a style pack), Leo writes their
  half, hands off to Rollo with the file checked in WIP, Rollo
  appends their half. Two spawns, one file. If the design makes
  Bob spawn them simultaneously and merge later, that works too —
  Claudia trusts Bob's call on the spawn mechanics.

## Handoff

### Leo pass — pedagogy half complete

- **Pack picked:** `timmFlat` (Bruce Timm / DC Animated Universe
  flat-shape).
- **Spec file:** `face-lib/research/stylepack-timmFlat-spec.md`.
  Leo's half written and signed; Rollo's half stubbed under
  `## Rollo's half` with explicit expected-sections from the brief.
- **Implementability:** W2-implementable as pure parameter flips in
  `src/presets/styles.ts` against existing primitives + Nick's
  `clumpMode: 'flat'` (which is the canonical default for this pack
  anyway). **Zero BACKLOG promotions required.**
- **Primitive blockers (read-as-tradition):** none. Pack reads as
  Timm with current engine.
- **Would-be-nicer (defer, NOT blockers):**
  - `highlightCutout` (already BACKLOG) — for the optional cel-shadow
    on hair; pack ships at Pascal-5 without it, ceiling rises with it.
  - **NEW BACKLOG CANDIDATES (Claudia, please file):**
    - per-feature line-weight multiplier — Timm upper-lid line is
      2-3× the contour weight; current `style.lineWeight` is a
      single scalar. ~30 LOC.
    - categorical brow-shape enum — Timm brows are shape-categorical
      (block / arched / diamond / tapered), not smooth-parameter.
      Would benefit Timm + likely shounen + likely Caniff packs. ~40 LOC.
- **Why this pack vs. other six candidates:** Timm is the only pick
  that satisfies all four ordered criteria simultaneously — maximally
  orthogonal to ligne claire (flat fill + categorical jaw topology vs.
  uniform thin line), reachable today (no new primitives), demographic-
  axis-real (Timm's whole design ethos IS jaw topology across
  demographics), and forest-expanding (opens flat-fill territory no
  existing pack touches).
- **Unexpected findings:** the pick *validates* the
  `head.jaw.topology` enum Leo prescribed in `leo-jaw.md` — without
  that prescription already wired, Timm flat-shape would have been a
  poor W1 choice. The pack picks itself, in a sense, given what the
  engine already has.
- **Forest impact (Leo preliminary, Rollo to confirm asset-side):**
  no filed aesthetic at risk. `timmFlat` is a sibling key in
  `styles.ts`, not a parent of `default`/`tintin`/`ligneClaire`.
  Adds reachable parameter-surface points; deletes none.

### Rollo pass — asset half

Rollo asset half complete; spec ready for W2 implementation brief.
