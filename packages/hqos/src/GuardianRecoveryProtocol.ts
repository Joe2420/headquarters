import type { GuardianEvidence } from './GuardianProtection';
import { GuardianInterventionService, type GuardianInterventionRecord } from './GuardianInterventionService';

export type GuardianRecoveryProtocolType =
  | 'clarify_risk'
  | 'reduce_risk'
  | 'provide_protective_rule'
  | 'complete_observation'
  | 'resolve_contradiction'
  | 'complete_debrief'
  | 'complete_journal_reflection'
  | 'deliberate_pause'
  | 'end_current_session'
  | 'resume_next_session'
  | 'demonstrate_future_adherence'
  | 'review_related_doctrine'
  | 'restore_persistence';

export type GuardianRecoveryStatus = 'pending' | 'in_progress' | 'awaiting_future_evidence' | 'complete' | 'failed' | 'superseded';

export interface GuardianRecoveryRequirement {
  readonly requirementId: string;
  readonly type: GuardianRecoveryProtocolType;
  readonly description: string;
  readonly mandatory: boolean;
  readonly allowOutOfOrder: boolean;
  readonly status: 'pending' | 'complete' | 'failed';
  readonly evidenceReferences: readonly GuardianEvidence[];
  readonly completedAt?: string;
}

export interface GuardianRecoveryProtocol {
  readonly protocolId: string;
  readonly interventionId: string;
  readonly requirements: readonly GuardianRecoveryRequirement[];
  readonly sequence: readonly string[];
  readonly mandatoryRequirements: readonly string[];
  readonly optionalRequirements: readonly string[];
  readonly progress: {
    readonly completed: number;
    readonly total: number;
  };
  readonly status: GuardianRecoveryStatus;
  readonly evidenceReferences: readonly GuardianEvidence[];
  readonly completionPolicy: string;
  readonly createdAt: string;
  readonly completedAt?: string;
}

export function createGuardianRecoveryProtocol(input: {
  readonly protocolId: string;
  readonly interventionId: string;
  readonly requirements: readonly Omit<GuardianRecoveryRequirement, 'status' | 'evidenceReferences' | 'completedAt'>[];
  readonly completionPolicy?: string;
  readonly createdAt: string;
}): GuardianRecoveryProtocol {
  if (input.requirements.length === 0) throw new Error('Guardian recovery protocol requires at least one requirement.');
  const requirements = input.requirements.map((requirement) => freezeRequirement({
    ...requirement,
    status: 'pending',
    evidenceReferences: [],
  }));
  return freezeProtocol({
    protocolId: input.protocolId,
    interventionId: input.interventionId,
    requirements,
    sequence: requirements.map((requirement) => requirement.requirementId),
    mandatoryRequirements: requirements.filter((requirement) => requirement.mandatory).map((requirement) => requirement.requirementId),
    optionalRequirements: requirements.filter((requirement) => !requirement.mandatory).map((requirement) => requirement.requirementId),
    progress: { completed: 0, total: requirements.length },
    status: 'pending',
    evidenceReferences: [],
    completionPolicy: input.completionPolicy ?? 'All mandatory requirements must be complete.',
    createdAt: input.createdAt,
  });
}

export function recordGuardianRecoveryEvidence(
  protocol: GuardianRecoveryProtocol,
  input: {
    readonly requirementId: string;
    readonly evidence: GuardianEvidence;
    readonly recordedAt: string;
  },
): GuardianRecoveryProtocol {
  const requirement = protocol.requirements.find((item) => item.requirementId === input.requirementId);
  if (requirement === undefined) throw new Error(`Guardian recovery requirement ${input.requirementId} does not exist.`);
  if (!requirement.allowOutOfOrder && !previousMandatoryRequirementsComplete(protocol, requirement.requirementId)) {
    throw new Error('Guardian recovery requirement cannot be completed out of order.');
  }
  if (requirement.type === 'demonstrate_future_adherence') {
    return freezeProtocol({
      ...protocol,
      status: 'awaiting_future_evidence',
      evidenceReferences: dedupeEvidence([...protocol.evidenceReferences, input.evidence]),
    });
  }

  const requirements = protocol.requirements.map((item) => {
    if (item.requirementId !== input.requirementId) return item;
    return freezeRequirement({
      ...item,
      status: 'complete',
      evidenceReferences: dedupeEvidence([...item.evidenceReferences, input.evidence]),
      completedAt: input.recordedAt,
    });
  });
  return normalizeProtocol({
    ...protocol,
    requirements,
    evidenceReferences: dedupeEvidence([...protocol.evidenceReferences, input.evidence]),
  }, input.recordedAt);
}

