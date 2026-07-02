export type CommanderShellRoomId =
  | 'command'
  | 'ready-room'
  | 'observation'
  | 'war-room'
  | 'debrief'
  | 'archive'
  | 'journal'
  | 'doctrine'
  | 'academy'
  | 'guardian'
  | 'intelligence'
  | 'settings';

export type CommanderShellActionKind = 'primary' | 'secondary';
export type CommanderInterruptionState = 'clear' | 'interrupted';
export type CommanderRoomTransitionState = 'idle' | 'requested';

export interface CommanderShellAction {
  readonly id: string;
  readonly label: string;
  readonly kind: CommanderShellActionKind;
  readonly disabled: boolean;
}

export interface CommanderShellMessage {
  readonly id: string;
  readonly text: string;
  readonly priority: 'low' | 'normal' | 'high';
}

export interface CommanderRoomTransitionIntent {
  readonly fromRoom: CommanderShellRoomId;
  readonly toRoom: CommanderShellRoomId;
  readonly state: CommanderRoomTransitionState;
}

export interface CommanderShellState {
  readonly currentMessage: CommanderShellMessage;
  readonly currentRoom: CommanderShellRoomId;
  readonly nextAction: CommanderShellAction;
  readonly secondaryActions: readonly CommanderShellAction[];
  readonly interruptionState: CommanderInterruptionState;
  readonly roomTransitionIntent: CommanderRoomTransitionIntent;
}

export interface CommanderShellStateInput {
  readonly currentMessage?: CommanderShellMessage;
  readonly currentRoom?: CommanderShellRoomId;
  readonly nextAction?: CommanderShellAction;
  readonly secondaryActions?: readonly CommanderShellAction[];
  readonly interruptionState?: CommanderInterruptionState;
  readonly roomTransitionIntent?: CommanderRoomTransitionIntent;
}

const defaultRoom: CommanderShellRoomId = 'command';

export function createCommanderShellState(input: CommanderShellStateInput = {}): CommanderShellState {
  const currentRoom = input.currentRoom ?? defaultRoom;

  return {
    currentMessage: input.currentMessage ?? {
      id: 'commander:standby',
      text: 'Report accepted. Await the next disciplined action.',
      priority: 'normal',
    },
    currentRoom,
    nextAction: input.nextAction ?? {
      id: 'action:standby',
      label: 'Stand By',
      kind: 'primary',
      disabled: true,
    },
    secondaryActions: input.secondaryActions ? [...input.secondaryActions] : [],
    interruptionState: input.interruptionState ?? 'clear',
    roomTransitionIntent: input.roomTransitionIntent ?? {
      fromRoom: currentRoom,
      toRoom: currentRoom,
      state: 'idle',
    },
  };
}

export function requestCommanderRoomTransition(
  state: CommanderShellState,
  toRoom: CommanderShellRoomId,
): CommanderShellState {
  return {
    ...state,
    roomTransitionIntent: {
      fromRoom: state.currentRoom,
      toRoom,
      state: state.currentRoom === toRoom ? 'idle' : 'requested',
    },
  };
}

export function completeCommanderRoomTransition(state: CommanderShellState): CommanderShellState {
  return {
    ...state,
    currentRoom: state.roomTransitionIntent.toRoom,
    roomTransitionIntent: {
      fromRoom: state.roomTransitionIntent.toRoom,
      toRoom: state.roomTransitionIntent.toRoom,
      state: 'idle',
    },
  };
}

export function interruptCommanderShell(
  state: CommanderShellState,
  currentMessage: CommanderShellMessage,
  nextAction: CommanderShellAction,
): CommanderShellState {
  return {
    ...state,
    currentMessage,
    nextAction,
    interruptionState: 'interrupted',
  };
}
