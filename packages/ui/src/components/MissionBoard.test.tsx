import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { MissionBoard } from './MissionBoard';

describe('MissionBoard', () => {
  it('renders mission context without market outcome data', () => {
    const element = MissionBoard({
      campaign: 'Foundation',
      objective: 'Hold command standard',
      condition: 'Standby',
      commandAuthority: 'Professional Joe',
      currentState: 'No mission loaded',
    });
    const text = collectText(element);

    expect(text).toContain('Mission Board');
    expect(text).toContain('Foundation');
    expect(text).toContain('Hold command standard');
    expect(text).toContain('Standby');
    expect(text).toContain('Professional Joe');
    expect(text).toContain('No mission loaded');
    expect(text).not.toContain('PnL');
  });
});

function collectText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(collectText).join(' ');

  const element = node as ReactElement<{ children?: ReactNode }>;
  return collectText(element.props.children);
}
