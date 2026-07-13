import { describe, expect, it } from 'vitest';
import type { ReplayEvent } from './MissionReplay';
import { archiveJournalRecord, createJournalRecord, linkJournalToMission } from './JournalRecord';
import {
  buildJournalReplayEntries,
  linkJournalRecordsToMission,
  mergeJournalIntoReplayTimeline,
} from './JournalMissionReplayIntegration';

const now = '2026-07-13T00:00:00.000Z';

const baseRecord = createJournalRecord({
  journalId: 'journal-1',
  recordType: 'mission_reflection',
  title: 'Mission reflection',
  rawContent: 'The operator waited for evidence before action.',
  createdAt: now,
  author: 'operator',
});

describe('JournalMissionReplayIntegration', () => {
  it('links Journal records to mission dossiers explicitly', () => {
    const linked = linkJournalToMission(baseRecord, 'mission-1', { now });

    const links = linkJournalRecordsToMission([linked], 'mission-1');

    expect(links).toEqual([{
      journalId: 'journal-1',
      missionId: 'mission-1',
      recordType: 'mission_reflection',
      reviewState: 'draft',
      excerpt: 'The operator waited for evidence before action.',
      evidenceCount: 0,
    }]);
  });

  it('creates read-only replay entries for archived Journal evidence', () => {
    const archived = archiveJournalRecord(linkJournalToMission(baseRecord, 'mission-1', { now }), { now });

    expect(buildJournalReplayEntries([archived])[0]?.readOnly).toBe(true);
  });

  it('merges Journal entries into replay chronology deterministically', () => {
    const replayEvent: ReplayEvent = {
      id: 'event-2',
      type: 'room_entered',
      section: 'debrief',
      occurredAt: '2026-07-13T00:10:00.000Z',
      title: 'Debrief entered',
      summary: 'Mission entered debrief.',
      actor: 'commander',
      evidence: [],
    };
    const linked = linkJournalToMission(baseRecord, 'mission-1', { now });

    const timeline = mergeJournalIntoReplayTimeline([replayEvent], buildJournalReplayEntries([linked]));

    expect(timeline.map((entry) => entry.id)).toEqual(['journal:journal-1', 'event-2']);
  });
});
