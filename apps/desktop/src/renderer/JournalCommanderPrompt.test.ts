import { describe, expect, it } from 'vitest';
import type { JournalEntry } from '@headquarters/journal';
import { buildJournalRoomCommanderPrompt } from './App';

const entry: JournalEntry = {
  id: 'journal-1',
  entryDate: '2026-07-13',
  rawContent: 'I waited for evidence before acting.',
  source: 'manual',
  attachmentReferences: [],
  classificationStatus: 'unclassified',
  createdAt: '2026-07-13T00:00:00.000Z',
  updatedAt: '2026-07-13T00:00:00.000Z',
};

describe('buildJournalRoomCommanderPrompt', () => {
  it('uses workflow-backed capture copy when no record exists', () => {
    const prompt = buildJournalRoomCommanderPrompt({
      activeJournalStep: 'entry',
      latestEntry: undefined,
      activeMission: undefined,
      missionJournalLinkStatus: undefined,
    });

    expect(prompt).toBe('Journal is ready. Record first; interpret later.');
  });

  it('uses existing Journal evidence without creating a duplicate chat implementation', () => {
    const prompt = buildJournalRoomCommanderPrompt({
      activeJournalStep: 'reflection',
      latestEntry: entry,
      activeMission: {
        id: 'mission-1',
        campaign: 'NIGHT WATCH',
        objective: 'Observe the open.',
        condition: 'Briefing',
        commandAuthority: 'Professional command',
        currentState: 'observation',
        createdAt: '2026-07-13T00:00:00.000Z',
      },
      missionJournalLinkStatus: 'Mission linked',
    });

    expect(prompt).toContain('Journal preserves operator evidence');
  });
});
