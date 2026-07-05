import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  CommandCenter,
  buildDesktopMissionTimelineEntries,
  buildMissionLifecycleSteps,
  createArchiveWritePlaceholder,
  createLocalDebrief,
  createLocalMission,
  createLocalMissionArchiveSummary,
  evaluateLocalMissionAuthorization,
  listArchivedMissionSummaries,
  listMissionHistory,
  upsertMissionHistory,
} from './App';

describe('Sprint 4 mission operations review', () => {
  it('confirms creation, authorization, lifecycle, details, archive, timeline, and history surfaces are present', () => {
    const html = renderToStaticMarkup(<CommandCenter />);

    expect(html).toContain('Create Mission');
    expect(html).toContain('Mission Authorization');
    expect(html).toContain('Operational Sequence');
    expect(html).toContain('Mission Details');
    expect(html).toContain('Mission Archive Viewer');
    expect(html).toContain('Timeline Viewer');
    expect(html).toContain('Mission History');
  });

  it('confirms Sprint 4 mission operations remain deterministic and read-oriented where required', () => {
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

    const authorization = evaluateLocalMissionAuthorization(mission, {
      operatorJustification: 'Setup matches the plan.',
      invalidation: 'Exit if structure breaks.',
      protectiveRule: 'No trade after failed acceptance.',
    });
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
    const archiveSummary = createLocalMissionArchiveSummary(mission, debrief, archiveWrite, {
      archivedAt: '2026-01-01T00:20:00.000Z',
    });

    expect(authorization?.decision).toBe('approved');
    expect(buildMissionLifecycleSteps(mission).some((step) => step.status === 'current')).toBe(true);
    expect(archiveSummary?.eventCount).toBe(2);
    expect(listArchivedMissionSummaries(archiveSummary ? [archiveSummary] : [])).toHaveLength(1);
    expect(buildDesktopMissionTimelineEntries({
      activeMission: mission,
      authorizationStatus: authorization,
      missionDebrief: debrief,
      archiveSummary,
    }).map((entry) => entry.occurredAt)).toEqual([
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:10:00.000Z',
      '2026-01-01T00:20:00.000Z',
    ]);
    expect(listMissionHistory(upsertMissionHistory([], mission))).toEqual([mission]);
  });
});
