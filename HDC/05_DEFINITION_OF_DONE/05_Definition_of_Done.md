# Definition of Done

A task is complete only when all relevant criteria are satisfied.
A task is not complete until the completion report is provided and includes:
- Summary
- Files Changed
- Architecture Impact
- Tests Added
- Known Limitations
- Future Considerations

## Required Criteria

- Code compiles.
- TypeScript passes.
- Relevant tests pass.
- No known lint failures introduced.
- No architecture guardrail violated.
- Scope stayed within the assigned task.
- Documentation updated if behavior changed.
- Changelog updated if required.
- Acceptance criteria satisfied.
- Rollback path understood.
- Task report produced.
- Approval requested.

## Not Done

A task is not done if:

- Code works only manually without tests when tests were possible.
- Codex changed architecture without approval.
- Business logic was placed in UI components.
- Database access bypassed approved repositories.
- The next task was started automatically.
- Documentation and implementation diverged.

## Required Completion Phrase

Every completed Codex task must end with:

`Task complete. Awaiting approval before continuing.`
