import { describe, expect, it } from 'vitest';
import { buildCommanderConversationDisclosure, type CommanderConversationEntry } from './CommanderConversationDisclosure';

const entries: readonly CommanderConversationEntry[] = [
  { id: 'ready-1', phase: 'briefing', text: 'State the objective.', completed: true },
  { id: 'ready-2', phase: 'briefing', text: 'Describe the market.', completed: true },
  { id: 'obs-1', phase: 'observation', text: 'Report only visible evidence.' },
  { id: 'warn-1', phase: 'briefing', text: 'High impact news active.', purpose: 'warning', completed: true },
];

describe('CommanderConversationDisclosure', () => {
  it('keeps the active phase expanded with all active entries', () => {
    const sections = buildCommanderConversationDisclosure({ entries, activePhase: 'observation' });
    const observation = sections.find((section) => section.phase === 'observation');

    expect(observation?.expanded).toBe(true);
    expect(observation?.entries.map((entry) => entry.text)).toEqual(['Report only visible evidence.']);
  });

  it('collapses completed phases but keeps warnings visible', () => {
    const sections = buildCommanderConversationDisclosure({ entries, activePhase: 'observation' });
    const briefing = sections.find((section) => section.phase === 'briefing');

    expect(briefing?.expanded).toBe(true);
    expect(briefing?.entries.map((entry) => entry.text)).toEqual(['High impact news active.']);
  });

  it('deduplicates repeated Commander prompts by stable id, phase, and text', () => {
    const sections = buildCommanderConversationDisclosure({
      entries: [entries[2]!, entries[2]!],
      activePhase: 'observation',
    });

    expect(sections[0]?.entries).toHaveLength(1);
  });
});
