import type { MissionState } from '@headquarters/shared';
import type { MissionIntelligencePackage } from './MissionIntelligencePackage';

export type MissionEvaluationVerdict =
  | 'Exceptional Process'
  | 'Excellent Process'
  | 'Successful'
  | 'Acceptable'
  | 'Partial Success'
  | 'Needs Improvement'
  | 'Process Failure'
  | 'Mission Aborted'
  | 'Incomplete';

export type MissionEvaluationDimensionId =
  | 'mission-discipline'
  | 'observation-quality'
  | 'authorization-quality'
  | 'risk-discipline'
  | 'debrief-quality'
  | 'journal-quality'
  | 'doctrine-contribution'
  | 'academy-growth';

export type MissionEvaluationDimensionRating = 'excellent' | 'strong' | 'acceptable' | 'weak' | 'failed' | 'incomplete';
export type DoctrineContribution = 'none' | 'candidate' | 'promoted';
export type AcademyGrowthOutcome =
  | 'none'
  | 'discipline improvement'
  | 'observation improvement'
  | 'emotional improvement'
  | 'authorization improvement';
export type MissionEvaluationMissionState = MissionState | 'aborted';

export interface MissionEvaluationGuardianInput {
  readonly state: 'secure' | 'warning' | 'restriction' | 'lockout';
  readonly highestAlert: string;
}

export interface MissionEvaluationDoctrineInput {
  readonly activeProtectiveRule: string;
  readonly pendingCandidateCount: number;
  readonly relevance: string;
}

export interface MissionEvaluationInput {
  readonly missionId?: string | undefined;
  readonly missionState: MissionEvaluationMissionState | undefined;
  readonly missionIntelligence?: MissionIntelligencePackage | undefined;
  readonly guardian: MissionEvaluationGuardianInput;
  readonly doctrine: MissionEvaluationDoctrineInput;
  readonly journalEntryCount?: number | undefined;
  readonly doctrinePromoted?: boolean | undefined;
  readonly evaluatedAt?: string | undefined;
}

export interface MissionEvaluationDimension {
  readonly id: MissionEvaluationDimensionId;
  readonly label: string;
  readonly rating: MissionEvaluationDimensionRating;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly evidence: readonly string[];
  readonly recommendation: string;
}

export interface MissionEvaluation {
  readonly id: string;
  readonly missionId: string;
  readonly evaluatedAt: string;
  readonly verdict: MissionEvaluationVerdict;
  readonly classification: MissionEvaluationVerdict;
  readonly dimensions: readonly MissionEvaluationDimension[];
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly recommendations: readonly string[];
  readonly supportingReasons: readonly string[];
  readonly failures: readonly string[];
  readonly commanderVerdict: string;
  readonly commanderReview: string;
  readonly unresolvedLesson: string;
  readonly recognitionEligible: boolean;
  readonly recognition: readonly string[];
  readonly academyGrowth: AcademyGrowthOutcome;
  readonly academyGrowthEvidence: readonly string[];
  readonly guardianHistoryUpdate: string;
  readonly guardianNotes: readonly string[];
  readonly doctrineContribution: DoctrineContribution;
  readonly doctrineUpdates: readonly string[];
  readonly doctrineCandidateEligible: boolean;
  readonly archiveClassification: string;
}

