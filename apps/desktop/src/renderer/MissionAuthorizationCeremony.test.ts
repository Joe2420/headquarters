import { describe, expect, it } from 'vitest';
import {
  markAuthorizationCeremonyComplete,
  resolveMissionAuthorizationCeremony,
} from './MissionAuthorizationCeremony';

describe('MissionAuthorizationCeremony', () => {
  it('triggers the authorization ceremony once for approved decisions', () => {
    const result = resolveMissionAuthorizationCeremony({
      missionId: 'mission-001',
      decision: 'approved',
      ceremonyPlayed: false,
      videoAvailable: true,
    });

    expect(result.state).toBe('authorization_ceremony');
    expect(result.shouldPlayCeremony).toBe(true);
    expect(result.mayDeploy).toBe(true);
    expect(result.commanderLines).toEqual(['Authorization accepted.', 'Mission deployment active.']);

    const replay = resolveMissionAuthorizationCeremony({
      ...markAuthorizationCeremonyComplete({
        missionId: 'mission-001',
        decision: 'approved',
        ceremonyPlayed: false,
      }),
      videoAvailable: true,
    });

    expect(replay.state).toBe('deployed');
    expect(replay.shouldPlayCeremony).toBe(false);
  });

  it('does not trigger the ceremony for denied authorization', () => {
    const result = resolveMissionAuthorizationCeremony({
      missionId: 'mission-001',
      decision: 'denied',
      ceremonyPlayed: false,
    });

    expect(result.state).toBe('authorization_denied');
    expect(result.shouldPlayCeremony).toBe(false);
    expect(result.mayDeploy).toBe(false);
  });

  it('uses deterministic fallback behavior for reduced motion or missing assets', () => {
    expect(resolveMissionAuthorizationCeremony({
      missionId: 'mission-001',
      decision: 'approved',
      ceremonyPlayed: false,
      reducedMotion: true,
    }).state).toBe('authorization_approved');

    expect(resolveMissionAuthorizationCeremony({
      missionId: 'mission-001',
      decision: 'approved',
      ceremonyPlayed: false,
      videoAvailable: false,
    }).state).toBe('authorization_approved');
  });
});
