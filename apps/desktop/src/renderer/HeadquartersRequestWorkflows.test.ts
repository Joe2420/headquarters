import { describe, expect, it } from 'vitest';
import { createHeadquartersAttentionRequest } from '@headquarters/hqos';
import {
  buildHeadquartersRequestWorkflow,
  resolveHeadquartersRequestWorkflow,
} from './HeadquartersRequestWorkflows';

describe('HeadquartersRequestWorkflows', () => {
  it('builds a Guardian interruption workflow and return-capable resolution', () => {
    const workflow = buildHeadquartersRequestWorkflow(request({
      sourceSubsystem: 'guardian',
      requestType: 'guardian_lockout_active',
      blocking: true,
      urgency: 'critical',
      severity: 'critical',
      interruptionPolicy: 'interrupt_immediately',
      recommendedAction: 'review_guardian_lockout',
    }));

    expect(workflow.kind).toBe('guardian-interruption');
    expect(workflow.steps.map((step) => step.action)).toContain('resolve');
    expect(resolveHeadquartersRequestWorkflow(workflow, 'resolve').returnToPreviousContext).toBe(true);
  });

  it('supports Doctrine defer and later review actions', () => {
    const workflow = buildHeadquartersRequestWorkflow(request({
      sourceSubsystem: 'doctrine',
      requestType: 'doctrine_candidate_ready',
      blocking: false,
      urgency: 'routine',
      severity: 'notice',
      interruptionPolicy: 'queue_until_mission_complete',
      recommendedAction: 'review_doctrine_candidate',
    }));

    expect(workflow.kind).toBe('doctrine-review');
    expect(resolveHeadquartersRequestWorkflow(workflow, 'defer').status).toBe('queued');
    expect(resolveHeadquartersRequestWorkflow(workflow, 'approve').status).toBe('resolved');
  });

  it('links Journal follow-up completion to a resolved request', () => {
    const workflow = buildHeadquartersRequestWorkflow(request({
      sourceSubsystem: 'journal',
      requestType: 'journal_follow_up_required',
      blocking: false,
      urgency: 'routine',
      severity: 'notice',
      interruptionPolicy: 'mention_in_next_brief',
      recommendedAction: 'complete_journal_follow_up',
    }));

    expect(workflow.kind).toBe('journal-follow-up');
    expect(resolveHeadquartersRequestWorkflow(workflow, 'write_entry').status).toBe('resolved');
  });

  it('keeps Academy recognition calm and resolvable in standby', () => {
    const workflow = buildHeadquartersRequestWorkflow(request({
      sourceSubsystem: 'academy',
      requestType: 'academy_milestone_ready',
      blocking: false,
      urgency: 'background',
      severity: 'background',
      interruptionPolicy: 'queue_until_mission_complete',
      recommendedAction: 'review_academy_recognition',
    }));

    expect(workflow.kind).toBe('academy-recognition');
    expect(workflow.statusAfterPrimary).toBe('resolved');
  });

  it('routes Intelligence contradiction to clarification work', () => {
    const workflow = buildHeadquartersRequestWorkflow(request({
      sourceSubsystem: 'intelligence',
      requestType: 'intelligence_contradiction_detected',
      blocking: true,
      urgency: 'immediate',
      severity: 'blocking',
      interruptionPolicy: 'interrupt_at_safe_point',
      recommendedAction: 'clarify_intelligence_contradiction',
    }));

    expect(workflow.kind).toBe('intelligence-contradiction');
    expect(resolveHeadquartersRequestWorkflow(workflow, 'clarify_evidence').status).toBe('resolved');
  });

  it('rejects unavailable actions so workflows cannot silently lose context', () => {
    const workflow = buildHeadquartersRequestWorkflow(request({
      sourceSubsystem: 'academy',
      requestType: 'academy_milestone_ready',
      blocking: false,
      urgency: 'background',
      severity: 'background',
      interruptionPolicy: 'background_only',
      recommendedAction: 'review_academy_recognition',
    }));

    expect(() => resolveHeadquartersRequestWorkflow(workflow, 'approve')).toThrow(/not available/u);
  });
});

function request(input: {
  readonly sourceSubsystem: 'guardian' | 'doctrine' | 'journal' | 'academy' | 'intelligence';
  readonly requestType:
    | 'guardian_lockout_active'
    | 'doctrine_candidate_ready'
    | 'journal_follow_up_required'
    | 'academy_milestone_ready'
    | 'intelligence_contradiction_detected';
  readonly blocking: boolean;
  readonly urgency: 'critical' | 'immediate' | 'soon' | 'routine' | 'background';
  readonly severity: 'critical' | 'blocking' | 'warning' | 'notice' | 'background';
  readonly interruptionPolicy:
    | 'interrupt_immediately'
    | 'interrupt_at_safe_point'
    | 'mention_in_next_brief'
    | 'queue_until_mission_complete'
    | 'background_only';
  readonly recommendedAction: string;
}) {
  return createHeadquartersAttentionRequest({
    requestId: `${input.sourceSubsystem}-request`,
    sourceSubsystem: input.sourceSubsystem,
    requestType: input.requestType,
    title: `${input.sourceSubsystem} request`,
    summary: 'Evidence-backed request.',
    reason: 'Evidence requires operator action.',
    urgency: input.urgency,
    severity: input.severity,
    recommendedRoom: input.sourceSubsystem === 'guardian' ? 'war-room' : 'mission-room',
    recommendedAction: input.recommendedAction,
    blocking: input.blocking,
    interruptionPolicy: input.interruptionPolicy,
    evidenceReferences: [{ id: `${input.sourceSubsystem}-evidence`, source: input.sourceSubsystem }],
    sourceEntityId: `${input.sourceSubsystem}-entity`,
    createdAt: '2026-07-12T10:00:00.000Z',
    missionId: 'mission-1',
  });
}
