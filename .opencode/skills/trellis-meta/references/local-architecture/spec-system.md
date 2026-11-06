# Local Spec System

`.trellis/spec/` holds reusable project conventions. Work context selects the
relevant rules; startup indexes do not replace reading their bodies.

## Directory Model

Projects may use a flat `index.md` plus substantive `code.md`, `research.md`,
`experiments.md`, `plotting.md` or `writing.md`. These are supported names, not a
required document set. Only create rules that have content. Package algorithm
details and research histories remain in package docs. Layer layouts also work:

A common single-repository structure:

```text
.trellis/spec/
├── backend/
│   ├── index.md
│   └── ...
├── frontend/
│   ├── index.md
│   └── ...
└── guides/
    ├── index.md
    └── ...
```

A common monorepo structure:

```text
.trellis/spec/
├── cli/
│   ├── backend/
│   │   ├── index.md
│   │   └── ...
│   └── unit-test/
│       ├── index.md
│       └── ...
├── docs-site/
│   └── docs/
│       ├── index.md
│       └── ...
└── guides/
    ├── index.md
    └── ...
```

`index.md` explains scope and routes readers to actual guidelines. It is not an
extra checklist or evidence that all referenced bodies have already been read.

## Package Configuration

`.trellis/config.yaml` can declare packages:

```yaml
packages:
  cli:
    path: packages/cli
  docs-site:
    path: docs-site
    type: submodule
default_package: cli
```

The AI can run:

```bash
python ./.trellis/scripts/get_context.py --mode packages
```

This command lists package/layer and flat-root entry points, not their bodies.

## How Specs Enter Work

The main agent explicitly chooses work types and package scope, then runs
`get_context.py --mode work`. Arguments override optional task metadata; no task
is required. Selected rule bodies, package README/docs index and a chosen
research record's current state are loaded within the configured byte limits.
`--summary` supplies navigation/current state only. Read history on demand and
refresh selection when scope changes. See Work context in the workflow.

Before a task enters implementation, planning may write relevant specs into `implement.jsonl` / `check.jsonl` when the task needs spec or research context beyond the task artifacts:

```jsonl
{"file": ".trellis/spec/cli/backend/index.md", "reason": "CLI backend conventions"}
{"file": ".trellis/spec/cli/unit-test/conventions.md", "reason": "Test expectations"}
```

Sub-agents or platform preludes read these JSONL files and load the referenced specs. On platforms without sub-agent support, the AI should read the relevant specs directly according to the workflow.

## What Specs Should Contain

Specs should contain executable engineering conventions for the project, not generic best practices:

- Where files should live.
- How error handling should be expressed.
- Input/output contracts for APIs, hooks, and commands.
- Patterns that are forbidden.
- Necessary verification for a specific implementation or scientific claim.
- Project-specific pitfalls and how to avoid them.

Preserve useful reusable rules here. Scientific reasoning belongs in package
topic docs, experimental evidence in runs, delivery status in the task PRD.
No automatic spec update or session journal is required for each small edit.

## Local Customization Points

| Need | Edit location |
| --- | --- |
| Add a new spec layer | `.trellis/spec/<package>/<layer>/index.md` and corresponding guideline files. |
| Change monorepo spec mapping | `packages` / `default_package` / `spec_scope` in `.trellis/config.yaml`. |
| Select work context | `--mode work` arguments or task `meta.work_types`, `package_path`, `research_record`. |
| Add curated worker references | Optional `implement.jsonl` / `check.jsonl`, or direct scoped reads. |
| Change when specs should be updated | Phase 3.3 in `.trellis/workflow.md` and the `trellis-update-spec` skill. |

## Boundaries

`.trellis/spec/` is the user's project specification, not a permanent copy of Trellis built-in templates. The AI should encourage the user to update it according to the actual project code instead of treating Trellis default templates as immutable documents.
