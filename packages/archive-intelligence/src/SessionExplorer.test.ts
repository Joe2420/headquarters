import { describe, expect, it } from 'vitest';
import type { ObservationSessionRecord } from '@headquarters/database';
import { inspectArchiveSessions } from './SessionExplorer';

const sessions: readonly ObservationSessionRecord[] = [
  {
    id: 'session-1',
    missionId: 'mission-1',
    startedAt: '2026-01-01T09:00:00.000Z',
    completedAt: '2026-01-01T09:30:00.000Z',
    durationMs: 1_800_000,
  },
  {
    id: 'session-2',
    missionId: 'mission-2',
    startedAt: '2026-01-02T09:00:00.000Z',
  },
];

describe('inspectArchiveSessions', () => {
  it('maps approved observation session records to read-only inspection rows', () => {
    expect(inspectArchiveSessions(sessions)).toEqual([
      {
        id: 'session-1',
        missionId: 'mission-1',
        startedAt: '2026-01-01T09:00:00.000Z',
        completedAt: '2026-01-01T09:30:00.000Z',
        durationMs: 1_800_000,
        status: 'completed',
      },
      {
        id: 'session-2',
        missionId: 'mission-2',
        startedAt: '2026-01-02T09:00:00.000Z',
        status: 'active',
      },
    ]);
  });

  it('handles empty session state safely', () => {
    expect(inspectArchiveSessions([])).toEqual([]);
  });
});
