export type GuardianLimitStatus = 'clear' | 'warning' | 'breached';

export interface GuardianDailyLimitConfig {
  readonly maxLossPercent: number;
  readonly warningPercent: number;
  readonly maxTrades: number;
}

export interface GuardianDailyLimitInput {
  readonly lossPercent: number;
  readonly tradesTaken: number;
}

export interface GuardianDailyLimitResult {
  readonly status: GuardianLimitStatus;
  readonly lossUsagePercent: number;
  readonly tradeUsagePercent: number;
  readonly warnings: readonly string[];
}

export function evaluateGuardianDailyLimits(
  config: GuardianDailyLimitConfig,
  input: GuardianDailyLimitInput,
): GuardianDailyLimitResult {
  const lossUsagePercent = usage(input.lossPercent, config.maxLossPercent);
  const tradeUsagePercent = usage(input.tradesTaken, config.maxTrades);
  const warnings: string[] = [];

  if (lossUsagePercent >= 100) warnings.push('Daily loss limit breached.');
  else if (lossUsagePercent >= config.warningPercent) warnings.push('Daily loss limit warning.');

  if (tradeUsagePercent >= 100) warnings.push('Daily trade limit breached.');
  else if (tradeUsagePercent >= config.warningPercent) warnings.push('Daily trade limit warning.');

  return {
    status: resolveStatus(warnings),
    lossUsagePercent,
    tradeUsagePercent,
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
