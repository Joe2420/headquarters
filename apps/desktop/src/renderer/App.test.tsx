import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  App,
  AcademyRoom,
  CommandCenter,
  CommandCenterPlaceholder,
  DoctrineRoom,
  GuardianRoom,
  JournalRoom,
  type ActiveMission,
  type StartupStatus,
  buildDefaultTradingPlanDoctrineReferences,
  buildDesktopAcademyDashboard,
  buildDesktopGuardianAlerts,
  buildDoctrineDiffPreview,
  buildMissionLifecycleSteps,
  buildVisibleMissionLifecycleSteps,
  buildDesktopMissionTimelineEntries,
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
  formatTimelineViewerStatus,
  getCommanderMessage,
  getJournalCommanderPrompt,
  getJournalWorkflowSteps,
  getMissionNextAction,
  getMissionNotificationSummary,
  getMissionPhaseWorkspaceDescription,
  getMissionPhaseWorkspaceTitle,
  getPrimaryNavigationItems,
  listArchivedMissionSummaries,
  listMissionHistory,
  mapMissionRecordToActiveMission,
  markLocalMissionArchived,
  markLocalMissionDebriefed,
  promoteDesktopDoctrineCandidate,
  reportForDuty,
  requestLocalReturnToBase,
  upsertMissionHistory,
} from './App';

describe('Desktop shell', () => {
  it('renders the security checkpoint startup surface', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('Headquarters');
    expect(html).toContain('Security Checkpoint');
    expect(html).toContain('REPORT FOR DUTY');
    expect(html).toContain('Status');
    expect(html).toContain('HQOS Status');
    expect(html).toContain('Database');
  });

  it('renders a lightweight primary navigation framework with command active', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('aria-label="Primary"');
    expect(html).toContain('data-nav-id="command"');
    expect(html).toContain('data-nav-id="missions"');
    expect(html).toContain('data-nav-id="journal"');
    expect(html).toContain('data-nav-id="academy"');
    expect(html).toContain('data-nav-id="doctrine"');
    expect(html).toContain('data-nav-id="guardian"');
    expect(html).toContain('data-nav-id="archive"');
    expect(html).toContain('data-nav-id="settings"');
    expect(html).toContain('aria-current="page"');
  });

  it('derives exactly one active primary navigation item', () => {
    const items = getPrimaryNavigationItems('command');

    expect(items).toEqual([
      { id: 'command', label: 'Command', active: true },
      { id: 'missions', label: 'Missions', active: false },
      { id: 'journal', label: 'Journal', active: false },
      { id: 'academy', label: 'Academy', active: false },
      { id: 'doctrine', label: 'Doctrine', active: false },
      { id: 'guardian', label: 'Guardian', active: false },
      { id: 'archive', label: 'Archive', active: false },
      { id: 'settings', label: 'Settings', active: false },
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
    const html = renderToStaticMarkup(<GuardianRoom />);

    expect(alerts.map((alert) => alert.priority)).toEqual(['low', 'medium']);
    expect(html).toContain('data-room-id="guardian-room"');
    expect(html).toContain('Guardian Alerts');
    expect(html).toContain('Rule Monitoring');
    expect(html).toContain('Risk Monitoring');
  });

  it('keeps Headquarters overview focused on Commander guidance instead of dense subsystem panels', () => {
    const html = renderToStaticMarkup(<CommandCenterPlaceholder />);

    expect(html).toContain('Headquarters Overview');
    expect(html).toContain('aria-label="Commander guidance"');
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

  it('renders Doctrine as a review chamber with manual candidate promotion visible', () => {
    const html = renderToStaticMarkup(<DoctrineRoom
      doctrineRecords={[]}
      doctrineHistory={[]}
      onPromoteDoctrineCandidate={() => undefined}
    />);

    expect(html).toContain('Doctrine Review');
    expect(html).toContain('aria-label="Doctrine Commander prompt"');
    expect(html).toContain('Review the lesson before it becomes law.');
    expect(html).toContain('aria-label="Manual doctrine promotion"');
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
    })).resolves.toEqual({ record: promotedRecord, historyEntry });
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
    });
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

    const approved = evaluateLocalMissionAuthorization(mission, {
      operatorJustification: 'Setup matches the plan.',
      invalidation: 'Exit if structure breaks.',
    });
    const denied = evaluateLocalMissionAuthorization(mission, {
      operatorJustification: 'Setup matches the plan.',
      invalidation: '',
    });

    expect(approved).toEqual({
      missionId: 'mission-001',
      decision: 'approved',
      reason: 'Manual authorization fields are complete.',
    });
    expect(formatAuthorizationStatus(approved)).toBe('Authorization approved');

    expect(denied).toEqual({
      missionId: 'mission-001',
      decision: 'denied',
      reason: 'Manual authorization requires operator justification and invalidation.',
    });
    expect(formatAuthorizationStatus(denied)).toBe('Authorization denied');
    expect(evaluateLocalMissionAuthorization(undefined, {
      operatorJustification: 'Setup matches the plan.',
      invalidation: 'Exit if structure breaks.',
    })).toBeUndefined();
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
    expect(formatMissionLifecycleSummary(closingMission)).toBe('Current lifecycle state: Return To Base');
  });

  it('keeps return-to-base helper safe when no mission is loaded', () => {
    expect(requestLocalReturnToBase(undefined)).toBeUndefined();
    expect(formatMissionClosingState(undefined)).toBe('No mission loaded');
    expect(formatMissionLifecycleSummary(undefined)).toBe('No mission lifecycle loaded');
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
    expect(html).toContain('data-step-status="completed"');
    expect(html).toContain('data-step-status="current"');
    expect(html).toContain('Current lifecycle state: Archived');
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
