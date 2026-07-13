import { describe, expect, it } from 'vitest';
import { GuardianInterventionService } from './GuardianInterventionService';
import type { GuardianEvidence, GuardianRecoveryPlan } from './GuardianProtection';

const evidence: GuardianEvidence = {
  evidenceId: 'guardian:evidence:1',
  source: 'guardian',
  description: 'Risk restriction evidence.',
  missionId: 'mission-1',
};

const recoveryPlan: GuardianRecoveryPlan = {
  recoveryPlanId: 'guardian-recovery:mission-1',
  missionId: 'mission-1',
  title: 'Complete recovery',
  requirements: ['Complete Guardian review.'],
  evidenceReferences: [evidence],
  status: 'pending',
  createdAt: '2026-07-13T00:00:00.000Z',
};

describe('GuardianInterventionService', () => {
  it('keeps caution non-blocking', () => {
    const service = new GuardianInterventionService();
    const intervention = service.startIntervention({
      interventionId: 'guardian-intervention:caution',
      type: 'caution',
      ruleIds: ['rule:caution'],
      severity: 'caution',
      title: 'Caution',
      explanation: 'Review conditions.',
      blockedActions: [],
      evidenceReferences: [evidence],
      createdAt: '2026-07-13T00:00:00.000Z',
    });

    expect(intervention.blockedActions).toEqual([]);
  });

  it('blocks authorization holds correctly', () => {
    const service = new GuardianInterventionService();
    const intervention = service.startIntervention({
      interventionId: 'guardian-intervention:auth-hold',
      type: 'authorization_hold',
      ruleIds: ['rule:risk'],
      severity: 'restriction',
      title: 'Authorization hold',
      explanation: 'Risk exceeds allocation.',
      blockedActions: ['request_authorization', 'approve_authorization'],
      evidenceReferences: [evidence],
      createdAt: '2026-07-13T00:00:00.000Z',
    });

    expect(intervention.blockedActions).toContain('request_authorization');
    expect(service.getHighestPriorityIntervention()?.interventionId).toBe(intervention.interventionId);
  });

  it('requires recovery plans for lockouts and acknowledgement does not resolve', () => {
    const service = new GuardianInterventionService();
    expect(() => service.startIntervention({
      interventionId: 'guardian-intervention:lockout:bad',
      type: 'mission_lockout',
      ruleIds: ['rule:lockout'],
      severity: 'lockout',
      title: 'Lockout',
      explanation: 'Lockout without plan.',
      blockedActions: ['deploy_mission'],
      evidenceReferences: [evidence],
      createdAt: '2026-07-13T00:00:00.000Z',
    })).toThrow(/recovery plan/iu);

    const intervention = service.startIntervention({
      interventionId: 'guardian-intervention:lockout',
      type: 'mission_lockout',
      ruleIds: ['rule:lockout'],
      severity: 'lockout',
      title: 'Lockout',
      explanation: 'Recovery required.',
      blockedActions: ['deploy_mission'],
      evidenceReferences: [evidence],
      recoveryPlan,
      createdAt: '2026-07-13T00:00:00.000Z',
    });
    const acknowledged = service.acknowledgeIntervention(intervention.interventionId, '2026-07-13T00:01:00.000Z');

    expect(acknowledged.state).toBe('acknowledged');
    expect(service.listActiveInterventions()).toHaveLength(1);
  });

  it('records valid recovery and resolves intervention', () => {
    const service = new GuardianInterventionService();
    const intervention = service.startIntervention({
      interventionId: 'guardian-intervention:recovery',
      type: 'recovery_review',
      ruleIds: ['rule:recovery'],
      severity: 'restriction',
      title: 'Recovery',
      explanation: 'Recovery required.',
      blockedActions: ['request_authorization'],
      evidenceReferences: [evidence],
      recoveryPlan,
      createdAt: '2026-07-13T00:00:00.000Z',
    });

    service.beginRecovery(intervention.interventionId);
    service.recordRecoveryEvidence(intervention.interventionId, { ...evidence, evidenceId: 'guardian:evidence:recovery' });
    const resolved = service.resolveIntervention(intervention.interventionId, {
      resolvedAt: '2026-07-13T00:02:00.000Z',
      resolutionReason: 'Recovery evidence accepted.',
    });

    expect(resolved.state).toBe('resolved');
    expect(service.listActiveInterventions()).toHaveLength(0);
    expect(service.listHistoricalInterventions()).toHaveLength(1);
  });

  it('rejects invalid recovery, restores after reload, and suppresses duplicate active starts', () => {
    const service = new GuardianInterventionService();
    const first = service.startIntervention({
      interventionId: 'guardian-intervention:reload',
      type: 'session_lockout',
      ruleIds: ['rule:lockout'],
      severity: 'lockout',
      title: 'Session lockout',
      explanation: 'Session must close.',
      blockedActions: ['continue_session'],
      evidenceReferences: [evidence],
      recoveryPlan,
      createdAt: '2026-07-13T00:00:00.000Z',
    });
    const duplicate = service.startIntervention({
      ...first,
      type: 'session_lockout',
      state: 'active',
      recoveryPlan,
    });

    expect(duplicate).toBe(first);
    expect(() => service.resolveIntervention(first.interventionId, {
      resolvedAt: '2026-07-13T00:02:00.000Z',
      resolutionReason: 'No evidence.',
    })).toThrow(/valid recovery evidence/iu);

    const reloaded = new GuardianInterventionService(service.dumpState());
    expect(reloaded.listActiveInterventions()[0]?.interventionId).toBe(first.interventionId);
  });
});
