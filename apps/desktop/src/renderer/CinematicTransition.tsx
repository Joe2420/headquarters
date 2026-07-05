import { type CSSProperties, useEffect, useState } from 'react';
import type { CommanderShellRoomId } from './CommanderShell';
import { createAudioEvent, type AudioEvent, type AudioCueId } from './AudioEvents';

export type TransitionPhase = 'commander' | 'closing' | 'transitioning' | 'opening' | 'arrival' | 'interrupted';
export type TransitionSoundEvent =
  | 'transition_start'
  | 'door_lock'
  | 'door_close'
  | 'hydraulic_motion'
  | 'door_open'
  | 'arrival'
  | 'cockpit_power'
  | 'cockpit_countdown'
  | 'cockpit_launch';
export type TransitionScene = 'standard' | 'cockpit' | 'theater' | 'vault' | 'desk' | 'simulator' | 'doctrine' | 'security' | 'intelligence';

export interface TransitionVariant {
  readonly room: CommanderShellRoomId;
  readonly scene: TransitionScene;
  readonly theme: string;
  readonly title: string;
  readonly standby: string;
  readonly commanderDeparture: string;
  readonly commanderArrival: string;
  readonly soundEvents: readonly TransitionSoundEvent[];
  readonly videoSrc?: string;
  readonly videoStartSeconds?: number;
  readonly durationMs?: number;
  readonly reducedMotionDurationMs?: number;
}

export interface RoomArrival {
  readonly room: CommanderShellRoomId;
  readonly title: string;
  readonly message: string;
}

export interface TransitionController {
  readonly fromRoom: CommanderShellRoomId;
  readonly toRoom: CommanderShellRoomId;
  readonly phase: TransitionPhase;
  readonly variant: TransitionVariant;
  readonly durationMs: number;
  readonly reducedMotionDurationMs: number;
  readonly canInterrupt: false;
  readonly escapeDisabled: true;
}

export interface TransitionQueue {
  readonly active: TransitionController | undefined;
  readonly pending: readonly TransitionController[];
  readonly locked: boolean;
}

const soundEvents: readonly TransitionSoundEvent[] = [
  'transition_start',
  'door_lock',
  'door_close',
  'hydraulic_motion',
  'door_open',
  'arrival',
];

const cockpitSoundEvents: readonly TransitionSoundEvent[] = [
  'transition_start',
  'cockpit_power',
  'cockpit_countdown',
  'cockpit_launch',
  'arrival',
];

const transitionVariants: Record<CommanderShellRoomId, TransitionVariant> = {
  command: {
    room: 'command',
    scene: 'standard',
    theme: 'command',
    title: 'Command Center',
    standby: 'HEADQUARTERS ONLINE',
    commanderDeparture: 'Returning to Command Center.',
    commanderArrival: 'Command Center entered.',
    soundEvents,
    videoSrc: '/transitions/command-room.mp4',
    durationMs: 4400,
  },
  'ready-room': {
    room: 'ready-room',
    scene: 'standard',
    theme: 'preparation',
    title: 'Ready Room',
    standby: 'PREPARATION',
    commanderDeparture: 'Proceeding to Ready Room.',
    commanderArrival: 'Prepare yourself.',
    soundEvents,
    videoSrc: '/transitions/ready-room.mp4',
    durationMs: 4400,
  },
  observation: {
    room: 'observation',
    scene: 'standard',
    theme: 'focus',
    title: 'Observation Room',
    standby: 'STAND BY',
    commanderDeparture: 'Proceeding to Observation Room.',
    commanderArrival: 'Observe. Do not interfere.',
    soundEvents,
    videoSrc: '/transitions/observation-room.mp4',
    durationMs: 4400,
  },
  'war-room': {
    room: 'war-room',
    scene: 'cockpit',
    theme: 'authorization',
    title: 'War Room',
    standby: 'COUNTDOWN',
    commanderDeparture: 'Authorization granted.',
    commanderArrival: 'Decision authority transferred.',
    soundEvents: cockpitSoundEvents,
    videoSrc: '/transitions/war-room.mp4',
    durationMs: 4600,
  },
  debrief: {
    room: 'debrief',
    scene: 'theater',
    theme: 'review',
    title: 'Debrief Theater',
    standby: 'MISSION COMPLETE',
    commanderDeparture: 'Proceeding to Debrief Theater.',
    commanderArrival: "Let's understand what happened.",
    soundEvents,
    videoSrc: '/transitions/debrief-theater.mp4',
    durationMs: 4400,
  },
  archive: {
    room: 'archive',
    scene: 'vault',
    theme: 'history',
    title: 'Archive',
    standby: 'RETRIEVING RECORD',
    commanderDeparture: 'Proceeding to Archive.',
    commanderArrival: 'History preserved.',
    soundEvents,
    videoSrc: '/transitions/archive-vault.mp4',
    videoStartSeconds: 1,
    durationMs: 3600,
  },
  journal: {
    room: 'journal',
    scene: 'desk',
    theme: 'record',
    title: 'Journal',
    standby: 'COMMAND LOG',
    commanderDeparture: 'Proceeding to Journal.',
    commanderArrival: 'Write before memory changes.',
    soundEvents,
  },
  doctrine: {
    room: 'doctrine',
    scene: 'doctrine',
    theme: 'law',
    title: 'Doctrine Chamber',
    standby: 'REVIEW REQUIRED',
    commanderDeparture: 'Proceeding to Doctrine Chamber.',
    commanderArrival: 'Nothing becomes law without review.',
    soundEvents,
  },
  academy: {
    room: 'academy',
    scene: 'simulator',
    theme: 'growth',
    title: 'Academy',
    standby: 'SIMULATION READY',
    commanderDeparture: 'Proceeding to Academy.',
    commanderArrival: 'Growth begins.',
    soundEvents,
  },
  guardian: {
    room: 'guardian',
    scene: 'security',
    theme: 'security',
    title: 'Guardian Wing',
    standby: 'SYSTEMS ONLINE',
    commanderDeparture: 'Proceeding to Guardian Wing.',
    commanderArrival: 'Guardian systems online.',
    soundEvents,
  },
  intelligence: {
    room: 'intelligence',
    scene: 'intelligence',
    theme: 'patterns',
    title: 'Intelligence Office',
    standby: 'SIGNAL MAP',
    commanderDeparture: 'Proceeding to Intelligence Office.',
    commanderArrival: 'Patterns are emerging.',
    soundEvents,
  },
  settings: {
    room: 'settings',
    scene: 'standard',
    theme: 'systems',
    title: 'Systems Room',
    standby: 'SYSTEMS',
    commanderDeparture: 'Proceeding to Systems Room.',
    commanderArrival: 'Systems room entered.',
    soundEvents,
  },
};

