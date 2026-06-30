export type GuardianRiskLevel = 'clear' | 'attention' | 'intervention' | 'lock';

export interface GuardianRiskInput {
  readonly dailyLossPercent?: number;
  readonly ruleViolationCount?: number;
  readonly revengeSignalCount?: number;
  readonly fatigueLevel?: number;
}

export interface GuardianRiskState {
  readonly level: GuardianRiskLevel;
  readonly score: number;
  readonly reasons: readonly string[];
  readonly missingInputs: readonly string[];
}

const REQUIRED_INPUTS = ['dailyLossPercent', 'ruleViolationCount', 'revengeSignalCount', 'fatigueLevel'] as const;

export function evaluateGuardianRisk(input: GuardianRiskInput): GuardianRiskState {
  const missingInputs = REQUIRED_INPUTS.filter((key) => input[key] === undefined);
  const reasons: string[] = [];
  let score = 0;

  if (input.dailyLossPercent !== undefined) {
    if (input.dailyLossPercent >= 5) {
      score += 45;
      reasons.push('Daily loss pressure is above intervention threshold.');
    } else if (input.dailyLossPercent >= 3) {
      score += 25;
      reasons.push('Daily loss pressure requires attention.');
    }
  }

  if (input.ruleViolationCount !== undefined && input.ruleViolationCount > 0) {
    score += input.ruleViolationCount * 20;
    reasons.push('Rule violations are present.');
  }

  if (input.revengeSignalCount !== undefined && input.revengeSignalCount > 0) {
    score += input.revengeSignalCount * 15;
    reasons.push('Revenge-trading signals are present.');
  }

  if (input.fatigueLevel !== undefined && input.fatigueLevel >= 7) {
    score += 15;
    reasons.push('Fatigue level is elevated.');
  }

  if (missingInputs.length > 0) {
    reasons.push('Risk assessment has missing inputs.');
  }

  return {
    level: resolveRiskLevel(score, missingInputs.length),
    score,
    reasons,
    missingInputs,
  };
}

function resolveRiskLevel(score: number, missingInputCount: number): GuardianRiskLevel {
  if (score >= 80) return 'lock';
  if (score >= 50) return 'intervention';
  if (score > 0 || missingInputCount > 0) return 'attention';
  return 'clear';
}
