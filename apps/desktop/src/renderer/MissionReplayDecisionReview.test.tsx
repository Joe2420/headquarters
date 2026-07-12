import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createMissionReplay, createReplayEvent } from '@headquarters/hqos';
import { getDecisionEvidence, getReplayDecisions, MissionReplayDecisionReview } from './MissionReplayDecisionReview';

const replay = createMissionReplay({
  replayId: 'replay-1',
  missionId: 'mission-1',
  missionName: 'London Open',
  createdAt: '2026-07-13T08:00:00.000Z',
  events: [createReplayEvent({
    id: 'event-auth',
    type: 'evaluation',
    section: 'war-room',
    occurredAt: '2026-07-13T08:20:00.000Z',
    title: 'Authorization reviewed',
    summary: 'Authorization decision was reviewed.',
    actor: 'evaluation',
    evidence: [{ id: 'auth-1', source: 'mission', description: 'Authorization used invalidation and risk.' }],
    decision: {
      id: 'decision-auth',
      title: 'Authorization',
      reasoning: 'Evidence and protective rule were present.',
      evidenceIds: ['auth-1'],
      commanderReview: 'Authorization came from doctrine, not pressure.',
    },
  })],
});

describe('MissionReplayDecisionReview', () => {
  it('opens a decision detail with evidence and Commander explanation', () => {
    const html = renderToStaticMarkup(<MissionReplayDecisionReview replay={replay} decisionId="decision-auth" />);

    expect(html).toContain('Authorization');
    expect(html).toContain('Evidence and protective rule were present.');
    expect(html).toContain('Authorization came from doctrine');
    expect(html).toContain('Authorization used invalidation and risk.');
  });

  it('lists decisions and linked evidence deterministically', () => {
    const decision = getReplayDecisions(replay)[0]!;

    expect(decision.id).toBe('decision-auth');
    expect(getDecisionEvidence(replay, decision)[0]?.id).toBe('auth-1');
  });
});
