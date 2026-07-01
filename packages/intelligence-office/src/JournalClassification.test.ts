import { describe, expect, it } from 'vitest';
import type { JournalEntry } from '@headquarters/journal';
import { classifyJournalEntry, classifyJournalEntries } from './JournalClassification';

const entry: JournalEntry = {
  id: 'journal-001',
  entryDate: '2026-07-01',
  rawContent: 'Mission debrief lesson: I showed patience and followed the rule.',
  rawMood: 'calm',
  rawMarketConditions: 'quiet market session',
  source: 'manual',
  attachmentReferences: ['screenshot-001'],
  classificationStatus: 'unclassified',
  createdAt: '2026-07-01T08:00:00.000Z',
  updatedAt: '2026-07-01T08:00:00.000Z',
};

describe('classifyJournalEntry', () => {
  it('classifies journal entries by approved deterministic categories', () => {
    const classification = classifyJournalEntry(entry);

    expect(classification.entryId).toBe('journal-001');
    expect(classification.categories).toEqual([
      'market_observation',
      'mission_reflection',
      'emotional_state',
      'lesson',
      'doctrine_candidate_source',
      'growth_event',
    ]);
    expect(classification.evidence.map((item) => item.keyword)).toContain('mission');
    expect(classification.evidence.map((item) => item.keyword)).toContain('rule');
  });

  it('preserves raw journal evidence without mutating the source entry', () => {
    const classification = classifyJournalEntry(entry);

    expect(classification.rawEntry).toEqual(entry);
    expect(classification.rawEntry).not.toBe(entry);
    expect(classification.rawEntry.attachmentReferences).not.toBe(entry.attachmentReferences);
    expect(entry.classificationStatus).toBe('unclassified');
  });
});

describe('classifyJournalEntries', () => {
  it('returns deterministic empty classifications for empty input', () => {
    expect(classifyJournalEntries([])).toEqual([]);
  });
});
