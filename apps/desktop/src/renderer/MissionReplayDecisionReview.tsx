import type { MissionReplay, ReplayDecision, ReplayEvidence } from '@headquarters/hqos';

export interface MissionReplayDecisionReviewProps {
  readonly replay: MissionReplay;
  readonly decisionId?: string | undefined;
}

export function MissionReplayDecisionReview({ replay, decisionId }: MissionReplayDecisionReviewProps) {
  const decisions = getReplayDecisions(replay);
  const selected = decisionId
    ? decisions.find((decision) => decision.id === decisionId)
    : decisions[0];

  if (!selected) {
    return (
      <section className="mission-replay-decision-review" aria-label="Mission replay decision review">
        <p>No reviewable decisions are present in this replay.</p>
      </section>
    );
  }

  const evidence = getDecisionEvidence(replay, selected);

  return (
    <section className="mission-replay-decision-review" aria-label="Mission replay decision review">
      <p className="section-label">Decision Review</p>
      <h2>{selected.title}</h2>
      <p>{selected.reasoning}</p>
      <blockquote>{selected.commanderReview}</blockquote>
      <dl>
        <div>
          <dt>Outcome</dt>
          <dd>{replay.evaluation?.verdict ?? replay.summary.finalOutcome}</dd>
        </div>
        <div>
          <dt>Evidence</dt>
          <dd>{evidence.length}</dd>
        </div>
      </dl>
      <ul>
        {evidence.map((item) => (
          <li key={`${item.source}:${item.id}`}>
            <strong>{item.source}</strong>
            <span>{item.description}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function getReplayDecisions(replay: MissionReplay): readonly ReplayDecision[] {
  return Object.freeze(replay.timeline.events
    .map((event) => event.decision)
    .filter((decision): decision is ReplayDecision => decision !== undefined));
}

export function getDecisionEvidence(replay: MissionReplay, decision: ReplayDecision): readonly ReplayEvidence[] {
  const ids = new Set(decision.evidenceIds);
  return Object.freeze(replay.timeline.events
    .flatMap((event) => event.evidence)
    .filter((evidence) => ids.has(evidence.id)));
}