export function getTransitionVariant(room: CommanderShellRoomId): TransitionVariant {
  return transitionVariants[room];
}

export function createTransitionController(
  fromRoom: CommanderShellRoomId,
  toRoom: CommanderShellRoomId,
  phase: TransitionPhase = 'commander',
  variant: TransitionVariant = getTransitionVariant(toRoom),
): TransitionController {
  return {
    fromRoom,
    toRoom,
    phase,
    variant,
    durationMs: variant.durationMs ?? 7000,
    reducedMotionDurationMs: variant.reducedMotionDurationMs ?? 1000,
    canInterrupt: false,
    escapeDisabled: true,
  };
}

export function createAuthorizationTransitionController(
  room: CommanderShellRoomId = 'war-room',
  phase: TransitionPhase = 'commander',
): TransitionController {
  return createTransitionController(room, room, phase, {
    ...getTransitionVariant('war-room'),
    videoSrc: '/transitions/war-room.mp4',
    soundEvents: cockpitSoundEvents,
    durationMs: 4600,
  });
}

export function buildTransitionAudioEvents(
  controller: TransitionController,
  input: { readonly reducedMotion?: boolean | undefined; readonly createdAt?: string | undefined } = {},
): AudioEvent[] {
  const events = input.reducedMotion
    ? controller.variant.soundEvents.filter((eventName) => eventName === 'transition_start' || eventName === 'arrival')
    : controller.variant.soundEvents;

  return events.map((eventName, index) => {
    const createdAt = input.createdAt === undefined ? {} : { createdAt: `${input.createdAt}:${index}` };
    return createAudioEvent({
      type: 'transition_cue',
      cueId: mapTransitionSoundEventToCueId(eventName),
      channel: 'transition',
      priority: eventName === 'arrival' || eventName === 'transition_start' ? 'normal' : 'low',
      ...createdAt,
      room: controller.toRoom,
      reason: `Transition audio hook: ${eventName}.`,
    });
  });
}

function mapTransitionSoundEventToCueId(eventName: TransitionSoundEvent): AudioCueId {
  if (eventName === 'door_lock') return 'transition_door_lock';
  if (eventName === 'door_close') return 'transition_door_close';
  if (eventName === 'hydraulic_motion') return 'transition_hydraulic_motion';
  if (eventName === 'door_open') return 'transition_door_open';
  if (eventName === 'arrival') return 'transition_arrival';
  if (eventName === 'cockpit_power') return 'cockpit_power';
  if (eventName === 'cockpit_countdown') return 'cockpit_countdown';
  if (eventName === 'cockpit_launch') return 'cockpit_launch';
  return 'transition_start';
}

