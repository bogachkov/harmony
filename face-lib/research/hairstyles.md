# Hairstyles — composition as a first-class primitive

*Leo's pass on "hairstyle vs. hair texture vs. hair length", and how the engine
should encode the distinction. Background: passes 1–4 in `hair.md`,
`hair-pass-2.md`, and `hair-tooling.md` named the primitive vocabulary
(massSilhouette / partingCurve / clumpStroke / highlightCutout /
spikeStrip / edgeTexture) and wired three of them. The wiring works
mechanically, but `buildHair` hardcodes ONE composition recipe (parting +
right flow flick + left flow flick) for every parted head. Result: 6
silhouette shapes, 1 hairstyle. Every face gets Franky's pompadour. The
user is correct.*

---

## 1. What IS a hairstyle, pedagogically?

The illustrator's checklist when faced with "draw character X" is roughly
this, drawn from Loomis 1956 ch. "Hair", Hampton 2009 ch. 7, Faigin 2012
ch. 9, Hayashi 2000 §2, and the model-sheet conventions documented in
Bancroft *Creating Characters with Personality* (Watson-Guptill 2006):

```
1. Length band     — cropped / short / chin / shoulder / long / very long.
                      Hard knob; few intermediates matter.
2. Mass distribution
   ├─ Where does the volume PEAK?         (front / crown / sides / nape / even)
   ├─ Where does the volume FALL?         (sides / nape / forehead / nowhere)
   └─ Where is the volume CUT OFF?        (above ear / at jaw / at shoulder / past shoulder)
3. Parting topology — none / centre / off-centre / deep side / no part (swept back).
                      This is a discrete choice. A wavy bob and a straight bob
                      with the same parting are the same hairstyle.
4. Fringe / forelock behaviour
   ├─ No fringe (forehead exposed, swept back)
   ├─ Even fringe (Charlie Brown, Asterix)
   ├─ Asymmetric forelock (Sanji, Tintin quiff, shoujo curtain)
   ├─ Wedge / spike fringe (shounen)
   └─ Covered (Cousin Itt — out of scope)
5. Symmetry — bilateral or asymmetric. Set IN the silhouette, not as decoration.
6. Texture (orthogonal!) — straight / wavy / curly / coily.
   Texture changes EDGE BEHAVIOUR of the silhouette and stroke wobble; it
   does NOT change the hairstyle category.
7. Colour (orthogonal). Same role as texture — it never changes which
   hairstyle a character has.
```

**The line between "same hairstyle in two textures" and "two hairstyles":**

- A bob (chin-length, even cut, no fringe or even fringe) drawn straight
  and drawn wavy is the **same hairstyle** — both are "bob". Items 1–5
  match; only item 6 differs.
- A bob and a pixie are **two hairstyles** — length band differs (1)
  AND mass distribution differs (2: bob falls past temples; pixie does
  not).
- Sanji and Zoro are **two hairstyles** — fringe behaviour differs (4),
  symmetry differs (5), parting differs (3). Sanji could be drawn with
  any hair colour or texture and still be "Sanji's hairstyle".

This is the pedagogy's load-bearing observation: **hairstyle is the
discrete composition of items 1–5; texture/colour are continuous
modifiers that ride on top.** Comic illustrators (Toriyama in the
Daizenshuu interviews, Oda in the *One Piece Color Walk* commentary,
Toth in *Genius, Isolated*) talk about "hairstyle" and "hair colour" and
"hair texture" as three independent decision groups. We should too.

**Sourcing for the decomposition:**

- Loomis 1956 plate 38 ("hair masses") — length band + mass distribution
  + fringe as three independent axes; he literally draws the same head
  with four different hair masses.
- Hampton 2009 fig. 7-12 — silhouette-first hair construction, parting
  as a separate decision after the silhouette is committed.
- Faigin 2012 ch. 9 §"Hair as Mass" — explicitly: "the SHAPE of the hair
  is what makes a character recognizable. The texture is decoration."
