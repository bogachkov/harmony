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
| `highlightCutout` primitive | Catch-light region for manga / Disney / colored-hair tradition. ~20 LOC. | `research/hairstyles.md` §4.1 |
| Tight-coily / TWA hairstyle | Largest demographic gap per Rollo. Needs `haloSilhouette` + edge-textured boundary primitive that's distinct from current `curlyDome`. | `research/rollo-pass-1.md` |
| `shortMessy` preset | Short-disheveled — the "just woke up" / "active" character slot. Already named in `src/hairstyles/index.ts` comments. Needs regional-bedhead primitive per hair-theorist HT-4. | Rollo + hair-theory.md |
| Lead/fill coupling (behaviour) | Type plumbing done (Nick pass 2): `leads` replaces `flowStrokes`, `flowWeight` per-lead, `fillBias` on recipe. Actual fill-clump seeding from leads is OFF pending Lloyd's 3D clump-volume architecture. Wire when that lands. | Leo pass 8 §2 |

## Known regressions / bugs

| Bug | Severity | Notes |
| --- | -------- | ----- |
| `longSleek` and `longFlowing` are near-pixel-identical | low (catalog) | Wasted slot. Investigate whether the `waviness=0.012` Fred set on longFlowing is even rendering, or a deeper differentiation is needed. Per Rollo. |
| Expression primitive is weak | low (not this sprint) | Pascal flagged in prior rounds: happy/sad/angry/surprised barely change the face. Build out next time we sprint on faces. |

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
| Falling-past-the-shoulders | `longTail` preset (tailMass 0.85) | New this sprint. |
| Swept-back volume | `shortPomp` preset (verticalLift 0.45) | New this sprint, has regression noted above. |

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
  The 3D refactor should address this.
- AGENTS.md is getting long. Consider splitting into `AGENTS.md` (roles)
  + `RULES.md` (durable patterns + STOP flags) next time it's touched.
