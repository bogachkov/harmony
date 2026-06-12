# david-team-rescope-graphics-specialist

David's third spawn. Bob has a recommendation for a new team role
(graphics-domain specialist) and Gary has pre-approved pending
your sign-off. Coordinate with Bob on scope.

## Brief

Bob surfaced a real gap during W2 close: the team has no dedicated
graphics-domain specialist. Lloyd is a senior programmer + architect
+ code reviewer; he is NOT a graphics-math senior. Symptom: Lloyd's
own alpha-shape design pass projected ~80 LOC; Nick's implementation
landed at ~340 LOC. Lloyd's Pass-3 self-review on the overrun:
his §7 "projection was naive about input scale" — the 4500-capsule
hullGroups, the need for grid pre-dedup, the boundary stitch, the
Bowyer-Watson Delaunay choice were all not in his spec. Nick
implemented past these gotchas honestly but doesn't push back on
graphics math at design time.

Bob's recommendation, in plain English:

- **Add a graphics-domain senior.** Scope NARROW: pairs with Lloyd
  on architecture (math-sanity-check before designs hit Nick), and
  owns primitive-level engine work that is deep graphics
  (hair-strand primitives, eye geometry, future signed-distance /
  level-set / hull-merger work). Nick stays the broad implementer.
- Position the new role as a *domain* senior, not an architecture
  senior — keep the seniority delta with Lloyd clear (one
  architecture senior, one domain senior).
- The acute W3 trigger: long-hair primitive rebuild (cells 6/7/11
  of the timmFlat grid) is exactly the kind of work that benefits
  from this role.

Gary's message verbatim: *"you and david should coordinate that and
rescope the roles and add someone or modify as needed. you
definitely do need to clear that w me and w david but i personally
approve if he does."*

## Your task

You own the directional / org call. Decide:

1. **Do we hire?** (Y / N / counter-propose.) If N, what's the
   alternative — better-scope Lloyd's pass to flag math gotchas?
   Get the hair-theorist as a recurring consultant rather than a
   role? Promote Nick's seniority? Anything you think is sharper
   than Bob's "add a person."

2. **If Y, scope the role.** Title (graphics domain senior, or
   something else). One-paragraph charter. Lane boundaries vs
   Lloyd + Nick. Decision rights — does the new role review Nick's
   primitive PRs? Does Lloyd still review architecture? Who calls
   when they disagree?

3. **Name the person.** Pick a memorable name that telegraphs the
   role (Bob's prior name picks: Lloyd from Lloyd Demause-ish, Nick
   from a graphic-novel inker, Leo for the instructor — pattern is
   first-name only, evocative-of-the-role). Don't be too on-the-
   nose (e.g., "Catmull" would be too literal).

4. **AGENTS.md / PROCESS.md / ROADMAP.md updates.** Whatever you
   touch, update. Bob is autonomous and will follow your scoping.

## Constraints

- Q1 envelope: don't break it. We're 2 weeks in on a 4-week Q1.
  Q1 goal: face primitives + N≥4 style packs at quality. If your
  re-scope changes the Q1 envelope (eg pushing the new hire's
  on-boarding into W3 displaces W3 deliverables), flag it.
- Gary's mixture-not-survival rule (AGENTS.md) — don't delete
  existing roles to make room. Modifying a role is fine; deleting
  one needs Gary's eye.
- The cost is "almost free" per Gary — LLM spawns are cheap.
  Don't gate on cost, gate on coordination friction. More roles
  = more vocabulary churn (Gary already flagged confusion about
  "ship" jargon today).

## Deliverable

- Your verdict (Y / N / counter): land it as text in this task
  file's `## Handoff`.
- Updated `face-lib/AGENTS.md` with the new role (if Y) or a
  rewritten Lloyd/Nick row (if your counter is "modify in place").
