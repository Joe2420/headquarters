import type { MissionState } from '@headquarters/shared';
import type { CommandChairStatus } from './CommandChair';
import { CommandChair } from './CommandChair';
import type { CommanderShellRoomId } from './CommanderShell';
import type { HeadquartersEvent, HeadquartersOperationalAwareness } from './HeadquartersEventEngine';
import type { MissionIntelligencePackage } from './MissionIntelligencePackage';
import type { OperationalPsychologyProfile } from './OperationalPsychology';
import { buildCommanderCeremonyDialogueForMissionState } from './CommanderCeremonyDialogue';

export interface HeadquartersAtmosphereMission {
  readonly campaign: string;
  readonly objective: string;
  readonly currentState: string;
  readonly commandAuthority: string;
}

export interface SituationBoardInput {
  readonly hqosStatus: string;
  readonly currentMissionPhase: string;
  readonly recommendedRoom: CommanderShellRoomId;
  readonly guardianStatus: string;
  readonly recentDoctrine?: string | undefined;
  readonly recentGrowth?: string | undefined;
  readonly intelligenceIndicator?: string | undefined;
  readonly missionIntelligence?: MissionIntelligencePackage | undefined;
  readonly operationalAwareness?: HeadquartersOperationalAwareness | undefined;
  readonly psychologyProfile?: OperationalPsychologyProfile | undefined;
}

export interface AmbientStatusInput {
  readonly hqos: string;
  readonly archive: string;
  readonly mission: string;
  readonly guardian: string;
  readonly currentRoom: string;
}

export interface MissionCeremony {
  readonly id: string;
  readonly label: string;
  readonly message: string;
  readonly supportingLine?: string | undefined;
  readonly room?: CommanderShellRoomId | undefined;
  readonly tone?: string | undefined;
}

const roomLabels: Record<string, string> = {
  command: 'Command Center',
  missions: 'Mission Room',
  ready: 'Ready Room',
  'ready-room': 'Ready Room',
  observation: 'Observation Room',
  war: 'War Room',
  'war-room': 'War Room',
  debrief: 'Debrief Theater',
  archive: 'Archive',
  journal: 'Journal',
  doctrine: 'Doctrine',
  academy: 'Academy',
  guardian: 'Guardian',
  intelligence: 'Intelligence',
  settings: 'Settings',
};

export function buildCommandChairStatus(
  reportState: 'not-reported' | 'reported',
  mission?: HeadquartersAtmosphereMission | undefined,
): CommandChairStatus {
  if (reportState === 'not-reported') return 'awaiting-report';
  if (mission === undefined) return 'occupied';
  if (mission.currentState === 'archived') return 'occupied';
  return 'mission-active';
}

