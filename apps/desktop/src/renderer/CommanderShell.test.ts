import { describe, expect, it } from 'vitest';
import {
  completeCommanderRoomTransition,
  createCommanderShellState,
  interruptCommanderShell,
  requestCommanderRoomTransition,
} from './CommanderShell';

describe('CommanderShell foundation', () => {
  it('creates deterministic default shell state around the command room', () => {
    expect(createCommanderShellState()).toEqual({
      currentMessage: {
        id: 'commander:standby',
        text: 'Report accepted. Await the next disciplined action.',
        priority: 'normal',
      },
      currentRoom: 'command',
      nextAction: {
        id: 'action:standby',
        label: 'Stand By',
        kind: 'primary',
        disabled: true,
      },
      secondaryActions: [],
      interruptionState: 'clear',
      roomTransitionIntent: {
        fromRoom: 'command',
        toRoom: 'command',
        state: 'idle',
      },
    });
  });

  it('requests and completes room transition intent without routing side effects', () => {
    const state = createCommanderShellState({ currentRoom: 'ready-room' });
    const requested = requestCommanderRoomTransition(state, 'observation');

    expect(requested.currentRoom).toBe('ready-room');
    expect(requested.roomTransitionIntent).toEqual({
      fromRoom: 'ready-room',
      toRoom: 'observation',
      state: 'requested',
    });
    expect(completeCommanderRoomTransition(requested).currentRoom).toBe('observation');
  });

  it('keeps interruptions explicit on the Commander shell', () => {
    const interrupted = interruptCommanderShell(
      createCommanderShellState(),
      {
        id: 'commander:warning',
        text: 'Pause. Resolve the warning before continuing.',
        priority: 'high',
      },
      {
        id: 'action:acknowledge-warning',
        label: 'Acknowledge Warning',
        kind: 'primary',
        disabled: false,
      },
    );

    expect(interrupted.interruptionState).toBe('interrupted');
    expect(interrupted.currentMessage.priority).toBe('high');
    expect(interrupted.nextAction.label).toBe('Acknowledge Warning');
  });
});
