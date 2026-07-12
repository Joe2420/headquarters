import type { MissionState } from '@headquarters/shared';
import type { MissionEvaluation } from './MissionEvaluationEngine';
import type { MissionLifecycleProjection } from './MissionLifecycleProjection';
import type { OperationalConsequence } from './OperationalConsequence';
import { isOperationalConsequenceBlocking } from './OperationalConsequence';
import { buildHealthExplanation } from './InstitutionalHealthExplanationEngine';
import { calculateHealthTrend } from './InstitutionalHealthTrendEngine';
import {
  createHealthDimension,
  createHealthEvidence,
  createInstitutionalHealthSnapshot,
  type HealthContributingSystem,
  type HealthDimension,
  type HealthDimensionId,
  type HealthEvidence,
  type InstitutionalHealthSnapshot,
  type InstitutionalHealthState,
} from './InstitutionalHealth';

export interface InstitutionalHealthGuardianInput {
  readonly state: 'secure' | 'warning' | 'restriction' | 'lockout';
  readonly highestAlert: string;
}

export interface InstitutionalHealthDoctrineInput {
  readonly activeProtectiveRule: string;
  readonly pendingCandidateCount: number;
}

export interface InstitutionalHealthAcademyInput {
  readonly growthEvidenceCount?: number | undefined;
  readonly recognitionAvailable?: boolean | undefined;
  readonly consistency?: 'unknown' | 'forming' | 'healthy' | 'excellent' | undefined;
}

export interface InstitutionalHealthArchiveInput {
  readonly persistenceReady: boolean;
  readonly archiveRecordCount?: number | undefined;
  readonly replayReady?: boolean | undefined;
}

export interface InstitutionalHealthIntelligenceInput {
  readonly missingEvidenceCount: number;
  readonly contradictionCount: number;
  readonly confidenceLevel?: 'missing' | 'forming' | 'sufficient' | 'complete' | undefined;
  readonly validatedEvidenceCount?: number | undefined;
}

export interface InstitutionalHealthPriorityInput {
  readonly blockingPriorityCount?: number | undefined;
  readonly criticalPriorityCount?: number | undefined;
}

export interface InstitutionalHealthEngineInput {
  readonly snapshotId?: string | undefined;
  readonly evaluatedAt?: string | undefined;
  readonly missionState?: MissionState | undefined;
  readonly missionEvaluation?: MissionEvaluation | undefined;
  readonly operationalConsequences?: readonly OperationalConsequence[] | undefined;
  readonly lifecycle?: MissionLifecycleProjection | undefined;
  readonly guardian: InstitutionalHealthGuardianInput;
  readonly doctrine: InstitutionalHealthDoctrineInput;
  readonly academy?: InstitutionalHealthAcademyInput | undefined;
  readonly archive: InstitutionalHealthArchiveInput;
  readonly intelligence: InstitutionalHealthIntelligenceInput;
  readonly priority?: InstitutionalHealthPriorityInput | undefined;
  readonly startupReady?: boolean | undefined;
  readonly previousSnapshot?: InstitutionalHealthSnapshot | undefined;
}

export function buildInstitutionalHealthSnapshot(
  input: InstitutionalHealthEngineInput,
): InstitutionalHealthSnapshot {
  const evaluatedAt = input.evaluatedAt ?? new Date().toISOString();
  const context = { ...input, evaluatedAt };
  const dimensions = [
    buildOperationalReadinessDimension(context),
    buildMissionIntegrityDimension(context),
    buildIntelligenceCompletenessDimension(context),
    buildEvidenceQualityDimension(context),
    buildGuardianStabilityDimension(context),
    buildDoctrineCoverageDimension(context),
    buildAcademyDevelopmentDimension(context),
    buildArchiveIntegrityDimension(context),
  ];

  return createInstitutionalHealthSnapshot({
    snapshotId: input.snapshotId ?? `institutional-health:${evaluatedAt}`,
    evaluatedAt,
    dimensions,
  });
}

type DimensionContext = InstitutionalHealthEngineInput & { readonly evaluatedAt: string };

