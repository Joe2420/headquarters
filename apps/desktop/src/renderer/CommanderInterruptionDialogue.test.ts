import { describe, expect, it } from 'vitest';
import {
  createHeadquartersAttentionRequest,
  createHeadquartersInterruptionSession,
  resolveInterruptionSession,
  type LivingHeadquartersDecision,
} from '@headquarters/hqos';
import {
  buildCommanderInterruptionDialogue,
  buildCommanderResolutionDialogue,
  buildCommanderReturnDialogue,
} from './CommanderInterruptionDialogue';

const request = createHeadquartersAttentionRequest({
  requestId: 'guardian-lockout',
  sourceSubsystem: 'guardian',
  requestType: 'guardian_lockout_active',
  title: 'Guardian lockout',
  summary: 'Risk ceiling exceeded.',
  reason: 'Authorization is suspended because risk evidence exceeded the declared ceiling.',
  urgency: 'critical',
  severity: 'critical',
  recommendedRoom: 'war-room',
  recommendedAction: 'review_guardian_lockout',
  blocking: true,
  interruptionPolicy: 'interrupt_immediately',
  evidenceReferences: [{ id: 'risk-alert-1', source: 'guardian', description: 'risk ceiling evidence' }],
  sourceEntityId: 'risk-alert-1',
  createdAt: '2026-07-12T10:00:00.000Z',
});

const baseDecision: LivingHeadquartersDecision = {
  highestEligibleRequest: request,
  requestToSurface: request,
  requestsQueued: [],
  interruptionAllowed: true,
  interruptionReason: 'Headquarters is at a safe interruption point.',
  CommanderIntent: 'interruptForCriticalRequest',
  recommendedRoom: 'war-room',
  recommendedAction: 'review_guardian_lockout',
  preservedContext: {
    previousRoom: 'war-room',
    previousSelectedView: 'commander-chat',
    activeMissionId: 'mission-1',
    lifecycleStage: 'authorization',
    activeCommanderQuestionId: 'question-1',
    conversationIntent: 'authorization',
  },
  returnPlan: {
    returnRoom: 'war-room',
    returnView: 'commander-chat',
    resumeQuestionId: 'question-1',
    resumeIntent: 'authorization',
    reason: 'Return after Guardian lockout.',
  },
};

describe('CommanderInterruptionDialogue', () => {
  it('creates one Commander interruption message with evidence and return path', () => {
    const [message] = buildCommanderInterruptionDialogue({
      decision: baseDecision,
      lifecycleStep: 'authorization',
      relationshipMode: 'challenging',
    });

    expect(message?.text).toContain('Guardian requests immediate attention');
    expect(message?.text).toContain('risk ceiling evidence');
    expect(message?.text).toContain('return to war room');
    expect(message?.source).toBe('commander');
  });

  it('does not repeat acknowledged interruption dialogue', () => {
    const messages = buildCommanderInterruptionDialogue({
      decision: baseDecision,
      lifecycleStep: 'authorization',
      acknowledgedRequestIds: ['guardian-lockout'],
    });

    expect(messages).toHaveLength(0);
  });

  it('keeps optional queued work concise and non-interrupting', () => {
    const doctrine = createHeadquartersAttentionRequest({
      requestId: 'doctrine-1',
      sourceSubsystem: 'doctrine',
      requestType: 'doctrine_candidate_ready',
      title: 'Doctrine candidate ready',
      summary: 'Candidate is ready for review.',
      reason: 'A pattern has enough evidence for review.',
      urgency: 'routine',
      severity: 'notice',
      recommendedRoom: 'mission-room',
      recommendedAction: 'review_doctrine_candidate',
      blocking: false,
      interruptionPolicy: 'queue_until_mission_complete',
      evidenceReferences: [{ id: 'journal-1', source: 'journal' }],
      sourceEntityId: 'doctrine-1',
      createdAt: '2026-07-12T10:00:00.000Z',
    });
    const [message] = buildCommanderInterruptionDialogue({
      decision: {
        ...baseDecision,
        highestEligibleRequest: doctrine,
        requestToSurface: undefined,
        requestsQueued: [doctrine],
        interruptionAllowed: false,
        CommanderIntent: 'queueAttentionRequest',
      },
      lifecycleStep: 'observation',
    });

    expect(message?.text).toContain('queued it for the next safe moment');
    expect(message?.purpose).toBe('summary');
  });

  it('builds return and resolution messages without duplicating the original question', () => {
    const session = createHeadquartersInterruptionSession({
      interruptionId: 'interruption-1',
      attentionRequestId: 'guardian-lockout',
      startedAt: '2026-07-12T10:00:00.000Z',
      sourceContext: baseDecision.preservedContext,
      interruptionRoom: 'war-room',
      interruptionView: 'guardian-review',
      CommanderQuestionSnapshot: {
        questionId: 'question-1',
        prompt: 'Do you request authorization?',
        room: 'war-room',
        intent: 'authorization',
        answered: false,
      },
      lifecycleSnapshot: {
        missionId: 'mission-1',
        lifecycleStage: 'authorization',
        missionState: 'authorization',
        recommendedRoom: 'war-room',
      },
      missionContextRevision: 1,
    });
    const resolved = resolveInterruptionSession(session, {
      action: 'guardian reviewed',
      successful: true,
      evidenceReferences: ['risk-alert-1'],
      resolvedAt: '2026-07-12T10:05:00.000Z',
    });

    expect(buildCommanderReturnDialogue(resolved).text).toContain('Resuming the suspended question');
    expect(buildCommanderResolutionDialogue(resolved)?.text).toContain('Evidence preserved');
  });
});
