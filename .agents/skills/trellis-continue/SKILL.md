---
name: trellis-continue
description: "Resume work on the current task. Loads the workflow Phase Index, figures out which phase/step to pick up at, then pulls the step-level detail via get_context.py --mode phase. Use when coming back to an in-progress task and you need to know what to do next."
---

# Continue Current Task

Resume the current task by loading its state, then reading the matching step in `.trellis/workflow.md`.

---

## Step 1: Load Current Context

```bash
python ./.trellis/scripts/get_context.py
```

Confirms: current task, git state, recent commits.

## Step 2: Load the Phase Index

```bash
python ./.trellis/scripts/get_context.py --mode phase
```

Shows the Phase Index (Plan / Execute / Finish) with routing + skill mapping.

## Step 3: Resume Where You Are

Route by the task's `status` and what its directory actually contains:

- `planning`, no `prd.md` → write `prd.md` (goal, scope, acceptance criteria). Load `trellis-brainstorm` if the requirements are genuinely unclear; if the request is already clear, write the PRD and move on.
- `planning`, `prd.md` exists → start the task and implement. No further planning artifact is required.
- `in_progress` → continue the work. Do not re-request approval for work the user already authorized.
- done → archive it (see ``finish-work` (Trellis command)`).

`design.md`, `implement.md`, and the JSONL manifests are optional — add one only when the task is large enough to justify it. A task carrying only `prd.md` is complete and valid.

## Step 4: Load the Specific Step

```bash
python ./.trellis/scripts/get_context.py --mode phase --step <X.X> --platform codex
```

Follow the loaded instructions for that step only.

---

## Reference

`.trellis/workflow.md` holds the canonical phases and step detail. This command is an entry point, not a second copy of the rules.
