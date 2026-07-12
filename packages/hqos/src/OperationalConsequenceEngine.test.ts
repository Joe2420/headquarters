import { describe, expect, it } from 'vitest';
import { buildMissionEvaluation, type MissionEvaluation } from './MissionEvaluationEngine';
import { createOperationalConsequence, resolveOperationalConsequence, completeRecoveryRequirement } from './OperationalConsequence';
import { deriveOperationalConsequences } from './OperationalConsequenceEngine';

describe('OperationalConsequenceEngine', () => {
  it('does not punish a disciplined losing mission', () => {
    const evaluation = successfulEvaluation();
    const result = deriveOperationalConsequences({
      missionId: 'mission-disciplined-loss',
      evaluatedAt,
      missionEvaluation: evaluation,
      financialOutcome: 'negative',
    });

    expect(result.candidates).toEqual([]);
    expect(result.noOpReasons).toContain('Disciplined losing mission did not produce a negative process consequence.');
  });

  it('creates a consequence for profitable process failure', () => {
    const result = deriveOperationalConsequences({
      missionId: 'mission-profitable-failure',
      evaluatedAt,
      missionEvaluation: processFailureEvaluation('mission-profitable-failure'),
      financialOutcome: 'positive',
    });

    expect(result.candidates).toHaveLength(2);
    expect(result.candidates.some((item) => item.title === 'Profitable process failure')).toBe(true);
  });

  it('derives recovery for missing protective rule', () => {
    const result = deriveOperationalConsequences({
      missionId: 'mission-rule-missing',
      evaluatedAt,
      missionEvaluation: processFailureEvaluation('mission-rule-missing'),
    });

    const rule = result.candidates.find((item) => item.type === 'authorization_without_protective_rule');
    expect(rule?.severity).toBe('restriction');
    expect(rule?.recoveryRequirements[0]?.type).toBe('confirm_protective_rule');
  });

  it('is idempotent for repeated processing', () => {
    const first = deriveOperationalConsequences({
      missionId: 'mission-idempotent',
      evaluatedAt,
      missionEvaluation: processFailureEvaluation('mission-idempotent'),
    });
    const second = deriveOperationalConsequences({
      missionId: 'mission-idempotent',
      evaluatedAt,
      missionEvaluation: processFailureEvaluation('mission-idempotent'),
      existingConsequences: first.candidates,
    });

    expect(second.candidates).toEqual([]);
    expect(second.noOpReasons).toContain('Duplicate or historical consequences were suppressed.');
  });

  it('keeps resolved consequences resolved without new evidence', () => {
    const active = createOperationalConsequence({
      consequenceId: 'consequence:mission-resolved:missing-protective-rule',
      missionId: 'mission-resolved',
      category: 'doctrine',
      type: 'authorization_without_protective_rule',
      severity: 'restriction',
      title: 'Protective rule missing',
      explanation: 'Rule missing.',
      cause: 'Rule missing.',
      effect: 'Authorization blocked.',
      evidenceReferences: [{ id: 'evaluation:mission-resolved', source: 'mission-evaluation' }],
      createdAt: evaluatedAt,
      recoveryRequirements: [{
        requirementId: 'recovery:mission-resolved:rule',
        description: 'Provide rule.',
        type: 'confirm_protective_rule',
        evidenceRequired: true,
      }],
    });
    const recovering = completeRecoveryRequirement(active, {
      requirementId: 'recovery:mission-resolved:rule',
      completedAt: evaluatedAt,
      evidenceReferences: [{ id: 'doctrine:rule', source: 'doctrine' }],
    });
    const resolved = resolveOperationalConsequence(recovering, {
      resolvedAt: evaluatedAt,
      resolutionEvidence: [{ id: 'doctrine:rule', source: 'doctrine' }],
    });

    const result = deriveOperationalConsequences({
      missionId: 'mission-resolved',
      evaluatedAt,
      missionEvaluation: processFailureEvaluation('mission-resolved'),
      existingConsequences: [resolved],
    });

    expect(result.candidates.some((item) => item.consequenceId === resolved.consequenceId)).toBe(false);
  });

  it('derives contradiction and incomplete debrief consequences', () => {
    const result = deriveOperationalConsequences({
      missionId: 'mission-contradiction',
      evaluatedAt,
      missionEvaluation: buildMissionEvaluation({
        missionId: 'mission-contradiction',
        missionState: 'archived',
        missionIntelligence: {
          missionId: 'mission-contradiction',
          missingEvidence: [],
          contradictions: [{ field: 'bias' }],
          guardianNotes: [],
        },
        guardian: { state: 'secure', highestAlert: 'Guardian secure.' },
        doctrine: {
          activeProtectiveRule: 'No authorization without invalidation.',
          pendingCandidateCount: 0,
          relevance: 'Doctrine clear.',
        },
        evaluatedAt,
      }),
    });

    expect(result.candidates.some((item) => item.type === 'unresolved_contradiction')).toBe(true);
    expect(result.candidates.some((item) => item.type === 'incomplete_debrief')).toBe(true);
  });

  it('creates Guardian lockout and persistence failure consequences', () => {
    const result = deriveOperationalConsequences({
      missionId: 'mission-lockout',
      evaluatedAt,
      guardianAlerts: [{
        id: 'guardian-lockout-1',
        level: 'lockout',
        title: 'Daily loss lockout',
        message: 'Guardian lockout active.',
      }],
      persistence: {
        id: 'save-1',
        missionId: 'mission-lockout',
        failed: true,
        message: 'Save failed.',
        recoverable: true,
      },
    });

    expect(result.candidates.some((item) => item.type === 'guardian_lockout' && item.severity === 'lockout')).toBe(true);
    expect(result.candidates.some((item) => item.type === 'persistence_failure')).toBe(true);
  });

  it('derives repeated premature authorization only from trusted history', () => {
    const result = deriveOperationalConsequences({
      missionId: 'mission-pattern',
      evaluatedAt,
      priorMissionPatterns: [{
        type: 'premature_authorization',
        sourceMissionIds: ['mission-a', 'mission-b'],
      }],
    });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.type).toBe('repeated_premature_authorization');
  });
});

