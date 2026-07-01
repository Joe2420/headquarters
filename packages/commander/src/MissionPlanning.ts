export interface CommanderMissionPlanningInput {
  readonly missionId?: string | undefined;
  readonly missionTitle?: string | undefined;
  readonly objective?: string | undefined;
  readonly currentState?: string | undefined;
  readonly generatedAt: string;
}

export interface CommanderMissionPlanningSupport {
  readonly title: string;
  readonly generatedAt: string;
  readonly summary: string;
  readonly standards: readonly string[];
  readonly constraints: readonly string[];
  readonly missionLinked: boolean;
}

export function buildCommanderMissionPlanning(input: CommanderMissionPlanningInput): CommanderMissionPlanningSupport {
  const missionTitle = input.missionTitle?.trim();
  const objective = input.objective?.trim();
  const state = input.currentState?.trim();
  const missionLinked = input.missionId !== undefined && input.missionId.trim().length > 0;

  return {
    title: 'Mission Planning',
    generatedAt: input.generatedAt,
    summary: missionLinked && missionTitle
      ? `Planning support is linked to ${missionTitle}.`
      : 'Planning support is waiting for an approved mission.',
    standards: [
      objective && objective.length > 0 ? `Objective: ${objective}` : 'Objective must be defined in the mission contract.',
      state && state.length > 0 ? `Current state: ${state}` : 'Mission state must remain governed by HQOS lifecycle rules.',
      'Review readiness before execution.',
      'Record decisions through approved mission and journal workflows.',
    ],
    constraints: [
      'Planning provides structure and standards only.',
      'No trade signals.',
      'No bypass of HQOS mission logic.',
    ],
    missionLinked,
  };
}