function buildOperationalReadinessDimension(input: DimensionContext): HealthDimension {
  if (input.startupReady === false) {
    return dimension(input, {
      id: 'operational-readiness',
      state: 'critical',
      why: 'Headquarters infrastructure is not ready for normal operation.',
      evidence: evidence('startup:not-ready', 'startup', 'Startup evidence reports Headquarters is not ready.'),
      blockingFactors: ['Infrastructure readiness failed.'],
    });
  }

  if ((input.priority?.criticalPriorityCount ?? 0) > 0 || input.guardian.state === 'lockout') {
    return dimension(input, {
      id: 'operational-readiness',
      state: 'critical',
      why: 'Critical restrictions are active and normal progression is not authorized.',
      evidence: evidence('readiness:critical-restriction', 'guardian', input.guardian.highestAlert),
      blockingFactors: ['Critical restriction requires recovery before normal movement.'],
    });
  }

  if ((input.priority?.blockingPriorityCount ?? 0) > 0 || input.lifecycle?.blockedActions.length) {
    return dimension(input, {
      id: 'operational-readiness',
      state: 'degraded',
      why: 'Headquarters has blocked work that must be resolved.',
      evidence: evidence('readiness:blocking-priority', 'priority', 'At least one blocking priority is active.'),
      blockingFactors: ['Blocked action is present.'],
    });
  }

  if (input.missionState === undefined) {
    return dimension(input, {
      id: 'operational-readiness',
      state: 'forming',
      why: 'Headquarters is standing by until a mission is created.',
      evidence: evidence('readiness:no-mission', 'mission', 'No active mission lifecycle exists.'),
    });
  }

  return dimension(input, {
    id: 'operational-readiness',
    state: 'healthy',
    why: 'Headquarters can support the current operational step.',
    evidence: evidence('readiness:lifecycle-active', 'mission', `Lifecycle stage is ${input.missionState}.`),
    improvingFactors: ['Infrastructure and lifecycle evidence support normal operation.'],
  });
}

function buildMissionIntegrityDimension(input: DimensionContext): HealthDimension {
  const blockingConsequence = (input.operationalConsequences ?? []).find(isOperationalConsequenceBlocking);
  if (blockingConsequence !== undefined) {
    return dimension(input, {
      id: 'mission-integrity',
      state: blockingConsequence.severity === 'lockout' ? 'critical' : 'degraded',
      why: blockingConsequence.explanation,
      evidence: evidence(blockingConsequence.consequenceId, 'mission', blockingConsequence.cause),
      blockingFactors: [blockingConsequence.effect],
    });
  }

  if (input.missionEvaluation?.failures.length) {
    return dimension(input, {
      id: 'mission-integrity',
      state: 'degraded',
      why: 'Mission evaluation reports unresolved process failures.',
      evidence: evidence(input.missionEvaluation.id, 'mission', input.missionEvaluation.failures[0]!),
      blockingFactors: input.missionEvaluation.failures,
    });
  }

  if (input.missionState === undefined) {
    return dimension(input, {
      id: 'mission-integrity',
      state: 'forming',
      why: 'Mission integrity can be judged after mission evidence exists.',
      evidence: evidence('mission-integrity:no-active-mission', 'mission', 'No active mission evidence is available.'),
    });
  }

  return dimension(input, {
    id: 'mission-integrity',
    state: input.missionEvaluation?.recognitionEligible ? 'excellent' : 'healthy',
    why: 'Mission lifecycle and evaluation evidence are internally consistent.',
    evidence: evidence(input.missionEvaluation?.id ?? `mission-state:${input.missionState}`, 'mission', input.missionEvaluation?.commanderVerdict ?? `Mission state is ${input.missionState}.`),
    improvingFactors: input.missionEvaluation?.strengths ?? ['Mission process evidence is intact.'],
  });
}

function buildIntelligenceCompletenessDimension(input: DimensionContext): HealthDimension {
  if (input.intelligence.contradictionCount > 0) {
    return dimension(input, {
      id: 'intelligence-completeness',
      state: 'degraded',
      why: 'Mission intelligence contains unresolved contradictions.',
      evidence: evidence('intelligence:contradictions', 'intelligence', `${input.intelligence.contradictionCount} contradiction(s) remain.`),
      blockingFactors: ['Resolve contradictions before relying on intelligence.'],
    });
  }

  if (input.intelligence.missingEvidenceCount > 0) {
    return dimension(input, {
      id: 'intelligence-completeness',
      state: 'forming',
      why: 'Mission intelligence is still forming because required evidence is missing.',
      evidence: evidence('intelligence:missing-evidence', 'intelligence', `${input.intelligence.missingEvidenceCount} evidence field(s) are missing.`),
    });
  }

  if (input.intelligence.confidenceLevel === 'complete') {
    return dimension(input, {
      id: 'intelligence-completeness',
      state: 'excellent',
      why: 'Mission intelligence is complete and contradiction-free.',
      evidence: evidence('intelligence:complete', 'intelligence', 'All required intelligence evidence is present.'),
      improvingFactors: ['Intelligence is complete.'],
    });
  }

  return dimension(input, {
    id: 'intelligence-completeness',
    state: input.intelligence.confidenceLevel === 'sufficient' ? 'healthy' : 'forming',
    why: input.intelligence.confidenceLevel === 'sufficient'
      ? 'Mission intelligence is sufficient for current decisions.'
      : 'Mission intelligence is waiting for stronger evidence.',
    evidence: evidence('intelligence:confidence', 'intelligence', `Confidence level is ${input.intelligence.confidenceLevel ?? 'missing'}.`),
  });
}