export function createTransitionQueue(active?: TransitionController): TransitionQueue {
  return {
    active,
    pending: [],
    locked: active !== undefined,
  };
}

export function getTransitionDurationMs(reducedMotion: boolean, controller?: TransitionController): number {
  if (reducedMotion) return controller?.reducedMotionDurationMs ?? 1000;
  return controller?.durationMs ?? 7000;
}

export function getRoomArrival(room: CommanderShellRoomId): RoomArrival {
  const variant = getTransitionVariant(room);
  return {
    room,
    title: variant.title,
    message: variant.commanderArrival,
  };
}

export function TransitionOverlay({ controller }: { readonly controller: TransitionController }) {
  useEffect(() => {
    const target = globalThis.window;
    if (!target) return undefined;

    const audioEvents = buildTransitionAudioEvents(controller, {
      reducedMotion: globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    });

    for (const audioEvent of audioEvents) {
      target.dispatchEvent(new CustomEvent('headquarters:transition-audio-cue', {
        detail: {
          event: audioEvent.cueId,
          room: controller.toRoom,
          scene: controller.variant.scene,
        },
      }));
      target.dispatchEvent(new CustomEvent('headquarters:audio-event', {
        detail: audioEvent,
      }));
    }

    const preventEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
    };

    target.addEventListener('keydown', preventEscape, { capture: true });
    return () => target.removeEventListener('keydown', preventEscape, { capture: true });
  }, [controller]);

  return (
    <section
      className="cinematic-transition-overlay room-transition-layer"
      aria-label="Room transition"
      aria-busy="true"
      data-transition-from={controller.fromRoom}
      data-transition-to={controller.toRoom}
      data-transition-phase={controller.phase}
      data-transition-scene={controller.variant.scene}
      data-transition-theme={controller.variant.theme}
      data-transition-has-video={controller.variant.videoSrc !== undefined}
      data-escape-disabled={controller.escapeDisabled}
      data-can-interrupt={controller.canInterrupt}
      style={{
        '--transition-duration': `${controller.durationMs}ms`,
      } as CSSProperties}
    >
      <TransitionSceneView controller={controller} />
    </section>
  );
}

export function TransitionSceneView({ controller }: { readonly controller: TransitionController }) {
  const variant = controller.variant;

  if (variant.videoSrc) {
    return (
      <div
        className="transition-scene transition-scene-video-only"
        data-transition-room={variant.room}
        data-transition-scene={variant.scene}
      >
        <TransitionVideo variant={variant} />
      </div>
    );
  }

  return (
    <div className="transition-scene" data-transition-scene={variant.scene}>
      <div className="transition-commander-line transition-commander-line-departure">
        {variant.commanderDeparture}
      </div>
      <div className="transition-environment" aria-hidden="true">
        <span className="transition-particles" />
        <span className="transition-light-beam" />
        <span className="transition-door transition-door-left" />
        <span className="transition-door transition-door-right" />
        {variant.scene === 'cockpit' ? <CockpitSequence /> : null}
        {variant.scene === 'desk' ? <span className="transition-journal-desk" /> : null}
        {variant.scene === 'theater' ? <span className="transition-projector" /> : null}
        {variant.scene === 'security' ? <span className="transition-scanner-grid" /> : null}
        {variant.scene === 'intelligence' ? <span className="transition-situation-map" /> : null}
        {variant.scene === 'doctrine' ? <span className="transition-doctrine-hologram" /> : null}
        {variant.scene === 'simulator' ? <span className="transition-simulator-holograms" /> : null}
      </div>
      <div className="transition-destination">
        <span>{variant.title}</span>
        <small>{variant.standby}</small>
      </div>
      <div className="transition-commander-line transition-commander-line-arrival">
        {variant.commanderArrival}
      </div>
    </div>
  );
}

function TransitionVideo({ variant }: { readonly variant: TransitionVariant }) {
  const [hasEnded, setHasEnded] = useState(false);
  const videoSrc = variant.videoStartSeconds !== undefined
    ? `${variant.videoSrc}#t=${variant.videoStartSeconds}`
    : variant.videoSrc;

  return (
    <video
      className={hasEnded ? 'transition-video transition-video-ended' : 'transition-video'}
      src={videoSrc}
      autoPlay
      muted
      playsInline
      preload="auto"
      onEnded={() => setHasEnded(true)}
    />
  );
}

function CockpitSequence() {
  return (
    <div className="transition-cockpit" aria-hidden="true">
      <span className="cockpit-canopy" />
      <span className="cockpit-hud" />
      <span className="cockpit-countdown">
        <span>3</span>
        <span>2</span>
        <span>1</span>
      </span>
      <span className="cockpit-thrusters" />
    </div>
  );
}
