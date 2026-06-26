import type { HeadquartersEvent, HeadquartersEventType } from '@headquarters/shared';

type EventHandler<T = unknown> = (event: HeadquartersEvent<T>) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<HeadquartersEventType, Set<EventHandler>>();

  subscribe(type: HeadquartersEventType, handler: EventHandler): () => void {
    const set = this.handlers.get(type) ?? new Set<EventHandler>();
    set.add(handler);
    this.handlers.set(type, set);
    return () => set.delete(handler);
  }

  async publish<T>(event: HeadquartersEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? new Set<EventHandler>();
    for (const handler of handlers) {
      await handler(event);
    }
  }
}
