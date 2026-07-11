import type { ArchivedJournalEntry } from '@headquarters/journal';
import type { ISODateTime, UUID } from '@headquarters/shared';

export type DoctrineCandidateStatus = 'draft' | 'pending_review' | 'revision_requested' | 'approved' | 'rejected';
export type DoctrineCandidateIssueCode =
  | 'missing_title'
  | 'placeholder_title'
  | 'missing_rule'
  | 'placeholder_rule'
  | 'missing_rationale'
  | 'missing_source'
  | 'missing_excerpt'
  | 'missing_trigger'
  | 'missing_expected_behavior'
  | 'duplicate_doctrine';

export type DoctrineEvidenceStrengthLevel = 'limited' | 'moderate' | 'strong';

export interface DoctrineCandidateValidationIssue {
  readonly code: DoctrineCandidateIssueCode;
  readonly message: string;
}

export interface DoctrineCandidateValidationResult {
  readonly valid: boolean;
  readonly issues: readonly DoctrineCandidateValidationIssue[];
}

export interface DoctrineEvidenceStrength {
  readonly level: DoctrineEvidenceStrengthLevel;
  readonly label: string;
  readonly description: string;
}

export interface DoctrineCandidate {
  readonly id: UUID;
  readonly title: string;
  readonly summary: string;
  readonly status: DoctrineCandidateStatus;
  readonly proposedTitle: string;
  readonly proposedRule: string;
  readonly rationale: string;
  readonly evidenceSummary: string;
  readonly triggerCondition: string;
  readonly expectedBehavior: string;
  readonly exceptionOrBoundary: string;
  readonly proposedScope: string;
  readonly similarDoctrineIds: readonly UUID[];
  readonly conflictSummary: string;
  readonly supportingEvidenceCount: number;
  readonly source: {
    readonly sourceType: 'journal_entry';
    readonly sourceId: UUID;
    readonly archiveId: UUID;
    readonly excerpt: string;
    readonly sourceDate?: ISODateTime | undefined;
    readonly sourceMissionId?: UUID | undefined;
  };
  readonly createdAt: ISODateTime;
  readonly reviewNote?: string | undefined;
}

export interface ExtractDoctrineCandidatesOptions {
  readonly now?: ISODateTime;
  readonly createId?: (source: ArchivedJournalEntry, excerpt: string, index: number) => UUID;
}

