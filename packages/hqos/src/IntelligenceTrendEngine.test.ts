import { describe, expect, it } from 'vitest';
import { analyzeIntelligenceTrends, type IntelligenceTrendObservation } from './IntelligenceTrendEngine';

describe('IntelligenceTrendEngine', () => {
  it('reports insufficient history and newly emerging trends safely', () => {
    expect(analyzeIntelligenceTrends({ observations: [] })).toEqual([]);
    expect(analyzeIntelligenceTrends({ observations: [observation(1, 'positive')] })[0]?.trend)
      .toBe('newly_emerging');
  });

  it('detects clear improvement and exposes sample size', () => {
    const trends = analyzeIntelligenceTrends({
      observations: [
        observation(1, 'negative'),
        observation(2, 'negative'),
        observation(3, 'positive'),
        observation(4, 'positive'),
        observation(5, 'positive'),
      ],
      windows: { recent: 3, comparison: 2 },
    });

    expect(trends[0]?.trend).toBe('improving');
    expect(trends[0]?.sampleSize).toBe(5);
    expect(trends[0]?.supportingObservations).toHaveLength(3);
  });

  it('detects clear regression and inconsistent evidence', () => {
    const declining = analyzeIntelligenceTrends({
      observations: [
        observation(1, 'positive'),
        observation(2, 'positive'),
        observation(3, 'negative'),
        observation(4, 'negative'),
      ],
      windows: { recent: 2, comparison: 2 },
    });
    const inconsistent = analyzeIntelligenceTrends({
      observations: [
        observation(1, 'positive'),
        observation(2, 'neutral'),
        observation(3, 'positive'),
        observation(4, 'negative'),
      ],
      windows: { recent: 2, comparison: 2 },
    });

    expect(declining[0]?.trend).toBe('declining');
    expect(inconsistent[0]?.trend).toBe('inconsistent');
  });

  it('detects recovered patterns and excludes PnL from behavior trend', () => {
    const trends = analyzeIntelligenceTrends({
      observations: [
        observation(1, 'negative'),
        observation(2, 'negative'),
        observation(3, 'recovered'),
        observation(4, 'recovered'),
        observation(5, 'positive', true),
      ],
      windows: { recent: 2, comparison: 2 },
    });

    expect(trends[0]?.trend).toBe('recovered');
    expect(trends[0]?.sampleSize).toBe(4);
  });

  it('deduplicates observations deterministically', () => {
    const duplicate = observation(1, 'positive');
    const trends = analyzeIntelligenceTrends({
      observations: [duplicate, duplicate, observation(2, 'positive')],
    });

    expect(trends[0]?.sampleSize).toBe(2);
  });
});

function observation(
  index: number,
  direction: IntelligenceTrendObservation['direction'],
  excludesTrend = false,
): IntelligenceTrendObservation {
  return {
    observationId: `observation-${index}`,
    missionId: `mission-${index}`,
    subject: 'Observation Discipline',
    occurredAt: `2026-07-${String(index).padStart(2, '0')}T00:00:00.000Z`,
    direction,
    summary: `${direction} evidence.`,
    sourceSubsystem: excludesTrend ? 'pnl' : 'evaluation',
    excludesTrend,
  };
}
