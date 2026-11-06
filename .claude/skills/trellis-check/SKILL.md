---
name: trellis-check
description: "Choose and run the smallest checks needed for an implementation or scientific claim. Use when verifying changed work; do not default to full test or lint pipelines."
---

# Check Changed Work

Use Phase 2.2 and Scientific verification in `.trellis/workflow.md`.
Inspect the actual diff and affected callers. Choose checks that directly support
the claim: execution, numerical correctness, or a scientific conclusion.
Prefer existing focused checks. Do not create a test suite or default to a full
lint/typecheck/test sweep. Explicit task/package requirements still apply.

Report concrete issues with file locations and the checks actually run.
A review-only request does not authorize implementation; fix only when assigned.
