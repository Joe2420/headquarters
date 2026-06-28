export interface HQOSService {
  id: string;
  required?: boolean;
  initialize?: () => void | Promise<void>;
}

export interface RegisteredHQOSService {
  id: string;
  required: boolean;
  initialize?: () => void | Promise<void>;
}

export class ServiceRegistry {
  private readonly services = new Map<string, RegisteredHQOSService>();

  register(service: HQOSService): void {
    if (service.id.length === 0) {
      throw new Error('Service id is required');
    }

    if (this.services.has(service.id)) {
      throw new Error(`Service already registered: ${service.id}`);
    }

    const registered: RegisteredHQOSService = {
      id: service.id,
      required: service.required ?? true,
    };

    if (service.initialize !== undefined) {
      registered.initialize = service.initialize;
    }

    this.services.set(service.id, registered);
  }

  get(serviceId: string): RegisteredHQOSService | undefined {
    return this.services.get(serviceId);
  }

  list(): readonly RegisteredHQOSService[] {
    return [...this.services.values()];
  }
}
