import {
  createIntelligenceEdge,
  createIntelligenceNode,
  type IntelligenceEdge,
  type IntelligenceEvidenceReference,
  type IntelligenceNode,
} from './HeadquartersIntelligenceGraph';
import type { GuardianRecoveryProtocol } from './GuardianRecoveryProtocol';
import type { GuardianInterventionRecord } from './GuardianInterventionService';
import type {
  GuardianCapitalAllocation,
  GuardianEvidence,
  GuardianJudgmentReserve,
  GuardianRuleEvaluation,
} from './GuardianProtection';

export interface GuardianHistoryEvent {
  readonly eventId: string;
  readonly missionId?: string;
  readonly type:
    | 'rule_evaluated'
    | 'intervention_started'
    | 'blocked_action'
    | 'acknowledgement'
    | 'recovery_started'
    | 'recovery_evidence'
    | 'restriction_resolved'
    | 'capital_allocation_changed'
    | 'judgment_reserve_changed'
    | 'success_protocol'
    | 'mission_evaluation_linked'
    | 'consequence_linked';
  readonly occurredAt: string;
  readonly title: string;
  readonly explanation: string;
  readonly evidenceReferences: readonly GuardianEvidence[];
  readonly relatedRuleIds: readonly string[];
  readonly relatedInterventionId?: string;
}

export interface GuardianMissionDossier {
  readonly missionId: string;
  readonly verdict: string;
  readonly activeRules: readonly GuardianRuleEvaluation[];
  readonly interventions: readonly GuardianInterventionRecord[];
  readonly blockedActions: readonly string[];
  readonly recoveryProtocols: readonly GuardianRecoveryProtocol[];
  readonly finalGuardianState: string;
}

export interface GuardianReplayEvent {
  readonly eventId: string;
  readonly occurredAt: string;
  readonly interventionId?: string;
  readonly commanderExplanation: string;
  readonly operatorAction: string;
  readonly recoveryResult: string;
  readonly returnToOperation: string;
}

export interface GuardianHistoryRepositoryState {
  readonly events: readonly GuardianHistoryEvent[];
  readonly interventions: readonly GuardianInterventionRecord[];
  readonly recoveryProtocols: readonly GuardianRecoveryProtocol[];
  readonly ruleEvaluations: readonly GuardianRuleEvaluation[];
  readonly capitalAllocations: readonly GuardianCapitalAllocation[];
  readonly judgmentReserveSnapshots: readonly GuardianJudgmentReserve[];
}

export interface GuardianHistoryRepository {
  recordEvent(event: GuardianHistoryEvent): Promise<GuardianHistoryEvent>;
  recordRuleEvaluation(evaluation: GuardianRuleEvaluation): Promise<GuardianRuleEvaluation>;
  recordIntervention(intervention: GuardianInterventionRecord): Promise<GuardianInterventionRecord>;
  recordRecoveryProtocol(protocol: GuardianRecoveryProtocol): Promise<GuardianRecoveryProtocol>;
  recordCapitalAllocation(allocation: GuardianCapitalAllocation): Promise<GuardianCapitalAllocation>;
  recordJudgmentReserve(reserve: GuardianJudgmentReserve): Promise<GuardianJudgmentReserve>;
  listGuardianHistoryByMission(missionId: string): Promise<readonly GuardianHistoryEvent[]>;
  listActiveInterventions(): Promise<readonly GuardianInterventionRecord[]>;
  listResolvedInterventions(): Promise<readonly GuardianInterventionRecord[]>;
  listRecurringRules(): Promise<readonly { readonly ruleId: string; readonly count: number }[]>;
  listSuccessfulRecoveries(): Promise<readonly GuardianRecoveryProtocol[]>;
  explainCurrentRestriction(missionId: string): Promise<string>;
  explainJudgmentReserveChange(): Promise<string>;
  listGuardianPatternsForIntelligenceGraph(): Promise<readonly { readonly patternId: string; readonly ruleId: string; readonly missionIds: readonly string[] }[]>;
  listGuardianEvidenceForCommanderRelationship(): Promise<readonly GuardianEvidence[]>;
  buildMissionDossier(missionId: string): Promise<GuardianMissionDossier>;
  buildReplayEvents(missionId: string): Promise<readonly GuardianReplayEvent[]>;
  buildIntelligenceGraphLinks(): Promise<{ readonly nodes: readonly IntelligenceNode[]; readonly edges: readonly IntelligenceEdge[] }>;
  dumpState(): GuardianHistoryRepositoryState;
}

