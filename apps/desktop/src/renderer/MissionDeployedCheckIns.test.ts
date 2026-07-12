import { describe, expect, it } from 'vitest';
import {
  canRecordDeployedCheckIn,
  createDeployedMissionCheckIn,
  createDeployedMissionPresence,
  markDeployedPlanConcluded,
  shouldThrottleDeployedCheckIn,
} from './MissionDeployedCheckIns';

describe('MissionDeployedCheckIns', () => {
  it('renders active deployed mission identity and invalidation context', () => {
    const presence = createDeployedMissionPresence({
      missionId: 'mission-001',
      codename: 'Patience Watch',
      objective: 'Wait for valid continuation.',
      authorizationReasoning: 'Breakout confirmed by evidence.',
      activeInvalidation: 'Back below VWAP.',
      riskLimit: '1%',
      currentVisibleCondition: 'Price is holding above structure.',
      createdAt: '2026-07-10T10:00:00.000Z',
      deployedAt: '2026-07-10T10:04:00.000Z',
      now: '2026-07-10T10:07:00.000Z',
    });

    expect(presence).toMatchObject({
      codename: 'Patience Watch',
      deploymentStatus: 'deployed_stable',
      activeInvalidation: 'Back below VWAP.',
      riskLimit: '1%',
      elapsedLabel: '3 minutes deployed',
      operationalState: 'quiet',
      checkInGuidance: 'No check-in required. Observation silence remains valid work unless conditions change.',
    });
  });

  it('creates material-change reports without duplicating unchanged reports', () => {
    const checkIn = createDeployedMissionCheckIn({
      missionId: 'mission-001',
      id: 'check-in-001',
      createdAt: '2026-07-10T10:05:00.000Z',
      draft: {
        visibleCondition: 'Structure shifted lower.',
        structureChanged: 'Lower high formed.',
        planValidity: 'Plan remains valid until VWAP breaks.',
      },
    });

    expect(checkIn?.status).toBe('deployed_changed');
    expect(createDeployedMissionCheckIn({
      missionId: 'mission-001',
      previous: checkIn ? [checkIn] : [],
      draft: {
        visibleCondition: 'Structure shifted lower.',
        structureChanged: 'Lower high formed.',
        planValidity: 'Plan remains valid until VWAP breaks.',
      },
    })).toBeUndefined();
  });

  it('detects invalidation and return requests deterministically', () => {
    expect(createDeployedMissionCheckIn({
      missionId: 'mission-001',
      draft: {
        visibleCondition: 'Price is near invalidation.',
        invalidationApproaching: 'Approaching declared invalidation.',
      },
    })?.status).toBe('invalidation_near');

    expect(createDeployedMissionCheckIn({
      missionId: 'mission-001',
      draft: {
        visibleCondition: 'Mission should close.',
        continueOrReturn: 'Return to base.',
      },
    })?.status).toBe('return_requested');
  });

  it('throttles repeated check-ins by time window', () => {
    expect(shouldThrottleDeployedCheckIn({
      lastCheckInAt: '2026-07-10T10:00:00.000Z',
      now: '2026-07-10T10:01:00.000Z',
      throttleMs: 120000,
    })).toBe(true);

    expect(shouldThrottleDeployedCheckIn({
      lastCheckInAt: '2026-07-10T10:00:00.000Z',
      now: '2026-07-10T10:03:00.000Z',
      throttleMs: 120000,
    })).toBe(false);
  });

  it('blocks check-ins while Commander has a pending question', () => {
    expect(canRecordDeployedCheckIn({
      lastCheckInAt: '2026-07-10T10:00:00.000Z',
      now: '2026-07-10T10:03:00.000Z',
      commanderQuestionPending: true,
    })).toEqual({ allowed: false, reason: 'commander_question_pending' });
  });

  it('records explicit plan conclusion before Return to Base', () => {
    const conclusion = markDeployedPlanConcluded({
      missionId: 'mission-001',
      createdAt: '2026-07-10T10:20:00.000Z',
    });

    expect(conclusion).toMatchObject({
      missionId: 'mission-001',
      status: 'return_requested',
      visibleCondition: 'Plan concluded by operator.',
      planValidity: 'Plan concluded.',
      createdAt: '2026-07-10T10:20:00.000Z',
    });
  });
});
