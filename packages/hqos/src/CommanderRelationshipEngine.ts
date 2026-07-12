import type { MissionState } from '@headquarters/shared';
import type { InstitutionalHealthSnapshot } from './InstitutionalHealth';
import type { MissionEvaluation } from './MissionEvaluationEngine';
import type { OperationalConsequence } from './OperationalConsequence';
import {
  compareBehaviorStates,
  createBehaviorDimension,
  createBehaviorEvidence,
  createRelationshipSnapshot,
  getWorstBehaviorState,
  type BehaviorDimension,
  type BehaviorDimensionId,
  type BehaviorEvidence,
  type BehaviorMilestone,
  type BehaviorState,
  type BehaviorTrend,
  type RelationshipSnapshot,
} from './CommanderRelationship';
import { selectCommanderCoachingMode } from './CommanderRelationshipCoaching';
import { detectCommanderRelationshipPatterns } from './CommanderRelationshipPatterns';

export interface CommanderRelationshipMissionContextInput {
  readonly missionId: string;
  readonly missionState?: MissionState | string | undefined;
  readonly briefingComplete?: boolean | undefined;
  readonly observationComplete?: boolean | undefined;
  readonly authorizationEvidencePresent?: boolean | undefined;
  readonly invalidationPresent?: boolean | undefined;
  readonly riskDeclared?: boolean | undefined;
  readonly debriefComplete?: boolean | undefined;
  readonly emotionalState?: string | undefined;
}

export interface CommanderRelationshipJournalInput {
  readonly id: string;
  readonly missionId?: string | undefined;
  readonly behaviorSummary?: string | undefined;
  readonly reflectionSummary?: string | undefined;
}

export interface CommanderRelationshipGuardianInput {
  readonly id: string;
  readonly missionId?: string | undefined;
  readonly message: string;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
  readonly resolved?: boolean | undefined;
}

export interface CommanderRelationshipDoctrineInput {
  readonly id: string;
  readonly missionId?: string | undefined;
  readonly title: string;
  readonly promoted?: boolean | undefined;
}

export interface CommanderRelationshipAcademyInput {
  readonly id: string;
  readonly missionId?: string | undefined;
  readonly category: string;
  readonly title: string;
}

export interface CommanderRelationshipEngineInput {
  readonly snapshotId?: string | undefined;
  readonly operatorId?: string | undefined;
  readonly evaluatedAt?: string | undefined;
  readonly missionEvaluations?: readonly MissionEvaluation[] | undefined;
  readonly institutionalHealth?: InstitutionalHealthSnapshot | undefined;
  readonly operationalConsequences?: readonly OperationalConsequence[] | undefined;
  readonly missionContexts?: readonly CommanderRelationshipMissionContextInput[] | undefined;
  readonly journalEntries?: readonly CommanderRelationshipJournalInput[] | undefined;
  readonly guardianAlerts?: readonly CommanderRelationshipGuardianInput[] | undefined;
  readonly doctrineRecords?: readonly CommanderRelationshipDoctrineInput[] | undefined;
  readonly academyEvents?: readonly CommanderRelationshipAcademyInput[] | undefined;
  readonly previousSnapshot?: RelationshipSnapshot | undefined;
}

export function buildCommanderRelationshipSnapshot(
  input: CommanderRelationshipEngineInput,
): RelationshipSnapshot {
  const evaluatedAt = input.evaluatedAt ?? new Date().toISOString();
  const evidence = collectRelationshipEvidence(input);
  const dimensions = behaviorDimensions.map((dimensionId) => buildDimension({
    dimensionId,
    evidence,
    evaluatedAt,
    previousSnapshot: input.previousSnapshot,
  }));
  const strengths = dimensions
    .filter((dimension) => dimension.state === 'strong' || dimension.state === 'stable')
    .sort(compareStrongDimensions);
  const needsAttention = dimensions
    .filter((dimension) => dimension.state === 'critical' || dimension.state === 'strained')
    .sort(compareWeakDimensions);
  const patterns = detectCommanderRelationshipPatterns({ evidence });
  const milestones = buildBehaviorMilestones({ evidence, evaluatedAt, doctrineRecords: input.doctrineRecords ?? [] });
  const missionCount = unique(evidence.map((item) => item.missionId).filter(hasText)).length;
  const trustState = getWorstBehaviorState(dimensions.map((dimension) => dimension.state));
  const coachingMode = selectCommanderCoachingMode({ missionCount, strengths, needsAttention });

  return createRelationshipSnapshot({
    snapshotId: input.snapshotId ?? `commander-relationship:${input.operatorId ?? 'operator'}:${evaluatedAt}`,
    operatorId: input.operatorId ?? 'operator',
    evaluatedAt,
    relationship: {
      operatorId: input.operatorId ?? 'operator',
      trustState,
      coachingMode,
      summary: buildRelationshipSummary({ missionCount, trustState, needsAttention, strengths }),
      profile: {
        dimensions,
        strengths,
        needsAttention,
        patterns,
        milestones,
      },
    },
  });
}

