import type { CommanderWorkspaceSnapshot } from './CommanderWorkspaceModel';

export interface CommanderWorkspaceAccessibilityContract {
  readonly rootLabel: string;
  readonly primaryLabel: string;
  readonly railLabel: string;
  readonly secondaryLabel: string;
  readonly responsiveClasses: readonly string[];
  readonly reducedMotionSafe: boolean;
}

export function buildCommanderWorkspaceAccessibilityContract(
  snapshot: CommanderWorkspaceSnapshot,
): CommanderWorkspaceAccessibilityContract {
  return {
    rootLabel: `Commander workspace: ${snapshot.mode}`,
    primaryLabel: `Commander briefing for ${snapshot.activeStage}`,
    railLabel: `Live mission command rail for ${snapshot.recommendedRoom}`,
    secondaryLabel: 'Secondary Headquarters context, progressively disclosed',
    responsiveClasses: [
      'commander-workspace',
      `commander-workspace--${snapshot.mode}`,
      `commander-workspace--room-${snapshot.recommendedRoom}`,
    ],
    reducedMotionSafe: true,
  };
}
