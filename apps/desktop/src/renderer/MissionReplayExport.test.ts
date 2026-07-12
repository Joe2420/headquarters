import { describe, expect, it } from 'vitest';
import { createMissionReplay, createReplayEvent } from '@headquarters/hqos';
import { exportMissionReplay } from './MissionReplayExport';

describe('MissionReplayExport', () => {
  it('exports deterministic JSON, Markdown, and report structures', () => {
    const replay = createMissionReplay({
      replayId: 'replay-1',
      missionId: 'mission-1',
      missionName: 'London Open',
      createdAt: '2026-07-13T08:00:00.000Z',
      events: [createReplayEvent({
        id: 'event-1',
        type: 'journal_update',
        section: 'debrief',
        occurredAt: '2026-07-13T08:50:00.000Z',
        title: 'Journal saved',
        summary: 'Operator captured lesson.',
        actor: 'journal',
        evidence: [{ id: 'journal-1', source: 'journal', description: 'Journal lesson preserved.' }],
      })],
      recommendations: [{ id: 'rec-1', text: 'Repeat the same preparation standard.', evidenceIds: ['journal-1'] }],
    });

    const first = exportMissionReplay(replay);
    const second = exportMissionReplay(replay);

    expect(first).toEqual(second);
    expect(first.report.timeline[0]?.title).toBe('Journal saved');
    expect(first.markdown).toContain('# Replay: London Open');
    expect(JSON.parse(first.json)).toEqual(first.report);
  });
});
