import { describe, expect, it } from 'vitest';
import {
  createMissionPersistenceStatus,
  formatMissionPersistenceStatus,
  markMissionSaveFailed,
  markMissionSavePending,
  markMissionSaveSucceeded,
  recoverIncompleteMissionStatus,
} from './MissionPersistenceGuarantee';

describe('MissionPersistenceGuarantee', () => {
  it('tracks saved, pending, failed, and retryable mission save states', () => {
    const saved = markMissionSaveSucceeded('mission-001', '2026-07-10T10:00:00.000Z');
    const pending = markMissionSavePending(saved, 'mission-001', 'Ready Room answer pending persistence.');
    const failed = markMissionSaveFailed(pending, 'Disk unavailable.');

    expect(saved.state).toBe('saved');
    expect(pending.pendingReason).toBe('Ready Room answer pending persistence.');
    expect(failed.failureReason).toBe('Disk unavailable.');
    expect(formatMissionPersistenceStatus(failed)).toBe('Disk unavailable.');
  });

  it('recovers the newest unfinished mission without selecting archived missions', () => {
    const status = recoverIncompleteMissionStatus([
      { id: 'old', currentState: 'archived', createdAt: '2026-07-10T09:00:00.000Z' },
      { id: 'active', currentState: 'deployed', createdAt: '2026-07-10T10:00:00.000Z' },
    ]);

    expect(status).toMatchObject({
      missionId: 'active',
      state: 'recovery_available',
      pendingReason: 'An unfinished mission record was recovered.',
    });
  });

  it('creates conservative default saved state', () => {
    expect(createMissionPersistenceStatus({
      missionId: 'mission-001',
      now: '2026-07-10T10:00:00.000Z',
    })).toEqual({
      missionId: 'mission-001',
      state: 'saved',
      lastSavedAt: '2026-07-10T10:00:00.000Z',
    });
  });
});
