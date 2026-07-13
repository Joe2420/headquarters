import type { JournalKnowledgeExtractionItem } from './JournalKnowledgeExtractionEngine';
import type { JournalReviewApprovalResult } from './JournalReviewApproval';

export interface JournalAcademyEvidenceCandidate {
  readonly candidateId: string;
  readonly journalId: string;
  readonly extractionId: string;
  readonly behavior: string;
  readonly sourceExcerpt: string;
  readonly missionEvidenceRequired: boolean;
  readonly status: 'ineligible' | 'academy_review_required';
}

export interface JournalCommanderRelationshipSignal {
  readonly signalId: string;
  readonly journalId: string;
  readonly dimension: 'preparation' | 'patience' | 'discipline' | 'recovery' | 'review_quality';
  readonly summary: string;
  readonly evidenceReferences: readonly string[];
  readonly confidence: 'limited' | 'forming' | 'supported';
}

export function createJournalAcademyEvidenceCandidate(
  item: JournalKnowledgeExtractionItem,
  review: JournalReviewApprovalResult,
): JournalAcademyEvidenceCandidate {
  const hasMissionEvidence = item.evidenceReferences.some((evidence) => evidence.source === 'mission');
  return Object.freeze({
    candidateId: `academy:${item.extractionId}`,
    journalId: item.journalId,
    extractionId: item.extractionId,
    behavior: review.decision.reviewedText,
    sourceExcerpt: item.sourceExcerpt,
    missionEvidenceRequired: !hasMissionEvidence,
    status: review.approvedForEvidence && hasMissionEvidence ? 'academy_review_required' : 'ineligible',
  });
}

export function createJournalCommanderRelationshipSignal(
  item: JournalKnowledgeExtractionItem,
): JournalCommanderRelationshipSignal {
  const dimension = inferRelationshipDimension(item.proposedText);
  const evidenceReferences = item.evidenceReferences.map((evidence) => `${evidence.source}:${evidence.id}`);
  return Object.freeze({
    signalId: `relationship:${item.extractionId}`,
    journalId: item.journalId,
    dimension,
    summary: item.proposedText,
    evidenceReferences: Object.freeze(evidenceReferences),
    confidence: evidenceReferences.length >= 2 ? 'supported' : evidenceReferences.length === 1 ? 'forming' : 'limited',
  });
}

function inferRelationshipDimension(text: string): JournalCommanderRelationshipSignal['dimension'] {
  const normalized = text.toLowerCase();
  if (normalized.includes('wait') || normalized.includes('patience')) return 'patience';
  if (normalized.includes('risk') || normalized.includes('discipline')) return 'discipline';
  if (normalized.includes('recover')) return 'recovery';
  if (normalized.includes('review') || normalized.includes('lesson')) return 'review_quality';
  return 'preparation';
}
