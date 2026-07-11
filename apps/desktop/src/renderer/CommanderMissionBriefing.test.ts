import { describe, expect, it } from 'vitest';
import {
  answerObservationInterview,
  answerReadyRoomBriefing,
  getNextReadyRoomBriefingQuestion,
  normalizeEconomicEventAnswer,
  observationInterviewCompleteMessage,
  parseAffirmativeNegativeAnswer,
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
});
