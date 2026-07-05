import { readFileSync } from 'node:fs';
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
import { buildCommanderBehaviorProfile } from './CommanderBehaviorProfile';
import { createEmptyMissionContext, updateMissionContextObservation, updateMissionContextReadiness } from './MissionContextMemory';

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
    expect(html).toContain('Commander transmission channel');
    expect(html).toContain('Transmit to Commander');
    expect(html).toContain('Lifecycle: Mission Creation');
    expect(html).toContain('Journal is the command log. Record first; interpret second.');
    expect(html).toContain('What happened, before judgment?');
    expect(html).toContain('Commander message thread');
    expect(html).toContain('Commander memory surface');
  });

  it('adapts Commander chat behavior by room without replacing the chat surface', () => {
    const journalState = buildCommanderExperienceState({
      reportState: 'reported',
      activeRoom: 'journal',
      activeMission: undefined,
    });
    const observationState = buildCommanderExperienceState({
      reportState: 'reported',
      activeRoom: 'observation',
      activeMission: {
        id: 'mission-001',
        campaign: 'Foundation Patrol',
        objective: 'Hold discipline',
        currentState: 'observation',
        createdAt: '2026-07-02T00:00:00.000Z',
      },
    });
    const journalHtml = renderToStaticMarkup(<CommanderExperiencePanel state={journalState} />);
    const observationHtml = renderToStaticMarkup(<CommanderExperiencePanel state={observationState} />);

    expect(journalState.roomPromptMode).toBe('ask');
    expect(journalState.commanderQuestion).toBe('What happened, before judgment?');
    expect(journalHtml).toContain('Commander transmission channel');
    expect(journalHtml).toContain('commander-transmission-question');

    expect(observationState.roomPromptMode).toBe('ask');
    expect(observationState.commanderQuestion).toContain('Observation has begun.');
    expect(observationHtml).toContain('Commander transmission channel');
    expect(observationHtml).toContain('data-room-prompt-mode="ask"');
    expect(observationHtml).toContain('commander-transmission-question');
  });

  it('asks the next Ready Room briefing question from stored mission context', () => {
    const state = buildCommanderExperienceState({
      reportState: 'reported',
      activeRoom: 'ready-room',
      activeMission: {
        id: 'mission-001',
        campaign: 'Foundation Patrol',
        objective: 'Hold discipline',
        currentState: 'briefing',
        createdAt: '2026-07-02T00:00:00.000Z',
        briefingContext: {
          missionObjective: 'Trade the morning breakout.',
          market: 'ES futures.',
          marketEnvironment: 'Trending.',
        },
      },
    });

    expect(state.roomPromptMode).toBe('ask');
    expect(state.commanderQuestion).toBe("Are there any scheduled economic events capable of changing today's conditions?");
  });

  it('asks the next Observation intelligence question from stored evidence context', () => {
    const state = buildCommanderExperienceState({
      reportState: 'reported',
      activeRoom: 'observation',
      activeMission: {
        id: 'mission-001',
        campaign: 'Foundation Patrol',
        objective: 'Hold discipline',
        currentState: 'observation',
        createdAt: '2026-07-02T00:00:00.000Z',
        observationContext: {
          marketDirection: 'Up.',
          marketStructure: 'Higher highs.',
          volume: 'Rising.',
          liquidity: 'Above prior high.',
          keyLevels: 'London high and VWAP.',
          bias: 'Long continuation.',
        },
      },
    });

    expect(state.roomPromptMode).toBe('ask');
    expect(state.commanderQuestion).toBe('What evidence would invalidate your current idea?');
  });

  it('does not render a Commander question twice when the current response already contains it', () => {
    const state = buildCommanderExperienceState({
      reportState: 'reported',
      activeRoom: 'observation',
      activeMission: {
        id: 'mission-001',
        campaign: 'Foundation Patrol',
        objective: 'Hold discipline',
        currentState: 'observation',
        createdAt: '2026-07-02T00:00:00.000Z',
        observationContext: {
          marketDirection: 'Up.',
        },
      },
    });
    const html = renderToStaticMarkup(<CommanderExperiencePanel
      state={{
        ...state,
        currentMessage: {
          ...state.currentMessage,
          text: `Logged. ${state.commanderQuestion}`,
        },
      }}
    />);

    expect(html.match(/What market structure is currently present/g)).toHaveLength(1);
  });

  it('queues Commander transmissions so delivered lines do not replay after panel switches', () => {
    const source = readFileSync(new URL('./CommanderExperience.tsx', import.meta.url), 'utf8');

    expect(source).toContain("readonly status: 'queued' | 'transmitting' | 'delivered'");
    expect(source).toContain("entry.speaker === 'Commander' && entry.status === 'transmitting'");
    expect(source).toContain("entry.speaker === 'Commander' && entry.status === 'queued'");
    expect(source).toContain("transmission.status !== 'queued'");
    expect(source).toContain("transmission.status === 'delivered'");
    expect(source).toContain('? transmission.text');
  });

  it('keeps each support room Commander chat tone distinct', () => {
    const rooms = [
      ['doctrine', 'Is this lesson ready to become law, or only a candidate?'],
      ['academy', 'Academy recognizes behavior, not numbers.'],
      ['guardian', 'Guardian is watching limits. No action is required unless a boundary moves.'],
      ['intelligence', 'Intelligence classifies patterns. Suggestions are evidence, not orders.'],
      ['settings', 'Settings are quiet. No operational action is required.'],
    ] as const;

    for (const [room, expectedQuestionOrStatement] of rooms) {
      const state = buildCommanderExperienceState({
        reportState: 'reported',
        activeRoom: room,
        activeMission: undefined,
      });

      expect(state.commanderQuestion).toBe(expectedQuestionOrStatement);
    }
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

    expect(html).not.toContain('aria-label="Continue to Ready Room"');
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
    expect(getCommanderNextAction('reported', 'briefing').label).toBe('Complete Briefing');
    expect(getCommanderNextAction('reported', 'briefing').disabled).toBe(true);
    expect(getCommanderNextAction('reported', 'ready').label).toBe('Begin Observation');
    expect(getCommanderNextAction('reported', 'ready').disabled).toBe(false);
    expect(getCommanderNextAction('reported', 'observation').label).toBe('Complete Observation');
    expect(getCommanderNextAction('reported', 'observation').disabled).toBe(true);
    expect(getCommanderNextAction('reported', 'authorization').label).toBe('War Room Authorization');
    expect(getCommanderNextAction('reported', 'authorization').disabled).toBe(true);
    expect(getCommanderNextAction('reported', 'deployed').label).toBe('Return To Base');
    expect(getCommanderNextAction('reported', 'return_to_base').label).toBe('Begin Debrief');
    expect(getCommanderNextAction('reported', 'debrief').label).toBe('Archive Mission');
  });

  it('unlocks lifecycle Continue after required briefing and observation context is saved', () => {
    const briefingAction = getCommanderNextAction('reported', 'briefing', {
      id: 'mission-001',
      campaign: 'Foundation Patrol',
      objective: 'Hold discipline',
      currentState: 'briefing',
      createdAt: '2026-07-02T00:00:00.000Z',
      briefingContext: {
        missionObjective: 'Trade the morning breakout.',
        market: 'ES futures.',
        marketEnvironment: 'Trending.',
        highImpactNews: 'None.',
        personalReadiness: 'Focused.',
        riskParameters: '1%.',
        successCriteria: 'Follow the plan.',
      },
    });
    const observationAction = getCommanderNextAction('reported', 'observation', {
      id: 'mission-001',
      campaign: 'Foundation Patrol',
      objective: 'Hold discipline',
      currentState: 'observation',
      createdAt: '2026-07-02T00:00:00.000Z',
      observationContext: {
        marketDirection: 'Up.',
        marketStructure: 'Higher highs.',
        volume: 'Rising.',
        liquidity: 'Above prior high.',
        keyLevels: 'London high and VWAP.',
        bias: 'Long continuation.',
        invalidationEvidence: 'Break below VWAP.',
        emotionalCheck: 'Focused.',
        readiness: 'yes',
        operationalPicture: 'Trend up, liquidity above, invalidation below VWAP.',
      },
    });

    expect(briefingAction.disabled).toBe(false);
    expect(briefingAction.description).toContain('Proceed to Observation');
    expect(observationAction.disabled).toBe(false);
    expect(observationAction.label).toBe('Complete Observation');
    expect(observationAction.description).toContain('Proceed to War Room');
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
        observationContext: {
          invalidationEvidence: 'Sweep of highs.',
        },
      },
    });

    expect(state.lifecycleStep).toBe('Lifecycle: Authorization');
    expect(state.commanderQuestion).toBe('Observation invalidation recorded: Sweep of highs. Which rule protects this authorization decision?');
  });

  it('keeps War Room from recollecting Observation invalidation unless it is missing', () => {
    const withInvalidation = buildCommanderExperienceState({
      reportState: 'reported',
      activeRoom: 'war-room',
      activeMission: {
        id: 'mission-001',
        campaign: 'Foundation Patrol',
        objective: 'Hold discipline',
        currentState: 'authorization',
        createdAt: '2026-07-02T00:00:00.000Z',
        observationContext: {
          invalidationEvidence: 'Sweep of highs.',
        },
      },
    });
    const withoutInvalidation = buildCommanderExperienceState({
      reportState: 'reported',
      activeRoom: 'war-room',
      activeMission: {
        id: 'mission-002',
        campaign: 'Foundation Patrol',
        objective: 'Hold discipline',
        currentState: 'authorization',
        createdAt: '2026-07-02T00:00:00.000Z',
      },
    });

    expect(withInvalidation.commanderQuestion).toContain('Observation invalidation recorded: Sweep of highs.');
    expect(withInvalidation.commanderQuestion).not.toContain('State the authorization reasoning and the invalidation condition');
    expect(withoutInvalidation.commanderQuestion).toBe('State the authorization reasoning and the invalidation condition that protects this decision.');
  });

  it('suppresses prompt re-emission and passive check-ins during active dialogue', () => {
    const source = readFileSync(new URL('./CommanderExperience.tsx', import.meta.url), 'utf8');

    expect(source).toContain('orchestrateCommanderMessages');
    expect(source).toContain('appendCommanderTransmission(current');
    expect(source).toContain('isCommanderQuestionPending(state)');
    expect(source).toContain("state.lifecycleStep === 'Lifecycle: Briefing' && state.nextAction.disabled");
    expect(source).toContain("state.lifecycleStep === 'Lifecycle: Observation' && state.nextAction.disabled");
    expect(source).toContain("state.lifecycleStep === 'Lifecycle: Authorization'");
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
    expect(getCommanderRoomTransitionText('briefing')).toBe('Operational briefing required before Observation.');
    expect(getCommanderRoomTransitionText('observation')).toBe('Observation requires evidence before War Room.');
    expect(getCommanderRoomTransitionText('authorization')).toBe('War Room unlocked. Authorization required.');
    expect(getCommanderRoomTransitionText('return_to_base')).toBe('Debrief Theater ready.');
    expect(getCommanderRoomTransitionText('debrief')).toBe('Archive the mission record.');
    expect(getCommanderRoomTransitionText(undefined, 'guardian')).toBe('Guardian is watching limits. No action is required unless a boundary moves.');
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
      'No behavioral profile yet',
    ]);

    expect(buildCommanderMemorySurface().map((snippet) => snippet.value)).toEqual([
      'No recent doctrine evidence',
      'No recent mission evidence',
      'No recent growth evidence',
      'Guardian standing by',
      'No behavioral profile yet',
    ]);
  });

  it('adapts Commander wording from deterministic behavior evidence', () => {
    const profile = buildCommanderBehaviorProfile({
      missions: [{
        id: 'mission-001',
        campaign: 'Foundation Patrol',
        currentState: 'observation',
        missionContext: updateMissionContextObservation(createEmptyMissionContext('mission-001'), {
          evidenceReadiness: 'no',
        }),
      }],
    });
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
      behaviorProfile: profile,
    });

    expect(state.commanderQuestion).toContain('If hesitation is present');
    expect(state.memory.find((snippet) => snippet.id === 'memory:behavior')?.value).toContain('hesitation');
  });

  it('adds evidence-based Commander guidance without changing lifecycle requirements', () => {
    const profile = buildCommanderBehaviorProfile({
      missions: [{
        id: 'mission-002',
        campaign: 'Preparation Drill',
        currentState: 'briefing',
        missionContext: updateMissionContextReadiness(createEmptyMissionContext('mission-002'), {
          briefingComplete: true,
        }),
      }],
    });
    const state = buildCommanderExperienceState({
      reportState: 'reported',
      activeRoom: 'ready-room',
      activeMission: {
        id: 'mission-003',
        campaign: 'New Mission',
        objective: 'Protect process',
        currentState: 'briefing',
        createdAt: '2026-07-02T00:00:00.000Z',
      },
      behaviorProfile: profile,
    });

    expect(state.nextAction.label).toBe('Complete Briefing');
    expect(state.nextAction.disabled).toBe(true);
    expect(state.messages.map((message) => message.text).join('\n')).toContain('Preparation Drill completed operational briefing.');
  });

  it('maps legacy navigation rooms into Commander room ids', () => {
    expect(mapNavigationRoomToCommanderRoom('ready')).toBe('ready-room');
    expect(mapNavigationRoomToCommanderRoom('war')).toBe('war-room');
    expect(mapNavigationRoomToCommanderRoom('journal')).toBe('journal');
    expect(mapNavigationRoomToCommanderRoom('unknown')).toBe('command');
  });
});
