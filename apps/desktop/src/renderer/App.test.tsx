import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  App,
  AcademyRoom,
  ArchiveRoom,
  CommandCenter,
  CommandCenterPlaceholder,
  DebriefTheater,
  DoctrineRoom,
  GuardianRoom,
  IntelligenceCenterRoom,
  JournalRoom,
  ObservationRoom,
  ReadyRoom,
  WarRoom,
  type ActiveMission,
  type StartupStatus,
  buildDefaultTradingPlanDoctrineReferences,
  buildDesktopArchiveEventInspections,
  buildDesktopArchiveDashboard,
  buildDesktopArchiveRecords,
  buildDesktopArchiveSessionInspections,
  buildDesktopAcademyDashboard,
  buildDesktopDoctrineSuggestions,
  buildDesktopGuardianAlerts,
  buildGuardianRoomModel,
  buildDoctrineChamberModel,
  buildDesktopGuardianLockoutState,
  buildDesktopGrowthAnalysis,
  buildDesktopIntelligenceDashboard,
  buildDesktopIntelligenceEvidenceRecords,
  buildDesktopIntelligencePatterns,
  buildDesktopJournalClassifications,
  buildDesktopMissionIntelligencePackage,
  buildJournalCommanderIntelligence,
  buildCommanderRoomBriefing,
  buildObservationRoomIntelligenceModel,
  buildReadyRoomPreparationModel,
  buildDesktopRepeatedMistakes,
  buildDesktopRepeatedSuccesses,
  buildDebriefTheaterReflectionModel,
  createDesktopDoctrineCandidateFromDraft,
  buildDoctrineDiffPreview,
  buildMissionLifecycleSteps,
  buildMissionContextLookup,
  buildInstitutionalHealthModel,
  buildMissionCommandSidebarModel,
  buildOperationalConsequences,
  buildVisibleMissionLifecycleSteps,
  buildDesktopMissionTimelineEntries,
  advanceMissionFromCommanderContinue,
  abortDesktopMission,
  getActiveMissionAfterMissionChange,
  getCommanderContinueMode,
  createArchiveWritePlaceholder,
  createDesktopMission,
  createLocalDebrief,
  createLocalMissionArchiveSummary,
  createLocalMission,
  evaluateLocalMissionAuthorization,
  formatAcademyDashboardStatus,
  formatArchiveWriteStatus,
  formatArchiveSummaryStatus,
  formatArchiveViewerStatus,
  formatAuthorizationStatus,
  formatDatabaseStatus,
  formatDebriefStatus,
  formatDebriefMissionDuration,
  formatHqosStatus,
  formatJournalClassificationStatus,
  formatMigrationStatus,
  formatMissionHistoryStatus,
  formatMissionDetailState,
  formatMissionDetailValue,
  formatMissionClosingState,
  formatMissionLifecycleStepStatus,
  formatMissionLifecycleSummary,
  formatMissionTimelineTransition,
  formatRecentDoctrineHighlight,
  formatRecentGrowthHighlight,
  formatStartupError,
  formatStartupPerformanceStatus,
  formatStartupRecoveryGuidance,
  formatTimelineViewerStatus,
  getCommanderMessage,
  getJournalCommanderPrompt,
  getJournalWorkflowSteps,
  getMissionLifecycleStation,
  getMissionNextAction,
  getMissionNotificationSummary,
  getMissionPhaseWorkspaceDescription,
  getMissionPhaseWorkspaceTitle,
  getPrimaryNavigationItems,
  isAbortMissionTransmission,
  listArchivedMissionSummaries,
  listMissionHistory,
  mapMissionRecordToActiveMission,
  markLocalMissionArchived,
  markLocalMissionDebriefed,
  parseCommanderRoomNavigationTransmission,
  promoteDesktopDoctrineCandidate,
  reportForDuty,
  requestLocalReturnToBase,
  upsertMissionHistory,
  withBriefingMissionContext,
  withObservationMissionContext,
} from './App';

