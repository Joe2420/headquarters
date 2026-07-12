import { describe, expect, it } from 'vitest';
import type { Mission } from '@headquarters/shared';
import { createHeadquartersAttentionRequest } from './HeadquartersAttentionRequest';
import type { HeadquartersAttentionRequestInput } from './HeadquartersAttentionRequest';
import { getHighestPriority } from './HeadquartersPriorityEngine';
import { orchestrateLivingHeadquarters } from './LivingHeadquartersOrchestrator';
import { projectMissionLifecycle } from './MissionLifecycleProjection';

const mission: Mission = {
  id: 'mission-1',
  codename: 'London open',
  state: 'observation',
  createdAt: '2026-07-12T09:00:00.000Z',
  updatedAt: '2026-07-12T09:00:00.000Z',
};

const lifecycle = projectMissionLifecycle(mission);
const priority = getHighestPriority({ lifecycle, detectedAt: '2026-07-12T10:00:00.000Z' });

const baseInput = {
  lifecycle,
  priorities: [priority],
  conversation: {
    activeQuestionPending: false,
    activeCommanderQuestionId: 'question-1',
    conversationIntent: 'observation',
  },
  runtime: {
    currentRoom: 'observation-room' as const,
    selectedView: 'commander-chat',
    transition: { running: false },
  },
  evaluatedAt: '2026-07-12T10:00:00.000Z',
};

describe('LivingHeadquartersOrchestrator', () => {
  it('allows critical Guardian lockout to interrupt and preserve return context', () => {
    const request = requestFor({
      requestId: 'guardian-lockout',
      requestType: 'guardian_lockout_active',
      sourceSubsystem: 'guardian',
      urgency: 'critical',
      severity: 'critical',
      blocking: true,
      interruptionPolicy: 'interrupt_immediately',
      recommendedRoom: 'war-room',
      recommendedAction: 'review_guardian_lockout',
    });

    const decision = orchestrateLivingHeadquarters({
      ...baseInput,
      pendingRequests: [request],
    });

    expect(decision.interruptionAllowed).toBe(true);
    expect(decision.CommanderIntent).toBe('interruptForCriticalRequest');
    expect(decision.requestToSurface?.requestId).toBe('guardian-lockout');
    expect(decision.returnPlan?.returnRoom).toBe('observation-room');
    expect(decision.returnPlan?.resumeQuestionId).toBe('question-1');
  });

  it('queues routine Doctrine work during Observation', () => {
    const request = requestFor({
      requestId: 'doctrine-candidate',
      requestType: 'doctrine_candidate_ready',
      sourceSubsystem: 'doctrine',
      urgency: 'routine',
      severity: 'notice',
      blocking: false,
      interruptionPolicy: 'queue_until_mission_complete',
      recommendedRoom: 'mission-room',
      recommendedAction: 'review_doctrine_candidate',
    });

    const decision = orchestrateLivingHeadquarters({
      ...baseInput,
      pendingRequests: [request],
    });

    expect(decision.requestToSurface).toBeUndefined();
    expect(decision.requestsQueued).toHaveLength(1);
    expect(decision.CommanderIntent).toBe('queueAttentionRequest');
  });

  it('prevents non-critical interruption while a Commander question is pending', () => {
    const request = requestFor({
      requestId: 'journal-follow-up',
      requestType: 'journal_follow_up_required',
      sourceSubsystem: 'journal',
      urgency: 'immediate',
      severity: 'blocking',
      blocking: true,
      interruptionPolicy: 'interrupt_at_safe_point',
      recommendedRoom: 'mission-room',
      recommendedAction: 'complete_journal_follow_up',
    });

    const decision = orchestrateLivingHeadquarters({
      ...baseInput,
      conversation: { ...baseInput.conversation, activeQuestionPending: true },
      pendingRequests: [request],
    });

    expect(decision.interruptionAllowed).toBe(false);
    expect(decision.noOpReason).toBe('A Commander question is awaiting an answer.');
  });

  it('prevents interruption while transition is running', () => {
    const request = requestFor({
      requestId: 'intelligence-1',
      requestType: 'intelligence_contradiction_detected',
      sourceSubsystem: 'intelligence',
      urgency: 'immediate',
      severity: 'blocking',
      blocking: true,
      interruptionPolicy: 'interrupt_at_safe_point',
      recommendedRoom: 'observation-room',
      recommendedAction: 'clarify_intelligence_contradiction',
    });

    const decision = orchestrateLivingHeadquarters({
      ...baseInput,
      runtime: { ...baseInput.runtime, transition: { running: true } },
      pendingRequests: [request],
    });

    expect(decision.requestToSurface).toBeUndefined();
    expect(decision.noOpReason).toBe('A room transition is already running.');
  });

  it('does not interrupt twice for a surfaced duplicate request', () => {
    const request = requestFor({
      requestId: 'guardian-lockout',
      requestType: 'guardian_lockout_active',
      sourceSubsystem: 'guardian',
      urgency: 'critical',
      severity: 'critical',
      blocking: true,
      interruptionPolicy: 'interrupt_immediately',
      recommendedRoom: 'war-room',
      recommendedAction: 'review_guardian_lockout',
    });

    const decision = orchestrateLivingHeadquarters({
      ...baseInput,
      pendingRequests: [request],
      surfacedRequestIds: ['guardian-lockout'],
    });

    expect(decision.requestToSurface).toBeUndefined();
    expect(decision.noOpReason).toBe('no_actionable_request');
  });

  it('returns a stable no-op when no request is actionable', () => {
    const decision = orchestrateLivingHeadquarters({
      ...baseInput,
      pendingRequests: [],
    });

    expect(decision.CommanderIntent).toBe('standby');
    expect(decision.noOpReason).toBe('no_actionable_request');
    expect(decision.recommendedRoom).toBe('observation-room');
  });
});

function requestFor(input: Partial<HeadquartersAttentionRequestInput> & {
  readonly requestId: string;
  readonly requestType: HeadquartersAttentionRequestInput['requestType'];
  readonly sourceSubsystem: HeadquartersAttentionRequestInput['sourceSubsystem'];
  readonly urgency: HeadquartersAttentionRequestInput['urgency'];
  readonly severity: HeadquartersAttentionRequestInput['severity'];
  readonly blocking: boolean;
  readonly interruptionPolicy: HeadquartersAttentionRequestInput['interruptionPolicy'];
  readonly recommendedRoom: HeadquartersAttentionRequestInput['recommendedRoom'];
  readonly recommendedAction: string;
}) {
  return createHeadquartersAttentionRequest({
    title: input.requestId,
    summary: 'Request summary.',
    reason: 'Request reason.',
    evidenceReferences: [{ id: `${input.requestId}-evidence`, source: input.sourceSubsystem }],
    sourceEntityId: input.requestId,
    createdAt: '2026-07-12T10:00:00.000Z',
    firstEligibleAt: '2026-07-12T10:00:00.000Z',
    ...input,
  });
}
