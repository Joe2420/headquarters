import type { MissionState } from '@headquarters/shared';
import type { CommandChairStatus } from './CommandChair';
import { CommandChair } from './CommandChair';
import type { CommanderShellRoomId } from './CommanderShell';

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
  if (state === undefined) {
    return {
      id: 'ceremony:report-accepted',
      label: 'Report Accepted',
      message: 'Headquarters is seated. Await mission creation.',
    };
  }

  if (state === 'briefing') return { id: 'ceremony:mission-created', label: 'Mission Created', message: 'Mission file opened. Prepare before motion.' };
  if (state === 'ready') return { id: 'ceremony:briefing-complete', label: 'Briefing Complete', message: 'Observation is authorized to begin.' };
  if (state === 'observation') return { id: 'ceremony:observation-begins', label: 'Observation Begins', message: 'Silence and evidence now take priority.' };
  if (state === 'authorization') return { id: 'ceremony:authorization-requested', label: 'Authorization Requested', message: 'War Room authority is active.' };
  if (state === 'return_to_base') return { id: 'ceremony:return-to-base', label: 'Return To Base', message: 'Operation closed. Debrief before archive.' };
  if (state === 'debrief') return { id: 'ceremony:debrief-complete', label: 'Debrief Complete', message: 'Record the mission into institutional memory.' };
  if (state === 'archived') return { id: 'ceremony:mission-archived', label: 'Mission Archived', message: 'Mission record preserved.' };
  return undefined;
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

export function MissionCeremonyMoment({ ceremony }: { readonly ceremony?: MissionCeremony | undefined }) {
  if (!ceremony) return null;

  return (
    <section className="mission-ceremony" aria-label="Mission ceremony" data-ceremony-id={ceremony.id}>
      <p className="section-label">{ceremony.label}</p>
      <strong>{ceremony.message}</strong>
    </section>
  );
}
