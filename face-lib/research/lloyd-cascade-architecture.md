# lloyd-cascade-architecture — W2 design pass

*Written design only. Layer-of-fix calls for Q1 (cascade-merge) + Q2
(demographic-topology) + W3 Nick sizing.*

## TL;DR

- **Q1.** Option-4 hybrid: re-order STYLE to a late slot (post-
  hairstyle, pre-expression) AND ship a per-pack `declares: string[]`
  manifest naming the knob paths the pack asserts as truth. ~65 LOC.
  `default`/`tintin`/`ligneClaire` get `declares: []` → byte-identical.
  Nick's W2 `recipe.suppressLeads` (if it lands) refactors away.
- **Q2.** Fix at **demographic-preset-data layer**. Topology
  dispatcher (`scaffold.ts:330-339`) routes to six distinct builders
  that DO diverge — the data layer is what's flat. Push
  `bigonialWidth`/`mentalWidth`/`gonialAngle`/`jowl` spread in
  `demographics.ts`; fold in Rollo's BACKLOG `pointed`/`pear` row via
  two private fixtures. ~50 LOC.
- **Coupling.** Mechanically independent. Land Q2 first.

## Q1 — Cascade-merge architecture

### Diagnosis

`mergeParams` (`model/params.ts:466-484`) deep-merges objects with
**array-replacement** semantics — `[]` from a later layer DOES erase
prior. Leak is **cascade-order**, not merge-semantic. STYLE is slot
2; presentation/age/HAIRSTYLE (slots 3-5) silently overwrite the
pack's `recipe.leads = []`, `mouth.lipFullness: 0`, `eyes.lashes: 0`,
`eyes.lidLine: 0.6`, `mouth.labiomentalShow: 0`.

### Pick — option 4 (re-order + manifest)

Apply pack TWICE: (1) substrate pass at slot 2 (today's behavior,
unchanged); (2) declarative pass at NEW slot 6 (post-hairstyle, pre-
expression) writing ONLY paths in `pack.declares`. Default manifest
`[]` → no-op late pass → byte-identical.

`timmFlat.declares` covers the contested set: `hair.recipe.leads`,
`hair.recipe.parting`, `mouth.lipFullness`/`labiomentalShow`/
`cornerMarks`/`upperCurve`, `eyes.lashes`/`lidLine`/`underlineHint`,
`brows.style`, `nose.style`/`bridgeVisible`/`showNostrils`.

