import { describe, expect, it } from 'vitest';
import { createMissionReplay, createReplayEvent } from './MissionReplay';

describe('MissionReplay contracts', () => {
  it('creates an immutable replay with ordered events', () => {
    const replay = createMissionReplay({
      replayId: 'replay-1',
      missionId: 'mission-1',
      missionName: 'London Open',
      createdAt: '2026-07-13T08:00:00.000Z',
      events: [
        createReplayEvent({
          id: 'event-2',
          type: 'operator_answer',
          section: 'ready-room',
          occurredAt: '2026-07-13T08:02:00.000Z',
          title: 'Operator answered briefing',
          summary: 'Operator declared primary mission.',
          actor: 'operator',
          room: 'ready-room',
          evidence: [{ id: 'briefing-1', source: 'mission', description: 'Briefing answer' }],
        }),
        createReplayEvent({
          id: 'event-1',
          type: 'room_entered',
          section: 'mission-opening',
          occurredAt: '2026-07-13T08:01:00.000Z',
          title: 'Mission opened',
          summary: 'Commander opened the operation.',
          actor: 'commander',
          room: 'command-center',
          evidence: [{ id: 'mission-1', source: 'mission', description: 'Mission identity' }],
        }),
      ],
    });

    expect(replay.timeline.events.map((event) => event.id)).toEqual(['event-1', 'event-2']);
    expect(replay.lifecycle).toEqual(['mission-opening', 'ready-room']);
    expect(Object.isFrozen(replay)).toBe(true);
    expect(Object.isFrozen(replay.timeline.events)).toBe(true);
  });

  it('preserves evidence references and commander narration', () => {
    const replay = createMissionReplay({
      replayId: 'replay-1',
      missionId: 'mission-1',
      missionName: 'London Open',
      createdAt: '2026-07-13T08:00:00.000Z',
      events: [createReplayEvent({
        id: 'event-1',
        type: 'commander_response',
        section: 'observation',
        occurredAt: '2026-07-13T08:05:00.000Z',
        title: 'Observation guidance',
        summary: 'Commander required visible evidence.',
        actor: 'commander',
        evidence: [{ id: 'observation-1', source: 'mission', description: 'Observation record' }],
        narration: {
          id: 'narration-1',
          text: 'Observation remained evidence-first.',
          evidenceIds: ['observation-1'],
        },
      })],
    });

    expect(replay.timeline.events[0]?.evidence[0]?.id).toBe('observation-1');
    expect(replay.commanderNarrative[0]?.evidenceIds).toEqual(['observation-1']);
    expect(replay.summary.evidenceCount).toBe(1);
  });
});
