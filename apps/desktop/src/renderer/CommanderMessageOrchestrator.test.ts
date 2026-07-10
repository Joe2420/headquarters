import { describe, expect, it } from 'vitest';
import {
  buildCommanderQuestionDedupeKey,
  isRawSubsystemSignal,
  orchestrateCommanderMessages,
  type CommanderMessageCandidate,
} from './CommanderMessageOrchestrator';

const baseCandidate: CommanderMessageCandidate = {
  id: 'candidate:base',
  room: 'observation',
  lifecycleStep: 'Lifecycle: Observation',
  purpose: 'question',
  text: 'What direction is price currently moving?',
  source: 'commander',
};

describe('CommanderMessageOrchestrator', () => {
  it('merges acknowledgement and next question into one Commander response block', () => {
    const messages = orchestrateCommanderMessages([
      {
        ...baseCandidate,
        id: 'ack',
        purpose: 'acknowledgement',
        text: 'Operating market logged.',
      },
      {
        ...baseCandidate,
        id: 'question',
        purpose: 'question',
        text: "Describe today's market environment.",
      },
    ], { activeQuestionPending: false });

    expect(messages).toHaveLength(1);
    expect(messages[0]?.text).toBe("Operating market logged.\n\nDescribe today's market environment.");
  });

  it('suppresses duplicate Commander prompts by room lifecycle purpose and text', () => {
    const messages = orchestrateCommanderMessages([
      baseCandidate,
      { ...baseCandidate, id: 'candidate:duplicate' },
    ], { activeQuestionPending: false });

    expect(messages).toHaveLength(1);
  });

  it('suppresses duplicate questions even when lifecycle and acknowledgement prefaces differ', () => {
    const rendered = {
      ...baseCandidate,
      id: 'rendered:mission-created',
      room: 'ready-room',
      lifecycleStep: 'Lifecycle: Briefing',
      text: 'Mission created. Prepare before moving further.\n\nDescribe today\'s market environment?',
    } satisfies CommanderMessageCandidate;
    const messages = orchestrateCommanderMessages([
      {
        ...rendered,
        id: 'candidate:acknowledgement',
        purpose: 'acknowledgement',
        text: 'The mission file now has its market.\n\nDescribe today\'s market environment?',
      },
    ], {
      activeQuestionPending: false,
      renderedMessages: [rendered],
    });

    expect(buildCommanderQuestionDedupeKey(rendered)).toBe(
      'ready-room|Lifecycle: Briefing|describe today\'s market environment?',
    );
    expect(messages).toEqual([]);
  });

  it('filters raw intelligence and Guardian subsystem telemetry from Commander Chat', () => {
    expect(isRawSubsystemSignal('Intelligence update: Confidence incomplete at 5%.')).toBe(true);
    expect(isRawSubsystemSignal('Next evidence required: Market.')).toBe(true);
    expect(isRawSubsystemSignal('Guardian reports: Guardian rules are explicit and deterministic.')).toBe(true);

    const messages = orchestrateCommanderMessages([
      {
        ...baseCandidate,
        id: 'intelligence',
        purpose: 'subsystem-signal',
        text: 'Intelligence update: Confidence incomplete at 5%.',
        source: 'intelligence',
      },
      {
        ...baseCandidate,
        id: 'guardian',
        purpose: 'subsystem-signal',
        text: 'Guardian reports: Guardian rules are explicit and deterministic.',
        source: 'guardian',
      },
    ], { activeQuestionPending: false });

    expect(messages).toEqual([]);
  });

  it('suppresses passive messages during active question flow', () => {
    const messages = orchestrateCommanderMessages([
      {
        ...baseCandidate,
        id: 'passive',
        purpose: 'passive',
        text: 'Holding silence is active work.',
        source: 'passive',
      },
    ], { activeQuestionPending: true });

    expect(messages).toEqual([]);
  });
});
