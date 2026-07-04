import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GuidedRoom } from './GuidedRoom';

describe('GuidedRoom', () => {
  it('renders the standard focused room sequence without Commander duplication', () => {
    const html = renderToStaticMarkup(
      <GuidedRoom
        id="test-room"
        identity="test-identity"
        atmosphere="test-atmosphere"
        title="Test Room"
        useCase="Understand the room."
        objective="Hold one objective."
        primaryAction={<strong>Continue</strong>}
        workspace={<section>Workspace</section>}
        timeline={<section>History</section>}
        secondaryTools={<section>Tools</section>}
      />,
    );

    expect(html).toContain('class="guided-room room-layout"');
    expect(html).toContain('data-room-id="test-room"');
    expect(html).toContain('data-room-identity="test-identity"');
    expect(html).toContain('data-room-atmosphere="test-atmosphere"');
    expect(html).toContain('data-room-atmosphere-layer="command"');
    expect(html).toContain('Understand the room.');
    expect(html).not.toContain('Commander leads first.');
    expect(html).toContain('Primary Action');
    expect(html).toContain('Timeline / History');
    expect(html).toContain('Secondary Tools');
  });
});