export class InMemoryGuardianHistoryRepository implements GuardianHistoryRepository {
  private readonly events = new Map<string, GuardianHistoryEvent>();
  private readonly interventions = new Map<string, GuardianInterventionRecord>();
  private readonly recoveryProtocols = new Map<string, GuardianRecoveryProtocol>();
  private readonly ruleEvaluations = new Map<string, GuardianRuleEvaluation>();
  private readonly capitalAllocations = new Map<string, GuardianCapitalAllocation>();
  private readonly judgmentReserveSnapshots = new Map<string, GuardianJudgmentReserve>();

  constructor(state?: GuardianHistoryRepositoryState) {
    for (const event of state?.events ?? []) this.events.set(event.eventId, freezeEvent(event));
    for (const intervention of state?.interventions ?? []) this.interventions.set(intervention.interventionId, intervention);
    for (const protocol of state?.recoveryProtocols ?? []) this.recoveryProtocols.set(protocol.protocolId, protocol);
    for (const evaluation of state?.ruleEvaluations ?? []) this.ruleEvaluations.set(evaluation.evaluationId, evaluation);
    for (const allocation of state?.capitalAllocations ?? []) this.capitalAllocations.set(`${allocation.lastUpdated}:${allocation.riskUnit}`, allocation);
    for (const reserve of state?.judgmentReserveSnapshots ?? []) this.judgmentReserveSnapshots.set(reserve.lastUpdated, reserve);
  }

  async recordEvent(event: GuardianHistoryEvent): Promise<GuardianHistoryEvent> {
    const frozen = freezeEvent(event);
    this.events.set(frozen.eventId, frozen);
    return frozen;
  }

  async recordRuleEvaluation(evaluation: GuardianRuleEvaluation): Promise<GuardianRuleEvaluation> {
    this.ruleEvaluations.set(evaluation.evaluationId, evaluation);
    await this.recordEvent({
      eventId: `guardian-history:${evaluation.evaluationId}`,
      ...(evaluation.missionId ? { missionId: evaluation.missionId } : {}),
      type: 'rule_evaluated',
      occurredAt: evaluation.triggeredAt ?? evaluation.clearedAt ?? 'unknown',
      title: `Rule ${evaluation.ruleId} ${evaluation.result}`,
      explanation: evaluation.explanation,
      evidenceReferences: evaluation.evidenceReferences,
      relatedRuleIds: [evaluation.ruleId],
    });
    return evaluation;
  }

  async recordIntervention(intervention: GuardianInterventionRecord): Promise<GuardianInterventionRecord> {
    this.interventions.set(intervention.interventionId, intervention);
    await this.recordEvent({
      eventId: `guardian-history:${intervention.interventionId}`,
      ...(intervention.missionId ? { missionId: intervention.missionId } : {}),
      type: intervention.state === 'resolved' ? 'restriction_resolved' : 'intervention_started',
      occurredAt: intervention.resolvedAt ?? intervention.createdAt,
      title: intervention.title,
      explanation: intervention.explanation,
      evidenceReferences: intervention.evidenceReferences,
      relatedRuleIds: intervention.ruleIds,
      relatedInterventionId: intervention.interventionId,
    });
    return intervention;
  }

  async recordRecoveryProtocol(protocol: GuardianRecoveryProtocol): Promise<GuardianRecoveryProtocol> {
    this.recoveryProtocols.set(protocol.protocolId, protocol);
    const intervention = this.interventions.get(protocol.interventionId);
    await this.recordEvent({
      eventId: `guardian-history:${protocol.protocolId}:${protocol.status}`,
      ...(intervention?.missionId ? { missionId: intervention.missionId } : {}),
      type: protocol.status === 'complete' ? 'restriction_resolved' : 'recovery_started',
      occurredAt: protocol.completedAt ?? protocol.createdAt,
      title: `Recovery ${protocol.status}`,
      explanation: protocol.completionPolicy,
      evidenceReferences: protocol.evidenceReferences,
      relatedRuleIds: [],
      relatedInterventionId: protocol.interventionId,
    });
    return protocol;
  }

