# david-q1-w3close-directional-review

David's fourth spawn. End-of-W3 directional review (3 of 4 weeks into
Q1) + set W4 direction. Gary said "continue to next cycle" — your job
is to point the next cycle, then Claudia plans against your direction.

## Brief

W3 closed clean: Pascal scored the full timmFlat 16-cell grid at
**16/16 ≥ 5** (strict close, not ship-with-gap). Four-corner test
passes. tintin × 4 regression holds. The three W3 engine rows
(Q2 demographic-topology, Q1 cascade-merge manifest, Felix's
long-hair primitive) all landed + Lloyd-approved.

We are now **3 of 4 weeks into Q1.** Per ROADMAP, your directional
review naturally lands here. Gary's instruction: continue to the
next cycle (W4). Your job is to set W4's direction so Claudia can
plan against it.

## State of Q1 (for your assessment)

- **Packs: 4** — default, tintin, ligneClaire, timmFlat. ROADMAP
  Q1 floor is N≥4 at quality. **We're AT the floor.** timmFlat is
  the first pack built under the structured process; it ships at
  Pascal-5 ("a real pro could plausibly have drawn this on an off
  day") across full 16-cell demographic depth.
- **Face primitives:** eyes (almond + plumbed lidLine/lashes/
  underlineHint), brows, mouth, nose, ears, neck, hair (flat +
  volume clump modes, alpha-shape hull, long-hair flat-curtain
  primitive). Q1 goal language was "faces really really good
  including ALL face primitives."
- **Engine vs style separation:** now enforced at compile time
  (Lloyd's Q1 cascade-merge manifest — pack pedagogy paths are a
  type-constrained union; demographic-only knobs inadmissible).
- **Team:** 10 roles + Gary. Felix (graphics-domain senior) added
  W3, delivered his first piece (long-hair primitive) with an
  honest day-one calibration surface.

## The W4 direction fork (your call)

Pascal flagged at W3 close: timmFlat ships at Pascal-5 (pro daily
output). The next ceiling is Pascal 6-7 (confident pro / print-
ready-without-caveats). "Not a gap, a ceiling." This sets up the
W4 fork:

- **(A) Pack #5** — spec + implement a new style pack (Leo + Rollo
  spec, then Nick/Felix implement). Grows pack count 4→5, breadth
  over depth. The W4 next-pack-spec slot Claudia already slipped
  here in W2.
- **(B) Polish timmFlat toward master-tier** — push the existing
  pack from Pascal-5 to 6-7. Depth over breadth. Uses the BACKLOG
  ceiling-raisers (highlightCutout, per-feature line-weight
  multiplier, etc). Tests whether the engine CAN reach confident-
  pro, which de-risks every future pack.
- **(C) Q1 closeout + hardening** — Holly's first spawn (test-
  strategy doc, deferred since W1), regression-test coverage, doc
  pass, BACKLOG triage. Lock in what we have before Q2 (bodies/
  clothes/poses) opens.
- **(D) Some mix / other** — your call.

Gary's quality bar anchor (from ROADMAP): "doesn't suck, my non-
artist friends would be impressed, i might use it in a video game
as artwork." Weigh the fork against whether we've HIT that bar yet
or need (B) to clear it. Also weigh: Q2 is bodies/clothes/poses —
does Q1 need (C) hardening before that complexity lands, or is the
engine clean enough to keep moving?

## Your task

1. **Q1 trajectory verdict.** Are we on track for the Q1 goal
   (faces really good + N≥4 packs at quality)? One paragraph. If
   anything's off-track, name it.
2. **Set W4 direction.** Pick A / B / C / D (or a weighted mix).
   Justify against the ROADMAP + Gary's quality bar. This is the
   directional call Claudia plans against.
