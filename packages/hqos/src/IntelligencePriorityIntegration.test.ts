import { describe, expect, it } from 'vitest';
import {
  buildIntelligencePriorityItems,
  buildIntelligencePriorityRequests,
} from './IntelligencePriorityIntegration';
import type { HeadquartersIntelligenceInsight } from './HeadquartersIntelligenceInsightEngine';

describe('IntelligencePriorityIntegration', () => {
  it('creates immediate request for critical recurring risk', () => {
    const requests = buildIntelligencePriorityRequests([insight('recurring_risk', 'immediate')]);

    expect(requests[0]?.policy).toBe('immediate');
    expect(requests[0]?.commanderOnly).toBe(true);
  });

  it('keeps improvement at standby and weak insights in background', () => {
    const requests = buildIntelligencePriorityRequests([
      insight('improvement', 'standby'),
      { ...insight('journal_theme', 'background'), strength: 'weak' },
    ]);

    expect(requests).toHaveLength(1);
    expect(requests[0]?.policy).toBe('standby');
  });

  it('deduplicates requests and marks resolved insights as cleared', () => {
    const resolved = { ...insight('regression', 'safe_point'), status: 'resolved' as const };
    const requests = buildIntelligencePriorityRequests([resolved, resolved]);

    expect(requests).toHaveLength(1);
    expect(requests[0]?.resolved).toBe(true);
    expect(requests[0]?.policy).toBe('background_only');
  });

  it('builds priority items without blocking active mission flow', () => {
    const items = buildIntelligencePriorityItems([insight('doctrine_conflict', 'safe_point')], '2026-07-13T00:00:00.000Z');

    expect(items[0]?.source).toBe('intelligence');
    expect(items[0]?.blocking).toBe(false);
    expect(items[0]?.explanation).toContain('Commander must decide');
  });
});

function insight(
  category: HeadquartersIntelligenceInsight['category'],
  urgency: HeadquartersIntelligenceInsight['urgency'],
): HeadquartersIntelligenceInsight {
  return {
    insightId: `insight:${category}`,
    category,
    title: `${category} insight`,
    conciseSummary: `${category} evidence exists.`,
    explanation: 'Evidence-backed insight.',
    relevance: 'current mission',
    urgency,
    strength: 'supported',
    evidenceReferences: [],
    supportingMissions: [],
    contradictoryMissions: [],
    relatedDoctrine: [],
    relatedGuardianRules: [],
    relatedJournalEntries: [],
    recommendedRoom: 'intelligence',
    recommendedAction: 'Review evidence.',
    createdAt: '2026-07-13T00:00:00.000Z',
    status: urgency === 'background' ? 'background' : 'active',
  };
}
