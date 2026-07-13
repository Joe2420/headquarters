import type { MissionEvaluation } from './MissionEvaluationEngine';
import type { MissionReplay } from './MissionReplay';
import type {
  IntelligenceEdgeInput,
  IntelligenceEvidenceReference,
  IntelligenceGraphSnapshot,
  IntelligenceNodeInput,
} from './HeadquartersIntelligenceGraph';
import { createIntelligenceGraphSnapshot, stableIntelligenceId } from './HeadquartersIntelligenceGraph';

export interface IntelligenceMissionEvidence {
  readonly missionId: string;
  readonly title: string;
  readonly summary: string;
  readonly createdAt: string;
  readonly market?: string | undefined;
  readonly session?: string | undefined;
}

export interface IntelligenceJournalEvidence {
  readonly journalId: string;
  readonly missionId?: string | undefined;
  readonly title: string;
  readonly summary: string;
  readonly excerpt: string;
  readonly createdAt: string;
}

export interface IntelligenceDoctrineCandidateEvidence {
  readonly candidateId: string;
  readonly sourceJournalId?: string | undefined;
  readonly missionId?: string | undefined;
  readonly title: string;
  readonly summary: string;
  readonly createdAt: string;
}

export interface IntelligenceAcceptedDoctrineEvidence {
  readonly doctrineId: string;
  readonly candidateId?: string | undefined;
  readonly missionIds: readonly string[];
  readonly title: string;
  readonly summary: string;
  readonly createdAt: string;
}

export interface IntelligenceGuardianEvidence {
  readonly alertId: string;
  readonly missionId?: string | undefined;
  readonly consequenceId?: string | undefined;
  readonly recoveryId?: string | undefined;
  readonly ruleId?: string | undefined;
  readonly title: string;
  readonly summary: string;
  readonly createdAt: string;
}

export interface IntelligenceOperationalConsequenceEvidence {
  readonly consequenceId: string;
  readonly missionId?: string | undefined;
  readonly recoveryId?: string | undefined;
  readonly title: string;
  readonly summary: string;
  readonly createdAt: string;
  readonly resolved?: boolean | undefined;
}

export interface IntelligenceAcademyGrowthEvidence {
  readonly growthId: string;
  readonly missionId?: string | undefined;
  readonly title: string;
  readonly summary: string;
  readonly createdAt: string;
}

export interface IntelligenceRelationshipEvidence {
  readonly relationshipId: string;
  readonly missionIds: readonly string[];
  readonly title: string;
  readonly summary: string;
  readonly createdAt: string;
}

export interface HeadquartersIntelligenceGraphBuilderInput {
  readonly createdAt: string;
  readonly previousSnapshot?: IntelligenceGraphSnapshot | undefined;
  readonly missions?: readonly IntelligenceMissionEvidence[] | undefined;
  readonly replays?: readonly MissionReplay[] | undefined;
  readonly evaluations?: readonly MissionEvaluation[] | undefined;
  readonly journals?: readonly IntelligenceJournalEvidence[] | undefined;
  readonly doctrineCandidates?: readonly IntelligenceDoctrineCandidateEvidence[] | undefined;
  readonly acceptedDoctrine?: readonly IntelligenceAcceptedDoctrineEvidence[] | undefined;
  readonly guardianAlerts?: readonly IntelligenceGuardianEvidence[] | undefined;
  readonly consequences?: readonly IntelligenceOperationalConsequenceEvidence[] | undefined;
  readonly academyGrowth?: readonly IntelligenceAcademyGrowthEvidence[] | undefined;
  readonly relationshipEvidence?: readonly IntelligenceRelationshipEvidence[] | undefined;
}

