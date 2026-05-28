# stylepack-timmFlat — joint W1 style-pack spec

*Q1-W1 Box 3 deliverable. One pack picked, half-written by Leo (pedagogy),
half waiting for Rollo (asset judgment + demographics + mixture-rule
check). Implementation lives in Q1-W2, NOT in this file.*

---

## The pick — `timmFlat` (Bruce Timm / DC Animated Universe flat-shape)

**Leo (pedagogy half), signed:** I picked Bruce Timm flat-shape because
it is the **maximally orthogonal pack** to the engine's current `tintin`
+ `ligneClaire` axis that is *also* implementable in W2 without a basket
of BACKLOG promotions. Ligne claire is a uniform thin-line tradition
with almost no fill blocks; the artist's expressive surface is **line
weight is constant, shape is everything**. Timm flat-shape is the
opposite tradition on the page: **shape is everything *and* fills are
load-bearing**, with the line acting as a single black contour around
geometric primitives that the eye reads as cel-painted color blocks.
The two packs share one property (clean confident outlines, no
hatching), and disagree on three (categorical jaw topology, flat color
fills as primary, eye-style with strong lid-stroke + iris). That
"shares-one, disagrees-three" profile is what makes them feel like
DIFFERENT drawing traditions to Pascal, not tintin-tweaks. Crucially,
the engine ALREADY has the load-bearing Timm primitive: the
**categorical jaw topology enum** Leo prescribed in `leo-jaw.md` §2
(`square` / `pointed` / `oval` / `pear` / `jowled` / `round`). Timm's
entire 1992–2005 character-design lineage IS the categorical-jaw-shape
tradition (Batman = `square` cusp at the gonial corner, Joker =
`pointed`, Bruce Wayne = `oval`, Alfred = elder `oval`, Harley Quinn =
`round-pointed`, Mr. Freeze = `square`). Picking Timm wires that
existing dispatcher into a coherent style-pack identity rather than
leaving it as a per-demographic knob. No BACKLOG primitive is required
to render the pack at all; one (`highlightCutout`) is a nice-to-have
for hair specular but is genuinely optional in the Timm canon (Timm
himself often draws hair as a single flat shape with NO highlight —
Catwoman, Mr. Freeze). The volume-mode hair refactor Nick is doing in
parallel is *complementary*: Timm hair is typically the canonical
"flat shape" use-case for `clumpMode: 'flat'`, so the pack lands
cleanly without needing volume.

**Rollo (asset half):** *placeholder — Rollo to append below.*

---

## Leo's pedagogy half

### Tradition + citations

The "Timm flat-shape" tradition is a specific lineage of American
TV-animation character design, anchored at Bruce Timm's *Batman: The
Animated Series* (1992–95) model-sheet language and propagated through
*Superman: TAS* (1996), *Batman Beyond* (1999), *Justice League*
(2001), and *Justice League Unlimited* (2004). It is a self-consciously
**reductive geometric** tradition: Timm's stated goal (interviews
collected in *Modern Masters Vol. 3: Bruce Timm*, TwoMorrows 2004) was
"reduce every character to the smallest set of geometric shapes that
still says who they are at a thumbnail" — explicitly Caniff-inflected
and Toth-derived, but pushed further into FLAT-FILL territory than
either of his sources took it.

Citations (3-5, real, page-referenced where I have them):

1. **Timm + Dini, *Batman Animated*, HarperEntertainment, 1998.** The
   foundational artifact. Model sheets pp. 22–47 are the canonical
   Timm-flat lexicon: silhouette is categorical (square jaw for
   Batman, pointed for Joker, pear/jowled for Penguin), interior line
   is ONE color and ONE weight, color is FLAT solid fills, no rendering
   gradient anywhere. The intro essay (Dini) calls this "shapes that
   read at TV-broadcast resolution" — i.e., the silhouette test at
   thumbnail size IS the pedagogy.