export function buildMissionEvaluation(input: MissionEvaluationInput): MissionEvaluation {
  const missionPackage = input.missionIntelligence;
  const missionId = input.missionId ?? missionPackage?.missionId ?? 'mission:unknown';
  const evaluatedAt = input.evaluatedAt ?? new Date().toISOString();
  const protectiveRuleMissing = input.doctrine.activeProtectiveRule.startsWith('No protective rule');
  const lifecycleComplete = input.missionState === 'archived';
  const missionAborted = input.missionState === 'aborted';
  const debriefComplete = hasText(missionPackage?.debriefSummary);
  const evidenceComplete = missionPackage !== undefined
    && missionPackage.missingEvidence.length === 0
    && missionPackage.contradictions.length === 0;
  const guardianClean = input.guardian.state === 'secure' || input.guardian.state === 'warning';
  const riskDeclared = hasText(missionPackage?.riskLimit);
  const authorizationEvidence = hasText(missionPackage?.authorizationSummary) || hasText(missionPackage?.invalidation);
  const doctrineContribution = resolveDoctrineContribution(input);
  const academyGrowth = resolveAcademyGrowth(input, { debriefComplete, evidenceComplete, riskDeclared, authorizationEvidence });

  const dimensions = [
    buildMissionDisciplineDimension({ lifecycleComplete, missionAborted, guardianClean, missionState: input.missionState }),
    buildObservationQualityDimension(missionPackage),
    buildAuthorizationQualityDimension({ missionPackage, authorizationEvidence, protectiveRuleMissing, guardianClean }),
    buildRiskDisciplineDimension({ missionPackage, riskDeclared, guardian: input.guardian }),
    buildDebriefQualityDimension(missionPackage),
    buildJournalQualityDimension(input.journalEntryCount ?? 0, missionPackage),
    buildDoctrineContributionDimension(doctrineContribution, input.doctrine),
    buildAcademyGrowthDimension(academyGrowth, missionPackage),
  ] satisfies readonly MissionEvaluationDimension[];

  const failures = compact([
    !lifecycleComplete && !missionAborted ? 'Mission lifecycle is not archived yet.' : undefined,
    missionAborted ? 'Mission was aborted before normal closure.' : undefined,
    !debriefComplete ? 'Debrief evidence is missing.' : undefined,
    !riskDeclared ? 'Risk ceiling was not declared.' : undefined,
    !authorizationEvidence && isAuthorizationRelevant(input.missionState)
      ? 'Authorization evidence is incomplete.'
      : undefined,
    protectiveRuleMissing && isAuthorizationRelevant(input.missionState)
      ? 'Protective doctrine rule was not declared.'
      : undefined,
    missionPackage && missionPackage.contradictions.length > 0 ? 'Contradictions remain unresolved.' : undefined,
    input.guardian.state === 'restriction' || input.guardian.state === 'lockout' ? 'Guardian restriction affected the mission.' : undefined,
  ]);
  const strengths = unique([
    ...dimensions.flatMap((dimension) => dimension.strengths),
    lifecycleComplete ? 'Lifecycle completed and archived.' : undefined,
    evidenceComplete ? 'Mission evidence is complete and contradiction-free.' : undefined,
    guardianClean ? 'No Guardian lockout or restriction remains active.' : undefined,
  ]);
  const weaknesses = unique([
    ...dimensions.flatMap((dimension) => dimension.weaknesses),
    ...failures,
  ]);
  const recommendations = unique(dimensions.map((dimension) => dimension.recommendation));
  const verdict = classifyMissionEvaluation({
    lifecycleComplete,
    missionAborted,
    evidenceComplete,
    debriefComplete,
    guardianClean,
    protectiveRuleMissing,
    dimensions,
    processFailureCount: failures.length,
  });
  const recognitionEligible = verdict === 'Exceptional Process' || verdict === 'Excellent Process' || verdict === 'Successful';
  const doctrineCandidateEligible = doctrineContribution === 'candidate' || doctrineContribution === 'promoted';
  const guardianNotes = compact([
    input.guardian.state === 'secure' ? 'Guardian reports no active discipline violation.' : input.guardian.highestAlert,
    riskDeclared ? `Declared risk boundary: ${missionPackage?.riskLimit}.` : undefined,
  ]);
  const doctrineUpdates = compact([
    doctrineContribution === 'promoted' ? 'Doctrine promotion recorded from mission evidence.' : undefined,
    doctrineContribution === 'candidate' ? 'Doctrine candidate identified for review.' : undefined,
    doctrineContribution === 'none' ? 'No doctrine contribution was produced by this mission.' : undefined,
    input.doctrine.relevance,
  ]);
  const academyGrowthEvidence = compact([
    academyGrowth !== 'none' ? formatAcademyGrowthEvidence(academyGrowth) : undefined,
    recognitionEligible && missionPackage?.debriefSummary ? missionPackage.debriefSummary : undefined,
  ]);

  return {
    id: `evaluation:${missionId}`,
    missionId,
    evaluatedAt,
    verdict,
    classification: verdict,
    dimensions,
    strengths: strengths.length > 0 ? strengths : ['Mission evaluation is waiting for process evidence.'],
    weaknesses,
    recommendations,
    supportingReasons: strengths.length > 0 ? strengths : ['Mission evaluation is waiting for process evidence.'],
    failures,
    commanderVerdict: getMissionEvaluationCommanderVerdict(verdict),
    commanderReview: buildCommanderEvaluationReview(verdict, strengths, weaknesses, recommendations, guardianNotes, doctrineUpdates, academyGrowth),
    unresolvedLesson: missionPackage?.debriefSummary ? 'Lesson captured in debrief evidence.' : 'Debrief lesson remains unresolved.',
    recognitionEligible,
    recognition: recognitionEligible ? buildRecognition(verdict, academyGrowth) : [],
    academyGrowth,
    academyGrowthEvidence,
    guardianHistoryUpdate: input.guardian.state === 'secure'
      ? 'No active Guardian restriction at evaluation time.'
      : input.guardian.highestAlert,
    guardianNotes,
    doctrineContribution,
    doctrineUpdates,
    doctrineCandidateEligible,
    archiveClassification: lifecycleComplete ? `archive:${verdict}` : missionAborted ? 'archive:Mission Aborted' : 'archive:pending',
  };
}

