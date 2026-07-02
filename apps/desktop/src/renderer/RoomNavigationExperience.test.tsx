import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  RoomArrivalPanel,
  RoomTransitionLayer,
  advanceRoomTransition,
  buildMissionCompassSteps,
  createRoomTransition,
  getCommanderCompassReference,
  getRoomArrival,
  getRoomIdentity,
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
    expect(advanceRoomTransition(transition).phase).toBe('closing');
    expect(advanceRoomTransition({ ...transition, phase: 'closing' }).phase).toBe('transitioning');
    expect(advanceRoomTransition({ ...transition, phase: 'transitioning' }).phase).toBe('opening');
    expect(advanceRoomTransition({ ...transition, phase: 'opening' }).phase).toBe('arrival');
    expect(recoverInterruptedTransition({ ...transition, phase: 'interrupted' }).phase).toBe('opening');
  });

  it('renders transition and arrival surfaces before room content is shown', () => {
    const transitionHtml = renderToStaticMarkup(
      <RoomTransitionLayer transition={{ fromRoom: 'ready-room', toRoom: 'observation', phase: 'arrival' }} />,
    );
    const arrivalHtml = renderToStaticMarkup(
      <RoomArrivalPanel arrival={getRoomArrival('observation')} onContinue={() => undefined} />,
    );

    expect(transitionHtml).toContain('aria-label="Room transition"');
    expect(transitionHtml).toContain('data-transition-to="observation"');
    expect(transitionHtml).toContain('Door opens.');
    expect(arrivalHtml).toContain('aria-label="Observation arrival"');
    expect(arrivalHtml).toContain('Observe only. Silence is the work.');
    expect(arrivalHtml).toContain('Continue');
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
    expect(styles).toContain('.room-arrival-panel');
    expect(styles).toContain('.room-layout[data-room-identity="preparation"]');
    expect(styles).toContain('.room-layout[data-room-identity="silence"]');
    expect(styles).toContain('.room-layout[data-room-identity="decision"]');
    expect(styles).toContain('.room-layout[data-room-identity="reflection"]');
    expect(styles).toContain('.room-layout[data-room-identity="historical"]');
  });
});
