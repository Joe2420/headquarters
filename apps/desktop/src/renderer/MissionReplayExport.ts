import type { MissionReplay } from '@headquarters/hqos';

export interface MissionReplayReportExport {
  readonly title: string;
  readonly missionId: string;
  readonly commanderReview: string;
  readonly timeline: readonly {
    readonly occurredAt: string;
    readonly section: string;
    readonly title: string;
    readonly summary: string;
  }[];
  readonly evaluation: string;
  readonly consequences: readonly string[];
  readonly journal: readonly string[];
  readonly doctrine: readonly string[];
  readonly guardian: readonly string[];
  readonly lessons: readonly string[];
}

export interface MissionReplayExportBundle {
  readonly report: MissionReplayReportExport;
  readonly markdown: string;
  readonly json: string;
}

export function exportMissionReplay(replay: MissionReplay): MissionReplayExportBundle {
  const report = buildReplayReport(replay);
  return Object.freeze({
    report,
    markdown: buildMarkdownReport(report),
    json: JSON.stringify(report, null, 2),
  });
}

function buildReplayReport(replay: MissionReplay): MissionReplayReportExport {
  const evidence = replay.timeline.events.flatMap((event) => event.evidence);

  return Object.freeze({
    title: replay.summary.title,
    missionId: replay.missionId,
    commanderReview: replay.summary.commanderSummary,
    timeline: Object.freeze(replay.timeline.events.map((event) => Object.freeze({
      occurredAt: event.occurredAt,
      section: event.section,
      title: event.title,
      summary: event.summary,
    }))),
    evaluation: replay.evaluation?.commanderReview ?? replay.summary.finalOutcome,
    consequences: Object.freeze(evidence
      .filter((item) => item.source === 'operational-consequence')
      .map((item) => item.description)),
    journal: Object.freeze(evidence
      .filter((item) => item.source === 'journal')
      .map((item) => item.description)),
    doctrine: Object.freeze(evidence
      .filter((item) => item.source === 'doctrine')
      .map((item) => item.description)),
    guardian: Object.freeze(evidence
      .filter((item) => item.source === 'guardian')
      .map((item) => item.description)),
    lessons: Object.freeze(replay.evaluation?.recommendations ?? replay.summary.recommendations.map((item) => item.text)),
  });
}

function buildMarkdownReport(report: MissionReplayReportExport): string {
  return [
    `# ${report.title}`,
    '',
    `Mission: ${report.missionId}`,
    '',
    '## Commander Review',
    report.commanderReview,
    '',
    '## Timeline',
    ...report.timeline.map((event) => `- ${event.occurredAt} [${event.section}] ${event.title}: ${event.summary}`),
    '',
    '## Evaluation',
    report.evaluation,
    '',
    '## Lessons',
    ...(report.lessons.length > 0 ? report.lessons.map((lesson) => `- ${lesson}`) : ['- No lesson recorded.']),
  ].join('\n');
}
