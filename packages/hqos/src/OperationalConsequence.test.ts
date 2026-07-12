import { describe, expect, it } from 'vitest';
import {
  OperationalConsequenceError,
  canResolveOperationalConsequence,
  completeRecoveryRequirement,
  createOperationalConsequence,
  getOutstandingRecoveryRequirements,
  isOperationalConsequenceActive,
  isOperationalConsequenceBlocking,
  resolveOperationalConsequence,
  supersedeOperationalConsequence,
  upsertOperationalConsequence,
} from './OperationalConsequence';

describe('OperationalConsequence contracts', () => {
  it('creates deterministic operational consequences', () => {
    const consequence = createTestConsequence();

    expect(consequence.consequenceId).toBe('consequence:mission-1:protective-rule');
    expect(consequence.status).toBe('active');
    expect(consequence.recoveryRequirements).toHaveLength(1);
    expect(consequence.metadata).toEqual({ attempt: 1 });
  });

  it('identifies active and blocking consequences', () => {
    const consequence = createTestConsequence();
    const caution = createTestConsequence({
      consequenceId: 'consequence:mission-1:caution',
      severity: 'caution',
    });

    expect(isOperationalConsequenceActive(consequence)).toBe(true);
    expect(isOperationalConsequenceBlocking(consequence)).toBe(true);
    expect(isOperationalConsequenceBlocking(caution)).toBe(false);
  });

  it('returns immutable outstanding recovery requirements', () => {
    const consequence = createTestConsequence();
    const outstanding = getOutstandingRecoveryRequirements(consequence);

    expect(outstanding).toHaveLength(1);
    expect(() => {
      (outstanding as unknown as unknown[]).push('mutate');
    }).toThrow(TypeError);
    expect(consequence.recoveryRequirements).toHaveLength(1);
  });

  it('rejects invalid resolution until recovery requirements are satisfied', () => {
    const consequence = createTestConsequence();

    expect(canResolveOperationalConsequence(consequence)).toBe(false);
    expect(() => resolveOperationalConsequence(consequence, {
      resolvedAt: '2026-07-12T11:00:00.000Z',
      resolutionEvidence: [{ id: 'evidence:rule', source: 'doctrine' }],
    })).toThrow(OperationalConsequenceError);
  });

  it('resolves consequences while preserving historical evidence', () => {
    const consequence = createTestConsequence();
    const recovering = completeRecoveryRequirement(consequence, {
      requirementId: 'recovery:protective-rule',
      completedAt: '2026-07-12T10:30:00.000Z',
      evidenceReferences: [{ id: 'doctrine:protective-rule', source: 'doctrine' }],
    });
    const resolved = resolveOperationalConsequence(recovering, {
      resolvedAt: '2026-07-12T11:00:00.000Z',
      resolutionEvidence: [{ id: 'doctrine:protective-rule', source: 'doctrine' }],
    });

    expect(resolved.status).toBe('resolved');
    expect(resolved.evidenceReferences).toEqual(consequence.evidenceReferences);
    expect(resolved.resolutionEvidence).toEqual([{ id: 'doctrine:protective-rule', source: 'doctrine' }]);
    expect(isOperationalConsequenceBlocking(resolved)).toBe(false);
  });

  it('supersedes consequences with explicit successor history', () => {
    const superseded = supersedeOperationalConsequence(createTestConsequence(), {
      supersededBy: 'consequence:mission-1:guardian-lockout',
      resolvedAt: '2026-07-12T11:15:00.000Z',
    });

    expect(superseded.status).toBe('superseded');
    expect(superseded.supersededBy).toBe('consequence:mission-1:guardian-lockout');
  });

  it('handles duplicate consequence identifiers deterministically through upsert', () => {
    const first = createTestConsequence();
    const second = createTestConsequence({
      title: 'Protective rule still missing',
      explanation: 'Updated explanation.',
    });

    const result = upsertOperationalConsequence([first], second);

    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe('Protective rule still missing');
  });

  it('rejects duplicate recovery requirement identifiers', () => {
    expect(() => createTestConsequence({
      recoveryRequirements: [
        {
          requirementId: 'recovery:duplicate',
          description: 'One',
          type: 'confirm_protective_rule',
          evidenceRequired: true,
        },
        {
          requirementId: 'recovery:duplicate',
          description: 'Two',
          type: 'complete_debrief',
          evidenceRequired: false,
        },
      ],
    })).toThrow(OperationalConsequenceError);
  });
});

function createTestConsequence(
  overrides: Partial<Parameters<typeof createOperationalConsequence>[0]> = {},
) {
  return createOperationalConsequence({
    consequenceId: 'consequence:mission-1:protective-rule',
    missionId: 'mission-1',
    category: 'doctrine',
    type: 'authorization_without_protective_rule',
    severity: 'restriction',
    title: 'Protective rule missing',
    explanation: 'Authorization cannot continue until a protective rule is declared.',
    cause: 'War Room authorization was requested without doctrine protection.',
    effect: 'Authorization is restricted.',
    evidenceReferences: [{ id: 'authorization:mission-1', source: 'mission' }],
    sourceEvaluationId: 'evaluation:mission-1',
    createdAt: '2026-07-12T10:00:00.000Z',
    activatedAt: '2026-07-12T10:00:00.000Z',
    recoveryRequirements: [{
      requirementId: 'recovery:protective-rule',
      description: 'Provide a protective rule before authorization.',
      type: 'confirm_protective_rule',
      evidenceRequired: true,
    }],
    metadata: { attempt: 1 },
    ...overrides,
  });
}