  async recordCapitalAllocation(allocation: GuardianCapitalAllocation): Promise<GuardianCapitalAllocation> {
    this.capitalAllocations.set(`${allocation.lastUpdated}:${allocation.riskUnit}`, allocation);
    return allocation;
  }

  async recordJudgmentReserve(reserve: GuardianJudgmentReserve): Promise<GuardianJudgmentReserve> {
    this.judgmentReserveSnapshots.set(reserve.lastUpdated, reserve);
    return reserve;
  }

  async listGuardianHistoryByMission(missionId: string): Promise<readonly GuardianHistoryEvent[]> {
    return this.sortedEvents().filter((event) => event.missionId === missionId);
  }

  async listActiveInterventions(): Promise<readonly GuardianInterventionRecord[]> {
    return [...this.interventions.values()].filter((item) => item.state !== 'resolved' && item.state !== 'expired' && item.state !== 'superseded');
  }

  async listResolvedInterventions(): Promise<readonly GuardianInterventionRecord[]> {
    return [...this.interventions.values()].filter((item) => item.state === 'resolved');
  }

  async listRecurringRules(): Promise<readonly { readonly ruleId: string; readonly count: number }[]> {
    const counts = new Map<string, number>();
    for (const evaluation of this.ruleEvaluations.values()) counts.set(evaluation.ruleId, (counts.get(evaluation.ruleId) ?? 0) + 1);
    return Object.freeze([...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([ruleId, count]) => Object.freeze({ ruleId, count }))
      .sort((left, right) => right.count - left.count || left.ruleId.localeCompare(right.ruleId)));
  }

  async listSuccessfulRecoveries(): Promise<readonly GuardianRecoveryProtocol[]> {
    return [...this.recoveryProtocols.values()].filter((protocol) => protocol.status === 'complete');
  }

  async explainCurrentRestriction(missionId: string): Promise<string> {
    const intervention = (await this.listActiveInterventions()).find((item) => item.missionId === missionId);
    return intervention?.explanation ?? 'No active Guardian restriction for this mission.';
  }

  async explainJudgmentReserveChange(): Promise<string> {
    const snapshots = [...this.judgmentReserveSnapshots.values()].sort((left, right) => left.lastUpdated.localeCompare(right.lastUpdated));
    const latest = snapshots.at(-1);
    const previous = snapshots.at(-2);
    if (!latest) return 'Judgment Reserve has no recorded history.';
    if (!previous) return `Judgment Reserve is ${latest.state}.`;
    return `Judgment Reserve moved from ${previous.state} to ${latest.state}.`;
  }

  async listGuardianPatternsForIntelligenceGraph(): Promise<readonly { readonly patternId: string; readonly ruleId: string; readonly missionIds: readonly string[] }[]> {
    const byRule = new Map<string, Set<string>>();
    for (const evaluation of this.ruleEvaluations.values()) {
      if (!evaluation.missionId) continue;
      const set = byRule.get(evaluation.ruleId) ?? new Set<string>();
      set.add(evaluation.missionId);
      byRule.set(evaluation.ruleId, set);
    }
    return Object.freeze([...byRule.entries()]
      .filter(([, missions]) => missions.size > 1)
      .map(([ruleId, missions]) => Object.freeze({
        patternId: `guardian-pattern:${ruleId}`,
        ruleId,
        missionIds: Object.freeze([...missions].sort()),
      })));
  }

  async listGuardianEvidenceForCommanderRelationship(): Promise<readonly GuardianEvidence[]> {
    return Object.freeze(this.sortedEvents().flatMap((event) => event.evidenceReferences));
  }

  async buildMissionDossier(missionId: string): Promise<GuardianMissionDossier> {
    const activeRules = [...this.ruleEvaluations.values()].filter((evaluation) => evaluation.missionId === missionId);
    const interventions = [...this.interventions.values()].filter((intervention) => intervention.missionId === missionId);
    return Object.freeze({
      missionId,
      verdict: interventions.some((item) => item.state !== 'resolved') ? 'Guardian intervention active' : 'Guardian secure',
      activeRules: Object.freeze(activeRules),
      interventions: Object.freeze(interventions),
      blockedActions: Object.freeze([...new Set(interventions.flatMap((intervention) => intervention.blockedActions))]),
      recoveryProtocols: Object.freeze([...this.recoveryProtocols.values()].filter((protocol) => interventions.some((intervention) => intervention.interventionId === protocol.interventionId))),
      finalGuardianState: interventions.at(-1)?.state ?? 'secure',
    });
  }

