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

(Nick fills in on completion.)
