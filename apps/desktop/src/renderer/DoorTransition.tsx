import type { CommanderShellRoomId } from './CommanderShell';

export type DoorTransitionState = 'idle' | 'opening' | 'open' | 'closing' | 'complete';

export interface DoorTransitionProps {
  readonly fromRoom: CommanderShellRoomId;
  readonly toRoom: CommanderShellRoomId;
  readonly transitionState: DoorTransitionState;
  readonly label: string;
}

export function DoorTransition({ fromRoom, toRoom, transitionState, label }: DoorTransitionProps) {
  return (
    <section
      className={`door-transition door-transition-${transitionState}`}
      aria-label="Room transition"
      data-from-room={fromRoom}
      data-to-room={toRoom}
      data-transition-state={transitionState}
    >
      <p>{label}</p>
      <p>{formatDoorTransitionState(transitionState)}</p>
    </section>
  );
}

export function formatDoorTransitionState(state: DoorTransitionState): string {
  if (state === 'opening') return 'Opening';
  if (state === 'open') return 'Open';
  if (state === 'closing') return 'Closing';
  if (state === 'complete') return 'Complete';
  return 'Idle';
}