  async buildReplayEvents(missionId: string): Promise<readonly GuardianReplayEvent[]> {
    return Object.freeze((await this.listGuardianHistoryByMission(missionId)).map((event) => Object.freeze({
      eventId: `guardian-replay:${event.eventId}`,
      occurredAt: event.occurredAt,
      ...(event.relatedInterventionId ? { interventionId: event.relatedInterventionId } : {}),
      commanderExplanation: event.explanation,
      operatorAction: event.type === 'acknowledgement' ? 'Acknowledged Guardian condition.' : 'Reviewed Guardian event.',
      recoveryResult: event.type === 'restriction_resolved' ? 'Recovery complete.' : 'Recovery pending or not required.',
      returnToOperation: 'Return context preserved by Commander.',
    })));
  }

  async buildIntelligenceGraphLinks(): Promise<{ readonly nodes: readonly IntelligenceNode[]; readonly edges: readonly IntelligenceEdge[] }> {
    const nodes: IntelligenceNode[] = [];
    const edges: IntelligenceEdge[] = [];
    for (const event of this.sortedEvents()) {
      const evidenceReferences = event.evidenceReferences.map(toIntelligenceEvidenceReference);
      nodes.push(createIntelligenceNode({
        nodeId: `guardian:${event.eventId}`,
        nodeType: 'guardian_alert',
        sourceEntityId: event.eventId,
        sourceSubsystem: 'guardian',
        ...(event.missionId ? { missionId: event.missionId } : {}),
        title: event.title,
        summary: event.explanation,
        createdAt: event.occurredAt,
        evidenceReferences,
        tags: ['guardian', event.type, ...event.relatedRuleIds],
      }));
      if (event.missionId) {
        edges.push(createIntelligenceEdge({
          edgeId: `guardian-edge:${event.eventId}:${event.missionId}`,
          fromNodeId: `guardian:${event.eventId}`,
          toNodeId: `mission:${event.missionId}`,
          edgeType: 'linked_to_mission',
          direction: 'directed',
          explanation: event.explanation,
          evidenceReferences,
          strength: event.relatedRuleIds.length > 0 ? 'supported' : 'weak',
          createdAt: event.occurredAt,
          sourceRule: 'guardian-protection-history',
          status: event.type === 'restriction_resolved' ? 'resolved' : 'active',
        }));
      }
    }
    return { nodes: Object.freeze(nodes), edges: Object.freeze(edges) };
  }

  dumpState(): GuardianHistoryRepositoryState {
    return Object.freeze({
      events: Object.freeze([...this.events.values()]),
      interventions: Object.freeze([...this.interventions.values()]),
      recoveryProtocols: Object.freeze([...this.recoveryProtocols.values()]),
      ruleEvaluations: Object.freeze([...this.ruleEvaluations.values()]),
      capitalAllocations: Object.freeze([...this.capitalAllocations.values()]),
      judgmentReserveSnapshots: Object.freeze([...this.judgmentReserveSnapshots.values()]),
    });
  }

  private sortedEvents(): readonly GuardianHistoryEvent[] {
    return Object.freeze([...this.events.values()].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.eventId.localeCompare(right.eventId)));
  }
}

function freezeEvent(event: GuardianHistoryEvent): GuardianHistoryEvent {
  return Object.freeze({
    ...event,
    evidenceReferences: Object.freeze(event.evidenceReferences.map((item) => Object.freeze({ ...item }))),
    relatedRuleIds: Object.freeze([...event.relatedRuleIds]),
  });
}

function toIntelligenceEvidenceReference(evidence: GuardianEvidence): IntelligenceEvidenceReference {
  return Object.freeze({
    evidenceId: evidence.evidenceId,
    sourceSubsystem: evidence.source,
    sourceEntityId: evidence.evidenceId,
    description: evidence.description,
    ...(evidence.createdAt ? { occurredAt: evidence.createdAt } : {}),
  });
}
