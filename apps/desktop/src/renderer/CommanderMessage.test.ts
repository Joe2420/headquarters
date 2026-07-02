import { describe, expect, it } from 'vitest';
import {
  createCommanderMessage,
  isCommanderMessageUrgent,
  listCommanderMessagesInDisplayOrder,
  type CommanderMessage,
} from './CommanderMessage';

const baseAction = {
  id: 'action:standby',
  label: 'Stand By',
  disabled: true,
};

describe('CommanderMessage model', () => {
  it('orders messages by timestamp and id deterministically', () => {
    const messages: CommanderMessage[] = [
      createCommanderMessage({
        id: 'message:c',
        timestamp: '2026-07-02T08:00:00.000Z',
        room: 'command',
        type: 'guidance',
        tone: 'calm',
        priority: 'normal',
        text: 'Third in tie order.',
        primaryAction: baseAction,
        secondaryActions: [],
        source: 'system',
      }),
      createCommanderMessage({
        id: 'message:a',
        timestamp: '2026-07-02T07:59:00.000Z',
        room: 'ready-room',
        type: 'briefing',
        tone: 'firm',
        priority: 'normal',
        text: 'First by timestamp.',
        primaryAction: baseAction,
        secondaryActions: [],
        source: 'mission-state',
      }),
      createCommanderMessage({
        id: 'message:b',
        timestamp: '2026-07-02T08:00:00.000Z',
        room: 'observation',
        type: 'transition',
        tone: 'calm',
        priority: 'low',
        text: 'Second in tie order.',
        primaryAction: baseAction,
        secondaryActions: [],
        source: 'room-transition',
      }),
    ];

    expect(listCommanderMessagesInDisplayOrder(messages).map((message) => message.id)).toEqual([
      'message:a',
      'message:b',
      'message:c',
    ]);
    expect(messages.map((message) => message.id)).toEqual(['message:c', 'message:a', 'message:b']);
  });

  it('copies secondary actions so callers cannot mutate stored model arrays by reference', () => {
    const secondaryActions = [{ id: 'action:details', label: 'Review Details', disabled: false }];
    const message = createCommanderMessage({
      id: 'message:copy',
      timestamp: '2026-07-02T08:00:00.000Z',
      room: 'command',
      type: 'guidance',
      tone: 'calm',
      priority: 'normal',
      text: 'Review the current state.',
      primaryAction: baseAction,
      secondaryActions,
      source: 'system',
    });

    expect(message.secondaryActions).toEqual(secondaryActions);
    expect(message.secondaryActions).not.toBe(secondaryActions);
  });

  it('detects urgent warnings and interruptions without generated text', () => {
    const warning = createCommanderMessage({
      id: 'message:warning',
      timestamp: '2026-07-02T08:00:00.000Z',
      room: 'guardian',
      type: 'warning',
      tone: 'protective',
      priority: 'high',
      text: 'Resolve the warning before continuing.',
      primaryAction: { id: 'action:resolve', label: 'Resolve Warning', disabled: false },
      secondaryActions: [],
      source: 'guardian',
    });
    const interruption = createCommanderMessage({
      ...warning,
      id: 'message:interruption',
      type: 'interruption',
      priority: 'normal',
    });

    expect(isCommanderMessageUrgent(warning)).toBe(true);
    expect(isCommanderMessageUrgent(interruption)).toBe(true);
  });
});
