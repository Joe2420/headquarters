import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  App,
  CommandCenter,
  CommandCenterPlaceholder,
  type StartupStatus,
  createArchiveWritePlaceholder,
  createDesktopMission,
  createLocalDebrief,
  createLocalMissionArchiveSummary,
  createLocalMission,
  evaluateLocalMissionAuthorization,
  formatArchiveWriteStatus,
  formatArchiveSummaryStatus,
  formatAuthorizationStatus,
  formatDatabaseStatus,
  formatDebriefStatus,
  formatHqosStatus,
  formatMigrationStatus,
  formatMissionClosingState,
  formatStartupError,
  getPrimaryNavigationItems,
  mapMissionRecordToActiveMission,
  markLocalMissionArchived,
  markLocalMissionDebriefed,
  reportForDuty,
  requestLocalReturnToBase,
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
    expect(html).toContain('data-nav-id="archive"');
    expect(html).toContain('data-nav-id="settings"');
    expect(html).toContain('aria-current="page"');
  });

  it('derives exactly one active primary navigation item', () => {
    const items = getPrimaryNavigationItems('command');

    expect(items).toEqual([
      { id: 'command', label: 'Command', active: true },
      { id: 'missions', label: 'Missions', active: false },
      { id: 'archive', label: 'Archive', active: false },
      { id: 'settings', label: 'Settings', active: false },
    ]);
    expect(items.filter((item) => item.active)).toHaveLength(1);
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

  it('renders the Mission Board placeholder in the command center', () => {
    const html = renderToStaticMarkup(<CommandCenterPlaceholder />);

    expect(html).toContain('data-layout="command-center"');
    expect(html).toContain('aria-label="Command center status"');
    expect(html).toContain('aria-label="Mission operations"');
    expect(html).toContain('aria-label="Operational panels"');
    expect(html).toContain('Mission Board');
    expect(html).toContain('Create Mission');
    expect(html).toContain('Mission Authorization');
    expect(html).toContain('Mission Closing');
    expect(html).toContain('Mission Debrief');
    expect(html).toContain('Archived Mission Summary');
    expect(html).toContain('Archive Placeholder');
    expect(html).toContain('Not started');
    expect(html).toContain('Awaiting debrief');
    expect(html).toContain('Awaiting archive');
    expect(html).toContain('Awaiting mission creation');
    expect(html).toContain('No mission loaded');
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
  });

  it('keeps return-to-base helper safe when no mission is loaded', () => {
    expect(requestLocalReturnToBase(undefined)).toBeUndefined();
    expect(formatMissionClosingState(undefined)).toBe('No mission loaded');
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
