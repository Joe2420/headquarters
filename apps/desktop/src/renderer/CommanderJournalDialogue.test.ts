import { describe, expect, it } from 'vitest';
import { buildJournalReflectionPlan, buildJournalWorkflowSnapshot, createJournalRecord, markJournalReviewed } from '@headquarters/hqos';
import {
  buildCommanderJournalDialogue,
  getPrimaryCommanderJournalPrompt,
} from './CommanderJournalDialogue';

const now = '2026-07-13T00:00:00.000Z';

const record = createJournalRecord({
  journalId: 'journal-1',
  recordType: 'mission_reflection',
  title: 'Mission reflection',
  rawContent: 'I waited for evidence.',
  createdAt: now,
  author: 'operator',
  missionId: 'mission-1',
  reviewState: 'awaiting_reflection',
});

describe('CommanderJournalDialogue', () => {
  it('opens Journal capture with Commander purpose copy', () => {
    const prompt = getPrimaryCommanderJournalPrompt({
      workflow: buildJournalWorkflowSnapshot(),
    });

    expect(prompt).toBe('Journal is ready. Record first; interpret later.');
  });

  it('summarizes known context and asks one active question', () => {
    const plan = buildJournalReflectionPlan({
      reflectionId: 'reflection-1',
      mode: 'mission_debrief_extension',
      sourceRecordId: 'journal-1',
      linkedMissionId: 'mission-1',
      knownContext: [{
        dimension: 'what_was_observed',
        summary: 'Observation already recorded.',
        source: 'mission',
      }],
    });

    const messages = buildCommanderJournalDialogue({
      workflow: buildJournalWorkflowSnapshot({ activeRecord: record }),
      reflectionPlan: plan,
    });

    expect(messages.some((message) => message.intent === 'summarizeJournalContext')).toBe(true);
    expect(messages.filter((message) => message.intent === 'askJournalReflectionQuestion')).toHaveLength(1);
    expect(messages.find((message) => message.intent === 'askJournalReflectionQuestion')?.text).toBe('What did you decide?');
  });

  it('requires derived lessons to be reviewed', () => {
    const messages = buildCommanderJournalDialogue({
      workflow: buildJournalWorkflowSnapshot({
        activeRecord: { ...record, reviewState: 'reflected' },
        extractionState: 'candidate',
      }),
    });

    expect(messages.find((message) => message.intent === 'summarizeJournalLesson')?.requiresOperatorAction).toBe(true);
  });

  it('explains that Doctrine and Academy remain separate approval gates', () => {
    const messages = buildCommanderJournalDialogue({
      workflow: buildJournalWorkflowSnapshot({
        activeRecord: markJournalReviewed(record, { now }),
        extractionState: 'reviewed',
      }),
    });

    expect(messages.find((message) => message.intent === 'explainPromotionEligibility')?.text)
      .toContain('Doctrine and Academy still require their own approval gates');
  });

  it('preserves return context without duplicate messages', () => {
    const messages = buildCommanderJournalDialogue({
      workflow: buildJournalWorkflowSnapshot({ activeRecord: record }),
      returnRoom: 'War Room',
    });

    expect(messages.filter((message) => message.intent === 'returnToPriorOperation')).toHaveLength(1);
  });
});
