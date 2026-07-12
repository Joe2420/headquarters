import { describe, expect, it } from 'vitest';
import {
  beginInterruptionReturn,
  completeInterruptionReturn,
  createHeadquartersAttentionRequest,
  createHeadquartersInterruptionSession,
  createLivingHeadquartersHistory,
  deserializeLivingHeadquartersHistory,
  explainCommanderDeferral,
  explainCommanderInterruption,
  listCompletedInterruptions,
  listHistoryByMission,
  listHistoryBySubsystem,
  listUnresolvedRequests,
  recordAttentionRequestCreated,
  recordAttentionRequestQueued,
  recordInterruptionCompleted,
  recordInterruptionStarted,
  reconstructInterruptionSession,
  resolveInterruptionSession,
  serializeLivingHeadquartersHistory,
  buildMissionDossierOrchestrationSummary,
} from './index';

const request = createHeadquartersAttentionRequest({
  requestId: 'request-1',
  sourceSubsystem: 'guardian',
  requestType: 'guardian_lockout_active',
  title: 'Guardian lockout',
  summary: 'Risk ceiling exceeded.',
  reason: 'Risk ceiling exceeded.',
  urgency: 'critical',
  severity: 'critical',
  recommendedRoom: 'war-room',
  recommendedAction: 'review_guardian_lockout',
  blocking: true,
  interruptionPolicy: 'interrupt_immediately',
  evidenceReferences: [{ id: 'guardian-1', source: 'guardian' }],
  sourceEntityId: 'guardian-1',
  missionId: 'mission-1',
  createdAt: '2026-07-12T10:00:00.000Z',
});

const session = createHeadquartersInterruptionSession({
  interruptionId: 'interruption-1',
  attentionRequestId: 'request-1',
  startedAt: '2026-07-12T10:01:00.000Z',
  sourceContext: {
    previousRoom: 'war-room',
    previousSelectedView: 'commander-chat',
    activeMissionId: 'mission-1',
    lifecycleStage: 'authorization',
  },
  interruptionRoom: 'war-room',
  interruptionView: 'guardian-review',
  lifecycleSnapshot: {
    missionId: 'mission-1',
    lifecycleStage: 'authorization',
    recommendedRoom: 'war-room',
  },
  missionContextRevision: 1,
});

describe('LivingHeadquartersHistory', () => {
  it('preserves chronological order and survives reload', () => {
    const history = createLivingHeadquartersHistory([
      recordInterruptionStarted(session),
      recordAttentionRequestCreated(request),
    ]);
    const reloaded = deserializeLivingHeadquartersHistory(serializeLivingHeadquartersHistory(history));

    expect(reloaded.events.map((event) => event.eventType)).toEqual([
      'request_created',
      'interruption_started',
    ]);
  });

  it('queries history by mission and subsystem', () => {
    const history = createLivingHeadquartersHistory([
      recordAttentionRequestCreated(request),
      recordAttentionRequestQueued(request, '2026-07-12T10:02:00.000Z'),
    ]);

    expect(listHistoryByMission(history, 'mission-1')).toHaveLength(2);
    expect(listHistoryBySubsystem(history, 'guardian')).toHaveLength(2);
  });

  it('keeps unresolved requests while resolved requests remain historically available', () => {
    const resolved = createHeadquartersAttentionRequest({
      ...request,
      requestId: 'request-2',
      status: 'resolved',
    });

    expect(listUnresolvedRequests([request, resolved]).map((item) => item.requestId)).toEqual(['request-1']);
  });

  it('reconstructs completed interruption sessions and explanations', () => {
    const resolved = resolveInterruptionSession(session, {
      action: 'guardian reviewed',
      successful: true,
      evidenceReferences: ['guardian-1'],
      resolvedAt: '2026-07-12T10:03:00.000Z',
    });
    const completed = completeInterruptionReturn(beginInterruptionReturn(resolved), '2026-07-12T10:04:00.000Z');
    const completedEvent = recordInterruptionCompleted(completed);
    const history = createLivingHeadquartersHistory([
      recordInterruptionStarted(session),
      ...(completedEvent ? [completedEvent] : []),
    ]);

    expect(listCompletedInterruptions([completed])).toHaveLength(1);
    expect(reconstructInterruptionSession([completed], 'interruption-1')?.status).toBe('completed');
    expect(explainCommanderInterruption(history, 'interruption-1')).toContain('preserved return context');
  });

  it('preserves deferral explanations and mission dossier summaries', () => {
    const history = createLivingHeadquartersHistory([
      recordAttentionRequestCreated(request),
      recordAttentionRequestQueued(request, '2026-07-12T10:02:00.000Z'),
      recordInterruptionStarted(session),
    ]);

    expect(explainCommanderDeferral(history, 'request-1')).toContain('Commander deferred');
    expect(buildMissionDossierOrchestrationSummary(history, 'mission-1')).toEqual([
      'interruption_started: Commander interrupted the current operation and preserved return context.',
      'request_queued: Commander deferred Guardian lockout: Risk ceiling exceeded.',
    ]);
  });
});
