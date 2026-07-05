import type { CommanderShellRoomId } from './CommanderShell';
import type { HeadquartersEvent } from './HeadquartersEventEngine';
import type { MissionIntelligencePackage } from './MissionIntelligencePackage';

export interface HeadquartersOperatingEnvironmentInput {
  readonly events: readonly HeadquartersEvent[];
  readonly currentRoom: CommanderShellRoomId;
  readonly missionPhase: string;
  readonly currentObjective: string;
  readonly commanderStatus: string;
  readonly guardianStatus: string;
  readonly missionIntelligence?: MissionIntelligencePackage | undefined;
  readonly archiveRecordCount: number;
  readonly doctrineCandidateCount: number;
  readonly growthEventCount: number;
}

export interface HeadquartersBroadcastItem {
  readonly id: string;
  readonly source: HeadquartersEvent['source'];
  readonly priority: HeadquartersEvent['priority'];
  readonly message: string;
}

export interface CommandChairConsoleState {
  readonly currentMission: string;
  readonly currentRoom: CommanderShellRoomId;
  readonly commanderStatus: string;
  readonly guardianStatus: string;
  readonly missionIntelligence: string;
  readonly currentObjective: string;
  readonly currentRestriction: string;
  readonly currentReadiness: string;
}

export interface LiveOperationalTimelineEntry {
  readonly id: string;
  readonly label: string;
  readonly source: HeadquartersEvent['source'];
  readonly room: CommanderShellRoomId;
  readonly priority: HeadquartersEvent['priority'];
}

export interface HeadquartersServiceActivity {
  readonly id: string;
  readonly label: string;
  readonly status: 'standing-by' | 'working' | 'attention';
  readonly detail: string;
}

export interface OperationalNotification {
  readonly id: string;
  readonly message: string;
  readonly priority: HeadquartersEvent['priority'];
}

export interface HeadquartersOperatingEnvironment {
  readonly broadcast: readonly HeadquartersBroadcastItem[];
  readonly commandChair: CommandChairConsoleState;
  readonly timeline: readonly LiveOperationalTimelineEntry[];
  readonly services: readonly HeadquartersServiceActivity[];
  readonly notifications: readonly OperationalNotification[];
}

export function buildHeadquartersOperatingEnvironment(
  input: HeadquartersOperatingEnvironmentInput,
): HeadquartersOperatingEnvironment {
  const intelligenceLabel = input.missionIntelligence
    ? `${input.missionIntelligence.confidence.level} / ${input.missionIntelligence.confidence.score}%`
    : 'standing by';

  const missingEvidence = input.missionIntelligence?.missingEvidence[0]?.label;

  return {
    broadcast: input.events.slice(0, 6).map((event) => ({
      id: `broadcast:${event.id}`,
      source: event.source,
      priority: event.priority,
      message: `${event.title}. ${event.message}`,
    })),
    commandChair: {
      currentMission: input.missionPhase,
      currentRoom: input.currentRoom,
      commanderStatus: input.commanderStatus,
      guardianStatus: input.guardianStatus,
      missionIntelligence: intelligenceLabel,
      currentObjective: input.currentObjective,
      currentRestriction: missingEvidence ? `Evidence required: ${missingEvidence}` : 'No active restriction.',
      currentReadiness: input.missionIntelligence?.confidence.level === 'sufficient' ? 'Ready' : 'Building evidence',
    },
    timeline: input.events.map((event) => ({
      id: `timeline:${event.id}`,
      label: event.title,
      source: event.source,
      room: event.room,
      priority: event.priority,
    })),
    services: buildHeadquartersServices(input),
    notifications: input.events
      .filter((event) => event.priority !== 'low')
      .slice(0, 4)
      .map((event) => ({
        id: `notification:${event.id}`,
        message: event.message,
        priority: event.priority,
      })),
  };
}

