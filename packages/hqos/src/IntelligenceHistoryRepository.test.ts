import { describe, expect, it } from 'vitest';
import { InMemoryIntelligenceHistoryRepository } from './IntelligenceHistoryRepository';
import type { HeadquartersIntelligenceInsight } from './HeadquartersIntelligenceInsightEngine';
import type { CrossMissionPattern } from './CrossMissionPatternEngine';
import { createIntelligenceGraphSnapshot } from './HeadquartersIntelligenceGraph';

const now = '2026-07-13T00:00:00.000Z';

describe('IntelligenceHistoryRepository', () => {
  it('reloads graph, active insights, and reviewed state from dumped history', () => {
    const repository = new InMemoryIntelligenceHistoryRepository();
    repository.saveGraphSnapshot(createIntelligenceGraphSnapshot({ createdAt: now, nodes: [node()], edges: [] }));
    repository.saveInsights([insight('active')], now);
    repository.markInsightReviewed('insight-1', now);

    const reloaded = new InMemoryIntelligenceHistoryRepository(repository.dumpState());

    expect(reloaded.getGraphSnapshot()?.nodes).toHaveLength(1);
    expect(reloaded.listActiveInsights()).toHaveLength(1);
    expect(reloaded.listReviewedInsights()[0]?.insightId).toBe('insight-1');
  });

  it('keeps duplicate updates idempotent and preserves evolution ordering', () => {
    const repository = new InMemoryIntelligenceHistoryRepository();
    repository.savePatterns([pattern()], now);
    repository.savePatterns([pattern()], '2026-07-14T00:00:00.000Z');
    repository.saveInsights([insight('active')], now);
    repository.markInsightResolved('insight-1', '2026-07-15T00:00:00.000Z');

    expect(repository.listPatternsByStatus('active')).toHaveLength(1);
    expect(repository.getInsightById('insight-1')?.status).toBe('resolved');
    expect(repository.explainInsightEvolution('insight-1').map((entry) => entry.type)).toEqual([
      'insight_created',
      'insight_resolved',
    ]);
  });

  it('queries insights by mission and unresolved critical status', () => {
    const repository = new InMemoryIntelligenceHistoryRepository();
    repository.saveInsights([insight('active')], now);

    expect(repository.listInsightsByMission('mission-1')).toHaveLength(1);
    expect(repository.listUnresolvedCriticalInsights()).toHaveLength(1);
  });
});

function node() {
  return {
    nodeType: 'mission' as const,
    sourceEntityId: 'mission-1',
    sourceSubsystem: 'mission',
    missionId: 'mission-1',
    title: 'Mission 1',
    summary: 'Archived mission.',
    createdAt: now,
    evidenceReferences: [{
      evidenceId: 'mission-1',
      sourceSubsystem: 'mission',
      sourceEntityId: 'mission-1',
      description: 'Mission evidence.',
    }],
    tags: ['mission'],
  };
}

function pattern(): CrossMissionPattern {
  return {
    patternId: 'pattern-1',
    category: 'repeated_risk_violation',
    title: 'Risk issue',
    explanation: 'Risk issue repeated.',
    evidenceMissionIds: ['mission-1', 'mission-2'],
    evidenceNodeIds: [],
    supportingEvidence: [],
    contradictoryEvidence: [],
    occurrenceCount: 2,
    firstObservedAt: now,
    lastObservedAt: now,
    trend: 'stable',
    strength: 'emerging',
    status: 'active',
    relevanceConditions: ['guardian'],
    recommendedUse: 'Review risk.',
  };
}

function insight(status: HeadquartersIntelligenceInsight['status']): HeadquartersIntelligenceInsight {
  return {
    insightId: 'insight-1',
    category: 'recurring_risk',
    title: 'Recurring risk',
    conciseSummary: 'Recurring risk evidence.',
    explanation: 'Recurring risk evidence.',
    relevance: 'guardian',
    urgency: 'immediate',
    strength: 'supported',
    evidenceReferences: [],
    supportingMissions: ['mission-1'],
    contradictoryMissions: [],
    relatedDoctrine: [],
    relatedGuardianRules: [],
    relatedJournalEntries: [],
    recommendedRoom: 'guardian',
    recommendedAction: 'Review risk evidence.',
    createdAt: now,
    status,
  };
}
