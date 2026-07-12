import { describe, expect, it } from 'vitest';
import {
  activateInterruptionSession,
  beginInterruptionReturn,
  canStartInterruptionSession,
  completeInterruptionReturn,
  createHeadquartersInterruptionSession,
  deserializeInterruptionSession,
  failInterruptionSession,
  getInterruptionResumeQuestion,
  recoverInterruptionSessionAfterReload,
  resolveInterruptionSession,
  serializeInterruptionSession,
} from './HeadquartersInterruptionSession';

const input = {
  interruptionId: 'interruption-1',
  attentionRequestId: 'request-1',
  startedAt: '2026-07-12T10:00:00.000Z',
  sourceContext: {
    previousRoom: 'war-room' as const,
    previousSelectedView: 'commander-chat',
    activeMissionId: 'mission-1',
    lifecycleStage: 'authorization' as const,
    activeCommanderQuestionId: 'question-1',
    conversationIntent: 'authorization',
    transitionState: 'idle',
  },
  interruptionRoom: 'war-room',
  interruptionView: 'guardian-review',
  CommanderQuestionSnapshot: {
    questionId: 'question-1',
    prompt: 'Request authorization?',
    room: 'war-room',
    intent: 'authorization',
    answered: false,
  },
  lifecycleSnapshot: {
    missionId: 'mission-1',
    lifecycleStage: 'authorization' as const,
    missionState: 'authorization',
    recommendedRoom: 'war-room',
  },
  missionContextRevision: 3,
};

describe('HeadquartersInterruptionSession', () => {
  it('captures active question and source context before interruption movement', () => {
    const session = createHeadquartersInterruptionSession(input);

    expect(session.status).toBe('prepared');
    expect(session.CommanderQuestionSnapshot?.questionId).toBe('question-1');
    expect(session.returnContext.previousRoom).toBe('war-room');
    expect(session.suppressTransitionReplay).toBe(true);
  });

  it('restores a still-valid suspended question on return', () => {
    const session = createHeadquartersInterruptionSession(input);

    expect(getInterruptionResumeQuestion(session, ['question-1'])).toEqual(input.CommanderQuestionSnapshot);
    expect(getInterruptionResumeQuestion(session, ['question-2'])).toBeUndefined();
  });

  it('survives reload and marks recovery message as shown once', () => {
    const active = activateInterruptionSession(createHeadquartersInterruptionSession(input));
    const reloaded = deserializeInterruptionSession(serializeInterruptionSession(active));
    const recovered = recoverInterruptionSessionAfterReload(reloaded);

    expect(recovered.status).toBe('active');
    expect(recovered.recoveryMessageShown).toBe(true);
    expect(recovered.suppressTransitionReplay).toBe(true);
  });

  it('does not reopen a completed request', () => {
    const resolved = resolveInterruptionSession(activateInterruptionSession(createHeadquartersInterruptionSession(input)), {
      action: 'guardian reviewed',
      successful: true,
      evidenceReferences: ['guardian-1'],
      resolvedAt: '2026-07-12T10:05:00.000Z',
    });
    const completed = completeInterruptionReturn(beginInterruptionReturn(resolved), '2026-07-12T10:06:00.000Z');

    expect(canStartInterruptionSession([completed], 'request-1')).toBe(true);
  });

  it('prevents duplicate active interruption sessions for one request', () => {
    const active = activateInterruptionSession(createHeadquartersInterruptionSession(input));

    expect(canStartInterruptionSession([active], 'request-1')).toBe(false);
    expect(canStartInterruptionSession([active], 'request-2')).toBe(true);
  });

  it('keeps failed interruptions recoverable instead of silently returning', () => {
    const failed = failInterruptionSession(activateInterruptionSession(createHeadquartersInterruptionSession(input)), {
      action: 'guardian review failed',
      successful: true,
      evidenceReferences: ['guardian-1'],
      resolvedAt: '2026-07-12T10:05:00.000Z',
    });

    expect(failed.status).toBe('failed');
    expect(failed.resolutionResult?.successful).toBe(false);
    expect(() => beginInterruptionReturn(failed)).toThrow(/cannot return before resolution/u);
  });
});
