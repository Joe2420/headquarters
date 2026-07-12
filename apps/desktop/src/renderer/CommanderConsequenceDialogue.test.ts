import { describe, expect, it } from 'vitest';
import { createOperationalConsequence, resolveOperationalConsequence } from '@headquarters/hqos';
import {
  buildCommanderConsequenceDialogue,
  dedupeCommanderConsequenceDialogues,
} from './CommanderConsequenceDialogue';

describe('CommanderConsequenceDialogue', () => {
  it('explains active consequences once with cause, effect, and recovery', () => {
    const dialogue = buildCommanderConsequenceDialogue(createConsequence());

    expect(dialogue.intent).toBe('explainConsequence');
    expect(dialogue.message).toContain('Effect: Authorization blocked.');
    expect(dialogue.message).toContain('Recovery: Provide protective rule.');
  });

  it('states blocked action contextually', () => {
    const dialogue = buildCommanderConsequenceDialogue(createConsequence(), {
      attemptedBlockedAction: 'Authorization',
    });

    expect(dialogue.intent).toBe('stateBlockedAction');
    expect(dialogue.message).toContain('Authorization remains withheld.');
  });

  it('confirms resolved consequences quietly', () => {
    const consequence = createOperationalConsequence({
      ...createConsequence(),
      recoveryRequirements: [{
        ...createConsequence().recoveryRequirements[0]!,
        completionState: 'satisfied',
        completedAt: '2026-07-12T16:00:00.000Z',
        evidenceReferences: [{ id: 'doctrine:rule', source: 'doctrine' }],
      }],
    });
    const resolved = resolveOperationalConsequence(consequence, {
      resolvedAt: '2026-07-12T16:05:00.000Z',
      resolutionEvidence: [{ id: 'doctrine:rule', source: 'doctrine' }],
    });

    expect(buildCommanderConsequenceDialogue(resolved).intent).toBe('confirmRecovery');
  });

  it('deduplicates delivered consequence messages', () => {
    const dialogue = buildCommanderConsequenceDialogue(createConsequence());

    expect(dedupeCommanderConsequenceDialogues([dialogue, dialogue], [])).toHaveLength(1);
    expect(dedupeCommanderConsequenceDialogues([dialogue], [dialogue.id])).toEqual([]);
  });
});

function createConsequence() {
  return createOperationalConsequence({
    consequenceId: 'consequence:mission-1:rule',
    missionId: 'mission-1',
    category: 'doctrine',
    type: 'authorization_without_protective_rule',
    severity: 'restriction',
    title: 'Protective rule missing',
    explanation: 'The evidence package has no protective rule.',
    cause: 'Rule missing.',
    effect: 'Authorization blocked.',
    evidenceReferences: [{ id: 'evaluation:mission-1', source: 'mission-evaluation' }],
    createdAt: '2026-07-12T16:00:00.000Z',
    recoveryRequirements: [{
      requirementId: 'recovery:rule',
      description: 'Provide protective rule.',
      type: 'confirm_protective_rule',
      evidenceRequired: true,
    }],
  });
}
