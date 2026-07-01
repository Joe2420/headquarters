import { type FormEvent, useEffect, useState } from 'react';
import { MissionBoard } from '@headquarters/ui';
import type { EventEnvelope, Mission, MissionState } from '@headquarters/shared';
import type { MissionTimelineExportEntryDTO } from '@headquarters/hqos';
import {
  buildArchiveDashboard,
  detectArchivePatterns,
  filterArchiveTimeline,
  inspectArchiveEvents,
  inspectArchiveSessions,
  prepareArchiveReplay,
  searchArchiveRecords,
  type ArchiveDashboardSummary,
  type ArchiveEventInspection,
  type ArchiveIntelligenceRecord,
  type ArchiveSessionInspection,
} from '@headquarters/archive-intelligence';
import {
  buildAcademyConsistency,
  buildAcademyRecognitions,
  buildAcademyStatistics,
  createAcademyGrowthEventFromJournal,
  type AcademyRecognition,
} from '@headquarters/academy';
import { buildCommanderDailyBriefing, buildCommanderSessionDebrief, buildCommanderWeeklyReview } from '@headquarters/commander';
import { buildGuardianAlerts, evaluateGuardianLockout, type GuardianAlert, type GuardianLockoutState } from '@headquarters/guardian';
import {
  buildTradingPlanDoctrineReferences,
  diffDoctrineRecords,
  type DoctrineDiff,
  type DoctrineHistoryEntry,
  type DoctrineRecord,
  type TradingPlanDoctrineReference,
} from '@headquarters/doctrine';
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

export type NavigationAreaId =
  | 'command'
  | 'missions'
  | 'ready'
  | 'observation'
  | 'war'
  | 'debrief'
  | 'journal'
  | 'academy'
  | 'doctrine'
  | 'guardian'
  | 'archive'
  | 'settings';
export type HeadquartersRoomId = NavigationAreaId;

export interface PrimaryNavigationItem {
  id: NavigationAreaId;
  label: string;
  active: boolean;
}

export type JournalWorkflowStepId = 'entry' | 'reflection' | 'trade-review' | 'growth' | 'timeline' | 'search' | 'archive';

export interface JournalWorkflowStep {
  id: JournalWorkflowStepId;
  label: string;
  description: string;
}

const primaryNavigation: Array<Omit<PrimaryNavigationItem, 'active'>> = [
  { id: 'command', label: 'Command' },
  { id: 'missions', label: 'Missions' },
  { id: 'ready', label: 'Ready Room' },
  { id: 'observation', label: 'Observation' },
  { id: 'war', label: 'War Room' },
  { id: 'debrief', label: 'Debrief' },
  { id: 'journal', label: 'Journal' },
  { id: 'academy', label: 'Academy' },
  { id: 'doctrine', label: 'Doctrine' },
  { id: 'guardian', label: 'Guardian Wing' },
  { id: 'archive', label: 'Archive' },
  { id: 'settings', label: 'Settings' },
];

