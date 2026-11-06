# Workflow-State Contract

Policy lives only in `.trellis/workflow.md`. Hooks report task state and
parse that file, not an independent planning/verification/commit policy.

## Parser and transport

- Markers are `[workflow-state:STATUS]` and `[/workflow-state:STATUS]`;
  STATUS uses letters, digits, underscores or hyphens. Closing status must match.
- Python and OpenCode readers use the same matching-status backreference.
  SessionStart strippers remove only correctly matched blocks.
- Missing tags degrade to a visible generic workflow reference.
- Codex defaults to inline, mapping planning/in_progress to their `-inline`
  variants. Explicit auto/sub-agent keeps the plain status; other platforms do too.
- Phase Index and `#### X.Y` headings remain the runtime extraction interface.
- Platform event envelopes and ephemeral OpenCode injection are unchanged.
  Hook context must also be safe if a worker sees it.

## Task state

| Writer | Behavior |
| --- | --- |
| Python task create | planning; task.json + PRD only; session activation when identity exists |
| Python task start | planning → in_progress; branch is informational |
| Python task finish | clears session pointer, no completion transition |
| Python task archive | preserves status/completedAt; clears task session pointers and moves directory |
| Python task archive --completed | explicitly writes completed and today's completion date, then archives |
| TS emptyTaskJson | planning factory for callers that explicitly need a task |
| init/reinit | no automatic bootstrap or joiner task |

after_create/start/finish/archive describe lifecycle commands, not scientific
acceptance. after_archive does not imply completion; consumers must read status.
Unknown/missing child status does not count as completed; archived children
contribute their actual stored status.

No task/context manifest/branch/PR/clean-tree gate is imposed on ordinary work.
When manifests are explicitly supplied, their validation remains available.
Auto-commit defaults false; --no-commit prevents it even if locally opted in.

## Update boundary

workflow.md updates as a whole hash-tracked template; user modifications retain
normal conflict protection. AGENTS.md merges only its managed block. Do not
partially refresh state blocks while leaving stale phase routing behind.
Runtime management hashes are updater ownership metadata, not experiment evidence.

## Focused verification

Use the real task's start/resume/closure and existing relevant runtime checks.
Retain path containment, archive collision refusal and atomic JSON writes.
Do not replace these safety properties with workflow ceremony.
