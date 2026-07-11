import type { JournalEntry } from '@headquarters/journal';
import type { ActiveMission } from './App';

export interface MissionJournalLink {
  readonly missionId: string;
  readonly codename: string;
  readonly linkedEntryCount: number;
  readonly status: string;
  readonly prompt: string;
}

export function buildMissionJournalLink(input: {
  readonly mission?: ActiveMission | undefined;
  readonly journalEntries: readonly JournalEntry[];
}): MissionJournalLink | undefined {
  if (input.mission === undefined) return undefined;

  const linkedEntryCount = input.journalEntries.filter((entry) => (
    entry.rawContent.includes(input.mission?.id ?? '')
    || entry.rawContent.includes(input.mission?.campaign ?? '')
  )).length;

  return {
    missionId: input.mission.id,
    codename: input.mission.campaign,
    linkedEntryCount,
    status: linkedEntryCount === 0
      ? 'No journal entries linked to this mission yet.'
      : `${linkedEntryCount} journal entr${linkedEntryCount === 1 ? 'y' : 'ies'} linked to this mission.`,
    prompt: `Write the next command log entry for ${input.mission.campaign}.`,
  };
}
