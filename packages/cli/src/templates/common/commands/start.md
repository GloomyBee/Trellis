# Start Session

Thin entry point: load current state, then read the one section of `.trellis/workflow.md` that matches your step. Do not re-derive the rules here — they live there.

---

## Step 1: Current state
Identity, git status, current task, active tasks, journal location.

```bash
{{PYTHON_CMD}} ./.trellis/scripts/get_context.py
```

If this output includes a line beginning `Trellis update available:`, copy the full line verbatim when summarizing session context. Do not shorten operational command hints.

## Step 2: Triage the request

| Request shape | What to do |
|---|---|
| Discussion, question, design opinion | Answer directly. No task, no planning artifacts. |
| Local change in one obvious place | Do it now. A task is optional; skip it for a one-shot fix. |
| Work spanning turns, or work that needs a written record | Create or resume a task. `task.json` + `prd.md` is the only human record required. |
| Major change of scientific route, or a high-cost run | Confirm with the user before starting. |

`design.md`, `implement.md`, `implement.jsonl`, `check.jsonl` are optional. Add one only when the task is big enough that the note saves more time than it costs. If the user already authorized the work, keep going — do not re-request approval each turn.

## Step 3: Load only the step you need

```bash
{{PYTHON_CMD}} ./.trellis/scripts/get_context.py --mode phase --step <X.X> --platform {{CLI_FLAG}}
```

`.trellis/workflow.md` is canonical for phases and steps. Read the section for the step you are on; ignore the rest.

## Step 4: Do the work

Work in the main session directly. Dispatch a sub-agent only when a piece of work is genuinely independent — there is no fixed pipeline and no required agent count.

Verify at the level the work needs:

- the thing must run → run it once
- values or behavior must be correct → check the values you depend on
- a scientific conclusion must hold → point at the evidence (run, data, comparison, citation)

No default full lint / typecheck / unit-test sweep. Run those when the change touches types or shared contracts.

---

## Skill routing (quick reference)

| User intent | Skill |
|---|---|
| Requirements unclear / deciding an approach | `trellis-brainstorm` |
| About to write code | `trellis-before-dev` |
| Wanting a quality pass | `trellis-check` |
| Stuck on the same bug repeatedly | `trellis-break-loop` |
| Something worth capturing | `trellis-update-spec` |

Full rules live in `.trellis/workflow.md`.