const APPROVAL_TAGS = new Set(['approved', 'doctrine-approved']);
const CANDIDATE_LANGUAGE = /\b(avoid|do not|don't|follow|must|never|trust|wait)\b/iu;
const PLACEHOLDER_LANGUAGE = /\b(doctrine candidate requires review|possible operating rule|supporting source surfaced|operator-approved doctrine candidate|review doctrine candidate source)\b/iu;

export function extractDoctrineCandidatesFromApprovedJournalEvidence(
  records: readonly ArchivedJournalEntry[],
  options: ExtractDoctrineCandidatesOptions = {},
): DoctrineCandidate[] {
  const createdAt = options.now ?? new Date().toISOString();

  return records
    .filter(isApprovedDoctrineEvidence)
    .flatMap((record) => extractCandidateExcerpts(record).map((excerpt, index) => (
      createDoctrineCandidate(record, excerpt, index, createdAt, options)
    )));
}

export function isApprovedDoctrineEvidence(record: ArchivedJournalEntry): boolean {
  return record.metadata.tags.some((tag) => APPROVAL_TAGS.has(tag.trim().toLowerCase()));
}

function extractCandidateExcerpts(record: ArchivedJournalEntry): string[] {
  return splitIntoSentences(record.rawEntry.rawContent)
    .filter((sentence) => CANDIDATE_LANGUAGE.test(sentence));
}

function createDoctrineCandidate(
  record: ArchivedJournalEntry,
  excerpt: string,
  index: number,
  createdAt: ISODateTime,
  options: ExtractDoctrineCandidatesOptions,
): DoctrineCandidate {
  const proposedTitle = createCandidateTitle(excerpt);
  const proposedRule = createCandidateRule(excerpt);
  const candidate: DoctrineCandidate = {
    id: options.createId?.(record, excerpt, index) ?? crypto.randomUUID(),
    title: proposedTitle,
    summary: proposedRule,
    status: 'draft',
    proposedTitle,
    proposedRule,
    rationale: createCandidateRationale(record, excerpt),
    evidenceSummary: createEvidenceSummary(record, excerpt),
    triggerCondition: createTriggerCondition(excerpt),
    expectedBehavior: createExpectedBehavior(excerpt),
    exceptionOrBoundary: createExceptionOrBoundary(excerpt),
    proposedScope: createProposedScope(excerpt),
    similarDoctrineIds: [],
    conflictSummary: 'No accepted Doctrine comparison has been performed yet.',
    supportingEvidenceCount: 1,
    source: {
      sourceType: 'journal_entry',
      sourceId: record.journalEntryId,
      archiveId: record.id,
      excerpt,
      sourceDate: record.rawEntry.entryDate,
    },
    createdAt,
  };

  return {
    ...candidate,
    status: validateDoctrineCandidateForReview(candidate).valid ? 'pending_review' : 'draft',
  };
}

function splitIntoSentences(content: string): string[] {
  return content
    .split(/[.!?]+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function createCandidateTitle(excerpt: string): string {
  const normalized = excerpt.trim().replace(/\s+/gu, ' ');
  if (/opening|market open|open/iu.test(normalized) && /wait|first|volatility|disorder/iu.test(normalized)) {
    return 'Wait for opening volatility to stabilize';
  }

  const words = normalized.split(/\s+/u).slice(0, 8);
  return words.join(' ');
}

function createCandidateRule(excerpt: string): string {
  const normalized = excerpt.trim().replace(/\s+/gu, ' ');
  if (/opening|market open|open/iu.test(normalized) && /wait|first|volatility|disorder|unsafe|apocalypse/iu.test(normalized)) {
    return 'Do not take the first available entry during disorderly market-open conditions. Remain in Observation until structure, liquidity, and volatility become sufficiently clear.';
  }

  if (/^wait\b/iu.test(normalized)) return `${normalized}.`;
  if (/^do not|^don't|^never|^avoid/iu.test(normalized)) return `${normalized}.`;
  if (/^follow|^must|^trust/iu.test(normalized)) return `${normalized}.`;
  return `Review before acting: ${normalized}.`;
}

function createCandidateRationale(record: ArchivedJournalEntry, excerpt: string): string {
  return `The source journal entry from ${record.rawEntry.entryDate} recorded an operating lesson: "${excerpt}".`;
}

function createEvidenceSummary(record: ArchivedJournalEntry, excerpt: string): string {
  return `Journal entry ${record.journalEntryId} preserved this evidence: "${excerpt}".`;
}

function createTriggerCondition(excerpt: string): string {
  if (/opening|market open|open/iu.test(excerpt)) return 'Market open with abnormal volatility, disorderly price action, or unclear first paths.';
  if (/confirmation|confirm/iu.test(excerpt)) return 'Entry consideration before confirmation is visible.';
  if (/chase/iu.test(excerpt)) return 'Price has already moved and the operator feels pressure to chase.';
  return 'The operating condition described by the source evidence appears again.';
}

function createExpectedBehavior(excerpt: string): string {
  if (/wait/iu.test(excerpt)) return 'Wait and collect evidence before authorization.';
  if (/do not|don't|never|avoid/iu.test(excerpt)) return 'Stand down from the prohibited behavior and remain inside the approved plan.';
  if (/follow/iu.test(excerpt)) return 'Follow the declared plan instead of improvising.';
  return 'Pause, review the evidence, and act only after the rule is satisfied.';
}

function createExceptionOrBoundary(excerpt: string): string {
  if (/opening|market open|open/iu.test(excerpt)) return 'This rule does not block later entries after conditions stabilize and evidence becomes sufficient.';
  return 'This rule does not replace operator judgment when new evidence invalidates the original condition.';
}

function createProposedScope(excerpt: string): string {
  if (/opening|market open|open/iu.test(excerpt)) return 'Market-open missions during abnormal volatility.';
  if (/confirmation|confirm/iu.test(excerpt)) return 'Entries requiring confirmation before authorization.';
  return 'Operator-reviewed trading missions matching the source condition.';
}

export function validateDoctrineCandidateForReview(candidate: DoctrineCandidate): DoctrineCandidateValidationResult {
  const issues: DoctrineCandidateValidationIssue[] = [];

  if (!hasText(candidate.proposedTitle)) issues.push({ code: 'missing_title', message: 'Candidate title is required.' });
  else if (isPlaceholder(candidate.proposedTitle)) issues.push({ code: 'placeholder_title', message: 'Candidate title is placeholder text.' });

  if (!hasText(candidate.proposedRule)) issues.push({ code: 'missing_rule', message: 'Concrete rule statement is required.' });
  else if (isPlaceholder(candidate.proposedRule)) issues.push({ code: 'placeholder_rule', message: 'Candidate rule is placeholder text.' });

  if (!hasText(candidate.rationale)) issues.push({ code: 'missing_rationale', message: 'Candidate rationale is required.' });
  if (!hasText(candidate.source.sourceId) || !hasText(candidate.source.archiveId)) issues.push({ code: 'missing_source', message: 'Source reference is required.' });
  if (!hasText(candidate.source.excerpt)) issues.push({ code: 'missing_excerpt', message: 'Source excerpt is required.' });
  if (!hasText(candidate.triggerCondition)) issues.push({ code: 'missing_trigger', message: 'Trigger condition is required.' });
  if (!hasText(candidate.expectedBehavior)) issues.push({ code: 'missing_expected_behavior', message: 'Expected operator behavior is required.' });

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function getDoctrineEvidenceStrength(supportingEvidenceCount: number): DoctrineEvidenceStrength {
  if (supportingEvidenceCount >= 3) {
    return {
      level: 'strong',
      label: 'Strong',
      description: 'repeated evidence across missions',
    };
  }

  if (supportingEvidenceCount >= 2) {
    return {
      level: 'moderate',
      label: 'Moderate',
      description: 'multiple consistent sources',
    };
  }

  return {
    level: 'limited',
    label: 'Limited',
    description: 'one supporting source',
  };
}

export function buildDoctrineCandidateCommanderSummary(candidate: DoctrineCandidate): string {
  return [
    'A Doctrine candidate is ready for review.',
    '',
    `Proposed rule: ${candidate.proposedRule}`,
    '',
    `Source: ${candidate.source.sourceType} ${candidate.source.sourceId}.`,
    '',
    `Evidence: ${candidate.evidenceSummary}`,
    '',
    `Scope: ${candidate.proposedScope}`,
    '',
    'Do you approve this rule for Doctrine?',
  ].join('\n');
}

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_LANGUAGE.test(value.trim());
}

function hasText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}
