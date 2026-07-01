import { describe, expect, it } from 'vitest';
import { buildCommanderSessionDebrief } from './SessionDebrief';

describe('buildCommanderSessionDebrief', () => {
  it('represents an evidence-based session debrief without persistence behavior', () => {
    expect(buildCommanderSessionDebrief({
      missionTitle: 'Foundation Patrol',
      missionState: 'archived',
      journalEntryCount: 2,
      archiveRecordCount: 1,
      generatedAt: '2026-01-01T16:00:00.000Z',
    })).toEqual({
      title: 'Session Debrief',
      generatedAt: '2026-01-01T16:00:00.000Z',
      summary: 'Foundation Patrol ended the session in archived.',
      evidence: ['2 journal entries', '1 archive record'],
      distinction: 'Commander session debrief is read-only and distinct from mission debrief persistence.',
    });
  });

  it('handles missing session evidence deterministically', () => {
    const debrief = buildCommanderSessionDebrief({
      journalEntryCount: 0,
      archiveRecordCount: 0,
      generatedAt: '2026-01-01T16:00:00.000Z',
    });

    expect(debrief.summary).toBe('No completed session evidence is available yet.');
    expect(debrief.evidence).toEqual(['0 journal entries', '0 archive records']);
  });
});
