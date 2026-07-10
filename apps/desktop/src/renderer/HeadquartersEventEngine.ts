import type { GuardianAlert } from '@headquarters/guardian';
import type { GrowthEvent } from '@headquarters/journal';
import type { CommanderShellRoomId } from './CommanderShell';
import type { MissionIntelligencePackage } from './MissionIntelligencePackage';

export type HeadquartersEventType =
  | 'commander_reminder'
  | 'guardian_observation'
  | 'mission_status_update'
  | 'room_status_update'
  | 'intelligence_update'
  | 'academy_progress'
  | 'doctrine_candidate'
  | 'archive_synchronization';

export type HeadquartersEventPriority = 'low' | 'normal' | 'high';

export interface HeadquartersEvent {
  readonly id: string;
  readonly type: HeadquartersEventType;
  readonly priority: HeadquartersEventPriority;
  readonly room: CommanderShellRoomId;
  readonly title: string;
  readonly message: string;
  readonly createdAt: string;
  readonly source: 'commander' | 'guardian' | 'mission' | 'room' | 'intelligence' | 'academy' | 'doctrine' | 'archive';
}

export interface HeadquartersEventEngineInput {
  readonly reportState: 'not-reported' | 'reported';
  readonly currentRoom: CommanderShellRoomId;
  readonly recommendedRoom: CommanderShellRoomId;
  readonly missionId?: string | undefined;
  readonly missionPhase: string;
  readonly missionIntelligence?: MissionIntelligencePackage | undefined;
  readonly guardianAlerts: readonly GuardianAlert[];
  readonly growthEvents: readonly GrowthEvent[];
  readonly doctrineCandidateCount: number;
  readonly archiveRecordCount: number;
  readonly currentObjective: string;
  readonly createdAt?: string | undefined;
}

export interface HeadquartersOperationalAwareness {
  readonly location: string;
  readonly whyHere: string;
  readonly whatRemains: string;
  readonly commanderExpectation: string;
  readonly headquartersActivity: string;
}

const defaultCreatedAt = '2026-07-02T00:00:00.000Z';

export function buildHeadquartersEvents(input: HeadquartersEventEngineInput): readonly HeadquartersEvent[] {
  const createdAt = input.createdAt ?? defaultCreatedAt;
  const events: HeadquartersEvent[] = [];

  if (input.reportState === 'not-reported') {
    events.push(createHeadquartersEvent({
      id: 'hq:event:commander:awaiting-report',
      type: 'commander_reminder',
      priority: 'normal',
      room: 'command',
      title: 'Commander standing by',
      message: 'Report for duty before Headquarters commits resources.',
      createdAt,
      source: 'commander',
    }));

    return events;
  }

  events.push(createHeadquartersEvent({
    id: `hq:event:room:${input.currentRoom}`,
    type: 'room_status_update',
    priority: 'low',
    room: input.currentRoom,
    title: 'Room status updated',
    message: `${formatCommanderRoomLabel(input.currentRoom)} is active. ${input.currentObjective}`,
    createdAt,
    source: 'room',
  }));

  events.push(createHeadquartersEvent({
    id: `hq:event:mission:${input.missionId ?? 'standby'}:${normalizeEventId(input.missionPhase)}`,
    type: 'mission_status_update',
    priority: input.missionId ? 'normal' : 'low',
    room: input.recommendedRoom,
    title: 'Mission status synchronized',
    message: input.missionId
      ? `${input.missionPhase}. Recommended room: ${formatCommanderRoomLabel(input.recommendedRoom)}.`
      : 'No active mission. Headquarters is waiting for mission creation.',
    createdAt,
    source: 'mission',
  }));

  if (input.missionIntelligence) {
    events.push(createHeadquartersEvent({
      id: `hq:event:intelligence:${input.missionIntelligence.missionId}:${input.missionIntelligence.confidence.level}`,
      type: 'intelligence_update',
      priority: input.missionIntelligence.confidence.level === 'incomplete' ? 'high' : 'normal',
      room: input.recommendedRoom,
      title: 'Mission Intelligence updated',
      message: `Confidence ${input.missionIntelligence.confidence.level} at ${input.missionIntelligence.confidence.score}%. ${formatMissingEvidence(input.missionIntelligence)}`,
      createdAt,
      source: 'intelligence',
    }));
  }

  const guardianAlert = input.guardianAlerts[0];
  if (guardianAlert) {
    events.push(createHeadquartersEvent({
      id: `hq:event:guardian:${guardianAlert.id}`,
      type: 'guardian_observation',
      priority: guardianAlert.priority === 'critical' || guardianAlert.priority === 'high' ? 'high' : 'normal',
      room: 'guardian',
      title: 'Guardian observation',
      message: guardianAlert.message,
      createdAt,
      source: 'guardian',
    }));
  } else {
    events.push(createHeadquartersEvent({
      id: 'hq:event:guardian:stable',
      type: 'guardian_observation',
      priority: 'low',
      room: 'guardian',
      title: 'Guardian stable',
      message: 'Guardian reports no active boundary breach.',
      createdAt,
      source: 'guardian',
    }));
  }

  const latestGrowth = input.growthEvents.at(-1);
  if (latestGrowth) {
    events.push(createHeadquartersEvent({
      id: `hq:event:academy:${latestGrowth.id}`,
      type: 'academy_progress',
      priority: 'low',
      room: 'academy',
      title: 'Academy progress recorded',
      message: `${latestGrowth.title} remains available as behavioral evidence.`,
      createdAt,
      source: 'academy',
    }));
  }

  if (input.doctrineCandidateCount > 0) {
    events.push(createHeadquartersEvent({
      id: `hq:event:doctrine:candidates:${input.doctrineCandidateCount}`,
      type: 'doctrine_candidate',
      priority: 'normal',
      room: 'doctrine',
      title: 'Doctrine candidate available',
      message: `${input.doctrineCandidateCount} doctrine candidate${input.doctrineCandidateCount === 1 ? '' : 's'} require review before promotion.`,
      createdAt,
      source: 'doctrine',
    }));
  }

  events.push(createHeadquartersEvent({
    id: `hq:event:archive:synchronized:${input.archiveRecordCount}`,
    type: 'archive_synchronization',
    priority: 'low',
    room: 'archive',
    title: 'Archive synchronized',
    message: `${input.archiveRecordCount} archive record${input.archiveRecordCount === 1 ? '' : 's'} indexed for review.`,
    createdAt,
    source: 'archive',
  }));

  return events;
}

