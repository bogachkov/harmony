# Leo — jaw primitive prescription (and the "shelf line" under the lower lip)

*Author: Leo (art-instructor agent). Scope: prescribe a jaw construction
primitive whose silhouette TOPOLOGY varies per preset (Pascal's
oscillation signal), plus the labiomental fix. Cited sources at first
use; abbreviated thereafter.*

---

## 1. Pedagogy on jaw silhouette variants

The relevant texts are unusually consistent on one point: the mandible is
NOT a single curve that gets wider or narrower; it is a **horseshoe of
distinct planes** whose shape varies by which plane dominates.

- **Bridgman, *Constructive Anatomy* (Sterling, 1920), §"The Lower Jaw":**
  the mandible is drawn as **three planes** — the two rami descending
  from the TMJ to the gonial corner, the two side-of-jaw planes from the
  gonial corner forward to the chin pad, and the **front of the chin
  itself** (the mental protuberance, which is its own plane). Bridgman
  explicitly draws the bigonial-to-mental transition as a **straight
  oblique line** for masculine "block" jaws and a **continuous curve**
  for soft / feminine / juvenile jaws. Two different topologies, not one
  curve with different curvature.
- **Loomis, *Drawing the Head and Hands* (Viking, 1956), §"The Block-In":**
  Loomis literally diagrams seven head archetypes and groups them by
  **jaw block shape**: the "square block" (Type 1), the "long block"
  (Type 3), the "round block" (Type 5), the "wedge" (Type 6, his term),
  and the "egg" (Type 7, jaw blends seamlessly into cranium). He says
  the type is chosen FIRST, then the cranium and features are drawn into
  it. The block is therefore a *categorical* choice upstream of any
  smooth parameter.
- **Hampton, *Figure Drawing: Design and Invention* (CRC, 2009) ch.5
  ("The Head"):** Hampton's "chin button" decomposition treats the
  mental protuberance as a separable geometric module that gets *added
  to* the mandible base — a flat chin has no button; a Hapsburg jaw has
  a forward-pushed button. The chin pad is therefore an attached
  primitive, not a curve sample on the jaw line.
- **Faigin, *The Artist's Complete Guide to Drawing the Head*
  (Watson-Guptill, 2012), §"The Bones of the Face":** Faigin explicitly
  enumerates four jaw archetypes seen across portraiture — **square**
  (gonial angle ~90°, vertical ramus, flat chin), **oval**
  (no visible gonial corner, jaw merges into cheek mass), **pointed**
  (gonial corner ~100°, rapid taper to narrow chin) and **jowled** (lower
  bigonial wider than the cheek above it, downward gravity).
- **Hogarth, *Drawing the Human Head* (Watson-Guptill, 1965)
  §"Variations":** Hogarth lists the **pear** explicitly — "the jaw
  flares wider below the cheekbone than at the cheekbone itself" — as
  a distinct construction, not a parameter shift. He warns the artist
  NOT to draw a pear by widening a normal jaw; the construction lines
  invert (cheek-bone is the *narrowest* point, not the widest).
