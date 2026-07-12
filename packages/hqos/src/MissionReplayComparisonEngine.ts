import type { MissionReplay } from './MissionReplay';

export interface ReplayComparison {
  readonly id: string;
  readonly currentReplayId: string;
  readonly comparedReplayId: string;
  readonly summary: string;
  readonly evidenceIds: readonly string[];
  readonly type: 'similarity' | 'improvement' | 'resolved-warning';
}

export function compareMissionReplays(
  current: MissionReplay,
  history: readonly MissionReplay[],
): readonly ReplayComparison[] {
  return Object.freeze(history
    .filter((replay) => replay.replayId !== current.replayId)
    .flatMap((replay) => compareReplayPair(current, replay))
    .sort((left, right) => left.id.localeCompare(right.id)));
}

function compareReplayPair(current: MissionReplay, previous: MissionReplay): readonly ReplayComparison[] {
  const comparisons: ReplayComparison[] = [];
  const currentSections = new Set(current.lifecycle);
  const previousSections = new Set(previous.lifecycle);
  const sharedSections = [...currentSections].filter((section) => previousSections.has(section));

  if (sharedSections.includes('war-room') && current.evaluation && previous.evaluation) {
    comparisons.push(freezeComparison({
      id: `comparison:${current.replayId}:${previous.replayId}:authorization`,
      currentReplayId: current.replayId,
      comparedReplayId: previous.replayId,
      type: 'similarity',
      summary: `This authorization resembles ${previous.missionName} because both reached War Room review.`,
      evidenceIds: [current.evaluation.id, previous.evaluation.id],
    }));
  }

  if (current.evaluation && previous.evaluation && current.evaluation.failures.length < previous.evaluation.failures.length) {
    comparisons.push(freezeComparison({
      id: `comparison:${current.replayId}:${previous.replayId}:improvement`,
      currentReplayId: current.replayId,
      comparedReplayId: previous.replayId,
      type: 'improvement',
      summary: `Process quality improved compared with ${previous.missionName}.`,
      evidenceIds: [current.evaluation.id, previous.evaluation.id],
    }));
  }

  const currentGuardianWarnings = countGuardianEvidence(current);
  const previousGuardianWarnings = countGuardianEvidence(previous);
  if (previousGuardianWarnings > 0 && currentGuardianWarnings === 0) {
    comparisons.push(freezeComparison({
      id: `comparison:${current.replayId}:${previous.replayId}:guardian-resolved`,
      currentReplayId: current.replayId,
      comparedReplayId: previous.replayId,
      type: 'resolved-warning',
      summary: `A Guardian warning present in ${previous.missionName} no longer appears.`,
      evidenceIds: [
        ...current.timeline.events.flatMap((event) => event.evidence.map((evidence) => evidence.id)),
        ...previous.timeline.events.flatMap((event) => event.evidence.map((evidence) => evidence.id)),
      ],
    }));
  }

  return comparisons;
}

function countGuardianEvidence(replay: MissionReplay): number {
  return replay.timeline.events
    .flatMap((event) => event.evidence)
    .filter((evidence) => evidence.source === 'guardian')
    .length;
}

function freezeComparison(comparison: ReplayComparison): ReplayComparison {
  return Object.freeze({
    ...comparison,
    evidenceIds: Object.freeze([...comparison.evidenceIds]),
  });
}
