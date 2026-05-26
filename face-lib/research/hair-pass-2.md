# Hair Pass 2 — Texture, Cut, Style, Density, Cultural Convention, and Art-School Variety

*Companion to `hair.md`. Pass 1 covered one Western-realistic tradition
(Loomis cranial-field + falling clumps). That works for one art pack. It
silently fails for coily hair (volume expands outward, doesn't fall),
cornrows/braids (channels and ropes on the scalp, not strands), Timm/DCAU
(flat silhouette only), Hergé (no interior detail), Hanna-Barbera (blob),
and the spike-tip silhouettes of shounen manga. The engine needs more
primitives and an art-pack switch.*

## 1. The texture axis (coily is a different primitive)

| Texture | Geometry | Construction |
|---|---|---|
| Straight (Walker type 1) | Gravity-falling parallel strands | Pass-1 model |
| Wavy (2) | Sinusoidal modulation on strand axis | Pass-1 + lateral sine on clumpStroke |
| Curly (3) | Tight helices, hangs with frizz halo | Pass-1 + helical perturbation + halo silhouette offset |
| **Coily (4a-b)** | **Volume expands outward radially from scalp**; strands do not visibly fall | NEW: `coilCluster` — halo silhouette larger than cranium + bumpy edge + optional interior squiggles |
| **Kinky-coiled (4c)** | Tightest zigzag, low elongation, near-spherical halo | `coilCluster` with high edge amplitude + interior stipple |

**Coily hair pedagogy (Black-illustrated tradition).** Across **Kadir
Nelson** (*We Are the Ship*, 2008; *Heart and Soul*, 2011), **Bryan
Collier** (*Uptown*, 2000), **Vashti Harrison** (*Little Leaders*, 2017),
**Christian Robinson**, **Sergio Lopez** (oil-portrait demos and his
"painting Black hair" tutorials on YouTube), and **Robert Liu-Trujillo**
(robertliutrujillo.com children's-book hair tutorials), the consensus is:
draw the **halo outer shape first** — bigger than the cranium — then put
**texture on the edge, not strands inside**. Andre Walker's hair-typing
chart (1997, popularised via naturallycurly.com and OprahMag) is the
standard mapping from texture-type to geometry; the LOIS system is a more
granular alternative. (Specific tutorial titles cited from prior knowledge;
outbound fetch was sandboxed in this session so URLs not page-verified.)

facesjs `afro.svg`/`afro2.svg` (Apache-2.0) encode this exactly: one
closed path whose top edge has many small arc bumps, no internal strands.

## 2. Length & cut

| Cut | Behaviour | New primitive |
|---|---|---|
| Buzz / crop / pixie / bob / shoulder / long / waist+ | Different silhouette extents and back-mass length | Pass-1 OK + `hairBg` back-mass layer (see §5) |
| **Undercut** | Sharp horizontal cut-line midway on cranium; smooth top, shaved sides | `shaveBand(uMin, uMax)` |
| **Fade** | Skin-to-hair gradient | `fadeGradient(uStart, uEnd, profile)` |
| **Bowl** | Helmet silhouette, horizontal hairline | hairline-shape `bowl` |
| **Mohawk** | Shaved sides + central sagittal crest | `shaveBand` + `crestStrip` |

facesjs hard-codes "Short Fade" silhouettes into hair SVGs (see
`cornrows.svg`, `dreads.svg`); DiceBear `personas` exposes them as variants
(`fade`, `sideShave`, `halfShavedHead`, `bunUndercut`).

## 3. Style / arrangement

These don't change *what hair is*, only how it's organised:

| Style | Primitive |
|---|---|
| Flowing / brushed / slicked / mussed | clumpStroke params (pass-1) |
| **Spiky** | `spikeStrip` — top edge zig-zagged into triangle teeth (facesjs `spike.svg` is the canonical pattern: single closed path, top edge `M-L-L-L` triangle teeth from x=50 to x=350) |
| Single braid | `braidChain(spine3D, segmentCount, weave)` |
| Multiple braids / pigtails / twin-tail | array of `braidChain` |
| **Cornrows** | `cornrowChannel(uvA, uvB, width)` — channels following geodesics on the cranium, not falling strands (facesjs `cornrows.svg`: parallel vertical thin rectangles from hairline to crown) |
| Top/low/double bun | `bunDisk(uv, radius)` |
| Ponytail | `ponytailRope(rootUV, length, hang, taper)` |
| **Locs / dreadlocks** | `lockBundle(root, count, diameter, length, taper)` — rope cluster (facesjs `dreads.svg` = 3 paths: fade silhouette + ponytail back-mass + bumpy lock cluster) |
| Bantu knots | `bantuKnot(uv, radius)` array |

## 4. Density / condition

Independent of texture/cut/style. Pass-1's scalar `density` needs a
**spatial `densityField(uv) → 0..1`** that multiplies Poisson-disk clump
placement. The Norwood scale (1975, 7 stages) is the standard for male-
pattern balding; the engine should expose at least `temples`, `crown`, and
`combined` recession. Thinning = alpha modulation toward parting.

## 5. Cultural / gender convention

This is rendering convention, not biology. Long-flowing-as-feminine and
cropped-as-masculine is **Western 19th-20th-century portraiture
convention**; many cultures invert it (Sikh kesh, samurai chonmage, Maasai
warrior plaits, Lakota braids, Han topknots). The engine must NOT bake
gender into hair presets: use descriptive keys (`waistLength`,
`chignonBraid`, `cornrowedFade`), let prompts handle gender mapping.

Religious/cultural head-covers (hijab, turban, headwrap, patka) **occlude
hair** — they are a `headCover` accessory primitive, not a hair variant.
DiceBear `avataaars` ships `hijab` and `turban`; `open-peeps` ships
`hijab` and `turban`.

## 6. Schools of thought — technique deltas

Each school renders the same hair as a different graphic object. Each gets
an **art pack** that selects which primitives to invoke.

| School | Pedagogy | Technique | Primitives ON | Existing impl |
|---|---|---|---|---|
| **1. Realistic (Loomis, Vilppu, Hampton, Faigin)** | Loomis *Drawing the Head and Hands* (1956); Vilppu *Drawing Manual* (1997); Hampton (2009); Faigin (Watson-Guptill 2012) | Silhouette + cranial field + soft falling clumps + interior separators | All pass-1 | (covered in pass-1) |
| **2. Disney 2D (Davis, Keane)** | Stanchfield *Drawn to Life* (Focal Press 2009 vols 1-2) | Volumetric clumps + dark *shadow shapes* inside silhouette at 30-50% coverage; no hard outline | silhouette, cutoutShape (shadow), soft clumpStroke | Closest = DiceBear `big-smile` (CC-BY-4.0). Learn-from. |
| **3. Bruce Timm / DCAU** | Timm *Modern Masters #3* (TwoMorrows 2003); Dini/Kidd *Batman: Animated* (HarperCollins 1998) | Flat black silhouette + 0-2 white/skin cutout shapes; thick uniform stroke; single S-curve outline | flatSilhouette, cutoutShape; **no clumpStroke at all** | facesjs `parted.svg`/`short.svg` (Apache-2.0) close in spirit. Learn-from. |
| **4. Shoujo manga** | Hayashi *How to Draw Manga: Bishoujo* (Graphic-Sha 2000); Crilley *Mastering Manga* vol. 1 (IMPACT 2012) | Silhouette 1.5-2× cranium volume; long sweeping arcs; ONE large lens-/wedge-shaped highlight band; cat-eye fringe (3-5 wedge clumps with sharp tips) | silhouette, clumpStroke (sharp tip), highlightBand: wedge | makegirlsmoe (GPL-3.0 code, CC-BY-NC weights, **do not import**); vocabulary: `long_hair / short_hair / twin_tail / drill_hair / ponytail` |
| **5. Shounen manga** | Toriyama interviews (*Dragon Ball*); Naitoh *How to Draw Manga: Compiling Application & Practice* | Silhouette edge *is jagged* — encodes the spikes; 3-5 small wedge highlights at clump joins, not one band; sharp tip ends | silhouette, **spikeStrip**, multiple small highlightBands | facesjs `spike.svg`, `spike2-4.svg`, `juice.svg`, `high.svg`, `faux-hawk.svg`, `tall-fade.svg` (Apache-2.0). **Importable.** |
| **6. Hanna-Barbera** | Takamoto *My Life with a Thousand Characters* (Univ. Press Mississippi 2009); Mark Evanier *News from ME* blog | Single closed blob, no interior detail, sometimes one hair-flip curve | flatSilhouette only | facesjs `messy.svg`/`messy-short.svg`. Learn-from. |
| **7. Modern stylized (Adventure Time, Steven Universe, BoJack)** | Ward *Adventure Time* style guide (Cartoon Network 2010); Sugar *The Art of Steven Universe* (Abrams 2017); Hanawalt on BoJack | Radical shape simplification — semicircle, half-pill, blob with one notch. Often *no* outline | parametric geometric primitives | **DiceBear `notionists` — IMPORT** (CC0 1.0, Zoish, 64 variants, MIT code) |
| **8. Classical ink comics (Caniff, Toth, EC)** | *Art of Alex Toth* (IDW 2014); Caniff *Terry and the Pirates* dailies; Eisner *Comics and Sequential Art* (1985) | Silhouette + closed-shape highlight cutouts + **hatching following cranial field direction** | silhouette, cutoutShape, **hatchingField** | None open-source. Implement. |
| **9. Hergé / ligne claire** | Sterckx *Tintin and the World of Hergé* (Methuen 1988); Peeters *Hergé, Son of Tintin* (Johns Hopkins 2012); Joost Swarte coined the term (1977) | Single closed silhouette + one parting curve, zero interior; uniform line weight | flatSilhouette + partingCurve only — **subset of pass-1** | Implement by suppression. |
| **10. Black-illustrated coily tradition** | Nelson, Collier, Harrison, Robinson, Lopez, Liu-Trujillo (see §1) | Halo silhouette larger than cranium; texture on edge; interior flat or low-key; cornrows = parallel channels; locs = rope bundle; bantu = disc array | coilCluster, cornrowChannel, lockBundle, bantuKnot, edgeTexture, ponytailRope, fadeGradient | **DiceBear `open-peeps` — IMPORT** (CC0 1.0, Pablo Stanley) — ships `afro, longAfro, cornrows, cornrows2, dreads1, dreads2, twists, twists2, bantuKnots, flatTop, flatTopLong`; **facesjs (Apache-2.0)** ships `afro, afro2, cornrows, dreads, blowoutFade, curly, curly2, curly3, curlyFade1-2, crop-fade`. |

## 7. Library survey — license-verified (extracted from npm tarballs)

| Library | Code | **Design** | Hair variants | Verdict |
|---|---|---|---|---|
| `@dicebear/notionists` v9.4.2 | MIT | **CC0 1.0** (Zoish, heyzoish.gumroad.com/l/notionists) | 64: `variant01`-`variant63` + `hat` | **IMPORT** |
| `@dicebear/open-peeps` v9.4.2 | MIT | **CC0 1.0** (Pablo Stanley, openpeeps.com) | 48 incl. `afro, longAfro, bantuKnots, cornrows, cornrows2, dreads1-2, twists, twists2, flatTop, flatTopLong, pomp, mohawk, hijab, turban, bun, buns, longCurly, mediumBangs*, shaved1-3, short1-5, noHair1-3` | **IMPORT — best single source for diverse hair** |
| `@dicebear/lorelei` v9.4.2 | MIT | **CC0 1.0** (Lisa Wischofsky) | 48: `variant01`-`variant48` | **IMPORT** |
| `@dicebear/big-smile` v9.4.2 | MIT | **CC-BY-4.0** (Ashley Seo) | 13: `bangs, bowlCutHair, braids, bunHair, curlyBob, curlyShortHair, froBun, halfShavedHead, mohawk, shavedHead, shortHair, straightHair, wavyBob` | Import-with-attribution |
| `@dicebear/micah` v9.4.2 | MIT | **CC-BY-4.0** (Micah Lanier) | 8: `dannyPhantom, dougFunny, fonze, full, mrClean, mrT, pixie, turban` | Import-with-attribution |
| `@dicebear/personas` v9.4.2 | MIT | **CC-BY-4.0** (Draftbit) | 20 incl. `bald, balding, buzzcut, fade, sideShave, bunUndercut, curlyHighTop, pigtails, mohawk, extraLong, shortCombover, shortComboverChops` | Import-with-attribution |
| `@dicebear/croodles` v9.4.2 | MIT | **CC-BY-4.0** (vijay verma) | 29: `variant01`-`variant29` | Import-with-attribution |
| `@dicebear/big-ears` v9.4.2 | MIT | **CC-BY-4.0** (The Visual Team) | 40: `long01`-`long20`, `short01`-`short20` | Import-with-attribution |
| `@dicebear/avataaars` v9.4.2 | MIT | **"Free for personal and commercial use"** per avataaars.com — *not* CC-BY-4.0 (pass-1 was wrong) | 34 incl. `bigHair, bob, bun, curly, curvy, dreads01-02, fro, froBand, shaggy, shaggyMullet, shavedSides, theCaesar, hijab, turban` | Importable; prefer open-peeps (same designer, CC0) |
| `zengm-games/facesjs` | **Apache-2.0** for code + designs | (same) | 51 hair + 8 hairBg back-mass | **IMPORT (NOTICE file required)** |
| `fangpenlin/avataaars` original | MIT for code+design | (same) | 28 React components, 264×280 hand-traced | Importable; refit cost high |
| `makegirlsmoe_web` | GPL-3.0 code; **CC-BY-NC-2.0** weights | n/a (GAN) | 5 labels: `long_hair / short_hair / twin_tail / drill_hair / ponytail` | **Vocabulary only.** GPL infects MPL-2.0; NC blocks commercial. |
| Picrew | proprietary | per-creator | n/a | Observe layered structure only |
| Live2D Cubism | proprietary editor; **published parameter spec** | n/a | `ParamHairFront, ParamHairSide, ParamHairBack` family | Use as **front/side/back vocabulary** |

License files verified first-hand from extracted tarballs at
`/tmp/hair-research/dicebear-styles/{notionists,open-peeps,lorelei,big-smile,micah,personas,croodles,big-ears,avataaars}-9.4.2/package/LICENSE`.

**Pass-1 corrections.** (a) avataaars designs are not CC-BY-4.0; they're
"Free for personal and commercial use" (bespoke). (b) Pass-1 missed
**`open-peeps` is CC0 1.0 by Pablo Stanley** — same designer as
avataaars, more permissive — and should be the primary import. (c) Pass-1
missed the **facesjs two-layer front/back split** at `display.ts:286`
(`hairBg` behind body) and `display.ts:354` (`hair` over head). It
matches Live2D's `ParamHairFront/Side/Back` and should be the engine's
universal substrate.

## 8. Recommended engine architecture

### 8.1 Universal substrate (always present)

```
scaffold:
  cranium         ellipsoid (existing)
  crown_uv        radial origin
  hairline_curve  3D polyline, variants: straight/widowsPeak/mShape/receding/bowl
  parting_curve   3D polyline from crown forward (or none)
  scalp_mask      uv -> {shaved, faded, full}                          [NEW]
  front_region    uv subset (fringe)        [Live2D ParamHairFront]    [NEW]
  side_region     uv subset (above ear)     [Live2D ParamHairSide]     [NEW]
  back_region     uv subset (nape + falling)[Live2D ParamHairBack]     [NEW]
  growth_field    uv -> 2D vector (existing)
```

### 8.2 Primitive set (engine may invoke any subset)

1. `flatSilhouette(closedPath, fill, stroke)` — all schools
2. `cutoutShape(closedPath, fillColor)` — Timm, Caniff, EC, Disney highlight/shadow
3. `clumpStroke(rootUV, length, dir, taper, jitter)` — realistic, shoujo
4. `interiorSeparators(silhouette, field, density)` — realistic
5. `hatchingField(region, fieldDir, lineCount)` — Caniff, EC, Toth
6. `highlightBand(silhouette, kind, position)` — manga, shoujo
7. `spikeStrip(silhouette, teeth, depth, jitter)` — shounen, mohawk
8. `coilCluster(haloRadius, coilSize, density, edgeAmp)` — coily pack
9. `cornrowChannel(uvA, uvB, width)` — coily/braided pack
10. `braidChain(spine3D, segments, weave)` — braids
11. `lockBundle(root, count, diameter, length, taper)` — locs/dreads
12. `bantuKnot(uv, radius)` — bantu knots array
13. `bunDisk(uv, radius)` — buns/chignons
14. `ponytailRope(rootUV, length, hang, taper)` — ponytails
15. `edgeTexture(silhouette, scale, ampl)` — coily, shaggy, wispy
16. `shaveBand(uMin, uMax)` — undercut, mohawk sides
17. `fadeGradient(uStart, uEnd, profile)` — fades
18. `densityField(uv)` — thinning, balding-pattern

### 8.3 Per-art-pack overrides

| Pack | Primitives ON | Style notes |
|---|---|---|
| `realistic` (Loomis) | 1,3,4,6:none | soft taper, field-driven |
| `disney` | 1,2(shadow),3 soft | two-tone, often no outline |
| `dcau-timm` | 1,2 | thick uniform outline, **no** 3 |
| `shoujo` | 1,3 sharp,6:wedge | big highlight, long sweeps |
| `shounen` | 1,7,6:wedge*N | jagged silhouette, multi-highlight |
| `hannaBarbera` | 1 | one curve, no interior |
| `modernStylized` | parametric geom | notionists-import path |
| `caniffToth` | 1,2,5 | hatching follows field |
| `ligneClaire` | 1+partingCurve | uniform line, flat fill |
| `coilyTradition` | 8,9,11,12,14,15,17 | halo > cranium volume; texture on edge |

### 8.4 Named compositions (descriptive, gender-neutral)

`buzzCut, pixie, bobBlunt, shoulderLayered, longStraight, longWavy,
longCurly, afroFull, twa, twistOut, locsLong, cornrowsBackwards,
boxBraids, fulani, bantuKnots, topknot, chignon, ponytailHigh, twinTail,
drillHair, mohawkClassic, fauxhawk, undercut, fade, slickback,
comboverThinning, balding3/5/7`. Cornrows, fulani, bantu, locs, twa
appear as **first-class names**, not exotic variants of "afro".

### 8.5 Storage

Imported reference SVGs under `face-lib/assets/hair/{notionists,
openPeeps,facesjs}/` with a sibling `LICENSE` per directory. Apache-2.0
imports need a `NOTICE`.

## 9. Honesty / uncertainty

- **Tutorial citations in §1, §6** (Sergio Lopez YouTube, Robert
  Liu-Trujillo IG, Kadir Nelson/Bryan Collier/Vashti Harrison/Christian
  Robinson books, Sketchbook Skool natural-hair lessons, Bruce Timm
  Modern Masters #3, Stanchfield Drawn to Life, Crilley Mastering Manga,
  Hayashi How to Draw Manga: Bishoujo, Naitoh How to Draw Manga:
  Compiling, Hergé biographies by Sterckx and Peeters, Takamoto memoir,
  Adventure Time style guide, Eisner Comics and Sequential Art, Art of
  Alex Toth) are from prior knowledge — outbound web fetch was
  sandboxed in this session, so I could not page-verify specific section
  titles or URLs. The **technique consensus** across each cluster of
  sources is reliable; individual citations should be checked when the
  engine docs are written.
- **License verification IS first-hand** for all DiceBear styles and
  facesjs — read directly from extracted npm tarballs and the cloned
  facesjs repo. **Pass-1's avataaars license claim was wrong**; corrected
  above. **Pass-1 missed open-peeps's CC0 status entirely.**
- **facesjs two-layer front/back split IS first-hand** — read from
  `/tmp/hair-research/facesjs/src/display.ts:286,354` plus the
  `svgs/hairBg/` directory (8 back-mass variants).
- **Live2D parameter family** is the recommended-but-not-mandated naming
  per published Cubism parameter conventions; cited from prior
  knowledge.
- **Andre Walker hair-typing chart (1997)** is contested; used as a
  primitive-selector heuristic, not a biological claim.

## 10. Key existing-code paths

- `/home/user/harmony/face-lib/src/model/scaffold.ts:366` — `buildHair`
  (pass-1 target; expand with scalp_mask, front/side/back regions)
- `/home/user/harmony/face-lib/src/model/params.ts:55` — `hair` block
  (add `texture`, `pack`, `style`, `density.field`, `shave`, `halo`)
- `/home/user/harmony/face-lib/src/render/svg.ts` — must support layer
  ordering: hairBg (behind body) → body → head → hair (over head)
- `face-lib/assets/hair/openPeeps/` — new, CC0
- `face-lib/assets/hair/notionists/` — new, CC0
- `face-lib/assets/hair/facesjs/` — new, Apache-2.0 (NOTICE required)

## 11. One-paragraph summary

Three layers: a universal 3D **scaffold** (cranium, crown, hairline,
parting, scalp-mask, front/side/back regions, growth-field), a **primitive
library of ~18 geometric kinds** (silhouettes, clump strokes, hatching,
coil clusters, cornrow channels, braid chains, lock bundles, bantu knots,
buns, ponytails, edge-texture, shave-band, fade-gradient, density-field),
and an **art-pack** that chooses which primitives to invoke. Coily hair is
not a curlier wave — it has its own halo-radius-dominant primitive.
Braids and cornrows are channels/ropes on the scalp, not falling masses.
Strongest open-source imports are **DiceBear open-peeps** (CC0, 48
variants, broad texture coverage including afros/cornrows/locs/bantu
knots) and **DiceBear notionists** (CC0, 64 stylized variants).
**facesjs** (Apache-2.0) validates the engine's two-layer front/back hair
decomposition, which independently matches Live2D's
`ParamHairFront/Side/Back`.
