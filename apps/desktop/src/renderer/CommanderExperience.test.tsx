import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  CommanderExperiencePanel,
  buildCommanderExperienceState,
  buildCommanderMemorySurface,
  getCommanderNextAction,
  getCommanderRoomTransitionText,
  mapNavigationRoomToCommanderRoom,
} from './CommanderExperience';

describe('CommanderExperience', () => {
  it('renders a persistent Commander shell with current room beneath guidance', () => {
    const state = buildCommanderExperienceState({
      reportState: 'reported',
      activeRoom: 'journal',
      activeMission: undefined,
    });
    const html = renderToStaticMarkup(<CommanderExperiencePanel state={state} />);

    expect(html).toContain('aria-label="Persistent Commander shell"');
    expect(html).toContain('data-current-room="journal"');
    expect(html).toContain('Create Mission');
    expect(html).toContain('Commander transmission channel');
    expect(html).toContain('Transmit to Commander');
    expect(html).toContain('Lifecycle: Mission Creation');
    expect(html).toContain('What mission are we opening, and what objective must it serve?');
    expect(html).toContain('Commander message thread');
    expect(html).toContain('Commander memory surface');
  });

  it('renders Commander-led Continue and mission compass context when provided', () => {
    const state = buildCommanderExperienceState({
      reportState: 'reported',
      activeRoom: 'ready-room',
      activeMission: {
        id: 'mission-001',
        campaign: 'Foundation Patrol',
        objective: 'Hold discipline',
        currentState: 'briefing',
        createdAt: '2026-07-02T00:00:00.000Z',
      },
    });
    const html = renderToStaticMarkup(<CommanderExperiencePanel
      state={state}
      onContinue={() => undefined}
      compassSteps={[
        { id: 'ready-room', label: 'Ready Room', state: 'active' },
        { id: 'observation', label: 'Observation', state: 'available' },
        { id: 'war-room', label: 'War Room', state: 'locked' },
        { id: 'debrief', label: 'Debrief Theater', state: 'locked' },
        { id: 'archive', label: 'Archive', state: 'locked' },
      ]}
    />);

    expect(html).toContain('aria-label="Continue to Ready Room"');
    expect(html).toContain('Commander mission compass');
    expect(html).toContain('Mission compass');
    expect(html).toContain('Ready Room active. 3 future rooms locked.');
  });

  it('renders top-level Commander workflow controls above room content', () => {
    const state = buildCommanderExperienceState({
      reportState: 'reported',
      activeRoom: 'war-room',
      activeMission: {
        id: 'mission-001',
        campaign: 'Foundation Patrol',
        objective: 'Hold discipline',
        currentState: 'authorization',
        createdAt: '2026-07-02T00:00:00.000Z',
      },
    });
    const html = renderToStaticMarkup(<CommanderExperiencePanel
      state={state}
      onContinue={() => undefined}
      workflowSurface={<section aria-label="Commander authorization controls">War Room Authorization</section>}
    />);

    expect(html).toContain('aria-label="Commander workflow controls"');
    expect(html).toContain('Commander authorization controls');
    expect(html).toContain('War Room Authorization');
  });

  it('renders Commander atmosphere surfaces when provided', () => {
    const state = buildCommanderExperienceState({
      reportState: 'reported',
      activeRoom: 'command',
      activeMission: undefined,
    });
    const html = renderToStaticMarkup(<CommanderExperiencePanel
      state={state}
      commandChair={<section>Command Chair Presence</section>}
      situationBoard={<section>Situation Board Presence</section>}
    />);

    expect(html).toContain('aria-label="Commander instruments"');
    expect(html).not.toContain('Commander overview');
    expect(html).toContain('Command Chair Presence');
    expect(html).toContain('Situation Board Presence');
  });

  it('derives exactly one primary next action for main lifecycle states', () => {
    expect(getCommanderNextAction('not-reported').label).toBe('Report for Duty');
    expect(getCommanderNextAction('reported').label).toBe('Create Mission');
    expect(getCommanderNextAction('reported', 'briefing').label).toBe('Enter Ready Room');
    expect(getCommanderNextAction('reported', 'observation').label).toBe('Begin Observation');
    expect(getCommanderNextAction('reported', 'authorization').label).toBe('Proceed to War Room');
    expect(getCommanderNextAction('reported', 'return_to_base').label).toBe('Begin Debrief');
    expect(getCommanderNextAction('reported', 'debrief').label).toBe('Archive Mission');
  });

  it('exposes lifecycle step and relevant Commander question for active mission state', () => {
    const state = buildCommanderExperienceState({
      reportState: 'reported',
      activeRoom: 'war-room',
      activeMission: {
        id: 'mission-001',
        campaign: 'Foundation Patrol',
        objective: 'Hold discipline',
        currentState: 'authorization',
        createdAt: '2026-07-02T00:00:00.000Z',
      },
    });

    expect(state.lifecycleStep).toBe('Lifecycle: Authorization');
    expect(state.commanderQuestion).toBe('What is the justification, and what would invalidate the mission?');
  });

  it('orders deterministic Commander messages and marks the newest message current', () => {
    const state = buildCommanderExperienceState({
      reportState: 'reported',
      activeRoom: 'war-room',
      activeMission: {
        id: 'mission-001',
        campaign: 'Foundation Patrol',
        objective: 'Hold discipline',
        currentState: 'authorization',
        createdAt: '2026-07-02T00:00:00.000Z',
      },
    });
    const html = renderToStaticMarkup(<CommanderExperiencePanel state={state} />);

    expect(state.messages.map((message) => message.id)).toEqual([
      'commander:guidance:current-state',
      'commander:transition:war-room',
      'commander:interruption:observation-complete',
    ]);
    expect(html).toContain('class="commander-message current"');
    expect(html).toContain('Observation completed. Authorization now requires discipline.');
  });

  it('hides acknowledged interruptions from priority rendering', () => {
    const state = buildCommanderExperienceState({
      reportState: 'reported',
      activeRoom: 'war-room',
      activeMission: {
        id: 'mission-001',
        campaign: 'Foundation Patrol',
        objective: 'Hold discipline',
        currentState: 'authorization',
        createdAt: '2026-07-02T00:00:00.000Z',
      },
      acknowledgedInterruptionIds: ['commander:interruption:observation-complete'],
    });
    const html = renderToStaticMarkup(<CommanderExperiencePanel state={state} />);

    expect(state.interruption?.acknowledged).toBe(true);
    expect(html).not.toContain('aria-label="Commander interruption"');
  });

  it('renders briefing and debrief guidance through Commander messages', () => {
    expect(buildCommanderExperienceState({
      reportState: 'reported',
      activeRoom: 'ready-room',
      activeMission: {
        id: 'mission-001',
        campaign: 'Foundation Patrol',
        objective: 'Hold discipline',
        currentState: 'briefing',
        createdAt: '2026-07-02T00:00:00.000Z',
      },
    }).currentMessage.text).toBe('Mission created. Prepare before moving further.');

    expect(buildCommanderExperienceState({
      reportState: 'reported',
      activeRoom: 'debrief',
      activeMission: {
        id: 'mission-001',
        campaign: 'Foundation Patrol',
        objective: 'Hold discipline',
        currentState: 'return_to_base',
        createdAt: '2026-07-02T00:00:00.000Z',
      },
    }).messages.map((message) => message.text)).toContain('Debrief starts now: behavior summary, discipline notes, lesson.');
  });

  it('generates room transition messages from mission lifecycle state', () => {
    expect(getCommanderRoomTransitionText(undefined)).toBe('Create Mission.');
    expect(getCommanderRoomTransitionText('briefing')).toBe('Proceed to Ready Room.');
    expect(getCommanderRoomTransitionText('observation')).toBe('Observation begins. Remain silent.');
    expect(getCommanderRoomTransitionText('authorization')).toBe('War Room unlocked. Authorization required.');
    expect(getCommanderRoomTransitionText('return_to_base')).toBe('Debrief Theater ready.');
    expect(getCommanderRoomTransitionText('debrief')).toBe('Archive the mission record.');
  });

  it('renders deterministic memory snippets from local evidence only', () => {
    expect(buildCommanderMemorySurface({
      recentDoctrine: 'Wait for confirmation',
      recentMission: 'Foundation Patrol',
      recentGrowthEvent: 'Held discipline',
      guardianStatus: 'Guardian standing by',
    }).map((snippet) => snippet.value)).toEqual([
      'Wait for confirmation',
      'Foundation Patrol',
      'Held discipline',
      'Guardian standing by',
    ]);

    expect(buildCommanderMemorySurface().map((snippet) => snippet.value)).toEqual([
      'No recent doctrine evidence',
      'No recent mission evidence',
      'No recent growth evidence',
      'Guardian standing by',
    ]);
  });

  it('maps legacy navigation rooms into Commander room ids', () => {
    expect(mapNavigationRoomToCommanderRoom('ready')).toBe('ready-room');
    expect(mapNavigationRoomToCommanderRoom('war')).toBe('war-room');
    expect(mapNavigationRoomToCommanderRoom('journal')).toBe('journal');
    expect(mapNavigationRoomToCommanderRoom('unknown')).toBe('command');
  });
});