describe('Desktop shell', () => {
  it('keeps beta UI polish aligned with reduced motion and stable shell layout', () => {
    const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

    expect(styles).toContain('color-scheme: dark');
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(styles).toContain('overflow-wrap: anywhere');
    expect(styles).toContain('.nav-item:hover');
    expect(styles).toContain('.nav-item[data-nav-section="commander"]');
    expect(styles).toContain('.commander-atmosphere-deck');
    expect(styles).toContain('.commander-transmission-console');
    expect(styles).toContain('@keyframes commander-transmission-arrival');
    expect(styles).toContain('@keyframes commander-transmission-status');
    expect(styles).toContain('.commander-context-drawer');
    expect(styles).toContain('.room-context-drawer');
    expect(styles).toContain('.ambient-status-strip');
    expect(styles).toContain('@keyframes commander-message-arrival');
    expect(styles).toContain('.room-transition-layer::before');
    expect(styles).toContain('contain: layout paint');
    expect(styles).toContain('.operations-viewport > .room-transition-layer');
    expect(styles).toContain('min-height: min(820px, calc(100vh - 4rem))');
    expect(styles).toContain('.commander-chat-stage .commander-shell');
    expect(styles).toContain('min-height: min(760px, calc(100vh - 6rem))');
    expect(styles).toContain('.skip-link:focus-visible');
  });

  it('keeps transition rendering in the stable operations viewport while preparing destination room', () => {
    const source = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');

    expect(source).toContain('{roomTransition ? <RoomTransitionLayer transition={roomTransition} /> : null}');
    expect(source).toContain('Math.round(getTransitionDurationMs(reducedMotion, controller) * 0.62)');
    expect(source).not.toContain('* 0.46');
  });

  it('keeps Commander Chat and Current Room panels mounted while switching tabs', () => {
    const source = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');

    expect(source).toContain('data-operations-panel="chat"');
    expect(source).toContain('hidden={activeOperationsView !== \'chat\'}');
    expect(source).toContain('data-operations-panel="room"');
    expect(source).toContain('hidden={activeOperationsView !== \'room\'}');
    expect(source).toContain('renderHeadquartersRoom(currentRoomView, {');
  });

  it('exposes deployed mission presence and Report Change check-ins through Commander workflow', () => {
    const source = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');

    expect(source).toContain('deployedCheckIns');
    expect(source).toContain('aria-label="Active mission deployment"');
    expect(source).toContain('aria-label="Report deployed mission change"');
    expect(source).toContain('State only what changed.');
    expect(source).toContain('Return to Base is now the correct next action.');
    expect(source).toContain('canRecordDeployedCheckIn');
    expect(source).toContain('markDeployedPlanConcluded');
    expect(source).toContain('Timing State');
    expect(source).toContain('checkInGuidance');
  });

  it('hydrates persisted lifecycle timing for reload-safe deployed missions', () => {
    const contextByMissionId = buildMissionContextLookup([{
      missionId: 'mission-001',
      contextJson: JSON.stringify({
        missionId: 'mission-001',
        briefing: {},
        observation: {},
        commanderNotes: [],
        contradictionFlags: [],
        readiness: {
          briefingComplete: true,
          observationComplete: true,
          warRoomReady: true,
          debriefReady: false,
        },
        timing: {
          lifecycleStageEntries: [
            { stage: 'idle', enteredAt: '2026-07-10T09:00:00.000Z' },
            { stage: 'deployed', enteredAt: '2026-07-10T09:45:00.000Z' },
          ],
          operationalState: 'active',
          deployedAt: '2026-07-10T09:45:00.000Z',
        },
      }),
      createdAt: '2026-07-10T09:00:00.000Z',
      updatedAt: '2026-07-10T09:45:00.000Z',
    }]);
    const mission = mapMissionRecordToActiveMission({
      id: 'mission-001',
      codename: 'Reload Patrol',
      objective: 'Keep deployed timing stable.',
      state: 'deployed',
      createdAt: '2026-07-10T09:00:00.000Z',
      updatedAt: '2026-07-10T09:45:00.000Z',
    }, undefined, contextByMissionId.get('mission-001'));

    expect(mission.missionContext?.timing?.deployedAt).toBe('2026-07-10T09:45:00.000Z');
    expect(mission.missionContext?.timing?.lifecycleStageEntries).toHaveLength(2);
  });

  it('exposes Doctrine candidate review decisions through the Doctrine room', () => {
    const source = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');

    expect(source).toContain('aria-label="Doctrine candidate review"');
    expect(source).toContain('Promote Doctrine');
    expect(source).toContain('Reject Candidate');
    expect(source).toContain('Return for Revision');
    expect(source).toContain('recordDoctrineReviewDecision');
    expect(source).toContain('formatDoctrineReviewAudit');
  });

  it('shows mission persistence and recovery status in Commander workflow', () => {
    const source = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');

    expect(source).toContain('aria-label="Mission persistence status"');
    expect(source).toContain('markMissionSavePending');
    expect(source).toContain('markMissionSaveSucceeded');
    expect(source).toContain('recoverIncompleteMissionStatus');
    expect(source).toContain('Resume Mission');
    expect(source).toContain('Review Mission');
  });

  it('routes Commander dead ends through deterministic recovery guidance', () => {
    const source = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');

    expect(source).toContain('buildCommanderDeadEndRecovery');
    expect(source).not.toContain('Transmission attached to Commander log. Use Continue when the current step is ready.');
  });

  it('shows Commander learning visibility inside the Commander workflow', () => {
    const source = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');

    expect(source).toContain('buildCommanderLearningVisibility');
    expect(source).toContain('aria-label="Commander learning visibility"');
    expect(source).toContain('Coaching focus:');
  });

  it('surfaces Guardian alerts inside Commander chat', () => {
    const source = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');

    expect(source).toContain('buildCommanderGuardianAlertLines');
    expect(source).toContain('aria-label="Guardian alerts below Commander chat"');
    expect(source).toContain('data-chat-role="guardian"');
    expect(source).toContain('formatCommanderGuardianStatus');
  });

  it('renders the security checkpoint startup surface', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('Headquarters');
    expect(html).toContain('Security Checkpoint');
    expect(html).toContain('Commander Chat');
    expect(html).toContain('class="commander-chat-stage"');
    expect(html).toContain('data-active-room-atmosphere="command"');
    expect(html).toContain('Current Room');
    expect(html).toContain('Report for Duty');
    expect(html).toContain('Status');
    expect(html).toContain('Mission Command');
    expect(html).toContain('Database');
    expect(html).toContain('Startup');
    expect(html).toContain('Recovery standby while Headquarters checks local infrastructure.');
  });

  it('renders mission command sidebar before technical diagnostics', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('aria-label="Live mission command sidebar"');
    expect(html).toContain('Mission Command');
    expect(html).toContain('Lifecycle Progress');
    expect(html).toContain('Mission Creation');
    expect(html).toContain('Current Station');
    expect(html).toContain('Next Action');
    expect(html).toContain('Intelligence');
    expect(html).toContain('Guardian / Doctrine');
    expect(html).toContain('Institutional Health');
    expect(html).toContain('Operational Consequences');
    expect(html).toContain('Outcome State');
    expect(html).toContain('Technical diagnostics');
    expect(html).toContain('Database');
  });

  it('builds live mission command sidebar state from lifecycle, intelligence, and Guardian evidence', () => {
    const mission: ActiveMission = {
      id: 'mission-sidebar-001',
      campaign: 'London Discipline',
      objective: 'Wait for clean authorization',
      condition: 'Observation',
      commandAuthority: 'Professional command',
      currentState: 'observation',
      createdAt: '2026-07-04T10:00:00.000Z',
    };
    const missionIntelligence = buildDesktopMissionIntelligencePackage(mission);
    const model = buildMissionCommandSidebarModel({
      mission,
      currentRoom: 'observation',
      selectedView: 'chat',
      nextAction: getMissionNextAction(mission),
      missionIntelligence,
      guardianAlerts: [],
      doctrineCandidateCount: 0,
      protectiveRule: '',
    });

    expect(model.missionIdentity.codename).toBe('London Discipline');
    expect(model.currentStation).toMatchObject({
      room: 'Observation Room',
      lifecycleStage: 'Observation',
      selectedView: 'Commander Chat',
    });
    expect(model.lifecycleProgress.map((stage) => [stage.id, stage.state])).toEqual([
      ['mission-creation', 'completed'],
      ['ready-room', 'completed'],
      ['observation', 'active'],
      ['war-room', 'available'],
      ['deployed', 'locked'],
      ['debrief', 'locked'],
      ['archive', 'locked'],
    ]);
    expect(model.guardian.state).toBe('secure');
    expect(model.nextAction.label).toBe('Complete Observation');
    expect(model.intelligence.missingRequiredFieldCount).toBe(missionIntelligence.missingEvidence.length);
    expect(model.institutionalHealth.dimensions).toHaveLength(8);
    expect(model.institutionalHealth.dimensions.map((dimension) => dimension.label)).toContain('Mission Integrity');
  });

  it('lets Guardian lockout override the mission command sidebar next action', () => {
    const mission: ActiveMission = {
      id: 'mission-sidebar-002',
      campaign: 'Risk Boundary',
      objective: 'Respect daily loss limit',
      condition: 'Authorization',
      commandAuthority: 'Professional command',
      currentState: 'authorization',
      createdAt: '2026-07-04T10:00:00.000Z',
    };
    const model = buildMissionCommandSidebarModel({
      mission,
      currentRoom: 'war-room',
      selectedView: 'room',
      nextAction: getMissionNextAction(mission),
      guardianAlerts: [{
        id: 'guardian-alert-lockout',
        title: 'Daily limit lockout',
        message: 'Trading authorization suspended until recovery conditions are met.',
        priority: 'critical',
        sourceId: 'daily-limit',
      }],
      doctrineCandidateCount: 2,
      protectiveRule: 'No authorization without invalidation.',
    });

    expect(model.guardian.state).toBe('lockout');
    expect(model.nextAction).toMatchObject({
      label: 'Resolve Guardian lockout',
      blocked: true,
      explanation: 'Trading authorization suspended until recovery conditions are met.',
    });
    expect(model.lifecycleProgress.find((stage) => stage.state === 'blocked')?.id).toBe('war-room');
    expect(model.doctrine.pendingCandidateCount).toBe(2);
    expect(model.outcomeState).toBe('at risk');
    expect(model.institutionalHealth.overallState).toBe('critical');
    expect(model.institutionalHealth.summary).toContain('immediate recovery');
    expect(model.consequences.find((consequence) => consequence.id === 'guardian-lockout')).toMatchObject({
      category: 'guardian',
      severity: 'lockout',
      recoveryCondition: 'Resolve or acknowledge the Guardian condition before requesting further authorization.',
    });
  });

  it('derives transparent institutional health without profit or prediction inputs', () => {
    const archivedMission: ActiveMission = {
      id: 'mission-health-001',
      campaign: 'Process First',
      objective: 'Execute only if evidence forms',
      condition: 'Archived',
      commandAuthority: 'Professional command',
      currentState: 'archived',
      createdAt: '2026-07-04T10:00:00.000Z',
      missionContext: {
        missionId: 'mission-health-001',
        briefing: {
          missionObjective: 'Execute only if evidence forms',
          market: 'ES',
          marketEnvironment: 'range',
          highImpactNews: 'none',
          personalReadiness: 'focused',
          riskParameters: '1%',
          successCriteria: 'no trade unless plan appears',
        },
        observation: {
          observedDirection: 'sideways',
          marketStructure: 'range',
          volume: 'normal',
          liquidityNotes: 'resting above range high',
          keyLevels: '5520 and 5500',
          directionalHypothesis: 'wait for range break',
          invalidationEvidence: 'failed acceptance above range',
          operationalSummary: 'range remains intact',
        },
        commanderNotes: [],
        contradictionFlags: [],
        readiness: {
          briefingComplete: true,
          observationComplete: true,
          warRoomReady: true,
          debriefReady: true,
        },
      },
    };
    const missionIntelligence = buildDesktopMissionIntelligencePackage(archivedMission, {
      behaviorSummary: 'Waited until evidence appeared.',
      disciplineNotes: 'Risk boundary held.',
      lesson: 'No trade was acceptable.',
    });
    const health = buildInstitutionalHealthModel({
      missionState: 'archived',
      missionIntelligence,
      guardian: {
        state: 'secure',
        highestAlert: 'Guardian secure. No active restriction.',
      },
      doctrine: {
        activeProtectiveRule: 'No authorization without invalidation.',
        pendingCandidateCount: 0,
        relevance: 'Protective rule was available for this operation.',
      },
      startupStatus: {
        state: 'ready',
        database: { connected: true },
        migrations: { applied: [], skipped: ['001-initial'] },
      },
      nextAction: {
        label: 'Mission Archived',
        description: 'This mission lifecycle is complete.',
        buttonLabel: 'Archived',
        disabled: true,
      },
    });

    expect(health.overallState).toBe('degraded');
    expect(health.dimensions.find((dimension) => dimension.id === 'evidence-quality')?.state).toBe('stable');
    expect(health.dimensions.find((dimension) => dimension.id === 'academy-progress')?.state).toBe('stable');
    expect(JSON.stringify(health)).not.toMatch(/profit|loss|pnl/i);
  });

  it('marks institutional health degraded when mission evidence is missing', () => {
    const mission: ActiveMission = {
      id: 'mission-health-002',
      campaign: 'Thin Context',
      objective: 'Observe first',
      condition: 'Observation',
      commandAuthority: 'Professional command',
      currentState: 'observation',
      createdAt: '2026-07-04T10:00:00.000Z',
    };
    const missionIntelligence = buildDesktopMissionIntelligencePackage(mission);
    const model = buildMissionCommandSidebarModel({
      mission,
      currentRoom: 'observation',
      selectedView: 'chat',
      nextAction: getMissionNextAction(mission),
      missionIntelligence,
      guardianAlerts: [],
      doctrineCandidateCount: 0,
      protectiveRule: '',
      startupStatus: {
        state: 'ready',
        database: { connected: true },
        migrations: { applied: [], skipped: ['001-initial'] },
      },
    });

    expect(model.institutionalHealth.overallState).toBe('degraded');
    expect(model.institutionalHealth.dimensions.find((dimension) => dimension.id === 'mission-integrity')).toMatchObject({
      state: 'degraded',
      explanation: 'Required mission evidence is not complete.',
    });
    expect(model.consequences.find((consequence) => consequence.id === 'intelligence-missing-evidence')).toMatchObject({
      category: 'intelligence',
      severity: 'caution',
      recoveryCondition: 'Answer the missing Commander questions or revise the mission context.',
    });
  });

  it('builds deterministic operational consequences with explicit recovery paths', () => {
    const mission: ActiveMission = {
      id: 'mission-consequence-001',
      campaign: 'Rule Boundary',
      objective: 'Authorization requires evidence',
      condition: 'Authorization',
      commandAuthority: 'Professional command',
      currentState: 'authorization',
      createdAt: '2026-07-04T10:00:00.000Z',
    };
    const missionIntelligence = buildDesktopMissionIntelligencePackage(mission);
    const consequences = buildOperationalConsequences({
      missionState: 'authorization',
      missionIntelligence,
      guardian: {
        state: 'warning',
        highestAlert: 'Risk state is monitored from approved inputs only.',
      },
      doctrine: {
        activeProtectiveRule: 'No protective rule declared for current authorization.',
        pendingCandidateCount: 1,
        relevance: 'Doctrine review is available for this operation.',
      },
      nextAction: getMissionNextAction(mission),
    });

    expect(consequences.map((consequence) => consequence.id)).toEqual([
      'guardian-warning',
      'intelligence-missing-evidence',
      'doctrine-protective-rule-missing',
      'doctrine-candidate-pending',
    ]);
    expect(consequences.every((consequence) => consequence.recoveryCondition.length > 0)).toBe(true);
    expect(JSON.stringify(consequences)).not.toMatch(/profit|loss|pnl/i);
  });

  it('records archived growth evidence as a historical consequence without duplicating ids', () => {
    const missionIntelligence = buildDesktopMissionIntelligencePackage({
      id: 'mission-consequence-002',
      campaign: 'Review Discipline',
      objective: 'Close with evidence',
      condition: 'Archived',
      commandAuthority: 'Professional command',
      currentState: 'archived',
      createdAt: '2026-07-04T10:00:00.000Z',
    }, {
      behaviorSummary: 'Waited for confirmation.',
      disciplineNotes: 'No risk boundary breach.',
      lesson: 'Patience prevented forced entry.',
    });
    const consequences = buildOperationalConsequences({
      missionState: 'archived',
      missionIntelligence,
      guardian: {
        state: 'secure',
        highestAlert: 'Guardian secure. No active restriction.',
      },
      doctrine: {
        activeProtectiveRule: 'No authorization without invalidation.',
        pendingCandidateCount: 0,
        relevance: 'No current doctrine review is blocking mission flow.',
      },
    });

    expect(consequences.find((consequence) => consequence.id === 'academy-growth-evidence-ready')).toMatchObject({
      category: 'academy',
      severity: 'notice',
      duration: 'historical',
      recoveryCondition: 'No recovery required. Preserve the evidence in the archive.',
    });
    expect(new Set(consequences.map((consequence) => consequence.id)).size).toBe(consequences.length);
  });

  it('renders Sprint 16 atmosphere surfaces around Commander guidance', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('Commander instruments');
    expect(html).toContain('Command Chair');
    expect(html).toContain('Situation Board');
    expect(html).toContain('Operational awareness');
    expect(html).toContain('Operational mindset');
    expect(html).toContain('Ambient Headquarters status');
    expect(html).toContain('Living Headquarters OS');
    expect(html).toContain('HQ broadcast feed');
    expect(html).toContain('Command Chair operating console');
    expect(html).toContain('Live operational timeline');
    expect(html).toContain('Headquarters services');
    expect(html).toContain('HQOS:');
  });

  it('keeps Commander chat as the main operating place with room output optional', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('Commander transmission channel');
    expect(html).toContain('Lifecycle: Security Checkpoint');
    expect(html).toContain('Report for Duty');
    expect(html).not.toContain('Commander mission creation controls');
  });

  it('renders beta accessibility landmarks and live status semantics', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('href="#main-content"');
    expect(html).toContain('id="main-content"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-label="Open Commander"');
    expect(html).toContain('aria-label="Open Ready Room"');
  });

  it('renders a lightweight primary navigation framework with command active', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('aria-label="Primary"');
    expect(html).toContain('data-recommended="true"');
    expect(html).toContain('data-nav-id="command"');
    expect(html).toContain('data-nav-section="commander"');
    expect(html).toContain('data-nav-section="mission"');
    expect(html).toContain('data-nav-section="support"');
    expect(html).toContain('data-nav-id="missions"');
    expect(html).toContain('data-nav-id="ready"');
    expect(html).toContain('data-nav-id="observation"');
    expect(html).toContain('data-nav-id="war"');
    expect(html).toContain('data-nav-id="debrief"');
    expect(html).toContain('data-nav-id="journal"');
    expect(html).toContain('data-nav-id="academy"');
    expect(html).toContain('data-nav-id="doctrine"');
    expect(html).toContain('data-nav-id="guardian"');
    expect(html).toContain('data-nav-id="intelligence"');
    expect(html).toContain('data-nav-id="archive"');
    expect(html).toContain('data-nav-id="settings"');
    expect(html).toContain('aria-current="page"');
  });

  it('renders mission room identity markers for the navigation experience', () => {
    const mission: ActiveMission = {
      id: 'mission-001',
      campaign: 'Foundation Patrol',
      objective: 'Hold discipline',
      condition: 'Briefing',
      commandAuthority: 'Professional command',
      currentState: 'briefing',
      createdAt: '2026-07-02T00:00:00.000Z',
    };

    expect(renderToStaticMarkup(<ReadyRoom activeMission={mission} missionHistory={[mission]} growthEvents={[]} />)).toContain('data-room-identity="preparation"');
    expect(renderToStaticMarkup(<ObservationRoom activeMission={mission} />)).toContain('data-room-identity="silence"');
    expect(renderToStaticMarkup(<WarRoom activeMission={mission} missionHistory={[mission]} />)).toContain('data-room-identity="decision"');
    expect(renderToStaticMarkup(<DebriefTheater activeMission={mission} />)).toContain('data-room-identity="reflection"');
    expect(renderToStaticMarkup(<ArchiveRoom archivedMissionSummaries={[]} missionHistory={[]} archivedJournalEntries={[]} doctrineRecords={[]} />)).toContain('data-room-identity="historical"');
  });

  it('renders Sprint 17 guided room structure for mission path rooms', () => {
    const mission: ActiveMission = {
      id: 'mission-001',
      campaign: 'Foundation Patrol',
      objective: 'Hold discipline',
      condition: 'Ready',
      commandAuthority: 'Professional command',
      currentState: 'ready',
      createdAt: '2026-07-02T00:00:00.000Z',
    };

    const readyHtml = renderToStaticMarkup(<ReadyRoom activeMission={mission} missionHistory={[mission]} growthEvents={[]} />);
    const observationHtml = renderToStaticMarkup(<ObservationRoom activeMission={{ ...mission, currentState: 'observation' }} />);
    const warHtml = renderToStaticMarkup(<WarRoom activeMission={{ ...mission, currentState: 'authorization' }} missionHistory={[mission]} />);
    const debriefHtml = renderToStaticMarkup(<DebriefTheater activeMission={{ ...mission, currentState: 'return_to_base' }} />);

    expect(readyHtml).toContain('class="guided-room room-layout"');
    expect(readyHtml).toContain('operational mindset');
    expect(readyHtml).toContain('Plan calmly before Headquarters commits resources.');
    expect(readyHtml).toContain('Begin Operational Briefing');
    expect(observationHtml).toContain('Observe quietly and collect evidence.');
    expect(observationHtml).toContain('Report only visible evidence. Prediction stays silent.');
    expect(observationHtml).not.toContain('Evaluate Authorization');
    expect(warHtml).toContain('Request Authorization');
    expect(warHtml).toContain('Mission next action');
    expect(debriefHtml).toContain('Mission Recap');
    expect(debriefHtml).toContain('Plan vs Reality');
    expect(debriefHtml).toContain('Mission next action');
  });

  it('renders Ready Room as a mission preparation room instead of a static dashboard', () => {
    const mission: ActiveMission = {
      id: 'mission-ready-001',
      campaign: 'Weekend Test',
      objective: 'Avoid FOMO entries',
      condition: 'Briefing',
      commandAuthority: 'Professional command',
      currentState: 'briefing',
      createdAt: '2026-07-02T00:00:00.000Z',
    };

    const html = renderToStaticMarkup(<ReadyRoom activeMission={mission} missionHistory={[mission]} growthEvents={[]} />);

    expect(html).toContain('Begin Operational Briefing');
    expect(html).toContain('Preparation status: Not started');
    expect(html).toContain('Mission File');
    expect(html).toContain('Codename');
    expect(html).toContain('Weekend Test');
    expect(html).toContain('Objective');
    expect(html).toContain('Avoid FOMO entries');
    expect(html).toContain('Market');
    expect(html).toContain('Not available');
    expect(html).toContain('Preparation Sequence');
    expect(html).toContain('Mission Record');
    expect(html).toContain('Preparation Context');
    expect(html).not.toContain('Growth reminder');
    expect(html).not.toContain('Daily Orders');
  });

  it('links Ready Room preparation progress to captured Commander briefing data', () => {
    const mission = withBriefingMissionContext({
      id: 'mission-ready-002',
      campaign: 'London Open',
      objective: 'Wait for clean continuation',
      condition: 'Briefing',
      commandAuthority: 'Professional command',
      currentState: 'briefing',
      createdAt: '2026-07-02T00:00:00.000Z',
    }, {
      missionObjective: 'Wait for clean continuation',
      market: 'NQ',
      marketEnvironment: 'Range',
      highImpactNews: 'CPI later',
    });

    const model = buildReadyRoomPreparationModel(mission);
    const html = renderToStaticMarkup(<ReadyRoom activeMission={mission} missionHistory={[mission]} growthEvents={[]} />);

    expect(model.completedCount).toBe(4);
    expect(model.currentItem.title).toBe('Operator Condition');
    expect(html).toContain('4 of 7 briefing items complete');
    expect(html).toContain('Operator Condition');
    expect(html).toContain('Awaiting operator response in Commander Chat.');
    expect(html).toContain('Return to Commander Briefing');
    expect(html).toContain('CPI later');
  });

  it('shows Observation clearance after the Ready Room briefing is complete', () => {
    const mission = withBriefingMissionContext({
      id: 'mission-ready-003',
      campaign: 'New York Session',
      objective: 'Trade only confirmed evidence',
      condition: 'Ready',
      commandAuthority: 'Professional command',
      currentState: 'ready',
      createdAt: '2026-07-02T00:00:00.000Z',
    }, {
      missionObjective: 'Trade only confirmed evidence',
      market: 'BTC',
      marketEnvironment: 'Trending',
      highImpactNews: 'None',
      personalReadiness: 'focused',
      riskParameters: '1%',
      successCriteria: 'Follow plan without forcing execution',
    });

    const html = renderToStaticMarkup(<ReadyRoom activeMission={mission} missionHistory={[mission]} growthEvents={[]} />);

    expect(html).toContain('Preparation status: Complete');
    expect(html).toContain('7 of 7 briefing items complete');
    expect(html).toContain('Observation Clearance');
    expect(html).toContain('Enter Observation Room');
    expect(html).toContain('Observation clearance available');
  });

  it('surfaces Sprint 24 mission intelligence in War Room, Debrief, and Archive without changing lifecycle state', () => {
    const mission: ActiveMission = withObservationMissionContext(withBriefingMissionContext({
      id: 'mission-024',
      campaign: 'Intelligence Patrol',
      objective: 'Trade only if evidence confirms continuation',
      condition: 'Authorization',
      commandAuthority: 'Professional command',
      currentState: 'authorization',
      createdAt: '2026-07-02T00:00:00.000Z',
    }, {
      missionObjective: 'Trade only if evidence confirms continuation',
      market: 'NQ',
      marketEnvironment: 'Trending',
      highImpactNews: 'None',
      personalReadiness: 'focused',
      riskParameters: '1%',
      successCriteria: 'Follow the plan without forcing execution',
    }), {
      marketDirection: 'up',
      marketStructure: 'higher highs',
      volume: 'steady',
      liquidity: 'above prior high',
      keyLevels: '18200',
      bias: 'long continuation',
      invalidationEvidence: 'break below 18140',
      emotionalCheck: 'calm',
      readiness: 'yes',
      operationalPicture: 'Trend and risk are aligned.',
    });
    const missionPackage = buildDesktopMissionIntelligencePackage(mission, {
      authorizationStatus: {
        missionId: mission.id,
        decision: 'approved',
        reason: 'Evidence sufficient',
      },
      missionDebrief: {
        id: 'debrief-024',
        missionId: mission.id,
        behaviorSummary: 'Followed the plan.',
        disciplineNotes: 'Respected invalidation.',
        lesson: 'Let evidence lead.',
        createdAt: '2026-07-02T00:10:00.000Z',
      },
    });

    const warHtml = renderToStaticMarkup(<WarRoom
      activeMission={mission}
      missionIntelligencePackage={missionPackage}
      missionHistory={[mission]}
    />);
    const debriefHtml = renderToStaticMarkup(<DebriefTheater
      activeMission={{ ...mission, currentState: 'return_to_base' }}
      missionIntelligencePackage={missionPackage}
    />);
    const archiveHtml = renderToStaticMarkup(<ArchiveRoom
      missionIntelligencePackage={missionPackage}
      archivedMissionSummaries={[]}
      missionHistory={[]}
      archivedJournalEntries={[]}
      doctrineRecords={[]}
    />);

    expect(mission.currentState).toBe('authorization');
    expect(warHtml).toContain('Mission Brief');
    expect(warHtml).toContain('Evidence Board');
    expect(warHtml).toContain('Evidence is aligning. Why does this setup deserve capital?');
    expect(debriefHtml).toContain('Debrief Intelligence Comparison');
    expect(debriefHtml).toContain('Original plan: Trade only if evidence confirms continuation');
    expect(archiveHtml).toContain('Preserved Mission Intelligence');
    expect(archiveHtml).toContain('Intelligence package contains the required briefing and observation evidence.');
  });

  it('renders Archive as a chronological guided dossier instead of a dashboard surface', () => {
    const html = renderToStaticMarkup(<ArchiveRoom
      archivedMissionSummaries={[{
        missionId: 'mission-001',
        codename: 'Foundation Patrol',
        archivedAt: '2026-07-02T00:10:00.000Z',
        eventCount: 2,
      }]}
      missionHistory={[]}
      archivedJournalEntries={[]}
      doctrineRecords={[]}
    />);

    expect(html).toContain('Read records chronologically without editing the past.');
    expect(html).toContain('Foundation Patrol preserved as institutional memory.');
    expect(html).toContain('Timeline / History');
    expect(html).toContain('Mission Archive Viewer');
    expect(html).toContain('Mission Dossier');
    expect(html).toContain('Archive dossier is read-only historical intelligence.');
  });

  it('renders restrained atmosphere tokens for major rooms', () => {
    const mission: ActiveMission = {
      id: 'mission-001',
      campaign: 'Foundation Patrol',
      objective: 'Hold discipline',
      condition: 'Briefing',
      commandAuthority: 'Professional command',
      currentState: 'briefing',
      createdAt: '2026-07-02T00:00:00.000Z',
    };

    expect(renderToStaticMarkup(<CommandCenter activeMission={mission} />)).toContain('data-room-atmosphere="command"');
    expect(renderToStaticMarkup(<ReadyRoom activeMission={mission} missionHistory={[mission]} growthEvents={[]} />)).toContain('data-room-atmosphere="ready"');
    expect(renderToStaticMarkup(<ObservationRoom activeMission={mission} />)).toContain('data-room-atmosphere="observation"');
    expect(renderToStaticMarkup(<WarRoom activeMission={mission} missionHistory={[mission]} />)).toContain('data-room-atmosphere="war"');
    expect(renderToStaticMarkup(<DebriefTheater activeMission={mission} />)).toContain('data-room-atmosphere="debrief"');
    expect(renderToStaticMarkup(<ArchiveRoom archivedMissionSummaries={[]} missionHistory={[]} archivedJournalEntries={[]} doctrineRecords={[]} />)).toContain('data-room-atmosphere="archive"');
    expect(renderToStaticMarkup(<JournalRoom
      journalEntries={[]}
      dailyReflections={[]}
      tradeReviews={[]}
      growthEvents={[]}
      archivedJournalEntries={[]}
      onCreateJournalEntry={() => undefined}
      onCreateDailyReflection={() => undefined}
      onCreateTradeReview={() => undefined}
      onCreateGrowthEvent={() => undefined}
      onArchiveJournalEntry={() => undefined}
    />)).toContain('data-room-atmosphere="journal"');
    expect(renderToStaticMarkup(<DoctrineRoom
      doctrineRecords={[]}
      doctrineHistory={[]}
      doctrineSuggestions={[]}
      doctrineReviewDecisions={[]}
      onPromoteDoctrineCandidate={() => undefined}
      onDoctrineReviewDecision={() => undefined}
    />)).toContain('data-room-atmosphere="doctrine"');
    expect(renderToStaticMarkup(<AcademyRoom growthEvents={[]} />)).toContain('data-room-atmosphere="academy"');
    expect(renderToStaticMarkup(<GuardianRoom />)).toContain('data-room-atmosphere="guardian"');
    expect(renderToStaticMarkup(<IntelligenceCenterRoom journalEntries={[]} growthEvents={[]} />)).toContain('data-room-atmosphere="intelligence"');
  });

  it('derives exactly one active primary navigation item', () => {
    const items = getPrimaryNavigationItems('command');

    expect(items).toEqual([
      { id: 'command', label: 'Commander', section: 'commander', active: true },
      { id: 'missions', label: 'Missions', section: 'mission', active: false },
      { id: 'ready', label: 'Ready Room', section: 'mission', active: false },
      { id: 'observation', label: 'Observation', section: 'mission', active: false },
      { id: 'war', label: 'War Room', section: 'mission', active: false },
      { id: 'debrief', label: 'Debrief', section: 'mission', active: false },
      { id: 'journal', label: 'Journal', section: 'support', active: false },
      { id: 'academy', label: 'Academy', section: 'support', active: false },
      { id: 'doctrine', label: 'Doctrine', section: 'support', active: false },
      { id: 'guardian', label: 'Guardian Wing', section: 'support', active: false },
      { id: 'intelligence', label: 'Intelligence', section: 'support', active: false },
      { id: 'archive', label: 'Archive', section: 'support', active: false },
      { id: 'settings', label: 'Settings', section: 'support', active: false },
    ]);
    expect(items.filter((item) => item.active)).toHaveLength(1);
  });

  it('derives an Academy dashboard from journal growth evidence', () => {
    const dashboard = buildDesktopAcademyDashboard([
      {
        id: 'growth-001',
        eventDate: '2026-06-28',
        title: 'Held the plan',
        description: 'Followed process instead of reacting.',
        category: 'discipline',
        evidence: {
          sourceType: 'journal_entry',
          sourceId: 'journal-001',
        },
        rewardStatus: 'not_awarded',
        createdAt: '2026-06-28T00:00:00.000Z',
      },
      {
        id: 'growth-002',
        eventDate: '2026-06-29',
        title: 'Waited',
        description: 'Waited for confirmation.',
        category: 'patience',
        evidence: {
          sourceType: 'journal_entry',
          sourceId: 'journal-002',
        },
        rewardStatus: 'not_awarded',
        createdAt: '2026-06-29T00:00:00.000Z',
      },
    ]);

    expect(dashboard).toMatchObject({
      totalGrowthEvents: 2,
      totalXp: 27,
      levelTitle: 'Foundation',
      recognitionCount: 0,
      activeDays: 2,
      longestDailyStreak: 2,
      hasGrowthEvidence: true,
    });
    expect(formatAcademyDashboardStatus(dashboard)).toBe('27 XP across 2 growth events');
  });

  it('formats an empty Academy dashboard state safely', () => {
    const dashboard = buildDesktopAcademyDashboard([]);

    expect(dashboard.hasGrowthEvidence).toBe(false);
    expect(formatAcademyDashboardStatus(dashboard)).toBe('No Academy growth evidence yet');
  });

  it('formats startup performance measurements for the beta status panel', () => {
    expect(formatStartupPerformanceStatus({
      state: 'ready',
      database: {
        connected: true,
      },
      migrations: {
        applied: [],
        skipped: [],
      },
      performance: {
        durationMs: 725,
        migrationCount: 7,
        budgetMs: 3000,
        status: 'within-budget',
      },
    })).toBe('725ms / 3000ms within-budget');

    expect(formatStartupPerformanceStatus({
      state: 'loading',
      database: {
        connected: false,
      },
      migrations: {
        applied: [],
        skipped: [],
      },
    })).toBe('Not measured');
  });

  it('formats safe startup recovery guidance for beta error recovery', () => {
    expect(formatStartupRecoveryGuidance({
      state: 'ready',
      database: {
        connected: true,
      },
      migrations: {
        applied: [],
        skipped: [],
      },
    })).toBe('No recovery action required.');

    expect(formatStartupRecoveryGuidance({
      state: 'failed',
      database: {
        connected: false,
      },
      migrations: {
        applied: [],
        skipped: [],
      },
      error: 'database unavailable',
    })).toBe('Close Headquarters, confirm the local database is available, then restart the desktop shell.');
  });

  it('renders the Academy dashboard room as a read-oriented growth surface', () => {
    const html = renderToStaticMarkup(<AcademyRoom growthEvents={[]} />);

    expect(html).toContain('data-room-id="academy-room"');
    expect(html).toContain('Academy Dashboard');
    expect(html).toContain('Growth Standing');
    expect(html).toContain('Quiet Recognition');
    expect(html).toContain('Consistency Tracking');
    expect(html).toContain('No Academy growth evidence yet');
  });

  it('derives and renders Guardian as an active protection room', () => {
    const alerts = buildDesktopGuardianAlerts();
    const lockout = buildDesktopGuardianLockoutState();
    const model = buildGuardianRoomModel();
    const html = renderToStaticMarkup(<GuardianRoom />);

    expect(alerts.map((alert) => alert.priority)).toEqual(['low']);
    expect(lockout.status).toBe('unlocked');
    expect(model.level).toBe('normal');
    expect(model.transmission).toBe('Operator behavior remains within doctrine. Monitoring continues.');
    expect(html).toContain('data-room-id="guardian-room"');
    expect(html).toContain('No intervention required.');
    expect(html).toContain('Capital Vault');
    expect(html).toContain('Judgment Reserve');
    expect(html).toContain('Success Protocol Armed');
    expect(html).toContain('Guardian Timeline');
    expect(html).toContain('Guardian Memory');
    expect(html).toContain('Living boundaries');
  });

  it('derives Guardian alerts from mission context instead of static placeholder copy', () => {
    const mission: ActiveMission = {
      id: 'mission-guardian',
      campaign: 'Guardian Context Test',
      objective: 'Protect capital',
      condition: 'Authorization',
      commandAuthority: 'Professional command',
      currentState: 'authorization',
      createdAt: new Date().toISOString(),
      briefingContext: {
        missionObjective: 'Observe NQ',
        market: 'NQ',
        marketEnvironment: 'High volatility',
        highImpactNews: 'FOMC',
        personalReadiness: 'tired',
      },
      observationContext: {
        readiness: 'no',
      },
    };
    const alerts = buildDesktopGuardianAlerts({
      mission,
      currentRoom: 'war-room',
      operatorJustification: 'I need to rush this trade',
      protectiveRule: '',
    });
    const model = buildGuardianRoomModel({
      mission,
      operatorJustification: 'I need to rush this trade',
      protectiveRule: '',
    });
    const html = renderToStaticMarkup(<GuardianRoom mission={mission} />);

    expect(alerts.map((alert) => alert.message)).toContain('Risk boundary is not declared. Guardian will not clear aggressive authorization until risk is stated.');
    expect(alerts.map((alert) => alert.message)).toContain('Authorization is missing a protective rule. Guardian requires the rule before deployment authority is clean.');
    expect(model.level).toBe('intervention');
    expect(model.vault.allocation).toBe('not declared');
    expect(model.judgmentReserve.fatigue).toBe('Elevated');
    expect(model.rules.some((rule) => rule.title === 'Maximum daily risk: not declared' && rule.state === 'warning')).toBe(true);
    expect(html).toContain('Guardian Warning');
    expect(html).toContain('Risk must be declared before clean authorization.');
    expect(alerts.map((alert) => alert.message).join('\n')).not.toContain('Risk state is monitored from approved inputs only.');
    expect(buildDesktopGuardianLockoutState({ authorizationStatus: {
      missionId: 'mission-guardian',
      decision: 'denied',
      reason: 'Invalidation missing.',
    } }).status).toBe('locked');
  });

  it('renders Intelligence Center journal classifications without mutating raw evidence', () => {
    const journalEntry = {
      id: 'journal-001',
      entryDate: '2026-07-01',
      rawContent: 'Mission debrief lesson: patience protected the rule.',
      rawMood: 'calm',
      rawMarketConditions: 'quiet market session',
      source: 'manual' as const,
      attachmentReferences: ['chart-001'],
      classificationStatus: 'unclassified' as const,
      createdAt: '2026-07-01T08:00:00.000Z',
      updatedAt: '2026-07-01T08:00:00.000Z',
    };

    const classifications = buildDesktopJournalClassifications([journalEntry]);
    const html = renderToStaticMarkup(<IntelligenceCenterRoom journalEntries={[journalEntry]} />);

    expect(classifications[0]?.categories).toContain('mission_reflection');
    expect(classifications[0]?.categories).toContain('growth_event');
    expect(classifications[0]?.rawEntry).toEqual(journalEntry);
    expect(classifications[0]?.rawEntry).not.toBe(journalEntry);
    expect(formatJournalClassificationStatus(classifications)).toBe('1 of 1 journal entry classified');
    expect(html).toContain('data-room-id="intelligence-center"');
    expect(html).toContain('Journal Classification');
    expect(html).toContain('mission_reflection');
  });

  it('derives explainable Intelligence patterns from classified journal evidence', () => {
    const entries = [
      {
        id: 'journal-001',
        entryDate: '2026-07-01',
        rawContent: 'Lesson: patience and discipline protected the mission.',
        source: 'manual' as const,
        attachmentReferences: [],
        classificationStatus: 'unclassified' as const,
        createdAt: '2026-07-01T08:00:00.000Z',
        updatedAt: '2026-07-01T08:00:00.000Z',
      },
      {
        id: 'journal-002',
        entryDate: '2026-07-02',
        rawContent: 'Lesson: patience prevented an override.',
        source: 'manual' as const,
        attachmentReferences: [],
        classificationStatus: 'unclassified' as const,
        createdAt: '2026-07-02T08:00:00.000Z',
        updatedAt: '2026-07-02T08:00:00.000Z',
      },
    ];
    const classifications = buildDesktopJournalClassifications(entries);
    const evidenceRecords = buildDesktopIntelligenceEvidenceRecords(classifications);
    const patterns = buildDesktopIntelligencePatterns(evidenceRecords);
    const html = renderToStaticMarkup(<IntelligenceCenterRoom journalEntries={entries} />);

    expect(patterns.map((pattern) => pattern.id)).toContain('repeated-signal:lesson');
    expect(patterns.map((pattern) => pattern.id)).toContain('source-cluster:journal');
    expect(html).toContain('Pattern Reports');
    expect(html).toContain('Repeated signal: lesson');
  });

  it('derives operational repeated mistake analysis with evidence links', () => {
    const evidenceRecords = [
      { id: 'journal-001', sourceType: 'journal' as const, summary: 'Risk note', signals: ['risk_note'] },
      { id: 'journal-002', sourceType: 'journal' as const, summary: 'Risk note again', signals: ['risk_note'] },
    ];
    const mistakes = buildDesktopRepeatedMistakes(evidenceRecords);
    const html = renderToStaticMarkup(<IntelligenceCenterRoom journalEntries={[{
      id: 'journal-001',
      entryDate: '2026-07-01',
      rawContent: 'Risk note: size was too large.',
      source: 'manual',
      attachmentReferences: [],
      classificationStatus: 'unclassified',
      createdAt: '2026-07-01T08:00:00.000Z',
      updatedAt: '2026-07-01T08:00:00.000Z',
    }, {
      id: 'journal-002',
      entryDate: '2026-07-02',
      rawContent: 'Risk note: loss limit needed attention.',
      source: 'manual',
      attachmentReferences: [],
      classificationStatus: 'unclassified',
      createdAt: '2026-07-02T08:00:00.000Z',
      updatedAt: '2026-07-02T08:00:00.000Z',
    }]} />);

    expect(mistakes).toEqual([{
      id: 'repeated-mistake:risk_note',
      signal: 'risk_note',
      title: 'Repeated risk note',
      operationalLanguage: '2 evidence records show risk process requiring review.',
      evidenceRecordIds: ['journal-001', 'journal-002'],
    }]);
    expect(html).toContain('Repeated Mistakes');
    expect(html).toContain('Repeated risk note');
  });

  it('derives behavior-based repeated successes without profit scoring', () => {
    const evidenceRecords = [
      { id: 'journal-001', sourceType: 'journal' as const, summary: 'Patience held', signals: ['growth_event'] },
      { id: 'journal-002', sourceType: 'journal' as const, summary: 'Patience held again', signals: ['growth_event'] },
    ];
    const successes = buildDesktopRepeatedSuccesses(evidenceRecords);
    const html = renderToStaticMarkup(<IntelligenceCenterRoom journalEntries={[{
      id: 'journal-001',
      entryDate: '2026-07-01',
      rawContent: 'Discipline improved through patience.',
      source: 'manual',
      attachmentReferences: [],
      classificationStatus: 'unclassified',
      createdAt: '2026-07-01T08:00:00.000Z',
      updatedAt: '2026-07-01T08:00:00.000Z',
    }, {
      id: 'journal-002',
      entryDate: '2026-07-02',
      rawContent: 'Discipline improved again by waiting.',
      source: 'manual',
      attachmentReferences: [],
      classificationStatus: 'unclassified',
      createdAt: '2026-07-02T08:00:00.000Z',
      updatedAt: '2026-07-02T08:00:00.000Z',
    }]} />);

    expect(successes).toEqual([{
      id: 'repeated-success:growth_event',
      signal: 'growth_event',
      title: 'Repeated growth behavior',
      behaviorLanguage: '2 evidence records show repeated growth behavior.',
      evidenceRecordIds: ['journal-001', 'journal-002'],
    }]);
    expect(html).toContain('Repeated Successes');
    expect(html).toContain('Repeated growth behavior');
  });

  it('surfaces doctrine suggestions as manual-review candidates only', () => {
    const suggestions = buildDesktopDoctrineSuggestions([
      {
        id: 'journal-001',
        sourceType: 'journal',
        summary: 'Rule source',
        signals: ['doctrine_candidate_source'],
      },
    ]);
    const html = renderToStaticMarkup(<IntelligenceCenterRoom journalEntries={[{
      id: 'journal-001',
      entryDate: '2026-07-01',
      rawContent: 'Doctrine rule: never override risk limits.',
      source: 'manual',
      attachmentReferences: [],
      classificationStatus: 'unclassified',
      createdAt: '2026-07-01T08:00:00.000Z',
      updatedAt: '2026-07-01T08:00:00.000Z',
    }]} />);

    expect(suggestions).toEqual([{
      id: 'doctrine-suggestion:doctrine_candidate_source',
      title: 'Review evidence-backed doctrine source',
      rationale: 'Source evidence requires manual doctrine review: Rule source',
      evidenceRecordIds: ['journal-001'],
      evidenceSummaries: ['Rule source'],
      requiresManualPromotion: true,
    }]);
    expect(html).toContain('Doctrine Suggestions');
    expect(html).toContain('Manual promotion required');
  });

  it('surfaces evidence-based growth analysis from journal and Academy evidence', () => {
    const journalEntries = [{
      id: 'journal-001',
      entryDate: '2026-07-01',
      rawContent: 'Lesson: discipline and patience improved during the session.',
      source: 'manual' as const,
      attachmentReferences: [],
      classificationStatus: 'unclassified' as const,
      createdAt: '2026-07-01T08:00:00.000Z',
      updatedAt: '2026-07-01T08:00:00.000Z',
    }];
    const growthEvents = [{
      id: 'growth-001',
      eventDate: '2026-07-01',
      title: 'Patience held',
      description: 'Waited for the plan instead of forcing entry.',
      category: 'patience' as const,
      evidence: {
        sourceType: 'journal_entry' as const,
        sourceId: 'journal-001',
      },
      rewardStatus: 'not_awarded' as const,
      createdAt: '2026-07-01T08:00:00.000Z',
    }];
    const classifications = buildDesktopJournalClassifications(journalEntries);
    const evidenceRecords = buildDesktopIntelligenceEvidenceRecords(classifications);
    const analysis = buildDesktopGrowthAnalysis(evidenceRecords, growthEvents);
    const html = renderToStaticMarkup(<IntelligenceCenterRoom journalEntries={journalEntries} growthEvents={growthEvents} />);

    expect(analysis.status).toBe('ready');
    expect(analysis.journalEvidenceCount).toBe(1);
    expect(analysis.academyEvidenceCount).toBe(1);
    expect(analysis.growthCategories).toEqual(['patience']);
    expect(html).toContain('Growth Analysis');
    expect(html).toContain('Categories: patience');
  });

  it('renders a read-oriented Intelligence dashboard from existing Intelligence outputs', () => {
    const journalEntries = [{
      id: 'journal-001',
      entryDate: '2026-07-01',
      rawContent: 'Lesson: discipline and patience improved during the session.',
      source: 'manual' as const,
      attachmentReferences: [],
      classificationStatus: 'unclassified' as const,
      createdAt: '2026-07-01T08:00:00.000Z',
      updatedAt: '2026-07-01T08:00:00.000Z',
    }, {
      id: 'journal-002',
      entryDate: '2026-07-02',
      rawContent: 'Lesson: patience protected the rule again.',
      source: 'manual' as const,
      attachmentReferences: [],
      classificationStatus: 'unclassified' as const,
      createdAt: '2026-07-02T08:00:00.000Z',
      updatedAt: '2026-07-02T08:00:00.000Z',
    }];
    const classifications = buildDesktopJournalClassifications(journalEntries);
    const evidenceRecords = buildDesktopIntelligenceEvidenceRecords(classifications);
    const patterns = buildDesktopIntelligencePatterns(evidenceRecords);
    const repeatedMistakes = buildDesktopRepeatedMistakes(evidenceRecords);
    const repeatedSuccesses = buildDesktopRepeatedSuccesses(evidenceRecords);
    const doctrineSuggestions = buildDesktopDoctrineSuggestions([]);
    const growthAnalysis = buildDesktopGrowthAnalysis(evidenceRecords, []);
    const dashboard = buildDesktopIntelligenceDashboard(
      classifications,
      patterns,
      repeatedMistakes,
      repeatedSuccesses,
      doctrineSuggestions,
      growthAnalysis,
    );
    const html = renderToStaticMarkup(<IntelligenceCenterRoom journalEntries={journalEntries} />);

    expect(dashboard.status).toBe('ready');
    expect(dashboard.classificationCount).toBe(2);
    expect(dashboard.patternReportCount).toBeGreaterThan(0);
    expect(html).toContain('Intelligence Dashboard');
    expect(html).toContain('Doctrine Suggestions');
  });

  it('renders the Archive room with HTB archive component alignment', () => {
    const html = renderToStaticMarkup(<ArchiveRoom
      archivedMissionSummaries={[{
        missionId: 'mission-001',
        codename: 'Foundation Patrol',
        archivedAt: '2026-01-01T00:20:00.000Z',
        eventCount: 2,
      }]}
      missionHistory={[]}
      archivedJournalEntries={[]}
      doctrineRecords={[]}
    />);

    expect(html).toContain('data-room-id="archive-room"');
    expect(html).toContain('ArchiveSearch');
    expect(html).toContain('ArchiveCard');
    expect(html).toContain('CampaignBookView');
    expect(html).toContain('DoctrineRecordView');
    expect(html).toContain('Foundation Patrol');
  });

  it('renders the Ready Room with HTB room component state binding', () => {
    const mission = createLocalMission(
      { codename: 'Foundation Patrol', objective: 'Hold the line' },
      { createdAt: '2026-01-01T00:00:00.000Z', id: 'mission-001' },
    );

    if (!mission) throw new Error('Expected local mission fixture');

    const html = renderToStaticMarkup(<ReadyRoom activeMission={mission} missionHistory={[mission]} growthEvents={[]} />);

    expect(html).toContain('data-room-id="ready-room"');
    expect(html).toContain('Preparation Checklist');
    expect(html).toContain('Mission Record');
    expect(html).toContain('Command Commitment');
    expect(html).toContain('Operator Locker');
    expect(html).toContain('Foundation Patrol');
  });

  it('renders the Observation Room with quiet observation components', () => {
    const mission = createLocalMission(
      { codename: 'Foundation Patrol', objective: 'Hold the line' },
      { createdAt: '2026-01-01T00:00:00.000Z', id: 'mission-001' },
    );

    if (!mission) throw new Error('Expected local mission fixture');

    const html = renderToStaticMarkup(<ObservationRoom activeMission={{ ...mission, currentState: 'observation' }} />);

    expect(html).toContain('data-room-id="observation-room"');
    expect(html).toContain('Current Observation');
    expect(html).toContain('What direction is price currently moving?');
    expect(html).toContain('Intelligence Board');
    expect(html).toContain('Today&#x27;s Evidence');
    expect(html).toContain('Observation Metrics');
    expect(html).toContain('Observation Log');
    expect(html).toContain('Observation Aids');
    expect(html).toContain('Silence State');
    expect(html).toContain('Headquarters observes and records');
  });

  it('links Observation Room focus and boards to captured Commander evidence', () => {
    const mission = withObservationMissionContext(
      withBriefingMissionContext({
        id: 'mission-observation-001',
        campaign: 'Evidence Patrol',
        objective: 'Wait for confirmed continuation',
        condition: 'Observation',
        commandAuthority: 'Professional command',
        currentState: 'observation',
        createdAt: '2026-07-02T00:00:00.000Z',
      }, {
        missionObjective: 'Wait for confirmed continuation',
        market: 'NQ',
        marketEnvironment: 'New York Open',
        highImpactNews: 'None',
        personalReadiness: 'focused',
        riskParameters: '1%',
        successCriteria: 'Do not force execution',
      }),
      {
        marketDirection: 'Price is moving higher',
        marketStructure: 'Higher highs and higher lows',
        volume: 'Expansion above average',
      },
    );
    const missionPackage = buildDesktopMissionIntelligencePackage(mission);
    const model = buildObservationRoomIntelligenceModel(mission, missionPackage);
    const html = renderToStaticMarkup(<ObservationRoom activeMission={mission} missionIntelligencePackage={missionPackage} />);

    expect(model.completedEvidence.map((item) => item.label)).toEqual(['Direction', 'Structure', 'Volume']);
    expect(model.currentFocus.question).toBe('Where is liquidity likely resting?');
    expect(html).toContain('Where is liquidity likely resting?');
    expect(html).toContain('Price is moving higher');
    expect(html).toContain('Higher highs and higher lows');
    expect(html).toContain('Expansion above average');
    expect(html).toContain('Still Missing');
    expect(html).toContain('Liquidity');
    expect(html).toContain('Mission Confidence');
    expect(html).toContain('Evidence remains insufficient.');
  });

  it('renders the War Room authorization boundary without broker control', () => {
    const mission = createLocalMission(
      { codename: 'Foundation Patrol', objective: 'Hold the line' },
      { createdAt: '2026-01-01T00:00:00.000Z', id: 'mission-001' },
    );

    if (!mission) throw new Error('Expected local mission fixture');

    const html = renderToStaticMarkup(<WarRoom activeMission={{ ...mission, currentState: 'authorization' }} missionHistory={[mission]} />);

    expect(html).toContain('data-room-id="war-room"');
    expect(html).toContain('Mission Brief');
    expect(html).toContain('Evidence Board');
    expect(html).toContain('Guardian Review');
    expect(html).toContain('Commander Interrogation');
    expect(html).toContain('Authorization Console');
    expect(html).toContain('Authorization Log');
    expect(html).toContain('Similar Missions');
    expect(html).toContain('Deployment NOT AUTHORIZED');
    expect(html).toContain('Context incomplete');
    expect(html).toContain('Why should Headquarters deploy capital?');
  });

  it('renders War Room mission context summary with contradictions when available', () => {
    const mission = createLocalMission(
      { codename: 'Foundation Patrol', objective: 'Hold the line' },
      { createdAt: '2026-01-01T00:00:00.000Z', id: 'mission-001' },
    );

    if (!mission) throw new Error('Expected local mission fixture');

    const missionWithBriefing = withBriefingMissionContext(mission, {
      missionObjective: 'Trade the morning breakout.',
      market: 'ES futures.',
      marketEnvironment: 'Low volatility range.',
      highImpactNews: 'CPI.',
      personalReadiness: 'Focused.',
      riskParameters: '1%.',
      successCriteria: 'Follow the plan.',
    });
    const missionWithObservation = withObservationMissionContext(missionWithBriefing, {
      marketDirection: 'Up.',
      marketStructure: 'High volatility expansion.',
      volume: 'Rising.',
      liquidity: 'Above prior high.',
      keyLevels: 'VWAP.',
      bias: 'Long continuation.',
      invalidationEvidence: 'Break below VWAP.',
      emotionalCheck: 'Focused.',
      readiness: 'yes',
      operationalPicture: 'High volatility expansion above VWAP.',
    });

    const html = renderToStaticMarkup(<WarRoom
      activeMission={{ ...missionWithObservation, currentState: 'authorization' }}
      missionHistory={[missionWithObservation]}
    />);

    expect(html).toContain('Trade the morning breakout.');
    expect(html).toContain('Low volatility range.');
    expect(html).toContain('Long continuation.');
    expect(html).toContain('Break below VWAP.');
    expect(html).toContain('Commander Interrogation');
    expect(html).toContain('This conflicts with your earlier briefing.');
    expect(html).toContain('Which protective rule keeps this decision disciplined?');
  });

  it('renders the Debrief Theater as a Commander-led reflection room', () => {
    const mission = createLocalMission(
      { codename: 'Foundation Patrol', objective: 'Hold the line' },
      { createdAt: '2026-01-01T00:00:00.000Z', id: 'mission-001' },
    );

    if (!mission) throw new Error('Expected local mission fixture');

    const html = renderToStaticMarkup(<DebriefTheater
      activeMission={{ ...mission, currentState: 'return_to_base' }}
      onMissionChanged={() => undefined}
      onRequestAuthorization={() => undefined}
      onSaveDebrief={() => undefined}
      onArchiveMission={() => undefined}
    />);

    expect(html).toContain('data-room-id="debrief-theater"');
    expect(html).toContain('Mission Recap');
    expect(html).toContain('Mission Complete');
    expect(html).toContain('Mission Comparison');
    expect(html).toContain('Plan vs Reality');
    expect(html).toContain('Commander Debrief');
    expect(html).toContain('Did you follow the original plan?');
    expect(html).toContain('Behavior Report');
    expect(html).toContain('Mission Rewards');
    expect(html).toContain('Guardian Review');
    expect(html).toContain('Archive Report');
    expect(html).toContain('Message for Future You');
    expect(html).toContain('Mission timeline viewer');
  });

  it('renders Debrief context recall from mission context memory', () => {
    const mission = createLocalMission(
      { codename: 'Foundation Patrol', objective: 'Hold the line' },
      { createdAt: '2026-01-01T00:00:00.000Z', id: 'mission-001' },
    );

    if (!mission) throw new Error('Expected local mission fixture');

    const missionWithBriefing = withBriefingMissionContext(mission, {
      missionObjective: 'Trade the morning breakout.',
      market: 'ES futures.',
      marketEnvironment: 'Low volatility range.',
      highImpactNews: 'None.',
      personalReadiness: 'Focused.',
      riskParameters: '1%.',
      successCriteria: 'Follow plan and stop after two attempts.',
    });
    const missionWithObservation = withObservationMissionContext(missionWithBriefing, {
      marketDirection: 'Up.',
      marketStructure: 'High volatility expansion.',
      volume: 'Rising.',
      liquidity: 'Above prior high.',
      keyLevels: 'VWAP.',
      bias: 'Long continuation.',
      invalidationEvidence: 'Break below VWAP.',
      emotionalCheck: 'Focused.',
      readiness: 'yes',
      operationalPicture: 'High volatility expansion above VWAP.',
    });

    const html = renderToStaticMarkup(<DebriefTheater
      activeMission={{ ...missionWithObservation, currentState: 'return_to_base' }}
      onMissionChanged={() => undefined}
      onRequestAuthorization={() => undefined}
      onSaveDebrief={() => undefined}
      onArchiveMission={() => undefined}
    />);

    expect(html).toContain('Trade the morning breakout.');
    expect(html).toContain('Follow plan and stop after two attempts.');
    expect(html).toContain('1%.');
    expect(html).toContain('Long continuation.');
    expect(html).toContain('Break below VWAP.');
    expect(html).toContain('This conflicts with your earlier briefing.');
    expect(html).toContain('Plan and observation need explanation');
    expect(html).toContain('version of you remember?');
  });

  it('builds deterministic Debrief reflection model from mission context and saved debrief', () => {
    const mission = createLocalMission(
      { codename: 'Foundation Patrol', objective: 'Hold the line' },
      { createdAt: '2026-01-01T00:00:00.000Z', id: 'mission-001' },
    );

    if (!mission) throw new Error('Expected local mission fixture');

    const missionWithBriefing = withBriefingMissionContext(mission, {
      missionObjective: 'Trade the morning breakout.',
      market: 'ES futures.',
      marketEnvironment: 'Low volatility range.',
      highImpactNews: 'None.',
      personalReadiness: 'Focused.',
      riskParameters: '1%.',
      successCriteria: 'Follow plan and stop after two attempts.',
    });
    const missionWithObservation = withObservationMissionContext(missionWithBriefing, {
      marketDirection: 'Up.',
      marketStructure: 'Higher highs.',
      volume: 'Rising.',
      liquidity: 'Above prior high.',
      keyLevels: 'VWAP.',
      bias: 'Long continuation.',
      invalidationEvidence: 'Break below VWAP.',
      emotionalCheck: 'Calm.',
      readiness: 'yes',
      operationalPicture: 'Entered after confirmation.',
    });
    const debrief = createLocalDebrief(missionWithObservation, {
      behaviorSummary: 'Executed the plan without revenge.',
      disciplineNotes: 'Waited for confirmation.',
      lesson: 'Let confirmation arrive before committing capital.',
    }, { id: 'debrief-001', createdAt: '2026-01-01T01:00:00.000Z' });

    const model = buildDebriefTheaterReflectionModel({
      activeMission: missionWithObservation,
      missionDebrief: debrief,
      authorizationStatus: {
        missionId: missionWithObservation.id,
        decision: 'approved',
        reason: 'Evidence sufficient.',
      },
    });

    expect(model.operation).toBe('Trade the morning breakout.');
    expect(model.result).toBe('Debriefed');
    expect(model.risk).toBe('1%.');
    expect(model.guardianVerdict).toBe('Review');
    expect(model.reality).toBe('Executed the plan without revenge.');
    expect(model.lesson).toBe('Let confirmation arrive before committing capital.');
    expect(model.behaviorScore).toBe(82);
    expect(model.archiveReady).toBe(true);
    expect(formatDebriefMissionDuration({ ...missionWithObservation, createdAt: 'invalid-date' })).toBe('Not available');
  });

  it('keeps Headquarters overview focused on Commander guidance instead of dense subsystem panels', () => {
    const html = renderToStaticMarkup(<CommandCenterPlaceholder />);

    expect(html).toContain('Commander Briefing');
    expect(html).toContain('aria-label="Commander briefing"');
    expect(html).toContain('Headquarters is ready for command.');
    expect(html).toContain('aria-label="Morning Brief"');
    expect(html).toContain('aria-label="Mission Record"');
    expect(html).toContain('aria-label="Intelligent Situation Board"');
    expect(html).toContain('Mission Room');
    expect(html).toContain('aria-label="Operational Message History"');
    expect(html).toContain('aria-label="Commander Learning Dashboard"');
    expect(html).toContain('aria-label="Headquarters Broadcast"');
    expect(html).toContain('aria-label="Services Health Dashboard"');
    expect(html).toContain('aria-label="Headquarters Operational Timeline"');
    expect(html).toContain('aria-label="Semantic evidence summaries"');
    expect(html).toContain('Headquarters has not preserved a mission record yet.');
    expect(html).not.toContain('aria-label="Mission operations"');
    expect(html).not.toContain('Mission Debrief');
  });

  it('builds evidence-driven Commander Room recommendations', () => {
    const mission = createLocalMission(
      { codename: 'Foundation Patrol', objective: 'Hold the line' },
      { createdAt: '2026-01-01T00:00:00.000Z', id: 'mission-001' },
    );

    if (!mission) throw new Error('Expected local mission fixture');

    const briefing = buildCommanderRoomBriefing({
      activeMission: { ...mission, currentState: 'observation' },
      startupSubsystemCount: 4,
      missionHistory: [],
      growthEvents: [],
      doctrineRecords: [],
      journalEntries: [],
      archivedMissionSummaries: [],
      archivedJournalEntries: [],
    });

    expect(briefing.headline).toBe('Foundation Patrol is in Observation.');
    expect(briefing.situation.recommendedRoom).toBe('Observation Room');
    expect(briefing.situation.reason).toBe('Visible evidence must be collected before War Room authorization.');
    expect(briefing.highestPriority).toBe('Complete Observation');
    expect(briefing.priorities[0]?.source).toBe('mission');
    expect(briefing.priorityCounts.blocking).toBe(1);
    expect(briefing.services.some((service) => service.name === 'Mission' && service.status === 'Active')).toBe(true);
    expect(briefing.semanticEvidence.archive).toBe('Headquarters has not preserved a mission record yet.');
  });

  it('lets Guardian restrictions override normal Commander Room recommendations', () => {
    const mission = createLocalMission(
      { codename: 'Foundation Patrol', objective: 'Hold the line' },
      { createdAt: '2026-01-01T00:00:00.000Z', id: 'mission-001' },
    );

    if (!mission) throw new Error('Expected local mission fixture');

    const briefing = buildCommanderRoomBriefing({
      activeMission: { ...mission, currentState: 'observation' },
      startupSubsystemCount: 4,
      missionHistory: [],
      growthEvents: [],
      doctrineRecords: [],
      guardianAlerts: [{
        id: 'guardian-alert-lockout',
        title: 'Guardian lockout',
        message: 'Trading authorization suspended.',
        priority: 'critical',
        sourceId: 'lockout-rule',
      }],
      journalEntries: [],
      archivedMissionSummaries: [],
      archivedJournalEntries: [],
    });

    expect(briefing.priorities[0]?.source).toBe('guardian');
    expect(briefing.situation.recommendedRoom).toBe('War Room');
    expect(briefing.situation.severity).toBe('critical');
    expect(briefing.recommendedAction).toBe('Resolve Guardian restriction');
  });

  it('defines a deterministic guided Journal workflow sequence', () => {
    const steps = getJournalWorkflowSteps();

    expect(steps.map((step) => step.id)).toEqual([
      'entry',
      'reflection',
      'trade-review',
      'growth',
      'timeline',
      'search',
      'archive',
    ]);
    expect(steps.map((step) => step.label)).toEqual(['Write', 'Reflect', 'Review', 'Learn', 'Story', 'Memory', 'Archive Link']);
    expect(getJournalCommanderPrompt('entry')).toBe('Write first. Do not classify the day before the truth is on record.');
    expect(getJournalCommanderPrompt('archive')).toBe('Journal writes. Archive stores. Send only completed evidence forward.');
  });

  it('renders Journal as a Commander Log instead of separate form modules', () => {
    const html = renderToStaticMarkup(<JournalRoom
      journalEntries={[]}
      dailyReflections={[]}
      tradeReviews={[]}
      growthEvents={[]}
      archivedJournalEntries={[]}
      onCreateJournalEntry={() => undefined}
      onCreateDailyReflection={() => undefined}
      onCreateTradeReview={() => undefined}
      onCreateGrowthEvent={() => undefined}
      onArchiveJournalEntry={() => undefined}
    />);

    expect(html).toContain('Commander Log');
    expect(html).toContain('aria-label="Journal Commander prompt"');
    expect(html).toContain('Good. Tell me everything.');
    expect(html).toContain('What almost made you abandon your plan?');
    expect(html).toContain('aria-label="Commander log"');
    expect(html).toContain('Transmit Log');
    expect(html).toContain('aria-label="Commander journal intelligence"');
    expect(html).toContain('Journal Analysis');
    expect(html).toContain('aria-current="step"');
    expect(html).not.toContain('Save Journal Entry');
    expect(html).not.toContain('aria-label="Daily reflection"');
    expect(html).not.toContain('aria-label="Journal archive"');
  });

  it('derives Commander journal intelligence from existing journal evidence', () => {
    const model = buildJournalCommanderIntelligence({
      journalEntries: [{
        id: 'journal-001',
        entryDate: '2026-07-11',
        rawContent: 'I waited with patience and followed the plan.',
        rawMood: 'calm',
        rawMarketConditions: 'slow session',
        source: 'manual',
        attachmentReferences: [],
        classificationStatus: 'unclassified',
        createdAt: '2026-07-11T00:00:00.000Z',
        updatedAt: '2026-07-11T00:00:00.000Z',
      }],
      dailyReflections: [],
      tradeReviews: [],
      growthEvents: [],
      searchText: 'patience',
      searchResultCount: 1,
    });

    expect(model.dailyQuestion).toBe('Where did discipline save you today?');
    expect(model.detectedThemes).toContain('Patience');
    expect(model.detectedThemes).toContain('Plan discipline');
    expect(model.memorySummary).toContain('Commander Memory found 1 similar record');
    expect(model.growthRecommendationTitle).toBe('Patience improved');
    expect(model.doctrineCandidate).toBe('Patience appears often enough to monitor for future Doctrine.');
  });

  it('renders active mission journal integration when a mission is open', () => {
    const mission = createLocalMission(
      { codename: 'Foundation Patrol', objective: 'Hold the line' },
      { createdAt: '2026-01-01T00:00:00.000Z', id: 'mission-001' },
    );

    if (!mission) throw new Error('Expected local mission fixture');

    const html = renderToStaticMarkup(<JournalRoom
      activeMission={mission}
      journalEntries={[]}
      dailyReflections={[]}
      tradeReviews={[]}
      growthEvents={[]}
      archivedJournalEntries={[]}
      onCreateJournalEntry={() => undefined}
      onCreateDailyReflection={() => undefined}
      onCreateTradeReview={() => undefined}
      onCreateGrowthEvent={() => undefined}
      onArchiveJournalEntry={() => undefined}
    />);

    expect(html).toContain('aria-label="Mission journal integration"');
    expect(html).toContain('Write the next command log entry for Foundation Patrol.');
  });

  it('renders Doctrine as a review chamber with manual candidate promotion visible', () => {
    const html = renderToStaticMarkup(<DoctrineRoom
      doctrineRecords={[]}
      doctrineHistory={[]}
      doctrineSuggestions={[]}
      doctrineReviewDecisions={[]}
      onPromoteDoctrineCandidate={() => undefined}
      onDoctrineReviewDecision={() => undefined}
    />);

    expect(html).toContain('Book of Doctrine');
    expect(html).toContain('aria-label="Doctrine Commander prompt"');
    expect(html).toContain('Review the lesson before it becomes law.');
    expect(html).toContain('aria-label="Doctrine candidate session"');
    expect(html).toContain('No doctrine has become law yet. Wait for repeated evidence.');
    expect(html).toContain('aria-label="Doctrine quality"');
    expect(html).toContain('aria-label="Doctrine candidate review"');
    expect(html).toContain('Candidate incomplete. More evidence or clarification is required.');
    expect(html).toContain('Promote Doctrine');
  });

  it('builds Doctrine chamber status from candidates, decisions, and records', () => {
    const model = buildDoctrineChamberModel({
      doctrineRecords: [{
        id: 'doctrine-001',
        title: 'Wait for confirmation',
        summary: 'Patience before execution reduces early entries.',
        confidence: 'validated',
        source: {
          sourceType: 'journal_entry',
          sourceId: 'journal-001',
          excerpt: 'Waited for confirmation.',
        },
        createdAt: '2026-07-11T00:00:00.000Z',
        updatedAt: '2026-07-11T00:00:00.000Z',
      }],
      doctrineHistory: [],
      doctrineSuggestions: [{
        id: 'suggestion-001',
        title: 'Never trade first candle',
        rationale: 'Opening volatility caused early entries.',
        evidenceRecordIds: ['journal-001', 'journal-002'],
        evidenceSummaries: ['Opening volatility caused early entries.'],
        requiresManualPromotion: true,
      }],
      doctrineReviewDecisions: [],
    });

    expect(model.candidateCount).toBe(1);
    expect(model.waitingCount).toBe(1);
    expect(model.acceptedCount).toBe(1);
    expect(model.averageConfidence).toBe(100);
    expect(model.heat).toBe('Stable');
    expect(model.activeCandidateStatus).toBe('Strong');
    expect(model.similaritySummary).toContain('similarity');
    expect(model.affectedChapters.some((chapter) => chapter.name === 'Psychology' && chapter.affected)).toBe(true);
  });

  it('formats recent Headquarters highlights without exposing subsystem detail in Command', () => {
    expect(formatRecentGrowthHighlight([])).toBe('No growth highlights yet');
    expect(formatRecentDoctrineHighlight([])).toBe('No doctrine highlights yet');
    expect(formatRecentGrowthHighlight([{
      id: 'growth-001',
      eventDate: '2026-06-29',
      title: 'Waited for confirmation',
      description: 'Stayed with the plan.',
      category: 'discipline',
      evidence: {
        sourceType: 'journal_entry',
        sourceId: 'journal-001',
      },
      rewardStatus: 'not_awarded',
      createdAt: '2026-06-29T00:00:00.000Z',
    }])).toBe('Waited for confirmation');
    expect(formatRecentDoctrineHighlight([{
      id: 'doctrine-001',
      title: 'Wait for clean confirmation',
      summary: 'No entry before confirmation.',
      confidence: 'validated',
      source: {
        sourceType: 'journal_entry',
        sourceId: 'journal-001',
      },
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z',
    }])).toBe('Wait for clean confirmation');
  });

  it('derives the valid next mission action from the current mission state', () => {
    const missionWithState = (currentState: string): ActiveMission => ({
      id: `mission-${currentState}`,
      campaign: 'Foundation',
      objective: 'Hold the line',
      condition: 'Ready',
      commandAuthority: 'Operator',
      currentState,
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    expect(getMissionNextAction()).toMatchObject({
      buttonLabel: 'Create Mission',
      disabled: false,
    });

    expect(getMissionNextAction(missionWithState('idle'))).toMatchObject({
      buttonLabel: 'Start Briefing',
      disabled: false,
    });
    expect(getMissionNextAction(missionWithState('authorization'))).toMatchObject({
      buttonLabel: 'Evaluate Authorization',
      disabled: false,
    });
    expect(getMissionNextAction(missionWithState('return_to_base'))).toMatchObject({
      buttonLabel: 'Save Debrief',
      disabled: false,
    });
  });

  it('lets Commander Continue advance the Ready Room briefing step instead of re-entering Ready Room', async () => {
    const mission: ActiveMission = {
      id: 'mission-briefing',
      campaign: 'Foundation',
      objective: 'Prepare before observation',
      condition: 'Briefing',
      commandAuthority: 'Operator',
      currentState: 'briefing',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    await expect(advanceMissionFromCommanderContinue(mission)).resolves.toMatchObject({
      id: 'mission-briefing',
      currentState: 'ready',
      condition: 'Ready',
    });
  });

  it('routes Commander Continue into War Room before authorization and avoids skipping authorization', async () => {
    const mission: ActiveMission = {
      id: 'mission-authorization',
      campaign: 'Foundation',
      objective: 'Authorize deliberately',
      condition: 'Authorization',
      commandAuthority: 'Operator',
      currentState: 'authorization',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    expect(getCommanderContinueMode(mission, 'observation', 'war-room')).toBe('advance-mission');
    expect(getCommanderContinueMode(mission, 'war-room', 'war-room')).toBe('advance-mission');
    await expect(advanceMissionFromCommanderContinue(mission)).resolves.toBeUndefined();
  });

  it('parses explicit Commander room routing transmissions without treating notes as navigation', () => {
    expect(parseCommanderRoomNavigationTransmission('open journal')).toBe('journal');
    expect(parseCommanderRoomNavigationTransmission('go to archive')).toBe('archive');
    expect(parseCommanderRoomNavigationTransmission('enter observation room')).toBe('observation');
    expect(parseCommanderRoomNavigationTransmission('show guardian wing')).toBe('guardian');
    expect(parseCommanderRoomNavigationTransmission('move to war room')).toBe('war');
    expect(parseCommanderRoomNavigationTransmission('route to command center')).toBe('command');
    expect(parseCommanderRoomNavigationTransmission('journal')).toBeUndefined();
    expect(parseCommanderRoomNavigationTransmission('observation note: wait for evidence')).toBeUndefined();
  });

  it('recognizes explicit Commander abort transmissions without matching ordinary mission text', () => {
    expect(isAbortMissionTransmission('abort mission')).toBe(true);
    expect(isAbortMissionTransmission('mission abort')).toBe(true);
    expect(isAbortMissionTransmission('scrub mission')).toBe(true);
    expect(isAbortMissionTransmission('terminate mission')).toBe(true);
    expect(isAbortMissionTransmission('mission objective is still valid')).toBe(false);
    expect(isAbortMissionTransmission('abortive price action is not enough')).toBe(false);
  });

  it('archives an active mission through the desktop abort fallback', async () => {
    const mission: ActiveMission = {
      id: 'mission-abort',
      campaign: 'Foundation',
      objective: 'Stop when invalidated',
      condition: 'Observation',
      commandAuthority: 'Operator',
      currentState: 'observation',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    await expect(abortDesktopMission(mission)).resolves.toMatchObject({
      id: 'mission-abort',
      currentState: 'archived',
      condition: 'Archived',
    });
  });

  it('clears the active mission after archive so a new mission can be created', () => {
    const archivedMission: ActiveMission = {
      id: 'mission-archived',
      campaign: 'Foundation',
      objective: 'Finish cleanly',
      condition: 'Archived',
      commandAuthority: 'Operator',
      currentState: 'archived',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    expect(getActiveMissionAfterMissionChange(archivedMission)).toBeUndefined();
    expect(getActiveMissionAfterMissionChange({
      ...archivedMission,
      condition: 'Debrief',
      currentState: 'debrief',
    })).toMatchObject({
      id: 'mission-archived',
      currentState: 'debrief',
    });
  });

  it('updates Commander guidance from mission lifecycle state', () => {
    const mission: ActiveMission = {
      id: 'mission-authorization',
      campaign: 'Foundation',
      objective: 'Hold the line',
      condition: 'Authorization',
      commandAuthority: 'Operator',
      currentState: 'authorization',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    expect(getCommanderMessage().title).toBe('Report accepted. Stand by for tasking.');
    expect(getCommanderMessage(mission)).toEqual({
      title: 'Authorization required.',
      body: 'Provide justification and invalidation before deployment can be declared.',
    });
  });

  it('keeps Mission Room lifecycle visibility progressive', () => {
    const mission: ActiveMission = {
      id: 'mission-observation',
      campaign: 'Foundation',
      objective: 'Observe the setup',
      condition: 'Observation',
      commandAuthority: 'Operator',
      currentState: 'observation',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    expect(buildVisibleMissionLifecycleSteps(mission).map((step) => step.state)).toEqual([
      'idle',
      'briefing',
      'ready',
      'observation',
    ]);
    expect(getMissionPhaseWorkspaceTitle()).toBe('Mission Creation');
    expect(getMissionPhaseWorkspaceTitle(mission)).toBe('Observation');
    expect(getMissionPhaseWorkspaceDescription(mission)).toBe('Complete observation and move to authorization.');
  });

  it('keeps the Headquarters overview focused on operator guidance', () => {
    const mission: ActiveMission = {
      id: 'mission-001',
      campaign: 'Foundation',
      objective: 'Hold the line',
      condition: 'Ready',
      commandAuthority: 'Operator',
      currentState: 'ready',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    expect(getMissionNotificationSummary(undefined, [])).toBe('No active mission');
    expect(getMissionNotificationSummary(mission, [mission])).toBe('1 mission record tracked');
  });

  it('promotes doctrine candidates through the desktop bridge only with complete evidence context', async () => {
    const originalWindow = globalThis.window;
    const promotedRecord = {
      id: 'doctrine-001',
      title: 'Wait for confirmation',
      summary: 'Wait for confirmation before entry.',
      confidence: 'validated' as const,
      source: {
        sourceType: 'journal_entry' as const,
        sourceId: 'journal-001',
        excerpt: 'Wait for confirmation before entry.',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const historyEntry = {
      id: 'history-001',
      doctrineId: 'doctrine-001',
      action: 'promoted' as const,
      summary: 'Promoted candidate to doctrine: Wait for confirmation',
      occurredAt: '2026-01-01T00:00:00.000Z',
    };

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        headquarters: {
          promoteDoctrineCandidate: async () => ({ record: promotedRecord, historyEntry }),
        },
      },
    });

    await expect(promoteDesktopDoctrineCandidate({
      candidateId: 'candidate-001',
      title: 'Wait for confirmation',
      summary: 'Wait for confirmation before entry.',
      sourceId: 'journal-001',
      archiveId: 'archive-001',
      excerpt: 'Wait for confirmation before entry.',
      triggerCondition: 'Entry consideration before confirmation is visible.',
      expectedBehavior: 'Wait and collect evidence before authorization.',
    })).resolves.toEqual({ record: promotedRecord, historyEntry });
    await expect(promoteDesktopDoctrineCandidate({
      candidateId: 'candidate-placeholder',
      title: 'Doctrine candidate requires review',
      summary: 'Possible operating rule',
      sourceId: 'journal-001',
      archiveId: 'archive-001',
      excerpt: 'Wait for confirmation before entry.',
    })).resolves.toBeUndefined();
    await expect(promoteDesktopDoctrineCandidate({
      candidateId: '',
      title: 'Wait for confirmation',
      summary: 'Wait for confirmation before entry.',
      sourceId: 'journal-001',
      archiveId: 'archive-001',
      excerpt: 'Wait for confirmation before entry.',
    })).resolves.toBeUndefined();

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });
  });

  it('builds Doctrine candidates with reviewable evidence and Commander summary content', () => {
    const candidate = createDesktopDoctrineCandidateFromDraft({
      candidateId: 'candidate-001',
      title: 'Wait for opening volatility to stabilize',
      summary: 'Do not take the first available entry during disorderly market-open conditions.',
      sourceId: 'journal-001',
      archiveId: 'archive-001',
      excerpt: 'Wait for markets to open, preferably until initial volatility settles.',
      triggerCondition: 'Abnormal or disorderly market opening.',
      expectedBehavior: 'Wait and collect evidence before authorization.',
      exceptionOrBoundary: 'The rule does not block entries after conditions stabilize.',
      proposedScope: 'Market-open missions during abnormal volatility.',
    }, { createdAt: '2026-07-01T00:00:00.000Z' });

    expect(candidate.proposedRule).toContain('Do not take the first available entry');
    expect(candidate.source.excerpt).toContain('Wait for markets to open');
    expect(candidate.status).toBe('pending_review');
  });

  it('builds a read-only doctrine diff preview when two doctrine records are present', () => {
    const firstRecord = {
      id: 'doctrine-001',
      title: 'Wait for confirmation',
      summary: 'Wait for confirmation before entry.',
      confidence: 'candidate' as const,
      source: {
        sourceType: 'journal_entry' as const,
        sourceId: 'journal-001',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const secondRecord = {
      ...firstRecord,
      id: 'doctrine-002',
      title: 'Wait for clean confirmation',
      confidence: 'validated' as const,
    };

    expect(buildDoctrineDiffPreview([])).toBeUndefined();
    expect(buildDoctrineDiffPreview([firstRecord, secondRecord])?.changes).toEqual([
      {
        field: 'title',
        before: 'Wait for confirmation',
        after: 'Wait for clean confirmation',
      },
      {
        field: 'confidence',
        before: 'candidate',
        after: 'validated',
      },
    ]);
  });

  it('builds read-only trading plan doctrine references from accepted doctrine', () => {
    const validatedRecord = {
      id: 'doctrine-001',
      title: 'Follow the plan',
      summary: 'Follow the trading plan instead of improvising.',
      confidence: 'validated' as const,
      source: {
        sourceType: 'journal_entry' as const,
        sourceId: 'journal-001',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const candidateRecord = {
      ...validatedRecord,
      id: 'doctrine-002',
      confidence: 'candidate' as const,
    };

    expect(buildDefaultTradingPlanDoctrineReferences([candidateRecord, validatedRecord])).toEqual([
      {
        tradingPlanId: 'primary-trading-plan',
        tradingPlanName: 'Primary Trading Plan',
        doctrineId: 'doctrine-001',
        title: 'Follow the plan',
        summary: 'Follow the trading plan instead of improvising.',
        sourceId: 'journal-001',
      },
    ]);
  });

  it('formats startup status dashboard states deterministically', () => {
    const loadingStatus: StartupStatus = {
      state: 'loading',
      database: {
        connected: false,
      },
      migrations: {
        applied: [],
        skipped: [],
      },
    };
    const readyStatus: StartupStatus = {
      state: 'ready',
      database: {
        connected: true,
        path: 'local.db',
      },
      migrations: {
        applied: ['001_initial'],
        skipped: ['002_archive'],
      },
    };
    const failedStatus: StartupStatus = {
      state: 'failed',
      database: {
        connected: false,
      },
      migrations: {
        applied: [],
        skipped: [],
      },
      error: 'startup failed',
    };

    expect(formatHqosStatus(loadingStatus)).toBe('Starting');
    expect(formatDatabaseStatus(loadingStatus)).toBe('Checking');
    expect(formatMigrationStatus(loadingStatus)).toBe('Pending');

    expect(formatHqosStatus(readyStatus)).toBe('Ready');
    expect(formatDatabaseStatus(readyStatus)).toBe('Connected');
    expect(formatMigrationStatus(readyStatus)).toBe('1 applied, 1 current');

    expect(formatHqosStatus(failedStatus)).toBe('Limited');
    expect(formatDatabaseStatus(failedStatus)).toBe('Offline');
    expect(formatMigrationStatus(failedStatus)).toBe('Not applied');
    expect(formatStartupError(failedStatus)).toBe('startup failed');
  });

  it('transitions from security checkpoint to command center', () => {
    expect(reportForDuty('security-checkpoint')).toEqual({
      from: 'security-checkpoint',
      to: 'command-center',
      changed: true,
    });
  });

  it('keeps command center phase stable after reporting for duty', () => {
    expect(reportForDuty('command-center')).toEqual({
      from: 'command-center',
      to: 'command-center',
      changed: false,
    });
  });

  it('keeps repeated report-for-duty activation idempotent', () => {
    const firstTransition = reportForDuty('security-checkpoint');
    const repeatedTransition = reportForDuty(firstTransition.to);

    expect(firstTransition.to).toBe('command-center');
    expect(repeatedTransition).toEqual({
      from: 'command-center',
      to: 'command-center',
      changed: false,
    });
  });

  it('renders the Commander command bridge in the command center placeholder', () => {
    const html = renderToStaticMarkup(<CommandCenterPlaceholder />);

    expect(html).toContain('data-layout="command-center"');
    expect(html).toContain('Commander Briefing');
    expect(html).toContain('aria-label="Commander briefing"');
    expect(html).toContain('aria-label="Morning Brief"');
    expect(html).toContain('aria-label="Mission Record"');
    expect(html).toContain('aria-label="Intelligent Situation Board"');
    expect(html).toContain('aria-label="Operational Message History"');
    expect(html).toContain('aria-label="Services Health Dashboard"');
    expect(html).toContain('No mission loaded');
    expect(html).toContain('Create Mission');
    expect(html).toContain('Headquarters core systems are ready.');
    expect(html).not.toContain('Mission Debrief');
  });

  it('creates a local mission from operator input', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    expect(mission).toEqual({
      id: 'mission-001',
      campaign: 'Foundation Patrol',
      objective: 'Hold the line',
      condition: 'Briefing',
      commandAuthority: 'Professional command',
      currentState: 'briefing',
      createdAt: '2026-01-01T00:00:00.000Z',
      briefingContext: {
        missionObjective: 'Hold the line',
      },
      missionContext: {
        missionId: 'mission-001',
        briefing: {
          missionObjective: 'Hold the line',
        },
        observation: {},
        commanderNotes: [],
        contradictionFlags: [],
        readiness: {
          briefingComplete: false,
          debriefReady: false,
          observationComplete: false,
          warRoomReady: false,
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
  });

  it('maps a persisted mission record into active desktop mission context', () => {
    expect(mapMissionRecordToActiveMission({
      id: 'mission-001',
      codename: 'Foundation Patrol',
      objective: 'Hold the line',
      state: 'idle',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })).toEqual({
      id: 'mission-001',
      campaign: 'Foundation Patrol',
      objective: 'Hold the line',
      condition: 'Idle',
      commandAuthority: 'Professional command',
      currentState: 'idle',
      createdAt: '2026-01-01T00:00:00.000Z',
      missionContext: {
        missionId: 'mission-001',
        briefing: {},
        observation: {},
        commanderNotes: [],
        contradictionFlags: [],
        readiness: {
          briefingComplete: false,
          debriefReady: false,
          observationComplete: false,
          warRoomReady: false,
        },
        timing: {
          lifecycleStageEntries: [
            { stage: 'idle', enteredAt: '2026-01-01T00:00:00.000Z' },
          ],
          operationalState: 'idle',
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
  });

  it('hydrates persisted mission context into briefing and observation state after reload', () => {
    const contextByMissionId = buildMissionContextLookup([{
      missionId: 'mission-001',
      contextJson: JSON.stringify({
        missionId: 'mission-001',
        briefing: {
          missionObjective: 'Wait for clean confirmation.',
          market: 'NQ',
          marketEnvironment: 'Range.',
          highImpactNews: 'None.',
          personalReadiness: 'Focused.',
          riskParameters: '1%.',
          successCriteria: 'No trade unless evidence confirms.',
        },
        observation: {
          observedDirection: 'Sideways.',
          marketStructure: 'Range.',
          volume: 'Light.',
          liquidityNotes: 'Above prior high.',
          keyLevels: 'Prior high and value low.',
          directionalHypothesis: 'Breakout only above prior high.',
          invalidationEvidence: 'Failure back inside range.',
          emotionalCheck: 'Calm.',
          evidenceReadiness: 'yes',
          operationalSummary: 'Range remains controlled.',
        },
        commanderNotes: [],
        contradictionFlags: [],
        readiness: {
          briefingComplete: true,
          observationComplete: true,
          warRoomReady: true,
          debriefReady: false,
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:15:00.000Z',
      }),
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:15:00.000Z',
    }]);

    const activeMission = mapMissionRecordToActiveMission({
      id: 'mission-001',
      codename: 'Memory Mission',
      objective: 'Persist mission context.',
      state: 'authorization',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:15:00.000Z',
    }, undefined, contextByMissionId.get('mission-001'));

    expect(activeMission.briefingContext?.market).toBe('NQ');
    expect(activeMission.observationContext?.marketDirection).toBe('Sideways.');
    expect(activeMission.observationContext?.readiness).toBe('yes');
    expect(activeMission.missionContext?.readiness.warRoomReady).toBe(true);
    expect(buildDesktopMissionIntelligencePackage(activeMission).missingEvidence).toEqual([]);
  });

  it('stores Ready Room briefing answers in mission context memory', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (mission === undefined) throw new Error('Expected local mission fixture to be created.');

    const missionWithBriefing = withBriefingMissionContext(mission, {
      missionObjective: 'Trade the morning breakout.',
      market: 'ES futures.',
      marketEnvironment: 'Trending.',
      highImpactNews: 'None.',
      personalReadiness: 'Focused.',
      riskParameters: '1%.',
      successCriteria: 'Follow the plan.',
    }, { updatedAt: '2026-01-01T00:03:00.000Z' });

    expect(missionWithBriefing.missionContext?.briefing).toEqual({
      missionObjective: 'Trade the morning breakout.',
      market: 'ES futures.',
      marketEnvironment: 'Trending.',
      highImpactNews: 'None.',
      personalReadiness: 'Focused.',
      riskParameters: '1%.',
      successCriteria: 'Follow the plan.',
    });
    expect(missionWithBriefing.missionContext?.readiness.briefingComplete).toBe(true);
    expect(missionWithBriefing.missionContext?.updatedAt).toBe('2026-01-01T00:03:00.000Z');
  });

  it('stores Observation evidence in mission context memory and unlocks War Room readiness', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (mission === undefined) throw new Error('Expected local mission fixture to be created.');

    const missionWithObservation = withObservationMissionContext({
      ...mission,
      currentState: 'observation',
    }, {
      marketDirection: 'Up.',
      marketStructure: 'Higher highs.',
      volume: 'Rising.',
      liquidity: 'Above prior high.',
      keyLevels: 'VWAP and prior high.',
      bias: 'Long continuation.',
      invalidationEvidence: 'Break below VWAP.',
      emotionalCheck: 'Focused.',
      readiness: 'yes',
      operationalPicture: 'Trend up, liquidity above, invalidation below VWAP.',
    }, { updatedAt: '2026-01-01T00:07:00.000Z' });

    expect(missionWithObservation.missionContext?.observation).toEqual({
      observedDirection: 'Up.',
      marketStructure: 'Higher highs.',
      volume: 'Rising.',
      liquidityNotes: 'Above prior high.',
      keyLevels: 'VWAP and prior high.',
      directionalHypothesis: 'Long continuation.',
      invalidationEvidence: 'Break below VWAP.',
      emotionalCheck: 'Focused.',
      evidenceReadiness: 'yes',
      operationalSummary: 'Trend up, liquidity above, invalidation below VWAP.',
    });
    expect(missionWithObservation.missionContext?.readiness.observationComplete).toBe(true);
    expect(missionWithObservation.missionContext?.readiness.warRoomReady).toBe(true);
    expect(missionWithObservation.missionContext?.updatedAt).toBe('2026-01-01T00:07:00.000Z');
  });

  it('creates a desktop mission through the Headquarters bridge when available', async () => {
    const originalWindow = globalThis.window;
    const headquartersWindow = {
      headquarters: {
        createMission: async () => ({
          mission: {
            id: 'mission-001',
            codename: 'Foundation Patrol',
            objective: 'Hold the line',
            state: 'idle' as const,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      },
    } as unknown as Window & typeof globalThis;

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: headquartersWindow,
    });

    try {
      await expect(createDesktopMission({
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      })).resolves.toEqual({
        id: 'mission-001',
        campaign: 'Foundation Patrol',
        objective: 'Hold the line',
        condition: 'Idle',
        commandAuthority: 'Professional command',
        currentState: 'idle',
        createdAt: '2026-01-01T00:00:00.000Z',
        missionContext: {
          missionId: 'mission-001',
          briefing: {},
          observation: {},
          commanderNotes: [],
          contradictionFlags: [],
          readiness: {
            briefingComplete: false,
            debriefReady: false,
            observationComplete: false,
            warRoomReady: false,
          },
          timing: {
            lifecycleStageEntries: [
              { stage: 'idle', enteredAt: '2026-01-01T00:00:00.000Z' },
            ],
            operationalState: 'idle',
          },
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      });
    } finally {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      });
    }
  });

  it('does not create a local mission without codename and objective', () => {
    expect(createLocalMission({ codename: '', objective: 'Hold the line' })).toBeUndefined();
    expect(createLocalMission({ codename: 'Foundation Patrol', objective: ' ' })).toBeUndefined();
  });

  it('evaluates mission authorization with deterministic rule-based results', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    const missionWithContext = withObservationMissionContext(
      withBriefingMissionContext(mission, {
        missionObjective: 'Hold the line',
        market: 'ES futures',
        marketEnvironment: 'Range with clear boundaries',
        highImpactNews: 'None',
        personalReadiness: 'focused',
        riskParameters: '1%',
        successCriteria: 'No trade unless the plan confirms.',
      }),
      {
        marketDirection: 'Sideways',
        marketStructure: 'Range',
        volume: 'Normal',
        liquidity: 'Resting above prior high and below prior low',
        keyLevels: 'Prior high and prior low',
        bias: 'Neutral until range break',
        invalidationEvidence: 'Exit if structure breaks.',
        emotionalCheck: 'calm',
        readiness: 'yes',
        operationalPicture: 'Range structure, normal volume, and clear invalidation are present.',
      },
    );

    const approved = evaluateLocalMissionAuthorization(missionWithContext, {
      operatorJustification: 'Setup matches the plan.',
      invalidation: 'Exit if structure breaks.',
      protectiveRule: 'No trade after failed acceptance.',
    });
    const deniedWithoutContext = evaluateLocalMissionAuthorization(mission, {
      operatorJustification: 'Setup matches the plan.',
      invalidation: 'Exit if structure breaks.',
      protectiveRule: 'No trade after failed acceptance.',
    });
    const denied = evaluateLocalMissionAuthorization(mission, {
      operatorJustification: 'Setup matches the plan.',
      invalidation: '',
      protectiveRule: 'No trade after failed acceptance.',
    });
    const deniedWithoutRule = evaluateLocalMissionAuthorization(mission, {
      operatorJustification: 'Setup matches the plan.',
      invalidation: 'Exit if structure breaks.',
    });
    const deniedWithShallowRule = evaluateLocalMissionAuthorization(missionWithContext, {
      operatorJustification: 'qwer',
      invalidation: 'Exit if structure breaks.',
      protectiveRule: 'asdf',
    });

    expect(approved).toEqual({
      missionId: 'mission-001',
      decision: 'approved',
      reason: 'Operational briefing, observation evidence, invalidation, and protective rule are complete.',
    });
    expect(formatAuthorizationStatus(approved)).toBe('Authorization approved');

    expect(deniedWithoutContext).toEqual({
      missionId: 'mission-001',
      decision: 'denied',
      reason: 'Authorization blocked: complete the Ready Room operational briefing; state the operating market; state the risk ceiling; complete the Observation evidence interview; summarize the Observation evidence package; mission intelligence is still incomplete.',
    });
    expect(denied).toEqual({
      missionId: 'mission-001',
      decision: 'denied',
      reason: 'Authorization blocked: complete the Ready Room operational briefing; state the operating market; state the risk ceiling; complete the Observation evidence interview; summarize the Observation evidence package; state invalidation evidence; mission intelligence is still incomplete.',
    });
    expect(deniedWithoutRule?.decision).toBe('denied');
    expect(deniedWithShallowRule?.decision).toBe('denied');
    expect(deniedWithShallowRule?.reason).toContain('protective rule must name the risk, stop, invalidation, plan, doctrine, or no-trade boundary');
    expect(formatAuthorizationStatus(denied)).toBe('Authorization denied');
    expect(evaluateLocalMissionAuthorization(undefined, {
      operatorJustification: 'Setup matches the plan.',
      invalidation: 'Exit if structure breaks.',
      protectiveRule: 'No trade after failed acceptance.',
    })).toBeUndefined();
  });

  it('does not project deployed lifecycle without an active mission and uses deliberate deployed actions', () => {
    expect(formatMissionLifecycleSummary(undefined)).not.toContain('Deployed');

    const mission = createLocalMission(
      {
        codename: 'Deployed Patrol',
        objective: 'Execute only the declared plan',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-deployed',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    const deployedMission: ActiveMission = {
      ...mission,
      currentState: 'deployed',
      condition: 'Deployed',
    };
    const action = getMissionNextAction(deployedMission);

    expect(formatMissionLifecycleSummary(deployedMission)).toBe('Current station: War Room Deployment');
    expect(action.label).toBe('Plan Concluded');
    expect(action.buttonLabel).toBe('Plan Concluded');
    expect(action.description).toContain('explicitly concluded');
  });

  it('preserves mission intelligence context when bridge records advance lifecycle rooms', () => {
    const baseMission = createLocalMission(
      {
        codename: 'Continuity Drill',
        objective: 'Keep intelligence continuous.',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-continuity',
      },
    );

    if (!baseMission) throw new Error('Expected local mission to be created');

    const mission = withObservationMissionContext(
      withBriefingMissionContext(baseMission, {
        missionObjective: 'Keep intelligence continuous.',
        market: 'Crypto',
        marketEnvironment: 'calm weekend',
        highImpactNews: 'No news event',
        personalReadiness: 'calm',
        riskParameters: '300',
        successCriteria: 'No FOMO long',
      }),
      {
        marketDirection: 'upwards',
        marketStructure: 'HTF bullish, LTF bearish',
        volume: 'low',
        liquidity: 'above the highs',
        keyLevels: 'VAL and VAH',
        bias: 'long',
        invalidationEvidence: 'sweep of the highs',
        emotionalCheck: 'unchanged',
        readiness: 'yes',
        operationalPicture: 'Long idea only if structure confirms and invalidation remains clear.',
      },
    );
    const before = buildDesktopMissionIntelligencePackage(mission);
    const transitioned = mapMissionRecordToActiveMission({
      id: mission.id,
      codename: mission.campaign,
      objective: mission.objective,
      state: 'authorization',
      createdAt: mission.createdAt,
      updatedAt: mission.createdAt,
    }, mission);
    const after = buildDesktopMissionIntelligencePackage(transitioned);

    expect(after.confidence.score).toBeGreaterThanOrEqual(before.confidence.score);
    expect(after.market).toBe('Crypto');
    expect(after.invalidation).toBe('sweep of the highs');
    expect(after.missingEvidence.map((item) => item.field)).not.toContain('market');
  });

  it('renders an active mission on the Mission Board', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    const html = renderToStaticMarkup(<CommandCenter activeMission={mission} />);

    expect(html).toContain('Foundation Patrol');
    expect(html).toContain('mission-001');
    expect(html).toContain('Hold the line');
    expect(html).toContain('Briefing');
    expect(html).toContain('Professional command');
    expect(html).toContain('2026-01-01T00:00:00.000Z');
    expect(html).toContain('Active mission open');
  });

  it('formats read-only mission details from typed mission data', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    expect(formatMissionDetailValue(mission.id)).toBe('mission-001');
    expect(formatMissionDetailValue('')).toBe('Not available');
    expect(formatMissionDetailValue(undefined)).toBe('Not available');
    expect(formatMissionDetailState(mission)).toBe('Briefing');
    expect(formatMissionDetailState(undefined)).toBe('No mission loaded');
  });

  it('renders mission details as a read-oriented surface', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    const html = renderToStaticMarkup(<CommandCenter activeMission={mission} />);

    expect(html).toContain('aria-label="Mission details"');
    expect(html).toContain('Mission ID');
    expect(html).toContain('mission-001');
    expect(html).toContain('Current State');
    expect(html).toContain('Briefing');
  });

  it('updates local mission display to return-to-base closing state', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    const closingMission = requestLocalReturnToBase(mission);

    expect(closingMission).toEqual({
      ...mission,
      condition: 'Closing',
      currentState: 'return_to_base',
    });
    expect(formatMissionClosingState(closingMission)).toBe('Returning to base');
    expect(formatMissionLifecycleSummary(closingMission)).toBe('Current station: Debrief Theater Return');
    expect(getMissionLifecycleStation('authorization')).toBe('War Room Authorization');
  });

  it('keeps return-to-base helper safe when no mission is loaded', () => {
    expect(requestLocalReturnToBase(undefined)).toBeUndefined();
    expect(formatMissionClosingState(undefined)).toBe('No mission loaded');
    expect(formatMissionLifecycleSummary(undefined)).toBe('Mission route standing by');
  });

  it('builds a read-only mission lifecycle path without transition rules', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    expect(buildMissionLifecycleSteps(undefined).map((step) => step.status)).toEqual([
      'current',
      'pending',
      'pending',
      'pending',
      'pending',
      'pending',
      'pending',
      'pending',
      'pending',
    ]);

    expect(buildMissionLifecycleSteps(mission)).toEqual([
      { state: 'idle', label: 'Idle', status: 'completed' },
      { state: 'briefing', label: 'Briefing', status: 'current' },
      { state: 'ready', label: 'Ready', status: 'pending' },
      { state: 'observation', label: 'Observation', status: 'pending' },
      { state: 'authorization', label: 'Authorization', status: 'pending' },
      { state: 'deployed', label: 'Deployed', status: 'pending' },
      { state: 'return_to_base', label: 'Return To Base', status: 'pending' },
      { state: 'debrief', label: 'Debrief', status: 'pending' },
      { state: 'archived', label: 'Archived', status: 'pending' },
    ]);
    expect(formatMissionLifecycleStepStatus('completed')).toBe('Complete');
    expect(formatMissionLifecycleStepStatus('current')).toBe('Current');
    expect(formatMissionLifecycleStepStatus('pending')).toBe('Pending');
  });

  it('renders lifecycle progress for an active mission', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    const html = renderToStaticMarkup(<CommandCenter activeMission={markLocalMissionArchived(mission)} />);

    expect(html).toContain('aria-label="Mission lifecycle"');
    expect(html).toContain('Operational Sequence');
    expect(html).toContain('Archive Vault');
    expect(html).toContain('data-step-status="completed"');
    expect(html).toContain('data-step-status="current"');
    expect(html).toContain('Current station: Archive Vault');
  });

  it('creates a local behavior-first mission debrief', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    const debrief = createLocalDebrief(
      mission,
      {
        behaviorSummary: 'Stayed patient through the close.',
        disciplineNotes: 'Followed the stop plan.',
        lesson: 'Write invalidation before deployment.',
      },
      {
        createdAt: '2026-01-01T00:10:00.000Z',
        id: 'debrief-001',
      },
    );

    expect(debrief).toEqual({
      id: 'debrief-001',
      missionId: 'mission-001',
      behaviorSummary: 'Stayed patient through the close.',
      disciplineNotes: 'Followed the stop plan.',
      lesson: 'Write invalidation before deployment.',
      createdAt: '2026-01-01T00:10:00.000Z',
    });
    expect(formatDebriefStatus(debrief)).toBe('Debrief saved');
  });

  it('does not create a local debrief without mission and behavior fields', () => {
    const mission = createLocalMission({ codename: 'Foundation Patrol', objective: 'Hold the line' });

    expect(createLocalDebrief(undefined, {
      behaviorSummary: 'Stayed patient.',
      disciplineNotes: 'Followed plan.',
      lesson: 'Prepare earlier.',
    })).toBeUndefined();
    expect(createLocalDebrief(mission, {
      behaviorSummary: '',
      disciplineNotes: 'Followed plan.',
      lesson: 'Prepare earlier.',
    })).toBeUndefined();
  });

  it('updates local mission display to debrief state after saving debrief', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    expect(markLocalMissionDebriefed(mission)).toEqual({
      ...mission,
      condition: 'Debrief',
      currentState: 'debrief',
    });
  });

  it('creates a local archived mission summary only after debrief', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    const debrief = createLocalDebrief(
      mission,
      {
        behaviorSummary: 'Stayed patient through the close.',
        disciplineNotes: 'Followed the stop plan.',
        lesson: 'Write invalidation before deployment.',
      },
      {
        createdAt: '2026-01-01T00:10:00.000Z',
        id: 'debrief-001',
      },
    );
    const archiveWrite = createArchiveWritePlaceholder(mission, {
      createdAt: '2026-01-01T00:01:00.000Z',
      id: 'archive-placeholder-001',
    });

    const summary = createLocalMissionArchiveSummary(mission, debrief, archiveWrite, {
      archivedAt: '2026-01-01T00:20:00.000Z',
    });

    expect(summary).toEqual({
      missionId: 'mission-001',
      codename: 'Foundation Patrol',
      archivedAt: '2026-01-01T00:20:00.000Z',
      eventCount: 2,
    });
    expect(formatArchiveSummaryStatus(summary)).toBe('Archived summary ready');
  });

  it('lists archived mission summaries without mutating the source array', () => {
    const summaries = [
      {
        missionId: 'mission-001',
        codename: 'Foundation Patrol',
        archivedAt: '2026-01-01T00:20:00.000Z',
        eventCount: 2,
      },
      {
        missionId: 'mission-002',
        codename: 'Second Patrol',
        archivedAt: '2026-01-01T00:30:00.000Z',
        eventCount: 1,
      },
    ];

    const listed = listArchivedMissionSummaries(summaries);
    const firstSummary = summaries[0];

    if (!firstSummary) throw new Error('Expected archived mission summary fixture');

    expect(listed).toEqual(summaries);
    expect(listed).not.toBe(summaries);
    expect(listArchivedMissionSummaries(undefined)).toEqual([]);
    expect(formatArchiveViewerStatus([])).toBe('No archived missions');
    expect(formatArchiveViewerStatus([firstSummary])).toBe('1 archived mission');
    expect(formatArchiveViewerStatus(summaries)).toBe('2 archived missions');
  });

  it('renders archived mission summaries in the archive viewer', () => {
    const summaries = [
      {
        missionId: 'mission-001',
        codename: 'Foundation Patrol',
        archivedAt: '2026-01-01T00:20:00.000Z',
        eventCount: 2,
      },
    ];

    const html = renderToStaticMarkup(<CommandCenter archivedMissionSummaries={summaries} />);

    expect(html).toContain('aria-label="Mission archive viewer"');
    expect(html).toContain('1 archived mission');
    expect(html).toContain('Foundation Patrol');
    expect(html).toContain('2 events');
    expect(html).toContain('2026-01-01T00:20:00.000Z');
  });

  it('derives read-only Archive event inspections for the Archive room explorer', () => {
    const archiveSummary = {
      missionId: 'mission-archive-001',
      codename: 'Foundation Patrol',
      archivedAt: '2026-01-01T00:20:00.000Z',
      eventCount: 2,
    };
    const archivedJournalEntry = {
      id: 'journal-archive-001',
      journalEntryId: 'journal-001',
      archivedAt: '2026-01-01T00:15:00.000Z',
      rawEntry: {
        id: 'journal-001',
        entryDate: '2026-01-01',
        rawContent: 'A controlled archive note.',
        source: 'manual' as const,
        attachmentReferences: [],
        classificationStatus: 'unclassified' as const,
        createdAt: '2026-01-01T00:10:00.000Z',
        updatedAt: '2026-01-01T00:10:00.000Z',
      },
      metadata: {
        classificationStatus: 'unclassified' as const,
        tags: ['reflection'],
      },
    };

    expect(buildDesktopArchiveEventInspections([archiveSummary], [archivedJournalEntry])).toEqual([
      {
        id: 'archive-event-journal-archive-001',
        type: 'archive.artifact_written',
        occurredAt: '2026-01-01T00:15:00.000Z',
        source: 'archives',
        priority: 'green',
        payloadPreview: 'classificationStatus, entryDate, tags',
      },
      {
        id: 'archive-event-mission-archive-001',
        type: 'mission.archived',
        occurredAt: '2026-01-01T00:20:00.000Z',
        source: 'archives',
        priority: 'green',
        missionId: 'mission-archive-001',
        payloadPreview: 'codename, eventCount',
      },
    ]);
  });

  it('handles the current empty desktop Archive session explorer state', () => {
    expect(buildDesktopArchiveSessionInspections()).toEqual([]);
  });

  it('builds a read-only Archive dashboard summary from desktop archive data', () => {
    const archiveSummary = {
      missionId: 'mission-archive-001',
      codename: 'Foundation Patrol',
      archivedAt: '2026-01-01T00:20:00.000Z',
      eventCount: 2,
    };

    expect(buildDesktopArchiveRecords([archiveSummary], [])).toEqual([
      {
        id: 'mission:mission-archive-001',
        type: 'mission',
        title: 'Foundation Patrol',
        summary: '2 archived mission events',
        occurredAt: '2026-01-01T00:20:00.000Z',
        tags: ['mission', 'archive'],
      },
    ]);
    expect(buildDesktopArchiveDashboard([archiveSummary], [])).toMatchObject({
      recordCount: 1,
      searchResultCount: 1,
      timelineItemCount: 1,
      eventCount: 1,
      sessionCount: 0,
      replayItemCount: 1,
      status: 'ready',
    });
  });

  it('builds desktop mission timeline entries in chronological order', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    const entries = buildDesktopMissionTimelineEntries({
      activeMission: markLocalMissionArchived(mission),
      authorizationStatus: {
        missionId: 'mission-001',
        decision: 'approved',
        reason: 'Manual authorization fields are complete.',
      },
      missionDebrief: {
        id: 'debrief-001',
        missionId: 'mission-001',
        behaviorSummary: 'Stayed patient.',
        disciplineNotes: 'Followed plan.',
        lesson: 'Prepare earlier.',
        createdAt: '2026-01-01T00:10:00.000Z',
      },
      archiveSummary: {
        missionId: 'mission-001',
        codename: 'Foundation Patrol',
        archivedAt: '2026-01-01T00:20:00.000Z',
        eventCount: 2,
      },
    });

    expect(entries.map((entry) => entry.eventId)).toEqual([
      'desktop-mission-001-created',
      'desktop-mission-001-authorization-approved',
      'desktop-mission-001-debrief',
      'desktop-mission-001-archived',
    ]);
    expect(entries.map((entry) => entry.occurredAt)).toEqual([
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:10:00.000Z',
      '2026-01-01T00:20:00.000Z',
    ]);
    const firstEntry = entries[0];

    if (!firstEntry) throw new Error('Expected first timeline entry fixture');

    expect(formatTimelineViewerStatus(entries)).toBe('4 timeline entries');
    expect(formatMissionTimelineTransition(firstEntry)).toBe('Idle to Archived');
  });

  it('handles empty and single-entry mission timelines', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    expect(buildDesktopMissionTimelineEntries({})).toEqual([]);

    const entries = buildDesktopMissionTimelineEntries({ activeMission: mission });

    expect(entries).toHaveLength(1);
    expect(formatTimelineViewerStatus([])).toBe('No timeline entries');
    expect(formatTimelineViewerStatus(entries)).toBe('1 timeline entry');
  });

  it('renders mission timeline entries in the timeline viewer', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    const html = renderToStaticMarkup(<CommandCenter activeMission={mission} />);

    expect(html).toContain('aria-label="Mission timeline viewer"');
    expect(html).toContain('1 timeline entry');
    expect(html).toContain('Idle to Briefing');
    expect(html).toContain('Mission created');
  });

  it('tracks mission history snapshots without mutating source arrays', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    const history = upsertMissionHistory([], mission);
    const closingMission = requestLocalReturnToBase(mission);

    if (!closingMission) throw new Error('Expected closing mission fixture');

    const updatedHistory = upsertMissionHistory(history, closingMission);
    const listedHistory = listMissionHistory(updatedHistory);

    expect(history).toEqual([mission]);
    expect(updatedHistory).toEqual([closingMission]);
    expect(listedHistory).toEqual(updatedHistory);
    expect(listedHistory).not.toBe(updatedHistory);
    expect(listMissionHistory(undefined)).toEqual([]);
    expect(formatMissionHistoryStatus([])).toBe('No mission history');
    expect(formatMissionHistoryStatus(updatedHistory)).toBe('1 mission recorded');
  });

  it('appends multiple missions to history in creation order', () => {
    const firstMission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );
    const secondMission = createLocalMission(
      {
        codename: 'Second Patrol',
        objective: 'Review the close',
      },
      {
        createdAt: '2026-01-01T00:30:00.000Z',
        id: 'mission-002',
      },
    );

    if (!firstMission || !secondMission) throw new Error('Expected mission history fixtures');

    const history = upsertMissionHistory(upsertMissionHistory([], firstMission), secondMission);

    expect(history.map((mission) => mission.id)).toEqual(['mission-001', 'mission-002']);
    expect(formatMissionHistoryStatus(history)).toBe('2 missions recorded');
  });

  it('renders mission history as a read-only surface', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    const html = renderToStaticMarkup(<CommandCenter missionHistory={[mission]} />);

    expect(html).toContain('aria-label="Mission history"');
    expect(html).toContain('1 mission recorded');
    expect(html).toContain('Foundation Patrol');
    expect(html).toContain('Briefing');
    expect(html).toContain('2026-01-01T00:00:00.000Z');
  });

  it('does not create an archived mission summary before debrief', () => {
    const mission = createLocalMission({ codename: 'Foundation Patrol', objective: 'Hold the line' });

    expect(createLocalMissionArchiveSummary(mission, undefined, undefined)).toBeUndefined();
  });

  it('updates local mission display to archived state', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    expect(markLocalMissionArchived(mission)).toEqual({
      ...mission,
      condition: 'Archived',
      currentState: 'archived',
    });
  });

  it('creates a deterministic archive write placeholder for a local mission', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    const archiveWrite = createArchiveWritePlaceholder(mission, {
      createdAt: '2026-01-01T00:01:00.000Z',
      id: 'archive-placeholder-001',
    });

    expect(archiveWrite).toEqual({
      id: 'archive-placeholder-001',
      missionId: 'mission-001',
      status: 'queued',
      title: 'Foundation Patrol mission archive placeholder',
      createdAt: '2026-01-01T00:01:00.000Z',
    });
    expect(formatArchiveWriteStatus(archiveWrite)).toBe('Queued placeholder');
  });

  it('renders queued archive write placeholder state without persisting archive data', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    const archiveWrite = createArchiveWritePlaceholder(mission, {
      createdAt: '2026-01-01T00:01:00.000Z',
      id: 'archive-placeholder-001',
    });

    const html = renderToStaticMarkup(<CommandCenter activeMission={mission} archiveWrite={archiveWrite} />);

    expect(html).toContain('Archive Placeholder');
    expect(html).toContain('Queued placeholder');
    expect(html).toContain('Foundation Patrol mission archive placeholder');
  });
});