export const buildMissionFinalEvaluation = buildMissionEvaluation;

function buildMissionDisciplineDimension(input: {
  readonly lifecycleComplete: boolean;
  readonly missionAborted: boolean;
  readonly guardianClean: boolean;
  readonly missionState: MissionEvaluationMissionState | undefined;
}): MissionEvaluationDimension {
  if (input.missionAborted) {
    return dimension('mission-discipline', 'Mission Discipline', 'failed', [], ['Mission aborted before normal closure.'], ['Lifecycle stopped at abort.'], 'Use abort recovery before opening another mission.');
  }
  if (!input.lifecycleComplete) {
    return dimension('mission-discipline', 'Mission Discipline', 'incomplete', [], ['Lifecycle is not archived yet.'], [`Current state: ${input.missionState ?? 'none'}.`], 'Complete the lifecycle before final evaluation.');
  }
  return dimension('mission-discipline', 'Mission Discipline', input.guardianClean ? 'strong' : 'weak', ['Lifecycle sequence reached archive.'], input.guardianClean ? [] : ['Guardian restriction affected discipline.'], ['Mission state archived.'], input.guardianClean ? 'Preserve the same lifecycle discipline.' : 'Repair the breached operational boundary.');
}

function buildObservationQualityDimension(missionPackage: MissionIntelligencePackage | undefined): MissionEvaluationDimension {
  if (missionPackage === undefined) {
    return dimension('observation-quality', 'Observation Quality', 'incomplete', [], ['Observation evidence is missing.'], [], 'Capture visible market evidence before authorization.');
  }
  const missingObservation = missionPackage.missingEvidence.filter((item) => item.room === 'observation');
  const hasObservationSummary = hasText(missionPackage.observationSummary);
  const rating = missingObservation.length === 0 && missionPackage.contradictions.length === 0
    ? 'strong'
    : missingObservation.length <= 2 && hasObservationSummary
      ? 'acceptable'
      : 'weak';
  return dimension(
    'observation-quality',
    'Observation Quality',
    rating,
    compact([
      hasObservationSummary ? 'Observation summary captured.' : undefined,
      missingObservation.length === 0 ? 'Required observation fields are present.' : undefined,
    ]),
    compact([
      missingObservation.length > 0 ? `${missingObservation.length} observation field(s) missing.` : undefined,
      missionPackage.contradictions.length > 0 ? 'Observation contains unresolved contradictions.' : undefined,
    ]),
    compact([missionPackage.observationSummary, missionPackage.trend, missionPackage.structure]),
    missingObservation.length > 0 ? 'Strengthen observation specificity before requesting authorization.' : 'Continue reporting only visible evidence.',
  );
}

