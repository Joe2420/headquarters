import { describe, expect, it } from 'vitest';
import { buildCommanderDailyBriefing } from './DailyBriefing';

describe('buildCommanderDailyBriefing', () => {
  it('builds a deterministic briefing from approved local evidence counts', () => {
    expect(buildCommanderDailyBriefing({
      activeMissionTitle: 'Foundation Patrol',
      activeMissionObjective: 'Hold discipline through the session.',
      missionCount: 2,
      journalEntryCount: 3,
      archiveRecordCount: 1,
      generatedAt: '2026-01-01T08:00:00.000Z',
    })).toEqual({
      title: 'Daily Briefing',
      generatedAt: '2026-01-01T08:00:00.000Z',
      summary: 'Active mission Foundation Patrol is ready for disciplined review.',
      focus: 'Hold discipline through the session.',
      evidence: ['2 mission records', '3 journal entries', '1 archive record'],
      constraints: ['No market prediction.', 'No broker action.', 'Commander language remains calm and rare.'],
    });
  });

  it('handles empty mission state without prediction language', () => {
    const briefing = buildCommanderDailyBriefing({
      missionCount: 0,
      journalEntryCount: 0,
      archiveRecordCount: 0,
      generatedAt: '2026-01-01T08:00:00.000Z',
    });

    expect(briefing.summary).toBe('No active mission is loaded. Establish command, then create or select the mission for the day.');
    expect(briefing.focus).toBe('Protect process quality before any external action.');
    expect(briefing.constraints).toContain('No market prediction.');
  });
});
