export type GuardianAlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface GuardianAlertSource {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly severity: 'notice' | 'caution' | 'breach' | 'lock';
}

export interface GuardianAlert {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly priority: GuardianAlertPriority;
  readonly sourceId: string;
}

export function buildGuardianAlerts(sources: readonly GuardianAlertSource[]): readonly GuardianAlert[] {
  return sources.map((source) => ({
    id: `guardian-alert-${source.id}`,
    title: source.title,
    message: source.detail,
    priority: priorityForSeverity(source.severity),
    sourceId: source.id,
  }));
}

function priorityForSeverity(severity: GuardianAlertSource['severity']): GuardianAlertPriority {
  if (severity === 'lock') return 'critical';
  if (severity === 'breach') return 'high';
  if (severity === 'caution') return 'medium';
  return 'low';
}
