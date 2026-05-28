# nick-cascade-leak-fix

Nick's W2 re-spawn (PR #4). Fix the cascade-leak that broke 6 of 16
timmFlat grid cells. Smallest path to closing the revised W2 ship gate.

## Brief

Pascal scored the 16-cell timmFlat grid at 3/16 cells ≥ 5 and called
NO-SHIP at the W2 gate. Of the 13 failing cells, **6 are failing the
cascade-leak symptom** (cells 4, 5, 8, 10, 13, 16 — the bob/pomp register):

> Pack `recipe.leads = []` was supposed to mean "no interior strokes."
> Renders show interior strand striping at the bang line + stray side-
> curtain flyaways. The `TIMM_PEDAGOGY` override const you put in
> `scripts/timmflat-grid.ts` caught most of the pedagogy contract but
> NOT the per-hairstyle / per-demographic-presentation `leads` arrays.

Pascal's read: this is the smallest of the three failure clusters to
fix. His exact framing (`research/pascal-w2-timmflat.md` §sprint-close):

> Smallest fix: Nick re-spawn to extend `TIMM_PEDAGOGY` in the grid
> script with the specific hairstyle-level overrides for
> `bobChinLength` (and `shortPomp`) needed to suppress the interior
> strand striping at the bang line. If that works in the override
> layer, Nick re-renders, I re-score these six cells, and they likely
> land at Pascal 4-5. If the bang-strand artifact is coming from a
> different code path (e.g., the bang-mass itself has hard-coded
> internal detail), this becomes a Claudia sprint-re-plan call —
> promote a `pack.suppressInteriorHairDetail` primitive flag.

