import {
  type JournalRecord,
  type JournalReviewState,
  archiveJournalRecord,
  copyJournalRecord,
  isJournalPromotable,
} from './JournalRecord';

export type JournalWorkflowStage = 'capture' | 'clarify' | 'reflect' | 'extract' | 'review' | 'promote' | 'archive';
export type JournalWorkflowState =
  | 'idle'
  | 'capturing'
  | 'clarification_required'
  | 'reflection_required'
  | 'extraction_available'
  | 'awaiting_review'
  | 'ready_for_promotion'
  | 'promoted'
  | 'archived'
  | 'blocked';

export type JournalWorkflowAction =
  | 'beginEntry'
  | 'saveDraft'
  | 'recordEntry'
  | 'requestClarification'
  | 'beginReflection'
  | 'completeReflection'
  | 'buildExtraction'
  | 'reviewExtraction'
  | 'approveLesson'
  | 'approveCommitment'
  | 'proposeDoctrineCandidate'
  | 'proposeGrowthEvidence'
  | 'archiveRecord'
  | 'returnForRevision';

export type JournalExtractionState = 'none' | 'incomplete' | 'candidate' | 'reviewed' | 'approved' | 'rejected';
export type JournalPromotionEligibility = 'not_eligible' | 'reflection_required' | 'review_required' | 'eligible' | 'promoted';
export type JournalPersistenceState = 'not_saved' | 'draft_saved' | 'recorded' | 'reloaded' | 'archived';

export interface JournalWorkflowBlocker {
  readonly blockerId: string;
  readonly source: 'guardian' | 'doctrine' | 'academy' | 'mission' | 'persistence';
  readonly reason: string;
  readonly requiredAction: JournalWorkflowAction;
}

export interface JournalWorkflowSnapshot {
  readonly activeRecord?: JournalRecord | undefined;
  readonly currentStage: JournalWorkflowStage;
  readonly currentState: JournalWorkflowState;
  readonly requiredAction: JournalWorkflowAction;
  readonly optionalActions: readonly JournalWorkflowAction[];
  readonly missingFields: readonly string[];
  readonly linkedMission?: string | undefined;
  readonly extractionState: JournalExtractionState;
  readonly reviewState: JournalReviewState;
  readonly promotionEligibility: JournalPromotionEligibility;
  readonly blocker?: JournalWorkflowBlocker | undefined;
  readonly persistenceState: JournalPersistenceState;
}

export interface JournalWorkflowInput {
  readonly activeRecord?: JournalRecord | undefined;
  readonly extractionState?: JournalExtractionState | undefined;
  readonly persistenceState?: JournalPersistenceState | undefined;
  readonly blocker?: JournalWorkflowBlocker | undefined;
  readonly missingFields?: readonly string[] | undefined;
}

export function buildJournalWorkflowSnapshot(input: JournalWorkflowInput = {}): JournalWorkflowSnapshot {
  const activeRecord = input.activeRecord ? copyJournalRecord(input.activeRecord) : undefined;
  const missingFields = [...(input.missingFields ?? getMissingFields(activeRecord))];
  const extractionState = input.extractionState ?? getExtractionState(activeRecord);
  const persistenceState = input.persistenceState ?? getPersistenceState(activeRecord);
  const blocker = input.blocker;
  const currentStage = getCurrentStage({ activeRecord, extractionState, blocker, missingFields });
  const currentState = getCurrentState({ activeRecord, extractionState, blocker, missingFields });
  const requiredAction = getRequiredAction({ activeRecord, extractionState, blocker, missingFields });

  return {
    ...(activeRecord ? { activeRecord } : {}),
    currentStage,
    currentState,
    requiredAction,
    optionalActions: getOptionalActions({ activeRecord, extractionState, blocker }),
    missingFields,
    ...(activeRecord?.missionId ? { linkedMission: activeRecord.missionId } : {}),
    extractionState,
    reviewState: activeRecord?.reviewState ?? 'draft',
    promotionEligibility: getPromotionEligibility(activeRecord, extractionState),
    ...(blocker ? { blocker: { ...blocker } } : {}),
    persistenceState,
  };
}

export function beginJournalEntry(): JournalWorkflowSnapshot {
  return buildJournalWorkflowSnapshot({ persistenceState: 'not_saved' });
}

