import type {
  BehaviorDimensionId,
  BehaviorEvidence,
  BehaviorPattern,
} from './CommanderRelationship';

export function detectCommanderRelationshipPatterns(input: {
  readonly evidence: readonly BehaviorEvidence[];
}): readonly BehaviorPattern[] {
  return Object.freeze([
    repeatedPattern({
      id: 'pattern:impulsive-authorization',
      title: 'Repeated impulsive authorization',
      description: 'Authorization weakness appears across multiple missions.',
      dimensionId: 'authorization-discipline',
      evidence: input.evidence.filter((item) => /premature|authorization weakness|without protection|protective doctrine rule was not declared/iu.test(item.description)),
      minimum: 2,
    }),
    repeatedPattern({
      id: 'pattern:observation-discipline',
      title: 'Excellent observation discipline',
      description: 'Observation evidence is consistently completed before War Room movement.',
      dimensionId: 'observation-discipline',
      evidence: input.evidence.filter((item) => /observation.*complete|reported visible evidence|waited for evidence/iu.test(item.description)),
      minimum: 2,
    }),
    repeatedPattern({
      id: 'pattern:weak-debrief',
      title: 'Weak debrief pattern',
      description: 'Debrief or reflection quality repeatedly needs attention.',
      dimensionId: 'reflection-quality',
      evidence: input.evidence.filter((item) => /debrief.*missing|weak debrief|reflection.*missing/iu.test(item.description)),
      minimum: 2,
    }),
    repeatedPattern({
      id: 'pattern:recovery-discipline',
      title: 'Guardian recovery becoming habit',
      description: 'Guardian recovery evidence repeats across missions.',
      dimensionId: 'recovery-discipline',
      evidence: input.evidence.filter((item) => /recovery|guardian.*resolved|restriction.*resolved/iu.test(item.description)),
      minimum: 2,
    }),
    repeatedPattern({
      id: 'pattern:doctrine-usage',
      title: 'Recurring doctrine usage',
      description: 'Doctrine is repeatedly used to protect decisions.',
      dimensionId: 'process-trust',
      evidence: input.evidence.filter((item) => /doctrine|protective rule/iu.test(item.description)),
      minimum: 2,
    }),
  ].filter((pattern): pattern is BehaviorPattern => pattern !== undefined));
}

function repeatedPattern(input: {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly dimensionId: BehaviorDimensionId;
  readonly evidence: readonly BehaviorEvidence[];
  readonly minimum: number;
}): BehaviorPattern | undefined {
  if (input.evidence.length < input.minimum) return undefined;

  return Object.freeze({
    id: input.id,
    title: input.title,
    description: input.description,
    dimensionId: input.dimensionId,
    evidence: Object.freeze(input.evidence),
    missionIds: Object.freeze([...new Set(input.evidence.map((item) => item.missionId).filter(hasText))]),
  });
}

function hasText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}