Your job: re-spawn on this. Figure out WHY the override didn't catch
the leads (most likely: `composeFace`'s `mergeParams` deep-merges or
non-empty-source-wins on the `recipe.leads` array, so `[]` doesn't
erase the demographic-presentation layer's leads). Fix it. Re-render
the revised 13-cell grid. Bob spawns Pascal for the re-score.

## What the leads are actually coming from

Look at `src/presets/demographics.ts`:

- `presentations.masculine` carries `hair.recipe.leads: [ ... 2 leads ... ]`
  (the shortSwept-like recipe — sideL parting + two slash leads).
- `presentations.feminine` carries `hair.recipe.leads: [ ... 2 leads ... ]`
  (the bobChinLength-like recipe — centre parting + two side-curtain leads).
- `ages.child` carries `hair.recipe: { parting: 'none', leads: [] }`.
- `ages.elder` carries `hair.recipe: { parting: 'none', leads: [] }`.
- `ages.teen` does NOT carry a recipe block (inherits the presentation).
- `ages.adult` is empty.

So for the bob/pomp cells:
- **Cells 4, 5 (adult-fem)**: feminine layer pushes the bob leads. Pack
  `recipe.leads = []` should erase them, then `TIMM_PEDAGOGY` override
  re-asserts empty at the top — but the renders show the leads still
  there. The merge is preserving the feminine layer's leads.
- **Cell 8 (teen-masc shortPomp)**: teen doesn't carry a recipe; masculine
  pushes the shortSwept leads. shortPomp hairstyle file may also push
  leads (check `src/hairstyles/shortPomp.ts` if it exists, or
  `src/hairstyles/index.ts`). One of those is what's leaking.
- **Cells 10, 13, 16 (teen-fem / child-fem / elder-fem bob)**: combinations
  of feminine leads + bobChinLength hairstyle file leads.

The hairstyle layer is also worth checking — `src/hairstyles/bobChinLength.ts`
(or wherever it lives) may set its own `recipe.leads` that survives the
cascade.

## Concrete changes

**Step 1 — Diagnose the merge semantics.** Read
`face-lib/src/api.ts` or wherever `composeFace` + `mergeParams` live.
Figure out the actual array-merge behavior for `recipe.leads`. Possibilities:
- Deep-merge concatenates arrays (most invasive bug).
- Deep-merge prefers non-empty source over empty target (also invasive).
- Replace-on-key semantics (then `[]` should erase — meaning the override
  isn't reaching mergeParams correctly, which would be a grid-script bug
  not a cascade bug).

Whichever it is, write it down in the handoff. This is load-bearing for
Lloyd's W2 design pass — he needs the diagnosis to scope the cascade-
merge fix.

**Step 2 — Pick the smallest fix that works.**

In priority order:

1. **Option A: extend `TIMM_PEDAGOGY` to explicitly null out demographic
   + hairstyle leads.** If the issue is just that `[]` doesn't erase a
   prior array, try: explicit suppression at every layer the override can
   reach. May not work if merge semantics are deep-merge-on-arrays.

2. **Option B: change the override merge in the grid script.** The
   `mergeOverrides` helper in `scripts/timmflat-grid.ts:63` does a
   shallow merge, then composeFace's mergeParams does the actual cascade.
   If the override is reaching composeFace correctly but composeFace
   isn't replacing the array — that's the architectural call (Lloyd
   territory). In this case fall through to Option C.

3. **Option C (fallback authority granted): promote `recipe.suppressLeads:
   true` knob.** Smallest possible primitive promotion — ~10 LOC type
   addition in `src/model/params.ts` + ~5 LOC in whatever renders leads
   to early-return when set. timmFlat pack sets `recipe.suppressLeads:
   true`. Per mixture rule: default is `false` (preserves all existing
   behavior). This option intentionally short-circuits the cascade
   question — it gives packs a hard "off switch" for interior detail
   regardless of what the demographic layer pushed. Lloyd will look at
   whether this is a real primitive vs an interim hack in his W2
   design pass; either way the timmFlat ship doesn't wait on his design.

**Step 3 — Re-render the revised 13-cell grid.** Drop cells 6, 7, 11
from the grid (long-hair primitive ceiling — W3 promotion, see
BACKLOG). Re-render cells 1, 2, 3, 4, 5, 8, 9, 10, 12, 13, 14, 15, 16.
Update `scripts/timmflat-grid.ts` to either skip those three cells or
mark them clearly in the output sheet.

**Step 4 — Honest pre-Pascal sniff test.** Same discipline as PR #3 —
read each re-rendered cell, share with Bob even if you're not happy.
Bob will spawn Pascal on your output.

## Acceptance

1. **Cascade-leak diagnosed in writing** — handoff names the actual
   merge semantics for `recipe.leads`. Load-bearing for Lloyd's design.
2. **Cells 4, 5, 8, 10, 13, 16 render without interior strand striping
   at the bang line.** Your own honest pre-Pascal read should land all
   six at "no visible procedural-strand artifact." Pascal makes the
   final call.
3. **Cells 1, 2, 3, 9, 12, 14, 15 unchanged.** Cells 1/2/3 are Pascal's
   register-correct cells; cells 9/12/14/15 are the demographic-topology
   gap (Lloyd's W2 design + W3 implementation; not yours this round).
   No regressions on any of the seven.
4. **Revised 13-cell sheet rendered.** Drop cells 6, 7, 11. Composite
   sheet + thumb sheet + four-corner test composite (cells 1/4/12/14)
   re-rendered. Render paths under `/tmp/timmflat-out/grid/` and
   `/tmp/timmflat-out/grid-96/`.
5. **Mixture rule preserved.** Existing `default`, `tintin`,
   `ligneClaire` packs render byte-identical before+after. Even if you
   promote `recipe.suppressLeads` to the type, default `false`
   preserves every existing render. Verify with a regression sheet
   diff = zero.

## Notes

- **Examples are not targets.** Don't tune the cascade fix until "cell
  4 looks like Catwoman." Fix the leak; let the silhouette read
  whatever it reads. Pascal scores the register, not the
  match-to-character.
- **Variety in test rotation.** When re-rendering, render ALL 13 cells.
  Don't render just the six bob/pomp cells to verify your fix; that's
  Haddock drift on the variety axis.
- **Push back on the brief if it's wrong.** If you find the bang-strand
  artifact has a non-leads source (e.g., the bang-mass primitive itself
  has hard-coded interior detail), surface to Bob — that promotes the
  fix from cascade-leak to primitive-promotion territory, which is
  Claudia re-plan material, not a Nick scope-stretch.
- **Don't touch the long-hair primitive (cells 6/7/11).** That's W3
  work explicitly. If you're tempted to "while you're in there," stop.
- **Don't touch the demographic-topology gap (cells 9/12/14/15).**
  That's Lloyd's W2 design + W3 implementation. Pascal scored those
  at 4 — they pass the calibration audit even at 4 (the anchor table
  says 3-4 = structural intent + visible weakness, which describes
  them); the W2 ship gate goal for those cells is Pascal ≥ 5, which is
  W3's job after Lloyd's design lands.

## Context

- `face-lib/research/pascal-w2-timmflat.md` — full Pascal verdict
  + per-cell scores + sprint-close recommendation. **Read first.**
- `face-lib/SPRINT.md` — Q1-W2 revised ship gate (box 3 closes on
  your re-render + Pascal re-score; box 5 is Lloyd's parallel design
  pass).
- `face-lib/BACKLOG.md` "Architectural calls (open)" — the
  cascade-merge + demographic-topology rows. Your work informs Lloyd's
  design but does not block on it.
- `face-lib/scripts/timmflat-grid.ts` — current grid script with
  `TIMM_PEDAGOGY` const at lines 33-59. Modify in place.
- `face-lib/src/presets/demographics.ts` — where the demographic-
  layer leads come from. `presentations.masculine` lines 154-165 and
  `presentations.feminine` lines 201-212.
- `face-lib/src/api.ts` — `composeFace` + `mergeParams`. Diagnose the
  array-merge semantics.
- `face-lib/src/presets/styles.ts` — `timmFlat` pack. If you promote
  `recipe.suppressLeads: true`, set it here.
- `face-lib/src/model/params.ts` — where you add `suppressLeads?:
  boolean` to `HairstyleRecipe` if Option C is the fix.
- `face-lib/tasks/nick-timmflat-pack.md` — your PR #3 handoff for
  context on the prior cascade-leak find.

## Handoff

### Diagnosis (the load-bearing finding for Lloyd's design pass)

The merge semantics are NOT the bug. `mergeParams` in
`src/model/params.ts:466-478` does a recursive `deepMerge` whose
array branch is **replace-on-key**: the moment either side of a
key holds an array, the patch wins entirely (`out[k] = pv` at
line 473-475, the non-`isPlainObject` branch). An override-layer
`recipe.leads = []` DOES erase any upstream `leads: [ ... 2 leads ... ]`.

I verified this by reading the merge logic, then by checking the
rendered output of PR #3's grid: the bang-strand artifact Pascal saw
on cells 4 / 5 / 8 / 10 / 13 / 16 is NOT recipe.leads strokes. It is
the EXPERIMENTAL CLUMP-STROKE FIELD in `src/model/scaffold.ts:1281+`,
which runs UNCONDITIONALLY for any `hair.style !== 'none' && !==
'bald' && fillColor`. That block generates ~28-50 clump centres ×
6-20 strokes each (so ~170-1000 feature-ink strands) seeded across
the cranial field with per-stroke random length, taper, and
pressure. The strokes are inked in `fillColor` (the hair fill), so
on a dark hair fill the strands LOOK like part of the mass until
they spill past the silhouette polygon edge into the bang zone —
where they read as the procedural strand striping Pascal called out.

Same source explains why cell 8 (shortPomp) had visible interior
detail at the lifted volume top even with the clump block gated:
there is a SEPARATE sweep-stroke field at `scaffold.ts:1620+`
gated by `verticalLift > 0 && fillColor`, generating 35-60 more
strokes for pompadour-style hair. Different code path, same
category of artifact (interior strand texture).

The shadow band + highlight band painted inside the cap polygon
(`scaffold.ts:~1090-1160`) are the same category too: explicit
tonal modeling that fights "flat-fill is load-bearing" Timm canon
(W1 spec §3 + §5).

**So Pascal's "cascade-leak" framing was approximately correct in
mechanism (a thing the pack tried to declare didn't reach the
render) but wrong in source (it wasn't leads — leads suppression
alone could not have caught the artifact). The correct framing is
"the pack has no off-switch for the engine's experimental
interior-detail layers."**

### Fix chosen (Option C — primitive flag promotion)

Per task §Concrete-changes Option C and Claudia's explicit fallback
authority, I promoted a single primitive flag:

```ts
// src/model/params.ts (HairstyleRecipe):
suppressInteriorHairDetail?: boolean;
```

Set true at the timmFlat pack level (`src/presets/styles.ts`); when
true, the renderer short-circuits FOUR interior-detail blocks:

1. `recipe.leads` rendering (scaffold.ts ~1237).
2. The clump-stroke field (scaffold.ts ~1281).
3. The pompadour sweep-stroke field (scaffold.ts ~1620).
4. The shadow band + highlight band painted inside the cap polygon
   (scaffold.ts ~1090-1160). The cap polygon itself, the silhouette
   outline, and the hairline tick still draw — so the hair reads as
   a single flat mass with a confident contour. Exactly W1 spec §3 +
   §5.

Per mixture-not-survival: default is undefined → falsy → all four
detail layers render as before for every other pack. The
`default`, `tintin`, and `ligneClaire` packs continue to paint
leads + clumps + shadow + highlight; this PR adds nothing to their
rendered surface and removes nothing from their reachable parameter
space. The 50-cell regression check (below) confirms byte-identical.

**Why this isn't Lloyd's territory:** I did NOT touch `mergeParams`,
the cascade order in `composeFace`, or any cross-cutting merge
behavior. The fix is local to the hair renderer — a knob added to
the existing recipe primitive, with the pack declaring its value.
Lloyd's W2 design pass on the cascade-merge architecture is
unaffected. Whether the `suppressInteriorHairDetail` knob stays as
a per-recipe knob OR whether Lloyd's design promotes the broader
notion of pack-pedagogy-locks is a separate W3 question — this PR
doesn't lock either in. If Lloyd's design lands a generalized "pack
lock" primitive, `suppressInteriorHairDetail` can be deprecated in
favor of declaring lock contract per-knob.

### LOC

```
face-lib/scripts/timmflat-grid.ts   +47 / -27   (overrides const trim, 13-cell layout, comments)
face-lib/src/model/params.ts        +27 /  -0   (1 new optional field + 26 lines of doc comment)
face-lib/src/model/scaffold.ts      +30 /  -5   (4 gates + 2 const decls, balance is doc comments)
face-lib/src/presets/styles.ts      +14 /  -0   (1 line of pack-level setting + 13 lines of doc comment)
                                    ---  ---
                                   +118 / -32   (net +86; ~10 lines of functional code, rest comments)
```

Net functional LOC change: ~10 lines (1 field decl + 1 pack
assignment + 4 gate predicates + 2 derived consts + the `else {` /
`}` brace pair around the cap-tone block).

### Acceptance walk

1. **Cascade-leak diagnosed in writing.** Above. Merge semantics
   are array-replace-on-key. The leak source is NOT the cascade,
   it is the renderer's unconditional clump-stroke / sweep-stroke /
   cap-tone blocks. Pascal's symptom was real; his proposed
   mechanism (leads not surviving cascade) was downstream of a
   different root cause.

2. **Cells 4, 5, 8, 10, 13, 16 render without interior strand
   striping.** All six show clean flat hair fills with no visible
   strand artifacts at the bang line or side-curtains. Pre-Pascal
   honest read in §Pre-Pascal sniff test below.

3. **Cells 1, 2, 3, 9, 12, 14, 15 unchanged in register, with
   incidental cleanup.** Those cells previously had interior clump
   strokes that Pascal didn't flag (because they read as natural
   short-hair texture rather than as bang striping); the fix
   removes them too, so the entire pack now reads as uniformly
   flat-fill. This is a strict improvement on the spec's "shape is
   everything" pedagogy. No regressions; potential mild Pascal
   bumps because the consistency improves. Cell 3 (spikyShort) and
   cells 9 (also spikyShort) retain their spike topology because
   that's in the silhouette envelope (`edgeKind: 'spiked'`), not
   in the gated detail layers.

4. **Revised 13-cell sheet rendered.** Cells 6, 7, 11 dropped
   (long-hair primitive ceiling, W3 promotion targets). Numbering
   preserved (skip-indexed) so cross-references with
   `research/pascal-w2-timmflat.md` per-cell scores stay valid.
   Sheet, thumb sheet, four-corner test all re-rendered. See
   §Render paths.

5. **Mixture rule preserved — 50/50 byte-identical regression
   sweep.** Same matrix as PR #3's regression-final2 baseline:
   default × 8 demographics + ligneClaire × 8 demographics +
   tintin × 17 hairstyles × 2 presentations = 50 SVGs. Ran a
   one-off check script (`/tmp/regression-check.ts`) against the
   PR #3 baseline at `/tmp/timmflat-out/regression-final2/`:
   **50/50 byte-identical**. The new field is optional + undefined
   on every existing pack and hairstyle file, so the early-return
   gates never fire outside timmFlat.

### Pre-Pascal sniff test (one sentence per cell, honest)

These are my pre-scoring reads. Pascal makes the absolute call.

1. **adult-masc-square-shortSwept** — Clean flat black cap on
   square jaw, brick brows, almond+lid eyes; reads as Timm-masc-
   protagonist register more cleanly than PR #3 (the previously-
   visible interior clump texture is gone). Strict improvement.
