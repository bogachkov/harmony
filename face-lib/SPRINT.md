# Sprint board

Current sprint state. Updated by Claudia (PM) at sprint open / close;
read by every agent on spawn.

When a sprint closes, contents move under ## History and the active
sections reset.

---

## Active sprint — Q1-W2

**Goal: land pack #2 (`timmFlat`) at quality bar across its 16-cell
demographic grid, with the two prereq primitive fixes that gate it.**

Q1-W1 laid the rails (3D refactor under flag; pack spec written; eye
integration audited). Q1-W2 ships the first new pack since the engine
went under structured process. The W1 returns surfaced two prereqs
that are non-negotiable before timmFlat renders:

1. **Eye-primitive plumbing** (Leo STOP, ~25 LOC). `buildEye` almond
   branch silently drops `lidLine` / `lashes` / `underlineHint`.
   timmFlat depends on `lidLine: 0.6` as load-bearing per Sito 2004
   p.40 ("the eye is the lid more than the pupil"). Without the fix,
   the pack ships with the opposite of its canon. Half-day Nick.

2. **Alpha-shape `hullMode` knob** (Lloyd item 4, ~80 LOC). Convex
   hull v1 produces a hexagon for `coilyHalo` and a nun's wimple for
   `longCurtain` — unshippable. Per mixture rule: add `hullMode:
   'convex' | 'alpha'` to `HairstyleRecipe`, convex stays as a mode,
   alpha becomes default for new volume-mode adoption. timmFlat
   itself runs in `clumpMode: 'flat'` so this is not gating timmFlat
   READING right — but the W3 packs Rollo flagged (TWA / coily) lose
   their volume-mode option without it, so we land it now while the
   architecture is fresh in Nick's head. **Bundle** with the two
   small Lloyd-item-2/3 fixes (centreU quadrant keying; drop
   `data-hull-group` debug attr).

3. **timmFlat implementation.** Pack parameters per the W1 spec
   (`research/stylepack-timmFlat-spec.md`), rendered across Rollo's
   16-cell must-ship grid. Parameter flips against existing
   primitives + the eye-plumbing fix; no BACKLOG primitive promotion
   needed.

W2 sequencing: 1 + 2 land BEFORE 3 starts. 1 + 2 are bundleable into
one PR if Nick prefers (small + small + small). 3 is its own PR.

### Ship gate (what closes Q1-W2)

All four must be true:

- [x] **Eye plumbing landed.** `buildEye` almond branch honors
  `lidLine` / `lashes` / `underlineHint`; existing `tintin`-style
  dots renders unchanged (mixture rule: new behavior is plumbed
  through, default values of 0 preserve current renders). Lloyd
  review not required (size + simplicity). **Landed PR #1 — three
  commits `25dc884` / `ce19a47` / `b1ee33a` on vector-draw. 30/30
  catalog renders byte-identical in dots mode; 26/30 flat-mode
  byte-identical post-centreU fix (longCurtain wimple gone;
  coilyHalo hexagon retained for PR #2). Nick flagged Leo's
  "presets are all 0 on almond" was slightly wrong — demographic
  presets DO set non-zero `lidLine` that was being silently
  dropped pre-fix; default/ligneClaire renders with demographic
  presets now honor those knobs. Catalog unaffected. Filed for
  Pascal/Holly.**
- [x] **`hullMode: 'convex' | 'alpha'` knob landed.** Alpha-shape
  merger in `src/render/hull.ts` (Bowyer-Watson Delaunay +
  α-complex; α auto-tuned from clump spacing × 1.5 per Lloyd §7).
  Convex stays as a mode. **Decision (Nick): leave W1 fixtures
  undefined → 'convex' as regression-history record; add sibling
  `longCurtainAlpha` / `coilyHaloAlpha` fixtures with
  `hullMode: 'alpha'` so alpha is REACHABLE as a preset.** No
  `shortBobAlpha` (flat mode bypasses merger). 30/30 original
  catalog SVGs byte-identical; alpha fixtures determinism-checked
  (identical SVG on repeat). longCurtain wimple gone; coilyHalo
  hexagon gone. LOC drift to ~340 vs Lloyd's ~80 projection
  flagged in handoff. Bundled items (centreU key + debug attr)
  landed earlier in PR #1. **Landed PR #2 — two commits on
  vector-draw; awaiting Lloyd review.**
- [ ] **`timmFlat` pack lands in `src/presets/styles.ts`** per the
  W1 spec. All 16 Rollo grid cells render at Pascal ≥ 5 + Rollo
  "would ship." The four-corner thumbnail test (cells 1, 4, 12,
  14) passes: clearly different characters, clearly different
  ages at 96×96. Bob captures the 16-cell sheet and shares.
- [ ] **Pascal calibration audit** lands — deferred from W1 since
  no substantive new output existed to score. Pascal scores the
  16-cell timmFlat grid against the AGENTS.md anchor table
  (absolute, not delta-from-previous). If Pascal scores above 5
  on output that fails the dead-procedural-hair / flat-line /
  features-don't-integrate sniff, the calibration itself is the
  bug (per AGENTS.md). Pascal lands AFTER timmFlat renders;
  closes the sprint.

What is explicitly NOT in W2's gate:

- Holly regression sweep + test strategy doc → W2 close OR W3.
  Holly's first real spawn lands once timmFlat is in (per
  AGENTS.md Holly-first-spawn note + W1 plan deferral). May slip
  to W3 if W2 closes tight.
