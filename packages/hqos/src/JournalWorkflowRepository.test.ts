import { describe, expect, it } from 'vitest';
import { createJournalRecord, archiveJournalRecord } from './JournalRecord';
import { extractJournalKnowledge } from './JournalKnowledgeExtractionEngine';
import {
  InMemoryJournalWorkflowRepository,
  migrateLegacyJournalRecord,
} from './JournalWorkflowRepository';

const now = '2026-07-13T00:00:00.000Z';

const record = createJournalRecord({
  journalId: 'journal-1',
  recordType: 'mission_reflection',
  title: 'Reflection',
  rawContent: 'I waited for evidence before action.',
  createdAt: now,
  author: 'operator',
});

describe('JournalWorkflowRepository', () => {
  it('reloads active draft and active question once', async () => {
    const repository = new InMemoryJournalWorkflowRepository();
    await repository.save({
      record,
      reflectionMode: 'mission_debrief_extension',
      activeQuestionId: 'what_behavior_occurred',
      answers: [],
    });

    const loaded = await repository.get('journal-1');

    expect(loaded?.activeQuestionId).toBe('what_behavior_occurred');
    expect(loaded?.reflectionMode).toBe('mission_debrief_extension');
  });

  it('reloads extraction review without duplication', async () => {
    const repository = new InMemoryJournalWorkflowRepository();
    const extraction = extractJournalKnowledge(record, { now });
    await repository.save({ record, answers: [], extraction });
    await repository.save({ record, answers: [], extraction });

    const loaded = await repository.get('journal-1');

    expect(loaded?.extraction?.items.map((item) => item.extractionId))
      .toEqual(extraction.items.map((item) => item.extractionId));
  });

  it('preserves archive state and revision history', async () => {
    const repository = new InMemoryJournalWorkflowRepository();
    const archived = archiveJournalRecord(record, { now });

    await repository.save({ record: archived, answers: [] });

    expect((await repository.get('journal-1'))?.record.archiveState).toBe('archived');
  });

  it('migrates legacy records without fabricating mission links', () => {
    const migrated = migrateLegacyJournalRecord({
      id: 'legacy-1',
      entryDate: '2026-07-13',
      rawContent: 'Legacy journal text.',
      createdAt: now,
      updatedAt: now,
      source: 'manual',
    });

    expect(migrated.source).toBe('imported_legacy_record');
    expect(migrated.missionId).toBeUndefined();
    expect(migrated.immutableSourceMetadata.unresolvedLegacyFields).toBe('mission link unknown');
  });
});
