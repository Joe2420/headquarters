# Approval Process

## Purpose

The approval process prevents uncontrolled expansion, architectural drift, and accidental implementation of unreviewed decisions.

## Approval Types

### Task Approval

Required after every engineering task.
No task may be approved unless:
- Risk level was declared
- System touchpoints were declared
- Preflight was completed
- Acceptance criteria passed
- Completion report was provided

### Architecture Approval

Required when a task reveals specification gaps or architectural conflicts.

### Design Approval

Required when implementation affects UX, institutional feel, AI wording, room behavior, or product identity.

### Release Approval

Required before merging a completed sprint into the baseline.

## Approval Response Format

Approved:

- Continue to next task.

Approved with changes:

- Apply listed changes before next task.

Rejected:

- Stop and revise.

Needs ACR:

- Create Architecture Change Request.

## Codex Stop Condition

Codex must not infer approval from silence, enthusiasm, or previous context. Approval must be explicit.
