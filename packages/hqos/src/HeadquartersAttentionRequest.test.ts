import { describe, expect, it } from 'vitest';
import {
  acknowledgeAttentionRequest,
  canAttentionRequestInterrupt,
  createHeadquartersAttentionRequest,
  getAttentionRequestReturnContext,
  isAttentionRequestActionable,
  normalizeAttentionRequestDeduplicationKey,
  resolveAttentionRequest,
  supersedeAttentionRequest,
} from './HeadquartersAttentionRequest';

const baseInput = {
  requestId: 'request-1',
  sourceSubsystem: 'guardian' as const,
  requestType: 'guardian_lockout_active' as const,
  title: 'Guardian lockout active',
  summary: 'Guardian has blocked current authorization.',
  reason: 'Risk ceiling evidence requires review.',
  urgency: 'critical' as const,
  severity: 'critical' as const,
  recommendedRoom: 'war-room' as const,
  recommendedAction: 'Review Guardian lockout',
  blocking: true,
  interruptionPolicy: 'interrupt_immediately' as const,
  evidenceReferences: [{ id: 'guardian-alert-1', source: 'guardian' as const }],
  sourceEntityId: 'guardian-alert-1',
  createdAt: '2026-07-12T10:00:00.000Z',
};

describe('HeadquartersAttentionRequest', () => {
  it('creates deterministic evidence-backed requests', () => {
    const request = createHeadquartersAttentionRequest(baseInput);

    expect(request.firstEligibleAt).toBe(baseInput.createdAt);
    expect(request.deduplicationKey).toBe('guardian:guardian_lockout_active:guardian-alert-1:guardian-alert-1');
    expect(isAttentionRequestActionable(request)).toBe(true);
    expect(canAttentionRequestInterrupt(request)).toBe(true);
  });

  it('enforces evidence references', () => {
    expect(() => createHeadquartersAttentionRequest({
      ...baseInput,
      evidenceReferences: [],
    })).toThrow(/requires evidence/u);
  });

  it('keeps urgency separate from interruption policy', () => {
    const request = createHeadquartersAttentionRequest({
      ...baseInput,
      requestId: 'request-routine',
      sourceSubsystem: 'doctrine',
      requestType: 'doctrine_candidate_ready',
      urgency: 'routine',
      severity: 'notice',
      blocking: false,
      interruptionPolicy: 'queue_until_mission_complete',
      recommendedRoom: 'mission-room',
      recommendedAction: 'Review doctrine candidate',
      sourceEntityId: 'candidate-1',
      evidenceReferences: [{ id: 'journal-1', source: 'journal' }],
    });

    expect(request.urgency).toBe('routine');
    expect(request.interruptionPolicy).toBe('queue_until_mission_complete');
    expect(canAttentionRequestInterrupt(request)).toBe(false);
  });

  it('normalizes duplicate keys', () => {
    expect(normalizeAttentionRequestDeduplicationKey(' Guardian Alert :: Risk Ceiling! ')).toBe(
      'guardian-alert-::-risk-ceiling',
    );
  });

  it('acknowledgement and resolution preserve original evidence history', () => {
    const request = createHeadquartersAttentionRequest(baseInput);
    const acknowledged = acknowledgeAttentionRequest(request, '2026-07-12T10:01:00.000Z');
    const resolved = resolveAttentionRequest(acknowledged, {
      resolvedAt: '2026-07-12T10:02:00.000Z',
      resolutionAction: 'risk ceiling reviewed',
    });

    expect(acknowledged.evidenceReferences).toEqual(request.evidenceReferences);
    expect(resolved.evidenceReferences).toEqual(request.evidenceReferences);
    expect(resolved.status).toBe('resolved');
    expect(isAttentionRequestActionable(resolved)).toBe(false);
  });

  it('returns immutable context copies through read APIs', () => {
    const request = createHeadquartersAttentionRequest({
      ...baseInput,
      returnContext: {
        previousRoom: 'war-room',
        previousSelectedView: 'commander-chat',
        activeMissionId: 'mission-1',
        lifecycleStage: 'authorization',
        activeCommanderQuestionId: 'question-1',
        conversationIntent: 'authorization',
        scrollSection: 'authorization-panel',
        transitionState: 'idle',
        originatingPriorityId: 'priority-1',
      },
    });

    const first = getAttentionRequestReturnContext(request);
    const second = getAttentionRequestReturnContext(request);

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });

  it('prevents background requests from interrupting and keeps superseded history', () => {
    const request = createHeadquartersAttentionRequest({
      ...baseInput,
      requestId: 'academy-1',
      sourceSubsystem: 'academy',
      requestType: 'academy_milestone_ready',
      urgency: 'background',
      severity: 'background',
      blocking: false,
      interruptionPolicy: 'background_only',
      recommendedRoom: 'command-center',
      recommendedAction: 'Review recognition',
      sourceEntityId: 'milestone-1',
      evidenceReferences: [{ id: 'recognition-1', source: 'academy' }],
    });

    const superseded = supersedeAttentionRequest(request, 'academy-2');

    expect(canAttentionRequestInterrupt(request)).toBe(false);
    expect(superseded.status).toBe('superseded');
    expect(superseded.evidenceReferences).toEqual(request.evidenceReferences);
  });
});
