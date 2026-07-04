import type { AudioCueId, AudioEvent, AudioPriority } from './AudioEvents';
import { createAudioEvent } from './AudioEvents';

export type GuardianAudioAlertLevel = 'info' | 'caution' | 'warning' | 'lockout';

export interface GuardianAudioPreferenceState {
  readonly audioEnabled: boolean;
  readonly guardianAudioEnabled: boolean;
  readonly reducedAudio: boolean;
}

const guardianCueByLevel: Record<GuardianAudioAlertLevel, AudioCueId> = {
  info: 'guardian_alert_info',
  caution: 'guardian_alert_caution',
  warning: 'guardian_alert_warning',
  lockout: 'guardian_alert_lockout',
};

const guardianPriorityByLevel: Record<GuardianAudioAlertLevel, AudioPriority> = {
  info: 'low',
  caution: 'normal',
  warning: 'high',
  lockout: 'critical',
};

export function resolveGuardianAlertCue(level: GuardianAudioAlertLevel | string): AudioCueId | undefined {
  return isGuardianAudioAlertLevel(level) ? guardianCueByLevel[level] : undefined;
}

export function getGuardianAlertAudioPriority(level: GuardianAudioAlertLevel): AudioPriority {
  return guardianPriorityByLevel[level];
}

export function shouldEmitGuardianAudioHook(level: GuardianAudioAlertLevel, preferences: GuardianAudioPreferenceState): boolean {
  if (!preferences.audioEnabled || !preferences.guardianAudioEnabled) return false;
  if (preferences.reducedAudio && level !== 'lockout') return false;
  return true;
}

export function buildGuardianAlertAudioEvent(
  level: GuardianAudioAlertLevel,
  preferences: GuardianAudioPreferenceState = {
    audioEnabled: true,
    guardianAudioEnabled: true,
    reducedAudio: false,
  },
  createdAt = '2026-07-04T00:00:00.000Z',
): AudioEvent | undefined {
  if (!shouldEmitGuardianAudioHook(level, preferences)) return undefined;

  return createAudioEvent({
    type: 'guardian_alert',
    cueId: guardianCueByLevel[level],
    channel: 'guardian',
    priority: guardianPriorityByLevel[level],
    createdAt,
    room: 'guardian',
    reason: `Guardian alert audio hook: ${level}.`,
  });
}

function isGuardianAudioAlertLevel(value: string): value is GuardianAudioAlertLevel {
  return value === 'info' || value === 'caution' || value === 'warning' || value === 'lockout';
}
