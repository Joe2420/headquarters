export interface CommanderSprint10ReviewItem {
  readonly higTask: string;
  readonly title: string;
  readonly status: 'complete';
}

export interface CommanderSprint10Review {
  readonly sprint: 'Sprint 10';
  readonly title: string;
  readonly completed: readonly CommanderSprint10ReviewItem[];
  readonly confirmations: readonly string[];
  readonly blockers: readonly string[];
}

export function buildCommanderSprint10Review(): CommanderSprint10Review {
  return {
    sprint: 'Sprint 10',
    title: 'Commander Review Package',
    completed: [
      { higTask: 'HIG-TASK-075', title: 'Daily Briefing', status: 'complete' },
      { higTask: 'HIG-TASK-076', title: 'Session Debrief', status: 'complete' },
      { higTask: 'HIG-TASK-077', title: 'Weekly Review', status: 'complete' },
      { higTask: 'HIG-TASK-078', title: 'Monthly Review', status: 'complete' },
      { higTask: 'HIG-TASK-079', title: 'Commander Dashboard', status: 'complete' },
      { higTask: 'HIG-TASK-080', title: 'Mission Planning', status: 'complete' },
      { higTask: 'HIG-TASK-081', title: 'Objectives', status: 'complete' },
    ],
    confirmations: [
      'Commander surfaces are deterministic and local-data driven.',
      'Commander does not predict markets.',
      'Commander does not introduce chat or avatar behavior.',
      'Mission planning remains structure and standards only.',
      'Objectives remain mission or campaign oriented.',
    ],
    blockers: [],
  };
}
