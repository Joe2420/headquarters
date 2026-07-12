import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App, CommandCenterPlaceholder, getPrimaryNavigationItems, reportForDuty } from './App';

describe('Sprint 3 desktop experience review', () => {
  it('keeps the first-launch shell coherent through Report for Duty and Command Center surfaces', () => {
    const firstLaunchHtml = renderToStaticMarkup(<App />);
    const commandCenterHtml = renderToStaticMarkup(<CommandCenterPlaceholder />);

    expect(firstLaunchHtml).toContain('Security Checkpoint');
    expect(firstLaunchHtml).toContain('Commander Chat');
    expect(firstLaunchHtml).toContain('Current Room');
    expect(firstLaunchHtml).toContain('Report for Duty');
    expect(firstLaunchHtml).toContain('Mission Command');
    expect(firstLaunchHtml).toContain('Technical diagnostics');
    expect(firstLaunchHtml).toContain('aria-label="Primary"');
    expect(reportForDuty('security-checkpoint')).toEqual({
      from: 'security-checkpoint',
      to: 'command-center',
      changed: true,
    });

    expect(commandCenterHtml).toContain('data-layout="command-center"');
    expect(commandCenterHtml).toContain('Commander Briefing');
    expect(commandCenterHtml).toContain('aria-label="Commander briefing"');
    expect(commandCenterHtml).toContain('aria-label="Morning Brief"');
    expect(commandCenterHtml).toContain('aria-label="Intelligent Situation Board"');
    expect(commandCenterHtml).toContain('Create Mission');
  });

  it('keeps Sprint 3 navigation lightweight while exposing stabilized rooms', () => {
    const navigationItems = getPrimaryNavigationItems('command');

    expect(navigationItems.map((item) => item.id)).toEqual([
      'command',
      'missions',
      'ready',
      'observation',
      'war',
      'debrief',
      'journal',
      'academy',
      'doctrine',
      'guardian',
      'intelligence',
      'archive',
      'settings',
    ]);
    expect(navigationItems.filter((item) => item.active)).toEqual([
      { id: 'command', label: 'Commander', section: 'commander', active: true },
    ]);
  });
});
