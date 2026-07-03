import { describe, expect, it } from 'vitest';
import {
  answerObservationInterview,
  answerReadyRoomBriefing,
  getNextObservationInterviewQuestion,
  getNextReadyRoomBriefingQuestion,
  isObservationInterviewComplete,
  isReadyRoomBriefingComplete,
} from './CommanderMissionBriefing';

describe('CommanderMissionBriefing', () => {
  it('collects Ready Room operational briefing one answer at a time', () => {
    let context = answerReadyRoomBriefing(undefined, 'ES morning continuation').context;

    expect(getNextReadyRoomBriefingQuestion(context)).toBe("Describe today's market environment.");

    context = answerReadyRoomBriefing(context, 'Trending').context;
    context = answerReadyRoomBriefing(context, 'CPI at 8:30').context;
    context = answerReadyRoomBriefing(context, 'focused').context;
    context = answerReadyRoomBriefing(context, '1%').context;
    const result = answerReadyRoomBriefing(context, 'Follow plan and stop after two attempts.');

    expect(result.complete).toBe(true);
    expect(result.response).toContain('Operational briefing complete.');
    expect(isReadyRoomBriefingComplete(result.context)).toBe(true);
  });

  it('collects Observation evidence and requires readiness before War Room authorization', () => {
    let context = answerObservationInterview(undefined, 'Up').context;

    expect(getNextObservationInterviewQuestion(context)).toBe('What market structure is currently present?');

    context = answerObservationInterview(context, 'Higher highs').context;
    context = answerObservationInterview(context, 'Increasing').context;
    context = answerObservationInterview(context, 'Above prior high').context;
    context = answerObservationInterview(context, 'Prior high and VWAP').context;
    const biasResult = answerObservationInterview(context, 'Long continuation');

    expect(biasResult.response).toContain('Hypotheses are not evidence.');

    context = answerObservationInterview(biasResult.context, 'Break below VWAP').context;
    context = answerObservationInterview(context, 'Still focused').context;
    const notReady = answerObservationInterview(context, 'No');

    expect(notReady.response).toContain('Headquarters will not authorize movement on weak evidence.');
    expect(getNextObservationInterviewQuestion(notReady.context)).toContain('new visible evidence');

    context = answerObservationInterview(notReady.context, 'Volume confirmed the break').context;
    context = answerObservationInterview(context, 'Yes').context;
    const complete = answerObservationInterview(context, 'Trend up, key liquidity above, invalidation below VWAP.');

    expect(complete.complete).toBe(true);
    expect(complete.response).toContain('Authorization granted.');
    expect(isObservationInterviewComplete(complete.context)).toBe(true);
  });

  it('rejects unclear Observation readiness answers deterministically', () => {
    const context = {
      marketDirection: 'Up',
      marketStructure: 'Higher highs',
      volume: 'Strong',
      liquidity: 'Above prior high',
      keyLevels: 'VWAP',
      bias: 'Long',
      invalidationEvidence: 'VWAP failure',
      emotionalCheck: 'Focused',
    };
    const result = answerObservationInterview(context, 'maybe');

    expect(result.accepted).toBe(false);
    expect(result.complete).toBe(false);
    expect(result.response).toContain('Answer Yes or No.');
  });
});