function buildHeadquartersServices(input: HeadquartersOperatingEnvironmentInput): HeadquartersServiceActivity[] {
  return [
    {
      id: 'service:archive',
      label: 'Archive',
      status: input.archiveRecordCount > 0 ? 'working' : 'standing-by',
      detail: `${input.archiveRecordCount} record${input.archiveRecordCount === 1 ? '' : 's'} indexed.`,
    },
    {
      id: 'service:guardian',
      label: 'Guardian',
      status: input.guardianStatus === 'No Guardian alerts' ? 'standing-by' : 'attention',
      detail: input.guardianStatus,
    },
    {
      id: 'service:doctrine',
      label: 'Doctrine',
      status: input.doctrineCandidateCount > 0 ? 'attention' : 'standing-by',
      detail: `${input.doctrineCandidateCount} candidate${input.doctrineCandidateCount === 1 ? '' : 's'} awaiting review.`,
    },
    {
      id: 'service:academy',
      label: 'Academy',
      status: input.growthEventCount > 0 ? 'working' : 'standing-by',
      detail: `${input.growthEventCount} growth event${input.growthEventCount === 1 ? '' : 's'} available.`,
    },
    {
      id: 'service:intelligence',
      label: 'Intelligence',
      status: input.missionIntelligence?.confidence.level === 'incomplete' ? 'attention' : 'working',
      detail: input.missionIntelligence
        ? `${input.missionIntelligence.confidence.score}% mission intelligence confidence.`
        : 'Waiting for mission evidence.',
    },
  ];
}

export function HeadquartersBroadcastFeed({ items }: { readonly items: readonly HeadquartersBroadcastItem[] }) {
  return (
    <section className="hqos-broadcast-feed" aria-label="HQ broadcast feed">
      <p className="section-label">HQ Broadcast</p>
      <ol>
        {items.map((item) => (
          <li key={item.id} data-source={item.source} data-priority={item.priority}>
            {item.message}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function CommandChairOperatingConsole({ state }: { readonly state: CommandChairConsoleState }) {
  return (
    <section className="command-chair-console" aria-label="Command Chair operating console">
      <p className="section-label">Command Chair Console</p>
      <dl>
        <div><dt>Mission</dt><dd>{state.currentMission}</dd></div>
        <div><dt>Room</dt><dd>{state.currentRoom}</dd></div>
        <div><dt>Commander</dt><dd>{state.commanderStatus}</dd></div>
        <div><dt>Guardian</dt><dd>{state.guardianStatus}</dd></div>
        <div><dt>Intelligence</dt><dd>{state.missionIntelligence}</dd></div>
        <div><dt>Objective</dt><dd>{state.currentObjective}</dd></div>
        <div><dt>Restriction</dt><dd>{state.currentRestriction}</dd></div>
        <div><dt>Readiness</dt><dd>{state.currentReadiness}</dd></div>
      </dl>
    </section>
  );
}

export function LiveOperationalTimeline({ entries }: { readonly entries: readonly LiveOperationalTimelineEntry[] }) {
  return (
    <section className="live-operational-timeline" aria-label="Live operational timeline">
      <p className="section-label">Live Timeline</p>
      <ol>
        {entries.map((entry) => (
          <li key={entry.id} data-source={entry.source} data-room={entry.room} data-priority={entry.priority}>
            {entry.label}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function HeadquartersServiceActivityPanel({ services }: { readonly services: readonly HeadquartersServiceActivity[] }) {
  return (
    <section className="headquarters-services-panel" aria-label="Headquarters services">
      <p className="section-label">Services</p>
      <ul>
        {services.map((service) => (
          <li key={service.id} data-service-status={service.status}>
            <strong>{service.label}</strong>
            <span>{service.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OperationalNotifications({ notifications }: { readonly notifications: readonly OperationalNotification[] }) {
  return (
    <section className="operational-notifications" aria-label="Operational notifications">
      <p className="section-label">Notifications</p>
      {notifications.length === 0 ? (
        <p>No immediate operational alerts.</p>
      ) : (
        <ol>
          {notifications.map((notification) => (
            <li key={notification.id} data-priority={notification.priority}>{notification.message}</li>
          ))}
        </ol>
      )}
    </section>
  );
}
