# Change Local Context Loading

Context loading determines when AI reads workflow, task, spec, research, workspace, and git status. Read this page when the user says "AI does not know the current task," "the agent did not read specs," or "there is too much/too little context."

## Read These Files First

1. `.trellis/workflow.md`
2. `.trellis/scripts/get_context.py`
3. `.trellis/scripts/common/session_context.py`
4. `.trellis/scripts/common/packages_context.py`
5. `.trellis/scripts/common/active_task.py`
6. Current platform hooks or agent files
7. Selected task metadata and optional manifests, if a task is in use

## Context Sources

| Source | Purpose |
| --- | --- |
| `.trellis/workflow.md` | Workflow and next-action hints. |
| `.trellis/tasks/<task>/prd.md` | Current task requirements. |
| `.trellis/tasks/<task>/design.md` | Complex task technical design. |
| `.trellis/tasks/<task>/implement.md` | Complex task execution plan. |
| `get_context.py --mode work` | Selected work-type rules, package entry points and current research state. |
| Package `docs/research/<topic>.md` | Lasting scientific reasoning and stage history; load current state first. |
| Task JSONL, when used | Additional curated spec/research references for a worker. |
| `.trellis/spec/` | Project specs. |
| `.trellis/workspace/` | Session records. |
| git status | Current working tree changes. |

## Common Needs And Edit Points

| Need | Edit point |
| --- | --- |
| Inject more/less information in new sessions | `session_context.py` or the platform `session-start` hook. |
| Change hints on each user input | `[workflow-state:STATUS]` block in `.trellis/workflow.md`. The `inject-workflow-state` hook is parser-only and reads the block verbatim. |
| Agent did not read specs | Work-type/package selection, `packages_context.py`, agent prelude and context hook. |
| Active task is lost | `active_task.py` and platform session identity propagation. |
| Change JSONL validation rules | `task_context.py`. |

## Scoped Work Context

Follow Work context in `.trellis/workflow.md`. For example:

```bash
python .trellis/scripts/get_context.py --mode work --work-type code,writing --package-path path/to/package
```

Explicit arguments override task `meta.work_types` (comma-separated string),
`meta.package_path` and `meta.research_record` (repository-relative paths).
Use `--task <task>` to select a tracked task. No task is required.
`--summary` supplies paths and current research state, not rule bodies or the
full scientific history. Read relevant bodies before work and refresh when the
package/type changes. Do not guess selection from prompt keywords.

## Optional JSONL Rules

`implement.jsonl` / `check.jsonl` can supply additional selected references:

```jsonl
{"file": ".trellis/spec/backend/index.md", "reason": "Backend conventions"}
{"file": "path/to/package/docs/algorithm.md", "reason": "Algorithm details"}
```

Include only spec/research files. Do not put code files that will be modified into these manifests; agents read code files themselves during implementation.

## Change Session Context

If the user wants every new session to see more project state, edit:

- `.trellis/scripts/common/session_context.py`
- the corresponding platform `session-start` hook

Context cannot grow without bound. Prefer injecting indexes and paths so the AI can read detailed files on demand.

## Change Sub-Agent Context

First determine which mode the platform uses:

- hook push: edit the `inject-subagent-context` hook.
- agent pull: edit the read steps in the corresponding `trellis-implement` / `trellis-check` agent file.

In both modes, make sure the agent ultimately reads:

1. selected spec bodies and relevant package/topic context
2. PRD if a task is supplied, plus additional manifest references when present
3. optional design/implementation notes only when useful to the assignment

All injected bodies share the configured context budget. Retain the runtime's
current-state excerpt instead of rereading the full research history by path.

## Troubleshooting Order

```bash
python ./.trellis/scripts/task.py current --source
python ./.trellis/scripts/get_context.py --mode work --task <task> --summary
python ./.trellis/scripts/get_context.py --mode packages
```

Confirm scope and session identity before editing hooks/agents. Inspect optional
JSONL only when it is actually used; its absence is not an error or start gate.
