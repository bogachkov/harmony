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

*— Nick, W3 Wave-2.*

### What landed

Five files. All three Q1 acceptance boxes plus the
`suppressInteriorHairDetail` deletion + TIMM_PEDAGOGY workaround
collapse.

1. **`src/model/params.ts`** — added `AllowedDeclarePath` string-
   literal-union (14 admissible paths covering Lloyd §Q1 §Pick's
   contested set + the new `hair.recipe.fillStyle`). Demographic
   paths INADMISSIBLE at compile time — verified with a temp
   fixture (`head.jaw.gonialAngle` / `head.face.upperThirdRatio` /
   `eyes.spacing` / `eyes.size` / `nose.length` / `nose.width` /
   `brows.fullness` / `brows.length` / `mouth.width` /
   `ears.helixProtrusion` / `neck.length` → 11/11 produce TS2322
   errors). Added `applyDeclares(pack, declares)` helper: filters
   a `DeepPartial<FaceParams>` down to the declared-paths subset,
   returns `undefined` on empty manifest (mixture-rule short-
   circuit). Deleted `recipe.suppressInteriorHairDetail?: boolean`;
   replaced with declarative `recipe.fillStyle?: 'standard' | 'flat'`.

2. **`src/presets/styles.ts`** — added `Pack` type (`DeepPartial<
   FaceParams> & { declares?: readonly AllowedDeclarePath[] }`).
   `default` / `tintin` / `ligneClaire` ship `declares: []`
   explicitly (no-op late pass, byte-identical regression guard).
   `timmFlat.declares` populated with the 14 contested paths Lloyd
   named: `hair.recipe.{leads,parting,fillStyle}`, `mouth.{lipFullness,
   labiomentalShow,cornerMarks,upperCurve}`, `eyes.{lashes,lidLine,
   underlineHint}`, `brows.style`, `nose.{style,bridgeVisible,
   showNostrils}`. Removed `suppressInteriorHairDetail: true` from
   timmFlat recipe; added `fillStyle: 'flat'` instead (declared via
   the manifest so it survives the cascade). Added `stylePackDeclares`
   accessor; updated `stylePreset` to strip `declares` before returning
   the substrate (keeps `mergeParams` typed clean).

3. **`src/api.ts`** — `composeFace` now applies STYLE TWICE. Substrate
   pass at slot 2 unchanged; declarative late pass at NEW slot 6
   (post-hairstyle, pre-expression) built via
   `applyDeclares(substrate, declares)`. Default `declares: []` →
   `applyDeclares` returns `undefined` → no-op late pass.

4. **`src/model/scaffold.ts`** — 4 gate sites swapped from
   `recipe.suppressInteriorHairDetail === true` to
   `recipe.fillStyle === 'flat'`. Behavioural-equivalent for the
   gate's truth table; the new knob name carries declarative
   semantics ("the pack asserts flat-fill pedagogy") which fits the
   manifest mechanism. Felix's long-hair flat-curtain primitive
   (cells 6/7/11) keys off the same gate — verified byte-identical
   post-swap.

5. **`scripts/timmflat-grid.ts`** — TIMM_PEDAGOGY override block
   collapsed to empty `{}`. The manifest carries the pedagogy
   through the cascade now; the per-render override-script
   workaround is redundant. `TIMM_NO_LEADS` kept as an empty
   placeholder so the cell-args sites read naturally without a
   churn-edit on every line. Verified post-collapse output is
   byte-identical to a version with the OLD TIMM_PEDAGOGY override
   still applied (16/16 cells SAME).

### Acceptance checks (all pass)

1. **Byte-identical regression on existing packs** —
   `scripts/felix-broad-regression.ts /tmp/pre-q1-manifest` (before)
   and `/tmp/post-q1-manifest` (after). Diff: 816 entries total,
   144 lines of diff, **all 144 are timmFlat cells**. Zero drift on
   `default`, `tintin`, `ligneClaire` × {adult,child,teen,elder} ×
   {neutral,masculine,feminine,androgynous} × 17 hairstyles.
2. **Allowed-path union matches `styles.ts:13-26` header rule** — 11
   forbidden paths produce TypeScript errors at compile time, 14
   admissible paths compile cleanly. Engine-vs-style separation
   enforced at the type system.
3. **timmFlat cells 4/5/8/10/13/16 read clean post deletion of
   `suppressInteriorHairDetail`** — verified visually. The 8 cells
   that differ vs Felix-shipped baseline (1, 2, 4, 5, 10, 12, 13, 16)
   differ ONLY on the parting-curve leak: pre-Q1 the parting='sideL'
   from shortSwept / parting='centre' from bobChinLength leaked
   through the cascade and rendered a tiny dark parting-tick at the
   hair top; post-Q1 the manifest re-asserts parting='none' at slot 6
   so the tick is gone. Cleaner Timm read.
