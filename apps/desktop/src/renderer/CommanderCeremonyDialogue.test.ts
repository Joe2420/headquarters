import { describe, expect, it } from 'vitest';
import {
  buildCommanderCeremonyDialogueForMissionState,
  getCommanderCeremonyDialogue,
  listCommanderCeremonyDialogues,
  mapMissionStateToCommanderCeremonyMoment,
} from './CommanderCeremonyDialogue';

describe('CommanderCeremonyDialogue', () => {
  it('defines Commander-led dialogue for every mission ceremony moment', () => {
    expect(listCommanderCeremonyDialogues().map((dialogue) => dialogue.moment)).toEqual([
      'report_accepted',
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

  it('maps mission lifecycle states to ceremony moments deterministically', () => {
    expect(mapMissionStateToCommanderCeremonyMoment()).toBe('report_accepted');
    expect(mapMissionStateToCommanderCeremonyMoment('briefing')).toBe('mission_created');
    expect(mapMissionStateToCommanderCeremonyMoment('ready')).toBe('briefing_complete');
    expect(mapMissionStateToCommanderCeremonyMoment('observation')).toBe('observation_started');
    expect(mapMissionStateToCommanderCeremonyMoment('authorization')).toBe('authorization_requested');
    expect(mapMissionStateToCommanderCeremonyMoment('deployed')).toBe('authorization_granted');
    expect(mapMissionStateToCommanderCeremonyMoment('return_to_base')).toBe('return_to_base');
    expect(mapMissionStateToCommanderCeremonyMoment('debrief')).toBe('debrief_complete');
    expect(mapMissionStateToCommanderCeremonyMoment('archived')).toBe('mission_archived');
  });

  it('keeps authorization and debrief ceremonies distinct in tone and room', () => {
    expect(getCommanderCeremonyDialogue('authorization_granted')).toMatchObject({
      room: 'war-room',
      tone: 'direct',
      commanderLine: 'Authorization granted.',
    });
    expect(getCommanderCeremonyDialogue('return_to_base')).toMatchObject({
      room: 'debrief',
      tone: 'reflective',
      commanderLine: 'Return to base confirmed.',
    });
  });

  it('builds ceremony dialogue from mission state for the existing ceremony surface', () => {
    expect(buildCommanderCeremonyDialogueForMissionState('archived')).toMatchObject({
      label: 'Mission Archived',
      supportingLine: 'History preserved. Headquarters can learn from this operation later.',
    });
  });
});
