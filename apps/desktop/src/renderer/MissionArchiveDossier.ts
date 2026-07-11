import type { ActiveMission, LocalMissionArchiveSummary, MissionDebrief } from './App';

export interface MissionArchiveDossier {
  readonly missionId: string;
  readonly codename: string;
  readonly archivedAt: string;
  readonly state: string;
  readonly eventCount: number;
  readonly debriefStatus: string;
  readonly commanderSummary: string;
  readonly permanenceStatement: string;
}

export function buildMissionArchiveDossier(input: {
  readonly summary: LocalMissionArchiveSummary;
  readonly missionHistory: readonly ActiveMission[];
  readonly debrief?: MissionDebrief | undefined;
}): MissionArchiveDossier {
  const mission = input.missionHistory.find((candidate) => candidate.id === input.summary.missionId);
  const debriefStatus = input.debrief?.missionId === input.summary.missionId
    ? 'Debrief evidence attached'
    : 'Debrief evidence not attached';
  const state = mission?.currentState ?? 'archived';
  const objective = mission?.objective ?? 'Mission objective unavailable';

  return {
    missionId: input.summary.missionId,
    codename: input.summary.codename,
    archivedAt: input.summary.archivedAt,
    state,
    eventCount: input.summary.eventCount,
    debriefStatus,
    commanderSummary: `${input.summary.codename}: ${objective}`,
    permanenceStatement: 'Archive dossier is read-only historical intelligence.',
  };
}

export function listMissionArchiveDossiers(input: {
  readonly summaries: readonly LocalMissionArchiveSummary[];
  readonly missionHistory: readonly ActiveMission[];
  readonly debrief?: MissionDebrief | undefined;
}): readonly MissionArchiveDossier[] {
  return input.summaries
    .map((summary) => buildMissionArchiveDossier({
      summary,
      missionHistory: input.missionHistory,
      debrief: input.debrief,
    }))
    .sort((left, right) => left.archivedAt.localeCompare(right.archivedAt));
}