- Per-feature line-weight multiplier (Leo+Rollo flagged as W3+
  ceiling-raiser for villain register). NOT a W2 blocker — pack
  ships hero/protagonist register cleanly without it.
- Categorical `brows.shape` enum (Leo+Rollo flagged W3+).
- Orbital socket recess primitive (Leo cross-cutting — packs 3-4
  will need it; timmFlat dodges, so deferred).
- `mouth.philtralBow` knob (BACKLOG #2; deferred W3+).
- `expressions.ts` resuscitation (BACKLOG; deferred W3+).
- `pointed` / `pear` jaw topology dispatch through demographic
  presets (Rollo adjacent-gap #1 — files a backlog row, not in W2).
- Tangent-decay parameter exposure (Lloyd item 1 next-PR work —
  cheap, but no caller needs it in W2; defer).
- `hull.ts:71-86` dead `theta/cx/cy` cleanup — deferred as a low-
  priority refactor row.

## In flight

| Agent | Task | Status | Notes |
| ----- | ---- | ------ | ----- |
| —     | —    | —      | Nick PR #2 done; awaiting Lloyd review trigger from Bob. |

## Done this sprint (W2)

- **Nick PR #2** — `tasks/nick-alpha-shape-hullmode.md`. Two commits
  on vector-draw: engine (`hull.ts` alpha-shape + `params.ts` hullMode
  + `svg.ts` dispatch) + fixtures (`longCurtainAlpha`, `coilyHaloAlpha`,
  index registration). 30/30 original catalog byte-identical (convex
  default unchanged). longCurtain wimple eliminated; coilyHalo hexagon
  eliminated. ALPHA_FACTOR = 1.5 (Lloyd's §7 starting guess held up).
  LOC ~340 vs Lloyd's ~80 projection flagged. Lloyd reviews next.

- **Nick PR #1** — `tasks/nick-eye-plumbing-and-hull-cleanups.md`.
  Three commits on vector-draw: `25dc884` (eye plumbing),
  `ce19a47` (centreU keying fix), `b1ee33a` (debug attr drop).
  Catalog dots-mode 30/30 byte-identical; flat-mode 26/30 byte-
  identical post-centreU (longCurtain parting gap restored).
  Demographic-preset lidLine-on-default/ligneClaire side-effect
  filed for Pascal/Holly to flag if anything reads off.

## Blocked / pending

| Agent  | Task | Blocked on |
| ------ | ---- | ---------- |
| Pascal | Quality + calibration audit on timmFlat 16-cell grid | timmFlat impl landing |
| Holly  | Test strategy doc + first regression sweep | timmFlat landing (then W2 or W3 close depending on Pascal verdict) |

## Q1-W2 spawn order (for Bob)

1. **Nick — eye plumbing + hullGroup centreU fix + debug attr drop.**
   `tasks/nick-eye-plumbing-and-hull-cleanups.md`. Three small,
   independent commits in one PR (~35 LOC total). Smallest, no
   architectural surprises. Sequence first so the next two unblock.
2. **Nick — `hullMode: 'convex' | 'alpha'` knob.**
   `tasks/nick-alpha-shape-hullmode.md`. Lloyd reviews on completion.
   Spawn after #1 lands (alpha-shape lives in the same `hull.ts`
   file the centreU fix touches; serializing avoids merge churn).
3. **Nick — `timmFlat` style pack implementation.**
   `tasks/nick-timmflat-pack.md`. Parameter flips per the W1 spec
   + the 16-cell grid render sheet. Spawn after #1 lands; can
   start in parallel with #2 if Nick has bandwidth (file overlap
   is zero — pack lives in `src/presets/styles.ts`, alpha-shape
   lives in `src/render/hull.ts`). Default: serial after #2.

Conditional spawns (after #3 lands):
4. **Lloyd** — code review of #2 (alpha-shape). Bob-triggered; no
   Claudia queue needed.
5. **Pascal** — 16-cell timmFlat grid scoring + W1-deferred
   calibration audit. Closes the sprint.

Not queued this sprint:
- Holly — sprint-close role; ride along with Pascal close if
  timmFlat renders well, otherwise slip to W3 (her first spawn
  should be a test-strategy doc per AGENTS.md, not test code).
- Rollo — no catalog-level call this sprint; W2 is an
  implementation sprint against the spec Rollo already signed.
  Next Rollo touch is W3 spec or end-of-month directional review.
- Leo — no audits queued; W3 may need Leo for orbital-socket /
  socket-recess primitive if the next pack pick demands it.
- David — monthly directional review naturally lands around W2
  close or W3 open; Bob surfaces if anything shifts the Q1
  trajectory.

## History

### Q1-W1 (closed — all four ship-gate boxes met)

**Goal: lay the two rails Q1 runs on.**

1. **Rail A — engine:** 3D clump-volume refactor lands behind a flag
   (`clumpMode: 'flat' | 'volume'`, default `'flat'`) without
   regressing any of the 13 existing hairstyles. Volume mode
   exercised on Lloyd's three test fixtures.
2. **Rail B — style:** one new style pack target chosen and SPEC'd
   (not implemented). The spec is what Nick consumes in Q1-W2.

**Side rail:** Leo audit on eye/mouth/brow integration under the
current `tintin` pack — to know whether W2 pack #2 implementation
needs primitive fixes before it can hit Pascal ≥ 5.

**Closed:**

- **Box 1 + Box 2 (Nick 3D clump-volume refactor, 7 commits ending
  `909244c`).** All 13 existing hairstyles bit-for-bit identical in
  flat mode (stricter than Lloyd's visually-equivalent §5 promise).
  Volume mode renders cleanly for the three fixtures (`shortBob`
  byte-identical, `longCurtain` gravity, `coilyHalo` radial). Net
  +444 LOC engine + 148 fixtures. Convex-hull artefact more
  dramatic than Lloyd §7 predicted; Lloyd review pulled alpha-shape
  into W2 instead of "deferred until adoption."
- **Box 3 (Leo + Rollo joint timmFlat spec at
  `research/stylepack-timmFlat-spec.md`).** Pedagogy half (5
  pedagogy citations Timm + Dini, Sito, Caniff, Toth, Eisner;
  3-5 defining decisions; construction-order note: jaw-first not
  cranium-first per Sito p.41) + asset half (5 NPC slots from
  superhero-NPC-portrait to pitch-deck character heads; 16-cell
  must-ship demographic grid; 4 adjacent gaps named; mixture-rule
  preservation check against forest registry confirmed zero
  filed aesthetics at risk). Implementable in W2 without any
  BACKLOG primitive promotion.
- **Box 4 (Leo face-integration audit at
  `research/leo-face-integration-audit.md`).** Eyes = STOP, small
  (~25 LOC eye-primitive plumbing prereq before timmFlat impl).
  Brows / Mouth / Integration = GO-WITH-CAVEATS for W2.
  Cross-cutting: Pascal's "features-as-decals" complaint is
  structurally real (no orbital socket, no brow ridge plane, no
  mouth-on-mandible attachment); timmFlat dodges it because Timm
  canon literally IS decals — pack 3+ (Caniff/manga/realistic)
  will hit it hard and need a socket-recess primitive pass. Six
  BACKLOG candidates flagged.
- **Lloyd pass 2 review (post-merge, code review of Nick's
  implementation, appended to `research/lloyd-pass-1.md`).** Four
  verdicts: (1) tangent-decay APPROVED-WITH-EDITS — expose as
  param; next-PR. (2) `hullGroup` keying APPROVED-WITH-EDITS —
  switch to `centreU` quadrant, one-line at `scaffold.ts:1414`,
  required before shipped volume adoption. (3) `data-hull-group`
  debug attr NEEDS-CHANGES — drop or gate behind debug flag.
  (4) Alpha-shape deferral NEEDS-CHANGES — pull into Q1-W2 as
  `hullMode: 'convex' | 'alpha'` parameter, convex stays as a
  mode per mixture rule. Plus dead-code flag at `hull.ts:71-86`.

**Carry-overs into W2:**
- Eye primitive plumbing (Leo STOP).
- `hullMode` alpha-shape + Lloyd items 2 & 3 bundle.
- timmFlat implementation against the W1 spec.
- Pascal calibration audit (deferred from W1, no output to score).

**Deferred / filed to BACKLOG (W1 close):**
- Tangent-decay parameter exposure (Lloyd item 1 next-PR).
- Six Leo BACKLOG candidates triaged (eye plumbing PROMOTED to W2;
  the other five DEFERRED to W3+ or later — see BACKLOG.md).
- `hull.ts:71-86` dead-code cleanup (low priority refactor row).
- `pointed` / `pear` jaw topology dispatch through demographic
  presets (Rollo adjacent-gap #1 — filed as backlog row).
- Per-feature line-weight multiplier (filed as backlog row).
- Categorical `brows.shape` enum (filed as backlog row).

### Sprint pre-Q1 (the long session that built the foundation)

- Leo passes 3, 4, 5, 6, 7, 8 — pedagogy + audits.
- Lloyd pass 1 — 3D clump-volume architecture (TL approved).
- Rollo pass 1 — catalog review.
- Hair-theorist pass — physics doc.
- Nick tuning pass 1 — three bug fixes (shortPomp topknot, bob scar,
  longTail merge).
- Nick pass 2 — bob HIGH regression fixed; lead/fill rename with
  deprecation alias.
- Recipe primitive (`HairstyleRecipe` + 11 hairstyle files).
- Collab artifacts created: SPRINT / BACKLOG / tasks/.
- ROADMAP + PROCESS docs created.
- Nine-role crew formalized (added David CEO, Claudia PM, Holly QA).
- David pass 1 + pass 2 (roadmap audit + scope revision).
- Mixture-not-survival rule encoded.
- Forest registry initialized.
