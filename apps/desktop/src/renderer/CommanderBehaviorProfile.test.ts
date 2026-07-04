import { describe, expect, it } from 'vitest';
import { createEmptyMissionContext, updateMissionContextBriefing, updateMissionContextObservation, updateMissionContextReadiness } from './MissionContextMemory';
import {
  adaptCommanderQuestion,
  buildAdaptiveCommanderGuidance,
  buildCommanderBehaviorProfile,
  formatCommanderBehaviorMemory,
} from './CommanderBehaviorProfile';
import { buildMissionIntelligencePackage } from './MissionIntelligencePackage';

describe('CommanderBehaviorProfile', () => {
  it('builds deterministic behavioral evidence from mission history, growth events, and Guardian alerts', () => {
    const missionContext = updateMissionContextReadiness(
      updateMissionContextObservation(
        updateMissionContextBriefing(createEmptyMissionContext('mission-001'), {
          missionObjective: 'Protect process',
          market: 'NQ',
          marketEnvironment: 'Trending',
          highImpactNews: 'None',
          personalReadiness: 'focused',
          riskParameters: '1%',
          successCriteria: 'Follow plan',
        }),
        {
          observedDirection: 'up',
          marketStructure: 'higher highs',
          volume: 'steady',
          liquidityNotes: 'above high',
          keyLevels: '18200',
          directionalHypothesis: 'long',
          invalidationEvidence: 'break below level',
          evidenceReadiness: 'yes',
          operationalSummary: 'Complete evidence package.',
        },
      ),
      {
        briefingComplete: true,
        observationComplete: true,
      },
    );
    const profile = buildCommanderBehaviorProfile({
      missions: [{
        id: 'mission-001',
        campaign: 'Foundation Patrol',
        currentState: 'archived',
        missionContext,
      }],
      growthEvents: [{
        id: 'growth-001',
        eventDate: '2026-07-02',
        title: 'Waited for confirmation',
        description: 'Operator waited for evidence.',
        category: 'patience',
        evidence: {
          sourceType: 'journal_entry',
          sourceId: 'journal-001',
        },
        rewardStatus: 'not_awarded',
        createdAt: '2026-07-02T00:00:00.000Z',
      }],
      guardianAlerts: [{
        id: 'guardian-risk',
        title: 'Risk Monitoring',
        message: 'Guardian reports risk boundary is active.',
        priority: 'medium',
        sourceId: 'risk-monitoring',
      }],
    });

    expect(profile.missionCount).toBe(1);
    expect(profile.traits.find((trait) => trait.trait === 'preparationQuality')?.score).toBe(25);
    expect(profile.traits.find((trait) => trait.trait === 'patience')?.score).toBe(50);
    expect(profile.warnings.map((warning) => warning.source)).toContain('guardian');
    expect(profile.reinforcements.map((reinforcement) => reinforcement.trait)).toContain('patience');
    expect(formatCommanderBehaviorMemory(profile)).toContain('patience');
  });

  it('adapts questions and guidance without changing required mission structure', () => {
    const missionIntelligence = buildMissionIntelligencePackage({
      missionId: 'mission-002',
      fallbackObjective: 'Protect process',
    });
    const profile = buildCommanderBehaviorProfile({
      missions: [{
        id: 'mission-002',
        campaign: 'Hesitation Drill',
        currentState: 'observation',
        missionContext: updateMissionContextObservation(createEmptyMissionContext('mission-002'), {
          evidenceReadiness: 'no',
        }),
      }],
      missionIntelligence,
    });

    expect(profile.coachingFocus).toBe('hesitation');
    expect(adaptCommanderQuestion('Which rule protects this decision?', profile, 'war-room')).toContain('If hesitation is present');
    expect(buildAdaptiveCommanderGuidance(profile, 'war-room', missionIntelligence)).toBeUndefined();
  });

  it('uses evidence-based warnings and positive reinforcement', () => {
    const profile = buildCommanderBehaviorProfile({
      missions: [{
        id: 'mission-003',
        campaign: 'Preparation Drill',
        currentState: 'briefing',
        missionContext: updateMissionContextReadiness(createEmptyMissionContext('mission-003'), {
          briefingComplete: true,
        }),
      }],
      guardianAlerts: [{
        id: 'guardian-risk',
        title: 'Risk Monitoring',
        message: 'Guardian has detected recurring premature authorization requests.',
        priority: 'high',
        sourceId: 'risk-monitoring',
      }],
    });

    expect(buildAdaptiveCommanderGuidance(profile, 'war-room')).toBe('Guardian reports: Guardian has detected recurring premature authorization requests.');
    expect(buildAdaptiveCommanderGuidance(profile, 'ready-room')).toBe('Preparation Drill completed operational briefing.');
  });
});
