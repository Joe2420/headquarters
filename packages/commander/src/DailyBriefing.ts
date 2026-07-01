export interface CommanderDailyBriefingInput {
  readonly activeMissionTitle?: string | undefined;
  readonly activeMissionObjective?: string | undefined;
  readonly missionCount: number;
  readonly journalEntryCount: number;
  readonly archiveRecordCount: number;
  readonly generatedAt: string;
}

export interface CommanderDailyBriefing {
  readonly title: string;
  readonly generatedAt: string;
  readonly summary: string;
  readonly focus: string;
  readonly evidence: readonly string[];
  readonly constraints: readonly string[];
}

export function buildCommanderDailyBriefing(input: CommanderDailyBriefingInput): CommanderDailyBriefing {
  const hasActiveMission = input.activeMissionTitle !== undefined && input.activeMissionTitle.trim().length > 0;
  const missionTitle = hasActiveMission ? input.activeMissionTitle?.trim() : undefined;
  const objective = input.activeMissionObjective?.trim();

  return {
    title: 'Daily Briefing',
    generatedAt: input.generatedAt,
    summary: missionTitle === undefined
      ? 'No active mission is loaded. Establish command, then create or select the mission for the day.'
      : `Active mission ${missionTitle} is ready for disciplined review.`,
    focus: objective && objective.length > 0
      ? objective
      : 'Protect process quality before any external action.',
    evidence: [
      `${input.missionCount} mission record${input.missionCount === 1 ? '' : 's'}`,
      `${input.journalEntryCount} journal entr${input.journalEntryCount === 1 ? 'y' : 'ies'}`,
      `${input.archiveRecordCount} archive record${input.archiveRecordCount === 1 ? '' : 's'}`,
    ],
    constraints: [
      'No market prediction.',
      'No broker action.',
      'Commander language remains calm and rare.',
    ],
  };
}