- Bancroft 2006 ch. 5 — animation character-design rule: silhouette
  identifies the character; render identifies the world. A hairstyle
  must read at thumbnail; texture is a near-field detail.
- Hayashi *How to Draw Manga: Bishoujo* 2000 §2 — explicitly factors
  hairstyle as "length × parting × fringe wedge count × side curtain
  presence," with texture and colour as separate chapters.
- DiceBear's `big-ears` and `avataaars` "hair" enumerations (verified
  Nov 2026, MIT and CC-0 respectively) — both factor into ~25 named
  hairstyles, all defined as silhouette compositions; texture and
  colour are independent enums. They had to solve this same factoring
  problem to make their preset surface tractable; their answer matches
  the comic-art pedagogy answer.

---

## 2. Where does "hairstyle" live in the cascade?

Current cascade: `defaults → style → presentation → age → expression →
character → overrides`.

`p.hair.style` is currently `'none' | 'short' | 'medium' | 'long' |
'bald'` — a LENGTH band (item 1 above), not a hairstyle. The five
silhouette knobs Fred wired (templeRecession, sideFall, crownPeakX,
napeExtension, edgeKind) cover items 2 and 5 partially. Items 3 and 4
(parting topology, fringe behaviour) are HARDCODED in `buildHair`.

**Three options, evaluated:**

| Option | What it means | Tradeoff |
|---|---|---|
| **A. Enum extension on `p.hair.style`** — add `'sanji', 'bob', ...` | Cheap; one new file. | Tangles length with style. A "bob" *implies* chin-length, but "sanji" is forelock+swept; the enum would have to encode every combination. Combinatorial explosion. Reject. |
| **B. New preset axis `hairstyle` in the cascade** | `composeFace({ age, presentation, hairstyle: 'bob', ... })`. Layered between presentation and age, OR above presentation so it survives the demographic. | Clean signature. Survives demographic by default. But: where exactly? Above presentation = "Sanji's hair on a feminine demographic" works; below = demographic wins. We want above-presentation: hairstyle is the user's primary identity choice. |
| **C. Data-only registry in `src/hairstyles/*.ts`, parallel to `src/characters/*.ts`** | Each file is a `DeepPartial<FaceParams>` like `characters/haddock.ts`; engine doesn't know names. | No engine special-cases. Same pattern Fred already validated for characters. Naturally composable with overrides. |

**Recommended: B + C combined.** A first-class registry in
`src/hairstyles/*.ts` (data-only files, each exporting a
`DeepPartial<FaceParams>`), surfaced through the cascade as a new
optional `hairstyle?: HairstyleName` arg on `composeFace`. Slot it
**above presentation** in the cascade — so the order is:

```
defaults → style → hairstyle → presentation → age → expression → character → overrides
```

Rationale: a hairstyle is a chosen identity (a Sanji is a Sanji
regardless of demographic). Presentation/age then tune the demographic
shading; demographic must NOT silently replace the hairstyle (which it
would if hairstyle sat *below* presentation). Character files at the end
can still pin a hairstyle for that character — Haddock's character file
can set `hairstyle: 'shortReceding'` if/when we ever un-park him.

**Why not C alone:** without the cascade slot, a hairstyle would have
to be passed as `overrides` and would compete with character overrides
for last-write-wins. Naming it as a first-class arg is one line of API
surface and removes the ambiguity.

**STOP-flag:** the existing enum `p.hair.style: 'none' | 'short' |
'medium' | 'long' | 'bald'` STAYS. It is the *length band* (axis 1
above). A hairstyle file can set it (`shortReceding` sets
`hair.style = 'short'`), but the enum is not where styles live. Do not
extend the enum.

---

## 3. The catalog — minimum viable hairstyle set

Target: 8–12 hairstyles covering the variety axes the user named
(short/medium/long, masculine/feminine/neutral, parted/not,
asymmetric/symmetric, dome/spike/curtain, with/without fringe).
Mohawk explicitly skipped per user directive.

