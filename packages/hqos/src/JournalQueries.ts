import type { JournalRecord, JournalRecordType, JournalReviewState } from './JournalRecord';

export type JournalApprovedTheme =
  | 'risk_discipline'
  | 'premature_authorization'
  | 'fomo'
  | 'patience'
  | 'observation_quality'
  | 'protective_rule'
  | 'emotional_change'
  | 'plan_deviation'
  | 'recovery'
  | 'preparation'
  | 'debrief_quality';

export interface JournalSearchQuery {
  readonly text?: string | undefined;
  readonly recordType?: JournalRecordType | undefined;
  readonly missionId?: string | undefined;
  readonly reviewState?: JournalReviewState | undefined;
  readonly theme?: JournalApprovedTheme | undefined;
  readonly archived?: boolean | undefined;
  readonly from?: string | undefined;
  readonly to?: string | undefined;
}

export interface JournalSearchHit {
  readonly record: JournalRecord;
  readonly sourceExcerpt: string;
}

export function listJournalRecords(records: readonly JournalRecord[]): readonly JournalRecord[] {
  return sortRecords(records);
}

export function getJournalRecord(records: readonly JournalRecord[], journalId: string): JournalRecord | undefined {
  return records.find((record) => record.journalId === journalId);
}

export function searchJournalRecords(records: readonly JournalRecord[], query: JournalSearchQuery): readonly JournalSearchHit[] {
  return sortRecords(records)
    .filter((record) => query.text ? normalize(record.rawContent).includes(normalize(query.text)) || normalize(record.title).includes(normalize(query.text)) : true)
    .filter((record) => query.recordType ? record.recordType === query.recordType : true)
    .filter((record) => query.missionId ? record.missionId === query.missionId : true)
    .filter((record) => query.reviewState ? record.reviewState === query.reviewState : true)
    .filter((record) => query.theme ? getJournalApprovedThemes(record).includes(query.theme) : true)
    .filter((record) => query.archived === undefined ? true : (record.archiveState === 'archived') === query.archived)
    .filter((record) => query.from ? record.createdAt >= query.from : true)
    .filter((record) => query.to ? record.createdAt <= query.to : true)
    .map((record) => ({ record, sourceExcerpt: buildSourceExcerpt(record, query.text) }));
}

export function listJournalByMission(records: readonly JournalRecord[], missionId: string): readonly JournalRecord[] {
  return searchJournalRecords(records, { missionId }).map((hit) => hit.record);
}

export function listJournalByType(records: readonly JournalRecord[], recordType: JournalRecordType): readonly JournalRecord[] {
  return searchJournalRecords(records, { recordType }).map((hit) => hit.record);
}

export function listJournalByReviewState(records: readonly JournalRecord[], reviewState: JournalReviewState): readonly JournalRecord[] {
  return searchJournalRecords(records, { reviewState }).map((hit) => hit.record);
}

export function listJournalByTheme(records: readonly JournalRecord[], theme: JournalApprovedTheme): readonly JournalRecord[] {
  return searchJournalRecords(records, { theme }).map((hit) => hit.record);
}

export function listJournalLessons(records: readonly JournalRecord[]): readonly JournalRecord[] {
  return listJournalByType(records, 'lesson');
}

export function listJournalCommitments(records: readonly JournalRecord[]): readonly JournalRecord[] {
  return listJournalByType(records, 'commitment');
}

export function listOpenCommitments(records: readonly JournalRecord[]): readonly JournalRecord[] {
  return listJournalCommitments(records).filter((record) => record.reviewState !== 'archived' && record.reviewState !== 'superseded');
}

export function listJournalRecoveryEvidence(records: readonly JournalRecord[]): readonly JournalRecord[] {
  return listJournalByType(records, 'recovery_reflection');
}

export function listDoctrineSourceDrafts(records: readonly JournalRecord[]): readonly JournalRecord[] {
  return listJournalByType(records, 'doctrine_source')
    .filter((record) => record.archiveState === 'active' && record.reviewState !== 'promoted_to_evidence');
}

export function listGrowthEvidenceCandidates(records: readonly JournalRecord[]): readonly JournalRecord[] {
  return listJournalByType(records, 'growth_evidence').filter((record) => record.reviewState === 'reviewed' || record.reviewState === 'reflected');
}

export function getJournalTimeline(records: readonly JournalRecord[]): readonly JournalRecord[] {
  return sortRecords(records);
}

export function getJournalApprovedThemes(record: JournalRecord): readonly JournalApprovedTheme[] {
  const normalized = normalize(`${record.rawContent} ${record.behaviorTags.join(' ')}`);
  const themes: JournalApprovedTheme[] = [];
  if (normalized.includes('risk')) themes.push('risk_discipline');
  if (normalized.includes('rush') || normalized.includes('premature')) themes.push('premature_authorization');
  if (normalized.includes('fomo')) themes.push('fomo');
  if (normalized.includes('wait') || normalized.includes('patience')) themes.push('patience');
  if (normalized.includes('volume') || normalized.includes('observe')) themes.push('observation_quality');
  if (normalized.includes('protective')) themes.push('protective_rule');
  if (normalized.includes('emotion') || normalized.includes('stress')) themes.push('emotional_change');
  if (normalized.includes('plan deviation')) themes.push('plan_deviation');
  if (normalized.includes('recover')) themes.push('recovery');
  if (normalized.includes('prepare')) themes.push('preparation');
  if (normalized.includes('debrief')) themes.push('debrief_quality');
  return [...new Set(themes)];
}

function sortRecords(records: readonly JournalRecord[]): readonly JournalRecord[] {
  return [...records].sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.journalId.localeCompare(right.journalId));
}

function buildSourceExcerpt(record: JournalRecord, text: string | undefined): string {
  if (!text) return record.rawContent.slice(0, 160);
  const index = normalize(record.rawContent).indexOf(normalize(text));
  if (index < 0) return record.rawContent.slice(0, 160);
  return record.rawContent.slice(Math.max(0, index - 30), Math.min(record.rawContent.length, index + text.length + 60));
}

function normalize(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/gu, ' ') ?? '';
}
