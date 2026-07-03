import { describe, expect, it } from 'vitest';
import { getNextCommanderFollowUp, type CommanderFollowUpId } from './CommanderFollowUpEngine';
import { createEmptyMissionContext, updateMissionContextBriefing, updateMissionContextObservation } from './MissionContextMemory';

describe('CommanderFollowUpEngine', () => {
  it('returns a news follow-up when high-impact news is declared', () => {
    const context = updateMissionContextBriefing(createEmptyMissionContext('mission-001'), {
      highImpactNews: 'FOMC at 14:00',
    });

    expect(getNextCommanderFollowUp(context)).toMatchObject({
      id: 'briefing:high-impact-news-risk',
      question: 'How will this event affect your timing or risk?',
    });
  });

  it('returns a readiness restriction follow-up for tired or stressed conditions', () => {
    const context = updateMissionContextBriefing(createEmptyMissionContext('mission-001'), {
      highImpactNews: 'None',
      personalReadiness: 'Tired and distracted',
    });

    expect(getNextCommanderFollowUp(context)).toMatchObject({
      id: 'briefing:readiness-restriction',
      question: 'What restriction will protect you from poor execution today?',
    });
  });

  it('returns a risk justification follow-up when risk is high', () => {
    const context = updateMissionContextBriefing(createEmptyMissionContext('mission-001'), {
      highImpactNews: 'None',
      personalReadiness: 'Focused',
      riskParameters: '2%',
    });

    expect(getNextCommanderFollowUp(context)).toMatchObject({
      id: 'briefing:risk-justification',
      question: 'Why is this risk justified today?',
    });
  });

  it('returns null when no deterministic follow-up condition is present', () => {
    const context = updateMissionContextBriefing(createEmptyMissionContext('mission-001'), {
      highImpactNews: 'None',
      personalReadiness: 'Focused',
      riskParameters: '0.5%',
    });

    expect(getNextCommanderFollowUp(context)).toBeNull();
  });

  it('does not repeat a follow-up once its id is answered', () => {
    const answeredFollowUpIds: CommanderFollowUpId[] = ['briefing:high-impact-news-risk'];
    const context = updateMissionContextBriefing(createEmptyMissionContext('mission-001'), {
      highImpactNews: 'CPI',
      personalReadiness: 'Focused',
    });

    expect(getNextCommanderFollowUp(context, { answeredFollowUpIds })).toBeNull();
  });

  it('asks for invalidation when an observation hypothesis lacks evidence against it', () => {
    const context = updateMissionContextObservation(createEmptyMissionContext('mission-001'), {
      directionalHypothesis: 'Long continuation',
    });

    expect(getNextCommanderFollowUp(context)).toMatchObject({
      id: 'observation:hypothesis-invalidation',
      question: 'What would prove this hypothesis wrong?',
    });
  });
});
