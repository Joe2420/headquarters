import { describe, expect, it } from 'vitest';
import { findRelevantHistoricalMissions, type HistoricalMissionEvidence } from './MissionHistoricalRelevance';

const evidence = [{
  evidenceId: 'historical-1',
  sourceSubsystem: 'archive',
  sourceEntityId: 'mission-84',
  description: 'Archived mission replay exists.',
}];

describe('MissionHistoricalRelevance', () => {
  it('does not create false relevance from market alone', () => {
    const results = findRelevantHistoricalMissions({
      currentMission: { missionId: 'mission-current', market: 'BTC' },
      historicalMissions: [historical('mission-84', { market: 'Bitcoin' })],
    });

    expect(results).toEqual([]);
  });

  it('ranks multiple supported matches higher and preserves replay link', () => {
    const results = findRelevantHistoricalMissions({
      currentMission: {
        missionId: 'mission-current',
        market: 'BTC',
        environment: 'low volume',
        risk: '1%',
        guardianRuleIds: ['rule-1'],
      },
      historicalMissions: [
        historical('mission-84', { market: 'BTC', environment: 'low volume', risk: '1%', guardianRuleIds: ['rule-1'] }),
        historical('mission-91', { market: 'BTC', environment: 'low volume' }),
      ],
    });

    expect(results[0]?.missionId).toBe('mission-84');
    expect(results[0]?.relevanceStrength).toBe('strong');
    expect(results[0]?.replayId).toBe('replay:mission-84');
  });

  it('shows important differences and excludes the current mission', () => {
    const results = findRelevantHistoricalMissions({
      currentMission: {
        missionId: 'mission-current',
        market: 'BTC',
        environment: 'range',
        risk: '1%',
        guardianRuleIds: [],
      },
      historicalMissions: [
        historical('mission-current', { market: 'BTC', environment: 'range', risk: '1%' }),
        historical('mission-84', { market: 'BTC', environment: 'range', risk: '2%', guardianRuleIds: ['rule-1'] }),
      ],
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.importantDifferences).toContain('Guardian state differs from the historical mission.');
    expect(`${results[0]?.evaluationSummary} ${results[0]?.relevanceReasons.join(' ')}`).not.toMatch(/will|predict/i);
  });
});

function historical(
  missionId: string,
  context: Omit<HistoricalMissionEvidence['context'], 'missionId'>,
): HistoricalMissionEvidence {
  return {
    missionId,
    context: { missionId, ...context },
    evaluationSummary: 'Historical process summary from archived evidence.',
    relatedGuardianEvents: ['guardian-event-1'],
    relatedDoctrine: ['doctrine-1'],
    relatedLessons: ['lesson-1'],
    replayId: `replay:${missionId}`,
    evidenceReferences: evidence,
  };
}
