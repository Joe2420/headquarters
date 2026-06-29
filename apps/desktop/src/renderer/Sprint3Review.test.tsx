import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App, CommandCenterPlaceholder, getPrimaryNavigationItems, reportForDuty } from './App';

describe('Sprint 3 desktop experience review', () => {
  it('keeps the first-launch shell coherent through Report for Duty and Command Center surfaces', () => {
    const firstLaunchHtml = renderToStaticMarkup(<App />);
    const commandCenterHtml = renderToStaticMarkup(<CommandCenterPlaceholder />);

    expect(firstLaunchHtml).toContain('Security Checkpoint');
    expect(firstLaunchHtml).toContain('REPORT FOR DUTY');
    expect(firstLaunchHtml).toContain('HQOS Status');
    expect(firstLaunchHtml).toContain('aria-label="Primary"');
    expect(reportForDuty('security-checkpoint')).toEqual({
      from: 'security-checkpoint',
      to: 'command-center',
      changed: true,
    });

    expect(commandCenterHtml).toContain('data-layout="command-center"');
    expect(commandCenterHtml).toContain('Mission Board');
    expect(commandCenterHtml).toContain('Create Mission');
    expect(commandCenterHtml).toContain('Mission Closing');
    expect(commandCenterHtml).toContain('Mission Debrief');
    expect(commandCenterHtml).toContain('Archive Placeholder');
  });

  it('keeps Sprint 3 navigation lightweight and non-routing', () => {
    const navigationItems = getPrimaryNavigationItems('command');

    expect(navigationItems.map((item) => item.id)).toEqual(['command', 'missions', 'archive', 'settings']);
    expect(navigationItems.filter((item) => item.active)).toEqual([
      { id: 'command', label: 'Command', active: true },
    ]);
  });
});
