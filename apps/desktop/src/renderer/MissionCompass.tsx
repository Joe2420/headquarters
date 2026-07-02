export type MissionCompassStepState = 'locked' | 'available' | 'active' | 'completed';
export type MissionCompassStepId = 'ready-room' | 'observation' | 'war-room' | 'debrief' | 'archive';

export interface MissionCompassStep {
  readonly id: MissionCompassStepId;
  readonly label: string;
  readonly state: MissionCompassStepState;
}

export interface MissionCompassProps {
  readonly steps: readonly MissionCompassStep[];
}

export const defaultMissionCompassSteps: readonly MissionCompassStep[] = [
  { id: 'ready-room', label: 'Ready Room', state: 'active' },
  { id: 'observation', label: 'Observation', state: 'locked' },
  { id: 'war-room', label: 'War Room', state: 'locked' },
  { id: 'debrief', label: 'Debrief', state: 'locked' },
  { id: 'archive', label: 'Archive', state: 'locked' },
];

export function MissionCompass({ steps }: MissionCompassProps) {
  return (
    <nav className="mission-compass" aria-label="Mission compass">
      <ol>
        {steps.map((step) => (
          <li key={step.id} data-compass-step={step.id} data-compass-state={step.state}>
            <span>{step.label}</span>
            <span>{formatMissionCompassStepState(step.state)}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function formatMissionCompassStepState(state: MissionCompassStepState): string {
  if (state === 'completed') return 'Completed';
  if (state === 'active') return 'Active';
  if (state === 'available') return 'Available';
  return 'Locked';
}
