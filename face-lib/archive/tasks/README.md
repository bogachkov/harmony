# Tasks folder

Individual task files for detailed briefs, handoffs, and in-flight notes
the SPRINT.md row-summary can't carry.

## Convention

**Filename:** `<agent>-<short-description>.md`
Examples: `nick-shortpomp-v3.md`, `leo-3d-abstraction-extension.md`,
`lloyd-3d-refactor-architecture.md`.

**Required sections:**
- `## Brief` — what the agent is being asked to do
- `## Context` — links to relevant research, prior commits, related rows
  in SPRINT.md or BACKLOG.md
- `## Acceptance` — what "done" looks like
- `## Notes` — running notes, decisions made, blockers discovered
- `## Handoff` — when complete, what the next agent needs to know

**Lifecycle:**
- Created by the Tech Lead when spawning an agent for non-trivial work.
- Updated by the agent as work proceeds (the agent writes back to the file).
- Closed by the Tech Lead by moving to `tasks/done/` (or deleting — git
  keeps history) once the task is fully done and any handoff has landed.

## When to create a task file vs put it in the prompt

- **Prompt only:** task is fully captured in 1-2 paragraphs, no handoff
  needed, no future agent will refer to it.
- **Task file:** task spans multiple commits, has cross-agent handoffs,
  needs blockers tracked, or could be paused and resumed in a later
  sprint.

## Not in this folder

- Research / pedagogy / audit deliverables → `face-lib/research/*.md`
- Sprint-level status → `face-lib/SPRINT.md`
- Backlog / deferred / filed aesthetics → `face-lib/BACKLOG.md`
- Crew roles + durable rules → `face-lib/AGENTS.md`
