---
name: trellis-finish-work
description: "Close completed work with proportionate verification, update its PRD and archive without automatic Git writes or journals. Use when finishing an implementation task."
---

# Finish Work

Follow Phase 3 in `.trellis/workflow.md`. Use only the verification needed for
the changed behavior or scientific claim. Update the existing task PRD if tracked.

When the goal is genuinely achieved:
```bash
python ./.trellis/scripts/task.py archive <task-name> --completed --no-commit
```

For user-requested administrative archival of unfinished work, record what remains
in the PRD and omit `--completed`; status is preserved. No commit or clean tree is
required. Do not create a task just to close a small change. No default journal,
spec update, Git write or second finish approval.

Briefly report the changes, actual checks/results and unresolved issues.
