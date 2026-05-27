# Hair Theory — physical grounding for the face-lib hair engine

*Hair-theorist pass. NOT pedagogy (Leo owns that — `hair.md`,
`hair-pass-2.md`, `hair-tooling.md`); NOT output critique (Pascal). This
doc answers WHY hair behaves the way it does so every knob in
`buildHair`/`hair-field.ts` can be defended as modelling a real force,
not a curve-fit. The user's complaint tonight: every face the engine
produces gets the same hairstyle. The cause is that the engine has a
vector field but no theory of why the field looks like that — every
parameter is post-hoc. Hard limit: 300 lines.*

---

## 1. Hair as a physical object

### 1.1 Shaft structure (only the parts that matter)

A hair shaft is a *bent beam* of keratin, three nested layers:

- **Medulla** — hollow core; thicker medulla = stiffer shaft (matters
  only in coarse hair).
- **Cortex** — ~90% of cross-section, load-bearing. Contains
  **disulfide bonds** (set the *permanent* curve — only perm/relaxer
  breaks them) and **hydrogen bonds** (reset every wash — why bedhead
  exists, why curl drops in humidity, why blow-drying "sets").
- **Cuticle** — overlapping scales pointing away from the scalp.
  Drives neighbour-friction and reflectance (the manga "highlight band"
  is real cuticle specular).

Behavioural model: **a rod with a baked-in resting curve (disulfide) +
a temporary deformation (hydrogen), pinned at the follicle, free at
the tip, under gravity, in contact with neighbours.** Enough for
everything downstream.

### 1.2 Cross-section vs curl pattern

Refs: De La Mettrie et al., *Human Hair Diversity Revisited* (Hum Biol
2007); Loussouarn et al., *Worldwide diversity of hair curliness* (Int
J Dermatol 2007); Andre Walker, *Andre Talks Hair!* (1997, the
canonical 4-type chart).

| Cross-section | Follicle shape | Curl | Walker |
|---|---|---|---|
| Round | Straight | Straight | 1 |
| Slight oval | Slightly bent | Wave | 2A–2C |
| Oval | Curved | Curl (helix) | 3A–3C |
| Ribbon-flat | Sharply curved (J/S-hook) | Coil (zigzag) | 4A–4C |

Round = bending-isotropic → hangs straight. Oval = preferred bending
axis → helix as it grows; flatter section = tighter helix. Ribbon-flat
shafts form near-180° hairpin turns producing **4B/4C coils** at
<1 mm curvature radius — physical **springs**, not waves. L'Oréal's
8-type system (Bertrand et al. 2007) refines this with curl-diameter
bins; Walker's 4 suffice **if we honour the discontinuity between type
3 and type 4** — see §5.

### 1.3 Follicle angle = "grain"

Every follicle emerges at 10°–60° to the scalp surface. The shaft
exits in a *direction*, not radially. This is the physical basis of the
user's word "grain" — the direction-field of resting hair on the scalp.

Grain regions, universal across populations (magnitude varies):

