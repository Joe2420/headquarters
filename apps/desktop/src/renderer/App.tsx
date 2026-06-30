import { type FormEvent, useEffect, useState } from 'react';
import { MissionBoard } from '@headquarters/ui';
import type { Mission, MissionState } from '@headquarters/shared';
import type { MissionTimelineExportEntryDTO } from '@headquarters/hqos';
import type { DoctrineRecord } from '@headquarters/doctrine';
import {
  archiveJournalEntry,
  buildJournalTimeline,
  createDailyReflection,
  createGrowthEvent,
  createJournalEntry,
  createTradeReview,
  searchJournalEntries,
  type ArchivedJournalEntry,
  type DailyReflection,
  type GrowthEvent,
  type JournalEntry,
  type JournalTimeline,
  type TradeReview,
} from '@headquarters/journal';
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

export interface DoctrinePromotionDraft {
  candidateId: string;
  title: string;
  summary: string;
  sourceId: string;
  archiveId: string;
  excerpt: string;
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

export interface MissionAuthorizationDraft {
  operatorJustification: string;
  invalidation: string;
}

export interface MissionAuthorizationStatus {
  missionId: string;
  decision: 'approved' | 'denied';
  reason: string;
}

export type MissionLifecycleStepStatus = 'completed' | 'current' | 'pending';

export interface MissionLifecycleStep {
  state: MissionState;
  label: string;
  status: MissionLifecycleStepStatus;
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

export type NavigationAreaId = 'command' | 'missions' | 'journal' | 'doctrine' | 'archive' | 'settings';
export type HeadquartersRoomId = NavigationAreaId;

export interface PrimaryNavigationItem {
  id: NavigationAreaId;
  label: string;
  active: boolean;
}

const primaryNavigation: Array<Omit<PrimaryNavigationItem, 'active'>> = [
  { id: 'command', label: 'Command' },
  { id: 'missions', label: 'Missions' },
  { id: 'journal', label: 'Journal' },
  { id: 'doctrine', label: 'Doctrine' },
  { id: 'archive', label: 'Archive' },
  { id: 'settings', label: 'Settings' },
];

export const missionLifecyclePath: readonly MissionState[] = [
  'idle',
  'briefing',
  'ready',
  'observation',
  'authorization',
  'deployed',
  'return_to_base',
  'debrief',
  'archived',
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
      listDoctrineRecords?: () => Promise<{ records: DoctrineRecord[] }>;
      promoteDoctrineCandidate?: (input: DoctrinePromotionDraft) => Promise<{ record: DoctrineRecord }>;
      createMission?: (input: MissionDraft) => Promise<{ mission: Mission }>;
      startBriefing?: (input: { missionId: string; reason?: string }) => Promise<{ mission: Mission }>;
      completeBriefing?: (input: { missionId: string; reason?: string }) => Promise<{ mission: Mission }>;
      startObservation?: (input: { missionId: string; reason?: string }) => Promise<{ mission: Mission }>;
      completeObservation?: (input: { missionId: string; reason?: string }) => Promise<{ mission: Mission }>;
      requestAuthorization?: (input: MissionAuthorizationDraft & { missionId: string }) => Promise<MissionAuthorizationStatus & { mission: Mission }>;
      declareDeployment?: (input: { missionId: string; reason?: string }) => Promise<{ mission: Mission }>;
      requestReturnToBase?: (input: { missionId: string; reason?: string }) => Promise<{ mission: Mission }>;
      saveDebrief?: (input: MissionDebriefDraft & { missionId: string }) => Promise<{ mission: Mission; debrief: MissionDebrief }>;
      archiveAfterDebrief?: (input: { missionId: string; reason?: string }) => Promise<{ mission: Mission }>;
    };
  }
}

