import { describe, expect, it } from 'vitest';
import {
  buildArchiveDashboard,
  detectArchivePatterns,
  filterArchiveTimeline,
  inspectArchiveEvents,
  inspectArchiveSessions,
  prepareArchiveReplay,
  searchArchiveRecords,
  type ArchiveIntelligenceRecord,
} from './index';

const records: readonly ArchiveIntelligenceRecord[] = [
  {
    id: 'mission-1',
    type: 'mission',
    title: 'Foundation Patrol',
    summary: 'Archived mission',
    occurredAt: '2026-01-01T09:00:00.000Z',
    tags: ['archive', 'discipline'],
  },
  {
    id: 'journal-1',
    type: 'journal',
    title: 'Daily reflection',
    summary: 'Archived journal evidence',
    occurredAt: '2026-01-02T09:00:00.000Z',
    tags: ['archive', 'reflection'],
  },
];

describe('Sprint 9 Archive Intelligence review', () => {
  it('confirms Sprint 9 archive intelligence surfaces are deterministic and read-oriented', () => {
    const searchResults = searchArchiveRecords(records, { tag: 'archive' });
    const timelineItems = filterArchiveTimeline(records, {});
    const replayPreparation = prepareArchiveReplay(records, '2026-01-03T09:00:00.000Z');
    const eventInspections = inspectArchiveEvents([]);
    const sessionInspections = inspectArchiveSessions([]);
    const patterns = detectArchivePatterns(records);

    expect(searchResults.map((record) => record.id)).toEqual(['mission-1', 'journal-1']);
    expect(timelineItems.map((record) => record.id)).toEqual(['mission-1', 'journal-1']);
    expect(replayPreparation.totalItems).toBe(2);
    expect(eventInspections).toEqual([]);
    expect(sessionInspections).toEqual([]);
    expect(patterns.map((pattern) => pattern.id)).toContain('repeated-tag:archive');
    expect(buildArchiveDashboard({
      records,
      searchResultCount: searchResults.length,
      timelineItemCount: timelineItems.length,
      eventInspections,
      sessionInspections,
      patterns,
      replayPreparation,
    })).toMatchObject({
      recordCount: 2,
      searchResultCount: 2,
      timelineItemCount: 2,
      replayItemCount: 2,
      status: 'ready',
    });
  });
});