Manifest paths type-constrained to a string-union of pack-allowed
keys (`styles.ts:13-26`'s header rule). Demographic-only knobs
(`head.jaw.*`, `head.face.*`, `eyes.spacing`/`size`, `nose.length`/
`width`, `brows.fullness`/`length`, `mouth.width`, `ears.*`,
`neck.*`) inadmissible — engine-vs-style separation enforced at
compile time.

### Discarded

- **Option 1 (bare re-order).** Flips every incidental pack knob
  (`tintin`'s `ears.helixProtrusion` would beat demographics).
  Mixture-rule STOP.
- **Option 2 (type-level pin).** Locus wrong; can't vary per pack.
- **Option 3 (`recipe.suppressLeads`).** One flag per contested knob
  = manifest in disguise. Subsumed.
- **Option 5 (manifest, no re-order).** Useless without late pass.

### Mixture-rule check

`default`/`tintin`/`ligneClaire` ship `declares: []` → late pass is
no-op → byte-identical.

### Sizing — W3

~65 LOC net: `pack.declares` field + allowed-path type union
(`model/params.ts`, `presets/styles.ts`, ~45) + second pack pass in
`mergeParams` + `composeFace` rewire (~35) + `timmFlat.declares`
(~15) − `TIMM_PEDAGOGY` workaround deletion in
`scripts/timmflat-grid.ts` (~30). Half to one day.

**Lloyd post-impl review:** byte-identical regression on existing-
pack × 13 hairstyles; allowed-path union matches `styles.ts:13-26`;
timmFlat cells 4/5/8/10/13/16 read clean. **Nick test fixtures:**
`declares-empty` (no-op), `declares-narrow` (scoped override),
`declares-disallowed-path` (compile error), 12-hairstyle × 3-pack
regression sheet diff = 0.

### Nick W2 fallback interaction

If `recipe.suppressLeads: true` lands in PR #4, ships timmFlat W2,
delete in the same Nick commit that lands the manifest — default
`false` means zero caller impact.

### Decision rights

NOT Q1-envelope-changing (field addition + extra merge pass; no
breaking change; `flowStrokes` alias guard untouched). **Lloyd TL
authority.** No Gary escalation.

## Q2 — Demographic-topology gap

### Diagnosis

Dispatcher routes to six distinct builders: square = straight
obliques + cusp; round = soft U with `padHalf ≥ 0.75 × cheek`
(`buildRoundJaw:200`); jowled = HIGH-gonial bulge then taper
(`buildJowledJaw:282`). **Builders diverge; data layer is what's
flat.** `child.bigonialWidth: 0.55` + `mentalWidth: 0.55` produces a
narrow soft U that reads square-ish at 96px; `masculine.gonialAngle:
0.25` isn't a sharp Bridgman cusp; `elder.jowl: 0.38` doesn't swell
the high-gonial bulge enough. Tintin's interior line-density masked
this; Timm's flat-fill strips the mask (Pascal calibration audit's
register-sensitivity finding).

### Pick — demographic-preset-data push

Edit `demographics.ts` (Nick tunes against re-rendered Timm cells):

- `child.jaw`: `bigonialWidth 0.55 → 0.62`, `mentalWidth 0.55 → 0.60`
  (preserves no-cusp identity, widens envelope).
- `masculine.jaw`: `bigonialWidth 0.82 → 0.86`, `mentalWidth 0.46 →
  0.42`, `gonialAngle 0.25 → 0.18` (sharper cusp, Bridgman direction).
- `elder.jaw`: `bigonialWidth 0.70 → 0.74`, `jowl 0.38 → 0.48` —
  `jowl` is what `buildJowledJaw` amplifies on; load-bearing change.

**Fold Rollo's BACKLOG `pointed`/`pear` row** as two private
demographic-data fixtures (NOT new ages/presentations, avoids
combinatorial pack-expansion): `elderMascPear`, `adultFemPointed`.
Grid script opts in for off-grid probes.

### Discarded

- **Dispatcher fix.** Builders diverge; not the bug.
- **Pack-pedagogy push.** Pack cannot know correct demographic
  proportion. ROADMAP engine-vs-style STOP.

### Mixture-rule check

**Existing `tintin` × demographic renders WILL drift** — not byte-
identical. Acceptable per Lloyd judgment: prior values were
calibrated against interior-line-density masking; new spread is in
the direction of every pack's demographic read; `tintin` register
tolerance is wide. **Regression guard:** Pascal re-scores `tintin` ×
4 representative cells alongside timmFlat. If `tintin` slides, fall
back to `pack.proportionScale?: number` (default 1.0); mechanism
deferred until regression fires.

### Sizing — W3

~50 LOC net: jaw proportion edits in `demographics.ts` (~15) +
`elderMascPear` + `adultFemPointed` fixtures (~25) + grid script
opt-in (~10). Half day plus tuning iterations.

**Lloyd post-impl review:** `tintin` × adult-masc didn't regress;
four-corner thumbnail passes on timmFlat; pear/pointed fixtures
render. **Nick test fixtures:** `topology-spread.test.ts` on
proportion deltas; four-corner 96px composite snapshot (manual
Pascal re-score, not automated diff).

### Decision rights

NOT Q1-envelope-changing. Data edits + private fixtures. **Lloyd TL
authority.** No Gary escalation.

## Q3 — Coupling

Mechanically independent. **Land Q2 first** (smaller, no
architectural risk, early Pascal signal); Q1 second. One touch:
Q1's allowed-path union MUST exclude `head.jaw.*` + `head.face.*` —
engine-vs-style separation enforced at the type system.

## Debt left

- `pack.proportionScale` — land only if Q2 regresses `tintin`.
- Late-pass for expression/character presets — same manifest
  extends; flag to Claudia for W4 pack-spec.
- `flowStrokes` deprecated alias guard untouched.

---

*— Lloyd, Q1-W2 cascade-architecture design pass.
   Q1: STYLE late-slot + `pack.declares` manifest. ~65 LOC.
   Q2: demographic-preset-data push. ~50 LOC.
   Independent; land Q2 first.*

## Pass 4 — Nick Q2 implementation review

Reviewed commit `9e03a7f`. Three files (`demographics.ts`,
`timmflat-grid.ts`, `SPRINT.md`). Architectural surface only — Felix's
parallel scaffold WIP is out of scope; did not read or touch it.

### 1. §Pick delta fidelity — APPROVED-AS-IS

Verbatim. `child.bigonialWidth 0.55→0.62`, `mentalWidth 0.55→0.60`;
`masculine.bigonialWidth 0.82→0.86`, `mentalWidth 0.46→0.42`,
`gonialAngle 0.25→0.18`; `elder.bigonialWidth 0.70→0.74`,
`jowl 0.38→0.48`. Every comment block back-references Lloyd §Q2 §Pick
and names the load-bearing builder mechanism (e.g., `buildJowledJaw`'s
`jowlHalfX = bigonialHalf * (1.08 + 0.18 * jowl)`). Zero invented
deviations.

### 2. Private fixtures — APPROVED-AS-IS

`elderMascPear` + `adultFemPointed` are `export const` named partials,
NOT folded into `ages`/`presentations`. Grepped: only consumer is
`timmflat-grid.ts`. `api.ts` does NOT re-export them. `AgeName`,
`PresentationName`, `ageNames`, `presentationNames` arrays unchanged.
Cascade pipeline does not know they exist. Combinatorial pack-expansion
space is byte-identical to pre-W3. Architectural design intent met
fully.

### 3. Mixture-rule guard (tintin × 4) — APPROVED-AS-IS

Verified independently: re-rendered tintin × adult-masc / elder-masc /
child-fem against the 9e03a7f^ baseline. All three drift in the
designed direction — cusp sharper on adult-masc (Hergé-direction, not
parody), jowl-bulge now visible on elder (prior read oddly youthful),
soft-U wider on child (more clearly child vs. teen). Adult-fem byte-
identical (untouched demographic). Tintin register vocabulary
(interior-line density, dot eyes, low-lash brows) preserved on every
cell. **No regression; no `pack.proportionScale` escalation required.**

### 4. default + ligneClaire drift — APPROVED-AS-IS

Per-SVG byte-diff vs 9e03a7f^ baseline across {default, ligneClaire,
tintin} × {adult, child, elder, teen} × {masc, fem}:

- adult-fem + teen-fem + teen-masc (Q2-untouched demographics):
  IDENTICAL across all three packs.
- adult-masc, child-{m,f}, elder-{m,f} (Q2-touched): DIFFER, on the
  jaw-geometry axis only.

This is exactly the design contract — demographic-data layer is
upstream of every pack. Nick's interpretation of the task brief (Lloyd
design overrides task's stricter one-pack-only reading) is the
correct call; data layer can't selectively drift one pack without
adding pack-level demographic overrides we explicitly DIDN'T design.
**No Gary escalation. `pack.proportionScale` stays in the debt-left
list, not lifted.**

### 5. Four-corner thumbnail — APPROVED-AS-IS

`/tmp/timmflat-out/grid-96/four-corners.png`: cell 1 reads cusped-square
(Bridgman direction, not parody), cell 4 soft-oval (anchor),
cell 12 soft-U round (visibly wider bottom than cell 4), cell 14
jowled (clear gonial swell outside cheek line). Four distinguishable
topologies at 96px — Pascal Pass 2's four-corner failure mode is
resolved. Pascal's absolute-score call still pending but the topology
gap that capped cells 12-16 at 4 is mechanically closed.

### Q1 design-touchback

None. Q2 deltas didn't surface anything that requires re-cutting the
Q1 manifest. Allowed-path union still must exclude `head.jaw.*` +
`head.face.*` (already specified). Nothing in Nick's grid-script
private-fixture shape (named-partial → `mergeOverrides` layering)
conflicts with the late-pass manifest mechanism — overrides slot is
still slot 7, demographic-data fixtures don't ride the pack-late-pass.

### Verdict

**APPROVED-AS-IS across all five concerns.** Q2 box landed clean.
Hand to Pascal for Wave 3 re-score.

*— Lloyd, Pass 4 review of Nick Q2 (commit 9e03a7f).*
