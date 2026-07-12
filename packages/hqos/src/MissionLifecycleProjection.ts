import type { Mission, MissionState } from '@headquarters/shared';

export const MISSION_LIFECYCLE_STAGES = [
  'missionCreation',
  'briefing',
  'observation',
  'authorization',
  'deployed',
  'returnToBase',
  'debrief',
  'archived',
] as const;

export type MissionLifecycleStage = (typeof MISSION_LIFECYCLE_STAGES)[number];

export const MISSION_LIFECYCLE_ROOMS = [
  'command-center',
  'mission-room',
  'ready-room',
  'observation-room',
  'war-room',
  'debrief-theater',
  'archive',
] as const;

export type MissionLifecycleRoom = (typeof MISSION_LIFECYCLE_ROOMS)[number];

export interface MissionLifecycleAction {
  readonly id: string;
  readonly label: string;
  readonly room: MissionLifecycleRoom;
  readonly explanation: string;
  readonly disabled: boolean;
}

export interface MissionLifecycleBlocker {
  readonly id: string;
  readonly label: string;
  readonly explanation: string;
  readonly stage: MissionLifecycleStage;
}

export interface MissionLifecycleProjection {
  readonly missionId?: string;
  readonly activeStage: MissionLifecycleStage;
  readonly completedStages: readonly MissionLifecycleStage[];
  readonly availableRooms: readonly MissionLifecycleRoom[];
  readonly recommendedRoom: MissionLifecycleRoom;
  readonly currentPrimaryAction: MissionLifecycleAction;
  readonly blockedActions: readonly MissionLifecycleBlocker[];
  readonly transitionReason: string;
  readonly missionCompletionState: 'standby' | 'active' | 'complete';
  readonly currentMissionState?: MissionState;
  readonly missionActive: boolean;
  readonly missionComplete: boolean;
}

export function projectMissionLifecycle(mission?: Mission): MissionLifecycleProjection {
  const activeStage = getCurrentLifecycleStage(mission);
  const completedStages = getCompletedLifecycleStages(mission);
  const availableRooms = getAvailableRooms(mission);
  const recommendedRoom = getRecommendedRoom(mission);
  const currentPrimaryAction = getPrimaryLifecycleAction(mission);
  const blockedActions = getLifecycleBlockers(mission);
  const missionComplete = isMissionComplete(mission);

  return {
    ...(mission !== undefined ? { missionId: mission.id } : {}),
    activeStage,
    completedStages,
    availableRooms,
    recommendedRoom,
    currentPrimaryAction,
    blockedActions,
    transitionReason: getLifecycleTransitionReason(mission),
    missionCompletionState: mission === undefined ? 'standby' : missionComplete ? 'complete' : 'active',
    ...(mission !== undefined ? { currentMissionState: mission.state } : {}),
    missionActive: isMissionActive(mission),
    missionComplete,
  };
}

export function getCurrentLifecycleStage(mission?: Mission): MissionLifecycleStage {
  if (mission === undefined) return 'missionCreation';

  switch (mission.state) {
    case 'idle':
      return 'missionCreation';
    case 'briefing':
      return 'briefing';
    case 'ready':
    case 'observation':
      return 'observation';
    case 'authorization':
      return 'authorization';
    case 'deployed':
      return 'deployed';
    case 'return_to_base':
      return 'returnToBase';
    case 'debrief':
      return 'debrief';
    case 'archived':
      return 'archived';
  }
}

export function getCompletedLifecycleStages(mission?: Mission): readonly MissionLifecycleStage[] {
  const state = mission?.state;

  if (mission === undefined || state === 'idle') return [];
  if (state === 'briefing') return ['missionCreation'];
  if (state === 'ready' || state === 'observation') return ['missionCreation', 'briefing'];
  if (state === 'authorization') return ['missionCreation', 'briefing', 'observation'];
  if (state === 'deployed') return ['missionCreation', 'briefing', 'observation', 'authorization'];
  if (state === 'return_to_base') return ['missionCreation', 'briefing', 'observation', 'authorization', 'deployed'];
  if (state === 'debrief') return ['missionCreation', 'briefing', 'observation', 'authorization', 'deployed', 'returnToBase'];
  return ['missionCreation', 'briefing', 'observation', 'authorization', 'deployed', 'returnToBase', 'debrief', 'archived'];
}

