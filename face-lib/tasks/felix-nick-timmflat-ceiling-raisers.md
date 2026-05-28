# felix-nick-timmflat-ceiling-raisers

Q1-W4 Box 2 (the build in the master-tier (B) lane). Implement the
ceiling-raisers the Leo+Rollo audit (`tasks/leo-rollo-timmflat-ceiling-
audit.md`) prioritized, so Pascal can score whether timmFlat reaches
Pascal-6-7. **Scope this task against the audit's final lever list —
the two strong candidates below are the expected outcome, but the audit
sets the list. Do not start until Box 1 lands.**

## Brief

Gary confirmed "prove master-tier" as the Q1 bar. timmFlat ships at
Pascal-5 across 16/16 cells. W4 spends the BACKLOG ceiling-raisers on
the pack we understand best to prove the engine CAN reach confident-pro
(Pascal 6-7) — or prove it can't without architecture (a legitimate
finding). This task lands the primitives; Pascal
(`tasks/pascal-w4-master-tier-rescore.md`) scores the lift.

## Expected lever list (confirm against the Box 1 audit)

1. **`highlightCutout` primitive (NEW, ~20 LOC).** A catch-light /
   cel-shadow cutout region over the hair mass. For Timm, used
   INVERTED: a dark shadow shape covering ~30-50% of the hair (side
   facing away from the implicit 3/4-front-left light) — Batman-cowl /
   Harley-pigtail register. BACKLOG est. Pascal ~7→~8. **Felix owns
   the graphics-math interior** (the cutout-region geometry against the
   hair silhouette / hull — how the shadow shape is derived and clipped
   to the hair mass at fixture-realistic scale). Nick implements the
   render + wires it as an opt-in pack knob.

2. **Per-feature line-weight multiplier (~30 LOC, render-path touch).**
   `style.lineWeight` is currently a single uniform scalar.
   Add a per-feature multiplier so the upper-eyelid line renders 2-3×
   the face-contour weight (Timm canon — Leo §1). BACKLOG est. villain
   register ~7→8. **Felix owns the graphics-math interior** (how the
   multiplier composes into the stroke-weight at render time without
   artifacts). Nick wires the knob + pack-data. **Lloyd reviews IF the
   change touches an architectural seam** (a render-path scalar knob is
   likely Nick+Felix lane, not a cascade change — confirm scope on
   review and pull Lloyd in if it grows past a render-path knob).

## Concrete changes (against the audit's final list)

- **`highlightCutout`:** new primitive in the render path (`src/render/`),
  exposed as an opt-in recipe/pack knob (default off → existing hair
  fill unchanged). Add to `timmFlat.declares` so the manifest carries
  it through the cascade (per the Q1 manifest landed W3). Nick wires
  the pack-data so ONLY timmFlat opts in.
- **Line-weight multiplier:** new per-feature multiplier field
  (default 1.0 → uniform weight, existing behavior). Pack sets the
  upper-lid multiplier to ~2-3× for timmFlat. Add to `timmFlat.declares`
  if it's a declared pedagogy path.
- **Render the proof images:** the 16-cell grid + the villain-register
  probes the Box 1 audit named (`adultFemPointed` / `elderMascPear` /
  the Joker-direction lid-weight probe). Share via Bob for Pascal's
  evidence pass.

## Acceptance

- The audit's prioritized levers land as **additive opt-in knobs**,
  defaulting to current behavior.
- **Mixture rule (hard gate):** `default`, `tintin`, `ligneClaire`
  byte-identical pre vs post on the full broad regression sweep (the
  816-cell sweep that W3's Q1 manifest used, or the equivalent). ONLY
  timmFlat cells drift, by design. The line-weight multiplier touches
  a shared render path — prove the non-opted packs don't move.
- timmFlat 16-cell grid + villain-register probes re-rendered, shared
  for Pascal.
- Felix's graphics-math interior is honestly sized (per the AGENTS.md
  post-alpha-shape rule: name the fixture-realistic scale the
  highlightCutout geometry actually sees; if the cutout-region
  derivation is more LOC than estimated, that's Felix's sizing call,
  surfaced at design time — not discovered at +340 LOC).

## Notes

- Lanes: **Felix** = graphics-math interior (highlightCutout cutout-
  region geometry; line-weight composition at render) + reviews Nick's
  graphics-math. **Nick** = broad implementer (render code, the opt-in
  knob plumbing, pack-data wiring, `timmFlat.declares` additions).
  **Lloyd** = architectural review IF a seam is touched. **Leo** =
  confirms pedagogy on the rendered probe (does the cel-shadow / heavy
  lid match the Timm canon the audit cited?).
- If Nick hits an input-scale or algorithm-class question on the
  highlightCutout geometry he didn't expect, escalate to Felix rather
  than inventing past it (the alpha-shape antipattern).
- This is depth-on-a-known-quantity — the lowest-variance build
  available. Don't expand scope past the audit's lever list.
- Plain-English: we're proving the ceiling, not shipping a guaranteed
  Pascal-7.

## Handoff

(Felix + Nick fill in on completion: what landed, the mixture-rule
regression result, the render paths for Pascal's evidence pass, and
Felix's honest graphics-math sizing note.)