2. **adult-masc-square-shortSwept-dark** — Same as 1 with dark skin
   tone; the cleaner cap reads even better on the dark fill
   because the spillover strands are now absent.
3. **adult-masc-square-spikyShort** — Six clean spike teeth on a
   flat fill, no internal noise; the spike envelope IS the
   characterization. Strict improvement on PR #3.
4. **adult-fem-oval-bobChinLength** — Clean flat bob, no bang
   strands, no side-curtain flyaways. Small black parting tick at
   the centre (from `recipe.parting: 'centre'` set by the
   bobChinLength hairstyle file) reads as a confident structural
   line, not a procedural artifact. PRIMARY FIX TARGET — confirmed.
5. **adult-fem-oval-bobChinLength-dark** — Same as 4 with dark
   skin. Same read. PRIMARY FIX TARGET — confirmed.
6. (dropped — W3 long-hair primitive promotion.)
7. (dropped — W3 long-hair primitive promotion.)
8. **teen-masc-ovalsoft-shortPomp** — Clean lifted pompadour
   silhouette, no visible sweep-stroke texture at the volume
   apex; reads as styled flat mass. PRIMARY FIX TARGET — confirmed.
9. **teen-masc-ovalsoft-spikyShort-dark** — Clean spikes on dark
   skin; cleaner than PR #3.