export function saveJournalDraft(record: JournalRecord): JournalWorkflowSnapshot {
  return buildJournalWorkflowSnapshot({ activeRecord: record, persistenceState: 'draft_saved' });
}

export function recordJournalEntry(record: JournalRecord): JournalWorkflowSnapshot {
  return buildJournalWorkflowSnapshot({
    activeRecord: { ...copyJournalRecord(record), reviewState: 'recorded' },
    persistenceState: 'recorded',
  });
}

export function requestJournalClarification(
  snapshot: JournalWorkflowSnapshot,
  missingFields: readonly string[],
): JournalWorkflowSnapshot {
  return buildJournalWorkflowSnapshot({
    activeRecord: snapshot.activeRecord,
    extractionState: snapshot.extractionState,
    persistenceState: snapshot.persistenceState,
    missingFields,
  });
}

export function beginJournalReflection(record: JournalRecord): JournalWorkflowSnapshot {
  return buildJournalWorkflowSnapshot({
    activeRecord: { ...copyJournalRecord(record), reviewState: 'awaiting_reflection' },
    persistenceState: 'recorded',
  });
}

export function completeJournalReflection(record: JournalRecord): JournalWorkflowSnapshot {
  return buildJournalWorkflowSnapshot({
    activeRecord: { ...copyJournalRecord(record), reviewState: 'reflected' },
    extractionState: 'candidate',
    persistenceState: 'recorded',
  });
}

export function buildJournalExtraction(record: JournalRecord, complete: boolean): JournalWorkflowSnapshot {
  return buildJournalWorkflowSnapshot({
    activeRecord: copyJournalRecord(record),
    extractionState: complete ? 'candidate' : 'incomplete',
    persistenceState: 'recorded',
  });
}

export function reviewJournalExtraction(record: JournalRecord): JournalWorkflowSnapshot {
  return buildJournalWorkflowSnapshot({
    activeRecord: { ...copyJournalRecord(record), reviewState: 'reviewed' },
    extractionState: 'reviewed',
    persistenceState: 'recorded',
  });
}

export function approveJournalLesson(record: JournalRecord): JournalWorkflowSnapshot {
  return buildJournalWorkflowSnapshot({
    activeRecord: { ...copyJournalRecord(record), reviewState: 'promoted_to_evidence' },
    extractionState: 'approved',
    persistenceState: 'recorded',
  });
}

export function approveJournalCommitment(record: JournalRecord): JournalWorkflowSnapshot {
  return approveJournalLesson(record);
}

export function proposeJournalDoctrineCandidate(record: JournalRecord): JournalWorkflowSnapshot {
  return buildJournalWorkflowSnapshot({
    activeRecord: { ...copyJournalRecord(record), reviewState: 'reviewed' },
    extractionState: 'reviewed',
    persistenceState: 'recorded',
  });
}

export function proposeJournalGrowthEvidence(record: JournalRecord): JournalWorkflowSnapshot {
  return proposeJournalDoctrineCandidate(record);
}

export function archiveJournalWorkflowRecord(record: JournalRecord, now: string): JournalWorkflowSnapshot {
  return buildJournalWorkflowSnapshot({
    activeRecord: archiveJournalRecord(record, { now }),
    extractionState: 'reviewed',
    persistenceState: 'archived',
  });
}

export function returnJournalForRevision(record: JournalRecord, missingFields: readonly string[]): JournalWorkflowSnapshot {
  return buildJournalWorkflowSnapshot({
    activeRecord: { ...copyJournalRecord(record), reviewState: 'awaiting_reflection' },
    missingFields,
    extractionState: 'incomplete',
    persistenceState: 'recorded',
  });
}

function getMissingFields(record: JournalRecord | undefined): readonly string[] {
  if (!record) return ['record'];
  const missing: string[] = [];
  if (record.rawContent.trim().length < 8) missing.push('rawContent');
  if (record.recordType === 'recovery_reflection' && record.evidenceReferences.length === 0) {
    missing.push('recoveryEvidence');
  }
  return missing;
}

function getExtractionState(record: JournalRecord | undefined): JournalExtractionState {
  if (!record?.knowledgeExtraction) return 'none';
  if (record.knowledgeExtraction.evidenceReferences.length === 0) return 'incomplete';
  return record.reviewState === 'reviewed' || record.reviewState === 'promoted_to_evidence' ? 'reviewed' : 'candidate';
}

