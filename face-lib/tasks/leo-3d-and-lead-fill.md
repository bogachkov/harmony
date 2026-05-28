# leo-3d-and-lead-fill

## Brief

Three connected questions for one audit pass:

1. **What's the right minimum 3D representation for hair?** Currently hair lives on the 2D ellipsoid surface (cranialField + clumpStroke hug the scalp). The user's architectural note: hair OCCUPIES 3D space around the head — strands fall through air with gravity, form mass with volume, not paint on a surface. NOT every strand modeled — what's the right ABSTRACTION level? Options to evaluate:
   - 3D clump-volumes (each clump = a 3D blob with origin on scalp, falling under gravity, occupying space)
   - Hair-shell wrapping the head in 3D (parameterized surface offset outward from cranium by hair-thickness, with the shell extending downward past the chin)
   - Voxelized density field
   - Something else
   Pick one. Justify. Estimate LOC.

2. **Lead/fill composition.** User described his own technique: draw a small number (~5-15) of REPRESENTATIVE hairs that form the shape + soul of the hairstyle (lead strokes), then fill in tons of follower hairs that go with the flow + add randomness. Is this the right two-layer abstraction for the engine? Does it map to anything in animation hair shaders (ribbon-based hair with fill strands)? If yes, what's the cleanest API — a `leadStrokes: Lead[]` field on the recipe + automatic fill generation? Cite real refs.

3. **Bob-cap regression diagnosis.** `bobChinLength` (and likely shortSwept / shortPompadour / shortReceding) currently render with no main hair mass because the `drawCap` condition was tightened to `spiked || edgeTextured || verticalLift > 0` in commit e8b9b52 (Leo pass 7 implementation). The bob's stroke-based rendering is too sparse to BE the mass for short hair. Three possible fixes:
   - (a) Restore cap fill for smooth-edgeKind short styles (revert that piece).
   - (b) Bump stroke density dramatically for short styles so they're self-massing.
   - (c) Fix it as part of the 3D refactor (clump-volumes would carry their own visual mass).
   Which is right? Likely (c) eventually, but is there an interim that doesn't waste the refactor work?

## Context

- `face-lib/AGENTS.md` — role + collab artifacts + rules. Read carefully, especially mixture-not-survival rule (don't recommend replacing primitives — recommend exposing differences as parameters where possible).
- `face-lib/SPRINT.md` — current sprint, this is the audit that unblocks Lloyd and Nick.
- `face-lib/BACKLOG.md` — see bob regression row under "Known regressions."
- `face-lib/research/hair-tooling.md` — your prior passes 3, 4, 6, 7. The pass 7 cap-cluster audit + implementation is what introduced the bob regression. You can evaluate honestly whether pass 7 was right and the bob regression is acceptable collateral, or whether pass 7 went too far.
- `face-lib/research/hair-theory.md` — hair-theorist's physics pass. Relevant for 3D abstraction.
- `face-lib/research/hairstyles.md` — your hairstyle catalog work.

## Acceptance

- Append `## 11. Pass 8 — 3D abstraction + lead/fill + bob-regression diagnosis` to `face-lib/research/hair-tooling.md`. Hard cap: 200 lines.
- End with a 5-bullet executive summary for the Tech Lead naming:
  - The chosen 3D abstraction (one, justified, ~LOC estimate).
  - Lead/fill yes/no with rationale.
  - Bob regression fix path (interim + long-term).
  - Anything Lloyd needs to know for the architecture pass after this.
  - Anything Nick needs to know about the implementation that follows.
- Update `## Handoff` below.

## Notes

- This is the longest pole of the sprint. Lloyd's task and Nick's implementation both wait on this answer.
- Honest preferred: if you conclude "the existing 2D-surface model can be saved with smaller fixes and 3D is overkill," say so. Don't recommend a refactor you wouldn't justify on your own.

## Handoff

(Leo fills this in on completion.)
