import { describe, expect, it } from 'vitest';
import {
  buildCommanderCeremonyAudioEvent,
  buildMissionCeremonyAudioEvent,
  mapCommanderCeremonyDialogueToAudioMoment,
  mapMissionCeremonyToAudioMoment,
  resolveMissionCeremonyCue,
  type MissionCeremonyAudioMoment,
} from './MissionCeremonyAudio';
import { getCommanderCeremonyDialogue, listCommanderCeremonyDialogues } from './CommanderCeremonyDialogue';

describe('MissionCeremonyAudio', () => {
  it('maps each mission ceremony moment to an expected audio cue', () => {
    const moments: readonly MissionCeremonyAudioMoment[] = [
      'report_for_duty_accepted',
      'mission_created',
      'briefing_complete',
      'observation_started',
      'observation_complete',
      'authorization_requested',
      'authorization_granted',
      'return_to_base',
      'debrief_complete',
      'mission_archived',
    ];

    expect(moments.map((moment) => resolveMissionCeremonyCue(moment))).toEqual([
      'ceremony_report_for_duty_accepted',
      'ceremony_mission_created',
      'ceremony_briefing_complete',
      'ceremony_observation_started',
      'ceremony_observation_complete',
      'ceremony_authorization_requested',
      'ceremony_authorization_granted',
      'ceremony_return_to_base',
      'ceremony_debrief_complete',
      'ceremony_archive_seal',
    ]);
  });

  it('maps mission archived to the archive seal cue', () => {
    const event = buildMissionCeremonyAudioEvent('mission_archived', '2026-07-04T10:00:00.000Z');

    expect(event.cueId).toBe('ceremony_archive_seal');
    expect(event.room).toBe('archive');
    expect(event.priority).toBe('high');
  });

  it('handles missing ceremony mappings safely', () => {
    expect(resolveMissionCeremonyCue('unknown-ceremony')).toBeUndefined();
    expect(mapMissionCeremonyToAudioMoment()).toBeUndefined();
  });

  it('maps the existing ceremony surface to audio moments where possible', () => {
    expect(mapMissionCeremonyToAudioMoment({
      id: 'ceremony:authorization-requested',
      label: 'Authorization Requested',
      message: 'War Room authority is active.',
    })).toBe('authorization_requested');
    expect(mapMissionCeremonyToAudioMoment({
      id: 'ceremony:authorization-granted',
      label: 'Authorization Granted',
      message: 'Authorization granted.',
    })).toBe('authorization_granted');
    expect(mapMissionCeremonyToAudioMoment({
      id: 'ceremony:observation-complete',
      label: 'Observation Complete',
      message: 'Observation complete.',
    })).toBe('observation_complete');
  });

  it('maps Commander ceremony dialogue to deterministic audio moments', () => {
    expect(listCommanderCeremonyDialogues().map(mapCommanderCeremonyDialogueToAudioMoment)).toEqual([
      'report_for_duty_accepted',
      'mission_created',
      'briefing_complete',
      'observation_started',
      'observation_complete',
      'authorization_requested',
      'authorization_granted',
      'return_to_base',
      'debrief_complete',
      'mission_archived',
    ]);
  });

  it('builds audio event candidates from Commander ceremony dialogue without playback', () => {
    const event = buildCommanderCeremonyAudioEvent(
      getCommanderCeremonyDialogue('authorization_granted'),
      '2026-07-04T10:00:00.000Z',
    );

    expect(event).toMatchObject({
      id: 'audio:war-room:ceremony_authorization_granted:2026-07-04T10:00:00.000Z',
      type: 'ceremony_cue',
      cueId: 'ceremony_authorization_granted',
      channel: 'ceremony',
      priority: 'high',
      room: 'war-room',
      reason: 'Mission ceremony audio hook: authorization_granted.',
    });
  });
});
