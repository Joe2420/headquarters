import type { CommanderShellRoomId } from './CommanderShell';

export type CommanderMessageType =
  | 'briefing'
  | 'guidance'
  | 'warning'
  | 'acknowledgement'
  | 'transition'
  | 'debrief'
  | 'recognition'
  | 'interruption';

export type CommanderMessageTone = 'calm' | 'firm' | 'protective' | 'recognizing';
export type CommanderMessagePriority = 'low' | 'normal' | 'high' | 'critical';
export type CommanderMessageSource = 'system' | 'mission-state' | 'room-transition' | 'guardian' | 'operator-action';

export interface CommanderMessageAction {
  readonly id: string;
  readonly label: string;
  readonly disabled: boolean;
}

export interface CommanderMessage {
  readonly id: string;
  readonly timestamp: string;
  readonly room: CommanderShellRoomId;
  readonly type: CommanderMessageType;
  readonly tone: CommanderMessageTone;
  readonly priority: CommanderMessagePriority;
  readonly text: string;
  readonly primaryAction: CommanderMessageAction;
  readonly secondaryActions: readonly CommanderMessageAction[];
  readonly source: CommanderMessageSource;
}

export function listCommanderMessagesInDisplayOrder(messages: readonly CommanderMessage[]): CommanderMessage[] {
  return [...messages].sort((first, second) => {
    const timestampOrder = first.timestamp.localeCompare(second.timestamp);
    if (timestampOrder !== 0) return timestampOrder;
    return first.id.localeCompare(second.id);
  });
}

export function createCommanderMessage(input: CommanderMessage): CommanderMessage {
  return {
    ...input,
    secondaryActions: [...input.secondaryActions],
  };
}

export function isCommanderMessageUrgent(message: CommanderMessage): boolean {
  return message.priority === 'high' || message.priority === 'critical' || message.type === 'interruption';
}
