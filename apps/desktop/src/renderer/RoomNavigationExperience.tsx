import type { MissionState } from '@headquarters/shared';
import type { CommanderShellRoomId } from './CommanderShell';
import type { MissionCompassStep, MissionCompassStepId } from './MissionCompass';
import { MissionCompass } from './MissionCompass';

export type HeadquartersNavigationTarget =
  | 'command'
  | 'missions'
  | 'ready'
  | 'observation'
  | 'war'
  | 'debrief'
  | 'archive'
  | 'journal'
  | 'academy'
  | 'doctrine'
  | 'guardian'
  | 'intelligence'
  | 'settings';

export type RoomTransitionPhase = 'commander' | 'closing' | 'transitioning' | 'opening' | 'arrival' | 'interrupted';

export interface RoomTransitionState {
  readonly fromRoom: CommanderShellRoomId;
  readonly toRoom: CommanderShellRoomId;
  readonly phase: RoomTransitionPhase;
}

export interface RoomArrival {
  readonly room: CommanderShellRoomId;
  readonly title: string;
  readonly message: string;
}

const missionPath: readonly MissionCompassStepId[] = ['ready-room', 'observation', 'war-room', 'debrief', 'archive'];
const missionPathLabels: Record<MissionCompassStepId, string> = {
  'ready-room': 'Ready Room',
  observation: 'Observation',
  'war-room': 'War Room',
  debrief: 'Debrief Theater',
  archive: 'Archive',
};

export function parseMissionNavigationState(state?: string): MissionState | undefined {
  if (
    state === 'idle'
    || state === 'briefing'
    || state === 'ready'
    || state === 'observation'
    || state === 'authorization'
    || state === 'deployed'
    || state === 'return_to_base'
    || state === 'debrief'
    || state === 'archived'
  ) {
    return state;
  }

  return undefined;
}

export function buildMissionCompassSteps(
  missionState: MissionState | undefined,
  activeRoom: CommanderShellRoomId,
): MissionCompassStep[] {
  const activeIndex = missionPath.indexOf(getCompassRoomForMissionState(missionState));

  return missionPath.map((id, index) => ({
    id,
    label: missionPathLabels[id],
    state: getMissionCompassStepState(index, activeIndex, activeRoom === id),
  }));
}

export function getCommanderCompassReference(steps: readonly MissionCompassStep[]): string {
  const active = steps.find((step) => step.state === 'active');
  const lockedCount = steps.filter((step) => step.state === 'locked').length;

  if (!active) return 'Mission compass standing by.';
  if (lockedCount === 0) return `${active.label} active. Mission path complete.`;
  return `${active.label} active. ${lockedCount} future rooms locked.`;
}

export function mapCommanderRoomToNavigationTarget(room: CommanderShellRoomId): HeadquartersNavigationTarget {
  if (room === 'ready-room') return 'ready';
  if (room === 'war-room') return 'war';
  if (room === 'observation') return 'observation';
  if (room === 'debrief') return 'debrief';
  if (room === 'archive') return 'archive';
  if (room === 'journal') return 'journal';
  if (room === 'doctrine') return 'doctrine';
  if (room === 'academy') return 'academy';
  if (room === 'guardian') return 'guardian';
  if (room === 'intelligence') return 'intelligence';
  if (room === 'settings') return 'settings';
  return 'missions';
}

export function createRoomTransition(
  fromRoom: CommanderShellRoomId,
  toRoom: CommanderShellRoomId,
): RoomTransitionState {
  return {
    fromRoom,
    toRoom,
    phase: 'commander',
  };
}

export function advanceRoomTransition(transition: RoomTransitionState): RoomTransitionState {
  const nextPhase: Record<RoomTransitionPhase, RoomTransitionPhase> = {
    commander: 'closing',
    closing: 'transitioning',
    transitioning: 'opening',
    opening: 'arrival',
    arrival: 'arrival',
    interrupted: 'opening',
  };

  return {
    ...transition,
    phase: nextPhase[transition.phase],
  };
}

export function recoverInterruptedTransition(transition: RoomTransitionState): RoomTransitionState {
  return {
    ...transition,
    phase: 'opening',
  };
}