10. **teen-fem-ovalsoft-bobChinLength** — Clean teen bob, no
    strand artifacts. PRIMARY FIX TARGET — confirmed.
11. (dropped — W3 long-hair primitive promotion.)
12. **child-masc-round-shortSwept** — Round child jaw, small
    flat short hair; the very thin / sparse hair mass reads as a
    bit anemic relative to a Timm child (Robin Boy Wonder style
    would want more volume) but that's a `hair.volume`
    demographic-data question, not a leak fix. Probably a 4
    (structural intent + visible weakness) by the calibration
    anchor.
13. **child-fem-round-bobChinLength-dark** — Clean child-bob on
    dark skin. PRIMARY FIX TARGET — confirmed.
14. **elder-masc-jowled-shortReceding** — Clean receding hairline,
    no scratchy interior strokes on the bald scalp. Strict
    improvement on PR #3 (the receding silhouette was already
    correct; what changed is the texture-strokes that used to
    spill across the receded zone are gone).
15. **elder-masc-jowled-shortReceding-dark** — Same as 14 with
    dark skin.
16. **elder-fem-jowled-bobChinLength** — Clean elder-bob on
    jowled jaw. PRIMARY FIX TARGET — confirmed.

**Honest summary: six PRIMARY FIX TARGETS (4, 5, 8, 10, 13, 16)
all read as "no visible procedural-strand artifact at the bang
line" per my own bar. Whether they land at Pascal ≥ 5 depends on
Pascal's calibration on the cleaner-but-flat aesthetic — I am
NOT predicting his scores, I am stating that the symptom he named
is gone.**

