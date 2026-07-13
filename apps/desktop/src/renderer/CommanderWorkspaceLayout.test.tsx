import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CommanderWorkspaceSnapshot } from './CommanderWorkspaceModel';
import { CommanderWorkspaceLayout } from './CommanderWorkspaceLayout';

const snapshot: CommanderWorkspaceSnapshot = {
  mode: 'active',
  missionId: 'mission-1',
  activeStage: 'observation',
  currentRoom: 'observation-room',
  recommendedRoom: 'observation-room',
  primaryAction: {
    id: 'complete-observation',
    label: 'Complete Observation',
    room: 'observation-room',
    reason: 'Collect visible evidence.',
    disabled: false,
  },
  blockers: [],
  priority: {
    id: 'priority-1',
    title: 'Complete Observation',
    severity: 'immediate',
    urgency: 'next',
    source: 'mission',
    explanation: 'Observation is the active station.',
  },
  health: {
    state: 'forming',
    summary: 'Headquarters evidence is forming.',
  },
  relationship: {
    summary: 'Commander relationship evidence is forming.',
    confidence: 'limited',
  },
  evidenceCount: 2,
};

describe('CommanderWorkspaceLayout', () => {
  it('renders a fixed Commander-first workspace with rail and secondary context', () => {
    const html = renderToStaticMarkup(
      <CommanderWorkspaceLayout
        snapshot={snapshot}
        commander={<div>Commander transmission</div>}
        commandRail={<div>Lifecycle rail</div>}
        secondaryContext={<div>Secondary details</div>}
        interactionController={<button type="button">Enter Observation Room</button>}
      />,
    );

    expect(html).toContain('class="commander-workspace"');
    expect(html).toContain('data-workspace-mode="active"');
    expect(html).toContain('aria-label="Commander mission header"');
    expect(html).toContain('aria-label="Commander conversation viewport"');
    expect(html).toContain('Commander transmission');
    expect(html).toContain('Lifecycle rail');
    expect(html).toContain('Secondary details');
    expect(html).toContain('Enter Observation Room');
  });

  it('does not render an empty secondary context container', () => {
    const html = renderToStaticMarkup(
      <CommanderWorkspaceLayout
        snapshot={snapshot}
        commander={<div>Commander transmission</div>}
        commandRail={<div>Lifecycle rail</div>}
      />,
    );

    expect(html).not.toContain('commander-workspace__secondary');
  });

  it('renders standby without exposing the internal mission id as the title', () => {
    const html = renderToStaticMarkup(
      <CommanderWorkspaceLayout
        snapshot={{
          ...snapshot,
          mode: 'standby',
          missionId: undefined,
          activeStage: 'missionCreation',
          currentRoom: 'command-center',
          recommendedRoom: 'command-center',
        }}
        commander={<div>Commander transmission</div>}
        commandRail={<div>Lifecycle rail</div>}
      />,
    );

    expect(html).toContain('Headquarters Standby');
    expect(html).toContain('No active mission');
    expect(html).not.toContain('mission-1');
  });
});
