# Digit's read — current SDF head substrate

Looked at all six renders at `/tmp/sdf-head/`. Standing in for Gary's eye.

## Profile (left and right)

Broken. The "temple flat" Gary already flagged isn't a flat — it's a giant
perfect circular disc stamped into the side of the skull like a coin pressed
into clay. It dominates the silhouette. A real temple is a subtle planar
softening you barely see; this is a hubcap. Worse: both profiles also show
the jaw/neck as a hard hexagonal prism with visible flat facets. From the
side the head reads as "sphere + disc + hex bucket," not a head. The nose
floats off the front like a stuck-on lump because the face plane behind it
hasn't been carved — there's no brow ridge, no cheekbone, no zygomatic
sweep, no jaw line. Just sphere.

## Front

Better than profile, worse than it looks at first glance. The face features
read — brow, eyes, nose, mouth groove — but they sit on the sphere like
stickers. There's a vertical seam down the centerline (nose ridge extended
into the forehead) that screams "two halves mirrored." The jaw is the
hexagonal bucket again, which from the front looks like the head is wearing
a small wooden crate. No transition between cranium and jaw — they meet at
a hard horizontal line. It's procedural shapes assembled, not a face
emerging.

## Three-quarter (left and right)

This is the angle that exposes the lie. The temple disc is still there,
now seen edge-on so you can see it's a literal circular insert with a hard
rim. The nose juts in isolation because nothing else on the face has any
relief. The jaw bucket reads as a separate object resting under a ball.
No zygomatic, no mandible, no continuity from cheek to jaw. Honest answer:
the anatomy does not integrate. It's three primitives in a stack.

## Back

A sphere. Just a sphere with the bucket-neck poking out the bottom. No
occipital shape, no indication this is the back of the same head whose
front has features. If you showed Gary the back render alone he'd ask
what it was a render of.

## Cross-view consistency

It's not one head. It's a sphere that has had a face pressed into the
front, a disc stamped into each side, and a hex prism stuck on the
bottom. Each view reveals a different primitive. Loomis would not
recognize this as a head construction — there's no ball-and-jaw
relationship, no cranial mass that flows into the face, no plane
breaks that correspond to real anatomy.

## Verdict

This is not progress toward a proper face. It's the same pattern Digit
exists to catch: SDF machinery producing geometry that *can* be rendered
from six angles, framed as a "3D substrate," while the actual form is
worse than Gary's 60-second sketch would be. The temple disc isn't a
near-miss to be tweaked — it's evidence the system is placing primitives
without an underlying head model. Gary will look at the profile, see the
hubcap, and be done. Call it what it is: a prototype that proved the
pipeline renders, not a head. Don't ship this as "the substrate works."
