# Facial Hair — Research

Targeted pass to replace the invented mustache-ellipse / magic-number beard with primitives grounded in (a) real grooming/anatomy taxonomy, (b) source-level review of existing parametric face libraries, and (c) comic-rendering conventions.

---

## 1. The need

Current engine has two failure modes:

1. **Mustache rendered as a closed thin ellipse** below the nose. At realistic line weight this reads as a second pair of lips, not as hair-bearing skin. The eye decodes "thin closed curve under nose" as the mouth, especially when the actual mouth is small.
2. **Beard is one topology with magic-number knobs** (length, width). It can only become longer or wider, not goatee-vs-chinstrap-vs-mutton-chops. There is no axis along which "anchor" lives.

Both come from skipping the underlying anatomy: facial hair grows in **zones with directional follicles**, and named styles are **subsets of those zones** at varying densities. Geometry must follow.

---

## 2. Pedagogy

### 2.1 Mustache taxonomy

[Beardbrand's Definitive Guide to Mustache Styles](https://www.beardbrand.com/blogs/urbanbeardsman/mustache-styles), [Sharpologist's Moustache Style Guide](https://sharpologist.com/moustache-style-guide/), and [Bespoke Unit's Handlebar guide](https://bespokeunit.com/grooming/moustaches/handlebar/) converge on roughly these parameters. I'm normalizing to: **W** = width relative to mouth (1.0 = mouth corner to mouth corner), **drop** = how far below upper lip line the lower edge reaches, **ends** = curl-up / hang / sharp / blunt, **body** = thickness/silhouette.

| Style              | W       | drop                | ends              | body                                              |
| ------------------ | ------- | ------------------- | ----------------- | ------------------------------------------------- |
| Chevron            | 1.0–1.1 | covers upper lip    | blunt, square     | thick, full, downward-angled like a roof          |
| Walrus             | 1.2–1.4 | hangs past lip 1–3cm| hang              | very thick, drooping, often covers mouth          |
| Handlebar (Eng.)   | 1.2–1.5 | at lip line         | straight points   | medium, waxed, points out horizontally            |
| Handlebar (Hung.)  | 1.4–1.8 | below lip line      | curl up           | very thick, big swooping body, sits lower         |
| Horseshoe          | 1.0     | extends to jawline  | hang vertical     | thick downstrokes flanking mouth and chin         |
| Pencil             | 1.0     | thin strip on lip   | sharp tip         | very thin, single razor line                      |
| Fu Manchu          | 1.0     | grows from corners  | hang vertical     | thin to medium, separates over center             |
| Imperial           | 1.4–1.8 | at lip             | curl up (large)   | thick body, big upward curl                       |
| Painter's brush    | 0.9     | below nose          | blunt sides       | thick rectangle, narrower than mouth              |
| Lampshade          | 1.0     | trapezoid           | angled in         | trapezoid like a lampshade                        |
| Dali               | 1.3+    | thin                | sharp up-points   | very thin body, dramatic upturned tips            |
| Toothbrush         | 0.4–0.5 | under nose only     | blunt             | very narrow square centered under septum          |

Key insight: **end behavior** (curl/hang/sharp) is independent from **body shape** (thick/thin/trapezoid). Currently we have neither dimension; we have a closed ellipse.

### 2.2 Beard growth zones

[Wikipedia, Moustache and Beard articles](https://en.wikipedia.org/wiki/Moustache), [Beardstyle's jawline guide](https://beardstyle.net/jawline-beard/), [Book of Barbering's growth patterns](https://bookofbarbering.com/beard-growth-patterns/), and [VOLT Grooming's "3 Beard Lines"](https://voltgrooming.com/the-3-beard-lines-and-why-theyre-important/) all decompose the bearded face into the same six zones:

1. **Mustache** — philtrum and upper lip
2. **Soul patch** — directly below lower lip, above chin pad
3. **Chin** — chin proper (mental protuberance)
4. **Jawline** — mandible from chin angle to ear
5. **Cheek** — above jawline, in front of ear, up to cheekbone
6. **Neckline** — below jaw, terminates ~one finger above Adam's apple

Named styles map cleanly to which zones are filled:

| Style              | M | SP | Chin | Jaw | Cheek | Neck |
| ------------------ | - | -- | ---- | --- | ----- | ---- |
| Goatee             | – | ±  | y    | –   | –     | –    |
| Van Dyke           | y | ±  | y    | –   | –     | –    |
| Circle beard       | y | y  | y    | –   | –     | –    |
| Anchor             | y | ±  | y    | thin| –     | –    |
| Balbo              | y | y  | y    | y   | –     | –    |
| Chinstrap          | – | –  | y    | y   | –     | –    |
| Mutton chops       | – | –  | –    | –   | y     | –    |
| Friendly muttons   | y | –  | –    | –   | y     | –    |
| Full beard         | y | y  | y    | y   | y     | ±    |
| Garibaldi          | y | y  | y    | y   | y(low)| –    |
| Stubble            | sparse all zones, low density                |

Density is independent from zone-mask: stubble is "all zones, density ~0.1, length ~0"; full beard is "all zones, density 1.0, length high."

### 2.3 Hair-grow direction

[Redlan's Understanding Beard Growth](https://redlancuts.com/the-cut/understanding-beard-growth) and [Nashville Hair Doctor's growth patterns](https://nashvillehairdoctor.com/fue/beard-transplant/growth-patterns-beards-mustaches/) describe a directional field that drawing texts like [Andrew Loomis, *Drawing the Head and Hands*](https://archive.org/details/andrew-loomis-drawing-the-head-hands) and [Burne Hogarth, *Drawing the Human Head*](https://archive.org/details/drawinghumanhead0000burn) ask you to honor with stroke direction:

- Mustache: downward, fanning slightly outward near corners of mouth.
- Soul patch / chin: straight down.
- Jaw: down-and-out, perpendicular to the mandible line.
- Cheek: down.
- Neck: **upward**, toward the jaw (this is why neckbeards look weird if drawn growing down).

Stroke direction encodes this; silhouette alone does not.

### 2.4 Comic conventions

How successful artists make facial hair read as hair-with-volume, not lips or a black blob:

- **Hergé / ligne claire** ([Paul Gravett](http://www.paulgravett.com/articles/article/herge_the_clear_line), [Wikipedia: Ligne claire](https://en.wikipedia.org/wiki/Ligne_claire)): Captain Haddock's beard is a single closed silhouette with **no internal hatching**, sometimes a small white highlight near the chin; Calculus's goatee is a small filled wedge. The contour does all the work. Width is consistent; the silhouette is what reads.
- **Hergé**: Mustaches (e.g., General Alcazar) are drawn as **silhouette plus 1–2 internal direction strokes** showing droop direction — not as closed shapes hugging the lip.
- **Tezuka (Black Jack)**: Stubble = **dot stipple field** across the zone mask, not a silhouette.
- **Caniff (Steve Canyon villains)**: Pencil mustaches drawn as a **single weighted stroke** under the nose with a sharp end — never as a closed shape.
- **Carl Barks (Beagle Boys)**: Stubble rendered as **short irregular tick marks** across the lower face — texture, not silhouette.
- **Bruce Timm (BTAS villains)**: Goatees are **sharp angular triangles** with a single hard fill — geometry over realism.
- **Akira Toriyama / shōnen tradition**: Heavily-bearded characters get **cubic / spiked stylized silhouettes** that act as iconography.
- **Uderzo (Asterix)**: Vitalstatistix's mustache is two **drooping teardrops** flanking the mouth — open at the top, closed at the bottom, suggesting strands hanging. Obelix has no mustache because his character icon is the striped trousers, not facial hair.

**The single load-bearing rendering insight**: every successful comic mustache is either (a) an **open shape** with the upper edge merged into the philtrum / nostril shadow, or (b) a **stroked path with direction**, or (c) **silhouette with at least one internal direction mark**. None of them are closed lip-like ellipses. Our current primitive is the one thing none of the canonical sources do.

---

## 3. Existing implementations (source-level review)

### 3.1 DiceBear `@dicebear/avataaars`

[facialHair.ts](https://raw.githubusercontent.com/dicebear/dicebear/main/packages/%40dicebear/avataaars/src/components/facialHair.ts). Auto-generated from Figma. **5 named styles**: `beardLight`, `beardMedium`, `beardMajestic`, `moustacheFancy`, `moustacheMagnum`. Each is a **single SVG path with evenodd fill** — no strokes, no layering. `moustacheMagnum`'s path data is ~520 chars; `beardLight` is ~1200+. License: MIT for code, **CC BY 4.0** for the artwork (since avataaars derives from Pablo Stanley's library).

Verdict: **learn-from**. The "single evenodd path, fill only" approach scales badly for our pipeline (we want strokes that respect line weight). We should not import the SVG (CC BY 4.0 requires attribution, awkward for a generated face); we should note that even DiceBear only ships 5 styles — naming/coverage is the hard part, not geometry.

### 3.2 DiceBear `@dicebear/open-peeps`

[facialHair.ts](https://raw.githubusercontent.com/dicebear/dicebear/main/packages/%40dicebear/open-peeps/src/components/facialHair.ts). **16 styles**: `chin`, `full`, `full2..4`, `goatee1..2`, `moustache1..9`. Mostly single fill paths; `full4` and `moustache9` use grouped multi-path with strokes. Source artwork is Pablo Stanley's [Open Peeps](https://www.openpeeps.com/) under **CC0 1.0** — both code and art are unrestricted.

Verdict: **learn-from, possibly import-traced**. CC0 means we can legally trace any of these. But Open Peeps is a hand-drawn rough-line aesthetic that doesn't match our clean-line scaffold output. Useful as **shape reference** for what 9 moustache silhouettes look like as a discrete library.

### 3.3 DiceBear `@dicebear/personas`

[facialHair.ts](https://raw.githubusercontent.com/dicebear/dicebear/main/packages/%40dicebear/personas/src/components/facialHair.ts). **6 styles**: `beardMustache`, `pyramid`, `walrus`, `goatee`, `shadow`, `soulPatch`. More compositional naming — `shadow` and `soulPatch` are zone primitives, not styles. License: CC BY 4.0 for art, MIT for code.

Verdict: **learn-from — naming is the take-away**. Personas separately exposes `shadow` (stubble) and `soulPatch` as distinct components, which aligns with the zone-mask approach below.

### 3.4 DiceBear `@dicebear/notionists`

[beard.ts](https://raw.githubusercontent.com/dicebear/dicebear/main/packages/%40dicebear/notionists/src/components/beard.ts). 12 variants (`variant01..12`), mostly single black-fill paths. Hand-drawn aesthetic. CC0 1.0 (Notionists by @heyzoish).

Verdict: **learn-from**. Generic "variant01..12" naming gives up taxonomy entirely; not a model worth following.

### 3.5 faces.js (zengm-games)

[Repo](https://github.com/zengm-games/facesjs). The `svgs/facialHair/` directory exists and contains a mix: numbered (`beard1.svg`..`beard6.svg`, `goatee1.svg`..`goatee19.svg`, `mustache1.svg`) and named (`chin-strap.svg`, `fullgoatee.svg`, `honest-abe.svg`, `neckbeard.svg`, `sideburns1.svg`, `soul.svg`, `wilt-sideburns-long.svg`, `harley1.svg`), plus composite names like `muttonGoatee1.svg`, `loganGoatee2Stache.svg`. License: **MIT** for both code and SVG. The SVGs are independent files dropped into the engine — positions are baked.

Verdict: **import-eligible by license, but the topology is baked-in 600×900 SVGs without parameters**. Naming is interesting (`muttonGoatee`, `loganGoatee2Stache`, `chinstrap`) — confirms practitioners reach for **compound zone names**. Not directly importable into our parametric scaffold, but **the named compounds are a real taxonomy signal**.

### 3.6 fangpenlin/avataaars (and forks)

Source of DiceBear avataaars. Pablo Stanley artwork under [Free for personal and commercial use](https://avataaars.com/), CC BY 4.0 in DiceBear's repackaging. Same 5-ish facial hair shapes. No deeper material.

Verdict: **redundant with DiceBear avataaars**.

### 3.7 Summary of library findings

| Library             | # styles | Geometry         | License (art)  | Decision         |
| ------------------- | -------- | ---------------- | -------------- | ---------------- |
| avataaars (DiceBear)| 5        | single evenodd   | CC BY 4.0      | learn-from       |
| open-peeps          | 16       | single + multi   | CC0 1.0        | learn-from / can trace |
| personas            | 6        | compositional    | CC BY 4.0      | **emulate naming** |
| notionists          | 12       | single fill      | CC0 1.0        | learn-from       |
| faces.js            | ~30 SVGs | baked SVG files  | MIT            | **emulate naming** |

**No library exposes growth-zone-mask + density + stroke-direction as primitives**. They all ship discrete named styles as opaque SVG blobs. This is the gap.

---

## 4. Recommended primitives

```ts
type Zone = "mustache" | "soulPatch" | "chin" | "jaw" | "cheek" | "neck";

type FacialHair = {
  zones: Partial<Record<Zone, {
    density: number;       // 0..1 — sparse stubble to full
    length: number;        // 0..1 in face-units
  }>>;
  mustacheShape?: {
    width: number;         // relative to mouth (0.4..1.8)
    drop: number;          // distance below upper lip in face-units
    endStyle: "blunt" | "sharp" | "curlUp" | "hang";
    body: "thin" | "medium" | "thick" | "trapezoid";
  };
  beardShape?: {
    silhouette: "trimmed" | "natural" | "pointed" | "rounded";
    length: number;
  };
  renderMode: "silhouette" | "strokeField" | "stipple" | "silhouettePlusStrokes";
};
```

Three primitive axes — **zone mask**, **density/length per zone**, **render mode** — together with two **shape descriptors** for the mustache and beard silhouettes. Named styles become `DeepPartial<FaceParams>` presets:

```ts
const PRESETS = {
  chevron:      { zones: { mustache: { density: 1, length: 0.3 } },
                  mustacheShape: { width: 1.05, drop: 0.5, endStyle: "blunt", body: "thick" } },
  handlebar:    { /* mustache only, endStyle: curlUp, body: medium, width: 1.4 */ },
  walrus:       { /* mustache only, drop high, endStyle: hang, body: thick */ },
  pencil:       { /* mustache only, body: thin, endStyle: sharp, renderMode: strokeField */ },
  toothbrush:   { /* mustache, width 0.4, body thick */ },
  vanDyke:      { zones: { mustache: {...}, chin: {...} } /* disconnected from jaw */ },
  goatee:       { zones: { chin: {...}, soulPatch: {...} } },
  circleBeard:  { zones: { mustache:{}, soulPatch:{}, chin:{} } /* connected ring */ },
  anchor:       { zones: { mustache:{}, chin:{}, jaw:{ length: 0.1 } } },
  balbo:        { zones: { mustache:{}, soulPatch:{}, chin:{}, jaw:{} } },
  chinstrap:    { zones: { chin:{}, jaw:{} } },
  muttonChops:  { zones: { cheek:{ length: 0.4 } } },
  friendlyMuttons: { zones: { mustache:{}, cheek:{} } },
  full:         { zones: all 6 filled },
  stubble:      { zones: all 6 filled at density: 0.15, length: 0.02, renderMode: "stipple" },
};
```

### 4.1 Solving the "mustache reads as lips" problem

Three mechanisms, drawn from comic conventions in §2.4:

1. **Open top edge.** Do not close the silhouette along the philtrum. The mustache top edge should be **clipped against / merged with the nostril shadow**, or simply omitted (the philtrum has no visible mustache boundary in clear-line). Bottom edge only is the readable contour.
2. **Internal direction strokes.** For `renderMode: "silhouettePlusStrokes"`, emit 3–7 short hairline strokes following the §2.3 direction field inside the silhouette. This is what Hergé does for Alcazar.
3. **Stroke field instead of silhouette.** For `renderMode: "strokeField"` (pencil mustache, light stubble, sparse beard), the mustache **has no fill** — it is a field of short strokes, sampled by density, oriented by the direction field. This is Caniff's pencil mustache and Tezuka's stubble.

The rule: **mustache must never be rendered as a closed shape whose contour fully surrounds an enclosed region near the lip line**. Either the top edge is suppressed, internal strokes break up the silhouette, or there is no silhouette at all.

### 4.2 Beard rendering

Beard silhouette is derived from the union of active zone masks projected onto the Loomis scaffold. Density modulates which renderMode applies:

- density > 0.8 → silhouette (filled)
- 0.3 < density ≤ 0.8 → silhouettePlusStrokes
- density ≤ 0.3 → strokeField or stipple (no fill)

Length controls how far the silhouette extends down/outward from each zone's anchor point on the Loomis head. Stroke direction within the silhouette is the §2.3 field.

---

## 5. Uncertainty flags

- **Mustache style proportions** in §2.1 are normalized from prose grooming guides; the numbers are my reading, not industry-standard tables. Movember's chart exists but I couldn't fetch it without auth. Treat numbers as starting points.
- **Loomis / Hogarth** sections: I confirmed both books exist and cover head construction but the web results didn't surface explicit beard-direction passages. The directional rules in §2.3 come from the grooming sources cross-checked against general drawing convention.
- **Asterix / Tezuka / Caniff / Timm** references: characters and styles are well-documented in general but I didn't have access to specific panel-level analyses; the rendering observations in §2.4 are from my reading of the work, with the Hergé/ligne-claire bits backed by the sourced articles.
- **License caveat**: Open Peeps (CC0) is the only library whose art we can trace freely. DiceBear avataaars and personas are CC BY 4.0 (art) — attribution required if we copy, and probably not worth the headache for a generated engine. faces.js is MIT but its SVGs are baked at a fixed position and would need re-fitting.
- The **zone-mask + density + direction-field + renderMode** architecture is not how any reviewed library is built. This is a recommendation, not a copy of prior art. Risk: more axes = more presets to validate. Benefit: it can express styles (anchor, balbo, friendly mutton chops) that the discrete-name libraries cannot interpolate between.

---

## 6. Sources

- [Beardbrand — Definitive Guide to Mustache Styles](https://www.beardbrand.com/blogs/urbanbeardsman/mustache-styles)
- [Beardbrand — Handlebar Mustache](https://www.beardbrand.com/blogs/urbanbeardsman/handlebar-mustache)
- [Sharpologist — Moustache Style Guide](https://sharpologist.com/moustache-style-guide/)
- [Bespoke Unit — Handlebar Moustache](https://bespokeunit.com/grooming/moustaches/handlebar/)
- [Book of Barbering — Types of Mustaches](https://bookofbarbering.com/types-of-mustaches/)
- [Book of Barbering — Beard Growth Patterns](https://bookofbarbering.com/beard-growth-patterns/)
- [Redlan's — Understanding Beard Growth](https://redlancuts.com/the-cut/understanding-beard-growth)
- [Nashville Hair Doctor — Growth Patterns for Beards and Mustaches](https://nashvillehairdoctor.com/fue/beard-transplant/growth-patterns-beards-mustaches/)
- [VOLT Grooming — The 3 Beard Lines](https://voltgrooming.com/the-3-beard-lines-and-why-theyre-important/)
- [Beardstyle — Jawline Beard Shaping](https://beardstyle.net/jawline-beard/)
- [Wikipedia — Moustache](https://en.wikipedia.org/wiki/Moustache)
- [Wikipedia — Beard](https://en.wikipedia.org/wiki/Beard)
- [Wikipedia — Ligne claire](https://en.wikipedia.org/wiki/Ligne_claire)
- [Paul Gravett — Hergé & The Clear Line](http://www.paulgravett.com/articles/article/herge_the_clear_line)
- [Andrew Loomis — Drawing the Head and Hands (Internet Archive)](https://archive.org/details/andrew-loomis-drawing-the-head-hands)
- [Burne Hogarth — Drawing the Human Head (Internet Archive)](https://archive.org/details/drawinghumanhead0000burn)
- [DiceBear — Avataaars facialHair.ts (raw source)](https://raw.githubusercontent.com/dicebear/dicebear/main/packages/%40dicebear/avataaars/src/components/facialHair.ts)
- [DiceBear — Open Peeps facialHair.ts (raw source)](https://raw.githubusercontent.com/dicebear/dicebear/main/packages/%40dicebear/open-peeps/src/components/facialHair.ts)
- [DiceBear — Personas facialHair.ts (raw source)](https://raw.githubusercontent.com/dicebear/dicebear/main/packages/%40dicebear/personas/src/components/facialHair.ts)
- [DiceBear — Notionists beard.ts (raw source)](https://raw.githubusercontent.com/dicebear/dicebear/main/packages/%40dicebear/notionists/src/components/beard.ts)
- [zengm-games/facesjs — repo](https://github.com/zengm-games/facesjs)
- [Open Peeps — Pablo Stanley](https://www.openpeeps.com/)
- [DiceBear — Open Peeps style page (CC0)](https://www.dicebear.com/styles/open-peeps/)
- [Asterix — Wikipedia](https://en.wikipedia.org/wiki/Asterix)
