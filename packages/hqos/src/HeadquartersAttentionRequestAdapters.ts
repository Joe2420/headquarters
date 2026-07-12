import type { MissionLifecycleProjection, MissionLifecycleRoom } from './MissionLifecycleProjection';
import type { HealthDimension, InstitutionalHealthSnapshot } from './InstitutionalHealth';
import {
  createHeadquartersAttentionRequest,
  type HeadquartersAttentionEvidenceReference,
  type HeadquartersAttentionRequest,
  type HeadquartersAttentionRequestType,
  type HeadquartersAttentionSourceSubsystem,
  type HeadquartersAttentionUrgency,
  type HeadquartersAttentionSeverity,
  type HeadquartersInterruptionPolicy,
} from './HeadquartersAttentionRequest';
import type { OperationalConsequence } from './OperationalConsequence';

export interface GuardianAttentionSignal {
  readonly id: string;
  readonly level: 'info' | 'caution' | 'warning' | 'lockout';
  readonly title: string;
  readonly summary: string;
  readonly evidenceReferences: readonly HeadquartersAttentionEvidenceReference[];
  readonly missionId?: string | undefined;
  readonly resolved?: boolean | undefined;
}

export interface DoctrineAttentionSignal {
  readonly id: string;
  readonly title: string;
  readonly proposedRule: string;
  readonly evidenceReferences: readonly HeadquartersAttentionEvidenceReference[];
  readonly currentMissionRelevant?: boolean | undefined;
  readonly conflictDetected?: boolean | undefined;
  readonly revisionRequested?: boolean | undefined;
  readonly resolved?: boolean | undefined;
}

export interface JournalAttentionSignal {
  readonly id: string;
  readonly title: string;
  readonly reason: string;
  readonly evidenceReferences: readonly HeadquartersAttentionEvidenceReference[];
  readonly missionId?: string | undefined;
  readonly blocking?: boolean | undefined;
  readonly resolved?: boolean | undefined;
}

export interface AcademyAttentionSignal {
  readonly id: string;
  readonly title: string;
  readonly reason: string;
  readonly evidenceReferences: readonly HeadquartersAttentionEvidenceReference[];
  readonly trainingRecommended?: boolean | undefined;
  readonly resolved?: boolean | undefined;
}

export interface IntelligenceAttentionSignal {
  readonly id: string;
  readonly title: string;
  readonly reason: string;
  readonly evidenceReferences: readonly HeadquartersAttentionEvidenceReference[];
  readonly contradiction?: boolean | undefined;
  readonly missingEvidence?: boolean | undefined;
  readonly blockingAuthorization?: boolean | undefined;
  readonly resolved?: boolean | undefined;
}

export interface ArchiveAttentionSignal {
  readonly id: string;
  readonly title: string;
  readonly reason: string;
  readonly evidenceReferences: readonly HeadquartersAttentionEvidenceReference[];
  readonly missionId?: string | undefined;
  readonly reviewType?: 'dossier' | 'weekly' | 'monthly' | 'recovered-mission' | undefined;
  readonly resolved?: boolean | undefined;
}

export interface MissionAttentionSignal {
  readonly id: string;
  readonly title: string;
  readonly reason: string;
  readonly evidenceReferences: readonly HeadquartersAttentionEvidenceReference[];
  readonly missionId: string;
  readonly type: 'active_recovery' | 'incomplete_debrief' | 'persistence_retry';
  readonly resolved?: boolean | undefined;
}

export interface AttentionAdapterContext {
  readonly lifecycle: MissionLifecycleProjection;
  readonly createdAt: string;
}

export interface SubsystemAttentionAdapterInput {
  readonly context: AttentionAdapterContext;
  readonly guardian?: readonly GuardianAttentionSignal[] | undefined;
  readonly doctrine?: readonly DoctrineAttentionSignal[] | undefined;
  readonly journal?: readonly JournalAttentionSignal[] | undefined;
  readonly academy?: readonly AcademyAttentionSignal[] | undefined;
  readonly intelligence?: readonly IntelligenceAttentionSignal[] | undefined;
  readonly archive?: readonly ArchiveAttentionSignal[] | undefined;
  readonly institutionalHealth?: InstitutionalHealthSnapshot | undefined;
  readonly operationalConsequences?: readonly OperationalConsequence[] | undefined;
  readonly mission?: readonly MissionAttentionSignal[] | undefined;
}

