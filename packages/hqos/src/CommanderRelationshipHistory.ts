import type {
  BehaviorDimension,
  RelationshipHistory,
  RelationshipSnapshot,
} from './CommanderRelationship';

export function buildCommanderRelationshipHistory(input: {
  readonly previousSnapshot?: RelationshipSnapshot | undefined;
  readonly currentSnapshot: RelationshipSnapshot;
}): readonly RelationshipHistory[] {
  return Object.freeze(input.currentSnapshot.relationship.profile.dimensions
    .filter((dimension) => didDimensionChange(input.previousSnapshot, dimension))
    .map((dimension) => {
      const previous = input.previousSnapshot?.relationship.profile.dimensions.find((item) => item.id === dimension.id);

      return Object.freeze({
        historyId: `relationship-history:${input.currentSnapshot.snapshotId}:${dimension.id}`,
        snapshotId: input.currentSnapshot.snapshotId,
        changedAt: input.currentSnapshot.evaluatedAt,
        dimensionId: dimension.id,
        ...(previous ? { oldState: previous.state } : {}),
        newState: dimension.state,
        cause: dimension.explanation,
        evidence: Object.freeze(dimension.supportingEvidence),
      });
    }));
}

function didDimensionChange(
  previousSnapshot: RelationshipSnapshot | undefined,
  current: BehaviorDimension,
): boolean {
  const previous = previousSnapshot?.relationship.profile.dimensions.find((dimension) => dimension.id === current.id);
  return previous === undefined || previous.state !== current.state || previous.explanation !== current.explanation;
}
