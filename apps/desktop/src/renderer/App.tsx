import { type FormEvent, useEffect, useState } from 'react';
import { MissionBoard } from '@headquarters/ui';
import type { Mission } from '@headquarters/shared';
import { CommandChair } from './CommandChair';

type StartupState = 'loading' | 'ready' | 'failed';
export type DesktopShellPhase = 'security-checkpoint' | 'command-center';
export interface ActiveMission {
  id: string;
  campaign: string;
  objective: string;
  condition: string;
  commandAuthority: string;
  currentState: string;
  createdAt: string;
}

export interface MissionDraft {
  codename: string;
  objective: string;
}

export interface ArchiveWritePlaceholder {
  id: string;
  missionId: string;
  status: 'not-started' | 'queued';
  title: string;
  createdAt: string;
}

export interface MissionDebriefDraft {
  behaviorSummary: string;
  disciplineNotes: string;
  lesson: string;
}

export interface MissionDebrief {
  id: string;
  missionId: string;
  behaviorSummary: string;
  disciplineNotes: string;
  lesson: string;
  createdAt: string;
}

export interface LocalMissionArchiveSummary {
  missionId: string;
  codename: string;
  archivedAt: string;
  eventCount: number;
}

export interface ReportForDutyTransition {
  from: DesktopShellPhase;
  to: DesktopShellPhase;
  changed: boolean;
}

export type NavigationAreaId = 'command' | 'missions' | 'archive' | 'settings';

export interface PrimaryNavigationItem {
  id: NavigationAreaId;
  label: string;
  active: boolean;
}

const primaryNavigation: Array<Omit<PrimaryNavigationItem, 'active'>> = [
  { id: 'command', label: 'Command' },
  { id: 'missions', label: 'Missions' },
  { id: 'archive', label: 'Archive' },
  { id: 'settings', label: 'Settings' },
];

export interface StartupStatus {
  state: StartupState;
  database: {
    connected: boolean;
    path?: string;
  };
  migrations: {
    applied: string[];
    skipped: string[];
  };
  error?: string;
}

declare global {
  interface Window {
    headquarters?: {
      version?: string;
      getStartupStatus?: () => Promise<StartupStatus>;
      createMission?: (input: MissionDraft) => Promise<{ mission: Mission }>;
    };
  }
}

