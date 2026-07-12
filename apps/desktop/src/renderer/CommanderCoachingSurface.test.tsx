import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CommanderWorkspaceSnapshot } from './CommanderWorkspaceModel';
import { CommanderCoachingSurface } from './CommanderCoachingSurface';

const snapshot: CommanderWorkspaceSnapshot = {
  mode: 'active',
  activeStage: 'debrief',
  currentRoom: 'debrief-theater',
  recommendedRoom: 'debrief-theater',
  primaryAction: {
    id: 'enter-debrief',
    label: 'Enter Debrief Theater',
    room: 'debrief-theater',
    reason: 'Mission returned.',
    disabled: false,
  },
  blockers: [],
  priority: {
    id: 'priority-debrief',
    title: 'Enter Debrief Theater',
    severity: 'immediate',
    urgency: 'next',
    source: 'mission',
    explanation: 'Debrief is required.',
  },
  health: {
    state: 'healthy',
    summary: 'Headquarters is healthy.',
  },
  relationship: {
    summary: 'Preparation quality is improving across recent missions.',
    confidence: 'forming',
  },
  evidenceCount: 5,
};

describe('CommanderCoachingSurface', () => {
  it('renders explainable coaching when evidence exists', () => {
    const html = renderToStaticMarkup(<CommanderCoachingSurface snapshot={snapshot} />);

    expect(html).toContain('Evidence-based coaching');
    expect(html).toContain('Preparation quality is improving');
    expect(html).toContain('forming');
  });

  it('does not make coaching claims without evidence', () => {
    const html = renderToStaticMarkup(
      <CommanderCoachingSurface
        snapshot={{
          ...snapshot,
          evidenceCount: 0,
          relationship: {
            summary: 'This should not be claimed.',
            confidence: 'limited',
          },
        }}
      />,
    );

    expect(html).toContain('Evidence still forming');
    expect(html).not.toContain('This should not be claimed.');
  });
});
