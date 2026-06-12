# Truth: current SDF substrate vs. crew claims

Verified against `face-lib/src/sdf/head.ts` (HEAD: 361c715) and the six
renders at `/tmp/sdf-head/*.png`.

## Per-claim verdicts

**Claim: "Cranium is an ellipsoid with the Loomis side cuts." — True.**
`head.ts:386` calls `ellipsoid(p, P.craniumCenter, P.craniumRadii)`,
with `craniumRadii: [0.50, 0.525, 0.60]` (three distinct semi-axes,
head.ts:241). Side cuts are two `plane()` calls intersected via `max`
(head.ts:388–390). Code matches the claim.

**Claim: "Side cuts produce subtle temple flats." — False.**
`sideOffset = 0.42` against half-width `0.50` (head.ts:243, 241) —
the cut is at 84% of half-width (comment claims ~7/8 = 87.5%, close).
But in `profile-left.png` / `profile-right.png` the flat plane reads
as a **huge disc dominating the side silhouette** — not a temple
flat. Loomis's flat is bounded to the temple region; ours is an
infinite plane (head.ts:388–389) that slices the whole hemisphere.
Ratio defensible, primitive wrong.

**Claim: "Chin reads as a chin pad now, not stepped or elf-pointy." — Partial.**
Not elf-pointy (mentalWidth 0.42 is ~64% of bigonial — wide pad,
head.ts:267). But in `front.png` and `profile-left.png` the jaw reads
as a clearly **boxy trapezoidal block** with visible flat front face,
flat bottom, and crisp horizontal seam where it meets the cranium.
It's a pad, but it's a stuck-on box pad — not a continuous mandibular
volume. The chamfer (`gonialAngle: 0.07`) and `kChin: 0.10` smin are
not large enough to dissolve the wedge's flat faces.

**Claim: "Nose is integrated anatomy, not a separate blob." — Partial.**
In `three-quarter-left.png` and `three-quarter-right.png` the bridge,
tip, and alae read as one continuous nose growing out of the brow —
the `kNose: 0.045` smin (head.ts:578) does its job at the root. But
in `profile-left.png` and `profile-right.png` the alar sphere is
visible as a **small discrete bump** behind the tip — it reads as a
separate ball, not as a nostril wing folded into the tip. The nose
volume is small (tipProjection 0.16, alarWidth 0.20) against the
giant flat side cut, which makes the stuck-on quality worse.

**Claim: "Eye reads as a sphere in a socket, not a 2D circle on a forehead." — True.**
`front.png` clearly shows two recessed cavities with curved eyeball
surfaces inside and lid hoods crossing the top. Construction in
head.ts:419–436 (socket smoothSubtract) and head.ts:618–621 (eyeball
hard min) matches what's visible. This piece landed.

**Claim: "All six camera angles produce a coherent same head." — Partial.**
Front, three-quarters, and profiles are mutually consistent — same
features in expected positions. But `back.png` shows a **smooth
featureless egg with no visible occipital bulge, no temple-cut
silhouette, and no jaw/cranium seam** — it looks like a different,
simpler object than the side views imply. The occipital sphere
(radius 0.18 at z = −0.55, head.ts:248–249) is fully subsumed into
the ellipsoid; you can't see it. The flat side cuts visible in
profile views don't show up in the back silhouette either. Coherent
in features-from-the-front sense; not coherent as "same volume from
all sides."

## Honest read

The substrate is one credible camera angle away from looking like a
head. Front and three-quarters are recognizably a face — eyes, nose,
brow line, jaw silhouette all in roughly the right places. Profile
and back tell a different story: a flat-sided egg with a box stuck
under it and a thumbprint nose. The crew's "landed cleanly" framing
is true for the eyes, half-true for the cranium and nose, and not
true for the chin or the side cuts or the back of the head. What's
actually been built is a head-from-the-front mannequin; the back and
sides give away that no one looked at those renders before reporting.