function buildAuthorizationQualityDimension(input: {
  readonly missionPackage: MissionIntelligencePackage | undefined;
  readonly authorizationEvidence: boolean;
  readonly protectiveRuleMissing: boolean;
  readonly guardianClean: boolean;
}): MissionEvaluationDimension {
  const weak = !input.authorizationEvidence || input.protectiveRuleMissing || !input.guardianClean;
  return dimension(
    'authorization-quality',
    'Authorization Quality',
    weak ? 'weak' : 'strong',
    compact([
      input.authorizationEvidence ? 'Authorization was supported by recorded evidence.' : undefined,
      !input.protectiveRuleMissing ? 'Protective doctrine rule was declared.' : undefined,
    ]),
    compact([
      !input.authorizationEvidence ? 'Authorization evidence is incomplete.' : undefined,
      input.protectiveRuleMissing ? 'Protective doctrine rule was not declared.' : undefined,
      !input.guardianClean ? 'Guardian restriction was present during evaluation.' : undefined,
    ]),
    compact([input.missionPackage?.authorizationSummary, input.missionPackage?.invalidation]),
    weak ? 'Require evidence, invalidation, and doctrine before deployment.' : 'Keep authorization tied to evidence and doctrine.',
  );
}

function buildRiskDisciplineDimension(input: {
  readonly missionPackage: MissionIntelligencePackage | undefined;
  readonly riskDeclared: boolean;
  readonly guardian: MissionEvaluationGuardianInput;
}): MissionEvaluationDimension {
  const failed = input.guardian.state === 'restriction' || input.guardian.state === 'lockout';
  return dimension(
    'risk-discipline',
    'Risk Discipline',
    failed ? 'failed' : input.riskDeclared ? 'strong' : 'weak',
    compact([input.riskDeclared ? `Risk boundary declared: ${input.missionPackage?.riskLimit}.` : undefined]),
    compact([
      !input.riskDeclared ? 'Risk ceiling was not declared.' : undefined,
      failed ? input.guardian.highestAlert : undefined,
    ]),
    compact([input.missionPackage?.operatorReadiness, input.guardian.highestAlert]),
    failed ? 'Treat Guardian restrictions as command authority.' : 'Keep risk stated before War Room authorization.',
  );
}

function buildDebriefQualityDimension(missionPackage: MissionIntelligencePackage | undefined): MissionEvaluationDimension {
  const complete = hasText(missionPackage?.debriefSummary);
  return dimension(
    'debrief-quality',
    'Debrief Quality',
    complete ? 'strong' : 'incomplete',
    complete ? ['Behavior-first debrief evidence is present.'] : [],
    complete ? [] : ['Debrief evidence is missing.'],
    compact([missionPackage?.debriefSummary]),
    complete ? 'Preserve the lesson in future mission planning.' : 'Complete the debrief before mission closure.',
  );
}

function buildJournalQualityDimension(journalEntryCount: number, missionPackage: MissionIntelligencePackage | undefined): MissionEvaluationDimension {
  const hasJournalEvidence = journalEntryCount > 0 || hasText(missionPackage?.debriefSummary);
  return dimension(
    'journal-quality',
    'Journal Quality',
    hasJournalEvidence ? 'acceptable' : 'incomplete',
    hasJournalEvidence ? ['Reflection evidence is available for review.'] : [],
    hasJournalEvidence ? [] : ['Journal reflection is not attached to this mission.'],
    compact([journalEntryCount > 0 ? `${journalEntryCount} journal record(s) linked.` : undefined, missionPackage?.debriefSummary]),
    hasJournalEvidence ? 'Use the reflection to inform Academy growth.' : 'Attach a journal reflection to improve historical value.',
  );
}

