import type { CrossMissionPattern } from './CrossMissionPatternEngine';
import type { HeadquartersIntelligenceInsight } from './HeadquartersIntelligenceInsightEngine';
import type { IntelligenceGraphSnapshot } from './HeadquartersIntelligenceGraph';

export type IntelligenceHistoryEventType =
  | 'graph_snapshot_saved'
  | 'pattern_created'
  | 'pattern_changed'
  | 'insight_created'
  | 'insight_reviewed'
  | 'insight_resolved'
  | 'insight_superseded';

export interface IntelligenceHistoryEntry {
  readonly historyId: string;
  readonly type: IntelligenceHistoryEventType;
  readonly subjectId: string;
  readonly occurredAt: string;
  readonly summary: string;
}

export interface IntelligenceHistoryState {
  readonly graphSnapshot?: IntelligenceGraphSnapshot | undefined;
  readonly patterns: readonly CrossMissionPattern[];
  readonly insights: readonly HeadquartersIntelligenceInsight[];
  readonly reviewedInsightIds: readonly string[];
  readonly history: readonly IntelligenceHistoryEntry[];
}

export interface IntelligenceHistoryRepository {
  saveGraphSnapshot(snapshot: IntelligenceGraphSnapshot): IntelligenceGraphSnapshot;
  savePatterns(patterns: readonly CrossMissionPattern[], occurredAt: string): readonly CrossMissionPattern[];
  saveInsights(insights: readonly HeadquartersIntelligenceInsight[], occurredAt: string): readonly HeadquartersIntelligenceInsight[];
  markInsightReviewed(insightId: string, reviewedAt: string): void;
  markInsightResolved(insightId: string, resolvedAt: string): void;
  getGraphSnapshot(): IntelligenceGraphSnapshot | undefined;
  getInsightById(insightId: string): HeadquartersIntelligenceInsight | undefined;
  listActiveInsights(): readonly HeadquartersIntelligenceInsight[];
  listInsightsByMission(missionId: string): readonly HeadquartersIntelligenceInsight[];
  listInsightsByPattern(patternId: string): readonly HeadquartersIntelligenceInsight[];
  listPatternsByStatus(status: CrossMissionPattern['status']): readonly CrossMissionPattern[];
  listIntelligenceHistory(): readonly IntelligenceHistoryEntry[];
  explainInsightEvolution(insightId: string): readonly IntelligenceHistoryEntry[];
  listReviewedInsights(): readonly HeadquartersIntelligenceInsight[];
  listUnresolvedCriticalInsights(): readonly HeadquartersIntelligenceInsight[];
  dumpState(): IntelligenceHistoryState;
}

export class InMemoryIntelligenceHistoryRepository implements IntelligenceHistoryRepository {
  private graphSnapshot: IntelligenceGraphSnapshot | undefined;
  private readonly patterns = new Map<string, CrossMissionPattern>();
  private readonly insights = new Map<string, HeadquartersIntelligenceInsight>();
  private readonly reviewedInsightIds = new Set<string>();
  private readonly history = new Map<string, IntelligenceHistoryEntry>();

  constructor(seed?: IntelligenceHistoryState | undefined) {
    this.graphSnapshot = seed?.graphSnapshot;
    for (const pattern of seed?.patterns ?? []) this.patterns.set(pattern.patternId, pattern);
    for (const insight of seed?.insights ?? []) this.insights.set(insight.insightId, insight);
    for (const insightId of seed?.reviewedInsightIds ?? []) this.reviewedInsightIds.add(insightId);
    for (const entry of seed?.history ?? []) this.history.set(entry.historyId, entry);
  }

  saveGraphSnapshot(snapshot: IntelligenceGraphSnapshot): IntelligenceGraphSnapshot {
    this.graphSnapshot = snapshot;
    this.recordHistory({
      historyId: `history:graph:${snapshot.graphId}`,
      type: 'graph_snapshot_saved',
      subjectId: snapshot.graphId,
      occurredAt: snapshot.createdAt,
      summary: 'Intelligence Graph snapshot saved.',
    });
    return snapshot;
  }

  savePatterns(patterns: readonly CrossMissionPattern[], occurredAt: string): readonly CrossMissionPattern[] {
    for (const pattern of patterns) {
      const existed = this.patterns.has(pattern.patternId);
      this.patterns.set(pattern.patternId, pattern);
      this.recordHistory({
        historyId: `history:pattern:${pattern.patternId}:${existed ? 'changed' : 'created'}`,
        type: existed ? 'pattern_changed' : 'pattern_created',
        subjectId: pattern.patternId,
        occurredAt,
        summary: existed ? 'Intelligence pattern changed.' : 'Intelligence pattern created.',
      });
    }
    return this.listAllPatterns();
  }

