import type { GuardianLimitStatus } from './GuardianDailyLimits';

export interface GuardianSessionLimitConfig {
  readonly maxMinutes: number;
  readonly warningPercent: number;
  readonly maxActions: number;
}

export interface GuardianSessionLimitInput {
  readonly elapsedMinutes: number;
  readonly actionsTaken: number;
}

export interface GuardianSessionLimitResult {
  readonly status: GuardianLimitStatus;
  readonly timeUsagePercent: number;
  readonly actionUsagePercent: number;
  readonly warnings: readonly string[];
}

export function evaluateGuardianSessionLimits(
  config: GuardianSessionLimitConfig,
  input: GuardianSessionLimitInput,
): GuardianSessionLimitResult {
  const timeUsagePercent = usage(input.elapsedMinutes, config.maxMinutes);
  const actionUsagePercent = usage(input.actionsTaken, config.maxActions);
  const warnings: string[] = [];

  if (timeUsagePercent >= 100) warnings.push('Session time limit breached.');
  else if (timeUsagePercent >= config.warningPercent) warnings.push('Session time limit warning.');

  if (actionUsagePercent >= 100) warnings.push('Session action limit breached.');
  else if (actionUsagePercent >= config.warningPercent) warnings.push('Session action limit warning.');

  return {
    status: resolveStatus(warnings),
    timeUsagePercent,
    actionUsagePercent,
    warnings,
  };
}

function usage(value: number, limit: number): number {
  if (limit <= 0) return 100;
  return Math.max(0, Math.round((value / limit) * 100));
}

function resolveStatus(warnings: readonly string[]): GuardianLimitStatus {
  if (warnings.some((warning) => warning.includes('breached'))) return 'breached';
  if (warnings.length > 0) return 'warning';
  return 'clear';
}
