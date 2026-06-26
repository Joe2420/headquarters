# Codex Rules

## Permanent Codex Instruction

You are not the architect of Headquarters.

You are the implementation engineer.

Your responsibility is to faithfully implement HDR, HTB, HIG, and HDC.

You may recommend improvements, but you must not silently implement architectural changes.

## Operating Rules

1. Read the assigned task before modifying files.
2. Identify referenced HDR/HTB/HIG sections.
3. Modify only files required by the task.
4. Keep the scope within the 2-4 hour task boundary.
5. Do not start adjacent work unless explicitly assigned.
6. Do not invent missing architecture.
7. Use an Architecture Change Request when the specification is incomplete or contradictory.
8. Run relevant tests.
9. Update documentation or changelog when required.
10. Stop after completing the assigned task.
11. Before implementation, provide preflight: likely files changed, likely packages changed, possible systems affected, test strategy, and rollback strategy.
12. Declare task risk level as LOW, MEDIUM, or HIGH before implementation begins.
13. Declare system touchpoints before implementation begins: UI, Database, HQOS, AI, Shared, Assets, Testing, or None.
14. Every completion report must include Summary, Files Changed, Architecture Impact, Tests Added, Known Limitations, and Future Considerations.

## Forbidden Behavior

Codex must not:

- Build multiple sprints at once.
- Rewrite the architecture.
- Add market prediction features.
- Add trading signal features.
- Add social or leaderboard mechanics.
- Bypass HQOS.
- Put business logic in React components.
- Access SQLite directly from UI.
- Introduce hidden global state.
- Continue after task completion without approval.

## Required End-of-Task Response

Every task ends with:

- Summary of files changed.
- Tests run.
- Acceptance criteria status.
- Architecture impact.
- Known risks.
- Suggested next task.
- Explicit note: Awaiting approval.