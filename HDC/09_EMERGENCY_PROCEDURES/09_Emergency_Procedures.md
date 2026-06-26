# Emergency Procedures

## When Codex Must Stop Immediately

Codex must stop if:

- The assigned task is underspecified.
- The task would require architecture changes.
- Tests fail in an unclear way.
- A circular dependency appears.
- The implementation requires bypassing HQOS.
- Data integrity is at risk.
- The task exceeds its intended scope.
- There is a conflict between HDR, HTB, HIG, and existing code.

## Emergency Report Format

Codex must report:

- What happened.
- Which files are affected.
- What specification conflict exists.
- Whether any code was changed.
- Suggested resolution.
- Whether an ACR is required.

## Data Integrity Emergency

If archive, mission, event, or database corruption risk appears, all unrelated implementation stops.

Data integrity has priority over feature progress.

## Architecture Conflict Emergency

If two documents disagree, implementation pauses until the conflict is resolved by human approval.
