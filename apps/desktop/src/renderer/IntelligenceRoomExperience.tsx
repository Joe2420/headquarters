import type {
  HeadquartersIntelligenceInsight,
  RelevantHistoricalMission,
  IntelligenceTrendAnalysis,
} from '@headquarters/hqos';
import { buildCommanderIntelligenceGuidance } from './CommanderIntelligenceGuidance';

export interface IntelligenceRoomExperienceProps {
  readonly insights: readonly HeadquartersIntelligenceInsight[];
  readonly similarMissions: readonly RelevantHistoricalMission[];
  readonly trends: readonly IntelligenceTrendAnalysis[];
  readonly reviewedInsightIds?: readonly string[] | undefined;
  readonly filterText?: string | undefined;
}

export interface IntelligenceRoomModel {
  readonly highestInsight?: HeadquartersIntelligenceInsight | undefined;
  readonly activePatterns: readonly HeadquartersIntelligenceInsight[];
  readonly backgroundPatterns: readonly HeadquartersIntelligenceInsight[];
  readonly resolvedPatterns: readonly HeadquartersIntelligenceInsight[];
  readonly filteredInsights: readonly HeadquartersIntelligenceInsight[];
  readonly commanderSummary: string;
}

export function buildIntelligenceRoomModel(input: IntelligenceRoomExperienceProps): IntelligenceRoomModel {
  const filter = input.filterText?.trim().toLocaleLowerCase();
  const filteredInsights = input.insights.filter((insight) => {
    if (!filter) return true;
    return `${insight.title} ${insight.conciseSummary} ${insight.category}`.toLocaleLowerCase().includes(filter);
  });
  const highestInsight = [...filteredInsights].sort(compareInsights)[0];
  const commanderGuidance = buildCommanderIntelligenceGuidance({
    room: 'intelligence',
    insight: highestInsight,
    alreadyReferencedInsightIds: input.reviewedInsightIds,
  });

  return Object.freeze({
    highestInsight,
    activePatterns: Object.freeze(filteredInsights.filter((insight) => insight.status === 'active')),
    backgroundPatterns: Object.freeze(filteredInsights.filter((insight) => insight.status === 'background')),
    resolvedPatterns: Object.freeze(filteredInsights.filter((insight) => insight.status === 'resolved')),
    filteredInsights: Object.freeze(filteredInsights),
    commanderSummary: commanderGuidance?.text ?? 'Intelligence has no cross-mission pattern with sufficient evidence yet.',
  });
}

export function IntelligenceRoomExperience(props: IntelligenceRoomExperienceProps) {
  const model = buildIntelligenceRoomModel(props);
  const selectedInsight = model.highestInsight;

  return (
    <section className="intelligence-room-experience" aria-label="Cross-mission intelligence analysis">
      <section className="journal-panel intelligence-brief" aria-label="Intelligence brief">
        <p className="section-label">Intelligence Brief</p>
        <h3>{selectedInsight?.title ?? 'Insufficient cross-mission history'}</h3>
        <p>{model.commanderSummary}</p>
        {selectedInsight ? (
          <dl>
            <dt>Strength</dt>
            <dd>{selectedInsight.strength}</dd>
            <dt>Recommended review</dt>
            <dd>{selectedInsight.recommendedAction}</dd>
            <dt>Contradictions</dt>
            <dd>{selectedInsight.contradictoryMissions.length}</dd>
          </dl>
        ) : (
          <p className="muted">Complete more missions before Headquarters connects behavior across time.</p>
        )}
      </section>

      <section className="journal-panel" aria-label="Pattern board">
        <p className="section-label">Pattern Board</p>
        <h3>Evidence-backed patterns</h3>
        <dl>
          <dt>Active</dt>
          <dd>{model.activePatterns.length}</dd>
          <dt>Background</dt>
          <dd>{model.backgroundPatterns.length}</dd>
          <dt>Resolved</dt>
          <dd>{model.resolvedPatterns.length}</dd>
        </dl>
      </section>

      <section className="journal-panel" aria-label="Evidence network">
        <p className="section-label">Evidence Network</p>
        <h3>Supporting records</h3>
        {selectedInsight ? (
          <ol className="mission-archive-list">
            {selectedInsight.evidenceReferences.map((evidence) => (
              <li key={evidence.evidenceId}>
                <span>{evidence.sourceSubsystem}</span>
                <strong>{evidence.evidenceId}</strong>
                <span>{evidence.description}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">No evidence network is available yet.</p>
        )}
      </section>

      <section className="journal-panel" aria-label="Similar missions">
        <p className="section-label">Similar Missions</p>
        <h3>Historical relevance</h3>
        {props.similarMissions.length === 0 ? (
          <p className="muted">No prior mission has enough shared dimensions for comparison.</p>
        ) : (
          <ol className="mission-archive-list">
            {props.similarMissions.map((mission) => (
              <li key={mission.relevanceId}>
                <span>{mission.missionId}</span>
                <strong>{mission.matchedDimensions.join(', ')}</strong>
                <span>{mission.importantDifferences[0] ?? 'No important difference recorded.'}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="journal-panel" aria-label="Trend review">
        <p className="section-label">Trend Review</p>
        <h3>Qualitative trends</h3>
        {props.trends.length === 0 ? (
          <p className="muted">No trend window has enough evidence yet.</p>
        ) : (
          <ol className="mission-archive-list">
            {props.trends.map((trend) => (
              <li key={trend.trendId}>
                <span>{trend.subject}</span>
                <strong>{trend.trend}</strong>
                <span>{trend.sampleSize} evidence records</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="journal-panel" aria-label="Intelligence history">
        <p className="section-label">History</p>
        <h3>Insight changes</h3>
        <p className="muted">Insight review and resolution history is preserved by the Intelligence history layer.</p>
      </section>
    </section>
  );
}

function compareInsights(left: HeadquartersIntelligenceInsight, right: HeadquartersIntelligenceInsight): number {
  const urgencyRank = { immediate: 0, safe_point: 1, standby: 2, background: 3 } as const;
  const strengthRank = { established: 0, repeated: 1, supported: 2, emerging: 3, weak: 4 } as const;
  return urgencyRank[left.urgency] - urgencyRank[right.urgency]
    || strengthRank[left.strength] - strengthRank[right.strength]
    || left.title.localeCompare(right.title);
}
