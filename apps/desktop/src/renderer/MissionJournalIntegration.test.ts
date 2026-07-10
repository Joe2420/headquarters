import { describe, expect, it } from 'vitest';

import { createLocalMission } from './App';
import { buildMissionJournalLink } from './MissionJournalIntegration';

describe('MissionJournalIntegration', () => {
  it('summarizes the journal link for the active mission', () => {
    const mission = createLocalMission(
      { codename: 'Atlas', objective: 'Protect process' },
      { id: 'mission-001', createdAt: '2026-01-01T00:00:00.000Z' },
    );

    if (!mission) throw new Error('Expected mission');

    const link = buildMissionJournalLink({
      mission,
      journalEntries: [{
        id: 'journal-001',
        entryDate: '2026-01-01',
        rawContent: 'Atlas remained patient.',
        source: 'manual',
        attachmentReferences: [],
        classificationStatus: 'unclassified',
        createdAt: '2026-01-01T00:01:00.000Z',
        updatedAt: '2026-01-01T00:01:00.000Z',
      }],
    });

    expect(link).toEqual({
      missionId: 'mission-001',
      codename: 'Atlas',
      linkedEntryCount: 1,
      status: '1 journal entry linked to this mission.',
      prompt: 'Write the next command log entry for Atlas.',
    });
  });
});
