import type { GuardianAlert } from '@headquarters/guardian';
import type { CommanderShellRoomId } from './CommanderShell';

export interface CommanderGuardianAlertLine {
  readonly id: string;
  readonly priority: GuardianAlert['priority'];
  readonly message: string;
  readonly room: CommanderShellRoomId;
  readonly pacing: 'slow' | 'measured' | 'direct' | 'formal';
}

export function buildCommanderGuardianAlertLines(
  alerts: readonly GuardianAlert[],
  room: CommanderShellRoomId = 'command',
): readonly CommanderGuardianAlertLine[] {
  return alerts
    .filter((alert) => alert.priority === 'medium' || alert.priority === 'high' || alert.priority === 'critical')
    .map((alert) => ({
      id: `commander:${alert.id}`,
      priority: alert.priority,
      message: formatGuardianMessage(alert, room),
      room,
      pacing: resolveGuardianPacing(room, alert.priority),
    }));
}

export function formatCommanderGuardianStatus(alerts: readonly CommanderGuardianAlertLine[]): string {
  if (alerts.length === 0) return 'Guardian reports no Commander-level alerts.';
  if (alerts.length === 1) return '1 Guardian alert requires Commander attention.';
  return `${alerts.length} Guardian alerts require Commander attention.`;
}

function formatGuardianMessage(alert: GuardianAlert, room: CommanderShellRoomId): string {
  const prefix = room === 'guardian' ? 'Guardian' : `Guardian / ${formatGuardianRoom(room)}`;
  return `${prefix}: ${alert.message}`;
}

function formatGuardianRoom(room: CommanderShellRoomId): string {
  if (room === 'ready-room') return 'Ready Room';
  if (room === 'war-room') return 'War Room';
  if (room === 'debrief') return 'Debrief';
  return room
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function resolveGuardianPacing(
  room: CommanderShellRoomId,
  priority: GuardianAlert['priority'],
): CommanderGuardianAlertLine['pacing'] {
  if (priority === 'critical' || priority === 'high') return 'direct';
  if (room === 'ready-room' || room === 'observation') return 'slow';
  if (room === 'archive' || room === 'guardian') return 'formal';
  return 'measured';
}