  saveInsights(insights: readonly HeadquartersIntelligenceInsight[], occurredAt: string): readonly HeadquartersIntelligenceInsight[] {
    for (const insight of insights) {
      const existed = this.insights.has(insight.insightId);
      this.insights.set(insight.insightId, insight);
      this.recordHistory({
        historyId: `history:insight:${insight.insightId}:${existed ? 'changed' : 'created'}`,
        type: existed ? 'insight_superseded' : 'insight_created',
        subjectId: insight.insightId,
        occurredAt,
        summary: existed ? 'Intelligence insight revised or superseded.' : 'Intelligence insight created.',
      });
    }
    return this.listAllInsights();
  }

  markInsightReviewed(insightId: string, reviewedAt: string): void {
    this.reviewedInsightIds.add(insightId);
    this.recordHistory({
      historyId: `history:insight:${insightId}:reviewed`,
      type: 'insight_reviewed',
      subjectId: insightId,
      occurredAt: reviewedAt,
      summary: 'Intelligence insight reviewed by operator.',
    });
  }

  markInsightResolved(insightId: string, resolvedAt: string): void {
    const insight = this.insights.get(insightId);
    if (insight) {
      this.insights.set(insightId, { ...insight, status: 'resolved' });
    }
    this.recordHistory({
      historyId: `history:insight:${insightId}:resolved`,
      type: 'insight_resolved',
      subjectId: insightId,
      occurredAt: resolvedAt,
      summary: 'Intelligence insight resolved.',
    });
  }

  getGraphSnapshot(): IntelligenceGraphSnapshot | undefined {
    return this.graphSnapshot;
  }

  getInsightById(insightId: string): HeadquartersIntelligenceInsight | undefined {
    return this.insights.get(insightId);
  }

  listActiveInsights(): readonly HeadquartersIntelligenceInsight[] {
    return Object.freeze(this.listAllInsights().filter((insight) => insight.status === 'active'));
  }

  listInsightsByMission(missionId: string): readonly HeadquartersIntelligenceInsight[] {
    return Object.freeze(this.listAllInsights().filter((insight) => (
      insight.supportingMissions.includes(missionId) || insight.contradictoryMissions.includes(missionId)
    )));
  }

  listInsightsByPattern(patternId: string): readonly HeadquartersIntelligenceInsight[] {
    return Object.freeze(this.listAllInsights().filter((insight) => insight.insightId.includes(patternId)));
  }

  listPatternsByStatus(status: CrossMissionPattern['status']): readonly CrossMissionPattern[] {
    return Object.freeze(this.listAllPatterns().filter((pattern) => pattern.status === status));
  }

  listIntelligenceHistory(): readonly IntelligenceHistoryEntry[] {
    return Object.freeze([...this.history.values()].sort(compareHistory));
  }

  explainInsightEvolution(insightId: string): readonly IntelligenceHistoryEntry[] {
    return Object.freeze(this.listIntelligenceHistory().filter((entry) => entry.subjectId === insightId));
  }

  listReviewedInsights(): readonly HeadquartersIntelligenceInsight[] {
    return Object.freeze(this.listAllInsights().filter((insight) => this.reviewedInsightIds.has(insight.insightId)));
  }

  listUnresolvedCriticalInsights(): readonly HeadquartersIntelligenceInsight[] {
    return Object.freeze(this.listAllInsights().filter((insight) => (
      insight.status === 'active' && insight.urgency === 'immediate'
    )));
  }

  dumpState(): IntelligenceHistoryState {
    return Object.freeze({
      ...(this.graphSnapshot ? { graphSnapshot: this.graphSnapshot } : {}),
      patterns: Object.freeze(this.listAllPatterns()),
      insights: Object.freeze(this.listAllInsights()),
      reviewedInsightIds: Object.freeze([...this.reviewedInsightIds].sort()),
      history: this.listIntelligenceHistory(),
    });
  }

  private recordHistory(entry: IntelligenceHistoryEntry): void {
    this.history.set(entry.historyId, Object.freeze({ ...entry }));
  }

  private listAllPatterns(): readonly CrossMissionPattern[] {
    return Object.freeze([...this.patterns.values()].sort((left, right) => left.patternId.localeCompare(right.patternId)));
  }

  private listAllInsights(): readonly HeadquartersIntelligenceInsight[] {
    return Object.freeze([...this.insights.values()].sort((left, right) => left.insightId.localeCompare(right.insightId)));
  }
}

function compareHistory(left: IntelligenceHistoryEntry, right: IntelligenceHistoryEntry): number {
  return left.occurredAt.localeCompare(right.occurredAt) || left.historyId.localeCompare(right.historyId);
}
