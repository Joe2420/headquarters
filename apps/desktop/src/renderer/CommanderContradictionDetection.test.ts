import { describe, expect, it } from 'vitest';
import { detectCommanderContradictions, formatCommanderContradictionMessage } from './CommanderContradictionDetection';
import { createEmptyMissionContext, updateMissionContextBriefing, updateMissionContextObservation } from './MissionContextMemory';

describe('CommanderContradictionDetection', () => {
  it('detects market environment contradictions between briefing and observation', () => {
    const context = updateMissionContextObservation(
      updateMissionContextBriefing(createEmptyMissionContext('mission-001'), {
        marketEnvironment: 'Low volatility range',
      }),
      {
        marketStructure: 'High volatility expansion with higher highs',
      },
    );

    const contradictions = detectCommanderContradictions(context);

    expect(contradictions[0]).toMatchObject({
      id: 'contradiction:market-environment',
      sourceRoom: 'ready-room',
      targetRoom: 'observation',
    });
    expect(contradictions[0]?.message).toContain('This conflicts with your earlier briefing.');
  });

  it('detects readiness and risk contradictions', () => {
    const context = updateMissionContextBriefing(createEmptyMissionContext('mission-001'), {
      personalReadiness: 'Stressed and distracted',
      riskParameters: '2%',
    });

    expect(detectCommanderContradictions(context)).toContainEqual(expect.objectContaining({
      id: 'contradiction:readiness-risk',
      sourceRoom: 'ready-room',
      targetRoom: 'observation',
    }));
  });

  it('does not report false positives for compatible answers', () => {
    const context = updateMissionContextObservation(
      updateMissionContextBriefing(createEmptyMissionContext('mission-001'), {
        marketEnvironment: 'Trending, controlled volatility',
        personalReadiness: 'Focused',
        riskParameters: '0.5%',
      }),
      {
        marketStructure: 'Higher highs and higher lows',
        invalidationEvidence: 'Break below VWAP',
      },
    );

    expect(detectCommanderContradictions(context)).toEqual([]);
  });

  it('includes room fields on every contradiction flag', () => {
    const context = updateMissionContextObservation(
      updateMissionContextBriefing(createEmptyMissionContext('mission-001'), {
        marketEnvironment: 'Range',
      }),
      {
        marketStructure: 'Strong trend expansion',
      },
    );

    const [contradiction] = detectCommanderContradictions(context);

    expect(contradiction).toMatchObject({
      sourceRoom: 'ready-room',
      targetRoom: 'observation',
    });
  });

  it('formats a calm Commander challenge when a contradiction exists', () => {
    const context = updateMissionContextObservation(
      updateMissionContextBriefing(createEmptyMissionContext('mission-001'), {
        marketEnvironment: 'Low volatility',
      }),
      {
        marketStructure: 'High volatility expansion',
      },
    );

    expect(formatCommanderContradictionMessage(detectCommanderContradictions(context))).toContain(
      'This conflicts with your earlier briefing.',
    );
  });
});
