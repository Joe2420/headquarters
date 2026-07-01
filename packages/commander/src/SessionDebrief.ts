export interface CommanderSessionDebriefInput {
  readonly missionTitle?: string | undefined;
  readonly missionState?: string | undefined;
  readonly journalEntryCount: number;
  readonly archiveRecordCount: number;
  readonly generatedAt: string;
}

export interface CommanderSessionDebrief {
  readonly title: string;
  readonly generatedAt: string;
  readonly summary: string;
  readonly evidence: readonly string[];
  readonly distinction: string;
}

export function buildCommanderSessionDebrief(input: CommanderSessionDebriefInput): CommanderSessionDebrief {
  const missionTitle = input.missionTitle?.trim();
  const missionState = input.missionState?.trim();

  return {
    title: 'Session Debrief',
    generatedAt: input.generatedAt,
    summary: missionTitle && missionState
      ? `${missionTitle} ended the session in ${missionState}.`
      : 'No completed session evidence is available yet.',
    evidence: [
      `${input.journalEntryCount} journal entr${input.journalEntryCount === 1 ? 'y' : 'ies'}`,
      `${input.archiveRecordCount} archive record${input.archiveRecordCount === 1 ? '' : 's'}`,
    ],
    distinction: 'Commander session debrief is read-only and distinct from mission debrief persistence.',
  };
}
