import { describe, expect, it } from 'vitest';
import {
  evaluateGuardianJudgmentReserve,
  reloadGuardianJudgmentReserve,
} from './GuardianJudgmentReserve';

describe('GuardianJudgmentReserve', () => {
  it('starts from a stable baseline with explainable evidence', () => {
    const decision = evaluateGuardianJudgmentReserve({
      evaluatedAt: '2026-07-13T00:00:00.000Z',
      missionCountInSession: 1,
    });

    expect(decision.reserve.state).toBe('stable');
    expect(decision.reserve.supportingEvidence[0]?.description).toMatch(/No operational degradation/iu);
  });

  it('reduces reserve from repeated unresolved warnings', () => {
    const decision = evaluateGuardianJudgmentReserve({
      evaluatedAt: '2026-07-13T00:00:00.000Z',
      unresolvedGuardianWarningCount: 3,
      repeatedAuthorizationAttemptCount: 2,
    });

    expect(decision.reserve.state).toBe('reduced');
    expect(decision.reserve.degradingFactors).toContain('Repeated unresolved Guardian warnings.');
  });

  it('improves reserve after completed recovery evidence', () => {
    const previous = evaluateGuardianJudgmentReserve({
      evaluatedAt: '2026-07-13T00:00:00.000Z',
      unresolvedGuardianWarningCount: 3,
      repeatedAuthorizationAttemptCount: 2,
      activeConsequenceSeverity: 'restriction',
    }).reserve;
    const next = evaluateGuardianJudgmentReserve({
      evaluatedAt: '2026-07-13T00:10:00.000Z',
      successfulRecoveryCount: 1,
      completedDeliberatePauseCount: 1,
      recentMissionEvaluationQuality: 'disciplined',
      previousReserve: previous,
    });

    expect(next.reserve.state).toBe('stable');
    expect(next.reserve.trend).toBe('improving');
  });

  it('does not improve because of profit and supports disciplined process stability', () => {
    const decision = evaluateGuardianJudgmentReserve({
      evaluatedAt: '2026-07-13T00:00:00.000Z',
      recentMissionEvaluationQuality: 'disciplined',
    });

    expect(decision.reserve.state).toBe('stable');
    expect(decision.reserve.improvingFactors).toContain('Recent mission evaluation was disciplined.');
  });

  it('does not deplete from one isolated vague answer', () => {
    const decision = evaluateGuardianJudgmentReserve({
      evaluatedAt: '2026-07-13T00:00:00.000Z',
      operatorReportedState: 'a bit off',
    });

    expect(decision.reserve.state).toBe('stable');
  });

  it('depletes only from critical accumulated evidence and explains the state', () => {
    const decision = evaluateGuardianJudgmentReserve({
      evaluatedAt: '2026-07-13T00:00:00.000Z',
      unresolvedGuardianWarningCount: 3,
      repeatedAuthorizationAttemptCount: 3,
      lifecycleRecoveryCount: 2,
      activeConsequenceSeverity: 'lockout',
    });

    expect(decision.reserve.state).toBe('depleted');
    expect(decision.reserve.blockingEffect).toBe('suspend_deployment');
    expect(decision.reserve.explanation).toMatch(/Judgment Reserve is depleted/iu);
  });

  it('preserves state through reload and calculates trend deterministically', () => {
    const previous = evaluateGuardianJudgmentReserve({
      evaluatedAt: '2026-07-13T00:00:00.000Z',
      activeConsequenceSeverity: 'restriction',
      unresolvedGuardianWarningCount: 3,
    }).reserve;
    const reloaded = reloadGuardianJudgmentReserve(previous);
    const next = evaluateGuardianJudgmentReserve({
      evaluatedAt: '2026-07-13T00:05:00.000Z',
      unresolvedGuardianWarningCount: 3,
      previousReserve: reloaded,
    });

    expect(reloaded.state).toBe(previous.state);
    expect(next.reserve.trend).toBe('improving');
  });
});
