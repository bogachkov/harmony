# Archive — historical only, not active

**This is a historical archive of the agentic-team experiment.** It is not the current state of the project. Nothing in here is active guidance, an active role, or an active plan. Do not load these files as instructions for new work.

## What this was

Gary tried running the `face-lib` project with a multi-role agentic crew (Bob, Claudia, David, Felix, Holly, Leo, Lloyd, Nick, Pascal, Rollo). Each role had a persona definition, decision rights, lane boundaries. Sprints opened and closed against role hand-offs. The hypothesis was that a layered "company" of LLM agents could do the work that would otherwise take much longer.

## What happened

The first few days produced real engine progress because each step had a clear visible problem and someone solved it. The structure didn't hurt and may have helped.

By the end of the trial week, the structure started running on its own narrative. Scoring drifted, plans bloated, vocabulary inflated, and the team optimized for internal consistency instead of the actual rendered output. A single render of the lead test face — cell 1 of the timmFlat grid — was, by Gary's own eye, worse than his 60-second sketch. The agentic scorer was meanwhile reporting "Pascal-5, pro could draw this on an off day."

Gary's read: *"It works as well as a single agent on the easy parts and worse than a single agent the moment the work gets fuzzy."*

The experiment is ended. The project continues without the role layer.

## What's in here

- `AGENTS.md` — master role definitions for the ten-role crew.
- `agents/` — per-role files (one per persona), extracted on the last day for review.
- `PROCESS.md` — sprint loop, cadence, decision-rights matrix.
- `BOB.md` — the "Bob" persona's memory file. Contains real notes about Gary that may still be useful as a personal-context document if Gary wants to revive that part — but reviving the Bob persona itself is not implied.
- `tasks/` — per-spawn task briefs and hand-off notes. The work record of the experiment.

## What's still active (not in this archive)

- `face-lib/ROADMAP.md`, `face-lib/SPRINT.md`, `face-lib/BACKLOG.md` — project state docs, no longer routed through PM persona.
- `face-lib/research/` — actual technical research documents (hair theory, alpha-shape design, attachment model, ceiling audit, etc). These have real engineering value independent of who wrote them.
- `face-lib/src/`, `face-lib/scripts/` — the code itself.

The code does what the code does. The role layer is what's being retired.