function buildDoctrineContributionDimension(
  contribution: DoctrineContribution,
  doctrine: MissionEvaluationDoctrineInput,
): MissionEvaluationDimension {
  const rating = contribution === 'promoted' ? 'excellent' : contribution === 'candidate' ? 'strong' : 'acceptable';
  return dimension(
    'doctrine-contribution',
    'Doctrine Contribution',
    rating,
    compact([
      contribution === 'promoted' ? 'Doctrine was promoted from mission evidence.' : undefined,
      contribution === 'candidate' ? 'Mission produced a doctrine candidate.' : undefined,
    ]),
    contribution === 'none' ? ['No doctrine contribution was produced.'] : [],
    compact([doctrine.activeProtectiveRule, doctrine.relevance]),
    contribution === 'none' ? 'Watch for repeatable behavior that deserves doctrine review.' : 'Review the doctrine candidate before making it law.',
  );
}

function buildAcademyGrowthDimension(
  growth: AcademyGrowthOutcome,
  missionPackage: MissionIntelligencePackage | undefined,
): MissionEvaluationDimension {
  return dimension(
    'academy-growth',
    'Academy Growth',
    growth === 'none' ? 'acceptable' : 'strong',
    growth === 'none' ? [] : [formatAcademyGrowthEvidence(growth)],
    growth === 'none' ? ['No specific Academy growth signal was detected.'] : [],
    compact([missionPackage?.operatorReadiness, missionPackage?.debriefSummary]),
    growth === 'none' ? 'Repeat disciplined behavior until a trend emerges.' : 'Record this growth signal for Academy progression.',
  );
}

function dimension(
  id: MissionEvaluationDimensionId,
  label: string,
  rating: MissionEvaluationDimensionRating,
  strengths: readonly string[],
  weaknesses: readonly string[],
  evidence: readonly string[],
  recommendation: string,
): MissionEvaluationDimension {
  return { id, label, rating, strengths, weaknesses, evidence, recommendation };
}

function classifyMissionEvaluation(input: {
  readonly lifecycleComplete: boolean;
  readonly missionAborted: boolean;
  readonly evidenceComplete: boolean;
  readonly debriefComplete: boolean;
  readonly guardianClean: boolean;
  readonly protectiveRuleMissing: boolean;
  readonly dimensions: readonly MissionEvaluationDimension[];
  readonly processFailureCount: number;
}): MissionEvaluationVerdict {
  if (input.missionAborted) return 'Mission Aborted';
  if (!input.lifecycleComplete) return 'Incomplete';
  if (!input.guardianClean || input.protectiveRuleMissing) return 'Process Failure';
  const weakCount = input.dimensions.filter((dimensionItem) => dimensionItem.rating === 'weak' || dimensionItem.rating === 'failed').length;
  const incompleteCount = input.dimensions.filter((dimensionItem) => dimensionItem.rating === 'incomplete').length;
  if (input.evidenceComplete && input.debriefComplete && input.processFailureCount === 0 && weakCount === 0 && incompleteCount === 0) {
    return 'Exceptional Process';
  }
  if (input.debriefComplete && input.processFailureCount === 0 && weakCount === 0) return 'Excellent Process';
  if (input.debriefComplete && input.processFailureCount <= 1 && weakCount <= 1) return 'Successful';
  if (input.debriefComplete && weakCount <= 2) return 'Acceptable';
  if (input.debriefComplete) return 'Partial Success';
  return 'Needs Improvement';
}

function getMissionEvaluationCommanderVerdict(verdict: MissionEvaluationVerdict): string {
  if (verdict === 'Exceptional Process') {
    return 'Mission complete. Process integrity held from briefing through archive.';
  }
  if (verdict === 'Excellent Process') {
    return 'Mission complete. Headquarters records excellent operational discipline.';
  }
  if (verdict === 'Successful') {
    return 'Mission accepted as successful process. Headquarters records disciplined completion.';
  }
  if (verdict === 'Acceptable') {
    return 'Mission accepted. Process held, but improvement remains available.';
  }
  if (verdict === 'Partial Success') {
    return 'Mission contains useful process evidence, but unresolved gaps remain.';
  }
  if (verdict === 'Needs Improvement') {
    return 'Mission review indicates improvement is required before the next deployment.';
  }
  if (verdict === 'Process Failure') {
    return 'Mission outcome cannot override process failure. Review the violated boundary.';
  }
  if (verdict === 'Mission Aborted') {
    return 'Mission aborted. Headquarters preserves the decision and recovery path.';
  }
  return 'Mission evaluation incomplete. Finish lifecycle evidence before final judgment.';
}

