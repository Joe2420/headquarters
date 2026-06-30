export type GuardianRuleSeverity = 'notice' | 'caution' | 'breach';

export interface GuardianRuleDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly severity: GuardianRuleSeverity;
}

export interface GuardianRuleInput {
  readonly ruleId: string;
  readonly passed: boolean;
  readonly evidence: string;
}

export interface GuardianRuleViolation {
  readonly rule: GuardianRuleDefinition;
  readonly evidence: string;
}

export interface GuardianRuleMonitoringResult {
  readonly evaluatedAt: string;
  readonly totalRules: number;
  readonly passedRules: number;
  readonly violations: readonly GuardianRuleViolation[];
  readonly clear: boolean;
}

export function evaluateGuardianRules(
  rules: readonly GuardianRuleDefinition[],
  inputs: readonly GuardianRuleInput[],
  evaluatedAt: string,
): GuardianRuleMonitoringResult {
  const inputByRuleId = new Map(inputs.map((input) => [input.ruleId, input]));
  const violations: GuardianRuleViolation[] = [];
  let passedRules = 0;

  for (const rule of rules) {
    const input = inputByRuleId.get(rule.id);
    if (input === undefined || !input.passed) {
      violations.push({
        rule,
        evidence: input?.evidence ?? 'No rule evidence provided.',
      });
      continue;
    }

    passedRules += 1;
  }

  return {
    evaluatedAt,
    totalRules: rules.length,
    passedRules,
    violations,
    clear: violations.length === 0,
  };
}
