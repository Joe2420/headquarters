export type IntelligenceNodeType =
  | 'mission'
  | 'mission_evaluation'
  | 'mission_replay'
  | 'observation'
  | 'authorization'
  | 'deployment_checkin'
  | 'debrief'
  | 'journal_entry'
  | 'doctrine_candidate'
  | 'accepted_doctrine'
  | 'guardian_alert'
  | 'operational_consequence'
  | 'recovery'
  | 'academy_growth_event'
  | 'behavior_pattern'
  | 'commitment'
  | 'institutional_health_change'
  | 'market_context'
  | 'risk_rule'
  | 'operator_lesson';

export type IntelligenceEdgeType =
  | 'originated_from'
  | 'supported_by'
  | 'contradicted_by'
  | 'repeated_in'
  | 'similar_to'
  | 'revised_by'
  | 'resolved_by'
  | 'produced'
  | 'referenced'
  | 'protected_by'
  | 'violated'
  | 'improved_after'
  | 'regressed_after'
  | 'linked_to_mission'
  | 'linked_to_journal'
  | 'linked_to_doctrine'
  | 'linked_to_guardian'
  | 'compared_with';

export type IntelligenceEdgeDirection = 'directed' | 'bidirectional';
export type IntelligenceEdgeStrength = 'weak' | 'supported' | 'repeated' | 'strong';
export type IntelligenceEdgeStatus = 'active' | 'historical' | 'superseded' | 'resolved';
export type IntelligencePatternStatus = 'active' | 'background' | 'resolved' | 'historical';
export type IntelligenceTrendDirection =
  | 'improving'
  | 'stable'
  | 'declining'
  | 'inconsistent'
  | 'insufficient_history'
  | 'recovered'
  | 'newly_emerging';

export interface IntelligenceEvidenceReference {
  readonly evidenceId: string;
  readonly sourceSubsystem: string;
  readonly sourceEntityId: string;
  readonly description: string;
  readonly occurredAt?: string | undefined;
}

export interface IntelligenceSourceMetadata {
  readonly sourceEntityId: string;
  readonly sourceSubsystem: string;
  readonly sourceVersion?: string | undefined;
  readonly sourceCreatedAt?: string | undefined;
}

export interface IntelligenceNode {
  readonly nodeId: string;
  readonly nodeType: IntelligenceNodeType;
  readonly sourceEntityId: string;
  readonly sourceSubsystem: string;
  readonly missionId?: string | undefined;
  readonly title: string;
  readonly summary: string;
  readonly createdAt: string;
  readonly evidenceReferences: readonly IntelligenceEvidenceReference[];
  readonly tags: readonly string[];
  readonly sourceMetadata: IntelligenceSourceMetadata;
}

export interface IntelligenceEdge {
  readonly edgeId: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly edgeType: IntelligenceEdgeType;
  readonly direction: IntelligenceEdgeDirection;
  readonly explanation: string;
  readonly evidenceReferences: readonly IntelligenceEvidenceReference[];
  readonly strength: IntelligenceEdgeStrength;
  readonly createdAt: string;
  readonly sourceRule: string;
  readonly status: IntelligenceEdgeStatus;
}

export interface IntelligenceContradiction {
  readonly contradictionId: string;
  readonly summary: string;
  readonly evidenceReferences: readonly IntelligenceEvidenceReference[];
}

export interface IntelligencePattern {
  readonly patternId: string;
  readonly title: string;
  readonly explanation: string;
  readonly evidenceNodeIds: readonly string[];
  readonly contradictoryEvidence: readonly IntelligenceEvidenceReference[];
  readonly status: IntelligencePatternStatus;
  readonly strength: IntelligenceEdgeStrength;
}

export interface IntelligenceInsight {
  readonly insightId: string;
  readonly title: string;
  readonly summary: string;
  readonly evidenceReferences: readonly IntelligenceEvidenceReference[];
  readonly contradictions: readonly IntelligenceContradiction[];
  readonly strength: IntelligenceEdgeStrength;
}

