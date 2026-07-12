import { describe, expect, it } from 'vitest';
import { buildMissionEvaluation } from './MissionEvaluationEngine';
import { buildInstitutionalHealthSnapshot } from './InstitutionalHealthEngine';

const evaluatedAt = '2026-07-12T12:00:00.000Z';

describe('InstitutionalHealthEngine', () => {
  it('builds deterministic explainable health dimensions from approved evidence', () => {
    const snapshot = buildInstitutionalHealthSnapshot({
      snapshotId: 'health:mission-1',
      evaluatedAt,
      missionState: 'observation',
      guardian: { state: 'secure', highestAlert: 'Guardian reports no active restriction.' },
      doctrine: { activeProtectiveRule: 'Wait for confirmation.', pendingCandidateCount: 0 },
      archive: { persistenceReady: true, archiveRecordCount: 3 },
      intelligence: { missingEvidenceCount: 0, contradictionCount: 0, confidenceLevel: 'complete', validatedEvidenceCount: 8 },
    });

    expect(snapshot.snapshotId).toBe('health:mission-1');
    expect(snapshot.dimensions).toHaveLength(8);
    expect(snapshot.overallState).toBe('forming');
    expect(snapshot.dimensions.every((dimension) => dimension.supportingEvidence.length > 0)).toBe(true);
    expect(snapshot.dimensions.every((dimension) => dimension.explanation.why.length > 0)).toBe(true);
  });

  it('marks critical health from Guardian lockout and blocking priority evidence', () => {
    const snapshot = buildInstitutionalHealthSnapshot({
      snapshotId: 'health:critical',
      evaluatedAt,
      missionState: 'authorization',
      guardian: { state: 'lockout', highestAlert: 'Guardian lockout active.' },
      doctrine: { activeProtectiveRule: 'No protective rule declared for current authorization.', pendingCandidateCount: 0 },
      archive: { persistenceReady: true, archiveRecordCount: 1 },
      intelligence: { missingEvidenceCount: 1, contradictionCount: 0, confidenceLevel: 'forming' },
      priority: { criticalPriorityCount: 1, blockingPriorityCount: 1 },
    });

    expect(snapshot.overallState).toBe('critical');
    expect(snapshot.highestConcern?.id).toBe('guardian-stability');
    expect(snapshot.dimensions.find((dimension) => dimension.id === 'guardian-stability')?.state).toBe('critical');
  });

  it('uses MissionEvaluation without replacing its policy', () => {
    const evaluation = buildMissionEvaluation({
      missionId: 'mission-1',
      missionState: 'archived',
      missionIntelligence: {
        missionId: 'mission-1',
        missingEvidence: [],
        contradictions: [],
        guardianNotes: [],
        riskLimit: '1%',
        authorizationSummary: 'Authorization followed the declared setup.',
        debriefSummary: 'Followed plan and reviewed execution.',
      },
      guardian: { state: 'secure', highestAlert: 'Guardian clear.' },
      doctrine: {
        activeProtectiveRule: 'Wait for confirmation.',
        pendingCandidateCount: 0,
        relevance: 'Doctrine supports current mission.',
      },
      evaluatedAt,
    });

    const snapshot = buildInstitutionalHealthSnapshot({
      evaluatedAt,
      missionState: 'archived',
      missionEvaluation: evaluation,
      guardian: { state: 'secure', highestAlert: 'Guardian clear.' },
      doctrine: { activeProtectiveRule: 'Wait for confirmation.', pendingCandidateCount: 0 },
      academy: { growthEvidenceCount: 2, recognitionAvailable: true },
      archive: { persistenceReady: true, archiveRecordCount: 12, replayReady: true },
      intelligence: { missingEvidenceCount: 0, contradictionCount: 0, confidenceLevel: 'complete', validatedEvidenceCount: 8 },
    });

    expect(snapshot.dimensions.find((dimension) => dimension.id === 'mission-integrity')?.explanation.supportingEvidence)
      .toContain(evaluation.commanderVerdict);
    expect(snapshot.dimensions.find((dimension) => dimension.id === 'archive-integrity')?.state).toBe('excellent');
  });

  it('calculates trends by comparing previous and current snapshots', () => {
    const previous = buildInstitutionalHealthSnapshot({
      snapshotId: 'health:previous',
      evaluatedAt: '2026-07-12T11:00:00.000Z',
      missionState: 'authorization',
      guardian: { state: 'lockout', highestAlert: 'Guardian lockout active.' },
      doctrine: { activeProtectiveRule: 'No protective rule declared for current authorization.', pendingCandidateCount: 0 },
      archive: { persistenceReady: true, archiveRecordCount: 1 },
      intelligence: { missingEvidenceCount: 2, contradictionCount: 1, confidenceLevel: 'forming' },
    });

    const current = buildInstitutionalHealthSnapshot({
      snapshotId: 'health:current',
      evaluatedAt,
      missionState: 'authorization',
      guardian: { state: 'secure', highestAlert: 'Guardian clear.' },
      doctrine: { activeProtectiveRule: 'Wait for confirmation.', pendingCandidateCount: 0 },
      archive: { persistenceReady: true, archiveRecordCount: 1 },
      intelligence: { missingEvidenceCount: 0, contradictionCount: 0, confidenceLevel: 'complete', validatedEvidenceCount: 8 },
      previousSnapshot: previous,
    });

    expect(current.dimensions.find((dimension) => dimension.id === 'guardian-stability')?.trend).toBe('improving');
    expect(current.dimensions.find((dimension) => dimension.id === 'intelligence-completeness')?.trend).toBe('improving');
  });
});
