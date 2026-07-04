import { describe, expect, it } from 'vitest';
import {
  buildCommanderPacingLine,
  buildOperationalPsychologyProfile,
  requiresDeliberateConfirmation,
} from './OperationalPsychology';

describe('OperationalPsychology', () => {
  it('assigns distinct psychology to the core mission rooms', () => {
    expect(buildOperationalPsychologyProfile({ room: 'ready-room', missionState: 'briefing' })).toMatchObject({
      mindset: 'preparation',
      pacing: 'slow',
      focusInstruction: 'Plan calmly before Headquarters commits resources.',
    });
    expect(buildOperationalPsychologyProfile({ room: 'observation', missionState: 'observation' })).toMatchObject({
      mindset: 'patience',
      pacing: 'slow',
      focusInstruction: 'Report only visible evidence. Prediction stays silent.',
    });
    expect(buildOperationalPsychologyProfile({ room: 'war-room', missionState: 'authorization' })).toMatchObject({
      mindset: 'decision',
      pacing: 'direct',
      ceremony: 'Observation Complete: evidence is ready for responsibility.',
    });
    expect(buildOperationalPsychologyProfile({ room: 'debrief', missionState: 'return_to_base' })).toMatchObject({
      mindset: 'reflection',
      pacing: 'reflective',
    });
    expect(buildOperationalPsychologyProfile({ room: 'archive', missionState: 'archived' })).toMatchObject({
      mindset: 'closure',
      pacing: 'formal',
    });
  });

  it('marks important rooms as requiring deliberate confirmation', () => {
    expect(requiresDeliberateConfirmation(buildOperationalPsychologyProfile({ room: 'war-room' }))).toBe(true);
    expect(requiresDeliberateConfirmation(buildOperationalPsychologyProfile({ room: 'archive' }))).toBe(true);
    expect(requiresDeliberateConfirmation(buildOperationalPsychologyProfile({ room: 'observation' }))).toBe(false);
  });

  it('builds Commander pacing lines and long-session awareness deterministically', () => {
    const profile = buildOperationalPsychologyProfile({
      room: 'observation',
      missionState: 'observation',
      elapsedMinutes: 45,
    });

    expect(buildCommanderPacingLine(profile)).toContain('Commander pacing is slow');
    expect(buildCommanderPacingLine(profile)).toContain('Long session awareness active');
  });
});
