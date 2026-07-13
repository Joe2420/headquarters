import type { GuardianProtectionDecision } from '@headquarters/hqos';

export type CommanderGuardianIntent =
  | 'announceGuardianCaution'
  | 'explainGuardianRestriction'
  | 'announceGuardianLockout'
  | 'requestGuardianReview'
  | 'stateBlockedAction'
  | 'explainRecoveryProtocol'
  | 'acknowledgeRecoveryProgress'
  | 'confirmGuardianRestoration'
  | 'recommendReturnToBase'
  | 'distinguishOutcomeFromProtection';

export interface CommanderGuardianGuidance {
  readonly id: string;
  readonly intent: CommanderGuardianIntent;
  readonly message: string;
  readonly evidenceLabel: string;
  readonly priority: 'caution' | 'restriction' | 'lockout' | 'recovery';
  readonly repeatPolicy: 'once' | 'blocked_action_only' | 'resolution_once';
}

export function buildCommanderGuardianInterventionGuidance(input: {
  readonly decision: GuardianProtectionDecision;
  readonly attemptedBlockedAction?: string;
  readonly acknowledgedRecoveryEvidence?: boolean;
  readonly restored?: boolean;
  readonly alreadyDeliveredIds?: readonly string[];
}): readonly CommanderGuardianGuidance[] {
  const delivered = new Set(input.alreadyDeliveredIds ?? []);
  const guidance: CommanderGuardianGuidance[] = [];
  const baseEvidence = input.decision.activeRestrictions[0]?.evidenceReferences[0]?.description
    ?? input.decision.triggeredRules[0]?.explanation
    ?? input.decision.explanation;

  if (input.restored === true) {
    guidance.push(item({
      id: 'guardian:restored',
      intent: 'confirmGuardianRestoration',
      message: 'Guardian recovery confirmed. The restriction is cleared. Historical evidence remains in the mission record.',
      evidenceLabel: baseEvidence,
      priority: 'recovery',
      repeatPolicy: 'resolution_once',
    }));
  } else if (input.acknowledgedRecoveryEvidence === true) {
    guidance.push(item({
      id: 'guardian:recovery-progress',
      intent: 'acknowledgeRecoveryProgress',
      message: 'Guardian recovery evidence received. Continue until the required recovery path is complete.',
      evidenceLabel: baseEvidence,
      priority: 'recovery',
      repeatPolicy: 'once',
    }));
  } else if (input.attemptedBlockedAction && input.decision.blockedActions.length > 0) {
    guidance.push(item({
      id: `guardian:blocked:${input.attemptedBlockedAction}`,
      intent: 'stateBlockedAction',
      message: `Guardian restriction active. ${input.attemptedBlockedAction} is blocked until the required recovery path is complete.`,
      evidenceLabel: baseEvidence,
      priority: 'restriction',
      repeatPolicy: 'blocked_action_only',
    }));
  } else if (input.decision.CommanderSignal === 'lockout') {
    guidance.push(item({
      id: `guardian:lockout:${input.decision.verdict}`,
      intent: 'announceGuardianLockout',
      message: `Guardian has suspended deployment. ${input.decision.explanation} Recovery is required before authority returns.`,
      evidenceLabel: baseEvidence,
      priority: 'lockout',
      repeatPolicy: 'once',
    }));
  } else if (input.decision.CommanderSignal === 'restriction') {
    guidance.push(item({
      id: `guardian:restriction:${input.decision.verdict}`,
      intent: 'explainGuardianRestriction',
      message: `Guardian restriction active. ${input.decision.explanation} Resolve the rule evidence before requesting authority.`,
      evidenceLabel: baseEvidence,
      priority: 'restriction',
      repeatPolicy: 'once',
    }));
  } else if (input.decision.CommanderSignal === 'caution') {
    guidance.push(item({
      id: `guardian:caution:${input.decision.verdict}`,
      intent: 'announceGuardianCaution',
      message: `Guardian caution. ${input.decision.explanation} Authorization remains available only with explicit review.`,
      evidenceLabel: baseEvidence,
      priority: 'caution',
      repeatPolicy: 'once',
    }));
  }

  return Object.freeze(guidance.filter((entry) => !delivered.has(entry.id)));
}

function item(input: CommanderGuardianGuidance): CommanderGuardianGuidance {
  return Object.freeze(input);
}
