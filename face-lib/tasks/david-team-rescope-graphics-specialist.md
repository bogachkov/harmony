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

(David fills in on completion.)