const behaviorDimensions: readonly BehaviorDimensionId[] = [
  'mission-preparation',
  'observation-discipline',
  'authorization-discipline',
  'emotional-stability',
  'risk-discipline',
  'recovery-discipline',
  'reflection-quality',
  'learning-consistency',
  'process-trust',
];

function collectRelationshipEvidence(input: CommanderRelationshipEngineInput): readonly BehaviorEvidence[] {
  const evidence: BehaviorEvidence[] = [];

  for (const evaluation of input.missionEvaluations ?? []) {
    evidence.push(...evaluationToEvidence(evaluation));
  }

  for (const context of input.missionContexts ?? []) {
    evidence.push(...missionContextToEvidence(context));
  }

  for (const consequence of input.operationalConsequences ?? []) {
    evidence.push(createBehaviorEvidence({
      id: `consequence:${consequence.consequenceId}`,
      source: 'operational-consequence',
      missionId: consequence.missionId,
      description: `${consequence.title}: ${consequence.explanation}`,
    }));
  }

  for (const healthDimension of input.institutionalHealth?.dimensions ?? []) {
    evidence.push(createBehaviorEvidence({
      id: `health:${healthDimension.id}`,
      source: 'institutional-health',
      description: `${healthDimension.title}: ${healthDimension.explanation.why}`,
    }));
  }

  for (const entry of input.journalEntries ?? []) {
    const text = entry.behaviorSummary ?? entry.reflectionSummary;
    if (hasText(text)) {
      evidence.push(createBehaviorEvidence({
        id: `journal:${entry.id}`,
        source: 'journal',
        ...(entry.missionId ? { missionId: entry.missionId } : {}),
        description: text,
      }));
    }
  }

  for (const alert of input.guardianAlerts ?? []) {
    evidence.push(createBehaviorEvidence({
      id: `guardian:${alert.id}`,
      source: 'guardian',
      ...(alert.missionId ? { missionId: alert.missionId } : {}),
      description: alert.resolved === true ? `Guardian recovery resolved: ${alert.message}` : `Guardian alert: ${alert.message}`,
    }));
  }

  for (const doctrine of input.doctrineRecords ?? []) {
    evidence.push(createBehaviorEvidence({
      id: `doctrine:${doctrine.id}`,
      source: 'doctrine',
      ...(doctrine.missionId ? { missionId: doctrine.missionId } : {}),
      description: doctrine.promoted === true ? `Doctrine promoted: ${doctrine.title}` : `Doctrine referenced: ${doctrine.title}`,
    }));
  }

  for (const event of input.academyEvents ?? []) {
    evidence.push(createBehaviorEvidence({
      id: `academy:${event.id}`,
      source: 'academy',
      ...(event.missionId ? { missionId: event.missionId } : {}),
      description: `${event.category}: ${event.title}`,
    }));
  }

  if (evidence.length === 0) {
    evidence.push(createBehaviorEvidence({
      id: 'relationship:no-evidence',
      source: 'mission-lifecycle',
      description: 'No completed behavioral evidence exists yet.',
    }));
  }

  return Object.freeze(evidence);
}

function evaluationToEvidence(evaluation: MissionEvaluation): readonly BehaviorEvidence[] {
  const evidence: BehaviorEvidence[] = [];

  for (const strength of evaluation.strengths) {
    evidence.push(createBehaviorEvidence({
      id: `evaluation:${evaluation.id}:strength:${hashText(strength)}`,
      source: 'mission-evaluation',
      missionId: evaluation.missionId,
      description: strength,
    }));
  }

  for (const weakness of evaluation.weaknesses) {
    evidence.push(createBehaviorEvidence({
      id: `evaluation:${evaluation.id}:weakness:${hashText(weakness)}`,
      source: 'mission-evaluation',
      missionId: evaluation.missionId,
      description: weakness,
    }));
  }

  for (const recognition of evaluation.recognition) {
    evidence.push(createBehaviorEvidence({
      id: `evaluation:${evaluation.id}:recognition:${hashText(recognition)}`,
      source: 'academy',
      missionId: evaluation.missionId,
      description: recognition,
    }));
  }

  return evidence;
}

