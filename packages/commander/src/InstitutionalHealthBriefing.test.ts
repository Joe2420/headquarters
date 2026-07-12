import { describe, expect, it } from 'vitest';
import { buildInstitutionalHealthSnapshot } from '@headquarters/hqos';
import { buildCommanderInstitutionalHealthBriefing } from './InstitutionalHealthBriefing';

describe('Commander institutional health briefing', () => {
  it('summarizes meaningful health changes without raw counters', () => {
    const current = buildInstitutionalHealthSnapshot({
      snapshotId: 'health:critical',
      evaluatedAt: '2026-07-12T12:00:00.000Z',
      missionState: 'authorization',
      guardian: { state: 'lockout', highestAlert: 'Guardian lockout active.' },
      doctrine: { activeProtectiveRule: 'Wait for confirmation.', pendingCandidateCount: 0 },
      archive: { persistenceReady: true, archiveRecordCount: 1 },
      intelligence: { missingEvidenceCount: 0, contradictionCount: 0, confidenceLevel: 'complete', validatedEvidenceCount: 8 },
      priority: { criticalPriorityCount: 1 },
    });

    const briefing = buildCommanderInstitutionalHealthBriefing({ current });

    expect(briefing.changed).toBe(true);
    expect(briefing.summary).toContain('critical');
    expect(briefing.priority).toContain('Guardian Stability');
    expect(briefing.evidence).toContain('Guardian lockout active.');
  });

  it('stays quiet when the condition did not change', () => {
    const snapshot = buildInstitutionalHealthSnapshot({
      snapshotId: 'health:healthy',
      evaluatedAt: '2026-07-12T12:00:00.000Z',
      missionState: 'observation',
      guardian: { state: 'secure', highestAlert: 'Guardian clear.' },
      doctrine: { activeProtectiveRule: 'Wait for confirmation.', pendingCandidateCount: 0 },
      archive: { persistenceReady: true, archiveRecordCount: 1 },
      intelligence: { missingEvidenceCount: 0, contradictionCount: 0, confidenceLevel: 'complete', validatedEvidenceCount: 8 },
    });

    const briefing = buildCommanderInstitutionalHealthBriefing({ current: snapshot, previous: snapshot });

    expect(briefing.changed).toBe(false);
    expect(briefing.summary).toBe('Headquarters condition is unchanged. Continue the current operational path.');
  });
});
