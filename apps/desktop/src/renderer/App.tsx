import { type FormEvent, useEffect, useRef, useState } from 'react';
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
import {
  buildCommanderDashboard,
  buildCommanderDailyBriefing,
  buildCommanderMissionPlanning,
  buildCommanderMonthlyReview,
  buildCommanderObjectives,
  buildCommanderSessionDebrief,
  buildCommanderWeeklyReview,
} from '@headquarters/commander';
import { buildGuardianAlerts, evaluateGuardianLockout, type GuardianAlert, type GuardianLockoutState } from '@headquarters/guardian';
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
  buildMissionCompassSteps,
  createAuthorizationTransition,
  createRoomTransition,
  getTransitionDurationMs,
  mapCommanderRoomToNavigationTarget,
  parseMissionNavigationState,
  type TransitionController,
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
  type DeployedMissionCheckIn,
} from './MissionDeployedCheckIns';
import {
  buildDoctrineReviewSummary,
  formatDoctrineReviewAudit,
  recordDoctrineReviewDecision,
  type DoctrineReviewRecord,
} from './DoctrineReview';

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
      globalThis.window?.headquarters?.listJournalEntries?.(),
    ])
      .then(([missionResult, journalResult]) => {
        if (!active) return;

        if (missionResult) {
          const loadedMissions = missionResult.missions.map((mission) => mapMissionRecordToActiveMission(mission));
          setMissionHistory(loadedMissions);
          setActiveMission(getLatestActiveMission(loadedMissions));
          setArchivedMissionSummaries(buildArchivedMissionSummariesFromMissions(loadedMissions));
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

  const activeMissionState = parseMissionState(activeMission?.currentState);
  const navigationCommanderRoom = mapNavigationRoomToCommanderRoom(activeRoom);
  const currentCommanderRoom = activeMission
    ? recommendRoomForMissionState(activeMissionState)
    : navigationCommanderRoom;
  const guardianAlerts = buildDesktopGuardianAlerts();
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
  const recommendedNavigationTarget = mapCommanderRoomToNavigationTarget(commanderState.recommendedRoom) as HeadquartersRoomId;
  const missionCompassSteps = activeMission
    ? buildMissionCompassSteps(parseMissionNavigationState(activeMission.currentState), currentCommanderRoom)
    : undefined;
  const currentRoomView = activeMission ? recommendedNavigationTarget : activeRoom;

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
      setCommanderBehaviorSummary('');
      setCommanderDisciplineNotes('');
      setCommanderLesson('');
      setCommanderWorkflowNotice('Debrief saved. Archive is now the next Commander action.');
      startDoorTransferForMissionRoomChange(mission, result.mission);
      return;
    }

    if (currentState === 'debrief') {
      const archiveSummary = createLocalMissionArchiveSummary(mission, missionDebrief, undefined);
      const archivedMission = await archiveDesktopMission(mission);

      setArchiveSummary(archiveSummary);
      if (archiveSummary) setArchivedMissionSummaries((summaries) => [...summaries, archiveSummary]);
      setActiveMission(getActiveMissionAfterMissionChange(archivedMission));
      setMissionHistory((history) => upsertMissionHistory(history, archivedMission));
      setCommanderWorkflowNotice('Mission archived.');
      return;
    }

    const advancedMission = await advanceMissionFromCommanderContinue(mission);

    if (advancedMission) {
      setActiveMission(advancedMission);
      setMissionHistory((history) => upsertMissionHistory(history, advancedMission));
      setCommanderWorkflowNotice('');
      startDoorTransferForMissionRoomChange(mission, advancedMission);
    }
  }

  function handleSidebarNavigation(room: HeadquartersRoomId) {
    startDoorTransfer(room, { openRoomAfter: true });
  }

  function handleEnterCurrentRoom() {
    setActiveOperationsView('room');
  }

  function handleEnterCommanderChat() {
    if (roomTransferTimeoutRef.current !== undefined) {
      window.clearTimeout(roomTransferTimeoutRef.current);
      roomTransferTimeoutRef.current = undefined;
    }

    setRoomTransition(undefined);
    setActiveOperationsView('chat');
  }

  function startDoorTransfer(
    room: HeadquartersRoomId,
    options: { readonly openRoomAfter?: boolean; readonly fromRoom?: CommanderShellRoomId } = {},
  ) {
    if (roomTransition !== undefined) return;

    const fromRoom = options.fromRoom ?? currentCommanderRoom;
    const targetRoom = mapNavigationRoomToCommanderRoom(room);

    if (fromRoom === targetRoom && room === activeRoom) {
      if (options.openRoomAfter) setActiveOperationsView('room');
      return;
    }

    if (roomTransferTimeoutRef.current !== undefined) {
      window.clearTimeout(roomTransferTimeoutRef.current);
    }

    const transition = createDoorOpeningTransition(fromRoom, targetRoom);
    setRoomTransition(transition);

    roomTransferTimeoutRef.current = window.setTimeout(() => {
      setActiveRoom(room);
      if (options.openRoomAfter) setActiveOperationsView('room');
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
    options: { readonly fromRoom?: CommanderShellRoomId } = {},
  ) {
    const nextRoom = recommendRoomForMissionState(parseMissionState(mission.currentState));
    const transferOptions = options.fromRoom ? { fromRoom: options.fromRoom } : {};

    startDoorTransfer(mapCommanderRoomToNavigationTarget(nextRoom) as HeadquartersRoomId, {
      ...transferOptions,
    });
  }

  async function handleMissionCreated(mission: ActiveMission) {
    setActiveMission(mission);
    setMissionHistory((history) => upsertMissionHistory(history, mission));
    setArchiveWrite(createArchiveWritePlaceholder(mission));
    setAuthorizationStatus(undefined);
    setMissionDebrief(undefined);
    setArchiveSummary(undefined);
    setCommanderMissionCodename('');
    setCommanderMissionObjective('');
    setCommanderWorkflowNotice('');
    startDoorTransferToMissionRoom(mission, { fromRoom: 'command' });
  }

  async function handleAbortMission() {
    if (activeMission === undefined) return;

    const abortedMission = await abortDesktopMission(activeMission);
    const archiveSummary = createAbortArchiveSummary(abortedMission);
    setArchiveSummary(archiveSummary);
    setArchivedMissionSummaries((summaries) => upsertArchiveSummaries(summaries, archiveSummary));
    setActiveMission(getActiveMissionAfterMissionChange(abortedMission));
    setMissionHistory((history) => upsertMissionHistory(history, abortedMission));
    setMissionDebrief(undefined);
    setAuthorizationStatus(undefined);
    setCommanderWorkflowNotice('Mission aborted and closed. You can create a new mission when ready.');
    setActiveOperationsView('chat');
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
    setActiveMission(mission);
    setMissionHistory((history) => upsertMissionHistory(history, mission));
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
    setActiveMission(mission);
    setMissionHistory((history) => upsertMissionHistory(history, mission));
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

    setDeployedCheckIns((current) => [...current, checkIn]);
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
          return `Mission file opened: ${mission.campaign}. Briefing phase is active.`;
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
          return `Mission file opened: ${mission.campaign}. Briefing phase is active.`;
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
        setCommanderOperatorJustification('');
        setCommanderInvalidation('');
        setCommanderProtectiveRule('');
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
        setCommanderOperatorJustification('');
        setCommanderInvalidation('');
        setCommanderProtectiveRule('');
        setRoomTransition(createAuthorizationTransition('war-room'));
        return 'Authorization accepted. Execute only within the declared plan.';
      }

      return 'Authorization withheld. Return to Observation and complete the evidence package.';
    }

    if (currentCommanderRoom === 'war-room' && currentState === 'deployed') {
      if (shouldContinue) {
        await handleCommanderContinue();
        return 'Deployment closed. Return to Base is active; debrief before archive.';
      }

      return handleDeployedCheckIn(message);
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

    return 'Transmission attached to Commander log. Use Continue when the current step is ready.';
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
          <section className="operations-viewport" aria-label="Operations viewport" data-active-operations-view={activeOperationsView}>
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
                  compassSteps={missionCompassSteps}
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
                    missionDebrief={missionDebrief}
                    notice={commanderWorkflowNotice}
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

          <aside className="status-panel" aria-label="Status area" aria-live="polite">
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
              <div>
                <dt>Startup</dt>
                <dd>{formatStartupPerformanceStatus(startupStatus)}</dd>
              </div>
            </dl>
            {startupStatus.error ? <p className="status-error">{formatStartupError(startupStatus)}</p> : null}
            <p className="status-recovery">{formatStartupRecoveryGuidance(startupStatus)}</p>
          </aside>
        </main>
      </div>
    </div>
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
  missionDebrief,
  notice,
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
  reportState,
}: {
  readonly currentRoom: string;
  readonly activeMission?: ActiveMission | undefined;
  readonly missionIntelligencePackage?: MissionIntelligencePackage | undefined;
  readonly authorizationStatus?: MissionAuthorizationStatus | undefined;
  readonly deployedCheckIns: readonly DeployedMissionCheckIn[];
  readonly missionDebrief?: MissionDebrief | undefined;
  readonly notice: string;
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
    return <GuardianRoom />;
  }

  if (room === 'intelligence') {
    return <IntelligenceCenterRoom journalEntries={context.journalEntries} growthEvents={context.growthEvents} />;
  }

  if (room === 'archive') {
    return (
      <ArchiveRoom
        missionIntelligencePackage={context.missionIntelligencePackage}
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
        <details className="commander-briefing-archive">
          <summary>Briefing archive</summary>
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
  const nextAction = getMissionNextAction(activeMission);
  const recentMission = missionHistory.at(-1);
  const briefingItems = buildReadyRoomBriefingItems(activeMission, growthEvents);

  return (
    <GuidedRoom
      id="ready-room"
      identity="preparation"
      atmosphere="ready"
      title="Ready Room"
      useCase="Brief and prepare before observation."
      objective={activeMission?.objective ?? 'Create a mission before entering preparation.'}
      primaryAction={<strong>{nextAction.buttonLabel === 'Start Observation' ? 'Begin Observation' : nextAction.label}</strong>}
      workspace={(
        <div className="ready-briefing-layout" aria-label="Ready Room briefing">
          <section className="journal-panel">
            <p className="section-label">Briefing</p>
            <h3>{activeMission?.campaign ?? 'No mission file'}</h3>
            <p className="muted">{activeMission?.objective ?? 'Create a mission before briefing.'}</p>
            <dl>
              <dt>Authority</dt>
              <dd>{activeMission?.commandAuthority ?? 'Awaiting command authority'}</dd>
              <dt>State</dt>
              <dd>{formatMissionDetailState(activeMission)}</dd>
            </dl>
          </section>
          <section className="journal-panel">
            <p className="section-label">Readiness Checklist</p>
            <h3>{nextAction.label}</h3>
            <ol className="readiness-checklist">
              {briefingItems.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </section>
        </div>
      )}
      timeline={(
        <section className="journal-panel" aria-label="Daily orders card">
          <p className="section-label">Daily Orders</p>
          <h3>{activeMission?.campaign ?? 'No active orders'}</h3>
          <p className="muted">{activeMission?.objective ?? 'Create a mission before moving into observation.'}</p>
        </section>
      )}
      secondaryTools={(
        <>
          <section className="journal-panel" aria-label="Oath panel">
          <p className="section-label">Command Oath</p>
          <h3>Command Oath</h3>
          <p className="muted">{activeMission?.commandAuthority ?? 'Command authority is assigned when a mission exists.'}</p>
          </section>
          <section className="journal-panel" aria-label="Locker panel">
            <p className="section-label">Operator Locker</p>
            <h3>Operator Locker</h3>
            <dl>
              <dt>Missions Recorded</dt>
              <dd>{missionHistory.length}</dd>
              <dt>Last Mission</dt>
              <dd>{recentMission?.campaign ?? 'No prior mission'}</dd>
            </dl>
          </section>
        </>
      )}
    />
  );
}

function buildReadyRoomBriefingItems(
  activeMission: ActiveMission | undefined,
  growthEvents: readonly GrowthEvent[],
): string[] {
  return [
    activeMission ? `Objective acknowledged: ${activeMission.objective}` : 'Mission objective pending.',
    activeMission ? `Command authority: ${activeMission.commandAuthority}` : 'Command authority pending.',
    `Growth reminder: ${formatRecentGrowthHighlight(growthEvents)}`,
    'Observation rule: wait for evidence before authorization.',
  ];
}

export function ObservationRoom({
  activeMission,
  missionIntelligencePackage,
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
  const nextAction = getMissionNextAction(activeMission);

  return (
    <GuidedRoom
      id="observation-room"
      identity="silence"
      atmosphere="observation"
      title="Observation Room"
      useCase="Observe quietly and collect evidence."
      objective="Keep charts and notes central until observation is complete."
      primaryAction={<strong>{nextAction.label === 'Complete Observation' ? 'Complete Observation' : 'Observe'}</strong>}
      workspace={(
        <div className="observation-workspace" aria-label="Observation workspace">
          <section className="journal-panel" aria-label="Observation timer">
            <p className="section-label">Observation Timer</p>
            <h3>{currentState === 'observation' ? 'Observation Active' : 'Observation Standby'}</h3>
            <p className="muted">{formatTimelineViewerStatus(entries)}</p>
          </section>
          <section className="journal-panel observation-check-in" aria-label="Commander observation check-in">
            <p className="section-label">Commander Check-In</p>
            <h3>{currentState === 'observation' ? 'Discipline Is Holding' : 'Await Observation'}</h3>
            <p className="muted">Waiting is part of the work. Evidence comes first; authorization comes later.</p>
          </section>
          {missionIntelligencePackage ? (
            <MissionIntelligencePanel
              missionPackage={missionIntelligencePackage}
              mode="observation"
              title="Observation Intelligence"
            />
          ) : null}
        </div>
      )}
      timeline={<MissionTimelineViewerPanel
        activeMission={activeMission}
        authorizationStatus={authorizationStatus}
        missionDebrief={missionDebrief}
        archiveSummary={archiveSummary}
      />}
      secondaryTools={(
        <>
          <section className="journal-panel" aria-label="Compass indicator">
          <p className="section-label">Compass Indicator</p>
          <h3>{nextAction.label}</h3>
          <p className="muted">{nextAction.description}</p>
          </section>
          <section className="journal-panel" aria-label="Artificial horizon">
            <p className="section-label">Artificial Horizon</p>
            <h3>{currentState === 'observation' ? 'Level' : 'Calm'}</h3>
            <p className="muted">Operator stability is represented as a quiet status, not a trading signal.</p>
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

  return (
    <GuidedRoom
      id="war-room"
      identity="decision"
      atmosphere="war"
      title="War Room"
      useCase={authorizationDenied ? 'Repair missing authorization evidence.' : 'Decide from authorized evidence only.'}
      objective="Evaluate authorization without exposing unrelated workflows. Headquarters never places trades."
      primaryAction={<strong>{authorizationDenied ? authorizationStatus.reason : 'Evaluate Authorization'}</strong>}
      workspace={(
        <>
          <WarRoomContextSummary
            activeMission={activeMission}
            missionIntelligencePackage={missionIntelligencePackage}
            contradictions={contradictions}
          />
          <MissionAuthorizationPanel activeMission={activeMission} authorizationStatus={authorizationStatus} />
          {parseMissionState(activeMission?.currentState) === 'authorization' ? (
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
      timeline={(
        <section className="journal-panel" aria-label="War table projection">
            <p className="section-label">War Table Projection</p>
            <h3>{activeMission?.campaign ?? 'No active mission'}</h3>
            <p className="muted">{activeMission?.objective ?? 'Create and prepare a mission before authorization.'}</p>
          </section>
      )}
      secondaryTools={(
        <>
          <section className="journal-panel" aria-label="Guardian status panel">
            <p className="section-label">Guardian Status</p>
            <h3>{lockout.status === 'locked' ? 'Intervention Required' : 'Guardian Standing By'}</h3>
            <p className="muted">{formatJournalCount(alerts.length, 'Guardian alert', 'Guardian alerts')}</p>
          </section>
          <section className="journal-panel" aria-label="Ghost comparison panel">
            <p className="section-label">Ghost Comparison</p>
            <h3>{comparisonMission?.campaign ?? 'No comparison mission'}</h3>
            <p className="muted">Comparison remains read-only until replay and ghost workflows are approved.</p>
          </section>
        </>
      )}
    />
  );
}

function WarRoomContextSummary({
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
    <section className="journal-panel" aria-label="War Room mission context summary">
      <p className="section-label">Mission Context</p>
      <h3>{activeMission?.campaign ?? 'Mission context incomplete'}</h3>
      {missionIntelligencePackage ? (
        <MissionIntelligencePanel
          missionPackage={missionIntelligencePackage}
          mode="authorization"
          title="Mission Intelligence Summary"
        />
      ) : null}
      <dl>
        <dt>Mission Objective</dt>
        <dd>{formatMissionContextDisplay(missionContext?.briefing.missionObjective ?? activeMission?.objective)}</dd>
        <dt>Market Environment</dt>
        <dd>{formatMissionContextDisplay(missionContext?.briefing.marketEnvironment)}</dd>
        <dt>High-Impact News</dt>
        <dd>{formatMissionContextDisplay(missionContext?.briefing.highImpactNews)}</dd>
        <dt>Risk Limit</dt>
        <dd>{formatMissionContextDisplay(missionContext?.briefing.riskParameters)}</dd>
        <dt>Observation Summary</dt>
        <dd>{formatMissionContextDisplay(missionContext?.observation.operationalSummary)}</dd>
        <dt>Directional Hypothesis</dt>
        <dd>{formatMissionContextDisplay(missionContext?.observation.directionalHypothesis)}</dd>
        <dt>Invalidation Criteria</dt>
        <dd>{formatMissionContextDisplay(missionContext?.observation.invalidationEvidence)}</dd>
      </dl>
      {contradictions.length > 0 ? (
        <div aria-label="Commander contradiction challenges">
          <p className="section-label">Commander Challenge</p>
          <ul>
            {contradictions.map((contradiction) => (
              <li key={contradiction.id}>{contradiction.message}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="muted">No context contradictions detected.</p>
      )}
      <div aria-label="Commander authorization questions">
        <p>{missionIntelligencePackage
          ? buildAuthorizationIntelligenceQuestion(missionIntelligencePackage)
          : 'Is this authorization based on your plan or on pressure?'}</p>
        <p>Which rule protects this decision?</p>
      </div>
    </section>
  );
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
  const entries = buildDesktopMissionTimelineEntries({
    activeMission,
    authorizationStatus,
    missionDebrief,
    archiveSummary,
  });
  const contradictions = activeMission?.missionContext
    ? detectCommanderContradictions(activeMission.missionContext)
    : [];

  return (
    <GuidedRoom
      id="debrief-theater"
      identity="reflection"
      atmosphere="debrief"
      title="Debrief Theater"
      useCase="Debrief behavior before archive."
      objective="Capture behavior summary, discipline notes, and one lesson before closing the mission."
      primaryAction={<strong>{missionDebrief ? 'Archive Mission' : 'Complete Debrief'}</strong>}
      workspace={(
        <>
          <DebriefContextRecall
            activeMission={activeMission}
            missionIntelligencePackage={missionIntelligencePackage}
            contradictions={contradictions}
          />
          <section className="journal-panel" aria-label="Black box viewer">
            <p className="section-label">Black Box Viewer</p>
            <h3>Behavior Sequence</h3>
            <p className="muted">{formatTimelineViewerStatus(entries)}</p>
            <dl>
              <dt>Behavior Summary</dt>
              <dd>{missionDebrief?.behaviorSummary ?? 'Awaiting Commander debrief input'}</dd>
              <dt>Reflection</dt>
              <dd>{missionDebrief?.disciplineNotes ?? 'Discipline notes come second'}</dd>
              <dt>Lessons</dt>
              <dd>{missionDebrief?.lesson ?? 'Lesson comes before archive'}</dd>
            </dl>
          </section>
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
      secondaryTools={(
        <>
          <section className="journal-panel" aria-label="Decision report">
            <p className="section-label">Decision Report</p>
            <h3>{authorizationStatus?.decision === 'approved' ? 'Authorized' : 'Decision Pending'}</h3>
            <p className="muted">{formatAuthorizationStatus(authorizationStatus)}</p>
          </section>
          <DebriefPanel activeMission={activeMission} missionDebrief={missionDebrief} />
        </>
      )}
    />
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
  const recordedInvalidation = getRecordedObservationInvalidation(activeMission);

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
          {recordedInvalidation ? (
            <p className="muted">Observation invalidation recorded: {recordedInvalidation}</p>
          ) : (
            <label>
              <span>Invalidation</span>
              <input value={invalidation} onChange={(event) => setInvalidation(event.target.value)} />
            </label>
          )}
          <label>
            <span>Protective Rule</span>
            <input value={protectiveRule} onChange={(event) => setProtectiveRule(event.target.value)} />
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
    <div className="room-layout" data-room-id="journal-room" data-room-atmosphere="journal">
      <RoomAtmosphere variant="journal" />
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
    <div className="room-layout" data-room-id="guardian-room" data-room-atmosphere="guardian">
      <RoomAtmosphere variant="guardian" />
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
  missionIntelligencePackage,
  archivedMissionSummaries,
  archivedJournalEntries,
  doctrineRecords,
}: {
  missionIntelligencePackage?: MissionIntelligencePackage | undefined;
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
  const latestMissionSummary = archivedMissionSummaries[archivedMissionSummaries.length - 1];

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
  return (
    <div className="room-layout" data-room-id="doctrine-room" data-room-atmosphere="doctrine">
      <RoomAtmosphere variant="doctrine" />
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
    statement: activeSuggestion.title,
    sourceMissionOrJournal: activeSuggestion.evidenceRecordIds.join(', '),
    sourceExcerpt: activeSuggestion.rationale,
    behaviorEvidence: activeSuggestion.rationale,
    similarDoctrineExists: doctrineRecords.some((record) => record.title.toLowerCase() === activeSuggestion.title.toLowerCase()),
    conflictSummary: 'No direct conflict detected by deterministic review.',
    proposedScope: 'Operator-approved doctrine candidate',
    confidence: `${activeSuggestion.evidenceRecordIds.length} supporting evidence record${activeSuggestion.evidenceRecordIds.length === 1 ? '' : 's'}`,
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
      <h3>{summary.heading}</h3>
      <ul>
        {summary.lines.map((line) => <li key={line}>{line}</li>)}
      </ul>
      <p className="muted">{summary.question}</p>
      <label>
        <span>Review Note</span>
        <input value={revisionNote} onChange={(event) => setRevisionNote(event.target.value)} />
      </label>
      <div className="inline-actions">
        <button className="secondary-action" type="button" onClick={handleApprove}>Approve Doctrine</button>
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
      <AudioQASurface events={[]} />
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
    missionContext: createEmptyMissionContext(id, { createdAt }),
  };
}

export function mapMissionRecordToActiveMission(mission: Mission, previousMission?: ActiveMission): ActiveMission {
  return {
    id: mission.id,
    campaign: mission.codename,
    objective: mission.objective ?? 'Awaiting mission objective',
    condition: formatMissionStateForDisplay(mission.state),
    commandAuthority: 'Professional command',
    currentState: mission.state,
    createdAt: mission.createdAt,
    ...(previousMission?.briefingContext ? { briefingContext: previousMission.briefingContext } : {}),
    ...(previousMission?.observationContext ? { observationContext: previousMission.observationContext } : {}),
    missionContext: previousMission?.missionContext ?? createEmptyMissionContext(mission.id, { createdAt: mission.createdAt }),
  };
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
    guardianNotes: buildDesktopGuardianAlerts().map((alert) => alert.message),
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

  if (currentState === undefined) return 'Mission route standing by';
  return `Current station: ${getMissionLifecycleStation(currentState)}`;
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

export function createAbortArchiveSummary(
  mission: ActiveMission,
  options: { archivedAt?: string } = {},
): LocalMissionArchiveSummary {
  return {
    missionId: mission.id,
    codename: mission.campaign,
    archivedAt: options.archivedAt ?? new Date().toISOString(),
    eventCount: 1,
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

  if (hasContent(draft.operatorJustification) && hasContent(draft.invalidation) && hasContent(draft.protectiveRule ?? '')) {
    return {
      missionId: mission.id,
      decision: 'approved',
      reason: 'Manual authorization fields and protective rule are complete.',
    };
  }

  return {
    missionId: mission.id,
    decision: 'denied',
    reason: 'Manual authorization requires operator justification, invalidation, and protective rule.',
  };
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
