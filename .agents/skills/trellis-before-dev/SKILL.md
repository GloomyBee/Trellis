---
name: trellis-before-dev
description: "Discovers and injects project-specific coding guidelines from .trellis/spec/ before implementation begins. Reads spec indexes, pre-development checklists, and shared thinking guides for the target package. Use when starting a new coding task, before writing any code, switching to a different package, or needing to refresh project conventions and standards."
---

Read `.trellis/workflow.md` for routing. Before editing, read the affected code
and only the relevant package docs/specs. For a tracked task, read its PRD.
Use `python .trellis/scripts/get_context.py --mode packages` if package
boundaries are unclear. Optional planning files and manifests are not gates.
Do not scan all skills/specs/hooks or build a checklist for a clear local edit.
