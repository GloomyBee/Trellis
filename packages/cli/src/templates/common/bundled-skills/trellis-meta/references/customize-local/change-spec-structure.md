# Change Local Spec Structure

When the user wants to change the engineering conventions AI follows, add new spec layers, or adjust monorepo package mapping, edit `.trellis/spec/` and `.trellis/config.yaml`.

## Read These Files First

1. `.trellis/config.yaml`
2. `.trellis/spec/`
3. `.trellis/workflow.md` planning artifact guidance and Phase 3.3
4. Current work selection and optional task metadata/manifests

## Common Needs

| Need | Edit location |
| --- | --- |
| Flat shared work-type rules | `.trellis/spec/index.md` plus relevant `code`, `research`, `experiments`, `plotting`, `writing` Markdown files |
| Add backend/frontend/docs/test spec layer | `.trellis/spec/<layer>/` or `.trellis/spec/<package>/<layer>/` |
| Add shared thinking guides | `.trellis/spec/guides/` |
| Adjust monorepo packages | `packages` in `.trellis/config.yaml` |
| Change default package | `default_package` in `.trellis/config.yaml` |
| Control spec scanning scope | `spec_scope` in `.trellis/config.yaml` |
| Select relevant rules | `get_context.py --mode work` arguments or optional task `meta` |

## Choose A Useful Structure

Use a flat root index and substantive work-type files when they match the
project. Only create files with real reusable content; do not copy one set into
every package. Package mathematics and scientific records belong in package
docs. Existing package/layer layouts remain supported, for example:

Single-repository example:

```text
.trellis/spec/security/
├── index.md
└── auth.md
```

Monorepo example:

```text
.trellis/spec/webapp/security/
├── index.md
└── auth.md
```

`index.md` should include:

- What code this layer applies to.
- When to read the actual guideline bodies.
- Necessary verification for this scope, not a compulsory pipeline.
- Links to specific guideline files.

## Update Context

Adding a spec does not mean every task reads it. Set appropriate work types and
package scope, then read the selected bodies. An index is only navigation.
Additional layer-specific references may be read directly or placed in optional
worker JSONL; no task or manifest is required:

```bash
python3 ./.trellis/scripts/task.py add-context <task> implement ".trellis/spec/webapp/security/index.md" "Security conventions"
python3 ./.trellis/scripts/task.py add-context <task> check ".trellis/spec/webapp/security/index.md" "Security review rules"
```

## Change Monorepo Packages

Example `.trellis/config.yaml`:

```yaml
packages:
  webapp:
    path: apps/web
  api:
    path: apps/api
default_package: webapp
```

After editing, run:

```bash
python3 ./.trellis/scripts/get_context.py --mode packages
```

Use this output to confirm AI can see the correct packages and spec layers.

## Notes

- Specs are user project conventions and can be changed according to project needs.
- Do not put temporary task information into specs; put temporary information in the task.
- Do not put long-term conventions only in agents or commands; preserve them in specs.
- After changing spec structure, repair current active references to moved files;
  do not rewrite archived task/history records merely for uniformity.
