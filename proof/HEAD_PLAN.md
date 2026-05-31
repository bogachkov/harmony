# Head Plan — plain English

How all the research fits into one head we can build, pose, and rotate.
Think of it as a stack of layers, each one adding what the one below can't do.

---

## The mental picture first

We are building a wooden artist's mannequin head, in code, that:
- hangs off the skeleton we already have (cranium on neck, jaw a hinge),
- is made of simple 3D masses (a ball + a wedge),
- knows where eyes/nose/mouth *go* (proportions),
- has real flat faces so it reads as a head, not a balloon (planes),
- has wrap-lines that prove it's turning (cross-contours),
- and finally gets inked so the lines look hand-drawn.

Each layer below is one of those jobs. We build bottom to top and look at
pixels after every layer.

---

## Layer 1 — The masses (Huston: "ball and wedge")

The skull is a **ball**. The face+jaw is a **wedge** pushed onto the front-bottom
of that ball. That's the whole head as two shapes. This is what we already have
roughly; we keep it but make the shapes exact math (a true sphere, a true
tapered wedge), not sprayed dots.

*Why this and not just Loomis's stacked lines:* two clean solids are trivial to
rig and rotate, and easy to compute outlines for.

## Layer 2 — The build recipe (Hampton's 6 steps)

A fixed order to assemble the head so it's always correct:
1. start with the ball,
2. tilt it (the head's axis — which way it leans),
3. attach the jaw wedge,
4. set the camera (any angle),
5. cut the flat sides (temples),
6. add the surface planes (Layer 4).

*Why:* this is just a dependable sequence so we never place a feature before the
thing it sits on exists.

## Layer 3 — The measuring marks (Loomis proportions)

The numbers that say where everything lives, locked so they hold at any angle:
- eye line = **halfway** down the whole head,
- face splits into **equal thirds**: hairline→brow, brow→nose, nose→chin,
- the flat side-cut oval ≈ **2/3** the height of the ball,
- hairline halfway between brow and top of skull,
- face is about **five eyes** wide.

*Why:* this is the difference between a head and a random blob. These marks are
where features will attach later.

## Layer 4 — The flat faces (Asaro "planes of the head")

The big missing piece. A real head isn't smooth — it has flat planes that catch
light: forehead, temples, the **cheekbone edge** where the front of the face
turns to the side, the three planes of the nose, the chin and jaw under-planes.
We add these as a low-detail set of flat facets on the masses.

*Why:* this is what makes a rotating head look like a head with structure
instead of a bald egg. It's the single biggest quality jump.

## Layer 5 — The wrap-lines (Vilppu cross-contours)

Lines that wrap around the form like latitude/longitude on a globe: the
center line down the face, the brow line across, plus lighter wraps at nose and
mouth. They ride the surface, so when the head turns they curve correctly.

*Why:* these are what your eye reads as "this is 3D and it's facing that way."
They're also a free check that the planes are consistent.

## Layer 6 — Where the edges sit (Reilly rhythms)

Reilly's flowing curves tell us *where* the plane breaks in Layer 4 should fall,
anchored to real landmarks (top of ear, cheekbone, mouth corner, chin corner) so
the facets follow the face instead of being placed arbitrarily.

*Why:* it makes Layer 4 look intentional and human, not like a random cut-up.

## Layer 7 — Clean outline (the merge research)

To draw the head we need ONE clean outline around the overlapping ball + wedge.
We compute each shape's outline from math (a ball's outline is always a circle;
the wedge's is two side "rails"), then merge those outlines with a small 2D
union library. No pixel grid, so no stair-step fray. This replaces the depth
buffer for the head.

*Why:* crisp vector lines at any zoom, and the fray problem goes away at the
core, leaving "how rough should it look" purely to the style layer.

## Layer 8 — Hand-inked look (the line research)

Feed those clean outlines through `perfect-freehand` for tapered, pressure-like
strokes, make lines heavier in shadow/where forms overlap, and add a gentle
**smooth** wobble seeded by a number so it looks hand-drawn but is identical
every time. This is the only place randomness lives, and it's deterministic.

*Why:* this is the "looks like a person drew it" you asked for, kept as a style
layer so different styles can ink the same head differently.

---

## How they stack (one sentence)

Ball + wedge (1), assembled in order (2), measured by Loomis (3), given flat
faces (4) whose edges follow Reilly (6) and are proven by cross-contours (5),
outlined cleanly by math-union (7), and inked to look hand-drawn (8).

## Build order I'd actually code, with a look after each

1. Exact cranium+jaw, clean merged outline (Layers 1, 7) — look.
2. Loomis proportion marks placed on it (Layer 3) — look.
3. Asaro planes + cross-contours (Layers 4, 5, 6) — look.
4. Hand-line style pass (Layer 8) — look.

Features (actual eyes, nose, mouth) come AFTER this foundation reads as a head
from several angles. Not before.