function buildCommanderEvaluationReview(
  verdict: MissionEvaluationVerdict,
  strengths: readonly string[],
  weaknesses: readonly string[],
  recommendations: readonly string[],
  guardianNotes: readonly string[],
  doctrineUpdates: readonly string[],
  academyGrowth: AcademyGrowthOutcome,
): string {
  return compact([
    'Headquarters Evaluation.',
    `Process quality: ${verdict}.`,
    strengths[0] ? `Strength: ${strengths[0]}` : undefined,
    weaknesses[0] ? `Weakness: ${weaknesses[0]}` : undefined,
    guardianNotes[0] ? `Guardian: ${guardianNotes[0]}` : undefined,
    academyGrowth !== 'none' ? `Academy: ${formatAcademyGrowthEvidence(academyGrowth)}` : 'Academy: no growth event recorded.',
    doctrineUpdates[0] ? `Doctrine: ${doctrineUpdates[0]}` : undefined,
    recommendations[0] ? `Recommendation: ${recommendations[0]}` : undefined,
  ]).join(' ');
}

function resolveDoctrineContribution(input: MissionEvaluationInput): DoctrineContribution {
  if (input.doctrinePromoted) return 'promoted';
  if (input.doctrine.pendingCandidateCount > 0 || hasText(input.missionIntelligence?.debriefSummary)) return 'candidate';
  return 'none';
}

function resolveAcademyGrowth(
  input: MissionEvaluationInput,
  context: {
    readonly debriefComplete: boolean;
    readonly evidenceComplete: boolean;
    readonly riskDeclared: boolean;
    readonly authorizationEvidence: boolean;
  },
): AcademyGrowthOutcome {
  const readiness = input.missionIntelligence?.operatorReadiness?.toLowerCase() ?? '';
  if (context.evidenceComplete) return 'observation improvement';
  if (context.riskDeclared && input.guardian.state === 'secure') return 'discipline improvement';
  if (readiness.includes('stress') || readiness.includes('tired') || readiness.includes('distract')) return 'emotional improvement';
  if (context.authorizationEvidence) return 'authorization improvement';
  if (context.debriefComplete) return 'discipline improvement';
  return 'none';
}

function buildRecognition(verdict: MissionEvaluationVerdict, academyGrowth: AcademyGrowthOutcome): readonly string[] {
  return compact([
    verdict === 'Exceptional Process' ? 'Full operational discipline recognized.' : undefined,
    verdict === 'Excellent Process' || verdict === 'Successful' ? 'Mission process recognized by Headquarters.' : undefined,
    academyGrowth !== 'none' ? formatAcademyGrowthEvidence(academyGrowth) : undefined,
  ]);
}

function formatAcademyGrowthEvidence(growth: AcademyGrowthOutcome): string {
  if (growth === 'discipline improvement') return 'Academy records discipline improvement.';
  if (growth === 'observation improvement') return 'Academy records observation improvement.';
  if (growth === 'emotional improvement') return 'Academy records emotional regulation improvement.';
  if (growth === 'authorization improvement') return 'Academy records authorization improvement.';
  return 'No Academy growth recorded.';
}

function isAuthorizationRelevant(state: MissionEvaluationMissionState | undefined): boolean {
  return state === 'authorization'
    || state === 'deployed'
    || state === 'return_to_base'
    || state === 'debrief'
    || state === 'archived';
}

function compact(values: readonly (string | undefined)[]): string[] {
  return values.filter((value): value is string => hasText(value));
}

function unique(values: readonly (string | undefined)[]): readonly string[] {
  return [...new Set(compact(values))];
}

function hasText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}
