import { describe, expect, it } from 'vitest';
import { createJournalRecord, linkJournalEvidence } from './JournalRecord';
import { extractJournalKnowledge } from './JournalKnowledgeExtractionEngine';

const now = '2026-07-13T00:00:00.000Z';

function record(rawContent: string) {
  return createJournalRecord({
    journalId: 'journal-1',
    recordType: 'mission_reflection',
    title: 'Reflection',
    rawContent,
    createdAt: now,
    author: 'operator',
  });
}

describe('JournalKnowledgeExtractionEngine', () => {
  it('extracts a supported lesson from source evidence', () => {
    const source = linkJournalEvidence(record('I entered before confirming volume because I felt rushed.'), {
      id: 'mission-1',
      source: 'mission',
    }, { now });

    const extraction = extractJournalKnowledge(source, { now });

    expect(extraction.candidateLesson?.proposedText).toContain('volume confirms');
    expect(extraction.candidateLesson?.sourceExcerpt).toContain('confirming volume');
    expect(extraction.candidateLesson?.confidenceState).toBe('supported');
  });

  it('keeps vague text tentative and unresolved', () => {
    const extraction = extractJournalKnowledge(record('Bad.'), { now });

    expect(extraction.unresolvedQuestion?.eligibility).toBe('ineligible');
    expect(extraction.items).toHaveLength(1);
  });

  it('creates observable commitments from behavior text', () => {
    const extraction = extractJournalKnowledge(record('I rushed before confirming the plan and risk.'), { now });

    expect(extraction.candidateCommitment?.proposedText).toContain('Before authorization');
    expect(extraction.candidateCommitment?.eligibility).toBe('eligible');
  });

  it('requires Doctrine shape and repeated evidence before eligibility', () => {
    const extraction = extractJournalKnowledge(record('If volume confirms then wait for structure unless the level breaks.'), { now });

    expect(extraction.candidateDoctrineSource?.missingEvidence).toContain('repeated evidence');
    expect(extraction.candidateDoctrineSource?.eligibility).toBe('needs_review');
  });

  it('does not treat reflection alone as growth proof', () => {
    const extraction = extractJournalKnowledge(record('I waited for evidence and respected risk.'), { now });

    expect(extraction.candidateGrowthEvidence?.confidenceState).toBe('insufficient');
    expect(extraction.candidateGrowthEvidence?.eligibility).toBe('ineligible');
  });

  it('validates recovery evidence against source references', () => {
    const recovery = createJournalRecord({
      journalId: 'recovery-1',
      recordType: 'recovery_reflection',
      title: 'Recovery',
      rawContent: 'I rushed and will state evidence before authorization.',
      createdAt: now,
      author: 'operator',
    });

    const extraction = extractJournalKnowledge(recovery, { now });

    expect(extraction.candidateRecoveryEvidence?.missingEvidence).toContain('Guardian recovery evidence');
  });

  it('exposes contradictions without resolving them', () => {
    const extraction = extractJournalKnowledge(record('I always wait and never wait when risk appears.'), { now });

    expect(extraction.contradiction?.contradictions).toEqual(['always and never both present']);
  });

  it('is deterministic for identical input', () => {
    const source = record('I waited for risk evidence before acting.');

    expect(extractJournalKnowledge(source, { now })).toEqual(extractJournalKnowledge(source, { now }));
  });
});
