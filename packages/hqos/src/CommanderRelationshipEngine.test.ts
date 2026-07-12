import { describe, expect, it } from 'vitest';
import { buildMissionEvaluation } from './MissionEvaluationEngine';
import { buildCommanderRelationshipDialogue } from './CommanderRelationshipCoaching';
import { buildCommanderRelationshipSnapshot } from './CommanderRelationshipEngine';

const evaluatedAt = '2026-07-12T12:00:00.000Z';

describe('CommanderRelationshipEngine', () => {
  it('builds a deterministic relationship snapshot from mission evidence', () => {
    const snapshot = buildCommanderRelationshipSnapshot({
      operatorId: 'operator-1',
      snapshotId: 'relationship:one',
      evaluatedAt,
      missionContexts: [
        {
          missionId: 'mission-1',
          briefingComplete: true,
          observationComplete: true,
          authorizationEvidencePresent: true,
          invalidationPresent: true,
          riskDeclared: true,
          debriefComplete: true,
          emotionalState: 'calm',
        },
      ],
      journalEntries: [{ id: 'journal-1', missionId: 'mission-1', behaviorSummary: 'Reflection captured the behavior and lesson.' }],
      doctrineRecords: [{ id: 'doctrine-1', missionId: 'mission-1', title: 'Wait for confirmation', promoted: false }],
      academyEvents: [{ id: 'academy-1', missionId: 'mission-1', category: 'patience', title: 'Waited for evidence' }],
    });

    expect(snapshot.relationship.operatorId).toBe('operator-1');
    expect(snapshot.relationship.profile.dimensions).toHaveLength(9);
    expect(snapshot.relationship.profile.strengths.map((dimension) => dimension.id)).toContain('observation-discipline');
    expect(snapshot.sourceEvidence.every((evidence) => evidence.description.length > 0)).toBe(true);
  });

  it('detects repeated authorization weakness and changes coaching mode', () => {
    const evaluations = [1, 2, 3].map((index) => buildMissionEvaluation({
      missionId: `mission-${index}`,
      missionState: 'authorization',
      missionIntelligence: {
        missionId: `mission-${index}`,
        missingEvidence: [],
        contradictions: [],
        guardianNotes: [],
        riskLimit: '1%',
      },
      guardian: { state: 'secure', highestAlert: 'Guardian clear.' },
      doctrine: {
        activeProtectiveRule: 'No protective rule declared for current authorization.',
        pendingCandidateCount: 0,
        relevance: 'Doctrine protection missing.',
      },
      evaluatedAt,
    }));

    const snapshot = buildCommanderRelationshipSnapshot({
      evaluatedAt,
      missionEvaluations: evaluations,
    });

    expect(snapshot.relationship.coachingMode).toBe('challenging');
    expect(snapshot.relationship.profile.needsAttention.map((dimension) => dimension.id)).toContain('authorization-discipline');
    expect(snapshot.relationship.profile.patterns.map((pattern) => pattern.id)).toContain('pattern:impulsive-authorization');
  });

  it('recognizes milestones without celebrating raw mission count', () => {
    const missionContexts = Array.from({ length: 5 }, (_, index) => ({
      missionId: `mission-${index}`,
      debriefComplete: true,
    }));

    const snapshot = buildCommanderRelationshipSnapshot({
      evaluatedAt,
      missionContexts,
    });

    expect(snapshot.relationship.profile.milestones.map((milestone) => milestone.id)).toContain('milestone:five-complete-debriefs');
    expect(JSON.stringify(snapshot.relationship.profile.milestones)).not.toMatch(/mission count/iu);
  });

  it('creates Commander dialogue from relationship evidence without duplicate message ids', () => {
    const snapshot = buildCommanderRelationshipSnapshot({
      evaluatedAt,
      missionContexts: [
        { missionId: 'mission-1', observationComplete: true },
        { missionId: 'mission-2', observationComplete: true },
      ],
    });

    const dialogue = buildCommanderRelationshipDialogue(snapshot);
    const ids = dialogue.map((message) => message.messageId);

    expect(dialogue.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    expect(dialogue.some((message) => message.message.includes('Observation Discipline'))).toBe(true);
  });
});
