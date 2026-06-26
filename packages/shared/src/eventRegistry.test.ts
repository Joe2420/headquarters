import { describe, expect, it } from 'vitest';
import type { EventPayloadMap } from './eventRegistry';
import {
  EVENT_CATEGORIES,
  EVENT_IDS,
  EVENT_REGISTRY,
  getDefaultEventPriority,
  getEventCategory,
  getEventIdsByCategory,
  getEventRegistryEntry,
  getEventSchemaVersion,
  isKnownEventType,
} from './eventRegistry';

describe('event registry', () => {
  it('is the complete source of event identifiers and categories', () => {
    expect(EVENT_IDS).toHaveLength(Object.keys(EVENT_REGISTRY).length);
    expect(EVENT_CATEGORIES).toEqual(['system', 'mission', 'operator', 'guardian', 'archive', 'environment']);
    expect(getEventIdsByCategory('mission')).toContain('mission.created');
  });

  it('looks up event metadata type-safely', () => {
    expect(isKnownEventType('guardian.intervention_recommended')).toBe(true);
    expect(isKnownEventType('guardian.intervention.raised')).toBe(false);
    expect(getEventCategory('guardian.intervention_recommended')).toBe('guardian');
    expect(getDefaultEventPriority('guardian.intervention_recommended')).toBe('red');
    expect(getEventSchemaVersion('guardian.intervention_recommended')).toBe(1);
    const entry = getEventRegistryEntry('mission.created');
    expect(entry.id).toBe('mission.created');
    expect(entry.owner).toBe('MissionService');
    expect(entry.consumers).toEqual(['ArchiveService', 'Guardian', 'Commander']);
  });


  it('requires every event to define ownership and consumers', () => {
    for (const eventId of EVENT_IDS) {
      const entry = EVENT_REGISTRY[eventId];

      expect(entry.owner.length).toBeGreaterThan(0);
      expect(entry.consumers.length).toBeGreaterThan(0);
    }
  });
  it('maps event identifiers to payload shapes', () => {
    const payload: EventPayloadMap['mission.created'] = {
      missionId: '11111111-1111-4111-8111-111111111111',
      codename: 'Quiet Registry',
      objective: 'Create a canonical event registry.',
    };

    expect(payload.codename).toBe('Quiet Registry');
  });
});