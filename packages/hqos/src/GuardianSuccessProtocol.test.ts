import { describe, expect, it } from 'vitest';
import { evaluateGuardianSuccessProtocol } from './GuardianSuccessProtocol';

const evaluatedAt = '2026-07-13T00:00:00.000Z';

describe('GuardianSuccessProtocol', () => {
  it('does not warn from success alone', () => {
    const decision = evaluateGuardianSuccessProtocol({
      missionId: 'mission-3',
      evaluatedAt,
      recentMissions: [
        { missionId: 'mission-1', completedAt: '2026-07-12T00:00:00.000Z', profitableOutcome: true },
      ],
    });

    expect(decision.detection).toBe('no_action_required');
    expect(decision.verdict).toBe('no_action');
  });

  it('keeps disciplined success secure', () => {
    const decision = evaluateGuardianSuccessProtocol({
      missionId: 'mission-3',
      evaluatedAt,
      recentMissions: [
        { missionId: 'mission-1', completedAt: '2026-07-11T00:00:00.000Z', profitableOutcome: true, observationComplete: true, debriefComplete: true, requestedRisk: 0.5 },
        { missionId: 'mission-2', completedAt: '2026-07-12T00:00:00.000Z', strongEvaluation: true, observationComplete: true, debriefComplete: true, requestedRisk: 0.5 },
      ],
    });

    expect(decision.detection).toBe('success_streak_with_process_discipline');
    expect(decision.verdict).toBe('no_action');
  });

  it('cautions on risk escalation after success without PnL-only lockout', () => {
    const decision = evaluateGuardianSuccessProtocol({
      missionId: 'mission-3',
      evaluatedAt,
      recentMissions: [
        { missionId: 'mission-1', completedAt: '2026-07-11T00:00:00.000Z', profitableOutcome: true, requestedRisk: 0.5, observationComplete: true, debriefComplete: true },
        { missionId: 'mission-2', completedAt: '2026-07-12T00:00:00.000Z', profitableOutcome: true, requestedRisk: 1, observationComplete: true, debriefComplete: true },
      ],
    });

    expect(decision.detection).toBe('risk_escalation_after_success');
    expect(decision.verdict).toBe('caution_operator');
    expect(decision.explanation).toMatch(/risk increased/iu);
  });

  it('requires review when evidence discipline declines after success', () => {
    const decision = evaluateGuardianSuccessProtocol({
      missionId: 'mission-3',
      evaluatedAt,
      recentMissions: [
        { missionId: 'mission-1', completedAt: '2026-07-11T00:00:00.000Z', profitableOutcome: true, observationComplete: true, requestedRisk: 0.5 },
        { missionId: 'mission-2', completedAt: '2026-07-12T00:00:00.000Z', profitableOutcome: true, observationComplete: false, requestedRisk: 0.5 },
      ],
    });

    expect(decision.detection).toBe('observation_quality_decline_after_success');
    expect(decision.requiredAction).toBe('Complete explicit War Room challenge.');
  });

  it('references historical missions and detects euphoria risk deterministically', () => {
    const decision = evaluateGuardianSuccessProtocol({
      missionId: 'mission-3',
      evaluatedAt,
      recentMissions: [
        { missionId: 'mission-1', completedAt: '2026-07-11T00:00:00.000Z', profitableOutcome: true, requestedRisk: 0.5 },
        { missionId: 'mission-2', completedAt: '2026-07-12T00:00:00.000Z', profitableOutcome: true, requestedRisk: 1, operatorReportedConfidence: 'This is easy' },
      ],
    });

    expect(decision.detection).toBe('euphoria_risk_pattern');
    expect(decision.supportingMissionIds).toEqual(['mission-1', 'mission-2']);
    expect(decision.evidenceReferences).toHaveLength(2);
  });
});
