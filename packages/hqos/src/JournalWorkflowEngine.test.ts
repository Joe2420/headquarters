import { describe, expect, it } from 'vitest';
import { createJournalRecord, linkJournalEvidence, markJournalReviewed } from './JournalRecord';
import {
  archiveJournalWorkflowRecord,
  beginJournalEntry,
  beginJournalReflection,
  buildJournalExtraction,
  buildJournalWorkflowSnapshot,
  completeJournalReflection,
  proposeJournalDoctrineCandidate,
  recordJournalEntry,
  returnJournalForRevision,
  reviewJournalExtraction,
} from './JournalWorkflowEngine';

const now = '2026-07-13T00:00:00.000Z';

function record(type = 'raw_entry' as const) {
  return createJournalRecord({
    journalId: 'journal-1',
    recordType: type,
    title: 'Journal record',
    rawContent: 'The operator waited for evidence before acting.',
    createdAt: now,
    author: 'operator',
  });
}

describe('JournalWorkflowEngine', () => {
  it('starts with raw capture and allows draft save without interpretation', () => {
    const snapshot = beginJournalEntry();

    expect(snapshot.currentStage).toBe('capture');
    expect(snapshot.requiredAction).toBe('beginEntry');
    expect(recordJournalEntry(record()).currentState).toBe('capturing');
  });

  it('moves a recorded entry into reflection later', () => {
    const snapshot = beginJournalReflection(record());

    expect(snapshot.currentStage).toBe('reflect');
    expect(snapshot.currentState).toBe('reflection_required');
    expect(snapshot.requiredAction).toBe('beginReflection');
  });

  it('labels incomplete extraction without promoting it as truth', () => {
    const snapshot = buildJournalExtraction(record(), false);

    expect(snapshot.extractionState).toBe('incomplete');
    expect(snapshot.promotionEligibility).toBe('review_required');
    expect(snapshot.requiredAction).toBe('reviewExtraction');
  });

  it('requires explicit review before promotion eligibility', () => {
    const reflected = completeJournalReflection(record());
    const activeRecord = reflected.activeRecord;
    expect(activeRecord).toBeDefined();
    if (!activeRecord) throw new Error('Expected active record.');
    const reviewed = reviewJournalExtraction(activeRecord);

    expect(reflected.promotionEligibility).toBe('review_required');
    expect(reviewed.promotionEligibility).toBe('eligible');
  });

  it('returns records for revision with missing fields', () => {
    const snapshot = returnJournalForRevision(record(), ['sourceExcerpt']);

    expect(snapshot.currentState).toBe('clarification_required');
    expect(snapshot.missingFields).toEqual(['sourceExcerpt']);
  });

  it('keeps archived records read-only in workflow output', () => {
    const archived = archiveJournalWorkflowRecord(markJournalReviewed(record(), { now }), now);

    expect(archived.currentState).toBe('archived');
    expect(archived.requiredAction).toBe('archiveRecord');
    expect(archived.optionalActions).toEqual([]);
  });

  it('represents recovery reflection as blocked until required evidence exists', () => {
    const recovery = createJournalRecord({
      journalId: 'recovery-1',
      recordType: 'recovery_reflection',
      title: 'Recovery reflection',
      rawContent: 'I must document the behavior that triggered the restriction.',
      createdAt: now,
      author: 'operator',
    });

    const snapshot = buildJournalWorkflowSnapshot({
      activeRecord: recovery,
      blocker: {
        blockerId: 'guardian-recovery',
        source: 'guardian',
        reason: 'Guardian requires written recovery evidence.',
        requiredAction: 'completeReflection',
      },
    });

    expect(snapshot.currentState).toBe('blocked');
    expect(snapshot.requiredAction).toBe('completeReflection');
  });

  it('reconstructs reload-safe workflow state from persisted record fields', () => {
    const persisted = linkJournalEvidence(markJournalReviewed(record(), { now }), {
      id: 'mission-1',
      source: 'mission',
    }, { now });

    const snapshot = buildJournalWorkflowSnapshot({ activeRecord: persisted, persistenceState: 'reloaded' });

    expect(snapshot.persistenceState).toBe('reloaded');
    expect(snapshot.reviewState).toBe('reviewed');
    expect(snapshot.promotionEligibility).toBe('eligible');
  });

  it('does not auto-approve Doctrine or Academy from Journal review', () => {
    const snapshot = proposeJournalDoctrineCandidate(markJournalReviewed(record(), { now }));

    expect(snapshot.reviewState).toBe('reviewed');
    expect(snapshot.promotionEligibility).toBe('eligible');
    expect(snapshot.requiredAction).toBe('approveLesson');
  });
});
