import type { CommanderShellRoomId } from './CommanderShell';

export type CommanderMessagePurpose =
  | 'question'
  | 'acknowledgement'
  | 'summary'
  | 'warning'
  | 'contradiction'
  | 'completion'
  | 'transition'
  | 'passive'
  | 'subsystem-signal'
  | 'authorization'
  | 'debrief';

export interface CommanderMessageCandidate {
  readonly id: string;
  readonly room: CommanderShellRoomId;
  readonly lifecycleStep: string;
  readonly purpose: CommanderMessagePurpose;
  readonly text: string;
  readonly source: 'commander' | 'lifecycle' | 'guardian' | 'intelligence' | 'mission' | 'passive';
}

export interface CommanderOrchestrationContext {
  readonly activeQuestionPending: boolean;
  readonly previousCommanderPurpose?: CommanderMessagePurpose | undefined;
  readonly previousCommanderText?: string | undefined;
  readonly renderedMessages?: readonly CommanderMessageCandidate[] | undefined;
}

export function orchestrateCommanderMessages(
  candidates: readonly CommanderMessageCandidate[],
  context: CommanderOrchestrationContext,
): readonly CommanderMessageCandidate[] {
  const existingKeys = new Set((context.renderedMessages ?? []).map(buildCommanderMessageDedupeKey));
  const output: CommanderMessageCandidate[] = [];
  const filtered = candidates.filter((candidate) => shouldKeepCandidate(candidate, context));

  for (let index = 0; index < filtered.length; index += 1) {
    const candidate = filtered[index];
    if (candidate === undefined) continue;

    const nextCandidate = filtered[index + 1];
    if (
      candidate.purpose === 'acknowledgement'
      && nextCandidate?.purpose === 'question'
      && candidate.room === nextCandidate.room
      && candidate.lifecycleStep === nextCandidate.lifecycleStep
    ) {
      const merged = {
        ...nextCandidate,
        id: `${candidate.id}+${nextCandidate.id}`,
        text: joinCommanderBlocks(candidate.text, nextCandidate.text),
      };

      appendIfNew(output, merged, existingKeys);
      index += 1;
      continue;
    }

    appendIfNew(output, candidate, existingKeys);
  }

  return output;
}

export function isRawSubsystemSignal(text: string): boolean {
  const normalized = normalizeCommanderText(text);
  return normalized.startsWith('intelligence update:')
    || normalized.startsWith('next evidence required:')
    || normalized.startsWith('guardian reports:')
    || /confidence (?:incomplete|forming|sufficient|complete) at \d+%/.test(normalized)
    || /confidence (?:incomplete|forming|sufficient|complete) \(\d+%\)/.test(normalized);
}

export function buildCommanderMessageDedupeKey(candidate: CommanderMessageCandidate): string {
  return [
    candidate.room,
    candidate.lifecycleStep,
    candidate.purpose,
    normalizeCommanderText(candidate.text),
  ].join('|');
}

export function normalizeCommanderText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function shouldKeepCandidate(
  candidate: CommanderMessageCandidate,
  context: CommanderOrchestrationContext,
): boolean {
  if (candidate.text.trim().length === 0) return false;
  if (isRawSubsystemSignal(candidate.text)) return false;
  if (candidate.purpose === 'subsystem-signal') return false;
  if (candidate.purpose === 'passive' && context.activeQuestionPending) return false;
  if (candidate.purpose === 'passive' && context.previousCommanderPurpose === 'passive') return false;
  if (
    context.previousCommanderText
    && normalizeCommanderText(candidate.text) === normalizeCommanderText(context.previousCommanderText)
  ) {
    return false;
  }

  return true;
}

function appendIfNew(
  output: CommanderMessageCandidate[],
  candidate: CommanderMessageCandidate,
  existingKeys: Set<string>,
): void {
  const key = buildCommanderMessageDedupeKey(candidate);
  if (existingKeys.has(key)) return;
  if (output.some((entry) => buildCommanderMessageDedupeKey(entry) === key)) return;

  existingKeys.add(key);
  output.push(candidate);
}

function joinCommanderBlocks(first: string, second: string): string {
  const normalizedFirst = normalizeCommanderText(first);
  const normalizedSecond = normalizeCommanderText(second);
  if (!normalizedFirst) return second;
  if (!normalizedSecond) return first;
  if (normalizedFirst === normalizedSecond || normalizedFirst.includes(normalizedSecond)) return first;
  if (normalizedSecond.includes(normalizedFirst)) return second;
  return `${first.trim()}\n\n${second.trim()}`;
}
