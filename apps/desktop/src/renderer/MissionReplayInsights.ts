import type { MissionReplay, ReplayEvidence } from '@headquarters/hqos';

export type MissionReplayInsightType =
  | 'best-observation'
  | 'highest-discipline'
  | 'guardian-intervention'
  | 'turning-point'
  | 'critical-mistake'
  | 'best-lesson'
  | 'strongest-doctrine'
  | 'journal-insight';

export interface MissionReplayInsight {
  readonly id: string;
  readonly type: MissionReplayInsightType;
  readonly title: string;
  readonly summary: string;
  readonly evidence: readonly ReplayEvidence[];
}

export function buildMissionReplayInsights(replay: MissionReplay): readonly MissionReplayInsight[] {
  const insights: MissionReplayInsight[] = [];

  const observation = findEvidence(replay, 'observation');
  if (observation.length > 0) {
    insights.push(insight('best-observation', 'Best observation', 'Observation evidence was specific enough to review.', observation));
  }

  if (replay.evaluation?.strengths[0]) {
    insights.push(insight('highest-discipline', 'Highest discipline', replay.evaluation.strengths[0], evaluationEvidence(replay)));
  }

  const guardian = findEvidence(replay, 'guardian');
  if (guardian.length > 0) {
    insights.push(insight('guardian-intervention', 'Guardian intervention', 'Guardian evidence shaped the mission review.', guardian));
  }

  if (replay.timeline.bookmarks[0]) {
    const bookmarkEvidence = replay.timeline.events
      .find((event) => event.id === replay.timeline.bookmarks[0]!.eventId)?.evidence ?? [];
    insights.push(insight('turning-point', 'Turning point', replay.timeline.bookmarks[0].reason, bookmarkEvidence));
  }

  if (replay.evaluation?.failures[0]) {
    insights.push(insight('critical-mistake', 'Critical mistake', replay.evaluation.failures[0], evaluationEvidence(replay)));
  }

  if (replay.evaluation?.unresolvedLesson) {
    insights.push(insight('best-lesson', 'Best lesson', replay.evaluation.unresolvedLesson, evaluationEvidence(replay)));
  }

  const doctrine = findEvidence(replay, 'doctrine');
  if (doctrine.length > 0) {
    insights.push(insight('strongest-doctrine', 'Strongest doctrine', 'Doctrine evidence is linked to this replay.', doctrine));
  }

  const journal = findEvidence(replay, 'journal');
  if (journal.length > 0) {
    insights.push(insight('journal-insight', 'Journal insight', 'Journal evidence preserved operator reflection.', journal));
  }

  return Object.freeze(dedupeInsights(insights));
}

function insight(
  type: MissionReplayInsightType,
  title: string,
  summary: string,
  evidence: readonly ReplayEvidence[],
): MissionReplayInsight {
  return Object.freeze({
    id: `replay-insight:${type}`,
    type,
    title,
    summary,
    evidence: Object.freeze([...evidence]),
  });
}

function findEvidence(replay: MissionReplay, token: string): readonly ReplayEvidence[] {
  return Object.freeze(replay.timeline.events
    .flatMap((event) => event.evidence)
    .filter((evidence) => (
      evidence.source.toLowerCase().includes(token)
      || evidence.description.toLowerCase().includes(token)
    )));
}

function evaluationEvidence(replay: MissionReplay): readonly ReplayEvidence[] {
  if (!replay.evaluation) return [];
  return findEvidence(replay, replay.evaluation.id);
}

function dedupeInsights(insights: readonly MissionReplayInsight[]): readonly MissionReplayInsight[] {
  const seen = new Set<string>();
  return insights.filter((item) => {
    if (seen.has(item.type) || item.evidence.length === 0) return false;
    seen.add(item.type);
    return true;
  });
}