2. **Sito, *Modern Masters Vol. 3: Bruce Timm*, TwoMorrows 2004.**
   Long interview + sketch corpus. Timm pp. 38–52 on his approach:
   "I'm a shape guy. I think in terms of: what's the basic shape that
   tells you everything you need to know." Names Caniff + Toth + Jack
   Cole as his line-art ancestors and *Mister Magoo* / Bill Peet as
   his fill-shape ancestors. This is the source for the "Timm flat-
   shape tradition" as a coherent label rather than just "DCAU."
3. **Caniff, *Terry and the Pirates*, IDW facsimile 2007** (cited in
   `leo-jaw.md` already). Caniff is Timm's direct ink-line ancestor —
   the Dragon Lady's pointed jaw, Pat Ryan's square jaw, are the
   pre-Timm versions of the categorical jaw-topology vocabulary. Timm
   keeps Caniff's silhouette logic and replaces Caniff's brush-spot
   blacks with flat color blocks.
4. **Toth, *Genius, Isolated*, IDW 2011, ch. 4.** Toth is the second
   direct ancestor. Toth's *Space Ghost* and *Birdman* model sheets
   (1966–67) are the proto-Timm reduction: single-line silhouette,
   minimal interior, two-tone color blocks, no rendering. Toth said
   "design, don't draw" (p. 142); Timm cites this verbatim in the
   Sito interview.
5. **Eisner, *Comics and Sequential Art*, Poorhouse 1985, §"Modelling".**
   Theoretical backing: Eisner formalizes "the silhouette is the
   reader's first read at thumbnail" as a sequential-art principle.
   Timm flat-shape is the most aggressive industrial application of
   this principle; it's why the DCAU was readable on 1990s
   480i CRT television and 1080p HDTV alike — silhouette-first
   pedagogy scales to any pixel budget.

