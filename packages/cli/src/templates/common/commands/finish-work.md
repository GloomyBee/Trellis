# Finish Work

This finish-work entry point follows the shared workflow, not a separate checklist.

Follow Phase 3 in `.trellis/workflow.md`. Use only the verification needed for
the changed behavior or scientific claim. Follow Records and evidence there:
update a topic record after substantive research progress and link it from the
tracked PRD, whose purpose is delivery scope and status. Small edits need no record.

When the goal is genuinely achieved:
```bash
{{PYTHON_CMD}} ./.trellis/scripts/task.py archive <task-name> --completed --no-commit
```

For user-requested administrative archival of unfinished work, record what remains
in the PRD and omit `--completed`; status is preserved. No commit or clean tree is
required. Do not create a task just to close a small change. No default journal,
spec update, Git write or second finish approval.

Briefly report the changes, actual checks/results and unresolved issues.
