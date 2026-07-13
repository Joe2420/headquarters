import { describe, expect, it } from 'vitest';
import { buildWarRoomGuardianProtection } from './WarRoomGuardianProtection';
import type { GuardianAlert, GuardianLockoutState } from '@headquarters/guardian';

const unlocked: GuardianLockoutState = {
  status: 'unlocked',
  activeRuleIds: [],
  explanation: 'No active Guardian lockout rules.',
};

function alert(priority: GuardianAlert['priority']): GuardianAlert {
  return {
    id: `alert-${priority}`,
    title: `${priority} alert`,
    message: `${priority} message`,
    priority,
    sourceId: `source-${priority}`,
  };
}

describe('WarRoomGuardianProtection', () => {
  it('allows secure authorization from evidence', () => {
    const model = buildWarRoomGuardianProtection({
      alerts: [],
      lockout: unlocked,
      authorizationApproved: true,
    });

    expect(model.authorizationEligibility).toBe('available');
    expect(model.deploymentEligibility).toBe('available');
  });

  it('requires extra confirmation for caution', () => {
    const model = buildWarRoomGuardianProtection({
      alerts: [alert('medium')],
      lockout: unlocked,
      authorizationApproved: true,
    });

    expect(model.state).toBe('caution');
    expect(model.authorizationEligibility).toBe('extra_confirmation_required');
  });

  it('blocks restriction and unlocks when recovery is cleared', () => {
    const restricted = buildWarRoomGuardianProtection({
      alerts: [alert('high')],
      lockout: unlocked,
      authorizationApproved: true,
    });
    const recovered = buildWarRoomGuardianProtection({
      alerts: [],
      lockout: unlocked,
      authorizationApproved: true,
      recoveryCleared: true,
    });

    expect(restricted.authorizationEligibility).toBe('blocked');
    expect(recovered.authorizationEligibility).toBe('available');
    expect(recovered.guardianItems.some((item) => item.label.includes('Recovery cleared'))).toBe(true);
  });

  it('blocks deployment during lockout and preserves return context', () => {
    const model = buildWarRoomGuardianProtection({
      alerts: [],
      lockout: {
        status: 'locked',
        activeRuleIds: ['lockout'],
        explanation: 'Session lockout active.',
      },
      authorizationApproved: true,
    });

    expect(model.state).toBe('lockout');
    expect(model.deploymentEligibility).toBe('blocked');
    expect(model.deployedActions).toContain('End Session');
    expect(model.returnContext).toMatch(/preserve deployed mission context/iu);
  });
});
