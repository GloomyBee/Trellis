# Start Session

Thin entry point: load current state, then read the one section of `.trellis/workflow.md` that matches your step. Do not re-derive the rules here — they live there.

---

## Step 1: Current state
Read the current identity, git state and active task when present.

```bash
{{PYTHON_CMD}} ./.trellis/scripts/get_context.py
```

If this output includes a line beginning `Trellis update available:`, copy the full line verbatim when summarizing session context. Do not shorten operational command hints.

## Step 2: Select and read work context

Follow Request routing and Work context in `.trellis/workflow.md`. Understand
the request, then choose its package and work types; do not infer them from
keywords or agent names. Load the selected context:

```bash
{{PYTHON_CMD}} ./.trellis/scripts/get_context.py --mode work --work-type <types> --package-path <dir>
```

Use `--task <task>` for a tracked task, or `--research-record <md>` for an
existing topic document. Read the selected spec bodies and relevant record;
an index or hook overview alone is insufficient. Reuse task metadata on
resumption and refresh context when packages or work types change.

## Step 3: Load the workflow step

```bash
{{PYTHON_CMD}} ./.trellis/scripts/get_context.py --mode phase --step <X.X> --platform {{CLI_FLAG}}
```

`.trellis/workflow.md` is canonical for phases and steps. Read the section for the step you are on; ignore the rest.

## Step 4: Do the work

Follow the loaded step, Scientific verification, Records and evidence, and Skill
Routing in `.trellis/workflow.md`. Small changes need no task or research record.
Continue work already authorized without another start approval.
