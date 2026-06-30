import type { ISODateTime, UUID } from '@headquarters/shared';
import type { DoctrineCandidate } from './DoctrineCandidate';
import type { DoctrineRecord } from './DoctrineRecord';

export interface PromoteDoctrineCandidateOptions {
  readonly id?: UUID;
  readonly promotedAt?: ISODateTime;
}

export function promoteDoctrineCandidate(
  candidate: DoctrineCandidate,
  options: PromoteDoctrineCandidateOptions = {},
): DoctrineRecord {
  const timestamp = options.promotedAt ?? new Date().toISOString();

  return {
    id: options.id ?? crypto.randomUUID(),
    title: candidate.title,
    summary: candidate.summary,
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
