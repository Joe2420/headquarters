import type { JournalEvidenceReference, JournalRecord } from './JournalRecord';

export type JournalExtractionType =
  | 'lesson'
  | 'commitment'
  | 'behavior_tag'
  | 'theme'
  | 'doctrine_source'
  | 'growth_evidence'
  | 'recovery_evidence'
  | 'unresolved_question'
  | 'contradiction';

export type JournalExtractionConfidence = 'insufficient' | 'tentative' | 'supported' | 'repeated';
export type JournalExtractionEligibility = 'ineligible' | 'needs_review' | 'eligible';
export type JournalExtractionStatus = 'candidate' | 'approved' | 'revised' | 'rejected' | 'kept_as_reflection';

export interface JournalSourceRange {
  readonly start: number;
  readonly end: number;
}

export interface JournalKnowledgeExtractionItem {
  readonly extractionId: string;
  readonly journalId: string;
  readonly extractionType: JournalExtractionType;
  readonly proposedText: string;
  readonly sourceExcerpt: string;
  readonly sourceRange: JournalSourceRange;
  readonly evidenceReferences: readonly JournalEvidenceReference[];
  readonly confidenceState: JournalExtractionConfidence;
  readonly missingEvidence: readonly string[];
  readonly contradictions: readonly string[];
  readonly eligibility: JournalExtractionEligibility;
  readonly createdAt: string;
  readonly status: JournalExtractionStatus;
}

export interface JournalKnowledgeExtractionResult {
  readonly journalId: string;
  readonly candidateLesson?: JournalKnowledgeExtractionItem | undefined;
  readonly candidateCommitment?: JournalKnowledgeExtractionItem | undefined;
  readonly candidateBehaviorTag?: JournalKnowledgeExtractionItem | undefined;
  readonly candidateJournalTheme?: JournalKnowledgeExtractionItem | undefined;
  readonly candidateDoctrineSource?: JournalKnowledgeExtractionItem | undefined;
  readonly candidateGrowthEvidence?: JournalKnowledgeExtractionItem | undefined;
  readonly candidateRecoveryEvidence?: JournalKnowledgeExtractionItem | undefined;
  readonly unresolvedQuestion?: JournalKnowledgeExtractionItem | undefined;
  readonly contradiction?: JournalKnowledgeExtractionItem | undefined;
  readonly items: readonly JournalKnowledgeExtractionItem[];
}

const behaviorMappings: ReadonlyArray<{ readonly token: string; readonly tag: string; readonly lesson: string; readonly commitment: string }> = [
  {
    token: 'volume',
    tag: 'confirmation_quality',
    lesson: 'Do not authorize action before volume confirms the declared structure.',
    commitment: 'Before requesting authorization, explicitly confirm whether volume supports the observed structure.',
  },
  {
    token: 'rushed',
    tag: 'premature_authorization',
    lesson: 'Slow the authorization sequence when urgency appears before evidence.',
    commitment: 'Before authorization, state the evidence and the invalidation out loud.',
  },
  {
    token: 'waited',
    tag: 'patience',
    lesson: 'Patience protected the plan until evidence was present.',
    commitment: 'Continue requiring visible evidence before action.',
  },
  {
    token: 'risk',
    tag: 'risk_discipline',
    lesson: 'Risk discipline must remain visible before and after entry.',
    commitment: 'State the acceptable risk before requesting authorization.',
  },
];

