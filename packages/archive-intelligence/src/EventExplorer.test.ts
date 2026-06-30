import { describe, expect, it } from 'vitest';
import type { EventEnvelope } from '@headquarters/shared';
import { inspectArchiveEvents } from './EventExplorer';

const events: readonly EventEnvelope[] = [
  {
    id: 'event-2',
    type: 'journal.entry.recorded' as EventEnvelope['type'],
    version: 1,
    occurredAt: '2026-01-02T09:00:00.000Z',
    source: 'archives',
    priority: 'green',
    payload: ['entry'],
  },
  {
    id: 'event-1',
    type: 'mission.state.changed',
    version: 1,
    occurredAt: '2026-01-01T09:00:00.000Z',
    source: 'hqos',
    missionId: 'mission-1',
    priority: 'amber',
    payload: {
      missionId: 'mission-1',
      from: 'briefing',
      to: 'ready',
    },
  },
];

describe('inspectArchiveEvents', () => {
  it('maps event envelopes to safe read-only inspection rows without reordering', () => {
    expect(inspectArchiveEvents(events)).toEqual([
      {
        id: 'event-2',
        type: 'journal.entry.recorded',
        occurredAt: '2026-01-02T09:00:00.000Z',
        source: 'archives',
        priority: 'green',
        payloadPreview: '1 array item',
      },
      {
        id: 'event-1',
        type: 'mission.state.changed',
        occurredAt: '2026-01-01T09:00:00.000Z',
        source: 'hqos',
        priority: 'amber',
        missionId: 'mission-1',
        payloadPreview: 'from, missionId, to',
      },
    ]);
  });

  it('handles empty event state safely', () => {
    expect(inspectArchiveEvents([])).toEqual([]);
  });
});
