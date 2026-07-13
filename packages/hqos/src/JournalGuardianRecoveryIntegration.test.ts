import { describe, expect, it } from 'vitest';
import { createJournalRecord, linkJournalEvidence } from './JournalRecord';
import { extractJournalKnowledge } from './JournalKnowledgeExtractionEngine';
import {
  createJournalGuardianRecoveryWorkflow,
  submitJournalGuardianRecoveryEvidence,
} from './JournalGuardianRecoveryIntegration';

const now = '2026-07-13T00:00:00.000Z';

function recoveryRecord(withEvidence: boolean) {
  const record = createJournalRecord({
    journalId: 'recovery-1',
    recordType: 'recovery_reflection',
    title: 'Recovery reflection',
    rawContent: 'I rushed and will state evidence before authorization.',
    createdAt: now,
    author: 'operator',
  });
  return withEvidence ? linkJournalEvidence(record, { id: 'guardian-1', source: 'guardian' }, { now }) : record;
}

const requirement = {
  requirementId: 'guardian-recovery-1',
  description: 'Write the behavior that triggered the restriction.',
  evidenceRequired: true,
  longTermBehaviorRequired: true,
};

describe('JournalGuardianRecoveryIntegration', () => {
  it('keeps draft recovery reflection from clearing lockout', () => {
    const workflow = createJournalGuardianRecoveryWorkflow({
      record: recoveryRecord(false),
      requirement,
      returnContext: 'War Room',
    });

    expect(workflow.status).toBe('draft_required');
    expect(workflow.immediateRequirementResolved).toBe(false);
    expect(workflow.returnContext).toBe('War Room');
  });

  it('accepts supported recovery evidence for immediate requirement only', () => {
    const workflow = createJournalGuardianRecoveryWorkflow({ record: recoveryRecord(true), requirement });
    const evidence = extractJournalKnowledge(recoveryRecord(true), { now }).candidateRecoveryEvidence;
    expect(evidence).toBeDefined();
    if (!evidence) throw new Error('Expected recovery evidence.');

    const submitted = submitJournalGuardianRecoveryEvidence(workflow, evidence);

    expect(submitted.status).toBe('accepted');
    expect(submitted.immediateRequirementResolved).toBe(true);
    expect(submitted.longTermBehaviorPending).toBe(true);
  });

  it('rejects unsupported evidence with explanation', () => {
    const workflow = createJournalGuardianRecoveryWorkflow({ record: recoveryRecord(false), requirement });
    const evidence = extractJournalKnowledge(recoveryRecord(false), { now }).candidateRecoveryEvidence;
    expect(evidence).toBeDefined();
    if (!evidence) throw new Error('Expected recovery evidence.');

    const submitted = submitJournalGuardianRecoveryEvidence(workflow, evidence);

    expect(submitted.status).toBe('rejected');
    expect(submitted.explanation).toContain('Guardian recovery evidence rejected');
  });
});