const evaluatedAt = '2026-07-12T12:00:00.000Z';

function successfulEvaluation(): MissionEvaluation {
  return buildMissionEvaluation({
    missionId: 'mission-disciplined-loss',
    missionState: 'archived',
    missionIntelligence: {
      missionId: 'mission-disciplined-loss',
      riskLimit: '1R',
      invalidation: 'No expansion.',
      missingEvidence: [],
      contradictions: [],
      guardianNotes: [],
      observationSummary: 'Waited for evidence.',
      authorizationSummary: 'Authorized by rule.',
      debriefSummary: 'No trade was correct.',
    },
    guardian: { state: 'secure', highestAlert: 'Guardian secure.' },
    doctrine: {
      activeProtectiveRule: 'No authorization without invalidation.',
      pendingCandidateCount: 0,
      relevance: 'Doctrine clear.',
    },
    evaluatedAt,
  });
}

function processFailureEvaluation(missionId: string): MissionEvaluation {
  return buildMissionEvaluation({
    missionId,
    missionState: 'archived',
    missionIntelligence: {
      missionId,
      riskLimit: '1R',
      missingEvidence: [],
      contradictions: [],
      guardianNotes: [],
      debriefSummary: 'Reviewed the violation.',
    },
    guardian: { state: 'restriction', highestAlert: 'Guardian restricted authorization.' },
    doctrine: {
      activeProtectiveRule: 'No protective rule declared for current authorization.',
      pendingCandidateCount: 0,
      relevance: 'Doctrine missing.',
    },
    evaluatedAt,
  });
}
