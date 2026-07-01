export interface CommanderObjectivesInput {
  readonly activeMissionId?: string | undefined;
  readonly activeMissionTitle?: string | undefined;
  readonly activeMissionObjective?: string | undefined;
  readonly generatedAt: string;
}

export interface CommanderObjective {
  readonly id: string;
  readonly scope: 'mission' | 'campaign';
  readonly title: string;
  readonly status: 'active' | 'pending';
}

export interface CommanderObjectives {
  readonly title: string;
  readonly generatedAt: string;
  readonly summary: string;
  readonly objectives: readonly CommanderObjective[];
  readonly constraints: readonly string[];
}

export function buildCommanderObjectives(input: CommanderObjectivesInput): CommanderObjectives {
  const missionId = input.activeMissionId?.trim();
  const missionTitle = input.activeMissionTitle?.trim();
  const objectiveText = input.activeMissionObjective?.trim();
  const hasMissionObjective = missionId !== undefined
    && missionId.length > 0
    && objectiveText !== undefined
    && objectiveText.length > 0;

  const objectives: CommanderObjective[] = hasMissionObjective
    ? [{
        id: `${missionId}:objective`,
        scope: 'mission',
        title: objectiveText,
        status: 'active',
      }]
    : [];

  return {
    title: 'Objectives',
    generatedAt: input.generatedAt,
    summary: hasMissionObjective && missionTitle
      ? `Active objective is tied to ${missionTitle}.`
      : 'No mission objective is ready for Commander display.',
    objectives,
    constraints: [
      'Objectives remain mission or campaign oriented.',
      'No social mechanics.',
      'No gamified scoring.',
    ],
  };
}
