import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MissionCompass, defaultMissionCompassSteps, formatMissionCompassStepState } from './MissionCompass';

describe('MissionCompass', () => {
  it('renders the mission room path with provided states', () => {
    const html = renderToStaticMarkup(<MissionCompass steps={[
      { id: 'ready-room', label: 'Ready Room', state: 'completed' },
      { id: 'observation', label: 'Observation', state: 'active' },
      { id: 'war-room', label: 'War Room', state: 'available' },
      { id: 'debrief', label: 'Debrief', state: 'locked' },
      { id: 'archive', label: 'Archive', state: 'locked' },
    ]} />);

    expect(html).toContain('aria-label="Mission compass"');
    expect(html).toContain('Ready Room');
    expect(html).toContain('Observation');
    expect(html).toContain('War Room');
    expect(html).toContain('Debrief');
    expect(html).toContain('Archive');
    expect(html).toContain('mission-compass-index');
    expect(html).toContain('mission-compass-label');
    expect(html).toContain('mission-compass-state');
    expect(html).toContain('data-compass-state="completed"');
    expect(html).toContain('data-compass-state="active"');
    expect(html).toContain('data-compass-state="available"');
    expect(html).toContain('data-compass-state="locked"');
  });

  it('ships a quiet default path for future shell integration', () => {
    expect(defaultMissionCompassSteps.map((step) => step.label)).toEqual([
      'Ready Room',
      'Observation',
      'War Room',
      'Debrief',
      'Archive',
    ]);
  });

  it('formats step states deterministically', () => {
    expect(formatMissionCompassStepState('completed')).toBe('Completed');
    expect(formatMissionCompassStepState('active')).toBe('Active');
    expect(formatMissionCompassStepState('available')).toBe('Available');
    expect(formatMissionCompassStepState('locked')).toBe('Locked');
  });
});