function missionContextToEvidence(context: CommanderRelationshipMissionContextInput): readonly BehaviorEvidence[] {
  return [
    context.briefingComplete ? evidence(context, 'briefing', 'Operational briefing completed before mission progression.') : undefined,
    context.observationComplete ? evidence(context, 'observation', 'Observation completed before War Room progression.') : undefined,
    context.authorizationEvidencePresent ? evidence(context, 'authorization', 'Authorization evidence was recorded.') : undefined,
    context.invalidationPresent ? evidence(context, 'invalidation', 'Invalidation evidence was recorded before authorization.') : undefined,
    context.riskDeclared ? evidence(context, 'risk', 'Risk boundary was declared.') : undefined,
    context.debriefComplete ? evidence(context, 'debrief', 'Debrief evidence was completed.') : undefined,
    hasText(context.emotionalState) ? evidence(context, 'emotion', `Operator emotional state recorded: ${context.emotionalState}.`) : undefined,
  ].filter((item): item is BehaviorEvidence => item !== undefined);
}

function buildDimension(input: {
  readonly dimensionId: BehaviorDimensionId;
  readonly evidence: readonly BehaviorEvidence[];
  readonly evaluatedAt: string;
  readonly previousSnapshot?: RelationshipSnapshot | undefined;
}): BehaviorDimension {
  const positive = input.evidence.filter((item) => isPositiveEvidenceForDimension(input.dimensionId, item));
  const negative = input.evidence.filter((item) => isNegativeEvidenceForDimension(input.dimensionId, item));
  const state = resolveBehaviorState(positive.length, negative.length);
  const dimensionEvidence = [...negative, ...positive].slice(0, 5);

  return createBehaviorDimension({
    id: input.dimensionId,
    state,
    trend: resolveTrend(input.dimensionId, state, input.previousSnapshot),
    explanation: buildDimensionExplanation(input.dimensionId, state, positive.length, negative.length),
    supportingEvidence: dimensionEvidence.length > 0
      ? dimensionEvidence
      : [createBehaviorEvidence({
          id: `relationship:${input.dimensionId}:forming`,
          source: 'mission-lifecycle',
          description: 'Behavior evidence is still forming for this dimension.',
        })],
    lastUpdated: input.evaluatedAt,
  });
}

function resolveBehaviorState(positiveCount: number, negativeCount: number): BehaviorState {
  if (negativeCount >= 3) return 'critical';
  if (negativeCount >= 1 && negativeCount >= positiveCount) return 'strained';
  if (positiveCount >= 5) return 'strong';
  if (positiveCount >= 2) return 'stable';
  return 'forming';
}

function resolveTrend(
  dimensionId: BehaviorDimensionId,
  state: BehaviorState,
  previousSnapshot: RelationshipSnapshot | undefined,
): BehaviorTrend {
  const previous = previousSnapshot?.relationship.profile.dimensions.find((dimension) => dimension.id === dimensionId);
  if (previous === undefined) return 'stable';

  const comparison = compareBehaviorStates(state, previous.state);
  if (comparison < 0) return 'improving';
  if (comparison > 0) return 'declining';
  return 'stable';
}

function buildDimensionExplanation(
  dimensionId: BehaviorDimensionId,
  state: BehaviorState,
  positiveCount: number,
  negativeCount: number,
): string {
  if (state === 'critical') return `${negativeCount} evidence records show this behavior is actively damaging process trust.`;
  if (state === 'strained') return 'Evidence shows this behavior needs Commander attention before it becomes habit.';
  if (state === 'strong') return `${positiveCount} evidence records show this behavior is becoming reliable.`;
  if (state === 'stable') return `${positiveCount} evidence records support this behavior.`;
  return `${dimensionId.replace(/-/gu, ' ')} is still forming from approved evidence.`;
}

function isPositiveEvidenceForDimension(id: BehaviorDimensionId, evidenceItem: BehaviorEvidence): boolean {
  const text = evidenceItem.description.toLowerCase();
  if (id === 'mission-preparation') return /briefing completed|preparation|structured preparation/iu.test(text);
  if (id === 'observation-discipline') return /observation completed|waited for evidence|visible evidence/iu.test(text);
  if (id === 'authorization-discipline') return /authorization evidence|invalidation evidence|protective rule|doctrine referenced/iu.test(text);
  if (id === 'emotional-stability') return /focused|calm|emotional regulation/iu.test(text);
  if (id === 'risk-discipline') return /risk boundary|risk.*declared|respected.*risk/iu.test(text);
  if (id === 'recovery-discipline') return /recovery resolved|guardian recovery|restriction.*resolved/iu.test(text);
  if (id === 'reflection-quality') return /debrief evidence|reflection|lesson captured/iu.test(text);
  if (id === 'learning-consistency') return /academy|growth|recognition|consistent/iu.test(text);
  return /doctrine|lifecycle completed|process integrity|followed plan/iu.test(text);
}