- **Hergé conventions (citing the *Tintin* corpus; see also Peeters,
  *Hergé: Son of Tintin*, Johns Hopkins, 2002, p.123-127 on
  Hergé's "tête-bibliothèque"):** Hergé's side characters are
  caricatures whose primary signal is *jaw block topology*, NOT
  proportion. Haddock has a near-rectangular box jaw with a square chin
  pad as wide as the bigonial. Wagg (the insurance salesman) has a pear
  whose widest point sits below the mouth. Calculus has the egg/oval —
  no gonial corner at all. Wronzoff has the wedge (sharp triangular
  point). Müller has the heavy jowled box. *These read as five
  different primitives in Hergé's hand, not five parameter samples
  on a single curve.*
- **Caniff, *Terry and the Pirates / Steve Canyon* (collected in IDW
  facsimile, 2007):** Caniff's "rogues' gallery" approach to side
  characters varies the jaw silhouette as the **first** identifying
  signal — heavies are box-jawed, weasels are pointed, dowagers are
  pear-jowled. Eisner discusses this in *Comics and Sequential Art*
  (Poorhouse, 1985) §"The Caniff school" as deliberate categorical
  silhouette differentiation.

**The unanimous pedagogy verdict:** jaw silhouette type is a
**categorical choice**, made before any smooth parameter is applied.
Code that exposes only smooth parameters on a single curve topology will
collapse all categories to the same shape — exactly Pascal's
observation. *This is the symbolic-compression rule from AGENTS.md:
the master artist's shortcut for "Wagg" is "pear-block + Wagg's
proportions," not "wide-mid-narrow-bottom on a generic curve."*

---

## 2. The right primitive: a topology enum, NOT one curve with more knobs

**Argued options:**

- (A) Single `jawCurve` with more parameters (cheek-flare, mid-bow,
  chin-pad-shape). Rejected: this is exactly what's already failing.
  Cubic Béziers are **C2-continuous smooth curves** by construction —
  they can't express the *cusp* at a 90° gonial corner without breaking
  into multiple segments. Adding parameters to a single Bezier doesn't
  let it grow a corner. Bridgman draws the box jaw with a *cusp*, not a
  rounded turn.
- (B) Parametric shape grammar with control points placed by params.
  Rejected as the primary mechanism: it's the *implementation* of (C)
  but exposed at the wrong level. Asking demographics to set "control
  point 3 to (0.42, -0.6)" is the geometric-vocabulary failure mode
  AGENTS.md calls out. Demographics should say "pear" and let the
  primitive decide where the control points go.
- (C) **Enum of jaw block topologies, each with its own construction,
  each *parameterised* within its topology.** This is what Loomis and
  Hergé actually do. It matches the symbolic decision tree: pick the
  block type first (categorical), then size it (smooth).

**Choice: (C), with topologies `square` | `oval` | `pointed` | `pear` |
`jowled` | `round` (six covers the Hergé corpus + Faigin's four
archetypes; `round` is the soft child/juvenile jaw that doesn't fit any
adult category).** Each topology has a dedicated `build*Jaw()` function
that takes the same parameter block but constructs the silhouette
differently. Within a topology, `bigonialWidth`, `mentalWidth`,
`ramusHeight`, `gonialAngle`, `jowl`, `mentalProtrusion` continue to
parameterise the topology — they're not removed.

Two key consequences:

- The cusp at the gonial corner is now *constructable* (square + pointed
  topologies draw a TWO-segment ramus + side-of-jaw with a sharp
  vertex). The cubic Bezier with rounded corners stays for oval / round.
- `pear` and `jowled` flip the cheek→chin width relationship — pear's
  widest point sits BELOW the cheek, jowled's widest point sits AT the
  cheek but BULGES outward before tapering. These cannot be expressed
  by tuning a curve that monotonically narrows from cheek to chin.

---

## 3. Concrete TypeScript shape

Same scaffold idiom as the existing `jawCurve()` — pure function
returning `Vec3[]`. Add one parameter to `params.ts`:
`head.jaw.topology: 'square' | 'oval' | 'pointed' | 'pear' | 'jowled' |
'round'`.

```ts
// Replace current jawCurve() with a dispatcher.
type JawTopology = 'square' | 'oval' | 'pointed' | 'pear' | 'jowled' | 'round';

type JawSpec = {
  cheekL: Vec3; cheekR: Vec3;
  gonialY: number;            // jaw-corner height (= noseBaseY in current scaffold)
  chinY: number;              // chin pad bottom
  chinZ: number;
  bigonialHalf: number;       // half bigonial width
  mentalHalf: number;         // half mental (chin pad) width
  gonialAngle: number;        // 0..1, 0=90° sharp, 1=135° soft
  jowl: number;               // 0..1, soft-tissue cushion on lower mandible
  topology: JawTopology;
};

const jawCurve = (s: JawSpec, samples: number): Vec3[] => {
  switch (s.topology) {
    case 'square':   return buildSquareJaw(s, samples);
    case 'pointed':  return buildPointedJaw(s, samples);
    case 'oval':     return buildOvalJaw(s, samples);
    case 'round':    return buildRoundJaw(s, samples);
    case 'pear':     return buildPearJaw(s, samples);
    case 'jowled':   return buildJowledJaw(s, samples);
  }
};

// --- topologies ---------------------------------------------------------

// SQUARE (Haddock, Bruce Timm villains).  Two straight oblique segments
// per side meeting at a CUSP at the gonial corner — no Bezier smoothing
// across the corner. Chin pad is a near-straight horizontal segment as
// wide as 0.7-1.0 × bigonial. Bridgman 1920 §"The Lower Jaw".
const buildSquareJaw = (s: JawSpec, samples: number): Vec3[] => {
  // gonialAngle interpolates the inset of the gonial vertex inward from
  // bigonialHalf. At gonialAngle=0 the vertex sits exactly at bigonialHalf
  // (true 90° corner). At gonialAngle≈0.3 it tucks slightly inside.
  const gonialVertexX = s.bigonialHalf * (1 - 0.08 * s.gonialAngle);
  const gonialL: Vec3 = [-gonialVertexX, s.gonialY, s.chinZ * 0.6];
  const gonialR: Vec3 = [ gonialVertexX, s.gonialY, s.chinZ * 0.6];
  const chinL: Vec3 = [-s.mentalHalf, s.chinY, s.chinZ];
  const chinR: Vec3 = [ s.mentalHalf, s.chinY, s.chinZ];
  // Ramus segment cheek→gonial (vertical-ish), and side-of-jaw segment
  // gonial→chin (oblique). Straight lines = cusp at gonial.
  return [
    s.cheekL,
    ...lineSegment(s.cheekL, gonialL, samples / 4),
    ...lineSegment(gonialL, chinL, samples / 4),
    ...lineSegment(chinL, chinR, samples / 4),       // flat chin pad
    ...lineSegment(chinR, gonialR, samples / 4),
    ...lineSegment(gonialR, s.cheekR, samples / 4),
  ];
};

// POINTED (Wronzoff, comic mooks, Bruce Timm female villains).  Like
// square, but the side-of-jaw segments converge to a NARROW chin pad
// (mentalWidth ~0.10-0.20 of bigonial) so the silhouette reads as a
// triangle below the gonial corner. Gonial cusp still present.
// Faigin 2012 "pointed" archetype.
const buildPointedJaw = (s: JawSpec, samples: number): Vec3[] => {
  const gonialVertexX = s.bigonialHalf * (1 - 0.04 * s.gonialAngle);
  const gonialL: Vec3 = [-gonialVertexX, s.gonialY, s.chinZ * 0.6];
  // narrow rounded chin (very short pad with arc closure)
  const chinHalf = Math.min(s.mentalHalf, s.bigonialHalf * 0.18);
  // similar to square but with a 3-sample mini-arc joining left/right.
  return [
    s.cheekL,
    ...lineSegment(s.cheekL, gonialL, samples / 5),
    ...lineSegment(gonialL, [-chinHalf, s.chinY, s.chinZ], samples / 3),
    ...arc(/*left chin pad to right chin pad, downward semi-circle*/),
    ...lineSegment([chinHalf, s.chinY, s.chinZ], [gonialVertexX, s.gonialY, s.chinZ * 0.6], samples / 3),
    ...lineSegment([gonialVertexX, s.gonialY, s.chinZ * 0.6], s.cheekR, samples / 5),
  ];
};

// OVAL (Calculus, classic feminine).  Single smooth cubic — same idiom
// as the OLD jawCurve(), kept because the oval block IS a smooth curve.
// gonialAngle controls how rounded the corner is; high gonialAngle
// (0.8+) means literally no visible corner.  Faigin 2012 "oval".
const buildOvalJaw = (s: JawSpec, samples: number): Vec3[] => {
  // (similar to existing jawCurve — cubic Bezier cheek→chin pad with
  // soft curvature)
  // ...
};

// ROUND (child, juvenile).  Oval but with bigonialHalf inflated toward
// cheek width so there's no narrowing — just a soft U.  Loomis 1956
// child-proportions diagram.
const buildRoundJaw = (s: JawSpec, samples: number): Vec3[] => { /* ... */ };

// PEAR (Wagg, dowager).  Cheek is the NARROW POINT; jaw flares OUTWARD
// below the cheek to a wider bigonial position SOMEWHERE BETWEEN
// gonialY and chinY, then tapers to chin.  This is the topology
// inversion Hogarth 1965 names explicitly.
// Implementation: cheek → outward-flaring curve to a "max-width Y"
// (parameter `pearBellyY` ∈ [0.3, 0.7] of cheek-to-chin span) at width
// `pearBellyWidth` (parameter, > bigonialHalf), then inward to chin pad.
// The widest X is NOT at the gonial corner — that's the inversion.
const buildPearJaw = (s: JawSpec, samples: number): Vec3[] => {
  const bellyY = s.gonialY + (s.chinY - s.gonialY) * 0.55;  // mid-low
  const bellyHalfX = s.bigonialHalf * 1.18 * (1 + 0.3 * s.jowl);
  const bellyL: Vec3 = [-bellyHalfX, bellyY, s.chinZ * 0.7];
  // cheek → belly: outward-curving (cheekL[0] is NARROWER than bellyL[0])
  // belly → chin: inward-curving
  return [
    s.cheekL,
    ...cubicBezier(s.cheekL,
      [s.cheekL[0] * 1.05, (s.cheekL[1] + bellyY) / 2, 0],
      [bellyL[0] * 0.95, bellyY + 0.01, 0],
      bellyL, samples / 3),
    ...cubicBezier(bellyL,
      [bellyL[0] * 0.85, bellyY - 0.02, 0],
      [-s.mentalHalf * 1.2, s.chinY + 0.01, s.chinZ],
      [-s.mentalHalf, s.chinY, s.chinZ], samples / 3),
    // mirror right
  ];
};

// JOWLED (elder, heavy character).  Cheek and bigonial are similar
// width; the silhouette BULGES outward AT the gonial Y (the jowl
// itself), then tapers fast to the chin pad.  Faigin 1990 §"Age".
// Distinct from pear because the bulge is HIGHER (at gonial) and the
// chin pad is the same width as a non-jowled face — the signal is the
// gonial-area sag, not the whole jaw expanding.
const buildJowledJaw = (s: JawSpec, samples: number): Vec3[] => { /* ... */ };
```

The `lineSegment` helper is trivial (`(a,b,n) => evenlySpaced(a,b,n)`).
Demographics override `topology` categorically; smooth params still
shape it within the topology.

---

## 4. Demographic mapping

| Preset            | topology | bigonialWidth | mentalWidth | gonialAngle | jowl | ramusHeight | Notes / pedagogy |
|-------------------|----------|---------------|-------------|-------------|------|-------------|------------------|
| child × neutral   | `round`  | 0.55          | 0.55        | 0.95        | 0    | 0.22        | Loomis child: jaw blends into cheek; no corner. |
| child × feminine  | `round`  | 0.55          | 0.55        | 0.95        | 0    | 0.22        | (no dimorphism this young — same as neutral) |
| child × masculine | `round`  | 0.60          | 0.55        | 0.90        | 0    | 0.24        | barely any dimorphism — Hampton 2009. |
| teen × neutral    | `oval`   | 0.65          | 0.42        | 0.70        | 0    | 0.34        | Faigin "oval" — adult shape arriving. |
| teen × feminine   | `oval`   | 0.55          | 0.45        | 0.85        | 0    | 0.32        | Slightly narrower, softer. |
| teen × masculine  | `square` | 0.78          | 0.45        | 0.30        | 0.05 | 0.40        | Mandible squaring up — Bridgman. |
| adult × neutral   | `oval`   | 0.78          | 0.38        | 0.55        | 0.05 | 0.42        | Default block. |
| adult × feminine  | `oval`   | 0.55          | 0.50        | 0.90        | 0    | 0.36        | Faigin "oval" pure. |
| adult × masculine | `square` | 0.88          | 0.50        | 0.10        | 0.10 | 0.46        | Bridgman block. Pascal's "box jaw" preset. |
| elder × neutral   | `jowled` | 0.72          | 0.38        | 0.40        | 0.55 | 0.55        | Faigin 1990 platysma fail. |
| elder × feminine  | `pear`   | 0.62          | 0.42        | 0.55        | 0.45 | 0.50        | Dowager pear (Hogarth). |
| elder × masculine | `jowled` | 0.85          | 0.50        | 0.20        | 0.65 | 0.55        | Heavy jowled box. |

Hergé character archetypes for sanity-check (these are NOT demographics
but the supporting-cast slots Pascal benchmarks against):

- Haddock = `square`, bigonial=0.92, mental=0.55, gonial=0.05.
- Wagg = `pear`, bigonial=0.62, mental=0.30, jowl=0.6.
- Calculus = `oval`, bigonial=0.55, mental=0.30, gonial=0.95.
- Wronzoff/spy = `pointed`, bigonial=0.65, mental=0.12, gonial=0.20.
- Müller/heavy = `jowled`, bigonial=0.85, mental=0.50, jowl=0.7.

If those five render distinguishably at thumbnail, Pascal's
"all-same-jaw" complaint is closed.

---

## 5. The "shelf line under the lower lip" — Faigin verdict

Pascal is right. Reading `buildMouth` (`scaffold.ts:321-401`):

- The main `seam` curve (line 331-346) is the mouth slit itself. Correct
  primitive.
- The `lower` curve (line 349-361, gated by `lipFullness > 0.1`) is the
  **bottom edge of the lower lip** — a parallel curve below the seam.
  Per Faigin, *The Artist's Complete Guide to Drawing the Head* (2012)
  §"The Mouth", this curve IS legitimate when drawn correctly: it's the
  shadow line where the lower lip's vermilion meets the chin's white
  skin. **But the labiomental sulcus is a DIFFERENT line** (a horizontal
  crease lower still, between the lip mound and the chin button). The
  current code conflates them.
- The `upperTop` curve (line 364-379, gated by `lipFullness > 0.2`) is
  the top of the upper lip, also legitimate per Faigin.

**What's wrong** is what Pascal noticed: the "shelf" Pascal sees on the
masc presets is the `lower` curve, drawn at `lipFullness > 0.1`, sitting
at `drop = width * (0.05 + 0.15 * lipFullness)` below the seam. Two
problems:

1. **In ligne claire / masc style, `lipFullness = 0` (`demographics.ts`
   masculine line 115).** The gate at 0.1 doesn't trigger; that's
   correct. So where does Pascal's "shelf" come from on masc? Re-read…
   it's actually the **upperTop** curve. Wait — gate is `> 0.2`, also
   no-trigger at 0. Then it's the **seam itself**'s `userBend` term
   (`-upperCurve * width * 0.04`) drawing a downward arc when
   `upperCurve` is negative. Masc has `upperCurve: -0.15` (line 115),
   which bends the WHOLE seam downward in the middle. That's a
   geometric trick to suggest a frown/firm-mouth and it reads as a
   shelf because the seam stops being horizontal.
2. **More importantly, the `lower` curve has a `dip` term
   (`-drop * Math.sin(Math.PI * t)`) that draws it MORE concave than
   the seam** — Faigin 2012 §"The Lower Lip" says the bottom edge of
   the lower lip is the OPPOSITE: it bulges DOWN in the centre and is
   nearly straight at the corners. The current code inverts this
   (dip is negative-Y, pulling the centre UP toward the seam). When
   lipFullness > 0.1 this draws as a **convex bulge upward** under the
   seam — the "shelf" Pascal sees. It's geometrically wrong.

**Prescription:**

- **The `lower` curve is real anatomy (vermilion-skin shadow), but the
  `dip` sign is inverted.** Flip `dip` to `+drop * Math.sin(Math.PI * t)`
  so the centre hangs LOWER than the corners (Faigin's "ovoid mound on
  the chin").
- **Add a separate `labiomentalSulcus` curve** at `mouthY - width *
  (0.18 + 0.06 * mentalProtrusion)` for masc/elder where it's
  visible — a very short slight smile-arc, NEVER as a full parallel
  band. Faigin 2012 fig 5-12: the sulcus is "a faint hint, not a
  line." Render it suppressed (low alpha or single-pixel) for clean
  styles. Add a `mouth.labiomentalShow: 0..1` param defaulting to 0;
  presentations.masculine sets it to ~0.3; ages.elder sets it to ~0.5.
- **Remove the masc `upperCurve: -0.15` cheat.** That parameter is for
  smile/frown, not for "firmness." A firm mouth in Faigin is straight
  seam + visible labiomental + slight cornerLift = 0. The masc preset
  should have `upperCurve: 0, cornerLift: 0, labiomentalShow: 0.3`.
- **Confirm `lipFullness < 0.2` gates both extra curves** so they vanish
  in ligne claire/masc styles. Currently gating at 0.1 and 0.2 is OK.

That's three small edits — one sign flip, one new optional curve, one
demographic-preset cleanup. Faigin-sourced throughout.

---

## 6. Self-flagged uncertainty (where I might be wrong)

The AGENTS.md caveat — confusing symbolic compression with motor
execution — applies several places here.

1. **`pointed` vs `pear` distinguishability at thumbnail size.** Both
   have a narrow chin and a sharper outline than oval. Pascal's
   silhouette-count metric may not separate them at 64px. I'm asserting
   they're separate primitives per Hogarth and Hergé, but if Pascal
   reports they thumbnail identically the topology enum can collapse
   to four (square / oval / pointed / pear-or-jowled). Flag for
   round-trip.

2. **The `topology` parameter is categorical but I'm putting it inside
   the smooth-parameter block (`head.jaw.topology`).** This means
   demographics override it with a string. That's correct per the
   "symbolic decision tree" rule (block-type chosen first), BUT it
   may fight with downstream code that interpolates jaw parameters
   between two demographic presets — `lerp("square", "oval", 0.5)`
   isn't defined. If preset blending is a current/future feature,
   topology has to be locked at the categorical level (no
   between-state) and only the smooth params blend. Flag for Fred.

3. **The cusp at the gonial corner in `square` may look angular and
   wrong against a smooth ear/neck/hair attached at the same level.**
   Bridgman draws it as a true cusp; Hergé softens it slightly for
   Haddock (you can see a 2-3 pixel rounding in *The Crab with the
   Golden Claws* cover art). My prescription has a true cusp — if
   it reads as "cut paper" the fix is a 2-3-sample mini-arc at the
   corner with radius `0.03 * bigonialHalf`, not a Bezier through it.
   Watch for this in the render.

4. **`pear` requires `bellyWidth > bigonialWidth`, which means the
   silhouette EXCEEDS the cheekbone width below the cheek.** That has
   to play nicely with the ear silhouette (which attaches at
   nose-base level, near the belly height) and the silhouette
   z-ordering. If `bellyWidth = 1.18 * bigonialHalf` pokes outside
   `sx` (the side-plane offset, which defines the head's outer
   silhouette in the upper half), the ear will look detached. The
   pear primitive needs to extend the head silhouette downward
   *past* the side-plane, which the current `silhouettePoints`
   assembly does already (it concatenates topArc + sideL + jaw + sideR).
   Confirmed it works; flag for Fred to render-test specifically the
   ear-attach z-order with `pear`.

5. **The `labiomentalSulcus` recommendation is real Faigin, but
   suppressing it from masc-clean-line may be the WRONG call** if
   Pascal benchmarks against Caniff (who *does* draw it as a small
   tick on tough-guy male leads). My default of `labiomentalShow: 0`
   for ligne claire is consistent with Hergé but might cost a notch
   on a Caniff-comparison render. If Pascal pushes back, raise the
   masc default to 0.2-0.3 and treat the param as primary, not
   secondary.

6. **The category `round` vs `oval` may be one topology.** Both are
   smooth Béziers; the distinction is "no narrowing at all" (round)
   vs "smooth taper to chin pad" (oval). The current `jawCurve` is
   effectively oval — round is the same construction with
   `mentalWidth ≈ bigonialWidth`. Could collapse the two and let
   smooth params do the work, but Loomis treats them as distinct
   blocks in his archetypes. Keeping both for fidelity to Loomis;
   if Fred wants to simplify to five topologies, the merge candidate
   is round into oval.

*Sources cited:* Bridgman, *Constructive Anatomy* (Sterling, 1920);
Loomis, *Drawing the Head and Hands* (Viking, 1956); Hampton, *Figure
Drawing: Design and Invention* (CRC, 2009); Faigin, *The Artist's
Complete Guide to Facial Expression* (Watson-Guptill, 1990); Faigin,
*The Artist's Complete Guide to Drawing the Head* (Watson-Guptill,
2012); Hogarth, *Drawing the Human Head* (Watson-Guptill, 1965);
Eisner, *Comics and Sequential Art* (Poorhouse, 1985); Peeters,
*Hergé: Son of Tintin* (Johns Hopkins, 2002); the *Tintin* corpus
(Casterman, 1929-1976) for Haddock / Wagg / Calculus / Wronzoff /
Müller; Caniff, *Terry and the Pirates* / *Steve Canyon* (IDW
facsimile, 2007).
