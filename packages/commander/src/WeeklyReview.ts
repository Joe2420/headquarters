export interface CommanderWeeklyReviewInput {
  readonly missionCount: number;
  readonly journalEntryCount: number;
  readonly doctrineRecordCount: number;
  readonly academyGrowthEventCount: number;
  readonly generatedAt: string;
}

export interface CommanderWeeklyReview {
  readonly title: string;
  readonly generatedAt: string;
  readonly summary: string;
  readonly evidence: readonly string[];
  readonly constraints: readonly string[];
  readonly empty: boolean;
}

export function buildCommanderWeeklyReview(input: CommanderWeeklyReviewInput): CommanderWeeklyReview {
  const evidenceCount = input.missionCount
    + input.journalEntryCount
    + input.doctrineRecordCount
    + input.academyGrowthEventCount;

  return {
    title: 'Weekly Review',
    generatedAt: input.generatedAt,
    summary: evidenceCount === 0
      ? 'No approved weekly evidence is available yet.'
      : 'Weekly review is ready from approved Headquarters evidence.',
    evidence: [
      `${input.missionCount} mission record${input.missionCount === 1 ? '' : 's'}`,
      `${input.journalEntryCount} journal entr${input.journalEntryCount === 1 ? 'y' : 'ies'}`,
      `${input.doctrineRecordCount} doctrine record${input.doctrineRecordCount === 1 ? '' : 's'}`,
      `${input.academyGrowthEventCount} Academy growth event${input.academyGrowthEventCount === 1 ? '' : 's'}`,
    ],
    constraints: [
      'Deterministic local review only.',
      'No AI interpretation.',
      'No market prediction.',
    ],
    empty: evidenceCount === 0,
  };
}
