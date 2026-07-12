import { describe, expect, it } from 'vitest';
import { buildMissionEvaluation, type MissionEvaluationInput } from './MissionEvaluationEngine';
import type { MissionEvaluationEvidence } from './MissionEvaluationEngine';

describe('MissionEvaluationEngine', () => {
  it('creates a deterministic mission evaluation with all required dimensions', () => {
    const evaluation = buildMissionEvaluation({
      ...completeEvaluationInput,
      evaluatedAt: '2026-07-12T10:00:00.000Z',
    });

    expect(evaluation.id).toBe('evaluation:mission-evaluation-engine-001');
    expect(evaluation.verdict).toBe('Exceptional Process');
    expect(evaluation.classification).toBe(evaluation.verdict);
    expect(evaluation.dimensions.map((dimension) => dimension.id)).toEqual([
      'mission-discipline',
      'observation-quality',
      'authorization-quality',
      'risk-discipline',
      'debrief-quality',
      'journal-quality',
      'doctrine-contribution',
      'academy-growth',
    ]);
    expect(evaluation.commanderReview).toContain('Headquarters Evaluation');
    expect(JSON.stringify(evaluation)).not.toMatch(/profit|loss|pnl/i);
  });

  it('classifies Guardian restrictions and missing protective doctrine as process failure', () => {
    const evaluation = buildMissionEvaluation({
      ...completeEvaluationInput,
      guardian: {
        state: 'restriction',
        highestAlert: 'Guardian restricted authorization.',
      },
      doctrine: {
        activeProtectiveRule: 'No protective rule declared for current authorization.',
        pendingCandidateCount: 0,
        relevance: 'Doctrine did not protect this decision.',
      },
    });

    expect(evaluation.verdict).toBe('Process Failure');
    expect(evaluation.failures).toContain('Protective doctrine rule was not declared.');
    expect(evaluation.guardianNotes).toContain('Guardian restricted authorization.');
    expect(evaluation.recognitionEligible).toBe(false);
  });

  it('keeps incomplete missions out of final recognition', () => {
    const evaluation = buildMissionEvaluation({
      ...completeEvaluationInput,
      missionState: 'debrief',
    });

    expect(evaluation.verdict).toBe('Incomplete');
    expect(evaluation.archiveClassification).toBe('archive:pending');
    expect(evaluation.recognitionEligible).toBe(false);
  });

  it('preserves aborted missions as a formal evaluation result', () => {
    const evaluation = buildMissionEvaluation({
      ...completeEvaluationInput,
      missionState: 'aborted',
    });

    expect(evaluation.verdict).toBe('Mission Aborted');
    expect(evaluation.archiveClassification).toBe('archive:Mission Aborted');
    expect(evaluation.failures).toContain('Mission was aborted before normal closure.');
  });
});

const completeMissionIntelligence: MissionEvaluationEvidence = {
  missionId: 'mission-evaluation-engine-001',
  missionName: 'Evaluation Engine Mission',
  currentState: 'archived',
  missionObjective: 'Wait for clean expansion.',
  market: 'NQ',
  session: 'New York',
  marketEnvironment: 'Range into expansion.',
  economicEvents: 'None',
  riskLimit: '1R',
  operatorReadiness: 'focused',
  successCriteria: 'No forced trade.',
  trend: 'Higher highs',
  structure: 'Expansion',
  liquidity: 'Above prior high',
  volume: 'Rising',
  importantLevels: '18600 and 18520',
  directionalHypothesis: 'Long only after expansion.',
  invalidation: 'Back inside range.',
  contradictions: [],
  missingEvidence: [],
  guardianNotes: [],
  observationSummary: 'Evidence supported patience before authorization.',
  authorizationSummary: 'Decision approved | Rule and invalidation present.',
  debriefSummary: 'Operator respected process and recorded the lesson.',
  missionResult: 'Archived',
  archiveReference: 'archive:mission-evaluation-engine-001',
};

const completeEvaluationInput: MissionEvaluationInput = {
  missionId: 'mission-evaluation-engine-001',
  missionState: 'archived',
  missionIntelligence: completeMissionIntelligence,
  guardian: {
    state: 'secure',
    highestAlert: 'Guardian secure. No active restriction.',
  },
  doctrine: {
    activeProtectiveRule: 'No authorization without invalidation.',
    pendingCandidateCount: 1,
    relevance: 'Doctrine review is available for this operation.',
  },
  journalEntryCount: 1,
};
