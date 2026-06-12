# Hair Theory — physical grounding for the face-lib hair engine

*Hair-theorist pass. NOT pedagogy (Leo: `hair.md`, `hair-pass-2.md`,
`hair-tooling.md`); NOT output critique (Pascal). This doc answers WHY
hair behaves as it does, so every knob in `buildHair`/`hair-field.ts`
defends as a real force, not a curve-fit. User's complaint tonight:
every face gets the same hairstyle. Cause: the engine has a vector
field but no theory of why the field looks like that — every parameter
is post-hoc.*

---

## 1. Hair as a physical object

### 1.1 Shaft structure (only the parts that matter)

A hair shaft is a *bent beam* of keratin, three layers: **medulla**
(hollow core; matters only in coarse hair); **cortex** (~90% of
cross-section, load-bearing — **disulfide bonds** set the *permanent*
curve, only perm/relaxer breaks them; **hydrogen bonds** reset every
wash, this is why bedhead exists, curl drops in humidity, blow-drying
"sets"); **cuticle** (overlapping scales pointing away from scalp —
drives neighbour-friction and reflectance; manga "highlight band" is
real cuticle specular). Model: **a rod with a baked-in resting curve
(disulfide) + a temporary deformation (hydrogen), pinned at the
follicle, free at the tip, under gravity, in contact with
neighbours.** Enough physics for everything downstream.

### 1.2 Cross-section vs curl pattern

Refs: De La Mettrie 2007 (Hum Biol); Loussouarn 2007 (Int J Dermatol);
Andre Walker 1997 (canonical 4-type chart).

| Cross-section | Follicle | Curl | Walker |
|---|---|---|---|
| Round | Straight | Straight | 1 |
| Slight oval | Slightly bent | Wave | 2A–2C |
| Oval | Curved | Curl (helix) | 3A–3C |
| Ribbon-flat | Sharply curved (J/S-hook) | Coil (zigzag) | 4A–4C |

Round = bending-isotropic → hangs straight. Oval = preferred bending
axis → helix as it grows; flatter = tighter helix. Ribbon-flat shafts
form near-180° hairpin turns producing **4B/4C coils** at <1 mm radius
— physical **springs**, not waves. L'Oréal's 8-type system (Bertrand
2007) refines this with curl-diameter bins; Walker's 4 suffice **if
we honour the discontinuity between type 3 and type 4** — see §5.

### 1.3 Follicle angle = "grain"

Every follicle emerges at 10°–60° to the scalp surface. The shaft
exits in a *direction*, not radially. This is the physical basis of the
user's word "grain" — the direction-field of resting hair on the scalp.

Grain regions, universal (magnitudes vary): **crown whorl** at the
parietal vertex (follicles spiral around a point; ~92% of heads have
one; topological singularity — hairy-ball theorem; this is Choe & Ko's
"crown sink"); **parting axis** (meridian where opposing grain regions
meet — NOT fixed, styling shifts it ~3 cm, see §4); **temple sweep**
(forward + slightly down; receding silhouettes curve inward, not
vertically cut); **nape descent** (down toward the spine);
**sideburn** (down + slightly forward, merges into beard).

### 1.4 What the shaft "knows"

Two memories: **structural** (disulfide + cross-section + follicle
angle — fixed) and **styling** (hydrogen + cuticle compression —
resets every wash, drifts daily). Engine conflates them — demographic
preset sets BOTH, so it can never render "same person, different
styling-state." See §7 axis E.

---

## 2. Forces shaping hair

In rough magnitude order:

- **Gravity.** Dominates on long hair. Negligible on buzz. Near-zero
  on coily — **coil's spring constant exceeds gravity per unit mass**
  → 4C afro grows OUTWARD, each shaft pushing neighbours apart.
- **Scalp constraint.** Every hair starts ON the scalp. First 1–3 cm
  follows the surface before mass takes over — why short hair (Caesar,
  buzz, undercut) always reads as a cap.