export function failGuardianRecoveryRequirement(
  protocol: GuardianRecoveryProtocol,
  input: { readonly requirementId: string; readonly evidence: GuardianEvidence },
): GuardianRecoveryProtocol {
  const requirements = protocol.requirements.map((item) => item.requirementId === input.requirementId
    ? freezeRequirement({
        ...item,
        status: 'failed',
        evidenceReferences: dedupeEvidence([...item.evidenceReferences, input.evidence]),
      })
    : item);
  return freezeProtocol({
    ...protocol,
    requirements,
    evidenceReferences: dedupeEvidence([...protocol.evidenceReferences, input.evidence]),
    status: 'failed',
  });
}

export function applyGuardianRecoveryToIntervention(
  service: GuardianInterventionService,
  intervention: GuardianInterventionRecord,
  protocol: GuardianRecoveryProtocol,
  resolvedAt: string,
): GuardianInterventionRecord {
  if (protocol.status !== 'complete') return intervention;
  for (const evidence of protocol.evidenceReferences) {
    service.recordRecoveryEvidence(intervention.interventionId, evidence);
  }
  return service.resolveIntervention(intervention.interventionId, {
    resolvedAt,
    resolutionReason: `Guardian recovery protocol ${protocol.protocolId} complete.`,
  });
}

function normalizeProtocol(protocol: GuardianRecoveryProtocol, completedAt: string): GuardianRecoveryProtocol {
  const completed = protocol.requirements.filter((requirement) => requirement.status === 'complete').length;
  const mandatoryComplete = protocol.requirements
    .filter((requirement) => requirement.mandatory)
    .every((requirement) => requirement.status === 'complete');
  return freezeProtocol({
    ...protocol,
    progress: { completed, total: protocol.requirements.length },
    status: mandatoryComplete ? 'complete' : 'in_progress',
    ...(mandatoryComplete ? { completedAt } : {}),
  });
}

function previousMandatoryRequirementsComplete(protocol: GuardianRecoveryProtocol, requirementId: string): boolean {
  const index = protocol.sequence.indexOf(requirementId);
  if (index <= 0) return true;
  const previousIds = protocol.sequence.slice(0, index);
  return protocol.requirements
    .filter((requirement) => previousIds.includes(requirement.requirementId) && requirement.mandatory)
    .every((requirement) => requirement.status === 'complete');
}

function dedupeEvidence(evidence: readonly GuardianEvidence[]): readonly GuardianEvidence[] {
  const byId = new Map<string, GuardianEvidence>();
  for (const item of evidence) byId.set(item.evidenceId, item);
  return Object.freeze([...byId.values()].map((item) => Object.freeze({ ...item })));
}

function freezeRequirement(requirement: GuardianRecoveryRequirement): GuardianRecoveryRequirement {
  return Object.freeze({
    ...requirement,
    evidenceReferences: dedupeEvidence(requirement.evidenceReferences),
  });
}

function freezeProtocol(protocol: GuardianRecoveryProtocol): GuardianRecoveryProtocol {
  return Object.freeze({
    ...protocol,
    requirements: Object.freeze(protocol.requirements.map(freezeRequirement)),
    sequence: Object.freeze([...protocol.sequence]),
    mandatoryRequirements: Object.freeze([...protocol.mandatoryRequirements]),
    optionalRequirements: Object.freeze([...protocol.optionalRequirements]),
    progress: Object.freeze({ ...protocol.progress }),
    evidenceReferences: dedupeEvidence(protocol.evidenceReferences),
  });
}
