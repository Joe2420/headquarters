import type { CommanderShellRoomId } from './CommanderShell';

export type RoomMindset =
  | 'command'
  | 'preparation'
  | 'evidence'
  | 'decision'
  | 'reflection'
  | 'permanence'
  | 'record'
  | 'law'
  | 'growth'
  | 'security'
  | 'patterns'
  | 'systems';

export interface RoomIdentityProfile {
  readonly room: CommanderShellRoomId;
  readonly label: string;
  readonly identity: string;
  readonly mindset: RoomMindset;
  readonly purpose: string;
  readonly atmosphere: string;
  readonly commanderPacing: string;
  readonly commanderPresence: string;
  readonly arrivalCue: string;
  readonly exitCue: string;
  readonly primaryFocus: string;
  readonly environmentalCues: readonly string[];
}

const roomIdentityProfiles: Record<CommanderShellRoomId, RoomIdentityProfile> = {
  command: {
    room: 'command',
    label: 'Command Center',
    identity: 'headquarters',
    mindset: 'command',
    purpose: 'Operational home and command chair.',
    atmosphere: 'steady, central, controlled',
    commanderPacing: 'measured',
    commanderPresence: 'Commander occupies the center of Headquarters.',
    arrivalCue: 'Command Center entered. Headquarters is online.',
    exitCue: 'Command authority transfers to the destination room.',
    primaryFocus: 'current objective and next action',
    environmentalCues: ['command chair', 'situation board', 'HQOS status'],
  },
  'ready-room': {
    room: 'ready-room',
    label: 'Ready Room',
    identity: 'preparation',
    mindset: 'preparation',
    purpose: 'Preparation before Headquarters commits resources.',
    atmosphere: 'calm, organized, methodical',
    commanderPacing: 'patient',
    commanderPresence: 'Commander conducts the operational briefing.',
    arrivalCue: 'Prepare yourself.',
    exitCue: 'Operational briefing closed. Observation may begin.',
    primaryFocus: 'mission profile and readiness',
    environmentalCues: ['locker', 'daily orders', 'oath panel'],
  },
  observation: {
    room: 'observation',
    label: 'Observation Room',
    identity: 'silence',
    mindset: 'evidence',
    purpose: 'Evidence gathering without action pressure.',
    atmosphere: 'quiet, minimal, focused',
    commanderPacing: 'slow',
    commanderPresence: 'Commander enforces silence and evidence discipline.',
    arrivalCue: 'Observe. Do not interfere.',
    exitCue: 'Evidence package closed. War Room authorization can be requested.',
    primaryFocus: 'visible evidence only',
    environmentalCues: ['radar sweep', 'horizon drift', 'scan lines'],
  },
  'war-room': {
    room: 'war-room',
    label: 'War Room',
    identity: 'decision',
    mindset: 'decision',
    purpose: 'Disciplined authorization and responsibility.',
    atmosphere: 'controlled pressure, tactical, strict',
    commanderPacing: 'direct',
    commanderPresence: 'Commander transfers decision authority only when evidence holds.',
    arrivalCue: 'Decision authority transferred.',
    exitCue: 'Deployment authority closed. Return to base.',
    primaryFocus: 'authorization and invalidation',
    environmentalCues: ['HUD grid', 'authorization indicator', 'Guardian status'],
  },
  debrief: {
    room: 'debrief',
    label: 'Debrief Theater',
    identity: 'reflection',
    mindset: 'reflection',
    purpose: 'After-action review and learning.',
    atmosphere: 'dim, reflective, analytical',
    commanderPacing: 'reflective',
    commanderPresence: 'Commander slows the operator and reviews behavior before outcome.',
    arrivalCue: "Let's understand what happened.",
    exitCue: 'Debrief closed. Archive is ready for permanent record.',
    primaryFocus: 'behavior, discipline, lesson',
    environmentalCues: ['projector light', 'replay timeline', 'decision report'],
  },
  archive: {
    room: 'archive',
    label: 'Archive',
    identity: 'historical',
    mindset: 'permanence',
    purpose: 'Permanent historical record.',
    atmosphere: 'quiet, sealed, permanent',
    commanderPacing: 'formal',
    commanderPresence: 'Commander preserves the completed mission record.',
    arrivalCue: 'History preserved.',
    exitCue: 'Archive sealed. Mission complete.',
    primaryFocus: 'mission dossier and lessons',
    environmentalCues: ['vault seal', 'record lines', 'mission timeline'],
  },
  journal: {
    room: 'journal',
    label: 'Journal',
    identity: 'command-log',
    mindset: 'record',
    purpose: 'Command log before memory changes.',
    atmosphere: 'warm, quiet, focused',
    commanderPacing: 'gentle',
    commanderPresence: 'Commander asks for the record before interpretation.',
    arrivalCue: 'Write before memory changes.',
    exitCue: 'Journal entry saved for future review.',
    primaryFocus: 'operator record',
    environmentalCues: ['desk lamp', 'logbook lines'],
  },
  doctrine: {
    room: 'doctrine',
    label: 'Doctrine Chamber',
    identity: 'law',
    mindset: 'law',
    purpose: 'Institutional memory and rule promotion.',
    atmosphere: 'formal, permanent, deliberate',
    commanderPacing: 'formal',
    commanderPresence: 'Commander prevents lessons from becoming law too quickly.',
    arrivalCue: 'Nothing becomes law without review.',
    exitCue: 'Doctrine review closed.',
    primaryFocus: 'validated lessons',
    environmentalCues: ['doctrine seal', 'memory chamber'],
  },
  academy: {
    room: 'academy',
    label: 'Academy',
    identity: 'growth',
    mindset: 'growth',
    purpose: 'Recognition and behavior development.',
    atmosphere: 'calm training, earned progress',
    commanderPacing: 'encouraging',
    commanderPresence: 'Commander recognizes behavior, not numbers.',
    arrivalCue: 'Growth begins.',
    exitCue: 'Training record updated.',
    primaryFocus: 'recognition and consistency',
    environmentalCues: ['training grid', 'recognition glow'],
  },
  guardian: {
    room: 'guardian',
    label: 'Guardian Wing',
    identity: 'security',
    mindset: 'security',
    purpose: 'Risk, limits, and protective enforcement.',
    atmosphere: 'serious, calm, watchful',
    commanderPacing: 'firm',
    commanderPresence: 'Commander lets Guardian enforce boundaries without panic.',
    arrivalCue: 'Guardian systems online.',
    exitCue: 'Guardian watch remains active.',
    primaryFocus: 'limits and protection',
    environmentalCues: ['security grid', 'risk beacon'],
  },
  intelligence: {
    room: 'intelligence',
    label: 'Intelligence Office',
    identity: 'patterns',
    mindset: 'patterns',
    purpose: 'Pattern analysis and evidence classification.',
    atmosphere: 'analytical, connected, quiet',
    commanderPacing: 'analytical',
    commanderPresence: 'Commander frames patterns as evidence, never orders.',
    arrivalCue: 'Patterns are emerging.',
    exitCue: 'Intelligence file updated.',
    primaryFocus: 'signals and patterns',
    environmentalCues: ['analysis map', 'connection lines'],
  },
  settings: {
    room: 'settings',
    label: 'Systems Room',
    identity: 'systems',
    mindset: 'systems',
    purpose: 'Quiet operating preferences.',
    atmosphere: 'stable, low intensity, technical',
    commanderPacing: 'brief',
    commanderPresence: 'Commander stands by while systems are adjusted.',
    arrivalCue: 'Systems room entered.',
    exitCue: 'Systems remain stable.',
    primaryFocus: 'configuration',
    environmentalCues: ['system status', 'preferences'],
  },
};

export function getRoomIdentityProfile(room: CommanderShellRoomId): RoomIdentityProfile {
  return roomIdentityProfiles[room];
}

export function listRoomIdentityProfiles(): readonly RoomIdentityProfile[] {
  return Object.values(roomIdentityProfiles);
}

export function getRoomEnvironmentalSummary(room: CommanderShellRoomId): string {
  const profile = getRoomIdentityProfile(room);
  return `${profile.label}: ${profile.purpose} Focus: ${profile.primaryFocus}.`;
}
