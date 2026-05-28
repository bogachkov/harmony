# Backlog

Known gaps, deferred items, regressions, and the filed-aesthetic registry.
Things that aren't in the current sprint but shouldn't fall out of memory.

Anything in here can be promoted to the next sprint by the Tech Lead.

---

## Deferred features (named, scoped, not yet built)

| Item | Notes | Sourced from |
| ---- | ----- | ------------ |
| `forelockMass` primitive | Falling fringe that drops over forehead, can occlude an eye (the swept-over-one-eye look). Distinct from `edgeKind:'flicked'` bump. ~120 LOC. | `research/hairstyles.md` §4.2 |
| `fringeBand` primitive | Horizontal mass across the forehead (bowl-cut / Asterix). ~40 LOC. | `research/hairstyles.md` §4.3 |
| ~~`highlightCutout` primitive~~ | **PROMOTED TO Q1-W4** (`tasks/felix-nick-timmflat-ceiling-raisers.md`) as a master-tier ceiling-raiser for timmFlat — Gary confirmed "prove master-tier" as the Q1 bar. Catch-light region for manga / Disney / colored-hair tradition; serves Timm's hair-shadow cutout (inverted use). ~20 LOC. BACKLOG est. Pascal ~7→~8 for timmFlat. Felix owns the graphics-math interior (new primitive); Nick wires pack-data. Final inclusion gated by the Leo+Rollo W4 ceiling audit (`tasks/leo-rollo-timmflat-ceiling-audit.md`). | `research/hairstyles.md` §4.1 + `stylepack-timmFlat-spec.md` §3 |
| Tight-coily / TWA hairstyle | Largest demographic gap per Rollo. Needs `haloSilhouette` + edge-textured boundary primitive that's distinct from current `curlyDome`. Rollo flagged as "promote-together with timmFlat" — Boondocks / Spider-Verse / Wolfwalkers register pairs cleanly with flat-fill convention. | `research/rollo-pass-1.md` + `stylepack-timmFlat-spec.md` adjacent-gap #2 |
| `shortMessy` preset | Short-disheveled — the "just woke up" / "active" character slot. Already named in `src/hairstyles/index.ts` comments. Needs regional-bedhead primitive per hair-theorist HT-4. | Rollo + hair-theory.md |
| Lead/fill coupling (behaviour) | Type plumbing done (Nick pass 2): `leads` replaces `flowStrokes`, `flowWeight` per-lead, `fillBias` on recipe. `clumpMode`/`clumpVolume` plumbing now alongside (Nick pass 3). Actual fill-clump seeding from leads is OFF pending follow-up. Wire when a hairstyle needs it. | Leo pass 8 §2 |
| ~~Per-feature line-weight multiplier~~ | **PROMOTED TO Q1-W4** (`tasks/felix-nick-timmflat-ceiling-raisers.md`) as a master-tier ceiling-raiser — Gary confirmed "prove master-tier." `style.lineWeight` is a single uniform scalar; Timm canon needs upper-eyelid 2-3× heavier than face contour (per-feature multiplier). villain register (Joker / Two-Face) reaches Pascal ≈ 8 with it, ≈ 7 without. ~30 LOC, touches the render line-weight path (Felix owns graphics-math interior; Lloyd reviews if it touches a seam). Final inclusion + priority vs `highlightCutout` set by the Leo+Rollo W4 ceiling audit. | Leo + Rollo, `stylepack-timmFlat-spec.md` §3 + adjacent-gap #3 |
| Categorical `brows.shape` enum | `brows.shape: 'block' \| 'arched' \| 'diamond' \| 'tapered'`. Current `brows.style: 'split' \| 'single'` is too narrow; can't reach Joker-thin-arched / Harley-diamond / Batman-block as categorical shapes. ~40 LOC. Defer until a second graphic-shape pack lands (shounen / Caniff) that shares the vocabulary. | Leo + Rollo, `stylepack-timmFlat-spec.md` §3 + Leo audit BACKLOG #3 |
| Orbital socket recess primitive | Eye sits in a recessed socket on a mandibular plane (not as a decal on the front-projected sphere). Load-bearing for packs 3-4 (Caniff socket shadow + cheekbone plane; manga shoujo heavy upper-lid + cheek highlight + iris ring; realistic / Vilppu Asaro planes). Medium effort — Leo brief + Nick impl. **Defer to the first pack that requires it (W3+ pack pick).** timmFlat dodges (Timm canon IS decals). | Leo face-integration audit BACKLOG #5 (NEW) |
| `mouth.philtralBow` knob | Hardcoded cupid-bow in `buildMouth:582-596` fires regardless of `lipFullness`. Caps mouth-on-Joker / Two-Face register at Pascal ~7. ~5 LOC to expose as a knob. Defer W3+. | Leo face-integration audit BACKLOG #2 |
| `expressions.ts` resuscitation pass | Pascal flagged: happy/sad/angry/surprised barely change the face. Mouth `cornerLift` amplitude is similar to the hardcoded cupid-bow pulse (~0.013 vs ~0.008), so expressions barely register on the seam. Uses the philtralBow knob above + amplified cornerLift. Defer W3+. | Leo face-integration audit BACKLOG #6 + Pascal prior rounds |
| `pointed` / `pear` jaw topology dispatch | Both topologies are wired in the topology enum (Leo's `leo-jaw.md` §2) but NOT dispatched by any demographic preset. **Partial close W3:** Lloyd Q2 design folds in `elderMascPear` + `adultFemPointed` as private demographic-data fixtures (NOT public enum additions — avoids combinatorial pack-expansion). Grid script opts in for off-grid probes. **A `villain` / `character` / archetype public axis remains deferred** to whenever a future pack pick demands it. | Rollo, `stylepack-timmFlat-spec.md` adjacent-gap #1 + Lloyd Q2 design |
| Tangent-decay parameter exposure | `clumpStroke()`'s tangent-decay `1 - 0.8 * gravity * t` magic constant. Expose as `spec.tangentDecay?: number` (default 0.8) so a future curl-mechanics pass can tune per regime (straight / wave / curl have different decay rates per HT §5). Lloyd APPROVED-WITH-EDITS in pass 2. ~5 LOC. Defer until a caller wants it. | Lloyd pass-2 §1 |
| Alpha-shape `ALPHA_FACTOR` parameter exposure | `hull.ts`'s alpha-shape merger uses `ALPHA_FACTOR = 1.5 × median NN-distance` (Lloyd §7 starting guess, held up first try across the three W1 fixtures + grid pre-dedup stabilises NN distribution). Expose as `recipe.hullAlpha?: number` (default 1.5) when a W3 volume pack wants tighter/looser tuning. Lloyd APPROVED-AS-IS in pass 3 for v1. ~5 LOC. Defer until a caller wants it. | Lloyd pass-3 §3 |
| Swept-back-long hair × Timm gap | Rollo pass-1 top-3 missing axis — period-drama matriarch, severe antagonist (Batman Beyond Bruce-as-elder, Mrs. Crock, Maleficent register). Hair primitive not built. When it lands, pair through `timmFlat` first. | `stylepack-timmFlat-spec.md` adjacent-gap #4 |
| ~~`recipe.strandMode: 'off'` knob (long-hair primitive)~~ | **PROMOTED TO Q1-W3** (`tasks/felix-longhair-primitive-rebuild.md`). Closes cells 6/7/11. Owner: Felix (David approved the graphics-domain hire in commit `9db6566`; this is Felix's first spawn). | Pascal W2 timmFlat NO-SHIP verdict |
| ~~timmFlat cells 6/7/11 re-render + score~~ | **PROMOTED TO Q1-W3** as part of the full 16-cell re-render + Pascal re-score row (`tasks/pascal-w3-close-rescore.md`). Closes the original 16-cell spec. | Claudia W2 re-plan |
| `pack.proportionScale` knob | Optional pack-level scalar over demographic jaw proportions. Lloyd Q2 §debt-left: land ONLY if W3 Q2 demographic-data push regresses `tintin` × demographic renders. Default 1.0 (no-op). Pascal's `tintin × 4` regression re-score is the trigger. Defer unless trigger fires. | Lloyd Q2 design |
| Late-pass for expression / character presets | Lloyd Q1 §debt-left: the same `pack.declares` manifest mechanism extends naturally to other preset layers (expression, character-archetype). Flag for Q2 pack-spec when Rollo + Leo consider expression / archetype packs. | Lloyd Q1 design |
| **Pack #5 — spec at Q2-open, FULL-STACK** | David's W4 direction (Gary-confirmed): the next-pack-spec slot (slid W2→W3→W4) is **deferred to Q2-open, NOT cut.** Spec it as a face+body pack from the start (per the ROADMAP handoff rule — each pack carries its own body/clothes/pose conventions). Speccing it face-only in W4 then re-opening in Q2 to add a body is wasted motion. Leo + Rollo spec at Q2-open; Nick/Felix implement. This is a mixture deferral, not a deletion. | David Q1-W3close directional review |
| Master-tier ceiling: features-as-decals integration debt (if W4 proves the cap is architectural) | If the W4 master-tier push (`tasks/pascal-w4-master-tier-rescore.md`) finds timmFlat caps at Pascal-5 even WITH the ceiling-raisers, the most likely named root cause is the features-as-decals integration debt (see Tech-debt notes below + Leo face-integration audit). That negative result is a legitimate W4 finding and feeds directly into Lloyd's Q2-open body-architecture design pass. File the named root cause here on W4 close if the cap holds. | David W4 direction + Leo face-integration audit |

## Known regressions / bugs

| Bug | Severity | Notes |
| --- | -------- | ----- |
| `longSleek` and `longFlowing` are near-pixel-identical | low (catalog) | Wasted slot. Investigate whether the `waviness=0.012` Fred set on longFlowing is even rendering, or a deeper differentiation is needed. Per Rollo. |
| Expression primitive is weak | low (covered above) | See `expressions.ts` resuscitation pass deferred-features row. |
| `hull.ts:71-86` dead-code (`theta`/`cx`/`cy` derivation block with `void` discards) | low (cleanup) | Lloyd flagged in pass 2 — `phi` derivation already exists in the same function, theta derivation is unused. ~10 LOC cleanup. Bundle with whatever Nick PR next touches `hull.ts`. | 

## Filed aesthetics (forest registry — per AGENTS.md mixture rule)

Working aesthetics that should remain REACHABLE in the parameter surface
even if not optimal by any one critic's lens.

| Aesthetic | Currently reachable via | Notes |
| --------- | ----------------------- | ----- |
| Chaotic/stringy/witch hair | `longWitch` preset (edgeKind crowSnipped + extreme waviness) | Rollo says "competent ugly, defend this slot." |
| Coily halo silhouette | `curlyDome` preset (edgeKind edgeTextured + low forehead) | |
| Shoulder-falling sleek | `longSleek` preset | |
| Big curly mass | `longCurly` preset (waviness 0.075 + freq 5.0) | |
| Gentle wave | `longWavy` preset (waviness 0.030 + freq 2.2) | |
| Shounen silhouette teeth | `spikyShort` preset (edgeKind 'spiked') | Only short style with thumbnail differentiation per Rollo — preserve. |
| Mature recession | `shortReceding` preset (templeRecession 0.55) | |
| Falling-past-the-shoulders | `longTail` preset (tailMass 0.85) | |
| Swept-back volume | `shortPomp` preset (verticalLift 0.45) | |
| 3D clump volume (gravity) | `longCurtain` test fixture (`clumpMode: 'volume'`, `gravity: 0.8`) | New this sprint (Q1-W1). Side-curtain drape past chin without `tailMass` cheat. |
| 3D clump volume (radial halo) | `coilyHalo` test fixture (`clumpMode: 'volume'`, `radial: +0.6`) | New this sprint. Edge texture from radius variance, not `edgeJitter()`. |
| Flat-mode identity (regression guard) | `shortBob` test fixture (`clumpMode: 'flat'`) | New this sprint. Byte-identical to pre-refactor — mixture-rule keystone. |
| **(W2)** Convex-hull merger mode | volume-mode fixtures w/ `hullMode: 'convex'` (default for the three W1 fixtures) | Lands W2. Keeps the v1 hull behaviour reachable per mixture rule even when alpha-shape becomes the new-adoption default. |

**Forest gap to address:** exp-wavy-1 chaotic-but-energetic look (user
called it a "gem"). Currently NOT reachable — was an interim render
during long-hair iteration before clumping was added. To re-file as a
preset would require exposing clump-coherence as a recipe knob (0 =
chaos like exp-wavy-1, 1 = current locked clumps).

## Architectural calls (open)

- **Cascade-order architecture for pack-level pedagogy knobs
  (IMPLEMENT IN W3 per Lloyd's W2 design).** Lloyd's W2 design
  pass at `research/lloyd-cascade-architecture.md` named the layer-
  of-fix: **Option 4 hybrid** — re-order STYLE to a NEW slot 6
  (post-hairstyle, pre-expression) AND ship per-pack `declares:
  string[]` manifest naming the contested knob paths. Default
  `[]` → byte-identical on existing packs. Type-system enforces
  engine-vs-style separation (demographic-only paths inadmissible).
  Subsumes Nick PR #4's `suppressInteriorHairDetail` flag (delete
  in same commit). ~65 LOC. **Filed Q1-W3 row (`tasks/nick-q1-
  cascade-merge-manifest.md`).** **Row stays open in this section
  until the W3 manifest lands** — once Nick's PR ships and Lloyd
  reviews, this row closes and any residual late-pass design
  (expression / character preset layers) moves to the deferred-
  features section.

- ~~**Long-hair primitive register conflict.**~~ **MOVED TO W3
  (`tasks/felix-longhair-primitive-rebuild.md`).** Field-tracer
  rebuild closes cells 6/7/11. Owner: Felix (David approved the
  graphics-domain hire; this is Felix's first spawn). Row will
  close on W3 land.

- ~~**Demographic-topology silhouette divergence.**~~ **MOVED TO
  W3 (`tasks/nick-q2-demographic-topology.md`)** per Lloyd Q2
  design. Fix lands in `demographics.ts` data layer (not cascade-
  merge): push `bigonialWidth`/`mentalWidth`/`gonialAngle`/`jowl`
  spread across child/masculine/elder. Two private fixtures
  (`elderMascPear`, `adultFemPointed`) fold in the Rollo BACKLOG
  `pointed`/`pear` row. Mixture-rule guard via Pascal `tintin × 4`
  regression re-score. Row will close on W3 land.

## Tech-debt notes

- Stroke-count ceiling near 500 per render. Beyond that, SVG file size
  grows quadratically due to overlap-as-separate-paint. (Leo SM-1.)
- The `cranialField` has gravity in UV space, not Cartesian — fine for
  scalp-hugging strokes, conceptually wrong for trailing/falling mass.
  The 3D refactor addressed this for clump volume (Lloyd pass 1) but
  scalp-hugging primitives still use UV gravity. Re-evaluate if a
  primitive needs Cartesian gravity in scalp-hugging mode.
- AGENTS.md is getting long. Consider splitting into `AGENTS.md` (roles)
  + `RULES.md` (durable patterns + STOP flags) next time it's touched.
- **Features-as-decals integration debt** (Leo cross-cutting from
  face-integration audit). Features have no attachment plane — no
  orbital socket recess, no brow ridge plane, no mouth-on-mandible
  curl. They sit on the front-projected sphere as decals. timmFlat
  dodges this (Timm canon IS decals); packs 3-4 (Caniff / manga /
  realistic) will hit it. Architectural-level debt; specific
  primitives (orbital socket recess; brow ridge; mouth-on-mandible)
  are filed in deferred-features above. Promote together when a pack
  pick requires them.
