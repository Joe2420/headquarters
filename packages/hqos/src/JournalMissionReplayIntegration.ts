import type { JournalRecord } from './JournalRecord';
import type { ReplayEvent } from './MissionReplay';

export interface JournalMissionEvidenceLink {
  readonly journalId: string;
  readonly missionId: string;
  readonly recordType: JournalRecord['recordType'];
  readonly reviewState: JournalRecord['reviewState'];
  readonly excerpt: string;
  readonly evidenceCount: number;
}

export interface JournalReplayEntry {
  readonly id: string;
  readonly occurredAt: string;
  readonly room: 'Journal';
  readonly summary: string;
  readonly journalId: string;
  readonly missionId?: string | undefined;
  readonly readOnly: boolean;
}

export function linkJournalRecordsToMission(
  records: readonly JournalRecord[],
  missionId: string,
): readonly JournalMissionEvidenceLink[] {
  return records
    .filter((record) => record.missionId === missionId)
    .map((record) => ({
      journalId: record.journalId,
      missionId,
      recordType: record.recordType,
      reviewState: record.reviewState,
      excerpt: record.rawContent.slice(0, 180),
      evidenceCount: record.evidenceReferences.length,
    }))
    .sort((left, right) => left.journalId.localeCompare(right.journalId));
}

export function buildJournalReplayEntries(records: readonly JournalRecord[]): readonly JournalReplayEntry[] {
  return records
    .map((record) => ({
      id: `journal:${record.journalId}`,
      occurredAt: record.updatedAt,
      room: 'Journal' as const,
      summary: `${record.recordType}: ${record.title}`,
      journalId: record.journalId,
      ...(record.missionId ? { missionId: record.missionId } : {}),
      readOnly: record.archiveState === 'archived',
    }))
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id));
}

export function mergeJournalIntoReplayTimeline(
  replayEvents: readonly ReplayEvent[],
  journalEntries: readonly JournalReplayEntry[],
): ReadonlyArray<ReplayEvent | JournalReplayEntry> {
  return [...replayEvents, ...journalEntries]
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id));
}
