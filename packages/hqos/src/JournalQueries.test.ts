import { describe, expect, it } from 'vitest';
import { archiveJournalRecord, createJournalRecord, markJournalReviewed } from './JournalRecord';
import {
  getJournalApprovedThemes,
  getJournalTimeline,
  listDoctrineSourceDrafts,
  listJournalByMission,
  listJournalByReviewState,
  listJournalByTheme,
  listJournalByType,
  listOpenCommitments,
  searchJournalRecords,
} from './JournalQueries';

const first = createJournalRecord({
  journalId: 'journal-1',
  recordType: 'mission_reflection',
  title: 'Patience',
  rawContent: 'I waited with patience and respected risk.',
  createdAt: '2026-07-13T00:00:00.000Z',
  author: 'operator',
  missionId: 'mission-1',
  behaviorTags: ['patience'],
});
const second = markJournalReviewed(createJournalRecord({
  journalId: 'journal-2',
  recordType: 'commitment',
  title: 'Commitment',
  rawContent: 'Prepare before authorization.',
  createdAt: '2026-07-13T01:00:00.000Z',
  author: 'operator',
}), { now: '2026-07-13T01:00:00.000Z' });
const archived = archiveJournalRecord(createJournalRecord({
  journalId: 'journal-3',
  recordType: 'doctrine_source',
  title: 'Doctrine',
  rawContent: 'Protective rule debrief source.',
  createdAt: '2026-07-13T02:00:00.000Z',
  author: 'operator',
}), { now: '2026-07-13T02:00:00.000Z' });

describe('JournalQueries', () => {
  const records = [archived, second, first];

  it('searches text case-insensitively with source excerpts', () => {
    const hits = searchJournalRecords(records, { text: 'PATIENCE' });

    expect(hits).toHaveLength(1);
    expect(hits[0]?.sourceExcerpt).toContain('patience');
  });

  it('filters by mission, type, review state, and archive state', () => {
    expect(listJournalByMission(records, 'mission-1').map((record) => record.journalId)).toEqual(['journal-1']);
    expect(listJournalByType(records, 'commitment')).toHaveLength(1);
    expect(listJournalByReviewState(records, 'reviewed')).toHaveLength(1);
    expect(searchJournalRecords(records, { archived: true }).map((hit) => hit.record.journalId)).toEqual(['journal-3']);
  });

  it('returns deterministic timeline ordering', () => {
    expect(getJournalTimeline(records).map((record) => record.journalId)).toEqual(['journal-1', 'journal-2', 'journal-3']);
  });

  it('supports approved themes without unsupported pattern conclusions', () => {
    expect(getJournalApprovedThemes(first)).toContain('patience');
    expect(listJournalByTheme(records, 'risk_discipline')).toHaveLength(1);
    expect(getJournalApprovedThemes(createJournalRecord({
      journalId: 'ambiguous',
      recordType: 'free_note',
      title: 'Ambiguous',
      rawContent: 'Unclear note.',
      createdAt: '2026-07-13T03:00:00.000Z',
      author: 'operator',
    }))).toEqual([]);
  });

  it('lists commitments and doctrine drafts', () => {
    expect(listOpenCommitments(records).map((record) => record.journalId)).toEqual(['journal-2']);
    expect(listDoctrineSourceDrafts(records)).toEqual([]);
  });
});
