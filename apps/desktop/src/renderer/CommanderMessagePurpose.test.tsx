import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  CommanderPurposeMessage,
  getCommanderMessagePurposeClass,
  type CommanderMessagePurpose,
} from './CommanderMessagePurpose';

const purposes: readonly CommanderMessagePurpose[] = [
  'briefing',
  'guidance',
  'warning',
  'acknowledgement',
  'transition',
  'debrief',
  'recognition',
  'interruption',
];

describe('CommanderMessagePurpose', () => {
  it.each(purposes)('renders semantic purpose metadata for %s messages', (purpose) => {
    const html = renderToStaticMarkup(
      <CommanderPurposeMessage purpose={purpose} title="Commander">
        Mission received.
      </CommanderPurposeMessage>,
    );

    expect(html).toContain(`data-message-purpose="${purpose}"`);
    expect(html).toContain('Mission received.');
  });

  it('returns stable purpose classes for styling adapters', () => {
    expect(getCommanderMessagePurposeClass('warning')).toBe('commander-purpose-message--warning');
  });
});
