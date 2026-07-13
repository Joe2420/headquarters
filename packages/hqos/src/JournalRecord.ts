export type JournalRecordType =
  | 'raw_entry'
  | 'daily_reflection'
  | 'mission_reflection'
  | 'trade_review'
  | 'debrief_extension'
  | 'recovery_reflection'
  | 'lesson'
  | 'commitment'
  | 'growth_evidence'
  | 'doctrine_source'
  | 'free_note';

export type JournalSource =
  | 'operator_manual'
  | 'commander_prompt'
  | 'mission_debrief'
  | 'mission_replay'
  | 'guardian_recovery'
  | 'doctrine_review'
  | 'academy_review'
  | 'imported_legacy_record';

export type JournalReviewState =
  | 'draft'
  | 'recorded'
  | 'awaiting_reflection'
  | 'reflected'
  | 'reviewed'
  | 'promoted_to_evidence'
  | 'archived'
  | 'superseded';

export type JournalArchiveState = 'active' | 'archived' | 'superseded';

export interface JournalEvidenceReference {
  readonly id: string;
  readonly source: string;
  readonly description?: string | undefined;
}

export interface JournalLink {
  readonly linkId: string;
  readonly targetType: 'mission' | 'trade' | 'session' | 'journal' | 'doctrine' | 'academy' | 'guardian' | 'archive';
  readonly targetId: string;
  readonly reason: string;
}

export interface JournalRevision {
  readonly revisionId: string;
  readonly journalId: string;
  readonly version: number;
  readonly rawContent: string;
  readonly createdAt: string;
  readonly reason: string;
}

export interface JournalReflection {
  readonly summary: string;
  readonly answeredDimensions: readonly string[];
  readonly unresolvedDimensions: readonly string[];
}

export interface JournalLesson {
  readonly lessonId: string;
  readonly text: string;
  readonly evidenceReferences: readonly JournalEvidenceReference[];
  readonly reviewState: JournalReviewState;
}

export interface JournalCommitment {
  readonly commitmentId: string;
  readonly text: string;
  readonly observableAction: string;
  readonly reviewState: JournalReviewState;
}

export interface JournalTheme {
  readonly themeId: string;
  readonly label: string;
  readonly evidenceReferences: readonly JournalEvidenceReference[];
}

export interface JournalKnowledgeExtraction {
  readonly extractionId: string;
  readonly lessons: readonly JournalLesson[];
  readonly commitments: readonly JournalCommitment[];
  readonly themes: readonly JournalTheme[];
  readonly evidenceReferences: readonly JournalEvidenceReference[];
}

export interface JournalRecordInput {
  readonly journalId: string;
  readonly recordType: JournalRecordType;
  readonly title: string;
  readonly rawContent: string;
  readonly createdAt: string;
  readonly author: string;
  readonly source?: JournalSource | undefined;
  readonly missionId?: string | undefined;
  readonly tradeId?: string | undefined;
  readonly sessionId?: string | undefined;
  readonly lifecycleStage?: string | undefined;
  readonly moodOrCondition?: string | undefined;
  readonly marketContext?: string | undefined;
  readonly behaviorTags?: readonly string[] | undefined;
  readonly evidenceReferences?: readonly JournalEvidenceReference[] | undefined;
  readonly linkedRecordIds?: readonly string[] | undefined;
  readonly reviewState?: JournalReviewState | undefined;
  readonly archiveState?: JournalArchiveState | undefined;
  readonly immutableSourceMetadata?: Readonly<Record<string, string | number | boolean>> | undefined;
}

export interface JournalRecord {
  readonly journalId: string;
  readonly recordType: JournalRecordType;
  readonly title: string;
  readonly rawContent: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly author: string;
  readonly source: JournalSource;
  readonly missionId?: string | undefined;
  readonly tradeId?: string | undefined;
  readonly sessionId?: string | undefined;
  readonly lifecycleStage?: string | undefined;
  readonly moodOrCondition?: string | undefined;
  readonly marketContext?: string | undefined;
  readonly behaviorTags: readonly string[];
  readonly evidenceReferences: readonly JournalEvidenceReference[];
  readonly links: readonly JournalLink[];
  readonly linkedRecordIds: readonly string[];
  readonly reviewState: JournalReviewState;
  readonly archiveState: JournalArchiveState;
  readonly revision: readonly JournalRevision[];
  readonly supersedesJournalId?: string | undefined;
  readonly immutableSourceMetadata: Readonly<Record<string, string | number | boolean>>;
  readonly reflection?: JournalReflection | undefined;
  readonly knowledgeExtraction?: JournalKnowledgeExtraction | undefined;
}

