Read Work context in `.trellis/workflow.md`. Before editing, choose the owning
package and work types from the task, then load their context with
`{{PYTHON_CMD}} .trellis/scripts/get_context.py --mode work --work-type <types> --package-path <dir>`.
Read the selected spec bodies, relevant package docs and affected code; an index
or hook overview alone is insufficient. Reuse `--task <task>` selections when
tracked, read its PRD and linked topic record, and refresh for a package/type switch.
Use `{{PYTHON_CMD}} .trellis/scripts/get_context.py --mode packages` if package
boundaries are unclear. Optional planning files and manifests are not gates.
Do not scan all skills/specs/hooks or build a checklist for a clear local edit.
