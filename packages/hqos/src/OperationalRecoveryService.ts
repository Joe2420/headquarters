import {
  canResolveOperationalConsequence,
  completeRecoveryRequirement,
  getOutstandingRecoveryRequirements,
  resolveOperationalConsequence,
  type OperationalConsequence,
  type OperationalEvidenceReference,
  type RecoveryRequirement,
} from './OperationalConsequence';

export interface OperationalRecoveryEvidence {
  readonly requirementId: string;
  readonly providedAt: string;
  readonly evidenceReferences: readonly OperationalEvidenceReference[];
}

export type OperationalRecoveryResultStatus = 'accepted' | 'rejected' | 'resolved' | 'pending';

export interface OperationalRecoveryResult {
  readonly status: OperationalRecoveryResultStatus;
  readonly consequence: OperationalConsequence;
  readonly message: string;
  readonly outstandingRequirements: readonly RecoveryRequirement[];
}

export class OperationalRecoveryService {
  listOutstandingRecoveryRequirements(consequence: OperationalConsequence): readonly RecoveryRequirement[] {
    return getOutstandingRecoveryRequirements(consequence);
  }

  acceptRecoveryEvidence(
    consequence: OperationalConsequence,
    evidence: OperationalRecoveryEvidence,
  ): OperationalRecoveryResult {
    const requirement = consequence.recoveryRequirements.find((item) => item.requirementId === evidence.requirementId);
    if (requirement === undefined) {
      return {
        status: 'rejected',
        consequence,
        message: `Recovery requirement ${evidence.requirementId} does not exist.`,
        outstandingRequirements: getOutstandingRecoveryRequirements(consequence),
      };
    }
    if (requirement.completionState === 'satisfied') {
      return this.resolveIfReady(consequence, evidence.providedAt, evidence.evidenceReferences, 'Recovery evidence was already recorded.');
    }
    if (requirement.type === 'demonstrate_future_adherence') {
      return {
        status: 'pending',
        consequence,
        message: 'Future adherence requires later mission evidence and remains pending.',
        outstandingRequirements: getOutstandingRecoveryRequirements(consequence),
      };
    }
    if (requirement.evidenceRequired && evidence.evidenceReferences.length === 0) {
      return {
        status: 'rejected',
        consequence,
        message: 'Recovery evidence is required before this requirement can be satisfied.',
        outstandingRequirements: getOutstandingRecoveryRequirements(consequence),
      };
    }

    const updated = completeRecoveryRequirement(consequence, {
      requirementId: evidence.requirementId,
      completedAt: evidence.providedAt,
      evidenceReferences: evidence.evidenceReferences,
    });

    return this.resolveIfReady(updated, evidence.providedAt, evidence.evidenceReferences, 'Recovery evidence accepted.');
  }

  private resolveIfReady(
    consequence: OperationalConsequence,
    resolvedAt: string,
    resolutionEvidence: readonly OperationalEvidenceReference[],
    acceptedMessage: string,
  ): OperationalRecoveryResult {
    if (!canResolveOperationalConsequence(consequence)) {
      return {
        status: 'accepted',
        consequence,
        message: acceptedMessage,
        outstandingRequirements: getOutstandingRecoveryRequirements(consequence),
      };
    }

    const resolved = resolveOperationalConsequence(consequence, { resolvedAt, resolutionEvidence });
    return {
      status: 'resolved',
      consequence: resolved,
      message: 'All recovery requirements are satisfied. Consequence resolved.',
      outstandingRequirements: [],
    };
  }
}