export function buildHeadquartersIntelligenceGraph(
  input: HeadquartersIntelligenceGraphBuilderInput,
): IntelligenceGraphSnapshot {
  const nodes: IntelligenceNodeInput[] = [...(input.previousSnapshot?.nodes ?? [])];
  const edges: IntelligenceEdgeInput[] = [...(input.previousSnapshot?.edges ?? [])];

  for (const mission of input.missions ?? []) {
    nodes.push(createSourceNode({
      nodeType: 'mission',
      sourceSubsystem: 'mission',
      sourceEntityId: mission.missionId,
      missionId: mission.missionId,
      title: mission.title,
      summary: mission.summary,
      createdAt: mission.createdAt,
      tags: ['mission', mission.market, mission.session].filter((tag): tag is string => Boolean(tag)),
      description: 'Archived mission evidence.',
    }));
  }

  for (const evaluation of input.evaluations ?? []) {
    const evaluationNodeId = nodeId('mission_evaluation', 'evaluation', evaluation.id, evaluation.missionId);
    nodes.push(createSourceNode({
      nodeType: 'mission_evaluation',
      sourceSubsystem: 'evaluation',
      sourceEntityId: evaluation.id,
      missionId: evaluation.missionId,
      title: `Evaluation: ${evaluation.verdict}`,
      summary: evaluation.commanderReview,
      createdAt: evaluation.evaluatedAt,
      tags: ['evaluation', evaluation.verdict],
      description: 'Authoritative mission evaluation.',
    }));
    edges.push(link({
      fromNodeId: missionNodeId(evaluation.missionId),
      toNodeId: evaluationNodeId,
      edgeType: 'produced',
      explanation: 'Mission produced an authoritative evaluation.',
      evidence: sourceEvidence('evaluation', evaluation.id, evaluation.id, 'Mission evaluation reused by graph builder.'),
      createdAt: evaluation.evaluatedAt,
      sourceRule: 'mission-to-evaluation',
    }));
  }

  for (const replay of input.replays ?? []) {
    nodes.push(createSourceNode({
      nodeType: 'mission_replay',
      sourceSubsystem: 'replay',
      sourceEntityId: replay.replayId,
      missionId: replay.missionId,
      title: replay.summary.title,
      summary: replay.summary.commanderSummary,
      createdAt: replay.createdAt,
      tags: ['replay'],
      description: 'Mission replay reconstruction.',
    }));
    edges.push(link({
      fromNodeId: missionNodeId(replay.missionId),
      toNodeId: nodeId('mission_replay', 'replay', replay.replayId, replay.missionId),
      edgeType: 'produced',
      explanation: 'Mission replay reconstructs persisted mission evidence.',
      evidence: sourceEvidence('replay', replay.replayId, replay.replayId, 'Mission replay source.'),
      createdAt: replay.createdAt,
      sourceRule: 'mission-to-replay',
    }));
  }

  for (const journal of input.journals ?? []) {
    nodes.push(createSourceNode({
      nodeType: 'journal_entry',
      sourceSubsystem: 'journal',
      sourceEntityId: journal.journalId,
      missionId: journal.missionId,
      title: journal.title,
      summary: journal.summary,
      createdAt: journal.createdAt,
      tags: ['journal'],
      description: journal.excerpt,
    }));
    if (journal.missionId) {
      edges.push(link({
        fromNodeId: nodeId('journal_entry', 'journal', journal.journalId, journal.missionId),
        toNodeId: missionNodeId(journal.missionId),
        edgeType: 'linked_to_mission',
        explanation: 'Journal entry is linked to its source mission.',
        evidence: sourceEvidence('journal', journal.journalId, journal.journalId, journal.excerpt),
        createdAt: journal.createdAt,
        sourceRule: 'journal-to-mission',
      }));
    }
  }

  for (const candidate of input.doctrineCandidates ?? []) {
    nodes.push(createSourceNode({
      nodeType: 'doctrine_candidate',
      sourceSubsystem: 'doctrine',
      sourceEntityId: candidate.candidateId,
      missionId: candidate.missionId,
      title: candidate.title,
      summary: candidate.summary,
      createdAt: candidate.createdAt,
      tags: ['doctrine', 'candidate'],
      description: 'Doctrine candidate source evidence.',
    }));
    if (candidate.sourceJournalId) {
      edges.push(link({
        fromNodeId: nodeId('doctrine_candidate', 'doctrine', candidate.candidateId, candidate.missionId),
        toNodeId: nodeId('journal_entry', 'journal', candidate.sourceJournalId, candidate.missionId),
        edgeType: 'originated_from',
        explanation: 'Doctrine candidate originated from journal evidence.',
        evidence: sourceEvidence('doctrine', candidate.candidateId, candidate.candidateId, candidate.summary),
        createdAt: candidate.createdAt,
        sourceRule: 'doctrine-candidate-to-journal',
      }));
    }
  }

  for (const doctrine of input.acceptedDoctrine ?? []) {
    nodes.push(createSourceNode({
      nodeType: 'accepted_doctrine',
      sourceSubsystem: 'doctrine',
      sourceEntityId: doctrine.doctrineId,
      title: doctrine.title,
      summary: doctrine.summary,
      createdAt: doctrine.createdAt,
      tags: ['doctrine', 'accepted'],
      description: 'Accepted doctrine record.',
    }));
    if (doctrine.candidateId) {
      edges.push(link({
        fromNodeId: nodeId('accepted_doctrine', 'doctrine', doctrine.doctrineId),
        toNodeId: nodeId('doctrine_candidate', 'doctrine', doctrine.candidateId),
        edgeType: 'revised_by',
        explanation: 'Accepted doctrine revised a reviewed candidate.',
        evidence: sourceEvidence('doctrine', doctrine.doctrineId, doctrine.doctrineId, doctrine.summary),
        createdAt: doctrine.createdAt,
        sourceRule: 'accepted-doctrine-to-candidate',
      }));
    }
    for (const missionId of doctrine.missionIds) {
      edges.push(link({
        fromNodeId: nodeId('accepted_doctrine', 'doctrine', doctrine.doctrineId),
        toNodeId: missionNodeId(missionId),
        edgeType: 'supported_by',
        explanation: 'Accepted doctrine is supported by mission evidence.',
        evidence: sourceEvidence('doctrine', doctrine.doctrineId, doctrine.doctrineId, doctrine.summary),
        createdAt: doctrine.createdAt,
        sourceRule: 'accepted-doctrine-to-mission',
        strength: 'repeated',
      }));
    }
  }

  for (const consequence of input.consequences ?? []) {
    nodes.push(createSourceNode({
      nodeType: 'operational_consequence',
      sourceSubsystem: 'operational-consequence',
      sourceEntityId: consequence.consequenceId,
      missionId: consequence.missionId,
      title: consequence.title,
      summary: consequence.summary,
      createdAt: consequence.createdAt,
      tags: ['consequence', consequence.resolved ? 'resolved' : 'active'],
      description: 'Operational consequence evidence.',
    }));
  }

  for (const alert of input.guardianAlerts ?? []) {
    nodes.push(createSourceNode({
      nodeType: 'guardian_alert',
      sourceSubsystem: 'guardian',
      sourceEntityId: alert.alertId,
      missionId: alert.missionId,
      title: alert.title,
      summary: alert.summary,
      createdAt: alert.createdAt,
      tags: ['guardian', alert.ruleId].filter((tag): tag is string => Boolean(tag)),
      description: 'Guardian alert evidence.',
    }));
    if (alert.missionId) {
      edges.push(link({
        fromNodeId: nodeId('guardian_alert', 'guardian', alert.alertId, alert.missionId),
        toNodeId: missionNodeId(alert.missionId),
        edgeType: 'linked_to_mission',
        explanation: 'Guardian alert is linked to its source mission.',
        evidence: sourceEvidence('guardian', alert.alertId, alert.alertId, alert.summary),
        createdAt: alert.createdAt,
        sourceRule: 'guardian-alert-to-mission',
      }));
    }
    if (alert.consequenceId) {
      edges.push(link({
        fromNodeId: nodeId('guardian_alert', 'guardian', alert.alertId, alert.missionId),
        toNodeId: nodeId('operational_consequence', 'operational-consequence', alert.consequenceId, alert.missionId),
        edgeType: 'produced',
        explanation: 'Guardian alert produced or referenced an operational consequence.',
        evidence: sourceEvidence('guardian', alert.alertId, alert.alertId, alert.summary),
        createdAt: alert.createdAt,
        sourceRule: 'guardian-alert-to-consequence',
      }));
    }
  }

  for (const growth of input.academyGrowth ?? []) {
    nodes.push(createSourceNode({
      nodeType: 'academy_growth_event',
      sourceSubsystem: 'academy',
      sourceEntityId: growth.growthId,
      missionId: growth.missionId,
      title: growth.title,
      summary: growth.summary,
      createdAt: growth.createdAt,
      tags: ['academy', 'growth'],
      description: 'Academy growth event.',
    }));
    if (growth.missionId) {
      edges.push(link({
        fromNodeId: nodeId('academy_growth_event', 'academy', growth.growthId, growth.missionId),
        toNodeId: missionNodeId(growth.missionId),
        edgeType: 'supported_by',
        explanation: 'Academy growth event is supported by mission evidence.',
        evidence: sourceEvidence('academy', growth.growthId, growth.growthId, growth.summary),
        createdAt: growth.createdAt,
        sourceRule: 'academy-growth-to-mission',
      }));
    }
  }

  for (const relationship of input.relationshipEvidence ?? []) {
    nodes.push(createSourceNode({
      nodeType: 'behavior_pattern',
      sourceSubsystem: 'commander-relationship',
      sourceEntityId: relationship.relationshipId,
      title: relationship.title,
      summary: relationship.summary,
      createdAt: relationship.createdAt,
      tags: ['behavior', 'relationship'],
      description: 'Authoritative Commander Relationship evidence.',
    }));
    for (const missionId of relationship.missionIds) {
      edges.push(link({
        fromNodeId: nodeId('behavior_pattern', 'commander-relationship', relationship.relationshipId),
        toNodeId: missionNodeId(missionId),
        edgeType: 'repeated_in',
        explanation: 'Authoritative relationship evidence references this mission.',
        evidence: sourceEvidence('commander-relationship', relationship.relationshipId, relationship.relationshipId, relationship.summary),
        createdAt: relationship.createdAt,
        sourceRule: 'relationship-to-mission',
        strength: 'repeated',
      }));
    }
  }

  return createIntelligenceGraphSnapshot({
    graphId: input.previousSnapshot?.graphId,
    createdAt: input.createdAt,
    nodes,
    edges,
  });
}