- Optional: updated `face-lib/PROCESS.md` if decision rights shift.
- Optional: updated `face-lib/ROADMAP.md` if the W3 trajectory
  changes (eg "long-hair primitive rebuild now owned by the new
  role").
- Brief return note (<200 words) to Bob: your call, why, what
  changes, what to surface to Gary for the final approval ping.

## Context

- `face-lib/AGENTS.md` — current 9-role crew.
- `face-lib/PROCESS.md` — decision rights matrix.
- `face-lib/ROADMAP.md` — Q1-Q4 trajectory + cross-quarter principles.
- `face-lib/research/david-pass-1.md` — your prior roadmap review.
- `face-lib/tasks/david-roadmap-review-1.md` + `david-roadmap-revision-1.md`
  — your prior task handoffs.
- `face-lib/research/lloyd-pass-1.md` (with Pass 2 + Pass 3
  appended) — Lloyd's design + his honest LOC-overrun
  self-review (Pass 3 §1). This is the symptom doc.
- `face-lib/research/lloyd-cascade-architecture.md` — Lloyd's
  most recent design pass; another data point on Lloyd's
  architectural-vs-domain bandwidth.
- `face-lib/research/pascal-w2-timmflat.md` — Pascal's W2-close
  pass (cells 6/7/11 long-hair primitive ceiling is the acute
  W3 trigger Bob cited).

## Handoff

David pass 3 complete. **Verdict: Y on the hire.** Approving Bob's
recommendation as scoped, with one tightening on the lane-boundary
language.

### Why Y, not counter-propose

Walked the three Bob-listed alternatives and they don't fix the
root cause:

1. **Better-scope Lloyd's design passes to flag math gotchas.**
   Doesn't work for unknown-unknowns. Lloyd's pass-1 §7 actually
   DID flag the convex-hull tech-debt risk explicitly — he just
   mis-sized it at "~80 LOC, deferrable" because he didn't know
   that real fixtures produce 4500-capsule hullGroups → 72k raw
   outline verts (his own Pass-3 §1 admission). No prompt-tightening
   catches what the designer doesn't know they don't know. The miss
   is domain knowledge, not process.

2. **Hair-theorist as recurring consultant.** Hair-theorist is a
   research-doc-output role, not a design-pairing role. Wrong
   cadence, wrong artifact. Could supplement Felix, but not
   substitute.

3. **Promote Nick to dual-hat senior.** Nick is excellent as broad
   implementer and W3 is Nick-heavy (cascade-merge manifest +
   demographic-preset push). Pulling him into senior-reviewer
   bandwidth right when implementation throughput matters is the
   wrong direction. Also doesn't fix the timing problem — Nick
   doesn't enter the loop until after design.

The pattern across Lloyd's two design passes is clear: cascade-
architecture (W2, pure plumbing) was clean; clump-volume (W1, deep
graphics math interior) had the §7 miss. Lloyd's lane is genuinely
architecture-not-graphics-math. The acute W3 trigger (long-hair
primitive rebuild for cells 6/7/11) is exactly the kind of work
that'd produce a second §7-class miss without Felix.

Cost is "almost free" per Gary; coordination friction is the real
gate, and I think one new clearly-named role with sharp lane
boundaries is below the friction threshold. We're at 9 roles +
Gary; going to 10 + Gary doesn't hit vocabulary saturation.

### Role scope (landed in AGENTS.md)

- **Name:** Felix. Plain first name (per Gary's "drop the jargon"
  signal today); evokes geometry (Felix Klein, Erlangen geometry
  tradition) without being on-the-nose like Catmull. Matches the
  Bob/Lloyd/Nick/Leo/Pascal/Rollo/Holly/Claudia rhythm.
- **Title:** graphics-domain senior.
- **Charter (one paragraph):** Owns the graphics-math interior of
  primitives — algorithm class, input-scale sizing, numerical
  correctness — for the deep-graphics work (hull / SDF / hair-strand
  / projection / level-set / capsule-merger). Pairs with Lloyd on
  designs that have both an architectural seam AND a graphics-math
  interior (Lloyd owns the seam, Felix owns the interior). Reviews
  Nick's deep-graphics implementations for math correctness.
- **Lane boundaries:**
  - vs Lloyd — architecture-vs-graphics-math; types / cascade /
    module boundaries are Lloyd, algorithm / sizing / numerical
    are Felix. Co-design when both surfaces touch.
  - vs Nick — Felix is design + review, NOT parallel
    implementation. Nick stays the broad implementer. Felix's
    upstream presence is the change.
  - vs Leo — Leo specs the artist's symbolic intent; Felix sizes
    the math to it. Co-design on hair / primitive work.
- **Decision rights** (added to PROCESS.md):
  - Graphics-math interior of a primitive → Felix.
  - Architecture / type / cascade design → Lloyd.
  - Conflict resolution: split by lane; co-design when straddling;
    Bob mediates.
- **Stop-the-line authority:** Felix can STOP a primitive design
  at design time on "wrong algorithm class for our input scale."
  That's the move that didn't happen on the alpha-shape pass and
  is the load-bearing reason for adding the role.
- **First spawn:** long-hair primitive rebuild for Pascal W2 cells
  6/7/11 (the acute W3 trigger Bob named). Real deep-graphics task,
  bounded scope, clear quality bar — right calibration piece of
  work.

### What changed in the docs

- `face-lib/AGENTS.md` — header updated "Nine roles" → "Ten roles";
  Lloyd's row tightened with an explicit graphics-math hand-off
  rule and the alpha-shape miss as the canonical example; Felix
  row added between Lloyd and Cross-cutting; Nick's row updated
  with the Felix lane boundary (Nick is NOT demoted — Felix is a
  NEW lane).
- `face-lib/PROCESS.md` — decision-rights table gains two rows
  (architecture / graphics-math); escalation paths gain Lloyd-vs-
  Felix and Felix-vs-Leo lane-split rules.
- `face-lib/ROADMAP.md` — untouched. Q1 trajectory unchanged.
  Q1 still ships N≥4 packs at quality bar; Felix's first work
  closes cells 6/7/11 which is already in the W3 plan.
- `face-lib/SPRINT.md` — untouched. Claudia owns it and is in
  flight on `tasks/claudia-q1w2-close-w3-plan.md`. She'll reflect
  the "long-hair primitive → Felix" routing in her W3 queue per
  her task brief (which already anticipates this hire decision).

### Q1 envelope impact

Zero. Felix onboards through the long-hair primitive work that
was already in the W3 queue; we're not adding a new line item,
we're routing an existing one to a more-fit owner. Mixture rule
satisfied (no role deleted; Lloyd, Nick, Leo all keep their
scope, with Lloyd's gaining a hand-off rule that was implicit
and is now explicit).

### What needs Gary's nod (return note → Bob → Gary)

Per Gary's "you definitely do need to clear that w me and w david
but i personally approve if he does" — he's approving on my say-so.
So this is a confirmation ping, not a re-litigation. The pieces
Gary should know:

- One new role, name Felix, NARROW scope (graphics-math interior
  only), no role deleted.
- First Felix spawn: long-hair primitive rebuild (cells 6/7/11);
  bounded; real; the acute trigger Bob named.
- Lloyd kept as architecture senior; Nick kept as broad
  implementer; lane boundaries written explicitly into AGENTS.md.
- Goes from 9 roles to 10. Below the vocabulary-saturation
  threshold IMO.
- Q1 envelope unchanged.

If Gary wants to push back, the surface to push on is "10 roles
is too many" (legitimate) or "Felix's lane should be merged with
Lloyd's by promoting Lloyd to architect+graphics-math senior"
(I'd argue against — Lloyd has demonstrated lane, asking him to
add graphics-math means asking for a second §7-class miss). Bob
should surface those as the live questions.

— David, pass 3 complete. AGENTS.md + PROCESS.md updated; task
file Handoff written; ready for commit on `vector-draw`.
