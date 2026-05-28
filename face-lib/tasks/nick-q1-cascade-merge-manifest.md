# nick-q1-cascade-merge-manifest

Nick's W3 Wave-1 second row. Implement Lloyd's Q1 design — cascade-
merge hybrid manifest: re-order STYLE to a NEW slot 6 (post-
hairstyle, pre-expression) AND ship per-pack `declares: string[]`.
Subsumes Nick PR #4's `suppressInteriorHairDetail` flag.

## Brief

Pascal's W2 NO-SHIP escalation flag named the directional surface:
"pack as declarative truth vs pack as overrides at render time."
Lloyd's W2 design pass (`research/lloyd-cascade-architecture.md`
§Q1) landed the call. The design:

- Apply pack TWICE in the cascade.
- **Substrate pass at slot 2** — unchanged from today's behavior.
  Pack-as-substrate (defaults, palette, line weights, etc).
- **Declarative pass at NEW slot 6** (post-hairstyle, pre-expression)
  — writes ONLY paths named in `pack.declares: string[]`. Default
  manifest `[]` → no-op late pass → byte-identical for every
  existing pack.
- `timmFlat.declares` covers the contested pedagogy set: leads /
  parting / lipFullness / labiomentalShow / cornerMarks / upperCurve
  / lashes / lidLine / underlineHint / brow style / nose style etc.
- Type-system enforces engine-vs-style separation — manifest paths
  type-constrained to a string-union of pack-allowed keys.
  Demographic-only knobs (`head.jaw.*`, `head.face.*`, `eyes.spacing`/
  `size`, `nose.length`/`width`, `brows.fullness`/`length`,
  `mouth.width`, `ears.*`, `neck.*`) **inadmissible at compile time.**

Sized ~65 LOC net. Half to one day. Lloyd's full Pick + sizing
breakdown in `research/lloyd-cascade-architecture.md` §Q1 §Sizing.

