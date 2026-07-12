import {
  deriveOperationalConsequences,
  type OperationalConsequenceDerivationResult,
  type OperationalConsequenceGuardianSignal,
} from './OperationalConsequenceEngine';
import {
  isOperationalConsequenceBlocking,
  type OperationalConsequence,
} from './OperationalConsequence';

export interface GuardianConsequenceIntegrationInput {
  readonly missionId: string;
  readonly evaluatedAt: string;
  readonly guardianAlerts: readonly OperationalConsequenceGuardianSignal[];
  readonly existingConsequences?: readonly OperationalConsequence[] | undefined;
}

export interface CommanderConsequenceSignal {
  readonly consequenceId: string;
  readonly severity: OperationalConsequence['severity'];
  readonly rule: string;
  readonly evidence: readonly string[];
  readonly operationalEffect: string;
  readonly requiredRecoveryAction: string;
  readonly blocking: boolean;
}

export function deriveGuardianConsequences(
  input: GuardianConsequenceIntegrationInput,
): OperationalConsequenceDerivationResult {
  return deriveOperationalConsequences({
    missionId: input.missionId,
    evaluatedAt: input.evaluatedAt,
    guardianAlerts: input.guardianAlerts,
    existingConsequences: input.existingConsequences,
  });
}

export function buildCommanderConsequenceSignal(
  consequence: OperationalConsequence,
): CommanderConsequenceSignal {
  return {
    consequenceId: consequence.consequenceId,
    severity: consequence.severity,
    rule: String(consequence.metadata.guardianRuleId ?? consequence.sourceGuardianAlertId ?? consequence.type),
    evidence: consequence.evidenceReferences.map((reference) => reference.description ?? `${reference.source}:${reference.id}`),
    operationalEffect: consequence.effect,
    requiredRecoveryAction: consequence.recoveryRequirements[0]?.description ?? 'No recovery action required.',
    blocking: isOperationalConsequenceBlocking(consequence),
  };
}

export function resolveGuardianRecoveryCandidate(
  consequence: OperationalConsequence,
  resolvedGuardianAlertIds: readonly string[],
): boolean {
  return consequence.sourceGuardianAlertId !== undefined
    && resolvedGuardianAlertIds.includes(consequence.sourceGuardianAlertId);
}
