import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CommandChair, formatCommandChairStatus, toggleCommandChairStatus } from './CommandChair';

describe('CommandChair', () => {
  it('renders the command chair placeholder with current operator command status', () => {
    const html = renderToStaticMarkup(<CommandChair />);

    expect(html).toContain('Command Chair');
    expect(html).toContain('Operator Command Status');
    expect(html).toContain('Command unassigned');
    expect(html).toContain('Assume Command');
  });

  it('toggles local command status for development', () => {
    expect(toggleCommandChairStatus('unassigned')).toBe('professional-command');
    expect(toggleCommandChairStatus('professional-command')).toBe('unassigned');
  });

  it('formats command status labels deterministically', () => {
    expect(formatCommandChairStatus('unassigned')).toBe('Command unassigned');
    expect(formatCommandChairStatus('professional-command')).toBe('Professional Joe in command');
  });
});