function createSourceNode(input: {
  readonly nodeType: IntelligenceNodeInput['nodeType'];
  readonly sourceSubsystem: string;
  readonly sourceEntityId: string;
  readonly missionId?: string | undefined;
  readonly title: string;
  readonly summary: string;
  readonly createdAt: string;
  readonly tags: readonly string[];
  readonly description: string;
}): IntelligenceNodeInput {
  return {
    nodeId: nodeId(input.nodeType, input.sourceSubsystem, input.sourceEntityId, input.missionId),
    nodeType: input.nodeType,
    sourceEntityId: input.sourceEntityId,
    sourceSubsystem: input.sourceSubsystem,
    ...(input.missionId ? { missionId: input.missionId } : {}),
    title: input.title,
    summary: input.summary,
    createdAt: input.createdAt,
    evidenceReferences: [sourceEvidence(input.sourceSubsystem, input.sourceEntityId, input.sourceEntityId, input.description)],
    tags: input.tags,
  };
}

function link(input: {
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly edgeType: IntelligenceEdgeInput['edgeType'];
  readonly explanation: string;
  readonly evidence: IntelligenceEvidenceReference;
  readonly createdAt: string;
  readonly sourceRule: string;
  readonly strength?: IntelligenceEdgeInput['strength'] | undefined;
}): IntelligenceEdgeInput {
  return {
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    edgeType: input.edgeType,
    direction: 'directed',
    explanation: input.explanation,
    evidenceReferences: [input.evidence],
    strength: input.strength ?? 'supported',
    createdAt: input.createdAt,
    sourceRule: input.sourceRule,
    status: 'active',
  };
}

function missionNodeId(missionId: string): string {
  return nodeId('mission', 'mission', missionId, missionId);
}

function nodeId(
  nodeType: IntelligenceNodeInput['nodeType'],
  sourceSubsystem: string,
  sourceEntityId: string,
  missionId?: string | undefined,
): string {
  return stableIntelligenceId('node', [nodeType, sourceSubsystem, sourceEntityId, missionId ?? '']);
}

function sourceEvidence(
  sourceSubsystem: string,
  sourceEntityId: string,
  evidenceId: string,
  description: string,
): IntelligenceEvidenceReference {
  return {
    evidenceId,
    sourceSubsystem,
    sourceEntityId,
    description,
  };
}