export function buildSubsystemAttentionRequests(
  input: SubsystemAttentionAdapterInput,
): readonly HeadquartersAttentionRequest[] {
  return Object.freeze([
    ...buildGuardianAttentionRequests(input.guardian ?? [], input.context),
    ...buildDoctrineAttentionRequests(input.doctrine ?? [], input.context),
    ...buildJournalAttentionRequests(input.journal ?? [], input.context),
    ...buildAcademyAttentionRequests(input.academy ?? [], input.context),
    ...buildIntelligenceAttentionRequests(input.intelligence ?? [], input.context),
    ...buildArchiveAttentionRequests(input.archive ?? [], input.context),
    ...buildInstitutionalHealthAttentionRequests(input.institutionalHealth, input.context),
    ...buildOperationalConsequenceAttentionRequests(input.operationalConsequences ?? [], input.context),
    ...buildMissionAttentionRequests(input.mission ?? [], input.context),
  ]);
}

export function buildGuardianAttentionRequests(
  signals: readonly GuardianAttentionSignal[],
  context: AttentionAdapterContext,
): readonly HeadquartersAttentionRequest[] {
  return signals
    .filter((signal) => signal.resolved !== true)
    .filter(hasEvidence)
    .map((signal) => {
      const lockout = signal.level === 'lockout';
      return makeRequest({
        sourceSubsystem: 'guardian',
        requestType: lockout ? 'guardian_lockout_active' : 'guardian_attention_required',
        sourceEntityId: signal.id,
        title: signal.title,
        summary: signal.summary,
        reason: signal.summary,
        urgency: lockout ? 'critical' : signal.level === 'warning' ? 'immediate' : 'soon',
        severity: lockout ? 'critical' : signal.level === 'warning' ? 'blocking' : 'warning',
        recommendedRoom: 'war-room',
        recommendedAction: lockout ? 'review_guardian_lockout' : 'review_guardian_alert',
        blocking: lockout || signal.level === 'warning',
        interruptionPolicy: lockout ? 'interrupt_immediately' : 'interrupt_at_safe_point',
        evidenceReferences: signal.evidenceReferences,
        missionId: signal.missionId ?? context.lifecycle.missionId,
        context,
      });
    });
}

export function buildDoctrineAttentionRequests(
  signals: readonly DoctrineAttentionSignal[],
  context: AttentionAdapterContext,
): readonly HeadquartersAttentionRequest[] {
  return signals
    .filter((signal) => signal.resolved !== true)
    .filter(hasEvidence)
    .map((signal) => {
      const requestType: HeadquartersAttentionRequestType = signal.conflictDetected === true
        ? 'doctrine_conflict_detected'
        : signal.revisionRequested === true
          ? 'doctrine_revision_required'
          : 'doctrine_candidate_ready';
      const currentMissionRelevant = signal.currentMissionRelevant === true;
      return makeRequest({
        sourceSubsystem: 'doctrine',
        requestType,
        sourceEntityId: signal.id,
        title: signal.title,
        summary: signal.proposedRule,
        reason: currentMissionRelevant
          ? 'Doctrine candidate is related to the current mission.'
          : 'Doctrine candidate is ready for review outside critical mission flow.',
        urgency: signal.conflictDetected === true ? 'immediate' : 'routine',
        severity: signal.conflictDetected === true ? 'blocking' : 'notice',
        recommendedRoom: 'mission-room',
        recommendedAction: signal.revisionRequested === true ? 'return_doctrine_candidate_for_revision' : 'review_doctrine_candidate',
        blocking: signal.conflictDetected === true,
        interruptionPolicy: signal.conflictDetected === true
          ? 'interrupt_at_safe_point'
          : context.lifecycle.missionActive
            ? 'queue_until_mission_complete'
            : 'mention_in_next_brief',
        evidenceReferences: signal.evidenceReferences,
        missionId: currentMissionRelevant ? context.lifecycle.missionId : undefined,
        context,
      });
    });
}

export function buildJournalAttentionRequests(
  signals: readonly JournalAttentionSignal[],
  context: AttentionAdapterContext,
): readonly HeadquartersAttentionRequest[] {
  return signals
    .filter((signal) => signal.resolved !== true)
    .filter(hasEvidence)
    .map((signal) => makeRequest({
      sourceSubsystem: 'journal',
      requestType: signal.blocking === true ? 'journal_follow_up_required' : 'journal_reflection_available',
      sourceEntityId: signal.id,
      title: signal.title,
      summary: signal.reason,
      reason: signal.reason,
      urgency: signal.blocking === true ? 'immediate' : 'routine',
      severity: signal.blocking === true ? 'blocking' : 'notice',
      recommendedRoom: 'mission-room',
      recommendedAction: signal.blocking === true ? 'complete_journal_follow_up' : 'review_journal_reflection',
      blocking: signal.blocking === true,
      interruptionPolicy: signal.blocking === true ? 'interrupt_at_safe_point' : 'mention_in_next_brief',
      evidenceReferences: signal.evidenceReferences,
      missionId: signal.missionId,
      context,
    }));
}