export function extractJournalKnowledge(record: JournalRecord, options: { readonly now: string }): JournalKnowledgeExtractionResult {
  const content = record.rawContent.trim();
  const normalized = content.toLowerCase();
  const mapping = behaviorMappings.find((candidate) => normalized.includes(candidate.token));
  const evidenceReferences = record.evidenceReferences.map((evidence) => ({ ...evidence }));
  const sourceRange = { start: 0, end: Math.min(content.length, 160) };
  const sourceExcerpt = content.slice(sourceRange.start, sourceRange.end);
  const items: JournalKnowledgeExtractionItem[] = [];

  if (!mapping || content.length < 20) {
    const unresolved = createItem(record, options.now, 'unresolved_question', 'More reflection is required before Headquarters can extract knowledge.', sourceExcerpt, sourceRange, evidenceReferences, 'insufficient', ['specific behavior'], [], 'ineligible');
    return { journalId: record.journalId, unresolvedQuestion: unresolved, items: [unresolved] };
  }

  const confidenceState = evidenceReferences.length > 1 ? 'repeated' : evidenceReferences.length === 1 ? 'supported' : 'tentative';
  const lesson = createItem(record, options.now, 'lesson', mapping.lesson, sourceExcerpt, sourceRange, evidenceReferences, confidenceState, evidenceReferences.length === 0 ? ['supporting mission evidence'] : [], [], evidenceReferences.length > 0 ? 'eligible' : 'needs_review');
  const commitment = createItem(record, options.now, 'commitment', mapping.commitment, sourceExcerpt, sourceRange, evidenceReferences, confidenceState, [], [], 'eligible');
  const behaviorTag = createItem(record, options.now, 'behavior_tag', mapping.tag, sourceExcerpt, sourceRange, evidenceReferences, confidenceState, [], [], 'eligible');
  const theme = createItem(record, options.now, 'theme', normalizeTheme(mapping.tag), sourceExcerpt, sourceRange, evidenceReferences, confidenceState, [], [], 'eligible');
  items.push(lesson, commitment, behaviorTag, theme);

  const doctrineSource = createItem(
    record,
    options.now,
    'doctrine_source',
    mapping.lesson,
    sourceExcerpt,
    sourceRange,
    evidenceReferences,
    confidenceState,
    [
      ...(hasDoctrineShape(normalized) ? [] : ['trigger', 'boundary']),
      ...(evidenceReferences.length > 1 ? [] : ['repeated evidence']),
    ],
    [],
    hasDoctrineShape(normalized) && evidenceReferences.length > 1 ? 'eligible' : 'needs_review',
  );
  items.push(doctrineSource);

  const growthEvidence = createItem(
    record,
    options.now,
    'growth_evidence',
    mapping.tag,
    sourceExcerpt,
    sourceRange,
    evidenceReferences,
    evidenceReferences.length > 0 ? 'supported' : 'insufficient',
    evidenceReferences.length > 0 ? [] : ['demonstrated mission evidence'],
    [],
    evidenceReferences.length > 0 ? 'needs_review' : 'ineligible',
  );
  items.push(growthEvidence);

  const recoveryEvidence = record.recordType === 'recovery_reflection'
    ? createItem(record, options.now, 'recovery_evidence', mapping.commitment, sourceExcerpt, sourceRange, evidenceReferences, confidenceState, evidenceReferences.length === 0 ? ['Guardian recovery evidence'] : [], [], evidenceReferences.length > 0 ? 'eligible' : 'needs_review')
    : undefined;
  if (recoveryEvidence) items.push(recoveryEvidence);

  const contradiction = normalized.includes('always') && normalized.includes('never')
    ? createItem(record, options.now, 'contradiction', 'Reflection contains conflicting absolute language.', sourceExcerpt, sourceRange, evidenceReferences, 'tentative', ['clarification'], ['always and never both present'], 'needs_review')
    : undefined;
  if (contradiction) items.push(contradiction);

  return Object.freeze({
    journalId: record.journalId,
    candidateLesson: lesson,
    candidateCommitment: commitment,
    candidateBehaviorTag: behaviorTag,
    candidateJournalTheme: theme,
    candidateDoctrineSource: doctrineSource,
    candidateGrowthEvidence: growthEvidence,
    ...(recoveryEvidence ? { candidateRecoveryEvidence: recoveryEvidence } : {}),
    ...(contradiction ? { contradiction } : {}),
    items: Object.freeze(items),
  });
}

function createItem(
  record: JournalRecord,
  createdAt: string,
  extractionType: JournalExtractionType,
  proposedText: string,
  sourceExcerpt: string,
  sourceRange: JournalSourceRange,
  evidenceReferences: readonly JournalEvidenceReference[],
  confidenceState: JournalExtractionConfidence,
  missingEvidence: readonly string[],
  contradictions: readonly string[],
  eligibility: JournalExtractionEligibility,
): JournalKnowledgeExtractionItem {
  return Object.freeze({
    extractionId: `${record.journalId}:${extractionType}:${proposedText.toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '')}`,
    journalId: record.journalId,
    extractionType,
    proposedText,
    sourceExcerpt,
    sourceRange: { ...sourceRange },
    evidenceReferences: evidenceReferences.map((evidence) => ({ ...evidence })),
    confidenceState,
    missingEvidence: [...missingEvidence],
    contradictions: [...contradictions],
    eligibility,
    createdAt,
    status: 'candidate',
  });
}

function hasDoctrineShape(normalized: string): boolean {
  return normalized.includes('if ') && normalized.includes('then ') && (normalized.includes('unless ') || normalized.includes('when '));
}

function normalizeTheme(tag: string): string {
  if (tag === 'confirmation_quality') return 'observation_quality';
  return tag;
}
