import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CommanderWorkspaceSnapshot } from './CommanderWorkspaceModel';
import { LiveMissionCommandRail } from './LiveMissionCommandRail';

const baseSnapshot: CommanderWorkspaceSnapshot = {
  mode: 'active',
  missionId: 'mission-1',
  activeStage: 'authorization',
  currentRoom: 'war-room',
  recommendedRoom: 'war-room',
  primaryAction: {
    id: 'request-authorization',
    label: 'Request Authorization',
    room: 'war-room',
    reason: 'War Room owns decision authority.',
    disabled: false,
  },
  blockers: [],
  priority: {
    id: 'priority-authorization',
    title: 'Request Authorization',
    severity: 'immediate',
    urgency: 'next',
    source: 'mission',
    explanation: 'Authorization evidence is ready for review.',
  },
  health: {
    state: 'healthy',
    summary: 'Headquarters condition is healthy for the current operation.',
  },
  relationship: {
    summary: 'Commander confidence is forming.',
    confidence: 'forming',
  },
  evidenceCount: 4,
};

describe('LiveMissionCommandRail', () => {
  it('renders lifecycle, room, primary action, priority, and health context', () => {
    const html = renderToStaticMarkup(<LiveMissionCommandRail snapshot={baseSnapshot} />);

    expect(html).toContain('data-workspace-mode="active"');
    expect(html).toContain('Authorization');
    expect(html).toContain('War Room');
    expect(html).toContain('Request Authorization');
    expect(html).toContain('Authorization evidence is ready for review.');
    expect(html).toContain('Headquarters condition is healthy');
  });

  it('surfaces blockers when authoritative snapshot provides them', () => {
    const html = renderToStaticMarkup(
      <LiveMissionCommandRail
        snapshot={{
          ...baseSnapshot,
          mode: 'blocked',
          blockers: [{
            id: 'guardian-lockout',
            label: 'Guardian lockout',
            source: 'guardian',
            reason: 'Risk threshold exceeded.',
          }],
        }}
      />,
    );

    expect(html).toContain('Commander Holding');
    expect(html).toContain('Guardian lockout');
    expect(html).toContain('Risk threshold exceeded.');
  });
});
