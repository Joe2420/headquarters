import type { HealthTrend } from './InstitutionalHealth';

export type BehaviorDimensionId =
  | 'mission-preparation'
  | 'observation-discipline'
  | 'authorization-discipline'
  | 'emotional-stability'
  | 'risk-discipline'
  | 'recovery-discipline'
  | 'reflection-quality'
  | 'learning-consistency'
  | 'process-trust';

export type BehaviorState = 'strong' | 'stable' | 'forming' | 'strained' | 'critical';
export type BehaviorTrend = HealthTrend;

export type BehaviorEvidenceSource =
  | 'mission-evaluation'
  | 'institutional-health'
  | 'operational-consequence'
  | 'mission-context'
  | 'journal'
  | 'guardian'
  | 'doctrine'
  | 'academy'
  | 'mission-lifecycle';

export interface BehaviorEvidence {
  readonly id: string;
  readonly source: BehaviorEvidenceSource | string;
  readonly missionId?: string | undefined;
  readonly description: string;
}

export interface BehaviorDimension {
  readonly id: BehaviorDimensionId;
  readonly title: string;
  readonly state: BehaviorState;
  readonly trend: BehaviorTrend;
  readonly explanation: string;
  readonly supportingEvidence: readonly BehaviorEvidence[];
  readonly relatedMissions: readonly string[];
  readonly lastUpdated: string;
}

export interface BehaviorObservation {
  readonly id: string;
  readonly dimensionId: BehaviorDimensionId;
  readonly message: string;
  readonly evidence: readonly BehaviorEvidence[];
}

export interface BehaviorPattern {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly dimensionId: BehaviorDimensionId;
  readonly evidence: readonly BehaviorEvidence[];
  readonly missionIds: readonly string[];
}

export interface BehaviorMilestone {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly achievedAt: string;
  readonly evidence: readonly BehaviorEvidence[];
}

export interface BehaviorProfile {
  readonly dimensions: readonly BehaviorDimension[];
  readonly strengths: readonly BehaviorDimension[];
  readonly needsAttention: readonly BehaviorDimension[];
  readonly patterns: readonly BehaviorPattern[];
  readonly milestones: readonly BehaviorMilestone[];
}

export interface CommanderRelationship {
  readonly operatorId: string;
  readonly trustState: BehaviorState;
  readonly coachingMode: 'foundational' | 'standard' | 'challenging' | 'trusted';
  readonly summary: string;
  readonly profile: BehaviorProfile;
}

export interface RelationshipSnapshot {
  readonly snapshotId: string;
  readonly operatorId: string;
  readonly evaluatedAt: string;
  readonly relationship: CommanderRelationship;
  readonly sourceEvidence: readonly BehaviorEvidence[];
  readonly version: 1;
}

export interface RelationshipHistory {
  readonly historyId: string;
  readonly snapshotId: string;
  readonly changedAt: string;
  readonly dimensionId: BehaviorDimensionId;
  readonly oldState?: BehaviorState | undefined;
  readonly newState: BehaviorState;
  readonly cause: string;
  readonly evidence: readonly BehaviorEvidence[];
}

export const behaviorDimensionTitles: Readonly<Record<BehaviorDimensionId, string>> = Object.freeze({
  'mission-preparation': 'Mission Preparation',
  'observation-discipline': 'Observation Discipline',
  'authorization-discipline': 'Authorization Discipline',
  'emotional-stability': 'Emotional Stability',
  'risk-discipline': 'Risk Discipline',
  'recovery-discipline': 'Recovery Discipline',
  'reflection-quality': 'Reflection Quality',
  'learning-consistency': 'Learning Consistency',
  'process-trust': 'Process Trust',
});

export function createBehaviorEvidence(input: BehaviorEvidence): BehaviorEvidence {
  if (!input.id.trim()) throw new Error('Behavior evidence requires a stable id.');
  if (!input.description.trim()) throw new Error(`Behavior evidence ${input.id} requires a description.`);
  return Object.freeze({ ...input });
}

export function createBehaviorDimension(input: {
  readonly id: BehaviorDimensionId;
  readonly state: BehaviorState;
  readonly trend: BehaviorTrend;
  readonly explanation: string;
  readonly supportingEvidence: readonly BehaviorEvidence[];
  readonly lastUpdated: string;
}): BehaviorDimension {
  if (input.supportingEvidence.length === 0) {
    throw new Error(`Behavior dimension ${input.id} requires supporting evidence.`);
  }

  return Object.freeze({
    id: input.id,
    title: behaviorDimensionTitles[input.id],
    state: input.state,
    trend: input.trend,
    explanation: input.explanation,
    supportingEvidence: Object.freeze(input.supportingEvidence.map(createBehaviorEvidence)),
    relatedMissions: Object.freeze(unique(input.supportingEvidence.map((item) => item.missionId).filter(hasText))),
    lastUpdated: input.lastUpdated,
  });
}

export function createRelationshipSnapshot(input: {
  readonly snapshotId: string;
  readonly operatorId: string;
  readonly evaluatedAt: string;
  readonly relationship: CommanderRelationship;
}): RelationshipSnapshot {
  if (!input.snapshotId.trim()) throw new Error('Relationship snapshot requires a stable snapshotId.');

  return Object.freeze({
    snapshotId: input.snapshotId,
    operatorId: input.operatorId,
    evaluatedAt: input.evaluatedAt,
    relationship: freezeRelationship(input.relationship),
    sourceEvidence: Object.freeze(input.relationship.profile.dimensions.flatMap((dimension) => dimension.supportingEvidence)),
    version: 1,
  });
}

export function compareBehaviorStates(left: BehaviorState, right: BehaviorState): number {
  return behaviorStateRank[left] - behaviorStateRank[right];
}

export function getWorstBehaviorState(states: readonly BehaviorState[]): BehaviorState {
  return states.reduce<BehaviorState>((worst, state) => (
    compareBehaviorStates(state, worst) > 0 ? state : worst
  ), 'strong');
}

const behaviorStateRank: Record<BehaviorState, number> = {
  strong: 0,
  stable: 1,
  forming: 2,
  strained: 3,
  critical: 4,
};

function freezeRelationship(relationship: CommanderRelationship): CommanderRelationship {
  return Object.freeze({
    ...relationship,
    profile: Object.freeze({
      dimensions: Object.freeze(relationship.profile.dimensions.map((dimension) => createBehaviorDimension(dimension))),
      strengths: Object.freeze(relationship.profile.strengths.map((dimension) => createBehaviorDimension(dimension))),
      needsAttention: Object.freeze(relationship.profile.needsAttention.map((dimension) => createBehaviorDimension(dimension))),
      patterns: Object.freeze(relationship.profile.patterns.map((pattern) => Object.freeze({
        ...pattern,
        evidence: Object.freeze(pattern.evidence.map(createBehaviorEvidence)),
        missionIds: Object.freeze([...pattern.missionIds]),
      }))),
      milestones: Object.freeze(relationship.profile.milestones.map((milestone) => Object.freeze({
        ...milestone,
        evidence: Object.freeze(milestone.evidence.map(createBehaviorEvidence)),
      }))),
    }),
  });
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function hasText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}