function buildEvidenceQualityDimension(input: DimensionContext): HealthDimension {
  const evaluationWeaknesses = input.missionEvaluation?.weaknesses ?? [];
  if (input.intelligence.contradictionCount > 0 || evaluationWeaknesses.length > 2) {
    return dimension(input, {
      id: 'evidence-quality',
      state: 'degraded',
      why: 'Evidence quality is weakened by contradictions or process weaknesses.',
      evidence: evidence('evidence-quality:weakness', 'intelligence', evaluationWeaknesses[0] ?? 'Contradictions are present.'),
      blockingFactors: evaluationWeaknesses.length > 0 ? evaluationWeaknesses : ['Contradictions are present.'],
    });
  }

  if ((input.intelligence.validatedEvidenceCount ?? 0) >= 6 || input.missionEvaluation?.supportingReasons.length) {
    return dimension(input, {
      id: 'evidence-quality',
      state: 'healthy',
      why: 'Evidence is traceable enough to support current Headquarters recommendations.',
      evidence: evidence(input.missionEvaluation?.id ?? 'evidence-quality:validated', 'intelligence', input.missionEvaluation?.supportingReasons[0] ?? 'Validated evidence is present.'),
      improvingFactors: input.missionEvaluation?.supportingReasons ?? ['Evidence is traceable.'],
    });
  }

  return dimension(input, {
    id: 'evidence-quality',
    state: 'forming',
    why: 'Evidence quality is forming and needs more traceable records.',
    evidence: evidence('evidence-quality:forming', 'intelligence', 'Evidence record count is still limited.'),
  });
}

function buildGuardianStabilityDimension(input: DimensionContext): HealthDimension {
  if (input.guardian.state === 'lockout') {
    return dimension(input, {
      id: 'guardian-stability',
      state: 'critical',
      why: 'Guardian lockout is active.',
      evidence: evidence('guardian:lockout', 'guardian', input.guardian.highestAlert),
      blockingFactors: [input.guardian.highestAlert],
    });
  }

  if (input.guardian.state === 'restriction') {
    return dimension(input, {
      id: 'guardian-stability',
      state: 'degraded',
      why: 'Guardian restriction is active.',
      evidence: evidence('guardian:restriction', 'guardian', input.guardian.highestAlert),
      blockingFactors: [input.guardian.highestAlert],
    });
  }

  if (input.guardian.state === 'warning') {
    return dimension(input, {
      id: 'guardian-stability',
      state: 'forming',
      why: 'Guardian is monitoring a warning condition.',
      evidence: evidence('guardian:warning', 'guardian', input.guardian.highestAlert),
    });
  }

  return dimension(input, {
    id: 'guardian-stability',
    state: 'healthy',
    why: 'Guardian reports no active restriction.',
    evidence: evidence('guardian:secure', 'guardian', input.guardian.highestAlert),
    improvingFactors: ['Guardian boundary is stable.'],
  });
}

function buildDoctrineCoverageDimension(input: DimensionContext): HealthDimension {
  const missingProtectiveRule = input.doctrine.activeProtectiveRule.startsWith('No protective rule');
  const protectiveRuleRelevant = input.missionState === 'authorization'
    || input.missionState === 'deployed'
    || input.missionState === 'return_to_base'
    || input.missionState === 'debrief'
    || input.missionState === 'archived';

  if (missingProtectiveRule && protectiveRuleRelevant) {
    return dimension(input, {
      id: 'doctrine-coverage',
      state: 'degraded',
      why: 'Relevant mission phase lacks a protective doctrine rule.',
      evidence: evidence('doctrine:missing-protective-rule', 'doctrine', 'No protective doctrine rule is declared.'),
      blockingFactors: ['War Room decisions should be grounded in doctrine.'],
    });
  }

  if (input.doctrine.pendingCandidateCount > 0) {
    return dimension(input, {
      id: 'doctrine-coverage',
      state: 'forming',
      why: 'Doctrine coverage is improving, but candidates still require review.',
      evidence: evidence('doctrine:pending-candidates', 'doctrine', `${input.doctrine.pendingCandidateCount} doctrine candidate(s) await review.`),
      improvingFactors: ['Candidate evidence is available for review.'],
    });
  }

  return dimension(input, {
    id: 'doctrine-coverage',
    state: missingProtectiveRule ? 'forming' : 'healthy',
    why: missingProtectiveRule
      ? 'Doctrine exists, but no protective rule is attached to the current operation.'
      : 'Protective doctrine is available for the current operation.',
    evidence: evidence('doctrine:coverage', 'doctrine', input.doctrine.activeProtectiveRule),
    improvingFactors: missingProtectiveRule ? [] : ['Doctrine coverage supports current decisions.'],
  });
}