export interface IntelligenceCluster {
  readonly clusterId: string;
  readonly title: string;
  readonly nodeIds: readonly string[];
  readonly edgeIds: readonly string[];
}

export interface IntelligenceTrend {
  readonly trendId: string;
  readonly title: string;
  readonly direction: IntelligenceTrendDirection;
  readonly sampleSize: number;
  readonly evidenceReferences: readonly IntelligenceEvidenceReference[];
}

export interface IntelligenceQuery {
  readonly nodeTypes?: readonly IntelligenceNodeType[] | undefined;
  readonly missionId?: string | undefined;
  readonly tags?: readonly string[] | undefined;
  readonly text?: string | undefined;
}

export interface IntelligenceQueryResult {
  readonly nodes: readonly IntelligenceNode[];
  readonly edges: readonly IntelligenceEdge[];
}

export interface IntelligenceGraphSnapshot {
  readonly graphId: string;
  readonly createdAt: string;
  readonly nodes: readonly IntelligenceNode[];
  readonly edges: readonly IntelligenceEdge[];
}

export interface HeadquartersIntelligenceGraph {
  readonly graphId: string;
  readonly createdAt: string;
  readonly nodes: readonly IntelligenceNode[];
  readonly edges: readonly IntelligenceEdge[];
  readonly query: (query: IntelligenceQuery) => IntelligenceQueryResult;
}

export type IntelligenceNodeInput = Omit<IntelligenceNode, 'nodeId' | 'sourceMetadata'> & {
  readonly nodeId?: string | undefined;
  readonly sourceMetadata?: IntelligenceSourceMetadata | undefined;
};

export type IntelligenceEdgeInput = Omit<IntelligenceEdge, 'edgeId'> & {
  readonly edgeId?: string | undefined;
};

const allowedStrengths: readonly IntelligenceEdgeStrength[] = ['weak', 'supported', 'repeated', 'strong'];

export function createIntelligenceEvidenceReference(
  input: IntelligenceEvidenceReference,
): IntelligenceEvidenceReference {
  assertText(input.evidenceId, 'Intelligence evidence requires an evidenceId.');
  assertText(input.sourceSubsystem, `Evidence ${input.evidenceId} requires a source subsystem.`);
  assertText(input.sourceEntityId, `Evidence ${input.evidenceId} requires a source entity id.`);
  assertText(input.description, `Evidence ${input.evidenceId} requires a description.`);
  return Object.freeze({ ...input });
}

export function createIntelligenceNode(input: IntelligenceNodeInput): IntelligenceNode {
  assertText(input.sourceEntityId, 'Intelligence node requires a source entity id.');
  assertText(input.sourceSubsystem, `Node for ${input.sourceEntityId} requires a source subsystem.`);
  assertText(input.title, `Node for ${input.sourceEntityId} requires a title.`);
  assertText(input.summary, `Node for ${input.sourceEntityId} requires a summary.`);
  if (input.evidenceReferences.length === 0) {
    throw new Error(`Intelligence node ${input.sourceEntityId} requires evidence references.`);
  }

  const nodeId = input.nodeId ?? stableIntelligenceId('node', [
    input.nodeType,
    input.sourceSubsystem,
    input.sourceEntityId,
    input.missionId ?? '',
  ]);

  return Object.freeze({
    ...input,
    nodeId,
    evidenceReferences: Object.freeze(input.evidenceReferences.map(createIntelligenceEvidenceReference)),
    tags: Object.freeze([...input.tags].sort()),
    sourceMetadata: Object.freeze(input.sourceMetadata ?? {
      sourceEntityId: input.sourceEntityId,
      sourceSubsystem: input.sourceSubsystem,
      sourceCreatedAt: input.createdAt,
    }),
  });
}

