import type { ISODateTime, UUID } from '@headquarters/shared';
import { validateDoctrineCandidateForReview, type DoctrineCandidate } from './DoctrineCandidate';
import type { DoctrineRecord } from './DoctrineRecord';

export interface PromoteDoctrineCandidateOptions {
  readonly id?: UUID;
  readonly promotedAt?: ISODateTime;
}

export function promoteDoctrineCandidate(
  candidate: DoctrineCandidate,
  options: PromoteDoctrineCandidateOptions = {},
): DoctrineRecord {
  const validation = validateDoctrineCandidateForReview(candidate);
  if (!validation.valid) {
    throw new Error(`Doctrine candidate cannot be promoted: ${validation.issues.map((issue) => issue.code).join(', ')}`);
  }

  const timestamp = options.promotedAt ?? new Date().toISOString();

  return {
    id: options.id ?? crypto.randomUUID(),
    title: candidate.proposedTitle,
    summary: candidate.proposedRule,
    confidence: 'validated',
    source: {
      sourceType: candidate.source.sourceType,
      sourceId: candidate.source.sourceId,
      excerpt: candidate.source.excerpt,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
