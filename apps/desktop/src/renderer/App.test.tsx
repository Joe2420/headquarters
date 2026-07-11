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
  buildDesktopGuardianLockoutState,
  buildDesktopGrowthAnalysis,
  buildDesktopIntelligenceDashboard,
  buildDesktopIntelligenceEvidenceRecords,
  buildDesktopIntelligencePatterns,
  buildDesktopJournalClassifications,
  buildDesktopMissionIntelligencePackage,
  buildDesktopRepeatedMistakes,
  buildDesktopRepeatedSuccesses,
  createDesktopDoctrineCandidateFromDraft,
  buildDoctrineDiffPreview,
  buildMissionLifecycleSteps,
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
  });

  it('exposes Doctrine candidate review decisions through the Doctrine room', () => {
    const source = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');

    expect(source).toContain('aria-label="Doctrine candidate review"');
    expect(source).toContain('Approve Doctrine');
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
    expect(html).toContain('HQOS Status');
    expect(html).toContain('Database');
    expect(html).toContain('Startup');
    expect(html).toContain('Recovery standby while Headquarters checks local infrastructure.');
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
    expect(readyHtml).toContain('Begin Observation');
    expect(observationHtml).toContain('Observe quietly and collect evidence.');
    expect(observationHtml).toContain('Report only visible evidence. Prediction stays silent.');
    expect(observationHtml).not.toContain('Evaluate Authorization');
    expect(warHtml).toContain('Evaluate Authorization');
    expect(warHtml).toContain('Mission next action');
    expect(debriefHtml).toContain('Behavior Sequence');
    expect(debriefHtml).toContain('Mission next action');
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
    expect(warHtml).toContain('Mission Intelligence Summary');
    expect(warHtml).toContain('Based on this intelligence, why should Headquarters authorize execution?');
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

  it('derives and renders Guardian alerts in the Guardian room', () => {
    const alerts = buildDesktopGuardianAlerts();
    const lockout = buildDesktopGuardianLockoutState();
    const html = renderToStaticMarkup(<GuardianRoom />);

    expect(alerts.map((alert) => alert.priority)).toEqual(['low']);
    expect(lockout.status).toBe('unlocked');
    expect(html).toContain('data-room-id="guardian-room"');
    expect(html).toContain('Guardian Alerts');
    expect(html).toContain('CapitalVaultPanel');
    expect(html).toContain('JudgmentReservePanel');
    expect(html).toContain('SuccessProtocolPanel');
    expect(html).toContain('Rule Monitoring');
    expect(html).toContain('Lockout State');
  });

  it('derives Guardian alerts from mission context instead of static placeholder copy', () => {
    const alerts = buildDesktopGuardianAlerts({
      mission: {
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
      },
      currentRoom: 'war-room',
      operatorJustification: 'I need to rush this trade',
      protectiveRule: '',
    });

    expect(alerts.map((alert) => alert.message)).toContain('Risk boundary is not declared. Guardian will not clear aggressive authorization until risk is stated.');
    expect(alerts.map((alert) => alert.message)).toContain('Authorization is missing a protective rule. Guardian requires the rule before deployment authority is clean.');
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
    expect(html).toContain('Readiness Checklist');
    expect(html).toContain('Daily Orders');
    expect(html).toContain('Command Oath');
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
    expect(html).toContain('Observation Timer');
    expect(html).toContain('Compass Indicator');
    expect(html).toContain('Artificial Horizon');
    expect(html).toContain('Silence State');
    expect(html).toContain('Headquarters observes and records');
  });

  it('renders the War Room authorization boundary without broker control', () => {
    const mission = createLocalMission(
      { codename: 'Foundation Patrol', objective: 'Hold the line' },
      { createdAt: '2026-01-01T00:00:00.000Z', id: 'mission-001' },
    );

    if (!mission) throw new Error('Expected local mission fixture');

    const html = renderToStaticMarkup(<WarRoom activeMission={{ ...mission, currentState: 'authorization' }} missionHistory={[mission]} />);

    expect(html).toContain('data-room-id="war-room"');
    expect(html).toContain('Mission Authorization');
    expect(html).toContain('War Table Projection');
    expect(html).toContain('Guardian Status');
    expect(html).toContain('Ghost Comparison');
    expect(html).toContain('Headquarters never places trades');
    expect(html).toContain('Mission Context');
    expect(html).toContain('Context incomplete');
    expect(html).toContain('Is this authorization based on your plan or on pressure?');
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
    expect(html).toContain('High volatility expansion above VWAP.');
    expect(html).toContain('Long continuation.');
    expect(html).toContain('Break below VWAP.');
    expect(html).toContain('Commander Challenge');
    expect(html).toContain('This conflicts with your earlier briefing.');
    expect(html).toContain('Which rule protects this decision?');
  });

  it('renders the Debrief Theater with timeline, black box, decision report, and debrief form boundary', () => {
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
    expect(html).toContain('Context Recall');
    expect(html).toContain('Context incomplete');
    expect(html).toContain('What did you execute well?');
    expect(html).toContain('Did you respect the risk parameter?');
    expect(html).toContain('Mission timeline viewer');
    expect(html).toContain('Black Box Viewer');
    expect(html).toContain('Decision Report');
    expect(html).toContain('Behavior Summary');
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
    expect(html).toContain('What should future Joe see first?');
  });

  it('keeps Headquarters overview focused on Commander guidance instead of dense subsystem panels', () => {
    const html = renderToStaticMarkup(<CommandCenterPlaceholder />);

    expect(html).toContain('Headquarters Overview');
    expect(html).toContain('aria-label="Commander guidance"');
    expect(html).toContain('aria-label="Commander daily briefing"');
    expect(html).toContain('Daily Briefing');
    expect(html).toContain('No active mission is loaded');
    expect(html).toContain('aria-label="Commander session debrief"');
    expect(html).toContain('Session Debrief');
    expect(html).toContain('distinct from mission debrief persistence');
    expect(html).toContain('aria-label="Commander weekly review"');
    expect(html).toContain('Weekly Review');
    expect(html).toContain('No approved weekly evidence is available yet');
    expect(html).toContain('aria-label="Commander monthly review"');
    expect(html).toContain('Monthly Review');
    expect(html).toContain('No traceable monthly evidence is available yet');
    expect(html).toContain('aria-label="Commander dashboard"');
    expect(html).toContain('Commander Dashboard');
    expect(html).toContain('No chat behavior');
    expect(html).toContain('No avatar behavior');
    expect(html).toContain('aria-label="Commander mission planning"');
    expect(html).toContain('Mission Planning');
    expect(html).toContain('No trade signals');
    expect(html).toContain('No bypass of HQOS mission logic');
    expect(html).toContain('aria-label="Commander objectives"');
    expect(html).toContain('Objectives');
    expect(html).toContain('No social mechanics');
    expect(html).toContain('No gamified scoring');
    expect(html).toContain('aria-label="Next required action"');
    expect(html).toContain('aria-label="Headquarters supporting information"');
    expect(html).toContain('Detailed workflow, timeline, and history live inside the Mission Room');
    expect(html).not.toContain('aria-label="Mission operations"');
    expect(html).not.toContain('Mission Debrief');
  });

  it('defines a deterministic guided Journal workflow sequence', () => {
    expect(getJournalWorkflowSteps().map((step) => step.id)).toEqual([
      'entry',
      'reflection',
      'trade-review',
      'growth',
      'timeline',
      'search',
      'archive',
    ]);
    expect(getJournalCommanderPrompt('entry')).toBe('Start with the record. Capture what happened before judging it.');
    expect(getJournalCommanderPrompt('archive')).toBe('Archive only completed evidence. Keep raw journal history intact.');
  });

  it('renders Journal as a guided writing flow with one active workspace', () => {
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

    expect(html).toContain('Guided Journal');
    expect(html).toContain('aria-label="Journal Commander prompt"');
    expect(html).toContain('aria-current="step"');
    expect(html).toContain('aria-label="Journal entry"');
    expect(html).not.toContain('aria-label="Daily reflection"');
    expect(html).not.toContain('aria-label="Journal archive"');
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

    expect(html).toContain('Doctrine Review');
    expect(html).toContain('aria-label="Doctrine Commander prompt"');
    expect(html).toContain('Review the lesson before it becomes law.');
    expect(html).toContain('aria-label="Doctrine candidate review"');
    expect(html).toContain('Candidate incomplete. More evidence or clarification is required.');
    expect(html).toContain('Approve Doctrine');
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

    expect(getMissionNextAction().disabled).toBe(true);

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

  it('renders the Headquarters overview in the command center placeholder', () => {
    const html = renderToStaticMarkup(<CommandCenterPlaceholder />);

    expect(html).toContain('data-layout="command-center"');
    expect(html).toContain('Headquarters Overview');
    expect(html).toContain('Commander');
    expect(html).toContain('Current Mission');
    expect(html).toContain('Next Required Action');
    expect(html).toContain('HQOS');
    expect(html).toContain('No mission loaded');
    expect(html).toContain('No growth highlights yet');
    expect(html).toContain('No doctrine highlights yet');
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
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
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

    expect(approved).toEqual({
      missionId: 'mission-001',
      decision: 'approved',
      reason: 'Operational briefing, observation evidence, invalidation, and protective rule are complete.',
    });
    expect(formatAuthorizationStatus(approved)).toBe('Authorization approved');

    expect(deniedWithoutContext).toEqual({
      missionId: 'mission-001',
      decision: 'denied',
      reason: 'Authorization blocked: complete the Ready Room operational briefing; complete the Observation evidence interview; mission intelligence is still incomplete.',
    });
    expect(denied).toEqual({
      missionId: 'mission-001',
      decision: 'denied',
      reason: 'Authorization blocked: complete the Ready Room operational briefing; complete the Observation evidence interview; state invalidation evidence; mission intelligence is still incomplete.',
    });
    expect(deniedWithoutRule?.decision).toBe('denied');
    expect(formatAuthorizationStatus(denied)).toBe('Authorization denied');
    expect(evaluateLocalMissionAuthorization(undefined, {
      operatorJustification: 'Setup matches the plan.',
      invalidation: 'Exit if structure breaks.',
      protectiveRule: 'No trade after failed acceptance.',
    })).toBeUndefined();
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
      'pending',
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
