# Refactor research: nose, ears, neck, brows

*Source: research agent pass. Saved verbatim so it isn't lost. Cite when
applying pedagogy-rooted renames to these primitives.*

Cross-references: harmony parameters at
`/home/user/harmony/face-lib/src/model/params.ts` (lines 24-65), current
primitive implementations at
`/home/user/harmony/face-lib/src/model/scaffold.ts` (`buildNose` L168-244,
`buildEar` L328-365, `buildBrow` L144-166, `buildNeck` L847-875).
`RESEARCH.md` (line 1-20, 207-216) already commits the project to Loomis +
Faigin pedagogy, so naming should match that vocabulary.

## Nose

**Pedagogy.** Loomis (*Drawing the Head and Hands*, 1956) breaks the nose
into five planes: a **top/dorsum** (the bridge ridge or "keel"), two **side
planes** falling away from the dorsum, a **base** (the underplane tilting up
to meet the philtrum), two **wings/alae** (the fleshy nostril walls), and
the **septum** (central column dividing the nostrils). Bridgman
(*Constructive Anatomy*, 1920) reinforces this as a wedge sitting on the
maxilla. Cited in this repo's `RESEARCH.md §1`.

**Existing implementations.**

- **DiceBear `avataaars` `nose.ts`**
  (https://raw.githubusercontent.com/dicebear/dicebear/main/packages/%40dicebear/avataaars/src/components/nose.ts)
  — single `'default'` variant, hard-coded SVG path, no parameters. Trivial.
  **Learn-from only.**
- **DiceBear `lorelei` `nose.ts`** — 6 variants (`variant01`…`variant06`),
  each a raw SVG path string. Numeric naming carries zero semantic
  information; the artist chose shapes in Figma. **Learn-from only.**
- **DiceBear `personas` `nose.ts`** — 3 variants with semantic names:
  `mediumRound`, `smallRound`, `wrinkles`. Closest to pedagogy.
  **Emulate naming pattern.**
- **facesjs `svgs/nose/`** — 17 SVGs (`nose1`…`nose14`, `honker`,
  `pinocchio`, `small`); generator exposes `nose.id`, `nose.size` (numeric
  multiplier), `nose.flip` (boolean). Each SVG is a *single bezier path* —
  e.g. `nose1.svg` is one cubic `M170 390 C ...` describing the underside
  wiggle, no internal structure (no separate alae, no septum).
  **Learn-from.**

All four collapse the nose to "pick one of N drawings, scale it." None
expose pedagogically-named shape sliders. Harmony's current `buildNose`
already does more by drawing bridge + J-hook + nostrils separately; it just
needs its magic numbers (the `0.55`, `0.10`, `0.32`, `0.18`, `0.05` in lines
198-228) named.

**Recommended parameter set.** Replace
`length`/`width`/`bridgeVisible`/`showNostrils`/`style` with:

- `nose.keel` — length of dorsum from glabella to tip (head-height units),
  replaces `length`.
- `nose.bridgeShow` — 0…1 visibility/length of the bridge stroke (currently
  `bridgeVisible` boolean + the hidden `0.18` coefficient at L199).
- `nose.alarWidth` — width across the wings/nostrils (fraction of
  head.width), replaces `width`.
- `nose.tipPlane` — prominence of the tip / J-hook depth (currently the
  magic `0.10` at L219).
- `nose.basePlane` — vertical lift of the base plane meeting the philtrum
  (the `0.06` lift at L200, the `0.08` right-end lift at L220).
- `nose.septumShow` — 0…1 visibility of central septum line (new; currently
  absent).
- `nose.alarFlare` — nostril dash angle/length (the `0.11` at L228, `0.32`
  at L227).
- `nose.style` — keep as discrete enum `'planar' | 'minimal' | 'button'`
  (rename `'detailed'` → `'planar'` to match the pedagogy).

## Ears

**Pedagogy.** Loomis renders the ear as a flattened "C" shape on the side
of the cranium between the brow and the nose base, then articulates **helix**
(outer rim), **antihelix** (Y-shaped inner ridge), **tragus** (small flap
covering the canal), **antitragus**, **concha** (bowl), and **lobule**
(lobe). Bridgman calls it "a question mark with a comma" — the helix is the
question mark, the lobe is the comma. Cited in `RESEARCH.md §1`.

**Existing implementations.**

- **facesjs `svgs/ear/`** — only 3 SVGs (`ear1.svg`, `ear2.svg`, `ear3.svg`).
  `ear1.svg` is *one closed path*:
  `M43 13 C 43 13 23 3 13 3 C 3 3 3 23 3 33 C 3 43 6 53 16 63 C 26 73 43 53 43 53 L 43 13 Z`
  — pure outer silhouette, **no antihelix, no tragus, no lobe
  articulation**. Generator exposes `ear.id`, `ear.size`. **Learn-from.**
- **DiceBear `avataaars`** — *no ear component file at all*; ears are baked
  into the head SVG. **Don't emulate.**
- **DiceBear `lorelei`** — also no ear file (uses `earrings.ts` for
  jewelry only). **Don't emulate.**
- **DiceBear `big-ears`** style — has no semantic params; ears are part of
  `face.ts`. **Don't emulate.**

Across the surveyed libraries the ear is the *most* under-modeled primitive
— even more under-served than harmony's current `buildEar`, which already
separates outer + antihelix curl (L341-359). The opportunity is to expose
the anatomy the surveyed libs ignore.

**Recommended parameter set.** Replace `size`/`yOffset`/`protrusion` with:

- `ears.helixLength` — vertical extent of the outer rim (head-height units),
  replaces `size`.
- `ears.helixProtrusion` — how far the helix bulges from the side-plane
  (head-width units), replaces `protrusion`.
- `ears.lobeDrop` — how far the lobe extends below the helix bottom
  (currently absent — `buildEar` has a symmetric C; real ears drop a lobe).
- `ears.antihelixShow` — 0…1 strength of the inner curl curve (L350-359
  hard-codes this).
- `ears.tragusShow` — 0…1 visibility of a tiny tragus tick at the front
  (new).
- `ears.attachY` — vertical attach point on the head silhouette, replaces
  `yOffset`.
- `ears.tilt` — rotation; ears slope backward ~15° on real heads.
- `ears.visible` — keep as is.

## Neck

**Pedagogy.** Bridgman: the neck is a cylinder with a **V** notched into
its front by the two **sternocleidomastoid** (SCM) muscles converging from
behind the ears down to the sternal notch; behind, the **trapezius**
descends from the occipital ridge and flares out to the shoulders. Hampton
(*Figure Drawing: Design and Invention*) renders this as "cylinder + V in
front + trapezius wedge behind." Cited in `RESEARCH.md §1, §2b`.

**Existing implementations.**

- **facesjs** — no neck primitive; the head SVG ends at the jaw; body.svg
  starts at the shoulders, neck is implied in the gap. **Don't emulate.**
- **DiceBear avataaars / lorelei / personas** — no neck component; head
  ends at jaw, body/clothing.ts starts at shoulders. **Don't emulate.**
- Harmony's `buildNeck` (L847-875) is already ahead of every surveyed
  library — it draws two cubic-bezier curves easing outward from jaw anchors
  to a trapezius-wide base. The magic numbers `0.02`, `0.45`, `0.25`, `0.80`
  are unnamed easing controls.

The surveyed libs are unhelpful here because they all chop the figure at
the jaw. Pedagogy is the only honest source.

**Recommended parameter set.** Replace `width`/`length` with:

- `neck.length` — keep; visible neck length (head-height units).
- `neck.scmWidth` — width of the SCM cylinder under the jaw (fraction of
  head.width); replaces the implicit "top width" currently equal to
  jaw-anchor span.
- `neck.trapWidth` — trapezius flare at the base (fraction of head.width);
  current `width` literally.
- `neck.trapFlareStart` — where down the neck the trap starts flaring
  outward (0…1 of length); currently the unnamed `0.45`/`0.80` knees at
  L858-859.
- `neck.scmShow` — 0…1 visibility of the front V notch (the two SCMs as a
  faint pair of construction lines down to the sternal notch — new,
  currently absent).
- `neck.adamsApple` — small tick for the laryngeal prominence (head-height
  units, default 0; >0 reads male-coded — pedagogically a sexual dimorphism
  marker per Bridgman).
- `neck.visible` — keep.

## Brows

**Pedagogy.** The brow consists of a **bony brow ridge** (supraorbital
margin of the frontal bone) covered by the **supraorbital fat pad** and
topped by hair. Loomis describes its shape as following the curve of the
eye socket above the upper lid; Faigin (*The Artist's Complete Guide to
Facial Expression*, 1990) catalogs the brow's three expressive degrees of
freedom as **inner-end height** (raised inner = sad/pleading; lowered inner
= angry), **outer-end height** (raised outer = surprise), and **overall
arch**. Cited in `RESEARCH.md §1, §8`.

**Existing implementations.**

- **DiceBear `avataaars` `eyebrows.ts`** — *best pedagogical naming in the
  survey*: 13 variants including `angry`, `angryNatural`, `sadConcerned`,
  `sadConcernedNatural`, `raisedExcited`, `flatNatural`, `frownNatural`,
  `unibrowNatural`, `upDown`. The `Natural` suffix indicates a fuller
  (un-plucked) shape. Names match Faigin directly. **Emulate** these
  expressive labels as preset overrides on the parametric brow. Apache-2.0/
  MIT licensed in repo. **Import-compatible.**
- **DiceBear `lorelei` `eyebrows.ts`** — 13 unnamed `variantNN` variants.
  **Don't emulate.**
- **DiceBear `notionists` `brows.ts`** — 13 unnamed variants. **Don't
  emulate.**
- **facesjs `svgs/eyebrow/`** — 20 numeric + 10 `female` variants.
  `eyebrow1.svg` is a single filled bezier shape (not a stroked curve) —
  `<path d="M83 13 C 83 3 73 3 73 3 C 48 -2 17.46 8.36 3 18 ..."/>`.
  Generator exposes `eyebrow.id`, `eyebrow.angle` (degrees, numeric). The
  `angle` parameter maps directly to Faigin's inner-outer height tilt.
  **Emulate** the numeric `angle` knob.

Harmony's `buildBrow` (L144-166) is already parametric (innerOffsetY,
outerOffsetY, arch, thickness), and matches Faigin's three DoF. The work to
do is: (1) name the parameters in Faigin's vocabulary, (2) add the missing
`tilt`/`angle` shorthand that facesjs found useful, (3) define expression
presets (`angry`, `sad`, `raised`) that derive from the parametric form.

