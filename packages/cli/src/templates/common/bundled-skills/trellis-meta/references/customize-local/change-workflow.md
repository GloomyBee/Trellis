# Change Local Workflow

Read the actual `.trellis/workflow.md`, the relevant entry point and current PRD.
The workflow is the rule source; commands, skills and hooks should reference it,
not carry separate planning/verification/commit policies.

Keep the parser interface when changing content: `## Phase Index`,
`## Phase 1: Plan` and `#### X.Y` step headings. State blocks use matching
`[workflow-state:STATUS]` / `[/workflow-state:STATUS]` pairs. Codex inline uses
planning-inline/in_progress-inline. Unknown states fall back visibly.

Small changes need no task. A tracked task normally uses JSON + one PRD; extra
planning artifacts, manifests and specialist workers are optional. Resume by the
actual goal, state and PRD, not by presence of a design/implementation document or
a prior agent review. Do not ask for redundant start/finish approval.

Review only the enabled entry points that conflict with the new behavior.
Update workflow.md as a whole managed file with normal user-edit protection;
do not refresh only breadcrumb text and leave stale routing behind.
