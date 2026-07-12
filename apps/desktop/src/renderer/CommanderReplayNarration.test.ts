import { describe, expect, it } from 'vitest';
import { buildMissionEvaluation, createMissionReplay, createReplayEvent } from '@headquarters/hqos';
import { buildCommanderReplayNarration } from './CommanderReplayNarration';

const evaluation = buildMissionEvaluation({
  missionId: 'mission-1',
  missionState: 'archived',
  evaluatedAt: '2026-07-13T09:00:00.000Z',
  guardian: { state: 'secure', highestAlert: 'Guardian secure.' },
  doctrine: {
    activeProtectiveRule: 'Wait for valid invalidation.',
    pendingCandidateCount: 0,
    relevance: 'Doctrine referenced.',
  },
  missionIntelligence: {
    missionId: 'mission-1',
    riskLimit: '1R',
    invalidation: 'Break of structure',
    observationSummary: 'Observation was specific.',
    authorizationSummary: 'Authorization followed doctrine.',
    debriefSummary: 'Debrief was honest.',
    missingEvidence: [],
    contradictions: [],
    guardianNotes: [],
  },
});

describe('CommanderReplayNarration', () => {
  it('generates after-action narration from replay and evaluation evidence', () => {
    const replay = createMissionReplay({
      replayId: 'replay-1',
      missionId: 'mission-1',
      missionName: 'London Open',
      createdAt: '2026-07-13T08:00:00.000Z',
      evaluation,
      events: [createReplayEvent({
        id: 'event-1',
        type: 'commander_response',
        section: 'observation',
        occurredAt: '2026-07-13T08:10:00.000Z',
        title: 'Observation reviewed',
        summary: 'Observation stayed disciplined.',
        actor: 'commander',
        evidence: [{ id: evaluation.id, source: 'evaluation', description: evaluation.commanderReview }],
        narration: {
          id: 'narration-1',
          text: 'Observation remained disciplined until authorization.',
          evidenceIds: [evaluation.id],
        },
      })],
    });

    const lines = buildCommanderReplayNarration(replay);

    expect(lines.map((line) => line.text)).toContain('Observation remained disciplined until authorization.');
    expect(lines.some((line) => line.text === evaluation.commanderReview)).toBe(true);
    expect(lines.every((line) => !line.text.toLowerCase().includes('profit'))).toBe(true);
    expect(lines.find((line) => line.text === evaluation.commanderReview)?.evidence[0]?.id).toBe(evaluation.id);
  });
});
