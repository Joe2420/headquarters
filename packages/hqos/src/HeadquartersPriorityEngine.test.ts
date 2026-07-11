import type { Mission } from '@headquarters/shared';
import { describe, expect, it } from 'vitest';
import {
  getBlockingPriority,
  getHeadquartersPriorities,
  getHighestPriority,
  getPriorityCountBySeverity,
  getPriorityExplanation,
  getRecommendedRoomFromPriorities,
  getTopPriorities,
} from './HeadquartersPriorityEngine';
import { projectMissionLifecycle } from './MissionLifecycleProjection';

const mission: Mission = {
  id: 'mission-001',
  codename: 'Foundation Patrol',
  state: 'observation',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('HeadquartersPriorityEngine', () => {
  it('returns a valid standby priority when no active work exists', () => {
    const priority = getHighestPriority({
      lifecycle: projectMissionLifecycle(),
    });

    expect(priority.id).toBe('priority:mission:create-mission');
    expect(priority.recommendedRoom).toBe('mission-room');
    expect(priority.recommendedAction).toBe('Create Mission');
  });

  it('ranks Guardian lockout above current mission continuation', () => {
    const priority = getHighestPriority({
      lifecycle: projectMissionLifecycle(mission),
      guardianAlerts: [{
        id: 'guardian-alert-lockout',
        title: 'Guardian lockout',
        message: 'Trading authorization suspended.',
        priority: 'critical',
        sourceId: 'lockout-rule',
      }],
    });

    expect(priority.source).toBe('guardian');
    expect(priority.severity).toBe('critical');
    expect(priority.blocking).toBe(true);
    expect(priority.recommendedRoom).toBe('war-room');
    expect(getRecommendedRoomFromPriorities({
      lifecycle: projectMissionLifecycle(mission),
      guardianAlerts: [{
        id: 'guardian-alert-lockout',
        title: 'Guardian lockout',
        message: 'Trading authorization suspended.',
        priority: 'critical',
        sourceId: 'lockout-rule',
      }],
    })).toBe('war-room');
  });

  it('keeps incomplete current lifecycle work above optional doctrine review', () => {
    const priorities = getHeadquartersPriorities({
      lifecycle: projectMissionLifecycle(mission),
      doctrineCandidates: [{
        id: 'doctrine-candidate-001',
        title: 'Review patience rule',
        rationale: 'Journal evidence suggests a repeatable rule.',
        evidenceRecordIds: ['journal-001'],
      }],
    });

    expect(priorities[0]?.source).toBe('mission');
    expect(priorities[0]?.severity).toBe('blocking');
    expect(priorities[1]?.source).toBe('doctrine');
  });

  it('removes resolved priorities and deduplicates repeated source ids', () => {
    const priorities = getHeadquartersPriorities({
      lifecycle: projectMissionLifecycle(mission),
      doctrineCandidates: [
        {
          id: 'doctrine-candidate-001',
          title: 'Review patience rule',
          rationale: 'Journal evidence suggests a repeatable rule.',
          evidenceRecordIds: ['journal-001'],
        },
        {
          id: 'doctrine-candidate-001',
          title: 'Review patience rule',
          rationale: 'Duplicate event should not create duplicate priority.',
          evidenceRecordIds: ['journal-001'],
        },
        {
          id: 'doctrine-candidate-resolved',
          title: 'Resolved doctrine candidate',
          rationale: 'Already handled.',
          evidenceRecordIds: ['journal-002'],
          resolved: true,
        },
      ],
    });

    expect(priorities.filter((priority) => priority.id === 'priority:doctrine:doctrine-candidate-001')).toHaveLength(1);
    expect(priorities.some((priority) => priority.id.includes('resolved'))).toBe(false);
  });

  it('supports top priority selectors, blocking lookup, explanations, and severity counts', () => {
    const input = {
      lifecycle: projectMissionLifecycle(mission),
      guardianAlerts: [{
        id: 'guardian-alert-risk',
        title: 'Risk boundary missing',
        message: 'Risk boundary must be declared.',
        priority: 'high' as const,
        sourceId: 'missing-risk-boundary',
      }],
      archiveMilestoneCount: 3,
    };

    const top = getTopPriorities(input, 2);
    const blocking = getBlockingPriority(input);
    const counts = getPriorityCountBySeverity(input);

    expect(top).toHaveLength(2);
    expect(blocking?.source).toBe('guardian');
    expect(getPriorityExplanation(top[0]!)).toContain(top[0]!.title);
    expect(counts.blocking).toBeGreaterThanOrEqual(2);
    expect(counts.informational).toBe(1);
  });
});