function getPersistenceState(record: JournalRecord | undefined): JournalPersistenceState {
  if (!record) return 'not_saved';
  if (record.archiveState === 'archived') return 'archived';
  if (record.reviewState === 'draft') return 'draft_saved';
  return 'recorded';
}

function getCurrentStage(input: {
  readonly activeRecord: JournalRecord | undefined;
  readonly extractionState: JournalExtractionState;
  readonly blocker: JournalWorkflowBlocker | undefined;
  readonly missingFields: readonly string[];
}): JournalWorkflowStage {
  if (!input.activeRecord) return 'capture';
  if (input.blocker) return 'reflect';
  if (input.activeRecord.archiveState === 'archived') return 'archive';
  if (input.missingFields.length > 0) return 'clarify';
  if (input.activeRecord.reviewState === 'awaiting_reflection') return 'reflect';
  if (input.extractionState === 'candidate' || input.extractionState === 'incomplete') return 'extract';
  if (input.activeRecord.reviewState === 'reviewed') return 'promote';
  if (input.activeRecord.reviewState === 'reflected') return 'review';
  return 'capture';
}

function getCurrentState(input: {
  readonly activeRecord: JournalRecord | undefined;
  readonly extractionState: JournalExtractionState;
  readonly blocker: JournalWorkflowBlocker | undefined;
  readonly missingFields: readonly string[];
}): JournalWorkflowState {
  if (input.blocker) return 'blocked';
  if (!input.activeRecord) return 'idle';
  if (input.activeRecord.archiveState === 'archived') return 'archived';
  if (input.missingFields.length > 0) return 'clarification_required';
  if (input.activeRecord.reviewState === 'awaiting_reflection') return 'reflection_required';
  if (input.extractionState === 'candidate' || input.extractionState === 'incomplete') return 'extraction_available';
  if (input.activeRecord.reviewState === 'reflected') return 'awaiting_review';
  if (input.activeRecord.reviewState === 'reviewed') return 'ready_for_promotion';
  if (input.activeRecord.reviewState === 'promoted_to_evidence') return 'promoted';
  return 'capturing';
}

function getRequiredAction(input: {
  readonly activeRecord: JournalRecord | undefined;
  readonly extractionState: JournalExtractionState;
  readonly blocker: JournalWorkflowBlocker | undefined;
  readonly missingFields: readonly string[];
}): JournalWorkflowAction {
  if (input.blocker) return input.blocker.requiredAction;
  if (!input.activeRecord) return 'beginEntry';
  if (input.activeRecord.archiveState === 'archived') return 'archiveRecord';
  if (input.missingFields.length > 0) return 'requestClarification';
  if (input.activeRecord.reviewState === 'awaiting_reflection') return 'beginReflection';
  if (input.extractionState === 'candidate' || input.extractionState === 'incomplete') return 'reviewExtraction';
  if (input.activeRecord.reviewState === 'reflected') return 'reviewExtraction';
  if (isJournalPromotable(input.activeRecord)) return 'approveLesson';
  return 'recordEntry';
}

function getOptionalActions(input: {
  readonly activeRecord: JournalRecord | undefined;
  readonly extractionState: JournalExtractionState;
  readonly blocker: JournalWorkflowBlocker | undefined;
}): readonly JournalWorkflowAction[] {
  if (!input.activeRecord || input.blocker) return [];
  if (input.activeRecord.archiveState === 'archived') return [];
  const actions: JournalWorkflowAction[] = ['saveDraft'];
  if (input.activeRecord.reviewState === 'recorded') actions.push('beginReflection');
  if (input.extractionState === 'candidate') actions.push('approveCommitment', 'proposeDoctrineCandidate', 'proposeGrowthEvidence');
  actions.push('archiveRecord', 'returnForRevision');
  return [...new Set(actions)];
}

function getPromotionEligibility(
  record: JournalRecord | undefined,
  extractionState: JournalExtractionState,
): JournalPromotionEligibility {
  if (!record) return 'not_eligible';
  if (record.reviewState === 'promoted_to_evidence') return 'promoted';
  if (record.reviewState === 'awaiting_reflection') return 'reflection_required';
  if (extractionState === 'candidate' || extractionState === 'incomplete' || record.reviewState === 'reflected') {
    return 'review_required';
  }
  if (isJournalPromotable(record)) return 'eligible';
  return 'not_eligible';
}