export function buildAcademyAttentionRequests(
  signals: readonly AcademyAttentionSignal[],
  context: AttentionAdapterContext,
): readonly HeadquartersAttentionRequest[] {
  return signals
    .filter((signal) => signal.resolved !== true)
    .filter(hasEvidence)
    .map((signal) => makeRequest({
      sourceSubsystem: 'academy',
      requestType: signal.trainingRecommended === true ? 'academy_training_recommended' : 'academy_milestone_ready',
      sourceEntityId: signal.id,
      title: signal.title,
      summary: signal.reason,
      reason: signal.reason,
      urgency: 'background',
      severity: 'background',
      recommendedRoom: 'command-center',
      recommendedAction: signal.trainingRecommended === true ? 'review_training_recommendation' : 'review_academy_recognition',
      blocking: false,
      interruptionPolicy: context.lifecycle.missionActive ? 'queue_until_mission_complete' : 'mention_in_next_brief',
      evidenceReferences: signal.evidenceReferences,
      context,
    }));
}

export function buildIntelligenceAttentionRequests(
  signals: readonly IntelligenceAttentionSignal[],
  context: AttentionAdapterContext,
): readonly HeadquartersAttentionRequest[] {
  return signals
    .filter((signal) => signal.resolved !== true)
    .filter(hasEvidence)
    .map((signal) => {
      const blocking = signal.blockingAuthorization === true;
      return makeRequest({
        sourceSubsystem: 'intelligence',
        requestType: signal.contradiction === true
          ? 'intelligence_contradiction_detected'
          : 'intelligence_missing_evidence',
        sourceEntityId: signal.id,
        title: signal.title,
        summary: signal.reason,
        reason: signal.reason,
        urgency: blocking ? 'immediate' : 'soon',
        severity: blocking ? 'blocking' : 'warning',
        recommendedRoom: context.lifecycle.recommendedRoom,
        recommendedAction: signal.contradiction === true ? 'clarify_intelligence_contradiction' : 'complete_missing_evidence',
        blocking,
        interruptionPolicy: blocking ? 'interrupt_at_safe_point' : 'mention_in_next_brief',
        evidenceReferences: signal.evidenceReferences,
        missionId: context.lifecycle.missionId,
        context,
      });
    });
}

export function buildArchiveAttentionRequests(
  signals: readonly ArchiveAttentionSignal[],
  context: AttentionAdapterContext,
): readonly HeadquartersAttentionRequest[] {
  return signals
    .filter((signal) => signal.resolved !== true)
    .filter(hasEvidence)
    .map((signal) => {
      const monthly = signal.reviewType === 'monthly';
      return makeRequest({
        sourceSubsystem: 'archive',
        requestType: monthly ? 'monthly_review_available' : 'archive_review_available',
        sourceEntityId: signal.id,
        title: signal.title,
        summary: signal.reason,
        reason: signal.reason,
        urgency: 'routine',
        severity: 'notice',
        recommendedRoom: 'archive',
        recommendedAction: signal.reviewType === 'recovered-mission' ? 'resume_recovered_mission' : 'review_archive_record',
        blocking: false,
        interruptionPolicy: context.lifecycle.missionActive ? 'queue_until_mission_complete' : 'mention_in_next_brief',
        evidenceReferences: signal.evidenceReferences,
        missionId: signal.missionId,
        context,
      });
    });
}

export function buildInstitutionalHealthAttentionRequests(
  snapshot: InstitutionalHealthSnapshot | undefined,
  context: AttentionAdapterContext,
): readonly HeadquartersAttentionRequest[] {
  if (snapshot === undefined) return [];
  return snapshot.dimensions
    .filter((dimension) => dimension.state === 'critical' || dimension.state === 'degraded')
    .filter((dimension) => dimension.supportingEvidence.length > 0)
    .map((dimension) => makeRequest({
      sourceSubsystem: 'institutional-health',
      requestType: 'institutional_health_degraded',
      sourceEntityId: dimension.id,
      title: `${dimension.title} requires attention`,
      summary: dimension.explanation.why,
      reason: dimension.explanation.why,
      urgency: dimension.state === 'critical' ? 'critical' : 'immediate',
      severity: dimension.state === 'critical' ? 'critical' : 'blocking',
      recommendedRoom: getRoomForHealthDimension(dimension),
      recommendedAction: `review_${dimension.id}`,
      blocking: dimension.state === 'critical',
      interruptionPolicy: dimension.state === 'critical' ? 'interrupt_immediately' : 'interrupt_at_safe_point',
      evidenceReferences: dimension.supportingEvidence.map((evidence) => ({
        id: evidence.id,
        source: 'institutional-health',
        description: evidence.description,
      })),
      context,
    }));
}

