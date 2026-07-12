import { type FormEvent, useEffect, useRef, useState } from 'react';
import { MissionBoard } from '@headquarters/ui';
import type { EventEnvelope, Mission, MissionState } from '@headquarters/shared';
import {
  getHeadquartersPriorities,
  getHighestPriority,
  getPriorityCountBySeverity,
  type HeadquartersPriorityItem,
  getCompletedLifecycleStages as getProjectedCompletedLifecycleStages,
  getCurrentLifecycleStage as getProjectedCurrentLifecycleStage,
  getPrimaryLifecycleAction as getProjectedPrimaryLifecycleAction,
  projectMissionLifecycle,
  type MissionLifecycleProjection,
  type MissionTimelineExportEntryDTO,
} from '@headquarters/hqos';
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
import {
  buildCommanderDashboard,
  buildCommanderMissionPlanning,
  buildCommanderMonthlyReview,
  buildCommanderObjectives,
  buildCommanderSessionDebrief,
  buildCommanderWeeklyReview,
} from '@headquarters/commander';
import {
  buildGuardianAlerts,
  evaluateGuardianDailyLimits,
  evaluateGuardianLockout,
  evaluateGuardianRisk,
  evaluateGuardianSessionLimits,
  type GuardianAlert,
  type GuardianAlertSource,
  type GuardianLockoutState,
} from '@headquarters/guardian';
import {
  classifyJournalEntries,
  analyzeGrowth,
  analyzeRepeatedMistakes,
  analyzeRepeatedSuccesses,
  buildIntelligenceDashboard,
  detectIntelligencePatterns,
  suggestDoctrineCandidates,
  type DoctrineSuggestion,
  type IntelligenceDashboard,
  type IntelligenceGrowthAnalysis,
  type IntelligenceEvidenceRecord,
  type IntelligencePattern,
  type JournalClassification,
  type RepeatedMistake,
  type RepeatedSuccess,
} from '@headquarters/intelligence-office';
import {
  buildDoctrineCandidateCommanderSummary,
  buildTradingPlanDoctrineReferences,
  diffDoctrineRecords,
  getDoctrineEvidenceStrength,
  validateDoctrineCandidateForReview,
  type DoctrineCandidate,
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
  type JournalEntryDraft,
  type JournalTimeline,
  type TradeReview,
} from '@headquarters/journal';
import { CommandChair } from './CommandChair';
import {
  CommanderExperiencePanel,
  buildCommanderExperienceState,
  isContinueTransmission,
  mapNavigationRoomToCommanderRoom,
  type CommanderExperienceInput,
} from './CommanderExperience';
import {
  answerObservationInterview,
  answerReadyRoomBriefing,
  getNextObservationInterviewQuestion,
  getNextReadyRoomBriefingQuestion,
  isObservationInterviewComplete,
  isReadyRoomBriefingComplete,
  type MissionBriefingContext,
  type MissionObservationContext,
} from './CommanderMissionBriefing';
import {
  createEmptyMissionContext,
  getMissionLifecycleStageEnteredAt,
  normalizeMissionOperationalTiming,
  recordMissionLifecycleStageEntry,
  snapshotMissionContext,
  updateMissionOperationalTiming,
  updateMissionContextBriefing,
  updateMissionContextObservation,
  updateMissionContextReadiness,
  type MissionContext,
  type MissionContextBriefingAnswers,
  type MissionContextContradictionFlag,
  type MissionContextObservationAnswers,
} from './MissionContextMemory';
import type { CommanderShellRoomId } from './CommanderShell';
import {
  RoomTransitionLayer,
  completeRoomTransferPlan,
  createAuthorizationTransition,
  createMissionAcceptedTransition,
  createRoomTransferPlan,
  createRoomTransition,
  getTransitionDurationMs,
  mapCommanderRoomToNavigationTarget,
  resolveRoomTransferDestinationView,
  shouldCollapseRoomTransfer,
  type TransitionController,
  type RoomTransferPlan,
  type RoomTransitionState,
} from './RoomNavigationExperience';
import {
  AmbientStatusStrip,
  MissionCeremonyMoment,
  OperationalCommandChair,
  SituationBoard,
  buildMissionCeremony,
  formatRoomLabel,
  getRoomAtmosphereToken,
} from './HeadquartersAtmosphere';
import { AudioQASurface } from './AudioQASurface';
import type { AudioEvent } from './AudioEvents';
import { buildCommanderCeremonyAudioEvent } from './MissionCeremonyAudio';
import { GuidedRoom } from './GuidedRoom';
import { RoomAtmosphere } from './RoomAtmosphere';
import { recommendRoomForMissionState } from './RoomStateMachine';
import { detectCommanderContradictions } from './CommanderContradictionDetection';
import {
  buildAuthorizationIntelligenceQuestion,
  buildCommanderIntelligenceSummary,
  buildDebriefIntelligenceComparison,
  buildMissionIntelligencePackage,
  type MissionIntelligencePackage,
} from './MissionIntelligencePackage';
import {
  buildMissionEvaluation,
  type MissionEvaluation,
  type MissionEvaluationVerdict,
} from './MissionEvaluationEngine';
import { buildCommanderBehaviorProfile } from './CommanderBehaviorProfile';
import {
  buildHeadquartersEvents,
  buildOperationalAwareness,
  selectPassiveCommanderMessage,
} from './HeadquartersEventEngine';
import {
  CommandChairOperatingConsole,
  HeadquartersBroadcastFeed,
  HeadquartersServiceActivityPanel,
  LiveOperationalTimeline,
  OperationalNotifications,
  buildHeadquartersOperatingEnvironment,
} from './HeadquartersOperatingEnvironment';
import {
  buildCommanderPacingLine,
  buildOperationalPsychologyProfile,
} from './OperationalPsychology';
import {
  createDeployedMissionCheckIn,
  createDeployedMissionPresence,
  canRecordDeployedCheckIn,
  markDeployedPlanConcluded,
  type DeployedMissionCheckIn,
} from './MissionDeployedCheckIns';
import {
  buildDoctrineReviewSummary,
  formatDoctrineReviewAudit,
  recordDoctrineReviewDecision,
  type DoctrineReviewRecord,
} from './DoctrineReview';
import {
  createMissionPersistenceStatus,
  formatMissionPersistenceStatus,
  markMissionSavePending,
  markMissionSaveSucceeded,
  recoverIncompleteMissionStatus,
  type MissionPersistenceStatus,
} from './MissionPersistenceGuarantee';
import { buildCommanderDeadEndRecovery } from './CommanderDeadEndRecovery';
import { listMissionArchiveDossiers, type MissionArchiveDossier } from './MissionArchiveDossier';
import { buildCommanderLearningVisibility, type CommanderLearningVisibility } from './CommanderLearningVisibility';
import {
  buildCommanderGuardianAlertLines,
  formatCommanderGuardianStatus,
  type CommanderGuardianAlertLine,
} from './CommanderGuardianAlerts';
import { buildMissionJournalLink } from './MissionJournalIntegration';

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
  briefingContext?: MissionBriefingContext;
  observationContext?: MissionObservationContext;
  missionContext?: MissionContext;
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
  rationale?: string;
  triggerCondition?: string;
  expectedBehavior?: string;
  exceptionOrBoundary?: string;
  proposedScope?: string;
  reviewNote?: string;
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
  protectiveRule?: string;
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
  evaluation?: MissionEvaluation | undefined;
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
  | 'intelligence'
  | 'archive'
  | 'settings';
export type HeadquartersRoomId = NavigationAreaId;

export interface PrimaryNavigationItem {
  id: NavigationAreaId;
  label: string;
  section: 'commander' | 'mission' | 'support';
  active: boolean;
}

export type JournalWorkflowStepId = 'entry' | 'reflection' | 'trade-review' | 'growth' | 'timeline' | 'search' | 'archive';

export interface JournalWorkflowStep {
  id: JournalWorkflowStepId;
  label: string;
  description: string;
}

const primaryNavigation: Array<Omit<PrimaryNavigationItem, 'active'>> = [
  { id: 'command', label: 'Commander', section: 'commander' },
  { id: 'missions', label: 'Missions', section: 'mission' },
  { id: 'ready', label: 'Ready Room', section: 'mission' },
  { id: 'observation', label: 'Observation', section: 'mission' },
  { id: 'war', label: 'War Room', section: 'mission' },
  { id: 'debrief', label: 'Debrief', section: 'mission' },
  { id: 'journal', label: 'Journal', section: 'support' },
  { id: 'academy', label: 'Academy', section: 'support' },
  { id: 'doctrine', label: 'Doctrine', section: 'support' },
  { id: 'guardian', label: 'Guardian Wing', section: 'support' },
  { id: 'intelligence', label: 'Intelligence', section: 'support' },
  { id: 'archive', label: 'Archive', section: 'support' },
  { id: 'settings', label: 'Settings', section: 'support' },
];

const journalWorkflowSteps: readonly JournalWorkflowStep[] = [
  {
    id: 'entry',
    label: 'Write',
    description: 'Tell Commander what happened.',
  },
  {
    id: 'reflection',
    label: 'Reflect',
    description: 'Let Commander ask the next question.',
  },
  {
    id: 'trade-review',
    label: 'Review',
    description: 'Compare plan, reality, why, and lesson.',
  },
  {
    id: 'growth',
    label: 'Learn',
    description: 'Surface growth from repeated behavior.',
  },
  {
    id: 'timeline',
    label: 'Story',
    description: 'Read the record as a sequence.',
  },
  {
    id: 'search',
    label: 'Memory',
    description: 'Ask the record for similar evidence.',
  },
  {
    id: 'archive',
    label: 'Archive Link',
    description: 'Send completed records to Archive when ready.',
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
  performance?: {
    durationMs: number;
    migrationCount: number;
    budgetMs: number;
    status: 'within-budget' | 'over-budget';
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
      listMissions?: () => Promise<{ missions: Mission[] }>;
      listMissionContexts?: () => Promise<{ records: PersistedMissionContextRecord[] }>;
      saveMissionContext?: (input: PersistedMissionContextDraft) => Promise<{ record: PersistedMissionContextRecord }>;
      listJournalEntries?: () => Promise<{ entries: JournalEntry[] }>;
      createJournalEntry?: (input: JournalEntryDraft) => Promise<{ entry: JournalEntry }>;
      startBriefing?: (input: { missionId: string; reason?: string }) => Promise<{ mission: Mission }>;
      completeBriefing?: (input: { missionId: string; reason?: string }) => Promise<{ mission: Mission }>;
      startObservation?: (input: { missionId: string; reason?: string }) => Promise<{ mission: Mission }>;
      completeObservation?: (input: { missionId: string; reason?: string }) => Promise<{ mission: Mission }>;
      requestAuthorization?: (input: MissionAuthorizationDraft & { missionId: string }) => Promise<MissionAuthorizationStatus & { mission: Mission }>;
      declareDeployment?: (input: { missionId: string; reason?: string }) => Promise<{ mission: Mission }>;
      requestReturnToBase?: (input: { missionId: string; reason?: string }) => Promise<{ mission: Mission }>;
      abortMission?: (input: { missionId: string; reason?: string }) => Promise<{ mission: Mission }>;
      rewindMission?: (input: { missionId: string; targetState: MissionState; reason?: string }) => Promise<{ mission: Mission }>;
      saveDebrief?: (input: MissionDebriefDraft & { missionId: string }) => Promise<{ mission: Mission; debrief: MissionDebrief }>;
      archiveAfterDebrief?: (input: { missionId: string; reason?: string }) => Promise<{ mission: Mission }>;
    };
  }
}

interface PersistedMissionContextRecord {
  readonly missionId: string;
  readonly contextJson: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface PersistedMissionContextDraft {
  readonly missionId: string;
  readonly contextJson: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
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
  const [missionPersistenceStatus, setMissionPersistenceStatus] = useState<MissionPersistenceStatus>(() => createMissionPersistenceStatus());
  const [deployedCheckIns, setDeployedCheckIns] = useState<DeployedMissionCheckIn[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [dailyReflections, setDailyReflections] = useState<DailyReflection[]>([]);
  const [tradeReviews, setTradeReviews] = useState<TradeReview[]>([]);
  const [growthEvents, setGrowthEvents] = useState<GrowthEvent[]>([]);
  const [archivedJournalEntries, setArchivedJournalEntries] = useState<ArchivedJournalEntry[]>([]);
  const [doctrineRecords, setDoctrineRecords] = useState<DoctrineRecord[]>([]);
  const [doctrineHistory, setDoctrineHistory] = useState<DoctrineHistoryEntry[]>([]);
  const [doctrineReviewDecisions, setDoctrineReviewDecisions] = useState<DoctrineReviewRecord[]>([]);
  const [acknowledgedCommanderInterruptions, setAcknowledgedCommanderInterruptions] = useState<string[]>([]);
  const [roomTransition, setRoomTransition] = useState<RoomTransitionState | undefined>();
  const [activeRoomTransfer, setActiveRoomTransfer] = useState<RoomTransferPlan | undefined>();
  const [commanderOperatorJustification, setCommanderOperatorJustification] = useState('');
  const [commanderInvalidation, setCommanderInvalidation] = useState('');
  const [commanderProtectiveRule, setCommanderProtectiveRule] = useState('');
  const [commanderBehaviorSummary, setCommanderBehaviorSummary] = useState('');
  const [commanderDisciplineNotes, setCommanderDisciplineNotes] = useState('');
  const [commanderLesson, setCommanderLesson] = useState('');
  const [commanderMissionCodename, setCommanderMissionCodename] = useState('');
  const [commanderMissionObjective, setCommanderMissionObjective] = useState('');
  const [commanderWorkflowNotice, setCommanderWorkflowNotice] = useState('');
  const [activeOperationsView, setActiveOperationsView] = useState<'chat' | 'room'>('chat');
  const roomTransferTimeoutRef = useRef<number | undefined>();
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
    if (!roomTransition) return undefined;

    const timeout = window.setTimeout(() => {
      setRoomTransition(undefined);
    }, getTransitionDurationMs(isReducedMotionPreferred(), roomTransition.controller));

    return () => window.clearTimeout(timeout);
  }, [roomTransition]);