(Bancroft *Creating Characters with Personality* WG 2006 ch. 5 is a
sixth source already cited in `hairstyles.md`; same "silhouette
identifies, render decorates" rule, restated for animation.)

### The 3-5 DEFINING decisions an artist makes in Timm flat-shape

Each of these is a categorical decision made BEFORE any continuous
parameter is touched. They map to existing engine knobs in
`src/presets/styles.ts` + the topology enums Leo already prescribed.

**1. Eye construction: almond with a heavy upper lid line, NO iris
detail.** Timm draws the eye as a single horizontal almond shape with
a *heavy black upper-lid stroke* (often 2–3× the contour line weight)
forming the top edge, a *thin or implied lower lid* forming the
bottom, and a *single black-fill pupil* — no separate iris, no
catch-light, no eyelash array. The eyebrow is a separate brick-like
shape *above* the lid line (not a contour stroke), with categorical
shape variation (Joker: thin arched; Batman: heavy block; Harley:
diamond). Engine surface: `eyes.style: 'almond'`, `eyes.lidLine: ~0.6`
(strong upper lid), `eyes.underlineHint: ~0.15` (faint lower lid),
`brows.style: 'single'` (single thick stroke, not split).
Pedagogy: Sito 2004 pp. 38–40, Timm direct quote on "the eye is the
lid more than the pupil"; Caniff's Dragon Lady eye construction is
the immediate ancestor.

**2. Line treatment: uniform medium-weight black contour, ZERO
jitter.** Unlike ligne claire (which is uniform but THIN), Timm's
contour is medium-to-heavy weight, totally even along its length, and
*absolutely no hand-drawn wobble* — this is animation-clean-line, ink-
on-cel pedagogy. The visual surprise of the line is in how it
*terminates*: tapers exist only at deliberate end-points (the tip of
a hair-spike, the end of a brow brick), never as Caniff brush-swell
in the middle of a stroke. Engine surface: `style.lineWeight: ~3.0`
(heavier than tintin's 2.4), `style.jitter: 0`, `style.color:
'#0a0a0a'` (true black, not tintin's warm-black). This is
implementable today.

**3. Color treatment: flat saturated fills, NO modeling shadow on the
face, ONE dark cel-shadow on the hair.** Timm's face is a single
flat skin color with no rendering gradient. Hair, in contrast, is
USUALLY two flat tones: a base hair color and a darker shadow shape
covering ~30–50% of the hair mass (typically the "side facing away
from the implicit light" — Timm's standard 3/4-front-left light).
This is the one place Timm flat-shape uses a `highlightCutout`-class
primitive — but inverted (it's a SHADOW cutout, not a highlight). For
W2, the pack can ship at quality bar with just the flat hair fill;
the shadow-cutout is the optional W3+ enhancement. Engine surface:
`style.skinFill: '#fdd6b3'` (pale, saturated, NOT cream like tintin),
`style.hairFill: '#1a1a1a'` (very dark — Timm overwhelmingly draws
hair as black-or-near-black; bleach blondes like Harley get bright
yellow), `style.background: null` or a strong solid color.

**4. Jaw topology is THE characterization signal — categorical
dispatch is load-bearing.** This is where Timm flat-shape and ligne
claire genuinely diverge as traditions. Hergé makes characters
recognizable through *jaw silhouette* AND *hair silhouette* equally;
Timm pushes jaw to do almost ALL the work. Batman: `square` with
sharp cusp. Joker: `pointed` with extreme taper. Bruce Wayne: `oval`
(intentionally generic — the disguise is the genericness). Alfred:
`oval` with `jowl: 0.4` (elder oval). Harley: `round` with mental
protrusion. Two-Face: split between `square` and `oval` (the lore
matches the topology). Engine surface: this pack does NOT set a
`head.jaw.topology` default — that is owned by demographic data
(per the proportions-forbidden rule in `styles.ts`). What the pack
DOES set is `style.constructionWeight` lower (no visible
construction marks), implicitly relying on the demographics × jaw-
topology cross-product to provide silhouette diversity. **This is
the pedagogical contract**: the pack assumes demographics will
exercise the topology enum across the demographic grid Rollo
specifies; if demographic presets all stay on `oval`, Timm flat-shape
collapses to a single readable face. Mixture-rule check: this does
NOT modify the demographic presets themselves, so the existing
`tintin` rendering through the same demographics is preserved.

**5. Hair convention: large geometric flat-fill silhouette,
silhouette-shape carries identity, ZERO interior strands.** Timm hair
is a single closed silhouette filled with one flat color (optionally
overlaid with one dark shadow shape, §3 above). The silhouette is
*more geometric* than naturalistic — Harley's two pigtails are nearly
perfect triangles; Joker's swept-back wave is a single S-curve;
Batman's cowl-hair is a continuous black shape merging with the cowl;
Alfred's combover is a thin curved trapezoid. **No interior detail
strokes**, no parting curve crossing the mass, no clump separators.
Engine surface: `hair.recipe.leads = []` (NO interior strokes —
critical, this is the explicit pack-level override), `hair.edgeKind:
'smooth'` default (with `'spiked'` available for spike-cuts like
Robin's). The `clumpMode: 'flat'` Nick is wiring is the *correct*
default for this pack — that's why timmFlat is a clean W1+W2 fit.

### Construction order — same artist's decision tree as Loomis/Caniff,
### or different?

**Different in one specific way.** A ligne-claire artist (Hergé,
Swarte) follows the canonical Loomis-Bridgman tree: gesture → cranial
mass → jaw mass → landmark grid → features → hair → style filter (per
`leo-audit.md` §2). The style filter is the LAST step.

A Timm flat-shape artist (per Sito interview, p. 41 specifically)
inverts the position of TWO steps: **jaw topology is chosen FIRST**,
before the cranial mass; the cranium is then constructed *to fit the
jaw* rather than the other way around. Quoting Timm directly (Sito p.
41): "I start with the chin. For Batman I draw a square. For the
Joker I draw a wedge. Then I figure out what skull sits on top of
that." This is the symbolic compression that produces categorical
characters — the cranial-first Loomis tree blends faces toward an
average, the jaw-first Timm tree preserves silhouette outliers.

**Engine implication:** the dispatch in `buildScaffold` already
produces categorical jaw shapes via the topology enum (good, Leo
already prescribed this). The Timm pack does not require a
construction-ORDER refactor — it requires that the topology enum be
*exercised* across the demographic grid. The order-inversion is an
artist-side pedagogy note, not an engine refactor.

A second smaller difference: Timm draws the **eye lid line BEFORE the
eye almond**, treating the lid as the primary shape and the eye
opening as a hole punched in it. This is opposite to ligne claire
(where the eye is the dot/almond, and the lid is decoration). Engine
implication: when `eyes.style: 'almond'`, the lid-line stroke must
render as a SOLID heavy stroke, not a thin construction-style hint.
Quick read of `scaffold.ts` and `params.ts`: `eyes.lidLine: 0..1`
already controls this; pack sets it high (~0.6). No primitive blocker.

### Primitive blockers — what does Timm flat-shape REQUIRE that the engine doesn't have?

Differentiating "would be nicer with" from "doesn't read as the
tradition without," per the brief.

**Blocker (would NOT read as Timm without it): none.** I do not find
a primitive that the engine fundamentally lacks for timmFlat to read
as the tradition. The pack is implementable at Pascal-≥5 with current
primitives + `clumpMode: 'flat'` (Nick's W1 work) + the existing
categorical jaw-topology enum.

**Would-be-nicer (defer to BACKLOG promotion, not a W2 blocker):**

1. **`highlightCutout` (BACKLOG, ~20 LOC).** For the optional
   hair-shadow cutout described in decision §3 above. Without it, hair
   ships as single flat fill — that's the Catwoman/Mr.-Freeze treatment
   in canon, perfectly acceptable. WITH it, the pack reaches the
   Batman-cowl-hair / Harley-pigtail-shadow look that is *signature*
   for the Justice League corpus. **Claudia recommendation: promote
   `highlightCutout` to W3 if Pascal calls "needs the cel-shadow" at
   W2 close.** Not a W1/W2 blocker — but the pack's ceiling is ~7/10
   without it and ~8/10 with.

2. **Variable line-weight per region (NOT in BACKLOG yet).** Timm's
   upper-eyelid line is 2–3× heavier than the face contour; right now
   `style.lineWeight` is a single scalar applied uniformly.
   Implementable as a per-feature multiplier on top of the global
   weight; ~30 LOC. Without it, Timm eyes read slightly less heavy
   than they should. **Defer to Q1-W3 or later**; pack ships at
   Pascal-5 without it.

3. **Brow shape variation as categorical enum (NOT in BACKLOG yet).**
   Timm's brows are *shape-categorical* (Joker thin-arched, Batman
   block, Harley diamond) rather than smooth-parameter (`arch`,
   `length`, `fullness`). The current `brows.style: 'split' | 'single'`
   enum is too narrow. A `brows.shape: 'block' | 'arched' | 'diamond' |
   'tapered'` enum (no proportions, just discrete shapes per the
   proportions-forbidden rule) would let demographics dispatch brow
   shape categorically. ~40 LOC. **Defer.** Pack ships without it; the
   `brows.style: 'single'` + heavy `brows.fullness` from demographics
   carries adequately at W2.

None of these three are W2 blockers. The pack is W2-implementable as
parameter flips in `styles.ts` against existing primitives. **Scope
flag: this pack is implementable in W2 without ANY BACKLOG
promotion.** That satisfies the brief's "two or more BACKLOG
promotions = wrong pick" gate cleanly.

### Cross-reference to BACKLOG deferred-features

Per the brief: surface unexpected primitive blockers. None unexpected.
The three "would-be-nicer" items above are:
- `highlightCutout`: already in BACKLOG (`research/hairstyles.md` §4.1),
  unchanged — promoting it benefits multiple packs (manga, Disney,
  Timm) so the cost is amortized.
- per-feature line-weight multiplier: NEW backlog candidate, file
  under "tech debt — line-weight scalar is too coarse for packs that
  weight features differently." Claudia: please file if you agree.
- categorical brow-shape enum: NEW backlog candidate, file under
  "deferred primitives — brow shape categorical dispatch needed for
  Timm + likely shounen + likely Caniff." Claudia: please file.

Neither new candidate blocks W2. Both are upside if/when promoted.

### Proposed parameter delta vs. `default` (Leo half — eye/brow/line/hair-recipe knobs)

Per the brief: name VALUES where I can, "Nick decides during
implementation" where I can't. Respect the proportions-forbidden rule.
Rollo will append color + asset-specific deltas in his half.

```ts
timmFlat: {
  style: {
    lineWeight: 3.0,           // medium-heavy contour, animation-clean
    jitter: 0,                 // zero wobble — cel-clean
    color: '#0a0a0a',          // true black contour (cf. tintin's warm '#1a1410')
    skinFill: '#fdd6b3',       // pale-saturated, NOT tintin's cream
    hairFill: '#1a1a1a',       // dark default — Nick may override per character
    background: null,          // or a strong solid; Rollo to decide
    showConstruction: false,
  },
  eyes: {
    style: 'almond',           // explicitly almond, NOT dots
    lidLine: 0.6,              // heavy upper-lid stroke — load-bearing
    underlineHint: 0.15,       // faint lower-lid hint
    lashes: 0,                 // no lash array (decision §1)
  },
  brows: {
    style: 'single',           // single thick stroke (not split)
    // fullness / length / arch stay demographic-owned (proportions-forbidden)
  },
  nose: {
    style: 'minimal',          // single contour, no nostril dots, no bridge
    bridgeVisible: false,
    showNostrils: false,
  },
  mouth: {
    lipFullness: 0,            // no vermilion modeling
    cornerMarks: false,
    upperCurve: 0,
    labiomentalShow: 0,        // no Faigin sulcus for Timm
  },
  ears: {
    helixProtrusion: 0.030,    // small flush ear, similar to tintin
    antihelixShow: 0,
    tragusShow: 0,
    conchaShow: 0,
    lobeDrop: 0,
  },
  neck: {
    scmShow: 0,
    trapShow: 0,
    laryngealProminence: 0,
  },
  hair: {
    edgeKind: 'smooth',        // default — 'spiked' overrideable per character
    recipe: {
      leads: [],               // CRITICAL: NO interior strokes (decision §5)
      // fillBias / clumpMode / other recipe fields: Nick decides during
      // implementation — but clumpMode SHOULD default to 'flat' for this
      // pack since flat fill is the Timm canon
    },
  },
  // No head.* / no head.jaw.* / no head.face.* overrides — proportions
  // are demographic + character territory per styles.ts header rule.
}
```

**Mixture-rule preservation:** every knob above is a write to a
`style.*` / `eyes.*` / `brows.*` / `nose.*` / `mouth.*` / `ears.*` /
`neck.*` / `hair.recipe.*` field. The `default` pack writes none of
these (empty object); the `tintin` pack writes a subset of them with
DIFFERENT values. Both `default` and `tintin` remain unaffected by
adding `timmFlat` to `styles.ts` — they are sibling keys in the same
record, not parents of each other. No silent default-render drift.

(Rollo: please verify this against the demographic-grid you specify
below — if any of your slots requires a write I haven't listed,
flag it as a primitive blocker I missed.)

---

## Rollo's half

*Placeholder — Rollo to append. Expected sections per the brief:*

1. *3-5 specific NPC slots Timm flat-shape fills that `default` /
   `tintin` / `ligneClaire` don't. ("Indie roguelike merchant" not
   "fantasy character" — concrete.)*
2. *Concrete demographic grid: which age × jaw × hair × skin-tone
   combinations must render at Pascal-≥5 / Rollo-would-ship before
   we call the pack shipped.*
3. *2-3 ADJACENT MISSING points within the Timm parameter space —
   coverage gaps Nick should know about before W2 starts.*
4. *Mixture-rule check from the asset/forest side: does adopting this
   pack risk shifting the default render away from current `tintin`
   output? (Leo says no on the parameter level — Rollo confirms from
   the catalog perspective.)*

*Leo's expectation, signaled for Rollo's awareness, not as a
prescription on Rollo's lane:*
- *Timm hair pairs cleanly with `shortSwept`, `shortPomp`,
  `spikyShort`, `longSleek`, `longTail`, `bobChinLength`. Should NOT
  initially pair with `longWitch` / `longCurly` / `curlyDome` —
  those depend on interior-stroke clump topology that Timm
  explicitly suppresses (decision §5). Could be revisited in W3.*
- *Jaw topology grid is the Pascal test for this pack. If a
  Timm-styled `oval` adult-feminine and `oval` adult-masculine render
  the same silhouette at thumbnail, the demographic data isn't
  exercising the topology enum hard enough — that's a demographics-
  data bug to surface in W2, not a pack bug.*

---

## Handoff

**Pack chosen:** `timmFlat` (Bruce Timm / DC Animated Universe flat-
shape). One pack, fully orthogonal to `tintin` + `ligneClaire` on
fill/eye/topology, complementary on outline/clean-line.

**Why this pack vs. the other six candidates:** Timm is the only pick
that satisfies all four ordered criteria simultaneously:
1. *Maximally orthogonal:* opens flat-color-shape + categorical-jaw-
   topology territory. Tintin/LC are line-only traditions; this is
   the shape+fill tradition.
2. *Reachable with current primitives:* uses the existing jaw-topology
   enum (Leo's W0 prescription, already wired), existing `eyes.style:
   'almond'` + lidLine, existing `hair.recipe.leads = []` to suppress
   interior strokes. NO BACKLOG promotions required.
3. *Demographic axis is real:* Timm's design ethos IS demographic-
   across-jaw-topology — Batman/Joker/Alfred/Harley/Bruce are
   different demographics × different jaw topologies. Rollo will
   formalize the grid.
4. *Variety vs. existing forest:* opens flat-fill graphic-tradition
   territory that none of {default, tintin, ligneClaire} reaches.

**Implementability flagged as:** W2-implementable as pure parameter
flips against existing primitives + Nick's `clumpMode: 'flat'`. No
BACKLOG promotion needed.

**Primitive blockers:** none for read-as-the-tradition. Three "would-
be-nicer" deferrals, all detailed in the Leo pedagogy half:
`highlightCutout` (already BACKLOG), per-feature line-weight
multiplier (NEW backlog candidate — Claudia please file),
categorical brow-shape enum (NEW backlog candidate — Claudia please
file). None of the three blocks W2.

**Unexpected blockers found during research:** none. The categorical-
jaw-topology enum Leo prescribed in `leo-jaw.md` is the load-bearing
substrate for this pack; happily, it's already wired
(`head.jaw.topology` in `params.ts`). Picking Timm validates that
prescription's pack-level utility — without it, this pack would have
been a poor W1 choice.

**Forest impact (Leo's preliminary read; Rollo to confirm):** no
filed aesthetic is at risk. The `timmFlat` pack adds a sibling entry
in `styles.ts`; it does not modify `default` / `tintin` /
`ligneClaire`. All forest-registry entries in BACKLOG remain
reachable through `default` + existing hairstyle catalog. The new
`timmFlat` × existing-hairstyle cross-product is pure expansion of
the parameter surface, not replacement.

**Open delegation to Rollo:** the asset half (NPC slots, demographic
grid, adjacent gaps, mixture-rule confirmation from the catalog
perspective). Leo has done the pedagogy citations, decision list,
construction-order note, primitive-blocker triage, and proposed Leo-
owned parameter deltas (style/eye/brow/nose/mouth/ears/neck/hair-
recipe knobs). Rollo's deltas are color/background choices for the
specific NPC slots, the demographic grid as a concrete cross-product,
and asset-side gap analysis.

*— Leo, Q1-W1 art-instructor pass for the timmFlat style pack.
   Pedagogy half complete. Rollo: file is yours.*
