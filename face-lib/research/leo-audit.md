# Leo audit — pedagogy review of the face-lib approach

*Author: Leo (art-instructor agent). Scope: whether the current engine
encodes the **artist's decision tree** for a head, or only its vocabulary.
This is not an output-quality review (Pascal's lane). Cited sources at
first use; abbreviated thereafter.*

---

## 1. Executive verdict on the current approach

**The paradigm is approximately right; the implementation cheats.** Loomis's
sphere + side planes + jaw + landmark grid (Loomis, *Drawing the Head and
Hands*, Viking, 1956, "The Block-In" §I) really is the correct constructive
spine for a stylized comic head, and `buildScaffold` (`scaffold.ts:1121-1310`)
genuinely cascades cranium → side planes → jaw → eyeline → browline → mouthline
in roughly the right order. The hair-field substrate (`hair-field.ts`,
implementing a Choe & Ko crown-sink + parting-saddle wisp model — Choe &
Ko, *A Statistical Wisp Model and Pseudophysical Approach*, IEEE TVCG 2005)
is genuine pedagogy made executable.

Where the engine is **superficially** Loomis: (a) the cranium is a *front-
projected* ellipsoid with no actual sphere-meets-plane intersection — the
"side plane" is a clip in width, not a sliced plane (Loomis explicitly cuts
the sphere with two parallel planes and constructs the temple on the cut
edge). (b) The Reilly/Loomis landmark divisions (brow at top-of-sphere line,
hairline at top of cranium, nose-base at bottom of sphere, chin at bottom of
jaw, with eyeline as midline of the *whole head*) are present in name but
the offsets are *not derived from the masses* — `eyeY = (ry + chinY) / 2`
(line 1130) is a midline of the bounded box, while `browY = eyeY + ridgeY *
height` is an *additive* offset, not a ratio of the cranium (it should be
"eyeY + (top-of-cranium − eyeY) * browFractionOfForehead"). (c) `chinSharpness`
is a single knob doing the work of two anatomically distinct levers: gonial
angle (mandible corner) and mental-protuberance projection (chin pad). (d)
The cranium-to-jaw ratio — Loomis's defining sex/age dimorphism — is not a
direct parameter at all; it emerges as a side effect of `head.width / jawWidth`.

So: the **structure is Loomis-shaped**, the **knobs are not Loomis-named**,
and the **derivations are additive rather than proportional**. That's
exactly the gap Leo exists to close.

---

## 2. The artist's decision tree for a face — definitive

This is the dependency graph a master comic artist (per Loomis, Bridgman,
Hampton, Hogarth, Faigin) traverses in order. Each step's outputs are
inputs to the next.

1. **Gesture / tilt.** Head yaw, pitch, roll, line-of-action of the neck.
   Loomis (1956), §II "Construction". A face drawn out of this stage feels
   stiff because the cranium has been built before its orientation. Engine
   should expose `camera.yaw / pitch / roll` AND a head-on-neck axial tilt
   (separate from camera) so the head can lean while the camera is still.

2. **Cranial mass — the Loomis ball.** A sphere, then sliced by two parallel
   side planes (Loomis §I; Reilly head as restated in *Drawing Lessons from
   the Famous Artists School* 1961). The side-plane cut creates the temple
   corner (ear top), defines where the brow ridge wraps, and sets the
   eye-socket lateral. Cranial mass owns: **diameter, side-plane offset**,
   and **occipital projection** (back-of-skull bulge, Hampton 2009 ch.5).

3. **Jaw / mandible mass.** Bridgman *Constructive Anatomy* (Sterling, 1920)
   §"The Head" — the mandible is a separate horseshoe-shaped mass hinged at
   the TMJ just below the ear; it is NOT carved out of the sphere. Owns:
   **gonial angle** (mandible corner sharpness; Bridgman: 90°-130°),
   **ramus height** (TMJ to jaw corner; sex-dimorphic), **mental-protuberance
   projection** (chin push-forward; Hampton ch.5: the "chin button"), and
   **mental width** (chin pad width at the bottom; round vs. pointed).

4. **Reilly/Loomis landmark grid as RATIOS of the masses.** Loomis §I:
   the **brow line** sits where the side-plane cut meets the sphere front
   (the brow ridge is the top of the side plane). The **eyeline** is half-
   way between brow and chin (the famous "eyes at half-head" rule, Loomis
   1956 p.18). The **nose-base line** sits at the bottom of the sphere
   (1/3 from brow to chin). The **mouth line** sits 1/3 from nose-base to
   chin. These are *proportions*, not offsets — change the cranium height
   and they self-adjust.

5. **Facial planes — the Asaro/Loomis "front + sides + top + bottom"
   division.** Loomis §"Modeling"; Asaro head (the 1970s pedagogy plaster
   cast). Brow ridge, cheekbone, jawline-front, jawline-side, malar plane,
   nasolabial planes. These dictate where shadow falls and where construction
   strokes break. Even in ligne claire, the artist *knows* the planes —
   that's where they choose to drop a single line.

6. **Feature scaffolding on the grid.** Eye sockets *first* (Bridgman:
   "the eye is set in a cup"), then nose (5-plane wedge per Loomis), then
   mouth (an ovoid around the dental arch — Hampton ch.7), then ears
   (helix-antihelix-tragus-concha-lobe per Bridgman "question mark with a
   comma"). Each feature attaches to a plane, not to a 2D coordinate.

7. **Brows on the supraorbital margin.** Faigin, *The Artist's Complete
   Guide to Facial Expression* (Watson-Guptill, 1990) §"The Brow". Brow
   *ridge* is bone (cranium-attached); brow *hair* is on skin draped over
   that ridge. The expressive 3-DoF (inner lift, outer lift, arch) lives in
   the muscle layer above the bone.

8. **Hair — mass, not strands.** Loomis 1956 §"Hair": "Hair is treated as a
   *connected mass* that wraps the ball, with planes subdivided afterward."
   Vilppu *Drawing Manual* (1997) restates this as **clumps with overlap
   direction**. The mass sits on the cranium *with measurable thickness*.

9. **Neck — cylinder + SCM V + trapezius wedge.** Bridgman 1920 §"The
   Neck"; Hampton ch.5. The neck is a cylinder, but the front shows a
   V-notch (left + right SCM converging at the suprasternal notch) and the
   back is wedged by the trapezius descending from the occiput. SCM origin
   is *behind the ear*, not at the jaw corner.

10. **Expression overlay (Faigin/FACS).** Faigin (1990) catalogs the six
    universal expressions as muscle-action recipes on top of a neutral face.
    These are **shifts** to features 6-7, not new geometry.

11. **Style filter.** Ligne claire (Hergé / Swarte), Toth ink, Caniff, manga
    sub-schools. Decides line weight, suppression of interior detail, fill
    convention. Eisner, *Comics and Sequential Art* (Poorhouse, 1985) treats
    this as an explicit final pass.

**Critical property:** every step's outputs are *typed inputs* to the next.
The brow ridge is on the cranium; if the cranium widens, the brow widens
automatically. The mouth is on the mandible front plane; if the mandible
elongates, the mouth drops with it. **Current engine mostly violates this
by storing features as offsets from arbitrary lines rather than as
attachments to typed surfaces.**

---

## 3. Face shapes (cranium + jaw + ratios) — audit + refinement

**Current params** (`params.ts:6-14`):

```ts
head: { width, height, depth, sidePlaneInset, jawWidth, chinDrop, chinSharpness }
```

**Vocabulary verdict:** mostly geometric, not pedagogic. `width`, `height`,
`depth`, `chinSharpness` are CAD vocabulary. Only `sidePlaneInset` matches a
real pedagogy term, and even there it's a *clip ratio* rather than the
Loomis "distance from cranium center to side-plane cut" measured in head-
diameter units.

**Specific renames required (all citations Loomis 1956 §I or Bridgman 1920):**

- `head.chinSharpness` → split into `jaw.gonialAngle` (mandible corner;
  Bridgman 90-130°) AND `jaw.mentalWidth` (chin-pad width; Hampton "chin
  button"). One knob currently doing two anatomical jobs.
- `head.jawWidth` → `jaw.bigonialWidth` (the Bridgman / forensic-anatomy
  term for distance between the two gonial angles).
- `head.chinDrop` → `jaw.ramusHeight` is closer pedagogically; "drop" is
  motor vocabulary.
- `head.sidePlaneInset` → `cranium.sidePlaneOffset` (and make it a
  *distance from centerline in head-diameter units*, not a fraction-of-width
  clip).
- `head.width / height / depth` → `cranium.diameter` (single number — a
  sphere) plus `cranium.occipitalProjection` (back bulge; Hampton ch.5)
  plus `cranium.flatten` (sphere → ellipsoid in the sagittal plane only,
  for narrow-head characters).

**Missing levers (every one a documented art term):**

- **`cranium.broughtForward`** — Loomis's "tilt the sphere forward over the
  jaw" lever; controls whether the character has a brachycephalic (rounded
  back) or dolichocephalic (egg-back) skull.
- **`jaw.mentalProtrusion`** — chin push-forward in Z; Hampton ch.5 "chin
  button". Currently absent — a Hapsburg jaw is unrepresentable.
- **`jaw.cushion`** / **`face.jowl`** — soft-tissue padding along the
  mandible. Faigin (1990) §"Age": jowl appears 35+ as the platysma fails.
- **`face.malarProjection`** — cheekbone forward push; Bridgman §"The Cheek".
  Differentiates a high-cheekboned face from a flat one independent of width.
- **`browRidge.projection`** — supraorbital prominence; Hampton ch.5. Heavy
  brow ridge is a *cranial* feature, not a *brow-hair* feature, and changing
  it shifts the eye sockets back. Critical for masculine presentation.
- **`cranium.facialAngle`** — Camper's angle (the slope from forehead to
  upper lip). Classical proportion variable, neutralised in current engine.
- **`face.thirds`** — explicit Loomis-thirds knobs: `upperThirdRatio`,
  `middleThirdRatio`, `lowerThirdRatio` that *normalise to 1*. Currently
  thirds emerge accidentally from feature offsets.

**Order-of-operations violations in current code:**

1. `chinY = -ry - p.head.chinDrop` (scaffold.ts:1126) — the chin is
   placed *below the cranium sphere* additively. Loomis builds the chin
   as the *bottom of the jaw mass*, where jaw mass length is a ratio of
   the cranium diameter. Result: when cranium height changes, jaw doesn't
   self-adjust.
2. `eyeY = (ry + chinY) / 2` (scaffold.ts:1130) — eyeline as midpoint of
   the bounded box. Loomis's eye midline rule is **half the total head
   height**, which only coincides with `(ry+chinY)/2` when `chinDrop = ry`.
   Currently a fudge.
3. `browY = eyeY + ridgeY * height` (scaffold.ts:1131) — browline as an
   additive offset above the eyeline. Should be **ratio of the forehead**
   (browline sits at top-of-cranium minus forehead-fraction × forehead-
   span).
4. `cheekY = -ry * 0.35` (scaffold.ts:1127) — magic 0.35. Bridgman puts
   the cheekbone at the level of the lower eye socket (Bridgman 1920
   p.59) — should be `cheekY = eyeY - eyeSocketHalfHeight`.

**Concrete refined `head` block:**

```ts
head: {
  cranium: {
    diameter: number;             // head-diameter units (the sphere)
    sidePlaneOffset: number;      // distance centerline → side-plane cut
    occipitalProjection: number;  // back-of-skull bulge, Hampton
    facialAngle: number;          // Camper's angle, radians
    broughtForward: number;       // tilt forward over the jaw
  };
  jaw: {
    ramusHeight: number;          // TMJ to gonial corner, ratio of cranium
    gonialAngle: number;          // mandible corner sharpness, radians
    bigonialWidth: number;        // distance between gonial corners, ratio
    mentalWidth: number;          // chin pad width, ratio of bigonial
    mentalProtrusion: number;     // chin push-forward in Z
    jowl: number;                 // soft-tissue cushion, Faigin
  };
  face: {
    malarProjection: number;      // cheekbone forward push
    browRidgeProjection: number;  // supraorbital prominence
    upperThirdRatio: number;      // Loomis thirds — must sum to 1 with
    middleThirdRatio: number;     //   middle and lower
    lowerThirdRatio: number;
  };
};
```

Each block has a typed surface — `face.browRidgeY` is computed from
`cranium.diameter` × `face.upperThirdRatio`, not stored independently.

---

## 4. Hair — audit + refinement

**What the engine does** (`scaffold.ts:441-657`):

1. A dome silhouette from temple to temple (`topSil`).
2. A "nearly straight" hairline curve at `browY + (ry - browY) *
   forehead`.
3. A closed polygon (`cap = topSil + hairline`) rendered fill-only.
4. Cranial-field interior strokes (good — pedagogy-correct, see
   `hair-field.ts`) — but only **2-3 of them** with magic latitude/azimuth
   spreads.
5. Two "curtains" (side-falling rectangles) for medium/long.

**What `research/hair.md` and `hair-pass-2.md` prescribe (verbatim):**
universal substrate of scaffold (cranium / crown / hairline / parting /
**scalp-mask** / **front-side-back regions** matching Live2D's
`ParamHairFront/Side/Back`) + a primitive library of ~18 geometric kinds
(silhouette, cutoutShape, clumpStroke, interiorSeparators, hatchingField,
highlightBand, spikeStrip, coilCluster, cornrowChannel, braidChain,
lockBundle, bantuKnot, bunDisk, ponytailRope, edgeTexture, shaveBand,
fadeGradient, densityField) + art-pack switches.

**Motor-execution-not-symbolic violations:**

- The hairline is drawn as a "nearly straight clean curve" with a tiny
  optional V — that's a motor compromise the engine fell back to after the
  judge said earlier topology stamps read wrong. **The symbolic shortcut
  Loomis/Faigin actually use is: the hairline shape is the **boundary of
  the hair mass against the forehead plane**, which means it should be
  *derived from the mass silhouette intersecting the forehead*, not a
  separate near-straight stroke. Currently we draw two things; pedagogy
  says we draw one mass and let its lower edge be the hairline.
- The two side "curtains" are drawn as motor-style closed shapes — `outer`
  edge + `inner` edge + filled. Loomis treats falling side-hair as
  **clumps with root-mid-tip**, where each clump is a tapered open stroke
  parented to the crown's flow field. The Caniff/Eisner shortcut for long
  hair is **1-3 interior separators**, not two filled vertical bars.
- The "natural wobble" `headHeight * 0.003 * sin(t * 11.7)` on the dome
  (line 469) is motor-imitation jitter, not symbolic. Loomis tells you to
  draw a clean dome and let irregularity come from the **clump silhouette
  breaks** (Loomis 1956 §"Hair") — i.e., the irregularity is *where two
  clumps overlap*, not a fixed sine on the top silhouette.

**The right symbolic decision tree (per tradition):**

1. **Scalp mask** — uv → {full, shaved, faded, bald}. Faigin 1990 §"Hair"
   types: receding pulls scalp mask backward; mohawk leaves a sagittal
   strip; bald is empty mask.
2. **Crown sink** — single point on the cranium where the radial swirl
   originates. Already in `hair-field.ts`. Good.
3. **Parting saddle** — optional line from crown forward. Already there.
4. **Hairline curve** — a 3D polyline that is the *intersection* of the
   scalp-mask with the front-region. Shape variants per Faigin (straight,
   widow's-peak, M-shape, receding) are *not* separate strokes — they're
   different scalp-mask boundary shapes.
5. **Mass silhouette** — closed 3D curve offset from cranium by per-uv
   `volume(uv)`. For coily hair (`hair-pass-2.md` §1, citing Nelson,
   Robinson, Liu-Trujillo), this is a **halo** larger than the cranium
   with bumpy edge texture; no interior strands.
6. **Front / side / back regions** — three uv subsets matching Live2D's
   `ParamHairFront/Side/Back` (the industry shorthand). Different art
   packs render each region differently.
7. **Clump strokes** — a small set (3-7 per region, not 2-3 total),
   each rooted at a point in the scalp mask and traced through the cranial
   field for `length` field-units. Vilppu / Hampton clumps.
8. **Interior separators** — Caniff/Eisner sparse open strokes inside the
   silhouette, following the field. 1-3 of them for ligne claire; many
   more for shoujo.
9. **Highlight band** — optional wedge cutout (manga convention; Hayashi
   *How to Draw Manga: Drawing Hairstyles*, Graphic-Sha 1999).
10. **Texture pack switch** — coily/braid/loc/cornrow pack swaps primitives
    7-9 wholesale per `hair-pass-2.md` §6.

**Concrete primitive set and call graph** (just the primitives — not a
parameter dump):

```
buildHair(p, scaffold):
  mask = scalpMask(p.hair.scalpMaskKind, p.hair.recession)
  crown = crownUV(p.hair.crownPosition)
  field = cranialField(rx,ry,rz, {crown, parting, gravity})
  hairlineCurve = scalpMask.frontBoundary  // hairline derives from mask!
  silhouette = massSilhouette(cranium, mask, volume(uv))
  cap = closedFill(silhouette ∪ hairlineCurve)
  for region in {front, side, back}:
    clumps = clumpStrokes(seedsIn(region, mask, density(uv)), field, length)
    separators = interiorSeparators(silhouette ∩ region, field, count)
    pack.render(region, clumps, separators)   // pack chooses primitive set
  if pack.wantsHighlight: highlightBand(silhouette, pack.bandKind)
```

The two big shifts: **hairline is an output, not an input**; and **regions
are first-class** (matching Live2D + facesjs's hairBg/hair split, both
documented in `hair-pass-2.md`).

---

## 5. Neck — audit + refinement

**Current** (`scaffold.ts:1089-1117`): two cubic Béziers descending from
jaw anchors at fixed offsets, easing outward to a configurable base width.
Magic numbers `0.02`, `0.45`, `0.25`, `0.80`.

**Pedagogy** (Bridgman 1920 §"The Neck"; Hampton 2009 ch.5): a cylinder
between the cranial mass and the thoracic mass, with three load-bearing
landmarks:

1. **SCM** (sternocleidomastoid) — two cords originating *behind the ear*
   (mastoid process) and converging on the *suprasternal notch* between
   the clavicles. They make a V notched into the cylinder's front.
   Bridgman: "the most important construction line of the neck."
2. **Trapezius** — descends from the occipital ridge, flares outward to
   the acromion. From the front it appears as the wedges flanking the
   neck cylinder, descending to where the neck meets the shoulders.
3. **Adam's apple** (laryngeal prominence) — single small tick on the
   front midline; sex-dimorphic (Bridgman §"The Neck", second figure).

**Engine violations:**

- Neck anchors at `jawAnchorX = head.width * 0.28` (line 1291). Pedagogically
  the neck cylinder is **narrower than the head**, but its SCM cords
  attach to the **mastoid process** (behind and below the ear), not at
  the jaw corner. Right anchor point is `[−sx, earBottomY, depth*0.3]`
  not `[−head.width*0.28, chinY*adj, chinZ*0.5]`. **Order-of-operations
  violation:** neck currently depends on chin position; pedagogically it
  should depend on cranial side-plane bottom (ear-level).
- No SCM construction primitive — just the cylinder outline. Bridgman
  explicitly says the V is "the most important construction line."
- No trapezius wedge — research/primitives doc already flagged this.
- No Adam's apple tick — research/primitives doc flagged.
- Two cubic Béziers `0.02 / 0.45 / 0.25 / 0.80` are motor-execution magic;
  symbolic version is "cylinder of constant width" + "trapezius wedge
  diverging from start-of-flare uv".

**Concrete refined params:**

```ts
neck: {
  visible: boolean;
  scmAttachY: number;      // SCM origin on cranium (mastoid, head-height units)
  scmConvergenceY: number; // suprasternal notch
  cylinderRadius: number;  // ratio of head.diameter (typical 0.6)
  trapWidthAtBase: number; // trap flare at shoulder
  trapFlareStart: number;  // uv along cylinder where trap begins flaring
  scmShow: number;         // 0..1 visibility of front V
  trapShow: number;        // 0..1 visibility of back/side wedges
  laryngealProminence: number;  // Adam's apple tick, head-height units
};
```

**Primitives:**

1. `neckCylinder(topUV, bottomUV, radius)` — closed loop.
2. `scmV(mastoidL, mastoidR, sternalNotch, show)` — two construction lines.
3. `trapezius(occipitalRidge, acromion, flareStart, show)` — wedge.
4. `laryngealTick(midline, size)` — small horizontal mark on midline.

Cylinder *and* SCM V are scaffold/construction-class; trap wedge is
feature-class. Together they read as a Bridgman neck.

---

## 6. Facial hair — audit + refinement

**Current** (`scaffold.ts:667-872`): closed-ellipse mustache (`stachePoly`
with `bodyHalfW=0.085`, `bodyHeightTop=0.020`, `bodyHeightBot=0.030`) plus
optional handlebar curl teardrops, plus beard styles as outward-offset
polygons from the jaw curve.

**Pedagogy verdict — STOP-flag.** The closed-ellipse mustache has **no
basis** in any comic-art tradition. `research/facial-hair.md` §2.4 documents
this exhaustively across Hergé (Captain Haddock + General Alcazar),
Caniff (pencil mustaches as a single weighted stroke), Tezuka (stipple
field), Carl Barks (tick marks), Bruce Timm (angular triangles), Toriyama
(spiked silhouettes), Uderzo (drooping teardrops). **No canonical artist
draws a closed ellipse under the nose.** This is exactly the case AGENTS.md
calls out as "primitive that exists in code but has no documented
art-pedagogy basis."

The grooming-taxonomy decomposition the research doc proposes is sound:
**six growth zones** (mustache, soul-patch, chin, jaw, cheek, neck) ×
density × length × direction-field, with **render mode** as a separate
axis (`silhouette / silhouettePlusStrokes / strokeField / stipple`). This
matches Loomis 1956 §"Hair on the Face" (which extends his hair-as-mass
rule to facial hair: "the beard is a continuation of the hair, hung on
the lower face"), Hogarth *Drawing the Human Head* (Watson-Guptill, 1965)
§"Beards" (uses zone + direction-field), and Faigin 1990 (briefly, in the
context of expression-occlusion).

**Correct decomposition** (synthesizing facial-hair.md):

1. **Zone mask** — uv → 6-zone enum or coverage scalar. Style presets map
   to mask patterns (goatee = chin∪soulPatch; Van Dyke = mustache∪chin;
   Balbo = mustache∪soulPatch∪chin∪jaw; chinstrap = chin∪jaw; full =
   all-of-the-above; etc., per the facial-hair.md table).
2. **Density per zone** — sparse stubble to full.
3. **Length per zone** — direction the silhouette extends past the
   anchor plane.
4. **Direction field** — facial-hair.md §2.3, all from Loomis/Hogarth:
   mustache fans down-and-out; chin straight down; jaw down-and-out
   perpendicular to mandible; cheek down; **neck up toward jaw**
   (neckbeards look wrong if drawn growing down — the most cited rule).
5. **Render mode** — discrete enum chosen *from density*:
   - density > 0.8 → `silhouette` (filled polygon, Hergé Haddock)
   - 0.3 < density ≤ 0.8 → `silhouettePlusStrokes` (Hergé Alcazar; the
     one most artists call "a mustache that reads as hair")
   - density ≤ 0.3 → `strokeField` (Caniff pencil mustache) or
     `stipple` (Tezuka, Barks)

**The single load-bearing rule** (facial-hair.md §4.1, verbatim): a
mustache must NEVER be rendered as a closed shape whose contour fully
surrounds an enclosed region near the lip line. Three escape hatches:
(a) suppress the top edge (merge into nostril shadow), (b) at least one
internal direction stroke breaks the silhouette, or (c) no silhouette at
all — strokes only.

**Concrete primitives:**

1. `zoneMask(zones: ZoneCoverage[])` — uv subset.
2. `directionField(zoneMask) → uv → 2D direction` — derived from anatomy.
3. `silhouetteFromZone(zoneMask, length, taper) → closed curve` — but with
   **top-edge-of-mustache suppressed** by intersecting against the philtrum
   shadow region.
4. `strokeFieldOver(zoneMask, density, directionField) → open strokes`.
5. `stipple(zoneMask, density, dotRadius) → array of dots`.
6. `mustacheTopEdgeSuppression(silhouette, philtrumRegion)` — explicit
   primitive guaranteeing the rule above.

Named-style presets (`chevron`, `walrus`, `handlebar`, `pencil`, `fuManchu`,
`vanDyke`, `goatee`, `balbo`, etc.) become DeepPartial overrides of zone
mask + density + length + render mode, per the facial-hair.md table.

---

## 7. Ears — audit + refinement

**Current** (`scaffold.ts:403-439`): outer C-curve from temple to attach,
with one inner curl as antihelix. Two parameters (`size`, `protrusion`).

**Verdict:** per `research/primitives-nose-ears-neck-brows.md` (Ears
section), this is already ahead of DiceBear (no ear), facesjs (single
silhouette path), big-ears (no semantic params). So the engine is at the
front of the field — but still wrong relative to **Bridgman / Loomis**.

**Pedagogy** (Bridgman 1920 §"The Ear": "the ear is a question mark with a
comma"; Loomis 1956 §"The Ear" with the helix-antihelix-tragus-concha-lobe
labels): six named substructures, each a separable construction.

**What's wrong vs. Bridgman/Loomis:**

- **No tragus.** The tragus is a small flap covering the ear canal at the
  front of the ear. Loomis explicitly draws it; Bridgman's "comma" hint
  references it indirectly. Currently absent.
- **No lobe drop.** Real ears have a lobe hanging *below* the helix
  bottom; current `buildEar` makes a symmetric C with no asymmetry between
  top and bottom. Bridgman: lobe is the "comma."
- **No tilt.** Real ears slope backward ~15° (Loomis 1956 ear-construction
  panel). Currently vertical.
- **No attach-Y derivation from cranium.** Loomis attaches the ear so its
  **top aligns with the brow** and **bottom aligns with the nose-base**;
  current attach uses `(eyeY + noseBaseY) / 2` (line 1214) which is the
  ear midpoint, not the bracketed bracket-line construction. Off by half a
  feature.
- **Inner curl is a sine wave, not a Y-shape.** The antihelix is a
  Y-shape with the fork at the top; current `innerCurve` is a single
  sine. Bridgman is explicit about the fork.

**Concrete refined params** (matches primitives-nose-ears-neck-brows.md):

```ts
ears: {
  visible: boolean;
  helixLength: number;       // brow-to-nose-base span in head-height units
  helixProtrusion: number;   // how far helix bulges from side plane
  lobeDrop: number;          // extension below helix bottom (currently 0)
  antihelixShow: number;     // 0..1 Y-fork strength
  tragusShow: number;        // 0..1 visibility of front tragus tick
  conchaShow: number;        // 0..1 visibility of inner bowl shadow
  attachTopY: number;        // anchor at brow level
  attachBottomY: number;     // anchor at nose-base level (derived)
  tilt: number;              // backward slope, default ~15°
};
```

Primitive set: `helix`, `antihelixFork`, `tragus`, `lobe`, `concha`. Each
a separate curve. Tilt applied uniformly post-construction.

---

## 8. Cross-cutting violations and STOP-flagged items

These are items I exercise STOP authority on — code exists with no
pedagogy basis, or violates the symbolic-compression rule.

1. **STOP — closed-ellipse mustache.** `scaffold.ts:750-773`. No artist
   draws this. See §6. Block any further iteration on this primitive
   until it's rebuilt on zone-mask + direction-field per facial-hair.md.

2. **STOP — `chinSharpness` as a single 0-1 knob.** `params.ts:13`,
   `scaffold.ts:62-66`. Doing the work of `gonialAngle` (mandible corner)
   + `mentalWidth` (chin pad). Block any further demographic preset
   wiring through this knob — they're collapsing two independent levers.

3. **STOP — features as additive Y-offsets from `eyeY`.** `scaffold.ts:1130-1133`.
   When cranium proportions change, features don't self-adjust. Required
   refactor: features as ratios of Loomis thirds.

4. **STOP — hair side curtains as filled rectangles.** `scaffold.ts:613-654`.
   Motor-execution imitation of fall — pedagogically these are clump
   strokes (Vilppu) with root-mid-tip, not filled mass. The closed
   polygon reads as plastic at small scale.

5. **STOP — neck anchored to chin position.** `scaffold.ts:1291-1296`.
   SCM origin is the mastoid (behind ear), not the chin corner. Block
   any further "tune the neck taper" iteration — wrong anchor point.

6. **STOP — `hair.frontShape` as a separate enum.** `params.ts:66`. The
   hairline shape is the boundary of the hair mass against the scalp mask;
   it's a *consequence* of the mass, not an independent shape. Block
   adding more `frontShape` enum values; refactor toward scalp-mask first.

7. **WARN — eye `style: 'almond' | 'dots'`.** Pedagogically the eye has
   *one* construction (sphere in a socket, lids draped over it — Loomis,
   Bridgman, Hampton all agree) and stylization is a render-pass choice.
   The current split forces engine duplication. Not a STOP, but flag for
   future consolidation: eye is a single primitive, ligne-claire is a
   render mode that suppresses the lid stroke.

8. **WARN — `hat.tilt` reserved but unimplemented** (`scaffold.ts:1085`).
   Dead parameter. Pedagogically a hat tilt is a separate rotation that
   should affect emblem position too — wire it or remove the knob.

9. **WARN — `style.showSidePlanes` only renders the side curves, not the
   actual planes.** The Loomis side plane is a *flat surface*, not a
   curve; current rendering reuses `sideL`/`sideR` silhouette segments.
   For pedagogic correctness the construction-mode render should show
   the actual quadrilateral plane (front edge + cut edge + cheek edge +
   top edge).

---

## 9. Recommended refactor sequence

Order matters because some refactors unblock others. Numbered in
*dependency* order.

1. **Rebuild `head` block as `cranium + jaw + face`** (§3). This is the
   foundation; every other refactor inherits from it. Specifically:
   replace `head.{width,height,depth,sidePlaneInset,jawWidth,chinDrop,chinSharpness}`
   with the typed three-block proposal. Compute all feature anchors as
   *ratios of the new blocks*, not additive offsets.

2. **Wire Loomis thirds into anchor computation.** Once §1 lands, replace
   `eyeY = (ry+chinY)/2`, `browY = eyeY + ridgeY*height`, `mouthY = noseBaseY
   + (chinY-noseBaseY)*0.40` with explicit ratio reads from
   `face.upperThirdRatio` / `middleThirdRatio` / `lowerThirdRatio`. This
   unblocks the demographic and expression presets — `child` and `elder`
   express their proportional difference through thirds, not by tuning
   five offsets in parallel.

3. **Add Bridgman neck** (§5). SCM V + trap wedge + Adam's apple tick.
   Anchor neck to mastoid (behind ear), not chin. Small primitive set
   with high pedagogic payoff and no dependency on the bigger refactors.

4. **Rebuild facial hair on zone-mask + direction-field + render-mode**
   (§6). DELETE the closed-ellipse mustache. This is the highest-impact
   change for Pascal scores because the current primitive is the most
   visibly wrong.

5. **Refactor ears with full Bridgman/Loomis substructure** (§7). Lobe,
   tragus, antihelix Y-fork, tilt. The cheapest big-payoff change; ears
   are visible silhouette-level differentiators.

6. **Rebuild hair around regions + scalp mask + primitive library**
   (§4). Add front/side/back region uv subsets per `hair-pass-2.md`,
   delete the "side curtains" filled rectangles, replace with clump
   strokes parented to the cranial field, derive the hairline from the
   scalp mask. This is the largest refactor but it sits on top of the
   foundation work; doing it before §1-2 means re-doing it.

7. **Demographic & expression presets re-expressed as sequential
   decisions** (per AGENTS.md §5: "old → jaw cushion off, then skin sag
   on, then cartilage growth on", not parallel knob-dump). Currently
   `ages.elder` in `demographics.ts:57-78` is a parallel-knob dump.
   After §1-2 it can become an *ordered transform*: jaw.jowl.cushion=0;
   face.jowl=0.4; nose.length+=0.10 (cartilage); brows.fullness=0.022;
   hair.recession=0.6. Each line is one sequential decision.

8. **Add the Asaro/Loomis facial-plane primitive** as a debug/construction
   render option. Front + sides + top + bottom planes per Loomis 1956
   §"Modeling". Doesn't need to render in final output, but having the
   planes computable unlocks correctness checks on feature attachment.

---

## 10. What you got wrong / where you might be wrong yourself

The AGENTS.md caveat — instructor sometimes confuses symbolic compression
with motor execution — applies in several places above. Self-flagging:

1. **§4 "side curtains as filled rectangles" → "clumps with root-mid-tip".**
   Confident this is correct for soft falling hair (Vilppu). Less confident
   for **ligne claire long hair** — Hergé's Mary Jane equivalents or
   Tintin's female-character hair are sometimes drawn as flat filled
   masses with a single edge stroke. The flat-mass version might be the
   *correct* symbolic compression for Hergé pack specifically, while
   clumps are correct for realistic/Vilppu pack. So: the side-curtain
   primitive isn't *wrong* — it's wrong as the default; it's right as the
   Hergé-pack render mode. Fred should keep it as a pack-conditional.

2. **§3 Loomis thirds as ratios that sum to 1.** Loomis 1956 p.18 famously
   has the eyes at "half the head height" and the chin at "one-fourth
   below the nose-base" — but the canonical "thirds" framing is a
   simplification that Loomis explicitly says is rough. The Reilly
   variation uses *quarters*. I'm asserting thirds as the engine
   abstraction; could equally be quarters with `quarterRatios[]`. Either
   works; thirds is more art-school-common but slightly less mathematically
   tidy than Loomis's actual eye-at-half rule. Flag for discussion.

3. **§5 SCM anchor at the mastoid.** Bridgman 1920 has the SCM origin at
   the mastoid process unambiguously. But for a stylized comic head where
   the ear is large and prominent, anchoring the SCM *behind the ear* may
   read confusingly because the construction line would visually cross
   the ear silhouette. The motor-execution shortcut comic artists actually
   use is "from the jaw corner down to the sternal notch" — pedagogically
   wrong but graphically clean. I'm prescribing the anatomically-correct
   version because Bridgman gives the explanation for *why* (the V notch
   reads correctly when the SCM crosses the ear), but if it fights with
   the ear primitive in practice the motor shortcut may need to win.

4. **§6 "closed-ellipse mustache has no comic-art tradition".** Confident
   in this for clean-line / ligne claire / Caniff traditions. There ARE
   cartoon traditions (Hanna-Barbera era Wacky Races villains, some
   1930s newspaper-strip mustaches, Disney's Captain Hook in some
   panels) where the mustache *is* drawn as a closed dark shape under
   the nose. So the primitive isn't *forbidden*, it just shouldn't be
   the **default render mode for the mustache zone**. Demoting it from
   "the way mustaches are drawn" to "one art-pack render mode among
   several" is the safer prescription.

5. **§4 "regions are first-class" (Live2D ParamHairFront/Side/Back).**
   Live2D's parameter spec is a *VTuber rigging* convention, not a
   drawing-pedagogy convention. I'm treating it as pedagogy because the
   research doc treats it as one and because it independently matches
   facesjs's hairBg/hair split and the Loomis "front mass / side mass /
   nape" decomposition. But it's also possible that the front/side/back
   trichotomy is mostly a *rigging convenience* (each region has
   independent physics) and the drawing tradition doesn't actually carve
   hair into exactly three regions. If a Caniff or a Vilppu carved into
   four (front, side, crown, nape), the regions vocabulary should follow
   them, not Live2D. Flagged uncertainty.

6. **§3 `cranium.broughtForward` (skull tilt over jaw).** I cited Loomis
   for this but haven't page-verified the specific term. Loomis definitely
   discusses a "forward-tilted ball" for certain characters; whether he
   names that variable directly or whether I'm coining the name is
   unclear. Term may need rechecking against the 1956 text.

The general meta-caveat: where I prescribe a more-granular parameter
surface than the engine currently has, there's a risk that **artists
operating at flow don't carry that granularity in their head** — they may
treat "jaw shape" as one feeling-decision, not as `gonialAngle +
ramusHeight + mentalProtrusion + mentalWidth`. The pedagogy texts
*decompose* it that way; the working artist *recomposes* in three
seconds. So the engine needs both — the pedagogic parameter for
precision, and a "jaw silhouette preset" alias for fluency. I haven't
specified those aliases above; Fred should add them in passes 2-3 once
the underlying parameters are stable.

---

*Sources cited (full list, in order of first appearance):*
Loomis, *Drawing the Head and Hands* (Viking, 1956);
Choe & Ko, *A Statistical Wisp Model and Pseudophysical Approach for
Interactive Hairstyle Generation* (IEEE TVCG, 2005);
*Drawing Lessons from the Famous Artists School* (1961, the Reilly
restatement);
Hampton, *Figure Drawing: Design and Invention* (CRC Press, 2009);
Bridgman, *Constructive Anatomy* (Sterling, 1920);
Faigin, *The Artist's Complete Guide to Facial Expression*
(Watson-Guptill, 1990); Faigin, *The Artist's Complete Guide to Drawing
the Head* (Watson-Guptill, 2012);
Vilppu, *Drawing Manual* (Vilppu Studio, 1997);
Eisner, *Comics and Sequential Art* (Poorhouse, 1985);
Hayashi, *How to Draw Manga: Drawing Hairstyles* (Graphic-Sha, 1999);
Hogarth, *Drawing the Human Head* (Watson-Guptill, 1965);
Asaro head plaster cast pedagogy (1970s art-school tradition);
Mattesi, *Force: Dynamic Life Drawing for Animators* (Focal Press, 2006);
plus the project's own research files
(`hair.md`, `hair-pass-2.md`, `facial-hair.md`,
`primitives-nose-ears-neck-brows.md`) which carry deeper citation lists.