- **Crown whorl** — parietal vertex; follicles spiral around a point.
  One whorl in ~92% of heads. Topological singularity — hairy-ball
  theorem forces one on any closed surface. (Choe & Ko's "crown sink".)
- **Parting axis** — meridian where opposing grain regions meet. NOT
  fixed; styling can shift it ~3 cm. See §4.
- **Temple sweep** — forward + slightly down. Receding silhouettes
  curve inward, not vertically cut.
- **Nape descent** — down toward the spine.
- **Sideburn** — down + slightly forward, merges into beard.

### 1.4 What the shaft "knows"

Two memories: **structural** (disulfide + cross-section + follicle
angle — fixed for life) and **styling** (hydrogen + cuticle compression
— resets every wash, drifts over the day). Currently the engine
conflates them; the demographic preset sets BOTH, so the engine can
never render "same person, different styling-state." See §7 axis E.

---

## 2. Forces shaping hair

In rough magnitude order:

- **Gravity.** Dominates on long hair. Negligible on buzz. Near-zero
  on coily, where the **coil's spring constant exceeds gravity per
  unit mass** — why a 4C afro grows OUTWARD: each shaft pushes
  neighbours apart elastically.
- **Scalp constraint.** Every hair starts ON the scalp. First 1–3 cm
  follows the surface before mass takes over — why short hair (Caesar,
  buzz, undercut) always reads as a cap.
- **Neighbours (clumping).** Hairs are NOT independent. Sebum + water
  + product form capillary bridges → **clumps of 5–50 strands**. The
  clump is the physical unit; drawing N strands looks nothing like
  real hair, which is M clumps of N/M strands. Loomis/Vilppu/Hampton
  all flag this (`hair-tooling.md` §6 STOP #2).
- **Styling forces.** Cutting (length distribution), brushing (aligns
  along one direction, overrides grain), product (raises stiffness,
  locks against-gravity shapes), heat (re-forms hydrogen bonds in new
  shape). Where "hairstyle" actually comes from.
- **Wind / motion.** Ignorable for portraits; one direction-bias param
  is enough.

---

## 3. Grain — going with vs against

**Grain** = direction-field of hair on the scalp. Two sources:

- **Structural** — follicle angles. Fixed.
- **Imposed** — last brush direction, last sleep compression, product
  pass. Drifts; resets with washing.

**With the grain** → clump lies flat (kempt). **Against the grain** →
clump rises off the scalp (tousled, deliberate back-brush in
pompadour styling).

**Bedhead is NOT random.** It's **compression-set deformation**: 6
hours pressed into a pillow, the hair takes the contact-patch shape;
the hydrogen bonds reset there. Result is **regional with sharp
boundaries** — a flat patch, a raised patch, a cowlick where they
meet — NOT high-frequency uniform noise. An engine that implements
"messy" as global wobble jitter will look wrong because it lacks the
regional structure. **Cowlick** = local against-grain stubborn region,
often opposite the dominant whorl direction.

---

## 4. The parting

A parting is a **mechanical equilibrium**, not a chosen line: two
opposing grain regions meet along a curve, gravity pulls the boundary
down to the scalp, you see scalp through the gap.

Why the same head supports different partings on different days:

- Structural grain has a "natural part" — the meridian where follicle
  angle reverses sign. Often a few degrees off midline.
- Styling can override this for the day by brushing both sides away
  from a different meridian. **Unstable** — the natural part wants to
  reassert itself; styled partings drift back over hours unless held
  by product.
- A parting is **stable** when structural and imposed agree;
  **collapses** otherwise.

Engine consequence: a parting is a **continuous locus** on the scalp
where grain reverses. Not an enum. See §8 HT-2.

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

**The discontinuity is between 3 and 4.** Type 3 hangs (helix
structure visible in a falling silhouette). Type 4 doesn't hang (spring
constant > weight, mass radiates from the scalp). Same field-trace
engine can NOT produce both. This is the single most-misunderstood
fact in procedural hair — Leo flagged it pass-2. A "wave engine" (sine
on a falling polyline) handles 1–3 adequately and **fails** on 4
because (a) the geometry is wrong (halo not fall) and (b) the
silhouette is wrong (textured edge, not smooth dome).

---

## 6. Where comic art cheats and gets away with it

Every comic artist breaks hair physics. Working cheats preserve the
**right macro-signal** even when micro-truth is gone.

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

| # | Axis | Range | Discretisation (3–5 levels) | Engine mapping today |
|---|---|---|---|---|
| **A** | **Curl pattern** (cross-section + bond chemistry) | straight ↔ coil | `straight / wave / curl / coil` (4 — note 3→4 is discontinuous) | **Gap.** `clumpStroke` handles 1–3; nothing handles 4. |
| **B** | **Density** (hairs/cm²) | 50–250 | `sparse / normal / thick` × (uniform vs patterned thinning) | **Gap.** Scalar volume only; no density field. |
| **C** | **Length distribution** (uniform vs layered) | shaved → waist | `bald / buzz / short / medium / long / extra-long` × `uniform / layered` | `style` enum partial; no layering axis. |
| **D** | **Grain field** (follicle-angle map) | crown UV, parting locus, temple sweep, nape descent | crown UV (continuous), parting locus (continuous), temple sweep 0–1, nape descent 0–1 | `hair-field.ts` has crown sink + parting saddle. Temple sweep + nape descent missing as explicit field components. |
| **E** | **Styling state** (cut + brush + product) | unkempt → product-locked | `unstyled / brushed / product-held` (3) | **Gap entirely.** Conflated with structural grain. |
| **F** | **Effective weight** (mass vs spring) | gravity-dominated ↔ grain-dominated | derived from A+B+C; `gravityFactor` 0–1 | `gravity` field param top-level only. |

**Existing primitives → axes:**

- 5 silhouette knobs (templeRecession, sideFall, crownPeakX,
  napeExtension, edgeKind) → C, partial D (templeRecession encodes
  temple sweep), partial A (`edgeTextured` hints at coil).
- Cranial field → partial D, partial F.
- `clumpStroke` → A for types 1–3 only.
- perfect-freehand → render quality, orthogonal.

**Gaps, in order of how badly each kills demographic variety:**

1. **Axis A discontinuity** — no coil primitive. Coily hair cannot be
   represented honestly. Adding curl-amplitude to `clumpStroke` keeps
   it in the gravity-falling regime; it never becomes a halo. Need
   `coilCluster` / `haloSilhouette` (specced in `hair-pass-2.md` §1).
2. **Axis E entirely missing** — styling state. Same demographic + same
   curl + different `unstyled / brushed / product` should produce
   visibly different output. Currently the engine has one implicit
   "kempt" state → every face same hairstyle. **This is the direct
   cause of the user's complaint tonight.**
3. **Axis B density not a field** — no thinning pattern. Norwood-3
   recession cannot be represented by a scalar.
4. **Axis D incomplete** — temple sweep + nape descent are baked into
   silhouette modifiers; they should be additive field components so
   they participate in flow-line direction too.

**Acceptable engine cheats** (limits of the medium):

- 3D side-view fall — front portrait only; back-mass as silhouette
  extension is fine.
- Real-time wind — static `windAngle` cheat is enough.
- Per-strand physics — never needed; clumping is the real unit.

---

## 8. STOP-the-line flags

In addition to `hair-tooling.md` §6 / §8.5 (which still hold).

**HT-1.** Do NOT render coily (Walker 4A–4C) as a high-frequency wave
on `clumpStroke`. Different physical generator (§5) — spring constant
> gravity per unit mass; volume RADIATES from the scalp. Need a halo
primitive with edge texture, not modulated falling strands.
(Reinforces `hair-tooling.md` §6 STOP #7.)

**HT-2.** Do NOT model parting as an enum (`left/center/right`). It's
a **continuous locus on the scalp where grain reverses** (§4). Expose
`partingU` as continuous; render left/center/right as parameterisations,
not topology.

**HT-3.** Do NOT conflate structural grain (follicle) with imposed
grain (styling). A demographic preset chooses structural; a styling
preset should be ORTHOGONAL. If the same demographic always ships with
the same imposed grain, the engine has no expressive room — every face
of that demographic renders identically. **This is the user's complaint
tonight, expressed in physics.**

**HT-4.** Do NOT add bedhead / messy as global noise. Bedhead is
**regional with sharp boundaries** (§3): a flat patch, a raised
patch, a cowlick where they meet. Global wobble jitter looks like a
badly drawn shaft, not bedhead. "Messy" must be a per-region styling-
state override (3–5 scalp zones), not noise amplitude.

**HT-5.** Do NOT ship perfectly left-right symmetric silhouettes on any
preset claiming hair-not-hat. Real grain is asymmetric (whorl
direction, off-centre natural part, sleep compression on one side). A
5–10% break is enough — but bilateral symmetry reads procedural.
(`hair-tooling.md` §8.5 SS-6 already calls for asymmetric-capable
plumbing; this is the physical justification.)

**HT-6.** Do NOT treat density as a scalar. Real thinning is REGIONAL
(Norwood pattern: temples first, then crown, then connecting band).
A scalar `density` cannot produce a Norwood-3 silhouette. Expose
`densityField(uv) → 0..1` even if v1 only ships 4–5 named patterns
(uniform, temple-thin, crown-thin, combined-thin, full-thin).

**HT-7.** Do NOT make highlight a free-floating sticker. Cuticle
reflectance bends with the surface; the highlight must follow the
silhouette's curvature. An independent ellipse pasted onto any
silhouette reads procedural.

---

## Executive summary (for Fred)

1. **Curl-vs-coil is a discontinuity, not a slider.** Types 1–3 hang;
   type 4 radiates. They need different generators. Adding a halo /
   `coilCluster` primitive is the single biggest engine gap — without
   it no Black-canon hairstyle can be honest.

2. **Six axes carry all physical variation:** A curl pattern, B
   density (as a *field*, not scalar), C length distribution, D grain
   field (crown + parting + temple sweep + nape descent), E styling
   state (unstyled / brushed / product), F effective weight. The
   engine today covers C and partial D. A, B, E, F are gaps.

3. **Grain (user's word) is the on-scalp direction field of hair.** It
   has TWO sources — structural (follicle angle, permanent) and
   imposed (styling, daily). Conflating them is the direct cause of
   "every face gets the same hairstyle": one grain, not two.

4. **Parting is a continuous locus where grain reverses, not an enum.
   Density is a field, not a scalar. Curl is a regime with a
   discontinuity, not a continuous wave amplitude.** Treating any of
   these as small enums / single numbers ossifies the engine into one
   point in the cluster space.

5. **The "looks like a hat" failure has a physical cause.** Real hair
   always signals fibre via (a) edge cue (texture, wisp, asymmetry)
   OR (b) interior cue (parting, highlight, clump separator). A
   silhouette with neither reads as a solid surface. The Tintin-bar
   passes when at least one signal is present, ideally both.

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
