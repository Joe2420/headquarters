import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  RoomAtmosphere,
  normalizeRoomAtmosphereVariant,
  roomAtmosphereVariants,
} from './RoomAtmosphere';

describe('RoomAtmosphere', () => {
  it('normalizes every required room atmosphere variant', () => {
    expect(roomAtmosphereVariants).toEqual([
      'command',
      'ready-room',
      'observation',
      'war-room',
      'debrief',
      'archive',
      'journal',
      'doctrine',
      'academy',
      'guardian',
      'intelligence',
    ]);
    expect(normalizeRoomAtmosphereVariant('ready')).toBe('ready-room');
    expect(normalizeRoomAtmosphereVariant('war')).toBe('war-room');
    expect(normalizeRoomAtmosphereVariant('unknown-room')).toBe('command');
  });

  it.each(roomAtmosphereVariants)('renders the %s atmosphere layer without blocking interaction', (variant) => {
    const html = renderToStaticMarkup(<RoomAtmosphere variant={variant} />);

    expect(html).toContain(`room-atmosphere--${variant}`);
    expect(html).toContain(`data-room-atmosphere-layer="${variant}"`);
    expect(html).toContain('data-reduced-motion-safe="true"');
    expect(html).toContain('aria-hidden="true"');
  });

  it('renders calm Observation Room ambient systems', () => {
    const html = renderToStaticMarkup(<RoomAtmosphere variant="observation" />);

    expect(html).toContain('data-room-atmosphere-element="radar-sweep"');
    expect(html).toContain('data-room-atmosphere-element="horizon-drift"');
    expect(html).toContain('data-room-atmosphere-element="scan-lines"');
  });

  it('renders War Room tactical atmosphere elements', () => {
    const html = renderToStaticMarkup(<RoomAtmosphere variant="war-room" />);

    expect(html).toContain('data-room-atmosphere-element="authorization-indicator"');
    expect(html).toContain('data-room-atmosphere-element="hud-grid"');
    expect(html).toContain('data-room-atmosphere-element="countdown-rails"');
  });

  it('renders Debrief Theater replay atmosphere elements', () => {
    const html = renderToStaticMarkup(<RoomAtmosphere variant="debrief" />);

    expect(html).toContain('data-room-atmosphere-element="theater-light"');
    expect(html).toContain('data-room-atmosphere-element="replay-timeline"');
  });

  it('renders Archive Vault atmosphere elements', () => {
    const html = renderToStaticMarkup(<RoomAtmosphere variant="archive" />);

    expect(html).toContain('data-room-atmosphere-element="vault-seal"');
    expect(html).toContain('data-room-atmosphere-element="record-lines"');
  });
});