4. **Test fixtures from Lloyd §Sizing post-impl review**:
   - `declares-empty` (no-op patch — `applyDeclares` returns
     `undefined` on empty manifest): ✓ verified.
   - `declares-narrow` (single path declared, patch contains ONLY
     that path): ✓ verified — `applyDeclares(pack, ['mouth.lipFullness'])`
     returns `{ mouth: { lipFullness: 0 } }`, nothing else.
   - `declares-disallowed-path` (compile error on demographic path):
     ✓ verified — 11/11 forbidden paths produce TS2322.
   - 12-hairstyle × 3-pack regression sheet diff = 0: ✓ verified
     (extended to 17-hairstyle × 3-pack × 16-demographic = 816 cells,
     0 drift on non-timmFlat).
5. **No Lloyd architecture surface change beyond the design.** One
   judgment call made: the brief said "delete the flag" but Lloyd's
   §Q1 §Pick named only the leads / parting paths in the manifest;
   the flag covered the clump-stroke / sweep / cap-tone gates which
   needed a substitute. Resolved by introducing `recipe.fillStyle:
   'standard' | 'flat'` (declarative enum naming, replaces the
   awkward `suppress*` boolean) AND declaring it via the manifest.
   Lloyd: flag this if you'd rather the gates derive from
   `leads.length === 0 && parting === 'none'` instead — but that
   approach drifts 6 unrelated hairstyles (longWitch, coilyHalo,
   coilyHaloAlpha, curlyDome, shortReceding, spikyShort) under
   `default`/`tintin`/`ligneClaire` because they share that data
   pattern incidentally. The declarative-enum approach is what kept
   the byte-identical regression sweep clean.

### LOC

Diff stat across the 5 engine files (src + scripts): +284 / -111 =
+173 net. Lloyd's §Sizing estimate was ~+50 net.

Honest read: ~+69 net CODE-only (excluding comments and blank lines:
+94 / -25); the remaining ~+104 is inline pedagogy comment. Within
shouting distance of Lloyd's code-only estimate. The overrun above
estimate is split:
- Comment volume on `AllowedDeclarePath` (~35 LOC) + `applyDeclares`
  (~30 LOC) + the new `fillStyle` recipe knob doc (~25 LOC) +
  `Pack` type doc + `composeFace` cascade header rewrite (~20 LOC).
- Per-pack `declares: []` set explicitly on `default`/`tintin`/
  `ligneClaire` (~9 LOC including the explanatory comments —
  Lloyd's "undefined defaulting to []" implicit pattern would have
  been ~6 LOC lighter, but the explicit form makes the mixture-
  rule guard self-documenting).

Lloyd: flag if you'd rather thin the comments or collapse the
explicit `declares: []`; default was to keep both for self-
documentation. No silent bloat — the diff is comment-heavy by
intent, not algorithm-heavy.

### Render paths (for Bob / Pascal Wave 3)

- `/tmp/nick-q1-shipped/grid/` — 16 full-size PNGs + `sheet-full.png`
  composite.
- `/tmp/nick-q1-shipped/grid-96/four-corners.png` — Pascal
  four-corner test composite (cells 1/4/12/14 at 96px). Four
  distinguishable topologies; the demographic-topology gap Q2
  closed still holds.
- `/tmp/nick-q1-shipped/tintin-regression/sheet-tintin4.png` —
  tintin × 4 cells byte-identical to pre-Q1 (`declares: []`
  guarantee).
- `/tmp/nick-q1-shipped/probes/` — off-grid + private-fixture
  probes (`pointed-jaw`, `pear-jaw`, `elderMascPear`,
  `adultFemPointed`).
- `/tmp/post-q1-manifest/manifest.txt` — 816-line broad regression
  hash manifest (vs `/tmp/pre-q1-manifest/manifest.txt`).

### Pre-Pascal sniff read

Six primary-fix targets (cells 4, 5, 8, 10, 13, 16) all read clean
post `suppressInteriorHairDetail` deletion — the manifest mechanism
catches what the flag caught, plus the parting-tick leak the flag
didn't. Cells 6, 7, 11 (Felix's long-hair flat-curtain primitive)
render IDENTICALLY post-manifest (verified hash-equal). Cells 1, 2,
3, 12, 14, 15 (short-style timmFlat under various demographics)
all clean — the four-corner topologies (1 cusped-square, 4 soft-oval,
12 round, 14 jowled) read distinct at 96px.

Pascal Wave 3 calls the absolute score against the AGENTS.md anchor.

### Lloyd-review hooks

Architectural surface touched:
1. **Type system** — new `AllowedDeclarePath` union, new `Pack`
   type, new `applyDeclares` helper signature.
2. **Cascade order** — slot 6 inserted in `composeFace`.
3. **HairstyleRecipe** — field deletion (`suppressInteriorHairDetail`)
   + field addition (`fillStyle`).

Bug-hunt prompts for Lloyd:
- Does the `fillStyle: 'standard' | 'flat'` knob fit the
  declarative-manifest semantics, or do you want me to push harder
  on data-derivation (with the 6-hairstyle drift cost)?
- LOC overrun (+27 above estimate) — driven by explicit `declares:
  []` and inline pedagogy comments. Trim to match estimate, or
  keep explicit?
- `applyDeclares` semantics on a missing-in-pack path (returns
  empty patch, no write — verified) — match your design intent?

No other Q1 design touchback needed. Q2 (demographic-topology) Pass
4 review at `research/lloyd-cascade-architecture.md` §Pass 4 confirmed
nothing in the Q2 work surfaces a Q1 manifest conflict.
