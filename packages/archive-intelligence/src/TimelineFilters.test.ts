import { describe, expect, it } from 'vitest';
import type { MissionTimelineEntry } from '@headquarters/hqos';
import type { ArchiveIntelligenceRecord } from './ArchiveSearch';
import { filterArchiveTimeline, filterMissionTimelineEntries } from './TimelineFilters';

const archiveRecords: readonly ArchiveIntelligenceRecord[] = [
  {
    id: 'mission-1',
    type: 'mission',
    title: 'Mission',
    summary: 'First item',
    occurredAt: '2026-01-01T09:00:00.000Z',
    tags: ['alpha'],
  },
  {
    id: 'journal-1',
    type: 'journal',
    title: 'Journal',
    summary: 'Second item',
    occurredAt: '2026-01-02T09:00:00.000Z',
    tags: ['reflection'],
  },
  {
    id: 'mission-2',
    type: 'mission',
    title: 'Mission follow-up',
    summary: 'Third item',
    occurredAt: '2026-01-03T09:00:00.000Z',
    tags: ['alpha'],
  },
];

const missionEntries: readonly MissionTimelineEntry[] = [
  {
    eventId: 'event-1',
    missionId: 'mission-a',
    occurredAt: '2026-01-01T09:00:00.000Z',
    transition: { from: 'idle', to: 'briefing' },
  },
  {
    eventId: 'event-2',
    missionId: 'mission-a',
    occurredAt: '2026-01-02T09:00:00.000Z',
    transition: { from: 'briefing', to: 'ready' },
  },
  {
    eventId: 'event-3',
    missionId: 'mission-b',
    occurredAt: '2026-01-03T09:00:00.000Z',
    transition: { from: 'idle', to: 'briefing' },
  },
];

describe('TimelineFilters', () => {
  it('filters archive timelines without changing chronological order', () => {
    expect(filterArchiveTimeline(archiveRecords, { type: 'mission', tag: 'alpha' }).map((record) => record.id)).toEqual([
      'mission-1',
      'mission-2',
    ]);
  });

  it('filters archive timelines by inclusive time range', () => {
    expect(
      filterArchiveTimeline(archiveRecords, {
        occurredFrom: '2026-01-02T00:00:00.000Z',
        occurredTo: '2026-01-02T23:59:59.999Z',
      }).map((record) => record.id),
    ).toEqual(['journal-1']);
  });

  it('filters mission timeline entries by mission and transition state', () => {
    expect(filterMissionTimelineEntries(missionEntries, { missionId: 'mission-a', toState: 'ready' })).toEqual([
      missionEntries[1],
    ]);
  });

  it('returns empty timeline results deterministically', () => {
    expect(filterMissionTimelineEntries(missionEntries, { fromState: 'archived' })).toEqual([]);
  });
});
