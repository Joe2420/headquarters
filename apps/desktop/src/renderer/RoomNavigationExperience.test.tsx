import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  RoomArrivalPanel,
  RoomTransitionLayer,
  advanceRoomTransition,
  buildMissionCompassSteps,
  createAuthorizationTransition,
  createRoomTransition,
  createTransitionQueue,
  buildTransitionAudioEvents,
  getCommanderCompassReference,
  getRoomArrival,
  getRoomIdentity,
  getTransitionDurationMs,
  getTransitionVariant,
  mapCommanderRoomToNavigationTarget,
  parseMissionNavigationState,
  recoverInterruptedTransition,
} from './RoomNavigationExperience';

describe('RoomNavigationExperience', () => {
  it('builds mission compass states for active, completed, available, and locked rooms', () => {
    const steps = buildMissionCompassSteps('authorization', 'war-room');

    expect(steps.map((step) => [step.id, step.state])).toEqual([
      ['ready-room', 'completed'],
      ['observation', 'completed'],
      ['war-room', 'active'],
      ['debrief', 'available'],
      ['archive', 'locked'],
    ]);
    expect(getCommanderCompassReference(steps)).toBe('War Room active. 1 future rooms locked.');
  });

  it('keeps future rooms progressively quiet before they unlock', () => {
    const steps = buildMissionCompassSteps('briefing', 'ready-room');

    expect(steps.map((step) => [step.id, step.state])).toEqual([
      ['ready-room', 'active'],
      ['observation', 'available'],
      ['war-room', 'locked'],
      ['debrief', 'locked'],
      ['archive', 'locked'],
    ]);
  });

  it('maps Commander recommendations to navigation targets for Continue and sidebar fallback', () => {
    expect(mapCommanderRoomToNavigationTarget('ready-room')).toBe('ready');
    expect(mapCommanderRoomToNavigationTarget('observation')).toBe('observation');
    expect(mapCommanderRoomToNavigationTarget('war-room')).toBe('war');
    expect(mapCommanderRoomToNavigationTarget('debrief')).toBe('debrief');
    expect(mapCommanderRoomToNavigationTarget('archive')).toBe('archive');
    expect(mapCommanderRoomToNavigationTarget('command')).toBe('missions');
  });

  it('advances and recovers room transition state deterministically', () => {
    const transition = createRoomTransition('ready-room', 'observation');

    expect(transition).toMatchObject({ fromRoom: 'ready-room', toRoom: 'observation', phase: 'commander' });
    expect(transition.controller).toMatchObject({
      fromRoom: 'ready-room',
      toRoom: 'observation',
      phase: 'commander',
      canInterrupt: false,
      escapeDisabled: true,
      durationMs: 4400,
      reducedMotionDurationMs: 1000,
    });
    expect(advanceRoomTransition(transition).phase).toBe('closing');
    expect(advanceRoomTransition({ ...transition, phase: 'closing' }).phase).toBe('transitioning');
    expect(advanceRoomTransition({ ...transition, phase: 'transitioning' }).phase).toBe('opening');
    expect(advanceRoomTransition({ ...transition, phase: 'opening' }).phase).toBe('arrival');
    expect(recoverInterruptedTransition({ ...transition, phase: 'interrupted' }).phase).toBe('opening');
  });

  it('renders transition and arrival surfaces before room content is shown', () => {
    const transition = advanceRoomTransition(createRoomTransition('ready-room', 'observation'));
    const transitionHtml = renderToStaticMarkup(
      <RoomTransitionLayer transition={transition} />,
    );
    const arrivalHtml = renderToStaticMarkup(
      <RoomArrivalPanel arrival={getRoomArrival('observation')} onContinue={() => undefined} />,
    );

    expect(transitionHtml).toContain('aria-label="Room transition"');
    expect(transitionHtml).toContain('data-transition-to="observation"');
    expect(transitionHtml).toContain('data-transition-scene="standard"');
    expect(transitionHtml).toContain('data-transition-has-video="true"');
    expect(transitionHtml).toContain('data-transition-room="observation"');
    expect(transitionHtml).toContain('src="/transitions/observation-room.mp4"');
    expect(transitionHtml).toContain('transition-scene-video-only');
    expect(transitionHtml).not.toContain('loop');
    expect(transitionHtml).not.toContain('Proceeding to Observation Room.');
    expect(transitionHtml).not.toContain('Observe. Do not interfere.');
    expect(arrivalHtml).toContain('aria-label="Observation Room arrival"');
    expect(arrivalHtml).toContain('Observe. Do not interfere.');
    expect(arrivalHtml).toContain('Continue');
  });

  it('defines cinematic variants and reduced-motion timing for every room', () => {
    const rooms = [
      'command',
      'ready-room',
      'observation',
      'war-room',
      'debrief',
      'archive',
      'journal',
      'doctrine',
      'academy',
      'guardian',
      'intelligence',
      'settings',
    ] as const;

    expect(rooms.map((room) => getTransitionVariant(room).scene)).toEqual([
      'standard',
      'standard',
      'standard',
      'cockpit',
      'theater',
      'vault',
      'desk',
      'doctrine',
      'simulator',
      'security',
      'intelligence',
      'standard',
    ]);
    expect(getTransitionVariant('war-room').commanderDeparture).toBe('Authorization granted.');
    expect(getTransitionVariant('war-room').commanderArrival).toBe('Decision authority transferred.');
    expect(getTransitionVariant('archive').commanderArrival).toBe('History preserved.');
    expect(getTransitionVariant('observation').videoSrc).toBe('/transitions/observation-room.mp4');
    expect(getTransitionVariant('war-room').videoSrc).toBeUndefined();
    expect(getTransitionVariant('archive').videoSrc).toBe('/transitions/archive-vault.mp4');
    expect(getTransitionVariant('archive').videoStartSeconds).toBe(1);
    expect(getTransitionVariant('observation').durationMs).toBe(4400);
    expect(getTransitionVariant('archive').durationMs).toBe(3600);
    expect(getTransitionDurationMs(false)).toBe(7000);
    expect(getTransitionDurationMs(true)).toBe(1000);
    expect(getTransitionDurationMs(false, createRoomTransition('ready-room', 'observation').controller)).toBe(4400);
    expect(getTransitionDurationMs(false, createRoomTransition('debrief', 'archive').controller)).toBe(3600);
    expect(getTransitionDurationMs(false, createAuthorizationTransition('war-room').controller)).toBe(4600);
  });

  it('renders the War Room cockpit as generated animation for normal room entry', () => {
    const transitionHtml = renderToStaticMarkup(
      <RoomTransitionLayer transition={createRoomTransition('observation', 'war-room')} />,
    );

    expect(transitionHtml).toContain('data-transition-scene="cockpit"');
    expect(transitionHtml).not.toContain('src="/transitions/war-room.mp4"');
    expect(transitionHtml).not.toContain('transition-scene-video-only');
    expect(transitionHtml).toContain('class="cockpit-countdown"');
    expect(transitionHtml).toContain('<span>3</span>');
    expect(transitionHtml).toContain('<span>2</span>');
    expect(transitionHtml).toContain('<span>1</span>');
    expect(transitionHtml).not.toContain('<span>5</span>');
    expect(transitionHtml).not.toContain('<span>4</span>');
    expect(transitionHtml).not.toContain('5 4 3 2 1');
  });

  it('renders the authorization cockpit video only from the approval transition', () => {
    const transitionHtml = renderToStaticMarkup(
      <RoomTransitionLayer transition={createAuthorizationTransition('war-room')} />,
    );

    expect(transitionHtml).toContain('data-transition-from="war-room"');
    expect(transitionHtml).toContain('data-transition-to="war-room"');
    expect(transitionHtml).toContain('src="/transitions/war-room.mp4"');
    expect(transitionHtml).toContain('transition-scene-video-only');
    expect(transitionHtml).not.toContain('class="cockpit-countdown"');
  });

  it('builds deterministic transition audio hook event sequences', () => {
    const transition = createRoomTransition('ready-room', 'observation');
    const audioEvents = buildTransitionAudioEvents(transition.controller, { createdAt: '2026-07-04T10:00:00.000Z' });

    expect(audioEvents.map((event) => event.cueId)).toEqual([
      'transition_start',
      'transition_door_lock',
      'transition_door_close',
      'transition_hydraulic_motion',
      'transition_door_open',
      'transition_arrival',
    ]);
    expect(audioEvents.every((event) => event.channel === 'transition')).toBe(true);
  });

  it('builds cockpit-specific audio hook events for War Room transitions', () => {
    const transition = createRoomTransition('observation', 'war-room');
    const audioEvents = buildTransitionAudioEvents(transition.controller, { createdAt: '2026-07-04T10:00:00.000Z' });

    expect(audioEvents.map((event) => event.cueId)).toEqual([
      'transition_start',
      'cockpit_power',
      'cockpit_countdown',
      'cockpit_launch',
      'transition_arrival',
    ]);
  });

  it('keeps reduced-motion transition audio hooks minimal', () => {
    const transition = createRoomTransition('ready-room', 'observation');
    const audioEvents = buildTransitionAudioEvents(transition.controller, {
      reducedMotion: true,
      createdAt: '2026-07-04T10:00:00.000Z',
    });

    expect(audioEvents.map((event) => event.cueId)).toEqual(['transition_start', 'transition_arrival']);
  });

  it('renders the Archive vault video from the one-second mark', () => {
    const transitionHtml = renderToStaticMarkup(
      <RoomTransitionLayer transition={createRoomTransition('debrief', 'archive')} />,
    );

    expect(transitionHtml).toContain('src="/transitions/archive-vault.mp4#t=1"');
    expect(transitionHtml).toContain('transition-scene-video-only');
    expect(transitionHtml).not.toContain('History preserved.');
  });

  it('creates a locked transition queue while the cinematic transition owns control', () => {
    const transition = createRoomTransition('command', 'journal');
    const queue = createTransitionQueue(transition.controller);

    expect(queue.locked).toBe(true);
    expect(queue.active?.toRoom).toBe('journal');
    expect(queue.pending).toEqual([]);
  });

  it('defines room identity contracts for the five mission rooms', () => {
    expect(getRoomIdentity('ready-room')).toBe('preparation');
    expect(getRoomIdentity('observation')).toBe('silence');
    expect(getRoomIdentity('war-room')).toBe('decision');
    expect(getRoomIdentity('debrief')).toBe('reflection');
    expect(getRoomIdentity('archive')).toBe('historical');
  });

  it('parses mission navigation state safely', () => {
    expect(parseMissionNavigationState('return_to_base')).toBe('return_to_base');
    expect(parseMissionNavigationState('unexpected')).toBeUndefined();
  });

  it('keeps sidebar, compass, transition, and identity visual contracts in CSS', () => {
    const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

    expect(styles).toContain('.nav-item.recommended');
    expect(styles).toContain('.mission-compass li[data-compass-state="active"]');
    expect(styles).toContain('.room-transition-layer');
    expect(styles).toContain('.cinematic-transition-overlay');
    expect(styles).toContain('.transition-video');
    expect(styles).toContain('object-fit: contain');
    expect(styles).toContain('object-position: center center');
    expect(styles).toContain('align-items: start');
    expect(styles).toContain('align-self: start');
    expect(styles).toContain('width: min(1500px, 100%)');
    expect(styles).toContain('object-position: center top');
    expect(styles).toContain('transform: translateY(-14%) scale(1.2)');
    expect(styles).toContain('transform: translateY(-14%) scale(1.18)');
    expect(styles).toContain('ease 1400ms forwards');
    expect(styles).toContain('ease 2800ms forwards');
    expect(styles).toContain('.transition-video-ended');
    expect(styles).toContain('transition-video-soft-finish');
    expect(styles).toContain('filter: brightness(0.18) saturate(0.65) !important');
    expect(styles).toContain('data-transition-has-video="true"');
    expect(styles).toContain('justify-self: center');
    expect(styles).toContain('transform: none');
    expect(styles).toContain('var(--transition-duration, 7000ms)');
    expect(styles).toContain('cinematic-door-left');
    expect(styles).toContain('cockpit-destination-title');
    expect(styles).toContain('cockpit-countdown-number');
    expect(styles).not.toContain('skewY');
    expect(styles).not.toContain('perspective(900px)');
    expect(styles).not.toContain('transition-vault-wheel');
    expect(styles).not.toContain('vault-door-wheel');
    expect(styles).toContain('prefers-reduced-motion: reduce');
    expect(styles).toContain('.room-arrival-panel');
    expect(styles).toContain('.room-layout[data-room-identity="preparation"]');
    expect(styles).toContain('.room-layout[data-room-identity="silence"]');
    expect(styles).toContain('.room-layout[data-room-identity="decision"]');
    expect(styles).toContain('.room-layout[data-room-identity="reflection"]');
    expect(styles).toContain('.room-layout[data-room-identity="historical"]');
  });
});
