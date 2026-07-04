import { describe, expect, it } from 'vitest';
import {
  buildCommanderChallenge,
  buildCommanderConversationState,
  buildMissionIntelligence,
  getObservationCommanderAcknowledgement,
  getReadyRoomCommanderAcknowledgement,
} from './CommanderConversation';

describe('CommanderConversation', () => {
  it('builds mission intelligence from briefing and observation context', () => {
    const intelligence = buildMissionIntelligence({
      briefing: {
        missionObjective: 'Trade the morning breakout.',
        market: 'ES futures.',
        marketEnvironment: 'Trending.',
        highImpactNews: 'CPI.',
        personalReadiness: 'Focused.',
        riskParameters: '1%.',
        successCriteria: 'Follow plan.',
      },
      observation: {
        marketDirection: 'Up.',
        marketStructure: 'Higher highs.',
        volume: 'Rising.',
        liquidity: 'Above prior high.',
        keyLevels: 'VWAP.',
        bias: 'Long continuation.',
        invalidationEvidence: 'VWAP failure.',
        emotionalCheck: 'Calm.',
        operationalPicture: 'Trend up with liquidity above.',
      },
    });

    expect(intelligence).toEqual({
      missionObjective: 'Trade the morning breakout.',
      market: 'ES futures.',
      marketEnvironment: 'Trending.',
      economicEvents: 'CPI.',
      readiness: 'Focused.',
      riskLimit: '1%.',
      successCriteria: 'Follow plan.',
      trend: 'Up.',
      marketStructure: 'Higher highs.',
      volume: 'Rising.',
      liquidity: 'Above prior high.',
      importantLevels: 'VWAP.',
      directionalHypothesis: 'Long continuation.',
      invalidation: 'VWAP failure.',
      emotionalState: 'Calm.',
      operationalPicture: 'Trend up with liquidity above.',
    });
  });

  it('tracks answered and missing conversation fields deterministically', () => {
    const state = buildCommanderConversationState({
      briefing: {
        missionObjective: 'Observe London range.',
        market: 'NQ.',
      },
    }, 'briefing');

    expect(state.tone).toBe('briefing');
    expect(state.answeredFields).toEqual(['missionObjective', 'market']);
    expect(state.missingFields).toContain('riskLimit');
    expect(state.missingFields).toContain('operationalPicture');
  });

  it('returns professional Ready Room acknowledgements without falling back to logged', () => {
    expect(getReadyRoomCommanderAcknowledgement('riskParameters', '1%')).toContain('Risk');
    expect(getReadyRoomCommanderAcknowledgement('highImpactNews', 'FOMC')).toContain('event');
    expect(getReadyRoomCommanderAcknowledgement('personalReadiness', 'stressed')).toContain('Guardian discipline');
  });

  it('returns Observation acknowledgements that reference prior evidence', () => {
    const acknowledgement = getObservationCommanderAcknowledgement('volume', 'weak', {
      marketStructure: 'Higher highs.',
    });

    expect(acknowledgement).toContain('Volume');
    expect(acknowledgement).toContain('Higher highs.');
  });

  it('challenges contradictions and weak reasoning without giving trading advice', () => {
    expect(buildCommanderChallenge({
      marketEnvironment: 'Range.',
      marketStructure: 'Higher highs and expansion.',
    })).toContain('conflicts');
    expect(buildCommanderChallenge({
      readiness: 'Tired.',
      riskLimit: '2%',
    })).toContain('does not support elevated risk');
    expect(buildCommanderChallenge({
      directionalHypothesis: 'Long continuation.',
    })).toContain('not actionable');
  });
});