3. **Flag anything for Gary.** Pascal's ceiling note framed it as
   a Gary-awareness item ("16/16 at off-day-pro is honest shipping,
   not master-tier"). If your W4 direction implies a quality-bar
   judgment Gary should confirm, name it for the thread.
4. **ROADMAP updates** if the W4 direction shifts the Q1→Q2 handoff
   or any cross-quarter principle.

## Constraints

- Don't break the Q1 envelope. If your W4 direction can't fit one
  week, say what slips to Q2 or gets cut.
- Mixture rule. Don't delete; defer to BACKLOG.
- You set DIRECTION; Claudia sets the sprint plan + spawn order +
  task files. Don't write Claudia's plan — hand her a pointed
  direction.

## Deliverable

- Your verdict + W4 direction in this task file's `## Handoff`.
- ROADMAP.md updates if warranted.
- Brief return note (<200 words) to Bob: trajectory verdict, W4
  direction, what to surface to Gary.

## Context

- `face-lib/ROADMAP.md` — Q1-Q4 + quality bar + cross-quarter
  principles.
- `face-lib/AGENTS.md` — 10-role crew (with Felix).
- `face-lib/SPRINT.md` — W3 close state.
- `face-lib/research/pascal-w2-timmflat.md` §Pass 3 — the W3 close
  scores + the ceiling note.
- `face-lib/research/david-pass-1.md` + prior david task handoffs
  — your prior directional calls.
- `face-lib/BACKLOG.md` — the ceiling-raisers (option B fuel) +
  deferred pack candidates (option A fuel).

## Handoff

David's W4 directional call. (Note: written under a degraded tool
channel — BACKLOG/SPRINT/Pascal-rescore could not be re-read live this
session; this call rests on the task brief's quoted state, AGENTS.md,
ROADMAP.md, and prior david handoffs, all of which I did read. If
Claudia finds the BACKLOG ceiling-raiser list differs materially from
what's quoted here, the *direction* still holds — only the named knobs
in §B would shift.)

### 1. Q1 trajectory verdict — ON TRACK, honestly at the floor

We are on track for the Q1 goal, with one honest caveat that is a
feature of our process, not a failure of it. The concrete deliverable
is "N≥4 style packs at quality bar, demographic depth > pack count."
We have 4 packs (default, tintin, ligneClaire, timmFlat) and timmFlat
— the first pack built end-to-end under the structured Leo→Felix→Nick
→Pascal process — closed at 16/16 ≥ Pascal-5 across the full 16-cell
demographic grid, four-corner test passing, tintin×4 regression
holding. That is the deliverable met as written: floor cleared, depth
present, strict close (not ship-with-gap). The caveat: the deliverable
is met at the *floor* (Pascal-5, "off-day-pro"), not at the working-pro
target (Pascal-7) the ROADMAP names as the aspiration. "16/16 at
off-day-pro across 4 packs" satisfies the letter of the Q1 goal. It is
an open question — Gary's to answer — whether it satisfies the spirit
of "really really good" and Gary's gut bar ("my non-artist friends
would be impressed, i might use it in a video game as artwork"). That
gap between letter-met and spirit-maybe is the whole substance of the
W4 call below. Nothing is *off* track; the question is whether we spend
the last week proving the ceiling or widening the floor.

### 2. W4 direction — (B) primary, then (C). Defer (A) to Q2-open.

**Weighting: B ~60%, C ~40%, A deferred (not cut).**

**Primary: (B) Polish timmFlat toward master-tier (Pascal-5 → 6-7).**

Rationale, in priority order:

- **(B) is the de-risking move, and de-risking beats breadth at the
  floor.** We are exactly at N≥4. A 5th pack at Pascal-5 grows the
  count but proves nothing new — we already know the engine produces
  off-day-pro packs; timmFlat demonstrated it. What we do NOT yet know
  is whether the engine *can reach* confident-pro at all. If it can't,
  that is the single most important thing to learn before Q2, because
  the Q2→Q3 ship gate requires every Q1 pack to *extend across bodies/
  clothes/poses at the quality bar* — and if the face ceiling is
  Pascal-5, the clothed-character ceiling will be lower, and we'll find
  out in Q3 when it's expensive. Proving the ceiling now, on the one
  pack we've fully exercised, retires that risk for every future pack.

- **(B) is the honest answer to Gary's bar.** Gary's bar is not "an
  editor could find no fault" (that's Pascal-9). It's "doesn't suck /
  friends impressed / usable as game artwork." Pascal-5 is *literally*
  defined as "a real pro could plausibly have drawn this on an off day,
  with visible weaknesses an editor would flag." A render an editor
  would flag is a render a sharp non-artist friend might side-eye.
  Pascal 6-7 is where "I'd actually drop this into my game" lives. (B)
  is the most direct path to clearing Gary's *gut* bar, not just the
  rubric floor.

- **(B) uses fuel we already filed.** The BACKLOG ceiling-raisers
  (highlightCutout, per-feature line-weight multiplier, and siblings)
  were filed precisely as the Pascal-5→7 levers. W4 spends them on the
  pack we understand best. This is depth-on-a-known-quantity, the
  lowest-variance week available.

