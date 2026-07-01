export interface CommanderMonthlyEvidenceLink {
  readonly source: 'mission' | 'journal' | 'doctrine' | 'academy';
  readonly label: string;
  readonly count: number;
}

export interface CommanderMonthlyReviewInput {
  readonly missionCount: number;
  readonly journalEntryCount: number;
  readonly doctrineRecordCount: number;
  readonly academyGrowthEventCount: number;
  readonly generatedAt: string;
}

export interface CommanderMonthlyReview {
  readonly title: string;
  readonly generatedAt: string;
  readonly summary: string;
  readonly evidenceLinks: readonly CommanderMonthlyEvidenceLink[];
  readonly institutionalNote: string;
  readonly empty: boolean;
}

export function buildCommanderMonthlyReview(input: CommanderMonthlyReviewInput): CommanderMonthlyReview {
  const evidenceLinks: CommanderMonthlyEvidenceLink[] = [
    { source: 'mission', label: 'Mission records', count: input.missionCount },
    { source: 'journal', label: 'Journal entries', count: input.journalEntryCount },
    { source: 'doctrine', label: 'Doctrine records', count: input.doctrineRecordCount },
    { source: 'academy', label: 'Academy growth events', count: input.academyGrowthEventCount },
  ];
  const evidenceCount = evidenceLinks.reduce((total, link) => total + link.count, 0);

  return {
    title: 'Monthly Review',
    generatedAt: input.generatedAt,
    summary: evidenceCount === 0
      ? 'No traceable monthly evidence is available yet.'
      : 'Monthly review is assembled from traceable Headquarters records.',
    evidenceLinks,
    institutionalNote: 'Commander monthly review remains institutional, evidence-linked, and non-predictive.',
    empty: evidenceCount === 0,
  };
}