- **Neighbours (clumping).** Hairs are NOT independent. Sebum + water
  + product form capillary bridges → **clumps of 5–50 strands**. The
  clump is the physical unit; drawing N strands looks nothing like
  real hair, which is M clumps of N/M strands (`hair-tooling.md` §6
  STOP #2).
- **Styling forces.** Cutting (length distribution), brushing (aligns
  to one direction, overrides grain), product (raises stiffness, locks
  against-gravity shapes), heat (re-forms hydrogen bonds). Where
  "hairstyle" actually comes from.
- **Wind/motion.** Ignorable for portraits; one direction-bias param.

---

## 3. Grain — going with vs against

**Grain** = direction-field of hair on the scalp. Two sources:
**structural** (follicle angles, fixed) and **imposed** (last brush,
sleep compression, product — drifts, resets with washing). With the
grain → clump lies flat (kempt). Against → clump rises (tousled,
pompadour back-brush).

**Bedhead is NOT random.** It's **compression-set deformation** — 6 h
pressed into a pillow, hair takes the contact-patch shape; hydrogen
bonds reset there. Result is **regional with sharp boundaries** (flat
patch, raised patch, cowlick at the seam) — NOT uniform noise. "Messy"
implemented as global jitter looks wrong: it lacks regional structure.
**Cowlick** = local against-grain stubborn region, usually opposite
the dominant whorl.

---

## 4. The parting

A parting is **mechanical equilibrium**, not a chosen line: two
opposing grain regions meet along a curve, gravity pulls the boundary
to the scalp, you see scalp through the gap.

Why the same head supports different partings: structural grain has a
"natural part" (meridian where follicle angle reverses, usually a few
degrees off midline). Styling can override it by brushing both sides
away from a different meridian — **unstable**: natural reasserts;
styled partings drift back over hours unless held by product.
**Stable** when structural + imposed agree, **collapses** otherwise.

Engine consequence: parting = **continuous locus** on the scalp where
grain reverses. Not an enum. See §8 HT-2.

---

## 5. Curl mechanics

Cross-section sets resting curvature; bond chemistry sets whether it's
permanent (disulfide) or temporary (hydrogen). Five regimes:

| Regime | Curvature | Gravity behaviour | Engine generator |
|---|---|---|---|
| **Straight (1)** | ∞ | Hangs vertical | Polyline along grain + gravity tail |
| **Wave (2)** | 5–15 cm | Hangs with undulation | Polyline + lateral sine |
| **Curl (3)** | 1–5 cm helix | Hangs vertical, coiled; appears shorter | Polyline + helical perturbation |
| **Coil (4A–4B)** | 3–10 mm spring | DOES NOT HANG — radiates outward | **Different primitive**: halo silhouette + edge texture |
| **Kinky (4C)** | <3 mm zigzag | Densest halo, near-spherical | Same halo, higher edge amplitude |

**Discontinuity between 3 and 4.** Type 3 hangs (helix in a falling
silhouette). Type 4 doesn't (spring > weight, mass radiates from the
scalp). Same field-trace engine canNOT produce both. Most-
misunderstood fact in procedural hair — Leo flagged it pass-2. A wave
engine (sine on falling polyline) handles 1–3 and **fails** on 4
because (a) geometry is wrong (halo not fall) and (b) silhouette is
wrong (textured edge, not smooth dome).

---

## 6. Where comic art cheats and gets away with it

Every comic artist breaks hair physics. Working cheats preserve the
right macro-signal even when micro-truth is gone.

| Cheat | Preserved | Why it reads honest |
|---|---|---|
| Hergé smooth dome | Mass envelope + parting; forelock as temple-sweep escape | Silhouette carries structural grain |
| Manga highlight band | Cuticle reflectance on curved surface | One specular reads as a hundred |
| Toth clump strokes | Clumping (5–50 strand groups) | Clump IS the physical unit |
| Caniff hatching along the field | Grain direction | Hatch direction = grain field |
| Manga spike silhouette | Against-grain product styling | Real styling outcome |

**Cheats that fail** (the user's "shaved head colored brown"):

- Flat fill + no edge texture + no parting → reads as a HAT. No signal
  the surface is FIBROUS. Real hair always has an edge cue (texture,
  wisp, asymmetry) OR an interior cue (parting, highlight, clump
  separator). Neither present → brain reads smooth solid = skullcap.
- High-frequency uniform wave on a coily silhouette → reads as "wet
  bumpy texture" — the bumps lack OUTWARD RADIATION (no spring signal).
- Perfectly bilateral strokes → reads procedural. Real grain is never
  symmetric (off-centre natural part, dominant whorl, etc.).

Priority order: (1) silhouette indicates fibre, (2) grain visible
somewhere, (3) asymmetry coherent with the grain field, (4) shading
consistent with silhouette curvature. Preserving (1) AND (2) survives;
omitting both = hat.

---

## 7. Axes of physical variation (for the engine)

A hairstyle is a POINT in this space. Don't enumerate styles (Leo's
library work); enumerate the axes.

| # | Axis | Discretisation | Engine today |
|---|---|---|---|
| **A** | Curl pattern (cross-section + bonds) | `straight / wave / curl / coil` (4; 3→4 discontinuous) | **Gap.** `clumpStroke` does 1–3; nothing does 4. |
| **B** | Density (hairs/cm², ~50–250) | `sparse / normal / thick` × (uniform vs patterned thinning) | **Gap.** Scalar volume; no field. |
| **C** | Length distribution | `bald / buzz / short / medium / long / extra-long` × `uniform / layered` | `style` enum partial; no layering. |
| **D** | Grain field (follicle-angle map) | crown UV + parting locus (continuous), temple sweep + nape descent (0–1) | Crown sink + parting saddle present. Temple sweep / nape descent missing as explicit field components. |
| **E** | Styling state (cut + brush + product) | `unstyled / brushed / product-held` | **Gap entirely.** Conflated with structural grain. |
| **F** | Effective weight (mass vs spring) | `gravityFactor` 0–1, derived from A+B+C | `gravity` field param top-level only. |

**Existing primitives → axes:** 5 silhouette knobs → C, partial D
(templeRecession encodes temple sweep), partial A (`edgeTextured` hints
at coil). Cranial field → partial D, partial F. `clumpStroke` → A for
types 1–3 only. perfect-freehand → render quality, orthogonal.

