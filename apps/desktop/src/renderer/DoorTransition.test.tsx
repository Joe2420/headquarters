import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DoorTransition, formatDoorTransitionState } from './DoorTransition';

describe('DoorTransition', () => {
  it('renders room transition state and label without routing behavior', () => {
    const html = renderToStaticMarkup(
      <DoorTransition
        fromRoom="ready-room"
        toRoom="observation"
        transitionState="opening"
        label="Entering Observation"
      />,
    );

    expect(html).toContain('aria-label="Room transition"');
    expect(html).toContain('data-from-room="ready-room"');
    expect(html).toContain('data-to-room="observation"');
    expect(html).toContain('data-transition-state="opening"');
    expect(html).toContain('door-transition-opening');
    expect(html).toContain('Entering Observation');
    expect(html).toContain('Opening');
  });

  it('formats all transition states deterministically', () => {
    expect(formatDoorTransitionState('idle')).toBe('Idle');
    expect(formatDoorTransitionState('opening')).toBe('Opening');
    expect(formatDoorTransitionState('open')).toBe('Open');
    expect(formatDoorTransitionState('closing')).toBe('Closing');
    expect(formatDoorTransitionState('complete')).toBe('Complete');
  });
});