export function getRoomArrival(room: CommanderShellRoomId): RoomArrival {
  if (room === 'ready-room') {
    return { room, title: 'Ready Room', message: 'Mission received. Preparation begins here.' };
  }

  if (room === 'observation') {
    return { room, title: 'Observation', message: 'Observe only. Silence is the work.' };
  }

  if (room === 'war-room') {
    return { room, title: 'War Room', message: 'Authorization required. Decide inside the plan.' };
  }

  if (room === 'debrief') {
    return { room, title: 'Debrief Theater', message: "Summarize today's operation before memory fades." };
  }

  if (room === 'archive') {
    return { room, title: 'Archive', message: 'Mission permanently archived. History is now the interface.' };
  }

  return { room, title: 'Headquarters', message: 'Commander guidance received. Continue.' };
}

export function getRoomIdentity(room: CommanderShellRoomId): string {
  if (room === 'ready-room') return 'preparation';
  if (room === 'observation') return 'silence';
  if (room === 'war-room') return 'decision';
  if (room === 'debrief') return 'reflection';
  if (room === 'archive') return 'historical';
  return 'headquarters';
}

export function getRoomTransitionNarration(phase: RoomTransitionPhase): string {
  if (phase === 'commander') return 'Commander confirms the next room.';
  if (phase === 'closing') return 'Door closes.';
  if (phase === 'transitioning') return 'Transition corridor active.';
  if (phase === 'opening') return 'Door opens.';
  if (phase === 'interrupted') return 'Transition interrupted. Recovering route.';
  return 'Arrival confirmed.';
}

export function RoomTransitionLayer({ transition }: { readonly transition: RoomTransitionState }) {
  return (
    <section
      className="room-transition-layer"
      aria-label="Room transition"
      data-transition-from={transition.fromRoom}
      data-transition-to={transition.toRoom}
      data-transition-phase={transition.phase}
    >
      <p className="section-label">Door Transition</p>
      <h2>{getRoomTransitionNarration(transition.phase)}</h2>
      <ol>
        {(['commander', 'closing', 'transitioning', 'opening', 'arrival'] as const).map((phase) => (
          <li key={phase} data-transition-step={phase} data-transition-active={phase === transition.phase}>
            {getRoomTransitionNarration(phase)}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function RoomArrivalPanel({
  arrival,
  onContinue,
}: {
  readonly arrival: RoomArrival;
  readonly onContinue: () => void;
}) {
  return (
    <section
      className="room-arrival-panel"
      aria-label={`${arrival.title} arrival`}
      data-arrival-room={arrival.room}
      data-room-identity={getRoomIdentity(arrival.room)}
    >
      <p className="section-label">Arrival</p>
      <h2>{arrival.title}</h2>
      <p>{arrival.message}</p>
      <button type="button" className="primary-action" onClick={onContinue}>
        Continue
      </button>
    </section>
  );
}

export function MissionCompassPanel({ steps }: { readonly steps: readonly MissionCompassStep[] }) {
  return (
    <div className="commander-compass" aria-label="Commander mission compass">
      <MissionCompass steps={steps} />
      <p>{getCommanderCompassReference(steps)}</p>
    </div>
  );
}

function getMissionCompassStepState(
  index: number,
  activeIndex: number,
  isCurrentRoom: boolean,
): MissionCompassStep['state'] {
  if (isCurrentRoom) return 'active';
  if (activeIndex < 0) return index === 0 ? 'active' : 'locked';
  if (index < activeIndex) return 'completed';
  if (index === activeIndex) return 'active';
  if (index === activeIndex + 1) return 'available';
  return 'locked';
}

function getCompassRoomForMissionState(missionState: MissionState | undefined): MissionCompassStepId {
  if (missionState === 'ready' || missionState === 'observation') return 'observation';
  if (missionState === 'authorization' || missionState === 'deployed') return 'war-room';
  if (missionState === 'return_to_base') return 'debrief';
  if (missionState === 'debrief' || missionState === 'archived') return 'archive';
  return 'ready-room';
}
