import { describe, expect, it } from 'vitest';
import {
  answerObservationInterview,
  answerReadyRoomBriefing,
  getNextReadyRoomBriefingQuestion,
  getNextObservationInterviewQuestion,
  normalizeEconomicEventAnswer,
  observationInterviewCompleteMessage,
  parseAffirmativeNegativeAnswer,
  type MissionBriefingContext,
  type MissionObservationContext,
} from './CommanderMissionBriefing';

describe('Commander mission briefing stabilization', () => {
  it('does not ask the Ready Room to recollect the mission objective', () => {
    expect(getNextReadyRoomBriefingQuestion({ missionObjective: 'Protect process.' })).toContain('What market are you trading?');
    expect(getNextReadyRoomBriefingQuestion({ missionObjective: 'Protect process.' })).not.toContain("primary mission");
  });

  it('normalizes negative economic-event answers as no scheduled event risk', () => {
    const result = answerReadyRoomBriefing({
      missionObjective: 'Protect process.',
      market: 'NQ',
      marketEnvironment: 'Range',
    }, 'nope');

    expect(result.field).toBe('highImpactNews');
    expect(result.context.highImpactNews).toBe('None');
    expect(result.response).not.toContain('Account for event volatility');
    expect(normalizeEconomicEventAnswer('no news')).toBe('None');
  });

  it('keeps Observation completion separate from War Room authorization', () => {
    expect(observationInterviewCompleteMessage).toContain('ready for authorization review');
    expect(observationInterviewCompleteMessage).toContain('Proceed to the War Room');
    expect(observationInterviewCompleteMessage).not.toContain('Authorization granted');
  });

  it('requests clarification for ambiguous yes or no answers', () => {
    expect(parseAffirmativeNegativeAnswer('yes')).toBe('yes');
    expect(parseAffirmativeNegativeAnswer('nope')).toBe('no');
    expect(parseAffirmativeNegativeAnswer('qwer')).toBeUndefined();

    const result = answerObservationInterview({
      marketDirection: 'upwards',
      marketStructure: 'HTF bullish / LTF bearish',
      volume: 'low',
      liquidity: 'above highs',
      keyLevels: 'VAL and VAH',
      bias: 'long',
      invalidationEvidence: 'sweep of highs',
      emotionalCheck: 'unchanged',
    }, 'qwer');

    expect(result.accepted).toBe(false);
    expect(result.response).toContain('Answer Yes or No');
  });

  it('matches the Commander lifecycle transcript fixture without duplicate questions', () => {
    let readyContext: MissionBriefingContext = { missionObjective: '123' };
    const readyAnswers = ['yxcv', 'qwer', 'nope', 'calm', '300', 'no FOMO'];
    const readyFields: string[] = [];
    const readyResponses: string[] = [];

    expect(getNextReadyRoomBriefingQuestion(readyContext)).toContain('What market are you trading?');
    expect(getNextReadyRoomBriefingQuestion(readyContext)).not.toContain('primary mission');

    for (const answer of readyAnswers) {
      const result = answerReadyRoomBriefing(readyContext, answer);
      expect(result.accepted).toBe(true);
      if (result.field) readyFields.push(result.field);
      readyResponses.push(result.response);
      readyContext = result.context;
    }

    expect(readyFields).toEqual([
      'market',
      'marketEnvironment',
      'highImpactNews',
      'personalReadiness',
      'riskParameters',
      'successCriteria',
    ]);
    expect(readyContext).toMatchObject({
      missionObjective: '123',
      market: 'yxcv',
      marketEnvironment: 'qwer',
      highImpactNews: 'None',
      personalReadiness: 'calm',
      riskParameters: '300',
      successCriteria: 'no FOMO',
    });
    expect(readyResponses.filter((response) => response === 'Operational briefing complete.\n\nMission profile accepted.\n\nProceed to Observation Room.')).toHaveLength(1);
    expect(readyResponses.join('\n')).not.toContain('Account for event volatility');

    let observationContext: MissionObservationContext = {};
    const observationAnswers = [
      'upwards',
      'HTF bullish / LTF bearish',
      'low',
      'above highs',
      'VAL and VAH',
      'long',
      'sweep of highs',
      'unchanged',
      'yes',
      'long only with confirmation',
    ];
    const observationFields: string[] = [];
    const observationResponses: string[] = [];

    expect(getNextObservationInterviewQuestion(observationContext)).toContain('Observation has begun.');

    for (const answer of observationAnswers) {
      const result = answerObservationInterview(observationContext, answer);
      expect(result.accepted).toBe(true);
      if (result.field) observationFields.push(result.field);
      observationResponses.push(result.response);
      observationContext = result.context;
    }

    expect(observationFields).toEqual([
      'marketDirection',
      'marketStructure',
      'volume',
      'liquidity',
      'keyLevels',
      'bias',
      'invalidationEvidence',
      'emotionalCheck',
      'readiness',
      'operationalPicture',
    ]);
    expect(observationContext).toMatchObject({
      marketDirection: 'upwards',
      marketStructure: 'HTF bullish / LTF bearish',
      volume: 'low',
      liquidity: 'above highs',
      keyLevels: 'VAL and VAH',
      bias: 'long',
      invalidationEvidence: 'sweep of highs',
      emotionalCheck: 'unchanged',
      readiness: 'yes',
      operationalPicture: 'long only with confirmation',
    });
    expect(observationResponses.filter((response) => response === observationInterviewCompleteMessage)).toHaveLength(1);
    expect(observationResponses.join('\n')).not.toContain('Authorization granted');
  });
});