This subsumes Nick PR #4's `recipe.suppressInteriorHairDetail` flag.
**Delete that flag in the same commit that lands the manifest.**
Lloyd's design called this out explicitly: "If `recipe.suppressLeads:
true` lands in PR #4, ships timmFlat W2, delete in the same Nick
commit that lands the manifest — default `false` means zero caller
impact." Same applies to the `suppressInteriorHairDetail` flag Nick
actually landed.

## What to land

Per Lloyd's design §Sizing (~65 LOC net):

1. **`pack.declares: string[]` field** on the pack type
   (`presets/styles.ts` or wherever pack types live), with the
   allowed-path type union as a string-literal-union type.
2. **Allowed-path type union** that matches the pack-allowed knob
   surface (Lloyd cites `styles.ts:13-26`'s header rule as the
   source of truth — read it and align). Demographic-only paths
   excluded by construction.
3. **Second pack pass in `mergeParams`** (`model/params.ts:466-484`).
   Applies pack again at slot 6, writing ONLY paths named in
   `pack.declares`. Other knobs untouched.
4. **`composeFace` rewire** (`src/api.ts` or wherever the cascade
   order lives) — add slot 6 after hairstyle, before expression.
5. **`timmFlat.declares`** populated with the contested set. Lloyd
   names the exact paths: `hair.recipe.leads`, `hair.recipe.parting`,
   `mouth.lipFullness`, `mouth.labiomentalShow`, `mouth.cornerMarks`,
   `mouth.upperCurve`, `eyes.lashes`, `eyes.lidLine`,
   `eyes.underlineHint`, `brows.style`, `nose.style`,
   `nose.bridgeVisible`, `nose.showNostrils`.
6. **`TIMM_PEDAGOGY` workaround deletion** in `scripts/timmflat-
   grid.ts` (~30 LOC removed). The override-const workaround Nick
   built in PR #3 is no longer needed once `declares` does its job.
7. **`recipe.suppressInteriorHairDetail` flag deletion** —
   `model/params.ts` field, `scaffold.ts` 4 gates, `styles.ts` pack
   setting. All four deletions in this commit. `timmFlat.declares`
   now expresses the same intent through the manifest.

Lloyd's expected diff math: +45 LOC type + manifest, +35 LOC merge
+ composeFace rewire, +15 LOC `timmFlat.declares`, −30 LOC
`TIMM_PEDAGOGY` removal. Plus Nick's own `suppressInteriorHairDetail`
deletions: another ~−15 LOC. Net ~+50 LOC overall.

## Acceptance

Per Lloyd's design §Sizing post-impl review checklist:

1. **Byte-identical regression** on existing packs ×
   13 hairstyles. `default`, `tintin`, `ligneClaire` ship
   `declares: []` → late pass no-op → identical output. Run the
   50-cell regression sweep Nick PR #4 already has (see
   `tasks/nick-cascade-leak-fix.md` §Acceptance walk).
2. **Allowed-path union matches `styles.ts:13-26`.** Engine-vs-
   style separation enforced at compile time. Demographic-only
   paths in a `declares` entry should be a TypeScript error, not
   a runtime check.
3. **timmFlat cells 4/5/8/10/13/16 still read clean** post-deletion
   of `suppressInteriorHairDetail`. The manifest covers the same
   intent; if any of the 6 primary-fix targets shows interior
   strand striping again, the manifest didn't catch what the flag
   caught. Surface to Bob, don't paper over.
4. **Test fixtures Lloyd named** in §Sizing post-impl review:
   - `declares-empty` (manifest `[]`, no-op).
   - `declares-narrow` (one path declared, scoped override only on
     that path).
   - `declares-disallowed-path` (compile error — verify the type
     system catches a demographic-only path attempt).
   - 12-hairstyle × 3-pack regression sheet diff = 0.
5. **No Lloyd architecture surface change beyond the design.** If
   you find a path Lloyd didn't anticipate (e.g., the second pack
   pass introduces a circular dependency between expression and
   pack), surface to Bob — Lloyd is reachable for a design touch-up.

## Constraints

- **Implement to Lloyd's design.** This is architectural work; the
  architecture is Lloyd's. Your job is to make the code match.
  Push back on the design if you find a bug, but don't redesign
  the cascade unilaterally.
- **Mixture rule keystone.** Default `declares: []` must produce
  byte-identical output on `default` / `tintin` / `ligneClaire`.
  Verify with the 50-cell regression sweep BEFORE handing off.
  If anything drifts, the late pass is firing when it shouldn't.
- **Delete `suppressInteriorHairDetail` cleanly.** Don't leave the
  field deprecated-but-present. The manifest is the right
  primitive; the flag was an interim landing. Per mixture rule,
  the BEHAVIOR (timmFlat has no interior strand striping) stays
  reachable — it's now reachable through `declares` rather than
  the flag. That's not survival-of-fittest; it's preserving the
  reachable point through a better mechanism.
- **Lane discipline:** Bob does the technical sign-off + Lloyd
  reviews on completion. If the LOC drifts substantially past ~+50
  net (Lloyd's estimate), surface to Bob with a brief reason
  before continuing.
- **Don't touch Q2 in this PR.** That's Wave-1 first row — lands
  before this. If you've started before Q2 lands, pause and let
  Q2 land first (Lloyd's recommended order).

## Context

- `face-lib/research/lloyd-cascade-architecture.md` §Q1 — Lloyd's
  full design with Option 4 hybrid manifest, the allowed-path
  union construction, the sizing, the post-impl review checklist,
  and the explicit subsumption of `suppressInteriorHairDetail`.
  **Read first.**
- `face-lib/src/model/params.ts` lines 466-484 — `mergeParams`
  current behavior (array-replace-on-key, per Nick PR #4 diagnosis).
- `face-lib/src/presets/styles.ts` lines 13-26 — pack header rule
  (the source of truth for the allowed-path union).
- `face-lib/src/api.ts` — `composeFace` cascade order. The slot 6
  insertion lives here (or wherever the slot 2 STYLE application
  currently fires; trace and add a parallel late-pass call).
- `face-lib/tasks/nick-cascade-leak-fix.md` — PR #4 with the
  diagnosis Lloyd's design subsumes. Your task removes the flag
  Nick landed there.
- `face-lib/scripts/timmflat-grid.ts` — `TIMM_PEDAGOGY` override
  const at lines 33-59 (or revised location post Nick PR #4 trim).
  Remove now-redundant entries.
- `face-lib/SPRINT.md` — W3 acceptance row this closes (Q1 box).

## Handoff

(Nick fills in on completion. At minimum: byte-identical regression
sweep result for `default` / `tintin` / `ligneClaire`, Lloyd's named
test fixtures status, pre-Pascal sniff test on the 6 primary-fix
targets confirming they still read clean post `suppressInteriorHair-
Detail` deletion, render paths.)
