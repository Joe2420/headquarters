import { describe, expect, it } from 'vitest';

import { createLocalMission } from './App';
import { listMissionArchiveDossiers } from './MissionArchiveDossier';

describe('MissionArchiveDossier', () => {
  it('builds deterministic read-only mission dossiers in archive order', () => {
    const mission = createLocalMission(
      { codename: 'Atlas', objective: 'Preserve discipline evidence' },
      { id: 'mission-001', createdAt: '2026-01-01T00:00:00.000Z' },
    );

    if (!mission) throw new Error('Expected mission');

    const dossiers = listMissionArchiveDossiers({
      missionHistory: [mission],
      summaries: [
        {
          missionId: 'mission-001',
          codename: 'Atlas',
          archivedAt: '2026-01-01T01:00:00.000Z',
          eventCount: 3,
        },
      ],
    });

    expect(dossiers).toEqual([
      {
        missionId: 'mission-001',
        codename: 'Atlas',
        archivedAt: '2026-01-01T01:00:00.000Z',
        state: 'briefing',
        eventCount: 3,
        debriefStatus: 'Debrief evidence not attached',
        commanderSummary: 'Atlas: Preserve discipline evidence',
        permanenceStatement: 'Archive dossier is read-only historical intelligence.',
      },
    ]);
  });
});
