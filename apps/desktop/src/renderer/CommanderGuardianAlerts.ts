import type { GuardianAlert } from '@headquarters/guardian';

export interface CommanderGuardianAlertLine {
  readonly id: string;
  readonly priority: GuardianAlert['priority'];
  readonly message: string;
}

export function buildCommanderGuardianAlertLines(alerts: readonly GuardianAlert[]): readonly CommanderGuardianAlertLine[] {
  return alerts
    .filter((alert) => alert.priority === 'medium' || alert.priority === 'high' || alert.priority === 'critical')
    .map((alert) => ({
      id: `commander:${alert.id}`,
      priority: alert.priority,
      message: `Guardian: ${alert.message}`,
    }));
}

export function formatCommanderGuardianStatus(alerts: readonly CommanderGuardianAlertLine[]): string {
  if (alerts.length === 0) return 'Guardian reports no Commander-level alerts.';
  if (alerts.length === 1) return '1 Guardian alert requires Commander attention.';
  return `${alerts.length} Guardian alerts require Commander attention.`;
}
