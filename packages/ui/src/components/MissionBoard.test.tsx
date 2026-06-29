import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { MissionBoard } from './MissionBoard';

describe('MissionBoard', () => {
  it('renders mission context without market outcome data', () => {
    const element = MissionBoard({
      missionId: 'mission-001',
      campaign: 'Foundation',
      objective: 'Hold command standard',
      condition: 'Standby',
      commandAuthority: 'Professional Joe',
      currentState: 'No mission loaded',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    const text = collectText(element);
    const elementTypes = collectElementTypes(element);

    expect(text).toContain('Mission Board');
    expect(text).toContain('mission-001');
    expect(text).toContain('Foundation');
    expect(text).toContain('Hold command standard');
    expect(text).toContain('Standby');
    expect(text).toContain('Professional Joe');
    expect(text).toContain('No mission loaded');
    expect(text).toContain('2026-01-01T00:00:00.000Z');
    expect(text).not.toContain('PnL');
    expect(element.props['data-read-only']).toBe('true');
    expect(elementTypes).not.toContain('button');
    expect(elementTypes).not.toContain('input');
    expect(elementTypes).not.toContain('form');
  });
});

function collectText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(collectText).join(' ');

  const element = node as ReactElement<{ children?: ReactNode }>;
  return collectText(element.props.children);
}

function collectElementTypes(node: ReactNode): string[] {
  if (node === null || node === undefined || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(collectElementTypes);

  const element = node as ReactElement<{ children?: ReactNode }>;
  const type = typeof element.type === 'string' ? [element.type] : [];
  return [...type, ...collectElementTypes(element.props.children)];
}