export function formatRoomLabel(room: string): string {
  return roomLabels[room] ?? room
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getRoomAtmosphereToken(room: string): string {
  if (room === 'command' || room === 'missions') return 'command';
  if (room === 'ready' || room === 'ready-room') return 'ready';
  if (room === 'observation') return 'observation';
  if (room === 'war' || room === 'war-room') return 'war';
  if (room === 'debrief') return 'debrief';
  if (room === 'archive') return 'archive';
  if (room === 'journal') return 'journal';
  if (room === 'doctrine') return 'doctrine';
  if (room === 'academy') return 'academy';
  if (room === 'guardian') return 'guardian';
  if (room === 'intelligence') return 'intelligence';
  return 'neutral';
}

export function buildMissionCeremony(state?: MissionState | undefined): MissionCeremony | undefined {
  const dialogue = buildCommanderCeremonyDialogueForMissionState(state);
  if (!dialogue) return undefined;

  return {
    id: getMissionCeremonyId(dialogue.moment),
    label: dialogue.label,
    message: dialogue.commanderLine,
    supportingLine: dialogue.supportingLine,
    room: dialogue.room,
    tone: dialogue.tone,
  };
}

function getMissionCeremonyId(moment: string): string {
  if (moment === 'report_accepted') return 'ceremony:report-accepted';
  if (moment === 'mission_created') return 'ceremony:mission-created';
  if (moment === 'briefing_complete') return 'ceremony:briefing-complete';
  if (moment === 'observation_started') return 'ceremony:observation-begins';
  if (moment === 'observation_complete') return 'ceremony:observation-complete';
  if (moment === 'authorization_requested') return 'ceremony:authorization-requested';
  if (moment === 'authorization_granted') return 'ceremony:authorization-granted';
  if (moment === 'return_to_base') return 'ceremony:return-to-base';
  if (moment === 'debrief_complete') return 'ceremony:debrief-complete';
  if (moment === 'mission_archived') return 'ceremony:mission-archived';
  return `ceremony:${moment.replace(/_/g, '-')}`;
}

export function OperationalCommandChair({
  reportState,
  currentRoom,
  mission,
  primaryAction,
  onCommandAction,
}: {
  readonly reportState: 'not-reported' | 'reported';
  readonly currentRoom: string;
  readonly mission?: HeadquartersAtmosphereMission | undefined;
  readonly primaryAction: string;
  readonly onCommandAction?: (() => void) | undefined;
}) {
  return (
    <div className="operational-command-chair">
      <CommandChair
        status={buildCommandChairStatus(reportState, mission)}
        operatorStatus={reportState === 'reported' ? 'Operator seated' : 'Awaiting report'}
        currentAuthority={mission?.commandAuthority ?? 'Headquarters standby'}
        currentRoom={formatRoomLabel(currentRoom)}
        primaryAction={primaryAction}
        onCommandAction={onCommandAction}
      />
    </div>
  );
}

export function SituationBoard({ input }: { readonly input: SituationBoardInput }) {
  const doctrine = input.recentDoctrine ?? 'No doctrine highlight';
  const growth = input.recentGrowth ?? 'No growth highlight';
  const intelligence = input.intelligenceIndicator ?? 'Intelligence quiet';

  return (
    <section className="situation-board" aria-label="Situation Board">
      <div>
        <p className="section-label">Situation Board</p>
        <h3>{input.currentMissionPhase}</h3>
      </div>
      <dl>
        <div><dt>HQOS</dt><dd>{input.hqosStatus}</dd></div>
        <div><dt>Recommended Room</dt><dd>{formatRoomLabel(input.recommendedRoom)}</dd></div>
        <div><dt>Guardian</dt><dd>{input.guardianStatus}</dd></div>
        <div><dt>Doctrine</dt><dd>{doctrine}</dd></div>
        <div><dt>Growth</dt><dd>{growth}</dd></div>
        <div><dt>Intelligence</dt><dd>{intelligence}</dd></div>
      </dl>
      {input.missionIntelligence ? (
        <div className="situation-intelligence-panel" aria-label="Mission Intelligence side panel">
          <p className="section-label">Mission Intelligence</p>
          <strong>{input.missionIntelligence.confidence.level} / {input.missionIntelligence.confidence.score}%</strong>
          <p>{input.missionIntelligence.missingEvidence[0]
            ? `Next evidence: ${input.missionIntelligence.missingEvidence[0].label}`
            : 'Evidence package sufficient.'}</p>
        </div>
      ) : null}
      {input.operationalAwareness ? (
        <div className="operational-awareness-panel" aria-label="Operational awareness">
          <p>{input.operationalAwareness.whyHere}</p>
          <p>{input.operationalAwareness.headquartersActivity}</p>
        </div>
      ) : null}
      {input.psychologyProfile ? (
        <div className="operational-mindset-panel" aria-label="Operational mindset">
          <p className="section-label">Mindset</p>
          <strong>{input.psychologyProfile.mindset}</strong>
          <p>{input.psychologyProfile.focusInstruction}</p>
          {input.psychologyProfile.deliberateFriction ? <p>{input.psychologyProfile.deliberateFriction}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

export function AmbientStatusStrip({ input }: { readonly input: AmbientStatusInput }) {
  return (
    <section className="ambient-status-strip" aria-label="Ambient Headquarters status">
      <span>HQOS: {input.hqos}</span>
      <span>Archive: {input.archive}</span>
      <span>Mission: {input.mission}</span>
      <span>Guardian: {input.guardian}</span>
      <span>Room: {input.currentRoom}</span>
    </section>
  );
}

export function MissionCeremonyMoment({
  ceremony,
  psychology,
}: {
  readonly ceremony?: MissionCeremony | undefined;
  readonly psychology?: OperationalPsychologyProfile | undefined;
}) {
  if (!ceremony && !psychology?.ceremony) return null;

  return (
    <section
      className="mission-ceremony"
      aria-label="Mission ceremony"
      data-ceremony-id={ceremony?.id ?? 'ceremony:psychology'}
      data-ceremony-room={ceremony?.room}
      data-ceremony-tone={ceremony?.tone}
    >
      <p className="section-label">{ceremony?.label ?? 'Operational Ceremony'}</p>
      <strong>{psychology?.ceremony ?? ceremony?.message}</strong>
      {ceremony && psychology?.ceremony ? <p>{ceremony.message}</p> : null}
      {ceremony?.supportingLine ? <p>{ceremony.supportingLine}</p> : null}
    </section>
  );
}

export function HeadquartersMissionFeed({ events }: { readonly events: readonly HeadquartersEvent[] }) {
  const visibleEvents = events.slice(0, 5);

  return (
    <section className="headquarters-mission-feed" aria-label="Headquarters mission feed">
      <div>
        <p className="section-label">Mission Feed</p>
        <strong>Headquarters operating</strong>
      </div>
      {visibleEvents.length > 0 ? (
        <ol>
          {visibleEvents.map((event) => (
            <li key={event.id} data-event-type={event.type} data-event-priority={event.priority}>
              <span>{event.title}</span>
              <p>{event.message}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted">Operational feed standing by.</p>
      )}
    </section>
  );
}
