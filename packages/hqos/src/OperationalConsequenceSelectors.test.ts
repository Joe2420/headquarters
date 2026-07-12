import { describe, expect, it } from 'vitest';
import { createOperationalConsequence, resolveOperationalConsequence } from './OperationalConsequence';
import {
  canArchiveMission,
  canDeployMission,
  canEnterWarRoom,
  canRequestAuthorization,
  getBlockingConsequencesForMission,
  getConsequenceBlockedActionReason,
  getRequiredRecoveryActions,
} from './OperationalConsequenceSelectors';

describe('OperationalConsequenceSelectors', () => {
  it('blocks authorization when protective rule is missing', () => {
    const consequence = createConsequence('authorization_without_protective_rule');
    const decision = canRequestAuthorization([consequence], 'mission-1');

    expect(decision.allowed).toBe(false);
    expect(getConsequenceBlockedActionReason(decision)).toContain('authorization_without_protective_rule');
    expect(decision.recoveryActions[0]?.type).toBe('confirm_protective_rule');
  });

  it('blocks War Room entry for unresolved contradiction', () => {
    const decision = canEnterWarRoom([createConsequence('unresolved_contradiction')], 'mission-1');

    expect(decision.allowed).toBe(false);
  });

  it('blocks deployment for Guardian lockout', () => {
    const decision = canDeployMission([createConsequence('guardian_lockout', 'lockout')], 'mission-1');

    expect(decision.allowed).toBe(false);
    expect(decision.blockingConsequences[0]?.severity).toBe('lockout');
  });

  it('blocks archive for incomplete debrief and persistence failure', () => {
    const decision = canArchiveMission([
      createConsequence('incomplete_debrief'),
      createConsequence('persistence_failure'),
    ], 'mission-1');

    expect(decision.allowed).toBe(false);
    expect(decision.blockingConsequences.map((item) => item.type)).toEqual(['incomplete_debrief', 'persistence_failure']);
  });

  it('does not block unrelated actions with caution', () => {
    const consequence = createConsequence('guardian_warning_unresolved', 'caution');

    expect(canRequestAuthorization([consequence], 'mission-1').allowed).toBe(true);
    expect(getBlockingConsequencesForMission([consequence], 'mission-1')).toEqual([]);
  });

  it('does not block after resolution', () => {
    const consequence = createConsequence('incomplete_debrief');
    const satisfied = createOperationalConsequence({
      ...consequence,
      recoveryRequirements: [{
        ...consequence.recoveryRequirements[0]!,
        completionState: 'satisfied',
        completedAt: '2026-07-12T14:30:00.000Z',
        evidenceReferences: [{ id: 'debrief:mission-1', source: 'debrief' }],
      }],
    });
    const resolved = resolveOperationalConsequence(satisfied, {
      resolvedAt: '2026-07-12T14:40:00.000Z',
      resolutionEvidence: [{ id: 'debrief:mission-1', source: 'debrief' }],
    });

    expect(canArchiveMission([resolved], 'mission-1').allowed).toBe(true);
  });

  it('returns required recovery actions for current mission only', () => {
    const consequence = createConsequence('persistence_failure');

    expect(getRequiredRecoveryActions([consequence], 'mission-1')).toHaveLength(1);
    expect(getRequiredRecoveryActions([consequence], 'mission-2')).toEqual([]);
  });
});

function createConsequence(
  type: Parameters<typeof createOperationalConsequence>[0]['type'],
  severity: Parameters<typeof createOperationalConsequence>[0]['severity'] = 'restriction',
) {
  return createOperationalConsequence({
    consequenceId: `consequence:mission-1:${type}`,
    missionId: 'mission-1',
    category: type === 'persistence_failure' ? 'persistence' : 'process',
    type,
    severity,
    title: type,
    explanation: `${type} explanation.`,
    cause: `${type} cause.`,
    effect: `${type} blocks a mission action.`,
    evidenceReferences: [{ id: `evidence:${type}`, source: 'test' }],
    createdAt: '2026-07-12T14:00:00.000Z',
    recoveryRequirements: [{
      requirementId: `recovery:mission-1:${type}`,
      description: `Recover ${type}.`,
      type: type === 'authorization_without_protective_rule' ? 'confirm_protective_rule' : 'complete_debrief',
      evidenceRequired: true,
    }],
  });
}
