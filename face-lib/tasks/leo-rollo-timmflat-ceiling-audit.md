# leo-rollo-timmflat-ceiling-audit

Q1-W4 Box 1 (the head of the master-tier (B) lane). Leo + Rollo name
what "confident-pro timmFlat" needs to clear Pascal-5 → 6-7, in
priority order, and call honestly whether the named levers can get
there OR whether the ceiling is architectural. This audit GATES the
implementation task (`tasks/felix-nick-timmflat-ceiling-raisers.md`) —
it sets the lever list.

## Brief

W3 closed CLEAN: timmFlat scored **16/16 ≥ Pascal-5** (off-day-pro)
across full demographic depth. Pascal's honest framing: "Pascal-5 is
pro daily output, NOT master register. The next ceiling (Pascal 6→7,
pro-daily → confident-pro) is a separate axis that wasn't W3's job."

David escalated the quality-bar judgment to Gary. **Gary answered:
"Prove master-tier."** Master-tier IS the Q1 bar. W4's primary job is
to PROVE the engine can reach Pascal 6-7 on timmFlat — or prove it
can't without architectural change, which is an equally valuable
finding. This audit is the first move: name what the push needs before
anyone writes code.

**This is an AUDIT, not a build.** You name the levers and the honest
ceiling read. Felix/Nick build what you prioritize. Pascal scores the
lift.

## Context

- `face-lib/research/pascal-w2-timmflat.md` §Pass 3 — the W3 close
  scores + the ceiling note you're scoring against. Read the per-cell
  reads: which cells are "register-correct but flat" vs. which have a
  visible weakness an editor would flag.
- `face-lib/research/stylepack-timmFlat-spec.md` §3 (Leo's pedagogy
  half, "primitive blockers" + "would-be-nicer") + Rollo's adjacent-
  gaps #3 (villain register). The two named ceiling-raisers:
  - **`highlightCutout` primitive** — Timm's two-tone hair (base +
    one dark cel-shadow over ~30-50% of the hair mass, side facing
    away from the implicit 3/4-front-left light). Leo §3 decision:
    "the one place Timm flat-shape uses a highlightCutout-class
    primitive — but inverted (a SHADOW cutout)." BACKLOG est. Pascal
    ~7→~8. Signature for the Justice League corpus (Batman-cowl-hair,
    Harley-pigtail-shadow).
  - **Per-feature line-weight multiplier** — upper-eyelid 2-3× the
    face contour weight (Leo §1: "the eye is the lid more than the
    pupil"). Hero register reads on uniform lid-weight; villain
    register (Joker / Two-Face) reaches Pascal ≈ 8 only when the lid
    weight cranks past the hero register. BACKLOG est. villain ~7→8.
- `face-lib/BACKLOG.md` — both ceiling-raisers now PROMOTED to W4;
  the features-as-decals integration-debt row (the candidate
  architectural ceiling).
- `face-lib/research/leo-face-integration-audit.md` — the cross-cutting
  features-as-decals debt. timmFlat DODGES it (Timm canon IS decals),
  which is exactly why timmFlat is the right pack to test the ceiling
  on: if even the decals-native pack caps at 5, the cap is NOT
  integration debt and we learn something; if it reaches 6-7, we've
  proven the surface has altitude.

## Concrete deliverable

A short audit in `face-lib/research/leo-rollo-timmflat-ceiling.md`:

1. **The lever list, prioritized.** For each lever: what it is, the
   pedagogy/asset citation, expected Pascal lift (which cells, by how
   much), and whether it's hero-register, villain-register, or both.
   Confirm or revise the two BACKLOG candidates (`highlightCutout`,
   line-weight multiplier); add any lever the W3 per-cell reads reveal
   you missed; cut any that won't move the score. **Cap the list at
   what one W4 implementation pass can land (~2 primitives).**
2. **The honest ceiling call.** Per-lever AND in aggregate: do the
   named levers plausibly reach Pascal 6-7 on timmFlat, yes or no? If
   the answer is "these get us to ~6 but 7 needs the orbital-socket /
   features-as-decals architecture," SAY SO — that is the high-value
   finding Gary needs. A negative-leaning prediction here is not a
   failure; it pre-frames Pascal's evidence pass and de-risks Q2.
3. **The villain-register probe set.** Name the off-grid probes Pascal
   should score for the line-weight lever (the existing `adultFemPointed`
   / `elderMascPear` fixtures + a Joker-direction lid-weight probe).
   Villain register is where the line-weight multiplier earns its
   lift; the 16-cell hero grid won't show it.
4. **Mixture-rule confirmation (asset side, Rollo).** Confirm both
   levers are additive: `default`/`tintin`/`ligneClaire` stay
   byte-identical, ONLY timmFlat opts in. Flag any lever that would
   touch a shared render path (the line-weight multiplier likely does
   — name the guard Pascal/Holly should check).

## Acceptance

- Lever list prioritized + capped at a one-pass implementation scope.
- Honest yes/no/maybe ceiling call, in writing, per lever and aggregate.
- Villain-register probe set named for Pascal's evidence pass.
- Mixture-rule additive-only confirmation + shared-path flag.

## Notes

- Lanes: Leo owns pedagogy (the lid-weight canon, the cel-shadow
  cutout tradition, the hero/villain register split). Rollo owns the
  asset-side lift (does the cel-shadow read as "I'd drop this in my
  game"? is the villain register a real reachable point worth the
  spend?). Co-sign the file.
- Do NOT Haddock: the levers must be GENERAL (per-feature line-weight
  multiplier, a highlightCutout primitive), not "make the Joker cell
  look right." The villain-register probe is a test of the general
  lever, not an optimization target. If "Joker" comes up, you're
  building the general lid-weight multiplier that serves MANY villain
  characters, not iterating toward one render.
- Plain-English: frame the deliverable as "prove the ceiling," not
  "ship master-tier."

## Handoff

(Leo + Rollo fill in on completion. Name the final lever list — Felix
+ Nick scope `tasks/felix-nick-timmflat-ceiling-raisers.md` against it.)
