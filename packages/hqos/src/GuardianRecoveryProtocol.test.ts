import { describe, expect, it } from 'vitest';
import {
  applyGuardianRecoveryToIntervention,
  createGuardianRecoveryProtocol,
  failGuardianRecoveryRequirement,
  recordGuardianRecoveryEvidence,
} from './GuardianRecoveryProtocol';
import { GuardianInterventionService } from './GuardianInterventionService';
import type { GuardianEvidence, GuardianRecoveryPlan } from './GuardianProtection';

const evidence: GuardianEvidence = {
  evidenceId: 'recovery:evidence',
  source: 'operator',
  description: 'Recovery evidence supplied.',
  missionId: 'mission-1',
};

function protocol() {
  return createGuardianRecoveryProtocol({
    protocolId: 'guardian-recovery-protocol:mission-1',
    interventionId: 'guardian-intervention:mission-1',
    createdAt: '2026-07-13T00:00:00.000Z',
    requirements: [
      {
        requirementId: 'risk',
        type: 'reduce_risk',
        description: 'Reduce requested risk.',
        mandatory: true,
        allowOutOfOrder: false,
      },
      {
        requirementId: 'journal',
        type: 'complete_journal_reflection',
        description: 'Complete journal reflection.',
        mandatory: false,
        allowOutOfOrder: true,
      },
    ],
  });
}

describe('GuardianRecoveryProtocol', () => {
  it('completes immediate recovery requirements', () => {
    const recovered = recordGuardianRecoveryEvidence(protocol(), {
      requirementId: 'risk',
      evidence,
      recordedAt: '2026-07-13T00:01:00.000Z',
    });

    expect(recovered.status).toBe('complete');
    expect(recovered.progress.completed).toBe(1);
  });

  it('keeps partial recovery active and deduplicates evidence', () => {
    const original = createGuardianRecoveryProtocol({
      protocolId: 'guardian-recovery-protocol:partial',
      interventionId: 'guardian-intervention:partial',
      createdAt: '2026-07-13T00:00:00.000Z',
      requirements: [
        { requirementId: 'risk', type: 'reduce_risk', description: 'Reduce risk.', mandatory: true, allowOutOfOrder: true },
        { requirementId: 'debrief', type: 'complete_debrief', description: 'Complete debrief.', mandatory: true, allowOutOfOrder: true },
      ],
    });
    const first = recordGuardianRecoveryEvidence(original, { requirementId: 'risk', evidence, recordedAt: '2026-07-13T00:01:00.000Z' });
    const duplicate = recordGuardianRecoveryEvidence(first, { requirementId: 'risk', evidence, recordedAt: '2026-07-13T00:02:00.000Z' });

    expect(duplicate.status).toBe('in_progress');
    expect(duplicate.evidenceReferences).toHaveLength(1);
  });

  it('waits for future evidence instead of inventing long-term thresholds', () => {
    const waiting = recordGuardianRecoveryEvidence(createGuardianRecoveryProtocol({
      protocolId: 'guardian-recovery-protocol:future',
      interventionId: 'guardian-intervention:future',
      createdAt: '2026-07-13T00:00:00.000Z',
      requirements: [
        { requirementId: 'future', type: 'demonstrate_future_adherence', description: 'Demonstrate future adherence.', mandatory: true, allowOutOfOrder: true },
      ],
    }), {
      requirementId: 'future',
      evidence,
      recordedAt: '2026-07-13T00:01:00.000Z',
    });

    expect(waiting.status).toBe('awaiting_future_evidence');
  });

  it('rejects ordered requirements completed out of order', () => {
    expect(() => recordGuardianRecoveryEvidence(protocol(), {
      requirementId: 'journal',
      evidence,
      recordedAt: '2026-07-13T00:01:00.000Z',
    })).not.toThrow();

    const ordered = createGuardianRecoveryProtocol({
      protocolId: 'guardian-recovery-protocol:ordered',
      interventionId: 'guardian-intervention:ordered',
      createdAt: '2026-07-13T00:00:00.000Z',
      requirements: [
        { requirementId: 'risk', type: 'reduce_risk', description: 'Reduce risk.', mandatory: true, allowOutOfOrder: false },
        { requirementId: 'debrief', type: 'complete_debrief', description: 'Complete debrief.', mandatory: true, allowOutOfOrder: false },
      ],
    });

    expect(() => recordGuardianRecoveryEvidence(ordered, {
      requirementId: 'debrief',
      evidence,
      recordedAt: '2026-07-13T00:01:00.000Z',
    })).toThrow(/out of order/iu);
  });

  it('retains failed requirement history and resolves eligible intervention', () => {
    const service = new GuardianInterventionService();
    const recoveryPlan: GuardianRecoveryPlan = {
      recoveryPlanId: 'recovery-plan',
      missionId: 'mission-1',
      title: 'Recovery',
      requirements: ['Complete recovery.'],
      evidenceReferences: [evidence],
      status: 'pending',
      createdAt: '2026-07-13T00:00:00.000Z',
    };
    const intervention = service.startIntervention({
      interventionId: 'guardian-intervention:mission-1',
      type: 'recovery_review',
      ruleIds: ['rule'],
      severity: 'restriction',
      title: 'Recovery',
      explanation: 'Recovery required.',
      blockedActions: ['request_authorization'],
      evidenceReferences: [evidence],
      recoveryPlan,
      createdAt: '2026-07-13T00:00:00.000Z',
    });
    const failed = failGuardianRecoveryRequirement(protocol(), {
      requirementId: 'risk',
      evidence: { ...evidence, evidenceId: 'failed' },
    });
    const complete = recordGuardianRecoveryEvidence(protocol(), {
      requirementId: 'risk',
      evidence,
      recordedAt: '2026-07-13T00:01:00.000Z',
    });
    const resolved = applyGuardianRecoveryToIntervention(service, intervention, complete, '2026-07-13T00:02:00.000Z');

    expect(failed.status).toBe('failed');
    expect(resolved.state).toBe('resolved');
  });
});
