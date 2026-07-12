import { describe, expect, it } from 'vitest';
import { projectMissionLifecycle } from './MissionLifecycleProjection';
import {
  buildAcademyAttentionRequests,
  buildDoctrineAttentionRequests,
  buildGuardianAttentionRequests,
  buildIntelligenceAttentionRequests,
  buildSubsystemAttentionRequests,
} from './HeadquartersAttentionRequestAdapters';
import type { AttentionAdapterContext } from './HeadquartersAttentionRequestAdapters';
import type { Mission } from '@headquarters/shared';

const activeMission: Mission = {
  id: 'mission-1',
  codename: 'London open',
  state: 'observation',
  createdAt: '2026-07-12T09:00:00.000Z',
  updatedAt: '2026-07-12T09:00:00.000Z',
};

const context: AttentionAdapterContext = {
  lifecycle: projectMissionLifecycle(activeMission),
  createdAt: '2026-07-12T10:00:00.000Z',
};

describe('HeadquartersAttentionRequestAdapters', () => {
  it('creates an immediate critical Guardian lockout request', () => {
    const [request] = buildGuardianAttentionRequests([{
      id: 'lockout-1',
      level: 'lockout',
      title: 'Guardian lockout',
      summary: 'Declared risk ceiling has been exceeded.',
      evidenceReferences: [{ id: 'risk-alert-1', source: 'guardian' }],
      missionId: 'mission-1',
    }], context);

    expect(request?.requestType).toBe('guardian_lockout_active');
    expect(request?.urgency).toBe('critical');
    expect(request?.interruptionPolicy).toBe('interrupt_immediately');
    expect(request?.blocking).toBe(true);
    expect(request?.evidenceReferences).toEqual([{ id: 'risk-alert-1', source: 'guardian' }]);
  });

  it('queues optional Doctrine work during an active mission', () => {
    const [request] = buildDoctrineAttentionRequests([{
      id: 'candidate-1',
      title: 'Wait for confirmation',
      proposedRule: 'Do not authorize without visible structure confirmation.',
      evidenceReferences: [{ id: 'journal-1', source: 'journal' }],
    }], context);

    expect(request?.requestType).toBe('doctrine_candidate_ready');
    expect(request?.interruptionPolicy).toBe('queue_until_mission_complete');
    expect(request?.blocking).toBe(false);
  });

  it('keeps Academy recognition as background work during critical lifecycle activity', () => {
    const [request] = buildAcademyAttentionRequests([{
      id: 'recognition-1',
      title: 'Observation discipline recognized',
      reason: 'The operator waited through the full observation window.',
      evidenceReferences: [{ id: 'mission-1', source: 'academy' }],
    }], context);

    expect(request?.requestType).toBe('academy_milestone_ready');
    expect(request?.urgency).toBe('background');
    expect(request?.interruptionPolicy).toBe('queue_until_mission_complete');
  });

  it('routes missing authorization evidence to the current lifecycle room without raw counters', () => {
    const [request] = buildIntelligenceAttentionRequests([{
      id: 'missing-evidence-1',
      title: 'Evidence incomplete',
      reason: 'Authorization lacks invalidation evidence.',
      missingEvidence: true,
      blockingAuthorization: true,
      evidenceReferences: [{ id: 'observation-1', source: 'intelligence' }],
    }], context);

    expect(request?.requestType).toBe('intelligence_missing_evidence');
    expect(request?.recommendedRoom).toBe('observation-room');
    expect(request?.blocking).toBe(true);
  });

  it('does not emit requests for resolved or evidence-free source state', () => {
    const requests = buildSubsystemAttentionRequests({
      context,
      guardian: [{
        id: 'resolved-1',
        level: 'warning',
        title: 'Resolved',
        summary: 'Already resolved.',
        evidenceReferences: [{ id: 'guardian-1', source: 'guardian' }],
        resolved: true,
      }],
      doctrine: [{
        id: 'no-evidence-1',
        title: 'No evidence',
        proposedRule: 'Insufficient.',
        evidenceReferences: [],
      }],
    });

    expect(requests).toHaveLength(0);
  });

  it('keeps unchanged source state on the same deduplication key', () => {
    const signal = {
      id: 'candidate-1',
      title: 'Wait for confirmation',
      proposedRule: 'Do not authorize without visible structure confirmation.',
      evidenceReferences: [{ id: 'journal-1', source: 'journal' }],
    };

    const [first] = buildDoctrineAttentionRequests([signal], context);
    const [second] = buildDoctrineAttentionRequests([signal], context);

    expect(first?.deduplicationKey).toBe(second?.deduplicationKey);
  });
});
