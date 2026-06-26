import type { EventPayloadMap, HeadquartersEventType, HQEvent } from '@headquarters/shared';
import { isKnownEventType } from '@headquarters/shared';
import { isEventEnvelope, validateEventEnvelope } from './events';

type EventHandler<TType extends HeadquartersEventType = HeadquartersEventType> = (
  event: HQEvent<EventPayloadMap[TType]>,
) => void | Promise<void>;

export interface EventBusOptions {
  historyLimit?: number;
}

export class InvalidEventEnvelopeError extends Error {
  constructor(public readonly errors: string[]) {
    super(`Invalid event envelope: ${errors.join('; ')}`);
    this.name = 'InvalidEventEnvelopeError';
  }
}

export class EventBus {
  private readonly handlers = new Map<HeadquartersEventType, Set<EventHandler>>();
  private readonly history: HQEvent<EventPayloadMap[HeadquartersEventType]>[] = [];
  private readonly historyLimit: number;

  constructor(options: EventBusOptions = {}) {
    this.historyLimit = options.historyLimit ?? 100;
  }

  subscribe<TType extends HeadquartersEventType>(type: TType, handler: EventHandler<TType>): () => void {
    if (!isKnownEventType(type)) {
      throw new InvalidEventEnvelopeError(['type must be a known Headquarters event type']);
    }

    const set = this.handlers.get(type) ?? new Set<EventHandler>();
    set.add(handler as EventHandler);
    this.handlers.set(type, set);

    return () => {
      set.delete(handler as EventHandler);
      if (set.size === 0) {
        this.handlers.delete(type);
      }
    };
  }

  async publish<TType extends HeadquartersEventType>(event: HQEvent<EventPayloadMap[TType]>): Promise<void> {
    const validation = validateEventEnvelope(event);
    if (!validation.valid || !isEventEnvelope<TType>(event)) {
      throw new InvalidEventEnvelopeError(validation.errors);
    }

    this.record(event as HQEvent<EventPayloadMap[HeadquartersEventType]>);

    const handlers = this.handlers.get(event.type) ?? new Set<EventHandler>();
    for (const handler of handlers) {
      await handler(event as HQEvent<EventPayloadMap[HeadquartersEventType]>);
    }
  }

  getHistory(): readonly HQEvent<EventPayloadMap[HeadquartersEventType]>[] {
    return [...this.history];
  }

  getHistoryByType<TType extends HeadquartersEventType>(type: TType): HQEvent<EventPayloadMap[TType]>[] {
    return this.history.filter((event): event is HQEvent<EventPayloadMap[TType]> => event.type === type);
  }

  clearHistory(): void {
    this.history.length = 0;
  }

  private record(event: HQEvent<EventPayloadMap[HeadquartersEventType]>): void {
    if (this.historyLimit <= 0) {
      return;
    }

    this.history.push(event);

    while (this.history.length > this.historyLimit) {
      this.history.shift();
    }
  }
}
