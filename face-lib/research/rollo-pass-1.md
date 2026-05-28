# Rollo Pass 1 — Art Director Review, 11-Style Hairstyle Catalog

*Mandate: would I ship this asset in a real project? Not Pascal's quality scale,
not Leo's pedagogy. Renders reviewed: all 22 (feminine/masculine × 11 styles,
plus archived `longFlowing` pair).*

---

## Per-Style Assessment

**shortSwept (f/m)** — Worth having. Everyman NPC: detective, shopkeeper, student.
Masculine read is clean at thumbnail. Feminine reads "military crop" not "swept
part" — too little lateral volume for the face shape.
Missing: shortSwept-asymmetric (one forelock forward, day-old look).

**shortReceding (f/m)** — Worth having for masculine. `masculine-shortReceding`
nails "aging authority figure / past-prime villain." Feminine render is near-buggy:
scalp exposure with no compensating volume reads as illness artifact, not character
choice. Missing: short-with-thinning-crown (separate archetype, not a tweak).

**shortPompadour (f/m)** — Worth having. Best arc-silhouette in the short tier;
reads at thumbnail. Bug: the pompadour ridge floats as a white band disconnected
from the temporal hairline — the stroke connecting ridge to side mass is absent.
Flag to Fred/Leo. Missing: tall-pompadour volume variant (absurdist/villain energy).

**spikyShort (f/m)** — Worth having. Best short-hair silhouette in the catalog —
the only short style that reads as its own character type at tiny size. The dark
mass with spike crowns has real life. Bug: hairline base is a ruler-flat horizontal
edge; a few irregular hairs would break the "computed" read. Missing: low-profile
spikes (close-cropped base, small points — the delinquent cut).

**bobChinLength (f/m)** — Yes for f, conditional for m. Feminine bob is the most
hirable NPC silhouette in the set (editor, librarian, 1920s secondary character).
Masculine reads narrow: boy-band teen or samurai out of costume. Bug: center-parting
stroke trails well into the forehead skin — reads as scar, not part. Most visible
rendering error in the short/mid tier. Missing: bob-with-blunt-fringe (the most
common illustrated bob variant; currently unreachable).

**curlyDome (f/m)** — Yes, unambiguously. Strongest mass-silhouette in the catalog;
the dark dome over the brow line is character costume. One of the better individual
renders in the set (masculine especially). Bug: fringe edge between dome and brow
is ruler-flat — an afro-texture dome wants slight irregularity there. Missing:
curlyDome-with-lateral-spread (volume extending past face outline — different
silhouette entirely).

**longSleek (f/m)** — Worth having, but it barely earns its slot.
`feminine-longSleek` and `feminine-longFlowing` are near-identical at a glance —
same center part, same sparse fringe, same fall. That is a parameter-space
collision: two catalog slots rendering the same visual point. Before any new style
is added, confirm these are actually distinct. Bug: fall strokes terminate at chin
then continue as hairline artifacts — mass has no clean terminus. Missing:
longSleek-with-bangs (straight fringe + straight sides; most common webtoon/anime
feminine silhouette; currently unreachable).

**longWavy (f/m)** — Worth having. Most visually lively long style. The wispy
escape-strands at the temples are the engine's closest approach to "drawn rather
than computed." `masculine-longWavy` is a specific, readable character type
(romantic lead, conflicted antagonist). Bug: crown mass has flat scribble-texture
inconsistent with the cleaner fall — reads as two different drawing decisions.
Preserve flag: do not consolidate this into longSleek. The wisps are the rare flower.

**longCurly (f/m)** — Yes. Highest visual complexity; cannot be mistaken for any
other style. Suited to protagonist-energy NPC, romance lead, "stands-out-in-crowd"
character. Bug: loose hanging curls below jawline are architecturally separate from
the crown mass — read as smudges at small size. Integration gap.

**longWitch (f/m)** — Yes, and this is the star example of "competent ugly is a
forest asset." `feminine-longWitch` is the witch NPC, the hag shopkeeper, the
ancient oracle — drop it into an RPG without changes. The unkempt crown +
scraggly fall occupies a slot no other style does. `masculine-longWitch` reads
"mad scientist / unkempt scholar" — also a legitimate slot. Do NOT optimize toward
tidiness. Any cleanup round making this smoother is a regression.

**longTail (f/m)** — Yes with a flag. Most geometric long style; the curtain-falls
framing create a strong negative-space silhouette. `masculine-longTail` reads
samurai / fantasy protagonist. Bug: the falls clip through or merge with the face
outline on both demographics — at print size this reads as a production defect.
The falls need clear negative space from the face edge.

---

## Global Pass

**Top 3 Missing Variety Axes**

1. **Short-disheveled / bedhead.** Zero disheveled entries at short length. The
   catalog has `longWitch` for the scraggly long slot, nothing for "just-woke-up
   guy," "nervous unkempt kid," or "gruff outdoorsman." The index already names
   `shortMessy` as a future target (needs regional bedhead HT-4 primitive). Largest
   gap in everyday NPC coverage.

2. **Tight coily / TWA (teeny-weeny afro).** `curlyDome` is coily-adjacent but
   is a tall dome. A TWA — close-cropped coily cap — is a completely different
   silhouette. The catalog's biggest demographic gap. Any diverse NPC cast hits
   this wall. The Black-illustration coily-hair canon Leo cites (Nelson, Robinson,
   Lopez, Liu-Trujillo) is unrepresented at short length.

3. **Swept-back long (forehead fully exposed).** Every long style has fringe or
   forward falls. A pulled-back style — all mass behind the ear line — is a
   distinct silhouette class (period-drama matriarch, severe antagonist, athletic
   lead). `longSleek` partially reaches it but the fringe strokes contradict it.
   Also a prerequisite for the gathered-ponytail variant of `longTail`.

**Top 3 Styles to Preserve Even if Pascal Scores Them Low**

1. `longWitch` — the only disheveled entry. Competent ugly. If anyone proposes
   tidying it toward `longWavy`, that is a forest regression. Defend this slot.
2. `longWavy` — the engine's closest approach to "drawn rather than computed."
   Study it when improving integration, don't replace it.
3. `spikyShort` — the only short style with clear thumbnail differentiation. If
   the catalog is ever trimmed, this stays. No substitute without a spikeStrip-
   class primitive.

**STOP Flags for Rollo**

- Do not optimize toward a single aesthetic. Usable ugly outranks polished-but-narrow.
- Do not call for primitives outside scope (body, clothing, hats).
- Do not recommend merging longSleek + longFlowing without first verifying whether
  the parameter difference is actually failing to render (could be a bug, not
  redundancy).
- Do not request more than 12 catalog slots. If a gap is real, name which slot it
  displaces.

---

## Executive Summary

- **Variety axes are real and worth keeping.** Short / long / curly / wavy /
  witch-disheveled cover distinct character slots. No style should be cut next round.
- **Two styles are near-redundant in output:** `longSleek` and `longFlowing`
  render near-identically. One catalog slot is currently wasted; investigate
  before adding any new style.
- **Largest demographic gap:** zero tight-coily (TWA) entries. Diverse NPC casts
  hit a wall immediately. Highest-priority addition when the 12-style budget allows.
- **Largest character-type gap:** zero short-disheveled entries. `shortMessy`
  (already named in the index comments) should be the next addition after TWA.
- **Two rendering bugs for Fred:** (a) `bobChinLength` center-parting stroke trails
  into forehead skin — reads as scar; (b) `longTail` falls merge with face outline
  at print size — production defect.
