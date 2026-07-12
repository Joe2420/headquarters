import {
  compareInstitutionalHealthStates,
  type HealthDimensionId,
  type HealthTrend,
  type InstitutionalHealthSnapshot,
  type InstitutionalHealthState,
} from './InstitutionalHealth';

export function calculateHealthTrend(input: {
  readonly dimensionId: HealthDimensionId;
  readonly currentState: InstitutionalHealthState;
  readonly previousSnapshot?: InstitutionalHealthSnapshot | undefined;
}): HealthTrend {
  const previous = input.previousSnapshot?.dimensions.find((dimension) => dimension.id === input.dimensionId);
  if (previous === undefined) return 'stable';

  const comparison = compareInstitutionalHealthStates(input.currentState, previous.state);
  if (comparison < 0) return 'improving';
  if (comparison > 0) return 'declining';
  return 'stable';
}
