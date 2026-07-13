import { describe, expect, it } from 'vitest';
import { buildCommanderIntelligenceGuidance } from './CommanderIntelligenceGuidance';
import type { HeadquartersIntelligenceInsight, RelevantHistoricalMission } from '@headquarters/hqos';

describe('CommanderIntelligenceGuidance', () => {
  it('changes Commander wording when supported pattern evidence exists', () => {
    const guidance = buildCommanderIntelligenceGuidance({
      room: 'war-room',
      insight: insight('authorization_pattern'),
    });

    expect(guidance?.intent).toBe('challengeRecurringIssue');
    expect(guidance?.text).toContain('3 missions');
    expect(guidance?.text).toContain('Review authorization evidence');
  });

  it('returns neutral absence when there is no evidence and avoids repeat references', () => {
    expect(buildCommanderIntelligenceGuidance({ room: 'ready-room' })).toBeUndefined();
    expect(buildCommanderIntelligenceGuidance({
      room: 'ready-room',
      insight: insight('observation_pattern'),
      alreadyReferencedInsightIds: ['insight-1'],
    })).toBeUndefined();
  });

  it('includes important differences for similar missions without prediction', () => {
    const guidance = buildCommanderIntelligenceGuidance({
      room: 'observation',
      similarMission: similarMission(),
    });

    expect(guidance?.intent).toBe('referenceSimilarMission');
    expect(guidance?.text).toContain('Important difference');
    expect(guidance?.text).not.toMatch(/predict|market will/i);
  });

  it('keeps background insights quiet and preserves evidence links', () => {
    const guidance = buildCommanderIntelligenceGuidance({
      room: 'intelligence',
      insight: { ...insight('journal_theme'), urgency: 'background' },
    });

    expect(guidance?.intent).toBe('deferBackgroundInsight');
    expect(guidance?.evidenceIds).toEqual(['evidence-1']);
  });
});

function insight(category: HeadquartersIntelligenceInsight['category']): HeadquartersIntelligenceInsight {
  return {
    insightId: 'insight-1',
    category,
    title: 'Premature authorization remains a recurring issue',
    conciseSummary: 'Three missions share the same evidence gap.',
    explanation: 'The issue appears across historical evidence.',
    relevance: 'war-room',
    urgency: 'safe_point',
    strength: 'supported',
    evidenceReferences: [{
      evidenceId: 'evidence-1',
      sourceSubsystem: 'evaluation',
      sourceEntityId: 'mission-1:evidence',
      description: 'Evaluation evidence.',
    }],
    supportingMissions: ['mission-1', 'mission-2', 'mission-3'],
    contradictoryMissions: [],
    relatedDoctrine: [],
    relatedGuardianRules: [],
    relatedJournalEntries: [],
    recommendedRoom: 'war-room',
    recommendedAction: 'Review authorization evidence before requesting approval.',
    createdAt: '2026-07-13T00:00:00.000Z',
    status: 'active',
  };
}

function similarMission(): RelevantHistoricalMission {
  return {
    relevanceId: 'relevance-1',
    missionId: 'mission-84',
    relevanceReasons: ['Shared market context.'],
    matchedDimensions: ['market', 'risk', 'guardian rule'],
    importantDifferences: ['Mission 84 had an active Guardian caution.'],
    evaluationSummary: 'Archived process summary.',
    relatedGuardianEvents: ['guardian-1'],
    relatedDoctrine: ['doctrine-1'],
    relatedLessons: ['lesson-1'],
    replayId: 'replay:mission-84',
    evidenceReferences: [{
      evidenceId: 'historical-1',
      sourceSubsystem: 'archive',
      sourceEntityId: 'mission-84',
      description: 'Archived evidence.',
    }],
    relevanceStrength: 'strong',
  };
}