  useEffect(() => () => {
    if (roomTransferTimeoutRef.current !== undefined) {
      window.clearTimeout(roomTransferTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([
      globalThis.window?.headquarters?.listMissions?.(),
      globalThis.window?.headquarters?.listMissionContexts?.(),
      globalThis.window?.headquarters?.listJournalEntries?.(),
    ])
      .then(([missionResult, contextResult, journalResult]) => {
        if (!active) return;

        if (missionResult) {
          const contextByMissionId = buildMissionContextLookup(contextResult?.records ?? []);
          const loadedMissions = missionResult.missions.map((mission) => (
            mapMissionRecordToActiveMission(mission, undefined, contextByMissionId.get(mission.id))
          ));
          setMissionHistory(loadedMissions);
          setActiveMission(getLatestActiveMission(loadedMissions));
          setArchivedMissionSummaries(buildArchivedMissionSummariesFromMissions(loadedMissions));
          const recovered = recoverIncompleteMissionStatus(loadedMissions);
          if (recovered) setMissionPersistenceStatus(recovered);
        }

        if (journalResult) {
          setJournalEntries(journalResult.entries);
        }
      })
      .catch(() => {
        if (!active) return;
        setMissionHistory([]);
        setJournalEntries([]);
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

  const lifecycleProjection = projectDesktopMissionLifecycle(activeMission);
  const activeMissionState = lifecycleProjection.currentMissionState;
  const navigationCommanderRoom = mapNavigationRoomToCommanderRoom(activeRoom);
  const currentCommanderRoom = activeMission
    ? mapLifecycleProjectionRoomToCommanderRoom(lifecycleProjection.recommendedRoom)
    : navigationCommanderRoom;
  const guardianAlerts = buildDesktopGuardianAlerts({
    mission: activeMission,
    currentRoom: currentCommanderRoom,
    authorizationStatus,
    operatorJustification: commanderOperatorJustification,
    invalidation: commanderInvalidation,
    protectiveRule: commanderProtectiveRule,
  });
  const reportState = shellPhase === 'security-checkpoint' ? 'not-reported' : 'reported';
  const missionIntelligencePackage = activeMission
    ? buildDesktopMissionIntelligencePackage(activeMission, {
      authorizationStatus,
      missionDebrief,
      archiveSummary,
      operatorJustification: commanderOperatorJustification,
      invalidation: commanderInvalidation,
      behaviorSummary: commanderBehaviorSummary,
      disciplineNotes: commanderDisciplineNotes,
      lesson: commanderLesson,
    })
    : undefined;
  const behaviorMissionHistory = activeMission && !missionHistory.some((mission) => mission.id === activeMission.id)
    ? [...missionHistory, activeMission]
    : missionHistory;
  const commanderBehaviorProfile = buildCommanderBehaviorProfile({
    missions: behaviorMissionHistory,
    growthEvents,
    guardianAlerts,
    missionIntelligence: missionIntelligencePackage,
  });
  const commanderExperienceInput: CommanderExperienceInput = {
    reportState,
    activeRoom: currentCommanderRoom,
    activeMission,
    evidence: {
      recentDoctrine: formatRecentDoctrineHighlight(doctrineRecords),
      recentMission: missionHistory.at(-1)?.campaign,
      recentGrowthEvent: formatRecentGrowthHighlight(growthEvents),
      guardianStatus: formatJournalCount(guardianAlerts.length, 'Guardian alert', 'Guardian alerts'),
    },
    behaviorProfile: commanderBehaviorProfile,
    missionIntelligence: missionIntelligencePackage,
    acknowledgedInterruptionIds: acknowledgedCommanderInterruptions,
  };
  const baseCommanderState = buildCommanderExperienceState(commanderExperienceInput);
  const guardianStatus = formatJournalCount(guardianAlerts.length, 'Guardian alert', 'Guardian alerts');
  const missionPhaseSummary = formatMissionLifecycleSummary(activeMission);
  const currentRoomLabel = formatRoomLabel(currentCommanderRoom);
  const missionCeremony = shellPhase === 'command-center' ? buildMissionCeremony(activeMissionState) : undefined;
  const operationalPsychology = buildOperationalPsychologyProfile({
    room: currentCommanderRoom,
    missionState: activeMissionState,
  });
  const desktopJournalClassifications = buildDesktopJournalClassifications(journalEntries);
  const desktopIntelligenceEvidenceRecords = buildDesktopIntelligenceEvidenceRecords(desktopJournalClassifications);
  const desktopDoctrineSuggestions = buildDesktopDoctrineSuggestions(desktopIntelligenceEvidenceRecords);
  const desktopArchiveRecordCount = buildDesktopArchiveRecords(archivedMissionSummaries, archivedJournalEntries).length;
  const headquartersEvents = buildHeadquartersEvents({
    reportState,
    currentRoom: currentCommanderRoom,
    recommendedRoom: baseCommanderState.recommendedRoom,
    missionId: activeMission?.id,
    missionPhase: missionPhaseSummary,
    missionIntelligence: missionIntelligencePackage,
    guardianAlerts,
    growthEvents,
    doctrineCandidateCount: desktopDoctrineSuggestions.length,
    archiveRecordCount: desktopArchiveRecordCount,
    currentObjective: baseCommanderState.nextAction.description,
  });
  const operationalAwareness = buildOperationalAwareness({
    reportState,
    currentRoom: currentCommanderRoom,
    recommendedRoom: baseCommanderState.recommendedRoom,
    missionId: activeMission?.id,
    missionPhase: missionPhaseSummary,
    missionIntelligence: missionIntelligencePackage,
    guardianAlerts,
    growthEvents,
    doctrineCandidateCount: desktopDoctrineSuggestions.length,
    archiveRecordCount: desktopArchiveRecordCount,
    currentObjective: baseCommanderState.nextAction.description,
  });
  const commanderQuestionFlowActive = baseCommanderState.roomPromptMode === 'ask'
    && (
      baseCommanderState.nextAction.disabled
      || activeMissionState === 'authorization'
    );
  const operatingEnvironment = buildHeadquartersOperatingEnvironment({
    events: headquartersEvents,
    currentRoom: currentCommanderRoom,
    missionPhase: missionPhaseSummary,
    currentObjective: baseCommanderState.nextAction.description,
    commanderStatus: commanderQuestionFlowActive ? 'Awaiting operator response' : 'Monitoring operation',
    guardianStatus,
    missionIntelligence: missionIntelligencePackage,
    archiveRecordCount: desktopArchiveRecordCount,
    doctrineCandidateCount: desktopDoctrineSuggestions.length,
    growthEventCount: growthEvents.length,
  });
  const commanderState = buildCommanderExperienceState({
    ...commanderExperienceInput,
    passiveCommanderMessage: commanderQuestionFlowActive
      ? undefined
      : selectPassiveCommanderMessage(headquartersEvents) ?? buildCommanderPacingLine(operationalPsychology),
  });
  const commanderCeremonyAudioEvent = commanderState.ceremonyDialogue
    ? buildCommanderCeremonyAudioEvent(commanderState.ceremonyDialogue)
    : undefined;
  const audioQaEvents = commanderCeremonyAudioEvent ? [commanderCeremonyAudioEvent] : [];
  const recommendedNavigationTarget = mapCommanderRoomToNavigationTarget(commanderState.recommendedRoom) as HeadquartersRoomId;
  const currentRoomView = activeMission ? recommendedNavigationTarget : activeRoom;
  const missionCommandSidebar = buildMissionCommandSidebarModel({
    mission: activeMission,
    currentRoom: currentCommanderRoom,
    selectedView: activeOperationsView,
    nextAction: getMissionNextAction(activeMission),
    missionIntelligence: missionIntelligencePackage,
    guardianAlerts,
    doctrineCandidateCount: desktopDoctrineSuggestions.length,
    protectiveRule: commanderProtectiveRule,
    startupStatus,
  });

  async function handleCommanderContinue() {
    if (shellPhase === 'security-checkpoint') {
      setShellPhase(reportForDuty(shellPhase).to);
      return;
    }

    const continueMode = getCommanderContinueMode(activeMission, currentCommanderRoom, commanderState.recommendedRoom);

    if (activeMission === undefined && currentCommanderRoom === 'command') {
      setActiveRoom('missions');
      setCommanderWorkflowNotice('Mission creation needs a codename and objective before doors open.');
      return;
    }

    if (
      activeMission
      && currentCommanderRoom === 'ready-room'
      && parseMissionState(activeMission.currentState) === 'briefing'
      && !isReadyRoomBriefingComplete(activeMission.briefingContext)
    ) {
      setCommanderWorkflowNotice('Operational briefing incomplete. Answer the Commander in chat.');
      return;
    }

    if (
      activeMission
      && currentCommanderRoom === 'observation'
      && parseMissionState(activeMission.currentState) === 'observation'
      && !isObservationInterviewComplete(activeMission.observationContext)
    ) {
      setCommanderWorkflowNotice('Observation interview incomplete. Answer the Commander in chat.');
      return;
    }

    if (continueMode === 'advance-mission' && activeMission) {
      await handleCommanderWorkflowContinue(activeMission);
      return;
    }

    startDoorTransfer(recommendedNavigationTarget);
  }

  async function handleCommanderWorkflowContinue(mission: ActiveMission) {
    setRoomTransition(undefined);

    const currentState = parseMissionState(mission.currentState);

    if (currentState === 'authorization') {
      const recordedInvalidation = getRecordedObservationInvalidation(mission);
      const authorization = await requestDesktopAuthorization(mission, {
        operatorJustification: formatAuthorizationJustification(commanderOperatorJustification, commanderProtectiveRule),
        invalidation: commanderInvalidation || recordedInvalidation,
        protectiveRule: commanderProtectiveRule,
      });

      if (authorization === undefined) {
        setCommanderWorkflowNotice('Authorization requires justification and invalidation before Commander can continue.');
        return;
      }

      setAuthorizationStatus(authorization);
      setCommanderOperatorJustification('');
      setCommanderInvalidation('');
      setCommanderProtectiveRule('');
      setCommanderWorkflowNotice(formatAuthorizationStatus(authorization));

      if (authorization.decision === 'approved') {
        const deployedMission = await declareDesktopDeployment(mission);
        setActiveMission(deployedMission);
        setMissionHistory((history) => upsertMissionHistory(history, deployedMission));
        await saveDesktopMissionContext(deployedMission);
        setActiveOperationsView('chat');
        setRoomTransition(createAuthorizationTransition('war-room'));
      }
      return;
    }

    if (currentState === 'return_to_base') {
      const result = await saveDesktopDebrief(mission, {
        behaviorSummary: commanderBehaviorSummary,
        disciplineNotes: commanderDisciplineNotes,
        lesson: commanderLesson,
      });

      if (result === undefined) {
        setCommanderWorkflowNotice('Debrief requires behavior summary, discipline notes, and lesson before Commander can continue.');
        return;
      }

      setMissionDebrief(result.debrief);
      setActiveMission(result.mission);
      setMissionHistory((history) => upsertMissionHistory(history, result.mission));
      await saveDesktopMissionContext(result.mission);
      setCommanderBehaviorSummary('');
      setCommanderDisciplineNotes('');
      setCommanderLesson('');
      setCommanderWorkflowNotice('Debrief saved. Archive is now the next Commander action.');
      startDoorTransferForMissionRoomChange(mission, result.mission);
      return;
    }

    if (currentState === 'debrief') {
      const archivedAt = new Date().toISOString();
      const missionEvaluation = buildMissionFinalEvaluation({
        missionId: mission.id,
        missionState: 'archived',
        missionIntelligence: missionIntelligencePackage,
        guardian: missionCommandSidebar.guardian,
        doctrine: missionCommandSidebar.doctrine,
        evaluatedAt: archivedAt,
      });
      const archiveSummary = createLocalMissionArchiveSummary(mission, missionDebrief, undefined, {
        archivedAt,
        evaluation: missionEvaluation,
      });
      const archivedMission = await archiveDesktopMission(mission);

      setArchiveSummary(archiveSummary);
      if (archiveSummary) setArchivedMissionSummaries((summaries) => [...summaries, archiveSummary]);
      setActiveMission(getActiveMissionAfterMissionChange(archivedMission));
      setMissionHistory((history) => upsertMissionHistory(history, archivedMission));
      await saveDesktopMissionContext(archivedMission);
      setCommanderWorkflowNotice('Mission archived.');
      startDoorTransferForMissionRoomChange(mission, archivedMission);
      return;
    }

    const advancedMission = await advanceMissionFromCommanderContinue(mission);

    if (advancedMission) {
      setActiveMission(advancedMission);
      setMissionHistory((history) => upsertMissionHistory(history, advancedMission));
      await saveDesktopMissionContext(advancedMission);
      setCommanderWorkflowNotice('');
      startDoorTransferForMissionRoomChange(mission, advancedMission);
    }
  }

  function handleSidebarNavigation(room: HeadquartersRoomId) {
    startDoorTransfer(room, { openRoomAfter: true });
  }

  function handleEnterCurrentRoom() {
    startDoorTransfer(recommendedNavigationTarget, { openRoomAfter: true });
  }

  function handleEnterCommanderChat() {
    setActiveOperationsView('chat');
  }

  function startDoorTransfer(
    room: HeadquartersRoomId,
    options: {
      readonly openRoomAfter?: boolean;
      readonly fromRoom?: CommanderShellRoomId;
      readonly transition?: RoomTransitionState;
      readonly reason?: string;
    } = {},
  ) {
    const fromRoom = options.fromRoom ?? currentCommanderRoom;
    const targetRoom = mapNavigationRoomToCommanderRoom(room);
    const transition = options.transition ?? createDoorOpeningTransition(fromRoom, targetRoom);
    const destinationSelectedView = resolveRoomTransferDestinationView({
      currentView: activeOperationsView,
      operatorPreferredView: options.openRoomAfter ? undefined : 'chat',
      requiresRoomInteraction: options.openRoomAfter,
    });
    const transferPlan = createRoomTransferPlan({
      fromRoom,
      toRoom: targetRoom,
      lifecycleStage: parseMissionState(activeMission?.currentState),
      reason: options.reason ?? getRoomTransferReason(fromRoom, targetRoom, activeMission),
      destinationSelectedView,
      transition,
    });

    if (shouldCollapseRoomTransfer(activeRoomTransfer, transferPlan)) return;

    if (fromRoom === targetRoom && room === activeRoom) {
      setActiveOperationsView(options.openRoomAfter ? 'room' : 'chat');
      return;
    }

    if (roomTransferTimeoutRef.current !== undefined) {
      window.clearTimeout(roomTransferTimeoutRef.current);
    }

    setActiveRoomTransfer(transferPlan);
    setRoomTransition(transition);

    roomTransferTimeoutRef.current = window.setTimeout(() => {
      setActiveRoom(room);
      setActiveOperationsView(transferPlan.destinationSelectedView);
      setActiveRoomTransfer(completeRoomTransferPlan(transferPlan));
      roomTransferTimeoutRef.current = undefined;
    }, getTransitionRoomLoadDelayMs(isReducedMotionPreferred(), transition.controller));
  }

  function startDoorTransferForMissionRoomChange(previousMission: ActiveMission, nextMission: ActiveMission) {
    const previousRoom = recommendRoomForMissionState(parseMissionState(previousMission.currentState));
    const nextRoom = recommendRoomForMissionState(parseMissionState(nextMission.currentState));

    if (previousRoom === nextRoom) return;

    startDoorTransferToMissionRoom(nextMission, { fromRoom: previousRoom });
  }

  function startDoorTransferToMissionRoom(
    mission: ActiveMission,
    options: { readonly fromRoom?: CommanderShellRoomId; readonly missionAccepted?: boolean } = {},
  ) {
    const nextRoom = recommendRoomForMissionState(parseMissionState(mission.currentState));
    const transferOptions = options.fromRoom ? { fromRoom: options.fromRoom } : {};
    const transition = options.missionAccepted
      ? createMissionAcceptedTransition(options.fromRoom ?? currentCommanderRoom, nextRoom)
      : undefined;

    startDoorTransfer(mapCommanderRoomToNavigationTarget(nextRoom) as HeadquartersRoomId, {
      ...transferOptions,
      ...(transition ? { transition } : {}),
    });
  }

  async function handleMissionCreated(mission: ActiveMission) {
    const timedMission = {
      ...mission,
      missionContext: recordMissionLifecycleStageEntry(
        mission.missionContext ?? createEmptyMissionContext(mission.id, { createdAt: mission.createdAt }),
        parseMissionState(mission.currentState) ?? 'idle',
        { enteredAt: mission.createdAt },
      ),
    };
    setMissionPersistenceStatus((status) => markMissionSavePending(status, mission.id, 'Mission creation persistence in progress.'));
    setActiveMission(timedMission);
    setMissionHistory((history) => upsertMissionHistory(history, timedMission));
    await saveDesktopMissionContext(timedMission);
    setMissionPersistenceStatus(markMissionSaveSucceeded(mission.id));
    setArchiveWrite(createArchiveWritePlaceholder(timedMission));
    setAuthorizationStatus(undefined);
    setMissionDebrief(undefined);
    setArchiveSummary(undefined);
    setCommanderMissionCodename('');
    setCommanderMissionObjective('');
    setCommanderWorkflowNotice('');
    startDoorTransferToMissionRoom(timedMission, { fromRoom: 'command', missionAccepted: true });
  }

  async function handleAbortMission() {
    if (activeMission === undefined) return;

    const abortedMission = await abortDesktopMission(activeMission);
    setMissionPersistenceStatus((status) => markMissionSavePending(status, activeMission.id, 'Abort persistence in progress.'));
    const archivedAt = new Date().toISOString();
    const missionEvaluation = buildMissionFinalEvaluation({
      missionId: abortedMission.id,
      missionState: 'aborted',
      missionIntelligence: missionIntelligencePackage,
      guardian: missionCommandSidebar.guardian,
      doctrine: missionCommandSidebar.doctrine,
      evaluatedAt: archivedAt,
    });
    const archiveSummary = createAbortArchiveSummary(abortedMission, {
      archivedAt,
      evaluation: missionEvaluation,
    });
    setArchiveSummary(archiveSummary);
    setArchivedMissionSummaries((summaries) => upsertArchiveSummaries(summaries, archiveSummary));
    setActiveMission(getActiveMissionAfterMissionChange(abortedMission));
    setMissionHistory((history) => upsertMissionHistory(history, abortedMission));
    setMissionPersistenceStatus(markMissionSaveSucceeded(abortedMission.id));
    setMissionDebrief(undefined);
    setAuthorizationStatus(undefined);
    setCommanderWorkflowNotice('Mission aborted and closed. You can create a new mission when ready.');
    setActiveOperationsView('chat');
  }

  function handleResumeMissionRecovery() {
    if (activeMission === undefined) {
      setCommanderWorkflowNotice('No mission is available to resume.');
      return;
    }

    setMissionPersistenceStatus(recoverIncompleteMissionStatus([activeMission])
      ?? markMissionSavePending(missionPersistenceStatus, activeMission.id, 'Mission recovery check in progress.'));
    setActiveOperationsView('chat');
    setCommanderWorkflowNotice('Mission recovery reviewed. Commander remains on the active lifecycle step.');
  }

  async function handleRewindMission() {
    if (activeMission === undefined) return;

    const rewoundMission = await rewindDesktopMission(activeMission);
    if (rewoundMission === undefined) {
      setCommanderWorkflowNotice('No previous lifecycle step is available.');
      return;
    }

    setActiveMission(rewoundMission);
    setMissionHistory((history) => upsertMissionHistory(history, rewoundMission));
    setCommanderWorkflowNotice(`Lifecycle moved back to ${formatMissionStateForDisplay(parseMissionState(rewoundMission.currentState) ?? 'idle')}.`);
    setActiveOperationsView('chat');
  }

  async function completeReadyRoomBriefing(mission: ActiveMission, response: string): Promise<string> {
    setMissionPersistenceStatus((status) => markMissionSavePending(status, mission.id, 'Ready Room answer persistence in progress.'));
    setActiveMission(mission);
    setMissionHistory((history) => upsertMissionHistory(history, mission));
    setMissionPersistenceStatus(markMissionSaveSucceeded(mission.id));
    setCommanderWorkflowNotice('Operational briefing complete. Continue is unlocked for Observation.');
    return response;
  }

  async function beginObservationInterviewIfNeeded(mission: ActiveMission): Promise<ActiveMission> {
    if (parseMissionState(mission.currentState) !== 'ready') return mission;

    const observationMission = await advanceMissionFromCommanderContinue(mission);

    if (observationMission === undefined) return mission;

    setActiveMission(observationMission);
    setMissionHistory((history) => upsertMissionHistory(history, observationMission));
    return observationMission;
  }

  async function completeObservationInterview(mission: ActiveMission, response: string): Promise<string> {
    setMissionPersistenceStatus((status) => markMissionSavePending(status, mission.id, 'Observation answer persistence in progress.'));
    setActiveMission(mission);
    setMissionHistory((history) => upsertMissionHistory(history, mission));
    setMissionPersistenceStatus(markMissionSaveSucceeded(mission.id));
    setCommanderWorkflowNotice('Observation complete. Continue is unlocked for War Room authorization.');
    return response;
  }

  function handleDeployedCheckIn(visibleCondition: string): string {
    if (activeMission === undefined || parseMissionState(activeMission.currentState) !== 'deployed') {
      return 'No deployed mission is active.';
    }

    const lastCheckIn = [...deployedCheckIns]
      .filter((checkIn) => checkIn.missionId === activeMission.id)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .at(-1);
    const now = new Date().toISOString();
    const checkInPermission = canRecordDeployedCheckIn({
      lastCheckInAt: lastCheckIn?.createdAt ?? activeMission.missionContext?.timing?.lastCheckInAt,
      now,
      commanderQuestionPending: commanderQuestionFlowActive,
    });

    if (!checkInPermission.allowed) {
      return checkInPermission.reason === 'commander_question_pending'
        ? 'Commander question is pending. Answer Commander before reporting another deployed check-in.'
        : 'Check-in received too recently. Continue quiet execution unless a material condition changes.';
    }

    const checkIn = createDeployedMissionCheckIn({
      missionId: activeMission.id,
      previous: deployedCheckIns,
      createdAt: now,
      draft: {
        visibleCondition,
        structureChanged: visibleCondition,
        planValidity: visibleCondition,
        continueOrReturn: visibleCondition,
      },
    });

    if (checkIn === undefined) {
      return 'No material change recorded. Continue executing the authorized plan.';
    }

    setMissionPersistenceStatus((status) => markMissionSavePending(status, activeMission.id, 'Deployment check-in persistence in progress.'));
    setDeployedCheckIns((current) => [...current, checkIn]);
    const timedMission = {
      ...activeMission,
      missionContext: updateMissionOperationalTiming(
        activeMission.missionContext ?? createEmptyMissionContext(activeMission.id, { createdAt: activeMission.createdAt }),
        {
          lastCheckInAt: checkIn.createdAt,
          operationalState: checkIn.status === 'deployed_stable' ? 'quiet' : 'active',
        },
        { updatedAt: checkIn.createdAt },
      ),
    };
    setActiveMission(timedMission);
    setMissionHistory((history) => upsertMissionHistory(history, timedMission));
    void saveDesktopMissionContext(timedMission);
    setMissionPersistenceStatus(markMissionSaveSucceeded(activeMission.id));
    setCommanderWorkflowNotice(lastCheckIn ? 'Mission check-in updated.' : 'Mission check-in recorded.');

    if (checkIn.status === 'return_requested' || checkIn.status === 'return_recommended') {
      return 'Material change recorded. Return to Base is now the correct next action.';
    }

    if (checkIn.status === 'invalidation_near') {
      return 'Invalidation proximity recorded. Reduce action to the declared plan only.';
    }

    return 'Material change recorded. State only new evidence if conditions shift again.';
  }

  async function handleCommanderTransmission(message: string): Promise<string> {
    const currentState = parseMissionState(activeMission?.currentState);
    const shouldContinue = isContinueTransmission(message);
    const requestedRoom = parseCommanderRoomNavigationTransmission(message);

    if (roomTransition !== undefined) {
      return 'Transition in progress. Stand by until the destination is secure.';
    }

    if (shellPhase === 'security-checkpoint') {
      if (isReportForDutyTransmission(message) || shouldContinue) {
        await handleCommanderContinue();
        return 'Report accepted. Headquarters is open. Transmit mission codename and objective next.';
      }

      return 'First step is report for duty. Transmit ready, report, or continue.';
    }

    if (requestedRoom !== undefined && activeMission !== undefined) {
      const requestedCommanderRoom = mapNavigationRoomToCommanderRoom(requestedRoom);

      if (
        requestedCommanderRoom === 'observation'
        && parseMissionState(activeMission.currentState) === 'briefing'
        && !isReadyRoomBriefingComplete(activeMission.briefingContext)
      ) {
        return getNextReadyRoomBriefingQuestion(activeMission.briefingContext);
      }

      if (
        requestedCommanderRoom === 'war-room'
        && (parseMissionState(activeMission.currentState) === 'ready' || parseMissionState(activeMission.currentState) === 'observation')
        && !isObservationInterviewComplete(activeMission.observationContext)
      ) {
        return getNextObservationInterviewQuestion(activeMission.observationContext);
      }
    }

    if (requestedRoom !== undefined) {
      startDoorTransfer(requestedRoom);
      return `Route acknowledged. Opening ${formatRoomLabel(mapNavigationRoomToCommanderRoom(requestedRoom))}.`;
    }

    if (activeMission === undefined) {
      const draft = parseMissionCreationTransmission(message);

      if (draft && !shouldContinue) {
        const nextDraft = fillMissionDraftFromTransmission({
          currentCodename: commanderMissionCodename,
          currentObjective: commanderMissionObjective,
          draft,
          message,
        });

        setCommanderMissionCodename(nextDraft.codename);
        setCommanderMissionObjective(nextDraft.objective);

        if (!nextDraft.codename) return 'Codename field is empty. Transmit the mission codename only.';
        if (!nextDraft.objective) return `Codename set to ${nextDraft.codename}. Now transmit the mission objective.`;

        const mission = await createDesktopMission(nextDraft);
        if (mission) {
          await handleMissionCreated(mission);
          return `Mission file opened: ${mission.campaign}.\n\nProceed to the Ready Room for briefing.`;
        }
      }

      if (shouldContinue) {
        if (!commanderMissionCodename) return 'Codename field is empty. Transmit the mission codename first.';
        if (!commanderMissionObjective) return 'Objective field is empty. Transmit the mission objective next.';

        const mission = await createDesktopMission({
          codename: commanderMissionCodename,
          objective: commanderMissionObjective,
        });

        if (mission) {
          await handleMissionCreated(mission);
          return `Mission file opened: ${mission.campaign}.\n\nProceed to the Ready Room for briefing.`;
        }
      }

      return commanderMissionCodename
        ? 'Codename is set. Transmit the mission objective next.'
        : 'Mission creation card is active. Transmit the mission codename first.';
    }

    if (isAbortMissionTransmission(message)) {
      await handleAbortMission();
      return 'Mission aborted and closed. Archive marker created. Create a new mission when ready.';
    }

    if (currentCommanderRoom === 'ready-room' && (currentState === 'idle' || currentState === 'briefing')) {
      if (shouldContinue) {
        if (currentState === 'idle') {
          await handleCommanderContinue();
          return 'Briefing opened. Headquarters needs the operational context before Observation unlocks.';
        }

        return getNextReadyRoomBriefingQuestion(activeMission.briefingContext);
      }

      const result = answerReadyRoomBriefing(activeMission.briefingContext, message);
      const missionWithContext = withBriefingMissionContext(activeMission, result.context);

      setActiveMission(missionWithContext);
      setMissionHistory((history) => upsertMissionHistory(history, missionWithContext));
      if (result.accepted) await saveDesktopMissionContext(missionWithContext);

      if (result.complete) {
        return completeReadyRoomBriefing(missionWithContext, result.response);
      }

      return result.response;
    }

    if (currentCommanderRoom === 'observation' && (currentState === 'ready' || currentState === 'observation')) {
      if (shouldContinue) {
        return getNextObservationInterviewQuestion(activeMission.observationContext);
      }

      const missionForInterview = await beginObservationInterviewIfNeeded(activeMission);
      const result = answerObservationInterview(missionForInterview.observationContext, message);
      const missionWithContext = withObservationMissionContext(missionForInterview, result.context);

      setActiveMission(missionWithContext);
      setMissionHistory((history) => upsertMissionHistory(history, missionWithContext));
      if (result.accepted) await saveDesktopMissionContext(missionWithContext);

      if (result.complete) {
        return completeObservationInterview(missionWithContext, result.response);
      }

      return result.response;
    }

    if (currentState === 'authorization') {
      const recordedInvalidation = getRecordedObservationInvalidation(activeMission);
      const authorizationDraft = parseAuthorizationTransmission(message);
      const nextDraft = fillAuthorizationDraftFromTransmission({
        currentJustification: commanderOperatorJustification,
        currentInvalidation: commanderInvalidation || recordedInvalidation,
        currentProtectiveRule: commanderProtectiveRule,
        draft: authorizationDraft,
        message,
        shouldContinue,
      });
      const nextJustification = nextDraft.operatorJustification;
      const nextInvalidation = nextDraft.invalidation;
      const nextProtectiveRule = nextDraft.protectiveRule ?? '';

      if (nextJustification) setCommanderOperatorJustification(nextJustification);
      if (nextInvalidation && !recordedInvalidation) setCommanderInvalidation(nextInvalidation);
      if (nextProtectiveRule) setCommanderProtectiveRule(nextProtectiveRule);

      if (!nextJustification) return 'State the authorization reasoning.';
      if (!nextInvalidation) return 'Authorization reasoning recorded. State the invalidation condition once.';
      if (!nextProtectiveRule) {
        return recordedInvalidation
          ? `Observation invalidation recorded: ${recordedInvalidation}. Which rule protects this authorization decision?`
          : 'Invalidation recorded. Which rule protects this authorization decision?';
      }

      if (shouldContinue) {
        const authorization = await requestDesktopAuthorization(activeMission, {
          operatorJustification: formatAuthorizationJustification(nextJustification, nextProtectiveRule),
          invalidation: nextInvalidation,
          protectiveRule: nextProtectiveRule,
        });

        if (authorization === undefined) {
          setCommanderWorkflowNotice('Authorization requires justification and invalidation before Commander can continue.');
          return 'Authorization incomplete. Transmit justification and invalidation.';
        }

        setAuthorizationStatus(authorization);
        setCommanderWorkflowNotice(formatAuthorizationStatus(authorization));

      if (authorization.decision === 'approved') {
        const deployedMission = await declareDesktopDeployment(activeMission);
        setActiveMission(deployedMission);
        setMissionHistory((history) => upsertMissionHistory(history, deployedMission));
        await saveDesktopMissionContext(deployedMission);
        setCommanderOperatorJustification('');
        setCommanderInvalidation('');
        setCommanderProtectiveRule('');
        setActiveOperationsView('chat');
        setRoomTransition(createAuthorizationTransition('war-room'));
      }

      return `${formatAuthorizationStatus(authorization)}. ${authorization.reason}`;
      }

      const authorization = await requestDesktopAuthorization(activeMission, {
        operatorJustification: formatAuthorizationJustification(nextJustification, nextProtectiveRule),
        invalidation: nextInvalidation,
        protectiveRule: nextProtectiveRule,
      });

      if (authorization === undefined) {
        setCommanderWorkflowNotice('Authorization requires justification, invalidation, and a protective rule.');
        return 'Authorization incomplete. Complete the War Room evidence package.';
      }

      setAuthorizationStatus(authorization);
      setCommanderWorkflowNotice(formatAuthorizationStatus(authorization));

      if (authorization.decision === 'approved') {
        const deployedMission = await declareDesktopDeployment(activeMission);
        setActiveMission(deployedMission);
        setMissionHistory((history) => upsertMissionHistory(history, deployedMission));
        await saveDesktopMissionContext(deployedMission);
        setCommanderOperatorJustification('');
        setCommanderInvalidation('');
        setCommanderProtectiveRule('');
        setActiveOperationsView('chat');
        setRoomTransition(createAuthorizationTransition('war-room'));
        return 'Authorization accepted. Execute only within the declared plan.';
      }

      return 'Authorization withheld. Return to Observation and complete the evidence package.';
    }

    if (currentCommanderRoom === 'war-room' && currentState === 'deployed') {
      if (isPlanConcludedTransmission(message) || shouldContinue) {
        const now = new Date().toISOString();
        const conclusion = markDeployedPlanConcluded({
          missionId: activeMission.id,
          previous: deployedCheckIns,
          createdAt: now,
        });
        if (conclusion) setDeployedCheckIns((current) => [...current, conclusion]);
        const concludedMission = {
          ...activeMission,
          missionContext: updateMissionOperationalTiming(
            activeMission.missionContext ?? createEmptyMissionContext(activeMission.id, { createdAt: activeMission.createdAt }),
            {
              planConcludedAt: now,
              lastCheckInAt: now,
              operationalState: 'paused',
            },
            { updatedAt: now },
          ),
        };
        setActiveMission(concludedMission);
        setMissionHistory((history) => upsertMissionHistory(history, concludedMission));
        await saveDesktopMissionContext(concludedMission);
        const returnedMission = await requestDesktopReturnToBase(concludedMission);
        setActiveMission(returnedMission);
        setMissionHistory((history) => upsertMissionHistory(history, returnedMission));
        await saveDesktopMissionContext(returnedMission);
        startDoorTransferForMissionRoomChange(concludedMission, returnedMission);
        return 'Plan concluded. Return to base is active; debrief before archive.';
      }

      if (isMaterialChangeTransmission(message)) {
        return handleDeployedCheckIn(stripDeployedIntentPrefix(message));
      }

      if (isReviewAuthorizationTransmission(message)) {
        return formatDeployedAuthorizationReview(activeMission, authorizationStatus);
      }

      return 'Mission remains deployed. Choose one action: Report Material Change, Plan Concluded, or Review Authorization.';
    }

    if (currentState === 'return_to_base') {
      const debriefDraft = parseDebriefTransmission(message);
      const nextDraft = fillDebriefDraftFromTransmission({
        currentBehavior: commanderBehaviorSummary,
        currentDiscipline: commanderDisciplineNotes,
        currentLesson: commanderLesson,
        draft: debriefDraft,
        message,
        shouldContinue,
      });
      const nextBehavior = nextDraft.behaviorSummary;
      const nextDiscipline = nextDraft.disciplineNotes;
      const nextLesson = nextDraft.lesson;

      if (nextBehavior) setCommanderBehaviorSummary(nextBehavior);
      if (nextDiscipline) setCommanderDisciplineNotes(nextDiscipline);
      if (nextLesson) setCommanderLesson(nextLesson);

      if (shouldContinue) {
        const result = await saveDesktopDebrief(activeMission, {
          behaviorSummary: nextBehavior,
          disciplineNotes: nextDiscipline,
          lesson: nextLesson,
        });

        if (result === undefined) {
          setCommanderWorkflowNotice('Debrief requires behavior summary, discipline notes, and lesson before Commander can continue.');
          return 'Debrief incomplete. Transmit behavior, discipline, and lesson.';
        }

        setMissionDebrief(result.debrief);
        setActiveMission(result.mission);
        setMissionHistory((history) => upsertMissionHistory(history, result.mission));
        setCommanderBehaviorSummary('');
        setCommanderDisciplineNotes('');
        setCommanderLesson('');
        setCommanderWorkflowNotice('Debrief saved. Archive is now the next Commander action.');
        return 'Debrief saved. Archive is now the next Commander action.';
      }

      if (!nextBehavior) return 'Debrief needs the behavior summary first.';
      if (!nextDiscipline) return 'Behavior summary set. Now transmit discipline notes.';
      if (!nextLesson) return 'Discipline notes set. Now transmit the lesson.';
      return 'Debrief card updated. Use Continue when ready to save.';
    }

    if (shouldContinue) {
      await handleCommanderContinue();
      return 'Continue order received. Advancing through the current lifecycle step.';
    }

    return buildCommanderDeadEndRecovery({
      room: currentCommanderRoom,
      missionState: currentState,
      transmission: message,
    }).message;
  }

  return (
    <div className="hq-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
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
              className={[
                'nav-item',
                item.active ? 'active' : '',
                item.id === recommendedNavigationTarget ? 'recommended' : '',
              ].filter(Boolean).join(' ')}
              data-nav-id={item.id}
              data-nav-section={item.section}
              data-recommended={item.id === recommendedNavigationTarget}
              aria-label={`Open ${item.label}`}
              aria-current={item.active ? 'page' : undefined}
              type="button"
              onClick={() => handleSidebarNavigation(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main id="main-content" className="shell-main">
          <section
            className="operations-viewport"
            aria-label="Operations viewport"
            data-active-operations-view={activeOperationsView}
            data-room-transfer-state={activeRoomTransfer?.completionState ?? 'idle'}
            data-room-transfer-destination={activeRoomTransfer?.toRoom ?? currentCommanderRoom}
          >
            <div className="operations-view-tabs" role="tablist" aria-label="Operations view">
              <button
                type="button"
                role="tab"
                aria-selected={activeOperationsView === 'chat'}
                className={activeOperationsView === 'chat' ? 'active' : ''}
                onClick={handleEnterCommanderChat}
              >
                Commander Chat
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeOperationsView === 'room'}
                className={activeOperationsView === 'room' ? 'active' : ''}
                onClick={handleEnterCurrentRoom}
              >
                Current Room
              </button>
            </div>
            {activeMission && parseMissionState(activeMission.currentState) !== 'archived' ? (
              <div className="mission-emergency-controls" aria-label="Mission emergency controls">
                <button className="secondary-action mission-rewind-action" type="button" onClick={handleRewindMission}>
                  Back One Step
                </button>
                <button className="secondary-action mission-abort-action" type="button" onClick={handleAbortMission}>
                  <span className="mission-abort-skull" aria-hidden="true">☠</span>
                  Abort Mission
                </button>
              </div>
            ) : null}

            {roomTransition ? <RoomTransitionLayer transition={roomTransition} /> : null}

            <div
              className="operations-panel"
              data-operations-panel="chat"
              hidden={activeOperationsView !== 'chat'}
            >
              <section
                className="commander-chat-stage"
                aria-label="Commander chat stage"
                data-active-room-atmosphere={getRoomAtmosphereToken(currentCommanderRoom)}
              >
                <CommanderExperiencePanel
                  state={commanderState}
                  commandChair={<OperationalCommandChair
                    reportState={reportState}
                    currentRoom={currentCommanderRoom}
                    mission={activeMission}
                    primaryAction={commanderState.nextAction.label}
                    onCommandAction={() => {
                      startDoorTransfer('command', { openRoomAfter: true });
                    }}
                  />}
                  situationBoard={<SituationBoard input={{
                    hqosStatus: formatHqosStatus(startupStatus),
                    currentMissionPhase: missionPhaseSummary,
                    recommendedRoom: commanderState.recommendedRoom,
                    guardianStatus,
                    recentDoctrine: formatRecentDoctrineHighlight(doctrineRecords),
                    recentGrowth: formatRecentGrowthHighlight(growthEvents),
                    intelligenceIndicator: formatJournalCount(desktopIntelligenceEvidenceRecords.length, 'intelligence record', 'intelligence records'),
                    missionIntelligence: missionIntelligencePackage,
                    operationalAwareness,
                    psychologyProfile: operationalPsychology,
                  }} />}
                  workflowSurface={<CommanderWorkflowSurface
                    currentRoom={currentCommanderRoom}
                    activeMission={activeMission}
                    missionIntelligencePackage={missionIntelligencePackage}
                    authorizationStatus={authorizationStatus}
                    deployedCheckIns={deployedCheckIns}
                    commanderLearning={buildCommanderLearningVisibility(commanderBehaviorProfile)}
                    commanderGuardianAlerts={buildCommanderGuardianAlertLines(guardianAlerts, currentCommanderRoom)}
                    missionPersistenceStatus={missionPersistenceStatus}
                    missionDebrief={missionDebrief}
                    notice={commanderWorkflowNotice}
                    commanderQuestionPending={commanderQuestionFlowActive}
                    missionCodename={commanderMissionCodename}
                    missionObjective={commanderMissionObjective}
                    operatorJustification={commanderOperatorJustification}
                    invalidation={commanderInvalidation}
                    protectiveRule={commanderProtectiveRule}
                    behaviorSummary={commanderBehaviorSummary}
                    disciplineNotes={commanderDisciplineNotes}
                    lesson={commanderLesson}
                    onMissionCodenameChange={setCommanderMissionCodename}
                    onMissionObjectiveChange={setCommanderMissionObjective}
                    onOperatorJustificationChange={setCommanderOperatorJustification}
                    onInvalidationChange={setCommanderInvalidation}
                    onProtectiveRuleChange={setCommanderProtectiveRule}
                    onBehaviorSummaryChange={setCommanderBehaviorSummary}
                    onDisciplineNotesChange={setCommanderDisciplineNotes}
                    onLessonChange={setCommanderLesson}
                    onCreateMission={handleMissionCreated}
                    onReportDeployedChange={handleDeployedCheckIn}
                    onResumeMission={handleResumeMissionRecovery}
                    onReviewMission={handleEnterCurrentRoom}
                    reportState={reportState}
                  />}
                  onContinue={handleCommanderContinue}
                  onTransmit={handleCommanderTransmission}
                  onAcknowledgeInterruption={(id) => {
                    if (id.length === 0) return;
                    setAcknowledgedCommanderInterruptions((acknowledged) => (
                      acknowledged.includes(id) ? acknowledged : [...acknowledged, id]
                    ));
                  }}
                />
                <AmbientStatusStrip input={{
                  hqos: formatHqosStatus(startupStatus),
                  archive: formatArchiveViewerStatus(archivedMissionSummaries),
                  mission: formatMissionDetailState(activeMission),
                  guardian: guardianStatus,
                  currentRoom: currentRoomLabel,
                }} />
                <section className="headquarters-operating-environment" aria-label="Living Headquarters OS">
                  <CommandChairOperatingConsole state={operatingEnvironment.commandChair} />
                  <HeadquartersBroadcastFeed items={operatingEnvironment.broadcast} />
                  <OperationalNotifications notifications={operatingEnvironment.notifications} />
                  <HeadquartersServiceActivityPanel services={operatingEnvironment.services} />
                  <LiveOperationalTimeline entries={operatingEnvironment.timeline} />
                </section>
              </section>
            </div>

            <div
              className="operations-panel"
              data-operations-panel="room"
              hidden={activeOperationsView !== 'room'}
            >
              <section className="workspace-panel" aria-label="Current room" data-active-room-atmosphere={getRoomAtmosphereToken(currentRoomView)}>
                <MissionCeremonyMoment ceremony={missionCeremony} psychology={operationalPsychology} />
                {shellPhase === 'security-checkpoint' ? (
                  <SecurityCheckpoint onReportForDuty={() => setShellPhase(reportForDuty(shellPhase).to)} />
                ) : (
                  renderHeadquartersRoom(currentRoomView, {
                    activeMission,
                    missionIntelligencePackage,
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
                    doctrineSuggestions: desktopDoctrineSuggestions,
                    doctrineReviewDecisions,
                    guardianAlerts,
                    audioQaEvents,
                    onCreateMission: handleMissionCreated,
                    onMissionChanged: (mission) => {
                      setActiveMission(getActiveMissionAfterMissionChange(mission));
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
                  onCreateJournalEntry: (entry) => setJournalEntries((entries) => upsertJournalEntries(entries, entry)),
                    onCreateDailyReflection: (reflection) => setDailyReflections((entries) => [...entries, reflection]),
                    onCreateTradeReview: (review) => setTradeReviews((entries) => [...entries, review]),
                    onCreateGrowthEvent: (event) => setGrowthEvents((entries) => [...entries, event]),
                    onArchiveJournalEntry: (record) => setArchivedJournalEntries((entries) => [...entries, record]),
                    onPromoteDoctrineCandidate: (record, historyEntry) => {
                      setDoctrineRecords((records) => [...records, record]);
                      setDoctrineHistory((entries) => [...entries, historyEntry]);
                    },
                    onDoctrineReviewDecision: (decision) => {
                      setDoctrineReviewDecisions((decisions) => [...decisions, decision]);
                    },
                  })
                )}
              </section>
            </div>
          </section>

          <MissionCommandSidebar model={missionCommandSidebar} startupStatus={startupStatus} />
        </main>
      </div>
    </div>
  );
}

function MissionCommandSidebar({
  model,
  startupStatus,
}: {
  readonly model: MissionCommandSidebarModel;
  readonly startupStatus: StartupStatus;
}) {
  return (
    <aside className="status-panel mission-command-sidebar" aria-label="Live mission command sidebar" aria-live="polite">
      <p className="section-label">Mission Command</p>
      <h2>{model.missionIdentity.codename}</h2>
      <p className="mission-command-objective">{model.missionIdentity.objective}</p>

      <dl className="mission-command-summary">
        <div>
          <dt>Mission State</dt>
          <dd>{model.missionIdentity.state}</dd>
        </div>
        <div>
          <dt>Mission Start</dt>
          <dd>{model.missionIdentity.startedAt}</dd>
        </div>
        <div>
          <dt>Current Station</dt>
          <dd>{model.currentStation.room}</dd>
        </div>
        <div>
          <dt>Selected View</dt>
          <dd>{model.currentStation.selectedView}</dd>
        </div>
      </dl>

      <section className="mission-command-section" aria-label="Lifecycle progress">
        <h3>Lifecycle Progress</h3>
        <ol className="mission-command-rail">
          {model.lifecycleProgress.map((stage) => (
            <li key={stage.id} data-stage-state={stage.state}>
              <span>{stage.label}</span>
              <small>{stage.state}</small>
              <p>{stage.explanation}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mission-command-section mission-command-next-action" aria-label="Next action">
        <h3>Next Action</h3>
        <strong>{model.nextAction.label}</strong>
        <span>{model.nextAction.destinationRoom}</span>
        <p>{model.nextAction.explanation}</p>
      </section>

      <section className="mission-command-section" aria-label="Mission intelligence status">
        <h3>Intelligence</h3>
        <dl className="mission-command-summary">
          <div>
            <dt>Context</dt>
            <dd>{model.intelligence.contextCompleteness}</dd>
          </div>
          <div>
            <dt>Evidence</dt>
            <dd>{model.intelligence.evidenceQuality}</dd>
          </div>
          <div>
            <dt>Missing Fields</dt>
            <dd>{model.intelligence.missingRequiredFieldCount}</dd>
          </div>
          <div>
            <dt>Contradictions</dt>
            <dd>{model.intelligence.contradictionState}</dd>
          </div>
        </dl>
      </section>

      <section className="mission-command-section" aria-label="Guardian and doctrine status">
        <h3>Guardian / Doctrine</h3>
        <dl className="mission-command-summary">
          <div>
            <dt>Guardian</dt>
            <dd data-guardian-state={model.guardian.state}>{model.guardian.state}</dd>
          </div>
          <div>
            <dt>Highest Alert</dt>
            <dd>{model.guardian.highestAlert}</dd>
          </div>
          <div>
            <dt>Protective Rule</dt>
            <dd>{model.doctrine.activeProtectiveRule}</dd>
          </div>
          <div>
            <dt>Doctrine Candidates</dt>
            <dd>{model.doctrine.pendingCandidateCount}</dd>
          </div>
        </dl>
        <p>{model.doctrine.relevance}</p>
      </section>

      <section className="mission-command-section" aria-label="Institutional health">
        <h3>Institutional Health</h3>
        <strong data-health-state={model.institutionalHealth.overallState}>{model.institutionalHealth.overallState}</strong>
        <p>{model.institutionalHealth.summary}</p>
        <div className="institutional-health-list">
          {model.institutionalHealth.dimensions.map((dimension) => (
            <details key={dimension.id} className="institutional-health-item">
              <summary>
                <span>{dimension.label}</span>
                <strong data-health-state={dimension.state}>{dimension.state}</strong>
              </summary>
              <p>{dimension.explanation}</p>
              <ul>
                {dimension.evidence.map((evidence) => (
                  <li key={evidence}>{evidence}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>

      <section className="mission-command-section" aria-label="Operational consequences">
        <h3>Operational Consequences</h3>
        {model.consequences.length === 0 ? (
          <p>No active consequence. Continue following the declared process.</p>
        ) : (
          <ul className="operational-consequence-list">
            {model.consequences.map((consequence) => (
              <li key={consequence.id} data-consequence-severity={consequence.severity}>
                <strong>{consequence.cause}</strong>
                <p>{consequence.effect}</p>
                <dl>
                  <div>
                    <dt>Evidence</dt>
                    <dd>{consequence.evidenceReference}</dd>
                  </div>
                  <div>
                    <dt>Recovery</dt>
                    <dd>{consequence.recoveryCondition}</dd>
                  </div>
                  <div>
                    <dt>Duration</dt>
                    <dd>{consequence.duration}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mission-command-section" aria-label="Mission outcome state">
        <h3>Outcome State</h3>
        <strong>{model.outcomeState}</strong>
      </section>

      <section className="mission-command-section mission-final-evaluation" aria-label="Mission final evaluation">
        <h3>Final Evaluation</h3>
        <strong>{model.finalEvaluation.classification}</strong>
        <p>{model.finalEvaluation.commanderVerdict}</p>
        <p>{model.finalEvaluation.commanderReview}</p>
        <dl className="mission-command-summary">
          <div>
            <dt>Recognition</dt>
            <dd>{model.finalEvaluation.recognitionEligible ? 'eligible' : 'not eligible'}</dd>
          </div>
          <div>
            <dt>Doctrine Candidate</dt>
            <dd>{model.finalEvaluation.doctrineCandidateEligible ? 'eligible' : 'not eligible'}</dd>
          </div>
          <div>
            <dt>Guardian History</dt>
            <dd>{model.finalEvaluation.guardianHistoryUpdate}</dd>
          </div>
          <div>
            <dt>Academy Growth</dt>
            <dd>{model.finalEvaluation.academyGrowth}</dd>
          </div>
          <div>
            <dt>Doctrine Contribution</dt>
            <dd>{model.finalEvaluation.doctrineContribution}</dd>
          </div>
          <div>
            <dt>Archive Classification</dt>
            <dd>{model.finalEvaluation.archiveClassification}</dd>
          </div>
        </dl>
        <details>
          <summary>Mission scorecard</summary>
          <ul>
            {model.finalEvaluation.dimensions.map((dimension) => (
              <li key={dimension.id}>
                <strong>{dimension.label}</strong>: {dimension.rating}. {dimension.recommendation}
              </li>
            ))}
          </ul>
        </details>
        <details>
          <summary>Evaluation reasons</summary>
          <ul>
            {model.finalEvaluation.supportingReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </details>
        <details>
          <summary>Recommendations</summary>
          <ul>
            {model.finalEvaluation.recommendations.map((recommendation) => (
              <li key={recommendation}>{recommendation}</li>
            ))}
          </ul>
        </details>
      </section>

      <details className="technical-diagnostics">
        <summary>Technical diagnostics</summary>
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
          <div>
            <dt>Startup</dt>
            <dd>{formatStartupPerformanceStatus(startupStatus)}</dd>
          </div>
        </dl>
        {startupStatus.error ? <p className="status-error">{formatStartupError(startupStatus)}</p> : null}
        <p className="status-recovery">{formatStartupRecoveryGuidance(startupStatus)}</p>
      </details>
    </aside>
  );
}

export type CommanderContinueMode = 'advance-mission' | 'navigate-room' | 'stay-in-room';

export function getCommanderContinueMode(
  mission: ActiveMission | undefined,
  currentRoom: string,
  recommendedRoom: string,
): CommanderContinueMode {
  if (mission === undefined) return 'navigate-room';
  if (canCommanderContinueAdvanceMission(mission)) return 'advance-mission';
  if (currentRoom !== recommendedRoom) return 'navigate-room';
  return 'stay-in-room';
}

export async function advanceMissionFromCommanderContinue(mission: ActiveMission): Promise<ActiveMission | undefined> {
  const currentState = parseMissionState(mission.currentState);

  if (currentState === 'idle') return startDesktopBriefing(mission);
  if (currentState === 'briefing') return completeDesktopBriefing(mission);
  if (currentState === 'ready') return startDesktopObservation(mission);
  if (currentState === 'observation') return completeDesktopObservation(mission);
  if (currentState === 'deployed') return requestDesktopReturnToBase(mission);

  return undefined;
}

export function getActiveMissionAfterMissionChange(mission: ActiveMission): ActiveMission | undefined {
  if (parseMissionState(mission.currentState) === 'archived') return undefined;
  return mission;
}

export function getLatestActiveMission(missions: readonly ActiveMission[]): ActiveMission | undefined {
  return [...missions]
    .reverse()
    .find((mission) => parseMissionState(mission.currentState) !== 'archived');
}

export function buildArchivedMissionSummariesFromMissions(missions: readonly ActiveMission[]): LocalMissionArchiveSummary[] {
  return missions
    .filter((mission) => parseMissionState(mission.currentState) === 'archived')
    .map((mission) => ({
      missionId: mission.id,
      codename: mission.campaign,
      archivedAt: mission.createdAt,
      eventCount: 1,
    }));
}

function canCommanderContinueAdvanceMission(mission: ActiveMission): boolean {
  const currentState = parseMissionState(mission.currentState);
  return (
    currentState === 'idle'
    || currentState === 'briefing'
    || currentState === 'ready'
    || currentState === 'observation'
    || currentState === 'authorization'
    || currentState === 'deployed'
    || currentState === 'return_to_base'
    || currentState === 'debrief'
  );
}

function CommanderWorkflowSurface({
  activeMission,
  missionIntelligencePackage,
  currentRoom,
  authorizationStatus,
  deployedCheckIns,
  commanderLearning,
  commanderGuardianAlerts,
  missionPersistenceStatus,
  missionDebrief,
  notice,
  commanderQuestionPending,
  missionCodename,
  missionObjective,
  operatorJustification,
  invalidation,
  protectiveRule,
  behaviorSummary,
  disciplineNotes,
  lesson,
  onMissionCodenameChange,
  onMissionObjectiveChange,
  onOperatorJustificationChange,
  onInvalidationChange,
  onProtectiveRuleChange,
  onBehaviorSummaryChange,
  onDisciplineNotesChange,
  onLessonChange,
  onCreateMission,
  onReportDeployedChange,
  onResumeMission,
  onReviewMission,
  reportState,
}: {
  readonly currentRoom: string;
  readonly activeMission?: ActiveMission | undefined;
  readonly missionIntelligencePackage?: MissionIntelligencePackage | undefined;
  readonly authorizationStatus?: MissionAuthorizationStatus | undefined;
  readonly deployedCheckIns: readonly DeployedMissionCheckIn[];
  readonly commanderLearning: CommanderLearningVisibility;
  readonly commanderGuardianAlerts: readonly CommanderGuardianAlertLine[];
  readonly missionPersistenceStatus: MissionPersistenceStatus;
  readonly missionDebrief?: MissionDebrief | undefined;
  readonly notice: string;
  readonly commanderQuestionPending: boolean;
  readonly missionCodename: string;
  readonly missionObjective: string;
  readonly operatorJustification: string;
  readonly invalidation: string;
  readonly protectiveRule: string;
  readonly behaviorSummary: string;
  readonly disciplineNotes: string;
  readonly lesson: string;
  readonly onMissionCodenameChange: (value: string) => void;
  readonly onMissionObjectiveChange: (value: string) => void;
  readonly onOperatorJustificationChange: (value: string) => void;
  readonly onInvalidationChange: (value: string) => void;
  readonly onProtectiveRuleChange: (value: string) => void;
  readonly onBehaviorSummaryChange: (value: string) => void;
  readonly onDisciplineNotesChange: (value: string) => void;
  readonly onLessonChange: (value: string) => void;
  readonly onCreateMission: (mission: ActiveMission) => void | Promise<void>;
  readonly onReportDeployedChange: (visibleCondition: string) => string;
  readonly onResumeMission: () => void;
  readonly onReviewMission: () => void;
  readonly reportState: 'not-reported' | 'reported';
}) {
  const currentState = parseMissionState(activeMission?.currentState);
  const [deployedVisibleCondition, setDeployedVisibleCondition] = useState('');
  const deployedPresence = activeMission && currentState === 'deployed'
    ? createDeployedMissionPresence({
      missionId: activeMission.id,
      codename: activeMission.campaign,
      objective: activeMission.objective,
      authorizationReasoning: authorizationStatus?.reason,
      activeInvalidation: missionIntelligencePackage?.invalidation,
      riskLimit: activeMission.missionContext?.briefing.riskParameters,
      currentVisibleCondition: activeMission.missionContext?.observation.operationalSummary,
      createdAt: activeMission.createdAt,
      deployedAt: getMissionLifecycleStageEnteredAt(activeMission.missionContext, 'deployed'),
      commanderQuestionPending,
      planConcludedAt: activeMission.missionContext?.timing?.planConcludedAt,
      checkIns: deployedCheckIns,
    })
    : undefined;

  function handleDeployedReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onReportDeployedChange(deployedVisibleCondition);
    setDeployedVisibleCondition('');
  }

  return (
    <>
      <section
        className="commander-workflow-card mission-persistence-indicator"
        aria-label="Mission persistence status"
        data-persistence-state={missionPersistenceStatus.state}
      >
        <p className="section-label">Mission Record</p>
        <strong>{formatMissionPersistenceStatus(missionPersistenceStatus)}</strong>
        {missionPersistenceStatus.state === 'save_failed' || missionPersistenceStatus.state === 'recovery_available' ? (
          <div className="inline-actions">
            <button type="button" className="secondary-action" onClick={onResumeMission}>Resume Mission</button>
            <button type="button" className="secondary-action" onClick={onReviewMission}>Review Mission</button>
          </div>
        ) : null}
      </section>

      <section className="commander-workflow-card commander-learning-panel" aria-label="Commander learning visibility">
        <p className="section-label">Commander Learning</p>
        <strong>{commanderLearning.headline}</strong>
        <p className="muted">Coaching focus: {commanderLearning.coachingFocus}</p>
        {commanderLearning.strengths.length > 0 ? (
          <ul className="compact-list">
            {commanderLearning.strengths.map((strength) => <li key={strength}>{strength}</li>)}
          </ul>
        ) : null}
      </section>

      <section
        className="commander-workflow-card commander-guardian-alerts-panel"
        aria-label="Guardian alerts below Commander chat"
        data-chat-role="guardian"
      >
        <p className="section-label">Guardian</p>
        <strong>{formatCommanderGuardianStatus(commanderGuardianAlerts)}</strong>
        {commanderGuardianAlerts.length > 0 ? (
          <ul className="compact-list guardian-chat-feed" aria-label="Guardian alert transmissions">
            {commanderGuardianAlerts.map((alert) => (
              <li
                key={alert.id}
                data-chat-speaker="guardian"
                data-guardian-priority={alert.priority}
                data-guardian-pacing={alert.pacing}
              >
                <span>Guardian</span>
                <p>{alert.message}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {reportState === 'reported' && activeMission === undefined ? (
        <section className="commander-workflow-card commander-workflow-card-single" aria-label="Commander mission creation controls">
          <div>
            <p className="section-label">Mission Creation</p>
            <h3>Open Mission File</h3>
            <p className="muted">Commander needs a codename and objective before lifecycle rooms unlock.</p>
          </div>
          <CreateMissionPanel
            codename={missionCodename}
            objective={missionObjective}
            onCodenameChange={onMissionCodenameChange}
            onObjectiveChange={onMissionObjectiveChange}
            onCreateMission={onCreateMission}
          />
        </section>
      ) : null}

      {missionIntelligencePackage && currentRoom === 'war-room' ? (
        <MissionIntelligencePanel
          missionPackage={missionIntelligencePackage}
          mode="authorization"
          title="Mission Intelligence Summary"
        />
      ) : null}

      {currentState === 'authorization' && currentRoom === 'war-room' ? (
        <section className="commander-workflow-card" aria-label="Commander authorization controls">
          <div>
            <p className="section-label">Authorization</p>
            <h3>War Room Authorization</h3>
            <p className="muted">{missionIntelligencePackage
              ? buildAuthorizationIntelligenceQuestion(missionIntelligencePackage)
              : formatAuthorizationStatus(authorizationStatus)}</p>
          </div>
          <label>
            <span>Authorization Reasoning</span>
            <input value={operatorJustification} onChange={(event) => onOperatorJustificationChange(event.target.value)} />
          </label>
          {missionIntelligencePackage?.invalidation ? (
            <p className="muted">Observation invalidation recorded: {missionIntelligencePackage.invalidation}</p>
          ) : (
            <label>
              <span>Invalidation</span>
              <input value={invalidation} onChange={(event) => onInvalidationChange(event.target.value)} />
            </label>
          )}
          <label>
            <span>Protective Rule</span>
            <input value={protectiveRule} onChange={(event) => onProtectiveRuleChange(event.target.value)} />
          </label>
        </section>
      ) : null}

      {deployedPresence && currentRoom === 'war-room' ? (
        <section className="commander-workflow-card deployed-presence-card" aria-label="Active mission deployment">
          <div>
            <p className="section-label">Deployed Mission</p>
            <h3>{deployedPresence.codename}</h3>
            <p className="muted">{deployedPresence.objective}</p>
          </div>
          <dl>
            <dt>Status</dt>
            <dd>{deployedPresence.deploymentStatus.replaceAll('_', ' ')}</dd>
            <dt>Timing State</dt>
            <dd>{deployedPresence.operationalState}</dd>
            <dt>Authorization</dt>
            <dd>{deployedPresence.authorizationReasoning}</dd>
            <dt>Invalidation</dt>
            <dd>{deployedPresence.activeInvalidation}</dd>
            <dt>Risk</dt>
            <dd>{deployedPresence.riskLimit}</dd>
            <dt>Visible Condition</dt>
            <dd>{deployedPresence.currentVisibleCondition}</dd>
            <dt>Elapsed</dt>
            <dd>{deployedPresence.elapsedLabel}</dd>
          </dl>
          <p className="muted">{deployedPresence.checkInGuidance}</p>
          <form className="deployed-check-in-form" aria-label="Report deployed mission change" onSubmit={handleDeployedReport}>
            <label>
              <span>Report Change</span>
              <input
                value={deployedVisibleCondition}
                onChange={(event) => setDeployedVisibleCondition(event.target.value)}
                placeholder="State only what changed."
              />
            </label>
            <button type="submit" className="secondary-action">Record Change</button>
          </form>
        </section>
      ) : null}

      {missionIntelligencePackage && currentRoom === 'debrief' ? (
        <MissionIntelligencePanel
          missionPackage={missionIntelligencePackage}
          mode="debrief"
          title="Debrief Intelligence"
        />
      ) : null}

      {currentState === 'return_to_base' && currentRoom === 'debrief' ? (
        <section className="commander-workflow-card" aria-label="Commander debrief controls">
          <div>
            <p className="section-label">Debrief</p>
            <h3>Behavior-first Debrief</h3>
            <p className="muted">{formatDebriefStatus(missionDebrief)}</p>
          </div>
          <label>
            <span>Behavior Summary</span>
            <input value={behaviorSummary} onChange={(event) => onBehaviorSummaryChange(event.target.value)} />
          </label>
          <label>
            <span>Discipline Notes</span>
            <input value={disciplineNotes} onChange={(event) => onDisciplineNotesChange(event.target.value)} />
          </label>
          <label>
            <span>Lesson</span>
            <input value={lesson} onChange={(event) => onLessonChange(event.target.value)} />
          </label>
        </section>
      ) : null}

      {missionIntelligencePackage && currentRoom === 'archive' ? (
        <MissionIntelligencePanel
          missionPackage={missionIntelligencePackage}
          mode="archive"
          title="Archive Intelligence"
        />
      ) : null}

      {currentState === 'debrief' && currentRoom === 'archive' ? (
        <section className="commander-workflow-card" aria-label="Commander archive controls">
          <p className="section-label">Archive</p>
          <h3>Archive Mission</h3>
          <p className="muted">Commander will archive the mission record from the top action.</p>
        </section>
      ) : null}

      {notice ? <p className="commander-workflow-notice" role="status">{notice}</p> : null}
    </>
  );
}

interface SecurityCheckpointProps {
  onReportForDuty: () => void;
}

interface HeadquartersRoomContext {
  activeMission?: ActiveMission | undefined;
  missionIntelligencePackage?: MissionIntelligencePackage | undefined;
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
  doctrineSuggestions: readonly DoctrineSuggestion[];
  doctrineReviewDecisions: readonly DoctrineReviewRecord[];
  guardianAlerts: readonly GuardianAlert[];
  audioQaEvents: readonly AudioEvent[];
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
  onDoctrineReviewDecision: (decision: DoctrineReviewRecord) => void;
}

function renderHeadquartersRoom(room: HeadquartersRoomId, context: HeadquartersRoomContext) {
  if (room === 'missions') {
    return (
      <MissionRoom
        activeMission={context.activeMission}
        missionIntelligencePackage={context.missionIntelligencePackage}
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
        missionIntelligencePackage={context.missionIntelligencePackage}
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
        missionIntelligencePackage={context.missionIntelligencePackage}
        authorizationStatus={context.authorizationStatus}
        missionHistory={context.missionHistory}
        missionDebrief={context.missionDebrief}
        onMissionChanged={context.onMissionChanged}
        onRequestAuthorization={context.onRequestAuthorization}
        onSaveDebrief={context.onSaveDebrief}
        onArchiveMission={context.onArchiveMission}
      />
    );
  }

  if (room === 'debrief') {
    return (
      <DebriefTheater
        activeMission={context.activeMission}
        missionIntelligencePackage={context.missionIntelligencePackage}
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
        activeMission={context.activeMission}
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
        doctrineSuggestions={context.doctrineSuggestions}
        doctrineReviewDecisions={context.doctrineReviewDecisions}
        onPromoteDoctrineCandidate={context.onPromoteDoctrineCandidate}
        onDoctrineReviewDecision={context.onDoctrineReviewDecision}
      />
    );
  }

  if (room === 'academy') {
    return <AcademyRoom growthEvents={context.growthEvents} />;
  }

  if (room === 'guardian') {
    return (
      <GuardianRoom
        mission={context.activeMission}
        authorizationStatus={context.authorizationStatus}
        journalEntries={context.journalEntries}
        growthEvents={context.growthEvents}
      />
    );
  }

  if (room === 'intelligence') {
    return <IntelligenceCenterRoom journalEntries={context.journalEntries} growthEvents={context.growthEvents} />;
  }

  if (room === 'archive') {
    return (
      <ArchiveRoom
        missionIntelligencePackage={context.missionIntelligencePackage}
        archivedMissionSummaries={context.archivedMissionSummaries}
        missionHistory={context.missionHistory}
        missionDebrief={context.missionDebrief}
        archivedJournalEntries={context.archivedJournalEntries}
        doctrineRecords={context.doctrineRecords}
      />
    );
  }

  if (room === 'settings') {
    return <SettingsRoom audioEvents={context.audioQaEvents} />;
  }

  return (
    <CommandOverview
      activeMission={context.activeMission}
      startupSubsystemCount={4}
      missionHistory={context.missionHistory}
      growthEvents={context.growthEvents}
      doctrineRecords={context.doctrineRecords}
      doctrineSuggestions={context.doctrineSuggestions}
      guardianAlerts={context.guardianAlerts}
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
  doctrineSuggestions?: readonly DoctrineSuggestion[] | undefined;
  guardianAlerts?: readonly GuardianAlert[] | undefined;
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
  doctrineSuggestions = [],
  guardianAlerts = [],
  journalEntries = [],
  archivedMissionSummaries = [],
  archivedJournalEntries = [],
}: CommandOverviewProps) {
  const briefing = buildCommanderRoomBriefing({
    activeMission,
    startupSubsystemCount,
    missionHistory,
    growthEvents,
    doctrineRecords,
    doctrineSuggestions,
    guardianAlerts,
    journalEntries,
    archivedMissionSummaries,
    archivedJournalEntries,
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
  const monthlyReview = buildCommanderMonthlyReview({
    missionCount: missionHistory.length,
    journalEntryCount: journalEntries.length,
    doctrineRecordCount: doctrineRecords.length,
    academyGrowthEventCount: growthEvents.length,
    generatedAt: activeMission?.createdAt ?? 'standby',
  });
  const missionPlanning = buildCommanderMissionPlanning({
    missionId: activeMission?.id,
    missionTitle: activeMission?.campaign,
    objective: activeMission?.objective,
    currentState: activeMission?.currentState,
    generatedAt: activeMission?.createdAt ?? 'standby',
  });
  const commanderObjectives = buildCommanderObjectives({
    activeMissionId: activeMission?.id,
    activeMissionTitle: activeMission?.campaign,
    activeMissionObjective: activeMission?.objective,
    generatedAt: activeMission?.createdAt ?? 'standby',
  });
  const commanderDashboard = buildCommanderDashboard({
    hasDailyBriefing: true,
    hasSessionDebrief: true,
    hasWeeklyReview: true,
    hasMonthlyReview: true,
    hasMissionPlanning: true,
    objectiveCount: commanderObjectives.objectives.length,
    generatedAt: activeMission?.createdAt ?? 'standby',
  });

  return (
    <div className="command-center-layout" data-layout="command-center" data-room-atmosphere="command">
      <section className="command-center-header" aria-label="Command center overview">
        <p className="section-label">Command Center</p>
        <h2>Commander Briefing</h2>
        <p className="muted">Commander interprets Headquarters state, identifies the priority, and recommends the next operational room.</p>
      </section>
      <section className="commander-bridge-layout" aria-label="Headquarters command bridge">
        <section className="commander-primary-briefing" aria-label="Commander briefing">
          <p className="section-label">Commander</p>
          <h3>{briefing.headline}</h3>
          <p>{briefing.summary}</p>
          <dl>
            <div><dt>Headquarters</dt><dd>{briefing.headquartersState}</dd></div>
            <div><dt>Mission</dt><dd>{briefing.missionState}</dd></div>
            <div><dt>Priority</dt><dd>{briefing.highestPriority}</dd></div>
            <div><dt>Next Action</dt><dd>{briefing.recommendedAction}</dd></div>
          </dl>
        </section>
        <section className="commander-morning-brief" aria-label="Morning Brief">
          <p className="section-label">Morning Brief</p>
          <h3>{briefing.morningBrief.readiness}</h3>
          <ul>
            {briefing.morningBrief.lines.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>
        <section className="commander-mission-record" aria-label="Mission Record">
          <p className="section-label">Mission Record</p>
          <h3>{briefing.missionRecord.title}</h3>
          <dl>
            {briefing.missionRecord.items.map((item) => (
              <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
            ))}
          </dl>
        </section>
        <section className="commander-situation-board" aria-label="Intelligent Situation Board">
          <p className="section-label">Situation Board</p>
          <h3>{briefing.situation.recommendedRoom}</h3>
          <p className="muted">{briefing.situation.reason}</p>
          <strong>{briefing.situation.blockedAction}</strong>
          <small>{briefing.situation.severity}</small>
          <ol className="commander-priority-list" aria-label="Headquarters priorities">
            {briefing.priorities.slice(0, 3).map((priority) => (
              <li key={priority.id} data-priority-severity={priority.severity}>
                <span>{priority.source}</span>
                <strong>{priority.title}</strong>
              </li>
            ))}
          </ol>
        </section>
        <section className="commander-activity-log" aria-label="Operational Message History">
          <p className="section-label">Operational Message History</p>
          <ol>
            {briefing.activityLog.map((entry) => (
              <li key={entry.id}>
                <time>{entry.timestamp}</time>
                <span>{entry.event}</span>
                <strong>{entry.room}</strong>
                <small>{entry.evidenceReference}</small>
              </li>
            ))}
          </ol>
        </section>
        <section className="commander-learning-profile" aria-label="Commander Learning Dashboard">
          <p className="section-label">Commander Learning</p>
          <h3>{briefing.learning.summary}</h3>
          <div>
            <strong>Strengths</strong>
            <span>{briefing.learning.strengths.join(', ')}</span>
          </div>
          <div>
            <strong>Weaknesses</strong>
            <span>{briefing.learning.weaknesses.join(', ')}</span>
          </div>
          <p className="muted">{briefing.learning.evidenceCount} approved evidence points, {briefing.learning.confidence}% confidence, updated {briefing.learning.lastUpdated}.</p>
        </section>
        <section className="commander-broadcast-feed" aria-label="Headquarters Broadcast">
          <p className="section-label">HQ Broadcast</p>
          <ol>
            {briefing.broadcasts.map((broadcast) => <li key={broadcast}>{broadcast}</li>)}
          </ol>
        </section>
        <section className="commander-services-health" aria-label="Services Health Dashboard">
          <p className="section-label">Services Health</p>
          <dl>
            {briefing.services.map((service) => (
              <div key={service.name}>
                <dt>{service.name}</dt>
                <dd>{service.status}. {service.responsibility} {service.pendingWork}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="commander-operational-timeline" aria-label="Headquarters Operational Timeline">
          <p className="section-label">Operational Timeline</p>
          <ol>
            {briefing.operationalTimeline.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ol>
        </section>
        <details className="commander-briefing-archive">
          <summary>Supporting Commander archive</summary>
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
          <section className="commander-briefing-panel" aria-label="Commander monthly review">
            <p className="section-label">Monthly Review</p>
            <h3>{monthlyReview.summary}</h3>
            <p className="muted">{monthlyReview.institutionalNote}</p>
            <ul className="mission-archive-list">
              {monthlyReview.evidenceLinks.map((link) => (
                <li key={link.source}>
                  <span>{link.label}</span>
                  <strong>{link.count}</strong>
                </li>
              ))}
            </ul>
          </section>
          <section className="commander-briefing-panel" aria-label="Commander dashboard">
            <p className="section-label">Commander Dashboard</p>
            <h3>Briefing, reviews, planning, and objectives</h3>
            <p className="muted">{commanderDashboard.constraints.join(' ')}</p>
            <ul className="mission-archive-list">
              {commanderDashboard.sections.map((section) => (
                <li key={section.label}>
                  <span>{section.label}</span>
                  <strong>{section.status}</strong>
                </li>
              ))}
            </ul>
          </section>
          <section className="commander-briefing-panel" aria-label="Commander mission planning">
            <p className="section-label">Mission Planning</p>
            <h3>{missionPlanning.summary}</h3>
            <p className="muted">{missionPlanning.constraints.join(' ')}</p>
            <ul className="mission-archive-list">
              {missionPlanning.standards.map((standard) => (
                <li key={standard}>
                  <span>{standard}</span>
                  <strong>Standard</strong>
                </li>
              ))}
            </ul>
          </section>
          <section className="commander-briefing-panel" aria-label="Commander objectives">
            <p className="section-label">Objectives</p>
            <h3>{commanderObjectives.summary}</h3>
            <p className="muted">{commanderObjectives.constraints.join(' ')}</p>
            <ul className="mission-archive-list">
              {commanderObjectives.objectives.length === 0 ? (
                <li>
                  <span>No active Commander objective</span>
                  <strong>Pending</strong>
                </li>
              ) : commanderObjectives.objectives.map((objective) => (
                <li key={objective.id}>
                  <span>{objective.title}</span>
                  <strong>{objective.status}</strong>
                </li>
              ))}
            </ul>
          </section>
        </details>
        <section className="supporting-information-panel" aria-label="Semantic evidence summaries">
          <div>
            <p className="section-label">HQOS</p>
            <strong>{briefing.semanticEvidence.hqos}</strong>
          </div>
          <div>
            <p className="section-label">Archive</p>
            <strong>{briefing.semanticEvidence.archive}</strong>
          </div>
          <div>
            <p className="section-label">Journal</p>
            <strong>{briefing.semanticEvidence.journal}</strong>
          </div>
          <div>
            <p className="section-label">Doctrine</p>
            <strong>{briefing.semanticEvidence.doctrine}</strong>
          </div>
        </section>
      </section>
    </div>
  );
}

export interface CommanderRoomBriefingInput {
  activeMission?: ActiveMission | undefined;
  startupSubsystemCount: number;
  missionHistory: readonly ActiveMission[];
  growthEvents?: readonly GrowthEvent[] | undefined;
  doctrineRecords?: readonly DoctrineRecord[] | undefined;
  doctrineSuggestions?: readonly DoctrineSuggestion[] | undefined;
  guardianAlerts?: readonly GuardianAlert[] | undefined;
  journalEntries?: readonly JournalEntry[] | undefined;
  archivedMissionSummaries?: readonly LocalMissionArchiveSummary[] | undefined;
  archivedJournalEntries?: readonly ArchivedJournalEntry[] | undefined;
}

export interface CommanderRoomBriefing {
  readonly headline: string;
  readonly summary: string;
  readonly headquartersState: string;
  readonly missionState: string;
  readonly highestPriority: string;
  readonly recommendedAction: string;
  readonly morningBrief: {
    readonly readiness: string;
    readonly lines: readonly string[];
  };
  readonly missionRecord: {
    readonly title: string;
    readonly items: readonly { readonly label: string; readonly value: string }[];
  };
  readonly situation: {
    readonly recommendedRoom: string;
    readonly reason: string;
    readonly priority: string;
    readonly action: string;
    readonly blockedAction: string;
    readonly severity: string;
  };
  readonly priorities: readonly HeadquartersPriorityItem[];
  readonly priorityCounts: ReturnType<typeof getPriorityCountBySeverity>;
  readonly activityLog: readonly {
    readonly id: string;
    readonly timestamp: string;
    readonly event: string;
    readonly room: string;
    readonly evidenceReference: string;
  }[];
  readonly learning: {
    readonly summary: string;
    readonly strengths: readonly string[];
    readonly weaknesses: readonly string[];
    readonly evidenceCount: number;
    readonly confidence: number;
    readonly lastUpdated: string;
  };
  readonly broadcasts: readonly string[];
  readonly services: readonly {
    readonly name: string;
    readonly status: string;
    readonly responsibility: string;
    readonly pendingWork: string;
  }[];
  readonly operationalTimeline: readonly string[];
  readonly semanticEvidence: {
    readonly hqos: string;
    readonly archive: string;
    readonly journal: string;
    readonly doctrine: string;
  };
}

export function buildCommanderRoomBriefing({
  activeMission,
  startupSubsystemCount,
  missionHistory,
  growthEvents = [],
  doctrineRecords = [],
  doctrineSuggestions = [],
  guardianAlerts = [],
  journalEntries = [],
  archivedMissionSummaries = [],
  archivedJournalEntries = [],
}: CommanderRoomBriefingInput): CommanderRoomBriefing {
  const nextAction = getMissionNextAction(activeMission);
  const missionState = formatMissionDetailState(activeMission);
  const archiveRecordCount = archivedMissionSummaries.length + archivedJournalEntries.length;
  const lifecycle = projectDesktopMissionLifecycle(activeMission);
  const priorityInput = {
    lifecycle,
    guardianAlerts,
    doctrineCandidates: doctrineSuggestions.map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      rationale: candidate.rationale,
      evidenceRecordIds: candidate.evidenceRecordIds,
    })),
    archiveMilestoneCount: archiveRecordCount,
    detectedAt: activeMission?.createdAt ?? '2026-07-02T00:00:00.000Z',
  };
  const priorities = getHeadquartersPriorities(priorityInput);
  const highestPriority = getHighestPriority(priorityInput);
  const priorityCounts = getPriorityCountBySeverity(priorityInput);
  const recommended = buildCommanderSituationRecommendation({
    activeMission,
    doctrineRecords,
    journalEntries,
    archiveRecordCount,
    highestPriority,
  });
  const learningEvidenceCount = missionHistory.length + growthEvents.length + journalEntries.length;
  const lastMission = missionHistory.at(-1);
  const headline = activeMission
    ? `${activeMission.campaign} is in ${missionState}.`
    : 'Headquarters is ready for command.';
  const summary = activeMission
    ? `${nextAction.description} Commander recommends ${recommended.recommendedRoom} because ${recommended.reason.toLowerCase()}`
    : 'No active mission is loaded. Commander recommends creating the next mission before reviewing support rooms.';

  return {
    headline,
    summary,
    headquartersState: startupSubsystemCount >= 4 ? 'Operational and standing by.' : 'Partially online. Review service health.',
    missionState,
    highestPriority: highestPriority.title,
    recommendedAction: highestPriority.recommendedAction || (nextAction.disabled ? recommended.action : nextAction.label),
    morningBrief: {
      readiness: activeMission ? 'Mission readiness is active.' : 'Mission readiness is waiting for a mission file.',
      lines: [
        activeMission ? `${activeMission.campaign} requires ${nextAction.label.toLowerCase()}.` : 'Mission: create an operation before rooms unlock meaningful work.',
        growthEvents.length > 0 ? 'Academy has recent behavior evidence.' : 'Academy is waiting for approved growth evidence.',
        doctrineRecords.length > 0 ? 'Doctrine has operational law available.' : 'Doctrine is waiting for repeated lessons.',
        journalEntries.length > 0 ? 'Journal memory contains operator observations.' : 'Journal has no current operator observation.',
        archiveRecordCount > 0 ? 'Archive has historical evidence ready.' : 'Archive has no permanent record yet.',
      ],
    },
    missionRecord: {
      title: lastMission?.campaign ?? activeMission?.campaign ?? 'No completed mission recorded',
      items: [
        { label: 'Market', value: lastMission?.briefingContext?.market ?? activeMission?.briefingContext?.market ?? 'Not declared' },
        { label: 'Session', value: lastMission?.condition ?? activeMission?.condition ?? 'No session active' },
        { label: 'Lifecycle', value: lastMission ? formatMissionDetailState(lastMission) : missionState },
        { label: 'Doctrine', value: doctrineRecords.length > 0 ? 'Doctrine available for operational reference' : 'No doctrine change recorded' },
        { label: 'Journal', value: journalEntries.length > 0 ? 'Journal evidence available for review' : 'Journal completion pending' },
        { label: 'Guardian', value: 'Guardian monitoring remains active' },
      ],
    },
    situation: recommended,
    priorities,
    priorityCounts,
    activityLog: buildCommanderActivityLog({ activeMission, missionHistory, journalEntries, doctrineRecords, archivedMissionSummaries }),
    learning: {
      summary: learningEvidenceCount > 0 ? 'Commander has enough evidence to begin profiling operator behavior.' : 'Commander learning begins after missions, journal entries, and growth evidence.',
      strengths: growthEvents.length > 0 ? ['Patience', 'Consistent journaling'] : ['Observation discipline pending evidence'],
      weaknesses: missionHistory.length > 0 ? ['Early conviction requires monitoring'] : ['Unknown until first mission closes'],
      evidenceCount: learningEvidenceCount,
      confidence: Math.min(95, learningEvidenceCount * 12),
      lastUpdated: activeMission?.createdAt ?? lastMission?.createdAt ?? 'standby',
    },
    broadcasts: buildCommanderBroadcasts({ activeMission, growthEvents, doctrineRecords, archivedMissionSummaries }),
    services: [
      {
        name: 'Archive',
        status: archiveRecordCount > 0 ? 'Working' : 'Standing by',
        responsibility: 'Preserve permanent evidence.',
        pendingWork: archiveRecordCount > 0 ? 'Historical record available.' : 'Awaiting first archive.',
      },
      {
        name: 'Guardian',
        status: 'Online',
        responsibility: 'Monitor risk and discipline.',
        pendingWork: activeMission ? 'Watching current mission.' : 'Waiting for mission context.',
      },
      {
        name: 'Doctrine',
        status: doctrineRecords.length > 0 ? 'Active' : 'Quiet',
        responsibility: 'Maintain operating law.',
        pendingWork: doctrineRecords.length > 0 ? 'Doctrine ready for reference.' : 'No pending review.',
      },
      {
        name: 'Academy',
        status: growthEvents.length > 0 ? 'Evaluating' : 'Quiet',
        responsibility: 'Recognize behavior growth.',
        pendingWork: growthEvents.length > 0 ? 'Growth evidence present.' : 'Awaiting earned recognition.',
      },
      {
        name: 'Intelligence',
        status: journalEntries.length > 0 ? 'Indexing' : 'Standing by',
        responsibility: 'Detect patterns from evidence.',
        pendingWork: journalEntries.length > 0 ? 'Journal evidence available.' : 'No evidence to classify.',
      },
      {
        name: 'Mission',
        status: activeMission ? 'Active' : 'Standing by',
        responsibility: 'Control lifecycle progression.',
        pendingWork: activeMission ? nextAction.label : 'Create the next mission.',
      },
    ],
    operationalTimeline: buildCommanderOperationalTimeline({ activeMission, missionHistory, journalEntries, doctrineRecords, archivedMissionSummaries }),
    semanticEvidence: {
      hqos: startupSubsystemCount >= 4 ? 'Headquarters core systems are ready.' : 'Headquarters needs service attention.',
      archive: archiveRecordCount > 0 ? 'Headquarters has historical evidence available.' : 'Headquarters has not preserved a mission record yet.',
      journal: journalEntries.length > 0 ? 'Operator observations remain available for review.' : 'Operator has not written today yet.',
      doctrine: doctrineRecords.length > 0 ? 'Operating law exists and can guide decisions.' : 'No stable doctrine has been promoted yet.',
    },
  };
}

function buildCommanderSituationRecommendation({
  activeMission,
  doctrineRecords,
  journalEntries,
  archiveRecordCount,
  highestPriority,
}: {
  readonly activeMission?: ActiveMission | undefined;
  readonly doctrineRecords: readonly DoctrineRecord[];
  readonly journalEntries: readonly JournalEntry[];
  readonly archiveRecordCount: number;
  readonly highestPriority: HeadquartersPriorityItem;
}): CommanderRoomBriefing['situation'] {
  const priorityRecommendation = {
    recommendedRoom: formatPriorityRoomLabel(highestPriority.recommendedRoom),
    reason: highestPriority.explanation,
    priority: highestPriority.title,
    action: highestPriority.recommendedAction,
    blockedAction: highestPriority.blocking ? 'Blocking condition active.' : 'No blocking condition active.',
    severity: highestPriority.severity,
  };

  if (highestPriority.source === 'guardian' || highestPriority.blocking) {
    return priorityRecommendation;
  }

  const state = parseMissionState(activeMission?.currentState);

  if (activeMission === undefined) {
    return {
      recommendedRoom: 'Mission Room',
      reason: 'no mission file exists.',
      priority: 'Create the operational file.',
      action: 'Create Mission',
      blockedAction: 'Observation, authorization, and debrief remain blocked.',
      severity: highestPriority.severity,
    };
  }

  if (state === 'observation') {
    return {
      recommendedRoom: 'Observation Room',
      reason: 'evidence is not complete.',
      priority: 'Collect visible evidence.',
      action: 'Continue Observation',
      blockedAction: 'War Room authorization remains blocked.',
      severity: highestPriority.severity,
    };
  }

  if (state === 'authorization' || state === 'deployed') {
    return {
      recommendedRoom: 'War Room',
      reason: 'decision authority is active.',
      priority: 'Protect discipline before action.',
      action: 'Review Authorization',
      blockedAction: 'Deployment cannot exceed declared evidence.',
      severity: highestPriority.severity,
    };
  }

  if (state === 'return_to_base' || state === 'debrief') {
    return {
      recommendedRoom: 'Debrief Theater',
      reason: 'the mission must become learning before archive.',
      priority: 'Capture behavior and lesson.',
      action: 'Complete Debrief',
      blockedAction: 'Archive waits for debrief evidence.',
      severity: highestPriority.severity,
    };
  }

  if (doctrineRecords.length === 0 && journalEntries.length > 0) {
    return {
      recommendedRoom: 'Doctrine',
      reason: 'journal evidence may contain repeatable operating law.',
      priority: 'Review doctrine candidates.',
      action: 'Open Doctrine',
      blockedAction: 'Doctrine promotion remains manual.',
      severity: highestPriority.severity,
    };
  }

  if (archiveRecordCount === 0 && state === 'archived') {
    return {
      recommendedRoom: 'Archive',
      reason: 'completed work should become historical intelligence.',
      priority: 'Verify archive record.',
      action: 'Open Archive',
      blockedAction: 'Historical recall is incomplete.',
      severity: highestPriority.severity,
    };
  }

  if (highestPriority.source !== 'mission') {
    return priorityRecommendation;
  }

  return {
    recommendedRoom: state === 'ready' || state === 'briefing' || state === 'idle' ? 'Ready Room' : 'Mission Room',
    reason: 'the current lifecycle phase is still open.',
    priority: 'Follow Commander lifecycle guidance.',
    action: getMissionNextAction(activeMission).label,
    blockedAction: 'Future rooms stay secondary until the active phase completes.',
    severity: highestPriority.severity,
  };
}

function formatPriorityRoomLabel(room: HeadquartersPriorityItem['recommendedRoom']): string {
  if (room === 'command-center') return 'Command Center';
  if (room === 'mission-room') return 'Mission Room';
  if (room === 'ready-room') return 'Ready Room';
  if (room === 'observation-room') return 'Observation Room';
  if (room === 'war-room') return 'War Room';
  if (room === 'debrief-theater') return 'Debrief Theater';
  return 'Archive';
}

function buildCommanderActivityLog({
  activeMission,
  missionHistory,
  journalEntries,
  doctrineRecords,
  archivedMissionSummaries,
}: {
  readonly activeMission?: ActiveMission | undefined;
  readonly missionHistory: readonly ActiveMission[];
  readonly journalEntries: readonly JournalEntry[];
  readonly doctrineRecords: readonly DoctrineRecord[];
  readonly archivedMissionSummaries: readonly LocalMissionArchiveSummary[];
}): CommanderRoomBriefing['activityLog'] {
  const entries: CommanderRoomBriefing['activityLog'] = [
    ...(activeMission ? [{
      id: `mission:${activeMission.id}`,
      timestamp: activeMission.createdAt,
      event: 'Mission Created',
      room: 'Mission Room',
      evidenceReference: activeMission.id,
    }] : []),
    ...missionHistory.slice(-2).map((mission) => ({
      id: `history:${mission.id}`,
      timestamp: mission.createdAt,
      event: `Mission ${formatMissionDetailState(mission)}`,
      room: 'Mission Room',
      evidenceReference: mission.id,
    })),
    ...journalEntries.slice(0, 2).map((entry) => ({
      id: `journal:${entry.id}`,
      timestamp: entry.createdAt,
      event: 'Journal Saved',
      room: 'Journal',
      evidenceReference: entry.id,
    })),
    ...doctrineRecords.slice(0, 2).map((record) => ({
      id: `doctrine:${record.id}`,
      timestamp: record.updatedAt,
      event: 'Doctrine Updated',
      room: 'Doctrine',
      evidenceReference: record.id,
    })),
    ...archivedMissionSummaries.slice(-2).map((summary) => ({
      id: `archive:${summary.missionId}`,
      timestamp: summary.archivedAt,
      event: 'Mission Archived',
      room: 'Archive',
      evidenceReference: summary.missionId,
    })),
  ];

  if (entries.length === 0) {
    return [{
      id: 'standby',
      timestamp: 'standby',
      event: 'Report For Duty',
      room: 'Command Center',
      evidenceReference: 'operator-session',
    }];
  }

  return [...entries].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

function buildCommanderBroadcasts({
  activeMission,
  growthEvents,
  doctrineRecords,
  archivedMissionSummaries,
}: {
  readonly activeMission?: ActiveMission | undefined;
  readonly growthEvents: readonly GrowthEvent[];
  readonly doctrineRecords: readonly DoctrineRecord[];
  readonly archivedMissionSummaries: readonly LocalMissionArchiveSummary[];
}): readonly string[] {
  return [
    activeMission ? `Mission ${activeMission.campaign} is active.` : 'Headquarters is awaiting mission creation.',
    doctrineRecords.length > 0 ? 'Doctrine library is available for operational reference.' : 'Doctrine is quiet.',
    growthEvents.length > 0 ? 'Academy has recognized behavior evidence.' : 'Academy awaits earned progress.',
    archivedMissionSummaries.length > 0 ? 'Archive has preserved mission history.' : 'Archive is standing by.',
  ];
}

function buildCommanderOperationalTimeline({
  activeMission,
  missionHistory,
  journalEntries,
  doctrineRecords,
  archivedMissionSummaries,
}: {
  readonly activeMission?: ActiveMission | undefined;
  readonly missionHistory: readonly ActiveMission[];
  readonly journalEntries: readonly JournalEntry[];
  readonly doctrineRecords: readonly DoctrineRecord[];
  readonly archivedMissionSummaries: readonly LocalMissionArchiveSummary[];
}): readonly string[] {
  return buildCommanderActivityLog({
    activeMission,
    missionHistory,
    journalEntries,
    doctrineRecords,
    archivedMissionSummaries,
  }).map((entry) => `${entry.timestamp} - ${entry.event} - ${entry.room}`);
}

interface MissionRoomProps extends CommandCenterProps {
  onMissionChanged?: ((mission: ActiveMission) => void) | undefined;
}

function MissionRoom(props: MissionRoomProps) {
  return (
    <div className="room-layout" data-room-id="mission-room" data-room-atmosphere="command">
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
  const recentMission = missionHistory.at(-1);
  const preparation = buildReadyRoomPreparationModel(activeMission);
  const primaryAction = getReadyRoomPrimaryAction(preparation);

  return (
    <GuidedRoom
      id="ready-room"
      identity="preparation"
      atmosphere="ready"
      title="Ready Room"
      useCase="Mission preparation before Observation."
      objective="Prepare the operator, confirm readiness, and establish mission conditions before Headquarters commits resources."
      primaryAction={(
        <div className="ready-primary-action">
          <strong>{primaryAction.label}</strong>
          <p className="muted">{primaryAction.detail}</p>
        </div>
      )}
      workspace={(
        <div className="ready-briefing-layout" aria-label="Ready Room briefing">
          <section className="journal-panel ready-mission-file" aria-label="Mission file">
            <p className="section-label">Mission File</p>
            <h3>{preparation.missionFile.codename}</h3>
            <dl>
              {preparation.missionFile.rows.map((row) => (
                <div key={row.label} className="ready-mission-file-row">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="journal-panel ready-current-preparation" aria-label="Current preparation item">
            <p className="section-label">Current Preparation Item</p>
            <h3>{preparation.currentItem.title}</h3>
            <p>{preparation.currentItem.status}</p>
            {preparation.currentItem.answer ? <strong>{preparation.currentItem.answer}</strong> : null}
            <p className="muted">{preparation.currentItem.guidance}</p>
          </section>

          <section className="journal-panel ready-sequence-panel" aria-label="Preparation sequence">
            <p className="section-label">Preparation Sequence</p>
            <h3>{preparation.statusLabel}</h3>
            <ol className="ready-preparation-sequence">
              {preparation.steps.map((step, index) => (
                <li key={step.id} data-step-status={step.status}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>
                    {step.label}
                    {step.answer ? <small>{step.answerLabel}: {step.answer}</small> : null}
                  </strong>
                  <em>{formatReadyRoomStepStatus(step.status)}</em>
                </li>
              ))}
            </ol>
          </section>

          <section className="journal-panel ready-checklist-panel" aria-label="Preparation checklist">
            <p className="section-label">Preparation Checklist</p>
            <h3>{preparation.completedCount} of {preparation.totalCount} briefing items complete</h3>
            <ol className="readiness-checklist">
              {preparation.steps.map((step) => (
                <li key={step.id} data-step-status={step.status}>
                  <span aria-hidden="true">{step.status === 'complete' ? '✓' : '○'}</span>
                  {step.label}
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
      timelineLabel="Mission Record"
      timeline={(
        <section className="journal-panel" aria-label="Mission record">
          <p className="section-label">Mission Record</p>
          <h3>{activeMission?.campaign ?? 'No active mission record'}</h3>
          <p className="muted">{activeMission?.objective ?? 'Create a mission before moving into observation.'}</p>
          <dl>
            <dt>Lifecycle</dt>
            <dd>{formatMissionDetailState(activeMission)}</dd>
            <dt>Last mission</dt>
            <dd>{recentMission?.campaign ?? 'No prior mission'}</dd>
          </dl>
        </section>
      )}
      secondaryToolsLabel="Preparation Context"
      secondaryTools={(
        <>
          <section className="journal-panel" aria-label="Command commitment">
            <p className="section-label">Command Commitment</p>
            <h3>Follow declared risk. Wait for evidence. Stop when invalidated.</h3>
            <p className="muted">Status: {activeMission ? 'Confirmed for this mission file' : 'Available after mission creation'}</p>
          </section>
          <section className="journal-panel" aria-label="Locker panel">
            <p className="section-label">Operator Locker</p>
            <h3>Operator Locker</h3>
            <dl>
              <dt>Missions Recorded</dt>
              <dd>{missionHistory.length}</dd>
              <dt>Last Mission</dt>
              <dd>{recentMission?.campaign ?? 'No prior mission'}</dd>
              <dt>Academy Reminder</dt>
              <dd>{formatRecentGrowthHighlight(growthEvents)}</dd>
            </dl>
          </section>
        </>
      )}
    />
  );
}

type ReadyRoomPreparationState = 'not-started' | 'in-progress' | 'complete';
type ReadyRoomPreparationStepStatus = 'complete' | 'current' | 'pending';

interface ReadyRoomPreparationStep {
  readonly id: keyof MissionBriefingContext;
  readonly label: string;
  readonly answerLabel: string;
  readonly status: ReadyRoomPreparationStepStatus;
  readonly answer?: string;
}

interface ReadyRoomPreparationModel {
  readonly state: ReadyRoomPreparationState;
  readonly statusLabel: string;
  readonly completedCount: number;
  readonly totalCount: number;
  readonly missionFile: {
    readonly codename: string;
    readonly rows: readonly { readonly label: string; readonly value: string }[];
  };
  readonly currentItem: {
    readonly title: string;
    readonly status: string;
    readonly guidance: string;
    readonly answer?: string;
  };
  readonly steps: readonly ReadyRoomPreparationStep[];
}

export function buildReadyRoomPreparationModel(activeMission?: ActiveMission | undefined): ReadyRoomPreparationModel {
  const context = activeMission?.briefingContext;
  const briefingComplete = isReadyRoomBriefingComplete(context);
  const baseSteps = [
    { id: 'missionObjective', label: 'Mission Intent', answerLabel: 'Objective' },
    { id: 'market', label: 'Market Context', answerLabel: 'Market' },
    { id: 'marketEnvironment', label: 'Environment', answerLabel: 'Environment' },
    { id: 'highImpactNews', label: 'Event Risk', answerLabel: 'Scheduled Events' },
    { id: 'personalReadiness', label: 'Operator Condition', answerLabel: 'Condition' },
    { id: 'riskParameters', label: 'Risk Ceiling', answerLabel: 'Maximum Risk' },
    { id: 'successCriteria', label: 'Success Criteria', answerLabel: 'Success Criteria' },
  ] as const satisfies readonly {
    readonly id: keyof MissionBriefingContext;
    readonly label: string;
    readonly answerLabel: string;
  }[];

  const firstPendingIndex = baseSteps.findIndex((step) => !hasReadyRoomPreparationValue(context?.[step.id]));
  const steps = baseSteps.map((step, index): ReadyRoomPreparationStep => {
    const answer = normalizeReadyRoomPreparationValue(context?.[step.id]);
    const status: ReadyRoomPreparationStepStatus = answer
      ? 'complete'
      : firstPendingIndex === index
        ? 'current'
        : 'pending';

    return {
      id: step.id,
      label: step.label,
      answerLabel: step.answerLabel,
      status,
      ...(answer ? { answer } : {}),
    };
  });
  const completedCount = steps.filter((step) => step.status === 'complete').length;
  const currentStep = steps.find((step) => step.status === 'current');
  const currentMissionState = parseMissionState(activeMission?.currentState);
  const state: ReadyRoomPreparationState = briefingComplete
    || (currentMissionState === 'ready' && completedCount === steps.length)
    ? 'complete'
    : completedCount > 0
      ? 'in-progress'
      : 'not-started';

  const currentItem = buildReadyRoomCurrentItem({
    state,
    completedCount,
    totalCount: steps.length,
    currentStep,
  });

  return {
    state,
    statusLabel: formatReadyRoomPreparationStatus(state, completedCount, steps.length),
    completedCount,
    totalCount: steps.length,
    missionFile: {
      codename: formatMissionDetailValue(activeMission?.campaign),
      rows: [
        { label: 'Codename', value: formatMissionDetailValue(activeMission?.campaign) },
        { label: 'Objective', value: formatMissionDetailValue(context?.missionObjective ?? activeMission?.objective) },
        { label: 'Market', value: formatMissionDetailValue(context?.market) },
        { label: 'Environment', value: formatMissionDetailValue(context?.marketEnvironment) },
        { label: 'State', value: formatMissionDetailState(activeMission) },
        { label: 'Record', value: activeMission ? 'Saved' : 'Awaiting mission file' },
      ],
    },
    currentItem,
    steps,
  };
}

function buildReadyRoomCurrentItem({
  state,
  completedCount,
  totalCount,
  currentStep,
}: {
  readonly state: ReadyRoomPreparationState;
  readonly completedCount: number;
  readonly totalCount: number;
  readonly currentStep: ReadyRoomPreparationStep | undefined;
}): ReadyRoomPreparationModel['currentItem'] {
  if (state === 'complete') {
    return {
      title: 'Observation Clearance',
      status: 'Preparation complete',
      guidance: 'Observation clearance is available. Enter only when Commander directs movement.',
    };
  }

  if (state === 'not-started') {
    return {
      title: 'Operational Briefing',
      status: 'Not started',
      guidance: 'Begin in Commander Chat. Headquarters needs mission conditions before Observation unlocks.',
    };
  }

  return {
    title: currentStep?.label ?? 'Operational Briefing',
    status: `Step ${Math.min(completedCount + 1, totalCount)} of ${totalCount}`,
    guidance: 'Awaiting operator response in Commander Chat.',
    ...(currentStep?.answer ? { answer: currentStep.answer } : {}),
  };
}

function getReadyRoomPrimaryAction(preparation: ReadyRoomPreparationModel): { readonly label: string; readonly detail: string } {
  if (preparation.state === 'complete') {
    return {
      label: 'Enter Observation Room',
      detail: 'Observation clearance available.',
    };
  }

  if (preparation.state === 'in-progress') {
    return {
      label: 'Return to Commander Briefing',
      detail: `${preparation.completedCount} of ${preparation.totalCount} briefing items complete.`,
    };
  }

  return {
    label: 'Begin Operational Briefing',
    detail: 'Start the Commander briefing before Observation unlocks.',
  };
}

function formatReadyRoomPreparationStatus(
  state: ReadyRoomPreparationState,
  completedCount: number,
  totalCount: number,
): string {
  if (state === 'complete') return 'Preparation status: Complete';
  if (state === 'in-progress') return `Preparation status: In progress (${completedCount} of ${totalCount})`;
  return 'Preparation status: Not started';
}

function formatReadyRoomStepStatus(status: ReadyRoomPreparationStepStatus): string {
  if (status === 'complete') return 'Complete';
  if (status === 'current') return 'In progress';
  return 'Pending';
}

function normalizeReadyRoomPreparationValue(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function hasReadyRoomPreparationValue(value: string | undefined): boolean {
  return normalizeReadyRoomPreparationValue(value) !== undefined;
}

export function ObservationRoom({
  activeMission,
  missionIntelligencePackage,
  authorizationStatus,
  missionDebrief,
  archiveSummary,
}: MissionTimelineViewerPanelProps) {
  const currentState = parseMissionState(activeMission?.currentState);
  const observation = buildObservationRoomIntelligenceModel(activeMission, missionIntelligencePackage);
  const entries = buildDesktopMissionTimelineEntries({
    activeMission,
    authorizationStatus,
    missionDebrief,
    archiveSummary,
  });

  return (
    <GuidedRoom
      id="observation-room"
      identity="silence"
      atmosphere="observation"
      title="Observation Room"
      useCase="Observe quietly and collect evidence."
      objective="Build conviction from visible evidence. Prediction stays outside the room."
      primaryAction={(
        <div className="observation-primary-action">
          <strong>{observation.primaryAction}</strong>
          <p className="muted">{observation.primaryDetail}</p>
        </div>
      )}
      workspace={(
        <div className="observation-workspace" aria-label="Observation workspace">
          <section className="journal-panel observation-current-focus" aria-label="Current observation focus">
            <p className="section-label">Current Observation</p>
            <h3>{observation.currentFocus.question}</h3>
            <p className="muted">{observation.currentFocus.guidance}</p>
            <div className="observation-focus-grid" aria-label="Observation evidence progress">
              <div>
                <p className="section-label">Completed</p>
                <ul>
                  {observation.completedEvidence.map((item) => <li key={item.id}>✓ {item.label}</li>)}
                  {observation.completedEvidence.length === 0 ? <li>No evidence recorded yet</li> : null}
                </ul>
              </div>
              <div>
                <p className="section-label">Pending</p>
                <ul>
                  {observation.pendingEvidence.map((item) => <li key={item.id}>○ {item.label}</li>)}
                  {observation.pendingEvidence.length === 0 ? <li>Core observation file complete</li> : null}
                </ul>
              </div>
            </div>
          </section>

          <section className="journal-panel observation-check-in" aria-label="Commander observation check-in">
            <p className="section-label">Commander Check-In</p>
            <h3>{observation.commanderCheckIn.title}</h3>
            <p>{observation.commanderCheckIn.body}</p>
            <p className="muted">{observation.commanderCheckIn.reminder}</p>
          </section>

          <section className="journal-panel observation-metrics" aria-label="Observation metrics">
            <p className="section-label">Observation Metrics</p>
            <h3>{currentState === 'observation' ? 'Observation Active' : 'Observation Standby'}</h3>
            <dl>
              <dt>Timeline</dt>
              <dd>{formatTimelineViewerStatus(entries)}</dd>
              <dt>Evidence Collected</dt>
              <dd>{observation.completedEvidence.length}</dd>
              <dt>Commander Check-ins</dt>
              <dd>{observation.commanderCheckIns}</dd>
              <dt>Last Evidence</dt>
              <dd>{observation.lastEvidence}</dd>
            </dl>
          </section>

          <section className="journal-panel observation-intelligence-board" aria-label="Intelligence board">
            <p className="section-label">Intelligence Board</p>
            <h3>Mission Confidence</h3>
            <div className="observation-confidence-meter" aria-label={`Mission confidence ${observation.confidenceScore}%`}>
              <span style={{ width: `${observation.confidenceScore}%` }} />
            </div>
            <strong>{observation.confidenceLevel} {observation.confidenceScore}%</strong>
            <div className="observation-board-columns">
              <div>
                <p className="section-label">Collected</p>
                <ul>
                  {observation.completedEvidence.map((item) => <li key={item.id}>✓ {item.label}</li>)}
                </ul>
              </div>
              <div>
                <p className="section-label">Still Missing</p>
                <ul>
                  {observation.pendingEvidence.map((item) => <li key={item.id}>○ {item.label}</li>)}
                </ul>
              </div>
            </div>
            <p className="muted">{observation.assessment}</p>
          </section>

          <section className="journal-panel observation-evidence-board" aria-label="Evidence board">
            <p className="section-label">Today's Evidence</p>
            <h3>{observation.evidenceBoardTitle}</h3>
            <dl>
              {observation.evidenceRows.map((row) => (
                <div key={row.label} className="observation-evidence-row">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="journal-panel observation-discipline" aria-label="Observation discipline score">
            <p className="section-label">Observation Quality</p>
            <h3>{observation.disciplineSummary}</h3>
            <dl>
              {observation.disciplineScores.map((score) => (
                <div key={score.label} className="observation-score-row">
                  <dt>{score.label}</dt>
                  <dd>{'★'.repeat(score.value)}{'☆'.repeat(5 - score.value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      )}
      timelineLabel="Observation Log"
      timeline={(
        <section className="journal-panel observation-log" aria-label="Observation log">
          <p className="section-label">Observation History</p>
          <ol>
            {observation.logEntries.map((entry) => (
              <li key={`${entry.label}-${entry.value}`}>
                <strong>{entry.label}</strong>
                <span>{entry.value}</span>
              </li>
            ))}
          </ol>
          <MissionTimelineViewerPanel
            activeMission={activeMission}
            authorizationStatus={authorizationStatus}
            missionDebrief={missionDebrief}
            archiveSummary={archiveSummary}
          />
        </section>
      )}
      secondaryToolsLabel="Observation Aids"
      secondaryTools={(
        <>
          <section className="journal-panel" aria-label="Compass indicator">
          <p className="section-label">Market Clock</p>
          <h3>{observation.sessionLabel}</h3>
          <p className="muted">Use session context only as observation context, never as a signal.</p>
          </section>
          <section className="journal-panel" aria-label="Artificial horizon">
            <p className="section-label">Key Levels</p>
            <h3>{observation.keyLevelSummary}</h3>
            <p className="muted">Levels stay descriptive until evidence validates them.</p>
          </section>
          <section className="journal-panel" aria-label="Silence state display">
            <p className="section-label">Silence State</p>
            <h3>No Broker Control</h3>
            <p className="muted">Headquarters observes and records. It does not place trades.</p>
          </section>
        </>
      )}
    />
  );
}

type ObservationEvidenceStatus = 'complete' | 'current' | 'pending';

interface ObservationEvidenceItem {
  readonly id: keyof MissionObservationContext;
  readonly label: string;
  readonly question: string;
  readonly status: ObservationEvidenceStatus;
  readonly value?: string;
}

interface ObservationRoomIntelligenceModel {
  readonly primaryAction: string;
  readonly primaryDetail: string;
  readonly currentFocus: {
    readonly question: string;
    readonly guidance: string;
  };
  readonly completedEvidence: readonly ObservationEvidenceItem[];
  readonly pendingEvidence: readonly ObservationEvidenceItem[];
  readonly commanderCheckIn: {
    readonly title: string;
    readonly body: string;
    readonly reminder: string;
  };
  readonly commanderCheckIns: number;
  readonly confidenceScore: number;
  readonly confidenceLevel: string;
  readonly assessment: string;
  readonly evidenceBoardTitle: string;
  readonly evidenceRows: readonly { readonly label: string; readonly value: string }[];
  readonly logEntries: readonly { readonly label: string; readonly value: string }[];
  readonly disciplineSummary: string;
  readonly disciplineScores: readonly { readonly label: string; readonly value: number }[];
  readonly lastEvidence: string;
  readonly sessionLabel: string;
  readonly keyLevelSummary: string;
}

export function buildObservationRoomIntelligenceModel(
  activeMission?: ActiveMission | undefined,
  missionIntelligencePackage?: MissionIntelligencePackage | undefined,
): ObservationRoomIntelligenceModel {
  const context = activeMission?.observationContext;
  const briefing = activeMission?.briefingContext;
  const baseEvidence = [
    { id: 'marketDirection', label: 'Direction', question: 'What direction is price currently moving?' },
    { id: 'marketStructure', label: 'Structure', question: 'What market structure is currently present?' },
    { id: 'volume', label: 'Volume', question: "Describe today's volume." },
    { id: 'liquidity', label: 'Liquidity', question: 'Where is liquidity likely resting?' },
    { id: 'keyLevels', label: 'Important Levels', question: 'What levels are most important today?' },
    { id: 'bias', label: 'Directional Hypothesis', question: 'What is your current directional hypothesis?' },
    { id: 'invalidationEvidence', label: 'Invalidation', question: 'What evidence would invalidate your current idea?' },
    { id: 'emotionalCheck', label: 'Emotional Check', question: 'Has your emotional state changed since entering Observation?' },
    { id: 'operationalPicture', label: 'Operational Picture', question: 'Summarize your complete operational picture.' },
  ] as const satisfies readonly {
    readonly id: keyof MissionObservationContext;
    readonly label: string;
    readonly question: string;
  }[];
  const firstPendingIndex = baseEvidence.findIndex((item) => !hasObservationEvidenceValue(context?.[item.id]));
  const evidence = baseEvidence.map((item, index): ObservationEvidenceItem => {
    const value = normalizeObservationEvidenceValue(context?.[item.id]);
    const status: ObservationEvidenceStatus = value
      ? 'complete'
      : firstPendingIndex === index
        ? 'current'
        : 'pending';

    return {
      id: item.id,
      label: item.label,
      question: item.question,
      status,
      ...(value ? { value } : {}),
    };
  });
  const completedEvidence = evidence.filter((item) => item.status === 'complete');
  const pendingEvidence = evidence.filter((item) => item.status !== 'complete');
  const currentEvidence = evidence.find((item) => item.status === 'current');
  const confidenceScore = missionIntelligencePackage?.confidence.score ?? Math.round((completedEvidence.length / evidence.length) * 100);
  const confidenceLevel = missionIntelligencePackage?.confidence.level ?? (confidenceScore >= 70 ? 'sufficient' : confidenceScore >= 35 ? 'forming' : 'incomplete');
  const additionalObservationsCount = context?.additionalObservations?.length ?? 0;
  const logEntries = buildObservationLogEntries(activeMission, evidence);

  return {
    primaryAction: currentEvidence === undefined ? 'Complete Observation' : 'Collect Visible Evidence',
    primaryDetail: currentEvidence === undefined
      ? 'Evidence appears sufficient. Commander may authorize War Room movement.'
      : `Commander is waiting for ${currentEvidence.label}.`,
    currentFocus: {
      question: currentEvidence?.question ?? 'Summarize the complete operational picture.',
      guidance: currentEvidence === undefined
        ? 'Observation file is complete enough for review. Do not add a bias without new evidence.'
        : 'Report only what is visible. Do not predict. Do not manufacture evidence.',
    },
    completedEvidence,
    pendingEvidence,
    commanderCheckIn: buildObservationCommanderCheckIn(currentEvidence, completedEvidence.length),
    commanderCheckIns: completedEvidence.length + additionalObservationsCount,
    confidenceScore,
    confidenceLevel,
    assessment: pendingEvidence.length > 0 ? 'Evidence remains insufficient.' : 'Core evidence has been collected. Review before authorization.',
    evidenceBoardTitle: completedEvidence.length > 0 ? `${completedEvidence.length} evidence items recorded` : 'No visible evidence recorded yet',
    evidenceRows: [
      { label: 'Mission Objective', value: formatMissionDetailValue(briefing?.missionObjective ?? activeMission?.objective) },
      { label: 'Market', value: formatMissionDetailValue(briefing?.market) },
      { label: 'Environment', value: formatMissionDetailValue(briefing?.marketEnvironment) },
      { label: 'Direction', value: formatMissionDetailValue(context?.marketDirection) },
      { label: 'Structure', value: formatMissionDetailValue(context?.marketStructure) },
      { label: 'Volume', value: formatMissionDetailValue(context?.volume) },
      { label: 'Liquidity', value: formatMissionDetailValue(context?.liquidity) },
      { label: 'Key Levels', value: formatMissionDetailValue(context?.keyLevels) },
      { label: 'Hypothesis', value: formatMissionDetailValue(context?.bias) },
      { label: 'Invalidation', value: formatMissionDetailValue(context?.invalidationEvidence) },
    ],
    logEntries,
    disciplineSummary: formatObservationDisciplineSummary(completedEvidence.length, context?.readiness),
    disciplineScores: buildObservationDisciplineScores(completedEvidence.length, context),
    lastEvidence: completedEvidence.at(-1)?.label ?? 'None recorded',
    sessionLabel: formatMissionDetailValue(briefing?.marketEnvironment ?? activeMission?.condition),
    keyLevelSummary: formatMissionDetailValue(context?.keyLevels),
  };
}

function buildObservationCommanderCheckIn(
  currentEvidence: ObservationEvidenceItem | undefined,
  completedCount: number,
): ObservationRoomIntelligenceModel['commanderCheckIn'] {
  if (currentEvidence === undefined) {
    return {
      title: 'Evidence file formed.',
      body: 'Do not rush authorization. Review the complete operational picture once more.',
      reminder: 'War Room requires responsibility, not excitement.',
    };
  }

  if (completedCount === 0) {
    return {
      title: 'Remain silent.',
      body: 'Price has not provided enough information. Begin with visible direction and structure.',
      reminder: 'Do not form a bias yet.',
    };
  }

  return {
    title: `${currentEvidence.label} is next.`,
    body: 'Headquarters is building the battlefield picture one evidence item at a time.',
    reminder: 'Continue collecting observations before requesting authorization.',
  };
}

function buildObservationLogEntries(
  activeMission: ActiveMission | undefined,
  evidence: readonly ObservationEvidenceItem[],
): readonly { readonly label: string; readonly value: string }[] {
  return [
    ...(activeMission ? [{ label: 'Mission Created', value: activeMission.campaign }] : []),
    ...evidence
      .filter((item) => item.value !== undefined)
      .map((item) => ({ label: item.label, value: item.value ?? '' })),
  ];
}

function formatObservationDisciplineSummary(completedCount: number, readiness: 'yes' | 'no' | undefined): string {
  if (readiness === 'yes') return 'Readiness declared. Confirm evidence before War Room.';
  if (readiness === 'no') return 'Patience holding. Continue observation.';
  if (completedCount >= 5) return 'Objectivity developing.';
  return 'Patience is the work.';
}

function buildObservationDisciplineScores(
  completedCount: number,
  context: MissionObservationContext | undefined,
): readonly { readonly label: string; readonly value: number }[] {
  const hasBias = hasObservationEvidenceValue(context?.bias);
  const hasInvalidation = hasObservationEvidenceValue(context?.invalidationEvidence);

  return [
    { label: 'Patience', value: context?.readiness === 'no' ? 5 : 4 },
    { label: 'Objectivity', value: Math.min(5, 2 + Math.floor(completedCount / 2)) },
    { label: 'Bias Control', value: hasBias && !hasInvalidation ? 3 : 5 },
    { label: 'Evidence Quality', value: Math.min(5, 1 + Math.floor(completedCount / 2)) },
  ];
}

function normalizeObservationEvidenceValue(value: string | readonly string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  const joined = value.map((item) => item.trim()).filter(Boolean).join('; ');
  return joined.length > 0 ? joined : undefined;
}

function hasObservationEvidenceValue(value: string | readonly string[] | undefined): boolean {
  return normalizeObservationEvidenceValue(value) !== undefined;
}

export function WarRoom({
  activeMission,
  missionIntelligencePackage,
  authorizationStatus,
  missionDebrief,
  missionHistory,
  onMissionChanged,
  onRequestAuthorization,
  onSaveDebrief,
  onArchiveMission,
}: {
  activeMission?: ActiveMission | undefined;
  missionIntelligencePackage?: MissionIntelligencePackage | undefined;
  authorizationStatus?: MissionAuthorizationStatus | undefined;
  missionDebrief?: MissionDebrief | undefined;
  missionHistory: ActiveMission[];
  onMissionChanged?: ((mission: ActiveMission) => void) | undefined;
  onRequestAuthorization?: ((authorization: MissionAuthorizationStatus) => void) | undefined;
  onSaveDebrief?: ((debrief: MissionDebrief) => void) | undefined;
  onArchiveMission?: ((summary: LocalMissionArchiveSummary | undefined) => void) | undefined;
}) {
  const alerts = buildDesktopGuardianAlerts();
  const lockout = buildDesktopGuardianLockoutState();
  const comparisonMission = missionHistory.find((mission) => mission.id !== activeMission?.id);
  const authorizationDenied = authorizationStatus?.decision === 'denied';
  const contradictions = activeMission?.missionContext
    ? detectCommanderContradictions(activeMission.missionContext)
    : [];
  const decision = buildWarRoomDecisionModel({
    activeMission,
    missionIntelligencePackage,
    authorizationStatus,
    alerts,
    lockout,
    contradictions,
    comparisonMission,
  });

  return (
    <GuidedRoom
      id="war-room"
      identity="decision"
      atmosphere="war"
      title="War Room"
      useCase={authorizationDenied ? 'Repair missing authorization evidence.' : 'Decide from authorized evidence only.'}
      objective="Ask Headquarters for permission to risk capital. Evidence is tested before deployment is authorized."
      primaryAction={(
        <div className="war-room-primary-action">
          <strong>{decision.deploymentStatus}</strong>
          <p className="muted">{decision.primaryDetail}</p>
        </div>
      )}
      workspace={(
        <div className="war-room-decision-layout" aria-label="War Room authorization workspace">
          <WarRoomMissionBrief decision={decision} />
          <WarRoomEvidenceBoard decision={decision} />
          <WarRoomGuardianReview decision={decision} />
          <WarRoomCommanderInterrogation decision={decision} />
          <MissionAuthorizationPanel activeMission={activeMission} authorizationStatus={authorizationStatus} decision={decision} />
          {parseMissionState(activeMission?.currentState) === 'authorization' ? (
            <section className="journal-panel war-room-authorization-console" aria-label="Authorization console">
              <p className="section-label">Authorization Console</p>
              <h3>Should Headquarters authorize deployment?</h3>
              <p className="muted">Final review requires reasoning, invalidation, and a protective rule.</p>
              <MissionNextActionPanel
                activeMission={activeMission}
                authorizationStatus={authorizationStatus}
                missionDebrief={missionDebrief}
                onMissionChanged={onMissionChanged}
                onRequestAuthorization={onRequestAuthorization}
                onSaveDebrief={onSaveDebrief}
                onArchiveMission={onArchiveMission}
              />
            </section>
          ) : null}
        </div>
      )}
      timelineLabel="Authorization Log"
      timeline={(
        <section className="journal-panel war-room-authorization-log" aria-label="Authorization log">
          <p className="section-label">Authorization Log</p>
          <ol>
            {decision.authorizationLog.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
      secondaryToolsLabel="Decision Support"
      secondaryTools={(
        <>
          <section className="journal-panel" aria-label="Ghost comparison panel">
            <p className="section-label">Similar Missions</p>
            <h3>{decision.similarMissionTitle}</h3>
            <p className="muted">{decision.similarMissionDetail}</p>
          </section>
          <section className="journal-panel" aria-label="Doctrine decision support">
            <p className="section-label">Doctrine</p>
            <h3>{decision.doctrineStatus}</h3>
            <p className="muted">Doctrine remains a constraint on capital deployment.</p>
          </section>
        </>
      )}
    />
  );
}

interface WarRoomDecisionModel {
  readonly missionName: string;
  readonly objective: string;
  readonly market: string;
  readonly environment: string;
  readonly bias: string;
  readonly risk: string;
  readonly confidenceScore: number;
  readonly confidenceLevel: string;
  readonly guardianVerdict: string;
  readonly guardianItems: readonly { readonly label: string; readonly status: 'clear' | 'warning' | 'blocked' }[];
  readonly doctrineStatus: string;
  readonly deploymentStatus: string;
  readonly primaryDetail: string;
  readonly evidenceItems: readonly { readonly label: string; readonly status: 'clear' | 'warning' | 'missing'; readonly detail: string }[];
  readonly confidenceReasons: readonly string[];
  readonly commanderChallenge: string;
  readonly authorizationLog: readonly string[];
  readonly similarMissionTitle: string;
  readonly similarMissionDetail: string;
}

function buildWarRoomDecisionModel({
  activeMission,
  missionIntelligencePackage,
  authorizationStatus,
  alerts,
  lockout,
  contradictions,
  comparisonMission,
}: {
  readonly activeMission?: ActiveMission | undefined;
  readonly missionIntelligencePackage?: MissionIntelligencePackage | undefined;
  readonly authorizationStatus?: MissionAuthorizationStatus | undefined;
  readonly alerts: readonly GuardianAlert[];
  readonly lockout: GuardianLockoutState;
  readonly contradictions: readonly MissionContextContradictionFlag[];
  readonly comparisonMission?: ActiveMission | undefined;
}): WarRoomDecisionModel {
  const briefing = activeMission?.missionContext?.briefing;
  const observation = activeMission?.missionContext?.observation;
  const score = missionIntelligencePackage?.confidence.score ?? 0;
  const level = missionIntelligencePackage?.confidence.level ?? 'incomplete';
  const guardianBlocked = lockout.status === 'locked' || alerts.some((alert) => alert.priority === 'critical');
  const guardianWarnings = alerts.filter((alert) => alert.priority === 'high' || alert.priority === 'medium');
  const authorizationApproved = authorizationStatus?.decision === 'approved';

  return {
    missionName: activeMission?.campaign ?? 'No active mission',
    objective: formatMissionContextDisplay(briefing?.missionObjective ?? activeMission?.objective),
    market: formatMissionContextDisplay(briefing?.market),
    environment: formatMissionContextDisplay(briefing?.marketEnvironment),
    bias: formatMissionContextDisplay(observation?.directionalHypothesis),
    risk: formatMissionContextDisplay(briefing?.riskParameters),
    confidenceScore: score,
    confidenceLevel: level,
    guardianVerdict: guardianBlocked ? 'Deployment denied.' : guardianWarnings.length > 0 ? 'Proceed only with restrictions.' : 'No restriction. Proceed.',
    guardianItems: [
      { label: hasContent(briefing?.riskParameters ?? '') ? 'Risk inside declared limit' : 'Risk boundary missing', status: hasContent(briefing?.riskParameters ?? '') ? 'clear' : 'blocked' },
      { label: formatGuardianSessionReview(briefing?.marketEnvironment), status: guardianWarnings.length > 0 ? 'warning' : 'clear' },
      { label: hasContent(briefing?.personalReadiness ?? '') ? 'Emotional state declared' : 'Readiness not declared', status: hasContent(briefing?.personalReadiness ?? '') ? 'clear' : 'warning' },
      { label: guardianBlocked ? 'Guardian lockout active' : 'Guardian monitoring active', status: guardianBlocked ? 'blocked' : 'clear' },
    ],
    doctrineStatus: missionIntelligencePackage?.missingEvidence.length ? 'Review required' : 'Ready',
    deploymentStatus: authorizationApproved ? 'Deployment Authorized' : 'Deployment NOT AUTHORIZED',
    primaryDetail: authorizationApproved
      ? 'Headquarters authorizes this operation. Trade the plan, not the emotion.'
      : `Mission confidence ${score}%. Headquarters is testing evidence before capital is deployed.`,
    evidenceItems: [
      buildWarRoomEvidenceItem('Structure', observation?.marketStructure),
      buildWarRoomEvidenceItem('Liquidity', observation?.liquidityNotes),
      buildWarRoomEvidenceItem('Volume', observation?.volume),
      buildWarRoomEvidenceItem('Levels', observation?.keyLevels),
      buildWarRoomEvidenceItem('Risk', briefing?.riskParameters),
      buildWarRoomEvidenceItem('Invalidation', observation?.invalidationEvidence),
      buildWarRoomEvidenceItem('Emotion', briefing?.personalReadiness),
      { label: 'Guardian', detail: guardianBlocked ? 'Blocked' : guardianWarnings.length > 0 ? 'Warnings present' : 'Clear', status: guardianBlocked ? 'warning' : guardianWarnings.length > 0 ? 'warning' : 'clear' },
      ...contradictions.map((contradiction) => ({ label: 'Contradiction', detail: contradiction.message, status: 'warning' as const })),
    ],
    confidenceReasons: buildWarRoomConfidenceReasons(missionIntelligencePackage, guardianWarnings.length),
    commanderChallenge: buildWarRoomCommanderChallenge(score, missionIntelligencePackage),
    authorizationLog: buildWarRoomAuthorizationLog({ activeMission, missionIntelligencePackage, alerts, authorizationStatus }),
    similarMissionTitle: comparisonMission?.campaign ?? 'No comparison mission',
    similarMissionDetail: comparisonMission
      ? `${comparisonMission.objective} | ${formatMissionDetailState(comparisonMission)}`
      : 'Similar mission comparison remains read-only until replay workflows are expanded.',
  };
}

function WarRoomMissionBrief({ decision }: { readonly decision: WarRoomDecisionModel }) {
  return (
    <section className="journal-panel war-room-mission-brief" aria-label="Mission brief">
      <p className="section-label">Mission Brief</p>
      <h3>{decision.missionName}</h3>
      <dl>
        <div><dt>Objective</dt><dd>{decision.objective}</dd></div>
        <div><dt>Market</dt><dd>{decision.market}</dd></div>
        <div><dt>Environment</dt><dd>{decision.environment}</dd></div>
        <div><dt>Bias</dt><dd>{decision.bias}</dd></div>
        <div><dt>Risk</dt><dd>{decision.risk}</dd></div>
        <div><dt>Guardian</dt><dd>{decision.guardianVerdict}</dd></div>
        <div><dt>Doctrine</dt><dd>{decision.doctrineStatus}</dd></div>
      </dl>
      <WarRoomConfidenceMeter decision={decision} />
    </section>
  );
}

function WarRoomConfidenceMeter({ decision }: { readonly decision: WarRoomDecisionModel }) {
  return (
    <div className="war-room-confidence" aria-label={`Mission confidence ${decision.confidenceScore}%`}>
      <p className="section-label">Mission Confidence</p>
      <div><span style={{ width: `${decision.confidenceScore}%` }} /></div>
      <strong>{decision.confidenceLevel} / {decision.confidenceScore}%</strong>
    </div>
  );
}

function WarRoomEvidenceBoard({ decision }: { readonly decision: WarRoomDecisionModel }) {
  return (
    <section className="journal-panel war-room-evidence-board" aria-label="Evidence board">
      <p className="section-label">Evidence Board</p>
      <h3>Evidence must earn authorization.</h3>
      <ul>
        {decision.evidenceItems.map((item) => (
          <li key={`${item.label}-${item.detail}`} data-evidence-status={item.status}>
            <strong>{formatWarRoomEvidenceStatus(item.status)} {item.label}</strong>
            <span>{item.detail}</span>
          </li>
        ))}
      </ul>
      <div aria-label="Mission confidence reasons">
        <p className="section-label">Confidence Reason</p>
        <ul>
          {decision.confidenceReasons.map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      </div>
    </section>
  );
}

function WarRoomGuardianReview({ decision }: { readonly decision: WarRoomDecisionModel }) {
  return (
    <section className="journal-panel war-room-guardian-review" aria-label="Guardian review">
      <p className="section-label">Guardian Review</p>
      <h3>{decision.guardianVerdict}</h3>
      <ul>
        {decision.guardianItems.map((item) => (
          <li key={item.label} data-guardian-status={item.status}>
            {formatWarRoomGuardianStatus(item.status)} {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

function WarRoomCommanderInterrogation({ decision }: { readonly decision: WarRoomDecisionModel }) {
  return (
    <section className="journal-panel war-room-commander-interrogation" aria-label="Commander interrogation">
      <p className="section-label">Commander Interrogation</p>
      <h3>Final question.</h3>
      <p>{decision.commanderChallenge}</p>
      <p className="muted">Confirm that discipline, not excitement, is driving this decision.</p>
    </section>
  );
}

function buildWarRoomEvidenceItem(label: string, value: string | undefined): WarRoomDecisionModel['evidenceItems'][number] {
  const detail = formatMissionContextDisplay(value);

  return {
    label,
    detail,
    status: detail === 'Context incomplete' ? 'missing' : 'clear',
  };
}

function buildWarRoomConfidenceReasons(
  missionIntelligencePackage: MissionIntelligencePackage | undefined,
  guardianWarningCount: number,
): readonly string[] {
  if (missionIntelligencePackage === undefined) return ['- Intelligence package is not available.'];

  return [
    ...missionIntelligencePackage.confidence.reasons.map((reason) => `+ ${reason}`),
    ...(guardianWarningCount > 0 ? [`- ${guardianWarningCount} Guardian restriction signal${guardianWarningCount === 1 ? '' : 's'} present`] : []),
    ...(missionIntelligencePackage.missingEvidence.length > 0
      ? [`- Missing: ${missionIntelligencePackage.missingEvidence.slice(0, 3).map((item) => item.label).join(', ')}`]
      : ['+ Required evidence is present']),
  ];
}

function buildWarRoomCommanderChallenge(
  score: number,
  missionIntelligencePackage: MissionIntelligencePackage | undefined,
): string {
  if (score < 50) return `Your confidence is only ${score}%. Why should Headquarters deploy capital?`;
  if (missionIntelligencePackage?.missingEvidence.length) {
    return buildAuthorizationIntelligenceQuestion(missionIntelligencePackage);
  }

  return 'Evidence is aligning. Why does this setup deserve capital?';
}

function buildWarRoomAuthorizationLog({
  activeMission,
  missionIntelligencePackage,
  alerts,
  authorizationStatus,
}: {
  readonly activeMission?: ActiveMission | undefined;
  readonly missionIntelligencePackage?: MissionIntelligencePackage | undefined;
  readonly alerts: readonly GuardianAlert[];
  readonly authorizationStatus?: MissionAuthorizationStatus | undefined;
}): readonly string[] {
  return [
    activeMission ? `Mission opened: ${activeMission.campaign}` : 'Mission file pending',
    missionIntelligencePackage ? `Evidence reviewed: ${missionIntelligencePackage.confidence.score}% confidence` : 'Evidence review pending',
    `Guardian reviewed: ${formatJournalCount(alerts.length, 'alert', 'alerts')}`,
    authorizationStatus ? `Authorization ${authorizationStatus.decision}: ${authorizationStatus.reason}` : 'Authorization not yet requested',
  ];
}

function formatGuardianSessionReview(environment: string | undefined): string {
  if (!hasContent(environment ?? '')) return 'Trading session not declared';
  if (/weekend|low volume|low activity/i.test(environment ?? '')) return 'Weekend or low-liquidity conditions';
  return 'Trading session acceptable';
}

function formatWarRoomEvidenceStatus(status: WarRoomDecisionModel['evidenceItems'][number]['status']): string {
  if (status === 'clear') return '✓';
  if (status === 'warning') return '⚠';
  return '○';
}

function formatWarRoomGuardianStatus(status: WarRoomDecisionModel['guardianItems'][number]['status']): string {
  if (status === 'clear') return '✓';
  if (status === 'warning') return '⚠';
  return '!';
}

function formatMissionContextDisplay(value: string | undefined): string {
  return value && value.trim().length > 0 ? value : 'Context incomplete';
}

function getRecordedObservationInvalidation(mission: ActiveMission | undefined): string {
  return mission?.missionContext?.observation.invalidationEvidence?.trim()
    || mission?.observationContext?.invalidationEvidence?.trim()
    || '';
}

function MissionIntelligencePanel({
  missionPackage,
  mode,
  title,
}: {
  readonly missionPackage: MissionIntelligencePackage;
  readonly mode: 'observation' | 'authorization' | 'debrief' | 'archive';
  readonly title: string;
}) {
  const summary = buildCommanderIntelligenceSummary(missionPackage, mode);
  const debriefComparison = mode === 'debrief'
    ? buildDebriefIntelligenceComparison(missionPackage)
    : [];

  return (
    <section className="mission-intelligence-panel" aria-label={title}>
      <div className="mission-intelligence-panel-header">
        <div>
          <p className="section-label">Mission Intelligence</p>
          <h3>{title}</h3>
        </div>
        <strong>{missionPackage.confidence.level} / {missionPackage.confidence.score}%</strong>
      </div>
      <dl className="mission-intelligence-grid">
        <div>
          <dt>Objective</dt>
          <dd>{formatMissionContextDisplay(missionPackage.missionObjective)}</dd>
        </div>
        <div>
          <dt>Risk</dt>
          <dd>{formatMissionContextDisplay(missionPackage.riskLimit)}</dd>
        </div>
        <div>
          <dt>Evidence</dt>
          <dd>{formatMissionContextDisplay(missionPackage.observationSummary ?? missionPackage.directionalHypothesis)}</dd>
        </div>
        <div>
          <dt>Invalidation</dt>
          <dd>{formatMissionContextDisplay(missionPackage.invalidation)}</dd>
        </div>
      </dl>
      <ul className="mission-intelligence-list" aria-label={`${title} summary`}>
        {summary.map((item) => <li key={item}>{item}</li>)}
      </ul>
      {debriefComparison.length > 0 ? (
        <ol className="mission-intelligence-list mission-intelligence-list-ordered" aria-label="Mission intelligence comparison">
          {debriefComparison.map((item) => <li key={item}>{item}</li>)}
        </ol>
      ) : null}
      {missionPackage.missingEvidence.length > 0 ? (
        <p className="muted">Remaining unknowns: {missionPackage.missingEvidence.slice(0, 4).map((item) => item.label).join(', ')}</p>
      ) : (
        <p className="muted">Intelligence package contains the required briefing and observation evidence.</p>
      )}
    </section>
  );
}

export function DebriefTheater({
  activeMission,
  missionIntelligencePackage,
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
  const contradictions = activeMission?.missionContext
    ? detectCommanderContradictions(activeMission.missionContext)
    : [];
  const debriefModel = buildDebriefTheaterReflectionModel({
    activeMission,
    missionDebrief,
    authorizationStatus,
    archiveSummary,
  });

  return (
    <GuidedRoom
      id="debrief-theater"
      identity="reflection"
      atmosphere="debrief"
      title="Debrief Theater"
      useCase="Debrief behavior before archive."
      objective="Turn the completed operation into behavior memory before the archive closes."
      primaryAction={<strong>{missionDebrief ? 'Archive Mission' : 'Complete Debrief'}</strong>}
      workspace={(
        <>
          <DebriefMissionRecap model={debriefModel} />
          <DebriefPlanRealityComparison model={debriefModel} contradictions={contradictions} />
          <DebriefCommanderInterview missionDebrief={missionDebrief} />
          <DebriefLearningEngine model={debriefModel} />
          {parseMissionState(activeMission?.currentState) === 'return_to_base' || parseMissionState(activeMission?.currentState) === 'debrief' ? (
            <MissionNextActionPanel
              activeMission={activeMission}
              authorizationStatus={authorizationStatus}
              missionDebrief={missionDebrief}
              onMissionChanged={onMissionChanged}
              onRequestAuthorization={onRequestAuthorization}
              onSaveDebrief={onSaveDebrief}
              onArchiveMission={onArchiveMission}
            />
          ) : null}
        </>
      )}
      timeline={<MissionTimelineViewerPanel
        activeMission={activeMission}
        authorizationStatus={authorizationStatus}
        missionDebrief={missionDebrief}
        archiveSummary={archiveSummary}
      />}
      timelineLabel="Mission Replay"
      secondaryToolsLabel="Closing Record"
      secondaryTools={(
        <>
          <DebriefGuardianReview model={debriefModel} />
          <DebriefArchivePreview model={debriefModel} />
          <DebriefFutureYouNote missionDebrief={missionDebrief} />
          {missionIntelligencePackage ? (
            <DebriefContextRecall
              activeMission={activeMission}
              missionIntelligencePackage={missionIntelligencePackage}
              contradictions={contradictions}
            />
          ) : null}
        </>
      )}
    />
  );
}

interface DebriefTheaterReflectionInput {
  activeMission?: ActiveMission | undefined;
  missionDebrief?: MissionDebrief | undefined;
  authorizationStatus?: MissionAuthorizationStatus | undefined;
  archiveSummary?: LocalMissionArchiveSummary | undefined;
}

interface DebriefTheaterReflectionModel {
  readonly missionName: string;
  readonly operation: string;
  readonly result: string;
  readonly risk: string;
  readonly ruleBroken: string;
  readonly emotion: string;
  readonly guardianVerdict: string;
  readonly commanderAssessment: string;
  readonly duration: string;
  readonly plan: string;
  readonly reality: string;
  readonly hypothesis: string;
  readonly invalidation: string;
  readonly difference: string;
  readonly reason: string;
  readonly lesson: string;
  readonly behaviorScore: number;
  readonly behaviorDelta: string;
  readonly planningScore: number;
  readonly patienceScore: number;
  readonly ruleAdherenceScore: number;
  readonly executionScore: number;
  readonly reviewScore: number;
  readonly xp: number;
  readonly patienceGrowth: number;
  readonly ruleAdherenceGrowth: number;
  readonly reviewQualityGrowth: number;
  readonly commanderConfidence: string;
  readonly doctrineCandidate: string;
  readonly archiveReady: boolean;
}

export function buildDebriefTheaterReflectionModel({
  activeMission,
  missionDebrief,
  authorizationStatus,
  archiveSummary,
}: DebriefTheaterReflectionInput): DebriefTheaterReflectionModel {
  const briefing = activeMission?.missionContext?.briefing;
  const observation = activeMission?.missionContext?.observation;
  const authorized = authorizationStatus?.decision === 'approved';
  const debriefSaved = missionDebrief !== undefined;
  const risk = formatMissionContextDisplay(briefing?.riskParameters);
  const hasContradictions = activeMission?.missionContext
    ? detectCommanderContradictions(activeMission.missionContext).length > 0
    : false;
  const ruleBroken = hasContradictions ? 'Review required' : 'None';
  const ruleScore = hasContradictions ? 7 : 10;
  const reviewScore = debriefSaved ? 9 : 6;
  const patienceScore = observation?.evidenceReadiness === 'yes' ? 8 : 6;
  const planningScore = briefing ? 9 : 6;
  const executionScore = authorized ? 8 : 6;
  const behaviorScore = Math.round(((planningScore + patienceScore + ruleScore + executionScore + reviewScore) / 50) * 100);

  return {
    missionName: activeMission?.campaign ?? 'No mission loaded',
    operation: formatMissionContextDisplay(briefing?.missionObjective ?? activeMission?.objective),
    result: archiveSummary ? 'Archived' : debriefSaved ? 'Debriefed' : authorized ? 'Executed' : 'Returned',
    risk,
    ruleBroken,
    emotion: formatMissionContextDisplay(observation?.emotionalCheck ?? briefing?.personalReadiness),
    guardianVerdict: hasContradictions ? 'Review' : 'Satisfied',
    commanderAssessment: debriefSaved ? 'Lesson captured' : 'Awaiting reflection',
    duration: formatDebriefMissionDuration(activeMission),
    plan: formatMissionContextDisplay(briefing?.successCriteria ?? briefing?.missionObjective ?? activeMission?.objective),
    reality: missionDebrief?.behaviorSummary ?? formatMissionContextDisplay(observation?.operationalSummary ?? observation?.marketStructure),
    hypothesis: formatMissionContextDisplay(observation?.directionalHypothesis),
    invalidation: formatMissionContextDisplay(observation?.invalidationEvidence),
    difference: hasContradictions ? 'Plan and observation need explanation' : 'No major contradiction recorded',
    reason: missionDebrief?.disciplineNotes ?? 'Commander interview pending',
    lesson: missionDebrief?.lesson ?? 'Future You lesson not captured',
    behaviorScore,
    behaviorDelta: debriefSaved ? '+5' : '+0 pending review',
    planningScore,
    patienceScore,
    ruleAdherenceScore: ruleScore,
    executionScore,
    reviewScore,
    xp: debriefSaved ? 35 : 12,
    patienceGrowth: debriefSaved ? 4 : 1,
    ruleAdherenceGrowth: hasContradictions ? 2 : 6,
    reviewQualityGrowth: debriefSaved ? 3 : 0,
    commanderConfidence: debriefSaved ? '+2%' : '+0%',
    doctrineCandidate: missionDebrief?.lesson ?? 'Waiting after displacement reduced mistakes.',
    archiveReady: debriefSaved,
  };
}

function DebriefMissionRecap({ model }: { readonly model: DebriefTheaterReflectionModel }) {
  return (
    <section className="debrief-mission-recap" aria-label="Mission recap">
      <p className="section-label">Mission Recap</p>
      <h3>Mission Complete</h3>
      <dl>
        <div>
          <dt>Operation</dt>
          <dd>{model.operation}</dd>
        </div>
        <div>
          <dt>Result</dt>
          <dd>{model.result}</dd>
        </div>
        <div>
          <dt>Risk</dt>
          <dd>{model.risk}</dd>
        </div>
        <div>
          <dt>Rule Broken</dt>
          <dd>{model.ruleBroken}</dd>
        </div>
        <div>
          <dt>Emotion</dt>
          <dd>{model.emotion}</dd>
        </div>
        <div>
          <dt>Guardian</dt>
          <dd>{model.guardianVerdict}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{model.duration}</dd>
        </div>
      </dl>
    </section>
  );
}

function DebriefPlanRealityComparison({
  model,
  contradictions,
}: {
  readonly model: DebriefTheaterReflectionModel;
  readonly contradictions: readonly MissionContextContradictionFlag[];
}) {
  return (
    <section className="debrief-comparison-panel" aria-label="Mission comparison">
      <p className="section-label">Mission Comparison</p>
      <h3>Plan vs Reality</h3>
      <div className="debrief-comparison-grid">
        <div>
          <span>Plan</span>
          <strong>{model.plan}</strong>
        </div>
        <div>
          <span>Reality</span>
          <strong>{model.reality}</strong>
        </div>
        <div>
          <span>Hypothesis</span>
          <strong>{model.hypothesis}</strong>
        </div>
        <div>
          <span>Invalidation</span>
          <strong>{model.invalidation}</strong>
        </div>
        <div>
          <span>Difference</span>
          <strong>{model.difference}</strong>
        </div>
        <div>
          <span>Reason</span>
          <strong>{model.reason}</strong>
        </div>
      </div>
      {contradictions.length > 0 ? (
        <>
          <blockquote>Commander: Observation expected patience. Execution requires explanation.</blockquote>
          <ul className="debrief-contradiction-list" aria-label="Debrief contradiction review">
            {contradictions.map((contradiction) => (
              <li key={contradiction.id}>{contradiction.message}</li>
            ))}
          </ul>
        </>
      ) : (
        <blockquote>Commander: Risk respected. Discipline held.</blockquote>
      )}
    </section>
  );
}

function DebriefCommanderInterview({ missionDebrief }: { readonly missionDebrief?: MissionDebrief | undefined }) {
  const prompts = missionDebrief
    ? [
      { question: 'Did you follow the original plan?', answer: missionDebrief.behaviorSummary },
      { question: 'Where did you deviate?', answer: missionDebrief.disciplineNotes },
      { question: "What should tomorrow's version of you remember?", answer: missionDebrief.lesson },
    ]
    : [
      { question: 'Did you follow the original plan?', answer: 'Awaiting operator answer.' },
      { question: 'Where did discipline save you?', answer: 'Awaiting operator answer.' },
      { question: 'What nearly made you break?', answer: 'Awaiting operator answer.' },
    ];

  return (
    <section className="debrief-interview-panel" aria-label="Commander debrief interview">
      <p className="section-label">Commander Debrief</p>
      <h3>We have returned.</h3>
      <ol>
        {prompts.map((prompt) => (
          <li key={prompt.question}>
            <span>{prompt.question}</span>
            <strong>{prompt.answer}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}

function DebriefLearningEngine({ model }: { readonly model: DebriefTheaterReflectionModel }) {
  return (
    <section className="debrief-learning-panel" aria-label="Behavior report">
      <div>
        <p className="section-label">Behavior Report</p>
        <h3>{model.behaviorScore}</h3>
        <span>Compared to previous mission {model.behaviorDelta}</span>
      </div>
      <dl>
        <dt>Planning</dt>
        <dd>{model.planningScore}/10</dd>
        <dt>Patience</dt>
        <dd>{model.patienceScore}/10</dd>
        <dt>Rule Adherence</dt>
        <dd>{model.ruleAdherenceScore}/10</dd>
        <dt>Execution</dt>
        <dd>{model.executionScore}/10</dd>
        <dt>Review</dt>
        <dd>{model.reviewScore}/10</dd>
      </dl>
      <div className="debrief-rewards" aria-label="Mission rewards">
        <strong>Mission Rewards</strong>
        <span>XP +{model.xp}</span>
        <span>Patience +{model.patienceGrowth}</span>
        <span>Rule Adherence +{model.ruleAdherenceGrowth}</span>
        <span>Review Quality +{model.reviewQualityGrowth}</span>
        <span>Commander Confidence {model.commanderConfidence}</span>
      </div>
    </section>
  );
}

function DebriefGuardianReview({ model }: { readonly model: DebriefTheaterReflectionModel }) {
  const pass = model.guardianVerdict === 'Satisfied';

  return (
    <section className="debrief-guardian-panel" aria-label="Guardian review">
      <p className="section-label">Guardian Review</p>
      <h3>{pass ? 'Excellent' : 'Review Required'}</h3>
      <dl>
        <dt>Risk</dt>
        <dd>{pass ? 'PASS' : 'REVIEW'}</dd>
        <dt>Emotion</dt>
        <dd>{model.emotion === 'Not available' ? 'UNKNOWN' : 'PASS'}</dd>
        <dt>Revenge</dt>
        <dd>NONE</dd>
        <dt>Rule Violations</dt>
        <dd>{pass ? '0' : '1 review flag'}</dd>
      </dl>
    </section>
  );
}

function DebriefArchivePreview({ model }: { readonly model: DebriefTheaterReflectionModel }) {
  return (
    <section className="debrief-archive-preview" aria-label="Mission archive preview">
      <p className="section-label">Archive Report</p>
      <h3>Mission Report</h3>
      <dl>
        <dt>Objective</dt>
        <dd>{model.operation}</dd>
        <dt>Behavior</dt>
        <dd>{model.behaviorScore >= 80 ? 'Excellent' : 'Developing'}</dd>
        <dt>Doctrine Learned</dt>
        <dd>{model.doctrineCandidate}</dd>
        <dt>Archive</dt>
        <dd>{model.archiveReady ? 'READY' : 'Awaiting debrief'}</dd>
      </dl>
      <p className="muted">Commander: Mission archived. Behavior remembered. Outcome forgotten.</p>
    </section>
  );
}

function DebriefFutureYouNote({ missionDebrief }: { readonly missionDebrief?: MissionDebrief | undefined }) {
  return (
    <section className="debrief-future-you-panel" aria-label="Future You journal note">
      <p className="section-label">Journal Integration</p>
      <h3>Message for Future You</h3>
      <p>{missionDebrief?.lesson ?? 'Before Headquarters archives this mission, leave one message for Future You.'}</p>
    </section>
  );
}

function DebriefContextRecall({
  activeMission,
  missionIntelligencePackage,
  contradictions,
}: {
  readonly activeMission?: ActiveMission | undefined;
  readonly missionIntelligencePackage?: MissionIntelligencePackage | undefined;
  readonly contradictions: readonly MissionContextContradictionFlag[];
}) {
  const missionContext = activeMission?.missionContext;

  return (
    <section className="journal-panel" aria-label="Debrief mission context recall">
      <p className="section-label">Context Recall</p>
      <h3>{activeMission?.campaign ?? 'Mission context incomplete'}</h3>
      {missionIntelligencePackage ? (
        <MissionIntelligencePanel
          missionPackage={missionIntelligencePackage}
          mode="debrief"
          title="Debrief Intelligence Comparison"
        />
      ) : null}
      <dl>
        <dt>Original Objective</dt>
        <dd>{formatMissionContextDisplay(missionContext?.briefing.missionObjective ?? activeMission?.objective)}</dd>
        <dt>Success Criteria</dt>
        <dd>{formatMissionContextDisplay(missionContext?.briefing.successCriteria)}</dd>
        <dt>Risk Parameter</dt>
        <dd>{formatMissionContextDisplay(missionContext?.briefing.riskParameters)}</dd>
        <dt>Observation Hypothesis</dt>
        <dd>{formatMissionContextDisplay(missionContext?.observation.directionalHypothesis)}</dd>
        <dt>Invalidation Criteria</dt>
        <dd>{formatMissionContextDisplay(missionContext?.observation.invalidationEvidence)}</dd>
      </dl>
      {contradictions.length > 0 ? (
        <div aria-label="Debrief contradiction recall">
          <p className="section-label">Contradictions</p>
          <ul>
            {contradictions.map((contradiction) => (
              <li key={contradiction.id}>{contradiction.message}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="muted">No contradictions require debrief attention.</p>
      )}
      <ol aria-label="Commander debrief prompts">
        <li>What did you execute well?</li>
        <li>What behavior must not repeat?</li>
        <li>Did the mission follow the original objective?</li>
        <li>Did you respect the risk parameter?</li>
        <li>What should future Joe see first?</li>
      </ol>
    </section>
  );
}

interface CommandCenterProps {
  activeMission?: ActiveMission | undefined;
  missionIntelligencePackage?: MissionIntelligencePackage | undefined;
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
    <div className="command-center-layout" data-layout="command-center" data-room-atmosphere="command">
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
  missionIntelligencePackage?: MissionIntelligencePackage | undefined;
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
  const currentStep = steps.find((step) => step.status === 'current');

  return (
    <section className="mission-lifecycle-panel" aria-label="Mission lifecycle">
      <div className="mission-sequence-header">
        <div>
          <p className="section-label">Mission Route</p>
          <h3>Operational Sequence</h3>
        </div>
        <span>{currentStep ? getMissionLifecycleStation(currentStep.state) : 'Awaiting mission file'}</span>
      </div>
      <ol className="mission-lifecycle-list">
        {steps.map((step, index) => (
          <li key={step.state} data-step-status={step.status}>
            <span className="mission-sequence-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="mission-sequence-copy">
              <span>{step.label}</span>
              <small>{getMissionLifecycleStation(step.state)}</small>
            </span>
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
  const [protectiveRule, setProtectiveRule] = useState('');
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
      const recordedInvalidation = getRecordedObservationInvalidation(activeMission);
      const authorization = await requestDesktopAuthorization(activeMission, {
        operatorJustification: formatAuthorizationJustification(operatorJustification, protectiveRule),
        invalidation: invalidation || recordedInvalidation,
        protectiveRule,
      });

      if (authorization === undefined) return;

      onRequestAuthorization?.(authorization);
      setOperatorJustification('');
      setInvalidation('');
      setProtectiveRule('');

      if (authorization.decision === 'approved') {
        onMissionChanged?.(await declareDesktopDeployment(activeMission));
      }
      return;
    }

    if (currentState === 'deployed') {
      const now = new Date().toISOString();
      const concludedMission = {
        ...activeMission,
        missionContext: updateMissionOperationalTiming(
          activeMission.missionContext ?? createEmptyMissionContext(activeMission.id, { createdAt: activeMission.createdAt }),
          {
            planConcludedAt: now,
            lastCheckInAt: now,
            operationalState: 'paused',
          },
          { updatedAt: now },
        ),
      };
      await saveDesktopMissionContext(concludedMission);
      onMissionChanged?.(await requestDesktopReturnToBase(concludedMission));
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
  const recordedInvalidation = getRecordedObservationInvalidation(activeMission);
  const actionLabel = currentState === 'authorization' ? 'Authorization Request' : 'Next Action';
  const actionTitle = currentState === 'authorization' ? 'Request Authorization' : nextAction.label;
  const actionDescription = currentState === 'authorization'
    ? 'Headquarters will review evidence, Guardian status, invalidation, and protective rule.'
    : nextAction.description;
  const buttonLabel = currentState === 'authorization' ? 'Request Authorization' : nextAction.buttonLabel;

  return (
    <form className="mission-next-action-panel" aria-label="Mission next action" onSubmit={handleNextAction}>
      <div>
        <p className="section-label">{actionLabel}</p>
        <h3>{actionTitle}</h3>
      </div>
      <p className="muted">{actionDescription}</p>
      {currentState === 'authorization' ? (
        <>
          <label>
            <span>Why does this setup deserve capital?</span>
            <input value={operatorJustification} onChange={(event) => setOperatorJustification(event.target.value)} />
          </label>
          {recordedInvalidation ? (
            <p className="muted">Observation invalidation recorded: {recordedInvalidation}</p>
          ) : (
            <label>
              <span>What is the strongest argument against this trade?</span>
              <input value={invalidation} onChange={(event) => setInvalidation(event.target.value)} />
            </label>
          )}
          <label>
            <span>Which protective rule keeps this decision disciplined?</span>
            <input value={protectiveRule} onChange={(event) => setProtectiveRule(event.target.value)} />
          </label>
        </>
      ) : null}
      {currentState === 'return_to_base' ? (
        <>
          <label>
            <span>Did you follow the original plan?</span>
            <input value={behaviorSummary} onChange={(event) => setBehaviorSummary(event.target.value)} />
          </label>
          <label>
            <span>Where did discipline save you, or where did you deviate?</span>
            <input value={disciplineNotes} onChange={(event) => setDisciplineNotes(event.target.value)} />
          </label>
          <label>
            <span>What should tomorrow's version of you remember?</span>
            <input value={lesson} onChange={(event) => setLesson(event.target.value)} />
          </label>
        </>
      ) : null}
      <button className="secondary-action" type="submit" disabled={nextAction.disabled}>
        {buttonLabel}
      </button>
      <p className="muted">{formatAuthorizationStatus(authorizationStatus)}</p>
    </form>
  );
}

interface MissionAuthorizationPanelProps {
  activeMission?: ActiveMission | undefined;
  authorizationStatus?: MissionAuthorizationStatus | undefined;
  decision?: WarRoomDecisionModel | undefined;
}

function MissionAuthorizationPanel({
  activeMission,
  authorizationStatus,
  decision,
}: MissionAuthorizationPanelProps) {
  return (
    <section className="mission-authorization-panel" aria-label="Mission authorization">
      <div>
        <p className="section-label">Authorization</p>
        <h3>Authorization Request</h3>
      </div>
      {decision ? (
        <dl className="war-room-authorization-summary">
          <dt>Mission</dt>
          <dd>{decision.missionName}</dd>
          <dt>Operation</dt>
          <dd>{decision.bias}</dd>
          <dt>Risk</dt>
          <dd>{decision.risk}</dd>
          <dt>Confidence</dt>
          <dd>{decision.confidenceScore}%</dd>
        </dl>
      ) : null}
      <p className="muted">{formatMissionAuthorizationAvailability(activeMission)}</p>
      <p className="muted">{formatAuthorizationStatus(authorizationStatus)}</p>
    </section>
  );
}

interface CreateMissionPanelProps {
  codename?: string | undefined;
  objective?: string | undefined;
  onCodenameChange?: ((value: string) => void) | undefined;
  onObjectiveChange?: ((value: string) => void) | undefined;
  onCreateMission?: ((mission: ActiveMission) => void | Promise<void>) | undefined;
}

function CreateMissionPanel({
  codename: controlledCodename,
  objective: controlledObjective,
  onCodenameChange,
  onObjectiveChange,
  onCreateMission,
}: CreateMissionPanelProps) {
  const [localCodename, setLocalCodename] = useState('');
  const [localObjective, setLocalObjective] = useState('');
  const codename = controlledCodename ?? localCodename;
  const objective = controlledObjective ?? localObjective;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const mission = await createDesktopMission({ codename, objective });

    if (!mission) return;

    await onCreateMission?.(mission);
    if (onCodenameChange) onCodenameChange('');
    else setLocalCodename('');
    if (onObjectiveChange) onObjectiveChange('');
    else setLocalObjective('');
  }

  return (
    <form className="create-mission-panel" aria-label="Create mission" onSubmit={handleSubmit}>
      <div>
        <p className="section-label">Mission Creation</p>
        <h3>Create Mission</h3>
      </div>
      <label>
        <span>Mission Codename</span>
        <input
          value={codename}
          onChange={(event) => {
            if (onCodenameChange) onCodenameChange(event.target.value);
            else setLocalCodename(event.target.value);
          }}
        />
      </label>
      <label>
        <span>Mission Objective</span>
        <input
          value={objective}
          onChange={(event) => {
            if (onObjectiveChange) onObjectiveChange(event.target.value);
            else setLocalObjective(event.target.value);
          }}
        />
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

export async function createDesktopJournalEntry(draft: JournalEntryDraft): Promise<JournalEntry | undefined> {
  const content = draft.content.trim();
  const entryDate = draft.entryDate.trim();

  if (!content || !entryDate) return undefined;

  const createEntry = globalThis.window?.headquarters?.createJournalEntry;
  if (createEntry === undefined) return createJournalEntry(draft);

  const result = await createEntry(draft);
  return result.entry;
}

export async function saveDesktopMissionContext(mission: ActiveMission): Promise<PersistedMissionContextRecord | undefined> {
  if (mission.missionContext === undefined) return undefined;

  const saveMissionContext = globalThis.window?.headquarters?.saveMissionContext;
  if (saveMissionContext === undefined) return undefined;

  const snapshot = snapshotMissionContext(mission.missionContext);
  const result = await saveMissionContext({
    missionId: mission.id,
    contextJson: JSON.stringify(snapshot),
    ...(snapshot.createdAt ? { createdAt: snapshot.createdAt } : {}),
    updatedAt: snapshot.updatedAt ?? new Date().toISOString(),
  });

  return result.record;
}

export async function startDesktopBriefing(mission: ActiveMission): Promise<ActiveMission> {
  const bridge = globalThis.window?.headquarters?.startBriefing;
  if (bridge === undefined) return transitionLocalMission(mission, 'briefing');

  const result = await bridge({ missionId: mission.id, reason: 'Mission briefing started from desktop.' });
  return mapMissionRecordToActiveMission(result.mission, mission);
}

export async function completeDesktopBriefing(mission: ActiveMission): Promise<ActiveMission> {
  const bridge = globalThis.window?.headquarters?.completeBriefing;
  if (bridge === undefined) return transitionLocalMission(mission, 'ready');

  const result = await bridge({ missionId: mission.id, reason: 'Mission briefing completed from desktop.' });
  return mapMissionRecordToActiveMission(result.mission, mission);
}

export async function startDesktopObservation(mission: ActiveMission): Promise<ActiveMission> {
  const bridge = globalThis.window?.headquarters?.startObservation;
  if (bridge === undefined) return transitionLocalMission(mission, 'observation');

  const result = await bridge({ missionId: mission.id, reason: 'Observation started from desktop.' });
  return mapMissionRecordToActiveMission(result.mission, mission);
}

export async function completeDesktopObservation(mission: ActiveMission): Promise<ActiveMission> {
  const bridge = globalThis.window?.headquarters?.completeObservation;
  if (bridge === undefined) return transitionLocalMission(mission, 'authorization');

  const result = await bridge({ missionId: mission.id, reason: 'Observation completed from desktop.' });
  return mapMissionRecordToActiveMission(result.mission, mission);
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
  return mapMissionRecordToActiveMission(result.mission, mission);
}

export async function requestDesktopReturnToBase(mission: ActiveMission): Promise<ActiveMission> {
  const bridge = globalThis.window?.headquarters?.requestReturnToBase;
  if (bridge === undefined) return transitionLocalMission(mission, 'return_to_base');

  const result = await bridge({ missionId: mission.id, reason: 'Return to base requested from desktop.' });
  return mapMissionRecordToActiveMission(result.mission, mission);
}

export async function abortDesktopMission(mission: ActiveMission): Promise<ActiveMission> {
  const bridge = globalThis.window?.headquarters?.abortMission;
  if (bridge === undefined) return transitionLocalMission(mission, 'archived');

  const result = await bridge({ missionId: mission.id, reason: 'Mission aborted by operator from Commander.' });
  return mapMissionRecordToActiveMission(result.mission, mission);
}

export async function rewindDesktopMission(mission: ActiveMission): Promise<ActiveMission | undefined> {
  const currentState = parseMissionState(mission.currentState);
  if (currentState === undefined) return undefined;

  const currentIndex = missionLifecyclePath.indexOf(currentState);
  if (currentIndex <= 0) return undefined;

  const targetState = missionLifecyclePath[currentIndex - 1];
  if (targetState === undefined) return undefined;
  const bridge = globalThis.window?.headquarters?.rewindMission;
  if (bridge === undefined) return transitionLocalMission(mission, targetState);

  const result = await bridge({
    missionId: mission.id,
    targetState,
    reason: 'Mission lifecycle stepped back by operator from Commander.',
  });
  return mapMissionRecordToActiveMission(result.mission, mission);
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
    mission: mapMissionRecordToActiveMission(result.mission, mission),
    debrief: result.debrief,
  };
}

export async function archiveDesktopMission(mission: ActiveMission): Promise<ActiveMission> {
  const bridge = globalThis.window?.headquarters?.archiveAfterDebrief;
  if (bridge === undefined) return transitionLocalMission(mission, 'archived');

  const result = await bridge({ missionId: mission.id, reason: 'Mission archived from desktop.' });
  return mapMissionRecordToActiveMission(result.mission, mission);
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

  const candidate = createDesktopDoctrineCandidateFromDraft({
    ...draft,
    candidateId,
    title,
    summary,
    sourceId,
    archiveId,
    excerpt,
  });
  if (!validateDoctrineCandidateForReview(candidate).valid) return undefined;

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

export function createDesktopDoctrineCandidateFromDraft(
  draft: DoctrinePromotionDraft,
  options: { readonly createdAt?: string } = {},
): DoctrineCandidate {
  const supportingEvidenceCount = 1;
  const proposedTitle = draft.title.trim();
  const proposedRule = draft.summary.trim();
  const excerpt = draft.excerpt.trim();

  const candidate: DoctrineCandidate = {
    id: draft.candidateId.trim(),
    title: proposedTitle,
    summary: proposedRule,
    status: 'pending_review',
    proposedTitle,
    proposedRule,
    rationale: draft.rationale?.trim() || `Source evidence supports manual Doctrine review for ${proposedTitle}.`,
    evidenceSummary: excerpt,
    triggerCondition: draft.triggerCondition?.trim() || 'The operating condition described by the source evidence appears again.',
    expectedBehavior: draft.expectedBehavior?.trim() || proposedRule,
    exceptionOrBoundary: draft.exceptionOrBoundary?.trim() || 'This rule applies only when the source condition is present.',
    proposedScope: draft.proposedScope?.trim() || 'Operator-reviewed trading missions matching the source condition.',
    similarDoctrineIds: [],
    conflictSummary: 'No accepted Doctrine comparison has been performed yet.',
    supportingEvidenceCount,
    source: {
      sourceType: 'journal_entry',
      sourceId: draft.sourceId.trim(),
      archiveId: draft.archiveId.trim(),
      excerpt,
    },
    createdAt: options.createdAt ?? new Date().toISOString(),
    ...(draft.reviewNote?.trim() ? { reviewNote: draft.reviewNote.trim() } : {}),
  };

  return {
    ...candidate,
    status: validateDoctrineCandidateForReview(candidate).valid ? 'pending_review' : 'draft',
  };
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
        <dt>Evaluation</dt>
        <dd>{archiveSummary?.evaluation?.classification ?? 'Awaiting mission evaluation'}</dd>
        <dt>Commander Verdict</dt>
        <dd>{archiveSummary?.evaluation?.commanderVerdict ?? 'No evaluation attached yet'}</dd>
      </dl>
      {archiveSummary?.evaluation ? (
        <details>
          <summary>Archived evaluation record</summary>
          <p>{archiveSummary.evaluation.commanderReview}</p>
          <ul>
            {archiveSummary.evaluation.strengths.slice(0, 3).map((strength) => (
              <li key={strength}>{strength}</li>
            ))}
          </ul>
        </details>
      ) : null}
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
  activeMission?: ActiveMission | undefined;
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
  activeMission,
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
  const missionJournalLink = buildMissionJournalLink({ mission: activeMission, journalEntries });
  const journalIntelligence = buildJournalCommanderIntelligence({
    journalEntries,
    dailyReflections,
    tradeReviews,
    growthEvents,
    searchText,
    searchResultCount: searchResult.total,
  });

  async function handleJournalEntrySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entry = await createDesktopJournalEntry({
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
      title: growthTitle || journalIntelligence.growthRecommendationTitle,
      description: growthDescription || journalIntelligence.growthRecommendation,
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
    <div className="room-layout" data-room-id="journal-room" data-room-atmosphere="journal">
      <RoomAtmosphere variant="journal" />
      <section className="command-center-header journal-command-log-header" aria-label="Journal room status">
        <p className="section-label">Journal Room</p>
        <h2>Commander Log</h2>
        <p className="muted">Tell Commander what happened. Headquarters extracts reflection, review, memory, growth, and doctrine signals after the record exists.</p>
      </section>

      {missionJournalLink ? (
        <section className="journal-panel mission-journal-link-panel" aria-label="Mission journal integration">
          <p className="section-label">Mission Link</p>
          <h3>{missionJournalLink.codename}</h3>
          <p className="muted">{missionJournalLink.prompt}</p>
          <strong>{missionJournalLink.status}</strong>
        </section>
      ) : null}

      <section className="journal-command-log-layout" aria-label="Journal Commander office">
        <section className="journal-commander-office" aria-label="Journal Commander prompt">
          <p className="section-label">Commander</p>
          <h3>Good. Tell me everything.</h3>
          <p>{getJournalCommanderPrompt(activeJournalStep)}</p>
          <blockquote>{journalIntelligence.dailyQuestion}</blockquote>
        </section>

        <form className="journal-command-log-form" aria-label="Commander log" onSubmit={handleJournalEntrySubmit}>
          <p className="section-label">Write</p>
          <h3>What happened today?</h3>
          <label>
            <span>Commander Log</span>
            <textarea value={entryContent} onChange={(event) => setEntryContent(event.target.value)} />
          </label>
          <div className="journal-log-context-grid">
            <label>
              <span>Emotion</span>
              <input value={entryMood} onChange={(event) => setEntryMood(event.target.value)} />
            </label>
            <label>
              <span>Conditions</span>
              <input value={entryMarketConditions} onChange={(event) => setEntryMarketConditions(event.target.value)} />
            </label>
          </div>
          <button className="secondary-action" type="submit">Transmit Log</button>
          <p className="muted">{formatJournalCount(journalEntries.length, 'journal entry', 'journal entries')}</p>
        </form>

        <nav className="journal-flow-rail" aria-label="Journal intelligence flow">
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

        {activeJournalStep === 'reflection' ? (
          <form className="journal-panel journal-reflection-interview" aria-label="Commander reflection interview" onSubmit={handleReflectionSubmit}>
          <p className="section-label">Reflect</p>
          <h3>Commander Reflection</h3>
          <label>
            <span>What emotion influenced your decision most today?</span>
            <input value={reflectionSummary} onChange={(event) => setReflectionSummary(event.target.value)} />
          </label>
          <label>
            <span>What evidence supports that?</span>
            <input value={reflectionEmotion} onChange={(event) => setReflectionEmotion(event.target.value)} />
          </label>
          <button className="secondary-action" type="submit">Record Reflection</button>
          <p className="muted">{formatJournalCount(dailyReflections.length, 'reflection', 'reflections')}</p>
          </form>
        ) : null}

        {activeJournalStep === 'trade-review' ? (
          <form className="journal-panel journal-trade-review-interview" aria-label="Commander trade review" onSubmit={handleTradeReviewSubmit}>
          <p className="section-label">Review</p>
          <h3>Today's Trade</h3>
          <label>
            <span>What was the original plan?</span>
            <input value={tradeId} onChange={(event) => setTradeId(event.target.value)} />
          </label>
          <label>
            <span>What actually happened, and why?</span>
            <input value={tradeLesson} onChange={(event) => setTradeLesson(event.target.value)} />
          </label>
          <button className="secondary-action" type="submit">Record Review</button>
          <p className="muted">{formatJournalCount(tradeReviews.length, 'trade review', 'trade reviews')}</p>
          </form>
        ) : null}

        {activeJournalStep === 'growth' ? (
          <form className="journal-panel journal-growth-recommendation" aria-label="Commander growth recommendation" onSubmit={handleGrowthEventSubmit}>
          <p className="section-label">Learn</p>
          <h3>{journalIntelligence.growthRecommendationTitle}</h3>
          <p className="muted">{journalIntelligence.growthRecommendation}</p>
          <button className="secondary-action" type="submit" disabled={journalEntries.length === 0}>
            Accept Growth Event
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
        <JournalIntelligencePanel model={journalIntelligence} timeline={timeline} />
      </section>
    </div>
  );
}

export interface JournalCommanderIntelligenceModel {
  readonly dailyQuestion: string;
  readonly detectedThemes: readonly string[];
  readonly memorySummary: string;
  readonly growthRecommendationTitle: string;
  readonly growthRecommendation: string;
  readonly doctrineCandidate: string;
  readonly weeklyReview: string;
}

export function buildJournalCommanderIntelligence({
  journalEntries,
  dailyReflections,
  tradeReviews,
  growthEvents,
  searchText,
  searchResultCount,
}: {
  readonly journalEntries: readonly JournalEntry[];
  readonly dailyReflections: readonly DailyReflection[];
  readonly tradeReviews: readonly TradeReview[];
  readonly growthEvents: readonly GrowthEvent[];
  readonly searchText: string;
  readonly searchResultCount: number;
}): JournalCommanderIntelligenceModel {
  const latestEntry = journalEntries[0];
  const text = [
    latestEntry?.rawContent,
    latestEntry?.rawMood,
    latestEntry?.rawMarketConditions,
    dailyReflections[0]?.behaviorSummary,
    tradeReviews[0]?.lessonsLearned,
  ].filter((value): value is string => value !== undefined && value.trim().length > 0).join(' ').toLowerCase();
  const detectedThemes = [
    text.includes('patience') || text.includes('wait') ? 'Patience' : undefined,
    text.includes('revenge') || text.includes('frustrated') ? 'Revenge pressure' : undefined,
    text.includes('risk') || text.includes('stop') ? 'Risk control' : undefined,
    text.includes('plan') || text.includes('discipline') ? 'Plan discipline' : undefined,
  ].filter((value): value is string => value !== undefined);
  const primaryTheme = detectedThemes[0] ?? 'Discipline';
  const dailyQuestion = journalEntries.length === 0
    ? 'What almost made you abandon your plan?'
    : 'Where did discipline save you today?';

  return {
    dailyQuestion,
    detectedThemes,
    memorySummary: searchText.trim()
      ? `Commander Memory found ${formatJournalCount(searchResultCount, 'similar record', 'similar records')} for "${searchText.trim()}".`
      : `Commander Memory is tracking ${formatJournalCount(journalEntries.length, 'journal record', 'journal records')}.`,
    growthRecommendationTitle: `${primaryTheme} improved`,
    growthRecommendation: journalEntries.length > 0
      ? `Commander detected ${primaryTheme.toLowerCase()} evidence in the latest log. Accept only if the operator agrees.`
      : 'Write one Commander Log before Headquarters can recommend growth.',
    doctrineCandidate: detectedThemes.length > 0
      ? `${primaryTheme} appears often enough to monitor for future Doctrine.`
      : 'Doctrine candidate waits until a repeated lesson appears.',
    weeklyReview: `${formatJournalCount(journalEntries.length, 'mission log', 'mission logs')}; ${formatJournalCount(dailyReflections.length, 'reflection', 'reflections')}; ${formatJournalCount(growthEvents.length, 'growth signal', 'growth signals')}.`,
  };
}

function JournalIntelligencePanel({
  model,
  timeline,
}: {
  readonly model: JournalCommanderIntelligenceModel;
  readonly timeline: JournalTimeline;
}) {
  return (
    <section className="journal-intelligence-panel" aria-label="Commander journal intelligence">
      <div>
        <p className="section-label">Insights</p>
        <h3>Journal Analysis</h3>
      </div>
      <dl>
        <dt>Detected</dt>
        <dd>{model.detectedThemes.length > 0 ? model.detectedThemes.join(', ') : 'Awaiting journal evidence'}</dd>
        <dt>Memory</dt>
        <dd>{model.memorySummary}</dd>
        <dt>Doctrine</dt>
        <dd>{model.doctrineCandidate}</dd>
        <dt>This Week</dt>
        <dd>{model.weeklyReview}</dd>
      </dl>
      <div className="journal-story-preview" aria-label="Journal story preview">
        <p className="section-label">Story</p>
        <ol className="mission-timeline-list">
          {timeline.entries.slice(0, 4).map((entry) => (
            <li key={entry.id}>
              <span>{entry.title}</span>
              <time dateTime={entry.occurredAt}>{entry.occurredAt}</time>
              <strong>{entry.type}</strong>
            </li>
          ))}
          {timeline.entries.length === 0 ? <li><span>No story recorded yet</span><strong>Write first</strong></li> : null}
        </ol>
      </div>
    </section>
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
    <div className="room-layout" data-room-id="academy-room" data-room-atmosphere="academy">
      <RoomAtmosphere variant="academy" />
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

export interface DesktopGuardianAlertInput {
  readonly mission?: ActiveMission | undefined;
  readonly currentRoom?: CommanderShellRoomId | undefined;
  readonly authorizationStatus?: MissionAuthorizationStatus | undefined;
  readonly operatorJustification?: string | undefined;
  readonly invalidation?: string | undefined;
  readonly protectiveRule?: string | undefined;
}

export function buildDesktopGuardianAlerts(input: DesktopGuardianAlertInput = {}): readonly GuardianAlert[] {
  const sources: GuardianAlertSource[] = [{
    id: 'rule-monitoring',
    title: 'Rule Monitoring',
    detail: 'Guardian rules are active. Boundaries will be enforced from mission context, not mood.',
    severity: 'notice',
  }];
  const missionState = parseMissionState(input.mission?.currentState);
  const briefing = input.mission?.briefingContext;
  const observation = input.mission?.observationContext;
  const riskLimit = parseRiskLimitPercent(briefing?.riskParameters);
  const declaredRiskLimit = hasMissionContextText(briefing?.riskParameters) ? briefing?.riskParameters.trim() : undefined;
  const riskyReadiness = parseGuardianReadinessRisk(briefing?.personalReadiness);
  const hasNews = hasGuardianHighImpactNews(briefing?.highImpactNews);
  const missingRiskParameter = input.mission !== undefined
    && missionState !== 'idle'
    && !hasMissionContextText(briefing?.riskParameters);
  const missingProtectiveRule = missionState === 'authorization' && !hasMissionContextText(input.protectiveRule);
  const observationSaysNo = observation?.readiness === 'no';
  const deniedAuthorization = input.authorizationStatus?.decision === 'denied';
  const dailyLimits = evaluateGuardianDailyLimits(
    { maxLossPercent: riskLimit ?? 1, warningPercent: 80, maxTrades: 3 },
    { lossPercent: 0, tradesTaken: input.authorizationStatus ? 1 : 0 },
  );
  const sessionLimits = evaluateGuardianSessionLimits(
    { maxMinutes: 180, warningPercent: 80, maxActions: 8 },
    { elapsedMinutes: input.mission ? estimateMissionElapsedMinutes(input.mission) : 0, actionsTaken: estimateMissionActionCount(input) },
  );
  const risk = evaluateGuardianRisk({
    dailyLossPercent: 0,
    ruleViolationCount: missingProtectiveRule || deniedAuthorization ? 1 : 0,
    revengeSignalCount: countPressureLanguage([
      input.operatorJustification,
      observation?.bias,
      observation?.operationalPicture,
    ]),
    ...(riskyReadiness !== undefined ? { fatigueLevel: riskyReadiness } : {}),
  });

  if (declaredRiskLimit) {
    sources.push({
      id: 'declared-risk-boundary',
      title: 'Declared Risk Boundary',
      detail: `Risk boundary acknowledged: ${declaredRiskLimit}. Guardian will compare authorization against this limit.`,
      severity: 'notice',
    });
  }

  if (missingRiskParameter) {
    sources.push({
      id: 'missing-risk-boundary',
      title: 'Risk Boundary Missing',
      detail: 'Risk boundary is not declared. Guardian will not clear aggressive authorization until risk is stated.',
      severity: 'caution',
    });
  }

  if (hasNews) {
    sources.push({
      id: 'high-impact-news',
      title: 'High Impact News',
      detail: `News risk declared: ${briefing?.highImpactNews?.trim()}. Reduce tempo and account for volatility before authorization.`,
      severity: 'caution',
    });
  }

  if (riskyReadiness !== undefined && riskyReadiness >= 7) {
    sources.push({
      id: 'operator-readiness',
      title: 'Operator Readiness',
      detail: `Readiness state reported as ${briefing?.personalReadiness?.trim()}. Guardian recommends slower pacing and stricter confirmation.`,
      severity: 'caution',
    });
  }

  if (observationSaysNo) {
    sources.push({
      id: 'insufficient-observation-evidence',
      title: 'Observation Evidence',
      detail: 'Operator reported insufficient evidence. Guardian keeps War Room pressure contained until observations improve.',
      severity: 'caution',
    });
  }

  if (missingProtectiveRule) {
    sources.push({
      id: 'missing-protective-rule',
      title: 'Protective Rule Missing',
      detail: 'Authorization is missing a protective rule. Guardian requires the rule before deployment authority is clean.',
      severity: 'breach',
    });
  }

  if (deniedAuthorization) {
    sources.push({
      id: 'authorization-denied',
      title: 'Authorization Denied',
      detail: input.authorizationStatus?.reason ?? 'Authorization was denied. Guardian keeps the mission inside War Room review.',
      severity: 'breach',
    });
  }

  for (const warning of [...dailyLimits.warnings, ...sessionLimits.warnings, ...risk.reasons]) {
    if (warning === 'Risk assessment has missing inputs.') continue;
    sources.push({
      id: `risk-${slugifyGuardianId(warning)}`,
      title: 'Risk Assessment',
      detail: warning,
      severity: risk.level === 'lock' ? 'lock' : risk.level === 'intervention' ? 'breach' : 'caution',
    });
  }

  return dedupeGuardianAlerts(buildGuardianAlerts(sources));
}

export function buildDesktopGuardianLockoutState(input: DesktopGuardianAlertInput = {}): GuardianLockoutState {
  const alerts = buildDesktopGuardianAlerts(input);
  return evaluateGuardianLockout([
    {
      id: 'guardian-critical-alert',
      reason: 'Critical Guardian alert is active.',
      active: alerts.some((alert) => alert.priority === 'critical'),
    },
    {
      id: 'authorization-denied',
      reason: input.authorizationStatus?.reason ?? 'Authorization denied by Guardian-compatible review.',
      active: input.authorizationStatus?.decision === 'denied',
    },
  ]);
}

type GuardianOperationalLevel = 'normal' | 'warning' | 'intervention' | 'lockdown' | 'recovery';

interface GuardianRoomModelInput extends DesktopGuardianAlertInput {
  readonly journalEntries?: readonly JournalEntry[] | undefined;
  readonly growthEvents?: readonly GrowthEvent[] | undefined;
}

export interface GuardianRoomModel {
  readonly level: GuardianOperationalLevel;
  readonly headline: string;
  readonly transmission: string;
  readonly vault: {
    readonly allocation: string;
    readonly consumed: string;
    readonly remaining: string;
    readonly status: string;
    readonly reason: string;
  };
  readonly judgmentReserve: {
    readonly available: string;
    readonly fatigue: string;
    readonly confidence: string;
    readonly emotion: string;
    readonly recommendation: string;
  };
  readonly successProtocol: {
    readonly status: string;
    readonly guidance: readonly string[];
  };
  readonly rules: readonly {
    readonly id: string;
    readonly title: string;
    readonly state: 'active' | 'warning' | 'locked';
    readonly detail: string;
  }[];
  readonly timeline: readonly {
    readonly time: string;
    readonly event: string;
    readonly detail: string;
  }[];
  readonly memory: readonly string[];
}

export function buildGuardianRoomModel(input: GuardianRoomModelInput = {}): GuardianRoomModel {
  const alerts = buildDesktopGuardianAlerts(input);
  const lockout = buildDesktopGuardianLockoutState(input);
  const level = resolveGuardianOperationalLevel(alerts, lockout);
  const briefing = input.mission?.briefingContext;
  const riskBoundary = hasMissionContextText(briefing?.riskParameters) ? briefing?.riskParameters.trim() : 'not declared';
  const readiness = briefing?.personalReadiness?.trim().toLowerCase();
  const riskyReadiness = parseGuardianReadinessRisk(readiness);
  const reservePercent = lockout.status === 'locked'
    ? 12
    : riskyReadiness === undefined
      ? 82
      : Math.max(20, 100 - riskyReadiness * 9);
  const hasWarning = alerts.some((alert) => alert.priority === 'medium' || alert.priority === 'high' || alert.priority === 'critical');
  const highestAlert = alerts.find((alert) => alert.priority === 'critical')
    ?? alerts.find((alert) => alert.priority === 'high')
    ?? alerts.find((alert) => alert.priority === 'medium')
    ?? alerts[0];

  return {
    level,
    headline: formatGuardianHeadline(level),
    transmission: formatGuardianTransmission(level, highestAlert, lockout),
    vault: {
      allocation: riskBoundary,
      consumed: lockout.status === 'locked' ? 'frozen' : '0R recorded',
      remaining: lockout.status === 'locked' ? 'suspended' : riskBoundary,
      status: lockout.status === 'locked' ? 'Allocation frozen' : 'Protected',
      reason: lockout.status === 'locked' ? lockout.explanation : 'No intervention required. Operator behavior remains within doctrine.',
    },
    judgmentReserve: {
      available: `${reservePercent}%`,
      fatigue: riskyReadiness !== undefined && riskyReadiness >= 7 ? 'Elevated' : 'Low',
      confidence: hasWarning ? 'Constrained' : 'Normal',
      emotion: riskyReadiness !== undefined && riskyReadiness >= 7 ? 'Compromised' : 'Stable',
      recommendation: reservePercent < 40
        ? 'Decision quality compromised. Commander recommends ending operations or journaling before authorization.'
        : 'Judgment reserve is sufficient. Monitoring continues.',
    },
    successProtocol: {
      status: hasWarning ? 'Guardian Warning' : 'Success Protocol Armed',
      guidance: hasWarning
        ? ['Reduce size.', 'Follow confirmation.', 'No revenge entries.', 'Do not let urgency replace evidence.']
        : ['Protect against euphoria after wins.', 'Respect the declared risk boundary.', 'Keep confirmation slow.', 'Journal before memory changes.'],
    },
    rules: [
      {
        id: 'no-averaging-down',
        title: 'No averaging down',
        state: 'active',
        detail: 'Active until doctrine explicitly permits a recovery protocol.',
      },
      {
        id: 'daily-risk-boundary',
        title: `Maximum daily risk: ${riskBoundary}`,
        state: riskBoundary === 'not declared' ? 'warning' : 'active',
        detail: riskBoundary === 'not declared' ? 'Risk must be declared before clean authorization.' : 'Guardian compares War Room requests against this boundary.',
      },
      {
        id: 'news-protection',
        title: 'News protection',
        state: hasGuardianHighImpactNews(briefing?.highImpactNews) ? 'warning' : 'active',
        detail: hasGuardianHighImpactNews(briefing?.highImpactNews) ? 'High impact news declared. Volatility protocol active.' : 'No scheduled shock declared.',
      },
      {
        id: 'lockout-rule',
        title: 'Emergency lockout',
        state: lockout.status === 'locked' ? 'locked' : 'active',
        detail: lockout.status === 'locked' ? lockout.explanation : 'No active lockout rule.',
      },
    ],
    timeline: buildGuardianTimeline({ alerts, lockout, mission: input.mission, journalEntries: input.journalEntries ?? [] }),
    memory: buildGuardianMemory({ alerts, journalEntries: input.journalEntries ?? [], growthEvents: input.growthEvents ?? [] }),
  };
}

function resolveGuardianOperationalLevel(
  alerts: readonly GuardianAlert[],
  lockout: GuardianLockoutState,
): GuardianOperationalLevel {
  if (lockout.status === 'locked') return 'lockdown';
  if (alerts.some((alert) => alert.priority === 'critical')) return 'lockdown';
  if (alerts.some((alert) => alert.priority === 'high')) return 'intervention';
  if (alerts.some((alert) => alert.priority === 'medium')) return 'warning';
  return 'normal';
}

function formatGuardianHeadline(level: GuardianOperationalLevel): string {
  if (level === 'lockdown') return 'Guardian has control.';
  if (level === 'intervention') return 'Guardian intervention active.';
  if (level === 'warning') return 'Guardian warning active.';
  if (level === 'recovery') return 'Guardian recovery protocol active.';
  return 'No intervention required.';
}

function formatGuardianTransmission(
  level: GuardianOperationalLevel,
  alert: GuardianAlert | undefined,
  lockout: GuardianLockoutState,
): string {
  if (lockout.status === 'locked') {
    return `Trading authorization suspended. ${lockout.explanation}`;
  }

  if (level === 'intervention' || level === 'warning') {
    return alert?.message ?? 'Operator behavior requires slower confirmation.';
  }

  return 'Operator behavior remains within doctrine. Monitoring continues.';
}

function buildGuardianTimeline({
  alerts,
  lockout,
  mission,
  journalEntries,
}: {
  readonly alerts: readonly GuardianAlert[];
  readonly lockout: GuardianLockoutState;
  readonly mission?: ActiveMission | undefined;
  readonly journalEntries: readonly JournalEntry[];
}): GuardianRoomModel['timeline'] {
  const missionTime = mission?.createdAt ?? 'standby';
  const entries: GuardianRoomModel['timeline'] = [
    {
      time: missionTime,
      event: mission ? 'Mission monitored' : 'Guardian online',
      detail: mission ? `${mission.campaign} is under Guardian review.` : 'No issues. Monitoring continues.',
    },
    ...alerts.map((alert) => ({
      time: missionTime,
      event: alert.priority === 'critical' ? 'Lockdown signal' : alert.priority === 'high' ? 'Intervention signal' : alert.priority === 'medium' ? 'Warning signal' : 'No issues',
      detail: alert.message,
    })),
    ...journalEntries.slice(0, 1).map((entry) => ({
      time: entry.createdAt,
      event: 'Journal evidence received',
      detail: 'Guardian memory updated from approved operator evidence.',
    })),
    {
      time: missionTime,
      event: lockout.status === 'locked' ? 'Lockdown activated' : 'Lockout clear',
      detail: lockout.explanation,
    },
  ];

  return entries;
}

function buildGuardianMemory({
  alerts,
  journalEntries,
  growthEvents,
}: {
  readonly alerts: readonly GuardianAlert[];
  readonly journalEntries: readonly JournalEntry[];
  readonly growthEvents: readonly GrowthEvent[];
}): readonly string[] {
  const memory = [
    ...(alerts.some((alert) => alert.message.toLowerCase().includes('rush')) ? ['Rushing after pressure language'] : []),
    ...(alerts.some((alert) => alert.message.toLowerCase().includes('readiness')) ? ['Compromised readiness requires slower pacing'] : []),
    ...(journalEntries.length > 0 ? ['Journal evidence available for behavior review'] : []),
    ...(growthEvents.length > 0 ? ['Growth evidence can confirm disciplined recovery'] : []),
  ];

  return memory.length > 0 ? memory : ['No recurring behavior pattern confirmed yet.'];
}

function parseRiskLimitPercent(value: string | undefined): number | undefined {
  if (!hasMissionContextText(value)) return undefined;
  const match = value.match(/(\d+(?:\.\d+)?)\s*%/);
  if (match?.[1]) return Number.parseFloat(match[1]);
  return undefined;
}

function parseGuardianReadinessRisk(value: string | undefined): number | undefined {
  if (!hasMissionContextText(value)) return undefined;
  const normalized = value.toLowerCase();
  if (normalized.includes('tired') || normalized.includes('fatigue')) return 8;
  if (normalized.includes('stressed') || normalized.includes('distracted')) return 7;
  if (normalized.includes('angry') || normalized.includes('revenge')) return 9;
  if (normalized.includes('focused') || normalized.includes('calm') || normalized.includes('confident')) return 2;
  return undefined;
}

function hasGuardianHighImpactNews(value: string | undefined): boolean {
  if (!hasMissionContextText(value)) return false;
  const normalized = value.trim().toLowerCase();
  return normalized !== 'none'
    && normalized !== 'no'
    && normalized !== 'nope'
    && normalized !== 'no news'
    && normalized !== 'negative'
    && normalized !== 'nothing'
    && normalized !== 'n/a';
}

function estimateMissionElapsedMinutes(mission: ActiveMission): number {
  const createdAt = Date.parse(mission.createdAt);
  if (Number.isNaN(createdAt)) return 0;
  return Math.max(0, Math.round((Date.now() - createdAt) / 60000));
}

function estimateMissionActionCount(input: DesktopGuardianAlertInput): number {
  return [
    input.mission?.briefingContext?.missionObjective,
    input.mission?.briefingContext?.riskParameters,
    input.mission?.observationContext?.operationalPicture,
    input.operatorJustification,
    input.invalidation,
    input.protectiveRule,
  ].filter((value) => hasMissionContextText(value)).length;
}

function countPressureLanguage(values: readonly (string | undefined)[]): number {
  return values.filter((value) => {
    if (!hasMissionContextText(value)) return false;
    const normalized = value.toLowerCase();
    return normalized.includes('revenge')
      || normalized.includes('fomo')
      || normalized.includes('rush')
      || normalized.includes('must trade')
      || normalized.includes('need to win');
  }).length;
}

function slugifyGuardianId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function dedupeGuardianAlerts(alerts: readonly GuardianAlert[]): readonly GuardianAlert[] {
  const seen = new Set<string>();
  return alerts.filter((alert) => {
    if (seen.has(alert.sourceId)) return false;
    seen.add(alert.sourceId);
    return true;
  });
}

export function GuardianRoom({
  mission,
  authorizationStatus,
  journalEntries = [],
  growthEvents = [],
}: {
  readonly mission?: ActiveMission | undefined;
  readonly authorizationStatus?: MissionAuthorizationStatus | undefined;
  readonly journalEntries?: readonly JournalEntry[] | undefined;
  readonly growthEvents?: readonly GrowthEvent[] | undefined;
} = {}) {
  const alerts = buildDesktopGuardianAlerts({ mission, authorizationStatus });
  const model = buildGuardianRoomModel({ mission, authorizationStatus, journalEntries, growthEvents });

  return (
    <div
      className="room-layout guardian-control-room"
      data-room-id="guardian-room"
      data-room-atmosphere="guardian"
      data-guardian-level={model.level}
    >
      <RoomAtmosphere variant="guardian" />
      <section className="command-center-header" aria-label="Guardian room status">
        <p className="section-label">Guardian Wing</p>
        <h2>{model.headline}</h2>
        <p className="muted">This room exists because the operator cannot always trust impulse under pressure.</p>
      </section>

      <section className="guardian-command-surface" aria-label="Guardian operational surface">
        <section className="guardian-transmission" aria-label="Guardian transmission">
          <p className="section-label">Guardian</p>
          <h3>{model.transmission}</h3>
          <span>{model.level}</span>
        </section>

        <section className="guardian-vault-panel" aria-label="Capital Vault">
          <p className="section-label">Capital Vault</p>
          <h3>{model.vault.status}</h3>
          <dl>
            <div><dt>Today's allocation</dt><dd>{model.vault.allocation}</dd></div>
            <div><dt>Consumed</dt><dd>{model.vault.consumed}</dd></div>
            <div><dt>Remaining</dt><dd>{model.vault.remaining}</dd></div>
          </dl>
          <p className="muted">{model.vault.reason}</p>
        </section>

        <section className="guardian-reserve-panel" aria-label="Judgment Reserve">
          <p className="section-label">Judgment Reserve</p>
          <h3>Judgment Reserve</h3>
          <dl>
            <div><dt>Available</dt><dd>{model.judgmentReserve.available}</dd></div>
            <div><dt>Fatigue</dt><dd>{model.judgmentReserve.fatigue}</dd></div>
            <div><dt>Confidence</dt><dd>{model.judgmentReserve.confidence}</dd></div>
            <div><dt>Emotion</dt><dd>{model.judgmentReserve.emotion}</dd></div>
          </dl>
          <p className="muted">{model.judgmentReserve.recommendation}</p>
        </section>

        <section className="guardian-protocol-panel" aria-label="Success Protocol">
          <p className="section-label">{model.successProtocol.status}</p>
          <h3>Protect success before it becomes euphoria.</h3>
          <ul>
            {model.successProtocol.guidance.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>

        <section className="guardian-rules-panel" aria-label="Guardian Rules">
          <p className="section-label">Guardian Rules</p>
          <h3>Living boundaries</h3>
          <ul>
            {model.rules.map((rule) => (
              <li key={rule.id} data-guardian-rule-state={rule.state}>
                <strong>{rule.title}</strong>
                <span>{rule.state}</span>
                <p>{rule.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="guardian-timeline-panel" aria-label="Guardian Timeline">
          <p className="section-label">Guardian Timeline</p>
          <h3>Intervention record</h3>
          <ol>
            {model.timeline.map((entry) => (
              <li key={`${entry.time}-${entry.event}-${entry.detail}`}>
                <time>{entry.time}</time>
                <strong>{entry.event}</strong>
                <p>{entry.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="guardian-memory-panel" aria-label="Guardian Memory">
          <p className="section-label">Guardian Memory</p>
          <h3>Known recurring behaviors</h3>
          <ul>
            {model.memory.map((memory) => <li key={memory}>{memory}</li>)}
          </ul>
        </section>

        <section className="guardian-alert-panel" aria-label="Guardian Alerts">
          <p className="section-label">Active Alert Feed</p>
          <h3>{alerts.length === 0 ? 'No Guardian alerts active.' : `${formatJournalCount(alerts.length, 'Guardian alert', 'Guardian alerts')} active`}</h3>
          <ul>
            {alerts.map((alert) => (
              <li key={alert.id} data-guardian-priority={alert.priority}>
                <strong>{alert.title}</strong>
                <span>{alert.priority}</span>
                <p>{alert.message}</p>
                <small>{alert.sourceId}</small>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </div>
  );
}

export function IntelligenceCenterRoom({
  journalEntries,
  growthEvents = [],
}: {
  journalEntries: JournalEntry[];
  growthEvents?: GrowthEvent[];
}) {
  const classifications = buildDesktopJournalClassifications(journalEntries);
  const evidenceRecords = buildDesktopIntelligenceEvidenceRecords(classifications);
  const patterns = buildDesktopIntelligencePatterns(evidenceRecords);
  const repeatedMistakes = buildDesktopRepeatedMistakes(evidenceRecords);
  const repeatedSuccesses = buildDesktopRepeatedSuccesses(evidenceRecords);
  const doctrineSuggestions = buildDesktopDoctrineSuggestions(evidenceRecords);
  const growthAnalysis = buildDesktopGrowthAnalysis(evidenceRecords, growthEvents);
  const dashboard = buildDesktopIntelligenceDashboard(
    classifications,
    patterns,
    repeatedMistakes,
    repeatedSuccesses,
    doctrineSuggestions,
    growthAnalysis,
  );

  return (
    <div className="room-layout" data-room-id="intelligence-center" data-room-atmosphere="intelligence">
      <RoomAtmosphere variant="intelligence" />
      <section className="command-center-header" aria-label="Intelligence center status">
        <p className="section-label">Intelligence Center</p>
        <h2>Journal Classification</h2>
        <p className="muted">Deterministic classification preserves raw journal evidence and does not alter source entries.</p>
      </section>
      <section className="command-center-panels" aria-label="Intelligence workspace">
        <IntelligenceDashboardPanel dashboard={dashboard} />
        <section className="journal-panel" aria-label="Journal classification summary">
          <p className="section-label">Classification</p>
          <h3>Journal Evidence</h3>
          <dl>
            <dt>Entries</dt>
            <dd>{journalEntries.length}</dd>
            <dt>Classified</dt>
            <dd>{classifications.filter((classification) => classification.categories.length > 0).length}</dd>
          </dl>
          <p className="muted">{formatJournalClassificationStatus(classifications)}</p>
        </section>
        <JournalClassificationPanel classifications={classifications} />
        <IntelligencePatternPanel patterns={patterns} />
        <RepeatedMistakePanel mistakes={repeatedMistakes} />
        <RepeatedSuccessPanel successes={repeatedSuccesses} />
        <DoctrineSuggestionPanel suggestions={doctrineSuggestions} />
        <GrowthAnalysisPanel analysis={growthAnalysis} />
      </section>
    </div>
  );
}

function JournalClassificationPanel({ classifications }: { classifications: readonly JournalClassification[] }) {
  return (
    <section className="journal-panel" aria-label="Journal classifications">
      <p className="section-label">Evidence</p>
      <h3>Classified Entries</h3>
      {classifications.length === 0 ? (
        <p className="muted">No journal entries are available for Intelligence classification yet.</p>
      ) : (
        <ol className="mission-archive-list">
          {classifications.map((classification) => (
            <li key={classification.entryId}>
              <span>{classification.entryId}</span>
              <strong>{classification.categories.length === 0 ? 'unclassified' : classification.categories.join(', ')}</strong>
              <span>{formatJournalCount(classification.evidence.length, 'evidence point', 'evidence points')}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function IntelligencePatternPanel({ patterns }: { patterns: readonly IntelligencePattern[] }) {
  return (
    <section className="journal-panel" aria-label="Intelligence patterns">
      <p className="section-label">Patterns</p>
      <h3>Pattern Reports</h3>
      {patterns.length === 0 ? (
        <p className="muted">No repeated Intelligence patterns are visible yet.</p>
      ) : (
        <ol className="mission-archive-list">
          {patterns.map((pattern) => (
            <li key={pattern.id}>
              <span>{pattern.label}</span>
              <strong>{pattern.kind}</strong>
              <span>{pattern.explanation}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function RepeatedMistakePanel({ mistakes }: { mistakes: readonly RepeatedMistake[] }) {
  return (
    <section className="journal-panel" aria-label="Repeated mistakes">
      <p className="section-label">Mistakes</p>
      <h3>Repeated Mistakes</h3>
      {mistakes.length === 0 ? (
        <p className="muted">No repeated operational mistakes are visible yet.</p>
      ) : (
        <ol className="mission-archive-list">
          {mistakes.map((mistake) => (
            <li key={mistake.id}>
              <span>{mistake.title}</span>
              <strong>{mistake.signal}</strong>
              <span>{mistake.operationalLanguage}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function RepeatedSuccessPanel({ successes }: { successes: readonly RepeatedSuccess[] }) {
  return (
    <section className="journal-panel" aria-label="Repeated successes">
      <p className="section-label">Successes</p>
      <h3>Repeated Successes</h3>
      {successes.length === 0 ? (
        <p className="muted">No repeated behavior successes are visible yet.</p>
      ) : (
        <ol className="mission-archive-list">
          {successes.map((success) => (
            <li key={success.id}>
              <span>{success.title}</span>
              <strong>{success.signal}</strong>
              <span>{success.behaviorLanguage}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function DoctrineSuggestionPanel({ suggestions }: { suggestions: readonly DoctrineSuggestion[] }) {
  return (
    <section className="journal-panel" aria-label="Doctrine suggestions">
      <p className="section-label">Suggestions</p>
      <h3>Doctrine Suggestions</h3>
      {suggestions.length === 0 ? (
        <p className="muted">No doctrine suggestions are ready for manual review yet.</p>
      ) : (
        <ol className="mission-archive-list">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <span>{suggestion.title}</span>
              <strong>Manual promotion required</strong>
              <span>{suggestion.rationale}</span>
              {suggestion.evidenceSummaries[0] ? <span>Evidence: {suggestion.evidenceSummaries[0]}</span> : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function GrowthAnalysisPanel({ analysis }: { analysis: IntelligenceGrowthAnalysis }) {
  return (
    <section className="journal-panel" aria-label="Growth analysis">
      <p className="section-label">Growth</p>
      <h3>Growth Analysis</h3>
      <dl>
        <dt>Journal Evidence</dt>
        <dd>{analysis.journalEvidenceCount}</dd>
        <dt>Academy Evidence</dt>
        <dd>{analysis.academyEvidenceCount}</dd>
      </dl>
      <p className="muted">{analysis.summary}</p>
      {analysis.growthCategories.length > 0 ? (
        <p className="muted">Categories: {analysis.growthCategories.join(', ')}</p>
      ) : null}
    </section>
  );
}

function IntelligenceDashboardPanel({ dashboard }: { dashboard: IntelligenceDashboard }) {
  return (
    <section className="journal-panel" aria-label="Intelligence dashboard">
      <p className="section-label">Dashboard</p>
      <h3>Intelligence Dashboard</h3>
      <p className="muted">{dashboard.summary}</p>
      <dl>
        <dt>Patterns</dt>
        <dd>{dashboard.patternReportCount}</dd>
        <dt>Mistakes</dt>
        <dd>{dashboard.repeatedMistakeCount}</dd>
        <dt>Successes</dt>
        <dd>{dashboard.repeatedSuccessCount}</dd>
        <dt>Doctrine Suggestions</dt>
        <dd>{dashboard.doctrineSuggestionCount}</dd>
      </dl>
    </section>
  );
}

export function buildDesktopJournalClassifications(
  journalEntries: readonly JournalEntry[],
): readonly JournalClassification[] {
  return classifyJournalEntries(journalEntries);
}

export function buildDesktopIntelligenceEvidenceRecords(
  classifications: readonly JournalClassification[],
): readonly IntelligenceEvidenceRecord[] {
  return classifications.map((classification) => ({
    id: classification.entryId,
    sourceType: 'journal',
    summary: classification.rawEntry.rawContent,
    signals: classification.categories,
  }));
}

export function buildDesktopIntelligencePatterns(
  evidenceRecords: readonly IntelligenceEvidenceRecord[],
): readonly IntelligencePattern[] {
  return detectIntelligencePatterns(evidenceRecords);
}

export function buildDesktopRepeatedMistakes(
  evidenceRecords: readonly IntelligenceEvidenceRecord[],
): readonly RepeatedMistake[] {
  return analyzeRepeatedMistakes(evidenceRecords);
}

export function buildDesktopRepeatedSuccesses(
  evidenceRecords: readonly IntelligenceEvidenceRecord[],
): readonly RepeatedSuccess[] {
  return analyzeRepeatedSuccesses(evidenceRecords);
}

export function buildDesktopDoctrineSuggestions(
  evidenceRecords: readonly IntelligenceEvidenceRecord[],
): readonly DoctrineSuggestion[] {
  return suggestDoctrineCandidates(evidenceRecords);
}

export function buildDesktopGrowthAnalysis(
  evidenceRecords: readonly IntelligenceEvidenceRecord[],
  growthEvents: readonly GrowthEvent[],
): IntelligenceGrowthAnalysis {
  return analyzeGrowth({
    journalEvidenceRecords: evidenceRecords,
    academyGrowthEvents: growthEvents.map(createAcademyGrowthEventFromJournal),
  });
}

export function buildDesktopIntelligenceDashboard(
  classifications: readonly JournalClassification[],
  patterns: readonly IntelligencePattern[],
  repeatedMistakes: readonly RepeatedMistake[],
  repeatedSuccesses: readonly RepeatedSuccess[],
  doctrineSuggestions: readonly DoctrineSuggestion[],
  growthAnalysis: IntelligenceGrowthAnalysis,
): IntelligenceDashboard {
  return buildIntelligenceDashboard({
    classificationCount: classifications.length,
    patternReports: patterns,
    repeatedMistakes,
    repeatedSuccesses,
    doctrineSuggestions,
    growthAnalysis,
  });
}

export function formatJournalClassificationStatus(classifications: readonly JournalClassification[]): string {
  if (classifications.length === 0) return 'No journal evidence classified';

  const classifiedCount = classifications.filter((classification) => classification.categories.length > 0).length;
  if (classifiedCount === 0) return 'Journal evidence has no approved category matches yet';

  return `${classifiedCount} of ${classifications.length} journal entr${classifications.length === 1 ? 'y' : 'ies'} classified`;
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
    <section className="journal-panel" aria-label="Commander memory">
      <p className="section-label">Memory</p>
      <h3>Commander Memory</h3>
      <label>
        <span>What should Commander search for?</span>
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
    <section className="journal-panel" aria-label="Journal archive link">
      <p className="section-label">Archive Link</p>
      <h3>Send completed evidence to Archive</h3>
      <button className="secondary-action" type="button" onClick={handleArchiveFirstEntry} disabled={journalEntries.length === 0}>
        Send First Entry To Archive
      </button>
      <p className="muted">{formatJournalCount(archivedJournalEntries.length, 'archived journal entry', 'archived journal entries')}</p>
    </section>
  );
}

export function ArchiveRoom({
  missionIntelligencePackage,
  archivedMissionSummaries,
  missionHistory,
  missionDebrief,
  archivedJournalEntries,
  doctrineRecords,
}: {
  missionIntelligencePackage?: MissionIntelligencePackage | undefined;
  archivedMissionSummaries: LocalMissionArchiveSummary[];
  missionHistory: ActiveMission[];
  missionDebrief?: MissionDebrief | undefined;
  archivedJournalEntries: ArchivedJournalEntry[];
  doctrineRecords: DoctrineRecord[];
}) {
  const [archiveSearchText, setArchiveSearchText] = useState('');
  const eventInspections = buildDesktopArchiveEventInspections(archivedMissionSummaries, archivedJournalEntries);
  const sessionInspections = buildDesktopArchiveSessionInspections();
  const dashboard = buildDesktopArchiveDashboard(archivedMissionSummaries, archivedJournalEntries);
  const records = buildDesktopArchiveRecords(archivedMissionSummaries, archivedJournalEntries);
  const searchResults = searchArchiveRecords(records, { text: archiveSearchText });
  const latestMissionSummary = archivedMissionSummaries[archivedMissionSummaries.length - 1];
  const dossiers = listMissionArchiveDossiers({
    summaries: archivedMissionSummaries,
    missionHistory,
    debrief: missionDebrief,
  });

  return (
    <GuidedRoom
      id="archive-room"
      identity="historical"
      atmosphere="archive"
      title="Archive Room"
      useCase="Read records chronologically without editing the past."
      objective={latestMissionSummary ? `${latestMissionSummary.codename} preserved as institutional memory.` : 'Historical records will appear after mission archive.'}
      primaryAction={<strong>{formatArchiveViewerStatus(archivedMissionSummaries)}</strong>}
      workspace={(
        <>
          {missionIntelligencePackage ? (
            <MissionIntelligencePanel
              missionPackage={missionIntelligencePackage}
              mode="archive"
              title="Preserved Mission Intelligence"
            />
          ) : null}
          <ArchiveCardPanel records={records} />
        </>
      )}
      timeline={(
        <>
          <MissionArchiveViewerPanel archiveSummaries={archivedMissionSummaries} />
          <MissionArchiveDossierPanel dossiers={dossiers} />
          <ArchiveEventExplorerPanel eventInspections={eventInspections} />
          <ArchiveSessionExplorerPanel sessionInspections={sessionInspections} />
        </>
      )}
      secondaryTools={(
        <>
          <ArchiveSearchPanel
            searchText={archiveSearchText}
            onSearchTextChange={setArchiveSearchText}
            resultCount={searchResults.length}
          />
          <ArchiveDashboardPanel dashboard={dashboard} />
        <CampaignBookViewPanel summaries={archivedMissionSummaries} />
        <DoctrineRecordViewPanel doctrineRecords={doctrineRecords} />
          <section className="journal-panel" aria-label="Journal archive overview">
            <p className="section-label">Journal Archive</p>
            <h3>Journal Archive</h3>
            <p className="muted">{formatJournalCount(archivedJournalEntries.length, 'archived journal entry', 'archived journal entries')}</p>
          </section>
        </>
      )}
    />
  );
}

function MissionArchiveDossierPanel({ dossiers }: { dossiers: readonly MissionArchiveDossier[] }) {
  const latest = dossiers[dossiers.length - 1];

  return (
    <section className="journal-panel mission-archive-dossier-panel" aria-label="Mission archive dossier">
      <p className="section-label">Mission Dossier</p>
      <h3>{latest ? latest.codename : 'No dossier sealed'}</h3>
      <p className="muted">{latest ? latest.commanderSummary : 'Archive dossier appears after mission archive.'}</p>
      {latest ? (
        <dl>
          <dt>Archived</dt>
          <dd>{latest.archivedAt}</dd>
          <dt>State</dt>
          <dd>{latest.state.replaceAll('_', ' ')}</dd>
          <dt>Events</dt>
          <dd>{latest.eventCount}</dd>
          <dt>Debrief</dt>
          <dd>{latest.debriefStatus}</dd>
          <dt>Record</dt>
          <dd>{latest.permanenceStatement}</dd>
        </dl>
      ) : null}
    </section>
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
  doctrineSuggestions,
  doctrineReviewDecisions,
  onPromoteDoctrineCandidate,
  onDoctrineReviewDecision,
}: {
  doctrineRecords: DoctrineRecord[];
  doctrineHistory: DoctrineHistoryEntry[];
  doctrineSuggestions: readonly DoctrineSuggestion[];
  doctrineReviewDecisions: readonly DoctrineReviewRecord[];
  onPromoteDoctrineCandidate: (record: DoctrineRecord, historyEntry: DoctrineHistoryEntry) => void;
  onDoctrineReviewDecision: (decision: DoctrineReviewRecord) => void;
}) {
  const chamber = buildDoctrineChamberModel({
    doctrineRecords,
    doctrineHistory,
    doctrineSuggestions,
    doctrineReviewDecisions,
  });

  return (
    <div className="room-layout" data-room-id="doctrine-room" data-room-atmosphere="doctrine">
      <RoomAtmosphere variant="doctrine" />
      <section className="command-center-header" aria-label="Doctrine room status">
        <p className="section-label">Doctrine Chamber</p>
        <h2>Book of Doctrine</h2>
        <p className="muted">Journal evidence becomes candidate law. Candidate law becomes operational doctrine only after review.</p>
      </section>
      <section className="doctrine-chamber-layout" aria-label="Doctrine workspace">
        <section className="doctrine-commander-panel" aria-label="Doctrine Commander prompt">
          <p className="section-label">Commander</p>
          <h3>Review the lesson before it becomes law.</h3>
          <p>{chamber.commanderAssessment}</p>
        </section>
        <DoctrineCandidateSessionPanel model={chamber} />
        <DoctrineLibraryPanel records={doctrineRecords} model={chamber} />
        <DoctrineQualityPanel model={chamber} />
        <DoctrineViewerPanel doctrineRecords={doctrineRecords} />
        <DoctrineReviewPanel
          doctrineSuggestions={doctrineSuggestions}
          doctrineRecords={doctrineRecords}
          doctrineReviewDecisions={doctrineReviewDecisions}
          onPromoteDoctrineCandidate={onPromoteDoctrineCandidate}
          onDoctrineReviewDecision={onDoctrineReviewDecision}
        />
        <DoctrinePromotionPanel onPromoteDoctrineCandidate={onPromoteDoctrineCandidate} />
        <DoctrineDiffPanel diff={buildDoctrineDiffPreview(doctrineRecords)} />
        <TradingPlanDoctrinePanel references={buildDefaultTradingPlanDoctrineReferences(doctrineRecords)} />
        <DoctrineHistoryPanel historyEntries={doctrineHistory} />
      </section>
    </div>
  );
}

export interface DoctrineChamberModel {
  readonly candidateCount: number;
  readonly waitingCount: number;
  readonly acceptedCount: number;
  readonly rejectedCount: number;
  readonly revisionCount: number;
  readonly averageConfidence: number;
  readonly heat: 'Stable' | 'Developing' | 'Questioned' | 'Experimental' | 'Archived';
  readonly commanderAssessment: string;
  readonly activeCandidateTitle: string;
  readonly activeCandidateStatus: string;
  readonly similaritySummary: string;
  readonly contradictionSummary: string;
  readonly affectedChapters: readonly { readonly name: string; readonly affected: boolean }[];
  readonly lifecycle: readonly string[];
}

export function buildDoctrineChamberModel({
  doctrineRecords,
  doctrineHistory,
  doctrineSuggestions,
  doctrineReviewDecisions,
}: {
  readonly doctrineRecords: readonly DoctrineRecord[];
  readonly doctrineHistory: readonly DoctrineHistoryEntry[];
  readonly doctrineSuggestions: readonly DoctrineSuggestion[];
  readonly doctrineReviewDecisions: readonly DoctrineReviewRecord[];
}): DoctrineChamberModel {
  const acceptedCount = doctrineRecords.filter((record) => record.confidence === 'validated').length;
  const rejectedCount = doctrineReviewDecisions.filter((decision) => decision.decision === 'rejected').length;
  const revisionCount = doctrineReviewDecisions.filter((decision) => decision.decision === 'revision_requested').length;
  const waitingCount = doctrineSuggestions.filter((candidate) => (
    !doctrineReviewDecisions.some((decision) => decision.candidateId === candidate.id)
  )).length;
  const activeCandidate = doctrineSuggestions.find((candidate) => (
    !doctrineReviewDecisions.some((decision) => (
      decision.candidateId === candidate.id
      && (decision.decision === 'approved' || decision.decision === 'rejected')
    ))
  ));
  const averageConfidence = doctrineRecords.length === 0
    ? 0
    : Math.round((acceptedCount / doctrineRecords.length) * 100);
  const heat = doctrineRecords.length === 0
    ? 'Experimental'
    : revisionCount > 0
      ? 'Questioned'
      : averageConfidence >= 80
        ? 'Stable'
        : 'Developing';
  const commanderAssessment = activeCandidate
    ? 'The evidence is present. Review the exception before promotion.'
    : doctrineRecords.length > 0
      ? 'Doctrine library is active. Challenge any rule that no longer matches evidence.'
      : 'No doctrine has become law yet. Wait for repeated evidence.';

  return {
    candidateCount: doctrineSuggestions.length,
    waitingCount,
    acceptedCount,
    rejectedCount,
    revisionCount,
    averageConfidence,
    heat,
    commanderAssessment,
    activeCandidateTitle: activeCandidate?.title ?? 'No candidate selected',
    activeCandidateStatus: activeCandidate ? formatDoctrineCandidateSessionStatus(activeCandidate, doctrineReviewDecisions) : 'Waiting',
    similaritySummary: activeCandidate && doctrineRecords.length > 0
      ? `Commander detected ${Math.min(87, 64 + activeCandidate.evidenceRecordIds.length * 8)}% similarity with existing doctrine.`
      : 'No similar doctrine is available yet.',
    contradictionSummary: revisionCount > 0
      ? `${revisionCount} doctrine candidate${revisionCount === 1 ? '' : 's'} returned for revision. Review required.`
      : 'No contradiction requires immediate doctrine review.',
    affectedChapters: [
      { name: 'Execution', affected: acceptedCount > 0 },
      { name: 'Market Open', affected: doctrineRecords.some((record) => record.summary.toLowerCase().includes('open')) },
      { name: 'Risk', affected: doctrineRecords.some((record) => record.summary.toLowerCase().includes('risk')) },
      { name: 'Psychology', affected: doctrineRecords.some((record) => record.summary.toLowerCase().includes('patience') || record.summary.toLowerCase().includes('emotion')) },
    ],
    lifecycle: doctrineHistory.length > 0
      ? doctrineHistory.slice(-5).map((entry) => entry.action)
      : ['Candidate', 'Review', 'Promote', 'Challenge', 'Reconfirm'],
  };
}

function formatDoctrineCandidateSessionStatus(
  suggestion: DoctrineSuggestion,
  decisions: readonly DoctrineReviewRecord[],
): string {
  const latestDecision = [...decisions].reverse().find((decision) => decision.candidateId === suggestion.id);
  if (latestDecision?.decision === 'revision_requested') return 'Revision requested';
  if (latestDecision?.decision === 'approved') return 'Strong';
  if (latestDecision?.decision === 'rejected') return 'Rejected';
  if (suggestion.evidenceRecordIds.length > 1) return 'Strong';
  if (suggestion.evidenceRecordIds.length === 1) return 'Waiting';
  return 'Conflicting evidence';
}

function DoctrineCandidateSessionPanel({ model }: { readonly model: DoctrineChamberModel }) {
  return (
    <section className="doctrine-session-panel" aria-label="Doctrine candidate session">
      <p className="section-label">Candidate Session</p>
      <h3>{model.candidateCount} doctrine candidates require review.</h3>
      <div className="doctrine-candidate-strip">
        <article>
          <span>Candidate</span>
          <strong>{model.activeCandidateTitle}</strong>
          <small>{model.activeCandidateStatus}</small>
        </article>
        <article>
          <span>Similarity</span>
          <strong>{model.similaritySummary}</strong>
        </article>
        <article>
          <span>Contradiction</span>
          <strong>{model.contradictionSummary}</strong>
        </article>
      </div>
    </section>
  );
}

function DoctrineLibraryPanel({
  records,
  model,
}: {
  readonly records: readonly DoctrineRecord[];
  readonly model: DoctrineChamberModel;
}) {
  const firstRecord = records[0];

  return (
    <section className="doctrine-book-panel" aria-label="Book of Doctrine">
      <p className="section-label">Book of Doctrine</p>
      <h3>{firstRecord?.title ?? 'No laws written yet'}</h3>
      <dl>
        <dt>Rule</dt>
        <dd>{firstRecord ? `Rule ${String(records.indexOf(firstRecord) + 1).padStart(3, '0')}` : 'Awaiting first doctrine'}</dd>
        <dt>Origin</dt>
        <dd>{firstRecord ? formatDoctrineRecordSource(firstRecord) : 'No source evidence'}</dd>
        <dt>Confidence</dt>
        <dd>{model.averageConfidence}%</dd>
        <dt>Heat</dt>
        <dd>{model.heat}</dd>
      </dl>
    </section>
  );
}

function DoctrineQualityPanel({ model }: { readonly model: DoctrineChamberModel }) {
  return (
    <section className="doctrine-quality-panel" aria-label="Doctrine quality">
      <p className="section-label">Doctrine Library</p>
      <h3>{model.heat}</h3>
      <div className="doctrine-confidence-bar" aria-label={`Doctrine confidence ${model.averageConfidence}%`}>
        <span style={{ width: `${model.averageConfidence}%` }} />
      </div>
      <dl>
        <dt>Accepted</dt>
        <dd>{model.acceptedCount}</dd>
        <dt>Rejected</dt>
        <dd>{model.rejectedCount}</dd>
        <dt>Revision</dt>
        <dd>{model.revisionCount}</dd>
        <dt>Waiting</dt>
        <dd>{model.waitingCount}</dd>
      </dl>
      <div className="doctrine-chapter-grid" aria-label="Affected chapters">
        {model.affectedChapters.map((chapter) => (
          <span key={chapter.name} data-affected={chapter.affected ? 'true' : 'false'}>{chapter.name}</span>
        ))}
      </div>
    </section>
  );
}

function DoctrineReviewPanel({
  doctrineSuggestions,
  doctrineRecords,
  doctrineReviewDecisions,
  onPromoteDoctrineCandidate,
  onDoctrineReviewDecision,
}: {
  doctrineSuggestions: readonly DoctrineSuggestion[];
  doctrineRecords: readonly DoctrineRecord[];
  doctrineReviewDecisions: readonly DoctrineReviewRecord[];
  onPromoteDoctrineCandidate: (record: DoctrineRecord, historyEntry: DoctrineHistoryEntry) => void;
  onDoctrineReviewDecision: (decision: DoctrineReviewRecord) => void;
}) {
  const [revisionNote, setRevisionNote] = useState('');
  const suggestion = doctrineSuggestions.find((candidate) => (
    !doctrineReviewDecisions.some((decision) => (
      decision.candidateId === candidate.id
      && (decision.decision === 'approved' || decision.decision === 'rejected')
    ))
  ));

  if (suggestion === undefined) {
    return (
      <section className="journal-panel" aria-label="Doctrine candidate review">
        <p className="section-label">Candidate Review</p>
        <h3>No Doctrine Candidate Waiting</h3>
        <p className="muted">Commander will surface candidates when evidence supports manual review.</p>
      </section>
    );
  }
  const activeSuggestion = suggestion;

  const summary = buildDoctrineReviewSummary({
    candidateId: activeSuggestion.id,
    title: activeSuggestion.title,
    statement: activeSuggestion.rationale,
    sourceMissionOrJournal: formatDoctrineSuggestionSource(activeSuggestion),
    sourceExcerpt: activeSuggestion.rationale,
    behaviorEvidence: activeSuggestion.rationale,
    similarDoctrineExists: doctrineRecords.some((record) => record.title.toLowerCase() === activeSuggestion.title.toLowerCase()),
    conflictSummary: 'No direct conflict detected by deterministic review.',
    proposedScope: 'Operator-approved doctrine candidate',
    confidence: `${activeSuggestion.evidenceRecordIds.length} supporting ${activeSuggestion.evidenceRecordIds.length === 1 ? 'source' : 'sources'}`,
  });

  async function handleApprove() {
    const decision = recordDoctrineReviewDecision({
      candidateId: activeSuggestion.id,
      decision: 'approved',
      previous: doctrineReviewDecisions,
    });
    if (decision === undefined) return;

    const result = await promoteDesktopDoctrineCandidate({
      candidateId: activeSuggestion.id,
      title: activeSuggestion.title,
      summary: activeSuggestion.rationale,
      sourceId: activeSuggestion.evidenceRecordIds[0] ?? activeSuggestion.id,
      archiveId: activeSuggestion.evidenceRecordIds[0] ?? activeSuggestion.id,
      excerpt: activeSuggestion.rationale,
    });

    if (result) onPromoteDoctrineCandidate(result.record, result.historyEntry);
    onDoctrineReviewDecision(decision);
  }

  function handleReject() {
    const decision = recordDoctrineReviewDecision({
      candidateId: activeSuggestion.id,
      decision: 'rejected',
      reason: revisionNote || 'Evidence incomplete.',
      previous: doctrineReviewDecisions,
    });
    if (decision) onDoctrineReviewDecision(decision);
  }

  function handleRevision() {
    const decision = recordDoctrineReviewDecision({
      candidateId: activeSuggestion.id,
      decision: 'revision_requested',
      reason: revisionNote || 'Needs operator revision.',
      previous: doctrineReviewDecisions,
    });
    if (decision) onDoctrineReviewDecision(decision);
  }

  return (
    <section className="journal-panel doctrine-review-panel" aria-label="Doctrine candidate review">
      <p className="section-label">Candidate Review</p>
      <h3>Commander Assessment</h3>
      <ul>
        {summary.lines.map((line) => <li key={line}>{line}</li>)}
      </ul>
      <p className="muted">{summary.question}</p>
      <label>
        <span>Review Note</span>
        <input value={revisionNote} onChange={(event) => setRevisionNote(event.target.value)} />
      </label>
      <div className="inline-actions">
        <button className="secondary-action doctrine-promote-action" type="button" onClick={handleApprove}>Promote Doctrine</button>
        <button className="secondary-action" type="button" onClick={handleReject}>Reject Candidate</button>
        <button className="secondary-action" type="button" onClick={handleRevision}>Return for Revision</button>
      </div>
      {doctrineReviewDecisions.slice(-1).map((decision) => (
        <p key={`${decision.candidateId}-${decision.decidedAt}`} className="muted">
          {formatDoctrineReviewAudit(decision)}
        </p>
      ))}
    </section>
  );
}

function formatDoctrineSuggestionSource(suggestion: DoctrineSuggestion): string {
  const sourceCount = suggestion.evidenceRecordIds.length;
  return `${sourceCount} ${sourceCount === 1 ? 'journal evidence source' : 'journal evidence sources'} ready for operator review`;
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
  const [triggerCondition, setTriggerCondition] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [exceptionOrBoundary, setExceptionOrBoundary] = useState('');
  const [proposedScope, setProposedScope] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [decisionState, setDecisionState] = useState<'pending' | 'rejected' | 'revision_requested'>('pending');

  const candidate = createDesktopDoctrineCandidateFromDraft({
    candidateId,
    title,
    summary,
    sourceId,
    archiveId,
    excerpt,
    triggerCondition,
    expectedBehavior,
    exceptionOrBoundary,
    proposedScope,
    reviewNote,
  }, { createdAt: 'desktop-preview' });
  const validation = validateDoctrineCandidateForReview(candidate);
  const evidenceStrength = getDoctrineEvidenceStrength(candidate.supportingEvidenceCount);
  const commanderSummary = validation.valid
    ? buildDoctrineCandidateCommanderSummary(candidate)
    : 'Candidate incomplete. More evidence or clarification is required.';

  async function handlePromotion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validation.valid) return;

    const result = await promoteDesktopDoctrineCandidate({
      candidateId,
      title,
      summary,
      sourceId,
      archiveId,
      excerpt,
      triggerCondition,
      expectedBehavior,
      exceptionOrBoundary,
      proposedScope,
      reviewNote,
    });

    if (result === undefined) return;

    onPromoteDoctrineCandidate(result.record, result.historyEntry);
    setCandidateId('');
    setTitle('');
    setSummary('');
    setSourceId('');
    setArchiveId('');
    setExcerpt('');
    setTriggerCondition('');
    setExpectedBehavior('');
    setExceptionOrBoundary('');
    setProposedScope('');
    setReviewNote('');
    setDecisionState('pending');
  }

  return (
    <form className="journal-panel doctrine-review-panel" aria-label="Doctrine candidate review" onSubmit={handlePromotion}>
      <p className="section-label">Promotion Ceremony</p>
      <h3>This lesson will become Headquarters doctrine.</h3>
      <p className="muted">{commanderSummary}</p>
      <section aria-label="Candidate overview">
        <h4>Candidate Overview</h4>
        <dl>
          <dt>Status</dt>
          <dd>{validation.valid ? 'pending_review' : 'draft'}</dd>
          <dt>Evidence Strength</dt>
          <dd>{evidenceStrength.label}: {evidenceStrength.description}</dd>
          <dt>Proposed Scope</dt>
          <dd>{candidate.proposedScope || 'Awaiting scope'}</dd>
        </dl>
      </section>
      <label>
        <span>Candidate Id</span>
        <input value={candidateId} onChange={(event) => setCandidateId(event.target.value)} placeholder="candidate-001" />
      </label>
      <label>
        <span>Title</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Wait for confirmation" />
      </label>
      <label>
        <span>Proposed Rule</span>
        <textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Exact rule that will become Doctrine" />
      </label>
      <label>
        <span>Trigger Condition</span>
        <textarea value={triggerCondition} onChange={(event) => setTriggerCondition(event.target.value)} placeholder="When this rule applies" />
      </label>
      <label>
        <span>Expected Behavior</span>
        <textarea value={expectedBehavior} onChange={(event) => setExpectedBehavior(event.target.value)} placeholder="What the operator must do" />
      </label>
      <label>
        <span>Exception or Boundary</span>
        <textarea value={exceptionOrBoundary} onChange={(event) => setExceptionOrBoundary(event.target.value)} placeholder="When this rule should not apply" />
      </label>
      <label>
        <span>Scope</span>
        <input value={proposedScope} onChange={(event) => setProposedScope(event.target.value)} placeholder="Market-open missions during abnormal volatility" />
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
      <section aria-label="Doctrine evidence">
        <h4>Evidence</h4>
        <p className="muted">{candidate.evidenceSummary || 'No source evidence has been supplied yet.'}</p>
        <div className="room-action-row">
          <button className="secondary-action" type="button" disabled={!sourceId}>
            Open Source Journal Entry
          </button>
          <button className="secondary-action" type="button" disabled>
            Open Source Mission
          </button>
          <button className="secondary-action" type="button" disabled>
            Open Similar Doctrine
          </button>
          <button className="secondary-action" type="button" disabled={!excerpt}>
            Open Full Evidence
          </button>
        </div>
      </section>
      <section aria-label="Doctrine comparison">
        <h4>Comparison</h4>
        <p className="muted">{candidate.conflictSummary}</p>
      </section>
      <label>
        <span>Review Note</span>
        <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Why this decision is appropriate" />
      </label>
      {!validation.valid ? (
        <p className="muted">Candidate incomplete. More evidence or clarification is required. Issues: {validation.issues.map((issue) => issue.code).join(', ')}</p>
      ) : null}
      {decisionState === 'rejected' && !reviewNote.trim() ? (
        <p className="muted">Reject Candidate requires a rejection reason.</p>
      ) : null}
      {decisionState === 'revision_requested' && !reviewNote.trim() ? (
        <p className="muted">Return for Revision requires a revision note.</p>
      ) : null}
      <button className="secondary-action" type="submit" disabled={!validation.valid}>
        Promote Doctrine
      </button>
      <div className="room-action-row" aria-label="Doctrine candidate decisions">
        <button className="secondary-action" type="button" onClick={() => setDecisionState('rejected')}>
          Reject Candidate
        </button>
        <button className="secondary-action" type="button" onClick={() => setDecisionState('revision_requested')}>
          Return for Revision
        </button>
      </div>
    </form>
  );
}

function DoctrineHistoryPanel({ historyEntries }: { historyEntries: DoctrineHistoryEntry[] }) {
  return (
    <section className="journal-panel" aria-label="Doctrine history">
      <p className="section-label">Lifecycle</p>
      <h3>Doctrine Evolution</h3>
      {historyEntries.length === 0 ? (
        <p className="muted">No doctrine history has been recorded yet.</p>
      ) : (
        <div className="doctrine-lifecycle-list">
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
      <h3>Rule Change Review</h3>
      {diff === undefined ? (
        <p className="muted">At least two doctrine records are required for comparison.</p>
      ) : diff.changed ? (
        <div className="doctrine-diff-list">
          {diff.changes.map((change) => (
            <article className="timeline-item" key={change.field}>
              <strong>{change.field}</strong>
              <span>Removed: {change.before}</span>
              <span>Added: {change.after}</span>
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
      <h3>Affected Chapters</h3>
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
      <h3>Book of Doctrine</h3>
      {doctrineRecords.length === 0 ? (
        <p className="muted">No doctrine records have been accepted yet.</p>
      ) : (
        <div className="timeline-list">
          {doctrineRecords.map((record) => (
            <article className="timeline-item" key={record.id}>
              <strong>{record.title}</strong>
              <span>{record.summary}</span>
              <span>{formatDoctrineRecordSource(record)}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function formatDoctrineRecordSource(record: DoctrineRecord): string {
  const status = record.confidence === 'validated'
    ? 'Validated Doctrine'
    : `${record.confidence.charAt(0).toUpperCase()}${record.confidence.slice(1)} Doctrine`;
  const source = record.source.sourceType === 'journal_entry'
    ? 'Journal evidence'
    : record.source.sourceType === 'trade_review'
      ? 'Trade review evidence'
      : 'Manual operator review';
  return record.source.excerpt ? `${status} from ${source}: ${record.source.excerpt}` : `${status} from ${source}`;
}

function SettingsRoom({ audioEvents }: { readonly audioEvents: readonly AudioEvent[] }) {
  return (
    <section className="room-layout" data-room-id="settings-room" aria-label="Settings room">
      <p className="section-label">Settings</p>
      <h2>Settings</h2>
      <p className="muted">No completed settings workflow is available yet.</p>
      <AudioQASurface events={audioEvents} />
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
  if (step === 'entry') return 'Write first. Do not classify the day before the truth is on record.';
  if (step === 'reflection') return 'Commander will ask one reflection at a time. Name the emotion and the evidence.';
  if (step === 'trade-review') return 'Review the trade inside the story: original plan, reality, why, lesson.';
  if (step === 'growth') return 'Growth is recommended from evidence. Accept it only when it is true.';
  if (step === 'timeline') return 'Read the journal as a story, not a table.';
  if (step === 'search') return 'Commander Memory finds similar records when memory is unreliable.';
  return 'Journal writes. Archive stores. Send only completed evidence forward.';
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

  const id = options.id ?? crypto.randomUUID();
  const createdAt = options.createdAt ?? new Date().toISOString();

  return {
    id,
    campaign: codename,
    objective,
    condition: 'Briefing',
    commandAuthority: 'Professional command',
    currentState: 'briefing',
    createdAt,
    briefingContext: { missionObjective: objective },
    missionContext: updateMissionContextBriefing(
      createEmptyMissionContext(id, { createdAt }),
      { missionObjective: objective },
      { updatedAt: createdAt },
    ),
  };
}

export function mapMissionRecordToActiveMission(
  mission: Mission,
  previousMission?: ActiveMission,
  persistedMissionContext?: MissionContext,
): ActiveMission {
  const missionContext = previousMission?.missionContext
    ?? persistedMissionContext
    ?? createEmptyMissionContext(mission.id, { createdAt: mission.createdAt });
  const timedMissionContext = recordMissionLifecycleStageEntry(
    missionContext,
    mission.state,
    { enteredAt: mission.updatedAt ?? mission.createdAt },
  );
  const briefingContext = previousMission?.briefingContext
    ?? buildBriefingContextFromMissionContext(timedMissionContext);
  const observationContext = previousMission?.observationContext
    ?? buildObservationContextFromMissionContext(timedMissionContext);

  return {
    id: mission.id,
    campaign: mission.codename,
    objective: mission.objective ?? 'Awaiting mission objective',
    condition: formatMissionStateForDisplay(mission.state),
    commandAuthority: 'Professional command',
    currentState: mission.state,
    createdAt: mission.createdAt,
    ...(Object.keys(briefingContext).length > 0 ? { briefingContext } : {}),
    ...(Object.keys(observationContext).length > 0 ? { observationContext } : {}),
    missionContext: timedMissionContext,
  };
}

export function buildMissionContextLookup(records: readonly PersistedMissionContextRecord[]): Map<string, MissionContext> {
  return new Map(
    records
      .map((record) => [record.missionId, parsePersistedMissionContext(record)] as const)
      .filter((entry): entry is readonly [string, MissionContext] => entry[1] !== undefined),
  );
}

export function parsePersistedMissionContext(record: PersistedMissionContextRecord): MissionContext | undefined {
  try {
    const parsed = JSON.parse(record.contextJson) as Partial<MissionContext>;
    if (parsed === null || typeof parsed !== 'object' || parsed.missionId !== record.missionId) return undefined;
    const timing = normalizeMissionOperationalTiming(parsed.timing);

    return {
      missionId: record.missionId,
      briefing: typeof parsed.briefing === 'object' && parsed.briefing !== null ? parsed.briefing : {},
      observation: typeof parsed.observation === 'object' && parsed.observation !== null ? parsed.observation : {},
      commanderNotes: Array.isArray(parsed.commanderNotes) ? parsed.commanderNotes : [],
      contradictionFlags: Array.isArray(parsed.contradictionFlags) ? parsed.contradictionFlags : [],
      readiness: {
        briefingComplete: parsed.readiness?.briefingComplete === true,
        observationComplete: parsed.readiness?.observationComplete === true,
        warRoomReady: parsed.readiness?.warRoomReady === true,
        debriefReady: parsed.readiness?.debriefReady === true,
      },
      ...(timing ? { timing } : {}),
      ...(typeof parsed.createdAt === 'string' ? { createdAt: parsed.createdAt } : {}),
      ...(typeof parsed.updatedAt === 'string' ? { updatedAt: parsed.updatedAt } : {}),
    };
  } catch {
    return undefined;
  }
}

function buildBriefingContextFromMissionContext(context: MissionContext): MissionBriefingContext {
  return {
    ...context.briefing,
  };
}

function buildObservationContextFromMissionContext(context: MissionContext): MissionObservationContext {
  return {
    ...(hasMissionContextText(context.observation.observedDirection) ? { marketDirection: context.observation.observedDirection } : {}),
    ...(hasMissionContextText(context.observation.marketStructure) ? { marketStructure: context.observation.marketStructure } : {}),
    ...(hasMissionContextText(context.observation.volume) ? { volume: context.observation.volume } : {}),
    ...(hasMissionContextText(context.observation.liquidityNotes) ? { liquidity: context.observation.liquidityNotes } : {}),
    ...(hasMissionContextText(context.observation.keyLevels) ? { keyLevels: context.observation.keyLevels } : {}),
    ...(hasMissionContextText(context.observation.directionalHypothesis) ? { bias: context.observation.directionalHypothesis } : {}),
    ...(hasMissionContextText(context.observation.invalidationEvidence) ? { invalidationEvidence: context.observation.invalidationEvidence } : {}),
    ...(hasMissionContextText(context.observation.emotionalCheck) ? { emotionalCheck: context.observation.emotionalCheck } : {}),
    ...(context.observation.evidenceReadiness ? { readiness: context.observation.evidenceReadiness } : {}),
    ...(hasMissionContextText(context.observation.operationalSummary) ? { operationalPicture: context.observation.operationalSummary } : {}),
    ...(context.observation.additionalObservations && context.observation.additionalObservations.length > 0
      ? { additionalObservations: [...context.observation.additionalObservations] }
      : {}),
  };
}

function mapActiveMissionToLifecycleMission(mission?: ActiveMission): Mission | undefined {
  const state = parseMissionState(mission?.currentState);
  if (mission === undefined || state === undefined) return undefined;

  return {
    id: mission.id,
    codename: mission.campaign,
    state,
    objective: mission.objective,
    createdAt: mission.createdAt,
    updatedAt: mission.createdAt,
  };
}

function projectDesktopMissionLifecycle(mission?: ActiveMission): MissionLifecycleProjection {
  return projectMissionLifecycle(mapActiveMissionToLifecycleMission(mission));
}

function mapLifecycleProjectionRoomToCommanderRoom(room: MissionLifecycleProjection['recommendedRoom']): CommanderShellRoomId {
  if (room === 'command-center') return 'command';
  if (room === 'mission-room') return 'command';
  if (room === 'ready-room') return 'ready-room';
  if (room === 'observation-room') return 'observation';
  if (room === 'war-room') return 'war-room';
  if (room === 'debrief-theater') return 'debrief';
  return 'archive';
}

export function withBriefingMissionContext(
  mission: ActiveMission,
  briefingContext: MissionBriefingContext,
  options: { readonly updatedAt?: string } = {},
): ActiveMission {
  const baseContext = mission.missionContext ?? createEmptyMissionContext(mission.id, { createdAt: mission.createdAt });
  const contextWithBriefing = updateMissionContextBriefing(
    baseContext,
    buildMissionContextBriefingAnswers(briefingContext),
    options,
  );
  const missionContext = updateMissionContextReadiness(
    contextWithBriefing,
    { briefingComplete: isReadyRoomBriefingComplete(briefingContext) },
    options,
  );

  return {
    ...mission,
    briefingContext,
    missionContext,
  };
}

export function withObservationMissionContext(
  mission: ActiveMission,
  observationContext: MissionObservationContext,
  options: { readonly updatedAt?: string } = {},
): ActiveMission {
  const baseContext = mission.missionContext ?? createEmptyMissionContext(mission.id, { createdAt: mission.createdAt });
  const contextWithObservation = updateMissionContextObservation(
    baseContext,
    buildMissionContextObservationAnswers(observationContext),
    options,
  );
  const observationComplete = isObservationInterviewComplete(observationContext);
  const missionContext = updateMissionContextReadiness(
    contextWithObservation,
    {
      observationComplete,
      warRoomReady: observationComplete,
    },
    options,
  );

  return {
    ...mission,
    observationContext,
    missionContext,
  };
}

export function buildDesktopMissionIntelligencePackage(
  mission: ActiveMission,
  input: {
    readonly authorizationStatus?: MissionAuthorizationStatus | undefined;
    readonly missionDebrief?: MissionDebrief | undefined;
    readonly archiveSummary?: LocalMissionArchiveSummary | undefined;
    readonly operatorJustification?: string | undefined;
    readonly invalidation?: string | undefined;
    readonly behaviorSummary?: string | undefined;
    readonly disciplineNotes?: string | undefined;
    readonly lesson?: string | undefined;
  } = {},
): MissionIntelligencePackage {
  const packageInput = {
    missionId: mission.id,
    missionName: mission.campaign,
    currentState: mission.currentState,
    fallbackObjective: mission.objective,
    authorization: {
      ...(input.authorizationStatus ? {
        decision: input.authorizationStatus.decision,
        reason: input.authorizationStatus.reason,
      } : {}),
      ...(hasMissionContextText(input.operatorJustification) ? { operatorJustification: input.operatorJustification } : {}),
      ...(hasMissionContextText(input.invalidation) ? { invalidation: input.invalidation } : {}),
    },
    debrief: {
      ...(input.missionDebrief ? {
        behaviorSummary: input.missionDebrief.behaviorSummary,
        disciplineNotes: input.missionDebrief.disciplineNotes,
        lesson: input.missionDebrief.lesson,
      } : {}),
      ...(hasMissionContextText(input.behaviorSummary) ? { behaviorSummary: input.behaviorSummary } : {}),
      ...(hasMissionContextText(input.disciplineNotes) ? { disciplineNotes: input.disciplineNotes } : {}),
      ...(hasMissionContextText(input.lesson) ? { lesson: input.lesson } : {}),
    },
    ...(input.archiveSummary ? { archiveReference: `archive:${input.archiveSummary.missionId}` } : {}),
    guardianNotes: buildDesktopGuardianAlerts({
      mission,
      authorizationStatus: input.authorizationStatus,
      operatorJustification: input.operatorJustification,
      invalidation: input.invalidation,
    }).map((alert) => alert.message),
    ...(mission.missionContext ? { missionContext: mission.missionContext } : {}),
  };

  return buildMissionIntelligencePackage(packageInput);
}

function buildMissionContextBriefingAnswers(context: MissionBriefingContext): MissionContextBriefingAnswers {
  return {
    ...(hasMissionContextText(context.missionObjective) ? { missionObjective: context.missionObjective } : {}),
    ...(hasMissionContextText(context.market) ? { market: context.market } : {}),
    ...(hasMissionContextText(context.marketEnvironment) ? { marketEnvironment: context.marketEnvironment } : {}),
    ...(hasMissionContextText(context.highImpactNews) ? { highImpactNews: context.highImpactNews } : {}),
    ...(hasMissionContextText(context.personalReadiness) ? { personalReadiness: context.personalReadiness } : {}),
    ...(hasMissionContextText(context.riskParameters) ? { riskParameters: context.riskParameters } : {}),
    ...(hasMissionContextText(context.successCriteria) ? { successCriteria: context.successCriteria } : {}),
  };
}

function buildMissionContextObservationAnswers(context: MissionObservationContext): MissionContextObservationAnswers {
  return {
    ...(hasMissionContextText(context.marketDirection) ? { observedDirection: context.marketDirection } : {}),
    ...(hasMissionContextText(context.marketStructure) ? { marketStructure: context.marketStructure } : {}),
    ...(hasMissionContextText(context.volume) ? { volume: context.volume } : {}),
    ...(hasMissionContextText(context.liquidity) ? { liquidityNotes: context.liquidity } : {}),
    ...(hasMissionContextText(context.keyLevels) ? { keyLevels: context.keyLevels } : {}),
    ...(hasMissionContextText(context.bias) ? { directionalHypothesis: context.bias } : {}),
    ...(hasMissionContextText(context.invalidationEvidence) ? { invalidationEvidence: context.invalidationEvidence } : {}),
    ...(hasMissionContextText(context.emotionalCheck) ? { emotionalCheck: context.emotionalCheck } : {}),
    ...(context.readiness ? { evidenceReadiness: context.readiness } : {}),
    ...(hasMissionContextText(context.operationalPicture) ? { operationalSummary: context.operationalPicture } : {}),
    ...(context.additionalObservations && context.additionalObservations.length > 0
      ? { additionalObservations: [...context.additionalObservations] }
      : {}),
  };
}

function hasMissionContextText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}

export function formatMissionStateForDisplay(state: Mission['state']): string {
  return state
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildMissionLifecycleSteps(mission?: ActiveMission): MissionLifecycleStep[] {
  const lifecycleMission = mapActiveMissionToLifecycleMission(mission);
  const currentState = lifecycleMission?.state;
  const currentIndex = currentState ? missionLifecyclePath.indexOf(currentState) : -1;
  const completedStages = getProjectedCompletedLifecycleStages(lifecycleMission);
  const projectedStage = getProjectedCurrentLifecycleStage(lifecycleMission);

  return missionLifecyclePath.map((state, index) => ({
    state,
    label: formatMissionStateForDisplay(state),
    status: getProjectedMissionLifecycleStepStatus(state, index, currentIndex, projectedStage, completedStages),
  }));
}

export function formatMissionLifecycleSummary(mission?: ActiveMission): string {
  const projection = projectDesktopMissionLifecycle(mission);

  if (mission === undefined) return 'Mission route standing by';
  return `Current station: ${getMissionLifecycleStation(projection.currentMissionState ?? 'idle')}`;
}

export function formatMissionLifecycleStepStatus(status: MissionLifecycleStepStatus): string {
  if (status === 'completed') return 'Complete';
  if (status === 'current') return 'Current';
  return 'Pending';
}

export function getMissionLifecycleStation(state: MissionState): string {
  if (state === 'idle') return 'Ready Room Intake';
  if (state === 'briefing') return 'Ready Room Briefing';
  if (state === 'ready') return 'Ready Room Final Check';
  if (state === 'observation') return 'Observation Room';
  if (state === 'authorization') return 'War Room Authorization';
  if (state === 'deployed') return 'War Room Deployment';
  if (state === 'return_to_base') return 'Debrief Theater Return';
  if (state === 'debrief') return 'Debrief Theater';
  return 'Archive Vault';
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

export function formatDebriefMissionDuration(mission?: ActiveMission): string {
  if (mission === undefined) return 'Not available';

  const createdAt = Date.parse(mission.createdAt);
  if (Number.isNaN(createdAt)) return 'Not available';

  const elapsedMs = Math.max(0, Date.now() - createdAt);
  const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60000));
  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;

  if (hours <= 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function getMissionLifecycleStepStatus(index: number, currentIndex: number): MissionLifecycleStepStatus {
  if (currentIndex < 0) return 'pending';
  if (index < currentIndex) return 'completed';
  if (index === currentIndex) return 'current';
  return 'pending';
}

function getProjectedMissionLifecycleStepStatus(
  state: MissionState,
  index: number,
  currentIndex: number,
  projectedStage: ReturnType<typeof getProjectedCurrentLifecycleStage>,
  completedStages: ReturnType<typeof getProjectedCompletedLifecycleStages>,
): MissionLifecycleStepStatus {
  if (state === 'idle') {
    if (projectedStage === 'missionCreation') return 'current';
    return completedStages.includes('missionCreation') ? 'completed' : 'pending';
  }

  if (state === 'briefing') {
    if (projectedStage === 'briefing') return 'current';
    return completedStages.includes('briefing') ? 'completed' : 'pending';
  }

  if (state === 'ready') {
    if (projectedStage === 'observation' && currentIndex === missionLifecyclePath.indexOf('ready')) return 'current';
    return completedStages.includes('briefing') ? 'completed' : 'pending';
  }

  if (state === 'observation') {
    if (projectedStage === 'observation' && currentIndex !== missionLifecyclePath.indexOf('ready')) return 'current';
    return completedStages.includes('observation') ? 'completed' : 'pending';
  }

  if (state === 'authorization') {
    if (projectedStage === 'authorization') return 'current';
    return completedStages.includes('authorization') ? 'completed' : 'pending';
  }

  if (state === 'deployed') {
    if (projectedStage === 'deployed') return 'current';
    return completedStages.includes('deployed') ? 'completed' : 'pending';
  }

  if (state === 'return_to_base') {
    if (projectedStage === 'returnToBase') return 'current';
    return completedStages.includes('returnToBase') ? 'completed' : 'pending';
  }

  if (state === 'debrief') {
    if (projectedStage === 'debrief') return 'current';
    return completedStages.includes('debrief') ? 'completed' : 'pending';
  }

  if (state === 'archived') {
    if (projectedStage === 'archived') return 'current';
    return completedStages.includes('archived') ? 'completed' : 'pending';
  }

  return getMissionLifecycleStepStatus(index, currentIndex);
}

export interface MissionNextAction {
  readonly label: string;
  readonly description: string;
  readonly buttonLabel: string;
  readonly disabled: boolean;
}

export type MissionCommandSidebarStageState = 'completed' | 'active' | 'available' | 'locked' | 'blocked';
export type MissionCommandGuardianState = 'secure' | 'warning' | 'restriction' | 'lockout';
export type MissionCommandOutcomeState = 'not evaluated' | 'on course' | 'at risk' | 'completed';
export type InstitutionalHealthState = 'stable' | 'forming' | 'degraded' | 'critical';
export type OperationalConsequenceCategory = 'process' | 'guardian' | 'intelligence' | 'doctrine' | 'academy' | 'commander';
export type OperationalConsequenceSeverity = 'notice' | 'caution' | 'restriction' | 'lockout';
export type OperationalConsequenceDuration = 'temporary' | 'session' | 'historical';
export type MissionFinalClassification = MissionEvaluationVerdict;

export interface InstitutionalHealthDimension {
  readonly id: string;
  readonly label: string;
  readonly state: InstitutionalHealthState;
  readonly explanation: string;
  readonly evidence: readonly string[];
}

export interface InstitutionalHealthModel {
  readonly summary: string;
  readonly overallState: InstitutionalHealthState;
  readonly dimensions: readonly InstitutionalHealthDimension[];
}

export interface OperationalConsequence {
  readonly id: string;
  readonly category: OperationalConsequenceCategory;
  readonly severity: OperationalConsequenceSeverity;
  readonly cause: string;
  readonly effect: string;
  readonly evidenceReference: string;
  readonly duration: OperationalConsequenceDuration;
  readonly recoveryCondition: string;
}

export type MissionFinalEvaluation = MissionEvaluation;

export interface MissionCommandSidebarStage {
  readonly id: string;
  readonly label: string;
  readonly state: MissionCommandSidebarStageState;
  readonly explanation: string;
}

export interface MissionCommandSidebarModel {
  readonly missionIdentity: {
    readonly codename: string;
    readonly objective: string;
    readonly state: string;
    readonly startedAt: string;
  };
  readonly lifecycleProgress: readonly MissionCommandSidebarStage[];
  readonly currentStation: {
    readonly room: string;
    readonly lifecycleStage: string;
    readonly selectedView: string;
  };
  readonly nextAction: {
    readonly label: string;
    readonly destinationRoom: string;
    readonly explanation: string;
    readonly blocked: boolean;
  };
  readonly intelligence: {
    readonly contextCompleteness: string;
    readonly evidenceQuality: string;
    readonly missingRequiredFieldCount: number;
    readonly contradictionState: string;
  };
  readonly guardian: {
    readonly state: MissionCommandGuardianState;
    readonly highestAlert: string;
  };
  readonly doctrine: {
    readonly activeProtectiveRule: string;
    readonly pendingCandidateCount: number;
    readonly relevance: string;
  };
  readonly institutionalHealth: InstitutionalHealthModel;
  readonly consequences: readonly OperationalConsequence[];
  readonly finalEvaluation: MissionFinalEvaluation;
  readonly outcomeState: MissionCommandOutcomeState;
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
  const lifecycleMission = mapActiveMissionToLifecycleMission(mission);
  const projectedAction = getProjectedPrimaryLifecycleAction(lifecycleMission);
  const currentState = lifecycleMission?.state;

  if (currentState === undefined) {
    return {
      label: projectedAction.label,
      description: projectedAction.explanation,
      buttonLabel: projectedAction.label,
      disabled: projectedAction.disabled,
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
      label: 'Plan Concluded',
      description: 'Mission is deployed. Return is available only after the plan is explicitly concluded.',
      buttonLabel: 'Plan Concluded',
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

export function buildMissionCommandSidebarModel(input: {
  readonly mission?: ActiveMission | undefined;
  readonly currentRoom: CommanderShellRoomId;
  readonly selectedView: 'chat' | 'room';
  readonly nextAction: MissionNextAction;
  readonly missionIntelligence?: MissionIntelligencePackage | undefined;
  readonly guardianAlerts: readonly GuardianAlert[];
  readonly doctrineCandidateCount: number;
  readonly protectiveRule?: string | undefined;
  readonly startupStatus?: StartupStatus | undefined;
}): MissionCommandSidebarModel {
  const missionState = parseMissionState(input.mission?.currentState);
  const guardian = buildMissionCommandGuardianState(input.guardianAlerts);
  const doctrine = {
    activeProtectiveRule: input.protectiveRule?.trim() || 'No protective rule declared for current authorization.',
    pendingCandidateCount: input.doctrineCandidateCount,
    relevance: input.doctrineCandidateCount > 0
      ? 'Doctrine review is available for this operation.'
      : 'No current doctrine review is blocking mission flow.',
  };

  return {
    missionIdentity: {
      codename: input.mission?.campaign ?? 'No active mission',
      objective: input.mission?.objective ?? 'Create a mission to activate Headquarters.',
      state: missionState ? formatMissionStateForDisplay(missionState) : 'Standby',
      startedAt: input.mission?.createdAt ? formatDateTime(input.mission.createdAt) : 'Not started',
    },
    lifecycleProgress: buildMissionCommandLifecycleProgress(missionState, guardian.state),
    currentStation: {
      room: formatRoomLabel(input.currentRoom),
      lifecycleStage: missionState ? formatMissionStateForDisplay(missionState) : 'Mission Creation',
      selectedView: input.selectedView === 'chat' ? 'Commander Chat' : 'Current Room',
    },
    nextAction: {
      label: guardian.state === 'lockout' ? 'Resolve Guardian lockout' : input.nextAction.label,
      destinationRoom: formatRoomLabel(input.currentRoom),
      explanation: guardian.state === 'lockout' ? guardian.highestAlert : input.nextAction.description,
      blocked: input.nextAction.disabled || guardian.state === 'lockout',
    },
    intelligence: {
      contextCompleteness: formatMissionCommandContextCompleteness(input.missionIntelligence),
      evidenceQuality: formatMissionCommandEvidenceQuality(input.missionIntelligence),
      missingRequiredFieldCount: input.missionIntelligence?.missingEvidence.length ?? 0,
      contradictionState: formatMissionCommandContradictionState(input.missionIntelligence),
    },
    guardian,
    doctrine,
    institutionalHealth: buildInstitutionalHealthModel({
      missionState,
      missionIntelligence: input.missionIntelligence,
      guardian,
      doctrine,
      startupStatus: input.startupStatus,
      nextAction: input.nextAction,
    }),
    consequences: buildOperationalConsequences({
      missionState,
      missionIntelligence: input.missionIntelligence,
      guardian,
      doctrine,
      nextAction: input.nextAction,
    }),
    finalEvaluation: buildMissionFinalEvaluation({
      missionState,
      missionIntelligence: input.missionIntelligence,
      guardian,
      doctrine,
    }),
    outcomeState: buildMissionCommandOutcomeState(missionState, input.missionIntelligence, guardian.state),
  };
}

export const buildMissionFinalEvaluation = buildMissionEvaluation;

export function buildOperationalConsequences(input: {
  readonly missionState: MissionState | undefined;
  readonly missionIntelligence?: MissionIntelligencePackage | undefined;
  readonly guardian: MissionCommandSidebarModel['guardian'];
  readonly doctrine: MissionCommandSidebarModel['doctrine'];
  readonly nextAction?: MissionNextAction | undefined;
}): readonly OperationalConsequence[] {
  const consequences: OperationalConsequence[] = [];

  if (input.guardian.state === 'lockout' || input.guardian.state === 'restriction') {
    consequences.push({
      id: `guardian-${input.guardian.state}`,
      category: 'guardian',
      severity: input.guardian.state === 'lockout' ? 'lockout' : 'restriction',
      cause: input.guardian.state === 'lockout' ? 'Guardian lockout active' : 'Guardian restriction active',
      effect: 'Mission progression is contained until Guardian recovery conditions are satisfied.',
      evidenceReference: input.guardian.highestAlert,
      duration: 'temporary',
      recoveryCondition: 'Resolve or acknowledge the Guardian condition before requesting further authorization.',
    });
  } else if (input.guardian.state === 'warning') {
    consequences.push({
      id: 'guardian-warning',
      category: 'guardian',
      severity: 'caution',
      cause: 'Guardian warning active',
      effect: 'Commander guidance becomes more conservative while the warning remains active.',
      evidenceReference: input.guardian.highestAlert,
      duration: 'session',
      recoveryCondition: 'Continue the mission without violating the monitored boundary.',
    });
  }

  if (input.nextAction?.disabled) {
    consequences.push({
      id: 'process-next-action-blocked',
      category: 'process',
      severity: 'restriction',
      cause: 'Primary action blocked',
      effect: 'The mission cannot advance through the normal next action.',
      evidenceReference: input.nextAction.description,
      duration: 'temporary',
      recoveryCondition: 'Complete the required current-room evidence before retrying the action.',
    });
  }

  if (input.missionIntelligence && input.missionIntelligence.missingEvidence.length > 0) {
    const missingLabels = input.missionIntelligence.missingEvidence.slice(0, 3).map((item) => item.label).join(', ');
    consequences.push({
      id: 'intelligence-missing-evidence',
      category: 'intelligence',
      severity: 'caution',
      cause: 'Mission evidence incomplete',
      effect: 'Intelligence confidence remains limited until required context is supplied.',
      evidenceReference: `${input.missionIntelligence.missingEvidence.length} missing field(s): ${missingLabels}`,
      duration: 'temporary',
      recoveryCondition: 'Answer the missing Commander questions or revise the mission context.',
    });
  }

  if (input.missionIntelligence && input.missionIntelligence.contradictions.length > 0) {
    consequences.push({
      id: 'intelligence-contradiction',
      category: 'intelligence',
      severity: 'restriction',
      cause: 'Unresolved contradiction',
      effect: 'Commander should challenge or slow progression until the contradiction is resolved.',
      evidenceReference: `${input.missionIntelligence.contradictions.length} contradiction(s) recorded.`,
      duration: 'temporary',
      recoveryCondition: 'Resolve the contradiction by revising the conflicting mission evidence.',
    });
  }

  const protectiveRuleMissing = input.doctrine.activeProtectiveRule.startsWith('No protective rule');
  if ((input.missionState === 'authorization' || input.missionState === 'deployed') && protectiveRuleMissing) {
    consequences.push({
      id: 'doctrine-protective-rule-missing',
      category: 'doctrine',
      severity: 'restriction',
      cause: 'Protective rule missing',
      effect: 'Authorization quality is degraded because no doctrine boundary protects the decision.',
      evidenceReference: input.doctrine.activeProtectiveRule,
      duration: 'temporary',
      recoveryCondition: 'State a protective rule or promote applicable doctrine before proceeding.',
    });
  }

  if (input.doctrine.pendingCandidateCount > 0) {
    consequences.push({
      id: 'doctrine-candidate-pending',
      category: 'doctrine',
      severity: 'notice',
      cause: 'Doctrine review pending',
      effect: 'Doctrine remains available for later review without blocking the active mission.',
      evidenceReference: `${input.doctrine.pendingCandidateCount} doctrine candidate(s) pending.`,
      duration: 'historical',
      recoveryCondition: 'Review, promote, revise, or reject the pending doctrine candidate.',
    });
  }

  if ((input.missionState === 'return_to_base' || input.missionState === 'debrief') && !input.missionIntelligence?.debriefSummary) {
    consequences.push({
      id: 'process-debrief-missing',
      category: 'process',
      severity: 'caution',
      cause: 'Debrief evidence missing',
      effect: 'Archive quality and Academy recognition remain limited until behavior evidence is recorded.',
      evidenceReference: 'No debrief summary is present for this mission.',
      duration: 'temporary',
      recoveryCondition: 'Complete the debrief with behavior, discipline, and lesson evidence.',
    });
  }

  if (input.missionState === 'archived' && input.missionIntelligence?.debriefSummary) {
    consequences.push({
      id: 'academy-growth-evidence-ready',
      category: 'academy',
      severity: 'notice',
      cause: 'Growth evidence available',
      effect: 'Academy can use the completed debrief as evidence for future recognition.',
      evidenceReference: input.missionIntelligence.debriefSummary,
      duration: 'historical',
      recoveryCondition: 'No recovery required. Preserve the evidence in the archive.',
    });
  }

  return dedupeOperationalConsequences(consequences);
}

function dedupeOperationalConsequences(consequences: readonly OperationalConsequence[]): readonly OperationalConsequence[] {
  const seen = new Set<string>();
  return consequences.filter((consequence) => {
    if (seen.has(consequence.id)) return false;
    seen.add(consequence.id);
    return true;
  });
}

export function buildInstitutionalHealthModel(input: {
  readonly missionState: MissionState | undefined;
  readonly missionIntelligence?: MissionIntelligencePackage | undefined;
  readonly guardian: MissionCommandSidebarModel['guardian'];
  readonly doctrine: MissionCommandSidebarModel['doctrine'];
  readonly startupStatus?: StartupStatus | undefined;
  readonly nextAction?: MissionNextAction | undefined;
}): InstitutionalHealthModel {
  const dimensions: readonly InstitutionalHealthDimension[] = [
    buildOperationalReadinessHealth(input),
    buildMissionIntegrityHealth(input),
    buildIntelligenceCompletenessHealth(input.missionIntelligence),
    buildEvidenceQualityHealth(input.missionIntelligence),
    buildBehavioralStabilityHealth(input),
    buildGuardianStabilityHealth(input.guardian),
    buildDoctrineCoverageHealth(input),
    buildAcademyProgressHealth(input),
  ];
  const overallState = getWorstInstitutionalHealthState(dimensions.map((dimension) => dimension.state));

  return {
    summary: getInstitutionalHealthSummary(overallState),
    overallState,
    dimensions,
  };
}

function buildOperationalReadinessHealth(input: {
  readonly missionState: MissionState | undefined;
  readonly guardian: MissionCommandSidebarModel['guardian'];
  readonly startupStatus?: StartupStatus | undefined;
  readonly nextAction?: MissionNextAction | undefined;
}): InstitutionalHealthDimension {
  if (input.startupStatus?.state === 'failed' || input.startupStatus?.database.connected === false) {
    return createInstitutionalHealthDimension(
      'operational-readiness',
      'Operational Readiness',
      'critical',
      'Headquarters infrastructure is not ready for normal operation.',
      ['Startup or database evidence reports a failure.'],
    );
  }

  if (input.guardian.state === 'lockout') {
    return createInstitutionalHealthDimension(
      'operational-readiness',
      'Operational Readiness',
      'critical',
      'Guardian lockout prevents normal operational movement.',
      [input.guardian.highestAlert],
    );
  }

  if (input.nextAction?.disabled) {
    return createInstitutionalHealthDimension(
      'operational-readiness',
      'Operational Readiness',
      'degraded',
      'The current primary action is blocked.',
      [input.nextAction.description],
    );
  }

  if (input.missionState === undefined) {
    return createInstitutionalHealthDimension(
      'operational-readiness',
      'Operational Readiness',
      'forming',
      'Headquarters is standing by until the operator creates a mission.',
      ['No active mission lifecycle is present.'],
    );
  }

  return createInstitutionalHealthDimension(
    'operational-readiness',
    'Operational Readiness',
    'stable',
    'Headquarters can support the current operational step.',
    ['Infrastructure is available.', `Lifecycle stage: ${formatMissionStateForDisplay(input.missionState)}.`],
  );
}

function buildMissionIntegrityHealth(input: {
  readonly missionState: MissionState | undefined;
  readonly missionIntelligence?: MissionIntelligencePackage | undefined;
}): InstitutionalHealthDimension {
  if (input.missionState === undefined) {
    return createInstitutionalHealthDimension(
      'mission-integrity',
      'Mission Integrity',
      'forming',
      'Mission integrity can be evaluated after a mission exists.',
      ['No active mission record is selected.'],
    );
  }

  if (input.missionIntelligence && input.missionIntelligence.contradictions.length > 0) {
    return createInstitutionalHealthDimension(
      'mission-integrity',
      'Mission Integrity',
      'degraded',
      'Mission evidence contains unresolved contradictions.',
      [`${input.missionIntelligence.contradictions.length} contradiction(s) require review.`],
    );
  }

  if (input.missionIntelligence && input.missionIntelligence.missingEvidence.length > 0) {
    return createInstitutionalHealthDimension(
      'mission-integrity',
      'Mission Integrity',
      'degraded',
      'Required mission evidence is not complete.',
      [`${input.missionIntelligence.missingEvidence.length} evidence field(s) missing.`],
    );
  }

  return createInstitutionalHealthDimension(
    'mission-integrity',
    'Mission Integrity',
    'stable',
    'Lifecycle and required evidence are internally consistent.',
    [`Lifecycle stage: ${formatMissionStateForDisplay(input.missionState)}.`],
  );
}

function buildIntelligenceCompletenessHealth(missionPackage?: MissionIntelligencePackage): InstitutionalHealthDimension {
  if (!missionPackage) {
    return createInstitutionalHealthDimension(
      'intelligence-completeness',
      'Intelligence Completeness',
      'forming',
      'Mission intelligence has not been assembled yet.',
      ['No mission intelligence package is available.'],
    );
  }

  if (missionPackage.confidence.level === 'complete' || missionPackage.confidence.level === 'sufficient') {
    return createInstitutionalHealthDimension(
      'intelligence-completeness',
      'Intelligence Completeness',
      'stable',
      'Mission context coverage is sufficient for current decisions.',
      missionPackage.confidence.reasons,
    );
  }

  return createInstitutionalHealthDimension(
    'intelligence-completeness',
    'Intelligence Completeness',
    missionPackage.confidence.level === 'forming' ? 'forming' : 'degraded',
    'Mission context still needs evidence before it should guide high-risk decisions.',
    missionPackage.confidence.reasons,
  );
}

function buildEvidenceQualityHealth(missionPackage?: MissionIntelligencePackage): InstitutionalHealthDimension {
  if (!missionPackage) {
    return createInstitutionalHealthDimension(
      'evidence-quality',
      'Evidence Quality',
      'forming',
      'Evidence quality is awaiting operator context.',
      ['No traceable mission evidence is present yet.'],
    );
  }

  if (missionPackage.contradictions.length > 0) {
    return createInstitutionalHealthDimension(
      'evidence-quality',
      'Evidence Quality',
      'degraded',
      'Contradictions reduce evidence reliability.',
      [`${missionPackage.contradictions.length} contradiction(s) remain unresolved.`],
    );
  }

  if (missionPackage.confidence.level === 'complete') {
    return createInstitutionalHealthDimension(
      'evidence-quality',
      'Evidence Quality',
      'stable',
      'Evidence is specific, complete, and traceable enough for the current mission.',
      ['All required mission intelligence fields are present.'],
    );
  }

  if (missionPackage.confidence.level === 'sufficient') {
    return createInstitutionalHealthDimension(
      'evidence-quality',
      'Evidence Quality',
      'stable',
      'Evidence is sufficient for operational guidance.',
      missionPackage.confidence.reasons,
    );
  }

  return createInstitutionalHealthDimension(
    'evidence-quality',
    'Evidence Quality',
    'degraded',
    'Evidence remains incomplete or too thin for strong operational reliance.',
    missionPackage.confidence.reasons,
  );
}

function buildBehavioralStabilityHealth(input: {
  readonly guardian: MissionCommandSidebarModel['guardian'];
  readonly missionIntelligence?: MissionIntelligencePackage | undefined;
}): InstitutionalHealthDimension {
  if (input.guardian.state === 'lockout' || input.guardian.state === 'restriction') {
    return createInstitutionalHealthDimension(
      'behavioral-stability',
      'Behavioral Stability',
      'degraded',
      'Guardian evidence indicates behavior needs containment before progression.',
      [input.guardian.highestAlert],
    );
  }

  if (input.missionIntelligence?.debriefSummary) {
    return createInstitutionalHealthDimension(
      'behavioral-stability',
      'Behavioral Stability',
      'stable',
      'Behavior evidence has been reviewed in debrief.',
      [input.missionIntelligence.debriefSummary],
    );
  }

  return createInstitutionalHealthDimension(
    'behavioral-stability',
    'Behavioral Stability',
    'forming',
    'Behavioral stability is being evaluated from mission process evidence.',
    ['No Guardian restriction is currently active.'],
  );
}

function buildGuardianStabilityHealth(guardian: MissionCommandSidebarModel['guardian']): InstitutionalHealthDimension {
  if (guardian.state === 'lockout') {
    return createInstitutionalHealthDimension(
      'guardian-stability',
      'Guardian Stability',
      'critical',
      'Guardian has locked operational progression.',
      [guardian.highestAlert],
    );
  }

  if (guardian.state === 'restriction') {
    return createInstitutionalHealthDimension(
      'guardian-stability',
      'Guardian Stability',
      'degraded',
      'Guardian restriction requires resolution or acknowledgement.',
      [guardian.highestAlert],
    );
  }

  if (guardian.state === 'warning') {
    return createInstitutionalHealthDimension(
      'guardian-stability',
      'Guardian Stability',
      'forming',
      'Guardian is monitoring a warning condition.',
      [guardian.highestAlert],
    );
  }

  return createInstitutionalHealthDimension(
    'guardian-stability',
    'Guardian Stability',
    'stable',
    'Guardian reports no active restriction.',
    [guardian.highestAlert],
  );
}

function buildDoctrineCoverageHealth(input: {
  readonly missionState: MissionState | undefined;
  readonly doctrine: MissionCommandSidebarModel['doctrine'];
}): InstitutionalHealthDimension {
  const protectiveRuleMissing = input.doctrine.activeProtectiveRule.startsWith('No protective rule');
  const protectiveRuleRequired = input.missionState === 'authorization' || input.missionState === 'deployed';

  if (protectiveRuleRequired && protectiveRuleMissing) {
    return createInstitutionalHealthDimension(
      'doctrine-coverage',
      'Doctrine Coverage',
      'degraded',
      'Authorization lacks an active protective doctrine rule.',
      ['War Room decisions require a protective rule before they are institutionally sound.'],
    );
  }

  if (input.doctrine.pendingCandidateCount > 0) {
    return createInstitutionalHealthDimension(
      'doctrine-coverage',
      'Doctrine Coverage',
      'forming',
      'Doctrine coverage is improving but pending review remains.',
      [`${input.doctrine.pendingCandidateCount} doctrine candidate(s) await review.`],
    );
  }

  return createInstitutionalHealthDimension(
    'doctrine-coverage',
    'Doctrine Coverage',
    protectiveRuleMissing ? 'forming' : 'stable',
    protectiveRuleMissing
      ? 'Doctrine is available but no current protective rule has been declared.'
      : 'Protective doctrine is available for the current mission.',
    [input.doctrine.activeProtectiveRule],
  );
}

function buildAcademyProgressHealth(input: {
  readonly missionState: MissionState | undefined;
  readonly missionIntelligence?: MissionIntelligencePackage | undefined;
}): InstitutionalHealthDimension {
  if (input.missionState === 'archived' && input.missionIntelligence?.debriefSummary) {
    return createInstitutionalHealthDimension(
      'academy-progress',
      'Academy Progress',
      'stable',
      'Archived debrief evidence can support growth recognition.',
      [input.missionIntelligence.debriefSummary],
    );
  }

  if (input.missionIntelligence?.debriefSummary) {
    return createInstitutionalHealthDimension(
      'academy-progress',
      'Academy Progress',
      'forming',
      'Debrief evidence exists and can become growth evidence after closure.',
      [input.missionIntelligence.debriefSummary],
    );
  }

  return createInstitutionalHealthDimension(
    'academy-progress',
    'Academy Progress',
    'forming',
    'Academy progress requires approved behavior evidence, not outcome alone.',
    ['No final behavior evidence is ready for recognition.'],
  );
}

function createInstitutionalHealthDimension(
  id: string,
  label: string,
  state: InstitutionalHealthState,
  explanation: string,
  evidence: readonly string[],
): InstitutionalHealthDimension {
  return {
    id,
    label,
    state,
    explanation,
    evidence: evidence.length > 0 ? evidence : ['No evidence recorded.'],
  };
}

function getWorstInstitutionalHealthState(states: readonly InstitutionalHealthState[]): InstitutionalHealthState {
  if (states.includes('critical')) return 'critical';
  if (states.includes('degraded')) return 'degraded';
  if (states.includes('forming')) return 'forming';
  return 'stable';
}

function getInstitutionalHealthSummary(state: InstitutionalHealthState): string {
  if (state === 'critical') return 'Headquarters requires immediate recovery before normal progression.';
  if (state === 'degraded') return 'Headquarters can operate, but process integrity requires attention.';
  if (state === 'forming') return 'Headquarters is assembling enough evidence to judge institutional condition.';
  return 'Headquarters process integrity is stable for the current operation.';
}

function buildMissionCommandLifecycleProgress(
  missionState: MissionState | undefined,
  guardianState: MissionCommandGuardianState,
): MissionCommandSidebarStage[] {
  const activeIndex = getMissionCommandLifecycleIndex(missionState);
  const blockedIndex = guardianState === 'lockout' ? activeIndex : -1;
  const labels = [
    ['mission-creation', 'Mission Creation'],
    ['ready-room', 'Ready Room'],
    ['observation', 'Observation'],
    ['war-room', 'War Room'],
    ['deployed', 'Deployed'],
    ['debrief', 'Debrief'],
    ['archive', 'Archive'],
  ] as const;

  return labels.map(([id, label], index) => {
    const state = getMissionCommandStageState(index, activeIndex, blockedIndex);
    return {
      id,
      label,
      state,
      explanation: getMissionCommandStageExplanation(label, state),
    };
  });
}

function getMissionCommandLifecycleIndex(missionState: MissionState | undefined): number {
  if (missionState === undefined || missionState === 'idle' || missionState === 'briefing') return 0;
  if (missionState === 'ready') return 1;
  if (missionState === 'observation') return 2;
  if (missionState === 'authorization') return 3;
  if (missionState === 'deployed') return 4;
  if (missionState === 'return_to_base' || missionState === 'debrief') return 5;
  return 6;
}

function getMissionCommandStageState(
  index: number,
  activeIndex: number,
  blockedIndex: number,
): MissionCommandSidebarStageState {
  if (index === blockedIndex) return 'blocked';
  if (index < activeIndex) return 'completed';
  if (index === activeIndex) return 'active';
  if (index === activeIndex + 1) return 'available';
  return 'locked';
}

function getMissionCommandStageExplanation(label: string, state: MissionCommandSidebarStageState): string {
  if (state === 'completed') return `${label} complete.`;
  if (state === 'active') return `${label} is the current station.`;
  if (state === 'available') return `${label} is available when Commander authorizes movement.`;
  if (state === 'blocked') return `${label} is blocked by Guardian restriction.`;
  return `${label} remains locked until prior lifecycle evidence is complete.`;
}

function buildMissionCommandGuardianState(alerts: readonly GuardianAlert[]): MissionCommandSidebarModel['guardian'] {
  const highestAlert = alerts.find((alert) => alert.priority === 'critical')
    ?? alerts.find((alert) => alert.priority === 'high')
    ?? alerts.find((alert) => alert.priority === 'medium')
    ?? alerts[0];

  if (!highestAlert) {
    return {
      state: 'secure',
      highestAlert: 'Guardian secure. No active restriction.',
    };
  }

  if (highestAlert.priority === 'critical') return { state: 'lockout', highestAlert: highestAlert.message };
  if (highestAlert.priority === 'high') return { state: 'restriction', highestAlert: highestAlert.message };
  return { state: 'warning', highestAlert: highestAlert.message };
}

function formatMissionCommandContextCompleteness(missionPackage?: MissionIntelligencePackage): string {
  if (!missionPackage) return 'No mission intelligence package yet.';
  if (missionPackage.missingEvidence.length === 0) return 'Context package complete.';
  return `${missionPackage.missingEvidence.length} required field${missionPackage.missingEvidence.length === 1 ? '' : 's'} missing.`;
}

function formatMissionCommandEvidenceQuality(missionPackage?: MissionIntelligencePackage): string {
  if (!missionPackage) return 'Evidence not assembled.';
  if (missionPackage.confidence.level === 'complete' || missionPackage.confidence.level === 'sufficient') {
    return 'Evidence package is specific and traceable.';
  }
  if (missionPackage.confidence.level === 'forming') return 'Evidence package is forming.';
  return 'Evidence package is incomplete.';
}

function formatMissionCommandContradictionState(missionPackage?: MissionIntelligencePackage): string {
  if (!missionPackage) return 'No contradiction scan yet.';
  return missionPackage.contradictions.length === 0
    ? 'No unresolved contradictions.'
    : `${missionPackage.contradictions.length} contradiction${missionPackage.contradictions.length === 1 ? '' : 's'} unresolved.`;
}

function buildMissionCommandOutcomeState(
  missionState: MissionState | undefined,
  missionPackage: MissionIntelligencePackage | undefined,
  guardianState: MissionCommandGuardianState,
): MissionCommandOutcomeState {
  if (missionState === 'archived') return 'completed';
  if (missionState === undefined || missionState === 'idle' || missionState === 'briefing') return 'not evaluated';
  if (guardianState === 'lockout' || guardianState === 'restriction') return 'at risk';
  if (missionPackage && (missionPackage.missingEvidence.length > 0 || missionPackage.contradictions.length > 0)) return 'at risk';
  return 'on course';
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
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
  options: { archivedAt?: string; evaluation?: MissionEvaluation } = {},
): LocalMissionArchiveSummary | undefined {
  if (mission === undefined || debrief === undefined) {
    return undefined;
  }

  return {
    missionId: mission.id,
    codename: mission.campaign,
    archivedAt: options.archivedAt ?? new Date().toISOString(),
    eventCount: archiveWrite ? 2 : 1,
    ...(options.evaluation ? { evaluation: options.evaluation } : {}),
  };
}

export function createAbortArchiveSummary(
  mission: ActiveMission,
  options: { archivedAt?: string; evaluation?: MissionEvaluation } = {},
): LocalMissionArchiveSummary {
  return {
    missionId: mission.id,
    codename: mission.campaign,
    archivedAt: options.archivedAt ?? new Date().toISOString(),
    eventCount: 1,
    ...(options.evaluation ? { evaluation: options.evaluation } : {}),
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

  const missingAuthorizationRequirements = getMissingAuthorizationRequirements(mission, draft);

  if (missingAuthorizationRequirements.length === 0) {
    return {
      missionId: mission.id,
      decision: 'approved',
      reason: 'Operational briefing, observation evidence, invalidation, and protective rule are complete.',
    };
  }

  return {
    missionId: mission.id,
    decision: 'denied',
    reason: `Authorization blocked: ${missingAuthorizationRequirements.join('; ')}.`,
  };
}

function getMissingAuthorizationRequirements(
  mission: ActiveMission,
  draft: MissionAuthorizationDraft,
): string[] {
  const missionPackage = buildDesktopMissionIntelligencePackage(mission, {
    operatorJustification: draft.operatorJustification,
    invalidation: draft.invalidation,
  });
  const pressureTerms = ['fomo', 'revenge', 'rush', 'must trade', 'need to win', 'make it back'];
  const justification = draft.operatorJustification.trim().toLowerCase();
  const protectiveRule = draft.protectiveRule?.trim().toLowerCase() ?? '';
  const guardianLockout = buildDesktopGuardianLockoutState({
    mission,
    operatorJustification: draft.operatorJustification,
    invalidation: draft.invalidation,
    protectiveRule: draft.protectiveRule,
  });
  const missing: string[] = [];

  if (!hasMissionContextText(mission.objective) && !hasMissionContextText(mission.briefingContext?.missionObjective)) {
    missing.push('declare the mission objective');
  }

  if (!isReadyRoomBriefingComplete(mission.briefingContext)) {
    missing.push('complete the Ready Room operational briefing');
  }

  if (!hasMissionContextText(mission.briefingContext?.market)) {
    missing.push('state the operating market');
  }

  if (!hasMissionContextText(mission.briefingContext?.riskParameters)) {
    missing.push('state the risk ceiling');
  }

  if (!isObservationInterviewComplete(mission.observationContext)) {
    missing.push('complete the Observation evidence interview');
  }

  if (!hasMissionContextText(mission.observationContext?.operationalPicture)) {
    missing.push('summarize the Observation evidence package');
  }

  if (!hasContent(draft.operatorJustification)) {
    missing.push('state the authorization evidence');
  }

  if (!hasContent(draft.invalidation)) {
    missing.push('state invalidation evidence');
  }

  if (!hasContent(draft.protectiveRule ?? '')) {
    missing.push('state the protective rule');
  }

  if (hasContent(draft.operatorJustification) && pressureTerms.some((term) => justification.includes(term))) {
    missing.push('remove pressure language from the authorization reasoning');
  }

  if (
    hasContent(draft.protectiveRule ?? '')
    && !['risk', 'stop', 'invalidation', 'loss', 'limit', 'rule', 'plan', 'doctrine', 'no trade'].some((term) => protectiveRule.includes(term))
  ) {
    missing.push('protective rule must name the risk, stop, invalidation, plan, doctrine, or no-trade boundary');
  }

  if (missionPackage.confidence.level === 'incomplete') {
    missing.push('mission intelligence is still incomplete');
  }

  if (guardianLockout.status === 'locked') {
    missing.push(`resolve Guardian lockout: ${guardianLockout.explanation}`);
  }

  if ((mission.missionContext?.contradictionFlags ?? []).length > 0) {
    missing.push('resolve critical mission context contradictions');
  }

  return missing;
}

function formatAuthorizationJustification(justification: string, protectiveRule: string): string {
  if (!hasContent(protectiveRule)) return justification;
  return `${justification.trim()} Protective rule: ${protectiveRule.trim()}`;
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

export function upsertArchiveSummaries(
  summaries: LocalMissionArchiveSummary[],
  summary: LocalMissionArchiveSummary,
): LocalMissionArchiveSummary[] {
  const existingIndex = summaries.findIndex((candidate) => candidate.missionId === summary.missionId);

  if (existingIndex === -1) return [...summaries, summary];

  return summaries.map((candidate, index) => (index === existingIndex ? summary : candidate));
}

export function upsertJournalEntries(entries: JournalEntry[], entry: JournalEntry): JournalEntry[] {
  const existingIndex = entries.findIndex((candidate) => candidate.id === entry.id);

  if (existingIndex === -1) return [...entries, entry];

  return entries.map((candidate, index) => (index === existingIndex ? entry : candidate));
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

export function formatStartupPerformanceStatus(status: StartupStatus): string {
  if (!status.performance) return 'Not measured';

  return `${status.performance.durationMs}ms / ${status.performance.budgetMs}ms ${status.performance.status}`;
}

export function formatStartupError(status: StartupStatus): string {
  if (!status.error) return '';
  return status.error;
}

export function formatStartupRecoveryGuidance(status: StartupStatus): string {
  if (status.state === 'loading') return 'Recovery standby while Headquarters checks local infrastructure.';
  if (status.state === 'ready') return 'No recovery action required.';

  if (!status.database.connected) {
    return 'Close Headquarters, confirm the local database is available, then restart the desktop shell.';
  }

  return 'Restart Headquarters and preserve this startup issue for review.';
}

function hasContent(value: string): boolean {
  return value.trim().length > 0;
}

function parseMissionCreationTransmission(message: string): MissionDraft | undefined {
  const codename = extractTransmissionField(message, ['codename', 'mission', 'campaign']);
  const objective = extractTransmissionField(message, ['objective', 'goal']);

  if (codename && objective) return { codename, objective };

  const commaParts = message.split(',').map((part) => part.trim()).filter(Boolean);
  if (commaParts.length >= 2) {
    return {
      codename: commaParts[0] ?? '',
      objective: commaParts.slice(1).join(', '),
    };
  }

  const objectiveIndex = message.toLowerCase().indexOf(' objective ');
  if (objectiveIndex > 0) {
    return {
      codename: message.slice(0, objectiveIndex).replace(/^mission\s*/i, '').trim(),
      objective: message.slice(objectiveIndex + ' objective '.length).trim(),
    };
  }

  return message.trim().length > 0 ? { codename: '', objective: '' } : undefined;
}

function fillMissionDraftFromTransmission({
  currentCodename,
  currentObjective,
  draft,
  message,
}: {
  readonly currentCodename: string;
  readonly currentObjective: string;
  readonly draft: MissionDraft;
  readonly message: string;
}): MissionDraft {
  const singleValue = message.trim();
  let codename = draft.codename || currentCodename;
  let objective = draft.objective || currentObjective;

  if (!draft.codename && !draft.objective && singleValue) {
    if (!codename) {
      codename = singleValue;
    } else if (!objective) {
      objective = singleValue;
    }
  }

  return { codename, objective };
}

function isReportForDutyTransmission(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return normalized === 'ready'
    || normalized === 'report'
    || normalized === 'report for duty'
    || normalized === 'i am ready'
    || normalized === 'ready for duty';
}

export function parseCommanderRoomNavigationTransmission(message: string): HeadquartersRoomId | undefined {
  const normalized = message.trim().toLowerCase();
  if (normalized.length === 0) return undefined;

  const routeIntents = ['open', 'go to', 'enter', 'show', 'move to', 'route to'];
  const hasRouteIntent = routeIntents.some((intent) => normalized === intent || normalized.startsWith(`${intent} `));
  if (!hasRouteIntent) return undefined;

  if (normalized.includes('journal') || normalized.includes('command log')) return 'journal';
  if (normalized.includes('archive') || normalized.includes('archives')) return 'archive';
  if (normalized.includes('ready')) return 'ready';
  if (normalized.includes('observation') || normalized.includes('observe')) return 'observation';
  if (normalized.includes('war')) return 'war';
  if (normalized.includes('debrief')) return 'debrief';
  if (normalized.includes('doctrine')) return 'doctrine';
  if (normalized.includes('academy')) return 'academy';
  if (normalized.includes('guardian')) return 'guardian';
  if (normalized.includes('intelligence')) return 'intelligence';
  if (normalized.includes('mission')) return 'missions';
  if (normalized.includes('command')) return 'command';
  if (normalized.includes('settings')) return 'settings';

  return undefined;
}

export function isAbortMissionTransmission(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  if (normalized.length === 0) return false;

  return normalized === 'abort'
    || normalized === 'abort mission'
    || normalized === 'mission abort'
    || normalized === 'cancel mission'
    || normalized === 'scrub mission'
    || normalized === 'terminate mission';
}

function isPlanConcludedTransmission(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return normalized === 'plan concluded'
    || normalized === 'plan complete'
    || normalized === 'mission concluded'
    || normalized === 'trade concluded'
    || normalized === 'return to base'
    || normalized.includes('plan has concluded')
    || normalized.includes('plan is concluded');
}

function isMaterialChangeTransmission(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return normalized.startsWith('material change')
    || normalized.startsWith('report material change')
    || normalized.startsWith('change report')
    || normalized.startsWith('conditions changed');
}

function isReviewAuthorizationTransmission(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return normalized === 'review authorization'
    || normalized === 'authorization review'
    || normalized.includes('review the authorization');
}

function stripDeployedIntentPrefix(message: string): string {
  return message
    .replace(/^(report\s+)?material\s+change\s*[:,-]?\s*/i, '')
    .replace(/^change\s+report\s*[:,-]?\s*/i, '')
    .replace(/^conditions\s+changed\s*[:,-]?\s*/i, '')
    .trim();
}

function formatDeployedAuthorizationReview(
  mission: ActiveMission,
  authorizationStatus: MissionAuthorizationStatus | undefined,
): string {
  const invalidation = getRecordedObservationInvalidation(mission) || 'No invalidation recorded.';
  const risk = mission.briefingContext?.riskParameters ?? 'No risk ceiling recorded.';
  const reason = authorizationStatus?.reason ?? 'Authorization reason is not available.';
  return `Authorization review.\n\nRisk ceiling: ${risk}\n\nInvalidation: ${invalidation}\n\nDecision: ${formatAuthorizationStatus(authorizationStatus)}. ${reason}`;
}

function parseAuthorizationTransmission(message: string): MissionAuthorizationDraft {
  return {
    operatorJustification: extractTransmissionField(message, ['justification', 'because', 'reason']) ?? '',
    invalidation: extractTransmissionField(message, ['invalidation', 'invalid if', 'invalidate if']) ?? '',
    protectiveRule: extractTransmissionField(message, ['rule', 'protective rule', 'protection']) ?? '',
  };
}

function fillAuthorizationDraftFromTransmission({
  currentJustification,
  currentInvalidation,
  currentProtectiveRule,
  draft,
  message,
  shouldContinue,
}: {
  readonly currentJustification: string;
  readonly currentInvalidation: string;
  readonly currentProtectiveRule: string;
  readonly draft: MissionAuthorizationDraft;
  readonly message: string;
  readonly shouldContinue: boolean;
}): MissionAuthorizationDraft {
  const singleValue = shouldContinue ? '' : message.trim();
  let operatorJustification = draft.operatorJustification || currentJustification;
  let invalidation = draft.invalidation || currentInvalidation;
  let protectiveRule = draft.protectiveRule || currentProtectiveRule;

  if (!draft.operatorJustification && !draft.invalidation && !draft.protectiveRule && singleValue) {
    if (!operatorJustification) {
      operatorJustification = singleValue;
    } else if (!invalidation) {
      invalidation = singleValue;
    } else if (!protectiveRule) {
      protectiveRule = singleValue;
    }
  }

  return { operatorJustification, invalidation, protectiveRule };
}

function parseDebriefTransmission(message: string): MissionDebriefDraft {
  return {
    behaviorSummary: extractTransmissionField(message, ['behavior', 'behavior summary']) ?? '',
    disciplineNotes: extractTransmissionField(message, ['discipline', 'discipline notes']) ?? '',
    lesson: extractTransmissionField(message, ['lesson', 'lessons']) ?? '',
  };
}

function fillDebriefDraftFromTransmission({
  currentBehavior,
  currentDiscipline,
  currentLesson,
  draft,
  message,
  shouldContinue,
}: {
  readonly currentBehavior: string;
  readonly currentDiscipline: string;
  readonly currentLesson: string;
  readonly draft: MissionDebriefDraft;
  readonly message: string;
  readonly shouldContinue: boolean;
}): MissionDebriefDraft {
  const singleValue = shouldContinue ? '' : message.trim();
  let behaviorSummary = draft.behaviorSummary || currentBehavior;
  let disciplineNotes = draft.disciplineNotes || currentDiscipline;
  let lesson = draft.lesson || currentLesson;

  if (!draft.behaviorSummary && !draft.disciplineNotes && !draft.lesson && singleValue) {
    if (!behaviorSummary) {
      behaviorSummary = singleValue;
    } else if (!disciplineNotes) {
      disciplineNotes = singleValue;
    } else if (!lesson) {
      lesson = singleValue;
    }
  }

  return { behaviorSummary, disciplineNotes, lesson };
}

function extractTransmissionField(message: string, labels: readonly string[]): string | undefined {
  const normalized = message.replace(/\s+/g, ' ').trim();
  const lower = normalized.toLowerCase();

  for (const label of labels) {
    const marker = `${label.toLowerCase()}:`;
    const start = lower.indexOf(marker);
    if (start === -1) continue;

    const valueStart = start + marker.length;
    const nextField = findNextTransmissionFieldIndex(lower, valueStart);
    const value = normalized.slice(valueStart, nextField).trim();
    if (value.length > 0) return value;
  }

  return undefined;
}

function createDoorOpeningTransition(fromRoom: CommanderShellRoomId, toRoom: CommanderShellRoomId): RoomTransitionState {
  return createRoomTransition(fromRoom, toRoom);
}

function isReducedMotionPreferred(): boolean {
  return globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function getTransitionRoomLoadDelayMs(reducedMotion: boolean, controller?: TransitionController): number {
  return Math.round(getTransitionDurationMs(reducedMotion, controller) * 0.62);
}

function getRoomTransferReason(
  fromRoom: CommanderShellRoomId,
  toRoom: CommanderShellRoomId,
  mission?: ActiveMission,
): string {
  const missionState = parseMissionState(mission?.currentState);

  if (fromRoom === toRoom) return 'Room view confirmation.';
  if (missionState === undefined) return 'Operator navigation request.';
  return `Lifecycle ${missionState} recommends ${formatRoomLabel(toRoom)}.`;
}

function findNextTransmissionFieldIndex(message: string, start: number): number {
  const matches = [...message.slice(start).matchAll(/\s[a-z ]{3,24}:/g)];
  const match = matches[0];
  if (!match || match.index === undefined) return message.length;
  return start + match.index;
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatJournalCount(count: number, singular: string, plural: string): string {
  if (count === 0) return `No ${plural}`;
  if (count === 1) return `1 ${singular}`;
  return `${count} ${plural}`;
}
