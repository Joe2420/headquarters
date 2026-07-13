import type {
  JournalReflectionPlan,
  JournalWorkflowSnapshot,
} from '@headquarters/hqos';

export type CommanderJournalIntent =
  | 'openJournalCapture'
  | 'summarizeJournalContext'
  | 'askJournalReflectionQuestion'
  | 'acknowledgeJournalRecord'
  | 'requestJournalClarification'
  | 'summarizeJournalLesson'
  | 'proposeJournalCommitment'
  | 'explainPromotionEligibility'
  | 'explainJournalRecoveryRequirement'
  | 'confirmJournalArchive'
  | 'reopenJournalRevision'
  | 'returnToPriorOperation';

export interface CommanderJournalMessage {
  readonly id: string;
  readonly intent: CommanderJournalIntent;
  readonly text: string;
  readonly requiresOperatorAction: boolean;
}

export interface CommanderJournalDialogueInput {
  readonly workflow: JournalWorkflowSnapshot;
  readonly reflectionPlan?: JournalReflectionPlan | undefined;
  readonly returnRoom?: string | undefined;
}

export function buildCommanderJournalDialogue(input: CommanderJournalDialogueInput): readonly CommanderJournalMessage[] {
  const messages: CommanderJournalMessage[] = [];
  const journalId = input.workflow.activeRecord?.journalId ?? 'new';

  messages.push({
    id: `journal:${journalId}:purpose`,
    intent: 'openJournalCapture',
    text: getJournalPurpose(input.workflow),
    requiresOperatorAction: false,
  });

  if (input.workflow.linkedMission) {
    messages.push({
      id: `journal:${journalId}:context`,
      intent: 'summarizeJournalContext',
      text: `Known mission context is attached to ${input.workflow.linkedMission}. Do not repeat what Headquarters already recorded.`,
      requiresOperatorAction: false,
    });
  }

  if (input.workflow.blocker) {
    messages.push({
      id: `journal:${journalId}:recovery`,
      intent: 'explainJournalRecoveryRequirement',
      text: input.workflow.blocker.reason,
      requiresOperatorAction: true,
    });
  }

  if (input.workflow.missingFields.length > 0) {
    messages.push({
      id: `journal:${journalId}:clarification`,
      intent: 'requestJournalClarification',
      text: `Clarification required: ${input.workflow.missingFields.join(', ')}.`,
      requiresOperatorAction: true,
    });
  }

  if (input.reflectionPlan?.activeQuestion) {
    messages.push({
      id: `journal:${journalId}:question:${input.reflectionPlan.activeQuestion.dimension}`,
      intent: 'askJournalReflectionQuestion',
      text: input.reflectionPlan.activeQuestion.prompt,
      requiresOperatorAction: input.reflectionPlan.activeQuestion.required,
    });
  }

  if (input.workflow.promotionEligibility === 'review_required') {
    messages.push({
      id: `journal:${journalId}:review`,
      intent: 'summarizeJournalLesson',
      text: 'Reflection is recorded. Review the supported lesson before it becomes evidence.',
      requiresOperatorAction: true,
    });
  }

  if (input.workflow.promotionEligibility === 'eligible') {
    messages.push({
      id: `journal:${journalId}:promotion`,
      intent: 'explainPromotionEligibility',
      text: 'This Journal record is eligible for evidence promotion. Doctrine and Academy still require their own approval gates.',
      requiresOperatorAction: true,
    });
  }

  if (input.workflow.persistenceState === 'archived') {
    messages.push({
      id: `journal:${journalId}:archive`,
      intent: 'confirmJournalArchive',
      text: 'Journal record archived. Raw source remains preserved.',
      requiresOperatorAction: false,
    });
  }

  if (input.returnRoom) {
    messages.push({
      id: `journal:${journalId}:return`,
      intent: 'returnToPriorOperation',
      text: `Return context preserved: ${input.returnRoom}.`,
      requiresOperatorAction: false,
    });
  }

  return dedupeMessages(messages);
}

export function getPrimaryCommanderJournalPrompt(input: CommanderJournalDialogueInput): string {
  return buildCommanderJournalDialogue(input)[0]?.text ?? 'Journal is standing by.';
}

function getJournalPurpose(workflow: JournalWorkflowSnapshot): string {
  if (!workflow.activeRecord) return 'Journal is ready. Record first; interpret later.';
  if (workflow.currentState === 'reflection_required') return 'Journal requires reflection before knowledge extraction.';
  if (workflow.currentState === 'blocked') return 'Journal recovery work is required before Headquarters can proceed.';
  if (workflow.currentState === 'archived') return 'Journal history is preserved as read-only evidence.';
  return 'Journal preserves operator evidence. Commander will guide only the next required question.';
}

function dedupeMessages(messages: readonly CommanderJournalMessage[]): readonly CommanderJournalMessage[] {
  const seen = new Set<string>();
  const output: CommanderJournalMessage[] = [];
  for (const message of messages) {
    const key = `${message.id}:${message.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(message);
  }
  return output;
}