For each: silhouette knob tuple (the 5 Fred wired), parting topology,
fringe / characterization recipe, comic reference. Colour is
NOT specified — these are silhouette+composition presets only.

| # | Name | Length | Knobs (`templeRecession / sideFall / crownPeakX / napeExtension / edgeKind`) | Parting | Fringe / interior | Comic ref |
|---|---|---|---|---|---|---|
| 1 | `shortSwept` | short | `0.30 / 0 / +0.15 / 0 / smooth` | off-centre L | one R-flick at silhouette edge | Tintin (Hergé), Steve Rogers civvies |
| 2 | `shortReceding` | short | `0.85 / 0 / −0.05 / 0 / smooth` | none | none (bald-adjacent front) | mature Caniff men, elder Hergé characters |
| 3 | `shortPompadour` | short | `0 / 0 / +0.30 / 0 / smooth` | none (swept back) | one upward flow stroke from forehead | Franky (One Piece), 50s greaser, Johnny Bravo |
| 4 | `spikyShort` | short | `0 / 0 / +0.05 / 0 / spiked` | none | edge spikes only (NO interior strokes) | Zoro, Goku, Calvin (Watterson) |
| 5 | `evenBowl` | short | `0 / 0.15 / 0 / 0.10 / smooth` | none | one straight fringe arc across forehead | Asterix, Charlie Brown, Tintin's Chang |
| 6 | `bobChinLength` | medium | `0 / 0.45 / 0 / 0.30 / smooth` | centre OR off-centre | one side-curtain sweep (no flow flicks) | Bianca Castafiore short variant, classic flapper |
| 7 | `shortMessy` | short | `0.15 / 0.20 / +0.05 / 0.05 / crowSnipped` | off-centre L | one short interior separator | Luffy (One Piece), Calvin's friend Hobbes-in-pirate-mode, Vashti Harrison kid canon |
| 8 | `sideForelock` | medium | `0.20 / 0.30 / +0.10 / 0.15 / flicked` | deep side R | LARGE asymmetric forelock cutout covering one eye + one side flow | Sanji (One Piece), shoujo curtain styles, Veronica Lake |
| 9 | `longStraight` | long | `0 / 0.85 / 0 / 0.70 / smooth` | centre | two long side-curtain sweeps, NO fringe | Robin (One Piece), Pocahontas, Snow White's stepmother |
| 10 | `longSideBangs` | long | `0 / 0.80 / +0.05 / 0.65 / flicked` | side L | one long side-curtain + asymmetric forehead bangs | Nami (One Piece), teen-shoujo default |
| 11 | `curlyDome` | medium | `0.10 / 0.20 / 0 / 0.15 / edgeTextured` | none | no parting, no flow strokes; texture lives in edge | Hermione (Disney/illustrated), Sideshow Bob (compressed), generic coily-canon dome |
| 12 | `longWavy` | long | `0 / 0.75 / 0 / 0.60 / edgeTextured` | off-centre R | one side-curtain + ONE optional highlight cutout | Belle (Disney), shoujo wavy default |

