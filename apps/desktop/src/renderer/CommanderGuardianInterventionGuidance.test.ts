import { describe, expect, it } from 'vitest';
import { buildCommanderGuardianInterventionGuidance } from './CommanderGuardianInterventionGuidance';
import type { GuardianProtectionDecision } from '@headquarters/hqos';

const decision: GuardianProtectionDecision = {
  state: 'restriction',
  verdict: 'deny_authorization',
  triggeredRules: [],
  clearedRules: [],
  activeRestrictions: [{
    restrictionId: 'restriction:risk',
    ruleId: 'risk',
    missionId: 'mission-1',
    blockedActions: ['request_authorization'],
    explanation: 'Risk exceeds allocation.',
    evidenceReferences: [{ evidenceId: 'risk', source: 'guardian', description: 'Risk exceeds allocation.' }],
    startedAt: '2026-07-13T00:00:00.000Z',
    status: 'active',
  }],
  newInterventions: [],
  recoveryPlans: [],
  explanation: 'Risk exceeds allocation.',
  highestSeverity: 'restriction',
  blockedActions: ['request_authorization'],
  CommanderSignal: 'restriction',
};

describe('CommanderGuardianInterventionGuidance', () => {
  it('emits a restriction message once without raw payload', () => {
    const [message] = buildCommanderGuardianInterventionGuidance({ decision });

    expect(message?.intent).toBe('explainGuardianRestriction');
    expect(message?.message).toContain('Guardian restriction active.');
    expect(message?.message).not.toContain('blockedActions');
    expect(buildCommanderGuardianInterventionGuidance({ decision, alreadyDeliveredIds: [message?.id ?? ''] })).toEqual([]);
  });

  it('emits contextual blocked action reminders only when an action is attempted', () => {
    const [message] = buildCommanderGuardianInterventionGuidance({
      decision,
      attemptedBlockedAction: 'Request Authorization',
    });

    expect(message?.intent).toBe('stateBlockedAction');
    expect(message?.repeatPolicy).toBe('blocked_action_only');
  });

  it('emits lockout and recovery messages once', () => {
    const lockout = buildCommanderGuardianInterventionGuidance({
      decision: { ...decision, CommanderSignal: 'lockout', verdict: 'suspend_deployment', state: 'lockout', highestSeverity: 'lockout' },
    });
    const recovery = buildCommanderGuardianInterventionGuidance({ decision, acknowledgedRecoveryEvidence: true });
    const restored = buildCommanderGuardianInterventionGuidance({ decision, restored: true });

    expect(lockout[0]?.intent).toBe('announceGuardianLockout');
    expect(recovery[0]?.intent).toBe('acknowledgeRecoveryProgress');
    expect(restored[0]?.intent).toBe('confirmGuardianRestoration');
  });

  it('emits caution without shaming or diagnosis', () => {
    const [message] = buildCommanderGuardianInterventionGuidance({
      decision: {
        ...decision,
        state: 'caution',
        verdict: 'caution_operator',
        CommanderSignal: 'caution',
        activeRestrictions: [],
        blockedActions: [],
        highestSeverity: 'caution',
        explanation: 'Requested risk increased after recent successful missions.',
      },
    });

    expect(message?.intent).toBe('announceGuardianCaution');
    expect(message?.message).not.toMatch(/reckless|diagnosis|punish/iu);
  });
});
