import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  RoomArrivalPanel,
  RoomTransitionLayer,
  advanceRoomTransition,
  buildMissionCompassSteps,
  createRoomTransition,
  createTransitionQueue,
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
      durationMs: 7000,
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
    expect(transitionHtml).toContain('Proceeding to Observation Room.');
    expect(transitionHtml).toContain('Observation Room');
    expect(transitionHtml).toContain('Observe. Do not interfere.');
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
    expect(getTransitionDurationMs(false)).toBe(7000);
    expect(getTransitionDurationMs(true)).toBe(1000);
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
    expect(styles).toContain('cinematic-door-left');
    expect(styles).toContain('cockpit-countdown');
    expect(styles).toContain('prefers-reduced-motion: reduce');
    expect(styles).toContain('.room-arrival-panel');
    expect(styles).toContain('.room-layout[data-room-identity="preparation"]');
    expect(styles).toContain('.room-layout[data-room-identity="silence"]');
    expect(styles).toContain('.room-layout[data-room-identity="decision"]');
    expect(styles).toContain('.room-layout[data-room-identity="reflection"]');
    expect(styles).toContain('.room-layout[data-room-identity="historical"]');
  });
});