export function getRecommendedRoom(mission?: Mission): MissionLifecycleRoom {
  const stage = getCurrentLifecycleStage(mission);

  if (mission === undefined || stage === 'missionCreation') return 'mission-room';
  if (stage === 'briefing') return 'ready-room';
  if (stage === 'observation') return 'observation-room';
  if (stage === 'authorization' || stage === 'deployed') return 'war-room';
  if (stage === 'returnToBase' || stage === 'debrief') return 'debrief-theater';
  return 'archive';
}

export function getAvailableRooms(mission?: Mission): readonly MissionLifecycleRoom[] {
  const completedStages = getCompletedLifecycleStages(mission);
  const rooms = new Set<MissionLifecycleRoom>(['command-center', 'mission-room', getRecommendedRoom(mission)]);

  for (const stage of completedStages) {
    rooms.add(getRoomForLifecycleStage(stage));
  }

  if (mission?.state === 'archived') {
    rooms.add('archive');
    rooms.add('command-center');
    rooms.add('mission-room');
  }

  return [...rooms];
}

export function getPrimaryLifecycleAction(mission?: Mission): MissionLifecycleAction {
  if (mission === undefined) {
    return {
      id: 'create-mission',
      label: 'Create Mission',
      room: 'mission-room',
      explanation: 'No active mission exists. Create the operational file before entering mission rooms.',
      disabled: false,
    };
  }

  switch (mission.state) {
    case 'idle':
      return {
        id: 'start-briefing',
        label: 'Start Briefing',
        room: 'ready-room',
        explanation: 'Mission exists but briefing has not begun.',
        disabled: false,
      };
    case 'briefing':
      return {
        id: 'complete-briefing',
        label: 'Complete Ready Room Briefing',
        room: 'ready-room',
        explanation: 'Ready Room owns mission briefing context.',
        disabled: false,
      };
    case 'ready':
      return {
        id: 'enter-observation',
        label: 'Enter Observation Room',
        room: 'observation-room',
        explanation: 'Briefing is complete. Observation may begin.',
        disabled: false,
      };
    case 'observation':
      return {
        id: 'complete-observation',
        label: 'Complete Observation',
        room: 'observation-room',
        explanation: 'Visible evidence must be collected before War Room authorization.',
        disabled: false,
      };
    case 'authorization':
      return {
        id: 'request-authorization',
        label: 'Request Authorization',
        room: 'war-room',
        explanation: 'War Room owns decision authority and protective-rule review.',
        disabled: false,
      };
    case 'deployed':
      return {
        id: 'plan-concluded',
        label: 'Plan Concluded',
        room: 'war-room',
        explanation: 'Deployment is active. Report material change, review authorization, or conclude the plan deliberately.',
        disabled: false,
      };
    case 'return_to_base':
      return {
        id: 'enter-debrief',
        label: 'Enter Debrief Theater',
        room: 'debrief-theater',
        explanation: 'Mission has returned. Debrief must capture behavior and lesson.',
        disabled: false,
      };
    case 'debrief':
      return {
        id: 'archive-mission',
        label: 'Archive Mission',
        room: 'debrief-theater',
        explanation: 'Debrief is complete. Archive the permanent record.',
        disabled: false,
      };
    case 'archived':
      return {
        id: 'create-next-mission',
        label: 'Create Next Mission',
        room: 'mission-room',
        explanation: 'Archived mission remains historical. Active mission slot is clear.',
        disabled: false,
      };
  }
}

export function getLifecycleBlockers(mission?: Mission): readonly MissionLifecycleBlocker[] {
  const action = getPrimaryLifecycleAction(mission);

  if (mission === undefined || mission.state === 'archived') return [];

  return [{
    id: `future-room-lock-${action.id}`,
    label: 'Future rooms locked',
    explanation: action.explanation,
    stage: getCurrentLifecycleStage(mission),
  }];
}

export function isMissionActive(mission?: Mission): boolean {
  return mission !== undefined && mission.state !== 'archived';
}

export function isMissionComplete(mission?: Mission): boolean {
  return mission?.state === 'archived';
}

export function getLifecycleTransitionReason(mission?: Mission): string {
  return getPrimaryLifecycleAction(mission).explanation;
}

export function getRoomForLifecycleStage(stage: MissionLifecycleStage): MissionLifecycleRoom {
  if (stage === 'missionCreation') return 'mission-room';
  if (stage === 'briefing') return 'ready-room';
  if (stage === 'observation') return 'observation-room';
  if (stage === 'authorization' || stage === 'deployed') return 'war-room';
  if (stage === 'returnToBase' || stage === 'debrief') return 'debrief-theater';
  return 'archive';
}
