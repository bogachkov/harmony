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
| `highlightCutout` primitive | Catch-light region for manga / Disney / colored-hair tradition. Also serves Timm's hair-shadow cutout (inverted use). ~20 LOC. Pack-2 ceiling raiser (Pascal ~7→~8 for timmFlat); promote when W3+ pack picks demand it OR Pascal calls it out at W2 close. | `research/hairstyles.md` §4.1 + `stylepack-timmFlat-spec.md` §3 |
| Tight-coily / TWA hairstyle | Largest demographic gap per Rollo. Needs `haloSilhouette` + edge-textured boundary primitive that's distinct from current `curlyDome`. Rollo flagged as "promote-together with timmFlat" — Boondocks / Spider-Verse / Wolfwalkers register pairs cleanly with flat-fill convention. | `research/rollo-pass-1.md` + `stylepack-timmFlat-spec.md` adjacent-gap #2 |
| `shortMessy` preset | Short-disheveled — the "just woke up" / "active" character slot. Already named in `src/hairstyles/index.ts` comments. Needs regional-bedhead primitive per hair-theorist HT-4. | Rollo + hair-theory.md |
| Lead/fill coupling (behaviour) | Type plumbing done (Nick pass 2): `leads` replaces `flowStrokes`, `flowWeight` per-lead, `fillBias` on recipe. `clumpMode`/`clumpVolume` plumbing now alongside (Nick pass 3). Actual fill-clump seeding from leads is OFF pending follow-up. Wire when a hairstyle needs it. | Leo pass 8 §2 |
| Per-feature line-weight multiplier | `style.lineWeight` is currently a single scalar applied uniformly. Timm canon needs upper-eyelid 2-3× heavier than face contour; villain register (Joker / Two-Face) needs lid-weight cranked further than hero register. ~30 LOC. timmFlat ships hero register cleanly without it (Pascal ≥ 5); villain register reaches Pascal ≈ 7 without, ≈ 8 with. **Promote W3 if Pascal calls for it at W2 close.** | Leo + Rollo, `stylepack-timmFlat-spec.md` §3 + adjacent-gap #3 |
| Categorical `brows.shape` enum | `brows.shape: 'block' \| 'arched' \| 'diamond' \| 'tapered'`. Current `brows.style: 'split' \| 'single'` is too narrow; can't reach Joker-thin-arched / Harley-diamond / Batman-block as categorical shapes. ~40 LOC. Defer until a second graphic-shape pack lands (shounen / Caniff) that shares the vocabulary. | Leo + Rollo, `stylepack-timmFlat-spec.md` §3 + Leo audit BACKLOG #3 |
| Orbital socket recess primitive | Eye sits in a recessed socket on a mandibular plane (not as a decal on the front-projected sphere). Load-bearing for packs 3-4 (Caniff socket shadow + cheekbone plane; manga shoujo heavy upper-lid + cheek highlight + iris ring; realistic / Vilppu Asaro planes). Medium effort — Leo brief + Nick impl. **Defer to the first pack that requires it (W3+ pack pick).** timmFlat dodges (Timm canon IS decals). | Leo face-integration audit BACKLOG #5 (NEW) |
| `mouth.philtralBow` knob | Hardcoded cupid-bow in `buildMouth:582-596` fires regardless of `lipFullness`. Caps mouth-on-Joker / Two-Face register at Pascal ~7. ~5 LOC to expose as a knob. Defer W3+. | Leo face-integration audit BACKLOG #2 |
| `expressions.ts` resuscitation pass | Pascal flagged: happy/sad/angry/surprised barely change the face. Mouth `cornerLift` amplitude is similar to the hardcoded cupid-bow pulse (~0.013 vs ~0.008), so expressions barely register on the seam. Uses the philtralBow knob above + amplified cornerLift. Defer W3+. | Leo face-integration audit BACKLOG #6 + Pascal prior rounds |
| `pointed` / `pear` jaw topology dispatch | Both topologies are wired in the topology enum (Leo's `leo-jaw.md` §2) but NOT dispatched by any demographic preset. timmFlat reaches Batman/Catwoman/Alfred cleanly but cannot reach the Joker / Penguin axis without ad-hoc parameter overrides at render time. Demographics-data gap, not a pack gap. Needs a `villain` / `character` / archetype axis dispatching these. Defer W3+. | Rollo, `stylepack-timmFlat-spec.md` adjacent-gap #1 |
| Tangent-decay parameter exposure | `clumpStroke()`'s tangent-decay `1 - 0.8 * gravity * t` magic constant. Expose as `spec.tangentDecay?: number` (default 0.8) so a future curl-mechanics pass can tune per regime (straight / wave / curl have different decay rates per HT §5). Lloyd APPROVED-WITH-EDITS in pass 2. ~5 LOC. Defer until a caller wants it. | Lloyd pass-2 §1 |
| Alpha-shape `ALPHA_FACTOR` parameter exposure | `hull.ts`'s alpha-shape merger uses `ALPHA_FACTOR = 1.5 × median NN-distance` (Lloyd §7 starting guess, held up first try across the three W1 fixtures + grid pre-dedup stabilises NN distribution). Expose as `recipe.hullAlpha?: number` (default 1.5) when a W3 volume pack wants tighter/looser tuning. Lloyd APPROVED-AS-IS in pass 3 for v1. ~5 LOC. Defer until a caller wants it. | Lloyd pass-3 §3 |
| Swept-back-long hair × Timm gap | Rollo pass-1 top-3 missing axis — period-drama matriarch, severe antagonist (Batman Beyond Bruce-as-elder, Mrs. Crock, Maleficent register). Hair primitive not built. When it lands, pair through `timmFlat` first. | `stylepack-timmFlat-spec.md` adjacent-gap #4 |

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
