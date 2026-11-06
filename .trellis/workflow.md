# Research-first, Engineering-light

This file is the workflow source of truth. Platform commands, skills and agent
cards are entry points, not separate rulebooks. Explicit task-level scientific
requirements override lightweight defaults; safety and permission boundaries remain.

## Phase Index

Phase 1: Plan → understand the question and choose the smallest useful scope.
Phase 2: Execute → implement directly; investigate with discriminating experiments.
Phase 3: Finish → verify the claim, preserve useful evidence and close the task.

### Request routing

- Discussion, explanation or a requested proposal: answer without modifying files.
- Clear local change: do it directly, without requiring a Trellis task.
- Long-running, cross-session or multi-deliverable work: create a lightweight task
  and tell the user; authorization to implement does not need a second start approval.
- Material choices about mathematics, physics, research goals or costly experiments:
  propose the options before committing to a route.
- Read only the relevant package rules and code. Do not scan every skill, agent,
  hook, platform or spec on each task.

### Records and evidence

- A task normally contains only `task.json` (metadata) and `prd.md` (the single
  human task record: goal, scope, decisions, progress, conclusions and open questions).
- Additional context manifests or research notes are optional, never start gates.
- Package `docs/`: lasting mathematical/algorithmic knowledge and conclusions.
  Package `cases/`: detailed cases. Package `runs/`: experiment configurations,
  numerical results and figures. Git: code history. Do not duplicate these in tasks.
- Never put experimental source, datasets or package copies in a task directory.
- Preserve meaningful parameters, seeds when relevant, key results, useful figures,
  conclusions and an available code commit. A dirty tree must be disclosed; HEAD
  alone is not an exact identity for uncommitted experiment code.
- Negative results, failed hypotheses, No-Go decisions and competing explanations
  are research assets. Do not discard them as engineering clutter.
- No default journals, snapshots, fingerprints, hash chains or audit reports.
  Existing journal and memory tools remain available on explicit request.
- Create a spec only when it has actual reusable content. No mandatory four-file
  layout, empty documents or per-package copies of global rules.

### Scientific verification

Distinguish three claims: the implementation runs; the numerical computation is
correct; the evidence supports the scientific conclusion.

Use the smallest verification that can support the claim. Prefer existing focused
checks. Mathematical changes may require a known solution, identity or accuracy
comparison. Claims about convergence order or efficiency require corresponding
experiments. A smoke run cannot establish either claim.

Do not default to TDD, unit tests for every function or bug, full-repository test,
lint/typecheck pipelines, new fixtures, baselines or testing infrastructure.
Run small, informative experiments autonomously within the agreed scope and budget.
Ask before high-cost, long-running or materially expanded work.

### Collaboration and Git

The main agent works directly by default. Delegate only independent work or a
useful independent mathematical review. Give each worker a clear scope, inputs,
ownership and expected result. Respect tool resource limits and avoid conflicting
writes; there is no workflow-imposed agent count or Research→Implement→Check chain.
Use one collaboration mechanism for a piece of work, not duplicated tracking systems.

Do not automatically create branches/worktrees, commits, merges, PRs or pushes.
Perform Git writes only when the user requests them. Task completion, scientific
acceptance, archival and Git commits are separate operations. Do not treat a
completed implementation as proof of a research hypothesis.

### Commands

Use `python` on Windows, or the available `python3` on other systems:

```bash
python .trellis/scripts/task.py create "<title>" --description "<goal>" --assignee <name>
python .trellis/scripts/task.py start <task>
python .trellis/scripts/task.py current --source
python .trellis/scripts/task.py archive <task> --completed --no-commit
python .trellis/scripts/task.py archive <task> --no-commit
python .trellis/scripts/get_context.py --mode phase --step 2.1
```

`create` activates the task when session identity is available. `start` marks a
planning task in progress; if invoked outside a recognized agent session, set a
stable `TRELLIS_CONTEXT_ID`. `finish` only detaches the current session.
`archive --completed` marks completed work and archives it. Plain `archive`
preserves the original status and completion date (including unfinished work).
Record unresolved work in the PRD before administrative archival. Neither archive
mode requires a clean tree, commit, PR or branch metadata. Auto-commit is off by default.

### State reminders

[workflow-state:no_task]
Answer discussions directly. Make clear local changes without a task. For
long-running work create a lightweight task and proceed within user authorization.
Follow .trellis/workflow.md; do not ask for redundant task/start approval.
[/workflow-state:no_task]

