import { describe, expect, it } from 'vitest';
import {
  answerJournalReflectionQuestion,
  buildJournalReflectionPlan,
} from './JournalReflectionProtocol';

describe('JournalReflectionProtocol', () => {
  it('asks minimal questions for quick capture', () => {
    const plan = buildJournalReflectionPlan({
      reflectionId: 'reflection-1',
      mode: 'quick_capture',
      sourceRecordId: 'journal-1',
    });

    expect(plan.requiredDimensions).toEqual(['what_happened']);
    expect(plan.activeQuestion?.dimension).toBe('what_happened');
  });

  it('uses mission context to suppress duplicate known questions', () => {
    const plan = buildJournalReflectionPlan({
      reflectionId: 'reflection-1',
      mode: 'trade_review',
      sourceRecordId: 'journal-1',
      linkedMissionId: 'mission-1',
      knownContext: [{
        dimension: 'what_was_decided',
        summary: 'Mission plan already recorded.',
        source: 'mission',
      }],
    });

    expect(plan.requiredDimensions).not.toContain('what_was_decided');
    expect(plan.activeQuestion?.dimension).toBe('what_behavior_occurred');
  });

  it('requires mandatory recovery dimensions', () => {
    const plan = buildJournalReflectionPlan({
      reflectionId: 'reflection-1',
      mode: 'recovery_reflection',
      sourceRecordId: 'journal-1',
    });

    expect(plan.requiredDimensions).toEqual([
      'what_happened',
      'what_behavior_occurred',
      'what_will_change',
      'what_evidence_supports_the_lesson',
    ]);
  });

  it('allows optional dimensions to be skipped', () => {
    const plan = buildJournalReflectionPlan({
      reflectionId: 'reflection-1',
      mode: 'quick_capture',
      sourceRecordId: 'journal-1',
      answers: [
        { dimension: 'what_happened', answer: 'Preserve the opening context.' },
        { dimension: 'what_remains_uncertain', answer: '', skipped: true },
      ],
    });

    expect(plan.completionState).toBe('complete');
    expect(plan.activeQuestion).toBeUndefined();
  });

  it('detects contradiction and requests clarification', () => {
    const plan = buildJournalReflectionPlan({
      reflectionId: 'reflection-1',
      mode: 'behavior_review',
      sourceRecordId: 'journal-1',
      answers: [
        { dimension: 'what_behavior_occurred', answer: 'I waited.' },
        { dimension: 'what_behavior_occurred', answer: 'I rushed.' },
      ],
    });

    expect(plan.completionState).toBe('clarification_required');
    expect(plan.nextAction).toBe('clarify_contradiction');
  });

  it('keeps exactly one active question in deterministic order', () => {
    const plan = buildJournalReflectionPlan({
      reflectionId: 'reflection-1',
      mode: 'daily_reflection',
      sourceRecordId: 'journal-1',
      answers: [{ dimension: 'what_behavior_occurred', answer: 'Prepared before action.' }],
    });

    expect(plan.activeQuestion?.dimension).toBe('what_went_well');
  });

  it('restores active question after reload from known answers', () => {
    const plan = buildJournalReflectionPlan({
      reflectionId: 'reflection-1',
      mode: 'doctrine_clarification',
      sourceRecordId: 'journal-1',
      answers: [{ dimension: 'what_rule_or_commitment_applied', answer: 'Wait for volume confirmation.' }],
    });

    expect(plan.activeQuestion?.dimension).toBe('what_evidence_supports_the_lesson');
  });

  it('advances when answering the active question through helper', () => {
    const plan = buildJournalReflectionPlan({
      reflectionId: 'reflection-1',
      mode: 'quick_capture',
      sourceRecordId: 'journal-1',
    });

    const updated = answerJournalReflectionQuestion(plan, {
      dimension: 'what_happened',
      answer: 'I captured the market opening context.',
    });

    expect(updated.completedDimensions).toContain('what_happened');
    expect(updated.activeQuestion?.dimension).toBe('what_remains_uncertain');
  });
});
