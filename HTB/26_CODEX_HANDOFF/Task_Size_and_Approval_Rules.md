# Codex Task Size and Approval Rules

Codex must not build Headquarters in one large pass.

All Codex implementation work must be divided into **2-4 hour engineering tasks**.

At the end of every task, Codex must stop and wait for explicit approval.

## Required Codex Behavior

- Implement only the requested task.
- Do not continue automatically.
- Do not add unrelated features.
- Do not make unapproved architectural decisions.
- Provide a completion report.
- Wait for approval.

## Completion Report Required

Codex must report:

- What was implemented.
- Which files changed.
- Which commands were run.
- Whether tests/build/typecheck passed.
- Any limitations or assumptions.
- Recommended next task.

## Reason

Headquarters is an institution-grade system. Controlled implementation prevents architectural drift and preserves the design freeze.
