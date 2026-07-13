import { describe, expect, it } from 'vitest';
import { deriveHeadquartersIntelligenceInsights } from './HeadquartersIntelligenceInsightEngine';
import type { CrossMissionPattern } from './CrossMissionPatternEngine';
import type { IntelligenceTrendAnalysis } from './IntelligenceTrendEngine';

const createdAt = '2026-07-13T00:00:00.000Z';

describe('HeadquartersIntelligenceInsightEngine', () => {
  it('turns repeated patterns into explainable insights', () => {
    const insights = deriveHeadquartersIntelligenceInsights({
      createdAt,
      patterns: [pattern('repeated_authorization_gap')],
    });

    expect(insights[0]?.category).toBe('authorization_pattern');
    expect(insights[0]?.recommendedRoom).toBe('war-room');
    expect(insights[0]?.supportingMissions).toEqual(['mission-1', 'mission-2', 'mission-3']);
  });

  it('keeps contradictions visible and does not duplicate insight ids', () => {
    const repeated = pattern('repeated_risk_violation', true);
    const insights = deriveHeadquartersIntelligenceInsights({
      createdAt,
      patterns: [repeated, repeated],
    });

    expect(insights).toHaveLength(1);
    expect(insights[0]?.contradictoryMissions).toEqual(['mission-4']);
    expect(insights[0]?.urgency).toBe('immediate');
  });

  it('creates positive improvement insights from trends', () => {
    const insights = deriveHeadquartersIntelligenceInsights({
      createdAt,
      trends: [trend('improving')],
    });

    expect(insights[0]?.category).toBe('improvement');
    expect(insights[0]?.recommendedAction).toContain('Acknowledge');
    expect(insights[0]?.strength).toBe('repeated');
  });

  it('omits unsupported blocked and insufficient insights', () => {
    const insights = deriveHeadquartersIntelligenceInsights({
      createdAt,
      patterns: [{ ...pattern('repeated_guardian_alert'), status: 'blocked_by_contradiction' }],
      trends: [{ ...trend('insufficient_history'), supportingObservations: [], contradictoryObservations: [] }],
    });

    expect(insights).toEqual([]);
  });
});

function pattern(
  category: CrossMissionPattern['category'],
  withContradiction = false,
): CrossMissionPattern {
  return {
    patternId: `pattern:${category}`,
    category,
    title: 'Premature authorization remains a recurring issue',
    explanation: 'The pattern appeared across three missions.',
    evidenceMissionIds: ['mission-1', 'mission-2', 'mission-3'],
    evidenceNodeIds: ['node-1'],
    supportingEvidence: [
      evidence('mission-1:evidence'),
      evidence('mission-2:evidence'),
      evidence('mission-3:evidence'),
    ],
    contradictoryEvidence: withContradiction ? [evidence('mission-4:evidence')] : [],
    occurrenceCount: 3,
    firstObservedAt: createdAt,
    lastObservedAt: createdAt,
    trend: 'stable',
    strength: 'supported',
    status: 'active',
    relevanceConditions: ['war-room'],
    recommendedUse: 'Use in Commander guidance.',
  };
}

function trend(kind: IntelligenceTrendAnalysis['trend']): IntelligenceTrendAnalysis {
  return {
    trendId: `trend:${kind}`,
    subject: 'Observation Discipline',
    trend: kind,
    explanation: 'Observation discipline is improving.',
    sampleSize: 5,
    recentWindowSize: 5,
    comparisonWindowSize: 5,
    supportingObservations: [evidence('mission-1:trend'), evidence('mission-2:trend')],
    contradictoryObservations: [],
  };
}

function evidence(evidenceId: string) {
  return {
    evidenceId,
    sourceSubsystem: 'evaluation',
    sourceEntityId: evidenceId,
    description: `${evidenceId} supports the insight.`,
    occurredAt: createdAt,
  };
}
