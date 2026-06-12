# Hair tooling — stroke library survey + pedagogy of comic hair

*Leo's pass 3 on hair. Pass 1 (`hair.md`) named the parts. Pass 2 (`hair-pass-2.md`)
named the schools and licensed-import sources. This pass answers the next two
questions Fred has to answer before touching `buildHair`:*

1. *What stroke renderer turns a polyline of UV-traced points into a line that
   looks drawn, not computed?*
2. *What is the symbolic decision tree a human follows when drawing hair, per
   school — and what is the MINIMUM primitive vocabulary that, composed,
   produces publishable comic hair?*

The user's verdict on the current wedge-polygon hair: "truly horrid. like a
-1/10." Fred has been hand-tuning a fill region and one outline; the cranial
field exists in `src/model/hair-field.ts` but nothing samples it. This is the
exact failure mode `AGENTS.md` calls out: vocabulary present, geometry
fabricated.

---

## 1. Executive summary (what Fred should DO)

- **Adopt `perfect-freehand` (MIT, ~5 KB, zero deps).** It is the only
  open-source TS/JS library in the survey that emits SVG path data, supports
  taper at start/end, accepts a polyline + per-point pressure as input, and
  has license compatibility with MPL-2.0 face-lib. Its output is a closed
  **outline polygon** (rendered as a fill, not stroked), which slots into our
  pass-1 fills cleanly.
- **DO NOT adopt Rough.js.** MIT and excellent, but its line model is *bowed +
  double-stroke uniform width* — the "marker on whiteboard" aesthetic. That is
  not inked comic hair. We don't want sketch fuzz; we want clean variable-width
  ink with a tapered tip.
- **The bigger win is upstream of the library.** Eighty percent of how hair
  reads as drawn is the *placement* of strokes (clustering, parting overlap,
  silhouette breaks) — not the stroke renderer. Fred should not buy a library
  expecting it to fix dead hair; he should write the clustering pass on top of
  the existing `clumpStroke()` field tracer and *then* pipe each clump through
  perfect-freehand for the visible stroke rendering.
- **Three primitives carry the load**: `massSilhouette`, `clumpStroke`,
  `highlightCutout`. Everything else (interior separators, parting curve,
  fringe array, sideburns, nape) is a placement strategy over those three.
  Aim for ≤ ~250 LOC of new code on top of `hair-field.ts`.
