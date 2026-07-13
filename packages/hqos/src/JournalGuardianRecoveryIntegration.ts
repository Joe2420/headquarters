import type { JournalRecord } from './JournalRecord';
import type { JournalKnowledgeExtractionItem } from './JournalKnowledgeExtractionEngine';

export interface JournalGuardianRecoveryRequirement {
  readonly requirementId: string;
  readonly description: string;
  readonly evidenceRequired: boolean;
  readonly longTermBehaviorRequired: boolean;
}

export interface JournalGuardianRecoveryWorkflow {
  readonly workflowId: string;
  readonly journalId: string;
  readonly requirementId: string;
  readonly status: 'draft_required' | 'evidence_submitted' | 'accepted' | 'rejected';
  readonly immediateRequirementResolved: boolean;
  readonly longTermBehaviorPending: boolean;
  readonly returnContext?: string | undefined;
  readonly explanation: string;
}

export function createJournalGuardianRecoveryWorkflow(input: {
  readonly record: JournalRecord;
  readonly requirement: JournalGuardianRecoveryRequirement;
  readonly returnContext?: string | undefined;
}): JournalGuardianRecoveryWorkflow {
  return Object.freeze({
    workflowId: `guardian-recovery:${input.requirement.requirementId}:${input.record.journalId}`,
    journalId: input.record.journalId,
    requirementId: input.requirement.requirementId,
    status: 'draft_required',
    immediateRequirementResolved: false,
    longTermBehaviorPending: input.requirement.longTermBehaviorRequired,
    ...(input.returnContext ? { returnContext: input.returnContext } : {}),
    explanation: input.requirement.description,
  });
}

export function submitJournalGuardianRecoveryEvidence(
  workflow: JournalGuardianRecoveryWorkflow,
  evidence: JournalKnowledgeExtractionItem,
): JournalGuardianRecoveryWorkflow {
  const acceptable = evidence.extractionType === 'recovery_evidence'
    && evidence.eligibility !== 'ineligible'
    && evidence.missingEvidence.length === 0;
  return Object.freeze({
    ...workflow,
    status: acceptable ? 'accepted' : 'rejected',
    immediateRequirementResolved: acceptable,
    longTermBehaviorPending: acceptable ? workflow.longTermBehaviorPending : true,
    explanation: acceptable
      ? 'Guardian recovery reflection accepted as immediate evidence.'
      : `Guardian recovery evidence rejected: ${evidence.missingEvidence.join(', ') || 'unsupported evidence'}.`,
  });
}
