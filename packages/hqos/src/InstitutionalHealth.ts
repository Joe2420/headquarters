export type HealthDimensionId =
  | 'operational-readiness'
  | 'mission-integrity'
  | 'intelligence-completeness'
  | 'evidence-quality'
  | 'guardian-stability'
  | 'doctrine-coverage'
  | 'academy-development'
  | 'archive-integrity';

export type InstitutionalHealthState = 'excellent' | 'healthy' | 'forming' | 'degraded' | 'critical';
export type HealthTrend = 'improving' | 'stable' | 'declining';

export type HealthContributingSystem =
  | 'mission'
  | 'guardian'
  | 'doctrine'
  | 'academy'
  | 'archive'
  | 'intelligence'
  | 'commander'
  | 'priority'
  | 'journal'
  | 'startup'
  | 'persistence';

export interface HealthEvidence {
  readonly id: string;
  readonly system: HealthContributingSystem | string;
  readonly description: string;
}

export interface HealthExplanation {
  readonly why: string;
  readonly supportingEvidence: readonly string[];
  readonly blockingFactors: readonly string[];
  readonly improvingFactors: readonly string[];
}

export interface HealthDimension {
  readonly id: HealthDimensionId;
  readonly title: string;
  readonly state: InstitutionalHealthState;
  readonly trend: HealthTrend;
  readonly explanation: HealthExplanation;
  readonly supportingEvidence: readonly HealthEvidence[];
  readonly contributingSystems: readonly HealthContributingSystem[];
  readonly lastUpdated: string;
}

export interface InstitutionalHealthSnapshot {
  readonly snapshotId: string;
  readonly version: 1;
  readonly evaluatedAt: string;
  readonly overallState: InstitutionalHealthState;
  readonly summary: string;
  readonly dimensions: readonly HealthDimension[];
  readonly sourceEvidence: readonly HealthEvidence[];
  readonly highestConcern?: HealthDimension | undefined;
}

const stateRank: Record<InstitutionalHealthState, number> = {
  excellent: 0,
  healthy: 1,
  forming: 2,
  degraded: 3,
  critical: 4,
};

export const healthDimensionTitles: Readonly<Record<HealthDimensionId, string>> = Object.freeze({
  'operational-readiness': 'Operational Readiness',
  'mission-integrity': 'Mission Integrity',
  'intelligence-completeness': 'Intelligence Completeness',
  'evidence-quality': 'Evidence Quality',
  'guardian-stability': 'Guardian Stability',
  'doctrine-coverage': 'Doctrine Coverage',
  'academy-development': 'Academy Development',
  'archive-integrity': 'Archive Integrity',
});

export function createHealthEvidence(input: HealthEvidence): HealthEvidence {
  if (!input.id.trim()) throw new Error('Health evidence requires a stable id.');
  if (!input.description.trim()) throw new Error(`Health evidence ${input.id} requires a description.`);

  return Object.freeze({ ...input });
}

export function createHealthDimension(input: {
  readonly id: HealthDimensionId;
  readonly state: InstitutionalHealthState;
  readonly trend: HealthTrend;
  readonly explanation: HealthExplanation;
  readonly supportingEvidence: readonly HealthEvidence[];
  readonly contributingSystems: readonly HealthContributingSystem[];
  readonly lastUpdated: string;
}): HealthDimension {
  if (input.supportingEvidence.length === 0) {
    throw new Error(`Health dimension ${input.id} requires supporting evidence.`);
  }
  if (!input.explanation.why.trim()) {
    throw new Error(`Health dimension ${input.id} requires an explanation.`);
  }

  return Object.freeze({
    id: input.id,
    title: healthDimensionTitles[input.id],
    state: input.state,
    trend: input.trend,
    explanation: freezeExplanation(input.explanation),
    supportingEvidence: Object.freeze(input.supportingEvidence.map(createHealthEvidence)),
    contributingSystems: Object.freeze([...input.contributingSystems]),
    lastUpdated: input.lastUpdated,
  });
}

export function createInstitutionalHealthSnapshot(input: {
  readonly snapshotId: string;
  readonly evaluatedAt: string;
  readonly dimensions: readonly HealthDimension[];
}): InstitutionalHealthSnapshot {
  if (!input.snapshotId.trim()) throw new Error('Institutional health snapshot requires a stable snapshotId.');
  if (input.dimensions.length === 0) throw new Error('Institutional health snapshot requires dimensions.');

  const overallState = getWorstInstitutionalHealthState(input.dimensions.map((dimension) => dimension.state));
  const highestConcern = getHighestConcern(input.dimensions);

  return Object.freeze({
    snapshotId: input.snapshotId,
    version: 1,
    evaluatedAt: input.evaluatedAt,
    overallState,
    summary: getInstitutionalHealthSummary(overallState),
    dimensions: Object.freeze(input.dimensions.map(cloneDimension)),
    sourceEvidence: Object.freeze(input.dimensions.flatMap((dimension) => dimension.supportingEvidence).map(createHealthEvidence)),
    ...(highestConcern ? { highestConcern } : {}),
  });
}

export function getWorstInstitutionalHealthState(
  states: readonly InstitutionalHealthState[],
): InstitutionalHealthState {
  return states.reduce<InstitutionalHealthState>((worst, state) => (
    stateRank[state] > stateRank[worst] ? state : worst
  ), 'excellent');
}

export function compareInstitutionalHealthStates(
  left: InstitutionalHealthState,
  right: InstitutionalHealthState,
): number {
  return stateRank[left] - stateRank[right];
}

export function isHealthStateWorseThan(
  left: InstitutionalHealthState,
  right: InstitutionalHealthState,
): boolean {
  return compareInstitutionalHealthStates(left, right) > 0;
}

export function getInstitutionalHealthSummary(state: InstitutionalHealthState): string {
  if (state === 'critical') return 'Headquarters condition is critical. Recovery or restriction review is required before normal progression.';
  if (state === 'degraded') return 'Headquarters can operate, but process integrity requires attention.';
  if (state === 'forming') return 'Headquarters is assembling enough evidence to judge institutional condition.';
  if (state === 'healthy') return 'Headquarters condition is healthy for the current operation.';
  return 'Headquarters condition is excellent. Evidence, discipline, and institutional memory are aligned.';
}

export function getHealthDimension(
  snapshot: InstitutionalHealthSnapshot,
  id: HealthDimensionId,
): HealthDimension | undefined {
  return snapshot.dimensions.find((dimension) => dimension.id === id);
}

function getHighestConcern(dimensions: readonly HealthDimension[]): HealthDimension | undefined {
  return [...dimensions].sort((left, right) => (
    compareInstitutionalHealthStates(right.state, left.state)
      || left.id.localeCompare(right.id)
  ))[0];
}

function cloneDimension(dimension: HealthDimension): HealthDimension {
  return createHealthDimension({
    id: dimension.id,
    state: dimension.state,
    trend: dimension.trend,
    explanation: dimension.explanation,
    supportingEvidence: dimension.supportingEvidence,
    contributingSystems: dimension.contributingSystems,
    lastUpdated: dimension.lastUpdated,
  });
}

function freezeExplanation(explanation: HealthExplanation): HealthExplanation {
  return Object.freeze({
    why: explanation.why,
    supportingEvidence: Object.freeze([...explanation.supportingEvidence]),
    blockingFactors: Object.freeze([...explanation.blockingFactors]),
    improvingFactors: Object.freeze([...explanation.improvingFactors]),
  });
}
