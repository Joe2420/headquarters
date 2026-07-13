import { describe, expect, it } from 'vitest';
import {
  InMemoryGuardianHistoryRepository,
  createGuardianRecoveryProtocol,
  recordGuardianRecoveryEvidence,
  type GuardianEvidence,
  type GuardianInterventionRecord,
  type GuardianRuleEvaluation,
} from './index';

const firstEvidence: GuardianEvidence = Object.freeze({
  evidenceId: 'guardian-evidence:mission-1:risk',
  source: 'war-room',
  description: 'Requested risk exceeded declared plan.',
  missionId: 'mission-1',
  createdAt: '2026-01-01T10:00:00.000Z',
});

const secondEvidence: GuardianEvidence = Object.freeze({
  evidenceId: 'guardian-evidence:mission-2:risk',
  source: 'war-room',
  description: 'Repeated risk escalation before authorization.',
  missionId: 'mission-2',
  createdAt: '2026-01-02T10:00:00.000Z',
});

function evaluation(input: {
  readonly evaluationId: string;
  readonly missionId: string;
  readonly evidence: GuardianEvidence;
  readonly triggeredAt: string;
}): GuardianRuleEvaluation {
  return Object.freeze({
    evaluationId: input.evaluationId,
    ruleId: 'guardian-rule:risk-above-plan',
    missionId: input.missionId,
    result: 'triggered',
    state: 'restriction',
    explanation: 'Guardian restricted authorization because risk exceeded the declared plan.',
    evidenceReferences: [input.evidence],
    missingEvidence: [],
    triggeredAt: input.triggeredAt,
    sourceRevision: '1',
  });
}

function intervention(state: GuardianInterventionRecord['state']): GuardianInterventionRecord {
  return Object.freeze({
    interventionId: `guardian-intervention:mission-1:${state}`,
    missionId: 'mission-1',
    type: 'authorization_hold',
    state,
    ruleIds: ['guardian-rule:risk-above-plan'],
    severity: 'restriction',
    title: 'Authorization held',
    explanation: 'Guardian requires risk clarification before deployment.',
    blockedActions: ['approve_authorization'] as const,
    evidenceReferences: [firstEvidence],
    createdAt: '2026-01-01T10:01:00.000Z',
    recoveryEvidence: state === 'resolved' ? [firstEvidence] : [],
    ...(state === 'resolved'
      ? {
          resolvedAt: '2026-01-01T10:04:00.000Z',
          resolutionReason: 'Risk clarified and reduced.',
        }
      : {}),
  });
}

describe('GuardianProtectionHistory', () => {
  it('persists mission-scoped Guardian events and survives reload', async () => {
    const repository = new InMemoryGuardianHistoryRepository();

    await repository.recordRuleEvaluation(evaluation({
      evaluationId: 'guardian-evaluation:mission-1:risk',
      missionId: 'mission-1',
      evidence: firstEvidence,
      triggeredAt: '2026-01-01T10:00:00.000Z',
    }));
    await repository.recordIntervention(intervention('active'));

    const reloaded = new InMemoryGuardianHistoryRepository(repository.dumpState());
    const history = await reloaded.listGuardianHistoryByMission('mission-1');

    expect(history.map((event) => event.type)).toEqual(['rule_evaluated', 'intervention_started']);
    expect(await reloaded.explainCurrentRestriction('mission-1')).toContain('risk clarification');
  });

  it('separates active and resolved interventions', async () => {
    const repository = new InMemoryGuardianHistoryRepository();

    await repository.recordIntervention(intervention('active'));
    await repository.recordIntervention(intervention('resolved'));

    expect(await repository.listActiveInterventions()).toHaveLength(1);
    expect(await repository.listResolvedInterventions()).toHaveLength(1);
  });

  it('exposes recurring Guardian rule patterns for intelligence and relationship systems', async () => {
    const repository = new InMemoryGuardianHistoryRepository();

    await repository.recordRuleEvaluation(evaluation({
      evaluationId: 'guardian-evaluation:mission-1:risk',
      missionId: 'mission-1',
      evidence: firstEvidence,
      triggeredAt: '2026-01-01T10:00:00.000Z',
    }));
    await repository.recordRuleEvaluation(evaluation({
      evaluationId: 'guardian-evaluation:mission-2:risk',
      missionId: 'mission-2',
      evidence: secondEvidence,
      triggeredAt: '2026-01-02T10:00:00.000Z',
    }));

    expect(await repository.listRecurringRules()).toEqual([
      { ruleId: 'guardian-rule:risk-above-plan', count: 2 },
    ]);
    expect(await repository.listGuardianPatternsForIntelligenceGraph()).toEqual([
      {
        patternId: 'guardian-pattern:guardian-rule:risk-above-plan',
        ruleId: 'guardian-rule:risk-above-plan',
        missionIds: ['mission-1', 'mission-2'],
      },
    ]);
    expect(await repository.listGuardianEvidenceForCommanderRelationship()).toHaveLength(2);
  });

  it('preserves recovery protocols and builds mission replay events', async () => {
    const repository = new InMemoryGuardianHistoryRepository();
    const activeIntervention = intervention('active');
    const completedProtocol = recordGuardianRecoveryEvidence(createGuardianRecoveryProtocol({
      protocolId: 'guardian-recovery:mission-1',
      interventionId: activeIntervention.interventionId,
      requirements: [
        {
          requirementId: 'reduce-risk',
          type: 'reduce_risk',
          description: 'Reduce requested risk to declared plan.',
          mandatory: true,
          allowOutOfOrder: true,
        },
      ],
      createdAt: '2026-01-01T10:02:00.000Z',
    }), {
      requirementId: 'reduce-risk',
      evidence: firstEvidence,
      recordedAt: '2026-01-01T10:03:00.000Z',
    });

    await repository.recordIntervention(activeIntervention);
    await repository.recordRecoveryProtocol(completedProtocol);

    const dossier = await repository.buildMissionDossier('mission-1');
    const replay = await repository.buildReplayEvents('mission-1');

    expect(await repository.listSuccessfulRecoveries()).toHaveLength(1);
    expect(dossier.recoveryProtocols).toHaveLength(1);
    expect(replay.map((event) => event.recoveryResult)).toContain('Recovery complete.');
  });

  it('creates deterministic Intelligence Graph links without owning graph behavior', async () => {
    const repository = new InMemoryGuardianHistoryRepository();

    await repository.recordRuleEvaluation(evaluation({
      evaluationId: 'guardian-evaluation:mission-1:risk',
      missionId: 'mission-1',
      evidence: firstEvidence,
      triggeredAt: '2026-01-01T10:00:00.000Z',
    }));

    const graphLinks = await repository.buildIntelligenceGraphLinks();

    expect(graphLinks.nodes).toHaveLength(1);
    expect(graphLinks.nodes[0]?.nodeType).toBe('guardian_alert');
    expect(graphLinks.edges).toHaveLength(1);
    expect(graphLinks.edges[0]?.edgeType).toBe('linked_to_mission');
    expect(graphLinks.edges[0]?.toNodeId).toBe('mission:mission-1');
  });
});
