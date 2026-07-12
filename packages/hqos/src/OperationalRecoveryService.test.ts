import { describe, expect, it } from 'vitest';
import { createOperationalConsequence } from './OperationalConsequence';
import { OperationalRecoveryService } from './OperationalRecoveryService';

describe('OperationalRecoveryService', () => {
  it('resolves an immediate consequence with valid evidence', () => {
    const service = new OperationalRecoveryService();
    const result = service.acceptRecoveryEvidence(createConsequence(), {
      requirementId: 'recovery:mission-1:rule',
      providedAt: '2026-07-12T15:00:00.000Z',
      evidenceReferences: [{ id: 'doctrine:rule', source: 'doctrine' }],
    });

    expect(result.status).toBe('resolved');
    expect(result.consequence.status).toBe('resolved');
    expect(result.outstandingRequirements).toEqual([]);
  });

  it('rejects invalid or missing evidence', () => {
    const service = new OperationalRecoveryService();
    const result = service.acceptRecoveryEvidence(createConsequence(), {
      requirementId: 'recovery:mission-1:rule',
      providedAt: '2026-07-12T15:00:00.000Z',
      evidenceReferences: [],
    });

    expect(result.status).toBe('rejected');
    expect(result.consequence.status).toBe('active');
  });

  it('keeps partial recovery active', () => {
    const service = new OperationalRecoveryService();
    const result = service.acceptRecoveryEvidence(createConsequenceWithTwoRequirements(), {
      requirementId: 'recovery:mission-1:rule',
      providedAt: '2026-07-12T15:00:00.000Z',
      evidenceReferences: [{ id: 'doctrine:rule', source: 'doctrine' }],
    });

    expect(result.status).toBe('accepted');
    expect(result.consequence.status).toBe('recovering');
    expect(result.outstandingRequirements).toHaveLength(1);
  });

  it('keeps long-term recovery pending', () => {
    const service = new OperationalRecoveryService();
    const consequence = createOperationalConsequence({
      ...baseConsequenceInput,
      recoveryRequirements: [{
        requirementId: 'recovery:mission-1:future',
        description: 'Demonstrate future adherence.',
        type: 'demonstrate_future_adherence',
        evidenceRequired: true,
      }],
    });

    const result = service.acceptRecoveryEvidence(consequence, {
      requirementId: 'recovery:mission-1:future',
      providedAt: '2026-07-12T15:00:00.000Z',
      evidenceReferences: [{ id: 'mission:future', source: 'mission' }],
    });

    expect(result.status).toBe('pending');
    expect(result.consequence.status).toBe('active');
  });

  it('handles repeated recovery command idempotently', () => {
    const service = new OperationalRecoveryService();
    const first = service.acceptRecoveryEvidence(createConsequenceWithTwoRequirements(), {
      requirementId: 'recovery:mission-1:rule',
      providedAt: '2026-07-12T15:00:00.000Z',
      evidenceReferences: [{ id: 'doctrine:rule', source: 'doctrine' }],
    });
    const second = service.acceptRecoveryEvidence(first.consequence, {
      requirementId: 'recovery:mission-1:rule',
      providedAt: '2026-07-12T15:01:00.000Z',
      evidenceReferences: [{ id: 'doctrine:rule', source: 'doctrine' }],
    });

    expect(second.status).toBe('accepted');
    expect(second.outstandingRequirements).toHaveLength(1);
  });
});

const baseConsequenceInput = {
  consequenceId: 'consequence:mission-1:rule',
  missionId: 'mission-1',
  category: 'doctrine' as const,
  type: 'authorization_without_protective_rule' as const,
  severity: 'restriction' as const,
  title: 'Protective rule missing',
  explanation: 'Rule missing.',
  cause: 'No protective rule.',
  effect: 'Authorization blocked.',
  evidenceReferences: [{ id: 'evaluation:mission-1', source: 'mission-evaluation' }],
  createdAt: '2026-07-12T14:00:00.000Z',
};

function createConsequence() {
  return createOperationalConsequence({
    ...baseConsequenceInput,
    recoveryRequirements: [{
      requirementId: 'recovery:mission-1:rule',
      description: 'Provide rule.',
      type: 'confirm_protective_rule',
      evidenceRequired: true,
    }],
  });
}

function createConsequenceWithTwoRequirements() {
  return createOperationalConsequence({
    ...baseConsequenceInput,
    recoveryRequirements: [
      {
        requirementId: 'recovery:mission-1:rule',
        description: 'Provide rule.',
        type: 'confirm_protective_rule',
        evidenceRequired: true,
      },
      {
        requirementId: 'recovery:mission-1:debrief',
        description: 'Complete debrief.',
        type: 'complete_debrief',
        evidenceRequired: true,
      },
    ],
  });
}
