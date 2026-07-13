import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { buildIntelligenceRoomModel, IntelligenceRoomExperience } from './IntelligenceRoomExperience';
import type { HeadquartersIntelligenceInsight, IntelligenceTrendAnalysis, RelevantHistoricalMission } from '@headquarters/hqos';

describe('IntelligenceRoomExperience', () => {
  it('uses the highest relevant insight for the Intelligence Brief', () => {
    const model = buildIntelligenceRoomModel({
      insights: [insight('background'), insight('immediate')],
      similarMissions: [],
      trends: [],
    });

    expect(model.highestInsight?.urgency).toBe('immediate');
    expect(model.commanderSummary).toContain('2 missions');
  });

  it('renders calm empty state when no evidence exists', () => {
    const html = renderToStaticMarkup(<IntelligenceRoomExperience insights={[]} similarMissions={[]} trends={[]} />);

    expect(html).toContain('Insufficient cross-mission history');
    expect(html).toContain('No evidence network is available yet');
  });

  it('renders evidence network, similar mission differences, and trend sample size', () => {
    const html = renderToStaticMarkup(
      <IntelligenceRoomExperience
        insights={[insight('safe_point')]}
        similarMissions={[similarMission()]}
        trends={[trend()]}
      />,
    );

    expect(html).toContain('Evidence-backed patterns');
    expect(html).toContain('Mission 84 had an active Guardian caution');
    expect(html).toContain('5 evidence records');
  });

  it('filters insights deterministically', () => {
    const model = buildIntelligenceRoomModel({
      insights: [insight('safe_point'), { ...insight('background'), title: 'Journal theme' }],
      similarMissions: [],
      trends: [],
      filterText: 'journal',
    });

    expect(model.filteredInsights).toHaveLength(1);
    expect(model.filteredInsights[0]?.title).toBe('Journal theme');
  });
});

function insight(urgency: HeadquartersIntelligenceInsight['urgency']): HeadquartersIntelligenceInsight {
  return {
    insightId: `insight-${urgency}`,
    category: 'authorization_pattern',
    title: 'Premature authorization pattern',
    conciseSummary: 'Supported by two missions.',
    explanation: 'Evidence-backed issue.',
    relevance: 'war-room',
    urgency,
    strength: 'supported',
    evidenceReferences: [{
      evidenceId: 'evidence-1',
      sourceSubsystem: 'evaluation',
      sourceEntityId: 'mission-1:evidence',
      description: 'Evaluation supports the pattern.',
    }],
    supportingMissions: ['mission-1', 'mission-2'],
    contradictoryMissions: [],
    relatedDoctrine: [],
    relatedGuardianRules: [],
    relatedJournalEntries: [],
    recommendedRoom: 'war-room',
    recommendedAction: 'Review authorization evidence before requesting approval.',
    createdAt: '2026-07-13T00:00:00.000Z',
    status: urgency === 'background' ? 'background' : 'active',
  };
}

function similarMission(): RelevantHistoricalMission {
  return {
    relevanceId: 'relevance-1',
    missionId: 'mission-84',
    relevanceReasons: ['Shared market and risk context.'],
    matchedDimensions: ['market', 'risk'],
    importantDifferences: ['Mission 84 had an active Guardian caution.'],
    evaluationSummary: 'Historical evidence.',
    relatedGuardianEvents: [],
    relatedDoctrine: [],
    relatedLessons: [],
    replayId: 'replay:mission-84',
    evidenceReferences: [],
    relevanceStrength: 'supported',
  };
}

function trend(): IntelligenceTrendAnalysis {
  return {
    trendId: 'trend-1',
    subject: 'Observation Discipline',
    trend: 'improving',
    explanation: 'Observation discipline is improving.',
    sampleSize: 5,
    recentWindowSize: 5,
    comparisonWindowSize: 5,
    supportingObservations: [],
    contradictoryObservations: [],
  };
}
