import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('Desktop shell', () => {
  it('renders the visible shell placeholders', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('Headquarters');
    expect(html).toContain('Command Center');
    expect(html).toContain('Desktop shell online.');
    expect(html).toContain('Status');
    expect(html).toContain('Database');
  });
});