export type JournalRecordSnapshot = JournalRecord;

export interface JournalRecordMutationOptions {
  readonly now: string;
}

export interface JournalRecordRevisionInput extends JournalRecordMutationOptions {
  readonly revisionId: string;
  readonly reason: string;
  readonly rawContent: string;
  readonly replacementJournalId?: string | undefined;
}

export class JournalRecordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JournalRecordError';
  }
}

export function createJournalRecord(input: JournalRecordInput): JournalRecord {
  const journalId = requireText(input.journalId, 'Journal record requires journalId.');
  const title = requireText(input.title, 'Journal record requires title.');
  const rawContent = requireText(input.rawContent, 'Journal record requires rawContent.');
  const createdAt = requireText(input.createdAt, 'Journal record requires createdAt.');
  const author = requireText(input.author, 'Journal record requires author.');

  return freezeRecord({
    journalId,
    recordType: input.recordType,
    title,
    rawContent,
    createdAt,
    updatedAt: createdAt,
    author,
    source: input.source ?? 'operator_manual',
    ...optionalText('missionId', input.missionId),
    ...optionalText('tradeId', input.tradeId),
    ...optionalText('sessionId', input.sessionId),
    ...optionalText('lifecycleStage', input.lifecycleStage),
    ...optionalText('moodOrCondition', input.moodOrCondition),
    ...optionalText('marketContext', input.marketContext),
    behaviorTags: uniqueStrings(input.behaviorTags ?? []),
    evidenceReferences: uniqueEvidence(input.evidenceReferences ?? []),
    links: [],
    linkedRecordIds: uniqueStrings(input.linkedRecordIds ?? []),
    reviewState: input.reviewState ?? 'draft',
    archiveState: input.archiveState ?? 'active',
    revision: [],
    immutableSourceMetadata: { ...(input.immutableSourceMetadata ?? {}) },
  });
}

export function reviseJournalRecord(record: JournalRecord, input: JournalRecordRevisionInput): JournalRecord {
  if (!isJournalEditable(record)) {
    const replacementJournalId = requireText(
      input.replacementJournalId,
      'Sealed Journal records require a replacementJournalId for revision.',
    );
    return freezeRecord({
      ...copyJournalRecord(record),
      journalId: replacementJournalId,
      rawContent: requireText(input.rawContent, 'Journal revision requires rawContent.'),
      updatedAt: input.now,
      supersedesJournalId: record.journalId,
      reviewState: 'draft',
      archiveState: 'active',
      revision: [
        ...record.revision,
        {
          revisionId: requireText(input.revisionId, 'Journal revision requires revisionId.'),
          journalId: record.journalId,
          version: record.revision.length + 1,
          rawContent: record.rawContent,
          createdAt: input.now,
          reason: requireText(input.reason, 'Journal revision requires reason.'),
        },
      ],
    });
  }

  return freezeRecord({
    ...copyJournalRecord(record),
    rawContent: requireText(input.rawContent, 'Journal revision requires rawContent.'),
    updatedAt: input.now,
    revision: [
      ...record.revision,
      {
        revisionId: requireText(input.revisionId, 'Journal revision requires revisionId.'),
        journalId: record.journalId,
        version: record.revision.length + 1,
        rawContent: record.rawContent,
        createdAt: input.now,
        reason: requireText(input.reason, 'Journal revision requires reason.'),
      },
    ],
  });
}

export function linkJournalToMission(record: JournalRecord, missionId: string, options: JournalRecordMutationOptions): JournalRecord {
  const normalizedMissionId = requireText(missionId, 'Mission link requires missionId.');
  return freezeRecord({
    ...copyJournalRecord(record),
    missionId: normalizedMissionId,
    updatedAt: options.now,
    links: addUniqueLink(record.links, {
      linkId: `mission:${normalizedMissionId}`,
      targetType: 'mission',
      targetId: normalizedMissionId,
      reason: 'Journal record linked to mission evidence.',
    }),
  });
}

export function linkJournalEvidence(
  record: JournalRecord,
  evidence: JournalEvidenceReference,
  options: JournalRecordMutationOptions,
): JournalRecord {
  return freezeRecord({
    ...copyJournalRecord(record),
    updatedAt: options.now,
    evidenceReferences: uniqueEvidence([...record.evidenceReferences, evidence]),
  });
}

export function markJournalReviewed(record: JournalRecord, options: JournalRecordMutationOptions): JournalRecord {
  return freezeRecord({
    ...copyJournalRecord(record),
    updatedAt: options.now,
    reviewState: 'reviewed',
  });
}