**Recommended parameter set.** Replace
`innerHeight`/`outerHeight`/`arch`/`thickness`/`spacing`/`length`/`yOffset`
with:

- `brows.ridgeY` — height above eyeline (the brow ridge baseline); replaces
  `yOffset`.
- `brows.innerLift` — Faigin's inner-end Δy; positive = sad/pleading,
  negative = angry.
- `brows.outerLift` — Faigin's outer-end Δy; positive = surprised.
- `brows.arch` — keep; mid-stroke curvature.
- `brows.tilt` — derived shorthand `(outerLift - innerLift)` exposed as
  angle (radians or degrees), matching facesjs `eyebrow.angle`; setter
  writes to inner/outer.
- `brows.length` — keep.
- `brows.spacing` — keep; distance from centerline at inner end.
- `brows.fullness` — replaces `thickness`; >0.5 reads as "natural"/un-
  plucked (DiceBear's `Natural` suffix), <0.3 reads as plucked/feminine.
- `brows.unibrow` — 0…1, fraction by which the inner ends meet across the
  centerline (new).

Expression presets in `presets/expressions.ts` then read:
`angry: { brows: { innerLift: -0.04, arch: 0.2 } }`,
`sad: { brows: { innerLift: +0.04 } }`, etc. — matching how Faigin
formulates expressions.

---

## License & import compatibility notes

- DiceBear is **MIT** — MPL-2.0-compatible for code imports, BUT the
  per-style packages (`@dicebear/avataaars` etc.) declare **CC BY 4.0** on
  the *artwork* (per Pablo Stanley's original Avataaars license) which means
  SVG path data needs attribution. Safe to read for pedagogy / naming; **do
  not paste raw SVG paths** into harmony without an attribution comment.
- facesjs is **MIT** — fully compatible; can copy code patterns.
- Open Peeps (`@dicebear/open-peeps`) artwork is **CC BY 4.0** (Pablo
  Stanley); same caveat as Avataaars.

For harmony's hand-drawn-3D-projected approach, the *naming* convention
from Avataaars eyebrows is the only directly portable artifact — everyone
else's primitives are either too shallow (single path) or too tied to flat
SVG composition to import wholesale.

## Files to edit when applying this refactor

- `/home/user/harmony/face-lib/src/model/params.ts` — rename fields per
  above (lines 24-65, plus matching defaults at 126-167).
- `/home/user/harmony/face-lib/src/model/scaffold.ts` — replace magic
  numbers in `buildNose` (L168-244), `buildEar` (L328-365), `buildBrow`
  (L144-166), `buildNeck` (L847-875) with named parameters; update call
  sites at L978, L1001-1011, L1042.
- `/home/user/harmony/face-lib/src/presets/expressions.ts` and
  `presets/demographics.ts` — update to use new parameter names; add
  Faigin brow presets.
