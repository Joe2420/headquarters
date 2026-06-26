# Git Workflow

## Purpose

This document defines how Codex must use Git while implementing Headquarters.

Codex may perform routine task-level Git operations, but Codex may not approve its own work or merge completed work without explicit Founder approval.

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
- develop must always pass typecheck, lint, test, and build.

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

Each implementation task must use its own feature branch unless the Founder explicitly approves another branch.

Format:

```text
feature/HQ-TASK-0002-short-name
```

## Git Preflight

Before implementation, Codex must confirm:
- Current branch.
- Target task branch.
- Working tree status.
- Whether a remote exists.
- Whether the target task branch already exists.

If the working tree is not clean, Codex must stop and ask for approval before continuing.

## Task Commit Rules

Every completed task should produce one focused commit unless the Founder instructs otherwise.

Commit rules:
- Commit only files touched for the approved task.
- Do not include unrelated working-tree changes.
- Do not commit generated local data, build output, caches, or secrets.
- Use Conventional Commit style.
- Include the task identifier in the commit body when useful.

Examples:

```text
feat(hqos): add event envelope factory

docs(hdc): add Git workflow rules
```

## Verification Before Commit

Before committing implementation work, Codex must run the checks required by the task.

For code tasks, the default verification set is:
- typecheck
- lint
- test
- build when build output or packaging could be affected

For documentation-only tasks, Codex must at minimum inspect the changed files and run lint/test when those checks are already available and reasonably scoped.

## Merge Rules

Codex must not merge branches unless explicitly instructed.

Founder approval is required before:
- Merging into develop.
- Merging into main.
- Deleting task branches.
- Creating release tags.

## Prohibited Git Actions

Codex must not run destructive Git operations unless explicitly instructed and approved.

Prohibited without explicit approval:
- `git reset --hard`
- `git checkout -- <path>`
- `git clean`
- Force push
- Rebase of shared branches
- Deleting branches

## Stop Rule

After committing a task, Codex must stop, report the commit hash, and wait for approval before starting the next task.