export function archiveJournalRecord(record: JournalRecord, options: JournalRecordMutationOptions): JournalRecord {
  return freezeRecord({
    ...copyJournalRecord(record),
    updatedAt: options.now,
    reviewState: 'archived',
    archiveState: 'archived',
  });
}

export function supersedeJournalRecord(
  record: JournalRecord,
  supersededByJournalId: string,
  options: JournalRecordMutationOptions,
): JournalRecord {
  return freezeRecord({
    ...copyJournalRecord(record),
    updatedAt: options.now,
    reviewState: 'superseded',
    archiveState: 'superseded',
    links: addUniqueLink(record.links, {
      linkId: `journal:${requireText(supersededByJournalId, 'Supersession requires target journal id.')}`,
      targetType: 'journal',
      targetId: supersededByJournalId.trim(),
      reason: 'Journal record superseded by later revision.',
    }),
  });
}

export function getJournalRevisionHistory(record: JournalRecord): readonly JournalRevision[] {
  return record.revision.map((revision) => ({ ...revision }));
}

export function isJournalEditable(record: JournalRecord): boolean {
  return record.reviewState === 'draft' || record.reviewState === 'awaiting_reflection';
}

export function isJournalPromotable(record: JournalRecord): boolean {
  return record.reviewState === 'reviewed' || record.reviewState === 'reflected';
}

export function copyJournalRecord(record: JournalRecord): JournalRecord {
  return freezeRecord({
    ...record,
    behaviorTags: [...record.behaviorTags],
    evidenceReferences: record.evidenceReferences.map((evidence) => ({ ...evidence })),
    links: record.links.map((link) => ({ ...link })),
    linkedRecordIds: [...record.linkedRecordIds],
    revision: record.revision.map((revision) => ({ ...revision })),
    immutableSourceMetadata: { ...record.immutableSourceMetadata },
    ...(record.reflection ? {
      reflection: {
        ...record.reflection,
        answeredDimensions: [...record.reflection.answeredDimensions],
        unresolvedDimensions: [...record.reflection.unresolvedDimensions],
      },
    } : {}),
    ...(record.knowledgeExtraction ? {
      knowledgeExtraction: copyKnowledgeExtraction(record.knowledgeExtraction),
    } : {}),
  });
}

function copyKnowledgeExtraction(extraction: JournalKnowledgeExtraction): JournalKnowledgeExtraction {
  return {
    extractionId: extraction.extractionId,
    lessons: extraction.lessons.map((lesson) => ({
      ...lesson,
      evidenceReferences: lesson.evidenceReferences.map((evidence) => ({ ...evidence })),
    })),
    commitments: extraction.commitments.map((commitment) => ({ ...commitment })),
    themes: extraction.themes.map((theme) => ({
      ...theme,
      evidenceReferences: theme.evidenceReferences.map((evidence) => ({ ...evidence })),
    })),
    evidenceReferences: extraction.evidenceReferences.map((evidence) => ({ ...evidence })),
  };
}

function freezeRecord(record: JournalRecord): JournalRecord {
  return Object.freeze({
    ...record,
    behaviorTags: Object.freeze([...record.behaviorTags]),
    evidenceReferences: Object.freeze(record.evidenceReferences.map((evidence) => Object.freeze({ ...evidence }))),
    links: Object.freeze(record.links.map((link) => Object.freeze({ ...link }))),
    linkedRecordIds: Object.freeze([...record.linkedRecordIds]),
    revision: Object.freeze(record.revision.map((revision) => Object.freeze({ ...revision }))),
    immutableSourceMetadata: Object.freeze({ ...record.immutableSourceMetadata }),
  });
}

function requireText(value: string | undefined, message: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new JournalRecordError(message);
  return normalized;
}

function optionalText<TKey extends string>(key: TKey, value: string | undefined): Partial<Record<TKey, string>> {
  const normalized = value?.trim();
  return normalized ? { [key]: normalized } as Partial<Record<TKey, string>> : {};
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function uniqueEvidence(values: readonly JournalEvidenceReference[]): readonly JournalEvidenceReference[] {
  const map = new Map<string, JournalEvidenceReference>();
  for (const value of values) {
    const id = value.id.trim();
    const source = value.source.trim();
    if (!id || !source) continue;
    map.set(`${source}:${id}`, {
      id,
      source,
      ...optionalText('description', value.description),
    });
  }
  return [...map.values()];
}

function addUniqueLink(values: readonly JournalLink[], link: JournalLink): readonly JournalLink[] {
  const existing = values.find((value) => value.linkId === link.linkId);
  if (existing) return values.map((value) => ({ ...value }));
  return [...values.map((value) => ({ ...value })), { ...link }];
}
