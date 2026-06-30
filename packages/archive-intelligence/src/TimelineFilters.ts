import type { MissionState } from '@headquarters/shared';
import type { MissionTimelineEntry } from '@headquarters/hqos';
import type { ArchiveIntelligenceRecord, ArchiveRecordType } from './ArchiveSearch';

export interface ArchiveTimelineFilter {
  readonly type?: ArchiveRecordType;
  readonly tag?: string;
  readonly occurredFrom?: string;
  readonly occurredTo?: string;
}

export interface MissionTimelineFilter {
  readonly missionId?: string;
  readonly fromState?: MissionState;
  readonly toState?: MissionState;
  readonly occurredFrom?: string;
  readonly occurredTo?: string;
}

export function filterArchiveTimeline(
  records: readonly ArchiveIntelligenceRecord[],
  filter: ArchiveTimelineFilter,
): readonly ArchiveIntelligenceRecord[] {
  const tag = filter.tag?.trim().toLowerCase();

  return records.filter((record) => {
    if (filter.type !== undefined && record.type !== filter.type) return false;
    if (tag !== undefined && !record.tags.some((recordTag) => recordTag.toLowerCase() === tag)) return false;
    return isWithinTimeRange(record.occurredAt, filter.occurredFrom, filter.occurredTo);
  });
}

export function filterMissionTimelineEntries(
  entries: readonly MissionTimelineEntry[],
  filter: MissionTimelineFilter,
): readonly MissionTimelineEntry[] {
  return entries.filter((entry) => {
    if (filter.missionId !== undefined && entry.missionId !== filter.missionId) return false;
    if (filter.fromState !== undefined && entry.transition.from !== filter.fromState) return false;
    if (filter.toState !== undefined && entry.transition.to !== filter.toState) return false;
    return isWithinTimeRange(entry.occurredAt, filter.occurredFrom, filter.occurredTo);
  });
}

function isWithinTimeRange(occurredAt: string, occurredFrom: string | undefined, occurredTo: string | undefined): boolean {
  if (occurredFrom !== undefined && occurredAt < occurredFrom) return false;
  if (occurredTo !== undefined && occurredAt > occurredTo) return false;
  return true;
}
