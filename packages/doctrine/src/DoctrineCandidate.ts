import type { ArchivedJournalEntry } from '@headquarters/journal';
import type { ISODateTime, UUID } from '@headquarters/shared';

export type DoctrineCandidateStatus = 'candidate';

export interface DoctrineCandidate {
  readonly id: UUID;
  readonly title: string;
  readonly summary: string;
  readonly status: DoctrineCandidateStatus;
  readonly source: {
    readonly sourceType: 'journal_entry';
    readonly sourceId: UUID;
    readonly archiveId: UUID;
    readonly excerpt: string;
  };
  readonly createdAt: ISODateTime;
}

export interface ExtractDoctrineCandidatesOptions {
  readonly now?: ISODateTime;
  readonly createId?: (source: ArchivedJournalEntry, excerpt: string, index: number) => UUID;
}

const APPROVAL_TAGS = new Set(['approved', 'doctrine-approved']);
const CANDIDATE_LANGUAGE = /\b(avoid|do not|don't|follow|must|never|trust|wait)\b/iu;

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
  return {
    id: options.createId?.(record, excerpt, index) ?? crypto.randomUUID(),
    title: createCandidateTitle(excerpt),
    summary: excerpt,
    status: 'candidate',
    source: {
      sourceType: 'journal_entry',
      sourceId: record.journalEntryId,
      archiveId: record.id,
      excerpt,
    },
    createdAt,
  };
}

function splitIntoSentences(content: string): string[] {
  return content
    .split(/[.!?]+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function createCandidateTitle(excerpt: string): string {
  const words = excerpt.split(/\s+/u).slice(0, 8);
  return words.join(' ');
}
