import type {
  HealthDimension,
  HealthDimensionId,
  HealthEvidence,
  InstitutionalHealthSnapshot,
  InstitutionalHealthState,
} from './InstitutionalHealth';

export interface InstitutionalHealthHistoryEntry {
  readonly historyId: string;
  readonly snapshotId: string;
  readonly changedAt: string;
  readonly dimensionId: HealthDimensionId;
  readonly oldState?: InstitutionalHealthState | undefined;
  readonly newState: InstitutionalHealthState;
  readonly cause: string;
  readonly sourceEvidence: readonly HealthEvidence[];
}

export function buildInstitutionalHealthHistory(input: {
  readonly previousSnapshot?: InstitutionalHealthSnapshot | undefined;
  readonly currentSnapshot: InstitutionalHealthSnapshot;
}): readonly InstitutionalHealthHistoryEntry[] {
  return Object.freeze(input.currentSnapshot.dimensions
    .filter((dimension) => didDimensionChange(input.previousSnapshot, dimension))
    .map((dimension) => {
      const previous = input.previousSnapshot?.dimensions.find((item) => item.id === dimension.id);

      return Object.freeze({
        historyId: `health-history:${input.currentSnapshot.snapshotId}:${dimension.id}`,
        snapshotId: input.currentSnapshot.snapshotId,
        changedAt: input.currentSnapshot.evaluatedAt,
        dimensionId: dimension.id,
        ...(previous ? { oldState: previous.state } : {}),
        newState: dimension.state,
        cause: dimension.explanation.why,
        sourceEvidence: Object.freeze(dimension.supportingEvidence.map((evidence) => Object.freeze({ ...evidence }))),
      });
    }));
}

function didDimensionChange(
  previousSnapshot: InstitutionalHealthSnapshot | undefined,
  current: HealthDimension,
): boolean {
  const previous = previousSnapshot?.dimensions.find((dimension) => dimension.id === current.id);
  return previous === undefined || previous.state !== current.state || previous.explanation.why !== current.explanation.why;
}
