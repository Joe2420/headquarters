import { describe, expect, it } from 'vitest';
import { createMissionReplay, createReplayEvent } from '@headquarters/hqos';
import { buildMissionReplayInsights } from './MissionReplayInsights';

describe('MissionReplayInsights', () => {
  it('builds deterministic highlights only from linked evidence', () => {
    const replay = createMissionReplay({
      replayId: 'replay-1',
      missionId: 'mission-1',
      missionName: 'London Open',
      createdAt: '2026-07-13T08:00:00.000Z',
      events: [
        createReplayEvent({
          id: 'event-observation',
          type: 'operator_answer',
          section: 'observation',
          occurredAt: '2026-07-13T08:10:00.000Z',
          title: 'Observation answer',
          summary: 'Observation evidence was specific.',
          actor: 'operator',
          evidence: [{ id: 'observation-1', source: 'mission', description: 'Observation: higher highs and liquidity.' }],
        }),
        createReplayEvent({
          id: 'event-journal',
          type: 'journal_update',
          section: 'debrief',
          occurredAt: '2026-07-13T08:50:00.000Z',
          title: 'Journal saved',
          summary: 'Journal captured the lesson.',
          actor: 'journal',
          evidence: [{ id: 'journal-1', source: 'journal', description: 'Journal lesson preserved.' }],
        }),
      ],
    });

    const first = buildMissionReplayInsights(replay);
    const second = buildMissionReplayInsights(replay);

    expect(first).toEqual(second);
    expect(first.map((item) => item.type)).toContain('best-observation');
    expect(first.map((item) => item.type)).toContain('journal-insight');
    expect(first.every((item) => item.evidence.length > 0)).toBe(true);
  });
});