export function App() {
  const version = globalThis.window?.headquarters?.version ?? '0.1.0';
  const [shellPhase, setShellPhase] = useState<DesktopShellPhase>('security-checkpoint');
  const [activeRoom, setActiveRoom] = useState<HeadquartersRoomId>('command');
  const [activeMission, setActiveMission] = useState<ActiveMission | undefined>();
  const [archiveWrite, setArchiveWrite] = useState<ArchiveWritePlaceholder | undefined>();
  const [authorizationStatus, setAuthorizationStatus] = useState<MissionAuthorizationStatus | undefined>();
  const [missionDebrief, setMissionDebrief] = useState<MissionDebrief | undefined>();
  const [archiveSummary, setArchiveSummary] = useState<LocalMissionArchiveSummary | undefined>();
  const [archivedMissionSummaries, setArchivedMissionSummaries] = useState<LocalMissionArchiveSummary[]>([]);
  const [missionHistory, setMissionHistory] = useState<ActiveMission[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [dailyReflections, setDailyReflections] = useState<DailyReflection[]>([]);
  const [tradeReviews, setTradeReviews] = useState<TradeReview[]>([]);
  const [growthEvents, setGrowthEvents] = useState<GrowthEvent[]>([]);
  const [archivedJournalEntries, setArchivedJournalEntries] = useState<ArchivedJournalEntry[]>([]);
  const [doctrineRecords, setDoctrineRecords] = useState<DoctrineRecord[]>([]);
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

  useEffect(() => {
    let active = true;

    globalThis.window?.headquarters?.listDoctrineRecords?.()
      .then((result) => {
        if (active && result) setDoctrineRecords(result.records);
      })
      .catch(() => {
        if (active) setDoctrineRecords([]);
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
          {getPrimaryNavigationItems(activeRoom).map((item) => (
            <button
              key={item.id}
              className={item.active ? 'nav-item active' : 'nav-item'}
              data-nav-id={item.id}
              aria-current={item.active ? 'page' : undefined}
              type="button"
              onClick={() => setActiveRoom(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main className="shell-main">
          <section className="workspace-panel" aria-label="Main content">
            {shellPhase === 'security-checkpoint' ? (
              <SecurityCheckpoint onReportForDuty={() => setShellPhase(reportForDuty(shellPhase).to)} />
            ) : (
              renderHeadquartersRoom(activeRoom, {
                activeMission,
                archiveWrite,
                authorizationStatus,
                missionDebrief,
                archiveSummary,
                archivedMissionSummaries,
                missionHistory,
                journalEntries,
                dailyReflections,
                tradeReviews,
                growthEvents,
                archivedJournalEntries,
                doctrineRecords,
                onCreateMission: async (mission) => {
                  setActiveMission(mission);
                  setMissionHistory((history) => upsertMissionHistory(history, mission));
                  setArchiveWrite(createArchiveWritePlaceholder(mission));
                  setAuthorizationStatus(undefined);
                  setMissionDebrief(undefined);
                  setArchiveSummary(undefined);
                },
                onMissionChanged: (mission) => {
                  setActiveMission(mission);
                  setMissionHistory((history) => upsertMissionHistory(history, mission));
                },
                onRequestAuthorization: (authorization) => {
                  setAuthorizationStatus(authorization);
                },
                onSaveDebrief: (debrief) => {
                  setMissionDebrief(debrief);
                },
                onArchiveMission: (summary) => {
                  setArchiveSummary(summary);
                  if (summary) setArchivedMissionSummaries((summaries) => [...summaries, summary]);
                },
                onCreateJournalEntry: (entry) => setJournalEntries((entries) => [...entries, entry]),
                onCreateDailyReflection: (reflection) => setDailyReflections((entries) => [...entries, reflection]),
                onCreateTradeReview: (review) => setTradeReviews((entries) => [...entries, review]),
                onCreateGrowthEvent: (event) => setGrowthEvents((entries) => [...entries, event]),
                onArchiveJournalEntry: (record) => setArchivedJournalEntries((entries) => [...entries, record]),
                onPromoteDoctrineCandidate: (record) => setDoctrineRecords((records) => [...records, record]),
              })
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

interface HeadquartersRoomContext {
  activeMission?: ActiveMission | undefined;
  archiveWrite?: ArchiveWritePlaceholder | undefined;
  authorizationStatus?: MissionAuthorizationStatus | undefined;
  missionDebrief?: MissionDebrief | undefined;
  archiveSummary?: LocalMissionArchiveSummary | undefined;
  archivedMissionSummaries: LocalMissionArchiveSummary[];
  missionHistory: ActiveMission[];
  journalEntries: JournalEntry[];
  dailyReflections: DailyReflection[];
  tradeReviews: TradeReview[];
  growthEvents: GrowthEvent[];
  archivedJournalEntries: ArchivedJournalEntry[];
  doctrineRecords: DoctrineRecord[];
  onCreateMission: (mission: ActiveMission) => void | Promise<void>;
  onMissionChanged: (mission: ActiveMission) => void;
  onRequestAuthorization: (authorization: MissionAuthorizationStatus) => void;
  onSaveDebrief: (debrief: MissionDebrief) => void;
  onArchiveMission: (summary: LocalMissionArchiveSummary | undefined) => void;
  onCreateJournalEntry: (entry: JournalEntry) => void;
  onCreateDailyReflection: (reflection: DailyReflection) => void;
  onCreateTradeReview: (review: TradeReview) => void;
  onCreateGrowthEvent: (event: GrowthEvent) => void;
  onArchiveJournalEntry: (record: ArchivedJournalEntry) => void;
  onPromoteDoctrineCandidate: (record: DoctrineRecord) => void;
}

function renderHeadquartersRoom(room: HeadquartersRoomId, context: HeadquartersRoomContext) {
  if (room === 'missions') {
    return (
      <MissionRoom
        activeMission={context.activeMission}
        archiveWrite={context.archiveWrite}
        authorizationStatus={context.authorizationStatus}
        missionDebrief={context.missionDebrief}
        archiveSummary={context.archiveSummary}
        missionHistory={context.missionHistory}
        onCreateMission={context.onCreateMission}
        onMissionChanged={context.onMissionChanged}
        onRequestAuthorization={context.onRequestAuthorization}
        onSaveDebrief={context.onSaveDebrief}
        onArchiveMission={context.onArchiveMission}
      />
    );
  }

  if (room === 'journal') {
    return (
      <JournalRoom
        journalEntries={context.journalEntries}
        dailyReflections={context.dailyReflections}
        tradeReviews={context.tradeReviews}
        growthEvents={context.growthEvents}
        archivedJournalEntries={context.archivedJournalEntries}
        onCreateJournalEntry={context.onCreateJournalEntry}
        onCreateDailyReflection={context.onCreateDailyReflection}
        onCreateTradeReview={context.onCreateTradeReview}
        onCreateGrowthEvent={context.onCreateGrowthEvent}
        onArchiveJournalEntry={context.onArchiveJournalEntry}
      />
    );
  }

  if (room === 'doctrine') {
    return (
      <DoctrineRoom
        doctrineRecords={context.doctrineRecords}
        onPromoteDoctrineCandidate={context.onPromoteDoctrineCandidate}
      />
    );
  }

  if (room === 'archive') {
    return (
      <ArchiveRoom
        archivedMissionSummaries={context.archivedMissionSummaries}
        archivedJournalEntries={context.archivedJournalEntries}
      />
    );
  }

  if (room === 'settings') {
    return <SettingsRoom />;
  }

  return (
    <CommandOverview
      activeMission={context.activeMission}
      startupSubsystemCount={4}
      missionHistory={context.missionHistory}
    />
  );
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

interface CommandOverviewProps {
  activeMission?: ActiveMission | undefined;
  startupSubsystemCount: number;
  missionHistory: ActiveMission[];
}

function CommandOverview({ activeMission, startupSubsystemCount, missionHistory }: CommandOverviewProps) {
  return (
    <div className="command-center-layout" data-layout="command-center">
      <section className="command-center-header" aria-label="Command center overview">
        <p className="section-label">Command Center</p>
        <h2>Headquarters Overview</h2>
        <p className="muted">Operational overview, active mission summary, HQOS status, and navigation hub.</p>
      </section>
      <section className="command-center-panels" aria-label="Command center dashboard">
        <MissionDetailsPanel activeMission={activeMission} />
        <MissionLifecyclePanel activeMission={activeMission} />
        <MissionHistoryPanel missionHistory={missionHistory} />
        <section className="hqos-dashboard-panel" aria-label="HQOS dashboard">
          <p className="section-label">HQOS</p>
          <h3>Subsystem Dashboard</h3>
          <p className="muted">{startupSubsystemCount} completed subsystem areas are available from navigation.</p>
        </section>
        <CommandChair />
      </section>
    </div>
  );
}

interface MissionRoomProps extends CommandCenterProps {
  onMissionChanged?: ((mission: ActiveMission) => void) | undefined;
}

function MissionRoom(props: MissionRoomProps) {
  return (
    <div className="room-layout" data-room-id="mission-room">
      <section className="command-center-header" aria-label="Mission room status">
        <p className="section-label">Mission Room</p>
        <h2>Mission Operations</h2>
        <p className="muted">Mission Board, lifecycle, authorization, debrief, timeline, and history.</p>
      </section>
      <CommandCenter {...props} />
    </div>
  );
}

interface CommandCenterProps {
  activeMission?: ActiveMission | undefined;
  archiveWrite?: ArchiveWritePlaceholder | undefined;
  authorizationStatus?: MissionAuthorizationStatus | undefined;
  missionDebrief?: MissionDebrief | undefined;
  archiveSummary?: LocalMissionArchiveSummary | undefined;
  archivedMissionSummaries?: LocalMissionArchiveSummary[] | undefined;
  missionHistory?: ActiveMission[] | undefined;
  onCreateMission?: ((mission: ActiveMission) => void) | undefined;
  onMissionChanged?: ((mission: ActiveMission) => void) | undefined;
  onRequestAuthorization?: ((authorization: MissionAuthorizationStatus) => void) | undefined;
  onSaveDebrief?: ((debrief: MissionDebrief) => void) | undefined;
  onArchiveMission?: ((summary: LocalMissionArchiveSummary | undefined) => void) | undefined;
}

export function CommandCenter({
  activeMission,
  archiveWrite,
  authorizationStatus,
  missionDebrief,
  archiveSummary,
  archivedMissionSummaries,
  missionHistory,
  onCreateMission,
  onMissionChanged,
  onRequestAuthorization,
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
        <MissionLifecyclePanel activeMission={activeMission} />
        <MissionNextActionPanel
          activeMission={activeMission}
          authorizationStatus={authorizationStatus}
          missionDebrief={missionDebrief}
          onMissionChanged={onMissionChanged}
          onRequestAuthorization={onRequestAuthorization}
          onSaveDebrief={onSaveDebrief}
          onArchiveMission={onArchiveMission}
        />
        <MissionDetailsPanel activeMission={activeMission} />
        <MissionAuthorizationPanel
          activeMission={activeMission}
          authorizationStatus={authorizationStatus}
        />
        <MissionClosingPanel activeMission={activeMission} />
        <DebriefPanel activeMission={activeMission} missionDebrief={missionDebrief} />
        <MissionArchiveSummaryPanel
          activeMission={activeMission}
          archiveSummary={archiveSummary}
          missionDebrief={missionDebrief}
        />
        <MissionArchiveViewerPanel archiveSummaries={archivedMissionSummaries} />
        <MissionTimelineViewerPanel
          activeMission={activeMission}
          authorizationStatus={authorizationStatus}
          missionDebrief={missionDebrief}
          archiveSummary={archiveSummary}
        />
        <MissionHistoryPanel missionHistory={missionHistory} />
        <ArchiveWritePanel archiveWrite={archiveWrite} />
        <CommandChair />
      </section>
    </div>
  );
}

interface MissionHistoryPanelProps {
  missionHistory?: ActiveMission[] | undefined;
}

function MissionHistoryPanel({ missionHistory }: MissionHistoryPanelProps) {
  const missions = listMissionHistory(missionHistory);

  return (
    <section className="mission-history-panel" aria-label="Mission history">
      <div>
        <p className="section-label">History</p>
        <h3>Mission History</h3>
      </div>
      <p className="muted">{formatMissionHistoryStatus(missions)}</p>
      <ol className="mission-history-list">
        {missions.map((mission) => (
          <li key={mission.id}>
            <span>{mission.campaign}</span>
            <strong>{formatMissionDetailState(mission)}</strong>
            <time dateTime={mission.createdAt}>{mission.createdAt}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}

interface MissionTimelineViewerPanelProps {
  activeMission?: ActiveMission | undefined;
  authorizationStatus?: MissionAuthorizationStatus | undefined;
  missionDebrief?: MissionDebrief | undefined;
  archiveSummary?: LocalMissionArchiveSummary | undefined;
}

function MissionTimelineViewerPanel({
  activeMission,
  authorizationStatus,
  missionDebrief,
  archiveSummary,
}: MissionTimelineViewerPanelProps) {
  const entries = buildDesktopMissionTimelineEntries({
    activeMission,
    authorizationStatus,
    missionDebrief,
    archiveSummary,
  });

  return (
    <section className="mission-timeline-viewer-panel" aria-label="Mission timeline viewer">
      <div>
        <p className="section-label">Timeline</p>
        <h3>Timeline Viewer</h3>
      </div>
      <p className="muted">{formatTimelineViewerStatus(entries)}</p>
      <ol className="mission-timeline-list">
        {entries.map((entry) => (
          <li key={entry.eventId}>
            <span>{formatMissionTimelineTransition(entry)}</span>
            <time dateTime={entry.occurredAt}>{entry.occurredAt}</time>
            {entry.reason ? <strong>{entry.reason}</strong> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

interface MissionArchiveViewerPanelProps {
  archiveSummaries?: LocalMissionArchiveSummary[] | undefined;
}

function MissionArchiveViewerPanel({ archiveSummaries }: MissionArchiveViewerPanelProps) {
  const summaries = listArchivedMissionSummaries(archiveSummaries);

  return (
    <section className="mission-archive-viewer-panel" aria-label="Mission archive viewer">
      <div>
        <p className="section-label">Archive Viewer</p>
        <h3>Mission Archive Viewer</h3>
      </div>
      <p className="muted">{formatArchiveViewerStatus(summaries)}</p>
      <ol className="mission-archive-list">
        {summaries.map((summary) => (
          <li key={`${summary.missionId}-${summary.archivedAt}`}>
            <span>{summary.codename}</span>
            <strong>{summary.eventCount} events</strong>
            <time dateTime={summary.archivedAt}>{summary.archivedAt}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}

interface MissionDetailsPanelProps {
  activeMission?: ActiveMission | undefined;
}

function MissionDetailsPanel({ activeMission }: MissionDetailsPanelProps) {
  return (
    <section className="mission-details-panel" aria-label="Mission details">
      <div>
        <p className="section-label">Details</p>
        <h3>Mission Details</h3>
      </div>
      <dl>
        <dt>Mission ID</dt>
        <dd>{formatMissionDetailValue(activeMission?.id)}</dd>
        <dt>Codename</dt>
        <dd>{formatMissionDetailValue(activeMission?.campaign)}</dd>
        <dt>Objective</dt>
        <dd>{formatMissionDetailValue(activeMission?.objective)}</dd>
        <dt>Current State</dt>
        <dd>{formatMissionDetailState(activeMission)}</dd>
        <dt>Created</dt>
        <dd>{formatMissionDetailValue(activeMission?.createdAt)}</dd>
      </dl>
    </section>
  );
}

interface MissionLifecyclePanelProps {
  activeMission?: ActiveMission | undefined;
}

function MissionLifecyclePanel({ activeMission }: MissionLifecyclePanelProps) {
  const steps = buildMissionLifecycleSteps(activeMission);

  return (
    <section className="mission-lifecycle-panel" aria-label="Mission lifecycle">
      <div>
        <p className="section-label">Lifecycle</p>
        <h3>Mission Lifecycle</h3>
      </div>
      <ol className="mission-lifecycle-list">
        {steps.map((step) => (
          <li key={step.state} data-step-status={step.status}>
            <span>{step.label}</span>
            <strong>{formatMissionLifecycleStepStatus(step.status)}</strong>
          </li>
        ))}
      </ol>
      <p className="muted">{formatMissionLifecycleSummary(activeMission)}</p>
    </section>
  );
}

interface MissionNextActionPanelProps {
  activeMission?: ActiveMission | undefined;
  authorizationStatus?: MissionAuthorizationStatus | undefined;
  missionDebrief?: MissionDebrief | undefined;
  onMissionChanged?: ((mission: ActiveMission) => void) | undefined;
  onRequestAuthorization?: ((authorization: MissionAuthorizationStatus) => void) | undefined;
  onSaveDebrief?: ((debrief: MissionDebrief) => void) | undefined;
  onArchiveMission?: ((summary: LocalMissionArchiveSummary | undefined) => void) | undefined;
}

function MissionNextActionPanel({
  activeMission,
  authorizationStatus,
  missionDebrief,
  onMissionChanged,
  onRequestAuthorization,
  onSaveDebrief,
  onArchiveMission,
}: MissionNextActionPanelProps) {
  const [operatorJustification, setOperatorJustification] = useState('');
  const [invalidation, setInvalidation] = useState('');
  const [behaviorSummary, setBehaviorSummary] = useState('');
  const [disciplineNotes, setDisciplineNotes] = useState('');
  const [lesson, setLesson] = useState('');

  async function handleNextAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeMission === undefined) return;

    const currentState = parseMissionState(activeMission.currentState);

    if (currentState === 'idle') {
      onMissionChanged?.(await startDesktopBriefing(activeMission));
      return;
    }

    if (currentState === 'briefing') {
      onMissionChanged?.(await completeDesktopBriefing(activeMission));
      return;
    }

    if (currentState === 'ready') {
      onMissionChanged?.(await startDesktopObservation(activeMission));
      return;
    }

    if (currentState === 'observation') {
      onMissionChanged?.(await completeDesktopObservation(activeMission));
      return;
    }

    if (currentState === 'authorization') {
      const authorization = await requestDesktopAuthorization(activeMission, {
        operatorJustification,
        invalidation,
      });

      if (authorization === undefined) return;

      onRequestAuthorization?.(authorization);
      setOperatorJustification('');
      setInvalidation('');

      if (authorization.decision === 'approved') {
        onMissionChanged?.(await declareDesktopDeployment(activeMission));
      }
      return;
    }

    if (currentState === 'deployed') {
      onMissionChanged?.(await requestDesktopReturnToBase(activeMission));
      return;
    }

    if (currentState === 'return_to_base') {
      const result = await saveDesktopDebrief(activeMission, {
        behaviorSummary,
        disciplineNotes,
        lesson,
      });

      if (result === undefined) return;

      onSaveDebrief?.(result.debrief);
      onMissionChanged?.(result.mission);
      setBehaviorSummary('');
      setDisciplineNotes('');
      setLesson('');
      return;
    }

    if (currentState === 'debrief') {
      const archiveSummary = createLocalMissionArchiveSummary(activeMission, missionDebrief, undefined);
      const mission = await archiveDesktopMission(activeMission);

      onArchiveMission?.(archiveSummary);
      onMissionChanged?.(mission);
    }
  }

  const nextAction = getMissionNextAction(activeMission);
  const currentState = parseMissionState(activeMission?.currentState);

  return (
    <form className="mission-next-action-panel" aria-label="Mission next action" onSubmit={handleNextAction}>
      <div>
        <p className="section-label">Next Action</p>
        <h3>{nextAction.label}</h3>
      </div>
      <p className="muted">{nextAction.description}</p>
      {currentState === 'authorization' ? (
        <>
          <label>
            <span>Operator Justification</span>
            <input value={operatorJustification} onChange={(event) => setOperatorJustification(event.target.value)} />
          </label>
          <label>
            <span>Invalidation</span>
            <input value={invalidation} onChange={(event) => setInvalidation(event.target.value)} />
          </label>
        </>
      ) : null}
      {currentState === 'return_to_base' ? (
        <>
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
        </>
      ) : null}
      <button className="secondary-action" type="submit" disabled={nextAction.disabled}>
        {nextAction.buttonLabel}
      </button>
      <p className="muted">{formatAuthorizationStatus(authorizationStatus)}</p>
    </form>
  );
}

interface MissionAuthorizationPanelProps {
  activeMission?: ActiveMission | undefined;
  authorizationStatus?: MissionAuthorizationStatus | undefined;
}

function MissionAuthorizationPanel({
  activeMission,
  authorizationStatus,
}: MissionAuthorizationPanelProps) {
  return (
    <section className="mission-authorization-panel" aria-label="Mission authorization">
      <div>
        <p className="section-label">Authorization</p>
        <h3>Mission Authorization</h3>
      </div>
      <p className="muted">{formatMissionAuthorizationAvailability(activeMission)}</p>
      <p className="muted">{formatAuthorizationStatus(authorizationStatus)}</p>
    </section>
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

export async function startDesktopBriefing(mission: ActiveMission): Promise<ActiveMission> {
  const bridge = globalThis.window?.headquarters?.startBriefing;
  if (bridge === undefined) return transitionLocalMission(mission, 'briefing');

  const result = await bridge({ missionId: mission.id, reason: 'Mission briefing started from desktop.' });
  return mapMissionRecordToActiveMission(result.mission);
}

export async function completeDesktopBriefing(mission: ActiveMission): Promise<ActiveMission> {
  const bridge = globalThis.window?.headquarters?.completeBriefing;
  if (bridge === undefined) return transitionLocalMission(mission, 'ready');

  const result = await bridge({ missionId: mission.id, reason: 'Mission briefing completed from desktop.' });
  return mapMissionRecordToActiveMission(result.mission);
}

export async function startDesktopObservation(mission: ActiveMission): Promise<ActiveMission> {
  const bridge = globalThis.window?.headquarters?.startObservation;
  if (bridge === undefined) return transitionLocalMission(mission, 'observation');

  const result = await bridge({ missionId: mission.id, reason: 'Observation started from desktop.' });
  return mapMissionRecordToActiveMission(result.mission);
}

export async function completeDesktopObservation(mission: ActiveMission): Promise<ActiveMission> {
  const bridge = globalThis.window?.headquarters?.completeObservation;
  if (bridge === undefined) return transitionLocalMission(mission, 'authorization');

  const result = await bridge({ missionId: mission.id, reason: 'Observation completed from desktop.' });
  return mapMissionRecordToActiveMission(result.mission);
}

export async function requestDesktopAuthorization(
  mission: ActiveMission,
  draft: MissionAuthorizationDraft,
): Promise<MissionAuthorizationStatus | undefined> {
  const bridge = globalThis.window?.headquarters?.requestAuthorization;
  if (bridge === undefined) return evaluateLocalMissionAuthorization(mission, draft);

  const result = await bridge({
    missionId: mission.id,
    operatorJustification: draft.operatorJustification,
    invalidation: draft.invalidation,
  });

  return {
    missionId: mission.id,
    decision: result.decision,
    reason: result.reason,
  };
}

export async function declareDesktopDeployment(mission: ActiveMission): Promise<ActiveMission> {
  const bridge = globalThis.window?.headquarters?.declareDeployment;
  if (bridge === undefined) return transitionLocalMission(mission, 'deployed');

  const result = await bridge({ missionId: mission.id, reason: 'Manual deployment declared from desktop.' });
  return mapMissionRecordToActiveMission(result.mission);
}

export async function requestDesktopReturnToBase(mission: ActiveMission): Promise<ActiveMission> {
  const bridge = globalThis.window?.headquarters?.requestReturnToBase;
  if (bridge === undefined) return transitionLocalMission(mission, 'return_to_base');

  const result = await bridge({ missionId: mission.id, reason: 'Return to base requested from desktop.' });
  return mapMissionRecordToActiveMission(result.mission);
}

export async function saveDesktopDebrief(
  mission: ActiveMission,
  draft: MissionDebriefDraft,
): Promise<{ mission: ActiveMission; debrief: MissionDebrief } | undefined> {
  const bridge = globalThis.window?.headquarters?.saveDebrief;
  if (bridge === undefined) {
    const debrief = createLocalDebrief(mission, draft);
    if (debrief === undefined) return undefined;

    return {
      mission: transitionLocalMission(mission, 'debrief'),
      debrief,
    };
  }

  const result = await bridge({
    missionId: mission.id,
    behaviorSummary: draft.behaviorSummary,
    disciplineNotes: draft.disciplineNotes,
    lesson: draft.lesson,
  });

  return {
    mission: mapMissionRecordToActiveMission(result.mission),
    debrief: result.debrief,
  };
}

export async function archiveDesktopMission(mission: ActiveMission): Promise<ActiveMission> {
  const bridge = globalThis.window?.headquarters?.archiveAfterDebrief;
  if (bridge === undefined) return transitionLocalMission(mission, 'archived');

  const result = await bridge({ missionId: mission.id, reason: 'Mission archived from desktop.' });
  return mapMissionRecordToActiveMission(result.mission);
}

export async function promoteDesktopDoctrineCandidate(draft: DoctrinePromotionDraft): Promise<DoctrineRecord | undefined> {
  const candidateId = draft.candidateId.trim();
  const title = draft.title.trim();
  const summary = draft.summary.trim();
  const sourceId = draft.sourceId.trim();
  const archiveId = draft.archiveId.trim();
  const excerpt = draft.excerpt.trim();

  if (!candidateId || !title || !summary || !sourceId || !archiveId || !excerpt) {
    return undefined;
  }

  const result = await globalThis.window?.headquarters?.promoteDoctrineCandidate?.({
    candidateId,
    title,
    summary,
    sourceId,
    archiveId,
    excerpt,
  });

  return result?.record;
}

interface MissionClosingPanelProps {
  activeMission?: ActiveMission | undefined;
}

function MissionClosingPanel({ activeMission }: MissionClosingPanelProps) {
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
    </section>
  );
}

interface DebriefPanelProps {
  activeMission?: ActiveMission | undefined;
  missionDebrief?: MissionDebrief | undefined;
}

function DebriefPanel({ missionDebrief }: DebriefPanelProps) {
  return (
    <section className="debrief-panel" aria-label="Mission debrief">
      <div>
        <p className="section-label">Debrief</p>
        <h3>Mission Debrief</h3>
      </div>
      <p className="muted">{formatDebriefStatus(missionDebrief)}</p>
    </section>
  );
}

interface MissionArchiveSummaryPanelProps {
  activeMission?: ActiveMission | undefined;
  archiveSummary?: LocalMissionArchiveSummary | undefined;
  missionDebrief?: MissionDebrief | undefined;
}

function MissionArchiveSummaryPanel({
  archiveSummary,
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

interface JournalRoomProps {
  journalEntries: JournalEntry[];
  dailyReflections: DailyReflection[];
  tradeReviews: TradeReview[];
  growthEvents: GrowthEvent[];
  archivedJournalEntries: ArchivedJournalEntry[];
  onCreateJournalEntry: (entry: JournalEntry) => void;
  onCreateDailyReflection: (reflection: DailyReflection) => void;
  onCreateTradeReview: (review: TradeReview) => void;
  onCreateGrowthEvent: (event: GrowthEvent) => void;
  onArchiveJournalEntry: (record: ArchivedJournalEntry) => void;
}

function JournalRoom({
  journalEntries,
  dailyReflections,
  tradeReviews,
  growthEvents,
  archivedJournalEntries,
  onCreateJournalEntry,
  onCreateDailyReflection,
  onCreateTradeReview,
  onCreateGrowthEvent,
  onArchiveJournalEntry,
}: JournalRoomProps) {
  const [entryContent, setEntryContent] = useState('');
  const [entryMood, setEntryMood] = useState('');
  const [entryMarketConditions, setEntryMarketConditions] = useState('');
  const [reflectionSummary, setReflectionSummary] = useState('');
  const [reflectionEmotion, setReflectionEmotion] = useState('');
  const [tradeId, setTradeId] = useState('');
  const [tradeLesson, setTradeLesson] = useState('');
  const [growthTitle, setGrowthTitle] = useState('');
  const [growthDescription, setGrowthDescription] = useState('');
  const [searchText, setSearchText] = useState('');

  const timeline = buildJournalTimeline({
    journalEntries,
    dailyReflections,
    tradeReviews,
    growthEvents,
  });
  const searchResult = searchJournalEntries(journalEntries, { text: searchText });

  function handleJournalEntrySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entry = createJournalEntry({
      content: entryContent,
      entryDate: getTodayDate(),
      mood: entryMood,
      marketConditions: entryMarketConditions,
    });

    if (entry === undefined) return;

    onCreateJournalEntry(entry);
    setEntryContent('');
    setEntryMood('');
    setEntryMarketConditions('');
  }

  function handleReflectionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reflection = createDailyReflection({
      reflectionDate: getTodayDate(),
      behaviorSummary: reflectionSummary,
      emotionalState: reflectionEmotion,
      disciplineObservation: reflectionSummary,
      ...(journalEntries[0] !== undefined ? { journalEntryId: journalEntries[0].id } : {}),
    });

    if (reflection === undefined) return;

    onCreateDailyReflection(reflection);
    setReflectionSummary('');
    setReflectionEmotion('');
  }

  function handleTradeReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const review = createTradeReview({
      tradeId,
      reviewDate: getTodayDate(),
      followedPlan: true,
      emotionalState: 'Operator supplied review',
      whatWentWell: tradeLesson,
      whatToImprove: tradeLesson,
      lessonsLearned: tradeLesson,
      wouldTakeAgain: true,
      ...(journalEntries[0] !== undefined ? { journalEntryId: journalEntries[0].id } : {}),
    });

    if (review === undefined) return;

    onCreateTradeReview(review);
    setTradeId('');
    setTradeLesson('');
  }

  function handleGrowthEventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sourceEntry = journalEntries[0];
    if (sourceEntry === undefined) return;

    const growthEvent = createGrowthEvent({
      eventDate: getTodayDate(),
      title: growthTitle,
      description: growthDescription,
      category: 'process_improvement',
      evidence: {
        sourceType: 'journal_entry',
        sourceId: sourceEntry.id,
      },
    });

    if (growthEvent === undefined) return;

    onCreateGrowthEvent(growthEvent);
    setGrowthTitle('');
    setGrowthDescription('');
  }

  return (
    <div className="room-layout" data-room-id="journal-room">
      <section className="command-center-header" aria-label="Journal room status">
        <p className="section-label">Journal Room</p>
        <h2>Journal System</h2>
        <p className="muted">Entry, reflection, trade review, growth event, timeline, search, and archive surfaces.</p>
      </section>

      <section className="command-center-panels" aria-label="Journal workspace">
        <form className="journal-panel" aria-label="Journal entry" onSubmit={handleJournalEntrySubmit}>
          <p className="section-label">Journal Entry</p>
          <h3>Commander's Log</h3>
          <label>
            <span>Raw Content</span>
            <input value={entryContent} onChange={(event) => setEntryContent(event.target.value)} />
          </label>
          <label>
            <span>Mood</span>
            <input value={entryMood} onChange={(event) => setEntryMood(event.target.value)} />
          </label>
          <label>
            <span>Market Conditions</span>
            <input value={entryMarketConditions} onChange={(event) => setEntryMarketConditions(event.target.value)} />
          </label>
          <button className="secondary-action" type="submit">Save Journal Entry</button>
          <p className="muted">{formatJournalCount(journalEntries.length, 'journal entry', 'journal entries')}</p>
        </form>

        <form className="journal-panel" aria-label="Daily reflection" onSubmit={handleReflectionSubmit}>
          <p className="section-label">Daily Reflection</p>
          <h3>Daily Reflection</h3>
          <label>
            <span>Behavior Summary</span>
            <input value={reflectionSummary} onChange={(event) => setReflectionSummary(event.target.value)} />
          </label>
          <label>
            <span>Emotional State</span>
            <input value={reflectionEmotion} onChange={(event) => setReflectionEmotion(event.target.value)} />
          </label>
          <button className="secondary-action" type="submit">Save Reflection</button>
          <p className="muted">{formatJournalCount(dailyReflections.length, 'reflection', 'reflections')}</p>
        </form>

        <form className="journal-panel" aria-label="Trade review" onSubmit={handleTradeReviewSubmit}>
          <p className="section-label">Trade Review</p>
          <h3>Trade Review</h3>
          <label>
            <span>Trade ID</span>
            <input value={tradeId} onChange={(event) => setTradeId(event.target.value)} />
          </label>
          <label>
            <span>Lesson</span>
            <input value={tradeLesson} onChange={(event) => setTradeLesson(event.target.value)} />
          </label>
          <button className="secondary-action" type="submit">Save Trade Review</button>
          <p className="muted">{formatJournalCount(tradeReviews.length, 'trade review', 'trade reviews')}</p>
        </form>

        <form className="journal-panel" aria-label="Growth events" onSubmit={handleGrowthEventSubmit}>
          <p className="section-label">Growth Events</p>
          <h3>Growth Events</h3>
          <label>
            <span>Title</span>
            <input value={growthTitle} onChange={(event) => setGrowthTitle(event.target.value)} />
          </label>
          <label>
            <span>Description</span>
            <input value={growthDescription} onChange={(event) => setGrowthDescription(event.target.value)} />
          </label>
          <button className="secondary-action" type="submit" disabled={journalEntries.length === 0}>
            Save Growth Event
          </button>
          <p className="muted">{formatJournalCount(growthEvents.length, 'growth event', 'growth events')}</p>
        </form>

        <JournalTimelinePanel timeline={timeline} />
        <JournalSearchPanel
          searchText={searchText}
          onSearchTextChange={setSearchText}
          resultCount={searchResult.total}
        />
        <JournalArchivePanel
          journalEntries={journalEntries}
          archivedJournalEntries={archivedJournalEntries}
          onArchiveJournalEntry={onArchiveJournalEntry}
        />
      </section>
    </div>
  );
}

function JournalTimelinePanel({ timeline }: { timeline: JournalTimeline }) {
  return (
    <section className="journal-panel" aria-label="Journal timeline">
      <p className="section-label">Timeline</p>
      <h3>Journal Timeline</h3>
      <p className="muted">{formatJournalCount(timeline.entries.length, 'timeline entry', 'timeline entries')}</p>
      <ol className="mission-timeline-list">
        {timeline.entries.map((entry) => (
          <li key={entry.id}>
            <span>{entry.title}</span>
            <time dateTime={entry.occurredAt}>{entry.occurredAt}</time>
            <strong>{entry.type}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}

function JournalSearchPanel({
  searchText,
  onSearchTextChange,
  resultCount,
}: {
  searchText: string;
  onSearchTextChange: (value: string) => void;
  resultCount: number;
}) {
  return (
    <section className="journal-panel" aria-label="Journal search">
      <p className="section-label">Search</p>
      <h3>Journal Search</h3>
      <label>
        <span>Search Text</span>
        <input value={searchText} onChange={(event) => onSearchTextChange(event.target.value)} />
      </label>
      <p className="muted">{formatJournalCount(resultCount, 'search result', 'search results')}</p>
    </section>
  );
}

function JournalArchivePanel({
  journalEntries,
  archivedJournalEntries,
  onArchiveJournalEntry,
}: {
  journalEntries: JournalEntry[];
  archivedJournalEntries: ArchivedJournalEntry[];
  onArchiveJournalEntry: (record: ArchivedJournalEntry) => void;
}) {
  function handleArchiveFirstEntry() {
    const entry = journalEntries[0];
    if (entry === undefined) return;

    onArchiveJournalEntry(archiveJournalEntry(entry, {
      classificationStatus: entry.classificationStatus,
      tags: ['desktop-review'],
    }));
  }

  return (
    <section className="journal-panel" aria-label="Journal archive">
      <p className="section-label">Archive</p>
      <h3>Journal Archive</h3>
      <button className="secondary-action" type="button" onClick={handleArchiveFirstEntry} disabled={journalEntries.length === 0}>
        Archive First Entry
      </button>
      <p className="muted">{formatJournalCount(archivedJournalEntries.length, 'archived journal entry', 'archived journal entries')}</p>
    </section>
  );
}

function ArchiveRoom({
  archivedMissionSummaries,
  archivedJournalEntries,
}: {
  archivedMissionSummaries: LocalMissionArchiveSummary[];
  archivedJournalEntries: ArchivedJournalEntry[];
}) {
  return (
    <div className="room-layout" data-room-id="archive-room">
      <section className="command-center-header" aria-label="Archive room status">
        <p className="section-label">Archive Room</p>
        <h2>Archive</h2>
        <p className="muted">Mission archive, Journal archive, and historical views.</p>
      </section>
      <section className="command-center-panels" aria-label="Archive workspace">
        <MissionArchiveViewerPanel archiveSummaries={archivedMissionSummaries} />
        <section className="journal-panel" aria-label="Journal archive overview">
          <p className="section-label">Journal Archive</p>
          <h3>Journal Archive</h3>
          <p className="muted">{formatJournalCount(archivedJournalEntries.length, 'archived journal entry', 'archived journal entries')}</p>
        </section>
      </section>
    </div>
  );
}

function DoctrineRoom({
  doctrineRecords,
  onPromoteDoctrineCandidate,
}: {
  doctrineRecords: DoctrineRecord[];
  onPromoteDoctrineCandidate: (record: DoctrineRecord) => void;
}) {
  return (
    <div className="room-layout" data-room-id="doctrine-room">
      <section className="command-center-header" aria-label="Doctrine room status">
        <p className="section-label">Doctrine Chamber</p>
        <h2>Doctrine Viewer</h2>
        <p className="muted">Validated rules are visible here as read-only institutional memory.</p>
      </section>
      <section className="command-center-panels" aria-label="Doctrine workspace">
        <DoctrineViewerPanel doctrineRecords={doctrineRecords} />
        <DoctrinePromotionPanel onPromoteDoctrineCandidate={onPromoteDoctrineCandidate} />
      </section>
    </div>
  );
}

function DoctrinePromotionPanel({
  onPromoteDoctrineCandidate,
}: {
  onPromoteDoctrineCandidate: (record: DoctrineRecord) => void;
}) {
  const [candidateId, setCandidateId] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [archiveId, setArchiveId] = useState('');
  const [excerpt, setExcerpt] = useState('');

  async function handlePromotion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const record = await promoteDesktopDoctrineCandidate({
      candidateId,
      title,
      summary,
      sourceId,
      archiveId,
      excerpt,
    });

    if (record === undefined) return;

    onPromoteDoctrineCandidate(record);
    setCandidateId('');
    setTitle('');
    setSummary('');
    setSourceId('');
    setArchiveId('');
    setExcerpt('');
  }

  return (
    <form className="journal-panel" aria-label="Manual doctrine promotion" onSubmit={handlePromotion}>
      <p className="section-label">Manual Promotion</p>
      <h3>Promote Candidate</h3>
      <label>
        <span>Candidate Id</span>
        <input value={candidateId} onChange={(event) => setCandidateId(event.target.value)} placeholder="candidate-001" />
      </label>
      <label>
        <span>Title</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Wait for confirmation" />
      </label>
      <label>
        <span>Summary</span>
        <textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Doctrine summary" />
      </label>
      <label>
        <span>Source Journal Entry Id</span>
        <input value={sourceId} onChange={(event) => setSourceId(event.target.value)} placeholder="journal-001" />
      </label>
      <label>
        <span>Source Archive Id</span>
        <input value={archiveId} onChange={(event) => setArchiveId(event.target.value)} placeholder="archive-001" />
      </label>
      <label>
        <span>Source Excerpt</span>
        <textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="Evidence excerpt" />
      </label>
      <button className="secondary-action" type="submit">
        Promote Candidate
      </button>
    </form>
  );
}

function DoctrineViewerPanel({ doctrineRecords }: { doctrineRecords: DoctrineRecord[] }) {
  return (
    <section className="journal-panel" aria-label="Doctrine viewer">
      <p className="section-label">Doctrine</p>
      <h3>Doctrine Records</h3>
      {doctrineRecords.length === 0 ? (
        <p className="muted">No doctrine records have been accepted yet.</p>
      ) : (
        <div className="timeline-list">
          {doctrineRecords.map((record) => (
            <article className="timeline-item" key={record.id}>
              <strong>{record.title}</strong>
              <span>{record.summary}</span>
              <span>
                {record.confidence} from {record.source.sourceType}: {record.source.sourceId}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SettingsRoom() {
  return (
    <section className="room-layout" data-room-id="settings-room" aria-label="Settings room">
      <p className="section-label">Settings</p>
      <h2>Settings</h2>
      <p className="muted">No completed settings workflow is available yet.</p>
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

export function buildMissionLifecycleSteps(mission?: ActiveMission): MissionLifecycleStep[] {
  const currentState = parseMissionState(mission?.currentState);
  const currentIndex = currentState ? missionLifecyclePath.indexOf(currentState) : -1;

  return missionLifecyclePath.map((state, index) => ({
    state,
    label: formatMissionStateForDisplay(state),
    status: getMissionLifecycleStepStatus(index, currentIndex),
  }));
}

export function formatMissionLifecycleSummary(mission?: ActiveMission): string {
  const currentState = parseMissionState(mission?.currentState);

  if (currentState === undefined) return 'No mission lifecycle loaded';
  return `Current lifecycle state: ${formatMissionStateForDisplay(currentState)}`;
}

export function formatMissionLifecycleStepStatus(status: MissionLifecycleStepStatus): string {
  if (status === 'completed') return 'Complete';
  if (status === 'current') return 'Current';
  return 'Pending';
}

export function formatMissionDetailValue(value?: string): string {
  if (value === undefined || value.trim().length === 0) return 'Not available';
  return value;
}

export function formatMissionDetailState(mission?: ActiveMission): string {
  const currentState = parseMissionState(mission?.currentState);

  if (currentState === undefined) return 'No mission loaded';
  return formatMissionStateForDisplay(currentState);
}

function getMissionLifecycleStepStatus(index: number, currentIndex: number): MissionLifecycleStepStatus {
  if (currentIndex < 0) return 'pending';
  if (index < currentIndex) return 'completed';
  if (index === currentIndex) return 'current';
  return 'pending';
}

export interface MissionNextAction {
  readonly label: string;
  readonly description: string;
  readonly buttonLabel: string;
  readonly disabled: boolean;
}

export function getMissionNextAction(mission?: ActiveMission): MissionNextAction {
  const currentState = parseMissionState(mission?.currentState);

  if (currentState === undefined) {
    return {
      label: 'No Active Mission',
      description: 'Create a mission before lifecycle actions are available.',
      buttonLabel: 'Awaiting Mission',
      disabled: true,
    };
  }

  if (currentState === 'idle') {
    return {
      label: 'Start Briefing',
      description: 'Move the mission from idle into briefing.',
      buttonLabel: 'Start Briefing',
      disabled: false,
    };
  }

  if (currentState === 'briefing') {
    return {
      label: 'Complete Briefing',
      description: 'Confirm the briefing is complete and move to ready.',
      buttonLabel: 'Complete Briefing',
      disabled: false,
    };
  }

  if (currentState === 'ready') {
    return {
      label: 'Start Observation',
      description: 'Begin the observation workflow before authorization.',
      buttonLabel: 'Start Observation',
      disabled: false,
    };
  }

  if (currentState === 'observation') {
    return {
      label: 'Complete Observation',
      description: 'Complete observation and move to authorization.',
      buttonLabel: 'Complete Observation',
      disabled: false,
    };
  }

  if (currentState === 'authorization') {
    return {
      label: 'Authorize Mission',
      description: 'Provide justification and invalidation. Approval declares deployment; denial keeps authorization open.',
      buttonLabel: 'Evaluate Authorization',
      disabled: false,
    };
  }

  if (currentState === 'deployed') {
    return {
      label: 'Return To Base',
      description: 'Close active deployment and return to base.',
      buttonLabel: 'Return To Base',
      disabled: false,
    };
  }

  if (currentState === 'return_to_base') {
    return {
      label: 'Save Debrief',
      description: 'Capture behavior, discipline, and lesson evidence.',
      buttonLabel: 'Save Debrief',
      disabled: false,
    };
  }

  if (currentState === 'debrief') {
    return {
      label: 'Archive Mission',
      description: 'Archive the debriefed mission.',
      buttonLabel: 'Archive Mission',
      disabled: false,
    };
  }

  return {
    label: 'Mission Archived',
    description: 'This mission lifecycle is complete.',
    buttonLabel: 'Archived',
    disabled: true,
  };
}

function parseMissionState(state?: string): MissionState | undefined {
  if (state === undefined) return undefined;
  return missionLifecyclePath.find((candidate) => candidate === state);
}

function transitionLocalMission(mission: ActiveMission, nextState: MissionState): ActiveMission {
  return {
    ...mission,
    condition: formatMissionStateForDisplay(nextState),
    currentState: nextState,
  };
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

export function evaluateLocalMissionAuthorization(
  mission: ActiveMission | undefined,
  draft: MissionAuthorizationDraft,
): MissionAuthorizationStatus | undefined {
  if (mission === undefined) return undefined;

  if (hasContent(draft.operatorJustification) && hasContent(draft.invalidation)) {
    return {
      missionId: mission.id,
      decision: 'approved',
      reason: 'Manual authorization fields are complete.',
    };
  }

  return {
    missionId: mission.id,
    decision: 'denied',
    reason: 'Manual authorization requires operator justification and invalidation.',
  };
}

export function formatAuthorizationStatus(status?: MissionAuthorizationStatus): string {
  if (status?.decision === 'approved') return 'Authorization approved';
  if (status?.decision === 'denied') return 'Authorization denied';
  return 'Awaiting authorization request';
}

export function formatMissionAuthorizationAvailability(mission?: ActiveMission): string {
  if (parseMissionState(mission?.currentState) === 'authorization') {
    return 'Authorization interaction is available as the valid next action.';
  }

  return 'Authorization is locked until the mission reaches authorization state.';
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

export function listArchivedMissionSummaries(
  summaries: LocalMissionArchiveSummary[] | undefined,
): LocalMissionArchiveSummary[] {
  return summaries ? [...summaries] : [];
}

export function formatArchiveViewerStatus(summaries: LocalMissionArchiveSummary[]): string {
  if (summaries.length === 0) return 'No archived missions';
  if (summaries.length === 1) return '1 archived mission';
  return `${summaries.length} archived missions`;
}

export interface DesktopMissionTimelineInput {
  activeMission?: ActiveMission | undefined;
  authorizationStatus?: MissionAuthorizationStatus | undefined;
  missionDebrief?: MissionDebrief | undefined;
  archiveSummary?: LocalMissionArchiveSummary | undefined;
}

export function buildDesktopMissionTimelineEntries(
  input: DesktopMissionTimelineInput,
): MissionTimelineExportEntryDTO[] {
  const mission = input.activeMission;
  if (mission === undefined) return [];

  const missionState = parseMissionState(mission.currentState) ?? 'briefing';
  const entries: MissionTimelineExportEntryDTO[] = [
    {
      eventId: `desktop-${mission.id}-created`,
      missionId: mission.id,
      occurredAt: mission.createdAt,
      transition: {
        from: 'idle',
        to: missionState,
      },
      reason: 'Mission created',
    },
  ];

  if (input.authorizationStatus !== undefined && input.authorizationStatus.missionId === mission.id) {
    entries.push({
      eventId: `desktop-${mission.id}-authorization-${input.authorizationStatus.decision}`,
      missionId: mission.id,
      occurredAt: mission.createdAt,
      transition: {
        from: 'ready',
        to: 'authorization',
      },
      reason: formatAuthorizationStatus(input.authorizationStatus),
    });
  }

  if (input.missionDebrief !== undefined && input.missionDebrief.missionId === mission.id) {
    entries.push({
      eventId: `desktop-${mission.id}-debrief`,
      missionId: mission.id,
      occurredAt: input.missionDebrief.createdAt,
      transition: {
        from: 'return_to_base',
        to: 'debrief',
      },
      reason: 'Mission debrief saved',
    });
  }

  if (input.archiveSummary !== undefined && input.archiveSummary.missionId === mission.id) {
    entries.push({
      eventId: `desktop-${mission.id}-archived`,
      missionId: mission.id,
      occurredAt: input.archiveSummary.archivedAt,
      transition: {
        from: 'debrief',
        to: 'archived',
      },
      reason: 'Mission archived',
    });
  }

  return [...entries].sort((first, second) => first.occurredAt.localeCompare(second.occurredAt));
}

export function formatTimelineViewerStatus(entries: MissionTimelineExportEntryDTO[]): string {
  if (entries.length === 0) return 'No timeline entries';
  if (entries.length === 1) return '1 timeline entry';
  return `${entries.length} timeline entries`;
}

export function formatMissionTimelineTransition(entry: MissionTimelineExportEntryDTO): string {
  return `${formatMissionStateForDisplay(entry.transition.from)} to ${formatMissionStateForDisplay(entry.transition.to)}`;
}

export function listMissionHistory(history: ActiveMission[] | undefined): ActiveMission[] {
  return history ? [...history] : [];
}

export function upsertMissionHistory(history: ActiveMission[], mission: ActiveMission): ActiveMission[] {
  const existingIndex = history.findIndex((candidate) => candidate.id === mission.id);

  if (existingIndex === -1) return [...history, mission];

  return history.map((candidate, index) => (index === existingIndex ? mission : candidate));
}

export function formatMissionHistoryStatus(history: ActiveMission[]): string {
  if (history.length === 0) return 'No mission history';
  if (history.length === 1) return '1 mission recorded';
  return `${history.length} missions recorded`;
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

function hasContent(value: string): boolean {
  return value.trim().length > 0;
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatJournalCount(count: number, singular: string, plural: string): string {
  if (count === 0) return `No ${plural}`;
  if (count === 1) return `1 ${singular}`;
  return `${count} ${plural}`;
}
