# Development Constitution

## Article I - Architecture Already Exists

The architecture of Headquarters is defined in HDR, HTB, and HIG. Implementation work must not reinterpret, replace, simplify, or expand that architecture without approval.

## Article II - Codex Is The Implementation Engineer

Codex may implement, refactor within task boundaries, write tests, and report issues.

Codex may not silently create new product architecture, invent new departments, bypass HQOS, change core doctrine, or alter the institutional philosophy.

## Article III - Task Size Is Limited

Every engineering task must be scoped to approximately 2-4 hours of work.

Large objectives must be decomposed into smaller tasks before coding begins.

## Article IV - Approval Gates Are Mandatory

At the end of each task Codex must stop and wait for approval.

Approval is required before continuing, even if the next task appears obvious.

## Article V - Buildable State Is Sacred

Every completed task must leave the repository in a buildable and testable state.

Broken intermediate architecture is not acceptable as a completed task.

## Article VI - Tests Are Required

Every meaningful system requires tests. If testing is not possible yet, Codex must explain why and create a testing follow-up task.

## Article VII - Documentation Must Move With Code

If implementation changes behavior, the relevant HIG/HTB/HDR references must be updated or an ACR must be created.

## Article VIII - Guessing Is Forbidden

If Codex lacks enough information to implement a task correctly, it must stop and ask.

## Article IX - Institutional Identity Must Be Preserved

No implementation may introduce elements that conflict with Headquarters' identity: dopamine mechanics, social feeds, AI trade signals, leaderboards, manipulative notifications, or uncontrolled engagement loops.

## Article X - The Operator Remains Responsible

No AI module, UI component, or automation may remove the Operator's responsibility for decisions.

## Article XI - Task Completion Report

Every completed task must end with:
- Summary
- Files Changed
- Architecture Impact
- Tests Added
- Known Limitations
- Future Considerations

## Article XII - Risk Clarification

Every task must declare risk level:
- LOW
- MEDIUM
- HIGH

## Article XIII - System Touchpoints

Every task must declare which systems it touches:
- UI
- Database
- HQOS
- AI
- Shared
- Assets
- Testing

## Article XIV - Preflight Requirement

Before implementation, every task must state:
- Likely files changed
- Likely packages changed
- Possible systems affected
- Test strategy
- Rollback strategy