export function buildOperationalAwareness(input: HeadquartersEventEngineInput): HeadquartersOperationalAwareness {
  const missionStatus = input.missionId ? input.missionPhase : 'No active mission';
  const intelligenceStatus = input.missionIntelligence
    ? `${input.missionIntelligence.confidence.level} intelligence`
    : 'intelligence standing by';

  return {
    location: formatCommanderRoomLabel(input.currentRoom),
    whyHere: input.currentRoom === input.recommendedRoom
      ? 'This room matches the current mission requirement.'
      : `Commander recommends ${formatCommanderRoomLabel(input.recommendedRoom)}.`,
    whatRemains: input.missionIntelligence?.missingEvidence[0]?.label
      ?? (input.missionId ? 'Follow the current Commander instruction.' : 'Create a mission file.'),
    commanderExpectation: input.currentObjective,
    headquartersActivity: `${missionStatus}; ${intelligenceStatus}; ${input.guardianAlerts.length} Guardian alert${input.guardianAlerts.length === 1 ? '' : 's'}.`,
  };
}

export function selectPassiveCommanderMessage(events: readonly HeadquartersEvent[]): string | undefined {
  const preferred = events.find((event) => event.priority === 'high');

  if (!preferred) return undefined;

  if (preferred.type === 'guardian_observation') return 'Guardian confirms no active lockout. Continue.';
  if (preferred.type === 'intelligence_update') return `Mission intelligence incomplete. ${preferred.message}`;
  return preferred.message;
}

function createHeadquartersEvent(event: HeadquartersEvent): HeadquartersEvent {
  return event;
}

function formatMissingEvidence(missionPackage: MissionIntelligencePackage): string {
  const missing = missionPackage.missingEvidence[0];
  if (!missing) return 'Evidence file is currently sufficient.';
  return `Next evidence required: ${missing.label}.`;
}

function normalizeEventId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'standby';
}

function formatCommanderRoomLabel(room: CommanderShellRoomId): string {
  if (room === 'ready-room') return 'Ready Room';
  if (room === 'war-room') return 'War Room';
  if (room === 'debrief') return 'Debrief Theater';
  return room
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
