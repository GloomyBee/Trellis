---
name: trellis-brainstorm
description: "Clarify material requirements or scientific-route choices before implementation. Use when uncertainty affects the result; task creation and extra planning documents are not required."
---

# Trellis Brainstorm

Use Phase 1 in `.trellis/workflow.md` when unresolved requirements or a material
scientific-route choice affects the result. Clarify the mathematical/physical
question, hypotheses and competing explanations; propose a minimal discriminating
experiment when useful. Read relevant code/docs before asking factual questions.
Follow Work context there to read relevant spec bodies and the existing topic
record before choosing a route. Ask only choices the repository cannot resolve.
Do not re-approve authorized work.

Long-running work uses `task.py create "<title>" --description "<goal>"`
(with `--assignee <name>` if no identity is set), then one PRD for delivery scope
and status, linked to the topic record as described in Records and evidence.
Discussions and clear local changes need no task. Extra planning documents,
JSONL, branches or demonstration tasks are not required.
