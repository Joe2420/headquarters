import { describe, expect, it } from 'vitest';
import type { CommanderWorkspaceSnapshot } from './CommanderWorkspaceModel';
import { buildCommanderWorkspaceAccessibilityContract } from './CommanderWorkspaceAccessibility';

const snapshot: CommanderWorkspaceSnapshot = {
  mode: 'blocked',
  activeStage: 'authorization',
  currentRoom: 'war-room',
  recommendedRoom: 'war-room',
  primaryAction: {
    id: 'resolve-guardian',
    label: 'Resolve Guardian Restriction',
    room: 'war-room',
    reason: 'Guardian has blocked authorization.',
    disabled: false,
  },
  blockers: [],
  priority: {
    id: 'priority-guardian',
    title: 'Guardian restriction',
    severity: 'blocking',
    urgency: 'now',
    source: 'guardian',
    explanation: 'Risk threshold exceeded.',
  },
  health: {
    state: 'degraded',
    summary: 'Guardian stability requires attention.',
  },
  relationship: {
    summary: 'Evidence is forming.',
    confidence: 'limited',
  },
  evidenceCount: 3,
};

describe('CommanderWorkspaceAccessibility', () => {
  it('creates stable labels and responsive classes from the workspace snapshot', () => {
    const contract = buildCommanderWorkspaceAccessibilityContract(snapshot);

    expect(contract.rootLabel).toBe('Commander workspace: blocked');
    expect(contract.railLabel).toContain('war-room');
    expect(contract.responsiveClasses).toContain('commander-workspace--blocked');
    expect(contract.responsiveClasses).toContain('commander-workspace--room-war-room');
  });

  it('declares the workspace safe for reduced-motion rendering', () => {
    expect(buildCommanderWorkspaceAccessibilityContract(snapshot).reducedMotionSafe).toBe(true);
  });
});
