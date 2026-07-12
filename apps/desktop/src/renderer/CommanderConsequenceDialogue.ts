import type { OperationalConsequence } from '@headquarters/hqos';
import { getOutstandingRecoveryRequirements, isOperationalConsequenceBlocking } from '@headquarters/hqos';

export interface CommanderConsequenceDialogue {
  readonly id: string;
  readonly intent:
    | 'explainConsequence'
    | 'stateBlockedAction'
    | 'requestRecoveryAction'
    | 'acknowledgeRecoveryProgress'
    | 'confirmRecovery'
    | 'referenceHistoricalConsequence'
    | 'distinguishOutcomeFromProcess';
  readonly message: string;
}

export function buildCommanderConsequenceDialogue(
  consequence: OperationalConsequence,
  context: { attemptedBlockedAction?: string | undefined } = {},
): CommanderConsequenceDialogue {
  const recovery = getOutstandingRecoveryRequirements(consequence)[0];
  const blocking = isOperationalConsequenceBlocking(consequence);
  const intent = blocking
    ? context.attemptedBlockedAction ? 'stateBlockedAction' : 'explainConsequence'
    : consequence.status === 'resolved' ? 'confirmRecovery' : 'requestRecoveryAction';

  return {
    id: `commander-consequence:${consequence.consequenceId}:${intent}`,
    intent,
    message: [
      blocking && context.attemptedBlockedAction
        ? `${context.attemptedBlockedAction} remains withheld.`
        : consequence.title,
      consequence.explanation,
      `Effect: ${consequence.effect}`,
      recovery ? `Recovery: ${recovery.description}` : 'Recovery: no action required.',
    ].join(' '),
  };
}

export function dedupeCommanderConsequenceDialogues(
  dialogues: readonly CommanderConsequenceDialogue[],
  deliveredIds: readonly string[],
): readonly CommanderConsequenceDialogue[] {
  const delivered = new Set(deliveredIds);
  const seen = new Set<string>();
  return dialogues.filter((dialogue) => {
    if (delivered.has(dialogue.id) || seen.has(dialogue.id)) return false;
    seen.add(dialogue.id);
    return true;
  });
}