**Gaps, ordered by demographic-variety impact:**

1. **Axis A discontinuity** — no coil primitive. Coily hair cannot be
   honest. Curl-amplitude on `clumpStroke` stays in the falling regime
   and never becomes a halo. Need `coilCluster` / `haloSilhouette`
   (specced in `hair-pass-2.md` §1).
2. **Axis E entirely missing** — styling state. Same demographic + same
   curl + different `unstyled / brushed / product` should differ
   visibly. Currently one implicit "kempt" state → every face the same.
   **This is the direct cause of the user's complaint tonight.**
3. **Axis B density not a field** — no Norwood pattern.
4. **Axis D incomplete** — temple sweep + nape descent are baked into
   silhouette modifiers; should be additive field components so they
   drive flow-line direction too.

**Acceptable engine cheats:** 3D side-view fall (front portrait only;
back-mass as silhouette extension); real-time wind (static `windAngle`);
per-strand physics (never needed — clumping IS the unit).

---

## 8. STOP-the-line flags

In addition to `hair-tooling.md` §6 / §8.5 (still hold).

- **HT-1. No coily-as-high-freq-wave on `clumpStroke`.** Different
  generator (§5) — spring > gravity, volume RADIATES. Need halo
  primitive with edge texture, not modulated falling strands.
  (Reinforces `hair-tooling.md` STOP #7.)
- **HT-2. No parting enum (left/center/right).** It's a **continuous
  locus where grain reverses** (§4). Expose `partingU` continuous;
  left/center/right are parameterisations, not topology.
- **HT-3. Don't conflate structural grain with imposed grain.**
  Demographic = structural; styling = imposed; ORTHOGONAL axes.
  Conflating them is the direct cause of every face looking identical.
  **This is the user's complaint tonight, expressed in physics.**
- **HT-4. No bedhead-as-global-noise.** Bedhead is **regional with
  sharp boundaries** (§3): flat patch, raised patch, cowlick at the
  seam. Global jitter looks like a bad shaft, not bedhead. "Messy"
  must be a per-region styling-state override (3–5 scalp zones).
- **HT-5. No perfect left-right symmetric silhouettes** on any preset
  claiming hair-not-hat. Real grain is asymmetric (whorl, off-centre
  natural part, sleep compression). 5–10% break is enough. Bilateral
  symmetry reads procedural. (`hair-tooling.md` §8.5 SS-6 already
  specs asymmetric-capable plumbing; this is its physical basis.)
- **HT-6. No scalar density.** Real thinning is REGIONAL (Norwood:
  temples first, then crown, then connecting band). Scalar can't make
  Norwood-3. Expose `densityField(uv) → 0..1`, even if v1 ships only
  4–5 named patterns.
- **HT-7. No free-floating highlight sticker.** Cuticle reflectance
  follows the surface; highlight must follow silhouette curvature. An
  independent ellipse pasted onto any silhouette reads procedural.

---

## Executive summary (for Fred)

1. **Curl-vs-coil is a discontinuity, not a slider.** Types 1–3 hang;
   type 4 radiates. Different generators. A halo / `coilCluster`
   primitive is the single biggest engine gap — without it no
   Black-canon style can be honest.

2. **Six axes carry all physical variation:** A curl pattern, B
   density (as a field, not scalar), C length distribution, D grain
   field (crown + parting + temple sweep + nape descent), E styling
   state (unstyled / brushed / product), F effective weight. Engine
   today covers C and partial D. A, B, E, F are gaps.

3. **Grain has TWO sources — structural (follicle, permanent) and
   imposed (styling, daily).** Conflating them is the direct cause of
   "every face gets the same hairstyle": one grain, not two.

4. **Parting is a continuous locus, density is a field, curl is a
   regime with a discontinuity.** Treating any of these as small enums
   or scalars ossifies the engine into one point in cluster space.

5. **"Looks like a hat" has a physical cause.** Real hair signals
   fibre via an edge cue (texture, wisp, asymmetry) OR an interior cue
   (parting, highlight, clump separator). Silhouette with neither
   reads as a solid surface. Tintin-bar passes when at least one
   signal is present, ideally both.

---

*Sources:* De La Mettrie et al., *Human Hair Diversity Revisited*, Hum
Biol 79(3), 2007. Loussouarn et al., *Worldwide diversity of hair
curliness*, Int J Dermatol 46 Suppl 1, 2007. Andre Walker, *Andre
Talks Hair!*, 1997 (4-type chart). Robbins, *Chemical and Physical
Behavior of Human Hair*, 5th ed., Springer 2012 (disulfide / hydrogen
bonds, ch. 3 + 9). Bertrand et al., L'Oréal 8-type classification, Br J
Dermatol 156, 2007. Norwood, *Male pattern baldness*, South Med J 68,
1975 (regional thinning). Choe & Ko, *Statistical Wisp Model*, IEEE
TVCG 11(2), 2005 (field math; cited from `hair.md`). Eisenberg & Guy,
*Hairy ball theorem proof*, Am Math Monthly 86, 1979. Black coily
canon as cited in `hair-pass-2.md` §1.
