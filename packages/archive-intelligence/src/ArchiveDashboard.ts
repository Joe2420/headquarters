import type { ArchiveIntelligenceRecord } from './ArchiveSearch';
import type { ArchiveEventInspection } from './EventExplorer';
import type { ArchivePattern } from './PatternDetection';
import type { ArchiveReplayPreparation } from './ReplayPreparation';
import type { ArchiveSessionInspection } from './SessionExplorer';

export interface ArchiveDashboardInput {
  readonly records: readonly ArchiveIntelligenceRecord[];
  readonly searchResultCount: number;
  readonly timelineItemCount: number;
  readonly eventInspections: readonly ArchiveEventInspection[];
  readonly sessionInspections: readonly ArchiveSessionInspection[];
  readonly patterns: readonly ArchivePattern[];
  readonly replayPreparation?: ArchiveReplayPreparation;
}

export interface ArchiveDashboardSummary {
  readonly recordCount: number;
  readonly searchResultCount: number;
  readonly timelineItemCount: number;
  readonly eventCount: number;
  readonly sessionCount: number;
  readonly patternCount: number;
  readonly replayItemCount: number;
  readonly status: 'empty' | 'ready';
}

export function buildArchiveDashboard(input: ArchiveDashboardInput): ArchiveDashboardSummary {
  const replayItemCount = input.replayPreparation?.totalItems ?? 0;
  const totalEvidence =
    input.records.length +
    input.searchResultCount +
    input.timelineItemCount +
    input.eventInspections.length +
    input.sessionInspections.length +
    input.patterns.length +
    replayItemCount;

  return {
    recordCount: input.records.length,
    searchResultCount: input.searchResultCount,
    timelineItemCount: input.timelineItemCount,
    eventCount: input.eventInspections.length,
    sessionCount: input.sessionInspections.length,
    patternCount: input.patterns.length,
    replayItemCount,
    status: totalEvidence === 0 ? 'empty' : 'ready',
  };
}