const journalWorkflowSteps: readonly JournalWorkflowStep[] = [
  {
    id: 'entry',
    label: 'Journal Entry',
    description: 'Capture the raw observation before interpretation.',
  },
  {
    id: 'reflection',
    label: 'Daily Reflection',
    description: 'Name the behavior and emotional state.',
  },
  {
    id: 'trade-review',
    label: 'Trade Review',
    description: 'Review the trade as evidence, not prediction.',
  },
  {
    id: 'growth',
    label: 'Growth Events',
    description: 'Promote journal evidence into growth evidence.',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    description: 'Read the journal record in chronological order.',
  },
  {
    id: 'search',
    label: 'Search',
    description: 'Find prior journal evidence deterministically.',
  },
  {
    id: 'archive',
    label: 'Archive',
    description: 'Move completed evidence into the local archive view.',
  },
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
      listDoctrineHistory?: () => Promise<{ entries: DoctrineHistoryEntry[] }>;
      promoteDoctrineCandidate?: (input: DoctrinePromotionDraft) => Promise<{
        record: DoctrineRecord;
        historyEntry: DoctrineHistoryEntry;
      }>;
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
  const [doctrineHistory, setDoctrineHistory] = useState<DoctrineHistoryEntry[]>([]);
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

    Promise.all([
      globalThis.window?.headquarters?.listDoctrineRecords?.(),
      globalThis.window?.headquarters?.listDoctrineHistory?.(),
    ])
      .then(([recordsResult, historyResult]) => {
        if (!active) return;
        if (recordsResult) setDoctrineRecords(recordsResult.records);
        if (historyResult) setDoctrineHistory(historyResult.entries);
      })
      .catch(() => {
        if (!active) return;
        setDoctrineRecords([]);
        setDoctrineHistory([]);
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
                doctrineHistory,
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
                onPromoteDoctrineCandidate: (record, historyEntry) => {
                  setDoctrineRecords((records) => [...records, record]);
                  setDoctrineHistory((entries) => [...entries, historyEntry]);
                },
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
  doctrineHistory: DoctrineHistoryEntry[];
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
  onPromoteDoctrineCandidate: (record: DoctrineRecord, historyEntry: DoctrineHistoryEntry) => void;
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

  if (room === 'ready') {
    return (
      <ReadyRoom
        activeMission={context.activeMission}
        missionHistory={context.missionHistory}
        growthEvents={context.growthEvents}
      />
    );
  }

  if (room === 'observation') {
    return (
      <ObservationRoom
        activeMission={context.activeMission}
        authorizationStatus={context.authorizationStatus}
        missionDebrief={context.missionDebrief}
        archiveSummary={context.archiveSummary}
      />
    );
  }

  if (room === 'war') {
    return (
      <WarRoom
        activeMission={context.activeMission}
        authorizationStatus={context.authorizationStatus}
        missionHistory={context.missionHistory}
      />
    );
  }

  if (room === 'debrief') {
    return (
      <DebriefTheater
        activeMission={context.activeMission}
        authorizationStatus={context.authorizationStatus}
        missionDebrief={context.missionDebrief}
        archiveSummary={context.archiveSummary}
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
        doctrineHistory={context.doctrineHistory}
        onPromoteDoctrineCandidate={context.onPromoteDoctrineCandidate}
      />
    );
  }

  if (room === 'academy') {
    return <AcademyRoom growthEvents={context.growthEvents} />;
  }

  if (room === 'guardian') {
    return <GuardianRoom />;
  }

  if (room === 'archive') {
    return (
      <ArchiveRoom
        archivedMissionSummaries={context.archivedMissionSummaries}
        archivedJournalEntries={context.archivedJournalEntries}
        doctrineRecords={context.doctrineRecords}
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
      growthEvents={context.growthEvents}
      doctrineRecords={context.doctrineRecords}
      journalEntries={context.journalEntries}
      archivedMissionSummaries={context.archivedMissionSummaries}
      archivedJournalEntries={context.archivedJournalEntries}
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
  return <CommandOverview startupSubsystemCount={4} missionHistory={[]} />;
}

interface CommandOverviewProps {
  activeMission?: ActiveMission | undefined;
  startupSubsystemCount: number;
  missionHistory: ActiveMission[];
  growthEvents?: GrowthEvent[] | undefined;
  doctrineRecords?: DoctrineRecord[] | undefined;
  journalEntries?: JournalEntry[] | undefined;
  archivedMissionSummaries?: LocalMissionArchiveSummary[] | undefined;
  archivedJournalEntries?: ArchivedJournalEntry[] | undefined;
}

function CommandOverview({
  activeMission,
  startupSubsystemCount,
  missionHistory,
  growthEvents = [],
  doctrineRecords = [],
  journalEntries = [],
  archivedMissionSummaries = [],
  archivedJournalEntries = [],
}: CommandOverviewProps) {
  const nextAction = getMissionNextAction(activeMission);
  const commanderMessage = getCommanderMessage(activeMission);
  const dailyBriefing = buildCommanderDailyBriefing({
    activeMissionTitle: activeMission?.campaign,
    activeMissionObjective: activeMission?.objective,
    missionCount: missionHistory.length,
    journalEntryCount: journalEntries.length,
    archiveRecordCount: archivedMissionSummaries.length + archivedJournalEntries.length,
    generatedAt: activeMission?.createdAt ?? 'standby',
  });
  const sessionDebrief = buildCommanderSessionDebrief({
    missionTitle: activeMission?.campaign,
    missionState: activeMission?.currentState,
    journalEntryCount: journalEntries.length,
    archiveRecordCount: archivedMissionSummaries.length + archivedJournalEntries.length,
    generatedAt: activeMission?.createdAt ?? 'standby',
  });
  const weeklyReview = buildCommanderWeeklyReview({
    missionCount: missionHistory.length,
    journalEntryCount: journalEntries.length,
    doctrineRecordCount: doctrineRecords.length,
    academyGrowthEventCount: growthEvents.length,
    generatedAt: activeMission?.createdAt ?? 'standby',
  });

  return (
    <div className="command-center-layout" data-layout="command-center">
      <section className="command-center-header" aria-label="Command center overview">
        <p className="section-label">Command Center</p>
        <h2>Headquarters Overview</h2>
        <p className="muted">Commander guidance, current objective, next action, HQOS status, and recent evidence.</p>
      </section>
      <section className="command-overview-flow" aria-label="Headquarters command flow">
        <section className="commander-briefing-panel" aria-label="Commander guidance">
          <p className="section-label">Commander</p>
          <h3>{commanderMessage.title}</h3>
          <p className="muted">{commanderMessage.body}</p>
        </section>
        <section className="commander-briefing-panel" aria-label="Commander daily briefing">
          <p className="section-label">Daily Briefing</p>
          <h3>{dailyBriefing.summary}</h3>
          <p className="muted">{dailyBriefing.focus}</p>
          <ul className="mission-archive-list">
            {dailyBriefing.evidence.map((item) => (
              <li key={item}>
                <span>{item}</span>
                <strong>Evidence</strong>
              </li>
            ))}
          </ul>
        </section>
        <section className="commander-briefing-panel" aria-label="Commander session debrief">
          <p className="section-label">Session Debrief</p>
          <h3>{sessionDebrief.summary}</h3>
          <p className="muted">{sessionDebrief.distinction}</p>
          <ul className="mission-archive-list">
            {sessionDebrief.evidence.map((item) => (
              <li key={item}>
                <span>{item}</span>
                <strong>Evidence</strong>
              </li>
            ))}
          </ul>
        </section>
        <section className="commander-briefing-panel" aria-label="Commander weekly review">
          <p className="section-label">Weekly Review</p>
          <h3>{weeklyReview.summary}</h3>
          <p className="muted">{weeklyReview.constraints.join(' ')}</p>
          <ul className="mission-archive-list">
            {weeklyReview.evidence.map((item) => (
              <li key={item}>
                <span>{item}</span>
                <strong>Evidence</strong>
              </li>
            ))}
          </ul>
        </section>
        <section className="current-objective-panel" aria-label="Current mission summary">
          <p className="section-label">Current Mission</p>
          <h3>{activeMission?.campaign ?? 'No Active Mission'}</h3>
          <p className="muted">{activeMission?.objective ?? 'Create a mission in the Mission Room to begin operations.'}</p>
          <strong>{formatMissionDetailState(activeMission)}</strong>
        </section>
        <section className="current-action-panel" aria-label="Next required action">
          <p className="section-label">Next Required Action</p>
          <h3>{nextAction.label}</h3>
          <p className="muted">{nextAction.description}</p>
        </section>
        <section className="supporting-information-panel" aria-label="Headquarters supporting information">
          <div>
            <p className="section-label">HQOS</p>
            <strong>{startupSubsystemCount} subsystem areas online</strong>
          </div>
          <div>
            <p className="section-label">Notifications</p>
            <strong>{getMissionNotificationSummary(activeMission, missionHistory)}</strong>
            <span className="muted">Detailed workflow, timeline, and history live inside the Mission Room.</span>
          </div>
          <div>
            <p className="section-label">Recent Growth</p>
            <strong>{formatRecentGrowthHighlight(growthEvents)}</strong>
          </div>
          <div>
            <p className="section-label">Recent Doctrine</p>
            <strong>{formatRecentDoctrineHighlight(doctrineRecords)}</strong>
          </div>
        </section>
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
        <p className="muted">Guided mission workflow, active phase workspace, timeline, history, and archive summary.</p>
      </section>
      <MissionWorkflowView {...props} />
    </div>
  );
}

export function ReadyRoom({
  activeMission,
  missionHistory,
  growthEvents,
}: {
  activeMission?: ActiveMission | undefined;
  missionHistory: ActiveMission[];
  growthEvents: GrowthEvent[];
}) {
  const nextAction = getMissionNextAction(activeMission);
  const recentMission = missionHistory.at(-1);

  return (
    <div className="room-layout" data-room-id="ready-room">
      <section className="command-center-header" aria-label="Ready room status">
        <p className="section-label">Ready Room</p>
        <h2>Mission Readiness</h2>
        <p className="muted">Preparation, daily orders, oath, and operator locker state before observation begins.</p>
      </section>
      <section className="guided-workflow-layout" aria-label="Ready room workspace">
        <section className="journal-panel" aria-label="Readiness report">
          <p className="section-label">ReadinessReport</p>
          <h3>{nextAction.label}</h3>
          <p className="muted">{nextAction.description}</p>
          <dl>
            <dt>Mission State</dt>
            <dd>{formatMissionDetailState(activeMission)}</dd>
            <dt>Recent Growth</dt>
            <dd>{formatRecentGrowthHighlight(growthEvents)}</dd>
          </dl>
        </section>
        <section className="journal-panel" aria-label="Daily orders card">
          <p className="section-label">DailyOrdersCard</p>
          <h3>{activeMission?.campaign ?? 'No active orders'}</h3>
          <p className="muted">{activeMission?.objective ?? 'Create a mission before moving into observation.'}</p>
        </section>
        <section className="journal-panel" aria-label="Oath panel">
          <p className="section-label">OathPanel</p>
          <h3>Command Oath</h3>
          <p className="muted">{activeMission?.commandAuthority ?? 'Command authority is assigned when a mission exists.'}</p>
        </section>
        <section className="journal-panel" aria-label="Locker panel">
          <p className="section-label">LockerPanel</p>
          <h3>Operator Locker</h3>
          <dl>
            <dt>Missions Recorded</dt>
            <dd>{missionHistory.length}</dd>
            <dt>Last Mission</dt>
            <dd>{recentMission?.campaign ?? 'No prior mission'}</dd>
          </dl>
        </section>
      </section>
    </div>
  );
}

export function ObservationRoom({
  activeMission,
  authorizationStatus,
  missionDebrief,
  archiveSummary,
}: MissionTimelineViewerPanelProps) {
  const currentState = parseMissionState(activeMission?.currentState);
  const entries = buildDesktopMissionTimelineEntries({
    activeMission,
    authorizationStatus,
    missionDebrief,
    archiveSummary,
  });

  return (
    <div className="room-layout" data-room-id="observation-room">
      <section className="command-center-header" aria-label="Observation room status">
        <p className="section-label">Observation Room</p>
        <h2>Observation</h2>
        <p className="muted">Watch the mission state without market prediction, PnL, or broker control.</p>
      </section>
      <section className="guided-workflow-layout" aria-label="Observation room workspace">
        <section className="journal-panel" aria-label="Observation timer">
          <p className="section-label">ObservationTimer</p>
          <h3>{currentState === 'observation' ? 'Observation Active' : 'Observation Standby'}</h3>
          <p className="muted">{formatTimelineViewerStatus(entries)}</p>
        </section>
        <section className="journal-panel" aria-label="Compass indicator">
          <p className="section-label">CompassIndicator</p>
          <h3>{getMissionNextAction(activeMission).label}</h3>
          <p className="muted">{getMissionNextAction(activeMission).description}</p>
        </section>
        <section className="journal-panel" aria-label="Artificial horizon">
          <p className="section-label">ArtificialHorizon</p>
          <h3>{currentState === 'observation' ? 'Level' : 'Calm'}</h3>
          <p className="muted">Operator stability is represented as a quiet status, not a trading signal.</p>
        </section>
        <section className="journal-panel" aria-label="Silence state display">
          <p className="section-label">SilenceStateDisplay</p>
          <h3>No Broker Control</h3>
          <p className="muted">Headquarters observes and records. It does not place trades.</p>
        </section>
      </section>
    </div>
  );
}

export function WarRoom({
  activeMission,
  authorizationStatus,
  missionHistory,
}: {
  activeMission?: ActiveMission | undefined;
  authorizationStatus?: MissionAuthorizationStatus | undefined;
  missionHistory: ActiveMission[];
}) {
  const alerts = buildDesktopGuardianAlerts();
  const lockout = buildDesktopGuardianLockoutState();
  const comparisonMission = missionHistory.find((mission) => mission.id !== activeMission?.id);

  return (
    <div className="room-layout" data-room-id="war-room">
      <section className="command-center-header" aria-label="War room status">
        <p className="section-label">War Room</p>
        <h2>Authorization Terminal</h2>
        <p className="muted">Authorization remains rule-based and manually declared. Headquarters never places trades.</p>
      </section>
      <section className="guided-workflow-layout" aria-label="War room workspace">
        <MissionAuthorizationPanel activeMission={activeMission} authorizationStatus={authorizationStatus} />
        <section className="journal-panel" aria-label="War table projection">
          <p className="section-label">WarTableProjection</p>
          <h3>{activeMission?.campaign ?? 'No active mission'}</h3>
          <p className="muted">{activeMission?.objective ?? 'Create and prepare a mission before authorization.'}</p>
        </section>
        <section className="journal-panel" aria-label="Guardian status panel">
          <p className="section-label">GuardianStatusPanel</p>
          <h3>{lockout.status === 'locked' ? 'Intervention Required' : 'Guardian Standing By'}</h3>
          <p className="muted">{formatJournalCount(alerts.length, 'Guardian alert', 'Guardian alerts')}</p>
        </section>
        <section className="journal-panel" aria-label="Ghost comparison panel">
          <p className="section-label">GhostComparisonPanel</p>
          <h3>{comparisonMission?.campaign ?? 'No comparison mission'}</h3>
          <p className="muted">Comparison remains read-only until replay and ghost workflows are approved.</p>
        </section>
      </section>
    </div>
  );
}

export function DebriefTheater({
  activeMission,
  authorizationStatus,
  missionDebrief,
  archiveSummary,
  onMissionChanged,
  onRequestAuthorization,
  onSaveDebrief,
  onArchiveMission,
}: MissionTimelineViewerPanelProps & Pick<CommandCenterProps,
  'onMissionChanged' | 'onRequestAuthorization' | 'onSaveDebrief' | 'onArchiveMission'
>) {
  return (
    <div className="room-layout" data-room-id="debrief-theater">
      <section className="command-center-header" aria-label="Debrief theater status">
        <p className="section-label">Debrief Theater</p>
        <h2>Mission Debrief</h2>
        <p className="muted">Review the sequence, write the lesson, and prepare archive evidence.</p>
      </section>
      <section className="guided-workflow-layout" aria-label="Debrief theater workspace">
        <MissionTimelineViewerPanel
          activeMission={activeMission}
          authorizationStatus={authorizationStatus}
          missionDebrief={missionDebrief}
          archiveSummary={archiveSummary}
        />
        <section className="journal-panel" aria-label="BlackBoxViewer">
          <p className="section-label">BlackBoxViewer</p>
          <h3>Behavior Sequence</h3>
          <p className="muted">{formatTimelineViewerStatus(buildDesktopMissionTimelineEntries({
            activeMission,
            authorizationStatus,
            missionDebrief,
            archiveSummary,
          }))}</p>
        </section>
        <section className="journal-panel" aria-label="DecisionReportPanel">
          <p className="section-label">DecisionReportPanel</p>
          <h3>{authorizationStatus?.decision === 'approved' ? 'Authorized' : 'Decision Pending'}</h3>
          <p className="muted">{formatAuthorizationStatus(authorizationStatus)}</p>
        </section>
        <MissionNextActionPanel
          activeMission={activeMission}
          authorizationStatus={authorizationStatus}
          missionDebrief={missionDebrief}
          onMissionChanged={onMissionChanged}
          onRequestAuthorization={onRequestAuthorization}
          onSaveDebrief={onSaveDebrief}
          onArchiveMission={onArchiveMission}
        />
        <DebriefPanel activeMission={activeMission} missionDebrief={missionDebrief} />
      </section>
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

function MissionWorkflowView({
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
  const visibleSteps = buildVisibleMissionLifecycleSteps(activeMission);

  return (
    <div className="command-center-layout" data-layout="mission-workflow">
      <section className="command-center-panels" aria-label="Mission workflow">
        <MissionCommanderPanel activeMission={activeMission} />
        <CurrentMissionPhaseWorkspace
          activeMission={activeMission}
          authorizationStatus={authorizationStatus}
          missionDebrief={missionDebrief}
          archiveSummary={archiveSummary}
          onCreateMission={onCreateMission}
          onMissionChanged={onMissionChanged}
          onRequestAuthorization={onRequestAuthorization}
          onSaveDebrief={onSaveDebrief}
          onArchiveMission={onArchiveMission}
        />
        <MissionCompletedPhasesPanel steps={visibleSteps.filter((step) => step.status === 'completed')} />
        <MissionTimelineViewerPanel
          activeMission={activeMission}
          authorizationStatus={authorizationStatus}
          missionDebrief={missionDebrief}
          archiveSummary={archiveSummary}
        />
        <MissionHistoryPanel missionHistory={missionHistory} />
        <MissionDetailsPanel activeMission={activeMission} />
        <MissionArchiveSummaryPanel
          activeMission={activeMission}
          archiveSummary={archiveSummary}
          missionDebrief={missionDebrief}
        />
        <MissionArchiveViewerPanel archiveSummaries={archivedMissionSummaries} />
        <ArchiveWritePanel archiveWrite={archiveWrite} />
      </section>
    </div>
  );
}

function MissionCommanderPanel({ activeMission }: { activeMission?: ActiveMission | undefined }) {
  const message = getCommanderMessage(activeMission);

  return (
    <section className="hqos-dashboard-panel" aria-label="Commander workflow guidance">
      <p className="section-label">Commander</p>
      <h3>{message.title}</h3>
      <p className="muted">{message.body}</p>
    </section>
  );
}

function CurrentMissionPhaseWorkspace({
  activeMission,
  authorizationStatus,
  missionDebrief,
  archiveSummary,
  onCreateMission,
  onMissionChanged,
  onRequestAuthorization,
  onSaveDebrief,
  onArchiveMission,
}: Pick<CommandCenterProps,
  | 'activeMission'
  | 'authorizationStatus'
  | 'missionDebrief'
  | 'archiveSummary'
  | 'onCreateMission'
  | 'onMissionChanged'
  | 'onRequestAuthorization'
  | 'onSaveDebrief'
  | 'onArchiveMission'
>) {
  const currentState = parseMissionState(activeMission?.currentState);

  return (
    <section className="mission-next-action-panel" aria-label="Current mission phase workspace">
      <div>
        <p className="section-label">Active Phase</p>
        <h3>{getMissionPhaseWorkspaceTitle(activeMission)}</h3>
      </div>
      <p className="muted">{getMissionPhaseWorkspaceDescription(activeMission)}</p>
      {activeMission === undefined ? (
        <CreateMissionPanel onCreateMission={onCreateMission} />
      ) : (
        <>
          <div className="mission-board-shell" data-object-id="RM-0007">
            <MissionBoard
              missionId={activeMission.id}
              campaign={activeMission.campaign}
              objective={activeMission.objective}
              condition={activeMission.condition}
              commandAuthority={activeMission.commandAuthority}
              currentState={activeMission.currentState}
              createdAt={activeMission.createdAt}
            />
          </div>
          <MissionNextActionPanel
            activeMission={activeMission}
            authorizationStatus={authorizationStatus}
            missionDebrief={missionDebrief}
            onMissionChanged={onMissionChanged}
            onRequestAuthorization={onRequestAuthorization}
            onSaveDebrief={onSaveDebrief}
            onArchiveMission={onArchiveMission}
          />
          {currentState === 'authorization' ? (
            <MissionAuthorizationPanel activeMission={activeMission} authorizationStatus={authorizationStatus} />
          ) : null}
          {currentState === 'return_to_base' || currentState === 'debrief' || currentState === 'archived' ? (
            <DebriefPanel activeMission={activeMission} missionDebrief={missionDebrief} />
          ) : null}
          {currentState === 'debrief' || currentState === 'archived' ? (
            <MissionClosingPanel activeMission={activeMission} />
          ) : null}
          {currentState === 'archived' ? (
            <MissionArchiveSummaryPanel
              activeMission={activeMission}
              archiveSummary={archiveSummary}
              missionDebrief={missionDebrief}
            />
          ) : null}
        </>
      )}
    </section>
  );
}

function MissionCompletedPhasesPanel({ steps }: { steps: MissionLifecycleStep[] }) {
  return (
    <section className="mission-lifecycle-panel" aria-label="Completed mission phases">
      <div>
        <p className="section-label">Completed Phases</p>
        <h3>Progress Summary</h3>
      </div>
      {steps.length === 0 ? (
        <p className="muted">No mission phases have been completed yet.</p>
      ) : (
        <ol>
          {steps.map((step) => (
            <li key={step.state}>
              <span>{step.label}</span>
              <strong>{formatMissionLifecycleStepStatus(step.status)}</strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
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

export async function promoteDesktopDoctrineCandidate(
  draft: DoctrinePromotionDraft,
): Promise<{ record: DoctrineRecord; historyEntry: DoctrineHistoryEntry } | undefined> {
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

  return result;
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

export function JournalRoom({
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
  const [activeJournalStep, setActiveJournalStep] = useState<JournalWorkflowStepId>('entry');
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
  const activeStep = getJournalWorkflowSteps().find((step) => step.id === activeJournalStep);

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
        <h2>Guided Journal</h2>
        <p className="muted">Commander-guided writing flow for entries, reflection, review, growth evidence, timeline, search, and archive.</p>
      </section>

      <section className="guided-workflow-layout" aria-label="Journal guided workflow">
        <section className="commander-briefing-panel" aria-label="Journal Commander prompt">
          <p className="section-label">Commander</p>
          <h3>{activeStep?.label ?? 'Journal Entry'}</h3>
          <p className="muted">{getJournalCommanderPrompt(activeJournalStep)}</p>
        </section>
        <nav className="workflow-step-list" aria-label="Journal workflow steps">
          {getJournalWorkflowSteps().map((step) => (
            <button
              key={step.id}
              className={step.id === activeJournalStep ? 'workflow-step active' : 'workflow-step'}
              type="button"
              aria-current={step.id === activeJournalStep ? 'step' : undefined}
              onClick={() => setActiveJournalStep(step.id)}
            >
              <span>{step.label}</span>
              <small>{step.description}</small>
            </button>
          ))}
        </nav>

        {activeJournalStep === 'entry' ? (
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
        ) : null}

        {activeJournalStep === 'reflection' ? (
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
        ) : null}

        {activeJournalStep === 'trade-review' ? (
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
        ) : null}

        {activeJournalStep === 'growth' ? (
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
        ) : null}

        {activeJournalStep === 'timeline' ? <JournalTimelinePanel timeline={timeline} /> : null}
        {activeJournalStep === 'search' ? (
          <JournalSearchPanel
          searchText={searchText}
          onSearchTextChange={setSearchText}
          resultCount={searchResult.total}
          />
        ) : null}
        {activeJournalStep === 'archive' ? (
          <JournalArchivePanel
          journalEntries={journalEntries}
          archivedJournalEntries={archivedJournalEntries}
          onArchiveJournalEntry={onArchiveJournalEntry}
          />
        ) : null}
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

export interface DesktopAcademyDashboard {
  readonly totalGrowthEvents: number;
  readonly totalXp: number;
  readonly levelTitle: string;
  readonly recognitionCount: number;
  readonly activeDays: number;
  readonly longestDailyStreak: number;
  readonly hasGrowthEvidence: boolean;
  readonly recognitions: readonly AcademyRecognition[];
}

export function buildDesktopAcademyDashboard(growthEvents: readonly GrowthEvent[]): DesktopAcademyDashboard {
  const academyEvents = growthEvents.map(createAcademyGrowthEventFromJournal);
  const statistics = buildAcademyStatistics(academyEvents);
  const consistency = buildAcademyConsistency(academyEvents);
  const recognitions = buildAcademyRecognitions(academyEvents);

  return {
    totalGrowthEvents: statistics.totalGrowthEvents,
    totalXp: statistics.totalXp,
    levelTitle: statistics.level.title,
    recognitionCount: statistics.recognitionCount,
    activeDays: consistency.activeDays,
    longestDailyStreak: consistency.longestDailyStreak,
    hasGrowthEvidence: statistics.hasGrowthEvidence,
    recognitions,
  };
}

export function formatAcademyDashboardStatus(dashboard: DesktopAcademyDashboard): string {
  if (!dashboard.hasGrowthEvidence) return 'No Academy growth evidence yet';
  return `${dashboard.totalXp} XP across ${dashboard.totalGrowthEvents} growth events`;
}

export function AcademyRoom({ growthEvents }: { growthEvents: GrowthEvent[] }) {
  const dashboard = buildDesktopAcademyDashboard(growthEvents);

  return (
    <div className="room-layout" data-room-id="academy-room">
      <section className="command-center-header" aria-label="Academy room status">
        <p className="section-label">Academy Room</p>
        <h2>Academy Dashboard</h2>
        <p className="muted">Behavior growth, levels, recognition, statistics, and consistency from approved evidence.</p>
      </section>

      <section className="command-center-panels" aria-label="Academy dashboard">
        <section className="journal-panel" aria-label="Academy status">
          <p className="section-label">Status</p>
          <h3>Growth Standing</h3>
          <dl>
            <dt>XP</dt>
            <dd>{dashboard.totalXp}</dd>
            <dt>Level</dt>
            <dd>{dashboard.levelTitle}</dd>
            <dt>Growth Events</dt>
            <dd>{dashboard.totalGrowthEvents}</dd>
          </dl>
          <p className="muted">{formatAcademyDashboardStatus(dashboard)}</p>
        </section>

        <section className="journal-panel" aria-label="Academy recognition">
          <p className="section-label">Recognition</p>
          <h3>Quiet Recognition</h3>
          <p className="muted">{formatJournalCount(dashboard.recognitionCount, 'recognition', 'recognitions')}</p>
          <ol className="mission-timeline-list">
            {dashboard.recognitions.map((recognition) => (
              <li key={recognition.id}>
                <span>{recognition.title}</span>
                <strong>{recognition.type}</strong>
              </li>
            ))}
          </ol>
        </section>

        <section className="journal-panel" aria-label="Academy consistency">
          <p className="section-label">Consistency</p>
          <h3>Consistency Tracking</h3>
          <dl>
            <dt>Active Days</dt>
            <dd>{dashboard.activeDays}</dd>
            <dt>Longest Streak</dt>
            <dd>{dashboard.longestDailyStreak}</dd>
          </dl>
          <p className="muted">Consistency is derived from behavior evidence, not financial outcome.</p>
        </section>
      </section>
    </div>
  );
}

export function buildDesktopGuardianAlerts(): readonly GuardianAlert[] {
  return buildGuardianAlerts([
    {
      id: 'rule-monitoring',
      title: 'Rule Monitoring',
      detail: 'Guardian rules are explicit and deterministic.',
      severity: 'notice',
    },
    {
      id: 'risk-monitoring',
      title: 'Risk Monitoring',
      detail: 'Risk state is monitored from approved inputs only.',
      severity: 'caution',
    },
  ]);
}

export function buildDesktopGuardianLockoutState(): GuardianLockoutState {
  return evaluateGuardianLockout([
    {
      id: 'daily-limit',
      reason: 'Daily limit breached.',
      active: false,
    },
    {
      id: 'repeated-override',
      reason: 'Repeated override attempt.',
      active: false,
    },
  ]);
}

export function GuardianRoom() {
  const alerts = buildDesktopGuardianAlerts();
  const lockout = buildDesktopGuardianLockoutState();

  return (
    <div className="room-layout" data-room-id="guardian-room">
      <section className="command-center-header" aria-label="Guardian room status">
        <p className="section-label">Guardian Wing</p>
        <h2>Guardian Alerts</h2>
        <p className="muted">Protective alerts are typed, traceable, and not connected to notification systems yet.</p>
      </section>

      <section className="command-center-panels" aria-label="Guardian alerts">
        <section className="journal-panel" aria-label="Capital vault panel">
          <p className="section-label">CapitalVaultPanel</p>
          <h3>{lockout.status === 'locked' ? 'Vault Locked' : 'Vault Secure'}</h3>
          <p className="muted">{lockout.explanation}</p>
        </section>
        <section className="journal-panel" aria-label="Judgment reserve panel">
          <p className="section-label">JudgmentReservePanel</p>
          <h3>Judgment Reserve</h3>
          <p className="muted">Reserve state is represented by explicit Guardian alerts, not discretionary advice.</p>
        </section>
        <section className="journal-panel" aria-label="Success protocol panel">
          <p className="section-label">SuccessProtocolPanel</p>
          <h3>Success Protocol</h3>
          <p className="muted">Success protocols remain calm and protective until future workflows are approved.</p>
        </section>
        {alerts.map((alert) => (
          <section className="journal-panel" aria-label={alert.title} key={alert.id}>
            <p className="section-label">{alert.priority}</p>
            <h3>{alert.title}</h3>
            <p className="muted">{alert.message}</p>
            <dl>
              <dt>Source</dt>
              <dd>{alert.sourceId}</dd>
            </dl>
          </section>
        ))}
        <section className="journal-panel" aria-label="Guardian lockout">
          <p className="section-label">{lockout.status}</p>
          <h3>Lockout State</h3>
          <p className="muted">{lockout.explanation}</p>
          <dl>
            <dt>Active Rules</dt>
            <dd>{lockout.activeRuleIds.length}</dd>
          </dl>
        </section>
      </section>
    </div>
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

export function ArchiveRoom({
  archivedMissionSummaries,
  archivedJournalEntries,
  doctrineRecords,
}: {
  archivedMissionSummaries: LocalMissionArchiveSummary[];
  archivedJournalEntries: ArchivedJournalEntry[];
  doctrineRecords: DoctrineRecord[];
}) {
  const [archiveSearchText, setArchiveSearchText] = useState('');
  const eventInspections = buildDesktopArchiveEventInspections(archivedMissionSummaries, archivedJournalEntries);
  const sessionInspections = buildDesktopArchiveSessionInspections();
  const dashboard = buildDesktopArchiveDashboard(archivedMissionSummaries, archivedJournalEntries);
  const records = buildDesktopArchiveRecords(archivedMissionSummaries, archivedJournalEntries);
  const searchResults = searchArchiveRecords(records, { text: archiveSearchText });

  return (
    <div className="room-layout" data-room-id="archive-room">
      <section className="command-center-header" aria-label="Archive room status">
        <p className="section-label">Archive Room</p>
        <h2>Archive</h2>
        <p className="muted">Mission archive, Journal archive, and historical views.</p>
      </section>
      <section className="command-center-panels" aria-label="Archive workspace">
        <ArchiveSearchPanel
          searchText={archiveSearchText}
          onSearchTextChange={setArchiveSearchText}
          resultCount={searchResults.length}
        />
        <ArchiveDashboardPanel dashboard={dashboard} />
        <ArchiveCardPanel records={records} />
        <CampaignBookViewPanel summaries={archivedMissionSummaries} />
        <DoctrineRecordViewPanel doctrineRecords={doctrineRecords} />
        <MissionArchiveViewerPanel archiveSummaries={archivedMissionSummaries} />
        <ArchiveEventExplorerPanel eventInspections={eventInspections} />
        <ArchiveSessionExplorerPanel sessionInspections={sessionInspections} />
        <section className="journal-panel" aria-label="Journal archive overview">
          <p className="section-label">Journal Archive</p>
          <h3>Journal Archive</h3>
          <p className="muted">{formatJournalCount(archivedJournalEntries.length, 'archived journal entry', 'archived journal entries')}</p>
        </section>
      </section>
    </div>
  );
}

function ArchiveSearchPanel({
  searchText,
  onSearchTextChange,
  resultCount,
}: {
  searchText: string;
  onSearchTextChange: (value: string) => void;
  resultCount: number;
}) {
  return (
    <section className="journal-panel" aria-label="ArchiveSearch">
      <p className="section-label">ArchiveSearch</p>
      <h3>Archive Search</h3>
      <label>
        <span>Search Text</span>
        <input value={searchText} onChange={(event) => onSearchTextChange(event.target.value)} />
      </label>
      <p className="muted">{formatJournalCount(resultCount, 'archive result', 'archive results')}</p>
    </section>
  );
}

function ArchiveCardPanel({ records }: { records: readonly ArchiveIntelligenceRecord[] }) {
  return (
    <section className="journal-panel" aria-label="ArchiveCard">
      <p className="section-label">ArchiveCard</p>
      <h3>Archive Records</h3>
      <p className="muted">{formatJournalCount(records.length, 'archive record', 'archive records')}</p>
      <ol className="mission-archive-list">
        {records.slice(0, 3).map((record) => (
          <li key={record.id}>
            <span>{record.title}</span>
            <strong>{record.type}</strong>
            <time dateTime={record.occurredAt}>{record.occurredAt}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CampaignBookViewPanel({ summaries }: { summaries: readonly LocalMissionArchiveSummary[] }) {
  return (
    <section className="journal-panel" aria-label="CampaignBookView">
      <p className="section-label">CampaignBookView</p>
      <h3>Campaign Books</h3>
      <p className="muted">{formatJournalCount(summaries.length, 'mission campaign', 'mission campaigns')}</p>
    </section>
  );
}

function DoctrineRecordViewPanel({ doctrineRecords }: { doctrineRecords: readonly DoctrineRecord[] }) {
  return (
    <section className="journal-panel" aria-label="DoctrineRecordView">
      <p className="section-label">DoctrineRecordView</p>
      <h3>Doctrine Records</h3>
      <p className="muted">{formatJournalCount(doctrineRecords.length, 'doctrine record', 'doctrine records')}</p>
    </section>
  );
}

export function buildDesktopArchiveRecords(
  archivedMissionSummaries: readonly LocalMissionArchiveSummary[],
  archivedJournalEntries: readonly ArchivedJournalEntry[],
): readonly ArchiveIntelligenceRecord[] {
  const missionRecords: ArchiveIntelligenceRecord[] = archivedMissionSummaries.map((summary) => ({
    id: `mission:${summary.missionId}`,
    type: 'mission',
    title: summary.codename,
    summary: `${summary.eventCount} archived mission event${summary.eventCount === 1 ? '' : 's'}`,
    occurredAt: summary.archivedAt,
    tags: ['mission', 'archive'],
  }));

  const journalRecords: ArchiveIntelligenceRecord[] = archivedJournalEntries.map((entry) => ({
    id: `journal:${entry.id}`,
    type: 'journal',
    title: entry.rawEntry.entryDate,
    summary: entry.rawEntry.rawContent,
    occurredAt: entry.archivedAt,
    tags: ['journal', ...entry.metadata.tags],
  }));

  return [...missionRecords, ...journalRecords].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
}

export function buildDesktopArchiveDashboard(
  archivedMissionSummaries: readonly LocalMissionArchiveSummary[],
  archivedJournalEntries: readonly ArchivedJournalEntry[],
): ArchiveDashboardSummary {
  const records = buildDesktopArchiveRecords(archivedMissionSummaries, archivedJournalEntries);
  const eventInspections = buildDesktopArchiveEventInspections(archivedMissionSummaries, archivedJournalEntries);
  const sessionInspections = buildDesktopArchiveSessionInspections();

  return buildArchiveDashboard({
    records,
    searchResultCount: searchArchiveRecords(records, {}).length,
    timelineItemCount: filterArchiveTimeline(records, {}).length,
    eventInspections,
    sessionInspections,
    patterns: detectArchivePatterns(records),
    replayPreparation: prepareArchiveReplay(records, new Date(0).toISOString()),
  });
}

export function buildDesktopArchiveSessionInspections(): readonly ArchiveSessionInspection[] {
  return inspectArchiveSessions([]);
}

export function buildDesktopArchiveEventInspections(
  archivedMissionSummaries: readonly LocalMissionArchiveSummary[],
  archivedJournalEntries: readonly ArchivedJournalEntry[],
): readonly ArchiveEventInspection[] {
  const missionEvents: EventEnvelope[] = archivedMissionSummaries.map((summary) => ({
    id: `archive-event-${summary.missionId}`,
    type: 'mission.archived',
    version: 1,
    occurredAt: summary.archivedAt,
    source: 'archives',
    missionId: summary.missionId,
    priority: 'green',
    payload: {
      codename: summary.codename,
      eventCount: summary.eventCount,
    },
  }));

  const journalEvents: EventEnvelope[] = archivedJournalEntries.map((entry) => ({
    id: `archive-event-${entry.id}`,
    type: 'archive.artifact_written',
    version: 1,
    occurredAt: entry.archivedAt,
    source: 'archives',
    priority: 'green',
    payload: {
      entryDate: entry.rawEntry.entryDate,
      classificationStatus: entry.metadata.classificationStatus,
      tags: entry.metadata.tags,
    },
  }));

  return inspectArchiveEvents([...missionEvents, ...journalEvents].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt)));
}

function ArchiveEventExplorerPanel({ eventInspections }: { eventInspections: readonly ArchiveEventInspection[] }) {
  return (
    <section className="journal-panel" aria-label="Archive event explorer">
      <p className="section-label">Event Explorer</p>
      <h3>Archive Events</h3>
      <p className="muted">{formatJournalCount(eventInspections.length, 'event inspected', 'events inspected')}</p>
      {eventInspections.length > 0 ? (
        <ul className="mission-archive-list">
          {eventInspections.map((event) => (
            <li key={event.id}>
              <strong>{event.type}</strong>
              <span>{event.payloadPreview}</span>
              <time>{event.occurredAt}</time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No archive events available for inspection.</p>
      )}
    </section>
  );
}

function ArchiveDashboardPanel({ dashboard }: { dashboard: ArchiveDashboardSummary }) {
  return (
    <section className="journal-panel" aria-label="Archive dashboard">
      <p className="section-label">Archive Intelligence</p>
      <h3>Archive Dashboard</h3>
      <p className="muted">{dashboard.status === 'ready' ? 'Archive intelligence ready' : 'No archive intelligence evidence yet'}</p>
      <dl className="status-list">
        <div>
          <dt>Records</dt>
          <dd>{dashboard.recordCount}</dd>
        </div>
        <div>
          <dt>Events</dt>
          <dd>{dashboard.eventCount}</dd>
        </div>
        <div>
          <dt>Sessions</dt>
          <dd>{dashboard.sessionCount}</dd>
        </div>
        <div>
          <dt>Patterns</dt>
          <dd>{dashboard.patternCount}</dd>
        </div>
      </dl>
    </section>
  );
}

function ArchiveSessionExplorerPanel({ sessionInspections }: { sessionInspections: readonly ArchiveSessionInspection[] }) {
  return (
    <section className="journal-panel" aria-label="Archive session explorer">
      <p className="section-label">Session Explorer</p>
      <h3>Archive Sessions</h3>
      <p className="muted">{formatJournalCount(sessionInspections.length, 'session inspected', 'sessions inspected')}</p>
      {sessionInspections.length > 0 ? (
        <ul className="mission-archive-list">
          {sessionInspections.map((session) => (
            <li key={session.id}>
              <strong>{session.missionId}</strong>
              <span>{session.status}</span>
              <time>{session.startedAt}</time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No archive sessions available for inspection.</p>
      )}
    </section>
  );
}

export function DoctrineRoom({
  doctrineRecords,
  doctrineHistory,
  onPromoteDoctrineCandidate,
}: {
  doctrineRecords: DoctrineRecord[];
  doctrineHistory: DoctrineHistoryEntry[];
  onPromoteDoctrineCandidate: (record: DoctrineRecord, historyEntry: DoctrineHistoryEntry) => void;
}) {
  return (
    <div className="room-layout" data-room-id="doctrine-room">
      <section className="command-center-header" aria-label="Doctrine room status">
        <p className="section-label">Doctrine Chamber</p>
        <h2>Doctrine Review</h2>
        <p className="muted">Review lessons, candidates, accepted doctrine, history, differences, and trading plan references.</p>
      </section>
      <section className="guided-workflow-layout" aria-label="Doctrine workspace">
        <section className="commander-briefing-panel" aria-label="Doctrine Commander prompt">
          <p className="section-label">Commander</p>
          <h3>Review the lesson before it becomes law.</h3>
          <p className="muted">Doctrine updates only after explicit review. Candidate promotion remains manual and evidence-bound.</p>
        </section>
        <DoctrineViewerPanel doctrineRecords={doctrineRecords} />
        <DoctrinePromotionPanel onPromoteDoctrineCandidate={onPromoteDoctrineCandidate} />
        <DoctrineDiffPanel diff={buildDoctrineDiffPreview(doctrineRecords)} />
        <TradingPlanDoctrinePanel references={buildDefaultTradingPlanDoctrineReferences(doctrineRecords)} />
        <DoctrineHistoryPanel historyEntries={doctrineHistory} />
      </section>
    </div>
  );
}

function DoctrinePromotionPanel({
  onPromoteDoctrineCandidate,
}: {
  onPromoteDoctrineCandidate: (record: DoctrineRecord, historyEntry: DoctrineHistoryEntry) => void;
}) {
  const [candidateId, setCandidateId] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [archiveId, setArchiveId] = useState('');
  const [excerpt, setExcerpt] = useState('');

  async function handlePromotion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await promoteDesktopDoctrineCandidate({
      candidateId,
      title,
      summary,
      sourceId,
      archiveId,
      excerpt,
    });

    if (result === undefined) return;

    onPromoteDoctrineCandidate(result.record, result.historyEntry);
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

function DoctrineHistoryPanel({ historyEntries }: { historyEntries: DoctrineHistoryEntry[] }) {
  return (
    <section className="journal-panel" aria-label="Doctrine history">
      <p className="section-label">History</p>
      <h3>Doctrine History</h3>
      {historyEntries.length === 0 ? (
        <p className="muted">No doctrine history has been recorded yet.</p>
      ) : (
        <div className="timeline-list">
          {historyEntries.map((entry) => (
            <article className="timeline-item" key={entry.id}>
              <strong>{entry.action}</strong>
              <span>{entry.summary}</span>
              <span>
                Doctrine {entry.doctrineId} at {entry.occurredAt}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function DoctrineDiffPanel({ diff }: { diff: DoctrineDiff | undefined }) {
  return (
    <section className="journal-panel" aria-label="Doctrine diff">
      <p className="section-label">Diff</p>
      <h3>Doctrine Diff</h3>
      {diff === undefined ? (
        <p className="muted">At least two doctrine records are required for comparison.</p>
      ) : diff.changed ? (
        <div className="timeline-list">
          {diff.changes.map((change) => (
            <article className="timeline-item" key={change.field}>
              <strong>{change.field}</strong>
              <span>Before: {change.before}</span>
              <span>After: {change.after}</span>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">No doctrine differences found between the selected records.</p>
      )}
    </section>
  );
}

export function buildDoctrineDiffPreview(records: readonly DoctrineRecord[]): DoctrineDiff | undefined {
  if (records.length < 2) return undefined;

  const [firstRecord, secondRecord] = records;

  if (firstRecord === undefined || secondRecord === undefined) return undefined;

  return diffDoctrineRecords(firstRecord, secondRecord);
}

export function buildDefaultTradingPlanDoctrineReferences(
  records: readonly DoctrineRecord[],
): TradingPlanDoctrineReference[] {
  return buildTradingPlanDoctrineReferences({
    id: 'primary-trading-plan',
    name: 'Primary Trading Plan',
  }, records);
}

function TradingPlanDoctrinePanel({ references }: { references: TradingPlanDoctrineReference[] }) {
  return (
    <section className="journal-panel" aria-label="Trading plan doctrine references">
      <p className="section-label">Trading Plan</p>
      <h3>Plan Doctrine</h3>
      {references.length === 0 ? (
        <p className="muted">No accepted doctrine is available for the trading plan yet.</p>
      ) : (
        <div className="timeline-list">
          {references.map((reference) => (
            <article className="timeline-item" key={reference.doctrineId}>
              <strong>{reference.title}</strong>
              <span>{reference.summary}</span>
              <span>
                {reference.tradingPlanName} references {reference.doctrineId}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
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

export function getJournalWorkflowSteps(): JournalWorkflowStep[] {
  return [...journalWorkflowSteps];
}

export function getJournalCommanderPrompt(step: JournalWorkflowStepId): string {
  if (step === 'entry') return 'Start with the record. Capture what happened before judging it.';
  if (step === 'reflection') return 'Now name the behavior. Headquarters records discipline before outcome.';
  if (step === 'trade-review') return 'Review the trade as evidence. No prediction, no scoreboard.';
  if (step === 'growth') return 'Convert proven journal evidence into a growth event when the evidence is ready.';
  if (step === 'timeline') return 'Read the sequence. The archive speaks in order.';
  if (step === 'search') return 'Search the record when you need evidence, not memory.';
  return 'Archive only completed evidence. Keep raw journal history intact.';
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

export interface CommanderMessage {
  readonly title: string;
  readonly body: string;
}

export function getCommanderMessage(mission?: ActiveMission): CommanderMessage {
  const currentState = parseMissionState(mission?.currentState);

  if (currentState === undefined) {
    return {
      title: 'Report accepted. Stand by for tasking.',
      body: 'Create a mission in the Mission Room. Headquarters will guide one phase at a time.',
    };
  }

  if (currentState === 'idle') {
    return {
      title: 'Mission created. Begin briefing.',
      body: 'Review the objective and move the mission into briefing when you are ready.',
    };
  }

  if (currentState === 'briefing') {
    return {
      title: 'Briefing in progress.',
      body: 'Confirm the mission objective before observation begins.',
    };
  }

  if (currentState === 'ready') {
    return {
      title: 'Ready for observation.',
      body: 'Begin observation. Waiting is work; do not rush authorization.',
    };
  }

  if (currentState === 'observation') {
    return {
      title: 'Observe without participating.',
      body: 'Complete observation only when the mission has enough evidence for authorization.',
    };
  }

  if (currentState === 'authorization') {
    return {
      title: 'Authorization required.',
      body: 'Provide justification and invalidation before deployment can be declared.',
    };
  }

  if (currentState === 'deployed') {
    return {
      title: 'Mission deployed.',
      body: 'Execute the authorized plan, then request return to base.',
    };
  }

  if (currentState === 'return_to_base') {
    return {
      title: 'Return to base.',
      body: 'Capture behavior, discipline, and the lesson before archive.',
    };
  }

  if (currentState === 'debrief') {
    return {
      title: 'Debrief complete.',
      body: 'Archive the mission so the record becomes institutional memory.',
    };
  }

  return {
    title: 'Mission archived.',
    body: 'This mission is complete. Review history or create the next mission when appropriate.',
  };
}

export function buildVisibleMissionLifecycleSteps(mission?: ActiveMission): MissionLifecycleStep[] {
  return buildMissionLifecycleSteps(mission).filter((step) => step.status !== 'pending');
}

export function getMissionPhaseWorkspaceTitle(mission?: ActiveMission): string {
  const currentState = parseMissionState(mission?.currentState);
  if (currentState === undefined) return 'Mission Creation';
  return formatMissionStateForDisplay(currentState);
}

export function getMissionPhaseWorkspaceDescription(mission?: ActiveMission): string {
  const currentState = parseMissionState(mission?.currentState);

  if (currentState === undefined) return 'Create the mission before Headquarters unlocks lifecycle phases.';
  if (currentState === 'authorization') return 'Authorization requires operator justification and invalidation.';
  if (currentState === 'return_to_base') return 'Return to base requires behavior-first debrief evidence.';
  if (currentState === 'archived') return 'The mission is archived and available for historical review.';

  return getMissionNextAction(mission).description;
}

export function getMissionNotificationSummary(
  activeMission: ActiveMission | undefined,
  missionHistory: readonly ActiveMission[],
): string {
  if (activeMission === undefined) return 'No active mission';
  if (activeMission.currentState === 'archived') return 'Mission archived';
  return `${missionHistory.length} mission record${missionHistory.length === 1 ? '' : 's'} tracked`;
}

export function formatRecentGrowthHighlight(growthEvents: readonly GrowthEvent[]): string {
  const latest = growthEvents[growthEvents.length - 1];

  if (latest === undefined) return 'No growth highlights yet';
  return latest.title;
}

export function formatRecentDoctrineHighlight(doctrineRecords: readonly DoctrineRecord[]): string {
  const latest = doctrineRecords[doctrineRecords.length - 1];

  if (latest === undefined) return 'No doctrine highlights yet';
  return latest.title;
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
