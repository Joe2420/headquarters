import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CommanderInteractionController, getOperationalActionLabel } from './CommanderInteractionController';

describe('CommanderInteractionController', () => {
  it('renders one operational primary action instead of a generic continue button', () => {
    const html = renderToStaticMarkup(
      <CommanderInteractionController
        action={{
          id: 'enter-war-room',
          label: 'Enter War Room',
          room: 'war-room',
          reason: 'Observation evidence is sufficient.',
          disabled: false,
        }}
      />,
    );

    expect(html).toContain('Enter War Room');
    expect(html).not.toContain('>Continue<');
  });

  it('falls back safely when a generic continue label is provided', () => {
    expect(getOperationalActionLabel('Continue')).toBe('Await Commander Order');
  });

  it('disables primary and choices while busy to prevent duplicate submissions', () => {
    const html = renderToStaticMarkup(
      <CommanderInteractionController
        busy
        action={{
          id: 'request-authorization',
          label: 'Request Authorization',
          room: 'war-room',
          reason: 'War Room authorization is pending.',
          disabled: false,
        }}
        choices={[{ id: 'yes', label: 'Yes' }]}
      />,
    );

    expect(html).toContain('data-busy="true"');
    expect(html.match(/disabled=""/g)?.length).toBe(2);
  });
});