function isNegativeEvidenceForDimension(id: BehaviorDimensionId, evidenceItem: BehaviorEvidence): boolean {
  const text = evidenceItem.description.toLowerCase();
  if (id === 'mission-preparation') return /briefing.*missing|preparation.*missing/iu.test(text);
  if (id === 'observation-discipline') return /premature|observation.*missing|predict/iu.test(text);
  if (id === 'authorization-discipline') return /authorization.*incomplete|without protection|protective doctrine rule was not declared/iu.test(text);
  if (id === 'emotional-stability') return /stressed|tired|distracted|emotional.*weak/iu.test(text);
  if (id === 'risk-discipline') return /risk.*missing|risk limit violation|risk ceiling was not declared/iu.test(text);
  if (id === 'recovery-discipline') return /guardian alert|restriction|lockout|recovery.*required/iu.test(text);
  if (id === 'reflection-quality') return /debrief.*missing|reflection.*missing|weak debrief/iu.test(text);
  if (id === 'learning-consistency') return /growth.*missing|no academy growth|repeat disciplined behavior/iu.test(text);
  return /process failure|ignored doctrine|lifecycle inconsistency/iu.test(text);
}

function buildBehaviorMilestones(input: {
  readonly evidence: readonly BehaviorEvidence[];
  readonly evaluatedAt: string;
  readonly doctrineRecords: readonly CommanderRelationshipDoctrineInput[];
}): readonly BehaviorMilestone[] {
  const milestones: BehaviorMilestone[] = [];
  const disciplinedEvidence = input.evidence.filter((item) => /risk boundary|observation completed|invalidation evidence|debrief evidence/iu.test(item.description));
  const completeDebriefs = input.evidence.filter((item) => /debrief evidence was completed|lesson captured/iu.test(item.description));
  const promotions = input.doctrineRecords.filter((record) => record.promoted === true);

  if (disciplinedEvidence.length >= 10) {
    milestones.push(milestone('milestone:ten-disciplined-missions', 'Ten disciplined mission signals', 'Ten evidence records support disciplined mission behavior.', input.evaluatedAt, disciplinedEvidence));
  }
  if (completeDebriefs.length >= 5) {
    milestones.push(milestone('milestone:five-complete-debriefs', 'Five complete debriefs', 'Five debrief records support reflection quality.', input.evaluatedAt, completeDebriefs));
  }
  if (promotions.length >= 3) {
    milestones.push(milestone('milestone:three-doctrine-promotions', 'Three doctrine promotions', 'Doctrine promotion evidence shows institutional learning.', input.evaluatedAt, promotions.map((record) => createBehaviorEvidence({
      id: `doctrine:${record.id}`,
      source: 'doctrine',
      ...(record.missionId ? { missionId: record.missionId } : {}),
      description: `Doctrine promoted: ${record.title}`,
    }))));
  }

  return Object.freeze(milestones);
}

function milestone(
  id: string,
  title: string,
  description: string,
  achievedAt: string,
  evidenceItems: readonly BehaviorEvidence[],
): BehaviorMilestone {
  return Object.freeze({
    id,
    title,
    description,
    achievedAt,
    evidence: Object.freeze(evidenceItems.slice(0, 10)),
  });
}

function buildRelationshipSummary(input: {
  readonly missionCount: number;
  readonly trustState: BehaviorState;
  readonly needsAttention: readonly BehaviorDimension[];
  readonly strengths: readonly BehaviorDimension[];
}): string {
  if (input.missionCount === 0) return 'Commander relationship is waiting for mission evidence.';
  if (input.needsAttention[0]) return `${input.needsAttention[0].title} is the current coaching focus.`;
  if (input.strengths[0]) return `${input.strengths[0].title} is supported by recent evidence.`;
  return `Commander relationship is ${input.trustState} across ${input.missionCount} mission${input.missionCount === 1 ? '' : 's'}.`;
}

function compareStrongDimensions(left: BehaviorDimension, right: BehaviorDimension): number {
  return compareBehaviorStates(left.state, right.state) || right.supportingEvidence.length - left.supportingEvidence.length;
}

function compareWeakDimensions(left: BehaviorDimension, right: BehaviorDimension): number {
  return compareBehaviorStates(right.state, left.state) || right.supportingEvidence.length - left.supportingEvidence.length;
}

function evidence(
  context: CommanderRelationshipMissionContextInput,
  kind: string,
  description: string,
): BehaviorEvidence {
  return createBehaviorEvidence({
    id: `mission-context:${context.missionId}:${kind}`,
    source: 'mission-context',
    missionId: context.missionId,
    description,
  });
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function hashText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '').slice(0, 48) || 'evidence';
}

function hasText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}
