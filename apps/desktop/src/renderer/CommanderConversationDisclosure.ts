export type CommanderConversationPhase =
  | 'briefing'
  | 'observation'
  | 'authorization'
  | 'deployment'
  | 'debrief'
  | 'archive'
  | 'support';

export interface CommanderConversationEntry {
  readonly id: string;
  readonly phase: CommanderConversationPhase;
  readonly text: string;
  readonly purpose?: 'normal' | 'warning' | 'critical' | undefined;
  readonly completed?: boolean | undefined;
}

export interface CommanderConversationSection {
  readonly phase: CommanderConversationPhase;
  readonly expanded: boolean;
  readonly entries: readonly CommanderConversationEntry[];
}

export function buildCommanderConversationDisclosure(input: {
  readonly entries: readonly CommanderConversationEntry[];
  readonly activePhase: CommanderConversationPhase;
}): readonly CommanderConversationSection[] {
  const byPhase = new Map<CommanderConversationPhase, CommanderConversationEntry[]>();

  for (const entry of dedupeConversationEntries(input.entries)) {
    const phaseEntries = byPhase.get(entry.phase) ?? [];
    phaseEntries.push(entry);
    byPhase.set(entry.phase, phaseEntries);
  }

  return [...byPhase.entries()].map(([phase, entries]) => ({
    phase,
    expanded: phase === input.activePhase || entries.some((entry) => entry.purpose === 'warning' || entry.purpose === 'critical'),
    entries: phase === input.activePhase
      ? entries
      : entries.filter((entry) => entry.purpose === 'warning' || entry.purpose === 'critical' || entry.completed !== true),
  }));
}

function dedupeConversationEntries(
  entries: readonly CommanderConversationEntry[],
): readonly CommanderConversationEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.id}:${entry.phase}:${entry.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
