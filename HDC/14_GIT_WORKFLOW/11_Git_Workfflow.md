# Git Workflow

## Purpose

This document defines how Codex must use Git while implementing Headquarters.

Codex is responsible for routine task-level Git operations, but it may not approve its own work.

---

## Branches

### main

Production-ready code only.

Rules:

- No direct commits.
- Only milestone-approved merges.
- Only Founder may approve merges into main.
- Release tags are created from main only.

### develop

Primary integration branch.

Rules:

- HQ tasks merge into develop after Founder approval.
- develop must always pass:
  - typecheck
  - lint
  - test
  - build

### architecture

Architecture and documentation branch.

Used for:

- HDR
- HTB
- HIG
- HDC
- ACRs
- Architecture updates

No application code should be implemented on architecture.

### feature branches

Each implementation task must use its own feature branch.

Format:

```text
feature/HQ-TASK-0002