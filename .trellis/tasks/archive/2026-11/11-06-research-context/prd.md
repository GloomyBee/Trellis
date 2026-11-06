# Scoped scientific specs and research context

## Goal

Support flat project specs, bounded work-type context and durable package research records, then apply to the research workspace.

## Requirements

- Support explicit work types (code, experiments, plotting, writing, research),
  package paths and a selected package research record without requiring a task.
- Keep root specs discoverable; load only relevant rules and bounded research
  state. Platform hooks use the same runtime selection rather than new routers.
- Keep durable scientific reasoning in package docs; task PRDs link it without
  duplicating evidence or introducing session journals.
- Apply the generic changes to the fork and the private GNN workspace. Private
  scientific rules and records must not enter the public fork.

## Acceptance Criteria

- [x] Work context CLI supports task metadata and explicit selection safely.
- [x] Enabled platform entry points and hooks load scoped context consistently.
- [x] GNN has one flat, substantive shared spec set and no duplicate old rules.
- [x] Relevant build and focused behavior checks pass; the known unrelated
  Windows OpenCode path assertion is disclosed below. No new test files.

## Notes

- Use this PRD as the single human record: goal, scope, decisions, progress and conclusions.
- Extra context files are optional, not prerequisites for starting authorized work.
- Approved design: startup summaries are not a substitute for reading applicable
  rules. Research records keep current state above chronological stage records.
- This is workflow engineering (code,writing), not a scientific investigation;
  no artificial research topic record will be created.

## Implementation and result

- Added work mode to existing context modules and their byte-identical mirrors.
  Explicit work selection overrides task metadata; reads stay within the real
  repository, reuse byte limits and preserve UTF-8. Research history stays on
  disk; only current state is injected.
- Startup/turn hooks use compact summaries. Python, OpenCode and Pi worker
  injection shares its existing total budget across selected bodies, optional
  manifests and task artifacts. Advisories are lower priority than those bodies.
  Real-path deduplication prevents manifests from re-expanding selected history.
- Workflow remains the rule source; enabled commands, skills and agent cards
  reference it. Updated four existing meta references that incorrectly described
  JSONL as mandatory. No new skill, infrastructure or journal was introduced.
- Applied generated changes to the fork and GNN, preserving project settings,
  models, private skills and GNN's pre-existing staged/unstaged research changes.
  GNN alone received flat project specs, an active document link repair and an
  updated source comment. No scientific code or experiment was changed.

## Actual verification

- Core and CLI TypeScript builds passed; all 28 Python runtime files match their
  distribution mirrors byte-for-byte.
- Existing context checks: 42 passed, one platform skip; four scoped cases were
  added in that existing file, not a new test file. Existing Codex regression
  assertions were updated for taskless scoped context: six targeted cases pass.
- Existing template checks: shared hooks/Codex/Pi 70 passed. Entry/prelude
  checks were also run by the worker (106 passing focused cases).
- OpenCode: 72 passed, one known pre-existing Windows refdir path-separator
  assertion still fails; no unrelated platform fix was included.
- GNN taskless full/summary selection, combined types, spec links and live Codex
  startup/turn summary calls passed. Meta skill validation passed with UTF-8.
- No GNN unit tests, training, numerical experiments or full repository suite
  were added or run. No snapshots, fake topics or audit artifacts were created.

## Remaining

The unrelated OpenCode Windows path assertion remains. Earlier out-of-scope Pi
session-key and OpenCode directory-truncation issues are not expanded by this task.
GNN remains intentionally uncommitted; only the public fork is to be pushed.
