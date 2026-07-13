import { describe, expect, it } from 'vitest';
import { buildHeadquartersIntelligenceGraph } from './HeadquartersIntelligenceGraphBuilder';
import type { MissionEvaluation } from './MissionEvaluationEngine';

const createdAt = '2026-07-13T00:00:00.000Z';

describe('HeadquartersIntelligenceGraphBuilder', () => {
  it('builds a complete mission graph from authoritative evidence', () => {
    const graph = buildHeadquartersIntelligenceGraph({
      createdAt,
      missions: [{
        missionId: 'mission-1',
        title: 'Mission 1',
        summary: 'Archived mission.',
        createdAt,
        market: 'BTC',
      }],
      evaluations: [evaluation('mission-1')],
      journals: [{
        journalId: 'journal-1',
        missionId: 'mission-1',
        title: 'Mission reflection',
        summary: 'Journal captured the lesson.',
        excerpt: 'Wait for confirmation.',
        createdAt,
      }],
      doctrineCandidates: [{
        candidateId: 'candidate-1',
        sourceJournalId: 'journal-1',
        missionId: 'mission-1',
        title: 'Wait for confirmation',
        summary: 'Candidate extracted from journal evidence.',
        createdAt,
      }],
      acceptedDoctrine: [{
        doctrineId: 'doctrine-1',
        candidateId: 'candidate-1',
        missionIds: ['mission-1'],
        title: 'Confirmation rule',
        summary: 'Accepted doctrine from reviewed evidence.',
        createdAt,
      }],
      consequences: [{
        consequenceId: 'consequence-1',
        missionId: 'mission-1',
        title: 'Risk consequence',
        summary: 'Consequence persisted.',
        createdAt,
        resolved: true,
      }],
      guardianAlerts: [{
        alertId: 'guardian-1',
        missionId: 'mission-1',
        consequenceId: 'consequence-1',
        title: 'Risk alert',
        summary: 'Guardian detected risk pressure.',
        createdAt,
      }],
      academyGrowth: [{
        growthId: 'growth-1',
        missionId: 'mission-1',
        title: 'Discipline growth',
        summary: 'Academy growth backed by mission process.',
        createdAt,
      }],
    });

    expect([...graph.nodes.map((node) => node.nodeType)].sort()).toEqual([
      'academy_growth_event',
      'accepted_doctrine',
      'doctrine_candidate',
      'guardian_alert',
      'journal_entry',
      'mission',
      'mission_evaluation',
      'operational_consequence',
    ]);
    expect(graph.edges.some((edge) => edge.sourceRule === 'journal-to-mission')).toBe(true);
    expect(graph.edges.some((edge) => edge.sourceRule === 'doctrine-candidate-to-journal')).toBe(true);
    expect(graph.edges.some((edge) => edge.sourceRule === 'accepted-doctrine-to-candidate')).toBe(true);
    expect(graph.edges.some((edge) => edge.sourceRule === 'guardian-alert-to-consequence')).toBe(true);
  });

  it('rebuilds deterministically and incremental updates add only new entities', () => {
    const first = buildHeadquartersIntelligenceGraph({
      createdAt,
      missions: [{ missionId: 'mission-1', title: 'Mission 1', summary: 'Archived.', createdAt }],
      evaluations: [evaluation('mission-1')],
    });
    const rebuilt = buildHeadquartersIntelligenceGraph({
      createdAt,
      missions: [{ missionId: 'mission-1', title: 'Mission 1', summary: 'Archived.', createdAt }],
      evaluations: [evaluation('mission-1')],
    });
    const updated = buildHeadquartersIntelligenceGraph({
      createdAt,
      previousSnapshot: first,
      missions: [
        { missionId: 'mission-1', title: 'Mission 1', summary: 'Archived.', createdAt },
        { missionId: 'mission-2', title: 'Mission 2', summary: 'Archived.', createdAt },
      ],
    });

    expect(rebuilt).toEqual(first);
    expect(updated.nodes.filter((node) => node.nodeType === 'mission')).toHaveLength(2);
  });

  it('uses Commander Relationship evidence instead of recreating behavior from raw missions', () => {
    const graph = buildHeadquartersIntelligenceGraph({
      createdAt,
      missions: [{ missionId: 'mission-1', title: 'Mission 1', summary: 'Archived.', createdAt }],
      relationshipEvidence: [{
        relationshipId: 'relationship-1',
        missionIds: ['mission-1'],
        title: 'Patience pattern',
        summary: 'Authoritative relationship evidence says patience improved.',
        createdAt,
      }],
    });

    expect(graph.nodes.find((node) => node.nodeType === 'behavior_pattern')?.sourceSubsystem)
      .toBe('commander-relationship');
    expect(graph.edges.find((edge) => edge.sourceRule === 'relationship-to-mission')?.strength)
      .toBe('repeated');
  });
});

function evaluation(missionId: string): MissionEvaluation {
  return {
    id: `evaluation:${missionId}`,
    missionId,
    evaluatedAt: createdAt,
    verdict: 'Successful',
    classification: 'Successful',
    dimensions: [],
    strengths: ['Process evidence complete.'],
    weaknesses: [],
    recommendations: ['Keep the same evidence standard.'],
    supportingReasons: ['Process evidence complete.'],
    failures: [],
    commanderVerdict: 'Mission process accepted.',
    commanderReview: 'Commander reviewed the mission outcome.',
    unresolvedLesson: 'No unresolved lesson.',
    recognitionEligible: true,
    recognition: ['Disciplined process.'],
    academyGrowth: 'discipline improvement',
    academyGrowthEvidence: ['Discipline improved.'],
    guardianHistoryUpdate: 'Guardian clear.',
    guardianNotes: [],
    doctrineContribution: 'none',
    doctrineUpdates: [],
    doctrineCandidateEligible: false,
    archiveClassification: 'Archived',
  };
}