export function createIntelligenceEdge(input: IntelligenceEdgeInput): IntelligenceEdge {
  assertText(input.fromNodeId, 'Intelligence edge requires a fromNodeId.');
  assertText(input.toNodeId, 'Intelligence edge requires a toNodeId.');
  assertText(input.explanation, `Edge ${input.fromNodeId}->${input.toNodeId} requires an explanation.`);
  assertText(input.sourceRule, `Edge ${input.fromNodeId}->${input.toNodeId} requires a source rule.`);
  if (!allowedStrengths.includes(input.strength)) {
    throw new Error(`Unsupported intelligence edge strength: ${input.strength}`);
  }
  if (input.evidenceReferences.length === 0) {
    throw new Error(`Intelligence edge ${input.fromNodeId}->${input.toNodeId} requires evidence references.`);
  }

  const edgeId = input.edgeId ?? stableIntelligenceId('edge', [
    input.fromNodeId,
    input.toNodeId,
    input.edgeType,
    input.direction,
    input.sourceRule,
  ]);

  return Object.freeze({
    ...input,
    edgeId,
    evidenceReferences: Object.freeze(input.evidenceReferences.map(createIntelligenceEvidenceReference)),
  });
}

export function createIntelligenceGraphSnapshot(input: {
  readonly graphId?: string | undefined;
  readonly createdAt: string;
  readonly nodes: readonly IntelligenceNodeInput[];
  readonly edges: readonly IntelligenceEdgeInput[];
}): IntelligenceGraphSnapshot {
  const nodesById = new Map<string, IntelligenceNode>();
  for (const node of input.nodes.map(createIntelligenceNode)) {
    nodesById.set(node.nodeId, node);
  }

  const edgesById = new Map<string, IntelligenceEdge>();
  for (const edge of input.edges.map(createIntelligenceEdge)) {
    edgesById.set(edge.edgeId, edge);
  }

  const nodes = Object.freeze([...nodesById.values()].sort((left, right) => left.nodeId.localeCompare(right.nodeId)));
  const edges = Object.freeze([...edgesById.values()].sort((left, right) => left.edgeId.localeCompare(right.edgeId)));

  return Object.freeze({
    graphId: input.graphId ?? stableIntelligenceId('graph', nodes.map((node) => node.nodeId)),
    createdAt: input.createdAt,
    nodes,
    edges,
  });
}

export function createHeadquartersIntelligenceGraph(snapshot: IntelligenceGraphSnapshot): HeadquartersIntelligenceGraph {
  const nodes = Object.freeze(snapshot.nodes.map((node) => createIntelligenceNode(node)));
  const edges = Object.freeze(snapshot.edges.map((edge) => createIntelligenceEdge(edge)));

  return Object.freeze({
    graphId: snapshot.graphId,
    createdAt: snapshot.createdAt,
    nodes,
    edges,
    query: (query: IntelligenceQuery) => queryIntelligenceGraph({ nodes, edges }, query),
  });
}

export function queryIntelligenceGraph(
  graph: Pick<HeadquartersIntelligenceGraph, 'nodes' | 'edges'>,
  query: IntelligenceQuery,
): IntelligenceQueryResult {
  const queryText = query.text?.trim().toLocaleLowerCase();
  const tags = new Set(query.tags ?? []);
  const nodeTypes = new Set(query.nodeTypes ?? []);
  const nodes = graph.nodes.filter((node) => {
    if (query.missionId && node.missionId !== query.missionId) return false;
    if (nodeTypes.size > 0 && !nodeTypes.has(node.nodeType)) return false;
    if (tags.size > 0 && !node.tags.some((tag) => tags.has(tag))) return false;
    if (queryText && !`${node.title} ${node.summary}`.toLocaleLowerCase().includes(queryText)) return false;
    return true;
  });
  const nodeIds = new Set(nodes.map((node) => node.nodeId));
  const edges = graph.edges.filter((edge) => nodeIds.has(edge.fromNodeId) || nodeIds.has(edge.toNodeId));
  return Object.freeze({
    nodes: Object.freeze(nodes.map((node) => createIntelligenceNode(node))),
    edges: Object.freeze(edges.map((edge) => createIntelligenceEdge(edge))),
  });
}

export function stableIntelligenceId(prefix: string, parts: readonly string[]): string {
  const safe = parts
    .map((part) => part.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    .filter(Boolean)
    .join(':');
  return `${prefix}:${safe}`;
}

function assertText(value: string, message: string): void {
  if (!value.trim()) throw new Error(message);
}
