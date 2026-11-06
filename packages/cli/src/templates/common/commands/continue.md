# Continue Current Task

Resume the current task by loading its state, selected work context and matching
step in `.trellis/workflow.md`.

---

## Step 1: Load Current Context

```bash
{{PYTHON_CMD}} ./.trellis/scripts/get_context.py
```

Confirms: current task, git state, recent commits.

## Step 2: Restore work context

Read the task PRD for delivery scope/status, then restore its selected context:

```bash
{{PYTHON_CMD}} ./.trellis/scripts/get_context.py --mode work --task <task>
```

Follow Work context and Records and evidence in `.trellis/workflow.md`. Read
the selected spec bodies and linked topic record, beginning with its current
research state. An index or summary alone does not satisfy the spec read.
If metadata is absent or stale, choose the package and types from the request,
pass the corresponding options and retain useful selections in task metadata.
Read newly applicable rules when switching packages or work types.

## Step 3: Load the Phase Index

```bash
{{PYTHON_CMD}} ./.trellis/scripts/get_context.py --mode phase
```

Shows the Phase Index (Plan / Execute / Finish) with routing + skill mapping.

## Step 4: Resume Where You Are

Route by the task's `status` and what its directory actually contains:

- `planning`, no `prd.md` → write `prd.md` (goal, scope, acceptance criteria). Load `trellis-brainstorm` if the requirements are genuinely unclear; if the request is already clear, write the PRD and move on.
- `planning`, `prd.md` exists → start the task and implement. No further planning artifact is required.
- `in_progress` → continue the work. Do not re-request approval for work the user already authorized.
- done → archive it (see `{{CMD_REF:finish-work}}`).

No additional planning document or context manifest is required. Scientific
reasoning stays in the linked package topic record under the workflow rules.

## Step 5: Load the Specific Step

```bash
{{PYTHON_CMD}} ./.trellis/scripts/get_context.py --mode phase --step <X.X> --platform {{CLI_FLAG}}
```

Follow the loaded instructions for that step only.

---

## Reference

`.trellis/workflow.md` holds the canonical phases and step detail. This command is an entry point, not a second copy of the rules.