function buildAcademyDevelopmentDimension(input: DimensionContext): HealthDimension {
  const academy = input.academy;
  if (academy?.consistency === 'excellent' || (academy?.growthEvidenceCount ?? 0) >= 5) {
    return dimension(input, {
      id: 'academy-development',
      state: 'excellent',
      why: 'Academy has strong evidence of disciplined development.',
      evidence: evidence('academy:growth-evidence', 'academy', `${academy?.growthEvidenceCount ?? 0} growth evidence record(s) are available.`),
      improvingFactors: ['Growth evidence is accumulating.'],
    });
  }

  if (academy?.recognitionAvailable || (academy?.growthEvidenceCount ?? 0) > 0) {
    return dimension(input, {
      id: 'academy-development',
      state: 'healthy',
      why: 'Academy has evidence available for recognition or progression.',
      evidence: evidence('academy:recognition', 'academy', 'Academy development evidence is available.'),
      improvingFactors: ['Recognition can be grounded in evidence.'],
    });
  }

  return dimension(input, {
    id: 'academy-development',
    state: 'forming',
    why: 'Academy development requires repeated behavior evidence.',
    evidence: evidence('academy:forming', 'academy', 'No durable Academy growth trend is available yet.'),
  });
}

function buildArchiveIntegrityDimension(input: DimensionContext): HealthDimension {
  if (!input.archive.persistenceReady) {
    return dimension(input, {
      id: 'archive-integrity',
      state: 'critical',
      why: 'Archive persistence is not ready.',
      evidence: evidence('archive:persistence-not-ready', 'archive', 'Archive persistence is unavailable.'),
      blockingFactors: ['Historical record cannot be trusted until persistence recovers.'],
    });
  }

  if ((input.archive.archiveRecordCount ?? 0) === 0) {
    return dimension(input, {
      id: 'archive-integrity',
      state: 'forming',
      why: 'Archive integrity is forming because historical evidence is still limited.',
      evidence: evidence('archive:no-records', 'archive', 'No archive records are available yet.'),
    });
  }

  return dimension(input, {
    id: 'archive-integrity',
    state: input.archive.replayReady === true ? 'excellent' : 'healthy',
    why: input.archive.replayReady === true
      ? 'Archive records are available and replay preparation is ready.'
      : 'Archive persistence is ready and historical records are available.',
    evidence: evidence('archive:records', 'archive', `${input.archive.archiveRecordCount ?? 0} archive record(s) are available.`),
    improvingFactors: ['Historical record is preserved.'],
  });
}

function dimension(
  input: DimensionContext,
  params: {
    readonly id: HealthDimensionId;
    readonly state: InstitutionalHealthState;
    readonly why: string;
    readonly evidence: readonly HealthEvidence[];
    readonly blockingFactors?: readonly string[] | undefined;
    readonly improvingFactors?: readonly string[] | undefined;
  },
): HealthDimension {
  return createHealthDimension({
    id: params.id,
    state: params.state,
    trend: calculateHealthTrend({
      dimensionId: params.id,
      currentState: params.state,
      previousSnapshot: input.previousSnapshot,
    }),
    explanation: buildHealthExplanation({
      state: params.state,
      why: params.why,
      evidence: params.evidence,
      blockingFactors: params.blockingFactors,
      improvingFactors: params.improvingFactors,
    }),
    supportingEvidence: params.evidence,
    contributingSystems: contributingSystemsForDimension(params.id),
    lastUpdated: input.evaluatedAt,
  });
}

function evidence(id: string, system: HealthContributingSystem, description: string): readonly HealthEvidence[] {
  return [createHealthEvidence({ id, system, description })];
}

function contributingSystemsForDimension(id: HealthDimensionId): readonly HealthContributingSystem[] {
  if (id === 'operational-readiness') return ['mission', 'guardian', 'priority', 'startup'];
  if (id === 'mission-integrity') return ['mission', 'guardian', 'intelligence'];
  if (id === 'intelligence-completeness' || id === 'evidence-quality') return ['intelligence', 'mission'];
  if (id === 'guardian-stability') return ['guardian'];
  if (id === 'doctrine-coverage') return ['doctrine', 'mission'];
  if (id === 'academy-development') return ['academy', 'journal'];
  return ['archive', 'persistence'];
}
