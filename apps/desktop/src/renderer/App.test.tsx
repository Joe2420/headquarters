import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App, CommandCenter, CommandCenterPlaceholder, createLocalMission, reportForDuty } from './App';

describe('Desktop shell', () => {
  it('renders the security checkpoint startup surface', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('Headquarters');
    expect(html).toContain('Security Checkpoint');
    expect(html).toContain('REPORT FOR DUTY');
    expect(html).toContain('Status');
    expect(html).toContain('Database');
  });

  it('transitions from security checkpoint to command center', () => {
    expect(reportForDuty('security-checkpoint')).toBe('command-center');
  });

  it('keeps command center phase stable after reporting for duty', () => {
    expect(reportForDuty('command-center')).toBe('command-center');
  });

  it('renders the Mission Board placeholder in the command center', () => {
    const html = renderToStaticMarkup(<CommandCenterPlaceholder />);

    expect(html).toContain('Mission Board');
    expect(html).toContain('Create Mission');
    expect(html).toContain('Awaiting mission creation');
    expect(html).toContain('No mission loaded');
  });

  it('creates a local mission from operator input', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    expect(mission).toEqual({
      id: 'mission-001',
      campaign: 'Foundation Patrol',
      objective: 'Hold the line',
      condition: 'Briefing',
      commandAuthority: 'Professional command',
      currentState: 'briefing',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('does not create a local mission without codename and objective', () => {
    expect(createLocalMission({ codename: '', objective: 'Hold the line' })).toBeUndefined();
    expect(createLocalMission({ codename: 'Foundation Patrol', objective: ' ' })).toBeUndefined();
  });

  it('renders an active mission on the Mission Board', () => {
    const mission = createLocalMission(
      {
        codename: 'Foundation Patrol',
        objective: 'Hold the line',
      },
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'mission-001',
      },
    );

    if (!mission) throw new Error('Expected local mission to be created');

    const html = renderToStaticMarkup(<CommandCenter activeMission={mission} />);

    expect(html).toContain('Foundation Patrol');
    expect(html).toContain('Hold the line');
    expect(html).toContain('Briefing');
    expect(html).toContain('Professional command');
  });
});
