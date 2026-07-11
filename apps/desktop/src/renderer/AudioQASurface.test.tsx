import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createAudioEvent } from './AudioEvents';
import { muteAllAudioPreferences } from './AudioPreferences';
import { AudioQASurface } from './AudioQASurface';
import { getCommanderCeremonyDialogue } from './CommanderCeremonyDialogue';
import { buildCommanderCeremonyAudioEvent } from './MissionCeremonyAudio';

describe('AudioQASurface', () => {
  it('renders a calm empty state', () => {
    const html = renderToStaticMarkup(<AudioQASurface events={[]} />);

    expect(html).toContain('Audio cue inspection');
    expect(html).toContain('No pending audio events.');
  });

  it('renders recent audio event candidates for QA inspection', () => {
    const event = createAudioEvent({
      type: 'transition_cue',
      cueId: 'transition_start',
      channel: 'transition',
      createdAt: '2026-07-04T10:00:00.000Z',
      room: 'observation',
      reason: 'QA inspection test.',
    });
    const html = renderToStaticMarkup(<AudioQASurface events={[event]} />);

    expect(html).toContain('Recent audio events');
    expect(html).toContain('transition_start');
    expect(html).toContain('transition / normal / observation');
  });

  it('shows disabled or muted preference state', () => {
    const html = renderToStaticMarkup(<AudioQASurface events={[]} preferences={muteAllAudioPreferences()} />);

    expect(html).toContain('Preference state: Audio muted');
  });

  it('renders Commander ceremony audio candidates for QA inspection', () => {
    const event = buildCommanderCeremonyAudioEvent(getCommanderCeremonyDialogue('authorization_granted'));
    const html = renderToStaticMarkup(<AudioQASurface events={event ? [event] : []} />);

    expect(html).toContain('ceremony_authorization_granted');
    expect(html).toContain('ceremony / high / war-room');
  });
});