export function buildOperationalConsequenceAttentionRequests(
  consequences: readonly OperationalConsequence[],
  context: AttentionAdapterContext,
): readonly HeadquartersAttentionRequest[] {
  return consequences
    .filter((consequence) => consequence.status === 'active' || consequence.status === 'recovering' || consequence.status === 'pending')
    .filter((consequence) => consequence.evidenceReferences.length > 0)
    .map((consequence) => makeRequest({
      sourceSubsystem: 'operational-consequences',
      requestType: 'consequence_recovery_required',
      sourceEntityId: consequence.consequenceId,
      title: consequence.title,
      summary: consequence.explanation,
      reason: consequence.effect,
      urgency: consequence.severity === 'lockout' ? 'critical' : consequence.severity === 'restriction' ? 'immediate' : 'soon',
      severity: consequence.severity === 'lockout' ? 'critical' : consequence.severity === 'restriction' ? 'blocking' : 'warning',
      recommendedRoom: consequence.category === 'guardian' ? 'war-room' : context.lifecycle.recommendedRoom,
      recommendedAction: 'complete_recovery_requirement',
      blocking: consequence.severity === 'lockout' || consequence.severity === 'restriction',
      interruptionPolicy: consequence.severity === 'lockout' ? 'interrupt_immediately' : 'interrupt_at_safe_point',
      evidenceReferences: consequence.evidenceReferences.map((evidence) => ({
        id: evidence.id,
        source: evidence.source,
        description: evidence.description,
      })),
      missionId: consequence.missionId,
      context,
    }));
}

export function buildMissionAttentionRequests(
  signals: readonly MissionAttentionSignal[],
  context: AttentionAdapterContext,
): readonly HeadquartersAttentionRequest[] {
  return signals
    .filter((signal) => signal.resolved !== true)
    .filter(hasEvidence)
    .map((signal) => makeRequest({
      sourceSubsystem: 'mission',
      requestType: signal.type === 'persistence_retry'
        ? 'persistence_recovery_required'
        : 'mission_recovery_required',
      sourceEntityId: signal.id,
      title: signal.title,
      summary: signal.reason,
      reason: signal.reason,
      urgency: signal.type === 'persistence_retry' ? 'critical' : 'immediate',
      severity: signal.type === 'persistence_retry' ? 'critical' : 'blocking',
      recommendedRoom: signal.type === 'incomplete_debrief' ? 'debrief-theater' : context.lifecycle.recommendedRoom,
      recommendedAction: signal.type === 'incomplete_debrief' ? 'complete_debrief' : 'resume_mission_recovery',
      blocking: true,
      interruptionPolicy: signal.type === 'persistence_retry' ? 'interrupt_immediately' : 'interrupt_at_safe_point',
      evidenceReferences: signal.evidenceReferences,
      missionId: signal.missionId,
      context,
    }));
}

function makeRequest(input: {
  readonly sourceSubsystem: HeadquartersAttentionSourceSubsystem;
  readonly requestType: HeadquartersAttentionRequestType;
  readonly sourceEntityId: string;
  readonly title: string;
  readonly summary: string;
  readonly reason: string;
  readonly urgency: HeadquartersAttentionUrgency;
  readonly severity: HeadquartersAttentionSeverity;
  readonly recommendedRoom: MissionLifecycleRoom;
  readonly recommendedAction: string;
  readonly blocking: boolean;
  readonly interruptionPolicy: HeadquartersInterruptionPolicy;
  readonly evidenceReferences: readonly HeadquartersAttentionEvidenceReference[];
  readonly missionId?: string | undefined;
  readonly context: AttentionAdapterContext;
}): HeadquartersAttentionRequest {
  return createHeadquartersAttentionRequest({
    requestId: `attention:${input.sourceSubsystem}:${input.sourceEntityId}`,
    sourceSubsystem: input.sourceSubsystem,
    requestType: input.requestType,
    title: input.title,
    summary: input.summary,
    reason: input.reason,
    urgency: input.urgency,
    severity: input.severity,
    recommendedRoom: input.recommendedRoom,
    recommendedAction: input.recommendedAction,
    blocking: input.blocking,
    interruptionPolicy: input.interruptionPolicy,
    evidenceReferences: input.evidenceReferences,
    sourceEntityId: input.sourceEntityId,
    createdAt: input.context.createdAt,
    firstEligibleAt: input.context.createdAt,
    ...(input.missionId ? { missionId: input.missionId } : {}),
    lifecycleStage: input.context.lifecycle.activeStage,
  });
}

function hasEvidence(signal: { readonly evidenceReferences: readonly HeadquartersAttentionEvidenceReference[] }): boolean {
  return signal.evidenceReferences.length > 0;
}

function getRoomForHealthDimension(dimension: HealthDimension): MissionLifecycleRoom {
  if (dimension.id === 'guardian-stability' || dimension.id === 'operational-readiness') return 'war-room';
  if (dimension.id === 'archive-integrity') return 'archive';
  if (dimension.id === 'intelligence-completeness' || dimension.id === 'evidence-quality') return 'observation-room';
  return 'mission-room';
}