export function App() {
  const version = globalThis.window?.headquarters?.version ?? '0.1.0';
  const [shellPhase, setShellPhase] = useState<DesktopShellPhase>('security-checkpoint');
  const [activeMission, setActiveMission] = useState<ActiveMission | undefined>();
  const [archiveWrite, setArchiveWrite] = useState<ArchiveWritePlaceholder | undefined>();
  const [missionDebrief, setMissionDebrief] = useState<MissionDebrief | undefined>();
  const [archiveSummary, setArchiveSummary] = useState<LocalMissionArchiveSummary | undefined>();
  const [startupStatus, setStartupStatus] = useState<StartupStatus>({
    state: 'loading',
    database: {
      connected: false,
    },
    migrations: {
      applied: [],
      skipped: [],
    },
  });

  useEffect(() => {
    let active = true;

    globalThis.window?.headquarters?.getStartupStatus?.()
      .then((status) => {
        if (active && status) setStartupStatus(status);
      })
      .catch((error: unknown) => {
        if (!active) return;

        setStartupStatus({
          state: 'failed',
          database: {
            connected: false,
          },
          migrations: {
            applied: [],
            skipped: [],
          },
          error: error instanceof Error ? error.message : 'Unable to read startup status',
        });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="hq-shell">
      <header className="shell-header">
        <div>
          <p className="classification">HEADQUARTERS // DESKTOP SHELL</p>
          <h1>Headquarters</h1>
        </div>
        <dl className="app-meta" aria-label="Application status">
          <div>
            <dt>Version</dt>
            <dd>{version}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{formatStartupState(startupStatus.state)}</dd>
          </div>
        </dl>
      </header>

      <div className="shell-body">
        <nav className="shell-nav" aria-label="Primary">
          {getPrimaryNavigationItems('command').map((item) => (
            <span
              key={item.id}
              className={item.active ? 'nav-item active' : 'nav-item'}
              data-nav-id={item.id}
              aria-current={item.active ? 'page' : undefined}
            >
              {item.label}
            </span>
          ))}
        </nav>

        <main className="shell-main">
          <section className="workspace-panel" aria-label="Main content">
            {shellPhase === 'security-checkpoint' ? (
              <SecurityCheckpoint onReportForDuty={() => setShellPhase(reportForDuty(shellPhase).to)} />
            ) : (
              <CommandCenter
                activeMission={activeMission}
                archiveWrite={archiveWrite}
                missionDebrief={missionDebrief}
                archiveSummary={archiveSummary}
                onCreateMission={(mission) => {
                  setActiveMission(mission);
                  setArchiveWrite(createArchiveWritePlaceholder(mission));
                  setMissionDebrief(undefined);
                  setArchiveSummary(undefined);
                }}
                onReturnToBase={() => {
                  setActiveMission((mission) => requestLocalReturnToBase(mission));
                }}
                onSaveDebrief={(debrief) => {
                  setMissionDebrief(debrief);
                  setActiveMission((mission) => markLocalMissionDebriefed(mission));
                }}
                onArchiveMission={() => {
                  setArchiveSummary(createLocalMissionArchiveSummary(activeMission, missionDebrief, archiveWrite));
                  setActiveMission((mission) => markLocalMissionArchived(mission));
                }}
              />
            )}
          </section>

          <aside className="status-panel" aria-label="Status area">
            <p className="section-label">Status</p>
            <h2>HQOS Status</h2>
            <dl className="status-list">
              <div>
                <dt>HQOS</dt>
                <dd>{formatHqosStatus(startupStatus)}</dd>
              </div>
              <div>
                <dt>Database</dt>
                <dd>{formatDatabaseStatus(startupStatus)}</dd>
              </div>
              <div>
                <dt>Migrations</dt>
                <dd>{formatMigrationStatus(startupStatus)}</dd>
              </div>
            </dl>
            {startupStatus.error ? <p className="status-error">{formatStartupError(startupStatus)}</p> : null}
          </aside>
        </main>
      </div>
    </div>
  );
}

interface SecurityCheckpointProps {
  onReportForDuty: () => void;
}

function SecurityCheckpoint({ onReportForDuty }: SecurityCheckpointProps) {
  return (
    <div className="checkpoint-surface">
      <p className="section-label">Security Checkpoint</p>
      <h2>Report for Duty</h2>
      <p className="muted">Headquarters is standing by for command assumption.</p>
      <button className="primary-action" type="button" onClick={onReportForDuty}>
        REPORT FOR DUTY
      </button>
    </div>
  );
}

export function CommandCenterPlaceholder() {
  return <CommandCenter />;
}

interface CommandCenterProps {
  activeMission?: ActiveMission | undefined;
  archiveWrite?: ArchiveWritePlaceholder | undefined;
  missionDebrief?: MissionDebrief | undefined;
  archiveSummary?: LocalMissionArchiveSummary | undefined;
  onCreateMission?: ((mission: ActiveMission) => void) | undefined;
  onReturnToBase?: (() => void) | undefined;
  onSaveDebrief?: ((debrief: MissionDebrief) => void) | undefined;
  onArchiveMission?: (() => void) | undefined;
}

export function CommandCenter({
  activeMission,
  archiveWrite,
  missionDebrief,
  archiveSummary,
  onCreateMission,
  onReturnToBase,
  onSaveDebrief,
  onArchiveMission,
}: CommandCenterProps) {
  return (
    <div className="command-center-layout" data-layout="command-center">
      <section className="command-center-header" aria-label="Command center status">
        <p className="section-label">Main Content</p>
        <h2>Command Center</h2>
        <p className="muted">Command shell placeholder online.</p>
      </section>

      <section className="command-center-primary" aria-label="Mission operations">
        <CreateMissionPanel onCreateMission={onCreateMission} />
        <div className="mission-board-shell" data-object-id="RM-0007">
          <MissionBoard
            missionId={activeMission?.id}
            campaign={activeMission?.campaign ?? 'No active campaign'}
            objective={activeMission?.objective ?? 'Awaiting mission creation'}
            condition={activeMission?.condition ?? 'Standby'}
            commandAuthority={activeMission?.commandAuthority ?? 'Local placeholder'}
            currentState={activeMission?.currentState ?? 'No mission loaded'}
            createdAt={activeMission?.createdAt}
          />
        </div>
      </section>

      <section className="command-center-panels" aria-label="Operational panels">
        <MissionClosingPanel activeMission={activeMission} onReturnToBase={onReturnToBase} />
        <DebriefPanel activeMission={activeMission} missionDebrief={missionDebrief} onSaveDebrief={onSaveDebrief} />
        <MissionArchiveSummaryPanel
          activeMission={activeMission}
          archiveSummary={archiveSummary}
          missionDebrief={missionDebrief}
          onArchiveMission={onArchiveMission}
        />
        <ArchiveWritePanel archiveWrite={archiveWrite} />
        <CommandChair />
      </section>
    </div>
  );
}

interface CreateMissionPanelProps {
  onCreateMission?: ((mission: ActiveMission) => void | Promise<void>) | undefined;
}

function CreateMissionPanel({ onCreateMission }: CreateMissionPanelProps) {
  const [codename, setCodename] = useState('');
  const [objective, setObjective] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const mission = await createDesktopMission({ codename, objective });

    if (!mission) return;

    await onCreateMission?.(mission);
    setCodename('');
    setObjective('');
  }

  return (
    <form className="create-mission-panel" aria-label="Create mission" onSubmit={handleSubmit}>
      <div>
        <p className="section-label">Mission Creation</p>
        <h3>Create Mission</h3>
      </div>
      <label>
        <span>Mission Codename</span>
        <input value={codename} onChange={(event) => setCodename(event.target.value)} />
      </label>
      <label>
        <span>Mission Objective</span>
        <input value={objective} onChange={(event) => setObjective(event.target.value)} />
      </label>
      <button className="secondary-action" type="submit">
        Create Mission
      </button>
    </form>
  );
}

export async function createDesktopMission(draft: MissionDraft): Promise<ActiveMission | undefined> {
  const codename = draft.codename.trim();
  const objective = draft.objective.trim();

  if (!codename || !objective) {
    return undefined;
  }

  const createMission = globalThis.window?.headquarters?.createMission;

  if (createMission === undefined) {
    return createLocalMission({ codename, objective });
  }

  const result = await createMission({ codename, objective });
  return mapMissionRecordToActiveMission(result.mission);
}

interface MissionClosingPanelProps {
  activeMission?: ActiveMission | undefined;
  onReturnToBase?: (() => void) | undefined;
}

function MissionClosingPanel({ activeMission, onReturnToBase }: MissionClosingPanelProps) {
  return (
    <section className="mission-closing-panel" aria-label="Mission closing state">
      <div>
        <p className="section-label">Return To Base</p>
        <h3>Mission Closing</h3>
      </div>
      <dl>
        <dt>Status</dt>
        <dd>{formatMissionClosingState(activeMission)}</dd>
      </dl>
      <button className="secondary-action" type="button" onClick={onReturnToBase} disabled={!activeMission}>
        Return To Base
      </button>
    </section>
  );
}

interface DebriefPanelProps {
  activeMission?: ActiveMission | undefined;
  missionDebrief?: MissionDebrief | undefined;
  onSaveDebrief?: ((debrief: MissionDebrief) => void) | undefined;
}

function DebriefPanel({ activeMission, missionDebrief, onSaveDebrief }: DebriefPanelProps) {
  const [behaviorSummary, setBehaviorSummary] = useState('');
  const [disciplineNotes, setDisciplineNotes] = useState('');
  const [lesson, setLesson] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const debrief = createLocalDebrief(activeMission, {
      behaviorSummary,
      disciplineNotes,
      lesson,
    });

    if (!debrief) return;

    onSaveDebrief?.(debrief);
    setBehaviorSummary('');
    setDisciplineNotes('');
    setLesson('');
  }

  return (
    <form className="debrief-panel" aria-label="Mission debrief" onSubmit={handleSubmit}>
      <div>
        <p className="section-label">Debrief</p>
        <h3>Mission Debrief</h3>
      </div>
      <label>
        <span>Behavior Summary</span>
        <input value={behaviorSummary} onChange={(event) => setBehaviorSummary(event.target.value)} />
      </label>
      <label>
        <span>Discipline Notes</span>
        <input value={disciplineNotes} onChange={(event) => setDisciplineNotes(event.target.value)} />
      </label>
      <label>
        <span>Lesson</span>
        <input value={lesson} onChange={(event) => setLesson(event.target.value)} />
      </label>
      <button className="secondary-action" type="submit" disabled={!activeMission}>
        Save Debrief
      </button>
      <p className="muted">{formatDebriefStatus(missionDebrief)}</p>
    </form>
  );
}

interface MissionArchiveSummaryPanelProps {
  activeMission?: ActiveMission | undefined;
  archiveSummary?: LocalMissionArchiveSummary | undefined;
  missionDebrief?: MissionDebrief | undefined;
  onArchiveMission?: (() => void) | undefined;
}

function MissionArchiveSummaryPanel({
  activeMission,
  archiveSummary,
  missionDebrief,
  onArchiveMission,
}: MissionArchiveSummaryPanelProps) {
  return (
    <section className="mission-archive-summary-panel" aria-label="Archived mission summary">
      <div>
        <p className="section-label">Archive</p>
        <h3>Archived Mission Summary</h3>
      </div>
      <dl>
        <dt>Status</dt>
        <dd>{formatArchiveSummaryStatus(archiveSummary)}</dd>
        <dt>Mission</dt>
        <dd>{archiveSummary?.codename ?? 'Awaiting archived mission'}</dd>
        <dt>Events</dt>
        <dd>{archiveSummary?.eventCount ?? 0}</dd>
      </dl>
      <button className="secondary-action" type="button" onClick={onArchiveMission} disabled={!activeMission || !missionDebrief}>
        Archive Mission
      </button>
    </section>
  );
}

interface ArchiveWritePanelProps {
  archiveWrite?: ArchiveWritePlaceholder | undefined;
}

function ArchiveWritePanel({ archiveWrite }: ArchiveWritePanelProps) {
  return (
    <section className="archive-write-panel" aria-label="Archive write placeholder">
      <div>
        <p className="section-label">Archive Write</p>
        <h3>Archive Placeholder</h3>
      </div>
      <dl>
        <dt>Status</dt>
        <dd>{formatArchiveWriteStatus(archiveWrite)}</dd>
        <dt>Artifact</dt>
        <dd>{archiveWrite?.title ?? 'Awaiting mission creation'}</dd>
      </dl>
    </section>
  );
}

export function reportForDuty(currentPhase: DesktopShellPhase): ReportForDutyTransition {
  if (currentPhase === 'security-checkpoint') {
    return {
      from: currentPhase,
      to: 'command-center',
      changed: true,
    };
  }

  return {
    from: currentPhase,
    to: currentPhase,
    changed: false,
  };
}

export function getPrimaryNavigationItems(activeArea: NavigationAreaId): PrimaryNavigationItem[] {
  return primaryNavigation.map((item) => ({
    ...item,
    active: item.id === activeArea,
  }));
}

export function createLocalMission(
  draft: MissionDraft,
  options: { id?: string; createdAt?: string } = {},
): ActiveMission | undefined {
  const codename = draft.codename.trim();
  const objective = draft.objective.trim();

  if (!codename || !objective) {
    return undefined;
  }

  return {
    id: options.id ?? crypto.randomUUID(),
    campaign: codename,
    objective,
    condition: 'Briefing',
    commandAuthority: 'Professional command',
    currentState: 'briefing',
    createdAt: options.createdAt ?? new Date().toISOString(),
  };
}

export function mapMissionRecordToActiveMission(mission: Mission): ActiveMission {
  return {
    id: mission.id,
    campaign: mission.codename,
    objective: mission.objective ?? 'Awaiting mission objective',
    condition: formatMissionStateForDisplay(mission.state),
    commandAuthority: 'Professional command',
    currentState: mission.state,
    createdAt: mission.createdAt,
  };
}

export function formatMissionStateForDisplay(state: Mission['state']): string {
  return state
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function requestLocalReturnToBase(mission: ActiveMission | undefined): ActiveMission | undefined {
  if (mission === undefined) return undefined;

  return {
    ...mission,
    condition: 'Closing',
    currentState: 'return_to_base',
  };
}

export function markLocalMissionDebriefed(mission: ActiveMission | undefined): ActiveMission | undefined {
  if (mission === undefined) return undefined;

  return {
    ...mission,
    condition: 'Debrief',
    currentState: 'debrief',
  };
}

export function markLocalMissionArchived(mission: ActiveMission | undefined): ActiveMission | undefined {
  if (mission === undefined) return undefined;

  return {
    ...mission,
    condition: 'Archived',
    currentState: 'archived',
  };
}

export function createLocalDebrief(
  mission: ActiveMission | undefined,
  draft: MissionDebriefDraft,
  options: { id?: string; createdAt?: string } = {},
): MissionDebrief | undefined {
  const behaviorSummary = draft.behaviorSummary.trim();
  const disciplineNotes = draft.disciplineNotes.trim();
  const lesson = draft.lesson.trim();

  if (mission === undefined || !behaviorSummary || !disciplineNotes || !lesson) {
    return undefined;
  }

  return {
    id: options.id ?? crypto.randomUUID(),
    missionId: mission.id,
    behaviorSummary,
    disciplineNotes,
    lesson,
    createdAt: options.createdAt ?? new Date().toISOString(),
  };
}

export function createLocalMissionArchiveSummary(
  mission: ActiveMission | undefined,
  debrief: MissionDebrief | undefined,
  archiveWrite: ArchiveWritePlaceholder | undefined,
  options: { archivedAt?: string } = {},
): LocalMissionArchiveSummary | undefined {
  if (mission === undefined || debrief === undefined) {
    return undefined;
  }

  return {
    missionId: mission.id,
    codename: mission.campaign,
    archivedAt: options.archivedAt ?? new Date().toISOString(),
    eventCount: archiveWrite ? 2 : 1,
  };
}

export function createArchiveWritePlaceholder(
  mission: ActiveMission,
  options: { id?: string; createdAt?: string } = {},
): ArchiveWritePlaceholder {
  return {
    id: options.id ?? crypto.randomUUID(),
    missionId: mission.id,
    status: 'queued',
    title: `${mission.campaign} mission archive placeholder`,
    createdAt: options.createdAt ?? new Date().toISOString(),
  };
}

export function formatArchiveWriteStatus(archiveWrite?: ArchiveWritePlaceholder): string {
  if (archiveWrite?.status === 'queued') return 'Queued placeholder';
  return 'Not started';
}

export function formatMissionClosingState(mission?: ActiveMission): string {
  if (mission?.currentState === 'return_to_base') return 'Returning to base';
  if (mission) return 'Active mission open';
  return 'No mission loaded';
}

export function formatDebriefStatus(debrief?: MissionDebrief): string {
  if (debrief) return 'Debrief saved';
  return 'Awaiting debrief';
}

export function formatArchiveSummaryStatus(summary?: LocalMissionArchiveSummary): string {
  if (summary) return 'Archived summary ready';
  return 'Awaiting archive';
}

function formatStartupState(state: StartupState): string {
  if (state === 'ready') return 'Ready';
  if (state === 'failed') return 'Startup issue';
  return 'Starting';
}

export function formatHqosStatus(status: StartupStatus): string {
  if (status.state === 'loading') return 'Starting';
  if (status.state === 'failed') return 'Limited';
  return 'Ready';
}

export function formatDatabaseStatus(status: StartupStatus): string {
  if (status.state === 'loading') return 'Checking';
  if (!status.database.connected) return 'Offline';
  return 'Connected';
}

export function formatMigrationStatus(status: StartupStatus): string {
  if (status.state === 'loading') return 'Pending';
  if (status.state === 'failed') return 'Not applied';

  const changed = status.migrations.applied.length;
  const current = status.migrations.skipped.length;

  if (changed === 0 && current > 0) return 'Current';
  if (changed > 0 && current > 0) return `${changed} applied, ${current} current`;
  return `${changed} applied`;
}

export function formatStartupError(status: StartupStatus): string {
  if (!status.error) return '';
  return status.error;
}