- **Mixture rule is respected:** every ceiling-raiser lands as a new
  knob defaulting to current behavior. timmFlat-at-5 stays a reachable
  point; timmFlat-at-7 becomes a *new* reachable point. We are not
  optimizing one preset and deleting the others (that would violate
  Rollo's lane and the core engine rule) — we are expanding the
  parameter surface upward on one pack to prove the surface *has* that
  altitude.

**Secondary: (C) Q1 closeout — the parts that gate Q2, only those.**

(B) likely does not fill a full week alone, and the Q1→Q2 seam genuinely
needs hardening before bodies/clothes/poses land. So fold in the
*gating* slice of (C):

- **Holly's first spawn (test-strategy doc).** Deferred since W1; it's
  now overdue and it's exactly the right size to run in parallel with
  (B). Q2 triples the primitive surface (torso, limbs, clothing layer,
  pose) — entering that with no articulated regression convention is
  how the cascade-leak class of bug comes back. Holly's doc is "what
  does 'tests passed' mean for a parametric art engine" — a design
  artifact, not test code. It must land before Q2, and W4 is the slot.
- **A thin regression-coverage + BACKLOG-triage pass** so Claudia opens
  Q2 against a clean board rather than a W1-W3 sediment of deferrals.

**Deferred (NOT cut): (A) Pack #5.** The next-pack-spec slot stays
filed. The right home for it is **Q2-open**, where it can be specced
*with* its body conventions from the start (per the ROADMAP handoff
rule that each pack carries its own body/clothes/pose conventions, not
a generic body grafted on). Speccing pack #5 in W4 as a face-only pack
and then re-opening it in Q2 to add a body is wasted motion. Leo + Rollo
should spec pack #5 as a face+body pack at Q2-open. This is a mixture
deferral, not a deletion — it goes to BACKLOG as "pack #5: spec at
Q2-open, full-stack."

**What slips if (B)+(C) overrun one week:** the (C) BACKLOG-triage and
the broader (non-gating) regression coverage slip to Q2-open. The two
hard W4 commitments are: (B) one honest attempt at Pascal-6-7 on
timmFlat (Pascal re-scores; if it lands ≥6 we've proven the ceiling, if
it lands 5 we've proven the *current* ceiling and that itself is the
finding Gary needs), and Holly's test-strategy doc. Everything else is
fill. Lloyd's Q1-closeout body-architecture design pass (ROADMAP: "last
sprint of Q1 includes Lloyd's body-architecture design pass") is the
one other Q1-scoped item — Claudia decides whether it rides W4 or opens
Q2; my lean is Q2-open so W4 stays focused on proving the ceiling.

### 3. For Gary (the one thing that needs his confirmation)

**The quality-bar judgment Pascal flagged.** This is the call I cannot
make unilaterally and should not. Surface to Gary, plainly:

> "Q1's deliverable is met as written — 16/16 of timmFlat's demographic
> grid at Pascal-5 (off-day-pro), four packs, strict close. But Pascal-5
> is the *floor* of the rubric: 'a pro could've drawn this on an off
> day, with weaknesses an editor would flag.' It is NOT master-tier, and
> it may not yet clear your gut bar ('friends impressed / I'd use it in
> a game'). W4 spends the last Q1 week pushing timmFlat from 5 toward
> 6-7 to find out whether the engine *can* reach confident-pro, because
> that ceiling governs every body/clothes pack in Q2-Q3. Two things we
> want from you: (1) is 'honest off-day-pro across 4 packs' the Q1 win
> you wanted, or is master-tier the actual bar? (2) Do you want to lay
> eyes on the timmFlat grid yourself before we open Q2 — your eye is the
> final arbiter, and this is the moment it matters most."

If Gary says Pascal-5 across 4 packs IS the Q1 win, then (B) becomes a
nice-to-have and W4 tilts toward (C) closeout + (A) Q2-prep — Claudia
re-plans on his answer. The (B)-primary call above is my recommendation
*absent* that confirmation; it's the lower-regret bet because it
generates the exact information the decision needs.

### 4. ROADMAP updates

Two seam updates land (made below): the Q1 "last sprint" line now
names the W4 ceiling-prove + Holly-doc + Q2-prep shape, and the Q2
section gets the "pack #5 specced full-stack at Q2-open" deferral so
the handoff is explicit. The Pascal-5-floor-vs-7-target tension is
recorded as a named open question for Gary rather than silently
resolved.