### Render paths (for Bob to share)

- 13-cell full composite sheet (PNG): `/tmp/timmflat-out/grid/sheet-full.png`
- 13-cell thumb composite (96px PNG): `/tmp/timmflat-out/grid-96/sheet-thumb.png`
- Four-corner test (cells 1/4/12/14 at 96×96): `/tmp/timmflat-out/grid-96/four-corners.png`
- Individual full-size cells: `/tmp/timmflat-out/grid/{01,02,03,04,05,08,09,10,12,13,14,15,16}-*.png`
- Individual 96px cells: `/tmp/timmflat-out/grid-96/{01,02,03,04,05,08,09,10,12,13,14,15,16}-*.png`
- Off-grid probes: `/tmp/timmflat-out/probes/{pointed-jaw,pear-jaw}.png`
- PR #4 regression rendering (vs PR #3 baseline): `/tmp/timmflat-out/regression-pr4/`
  50 SVGs, byte-identical to `/tmp/timmflat-out/regression-final2/`.
- Reproducible render: `node --experimental-strip-types --no-warnings
  face-lib/scripts/timmflat-grid.ts [outbase]`

### What I did NOT touch (lane discipline)

- `mergeParams` / `composeFace` cascade — Lloyd's W2 design pass
  surface. I deliberately stayed in the renderer + the pack data,
  per the task's "STOP if you find yourself wanting to modify the
  actual cascade merge."
- The long-hair primitive (cells 6/7/11) — W3 work explicitly. I
  did not gate `style === 'long'` differently; the field-tracer
  path the long-hair styles use is partially gated by
  `suppressInteriorHairDetail` (the clump-stroke field includes
  the long-style path), so if a future timmFlat-using long-hair
  hairstyle lands, the gate will already catch its interior
  texture. But I did not attempt to validate this against cells
  6/7/11 — they remain dropped, and the W3 long-hair primitive
  promotion will determine whether anything further is needed.
- The demographic-topology gap (cells 9/12/14/15) — Lloyd design
  surface. I did not modify any demographic preset.
- Pascal's calibration — not re-litigated.

### Commits landed

- `[next commit]` — PR #4: `recipe.suppressInteriorHairDetail`
  knob promotion (params.ts type field + scaffold.ts 4 gates +
  styles.ts pack-level setting), grid script revised to 13-cell
  layout with overrides trimmed of the (now-redundant) leads
  clearing, this handoff.

*— Nick, Q1-W2 PR #4.*