[workflow-state:planning]
Read prd.md and relevant package rules. Keep planning in the PRD; no mandatory
design.md, implement.md or JSONL. If implementation is authorized and the scope
is clear, start and proceed. Ask only about material unresolved research choices.
[/workflow-state:planning]

[workflow-state:planning-inline]
Read prd.md and relevant package rules. No extra planning files or JSONL gates.
Start authorized work directly; delegate only when independent work benefits.
[/workflow-state:planning-inline]

[workflow-state:in_progress]
Work within the assigned scope. Main agents implement directly; workers do their
assigned work without recursively launching a fixed pipeline. Verify only what
the implementation or scientific claim needs. Preserve useful evidence in its
package. When complete, update the PRD, archive --completed --no-commit and report.
No default Git writes, journal, full test suite or extra approval to finish.
[/workflow-state:in_progress]

[workflow-state:in_progress-inline]
Implement directly, with optional scoped delegation. Use targeted verification;
keep scientific evidence, not engineering ceremony. Update the PRD and archive
--completed --no-commit when done. No default Git writes or journal.
[/workflow-state:in_progress-inline]

[workflow-state:completed]
If the goal is genuinely achieved, archive the task and briefly report the change,
actual verification and unresolved issues. Git operations require user intent.
[/workflow-state:completed]

[workflow-state:task_error]
Read the active task path and diagnose the unreadable metadata without discarding
user content. Continue independent work only if its scope is clear.
[/workflow-state:task_error]

## Phase 1: Plan

#### 1.0 Choose task scope

Use the request routing above. A task is useful for durable context, not a
prerequisite for changing code. Do not create demonstration tasks or checklists.

#### 1.1 Understand the research question

Clarify only choices that affect the result. Identify the physical/mathematical
meaning, hypotheses and competing explanations when the task is scientific.
Use the brainstorm skill only when uncertainty actually warrants it.

#### 1.2 Read relevant context

Read the affected package docs, code and existing focused checks. Optional
specialist research should answer a concrete question, not generate a dossier.

#### 1.3 Record useful context

For a tracked task, keep the goal, constraints and decisions in prd.md. Context
JSONL is optional for workers who need specific references; no separate design or
implementation document is required.

#### 1.4 Begin authorized work

Run task.py start for a tracked task when the goal and scope are clear. An explicit
request to implement authorizes this step; no second ceremony or review gate.

#### 1.5 Define success

Match evidence to the claim. Separate implementation delivery, numerical
correctness and research conclusions; negative outcomes can be valid research.

## Phase 2: Execute

#### 2.1 Implement or investigate

Make the smallest direct change. Prefer simple functions and an explicit main
flow where appropriate. Do not introduce abstractions, dependencies or tools
merely for reuse. Main agents work directly; use optional specialist workers only
when a distinct responsibility benefits from delegation.
For research, choose a minimal experiment that distinguishes competing hypotheses,
inspect the results and adjust the route within the agreed scope.

#### 2.2 Verify the actual claim

Follow Scientific verification above and any explicit task/package requirements.
Use focused existing checks or a necessary numerical experiment. Do not add a
test suite, fixtures or broad gates merely to validate workflow customization.

#### 2.3 Handle problems

Diagnose before changing more. Do not reset user work or add compatibility layers
without need. Ask only if resolution needs a material scope/authority change.

## Phase 3: Finish

#### 3.2 Capture a useful finding

For a recurring or scientifically meaningful issue, retain its cause or negative
result in the existing appropriate record. No automatic retrospective report.

#### 3.3 Update lasting knowledge when needed

Update package docs or a relevant shared convention only if the finding will help
future work. Task progress stays in the PRD; do not copy it into a journal.

#### 3.4 Respect Git intent

Report the code state truthfully. Commit, merge, push or create a PR only when
requested. A dirty worktree does not prevent task completion or archival.

#### 3.5 Close the work

Once the goal and necessary verification are complete, update the existing PRD
and run task.py archive <task> --completed --no-commit. Administrative archival of
unfinished work uses plain archive, preserving status and unresolved notes.
Do not ask for an extra finish approval. Briefly report what changed, what it
solved, the actual checks and any unresolved issue.

## Skill Routing

Use before-dev for affected package conventions, brainstorm for substantive
uncertainty, check for proportionate verification, continue for task resumption,
finish-work for closure and meta for Trellis customization. Specialized research
skills are used when their subject is needed, not as a mandatory checklist.