- **Hard pedagogical prohibitions** (Leo's stop-the-line, see §6): no flat
  fill polygons as the only hair primitive; no per-strand drawing; no
  hairline as the load-bearing characterization line. Each of those is the
  current bug.

---

## 2. Library evaluation

License files / repo metadata verified live during this research pass.

| Library | License | Stroke quality | Input shape | Integration cost | Killer caveat | Verdict |
|---|---|---|---|---|---|---|
| **`perfect-freehand`** v1.2.3 ([github](https://github.com/steveruizok/perfect-freehand), [npm](https://www.npmjs.com/package/perfect-freehand)) | **MIT** | Variable width, pressure-driven, configurable start/end taper, anti-jitter via `streamline`/`smoothing`. Looks **inked**, not sketched. Used in tldraw, Excalidraw, Canva, draw.io. | `[x, y, pressure]` polyline → closed polygon as `Array<[x,y]>`; `getSvgPathFromStroke()` emits SVG path `d` data. **Zero runtime deps**, no Canvas required. | Low. Drop-in for the existing pass-1 (fills) of the renderer; each clump becomes a tiny black fill region. | Output is a **closed polygon rendered as FILL**, not a stroked path. So our two-pass painter must learn a "stroke-as-fill" curve kind. ~30 lines in `svg.ts`. | **ADOPT** |
| **Rough.js** v4.x ([github](https://github.com/rough-stuff/rough)) | **MIT** | Uniform-width line with controllable `roughness` (endpoint jitter), `bowing` (midpoint curve), and `disableMultiStroke` (one or two passes). No taper. No pressure. ([algorithm writeup](https://shihn.ca/posts/2020/roughjs-algorithms/)) | High-level primitives (`line`, `polygon`, `path(...)`) returning SVG `<g>` nodes via `rough.svg()`. Not a polyline-in-path-out function — wraps the whole shape. | Medium. Have to emit a fake `<g>` and parse it back, or fork the bowed-line subroutine. | **Wrong aesthetic.** The Rough look is "marker on whiteboard / wireframe sketch." Comic hair is *inked*, not sketched. Adopting Rough.js would lock the engine into Excalidraw-style output. | **REJECT** |
| **squiggy** ([github](https://github.com/LingDong-/squiggy)) | **NONE — no LICENSE file** | Good — tube/stamp/custom brushes, polyline-in-polygon-out, supports pressure and velocity, ~17 KB. Closest match technically. | Polyline → polygon array. SVG-ready. Zero deps. | Low. | No license = **legally unusable** in MPL-2.0 face-lib. Without a grant, all rights reserved by default. (LingDong's other repos use MIT or are unlicensed; can't assume.) | **REJECT** unless we get an MIT grant from the author. |
| `svg.brushstroke.js`, `lmgonzalves/brushstroke`, `atrament` | mixed MIT | Canvas-first painter UIs. Built for live drawing in a browser, not server-side SVG synthesis. | Canvas runtime required. | High. | We render headless to SVG strings; pulling in DOM/Canvas runtime is a non-starter. | REJECT |
| D3 + simplex noise DIY | n/a (we'd write it) | What we already have in `wobble()` in `svg.ts` — perpendicular sine-modulated polyline. Same uniform line weight. | n/a | Already done. | **Same dead-line problem as today.** No taper, no pressure, no clump variation. Doing more of this on more places doesn't fix the underlying defect. | n/a |
| **The "do nothing new" option** | — | — | — | — | Current state: 2/10 per user. Confirmed dead. | REJECT (the user has already called it.) |

**`perfect-freehand` is the only candidate that survives.** It's also the
right one on its merits — Steve Ruiz built it specifically because no other JS
library produced ink-pen-quality variable-width strokes from a polyline. The
mathematics is published in the repo; even if we later decide to inline a
copy, MIT licensing makes that legal.

### License sanity check for MPL-2.0

MPL-2.0 (face-lib) is **file-scoped weak copyleft** — combining with MIT,
BSD, Apache-2.0 code is fine; the only obligation is to preserve the MPL
notice on MPL files and the MIT notice on bundled MIT files. Adding
`perfect-freehand` as a dependency does **not** require relicensing
face-lib. Reference: [MPL-2.0 §3.3](https://www.mozilla.org/en-US/MPL/2.0/),
[MPL FAQ Q9](https://www.mozilla.org/en-US/MPL/2.0/FAQ/).

---

## 3. Pedagogy — the symbolic tree for hair

Per `AGENTS.md`'s "symbolic compression vs motor execution" rule: encode the
*decision tree*, not the motor sequence of moving the pen. Each tree node is
a question; the *answer* selects which primitives to invoke and how to
parameterize them.

### The universal sub-tree (every school, every texture)

```
hair
├── mass         — outer silhouette (closed shape)
├── boundaries   — front (hairline), side (sideburn), nape (back-of-neck)
├── topology     — crown (radial origin) + parting (split line, optional)
└── interior     — flow / highlights / shadow, school-dependent
```

This decomposition is invariant. What changes per school is **which interior
sub-primitives are switched on, and how the mass silhouette is shaped**.

### Per-style symbolic tree

For each major school, an *ordered* checklist of decisions a human draws in.
Order matters: a step's output feeds the next step.

**Hergé / ligne claire** (target style for face-lib's bar):

1. Pick the **mass envelope** — single closed shape, slight lift above the
   cranium ellipsoid. Almost no negative-space cutouts.
2. Decide the **forehead exposure** — high (Tintin's quiff), medium, or
   forehead-covered.
3. Draw **one parting curve** from a high crown point, sweeping forward to
   the hairline. ONE line, not many.
4. Optional **single flick of asymmetry** at the silhouette edge (Tintin's
   forelock spiral). One curve, deliberate, near a temple — *never* on the
   crown line.
5. Done. Uniform line weight. No interior detail beyond the parting +
   silhouette break. No fill shading. *(Sources: Sterckx, Tintin and the World
   of Hergé, Methuen 1988; Peeters, Hergé Son of Tintin, JHU 2012.)*

**Caniff / Toth / classic ink comics**:

1. Mass envelope.
2. Crown + parting (parting may be implicit).
3. **2–4 cutout shapes inside the silhouette** — closed white/skin-color
   polygons that read as highlights, placed where the cranial field would
   spike (forehead corner, temple). Each cutout is a *shape*, not a stroke.
4. Optional **hatching set** following the cranial field direction in the
   shadow side of the mass — 4–12 parallel strokes, all curving along the
   same field arc. *(Source: Eisner, Comics and Sequential Art, 1985,
   "Modelling"; Art of Alex Toth, IDW 2014.)*

**Whitlatch / Robertson (animation-feature character design)**:

Same as Caniff but cutouts are *softer* (rounded), and hatching is replaced
by 2–3 long **interior separator curves** that follow the field — not a
hatch field, single deliberate curves.

**Manga (Tezuka, Hayashi shoujo / Toriyama shounen)**:

1. **Bigger envelope** — silhouette 1.3× to 2× the cranium volume; the
   envelope itself communicates the hair style. Silhouette is the load-
   bearing primitive in manga, more than in Western traditions.
2. Spike vs sweep: silhouette edge is either **smooth-sweeping arcs**
   (shoujo: long curves with cat-eye fringe wedges) or **jagged with
   triangular teeth** (shounen: silhouette IS the spikes).
3. **Fringe wedges** — 3–7 wedge clumps falling from the parting onto the
   forehead, each with a *sharp* tip. Each wedge is a sub-mass, not a
   stroke.
4. **One large highlight band** (shoujo: single lens / crescent / wedge,
   often near the top of the dome) OR **multiple small highlights** at
   clump joins (shounen). *(Sources: Hayashi, How to Draw Manga: Bishoujo,
   Graphic-Sha 2000; Crilley, Mastering Manga vol.1, IMPACT 2012;
   Toriyama interviews in Daizenshuu.)*

**Black-illustrated coily tradition** (Nelson, Collier, Harrison, Robinson,
Lopez, Liu-Trujillo, the canon in `hair-pass-2.md`§1):

1. **Halo silhouette** — closed shape *larger* than the cranium, radius
   driven by the coil-volume parameter. Volume grows outward, not downward.
2. **Edge texture** — small repeated arc bumps on the silhouette boundary
   ("texture on the edge"), NOT individual strands in the interior.
3. Interior: flat-fill or one low-key shadow cutout. Strands inside the mass
   read as straight-hair imposition; the canon avoids them.
4. Sub-styles **don't fall** from this base — cornrows are *channels* on the
   scalp (parallel geodesics), locs are a *rope bundle*, bantu knots are a
   *disc array*, braids are a *chain*. Each of these is its own primitive
   tree, NOT a parameterization of the halo. (This is the single most
   commonly-missed distinction in procedural-hair systems.)

**Disney 2D / Bruce Timm flat-shape stylization** (DCAU, Adventure Time
side characters):

1. Mass envelope, possibly geometrically simplified to a semicircle / pill /
   blob.
2. **0–2 dark shadow cutouts** inside the silhouette (Timm: a single S-curve
   dividing the mass into "facing-camera" and "facing-away" tonal halves;
   Disney 2D: similar). The cutout is a SHAPE with its own closed boundary,
   not a stroke.
3. **No interior strands at all.** A clump-stroke pass at this style level
   reads as "amateurish busy-work."

### The pattern across all schools

In all of these styles, **strokes are never strands**. A stroke is either
(a) a silhouette outline, (b) a parting curve, (c) a flow line indicating
mass direction across a group of strands, or (d) hatching that follows the
cranial field. *Drawing individual hairs is, in every school, the mark of
the amateur* (Loomis 1956 explicitly warns of this; Vilppu / Hampton
repeat the warning a half-century later).

This is the single biggest implication for face-lib: the goal is **not** to
sample more strokes from the cranial field. It is to sample *the right
small number* of strokes — and render each one well.

---

## 4. Recommended primitive vocabulary — minimum viable

To render publishable hair across the schools above, the engine needs **six
primitive kinds**. Five geometric, one stylistic.

```
1. massSilhouette(closedPath3D, fill, strokeStyle)
     The outer envelope. Per-school edge shape:
       smooth | spiked | edge-textured (coily) | geometric (Timm).

2. partingCurve(start3D, end3D, sweep)
     The single split line. One per head. Optional (none on Caesar cuts,
     Hanna-Barbera blobs, undercuts).

3. clumpStroke(rootUV, length, field, taperProfile, jitter)
     Already exists in hair-field.ts; we just connect it to the renderer.
     Used for: interior separators (Realistic/Whitlatch), fringe sweeps
     (Hergé Tintin-quiff: ONE of these), hatching field (Caniff: a
     parallel array of these), and falling side-curtains.

4. highlightCutout(closedPath3D, fillColor)
     A closed shape painted in skin-color or white over the mass to read
     as a specular highlight. Manga's lens, Timm's S-curve cutout, Disney's
     soft cutout. NOT a stroke.

5. spikeStrip(silhouette, teeth[], depth, jitter)
     Specifically for shounen-spiky / mohawk: replaces the smooth dome
     edge of massSilhouette with triangle-tooth geometry. This is a
     silhouette MODIFIER, not a separate primitive — but worth listing
     because it is the load-bearing visual choice of an entire school.

6. edgeTexture(silhouette, scale, amplitude)
     Replaces the smooth dome edge with small repeating arc bumps. The
     coily-canon edge primitive. Same architecturally as spikeStrip.
```

Every named hair style is a composition of these six. Cornrows, braids,
locs, bantu knots — pass-2 listed them as separate primitives. They're
not, properly. They're **arrays of `clumpStroke` along a different field**
(cornrow = geodesic on scalp, braid = sinusoidal modulation, loc = thick
clumpStroke with rope taper, bantu knot = disc-shaped clumpStroke array).
Don't ship them as separate kinds; ship them as field+stroke recipes.

### The minimum hair that reads publishable (Tintin-bar test)

For a *single* hairstyle, render-publishable per the user's bar
("supporting side character in a Tintin comic"), the engine needs:

- One `massSilhouette` curve, with `wobble` jitter on the outer edge.
- One `partingCurve`.
- Zero or one *characterization stroke* — Tintin's forelock flick, a
  Caniff-style hatching set, a manga highlight wedge.

**Three closed-form geometric outputs, each rendered through
perfect-freehand for stroke quality.** That's it. That is what currently
hand-built `buildHair` is trying to be — and is failing because (a) the
mass silhouette is a wedge, not an envelope; (b) there is no parting; (c)
there is no characterization stroke; (d) every line is uniform width.

---

## 5. Implementation sketch

The chosen architecture: keep our existing scaffold + cranial field;
generate polylines in 3D world space; project to 2D in `project.ts`;
pipe each projected polyline through `perfect-freehand` in `svg.ts`'s
fill pass.

### Pieces to add

```
src/model/hair-field.ts            (exists; unchanged for now)
src/model/hair.ts                  NEW — replaces buildHair() in scaffold.ts.
                                   Produces: silhouette, parting, clumps[].
src/render/strokes.ts              NEW — wrapper around perfect-freehand's
                                   getStroke() + getSvgPathFromStroke().
                                   Builds per-point pressure from a taper
                                   profile + the wobble jitter we already use.
src/render/svg.ts                  CHANGE — add a 'stroke-as-fill' curve kind:
                                   when seen in pass 1 (fills), invoke the
                                   stroke-renderer to produce a closed-polygon
                                   path data; pass 2 skips it (no double-paint).
```

### What `buildHair` becomes (sketch)

```ts
import { getStroke, getStrokePoints } from 'perfect-freehand';
import { cranialField, clumpStroke, xyzToUV } from './hair-field.ts';

const buildHair = (...): Curve[] => {
  const field = cranialField(rx, ry, rz, {
    crown:   { u: 0.05, v: 0.88 * Math.PI / 2 },
    parting: { u: -0.10, strength: 0.6 },
    gravity: 0.6,
  });

  const curves: Curve[] = [];

  // (1) Mass silhouette: closed envelope around the cranium projection,
  //     wobble-jittered already. Rendered with our existing fill pass.
  curves.push(massSilhouette3D(field, presence, volume));

  // (2) Parting: one trace through the field from the crown forward,
  //     stopped at the hairline. THIS one is rendered as a "stroke-as-fill"
  //     (perfect-freehand) so it has a tapered start at the crown and tapered
  //     end at the hairline. Pressure profile: low-high-low.
  const parting3D = clumpStroke(field, crown, 0.85, 18, 0.020, stopAtHairline);
  curves.push({
      kind: 'feature-ink', closed: false, points: parting3D,
      ink: { size: lineWeight * 1.0, taperStart: 0.6, taperEnd: 0.9 } });

  // (3) Characterization stroke set: school-specific.
  //     Tintin/ligne-claire: 1 forelock flick.
  //     Caniff: 4-8 hatching strokes parallel along a field arc.
  //     Manga: 3-5 fringe wedges.
  //     Coily: edge-texture replaces silhouette outline only; no interior.
  for (const seed of characterizationSeeds(style, field)) {
    const pts = clumpStroke(field, seed, len, samples, offset, stopAtHairline);
    curves.push({ kind: 'feature-ink', closed: false, points: pts,
                  ink: inkProfileFor(style) });
  }

  // (4) Optional: highlight cutout (manga/Timm). Closed shape, skin-color fill,
  //     no stroke. Rendered through pass 1 only.
  if (hasHighlight(style)) curves.push(highlightCutout(...));

  return curves;
};
```

### What `svg.ts` changes look like

```ts
// In the prep loop, when c.kind === 'feature-ink':
if (item.c.kind === 'feature-ink') {
  // Build [x, y, pressure] from the polyline + ink profile.
  const inked = pxPath2D.map((p, i) => [p[0], p[1], pressureAt(i, len, ink)]);
  const outline = getStroke(inked, {
    size: ink.size, thinning: 0.5, smoothing: 0.5, streamline: 0.5,
    start: { taper: ink.taperStart * lengthPx, easing: t => t * t },
    end:   { taper: ink.taperEnd   * lengthPx, easing: t => t * t },
  });
  // outline is a closed polygon — emit as FILL in pass 1, skip in pass 2.
  paths.push(`<path d="${getSvgPathFromStroke(outline)}" fill="${color}"/>`);
  continue;
}
```

That's the whole integration. ~30 lines in `svg.ts`, ~150 lines for the
new `hair.ts`, with the field already done.

### One caveat: deterministic randomness

`perfect-freehand` is **deterministic for fixed inputs** — it doesn't roll
RNG internally. Good: identical params = identical SVG (face-lib's
determinism contract holds). Our wobble + jitter pre-processing is the
only source of randomness, seeded by `style.jitterSeed` as today.

### One more caveat: scale

`perfect-freehand`'s `size` parameter is in pixels at the rendered scale,
not in 3D world units. We must compute it from `p.style.lineWeight` and
the projection scale — easy, done in the same place as `sw` today
(`svg.ts:108`).

---

## 6. STOP-the-line flags — Leo's stop authority

These are the hair-rendering anti-patterns that Pascal will keep scoring
≤4/10 and the user will keep calling "horrid". If Fred is about to do any
of these, **stop** — go back to research, not iteration.

1. **No flat-fill wedge as the only mass primitive.** A single closed
   polygon with one fill and one uniform outline is the *current* hair, and
   it is what got us the -1/10 verdict. The mass primitive must compose with
   at least ONE of: parting curve, characterization stroke, highlight
   cutout. Pure-silhouette is acceptable only for Hanna-Barbera-style
   intentional flatness (and even that needs the silhouette edge wobbled).

2. **No per-strand strokes.** No matter how nice perfect-freehand makes
   each line, drawing 30 of them looks like spaghetti. Every classical
   pedagogy text (Loomis 1956, Vilppu, Hampton, Faigin) flags this as the
   amateur trap. The engine should NEVER render more than ~10 interior
   strokes for any hair style; manga "spiky" looks are achieved by the
   *silhouette shape* (spike teeth on the envelope), NOT by drawing many
   spikes inside the mass.

3. **No hairline as the load-bearing characterization line.** Pass 1
   identified hairline shape (straight / widow's peak / M / receding) as a
   key knob. It is. But Pascal's current scoring shows that *making the
   hairline more elaborate doesn't fix the hair*. The hair-mass-above is
   what reads as drawn; the hairline is a *boundary*, not the subject. If
   Fred catches himself adding more hairline topology knobs to "fix" hair,
   that's the wrong primitive being tuned.

4. **No "make it more realistic" interior detail under a ligne-claire art
   pack.** Tintin's hair has near-zero interior detail. Adding flow strokes
   "to make it look more drawn" actively breaks the ligne-claire silhouette
   discipline. Detail level is a per-art-pack switch (see pass-2 §6),
   gated, not a slider.

5. **No tuning of magic numbers in `buildHair` past round 1.** AGENTS.md's
   explicit Fred failure mode: vibe-coding magic numbers until output is
   "ok." If the silhouette envelope or parting placement isn't reading as
   drawn, the right move is to question the *primitive set* (call Leo),
   NOT to nudge constants. This is the most common path to oscillation.

6. **No adopting Rough.js.** Mentioned again because the temptation is real
   — Rough is famous, easy to drop in, and would make the lines visibly
   "more drawn" overnight. The aesthetic is wrong for printed comic ink.
   Excalidraw wireframes do not look like Tintin pages.

7. **No drawing coily hair as "more wave" on the straight-hair primitive.**
   Pass-2 §1 calls this out: coily volume expands *outward* radially, not
   downward as gravity-falling waves. They are different geometric
   primitives. If face-lib's coily-pack is just a higher-frequency sine on
   `wobble()`, that is the wrong primitive — call Leo, not iterate.

8. **No importing CC-BY-4.0 SVG designs without the NOTICE/attribution.**
   Pass-2 verified the DiceBear styles' licenses; some are CC0 (importable)
   and some are CC-BY-4.0 (needs attribution NOTICE). Mixing CC-BY designs
   into face-lib without the NOTICE is a license-clarity bug and a
   downstream-redistribution headache.

---

## 7. Sources cited in this document

Pedagogy:
- Loomis, *Drawing the Head and Hands*, Viking, 1956 — §I "The Block-In",
  "Modeling and Texture of Hair".
- Vilppu, *Drawing Manual*, 1997.
- Hampton, *Figure Drawing: Design and Invention*, 2009.
- Faigin, *The Artist's Complete Guide to Drawing the Head*, Watson-Guptill,
  2012.
- Eisner, *Comics and Sequential Art*, Poorhouse Press, 1985 — "Modelling".
- *Art of Alex Toth*, IDW, 2014.
- Sterckx, *Tintin and the World of Hergé*, Methuen, 1988.
- Peeters, *Hergé, Son of Tintin*, Johns Hopkins UP, 2012.
- Hayashi, *How to Draw Manga: Bishoujo*, Graphic-Sha, 2000.
- Crilley, *Mastering Manga* vol.1, IMPACT, 2012.
- Stanchfield, *Drawn to Life*, Focal Press, 2009.
- Black-illustrated coily canon: Kadir Nelson (*We Are the Ship*, 2008;
  *Heart and Soul*, 2011); Bryan Collier (*Uptown*, 2000); Vashti Harrison
  (*Little Leaders*, 2017); Christian Robinson; Sergio Lopez; Robert
  Liu-Trujillo.
- Choe & Ko, "A Statistical Wisp Model and Pseudophysical Approach for
  Interactive Hairstyle Generation", IEEE TVCG 2005 (math for
  `cranialField`).

Libraries / licenses (verified live):
- `perfect-freehand`: https://github.com/steveruizok/perfect-freehand
  (MIT, package.json verified, zero runtime deps).
- Rough.js: https://github.com/rough-stuff/rough (MIT).
- Rough.js algorithm writeup:
  https://shihn.ca/posts/2020/roughjs-algorithms/
- squiggy: https://github.com/LingDong-/squiggy (no LICENSE; **unusable**).
- MPL-2.0 §3.3 + FAQ: https://www.mozilla.org/en-US/MPL/2.0/,
  https://www.mozilla.org/en-US/MPL/2.0/FAQ/ (file-scoped weak copyleft;
  MIT/BSD/Apache imports are fine).

Engine code paths:
- `face-lib/src/model/hair-field.ts` — `cranialField`, `clumpStroke`,
  `xyzToUV`, `seedsByLatitude`. **Already done; not yet used by buildHair.**
- `face-lib/src/model/scaffold.ts:752` — current `buildHair` (the
  wedge-polygon bug).
- `face-lib/src/render/svg.ts:34,98–138` — two-pass painter; the place to
  add the `feature-ink` curve kind.
- `face-lib/research/hair.md` — primitive vocabulary (pass 1).
- `face-lib/research/hair-pass-2.md` — schools, texture axis, license-
  verified import sources (pass 2).

---

## 8. Pass 4 — Mass silhouette differentiation audit (post-Pascal-3/10)

*Pascal scored 3/10 on the refreshed gallery and called the oscillation
signal: perfect-freehand is plumbed, but every demographic renders as the
same chocolate dome with one vertical parting scratch. The previous pass
fixed the motor layer (stroke quality). This pass fixes the symbolic layer
(mass SHAPE). Fred: do not iterate `buildHair`'s constants again — the bug
is in the parameterization, not the magic numbers.*

### 8.1 Why the silhouette is a generic dome on every demographic

Read `scaffold.ts:813–825`. The mass envelope `topSil` is a single
ellipsoidal half-arc parameterized **only by Y-lift**:

```
startY  = templeY − 0.02·H              // both temples, symmetric
domeT   = sin(θ)                         // smooth dome from 0 to π
y(θ)    = startY + (ry − startY)·domeT + effectiveLift·domeT
x(θ)    = sx·cos(θ)                      // ellipsoidal half-perimeter
```

There is exactly one shape-degree-of-freedom on the silhouette:
`effectiveLift = volume · headHeight · lengthMul(style)`. It controls
**height of the dome**. Everything else is hard-coded:

- Temples land at `(±sx, templeY)`. No `templeRecession` knob — masculine
  and feminine hair both meet the face at the same X,Y on each side.
- Lower bound is `templeY` on BOTH sides. No `sideFall` — hair cannot
  extend down past the temple. So "long feminine" and "cropped masculine"
  share the same lower envelope.
- The dome is **left/right symmetric by construction** (`cos(θ)` from 0 to
  π). No asymmetry knob — Tintin's quiff has nowhere to live in the
  silhouette; the flick (`scaffold.ts:920–939`) is an *interior* stroke
  buried inside an unbroken dome.
- The peak is at `θ = π/2` (top dead-center). No `crownPeakX` — the
  apex never moves forward (Tintin quiff), back (slicked-back exec), or
  drops (centre-part heavy fringe).
- The arc is **C∞ smooth**. No break-points, no recession dip, no
  triangular teeth, no edge texture. Every school renders as ligne-claire
  smooth, even when the demographic preset says "short masculine" (which
  in real comics has hairline corners, recession dip, or a crew-cut flat
  top).

**Conclusion: the mass primitive has ONE shape-knob (lift) and four
hidden zero-knobs (recession, side-fall, peak-X, edge-kind).** No
amount of tuning `volume` and `forehead` per preset can produce a
differentiated silhouette set, because those knobs only move the
existing dome up and down. Pascal's 3/10 is mechanical — the shape
space *literally cannot represent the variation he is asking for*.

This is exactly the oscillation pattern AGENTS.md predicts: the
*primitive* is wrong, so iterating its parameters moves laterally.

### 8.2 Minimum new shape knobs — five, no more

Pedagogy (Faigin *The Artist's Complete Guide to Drawing the Head*, ch. 9
"Hair as Mass"; Loomis 1956, "Hair as a Block on Top of the Block";
Hampton ch. 7) is consistent: a hair MASS is described by **silhouette
shape on five axes**, not by interior detail. Add these five knobs to the
`hair` param group. Each must be **per-side capable** (left/right
asymmetry) — but default symmetric. All five live on `massSilhouette3D`,
not as new primitives.

| # | Knob | Range | What it does to the envelope | Pedagogy |
|---|---|---|---|---|
| 1 | `templeRecession` | 0..1 | At `t ≈ 0.15` and `t ≈ 0.85` of the dome arc, **dip Y downward and X inward** by `recession · 0.08·H`. Produces the M-shape (Faigin's "widow's-peak inverse") or mature-masculine receding corners. 0 = flat across forehead (child / shoujo). | Faigin §9.3; Bridgman *Heads* fig. 41 (mature male hairline) |
| 2 | `sideFall` | 0..1 | Allow the silhouette's lower bound at `t ∈ [0, 0.1]` and `t ∈ [0.9, 1]` to **drop below `templeY`** by `sideFall · 0.35·H`. Mass now extends past the ear (long-fem, teen-fem, bob). 0 = cropped above ear. | Hayashi *Bishoujo* §2 "side curtain"; Loomis 1956 plate 38 |
| 3 | `crownPeakX` | −0.4..+0.4 | Shifts the dome apex from centre toward forehead (+) or nape (−). +0.25 = Tintin quiff; 0 = generic dome; −0.2 = slicked-back exec; +0.1 with `sideFall = 0` = adult masculine pomp. Implemented as a non-uniform reparameterization of θ. | Hergé canon (Sterckx 1988 p.92); Caniff *Terry* hair-block analyses |
| 4 | `napeExtension` | 0..1 | At `t = 0.5` (the *back*, which is currently `(0, ry+lift)` — the top) we cannot extend further up; this knob extends the **rear lower envelope** down past `templeY` toward the neck. (Requires the silhouette polygon to gain rear vertices below templeY, not just on the front arc.) Long-fem signal; pageboy / bob fall. | Hayashi *Bishoujo*; Disney 2D animation model sheets (Pocahontas, Mulan) |
| 5 | `edgeKind` | `'smooth' \| 'spiked' \| 'flicked' \| 'edgeTextured' \| 'crowSnipped'` | Discrete edge-modifier on the silhouette. `smooth` = ligne-claire. `flicked` = ONE asymmetric outward bump at `t = 0.2` (Tintin forelock — moves the flick from being a buried interior stroke to being PART OF the silhouette, which is where Hergé actually drew it). `spiked` = shounen. `edgeTextured` = coily canon. `crowSnipped` = short choppy ends (Vashti Harrison child style). | Pass-2 §3 + Crilley *Mastering Manga* vol.1; Nelson canon §6 |

**Hairline as a SECONDARY axis (not a primary knob).** Pass-3 §6 STOP #3
already flagged this: the hairline is a boundary, not the subject. Keep
the existing `frontShape: 'straight' | 'widows-peak' | 'parted' |
'receding'` — but understand that for demographic legibility it is the
silhouette's `templeRecession` + `crownPeakX` that does the work.
`receding` is a *consequence* of `templeRecession > 0.5` combined with
`forehead > 0.55`, not an independent topology.

**Why not more knobs.** Adding a sixth introduces interaction debt: every
pair of knobs has a combinatorial preset surface that we must validate
against real comic art. Five is the maximum Fred can hold in his head
while writing one `buildHair`. AGENTS.md ("don't dump 7 parameters in
parallel that happen to add up to old"): demographic presets must commit
to a small ordered tree, not a high-dimensional knob bank.

### 8.3 Distinct silhouettes for the Tintin-bar

Pascal's reading: 2 silhouettes out of 6 are distinct (essentially
"shorter dome" vs "taller dome"). The demographic axis is **not legible
at thumbnail**, which is the working-pro side-character test.

Minimum count for legibility: **5 distinct silhouettes**, one per
demographic pillar (M / F / elder-M / elder-F / child) with teen-F
allowed to overlap teen-M or fem-adult without losing the bar.

Concretely, the five must be visually distinguishable from one another
at thumbnail with the FACE MASKED. If you can only ID the demographic
by looking at jaw/eyes, the hair primitive is failing — the hair
silhouette must independently carry demographic readability, because
in comics it does (Tintin recognizable hair-only, Asterix hair-only,
Charlie Brown hair-only, Olive Oyl hair-only, the Calvin spike-only).

### 8.4 Per-preset hair recommendations (concrete)

Each preset names: SHAPE (silhouette envelope choice), HAIRLINE
(boundary), CHARACTERIZATION (the one interior stroke). All five knobs
are listed; missing = 0 / `smooth`.

**masculine adult** — short pompadour-ish, the Caniff/Toth working-male
default. Silhouette has **forward-shifted crown**, slight recession at the
temples, NO side-fall. Reads as "structured, short, parted."
- `templeRecession: 0.35`, `crownPeakX: +0.10`, `sideFall: 0`,
  `napeExtension: 0`, `edgeKind: 'smooth'`
- `frontShape: 'parted'`, `forehead: 0.46`, `volume: 0.07`
- Characterization: parting at left of midline, ONE forelock flick
  *escaping the silhouette* on the right (via `edgeKind: 'flicked'`
  if Tintin-side-character; otherwise the existing interior flick).

**feminine adult** — chin-length bob (the Hergé/Tintin supporting-fem
default — Bianca Castafiore short variant, Tintin women generally). Mass
**falls past the temple** to roughly mid-ear; hairline straight; crown
centred but slightly raised; edge smooth.
- `templeRecession: 0`, `crownPeakX: 0`, `sideFall: 0.45`,
  `napeExtension: 0.30`, `edgeKind: 'smooth'`
- `frontShape: 'parted'`, `forehead: 0.33`, `volume: 0.10`
- Characterization: ONE side-curtain stroke (clumpStroke off the
  forelock seed sweeping down toward the cheekbone), not a parting.

**elder masculine** — significant recession + thinning. Silhouette
PULLED BACK from the hairline corners; crown centred or slightly back
(volume gravitates to the back as the front goes); no side-fall.
- `templeRecession: 0.85`, `crownPeakX: −0.05`, `sideFall: 0`,
  `napeExtension: 0`, `edgeKind: 'smooth'`
- `frontShape: 'receding'`, `forehead: 0.65`, `volume: 0.04`
- Characterization: NONE (no parting, no flick — bald-crown adjacent).
  The defining feature is the M-shape recession, drawn by the
  silhouette itself, not by a separate hairline stroke (STOP #3 holds).

**elder feminine** — shorter than fem-adult, gathered up; greying not
shape-modeled here. Mass sits closer to the cranium (lower
`sideFall`), often a backward-volume puff.
- `templeRecession: 0.10`, `crownPeakX: −0.10`, `sideFall: 0.20`,
  `napeExtension: 0.15`, `edgeKind: 'smooth'`
- `frontShape: 'parted'`, `forehead: 0.38`, `volume: 0.08`
- Characterization: parting + ONE soft interior separator (clumpStroke
  along the field; not a flick).

**child** — round full cap, no recession, NO parting (kids' hair reads
flat-front before parting habits set in — Loomis 1956 plate 30,
Vashti Harrison's *Little Leaders* canon §6). Slight `crowSnipped` edge
gives the choppy-fringe look ubiquitous in Western kid comics.
- `templeRecession: 0`, `crownPeakX: 0`, `sideFall: 0.15`,
  `napeExtension: 0.10`, `edgeKind: 'crowSnipped'`
- `frontShape: 'straight'`, `forehead: 0.30`, `volume: 0.12`
- Characterization: NONE. The choppy edge does the characterization.

**teen feminine** — longer than fem-adult, hair as primary identifier.
Big `sideFall`, big `napeExtension`, optional small flick.
- `templeRecession: 0`, `crownPeakX: +0.05`, `sideFall: 0.85`,
  `napeExtension: 0.70`, `edgeKind: 'flicked'`
- `frontShape: 'parted'`, `forehead: 0.36`, `volume: 0.11`
- Characterization: side curtain stroke + ONE inward fringe flick on
  the forehead (the fringe-wedge primitive from §4 — already in the
  primitive vocabulary; not yet wired).

Reality check: at thumbnail with face masked, these are five distinct
silhouettes (M-recession, F-bob, elder-M-deep-recession, elder-F-puff,
child-cap) plus teen-F-long. That's 6 distinct shapes. Pascal's bar
passes if Fred implements knobs 1–5 and these presets faithfully.

### 8.5 STOP-the-line flags — mass silhouette specific

These are in *addition* to §6's prohibitions, all of which still hold.

**SS-1. Do NOT fix demographics by going back to pre-pullback caricature.**
The demographics file (`presets/demographics.ts:117`) was pulled back
explicitly because the prior fem preset rendered as "one scary looking
ugly lady" (user verdict). The fix for collapsed differentiation is
the silhouette knobs above, not re-cranking `bigonialWidth` and chin
points. Caricature is a JAW failure mode; legibility belongs to HAIR.

**SS-2. Do NOT add a sixth shape knob.** Five is the budget. If
something doesn't fit (e.g. "asymmetric undercut" for a punk teen),
that is a `'spiked'` or `'crowSnipped'` `edgeKind` variant, not a new
parameter. If we need a sixth knob in six months, that is a *new
section in this doc*, not a vibe-coded constant.

**SS-3. Do NOT let the knobs interact non-orthogonally.** E.g. if
`templeRecession` silently scales with `forehead`, presets become
impossible to reason about. Each of the five knobs must do exactly one
thing and not modify the others. (Implementation hint: build
`templeRecession`'s deformation as an *additive* offset to `topSil`
at the right θ range, not a multiplicative factor on `effectiveLift`.)

**SS-4. Do NOT move the parting / flick before the silhouette is
fixed.** The current flick is invisible because it lives inside an
unbroken dome — perfect-freehand cannot save a stroke that has nothing
to push against. Fix silhouette first; THEN evaluate whether the
existing parting and flick still need adjustment. (They likely will,
once `crownPeakX` and `edgeKind: 'flicked'` move the silhouette under
them — but verify empirically.)

**SS-5. Do NOT introduce a "hair style" name explosion.** Resist adding
`'pompadour' | 'bob' | 'pixie' | 'mohawk' | 'bun' | ...` to the
`style` enum. Style names are *compositions* of (length, knobs 1–5,
edgeKind). The enum stays at `none | short | medium | long | bald`;
demographic presets pick the knob tuple. AGENTS.md §3 ("symbolic
compression"): names are derived, not primary.

**SS-6. Do NOT skip the asymmetry path.** Real comic hair is rarely
left-right symmetric (Tintin's quiff, Asterix's wings, almost every
shoujo fringe). The five knobs above must accept `[L, R]` tuples or a
scalar (broadcasted). If Fred ships them as scalar-only, the engine
ossifies into bilateral symmetry and the next pass has to redo the
plumbing. Default to scalar in the preset file (so it reads clean)
but make sure the underlying type accepts tuple from day one.

### 8.6 Implementation order for Fred (do not skip)

1. Type-extend `FaceParams['hair']` with the five knobs (and the
   scalar-or-tuple shape — `number | [number, number]`).
2. Rewrite `topSil` generation in `buildHair` to consume them.
   Single function, five additive deformations of the base arc.
   ≤ 60 LOC.
3. Update `demographics.ts` with the six presets above.
4. Render gallery. Compare to Pascal's previous 3/10 set.
5. Hand to Pascal. If Pascal still sees ≤2 distinct silhouettes, the
   bug is in step 2 (the deformations aren't large enough to read at
   thumbnail), NOT in the knob choice. Don't change the knob set; turn
   the knob amplitudes up. If Pascal still scores ≤3/10 after that —
   call Leo, the primitive needs another pass.

*Sources added in pass 4:* Faigin *The Artist's Complete Guide to
Drawing the Head*, Watson-Guptill 2012, ch. 9 "Hair"; Bridgman
*Constructive Anatomy: Heads*, 1924, figs. 38–43; Sterckx 1988 p.92
(Hergé hair geometry); Hayashi 2000 §2; Crilley 2012 vol.1; Loomis
1956 plates 30, 38; Nelson, Harrison canon as cited pass-2 §1.

---

## 9. Pass 6 — stroke-as-mass audit

*Fred pivoted long-hair rendering after the user caught us bucket-filling
the silhouette polygons of passes 3-5 ("Microsoft-Paint fill"). New
approach: `style: 'long'` renders ~480 perfect-freehand strokes traced
through the cranial field, seeded 50/50 across front-of-scalp + sides,
with per-stroke RNG'd length/thickness/pressure/taper, and a per-recipe
`waviness` + `waveFrequency` for perpendicular sinusoidal modulation.
Four variants in `src/hairstyles/`: longSleek, longFlowing, longWavy,
longCurly. Images: `/tmp/longhair/{fem,masc}-long{Sleek,Flowing,Wavy,Curly}.png`.
This pass judges the APPROACH, not the output (Pascal's lane).*

### 9.1 Field-trace + perfect-freehand + per-stroke RNG — right primitive?

**Yes for strands; no as the whole long-hair primitive.** Loomis 1956
pl.38, Faigin 2012 ch.9, Hayashi 2000 §2, hair-theory §2: long hair =
**(a) mass envelope as fill** + **(b) clump-strokes on top**. Fred wired
(b) competently. But (a) is bugged: the silhouette polygon is still
bucket-filled WITH a visible outline. fem-longSleek = flat brown dome
with strokes hanging off as wisps — *strokes-as-texture-on-cap*, not
*strokes-as-mass*. The user's "strokes ARE the mass" meant kill the
outline and let strokes bleed into the fill (Toth bridging, *Genius,
Isolated* IDW 2011 ch.4), NOT delete the fill. Fill must EXIST but show
no polygon edge.

### 9.2 What's missing from the symbolic tree

Three absences, ranked by visible-range delivered:

1. **No clumping topology.** Real hair forms bundles of 5-50 strands
   (sebum/capillary bridges; Robbins 2012 ch.9; Choe & Ko 2005 "wisp").
   480 independent seeds = uniform distribution; `phase=u*3.5+v*2.1` is
   a Fourier alias. Real clumps = ~10-40 *discrete units* with
   correlated direction/length/phase/root.
2. **No edge-of-mass darkening.** Stack zones (parting, curtain edge,
   nape) should accumulate ink. Falls out of #1 automatically.
3. **No anchor clumps.** Real long hair has 2-5 dominant locks (Hayashi
   2000 §2 "curtain that occludes"). Variance present, spatial coherence
   absent. Special case of #1 with long-tail clump sizes.

Add #1 NOW. #2 and #3 are free if #1 lands.

### 9.3 longCurly — parameter or approach?

**Approach.** Perpendicular sine on a field-trace is wrong for curl:

- Real curls are **3D helices** (oval cross-section → helical bending;
  hair-theory §1.2, De La Mettrie 2007, Bertrand 2007). 2D perpendicular
  sine is a side-projection of a helix, only correct edge-on; off-axis
  it's an envelope tube with intermittent dots, not a wave line.
- Curls **interlock** because spring radius < strand spacing — ringlets
  (Hayashi 2000 "small Cs"; Crilley 2012 draws overlapping C-arcs).
- Curls **shorten** the strand 30-60% (Robbins 2012 ch.3 "elastic
  recoil"); ringlets hang CLOSER to scalp. Fred's curl strokes extend
  as far as sleek strokes — gravity should look MORE visible on curls,
  engine does the opposite.

Honest primitive: **overlapping arc segments along the field trace** —
Crilley's stack-of-Cs, ~5-15° arc, 0.5-1.5cm radius, alternating. Pascal
will keep scoring longCurly ≤4 until this lands.

### 9.4 Is perpendicular sine honest for waves?

**Defensible at v1; ceiling ~5/10.** A 2C wave is close to a damped
sinusoid in side-projection. Failure modes:

- **Constant frequency along stroke** — real waves DAMP toward the tip
  (Robbins 2012 fig 9.4). `exp(-0.4*t)` decay would push longWavy from
  patterned to natural.
- **Perpendicular in 2D image space**, not 3D-tangent space — visible
  in fem-longWavy: side-curtain strokes wave INWARD toward the face
  instead of along their drop axis.
- **Phase from UV, not clump membership.** Real adjacent waves are
  phase-locked because they share a CLUMP (§9.2 #1).

Better future primitive: **per-clump shared phase + amplitude decay**
(Bertails et al. 2006, "Super-Helices for Natural Hair", SIGGRAPH —
clump-coordinated curl). Out of scope until §9.5 lands.

### 9.5 The next biggest piece — opinionated pick

**Clumping topology.** Concretely: replace 480 independent seeds with
~25 **clump centres** on the scalp, each spawning 8-20 stroke seeds
drawn from a tight gaussian, with **correlated** length/direction/phase/
intensity per clump. Render back-clumps first (darker/thicker), then
front-clumps (varied direction breaks the curtain).

Why this beats tuning anything else:

- Fixes longCurly chaos (clump = coherent ringlet group).
- Provides edge-of-mass darkening for free (clump edges stack ink).
- Produces the anchor-lock effect (long-tail clump-size distribution).
- Removes the cap-fill illusion — with 25 dense clumps the silhouette
  fill becomes redundant and the strokes legitimately ARE the mass.
- It is what Loomis, Faigin, Hayashi, Choe & Ko, AND Robbins all
  converge on independently: **clump is the unit, strand isn't.**

Cost: ~80 LOC. Two recipe fields (`clumpCount`, `clumpSpread`). Per-
clump RNG sub-seed preserves determinism. **Pascal's score will not
move >1 point until clumping lands**; continuing to tune wave parameters
or stroke counts is lateral motion.

### 9.6 STOP-the-line flags — stroke-as-mass approach

Additive to §6 and §8.5.

- **SM-1. Do NOT render >500 strokes per head.** Cost is linear in
  render, quadratic in SVG size (overlap painting). 480 = ceiling. If
  density looks wrong, fix is clumping, not more strokes.
- **SM-2. Do NOT delete the silhouette fill — DO suppress its outline
  stroke for `style: 'long'`.** Fill stops strokes anchoring against
  skin; outline is what reads as cap. One-line conditional.
- **SM-3. Do NOT add a sixth recipe knob before clumping lands.** Order
  is: clumping → curl-as-arc-stack (§9.3) → per-clump phase (§9.4) →
  knobs.
- **SM-4. Do NOT use seed-derived phase to fake clumping.**
  `phase=u*3.5+v*2.1` is a Fourier artefact. Real clumping = DISCRETE
  membership. More clever phase-from-position math = the bug.
- **SM-5. Do NOT extend perpendicular-sine to handle curls.**
  `waveFrequency > 3.5` produces longCurly chaos. Curl needs arc-stack.
  Stop the line at `waveFrequency > 3.5`.
- **SM-6. Do NOT seed strokes uniformly from the hemisphere.** 50/50
  front-vs-sides is fine; next step is clump-centre seeding
  (intrinsically non-uniform). Uniform sampling is the procedural tell
  hair-theory §6 flags.

### 9.7 Executive summary — for Fred

1. **Field-trace + perfect-freehand + per-stroke RNG is the right strand
   primitive — keep it.** The bug is the silhouette fill: still a bucket-
   filled polygon with a visible outline, so every variant reads as
   wisps-on-a-cap. Kill the outline; keep the fill; let strokes bleed
   into the fill (Toth bridging).
2. **Next biggest win is CLUMPING TOPOLOGY** — ~25 clump centres, 8-20
   correlated strokes each. ~80 LOC. Simultaneously fixes longCurly
   chaos, edge-of-mass darkening, and anchor-lock. Pedagogy AND physics
   converge on it. Anything else right now is lateral motion.
3. **longCurly is broken at the approach level, not the parameter
   level.** Perpendicular sine is a 2D projection of a 3D helix. Real
   curl needs Crilley's stack-of-Cs primitive. Cap `waveFrequency ≤ 3.5`
   until that lands.
4. **Perpendicular sine on waves is v1-defensible; ceiling ~5/10
   without clumping.** Don't tune the sine further — the ceiling is set
   by missing clumping, not by wave parameters.

*Sources added pass 6:* Robbins, *Chemical and Physical Behavior of
Human Hair*, 5th ed., Springer 2012 chs. 3+9 (curl recoil, wave decay,
sebum bridges). Bertails et al., "Super-Helices for Predicting the
Dynamics of Natural Hair," SIGGRAPH 2006 (per-clump phase). Crilley,
*Mastering Manga* vol.1, IMPACT 2012 (curl as stack of Cs). Toth,
*Genius, Isolated*, IDW 2011 ch.4 (silhouette bridging). Choe & Ko 2005;
Hayashi 2000 §2; De La Mettrie 2007; Bertrand 2007 — as previously
cited.

---

## 10. Pass 7 — cap-cluster oscillation audit

*Pascal's third lateral 4/10. Per AGENTS.md L22-25 = wrong primitive,
not wrong parameter. The cap-cluster (shortSwept, shortPompadour,
bobChinLength, curlyDome) is one silhouette with cosmetic fuzz. Long
hair differentiates because strokes ARE the mass (§9). Short doesn't
because strokes are texture-on-cap.*

### 10.1 Are the 5 knobs the right parameterization?

Values for the 4 styles: shortSwept (recession 0.30 / fall 0 / peakX
+0.10 / nape 0 / flicked); shortPompadour (0.10 / 0 / +0.30 / 0 /
smooth); bobChinLength (0 / 0.55 / 0 / 0.35 / smooth); curlyDome (0 /
0.30 / 0 / 0.20 / edgeTextured). Set is correct (Faigin ch.9). Two
killers at thumbnail:

1. **`napeExtension` is dead code at front-view** (scaffold.ts:902-905
   literally `void napeExtension`). Half my differentiation lives
   behind a stub.
2. **Sub-perceptual amplitudes.** `recessionMag = recession·H·0.08`
   at 0.30 = 2.4% H Y-dip; `peakXOffset = peak·rx` at 0.10 = 1% face
   X-shift. Only `sideFallMag` at 0.55 = 19% H is visible. Three of
   four knobs deliver <3% H — <8px on a 360px thumbnail, unresolvable
   through a 1.5px wobbled outline.

SS-3 (orthogonal knobs) locks us into small additive deltas that
don't compound. Set survives; amplitudes are sub-resolution at
thumbnail.

### 10.2 "Hard horizontal line." Yes — the shadow polygon edge.

scaffold.ts:946-952 builds `cap = [...topSil, ...hairline]` then
fills. The hairline polyline (928-941) has `baseArc -H·0.012·(1-sin
πt)` = 1.2% H temple lift (7px@600); `irregularity H·0.008·…` = 0.8%
H jitter (5px PP). Sub-perceptual. Then 962-992 paints a SHADOW
polygon whose lower edge IS that same hairline. Pascal's "hard line"
is the cap-tone → shadow-tone → brim → equal-spaced drops cascade.
**Hat with a tassel.** Toth (*Genius Isolated* ch.4) breaks the line
by letting clumps BRIDGE the fill — silhouette bottom = union of
clump bottoms, not a polyline. Crank `irregularity` 3-4× helps
marginally; clump-bottom union is the structural fix.

### 10.3 14 escape strokes — why "comb fringe"?

scaffold.ts:1295-1321. Per-stroke RNG IS used (jitterX, dropLen
cubed, endX, size). Uniformity is on the WRONG axes:

- **Anchor X-spacing.** `arcT=(i+0.5)/14` — exact H/14. Teeth signal
  isn't per-tooth length, it's the regular origin spacing. Toth /
  Caniff cluster (2-3 jammed, gap, 2 more); needs Poisson-disk or
  per-clump anchoring.
- **Anchor Y.** All start at `anchor[1]+0.005·H` — one curve. Real
  wisps originate from different depths into the cap.
- **Angle.** endX jitter ±0.010 → angle variance <8°. Real fringe
  fans ±30° (curl inward to brow, hook outward at temple).
- **Single ink colour.** All 14 = fillColor; real hair needs 3 tonal
  classes (dark base / mid / catch).

### 10.4 Pick — (a) extend §9 stroke-as-mass to short and medium.

**Drop the cap polygon for SHORT and MEDIUM. Stroke density only.**

- §9 proved this on long. Cap fill survived in short by inertia, not
  pedagogy. Faigin ch.9, Toth IDW2011 ch.4, Loomis 1956 pl.38 =
  silhouette-via-clump-bottoms; none paint polygon-fill with
  stroke-outline. The cap is a procedural artefact.
- Fixes §10.2+§10.3 simultaneously: no polygon → no brim → no escape
  primitive (cap-bottom strokes ARE the wisps); no amplitude crank
  (§10.1) — silhouette becomes emergent from the clump field.
- Reuses §9.5 (28 centres, correlated phase/size). Shorter
  `lengthBase` (0.20-0.50 vs 0.45-2.25) + biased crown-V → short.
- (b) "3× amplitudes" preserves the wrong primitive, trips SS-1+SS-3.
  (c) "per-style cap constructor" = 4 bespoke shapes = AGENTS.md §6
  "invent primitives, hand-tune" verbatim. (a) collapses 4 STOP-flag
  risks into one move already validated on long.

**LOC ≈ 120 delta**: DELETE 946-1019 (cap+shadow+highlight, −73);
DELETE 1264-1339 (texture+escape, −75); ADD §9 long-block extension
for short/medium with recipe-driven `lengthRange`/`clumpCount`/crownV
(~80). KEEP `topSil` as an OPTIONAL outline stroke (no fill) for
styles needing a visible cap edge (pompadour, spiky). KEEP parting
(1071-1091) and flowStrokes (1098-1121) — they ride on top of the
clump field unchanged. **This is the next move.**

### 10.5 Collapse longFlowing.

waviness 0.012 = 5px PP at 600px render. Sub-perceptual. Other field
deltas (forehead 0.30 vs 0.32, nape 0.50 vs 0.40) are noise. Delete
longFlowing. Catalog keeps sleek/wavy(0.030)/curly(0.075) — three
honest wave-axis points. "Subtly wavy long" = HS-3 antipattern
verbatim.

### 10.6 STOP flags — cap-cluster, additive to §6 / §8.5 / §9.6

- **CC-1. No amplitude crank on the 5 knobs.** Tripling `recessionMag`
  produces a contour shift; perfect-freehand smooths half back.
- **CC-2. No per-style polygon constructor.** Pompadour-roll lives as
  a clump-density bias on §10.4's stroke field, not new geometry.
- **CC-3. No re-adding the 14-escape primitive.** §10.4 deletes it.
  Fix sparseness with more hairline-band clumps, not a comb.
- **CC-4. No keeping `napeExtension` as a stub.** Wire or remove.
- **CC-5. No shipping longFlowing.** Three wave points is the budget.

### Executive summary — for Fred

1. **Cap-cluster collapse is structural. Drop the cap polygon (+ shadow
   band + 14 escape strokes) for SHORT and MEDIUM. Extend §9 stroke-as-
   mass: ~28 clumps, `lengthBase 0.20-0.50`, crown-V 0.78·π/2, density
   biased to hairline. ~120 LOC delta (mostly deletion). Recipe-driven
   `clumpLengthRange`/`clumpCount` replace `templeRecession` et al. as
   the primary differentiator.**
2. **Delete longFlowing.** Sub-perceptual; three wave-axis points
   (sleek/wavy/curly) is the budget.
3. **The 5 silhouette knobs survive but get demoted** — they control
   an optional outer outline stroke only, not a fill. `napeExtension`
   removed until 3/4 view lands.

*Sources pass 7:* none new — Toth IDW 2011 ch.4 (clump-bridged
silhouette), Faigin 2012 ch.9, Loomis 1956 pl.38, previously cited.

---

## 11. Pass 8 — 3D abstraction + lead/fill + bob-regression diagnosis

*Three questions in one audit. The user's note: hair OCCUPIES 3D space,
not paint on a scalp. The lead/fill question maps the user's own
technique to API shape. The bob regression is pass 7's collateral. I
treat them together because the right 3D answer makes the bob fix
obvious, not orthogonal.*

### 11.1 The 3D abstraction — pick one

| Candidate | Cost | Verdict |
|---|---|---|
| **3D clump-volume** — each clump = swept tube (centreline polyline + radius profile) rooted on scalp, with gravity + sign-flippable radial term | ~200 net LOC | **ADOPT** |
| Hair-shell offset surface | ~180 LOC | REJECT — collapses variety; no clump separation; coily halo fails. |
| Voxelised density field | ~600 LOC + render cost | REJECT — overkill; mixture rule wants a recipe knob, not a renderer rewrite. |
| Keep 2D-surface + bolt on escape primitives | ~40 LOC per escape mode | REJECT as architecture; viable as the STOPGAP we already use (`tailMass`). |

**Why clump-volume wins.** Pedagogy + physics agree the clump is the
unit (Loomis pl.38; Toth IDW2011 ch.4; Robbins 2012 ch.9; Bertails
SIGGRAPH 2006; hair-theory §2). Every working animation pipeline runs
**guide curves + interpolated children** with per-guide volume — Maya
nHair, Yeti, Houdini Karma, Blender particle hair. That is a 3D clump.
The engine's `clumpStroke()` is already a polyline sampler; we promote
it from "polyline on a surface" to "polyline through space with a
radius and a gravity term."

**What it buys over 2D-surface:**

1. Mass falls THROUGH air past the cranium silhouette. A bob, a
   curtain, a forelock all need points BELOW the chin or FORWARD of
   the face — there is no UV in the cranial field that represents
   "4 cm in front of the ear." 2D-surface forces every such case into
   an ad-hoc escape primitive (`tailMass` was the first).
2. Silhouette emerges from the projection of clump hulls — Toth's
   bridging is automatic. Pass 7 §10.2's "hard horizontal line = shadow
   polygon edge" disappears because there IS no shadow polygon; the
   silhouette IS the union of projections.
3. Forelock occlusion (BACKLOG `forelockMass`) becomes "a clump whose
   centreline drapes in front of the face plane" — render-order falls
   out of Z, not a separate primitive.
4. Coily volume — `gravityFactor < 0` (spring > weight, hair-theory §5)
   drives clumps radially outward instead of down. Same primitive,
   different sign. Mixture rule: knob, not new primitive.

**Doesn't buy:** light physics (we're still drawing ink). Doesn't fix
curl-as-helix (§9.3 arc-stack is still needed).

**LOC: ~+280 new, ~-80 deletion of `topSil`/cap/shadow/highlight in
scaffold.ts:813-1045. Net ~+200.** Smaller than the pass-5 recipe
refactor. The cranial field's UV→XYZ map stays; XYZ becomes a STARTING
point rather than a constraint. `clumpStroke()` signature changes by
~30 lines.

**Can 2D-surface be saved without the refactor? Honest answer: no, but
not for the reason the user thinks.** 2D-surface is not load-bearingly
broken — it carries pass 7. What it cannot do is the negative-space
cases (forward-of-face forelock, below-chin fall, beyond-cranium halo).
Three are deferred in BACKLOG; each costs ~50 LOC of escape primitive.
The refactor pays for itself in deferred-primitive avoidance across the
next three passes, not in any single pass. Lloyd should price it that
way, not as "fix the bob."

### 11.2 Bob-cap regression — was pass 7 right?

**Pass 7's prescription was right; the implementation went one step
too far for one edgeKind branch.** Pass 7 §10.4 said: drop the cap for
short/medium, let strokes carry. Commit `e8b9b52` dropped it for
`smooth|flicked|crowSnipped`; commit `618800d` restored it for
`spiked|edgeTextured` because those have silhouette extensions strokes
don't reach. What pass 7 and the implementer both missed: **smooth +
short + sideFall>0 is the densest mass case in the catalog**. The bob
has sideFall=0.55, a large envelope that 50 short clumps don't fill.
Long hair gets away with no cap because each stroke is 4× the length —
visual coverage scales with length, not count. Short-smooth-sideFall is
the regime where pure-stroke is under-resolution. Same primitive bug
pass 7 was solving, but from the inside.

| Fix | Cost | Verdict |
|---|---|---|
| **(a) Restore cap for `smooth\|flicked\|crowSnipped` when `style: short\|medium`** — widen the boolean clause | ~3 LOC | **INTERIM — DO THIS NOW.** Unregresses 4 hairstyles. Doesn't block the 3D refactor; cap polygon dies anyway when clump-volumes ship. |
| (b) Bump density to 80-100 clumps for short-smooth | ~20 LOC | REJECT — trips SM-1 ceiling; masks the primitive bug; CC-style band-aid. |
| (c) Wait for 3D refactor | weeks | REJECT alone; OK as long-term cleanup. |

Mixture rule: widen the condition, don't rewrite the primitive. The
edit at `scaffold.ts:972`:

```
const drawCap =
  edgeKind === 'spiked' || edgeKind === 'edgeTextured' ||
  verticalLift > 0 ||
  ((style === 'short' || style === 'medium') &&
   (edgeKind === 'smooth' || edgeKind === 'flicked' ||
    edgeKind === 'crowSnipped'));
```

Pass 7 was right; pass 7's implementation was 80% right; the missing
20% is one boolean clause.

### 11.3 Lead/fill — yes, but it's already implicit, just unnamed

The user's lead/fill technique maps to two real traditions:

1. **Maya nHair / Yeti / Houdini guide-curves + interpolated children**
   (Pixar, Weta, Disney TPS) — N "guide" curves authored deliberately,
   thousands of "children" interpolated between them. Refs: Bruderlin
   "Hair sketch" SIGGRAPH 1999; Petrovic, Henne, Anderson "Volumetric
   methods for simulating hair on production characters" SIGGRAPH 2005;
   Yuksel, Schaefer, Keyser "Hair meshes" ACM TOG 2009.
2. **Ribbon-based hair for stylised CG** — Arc System Works' Guilty
   Gear, Park "Stylised hair ribbon shading for Guilty Gear Xrd" GDC
   2015. Small N of ribbon leads modelled; fill strands procedural.

Comic-art mapping (Loomis pl.38; Toth IDW2011 ch.4; Hayashi 2000 §2;
Crilley 2012; Faigin 2012 ch.9 "lead lines"; Hampton 2009 ch.7 "primary
masses → secondary flows"): the artist draws 5-15 keys — parting,
curtain, forelock, 1-2 separators — then fills along them. Every comic
hair tutorial teaches this. **The engine already has both layers**:
`HairstyleRecipe.flowStrokes` is the leads (bobChinLength 2, shortSwept
2, shortPompadour 1); the 28-50 clump centres are the fill. **The two
layers exist; they are not named; and the fill does not follow the
leads.** That is the bug. The fix is naming and coupling.

**Recommended API change to `HairstyleRecipe`:**

```ts
type HairstyleRecipe = {
  parting: PartingKind;
  leads: readonly Lead[];          // RENAMED from flowStrokes
  fillBias?: 'follow-leads' | 'free' | 'mixed';  // default 'follow-leads'
  // existing knobs untouched
};
type Lead = FlowStroke & { flowWeight?: number };  // 0..1, default 0.6
```

Rename uses artist vocabulary (Faigin "lead lines"; Hampton "primary
masses"). For each fill clump, find the nearest lead in 3D, bias the
clump direction toward the lead's tangent by `flowWeight`. ~50 LOC at
scaffold.ts:1260. Works in 2D today; upgrades to 3D for free when
clump-volumes land. `fillBias: 'free'` reproduces today's random
clumping — preserves the BACKLOG exp-wavy-1 chaotic aesthetic.

### 11.4 STOP flags — additive to §6 / §8.5 / §9.6 / §10.6

**LF-1.** Do NOT add a third layer. Two layers is the comic-art
tradition. If a hairstyle needs more structure, add leads, not depth.

**LF-2.** Do NOT use 3D as an excuse for strand-level drawing. SM-2
holds. The clump is the unit in 3D too; the volume is the clump hull,
not a strand bundle. Bertails 2006 simulated 5-50 strand groups, not
5000.

**LF-3.** Do NOT delete the 2D-surface path on the 3D ship. Mixture
rule. 2D-surface is the degenerate case (gravity=0, radius=0). Expose
as `clumpMode: 'flat' | 'volume'`; default 'volume'; ligne-claire flat
presets opt out. Tintin is genuinely 2D; a 3D fall would caricature
him.

**LF-4.** Do NOT block the bob fix on the 3D refactor. §11.2 (a) is
3 lines. Ship it. HIGH severity does not wait on architecture.

### 11.5 Executive summary — for the Tech Lead

- **3D abstraction: clump-volume.** Each clump = 3D swept tube
  (centreline polyline + radius profile) rooted on scalp, with gravity
  + sign-flippable radial term for coily. **~+200 net LOC.** Pays back
  by obviating three deferred escape primitives (forelockMass,
  side-curtain fall, halo radiate), not by fixing any single pass.

- **Lead/fill: YES, already implicit, rename and couple.** Rename
  `flowStrokes` → `leads`, add per-lead `flowWeight`, add `fillBias`
  recipe knob defaulting to `'follow-leads'`. Maps to Maya guide-curves
  + comic-art pedagogy. ~50 LOC, does NOT require 3D first.
  Mixture-safe: `'free'` restores current random clump field.

- **Bob fix: interim 3 LOC now, long-term in 3D refactor.** Widen
  `drawCap` for short/medium smooth/flicked/crowSnipped (one clause in
  scaffold.ts:972). Pass 7 was right; the implementation was 80%
  right; this is the missing clause. The cap polygon dies cleanly
  when clump-volumes ship.

- **For Lloyd:** the refactor seam is `clumpStroke()` in
  `hair-field.ts` — change return type from "surface-bound polyline"
  to "world-space polyline + per-point radius." UV→XYZ map stays; XYZ
  becomes a STARTING point, not a constraint. `scaffold.ts:813-1045`
  (topSil + cap + shadow + highlight) collapses to a projected-hull
  merge — plan the deletion alongside the addition; net LOC FALLS if
  Lloyd carries the deletion through. Keep `clumpMode:'flat'` for
  ligne-claire (LF-3).

- **For Nick:** order is (i) ship the 3-line bob fix on its own
  commit; (ii) rename `flowStrokes → leads` + `flowWeight` +
  `fillBias='follow-leads'` (additive, no default-behaviour change);
  (iii) wait for Lloyd's clump-volume design before touching the field
  tracer or cap polygon. (i) and (ii) are independent; (iii) blocks on
  Lloyd.

*Sources added pass 8:* Bruderlin, SIGGRAPH 1999. Petrovic, Henne,
Anderson, SIGGRAPH 2005. Yuksel, Schaefer, Keyser, ACM TOG 2009. Park,
GDC 2015. Bertails et al. SIGGRAPH 2006 + Hampton ch.7 (prior, reinforced).
