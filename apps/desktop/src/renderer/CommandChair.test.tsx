import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CommandChair, formatCommandChairStatus, toggleCommandChairStatus } from './CommandChair';

describe('CommandChair', () => {
  it('renders the command chair placeholder with current operator command status', () => {
    const html = renderToStaticMarkup(<CommandChair />);

    expect(html).toContain('Command Chair');
    expect(html).toContain('Operator Command Status');
    expect(html).toContain('Command unassigned');
    expect(html).toContain('Operator not seated');
    expect(html).toContain('Unassigned');
    expect(html).toContain('Command');
    expect(html).toContain('Primary Action');
    expect(html).toContain('Assume Command');
  });

  it('renders symbolic command chair mission-active state details', () => {
    const html = renderToStaticMarkup(
      <CommandChair
        status="mission-active"
        operatorStatus="Operator seated"
        currentAuthority="Professional command"
        currentRoom="War Room"
        primaryAction="Return To Base"
      />,
    );

    expect(html).toContain('data-command-chair-status="mission-active"');
    expect(html).toContain('Mission command active');
    expect(html).toContain('Operator seated');
    expect(html).toContain('Professional command');
    expect(html).toContain('War Room');
    expect(html).toContain('Return To Base');
  });

  it('toggles local command status for development', () => {
    expect(toggleCommandChairStatus('unassigned')).toBe('occupied');
    expect(toggleCommandChairStatus('awaiting-report')).toBe('unassigned');
    expect(toggleCommandChairStatus('occupied')).toBe('unassigned');
    expect(toggleCommandChairStatus('mission-active')).toBe('unassigned');
    expect(toggleCommandChairStatus('locked')).toBe('unassigned');
  });

  it('formats command status labels deterministically', () => {
    expect(formatCommandChairStatus('unassigned')).toBe('Command unassigned');
    expect(formatCommandChairStatus('awaiting-report')).toBe('Awaiting operator report');
    expect(formatCommandChairStatus('occupied')).toBe('Command chair occupied');
    expect(formatCommandChairStatus('mission-active')).toBe('Mission command active');
    expect(formatCommandChairStatus('locked')).toBe('Command chair locked');
  });
});
