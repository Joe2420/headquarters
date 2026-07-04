import { describe, expect, it } from 'vitest';
import { createEmptyMissionContext, updateMissionContextBriefing, updateMissionContextObservation } from './MissionContextMemory';
import {
  buildAuthorizationIntelligenceQuestion,
  buildCommanderIntelligenceSummary,
  buildDebriefIntelligenceComparison,
  buildMissionIntelligencePackage,
  serializeMissionIntelligencePackage,
} from './MissionIntelligencePackage';

describe('MissionIntelligencePackage', () => {
  it('builds a persistent package from briefing and observation context', () => {
    const context = updateMissionContextObservation(
      updateMissionContextBriefing(createEmptyMissionContext('mission-001'), {
        missionObjective: 'Wait for A+ continuation',
        market: 'NQ',
        marketEnvironment: 'Trending',
        highImpactNews: 'FOMC later',
        personalReadiness: 'focused',
        riskParameters: '1%',
        successCriteria: 'Only execute if invalidation is clear',
      }),
      {
        observedDirection: 'up',
        marketStructure: 'higher highs',
        volume: 'steady',
        liquidityNotes: 'above prior high',
        keyLevels: '18200 and 18140',
        directionalHypothesis: 'long continuation',
        invalidationEvidence: 'break below 18140',
        operationalSummary: 'Trend is intact but news risk remains.',
      },
    );

    const missionPackage = buildMissionIntelligencePackage({
      missionId: 'mission-001',
      missionName: 'Morning Patrol',
      currentState: 'authorization',
      missionContext: context,
      authorization: {
        decision: 'approved',
        reason: 'Evidence sufficient',
        operatorJustification: 'Structure and risk align.',
      },
    });

    expect(missionPackage).toMatchObject({
      missionId: 'mission-001',
      missionName: 'Morning Patrol',
      missionObjective: 'Wait for A+ continuation',
      market: 'NQ',
      economicEvents: 'FOMC later',
      trend: 'up',
      structure: 'higher highs',
      directionalHypothesis: 'long continuation',
      invalidation: 'break below 18140',
      missionResult: 'Authorized',
    });
    expect(missionPackage.missingEvidence).toEqual([]);
    expect(missionPackage.confidence.level).toBe('complete');
  });

  it('detects missing evidence and lowers confidence deterministically', () => {
    const missionPackage = buildMissionIntelligencePackage({
      missionId: 'mission-002',
      fallbackObjective: 'Observe range conditions',
      currentState: 'observation',
      missionContext: createEmptyMissionContext('mission-002'),
    });

    expect(missionPackage.missionObjective).toBe('Observe range conditions');
    expect(missionPackage.missingEvidence.map((item) => item.field)).toContain('market');
    expect(missionPackage.missingEvidence.map((item) => item.field)).toContain('riskLimit');
    expect(missionPackage.confidence.level).toBe('incomplete');
    expect(missionPackage.confidence.reasons).toContain('Risk limit is not clear');
  });

  it('summarizes authorization, debrief, and archive intelligence without mutation', () => {
    const missionPackage = buildMissionIntelligencePackage({
      missionId: 'mission-003',
      missionName: 'Archive Seal',
      currentState: 'archived',
      fallbackObjective: 'Protect discipline',
      authorization: {
        decision: 'denied',
        reason: 'Risk unclear',
      },
      debrief: {
        behaviorSummary: 'Stopped before pressure trade.',
        disciplineNotes: 'Followed invalidation rule.',
        lesson: 'No trade is a valid outcome.',
      },
      archiveReference: 'archive:mission-003',
    });

    expect(buildAuthorizationIntelligenceQuestion(missionPackage)).toContain('Before authorization');
    expect(buildCommanderIntelligenceSummary(missionPackage, 'archive')).toContain('Archive reference: archive:mission-003');
    expect(buildDebriefIntelligenceComparison(missionPackage)).toContain('Outcome: Archived');

    const serialized = serializeMissionIntelligencePackage(missionPackage);

    expect(serialized).toEqual(missionPackage);
    expect(serialized).not.toBe(missionPackage);
    expect(serialized.confidence).not.toBe(missionPackage.confidence);
    expect(serialized.missingEvidence).not.toBe(missionPackage.missingEvidence);
  });
});
