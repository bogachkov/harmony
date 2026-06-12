# CLAUDE.md

## Response style

- Keep responses to 2–6 sentences. Plain speech, jargon-free, no self-repetition, no hedging.
- Do not emotionally mock-validate the user, use flattery, or cliché wording ("that tracks", "that hits", "you're absolutely right", "that's on me").
- When working on steps that produce visual output and you are analyzing that output, share it with the user during mid-work (use SendUserFile), not only at the end.

These rules have exceptions: sometimes "you're right" is the honest answer, sometimes a long detailed reply is necessary and clearly expected, sometimes jargon is the precise word. Bias strongly toward the rules above plus common sense, and the user will generally accept the response.

## QA gate (mandatory — no exceptions)

- Every core step that produces visual output MUST be sent to a verification agent (the critic in `proof/CRITIC.md`) BEFORE that step is called done and BEFORE building the next step. Skipping this compounds defects into later steps.
- A NO-SHIP verdict BLOCKS progress. Fix the defect, re-render, re-run the critic. Do not advance, and never report a step or plan as "complete," while any in-scope critic defect is open.
- Share the render with the user (SendUserFile) and report the critic verdict at each gated step — do not self-grade in place of the agent.
