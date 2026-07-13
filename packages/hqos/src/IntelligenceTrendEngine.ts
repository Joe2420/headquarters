import type { IntelligenceEvidenceReference } from './HeadquartersIntelligenceGraph';
import { stableIntelligenceId } from './HeadquartersIntelligenceGraph';

export type IntelligenceTrendType =
  | 'improving'
  | 'stable'
  | 'declining'
  | 'inconsistent'
  | 'insufficient_history'
  | 'recovered'
  | 'newly_emerging';

export interface IntelligenceTrendObservation {
  readonly observationId: string;
  readonly missionId: string;
  readonly subject: string;
  readonly occurredAt: string;
  readonly direction: 'positive' | 'negative' | 'neutral' | 'recovered';
  readonly summary: string;
  readonly sourceSubsystem: string;
  readonly excludesTrend?: boolean | undefined;
}

export interface IntelligenceTrendWindow {
  readonly recent: number;
  readonly comparison: number;
}

export interface IntelligenceTrendAnalysis {
  readonly trendId: string;
  readonly subject: string;
  readonly trend: IntelligenceTrendType;
  readonly explanation: string;
  readonly sampleSize: number;
  readonly recentWindowSize: number;
  readonly comparisonWindowSize: number;
  readonly supportingObservations: readonly IntelligenceEvidenceReference[];
  readonly contradictoryObservations: readonly IntelligenceEvidenceReference[];
}

export interface IntelligenceTrendEngineInput {
  readonly observations: readonly IntelligenceTrendObservation[];
  readonly windows?: IntelligenceTrendWindow | undefined;
}

const defaultWindows: IntelligenceTrendWindow = {
  recent: 5,
  comparison: 5,
};

export function analyzeIntelligenceTrends(input: IntelligenceTrendEngineInput): readonly IntelligenceTrendAnalysis[] {
  const windows = input.windows ?? defaultWindows;
  const eligible = dedupeObservations(input.observations.filter((observation) => !observation.excludesTrend))
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
  const bySubject = new Map<string, IntelligenceTrendObservation[]>();
  for (const observation of eligible) {
    const list = bySubject.get(observation.subject) ?? [];
    list.push(observation);
    bySubject.set(observation.subject, list);
  }

  return Object.freeze([...bySubject.entries()].map(([subject, observations]) => {
    const ordered = [...observations].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
    const recent = ordered.slice(-windows.recent);
    const previous = ordered.slice(Math.max(0, ordered.length - windows.recent - windows.comparison), Math.max(0, ordered.length - windows.recent));
    const trend = classifyTrend(recent, previous);
    const supporting = getSupportingObservations(trend, recent, previous);
    const contradictory = getContradictoryObservations(trend, recent, previous);

    return Object.freeze({
      trendId: stableIntelligenceId('trend', [subject, trend, ...ordered.map((observation) => observation.observationId)]),
      subject,
      trend,
      explanation: explainTrend(subject, trend, recent, previous),
      sampleSize: ordered.length,
      recentWindowSize: recent.length,
      comparisonWindowSize: previous.length,
      supportingObservations: Object.freeze(supporting.map(toEvidenceReference)),
      contradictoryObservations: Object.freeze(contradictory.map(toEvidenceReference)),
    });
  }).sort((left, right) => left.trendId.localeCompare(right.trendId)));
}

function classifyTrend(
  recent: readonly IntelligenceTrendObservation[],
  previous: readonly IntelligenceTrendObservation[],
): IntelligenceTrendType {
  if (recent.length < 2) return recent.length === 1 ? 'newly_emerging' : 'insufficient_history';
  if (recent.every((observation) => observation.direction === 'recovered')) return 'recovered';
  if (previous.length < 2) return 'newly_emerging';

  const recentScore = score(recent);
  const previousScore = score(previous);
  const hasMixedRecent = new Set(recent.map((observation) => observation.direction)).size > 1;
  if (hasMixedRecent && Math.abs(recentScore - previousScore) <= 1) return 'inconsistent';
  if (recentScore > previousScore) return 'improving';
  if (recentScore < previousScore) return 'declining';
  return 'stable';
}

function score(observations: readonly IntelligenceTrendObservation[]): number {
  return observations.reduce((total, observation) => {
    if (observation.direction === 'positive' || observation.direction === 'recovered') return total + 1;
    if (observation.direction === 'negative') return total - 1;
    return total;
  }, 0);
}

function getSupportingObservations(
  trend: IntelligenceTrendType,
  recent: readonly IntelligenceTrendObservation[],
  previous: readonly IntelligenceTrendObservation[],
): readonly IntelligenceTrendObservation[] {
  if (trend === 'improving' || trend === 'recovered') {
    return recent.filter((observation) => observation.direction === 'positive' || observation.direction === 'recovered');
  }
  if (trend === 'declining') return recent.filter((observation) => observation.direction === 'negative');
  return [...previous, ...recent];
}

function getContradictoryObservations(
  trend: IntelligenceTrendType,
  recent: readonly IntelligenceTrendObservation[],
  previous: readonly IntelligenceTrendObservation[],
): readonly IntelligenceTrendObservation[] {
  if (trend === 'improving') return recent.filter((observation) => observation.direction === 'negative');
  if (trend === 'declining') return recent.filter((observation) => observation.direction === 'positive' || observation.direction === 'recovered');
  if (trend === 'stable') return [...previous, ...recent].filter((observation) => observation.direction === 'negative');
  return [];
}

function dedupeObservations(
  observations: readonly IntelligenceTrendObservation[],
): IntelligenceTrendObservation[] {
  return [...new Map(observations.map((observation) => [
    `${observation.missionId}:${observation.observationId}`,
    observation,
  ])).values()];
}

function explainTrend(
  subject: string,
  trend: IntelligenceTrendType,
  recent: readonly IntelligenceTrendObservation[],
  previous: readonly IntelligenceTrendObservation[],
): string {
  if (trend === 'insufficient_history') return `${subject} has insufficient history for a trend.`;
  if (trend === 'newly_emerging') return `${subject} is newly emerging with ${recent.length} recent observation${recent.length === 1 ? '' : 's'}.`;
  return `${subject} is ${trend}; ${recent.length} recent observations were compared with ${previous.length} prior observations.`;
}

function toEvidenceReference(observation: IntelligenceTrendObservation): IntelligenceEvidenceReference {
  return Object.freeze({
    evidenceId: observation.observationId,
    sourceSubsystem: observation.sourceSubsystem,
    sourceEntityId: observation.observationId,
    description: observation.summary,
    occurredAt: observation.occurredAt,
  });
}
