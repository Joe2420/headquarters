import { describe, expect, it } from 'vitest';
import {
  archiveJournalRecord,
  copyJournalRecord,
  createJournalRecord,
  getJournalRevisionHistory,
  isJournalEditable,
  isJournalPromotable,
  linkJournalEvidence,
  linkJournalToMission,
  markJournalReviewed,
  reviseJournalRecord,
  supersedeJournalRecord,
} from './JournalRecord';

const now = '2026-07-13T00:00:00.000Z';

describe('JournalRecord', () => {
  it('creates a raw entry as immutable operator evidence', () => {
    const record = createJournalRecord({
      journalId: 'journal-1',
      recordType: 'raw_entry',
      title: 'Session note',
      rawContent: 'Observed patience before entry.',
      createdAt: now,
      author: 'operator',
      behaviorTags: ['patience', 'patience'],
    });

    expect(record.recordType).toBe('raw_entry');
    expect(record.rawContent).toBe('Observed patience before entry.');
    expect(record.behaviorTags).toEqual(['patience']);
    expect(Object.isFrozen(record)).toBe(true);
  });

  it('links a record to a mission without duplicating linkage', () => {
    const record = createJournalRecord({
      journalId: 'journal-1',
      recordType: 'mission_reflection',
      title: 'Mission reflection',
      rawContent: 'The mission followed plan.',
      createdAt: now,
      author: 'operator',
    });

    const linked = linkJournalToMission(record, 'mission-1', { now });
    const linkedAgain = linkJournalToMission(linked, 'mission-1', { now });

    expect(linkedAgain.missionId).toBe('mission-1');
    expect(linkedAgain.links).toHaveLength(1);
  });

  it('preserves original content when a sealed record is revised', () => {
    const recorded = markJournalReviewed(createJournalRecord({
      journalId: 'journal-1',
      recordType: 'daily_reflection',
      title: 'Daily reflection',
      rawContent: 'Original reflection.',
      createdAt: now,
      author: 'operator',
    }), { now });

    const revised = reviseJournalRecord(recorded, {
      revisionId: 'revision-1',
      replacementJournalId: 'journal-2',
      rawContent: 'Revised reflection.',
      reason: 'Operator clarified the record.',
      now: '2026-07-13T01:00:00.000Z',
    });

    expect(isJournalEditable(recorded)).toBe(false);
    expect(revised.journalId).toBe('journal-2');
    expect(revised.supersedesJournalId).toBe('journal-1');
    expect(getJournalRevisionHistory(revised)[0]?.rawContent).toBe('Original reflection.');
  });

  it('archives records while preserving revision history', () => {
    const record = reviseJournalRecord(createJournalRecord({
      journalId: 'journal-1',
      recordType: 'free_note',
      title: 'Note',
      rawContent: 'Draft.',
      createdAt: now,
      author: 'operator',
    }), {
      revisionId: 'revision-1',
      rawContent: 'Draft clarified.',
      reason: 'Clarified before sealing.',
      now,
    });

    const archived = archiveJournalRecord(record, { now });

    expect(archived.archiveState).toBe('archived');
    expect(archived.reviewState).toBe('archived');
    expect(getJournalRevisionHistory(archived)).toHaveLength(1);
  });

  it('keeps evidence links traceable and idempotent', () => {
    const record = createJournalRecord({
      journalId: 'journal-1',
      recordType: 'trade_review',
      title: 'Trade review',
      rawContent: 'Risk was respected.',
      createdAt: now,
      author: 'operator',
    });

    const linked = linkJournalEvidence(linkJournalEvidence(record, {
      id: 'mission-1',
      source: 'mission',
      description: 'Mission evidence',
    }, { now }), {
      id: 'mission-1',
      source: 'mission',
      description: 'Mission evidence',
    }, { now });

    expect(linked.evidenceReferences).toEqual([{
      id: 'mission-1',
      source: 'mission',
      description: 'Mission evidence',
    }]);
  });

  it('marks reviewed records as promotable and superseded records as historical', () => {
    const reviewed = markJournalReviewed(createJournalRecord({
      journalId: 'journal-1',
      recordType: 'lesson',
      title: 'Lesson',
      rawContent: 'Wait for evidence.',
      createdAt: now,
      author: 'operator',
    }), { now });

    const superseded = supersedeJournalRecord(reviewed, 'journal-2', { now });

    expect(isJournalPromotable(reviewed)).toBe(true);
    expect(superseded.reviewState).toBe('superseded');
    expect(superseded.archiveState).toBe('superseded');
  });

  it('supports imported legacy records without fabricating mission links', () => {
    const record = createJournalRecord({
      journalId: 'legacy-1',
      recordType: 'raw_entry',
      title: 'Legacy record',
      rawContent: 'Imported text.',
      createdAt: now,
      author: 'legacy-import',
      source: 'imported_legacy_record',
      immutableSourceMetadata: { legacyType: 'journal_entry' },
    });

    expect(record.missionId).toBeUndefined();
    expect(record.immutableSourceMetadata).toEqual({ legacyType: 'journal_entry' });
  });

  it('returns immutable copies from the read API', () => {
    const record = createJournalRecord({
      journalId: 'journal-1',
      recordType: 'raw_entry',
      title: 'Copy test',
      rawContent: 'Source text.',
      createdAt: now,
      author: 'operator',
    });

    const copy = copyJournalRecord(record);

    expect(copy).toEqual(record);
    expect(copy).not.toBe(record);
    expect(Object.isFrozen(copy.evidenceReferences)).toBe(true);
  });
});
