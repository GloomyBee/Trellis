<!-- TRELLIS:START -->
# Trellis Instructions

Read `.trellis/workflow.md` for the project workflow and its lightweight defaults.
Read only the affected package's relevant rules in `.trellis/spec/` and docs.

- Small clear changes do not require a task; long-running work uses task.json
  and prd.md under `.trellis/tasks/`.
- Scientific evidence belongs to the package docs/cases/runs, not task copies.
- Main agents work directly; specialist agents and Trellis tools are optional.
- No default journal, full test pipeline or Git writes. Explicit task requirements
  take precedence; retain necessary numerical and scientific verification.

Platform helpers may live in `.agents/skills/` and platform-specific directories.
They are thin entry points to the workflow, not additional rule sources.
Managed by Trellis; content outside this block is preserved by updates.
<!-- TRELLIS:END -->

## Source repository

Python runtime changes must keep `.trellis/scripts/` and
`packages/cli/src/templates/trellis/scripts/` byte-identical.
Use existing focused checks for affected behavior. GitNexus is optional when
available; source inspection is sufficient otherwise. Preserve the AGPL license.
