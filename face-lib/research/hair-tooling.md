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
