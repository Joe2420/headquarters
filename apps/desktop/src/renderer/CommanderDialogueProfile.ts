import type { CommanderShellRoomId } from './CommanderShell';

export type CommanderDialogueCadence = 'measured' | 'patient' | 'slow' | 'direct' | 'reflective' | 'formal' | 'gentle' | 'firm' | 'analytical';
export type CommanderDialoguePosture = 'command' | 'preparation' | 'evidence' | 'authorization' | 'review' | 'record' | 'growth' | 'protection' | 'analysis' | 'systems';

export interface CommanderTransmissionTiming {
  readonly startDelayMs: number;
  readonly characterDelayMs: number;
  readonly commaDelayMs: number;
  readonly sentenceDelayMs: number;
  readonly breathEveryCharacters: number;
  readonly breathDelayMs: number;
}

export interface CommanderDialogueProfile {
  readonly room: CommanderShellRoomId;
  readonly cadence: CommanderDialogueCadence;
  readonly posture: CommanderDialoguePosture;
  readonly presence: string;
  readonly instructionStyle: string;
  readonly responseRule: string;
  readonly timing: CommanderTransmissionTiming;
}

const baseTiming: CommanderTransmissionTiming = {
  startDelayMs: 240,
  characterDelayMs: 36,
  commaDelayMs: 140,
  sentenceDelayMs: 260,
  breathEveryCharacters: 17,
  breathDelayMs: 180,
};

const commanderDialogueProfiles: Record<CommanderShellRoomId, CommanderDialogueProfile> = {
  command: {
    room: 'command',
    cadence: 'measured',
    posture: 'command',
    presence: 'Commander holds the Command Chair and identifies the next operational move.',
    instructionStyle: 'summarize state, priority, and next action',
    responseRule: 'keep Headquarters oriented without turning into a dashboard',
    timing: baseTiming,
  },
  'ready-room': {
    room: 'ready-room',
    cadence: 'patient',
    posture: 'preparation',
    presence: 'Commander conducts the briefing before Headquarters commits resources.',
    instructionStyle: 'ask one preparation question and wait for the answer',
    responseRule: 'slow the operator and protect the pre-mission standard',
    timing: {
      ...baseTiming,
      startDelayMs: 320,
      characterDelayMs: 40,
      sentenceDelayMs: 340,
      breathDelayMs: 220,
    },
  },
  observation: {
    room: 'observation',
    cadence: 'slow',
    posture: 'evidence',
    presence: 'Commander keeps the operator seated in Observation and separates evidence from prediction.',
    instructionStyle: 'speak less, ask for visible evidence only',
    responseRule: 'never rush the operator toward War Room',
    timing: {
      ...baseTiming,
      startDelayMs: 420,
      characterDelayMs: 45,
      commaDelayMs: 180,
      sentenceDelayMs: 420,
      breathEveryCharacters: 14,
      breathDelayMs: 260,
    },
  },
  'war-room': {
    room: 'war-room',
    cadence: 'direct',
    posture: 'authorization',
    presence: 'Commander transfers decision authority only when evidence and invalidation hold.',
    instructionStyle: 'short, exact authorization prompts',
    responseRule: 'reject pressure and demand doctrine-backed reasoning',
    timing: {
      ...baseTiming,
      startDelayMs: 180,
      characterDelayMs: 30,
      commaDelayMs: 100,
      sentenceDelayMs: 180,
      breathEveryCharacters: 22,
      breathDelayMs: 120,
    },
  },
  debrief: {
    room: 'debrief',
    cadence: 'reflective',
    posture: 'review',
    presence: 'Commander slows the room so behavior can be reviewed before outcome.',
    instructionStyle: 'reflective prompts that turn action into learning',
    responseRule: 'keep lessons grounded in behavior',
    timing: {
      ...baseTiming,
      startDelayMs: 360,
      characterDelayMs: 42,
      sentenceDelayMs: 380,
      breathDelayMs: 240,
    },
  },
  archive: {
    room: 'archive',
    cadence: 'formal',
    posture: 'record',
    presence: 'Commander preserves the record as institutional memory.',
    instructionStyle: 'formal statements, no debate with the record',
    responseRule: 'treat archived evidence as permanent',
    timing: {
      ...baseTiming,
      startDelayMs: 300,
      characterDelayMs: 38,
      sentenceDelayMs: 320,
    },
  },
  journal: {
    room: 'journal',
    cadence: 'gentle',
    posture: 'record',
    presence: 'Commander keeps the operator at the command log before memory changes.',
    instructionStyle: 'ask for the record before interpretation',
    responseRule: 'protect truthful writing over polished explanation',
    timing: {
      ...baseTiming,
      startDelayMs: 340,
      characterDelayMs: 41,
      sentenceDelayMs: 350,
    },
  },
  doctrine: {
    room: 'doctrine',
    cadence: 'formal',
    posture: 'record',
    presence: 'Commander guards doctrine from becoming law too quickly.',
    instructionStyle: 'formal review language tied to repeated evidence',
    responseRule: 'separate candidates from permanent doctrine',
    timing: {
      ...baseTiming,
      startDelayMs: 300,
      characterDelayMs: 38,
      sentenceDelayMs: 330,
    },
  },
  academy: {
    room: 'academy',
    cadence: 'gentle',
    posture: 'growth',
    presence: 'Commander recognizes earned behavior and keeps XP secondary.',
    instructionStyle: 'recognize progress without turning growth into counters',
    responseRule: 'celebrate discipline, consistency, and recovery',
    timing: {
      ...baseTiming,
      startDelayMs: 280,
      characterDelayMs: 37,
      sentenceDelayMs: 300,
    },
  },
  guardian: {
    room: 'guardian',
    cadence: 'firm',
    posture: 'protection',
    presence: 'Commander lets Guardian enforce boundaries without panic.',
    instructionStyle: 'calm protective language with clear restrictions',
    responseRule: 'make limits feel serious, not alarming',
    timing: {
      ...baseTiming,
      startDelayMs: 210,
      characterDelayMs: 32,
      commaDelayMs: 110,
      sentenceDelayMs: 210,
    },
  },
  intelligence: {
    room: 'intelligence',
    cadence: 'analytical',
    posture: 'analysis',
    presence: 'Commander frames patterns as evidence, never orders.',
    instructionStyle: 'analytical summaries with careful uncertainty',
    responseRule: 'avoid certainty when evidence only suggests a pattern',
    timing: {
      ...baseTiming,
      startDelayMs: 260,
      characterDelayMs: 34,
      sentenceDelayMs: 280,
    },
  },
  settings: {
    room: 'settings',
    cadence: 'measured',
    posture: 'systems',
    presence: 'Commander stands by while systems are adjusted.',
    instructionStyle: 'brief operational system language',
    responseRule: 'do not turn settings into mission guidance',
    timing: baseTiming,
  },
};

export function getCommanderDialogueProfile(room: CommanderShellRoomId): CommanderDialogueProfile {
  return commanderDialogueProfiles[room];
}

export function listCommanderDialogueProfiles(): readonly CommanderDialogueProfile[] {
  return Object.values(commanderDialogueProfiles);
}

export function getCommanderDialoguePresenceLine(room: CommanderShellRoomId): string {
  const profile = getCommanderDialogueProfile(room);
  return `${profile.presence} Cadence: ${profile.cadence}.`;
}
