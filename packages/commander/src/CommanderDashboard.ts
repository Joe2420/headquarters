export interface CommanderDashboardInput {
  readonly hasDailyBriefing: boolean;
  readonly hasSessionDebrief: boolean;
  readonly hasWeeklyReview: boolean;
  readonly hasMonthlyReview: boolean;
  readonly hasMissionPlanning: boolean;
  readonly objectiveCount: number;
  readonly generatedAt: string;
}

export interface CommanderDashboardSection {
  readonly label: string;
  readonly status: 'available' | 'pending';
  readonly summary: string;
}

export interface CommanderDashboard {
  readonly title: string;
  readonly generatedAt: string;
  readonly sections: readonly CommanderDashboardSection[];
  readonly constraints: readonly string[];
}

export function buildCommanderDashboard(input: CommanderDashboardInput): CommanderDashboard {
  return {
    title: 'Commander Dashboard',
    generatedAt: input.generatedAt,
    sections: [
      {
        label: 'Briefing',
        status: input.hasDailyBriefing ? 'available' : 'pending',
        summary: input.hasDailyBriefing ? 'Daily briefing is available.' : 'Daily briefing is pending.',
      },
      {
        label: 'Reviews',
        status: input.hasSessionDebrief || input.hasWeeklyReview || input.hasMonthlyReview ? 'available' : 'pending',
        summary: formatReviewSummary(input),
      },
      {
        label: 'Planning',
        status: input.hasMissionPlanning ? 'available' : 'pending',
        summary: input.hasMissionPlanning
          ? 'Mission planning support is available.'
          : 'Mission planning support remains pending its approved workflow.',
      },
      {
        label: 'Objectives',
        status: input.objectiveCount > 0 ? 'available' : 'pending',
        summary: input.objectiveCount > 0
          ? `${input.objectiveCount} objective${input.objectiveCount === 1 ? '' : 's'} represented.`
          : 'Objectives remain pending their approved workflow.',
      },
    ],
    constraints: [
      'No chat behavior.',
      'No avatar behavior.',
      'No market prediction.',
    ],
  };
}

function formatReviewSummary(input: CommanderDashboardInput): string {
  const count = [
    input.hasSessionDebrief,
    input.hasWeeklyReview,
    input.hasMonthlyReview,
  ].filter(Boolean).length;

  return count === 0
    ? 'Commander reviews are pending.'
    : `${count} Commander review surface${count === 1 ? '' : 's'} available.`;
}
