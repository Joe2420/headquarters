import type { MissionState } from '@headquarters/shared';
import type { CommanderShellRoomId } from './CommanderShell';

export type HeadquartersExperienceRoomId = CommanderShellRoomId;
export type HeadquartersRoomState = 'locked' | 'available' | 'recommended' | 'active' | 'completed';

export interface HeadquartersRoomStatus {
  readonly id: HeadquartersExperienceRoomId;
  readonly state: HeadquartersRoomState;
}

export const missionRoomPath = ['command', 'ready-room', 'observation', 'war-room', 'debrief', 'archive'] as const;

export function recommendRoomForMissionState(state?: MissionState): HeadquartersExperienceRoomId {
  if (state === undefined) return 'command';
  if (state === 'idle' || state === 'briefing') return 'ready-room';
  if (state === 'ready' || state === 'observation') return 'observation';
  if (state === 'authorization' || state === 'deployed') return 'war-room';
  if (state === 'return_to_base') return 'debrief';
  return 'archive';
}

export function buildMissionRoomStates(
  missionState: MissionState | undefined,
  activeRoom: HeadquartersExperienceRoomId = recommendRoomForMissionState(missionState),
): HeadquartersRoomStatus[] {
  const recommendedRoom = recommendRoomForMissionState(missionState);
  const recommendedIndex = missionRoomPath.indexOf(recommendedRoom as (typeof missionRoomPath)[number]);

  return missionRoomPath.map((room, index) => ({
    id: room,
    state: getRoomState(index, recommendedIndex, room, recommendedRoom, activeRoom),
  }));
}

function getRoomState(
  index: number,
  recommendedIndex: number,
  room: HeadquartersExperienceRoomId,
  recommendedRoom: HeadquartersExperienceRoomId,
  activeRoom: HeadquartersExperienceRoomId,
): HeadquartersRoomState {
  if (room === activeRoom) return 'active';
  if (room === recommendedRoom) return 'recommended';
  if (index < recommendedIndex) return 'completed';
  if (index === recommendedIndex + 1) return 'available';
  return 'locked';
}
