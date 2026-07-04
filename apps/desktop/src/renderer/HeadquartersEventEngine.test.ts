import { describe, expect, it } from 'vitest';
import {
  buildHeadquartersEvents,
  buildOperationalAwareness,
  selectPassiveCommanderMessage,
} from './HeadquartersEventEngine';
import type { MissionIntelligencePackage } from './MissionIntelligencePackage';

const missionPackage: MissionIntelligencePackage = {
  missionId: 'mission-026',
  missionName: 'Living Headquarters',
  currentState: 'observation',
  missionObjective: 'Observe without forcing execution',
  confidence: {
    score: 73,
    level: 'sufficient',
    reasons: ['11 of 15 intelligence fields present'],
  },
  contradictions: [],
  missingEvidence: [
    {
      field: 'invalidation',
      label: 'Invalidation evidence',
      room: 'observation',
    },
  ],
  commanderNotes: [],
  guardianNotes: [],
};

describe('HeadquartersEventEngine', () => {
  it('builds deterministic operating events from current Headquarters state', () => {
    const events = buildHeadquartersEvents({
      reportState: 'reported',
      currentRoom: 'observation',
      recommendedRoom: 'observation',
      missionId: 'mission-026',
      missionPhase: 'Current station: Observation Room',
      missionIntelligence: missionPackage,
      guardianAlerts: [
        {
          id: 'guardian-alert-risk',
          title: 'Risk boundary',
          message: 'Risk boundary remains active.',
          priority: 'high',
          sourceId: 'risk',
        },
      ],
      growthEvents: [],
      doctrineCandidateCount: 1,
      archiveRecordCount: 2,
      currentObjective: 'Continue collecting evidence.',
      createdAt: '2026-07-02T00:00:00.000Z',
    });

    expect(events.map((event) => event.type)).toEqual([
      'room_status_update',
      'mission_status_update',
      'intelligence_update',
      'guardian_observation',
      'doctrine_candidate',
      'archive_synchronization',
    ]);
    expect(events[2]?.message).toContain('Confidence sufficient at 73%');
    expect(events[3]?.priority).toBe('high');
    expect(selectPassiveCommanderMessage(events)).toBe('Guardian reports: Risk boundary remains active.');
  });

  it('keeps security checkpoint events minimal before report for duty', () => {
    const events = buildHeadquartersEvents({
      reportState: 'not-reported',
      currentRoom: 'command',
      recommendedRoom: 'command',
      missionPhase: 'Mission route standing by',
      guardianAlerts: [],
      growthEvents: [],
      doctrineCandidateCount: 0,
      archiveRecordCount: 0,
      currentObjective: 'Report for duty.',
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'commander_reminder',
      room: 'command',
    });
  });

  it('summarizes operational awareness without mutating source intelligence', () => {
    const awareness = buildOperationalAwareness({
      reportState: 'reported',
      currentRoom: 'war-room',
      recommendedRoom: 'observation',
      missionId: 'mission-026',
      missionPhase: 'Current station: War Room',
      missionIntelligence: missionPackage,
      guardianAlerts: [],
      growthEvents: [],
      doctrineCandidateCount: 0,
      archiveRecordCount: 0,
      currentObjective: 'Wait for evidence.',
    });

    expect(awareness).toEqual({
      location: 'War Room',
      whyHere: 'Commander recommends Observation.',
      whatRemains: 'Invalidation evidence',
      commanderExpectation: 'Wait for evidence.',
      headquartersActivity: 'Current station: War Room; sufficient intelligence; 0 Guardian alerts.',
    });
    expect(missionPackage.missingEvidence).toHaveLength(1);
  });
});
