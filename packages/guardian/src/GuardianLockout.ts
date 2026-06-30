export type GuardianLockoutStatus = 'unlocked' | 'locked';

export interface GuardianLockoutRule {
  readonly id: string;
  readonly reason: string;
  readonly active: boolean;
}

export interface GuardianLockoutState {
  readonly status: GuardianLockoutStatus;
  readonly activeRuleIds: readonly string[];
  readonly explanation: string;
}

export function evaluateGuardianLockout(rules: readonly GuardianLockoutRule[]): GuardianLockoutState {
  const activeRules = rules.filter((rule) => rule.active);

  if (activeRules.length === 0) {
    return {
      status: 'unlocked',
      activeRuleIds: [],
      explanation: 'No active Guardian lockout rules.',
    };
  }

  return {
    status: 'locked',
    activeRuleIds: activeRules.map((rule) => rule.id),
    explanation: activeRules.map((rule) => rule.reason).join(' '),
  };
}
