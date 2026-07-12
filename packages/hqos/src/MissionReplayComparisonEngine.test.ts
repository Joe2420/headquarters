import { describe, expect, it } from 'vitest';
import { buildMissionEvaluation } from './MissionEvaluationEngine';
import { createMissionReplay, createReplayEvent } from './MissionReplay';
import { compareMissionReplays } from './MissionReplayComparisonEngine';

const currentEvaluation = buildMissionEvaluation({
  missionId: 'current',
  missionState: 'archived',
  evaluatedAt: '2026-07-13T09:00:00.000Z',
  guardian: { state: 'secure', highestAlert: 'Guardian secure.' },
  doctrine: { activeProtectiveRule: 'Wait for invalidation.', pendingCandidateCount: 0, relevance: 'Referenced.' },
  missionIntelligence: {
    missionId: 'current',
    riskLimit: '1R',
    invalidation: 'Break of structure',
    observationSummary: 'Observation specific.',
    authorizationSummary: 'Authorized by doctrine.',
    debriefSummary: 'Lesson captured.',
    missingEvidence: [],
    contradictions: [],
    guardianNotes: [],
  },
});

const previousEvaluation = buildMissionEvaluation({
  missionId: 'previous',
  missionState: 'archived',
  evaluatedAt: '2026-07-12T09:00:00.000Z',
  guardian: { state: 'restriction', highestAlert: 'Guardian restriction active.' },
  doctrine: { activeProtectiveRule: 'No protective rule declared.', pendingCandidateCount: 0, relevance: 'Missing.' },
  missionIntelligence: {
    missionId: 'previous',
    missingEvidence: [],
    contradictions: [],
    guardianNotes: ['Guardian restriction active.'],
  },
});

const current = createMissionReplay({
  replayId: 'replay-current',
  missionId: 'current',
  missionName: 'Current Mission',
  createdAt: '2026-07-13T08:00:00.000Z',
  evaluation: currentEvaluation,
  events: [createReplayEvent({
    id: 'current-war',
    type: 'room_entered',
    section: 'war-room',
    occurredAt: '2026-07-13T08:30:00.000Z',
    title: 'War Room',
    summary: 'War Room review.',
    actor: 'commander',
    evidence: [{ id: currentEvaluation.id, source: 'evaluation', description: currentEvaluation.commanderReview }],
  })],
});

const previous = createMissionReplay({
  replayId: 'replay-previous',
  missionId: 'previous',
  missionName: 'Mission 42',
  createdAt: '2026-07-12T08:00:00.000Z',
  evaluation: previousEvaluation,
  events: [createReplayEvent({
    id: 'previous-war',
    type: 'guardian_event',
    section: 'war-room',
    occurredAt: '2026-07-12T08:30:00.000Z',
    title: 'Guardian warning',
    summary: 'Guardian warning appeared.',
    actor: 'guardian',
    evidence: [{ id: 'guardian-previous', source: 'guardian', description: 'Guardian warning appeared.' }],
  })],
});

describe('MissionReplayComparisonEngine', () => {
  it('compares missions deterministically with linked evidence', () => {
    const first = compareMissionReplays(current, [previous]);
    const second = compareMissionReplays(current, [previous]);

    expect(first).toEqual(second);
    expect(first.map((item) => item.type)).toContain('similarity');
    expect(first.map((item) => item.type)).toContain('improvement');
    expect(first.map((item) => item.type)).toContain('resolved-warning');
    expect(first.every((item) => item.evidenceIds.length > 0)).toBe(true);
  });
});
