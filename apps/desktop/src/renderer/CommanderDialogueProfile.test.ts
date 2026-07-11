import { describe, expect, it } from 'vitest';
import {
  getCommanderDialoguePresenceLine,
  getCommanderDialogueProfile,
  listCommanderDialogueProfiles,
} from './CommanderDialogueProfile';

describe('CommanderDialogueProfile', () => {
  it('defines a dialogue profile for every Commander room', () => {
    const rooms = listCommanderDialogueProfiles().map((profile) => profile.room);

    expect(rooms).toEqual([
      'command',
      'ready-room',
      'observation',
      'war-room',
      'debrief',
      'archive',
      'journal',
      'doctrine',
      'academy',
      'guardian',
      'intelligence',
      'settings',
    ]);
  });

  it('assigns distinct pacing to lifecycle rooms', () => {
    expect(getCommanderDialogueProfile('ready-room').cadence).toBe('patient');
    expect(getCommanderDialogueProfile('observation').cadence).toBe('slow');
    expect(getCommanderDialogueProfile('war-room').cadence).toBe('direct');
    expect(getCommanderDialogueProfile('debrief').cadence).toBe('reflective');
    expect(getCommanderDialogueProfile('archive').cadence).toBe('formal');
  });

  it('keeps Observation slower than War Room without changing the chat model', () => {
    const observation = getCommanderDialogueProfile('observation').timing;
    const warRoom = getCommanderDialogueProfile('war-room').timing;

    expect(observation.startDelayMs).toBeGreaterThan(warRoom.startDelayMs);
    expect(observation.characterDelayMs).toBeGreaterThan(warRoom.characterDelayMs);
    expect(observation.sentenceDelayMs).toBeGreaterThan(warRoom.sentenceDelayMs);
  });

  it('builds a deterministic presence line for room-aware Commander voice', () => {
    expect(getCommanderDialoguePresenceLine('guardian')).toBe(
      'Commander lets Guardian enforce boundaries without panic. Cadence: firm.',
    );
  });
});
