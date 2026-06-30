import { describe, expect, it } from 'vitest';
import { evaluateGuardianLockout } from './GuardianLockout';

describe('Guardian lockout', () => {
  it('represents unlocked state when no explicit lockout rule is active', () => {
    expect(
      evaluateGuardianLockout([
        { id: 'daily-limit', reason: 'Daily limit breached.', active: false },
        { id: 'repeated-override', reason: 'Repeated override attempt.', active: false },
      ]),
    ).toEqual({
      status: 'unlocked',
      activeRuleIds: [],
      explanation: 'No active Guardian lockout rules.',
    });
  });

  it('represents explainable lockout state from active rules', () => {
    expect(
      evaluateGuardianLockout([
        { id: 'daily-limit', reason: 'Daily limit breached.', active: true },
        { id: 'repeated-override', reason: 'Repeated override attempt.', active: true },
      ]),
    ).toEqual({
      status: 'locked',
      activeRuleIds: ['daily-limit', 'repeated-override'],
      explanation: 'Daily limit breached. Repeated override attempt.',
    });
  });
});
