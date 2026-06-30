import { describe, expect, it } from 'vitest';
import type { ArchiveIntelligenceRecord } from './ArchiveSearch';
import { buildArchiveDashboard } from './ArchiveDashboard';

const record: ArchiveIntelligenceRecord = {
  id: 'mission-1',
  type: 'mission',
  title: 'Mission archive',
  summary: 'Archived mission',
  occurredAt: '2026-01-01T09:00:00.000Z',
  tags: ['mission'],
};

describe('buildArchiveDashboard', () => {
  it('summarizes archive intelligence surfaces without mutating input', () => {
    expect(buildArchiveDashboard({
      records: [record],
      searchResultCount: 1,
      timelineItemCount: 1,
      eventInspections: [{
        id: 'event-1',
        type: 'mission.archived',
        occurredAt: '2026-01-01T09:00:00.000Z',
        source: 'archives',
        priority: 'green',
        missionId: 'mission-1',
        payloadPreview: 'codename, eventCount',
      }],
      sessionInspections: [],
      patterns: [{
        id: 'record-type-cluster:mission',
        kind: 'record_type_cluster',
        label: 'Record type cluster: mission',
        evidenceRecordIds: ['mission-1'],
        explanation: '1 archive record is a mission record.',
      }],
      replayPreparation: {
        totalItems: 1,
        preparedAt: '2026-01-02T09:00:00.000Z',
        items: [],
      },
    })).toEqual({
      recordCount: 1,
      searchResultCount: 1,
      timelineItemCount: 1,
      eventCount: 1,
      sessionCount: 0,
      patternCount: 1,
      replayItemCount: 1,
      status: 'ready',
    });
  });

  it('represents an empty Archive dashboard deterministically', () => {
    expect(buildArchiveDashboard({
      records: [],
      searchResultCount: 0,
      timelineItemCount: 0,
      eventInspections: [],
      sessionInspections: [],
      patterns: [],
    })).toEqual({
      recordCount: 0,
      searchResultCount: 0,
      timelineItemCount: 0,
      eventCount: 0,
      sessionCount: 0,
      patternCount: 0,
      replayItemCount: 0,
      status: 'empty',
    });
  });
});
