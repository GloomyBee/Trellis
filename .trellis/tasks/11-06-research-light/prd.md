# Research-first lightweight workflow

## Goal and scope

Customize GloomyBee/Trellis from v0.6.17 on research-light, then apply the
validated runtime and templates to the existing research project. Preserve
the upstream license and private project content. No upstream PR or npm release.

## Decisions

- Keep scientific evidence; remove default engineering ceremonies.
- One workflow source; thin platform entry points. Task JSON + one PRD by default.
- Main agent works directly; independent work may use Codex or Pi.
- Default no automatic Git writes or journals. Archive preserves status;
  --completed explicitly marks successful completion.
- Existing focused checks and the real task lifecycle are enough for this change.
- Do not alter algorithms, experiments, existing project changes or historical data.

## Progress and conclusions

- Fork created and cloned from v0.6.17.
- Runtime and entry-template changes delegated with separate file ownership.
- Central workflow, runtime, initialization and enabled entry templates revised.
- Core/CLI TypeScript build and template copy passed.
- Existing focused runtime, archive, init, workflow and generation checks passed.
- Existing safety checks for scoped auto-commit, index locks and context injection retained.
- One unrelated OpenCode directory-cap test still fails on Windows; not expanded here.
- Next: push the fork branch and apply the validated files to the research project.
