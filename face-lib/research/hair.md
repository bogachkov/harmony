# Hair Primitive Research — face-lib

*Source: research agent pass. Saved verbatim from the agent's report so it
isn't lost. Cite this when refactoring `buildHair`.*

Skeptical review of how to redesign the hair primitive in `face-lib`. Current
implementation (`buildHair` in `/home/user/harmony/face-lib/src/model/scaffold.ts`,
lines 366-458): one dome silhouette + one wrap-around hairline + two optional
side strands. This is essentially a hat shape with no concept of mass,
parting, clumping, or grow-direction — and it shows.

## 1. Pedagogy

The classical-illustration consensus across four independent traditions:

- **Loomis, *Drawing the Head and Hands* (1956), "Modeling and Texture of
  Hair" section.** Hair is treated as **one connected mass that wraps the
  Loomis ball**, then planes are subdivided. The hairline is constructed on
  the ball's surface; the mass sits on top with measurable thickness. Loomis
  explicitly warns against drawing strands first.
- **Vilppu, *Drawing Manual* (1997) and online course; Hampton, *Figure
  Drawing: Design and Invention* (2009).** Same principle, restated as
  **overlapping clumps with overlap direction** — each clump has a root, a
  fall direction, and a tip. The clump is the unit of construction, not the
  strand. Art Prof's anatomy lecture summarizes the same rule: "block the
  mass with tone, then subdivide into clumps; look for how clumps overlap."
