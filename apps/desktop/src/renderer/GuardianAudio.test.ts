import { describe, expect, it } from 'vitest';
import {
  buildGuardianAlertAudioEvent,
  getGuardianAlertAudioPriority,
  resolveGuardianAlertCue,
  shouldEmitGuardianAudioHook,
  type GuardianAudioAlertLevel,
} from './GuardianAudio';

describe('GuardianAudio', () => {
  it('maps Guardian alert levels to calm but distinct cue IDs', () => {
    const levels: readonly GuardianAudioAlertLevel[] = ['info', 'caution', 'warning', 'lockout'];

    expect(levels.map((level) => resolveGuardianAlertCue(level))).toEqual([
      'guardian_alert_info',
      'guardian_alert_caution',
      'guardian_alert_warning',
      'guardian_alert_lockout',
    ]);
  });

  it('increases audio priority with Guardian severity', () => {
    expect(getGuardianAlertAudioPriority('info')).toBe('low');
    expect(getGuardianAlertAudioPriority('caution')).toBe('normal');
    expect(getGuardianAlertAudioPriority('warning')).toBe('high');
    expect(getGuardianAlertAudioPriority('lockout')).toBe('critical');
  });

  it('suppresses optional Guardian audio hooks when muted or reduced', () => {
    expect(shouldEmitGuardianAudioHook('warning', {
      audioEnabled: false,
      guardianAudioEnabled: true,
      reducedAudio: false,
    })).toBe(false);
    expect(shouldEmitGuardianAudioHook('warning', {
      audioEnabled: true,
      guardianAudioEnabled: true,
      reducedAudio: true,
    })).toBe(false);
    expect(shouldEmitGuardianAudioHook('lockout', {
      audioEnabled: true,
      guardianAudioEnabled: true,
      reducedAudio: true,
    })).toBe(true);
  });

  it('builds lockout as the highest-priority silent event candidate', () => {
    const event = buildGuardianAlertAudioEvent('lockout');

    expect(event?.cueId).toBe('guardian_alert_lockout');
    expect(event?.priority).toBe('critical');
    expect(event?.channel).toBe('guardian');
  });

  it('handles unknown Guardian alert levels safely', () => {
    expect(resolveGuardianAlertCue('panic')).toBeUndefined();
  });
});
