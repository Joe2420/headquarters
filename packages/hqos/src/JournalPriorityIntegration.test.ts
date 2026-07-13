import { describe, expect, it } from 'vitest';
import { createJournalRecord } from './JournalRecord';
import { beginJournalReflection, buildJournalWorkflowSnapshot } from './JournalWorkflowEngine';
import {
  buildJournalPriorityRequestCandidate,
  dedupeJournalPriorityRequests,
  toJournalAttentionRequest,
} from './JournalPriorityIntegration';

const now = '2026-07-13T00:00:00.000Z';
const record = createJournalRecord({
  journalId: 'journal-1',
  recordType: 'mission_reflection',
  title: 'Reflection',
  rawContent: 'I waited for evidence.',
  createdAt: now,
  author: 'operator',
});

describe('JournalPriorityIntegration', () => {
  it('creates immediate request for Guardian recovery reflection', () => {
    const candidate = buildJournalPriorityRequestCandidate(buildJournalWorkflowSnapshot({
      activeRecord: record,
      blocker: {
        blockerId: 'guardian-recovery',
        source: 'guardian',
        reason: 'Guardian recovery requires written reflection.',
        requiredAction: 'completeReflection',
      },
    }));

    expect(candidate?.timing).toBe('immediate');
    expect(candidate?.blocking).toBe(true);
    if (!candidate) throw new Error('Expected candidate.');
    expect(toJournalAttentionRequest(candidate, now).interruptionPolicy).toBe('interrupt_immediately');
  });

  it('keeps normal reflection at a safe point', () => {
    const candidate = buildJournalPriorityRequestCandidate(beginJournalReflection(record));

    expect(candidate?.timing).toBe('safe_point');
    expect(candidate?.blocking).toBe(false);
  });

  it('creates standby daily reflection candidate without interrupting missions', () => {
    const candidate = buildJournalPriorityRequestCandidate(buildJournalWorkflowSnapshot());
    expect(candidate?.timing).toBe('standby');
    if (!candidate) throw new Error('Expected candidate.');
    expect(toJournalAttentionRequest(candidate, now).interruptionPolicy).toBe('mention_in_next_brief');
  });

  it('deduplicates Journal requests by duplicate key', () => {
    const candidate = buildJournalPriorityRequestCandidate(beginJournalReflection(record));
    expect(candidate).toBeDefined();
    if (!candidate) throw new Error('Expected candidate.');

    expect(dedupeJournalPriorityRequests([candidate, candidate])).toHaveLength(1);
  });
});
