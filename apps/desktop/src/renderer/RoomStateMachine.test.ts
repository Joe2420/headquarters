import { describe, expect, it } from 'vitest';
import { buildMissionRoomStates, recommendRoomForMissionState } from './RoomStateMachine';

describe('RoomStateMachine foundation', () => {
  it('recommends the main room path for mission lifecycle states', () => {
    expect(recommendRoomForMissionState(undefined)).toBe('command');
    expect(recommendRoomForMissionState('idle')).toBe('ready-room');
    expect(recommendRoomForMissionState('briefing')).toBe('ready-room');
    expect(recommendRoomForMissionState('ready')).toBe('observation');
    expect(recommendRoomForMissionState('observation')).toBe('observation');
    expect(recommendRoomForMissionState('authorization')).toBe('war-room');
    expect(recommendRoomForMissionState('deployed')).toBe('war-room');
    expect(recommendRoomForMissionState('return_to_base')).toBe('debrief');
    expect(recommendRoomForMissionState('debrief')).toBe('archive');
    expect(recommendRoomForMissionState('archived')).toBe('archive');
  });

  it('derives active, completed, available, and locked room states', () => {
    expect(buildMissionRoomStates('authorization', 'war-room')).toEqual([
      { id: 'command', state: 'completed' },
      { id: 'ready-room', state: 'completed' },
      { id: 'observation', state: 'completed' },
      { id: 'war-room', state: 'active' },
      { id: 'debrief', state: 'available' },
      { id: 'archive', state: 'locked' },
    ]);
  });

  it('keeps recommendation separate from current sidebar-active room', () => {
    expect(buildMissionRoomStates('ready', 'journal')).toEqual([
      { id: 'command', state: 'completed' },
      { id: 'ready-room', state: 'completed' },
      { id: 'observation', state: 'recommended' },
      { id: 'war-room', state: 'available' },
      { id: 'debrief', state: 'locked' },
      { id: 'archive', state: 'locked' },
    ]);
  });
});
