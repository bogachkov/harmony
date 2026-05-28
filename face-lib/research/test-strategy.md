# Test Strategy & Regression Convention — face-lib

**Owner:** Holly (QA) · **Status:** convention v1, ratified W4 Q1 · **Branch:** `vector-draw`
**Scope:** what "tests passed" means for a parametric art engine, and the minimal scaffold Q2 opens against.

This is a convention, not test code. It defines *which gate applies to which kind of change*, what the gallery must cover to be honest, how the forest registry stays guarded, and the smallest harness Q2 should build the bodies/clothes/poses surface against.

North star (AGENTS.md): **a green board must mean something.** A board that passes broken art, or fails correct art, is worse than no board.

---

## 1. The gate taxonomy — what "tests passed" means

There is no single "tests passed" for an art engine. The right gate depends on **what the change claims about the output.** Classify every change by its claim, then apply the matching gate.

| Change claims… | Gate | Pass condition | Who judges |
|---|---|---|---|
| "Output is unchanged" (refactor, rename, dead-code, move, type-only) | **Byte-identical sweep** | 0 diffs across the swept catalog + the reachability fixtures | Machine (script). Binary. |
| "Output changes, but only here and bounded" (one hull tweak, one pack's spacing) | **Visual-diff threshold** | Diff is confined to the declared cells AND within threshold; no *undeclared* cell moves | Holly reviews the diff set; author declares blast radius in the PR |
| "Output is better art" (Pascal-requested drift, new style direction) | **Aesthetic scoring** | Pascal ≥3 all axes, ≥4 mean (per pascal-w2-timmflat.md) | Pascal (quality), then re-bless baseline (Holly) |

### Why byte-identical is necessary but not sufficient

Byte-identical is the **only hard, machine-checkable gate** — and it is exactly right for behavior-preserving changes, which are most of the churn (Nick/Felix "30/30 byte-identical" refactors, the 816-cell "756/816 byte-identical" Felix long-hair sweep). The convention is already in the wild: `scripts/felix-broad-regression.ts` renders the full `styleNames × ageNames × presentationNames × hairstyleNames` cross-product, SHA-256-hashes each SVG, and writes a manifest; a refactor is "clean" when the post-manifest diffs zero lines from the pre-manifest. Keep this. It is cheap, unambiguous, and catches collateral damage no human would eyeball. The current pack set is `default` / `tintin` / `ligneClaire` / `timmFlat`; the first three are the byte-identical keystone, `timmFlat` is the one pack that opts into drift via its pedagogy overrides.

It **breaks down** in three documented ways:

1. **It cannot tell intended drift from collateral drift** (W3 `tintin` demographic push, `nick-q2-demographic-topology.md`). That task *intended* to move `tintin × demographic` renders — Lloyd was explicit it would NOT be byte-identical — while the *guard* was that `default`/`ligneClaire` × untouched demographics stayed byte-identical. Byte-identical alone flags the intended `tintin` moves and any collateral move identically as "FAIL." Only a human/declaration can separate "I asked for this" from "this broke." → That separation is the **declared blast radius** in the visual-diff gate: the author lists the cells they expect to move; the gate fails on any cell that moves *outside* the declaration. Intended drift inside the declaration is not a failure — it's a re-bless. (W3 handled this ad-hoc by naming the byte-identical anchor cells in the PR; the convention systematizes that into a machine-checked declaration.)

2. **It is meaningless where rendering is non-deterministic.** BACKLOG flags suspected unseeded randomness in clump hair (FA-03/FA-06). If two renders of identical params differ, byte-identical is noise, not signal. → **Determinism is a precondition for the byte gate.** Any primitive that feeds the byte sweep MUST be seed-stable. This is a correctness bug to confirm and fix (see §5 / return note), not something the convention can paper over.

3. **It says nothing about reachability.** A refactor can leave the default catalog byte-identical while silently severing an off-default aesthetic (§3). Byte-identical on the catalog is blind to the forest.

### The blessing protocol (intended drift)

PROCESS.md: a failed byte gate + "Pascal says it's better" = intended drift → **re-bless, do not revert.** Concretely:

1. Author declares the blast radius (which packs/demos/cells should move) in the PR.
2. Run the sweep. Confirm diffs are **a subset** of the declared radius. Any out-of-radius diff = collateral = revert/fix, regardless of Pascal's score.
3. Pascal scores the changed cells (quality gate).
4. On both passing, **regenerate baselines for the declared cells only** (`bless --cells …`), commit the new baselines in the same PR. The blessed baseline becomes the new byte-identical bar.

The blessing record (what moved, who blessed, why) lives in the PR; the scar, if any aesthetic was retired, lands in BACKLOG "Known regressions / scars."

---

## 2. The honest coverage matrix — what the gallery must cover

The gallery's "share every render" rule is good for **eyeballing gross breakage and sharing aesthetic state**. It is a poor *gate*: nobody reviews 816 cells per PR, and "looks fine" is not a regression bar. The gate is the **sweep over a fixed, representative matrix**; the gallery is the human-facing render of that same matrix.

A green board only means something if the swept matrix actually exercises the engine. The full cross-product (4 packs × 16 demo × N hair × new primitives) is too large to gate on and too large to eyeball. We don't need the full product — we need a matrix that hits **every axis value at least once** and **every known-risky interaction**.

### Where current coverage is thin or lying

- **Pack coverage is lying.** If the gallery shows `timmFlat` richly and `default`/`tintin`/`ligneClaire` at one demographic each, a green board says *nothing* about 3 of 4 packs. Every pack must appear across the demographic spread, not just the default. (The broad-regression manifest already sweeps all four packs — so the *byte* coverage is honest; the risk is the human-facing *gallery* over-weighting the pack under active work.)
- **Off-grid is a known gap** (BACKLOG). The 16-cell grid samples *grid points*; off-grid combos (extreme age × specific pack) are spot-checked at best. A green grid hides off-grid breakage.
- **Hair × pack interaction is untested as a cross.** Clump-volume hair (FA-03/06) is filed against params, not against each pack. Hair that works on timmflat may break another pack's hull.
- **Determinism is unmeasured** (clump suspicion). Until confirmed seed-stable, clump cells in the matrix are not trustworthy byte targets.

### The minimal honest matrix (the gate set)

Coverage by **spanning + risk**, not cross-product. The gate matrix is the union of:

- **Pack spine (4):** each pack × a fixed *reference demographic* (the grid center). Proves every pack renders at a common point — the baseline that makes packs comparable.
- **Demographic spine (16):** the full 16-cell grid × the *default pack* (timmflat). Proves the demographic axis end-to-end.
- **Off-grid probes (≥4):** the corners/extremes that the grid misses (e.g. extreme-age × non-default pack), one per known-risky region. Closes the BACKLOG off-grid gap with explicit, named cells — not "spot checks."
- **Hair interaction (N_hair × 4 packs at reference demo):** each hairstyle on each pack at the reference demographic. Catches hull×hair breakage.
- **Reachability fixtures (§3):** one render per filed aesthetic (FA-01…FA-06).
- **Q2 new primitives:** as bodies/clothes/poses land, each new primitive gets ≥1 cell on the pack spine + ≥1 reachability fixture if it files an aesthetic.

This is on the order of ~40–60 gated cells, not 816. The 816-cell full sweep stays available as a **pre-merge / weekly deep sweep** (and as the gallery), but the per-PR gate runs the minimal matrix. Rule of thumb: **every axis value appears ≥1×; every documented risk interaction appears ≥1×; everything else is gallery, not gate.**

If a cell is in the gallery but not in the gate matrix, it is **decorative, not verified** — say so, so a green board isn't read as covering it.

---

## 3. Reachability guard — regression-testing the mixture rule

The forest registry (AGENTS.md mixture rule; BACKLOG filed-aesthetics table FA-01…FA-06) says **every aesthetic that ever worked stays reachable** even when off-default. Byte-identical on the *default catalog* does not guard this: a refactor can keep the default render identical while silently making an off-default aesthetic unreachable (its selector now no-ops, or renders something else). The default still matches; the forest quietly loses a tree. That is the cardinal sin, and it passes the byte gate.

"Reachable" is distinct from "byte-identical": reachability asks *can this aesthetic still be selected and does it still render as itself*, not *is this exact render unchanged.*

### The guard: one fixture per filed aesthetic

The registry needs **render fixtures** — one per FA row — that get swept like the catalog:

- Each FA gets a fixture keyed by its **selector** (the params/manifest in the BACKLOG table), e.g. `FA-02_tintin` renders with `pack=tintin`.
- Each fixture has a committed **baseline render**.
- The sweep renders every fixture from its selector and checks two things, in order:
  1. **Reachability (hard, always):** the selector resolves and produces a non-empty render that is recognizably the filed aesthetic. A selector that no-ops, errors, or collapses to the default = **reachability failure** = regression, full stop. This guards the mixture rule directly.
  2. **Stability (byte, unless blessed):** the render is byte-identical to its baseline. A *blessed* aesthetic change re-blesses the fixture (same protocol as §1). A drift here that is *not* declared = collateral = fix.

The key move: **reachability failure is not waivable by aesthetic scoring.** Pascal can deprioritize an aesthetic (tintin in W3) — that changes its *status* to off-default, not its presence. Removing it from reachability requires an explicit BACKLOG retirement entry with sign-off, never a silent refactor side-effect.

### The registry is the source of truth

BACKLOG's filed-aesthetics table is the authoritative list. **Filing an aesthetic = adding the row AND committing the fixture+baseline in the same PR.** The sweep reads the table; a row with no fixture is a coverage hole and fails the sweep's self-check. This keeps the registry and the guard from drifting apart.

---

## 4. Minimal Q2-opening scaffold

The smallest thing that gives Q2 a clean board. Not a full harness — a **convention plus one sweep script** the bodies/clothes/poses surface can build against from day one.

### 4.1 One sweep script, two modes
`scripts/regression-sweep.ts` — a direct generalization of the existing `scripts/felix-broad-regression.ts` (already does the hash-manifest sweep over the full pack × age × presentation × hairstyle cross-product). Promote it from a one-off Felix probe to the standing convention, add the registry fixtures and the modes:

- `regression-sweep --gate` — renders the **minimal matrix (§2) + reachability fixtures (§3)**, diffs against baselines, exits non-zero on any reachability failure or undeclared byte diff. This is the per-PR gate.
- `regression-sweep --full` — the 816-cell deep sweep + gallery render. Weekly / pre-merge, not per-PR.
- `regression-sweep --bless --cells <list>` — regenerates baselines for declared cells only (the blessing protocol, §1). Refuses to bless without an explicit cell list (no blanket re-bless).

### 4.2 Fixture & baseline layout (one convention, used by both catalog and registry)
```
face-lib/regression/
  matrix.json                 # the gate matrix (§2): pack/demo/hair/primitive cells
  registry.json               # generated from BACKLOG FA table — one entry per FA row
  baselines/
    catalog/<pack>__<demo>__<hair>[__<primitive>].svg
    registry/<FA-id>__<slug>.svg     # e.g. FA-02__tintin.svg
```
Naming rule: **filename = selector.** A baseline's name fully encodes the params that produce it, so a missing/renamed selector is visible as a missing/renamed file. Registry fixtures key on FA-id so they trace 1:1 to BACKLOG.

### 4.3 Blessing = baseline diff in the PR
No separate ledger. A blessed change shows up as **changed baseline files + declared blast radius in the PR description.** Reviewer (Holly) checks the baseline diff is a subset of the declaration. The git history of `baselines/` *is* the regression record.

### 4.4 CI-or-not call
**`--gate` runs in CI as a required check; `--full` does not.** Rationale: the gate matrix is small (~40–60 cells), deterministic (precondition: §1 determinism fix), and fast — it belongs in CI so a red board blocks merge mechanically. The full 816 sweep is too slow/noisy for per-PR CI and stays a **manual weekly discipline + pre-Q-close run.** Reachability failures and undeclared diffs must be CI-blocking; the gallery render is an artifact, not a gate.

**Precondition before CI gating:** confirm/fix clump-hair determinism (BACKLOG). A non-deterministic cell in a CI byte gate produces flaky reds and trains the team to ignore the board — the opposite of the north star. Until seeded, clump cells run reachability-only (mode 1), not byte (mode 2).

### 4.5 What this is NOT (scope guard)
Not a full visual-diff engine (perceptual thresholds are reviewer-judged in v1, not automated), not Pascal's scorer, not the gallery generator. Those are Q2 fill if needed. v1 = one script, two file trees, a CI hook, a blessing-by-baseline-diff rule.

---

## Summary

| Question | Answer |
|---|---|
| What does "tests passed" mean? | Gate by the change's *claim*: byte-identical (unchanged), visual-diff + declared blast radius (bounded intended change), aesthetic scoring + re-bless (better art). Byte-identical is necessary, not sufficient. |
| What must the gallery cover honestly? | A spanning+risk matrix (~40–60 gated cells): pack spine × demo spine × off-grid probes × hair-interaction × reachability fixtures — not the full cross-product. Gallery cells outside the gate matrix are decorative, not verified. |
| How is the mixture rule guarded? | One render fixture per filed aesthetic (FA-01…06), swept for **reachability** (hard, non-waivable) and **stability** (byte, blessable). Registry table = source of truth; filing = row + fixture in one PR. |
| Q2-opening scaffold | One `regression-sweep` script (`--gate` / `--full` / `--bless`), a `regression/` fixture tree keyed by selector, blessing-by-baseline-diff, `--gate` as a required CI check. Precondition: confirm/fix clump-hair determinism. |
