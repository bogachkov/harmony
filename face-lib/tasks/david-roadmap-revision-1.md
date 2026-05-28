# david-roadmap-revision-1

David's second pass. Bob made a scope-revision decision (per Gary's
delegation) and is checking with David before landing, per Gary's "David
must be in the loop" constraint.

## Brief

Gary surfaced new scope guidance after your pass 1:
- "I am open to pushback on scope. I can sacrifice monsters if that
  is needed. Can be flexible on animals too. People must be really well
  done by Q3."

Bob's response surfaced one pushback: animals and monsters aren't
equivalent risks-to-cut. The jaw topology dispatcher we built is
architecturally the generalization test for "engine works beyond
humans." Animals test that; monsters are more parametric (asymmetry +
multiple appendages as discrete choices) and arguably easier. From an
"engine reveals its own generality" standpoint, monsters are the safer
cut, not animals.

Gary's call: "you decide. But David must be in loop right."

## Bob's proposed revision (decision pending your input)

Q3 vision shift:

- **Q3 (new) — People done well.** Cross-style consistency, full-character
  coherence, the LLM-tool-call surface tested against real
  demographic × style × pose × clothes requests. This is the
  "we ship excellent people" gate.
- **Q4 (new) — Animals (primary; tests engine generalization).** Monsters
  become a stretch goal if Q4 has capacity; otherwise pushed to next
  year. Rationale: animals are the architectural generalization test
  for the jaw-topology dispatcher and all related primitives. Cutting
  animals leaves a real architectural unknown into the next year.

Q1 and Q2 unchanged.

The "out of scope for this AI year" section now includes monsters as
a stretch line item rather than a guaranteed Q4 ship.

## Your task

Validate or push back on this revision. Specifically:

1. **Is Bob's pushback on monsters-vs-animals architecturally sound?**
   Or is it Bob's tech-aesthetic talking over Gary's product instinct?
   Honest read.

2. **Does Q3 = "people done well" have enough definition to be a real
   gate?** Or is it fuzzy in a way that lets the team coast?

3. **Is monsters-as-stretch the right framing?** Alternatives: monsters
   in Q4 with animals deferred; both in Q4 with one likely to slip;
   skip animals entirely as Gary suggested earlier.

4. **Anything else this revision missed.**

Authority: same as pass 1 — recommend, do NOT decide. Bob holds the
decision (per Gary's delegation); your input shapes it.

## Deliverable

Append to `face-lib/research/david-pass-1.md` a new section
`## Pass 2 — scope revision validation` (50 line cap, sharp opinions).

End with a 3-bullet summary: "support revision as drafted" / "support
with these edits" / "push back on these grounds."

Update `## Handoff` in this task file.

## Context

- `face-lib/AGENTS.md` — your role and the rules.
- `face-lib/ROADMAP.md` — current draft (about to be revised).
- `face-lib/research/david-pass-1.md` — your pass 1 work.

## Handoff

(David fills in.)