Coverage check (against user's axes):
- short: 1, 2, 3, 4, 5, 7 (six)
- medium: 6, 8, 11 (three)
- long: 9, 10, 12 (three)
- parted: 1, 6, 7, 8, 9, 10, 12 (seven)
- swept-back / no part: 3, 4 (two)
- no part, fringe-defined: 5, 11 (two)
- asymmetric: 1, 7, 8, 10, 12 (five)
- symmetric: 2, 3, 4, 5, 6, 9, 11 (seven)
- dome: 1, 6, 9, 11
- spike: 4, 7
- curtain: 6, 9, 10, 12
- with fringe: 5, 8, 10
- without fringe: 1, 2, 3, 4, 9, 11

Hits every axis the user named. No mohawk. Twelve, which is the upper
end of the budget — Fred can ship 8 first and add the rest.

**Naming convention:** camelCase, descriptive, no proper nouns (no
`sanji`, no `franky`). Proper-noun naming is a Haddock trap (STOP §6).
A character file can compose `hairstyle: 'sideForelock'` to GET Sanji's
hair; the hairstyle itself is named for what it IS, not who wears it.

---

## 4. Primitives missing from the engine

Pass-3 §4 named six primitives: `massSilhouette`, `partingCurve`,
`clumpStroke`, `highlightCutout`, `spikeStrip`, `edgeTexture`. Fred has
wired three: massSilhouette (the 5 knobs), an implicit
parting-as-handbuilt-curve, and clumpStroke-as-flow-line. To support
the catalog above, the following must land:

### 4.1 Real `highlightCutout` (missing — needed for #12, optional #11)

A closed shape painted in skin-colour OR white OVER the mass. Needed
for manga lens-highlight (shoujo), Disney/Timm tonal break, Sanji's
shadow-under-forelock. Architecturally trivial — it's a closed path
with fill rendered in pass 1, no stroke. ~20 LOC. Pedagogy: Hayashi
2000 §3, Crilley 2012 vol.1, Eisner 1985 "Modelling".

### 4.2 Asymmetric forelock — IS a new primitive

The current `edgeKind: 'flicked'` is a small bump on the silhouette
edge (Hergé forelock scale: ~3% headHeight outward). Sanji's forelock
is a LARGE asymmetric mass covering half the face — vertically as long
as the eye-to-chin distance, horizontally covering one eye socket. That
is not an edge bump; it's a **secondary mass** with its OWN silhouette
+ its OWN drop curve from the parting line, layered OVER the front
of the face.

Recommended primitive name: `forelockMass(rootUV, dropTo, sideX,
covers)`. Closed shape, fill = same hair colour, drawn as a layer
between the face-features pass and the hair-mass pass (so it occludes
the eye on its side). ~50 LOC. Needed for #8 and arguably #10.

Pedagogy: Hayashi 2000 §2 "the side-curtain that occludes" — explicitly
distinguished from a fringe wedge; it's a falling mass. Oda's
Daizenshuu interview on Sanji ("the eye is gone because the hair is
covering it — that IS the character") confirms the occlusion is the
point.

### 4.3 Even fringe band (missing — needed for #5)

A horizontal mass running ear-to-ear across the forehead, with the
LOWER edge being the visible drawn line and the upper edge merging
with the main mass. Currently the engine has nothing that draws this:
the hairline curve is too high (it's the BACK boundary of the front
mass, not a separate fringe). 

This is `fringeBand(left3D, right3D, sagY, edgeKind)`. Closed shape.
~40 LOC. Pedagogy: Loomis 1956 plate 30 (kid hair), Crilley 2012 vol.1
"the rectangular fringe", Hergé's Chang character.

### 4.4 Edge-textured silhouette (partially missing — needed for #11, #12)

`edgeKind: 'edgeTextured'` is reserved in the enum but NOT implemented
in the edgeJitter function (see `scaffold.ts:837–849`). Needs the
coily-canon arc-bump pattern from `hair-pass-2.md` §1. ~15 LOC inside
the existing edgeJitter switch. Pedagogy: Nelson, Harrison, Robinson,
Liu-Trujillo (full citations in `hair-pass-2.md`).

### 4.5 Spike silhouette (partially missing — needed for #4)

`edgeKind: 'spiked'` is reserved but not implemented. Needs the
triangle-tooth pattern: 5–7 triangular spikes along the front+top
silhouette, each ~5–8% headHeight tall. Pedagogy: Crilley 2012 vol.1
shounen chapter; Toriyama Daizenshuu sketches.

### 4.6 Parting topology — needs to become explicit

Currently the parting is conditionally drawn when `frontShape !==
'straight'`, and its position is hardcoded (`partingX = -rx * 0.10`).
For the catalog above, parting needs to be a hairstyle-level decision
with a small enum:

```ts
parting: 'none' | 'centre' | 'sideL' | 'sideR' | 'deepSideL' | 'deepSideR' | 'sweptBack'
```

`'none'` = no parting curve drawn (Asterix bowl, Goku spike).
`'sweptBack'` = no parting; mass flows upward/back (pompadour).
The other five = parting curve at a specific X with specific lean.

This is NOT a new primitive — it's a parameterization of the existing
parting curve code. ~30 LOC including the new enum. Pedagogy: Faigin
2012 ch. 9 explicitly factors parting position as an independent
decision; Hampton 2009 fig 7-14 lists the seven.

### 4.7 Composition recipe — the meta-primitive

The architectural shift: `buildHair` MUST be reorganized to consume a
"recipe" rather than a hardcoded composition. The recipe is:

```ts
type HairstyleRecipe = {
  knobs: {                        // the existing 5
    templeRecession; sideFall; crownPeakX; napeExtension; edgeKind;
  };
  parting: PartingKind;           // 4.6
  forelock?: ForelockSpec;        // 4.2 — present iff hairstyle has one
  fringe?: FringeSpec;            // 4.3 — present iff hairstyle has one
  flowStrokes: FlowStroke[];      // explicit list, possibly empty
  highlight?: HighlightSpec;      // 4.1 — optional
};
```

`buildHair` then *dispatches* on which optional fields are present,
rather than always rendering parting + 2 flow flicks. This is the
single most important change — it's what turns "6 silhouettes,
1 recipe" into "12 hairstyles, 12 recipes". ~40 LOC of refactor; the
existing wiring stays intact, just made conditional on recipe fields.

---

## 5. Implementation order for Fred

Cheapest first; each step testable independently.

1. **Define `HairstyleRecipe` type + `src/hairstyles/` directory** with
   stubs for the 12 names (all delegating to current behaviour). Adds
   the `hairstyle?: HairstyleName` arg to `composeFace`. No engine
   change yet — just plumbing. ~80 LOC, 1 file new, 2 files touched.

2. **Refactor `buildHair` to consume the recipe.** Move the hardcoded
   parting + 2 flow flicks into a default recipe. Existing demographics
   keep working (default recipe = current behaviour). ~40 LOC refactor.
   Tests should produce byte-identical output. THIS is the gating step
   — it converts the hardcoded composition into a data-driven one
   without changing any rendered pixel.

3. **Implement `parting` enum** (4.6). Wire `partingKind` through the
   recipe; replace `partingX = -rx * 0.10` with a position derived from
   the enum. Add `parting: 'sweptBack' | 'none'` cases (skip drawing).
   Now `shortPompadour` and `spikyShort` are renderable without flow
   flicks underneath them. ~30 LOC.

4. **Wire `edgeKind: 'spiked'` and `edgeKind: 'edgeTextured'`** (4.4,
   4.5). Implement in the `edgeJitter` switch in `scaffold.ts:837`. Now
   `spikyShort`, `curlyDome`, `longWavy` look distinct from
   `shortSwept`. ~30 LOC.

5. **Implement `fringeBand` primitive** (4.3). Now `evenBowl` renders.
   ~40 LOC.

6. **Implement `highlightCutout`** (4.1). Now `longWavy` and optionally
   `curlyDome` can carry a highlight. ~20 LOC.

7. **Implement `forelockMass` primitive** (4.2). Most expensive
   geometrically because it needs to layer correctly with face features
   (occlusion order matters). Now `sideForelock` and `longSideBangs`
   render. ~50 LOC + a render-pass tweak.

8. **Fill in the 12 hairstyle data files** properly. With all
   primitives wired, each is just a `DeepPartial<FaceParams>` plus a
   recipe-field set. ~30 LOC per file × 12 = ~360 LOC.

After step 4, render the gallery (12 hairstyles × 3 demographics = 36
faces) and hand to Pascal. The user's "every face is Franky" critique
should be visibly disprovable by then — six of the twelve hairstyles
will render as visibly different compositions. If not, the bug is in
step 2 (the refactor didn't actually un-hardcode) and Fred should NOT
proceed to step 5.

---

## 6. STOP-the-line flags — this work specifically

These are in addition to all prior STOP flags in `hair.md`,
`hair-pass-2.md`, and `hair-tooling.md` §6 + §8.5.

**HS-1. Do NOT hardcode colour in the hairstyle preset.** A hairstyle
is silhouette + composition. Sanji's hair is blonde in canon — but
"sideForelock" is the hairstyle; "blonde" is a separate axis. Hard-coding
blonde into `sideForelock.ts` makes every Sanji-style character blonde,
which is wrong (the same hairstyle on a different character should
recolour freely). Colour belongs in `style.hairFill` or in
character-level overrides, never in the hairstyle file.

**HS-2. Do NOT proper-noun the catalog.** The named hairstyles in §3 are
descriptive (`sideForelock`, not `sanji`). When a real character
doesn't fit any named style, the answer is to COMPOSE primitives in
the character file's overrides, NOT to add a new named hairstyle for
that character. This is exactly the Haddock failure mode (AGENTS.md
§"Parked targets"): we do not name hairstyles after characters because
the named hairstyle then drifts to fit that character and stops being
reusable. Two reusable hairstyles is better than ten character-named
ones.

**HS-3. Do NOT let texture / colour leak into the hairstyle
decomposition.** A "curlyBob" and "straightBob" must be one hairstyle
(`bobChinLength`) with two texture settings. If Fred catches himself
adding `wavyBob`, `curlyBob`, `straightBob` as three entries in
`src/hairstyles/`, that is the wrong axis being parameterized. Texture
goes on `edgeKind` and on a future per-stroke wobble multiplier; it
does not multiply the catalog.

**HS-4. Do NOT ship a hairstyle that requires unwired primitives.** Each
entry in the catalog must render cleanly with whatever primitives are
landed at the time. If `forelockMass` (4.2) isn't wired, `sideForelock`
must not exist as a registered hairstyle — it should be added in
step 7, not step 1. The data registry grows alongside the primitive
set, not ahead of it.

**HS-5. Do NOT smuggle non-orthogonal effects into the recipe.** Each
recipe field must do its one thing and not modify the others. E.g.
`parting: 'deepSideL'` must not silently scale `crownPeakX`. If a
hairstyle wants both, the data file sets both EXPLICITLY. (Same rule
as the SS-3 STOP in hair-tooling.md §8.5, restated for the recipe
layer.)

**HS-6. Do NOT collapse the parting enum to a number.** Tempting to
make `parting: number` where −1 is deep-left, 0 is centre, +1 is
deep-right. Don't — `'sweptBack'` and `'none'` are categorically
different from "parting at position X". Discrete topology should be
discrete in the API. (Loomis 1956 plate 38 draws partings as
categorical choices; Faigin 2012 ch. 9 likewise.)

**HS-7. Do NOT iterate magic numbers in the catalog to "make a face
look better."** Once a hairstyle entry is published it is a contract
with character files that import it. Tuning `sideForelock.dropTo` to
fix one face is the same vibe-coding antipattern as tuning the
silhouette knobs to fix one demographic. If a character needs
different numbers, that character's file should override them. The
catalog stays stable.

**HS-8. The hairstyle catalog has a budget — twelve.** If a thirteenth
seems necessary, that is a pedagogy signal: the existing twelve are
miscategorised (probably collapsing two distinct items, e.g. shoujo
side-curtain and Western centre-parted long are both `longStraight`
when they shouldn't be). Don't add the thirteenth; revisit the
factoring. Twelve is the working illustrator's repertoire size for
hair shapes per Hayashi 2000 (which factors into 14 named "hair
patterns" across two genders and three ages) and per Bancroft 2006
(which uses 10–12 as the "you'll use the same ones repeatedly"
working set).

---

## 7. Sources

New citations this pass:

- Bancroft, *Creating Characters with Personality*, Watson-Guptill 2006,
  ch. 5 "Silhouette First" — animation model-sheet rule that hair
  silhouette must read at thumbnail before render is committed.
- Oda Eiichiro, *One Piece Color Walk* vols 1–9, Shueisha 2001–2018
  — Daizenshuu-style interviews where Oda distinguishes hairstyle
  (Sanji's forelock), hair colour (blonde), and hair texture (sleek)
  as three independent characterization knobs.
- Toth, *Genius, Isolated: The Life and Art of Alex Toth*, IDW 2011,
  ch. 4 — hair as silhouette decision predating any line work.
- Toriyama interviews, *Daizenshuu 4: World Guide*, Shueisha 1995 —
  Goku's spikes as silhouette-only (no interior strokes).
- DiceBear `big-ears` (MIT) and `avataaars` (CC-0) — hairstyle
  enumerations as data-only registries, verified via repo metadata
  Nov 2026.
- Faigin 2012 ch. 9 §"Hair as Mass" — explicit factoring of shape /
  texture / colour as independent decision axes.
- Loomis 1956 plate 30 (children) and plate 38 (adult hair masses) —
  the same head with multiple hair masses overlaid, demonstrating
  silhouette as the load-bearing identifier.
- Hayashi *How to Draw Manga: Bishoujo*, Graphic-Sha 2000 §2 — factors
  hairstyle by length × parting × fringe-wedge-count × side-curtain
  presence; texture and colour in separate chapters. 14 named patterns.
- Hampton 2009 fig 7-12 + 7-14 — silhouette-first hair, parting as
  independent decision.
- Crilley *Mastering Manga vol.1*, IMPACT 2012 — explicit catalog of
  fringe types and rectangular vs. wedge fringe.

Prior research relied on:
- All citations in `hair.md`, `hair-pass-2.md`, and `hair-tooling.md`.
- Engine paths: `face-lib/src/model/scaffold.ts:803–1022` (`buildHair`),
  `face-lib/src/model/params.ts` (the hair param block, lines ~108–138
  by current count), `face-lib/src/api.ts:79` (`composeFace`),
  `face-lib/src/presets/demographics.ts:36, 62, 104, 138, 175`
  (current hardcoded hair knob settings per demographic).

---

## 8. Executive summary — for Fred

1. **Hairstyle is a discrete composition (length / mass distribution /
   parting / fringe / symmetry); texture and colour are orthogonal
   continuous modifiers.** Per Loomis, Faigin, Hayashi, Bancroft, and
   the DiceBear registries — six independent comic-art sources agree.

2. **Add hairstyle to the cascade above presentation, as a data-only
   registry in `src/hairstyles/*.ts`.** Pattern: same as
   `src/characters/`. Cascade becomes `defaults → style → hairstyle →
   presentation → age → expression → character → overrides`. The
   `p.hair.style` length enum stays.

3. **Ship 12 named hairstyles (camelCase, descriptive, no proper
   nouns).** Catalog in §3 covers every variety axis the user named.
   `sideForelock` is Sanji; `spikyShort` is Zoro; `bobChinLength` is
   Robin-cut; `evenBowl` is Asterix. No `sanji.ts`.

4. **Four primitives still missing — wire in this order:** parting
   enum (§4.6, free, ~30 LOC), `edgeKind: 'spiked'` +
   `'edgeTextured'` (§4.4–5, ~30 LOC), `fringeBand` (§4.3, ~40 LOC),
   `highlightCutout` (§4.1, ~20 LOC), `forelockMass` (§4.2, ~50 LOC +
   render-order tweak). All small; the big architectural change is
   step 2 below.

5. **The single load-bearing refactor: `buildHair` must consume a
   `HairstyleRecipe` instead of hardcoding parting + 2 flow flicks.**
   Steps 1–2 of §5 are the gate; nothing else matters until they
   land. After step 2, every other change is additive.
