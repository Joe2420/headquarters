import type { JournalKnowledgeExtractionItem } from './JournalKnowledgeExtractionEngine';
import type { JournalReviewApprovalResult } from './JournalReviewApproval';

export interface JournalDoctrineSourceDraft {
  readonly draftId: string;
  readonly journalId: string;
  readonly extractionId: string;
  readonly proposedRule: string;
  readonly trigger?: string | undefined;
  readonly boundary?: string | undefined;
  readonly sourceExcerpt: string;
  readonly missingFields: readonly string[];
  readonly duplicateDoctrineIds: readonly string[];
  readonly status: 'draft' | 'ready_for_doctrine_review' | 'blocked';
}

export function createJournalDoctrineSourceDraft(input: {
  readonly extraction: JournalKnowledgeExtractionItem;
  readonly review: JournalReviewApprovalResult;
  readonly existingDoctrineTexts?: readonly { readonly doctrineId: string; readonly text: string }[] | undefined;
}): JournalDoctrineSourceDraft {
  const missingFields = [
    ...(input.extraction.missingEvidence.includes('trigger') ? ['trigger'] : []),
    ...(input.extraction.missingEvidence.includes('boundary') ? ['boundary'] : []),
    ...(input.extraction.missingEvidence.includes('repeated evidence') ? ['repeated evidence'] : []),
  ];
  const duplicateDoctrineIds = (input.existingDoctrineTexts ?? [])
    .filter((record) => normalize(record.text) === normalize(input.review.decision.reviewedText))
    .map((record) => record.doctrineId);
  const ready = input.review.approvedForEvidence
    && input.extraction.extractionType === 'doctrine_source'
    && missingFields.length === 0
    && duplicateDoctrineIds.length === 0;

  return Object.freeze({
    draftId: `doctrine-source:${input.extraction.extractionId}`,
    journalId: input.extraction.journalId,
    extractionId: input.extraction.extractionId,
    proposedRule: input.review.decision.reviewedText,
    sourceExcerpt: input.extraction.sourceExcerpt,
    missingFields: Object.freeze(missingFields),
    duplicateDoctrineIds: Object.freeze(duplicateDoctrineIds),
    status: ready ? 'ready_for_doctrine_review' : duplicateDoctrineIds.length > 0 ? 'blocked' : 'draft',
  });
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/gu, ' ');
}