- **Faigin, *The Artist's Complete Guide to Drawing the Head* (Watson-
  Guptill, 2012)** — the canonical artist documentation of hair *structure*:
  hairline shape variants (straight, widow's peak, M-shape, receding), crown
  swirl as the radial origin, parting line emerging from the crown, sideburn
  / nape boundary. (Note: Faigin's earlier *Facial Expression* book does not
  cover hair; this is the right title.)
- **Comics / manga conventions.**
  - **Hergé** (Tintin): hair is a single closed silhouette with one parting
    curve. Practically the same as our current primitive, but with a more
    readable forehead-side ratio.
  - **Caniff / Eisner**: silhouette + 1-3 *interior* clump separators,
    never strand-level detail.
  - **Manga** (Hayashi *How to Draw Manga: Drawing Hairstyles*, Tezuka
    conventions): clumps radiate from a hidden crown swirl, with gravity-
    aware arcs and a deliberate **highlight band** (a wedge or zig-zag
    cutout) on the dome.

**Named structural pieces** every system shares (terminology to adopt):

- **Hairline** — the front boundary on the forehead. Shape variants:
  straight, widow's peak (V), M-shape, receding.
- **Crown / swirl** — the radial origin on top-rear of the cranium. Hair
  grows *away* from it in all directions; this is the hair-grow-direction
  rule.
- **Parting** — a line emerging from the crown forward (or from a side-part
  offset) along which the mass splits.
- **Clump / lock** — a directional sub-mass with root, mid, tip.
- **Fringe / bangs** — clumps that fall *forward* from the parting onto the
  forehead.
- **Falling mass** — clumps that hang below the silhouette edge (sides,
  back).
- **Sideburns** — short clumps in front of the ear, blending into beard /
  temple.
- **Nape** — rear hairline at the neck attachment.

## 2. Existing implementations (source-read)

| Project | What it is | Hair primitive | Render | License | Verdict |
|---|---|---|---|---|---|
| **fangpenlin/avataaars** (React) | Original Avataaars port | Hand-traced SVG per named style (`LongHairBigHair.tsx`, `ShortHairShortRound.tsx`, …, 28 styles) | One closed silhouette path + a 16% opacity shadow path + 10% white highlight path, all masked by a 264×280 bounding rect | MIT | **Learn-from**: confirms the silhouette-with-internal-shading recipe. Not portable — hard-coded coordinates, no scaffold-relative geometry. |
| **@dicebear/big-smile** | DiceBear style | Function-per-style returning SVG path string (`shortHair`, `mohawk`, `wavyBob`, `bowlCutHair`, `curlyBob`, `straightHair`, `braids`, `shavedHead`, `bunHair`, `froBun`, `bangs`, `halfShavedHead`, `curlyShortHair`) | Multiple paths, layered opacity for depth | MIT code, **CC-BY-4.0 designs** | **Learn-from only**: code MIT but the SVG geometry is CC-BY-4.0; cannot copy paths verbatim into MPL-2.0 face-lib without attribution and license carve-out. |
| **@dicebear/notionists** | DiceBear style | 30+ named variants (`variant01`…`variant30`) plus separate `beard`, `glasses` | Single closed path per variant | MIT code, **CC0** design | **Importable**: CC0 design = no attribution burden. Could be a "notionist art pack" override layer. |
| **@dicebear/avataaars** | DiceBear re-port | Same 28 hair styles as fangpenlin original | Same multi-path silhouette + shadow + highlight | MIT code, **CC-BY-4.0** | Same caveat as big-smile. |
| **zengm-games/facesjs** | Cartoon-face generator | ~59 hand-traced hair SVGs in `svgs/hair/` (`parted.svg`, `messy.svg`, `afro.svg`, `female1–12.svg`, etc.) Each is a single closed `<path>` with `fill=$[hairColor]` and `stroke=#000000` width 4 | `display.ts` injects each SVG at a fixed 400×600 canvas position, color-substitutes the placeholder, scales horizontally by `fatness` (0.8–1.0), and overrides certain hairs when a hat is worn | **Apache-2.0** | **Importable** (Apache-2.0 is MPL-2.0 compatible). Same silhouette-only pattern. Useful as an art-pack source if we can re-fit the 400×600 coordinates onto our scaffold. The richer female styles (`female6.svg` shows 6 internal sub-paths) demonstrate **clump separation as overlapping closed shapes** — the technique we want. |
| **SketchHairSalon** (Xiao et al., SIGGRAPH Asia 2021) | GAN sketch→photo hair | Two-stage GAN (Sketch2Matte + Sketch2Image) | Photo-realistic raster | Code license unspecified; **dataset non-commercial research only** | **Learn-from**: confirms procedural input vocabulary — *contour strokes* + *direction strokes* — matches our pedagogy exactly. Not usable: wrong output (raster), wrong license, GAN-heavy, non-deterministic. |
| **Live2D Cubism standard parameter list** | 2D VTuber rig | Hair as a series of named bone-like deformers driven by physics: `ParamHairFront`, `ParamHairSide`, `ParamHairBack`, plus per-clump physics nodes | Polygon mesh with deformers | Proprietary editor; spec is published | **Learn-from**: validates the front / side / back / nape decomposition as the industry-standard way to factor a hair rig. We should expose those four sub-regions. |
| **Picrew** | Hand-illustrated chibi avatar maker | (no source) Layered PNG packs | Layered raster | Proprietary | **Observe only**: each Picrew creator's hair set is consistently structured as base-silhouette + fringe overlay + accessory overlay — the same three layers manga tutorials teach. |

**Procedural-hair flow-field work (Choe & Ko, "A Statistical Wisp Model and
Pseudophysical Approach for Interactive Hairstyle Generation", 2005; Fu et
al., "Sketching Hairstyles", 2007).** Both model hair as **vector-field-
driven wisps**: a small set of field primitives (sink at crown, parting flow,
side fall) generate strand traces. **Learn-from**: this is the right
abstraction for our scaffold-driven approach — the *grow-direction field* is
the primitive, individual strokes are sampled from it.

## 3. Recommended approach

**Build our own**, scaffold-relative, modelled on Loomis + Faigin terminology
and Live2D's front/side/back decomposition, with the wisp/field idea as the
underlying math.

### Parameters (`p.hair.*`)

```ts
hair: {
  presence: 'none' | 'bald' | 'buzz' | 'short' | 'medium' | 'long';
  // Topology — pedagogy-rooted
  crown: { uOffset, vOffset };          // crown swirl position on the cranium (u,v in spherical coords)
  hairline: {
    shape: 'straight' | 'widowsPeak' | 'mShape' | 'receding';
    foreheadHeight: number;             // 0..1 fraction of forehead exposed
    templeRecession: number;            // 0..1 M-shape depth
  };
  parting: { style: 'none'|'center'|'left'|'right'|'swept'; offset, depth };
  fringe:  { coverage, length, clumpCount, direction };  // forward-falling locks
  sides:   { length, layering, tuckBehindEar };
  back:    { length, taper, napeShape: 'straight'|'tapered'|'undercut' };
  // Mass shape
  volume: number;        // lift above cranium (head-height units)
  density: number;       // clump count multiplier, deterministic
  flow:    { gravity, windAngle, windStrength };
  // Stylization
  clumpJitter: number;   // strand jitter at clump edges
  highlightBand: 'none'|'wedge'|'zigzag'|'crescent';   // manga highlight
  artPack: 'realistic' | 'tintin' | 'manga' | 'notionist';
}
```

### Primitives

1. **`cranialField(crownUV, partingSpec)`** — a 2D vector field on the
   cranium surface giving grow-direction at any point. Centre = sink at
   crown; parting = saddle. Pure math, deterministic.
2. **`hairlineCurve(shape, height, templeRecession)`** — returns a 3D
   polyline on the cranium where hair starts. Already partly built; needs
   `mShape` and proper `widowsPeak`.
3. **`massSilhouette(presence, volume, sides, back)`** — outer closed curve
   of the hair mass on/around the cranium. Wraps the cranium ellipsoid
   offset outward by `volume`; extends below the silhouette by `back.length`
   and `sides.length`.
4. **`clumpStroke(rootUV, length, direction, taper, jitter)`** — a single
   tapered open stroke from a root point, following the cranial field for
   `length` then falling under gravity. The atomic unit Vilppu/Hampton talk
   about.
5. **`fringeClumps(parting, fringe, hairline)`** — places N clump strokes
   radiating from the parting forward over the forehead.
6. **`interiorSeparators(massSilhouette, cranialField, density)`** — a
   handful of open strokes *inside* the silhouette following the field. This
   is the manga "flow line" detail and the single biggest missing piece
   today.
7. **`highlightBand(silhouette, kind)`** — for `manga` / `notionist` packs,
   a wedge cutout or extra closed path with lighter fill.

### How presets compose

- **`bald`** = none of the above; just a slight cranium shading curve.
- **`buzz`** = silhouette hugged tightly to the cranium (volume≈0), no
  fringe, no interior separators, hairline only.
- **`short`** = silhouette = cranium + small volume, hairline + fringe
  (small), 3-5 interior separators.
- **`medium`** = silhouette extends to ear bottom, fringe + sides + interior
  separators (5-8).
- **`long`** = back-mass extends below jaw, sides + falling clumps, full
  interior detail.
- **`tintinQuiff`** = `art pack=tintin` overrides interior separators=0,
  highlightBand=none, fringe.clumpCount=1 (the single sweeping quiff).
- **`mangaSpiky`** = `art pack=manga`, fringe.clumpCount=8-12,
  highlightBand=zigzag, clumpJitter=high.

### Import vs. implement

- **Implement ourselves**: all geometry — the cranial vector field,
  hairline, mass silhouette, clump stroke, interior separators. Our
  scaffold is 3D and projects; the existing 2D-SVG libraries cannot be
  lifted directly.
- **Import-eligible (Apache-2.0/CC0/MIT, MPL-2.0-compatible)**:
  `zengm-games/facesjs` SVG hair set and `@dicebear/notionists` SVGs as
  **2D art-pack overrides** — reference silhouettes that we project into
  our scaffold's coordinate system for non-3D-aware styles. Attribution
  required for Apache-2.0; CC0 is free.
- **Reject**: `@dicebear/big-smile`, `@dicebear/avataaars`, fangpenlin's
  original — the *code* is MIT but the *designs* are CC-BY-4.0; mixing into
  MPL-2.0 face-lib creates a license-clarity tax. Better to redraw under our
  own license.
- **Adopt the technique, not the code**: SketchHairSalon's *contour +
  direction stroke* input vocabulary maps directly onto our `hairlineCurve`
  + `cranialField` primitives. Choe & Ko's wisp model is the math reference
  for `cranialField`.

### Art-pack overrides (style packs swap these)

- **Tintin pack** — interior separators off, single fringe clump, no
  highlight band, thick uniform stroke.
- **Manga pack** — many fringe clumps, large explicit `highlightBand:
  'wedge'`, sharp clump tips (low taper).
- **Notionist pack** — import the CC0 SVG variants from `@dicebear/
  notionists` as silhouette overrides.
- **Realistic / Loomis pack** — interior separators following field, soft
  taper, no highlight band.

### Uncertainty flagged

- Faigin's hair coverage: high confidence the structural-pieces vocabulary
  is in *Drawing the Head*; haven't page-verified specific section titles.
  The book exists (Watson-Guptill 2012); the content claim is consistent
  with multiple secondary sources but is a single-source claim.
- Live2D's exact "standard parameter IDs" for hair: have at the family level
  (`ParamHairFront`, `ParamHairSide`, `ParamHairBack`); whether the spec
  mandates those exact IDs vs. recommends them is unclear from the docs.
- Choe & Ko's wisp model is a fit for the math but not re-read recently;
  the field-primitives idea is reproducible from other procedural-hair
  papers if not from that one.
- `@dicebear/big-smile` design license: read as CC-BY-4.0; not opened the
  LICENSE file directly. If wrong this does not change the recommendation
  (we redraw anyway).

### Key existing-code paths

- `/home/user/harmony/face-lib/src/model/scaffold.ts:366` — `buildHair` to
  replace.
- `/home/user/harmony/face-lib/src/model/params.ts:55` — `hair` param block
  to expand.
- `/home/user/harmony/face-lib/src/model/scaffold.ts:962` — call site.
