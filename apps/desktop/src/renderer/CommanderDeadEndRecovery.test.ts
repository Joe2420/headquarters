import { describe, expect, it } from 'vitest';

import { buildCommanderDeadEndRecovery } from './CommanderDeadEndRecovery';

describe('CommanderDeadEndRecovery', () => {
  it('returns deterministic room-specific recovery guidance', () => {
    const recovery = buildCommanderDeadEndRecovery({
      room: 'ready-room',
      missionState: 'briefing',
      transmission: 'what now',
    });

    expect(recovery.id).toBe('recovery:ready-room:briefing');
    expect(recovery.message).toContain('Mission state: briefing.');
    expect(recovery.nextAction).toContain('briefing question');
  });

  it('keeps recovery guidance inside the active room boundary', () => {
    const recovery = buildCommanderDeadEndRecovery({
      room: 'war-room',
      missionState: 'authorization',
      transmission: 'I am unsure',
    });

    expect(recovery.room).toBe('war-room');
    expect(recovery.message).toContain('authorization reasoning');
  });
});
