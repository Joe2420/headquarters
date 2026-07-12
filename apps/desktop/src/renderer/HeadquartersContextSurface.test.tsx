import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HeadquartersContextSurface } from './HeadquartersContextSurface';

describe('HeadquartersContextSurface', () => {
  it('renders normal context while hiding advanced diagnostics by default', () => {
    const html = renderToStaticMarkup(
      <HeadquartersContextSurface
        sections={[
          {
            id: 'activity',
            title: 'Activity',
            items: [{ id: 'mission', title: 'Mission Created', summary: 'Mission file opened.', room: 'Mission Room' }],
          },
          {
            id: 'diagnostics',
            title: 'Diagnostics',
            advanced: true,
            items: [{ id: 'db', title: 'Database', summary: 'Connected.' }],
          },
        ]}
      />,
    );

    expect(html).toContain('Mission Created');
    expect(html).not.toContain('Database');
  });

  it('can reveal advanced diagnostics when explicitly enabled', () => {
    const html = renderToStaticMarkup(
      <HeadquartersContextSurface
        showAdvanced
        sections={[{
          id: 'diagnostics',
          title: 'Diagnostics',
          advanced: true,
          items: [{ id: 'db', title: 'Database', summary: 'Connected.' }],
        }]}
      />,
    );

    expect(html).toContain('Database');
  });

  it('renders a calm empty state', () => {
    const html = renderToStaticMarkup(<HeadquartersContextSurface sections={[]} />);

    expect(html).toContain('No secondary context requires attention.');
  });
});
